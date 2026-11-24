import React, { createContext, useContext } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { CROSSFADE, FPS, Media } from "./config";
import { colors, ease, fonts, sizes } from "./theme";

export const sec = (s: number) => Math.round(s * FPS);

// Scene time, in seconds, at local frame 0. Scenes are mounted a little
// before they start (for the crossfade), so this is usually negative; all
// timings inside a scene are measured from the scene's nominal start.
const ClockOffset = createContext(0);

export const useT = () => useCurrentFrame() / FPS + useContext(ClockOffset);

// Mounts children from scene time `from`, keeping scene time intact inside.
export const At: React.FC<{ from: number; until?: number; children: React.ReactNode }> = ({
  from,
  until,
  children,
}) => {
  const offset = useContext(ClockOffset);
  return (
    <Sequence
      from={sec(from - offset)}
      durationInFrames={until === undefined ? undefined : sec(until - from)}
      layout="none"
    >
      <ClockOffset.Provider value={from}>{children}</ClockOffset.Provider>
    </Sequence>
  );
};

// Seconds-based ramp: 0 before `from`, 1 after `from + duration`.
export const useRamp = (from: number, duration: number) =>
  interpolate(useT(), [from, from + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

export const Background: React.FC<{ glow?: number }> = ({ glow = 0.18 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 70% 60% at 50% 42%, rgba(60, 90, 150, ${glow}) 0%, transparent 70%),
        linear-gradient(180deg, ${colors.bgTop} 0%, ${colors.bgBottom} 100%)`,
    }}
  >
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
      }}
    />
  </AbsoluteFill>
);

// A scene placed on the absolute timeline. It is mounted fadeIn/2 before
// `start` and kept fadeOut/2 after `end`, fading across the boundaries, so
// neighbouring scenes overlap by exactly one crossfade.
export const Scene: React.FC<{
  start: number;
  end: number;
  fadeIn?: number;
  fadeOut?: number;
  children: React.ReactNode;
  name?: string;
}> = ({ start, end, fadeIn = CROSSFADE, fadeOut = CROSSFADE, children, name }) => {
  const lead = Math.min(start, fadeIn / 2);
  const from = start - lead;
  const to = end + fadeOut / 2;
  return (
    <Sequence from={sec(from)} durationInFrames={sec(to - from)} name={name}>
      <ClockOffset.Provider value={-lead}>
        <SceneFade fadeIn={lead > 0 ? lead * 2 : fadeIn} fadeOut={fadeOut} length={to - from}>
          {children}
        </SceneFade>
      </ClockOffset.Provider>
    </Sequence>
  );
};

const SceneFade: React.FC<{
  fadeIn: number;
  fadeOut: number;
  length: number;
  children: React.ReactNode;
}> = ({ fadeIn, fadeOut, length, children }) => {
  const t = useCurrentFrame() / FPS;
  const opts = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease } as const;
  const opacity = Math.min(
    interpolate(t, [0, fadeIn], [0, 1], opts),
    interpolate(t, [length - fadeOut, length], [1, 0], opts),
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// Text that fades and rises in at `inAt`, holds, and fades out at `outAt`.
// It is fully visible for outAt - inAt - IN_DURATION seconds.
export const IN_DURATION = 0.7;
export const OUT_DURATION = 0.6;

export const Caption: React.FC<{
  inAt: number;
  outAt?: number;
  rise?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ inAt, outAt, rise = 18, style, children }) => {
  const t = useT();
  const opts = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease } as const;
  const appear = interpolate(t, [inAt, inAt + IN_DURATION], [0, 1], opts);
  const vanish = outAt === undefined ? 0 : interpolate(t, [outAt, outAt + OUT_DURATION], [0, 1], opts);
  return (
    <div
      style={{
        fontFamily: fonts.sans,
        color: colors.text,
        letterSpacing: "0.04em",
        opacity: appear * (1 - vanish),
        transform: `translateY(${(1 - appear) * rise}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Footage in a frame. At scene time `anchor` the clip is at its `trimBefore`.
// `null` media renders a clearly labelled placeholder, so previews never pass
// anything off as real footage.
export const MediaView: React.FC<{
  media: Media | null;
  placeholder?: string;
  style?: React.CSSProperties;
  anchor?: number;
  // Slow push-in from zoom[0] to zoom[1] over zoomSeconds after `anchor`.
  zoom?: [number, number];
  zoomSeconds?: number;
}> = ({ media, placeholder, style, anchor = 0, zoom = [1, 1], zoomSeconds = 10 }) => {
  const t = useT();
  const offset = useContext(ClockOffset);
  const scale = interpolate(t, [anchor, anchor + zoomSeconds], zoom, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fill: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: media?.fit ?? "cover",
    transform: `scale(${scale})`,
  };
  return (
    <div style={{ position: "relative", overflow: "hidden", background: "#000", ...style }}>
      {media === null ? (
        <Placeholder label={placeholder ?? "待替换素材"} />
      ) : media.kind === "image" ? (
        <Img src={staticFile(media.src)} style={fill} />
      ) : (
        <OffthreadVideo
          src={staticFile(media.src)}
          trimBefore={Math.max(0, sec((media.trimBefore ?? 0) + offset - anchor))}
          playbackRate={media.playbackRate ?? 1}
          muted
          style={fill}
        />
      )}
    </div>
  );
};

const Placeholder: React.FC<{ label: string }> = ({ label }) => (
  <AbsoluteFill
    style={{
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 16,
      background: "repeating-linear-gradient(135deg, #10141C 0 24px, #131824 24px 48px)",
      border: "3px dashed rgba(242,244,248,0.25)",
      fontFamily: fonts.sans,
      color: colors.muted,
      textAlign: "center",
      padding: 40,
    }}
  >
    <div style={{ fontSize: sizes.small, color: colors.accent, letterSpacing: "0.1em" }}>待替换素材</div>
    <div style={{ fontSize: 40 }}>{label}</div>
  </AbsoluteFill>
);

// A modern Android phone, drawn in code. `screen` is the display's aspect
// ratio (width / height); the body follows it, so the same component draws a
// landscape or a portrait phone.
export const AndroidPhone: React.FC<{
  width?: number;
  height?: number;
  screen: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, height, screen, children, style }) => {
  const landscape = screen > 1;
  const short = landscape
    ? (width ?? (height ?? 0) * screen) / screen
    : (width ?? (height ?? 0) * screen);
  const bezel = short * 0.026;
  const screenW = landscape ? short * screen : short;
  const screenH = landscape ? short : short / screen;
  const radius = short * 0.11;
  return (
    <div
      style={{
        width: screenW + bezel * 2,
        height: screenH + bezel * 2,
        borderRadius: radius + bezel,
        background: `linear-gradient(160deg, #2A2F3A 0%, ${colors.device} 40%, #0E1015 100%)`,
        boxShadow: `0 0 0 2px ${colors.deviceEdge}, 0 40px 120px rgba(0,0,0,0.6)`,
        padding: bezel,
        position: "relative",
        ...style,
      }}
    >
      <div
        style={{
          width: screenW,
          height: screenH,
          borderRadius: radius,
          overflow: "hidden",
          position: "relative",
          background: "#000",
        }}
      >
        {children}
      </div>
    </div>
  );
};

// An early iPhone held in landscape (home button on the right), drawn in code
// as a neutral silhouette: no logos or trademarked artwork.
export const ClassicPhone: React.FC<{
  width: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ width, children, style }) => {
  const height = width * 0.52;
  const screenW = width * 0.66;
  const screenH = screenW / 1.5;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: height * 0.2,
        background: "linear-gradient(170deg, #2B2E35 0%, #0B0C10 55%, #16181D 100%)",
        boxShadow: "0 0 0 3px #555B66, 0 0 0 5px #23262C, 0 50px 140px rgba(0,0,0,0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        ...style,
      }}
    >
      <div style={{ width: screenW, height: screenH, overflow: "hidden", position: "relative" }}>
        {children}
        <AbsoluteFill
          style={{ background: "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, transparent 38%)" }}
        />
      </div>
      {/* Home button. */}
      <div
        style={{
          position: "absolute",
          right: (width - screenW) / 4 - height * 0.06,
          top: "50%",
          width: height * 0.12,
          height: height * 0.12,
          marginTop: -height * 0.06,
          borderRadius: "50%",
          border: "2px solid #3A3E46",
          background: "radial-gradient(circle, #121318 60%, #1B1D23 100%)",
        }}
      />
      {/* Earpiece. */}
      <div
        style={{
          position: "absolute",
          left: (width - screenW) / 4 - height * 0.01,
          top: "50%",
          width: height * 0.02,
          height: height * 0.16,
          marginTop: -height * 0.08,
          borderRadius: height * 0.01,
          background: "#24272E",
        }}
      />
    </div>
  );
};
