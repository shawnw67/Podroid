/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */
//! P2G's optional wider 3D viewport with its original 16:9 UI canvas. It also
//! works for Monster Hunter Freedom Unite, P2G's Western release, which uses
//! the same engine.
//! The guest keeps its original screen, renderbuffer dimensions and input
//! coordinates. Only the host main render target and perspective viewport grow.

use super::{eagl, gles_guest::with_ctx_and_mem};
use crate::gles::gles11_raw as gl;
use crate::{
    mem::{ConstPtr, Mem},
    objc::id,
    Environment,
};
use std::collections::HashMap;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Size {
    pub guest: (i32, i32),
    pub actual: (i32, i32),
}
impl Size {
    fn viewport(self, requested: [i32; 4], world: bool) -> [i32; 4] {
        if world && requested == [0, 0, self.guest.0, self.guest.1] {
            [0, 0, self.actual.0, self.actual.1]
        } else {
            [
                requested[0] + (self.actual.0 - self.guest.0) / 2,
                requested[1],
                requested[2],
                requested[3],
            ]
        }
    }
}
#[derive(Default)]
struct Context {
    program: u32,
    framebuffer: u32,
    renderbuffer: u32,
    viewport: Option<[i32; 4]>,
    scissor: Option<[i32; 4]>,
}
#[derive(Default)]
pub struct State {
    contexts: HashMap<id, Context>,
    buffers: HashMap<(usize, u32), Size>,
    frames: HashMap<(usize, u32), Size>,
    // Uniform locations and program names belong to a GL sharegroup.
    projection: HashMap<(usize, u32), i32>,
}
fn key(env: &mut Environment) -> Option<(id, usize)> {
    if !env.options.p2g_wide_screen {
        return None;
    }
    let ctx = (*env
        .framework_state
        .opengles
        .current_ctx_for_thread(env.current_thread))?;
    Some((
        ctx,
        eagl::sharegroup_key(env.objc.borrow::<eagl::EAGLContextHostObject>(ctx)),
    ))
}
fn size(env: &mut Environment) -> Option<(id, Size, bool)> {
    let (ctx, share) = key(env)?;
    let s = &mut env.framework_state.opengles.p2g_wide;
    let c = s.contexts.entry(ctx).or_default();
    Some((
        ctx,
        *s.frames.get(&(share, c.framebuffer))?,
        s.projection.contains_key(&(share, c.program)),
    ))
}
/// Whether the app is one this supports (see [validate] for its versions).
pub fn supports(bundle_id: &str) -> bool {
    matches!(bundle_id, "jp.co.capcom.mhp2gjp" | "jp.co.capcom.mhp2gwd")
}

