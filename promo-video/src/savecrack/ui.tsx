// Building blocks of the save-crack video. Everything on screen is drawn
// here: no footage or screenshots.

import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { fonts } from "../theme";

export const c = {
  bg: "#070B14",
  panel: "rgba(16, 24, 40, 0.92)",
  panelEdge: "rgba(120, 150, 210, 0.28)",
  text: "#EEF2F8",
  muted: "#8A96AD",
  dim: "rgba(150, 170, 210, 0.22)",
  green: "#7EE07A",
  amber: "#FFC857",
  red: "#FF5C6C",
  blue: "#5AA9FF",
  violet: "#B48CFF",
};

export const ease = Easing.bezier(0.22, 1, 0.36, 1);

/** Seconds since the start of the enclosing sequence. */
export const useSec = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return frame / fps;
};

/** 0 before `from`, 1 after `from + duration` (seconds), eased. A `from` of
 * Infinity (never) stays 0. */
export const ramp = (t: number, from: number, duration: number) =>
  !Number.isFinite(from) ? 0 : interpolate(t, [from, from + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

/** A springy 0 → 1 starting at `from` seconds. */
export const usePop = (from: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - from * fps, fps, config: { damping: 14, mass: 0.7 } });
};

export const Background: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 70% 60% at 50% 40%, rgba(40, 70, 140, 0.35) 0%, transparent 70%), ${c.bg}`,
    }}
  >
    <AbsoluteFill
      style={{
        backgroundImage:
          "linear-gradient(rgba(120,150,210,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(120,150,210,0.06) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
        maskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, black 30%, transparent 100%)",
      }}
    />
  </AbsoluteFill>
);

/** A headline at the top of the frame. */
export const Headline: React.FC<{ text: string; from?: number; until?: number }> = ({
  text,
  from = 0,
  until = Infinity,
}) => {
  const t = useSec();
  const show = ramp(t, from, 0.5) * (1 - ramp(t, until, 0.4));
  return (
    <div
      style={{
        position: "absolute",
        top: 88,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: fonts.sans,
        fontSize: 76,
        fontWeight: 600,
        color: c.text,
        opacity: show,
        translate: `0px ${(1 - show) * 24}px`,
        letterSpacing: 2,
      }}
    >
      {text}
    </div>
  );
};

/** A line of explanation at the bottom of the frame. */
export const Caption: React.FC<{ text: string; from: number; until?: number; color?: string }> = ({
  text,
  from,
  until = Infinity,
  color = c.text,
}) => {
  const t = useSec();
  const show = ramp(t, from, 0.4) * (1 - ramp(t, until, 0.3));
  return (
    <div
      style={{
        position: "absolute",
        bottom: 96,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily: fonts.sans,
        fontSize: 52,
        fontWeight: 500,
        color,
        opacity: show,
        textShadow: "0 4px 24px rgba(0,0,0,0.8)",
      }}
    >
      {text}
    </div>
  );
};

export const Panel: React.FC<{
  style?: React.CSSProperties;
  title?: string;
  children: React.ReactNode;
}> = ({ style, title, children }) => (
  <div
    style={{
      position: "absolute",
      background: c.panel,
      border: `2px solid ${c.panelEdge}`,
      borderRadius: 22,
      boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
      overflow: "hidden",
      ...style,
    }}
  >
    {title !== undefined && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 24px",
          borderBottom: `1px solid ${c.panelEdge}`,
          fontFamily: fonts.mono,
          fontSize: 26,
          color: c.muted,
        }}
      >
        {[c.red, c.amber, c.green].map((color) => (
          <div key={color} style={{ width: 16, height: 16, borderRadius: 8, background: color }} />
        ))}
        <span style={{ marginLeft: 12 }}>{title}</span>
      </div>
    )}
    {children}
  </div>
);

/** Text that appears one character at a time from `from`, at `cps` chars/s. */
export const Typed: React.FC<{ text: string; from: number; cps?: number; cursor?: boolean }> = ({
  text,
  from,
  cps = 28,
  cursor = true,
}) => {
  const t = useSec();
  const shown = Math.max(0, Math.min(text.length, Math.floor((t - from) * cps)));
  const typing = t >= from && shown < text.length;
  return (
    <span>
      {text.slice(0, shown)}
      {cursor && (typing || (t >= from && Math.floor(t * 2) % 2 === 0)) && (
        <span style={{ color: c.green }}>▋</span>
      )}
    </span>
  );
};

/** A tick that pops in at `from`. */
export const Check: React.FC<{ from: number; size?: number }> = ({ from, size = 56 }) => {
  const pop = usePop(from);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: c.green,
        color: "#0B1A0A",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.62,
        fontWeight: 700,
        fontFamily: fonts.latin,
        scale: `${pop}`,
        opacity: pop > 0.01 ? 1 : 0,
      }}
    >
      ✓
    </div>
  );
};

/** A label with a coloured background, for annotating code or bytes. */
export const Chip: React.FC<{ text: string; color: string; from: number; style?: React.CSSProperties }> = ({
  text,
  color,
  from,
  style,
}) => {
  const pop = usePop(from);
  return (
    <div
      style={{
        display: "inline-block",
        padding: "8px 20px",
        borderRadius: 12,
        background: color,
        color: "#0A0F1A",
        fontFamily: fonts.sans,
        fontSize: 34,
        fontWeight: 600,
        whiteSpace: "nowrap",
        opacity: pop > 0.01 ? 1 : 0,
        scale: `${0.6 + 0.4 * pop}`,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/** A counter rolling from `from` to `to` between `start` and `start + duration`. */
export const Counter: React.FC<{
  from: number;
  to: number;
  start: number;
  duration: number;
  format?: (n: number) => string;
}> = ({ from, to, start, duration, format = (n) => n.toLocaleString("en-US") }) => {
  const t = useSec();
  const value = Math.round(from + (to - from) * ramp(t, start, duration));
  return <span>{format(value)}</span>;
};
