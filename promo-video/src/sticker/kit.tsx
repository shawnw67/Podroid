// Sticker-style explainer kit: paper background, thick ink outlines, hard
// offset shadows, stamp-in entrances and a slight hand-drawn "boil".
// Everything is placed on one wide canvas that a camera pushes across.

import React, { createContext } from "react";
import { loadFont as loadHuangYou } from "@remotion/google-fonts/ZCOOLQingKeHuangYou";
import { loadFont as loadKuaiLe } from "@remotion/google-fonts/ZCOOLKuaiLe";
import { loadFont as loadLilita } from "@remotion/google-fonts/LilitaOne";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { AbsoluteFill, Easing, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";

const huangYou = loadHuangYou("normal", { ignoreTooManyRequestsWarning: true });
const kuaiLe = loadKuaiLe("normal", { ignoreTooManyRequestsWarning: true });
const lilita = loadLilita("normal", { weights: ["400"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["700"], subsets: ["latin"] });

export const font = {
  title: `${huangYou.fontFamily}, ${kuaiLe.fontFamily}, sans-serif`,
  body: `${kuaiLe.fontFamily}, sans-serif`,
  number: `${lilita.fontFamily}, ${huangYou.fontFamily}, sans-serif`,
  mono: `${mono.fontFamily}, Menlo, monospace`,
};

export const ink = "#161616";
export const paper = "#F6EFDF";
export const col = {
  yellow: "#FFD23F",
  red: "#FF5A5F",
  blue: "#4D96FF",
  mint: "#3DDC97",
  pink: "#FF8FC7",
  purple: "#A27BFF",
  orange: "#FF9F43",
  cream: "#FFF8E8",
  white: "#FFFFFF",
};

export const OUTLINE = 6;
export const SHADOW = `10px 10px 0 ${ink}`;

// --- Time ------------------------------------------------------------------------

export const useSec = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

export const ramp = (t: number, from: number, duration: number, easing = Easing.bezier(0.33, 1, 0.68, 1)) =>
  interpolate(t, [from, from + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

/** Hand-drawn jitter: a small value that changes every 4 frames. */
export const useBoil = (seed: string, amount = 1) => {
  const frame = useCurrentFrame();
  const step = Math.floor(frame / 4);
  return (random(`${seed}-${step}`) - 0.5) * 2 * amount;
};

/** Slapped on like a stamp at `at`: oversized and tilted, then lands. */
export const useStamp = (at: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - at * fps, fps, config: { damping: 11, stiffness: 180, mass: 0.6 } });
  return {
    visible: frame >= at * fps,
    scale: interpolate(s, [0, 1], [1.7, 1]),
    rotate: interpolate(s, [0, 1], [-14, 0]),
    opacity: interpolate(s, [0, 0.15], [0, 1], { extrapolateRight: "clamp" }),
  };
};

// --- Camera ------------------------------------------------------------------------

export type Shot = { at: number; x: number; y: number; zoom: number };

const CameraShake = createContext(0);

/** A wide canvas viewed by a camera that eases between shots: the camera is
 * centred on (x, y) at `zoom`. `shakes` are times of a short jolt. */
export const Canvas: React.FC<{ shots: Shot[]; shakes?: number[]; width: number; children: React.ReactNode }> = ({
  shots,
  shakes = [],
  width,
  children,
}) => {
  const t = useSec();
  let i = 0;
  while (i < shots.length - 1 && t >= shots[i + 1].at) i++;
  const a = shots[i];
  const b = shots[Math.min(i + 1, shots.length - 1)];
  // Each shot holds, then the move to the next takes the last part of it.
  const move = Math.min(1.8, (b.at - a.at) * 0.85);
  const p = b === a ? 0 : ramp(t, b.at - move, move, Easing.inOut(Easing.cubic));
  const x = a.x + (b.x - a.x) * p;
  const y = a.y + (b.y - a.y) * p;
  const zoom = a.zoom + (b.zoom - a.zoom) * p;
  let shake = 0;
  for (const s of shakes) {
    const d = t - s;
    if (d >= 0 && d < 0.35) shake = Math.sin(d * 90) * 18 * (1 - d / 0.35);
  }
  return (
    <AbsoluteFill
      style={{
        background: paper,
        overflow: "hidden",
        translate: "-1px 0px"
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height: 1080,
          transformOrigin: "0 0",
          translate: `${960 - x * zoom + shake}px ${540 - y * zoom + shake * 0.4}px`,
          scale: `${zoom}`,
        }}
      >
        <PaperTexture width={width} />
        <CameraShake.Provider value={shake}>{children}</CameraShake.Provider>
      </div>
    </AbsoluteFill>
  );
};

const PaperTexture: React.FC<{ width: number }> = ({ width }) => (
  <div
    style={{
      position: "absolute",
      left: -1200,
      top: -1200,
      width: width + 2400,
      height: 1080 + 2400,
      background: paper,
      backgroundImage: `radial-gradient(${ink}22 2.4px, transparent 2.6px)`,
      backgroundSize: "44px 44px",
    }}
  />
);

// --- Stickers ------------------------------------------------------------------------

/** Positions a sticker at world (x, y) (its centre), stamped in at `at`. */
export const Place: React.FC<{
  x: number;
  y: number;
  at: number;
  tilt?: number;
  seed?: string;
  until?: number;
  children: React.ReactNode;
}> = ({ x, y, at, tilt = 0, seed = `${x},${y}`, until = Infinity, children }) => {
  const t = useSec();
  const stamp = useStamp(at);
  const boil = useBoil(seed, 0.6);
  const gone = Number.isFinite(until) ? ramp(t, until, 0.3) : 0;
  if (!stamp.visible) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: "max-content",
        translate: "-50% -50%",
        scale: `${stamp.scale * (1 - gone)}`,
        rotate: `${tilt + stamp.rotate + boil}deg`,
        opacity: stamp.opacity * (1 - gone),
      }}
    >
      {children}
    </div>
  );
};