/// Check several independent method entry points in a supported ARMv7
/// binary: `-[hxViewController setup]`,
/// `createFramebuffer:isCreateDepthBuffer:` and `touchesBegan:withEvent:`.
/// No patch or projection interception is enabled for other executables.
pub fn validate(mem: &Mem) -> Result<(), String> {
    // P2G 1.00.02
    const P2G: &[(u32, &[u8])] = &[
        (
            0x386978,
            &[
                240, 181, 3, 175, 77, 248, 4, 141, 132, 176, 4, 70, 66, 242, 116, 0,
            ],
        ),
        (
            0x386e6c,
            &[
                240, 181, 3, 175, 45, 233, 0, 13, 173, 241, 16, 4, 36, 240, 15, 4,
            ],
        ),
        (
            0x3872b0,
            &[
                240, 181, 3, 175, 45, 233, 0, 13, 180, 176, 108, 70, 36, 240, 15, 4,
            ],
        ),
    ];
    // Monster Hunter Freedom Unite 1.00.11
    const MHFU: &[(u32, &[u8])] = &[
        (
            0x38fb64,
            &[
                240, 181, 3, 175, 77, 248, 4, 141, 132, 176, 128, 70, 72, 242, 244, 48,
            ],
        ),
        (
            0x390064,
            &[
                240, 181, 3, 175, 45, 233, 0, 13, 173, 241, 16, 4, 36, 240, 15, 4,
            ],
        ),
        (
            0x3904a8,
            &[
                240, 181, 3, 175, 45, 233, 0, 13, 176, 176, 108, 70, 36, 240, 15, 4,
            ],
        ),
    ];
    let matches = |checks: &[(u32, &[u8])]| {
        checks.iter().all(|&(addr, bytes)| {
            mem.get_bytes_fallible(ConstPtr::from_bits(addr), bytes.len().try_into().unwrap())
                == Some(bytes)
        })
    };
    if matches(P2G) || matches(MHFU) {
        Ok(())
    } else {
        Err("Expanded view requires the supported ARMv7 executable (P2G 1.00.02 or Freedom Unite 1.00.11); disable expanded view for this IPA.".into())
    }
}
/// Expand only landscape screen-sized drawable storage.
/// Other targets stay intact.
pub fn drawable_size(env: &Environment, width: u32, height: u32) -> (u32, u32) {
    let Some(long) = env.options.p2g_wide_width else {
        return (width, height);
    };
    if env.options.p2g_wide_screen && width as u64 * 320 == height as u64 * 568 {
        (width / 568 * long, height)
    } else {
        (width, height)
    }
}
/// P2G uses a depth texture, not just a depth renderbuffer, for its main
/// framebuffer. Both attachments must cover the expanded color target.
/// Shadow maps and uploaded textures keep their original storage.
pub fn depth_texture_size(
    options: &crate::options::Options,
    format: u32,
    width: i32,
    height: i32,
) -> (i32, i32) {
    let scale = options.screen_scale() as i32;
    if options.p2g_wide_screen
        && matches!(format, 0x1902 | 0x84f9)
        && (width, height) == (568 * scale, 320 * scale)
    {
        if let Some(long) = options.p2g_wide_width {
            return (long as i32 * scale, height);
        }
    }
    (width, height)
}
pub fn drawable(env: &mut Environment, buffer: u32, guest: (u32, u32), actual: (u32, u32)) {
    if guest == actual {
        return;
    }
    let Some((ctx, share)) = key(env) else {
        return;
    };
    let s = &mut env.framework_state.opengles.p2g_wide;
    s.contexts.entry(ctx).or_default().renderbuffer = buffer;
    s.buffers.insert(
        (share, buffer),
        Size {
            guest: (guest.0 as i32, guest.1 as i32),
            actual: (actual.0 as i32, actual.1 as i32),
        },
    );
}
pub fn bind_buffer(env: &mut Environment, buffer: u32) {
    if let Some((ctx, _)) = key(env) {
        env.framework_state
            .opengles
            .p2g_wide
            .contexts
            .entry(ctx)
            .or_default()
            .renderbuffer = buffer;
    }
}
pub fn bind_frame(env: &mut Environment, buffer: u32) {
    if let Some((ctx, _)) = key(env) {
        env.framework_state
            .opengles
            .p2g_wide
            .contexts
            .entry(ctx)
            .or_default()
            .framebuffer = buffer;
    }
}
pub fn storage(env: &mut Environment, format: u32, width: i32, height: i32) -> (i32, i32) {
    let Some((ctx, share)) = key(env) else {
        return (width, height);
    };
    // P2G creates a matching depth/stencil renderbuffer after its drawable.
    if !matches!(format, gl::DEPTH_COMPONENT16_OES | 0x81A6 | 0x88F0) {
        return (width, height);
    }
    let s = &mut env.framework_state.opengles.p2g_wide;
    let matching = s.buffers.iter().find_map(|(&(group, _), &dims)| {
        (group == share && dims.guest == (width, height)).then_some(dims)
    });
    if let Some(dims) = matching {
        let rb = s.contexts.entry(ctx).or_default().renderbuffer;
        s.buffers.insert((share, rb), dims);
        dims.actual
    } else {
        (width, height)
    }
}
pub fn attach(env: &mut Environment, attachment: u32, buffer: u32) {
    if attachment != gl::COLOR_ATTACHMENT0_OES {
        return;
    }
    let Some((ctx, share)) = key(env) else {
        return;
    };
    let s = &mut env.framework_state.opengles.p2g_wide;
    let fb = s.contexts.entry(ctx).or_default().framebuffer;
    if let Some(&dims) = s.buffers.get(&(share, buffer)) {
        s.frames.insert((share, fb), dims);
    } else {
        s.frames.remove(&(share, fb));
    }
}
pub fn buffer_parameter(env: &mut Environment, pname: u32) -> Option<i32> {
    let (ctx, share) = key(env)?;
    let s = &mut env.framework_state.opengles.p2g_wide;
    let rb = s.contexts.entry(ctx).or_default().renderbuffer;
    let dims = s.buffers.get(&(share, rb))?;
    match pname {
        gl::RENDERBUFFER_WIDTH_OES => Some(dims.guest.0),
        gl::RENDERBUFFER_HEIGHT_OES => Some(dims.guest.1),
        _ => None,
    }
}
pub fn viewport(env: &mut Environment, rect: [i32; 4], scissor: bool) {
    if let Some((ctx, _)) = key(env) {
        let c = env
            .framework_state
            .opengles
            .p2g_wide
            .contexts
            .entry(ctx)
            .or_default();
        if scissor {
            c.scissor = Some(rect);
        } else {
            c.viewport = Some(rect);
        }
    }
}
pub fn integer(env: &mut Environment, pname: u32) -> Option<[i32; 4]> {
    let (ctx, _) = key(env)?;
    let c = env
        .framework_state
        .opengles
        .p2g_wide
        .contexts
        .entry(ctx)
        .or_default();
    match pname {
        gl::VIEWPORT => c.viewport,
        gl::SCISSOR_BOX => c.scissor,
        _ => None,
    }
}
pub fn use_program(env: &mut Environment, program: u32) {
    if let Some((ctx, _)) = key(env) {
        env.framework_state
            .opengles
            .p2g_wide
            .contexts
            .entry(ctx)
            .or_default()
            .program = program;
    }
}
pub fn uniform(env: &mut Environment, program: u32, name: &[u8], location: i32) {
    if name != b"u_prjMatrix" || location < 0 {
        return;
    }
    if let Some((_, share)) = key(env) {
        env.framework_state
            .opengles
            .p2g_wide
            .projection
            .insert((share, program), location);
    }
}
/// Widen a known perspective projection only, leaving depth and the vertical
/// FOV unchanged. Orthographic menus, bones and offscreen shadow maps
/// are intact.
pub fn projection(env: &mut Environment, location: i32, matrix: &mut [f32; 16]) -> bool {
    let Some((ctx, share)) = key(env) else {
        return false;
    };
    let s = &mut env.framework_state.opengles.p2g_wide;
    let c = s.contexts.entry(ctx).or_default();
    if s.projection.get(&(share, c.program)) != Some(&location) {
        return false;
    }
    let Some(dims) = s.frames.get(&(share, c.framebuffer)).copied() else {
        return false;
    };
    widen_projection(matrix, dims)
}
fn widen_projection(matrix: &mut [f32; 16], dims: Size) -> bool {
    if !matrix.iter().all(|v| v.is_finite())
        || matrix[15] != 0.0
        || matrix[11] != -1.0
        || matrix[0] <= 0.0
        || matrix[5] <= 0.0
        || ![1, 2, 3, 4, 6, 7, 8, 9, 12, 13]
            .iter()
            .all(|&i| matrix[i] == 0.0)
    {
        return false;
    }
    matrix[0] *= dims.guest.0 as f32 / dims.actual.0 as f32;
    true
}
/// Apply the actual host viewport immediately before a guest draw, after any
/// program/framebuffer changes. UI draws keep their original pixel dimensions.
pub fn apply(env: &mut Environment, clear: bool) {
    let Some((ctx, dims, world)) = size(env) else {
        return;
    };
    let c = &env.framework_state.opengles.p2g_wide.contexts[&ctx];
    let view = c.viewport.map(|r| dims.viewport(r, world));
    let scissor = c.scissor.map(|r| dims.viewport(r, world || clear));
    with_ctx_and_mem(env, |gles, _| unsafe {
        if let Some([x, y, w, h]) = view {
            gles.Viewport(x, y, w, h);
        }
        if let Some([x, y, w, h]) = scissor {
            gles.Scissor(x, y, w, h);
        }
    });
}
/// Skip P2G 1.00.02's screen-space white glare in expanded view. The game
/// blends it over the original 16:9 region after drawing the wider scene.
pub fn skip_glare(env: &mut Environment, mode: u32, first: i32, count: i32) -> bool {
    const DRAW_RETURN: u32 = 0x2a1401;
    const DRAW_SITE: &[u8] = &[
        0xe1, 0xf0, 0xed, 0xfd, 0xda, 0xf8, 0x00, 0x20, 0xd5, 0xf8, 0x80, 0x10, 0x92, 0xb2, 0xe1,
        0xf0, 0x82, 0xfc, 0x30, 0xe0,
    ];
    if !env.options.p2g_wide_screen
        || (mode, first, count) != (gl::TRIANGLE_STRIP, 0, 4)
        || env.cpu.regs()[14] != DRAW_RETURN
        || env.bundle.bundle_identifier() != "jp.co.capcom.mhp2gjp"
        || env
            .mem
            .get_bytes_fallible(ConstPtr::from_bits(0x2a13ee), DRAW_SITE.len() as u32)
            != Some(DRAW_SITE)
    {
        return false;
    }
    let Some((ctx, dims, world)) = size(env) else {
        return false;
    };
    let viewport = env.framework_state.opengles.p2g_wide.contexts[&ctx].viewport;
    if world || viewport != Some([0, 0, dims.guest.0, dims.guest.1]) {
        return false;
    }

    // The same draw site also submits HUD geometry. Inspect the actual
    // client arrays, which may differ from the software VAO's shadow.
    let program = env.framework_state.opengles.p2g_wide.contexts[&ctx].program;
    with_ctx_and_mem(env, |gles, mem| unsafe {
        if gles.IsEnabled(gl::BLEND) == 0
            || gles.GetAttribLocation(program, c"a_texCoord".as_ptr()) >= 0
        {
            return false;
        }
        let position = gles.GetAttribLocation(program, c"a_position".as_ptr());
        let color = gles.GetAttribLocation(program, c"a_color".as_ptr());
        let Some(position) = glare_array_pointer(gles, position, gl::SHORT) else {
            return false;
        };
        let Some(color) = glare_array_pointer(gles, color, gl::UNSIGNED_BYTE) else {
            return false;
        };
        if (color as usize).checked_add(4) != Some(position as usize)
            || !mem.is_host_ptr_in_guest_mem(color)
        {
            return false;
        }
        let skip = mem
            .get_bytes_fallible(mem.host_ptr_to_guest_ptr(color), 48)
            .is_some_and(|vertices| is_glare_quad(vertices, dims.guest));
        if skip {
            static LOGGED: std::sync::Once = std::sync::Once::new();
            LOGGED.call_once(|| log!("P2G expanded view: skipping the screen-space glare quad."));
        }
        skip
    })
}

