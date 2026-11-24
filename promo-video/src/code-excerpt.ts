// Verbatim excerpt of src/frameworks/game_controller.rs (lines 392–400 and
// 414–424 at the commit this video was made from). UFtouchHLE source is MPL-2.0.
// Regenerate with scripts/extract-code.sh after the file changes.
export const codeExcerpt = String.raw`
@implementation GCController: NSObject
+ (id)controllers {
    activate(env);
    let controllers = env.framework_state.game_controller.controllers.iter().map(|&(_, c)| c).collect();
    let controllers: Vec<_> = controllers;
    for &controller in &controllers { retain(env, controller); }
    let array = ns_array::from_vec(env, controllers);
    autorelease(env, array)
}
    // …
- (id)vendorName {
    let name = env.objc.borrow::<Controller>(this).name.clone();
    let string = ns_string::from_rust_string(env, name);
    autorelease(env, string)
}
- (bool)isAttached { env.objc.borrow::<Controller>(this).attached }
- (bool)isAttachedToDevice { false }
- (NSInteger)playerIndex { env.objc.borrow::<Controller>(this).player_index }
- (())setPlayerIndex:(NSInteger)index { env.objc.borrow_mut::<Controller>(this).player_index = index; }
- (id)gamepad { env.objc.borrow::<Controller>(this).profiles[0] }
- (id)extendedGamepad { env.objc.borrow::<Controller>(this).profiles[1] }
`;