/** A flat sticker card: thick ink outline and a hard shadow. */
export const Card: React.FC<{
  color?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ color = col.white, style, children }) => (
  <div
    style={{
      background: color,
      border: `${OUTLINE}px solid ${ink}`,
      borderRadius: 24,
      boxShadow: SHADOW,
      padding: "18px 30px",
      fontFamily: font.body,
      color: ink,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Outlined, shadowed display text. */
export const Big: React.FC<{ size: number; color?: string; family?: string; style?: React.CSSProperties; children: React.ReactNode }> = ({
  size,
  color = col.yellow,
  family = font.title,
  style,
  children,
}) => (
  <div
    style={{
      fontFamily: family,
      fontSize: size,
      lineHeight: 1.05,
      color,
      WebkitTextStroke: `${Math.max(4, size / 18)}px ${ink}`,
      paintOrder: "stroke fill",
      textShadow: `${size / 16}px ${size / 16}px 0 ${ink}`,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </div>
);

/** A round numbered badge. */
export const Badge: React.FC<{ n: number | string; color?: string; size?: number }> = ({ n, color = col.yellow, size = 76 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size,
      background: color,
      border: `${OUTLINE}px solid ${ink}`,
      boxShadow: `5px 5px 0 ${ink}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: font.number,
      fontSize: size * 0.55,
      color: ink,
    }}
  >
    {n}
  </div>
);

/** A little tilted tag, like masking tape with writing on it. */
export const Tag: React.FC<{ text: string; color?: string; size?: number }> = ({ text, color = col.white, size = 34 }) => (
  <div
    style={{
      display: "inline-block",
      padding: "6px 18px",
      background: color,
      border: `4px solid ${ink}`,
      borderRadius: 10,
      boxShadow: `5px 5px 0 ${ink}`,
      fontFamily: font.body,
      fontSize: size,
      color: ink,
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

/** A thick hand-drawn arrow along a quadratic curve, drawn in from `at`. */
export const Arrow: React.FC<{
  from: [number, number];
  to: [number, number];
  bend?: number;
  at: number;
  color?: string;
}> = ({ from, to, bend = 0, at, color = ink }) => {
  const t = useSec();
  const draw = ramp(t, at, 0.5);
  if (draw <= 0) return null;
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend;
  const my = (y1 + y2) / 2 + (x2 - x1) * bend;
  // Rough length, for the dash animation.
  const len = Math.hypot(mx - x1, my - y1) + Math.hypot(x2 - mx, y2 - my);
  const angle = Math.atan2(y2 - my, x2 - mx);
  const head = 26;
  const minX = Math.min(x1, x2, mx) - 60;
  const minY = Math.min(y1, y2, my) - 60;
  const w = Math.max(x1, x2, mx) - minX + 60;
  const h = Math.max(y1, y2, my) - minY + 60;
  return (
    <svg
      width={w}
      height={h}
      style={{ position: "absolute", left: minX, top: minY, overflow: "visible" }}
      viewBox={`${minX} ${minY} ${w} ${h}`}
    >
      <path
        d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
        fill="none"
        stroke={color}
        strokeWidth={9}
        strokeLinecap="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - draw)}
      />
      {draw > 0.95 && (
        <path
          d={`M ${x2} ${y2} L ${x2 - head * Math.cos(angle - 0.5)} ${y2 - head * Math.sin(angle - 0.5)} M ${x2} ${y2} L ${
            x2 - head * Math.cos(angle + 0.5)
          } ${y2 - head * Math.sin(angle + 0.5)}`}
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

/** A number that counts up between `at` and `at + duration`. */
export const CountUp: React.FC<{ to: number; at: number; duration?: number; from?: number }> = ({
  to,
  at,
  duration = 0.8,
  from = 0,
}) => {
  const t = useSec();
  const v = Math.round(from + (to - from) * ramp(t, at, duration));
  return <>{v.toLocaleString("en-US")}</>;
};