unsafe fn glare_array_pointer(
    gles: &mut dyn crate::gles::GLES,
    location: i32,
    element_type: u32,
) -> Option<*mut std::ffi::c_void> {
    let index = u32::try_from(location).ok()?;
    let mut layout = [0; 5];
    for (value, pname) in layout.iter_mut().zip([
        0x8622, // GL_VERTEX_ATTRIB_ARRAY_ENABLED
        0x8623, // GL_VERTEX_ATTRIB_ARRAY_SIZE
        0x8625, // GL_VERTEX_ATTRIB_ARRAY_TYPE
        0x8624, // GL_VERTEX_ATTRIB_ARRAY_STRIDE
        0x889f, // GL_VERTEX_ATTRIB_ARRAY_BUFFER_BINDING
    ]) {
        gles.GetVertexAttribiv(index, pname, value);
    }
    if layout != [1, 4, element_type as i32, 12, 0] {
        return None;
    }
    let mut pointer = std::ptr::null_mut();
    gles.GetVertexAttribPointerv(
        index,
        0x8645, /* GL_VERTEX_ATTRIB_ARRAY_POINTER */
        &mut pointer,
    );
    Some(pointer)
}

fn is_glare_quad(vertices: &[u8], (width, height): (i32, i32)) -> bool {
    if vertices.len() != 48 || !(1..=64).contains(&vertices[3]) {
        return false;
    }
    let top_alpha = vertices[3];
    let corners = [(0, 0), (width, 0), (0, height), (width, height)];
    vertices
        .chunks_exact(12)
        .zip(corners)
        .zip([top_alpha, top_alpha, 0, 0])
        .all(|((v, (x, y)), alpha)| {
            v[..4] == [255, 255, 255, alpha]
                && i32::from(i16::from_le_bytes([v[4], v[5]])) == x
                && i32::from(i16::from_le_bytes([v[6], v[7]])) == y
                && v[8..] == [0; 4]
        })
}

pub fn delete_program(env: &mut Environment, program: u32) {
    if let Some((_, share)) = key(env) {
        env.framework_state
            .opengles
            .p2g_wide
            .projection
            .remove(&(share, program));
    }
}
pub fn delete_objects(env: &mut Environment, objects: &[u32], buffers: bool) {
    if let Some((_, share)) = key(env) {
        let s = &mut env.framework_state.opengles.p2g_wide;
        for &object in objects {
            if buffers {
                s.buffers.remove(&(share, object));
            } else {
                s.frames.remove(&(share, object));
            }
        }
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn ui_keeps_size_and_world_gains_sides() {
        let d = Size {
            guest: (1136, 640),
            actual: (1388, 640),
        };
        assert_eq!(d.viewport([0, 0, 1136, 640], false), [126, 0, 1136, 640]);
        assert_eq!(d.viewport([0, 0, 1136, 640], true), [0, 0, 1388, 640]);
        assert_eq!(d.viewport([20, 30, 100, 50], false), [146, 30, 100, 50]);
    }
    #[test]
    fn perspective_gains_horizontal_fov_without_losing_vertical_content() {
        let dims = Size {
            guest: (1136, 640),
            actual: (1388, 640),
        };
        let mut m = [0.0; 16];
        m[0] = 1.0892029;
        m[5] = 1.9333191;
        m[10] = -1.0;
        m[11] = -1.0;
        m[14] = -60.0;
        let before = m;
        assert!(widen_projection(&mut m, dims));
        assert!(m[0] < before[0]);
        assert_eq!(&m[1..], &before[1..]);
        assert!((m[5] / m[0] - 1388.0 / 640.0).abs() < 0.001);
        let mut ortho = [0.0; 16];
        ortho[0] = 0.01;
        ortho[5] = -0.02;
        ortho[15] = 1.0;
        let original = ortho;
        assert!(!widen_projection(&mut ortho, dims));
        assert_eq!(ortho, original);
    }
    #[test]
    fn glare_filter_preserves_hud_and_full_screen_fades() {
        let dims = (1136, 640);
        let mut quad = [
            255, 255, 255, 29, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 29, 112, 4, 0, 0, 0, 0, 0, 0,
            255, 255, 255, 0, 0, 0, 128, 2, 0, 0, 0, 0, 255, 255, 255, 0, 112, 4, 128, 2, 0, 0, 0,
            0,
        ];
        assert!(is_glare_quad(&quad, dims));
        assert!(!is_glare_quad(&quad, (568, 320)));
        quad[27] = 29;
        quad[39] = 29;
        assert!(!is_glare_quad(&quad, dims));
    }

    #[test]
    fn depth_texture_matches_color_without_expanding_shadow_or_image_textures() {
        let o = crate::options::Options {
            p2g_wide_screen: true,
            p2g_wide_width: Some(694),
            retina: true,
            ..Default::default()
        };
        assert_eq!(depth_texture_size(&o, 0x1902, 1136, 640), (1388, 640));
        assert_eq!(depth_texture_size(&o, 0x1902, 512, 512), (512, 512));
        assert_eq!(depth_texture_size(&o, gl::RGBA, 1136, 640), (1136, 640));
        let off = crate::options::Options {
            p2g_wide_screen: false,
            ..o
        };
        assert_eq!(depth_texture_size(&off, 0x1902, 1136, 640), (1136, 640));
    }
}
