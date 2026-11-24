// The playful parts of the save-crack video: the background, the mascot and
// little effects. All drawn with SVG and CSS, driven by the frame.

import React from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts } from "../theme";
import { ramp, useSec } from "./ui";

export const palette = {
  violet: "#8B6CFF",
  pink: "#FF6FAE",
  teal: "#2FD9C4",
  blue: "#4C8DFF",
  orange: "#FFA45B",
  gold: "#FFD45E",
};

// --- Background ---------------------------------------------------------------

/** Slowly drifting aurora blobs, twinkling stars and floating hex bytes. */
export const Aurora: React.FC = () => {
  const t = useSec();
  const blobs = [
    { color: palette.violet, x: 25, y: 30, r: 46, speed: 0.21 },
    { color: palette.pink, x: 78, y: 25, r: 40, speed: 0.17 },
    { color: palette.teal, x: 65, y: 80, r: 44, speed: 0.13 },
    { color: palette.blue, x: 15, y: 82, r: 38, speed: 0.19 },
  ];
  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #0E0A26 0%, #160C33 45%, #071A2C 100%)" }}>
      {blobs.map((b, i) => (
        <AbsoluteFill
          key={b.color}
          style={{
            background: `radial-gradient(circle at ${b.x + 8 * Math.sin(t * b.speed + i)}% ${
              b.y + 6 * Math.cos(t * b.speed * 1.3 + i * 2)
            }%, ${b.color}55 0%, ${b.color}22 ${b.r * 0.5}%, transparent ${b.r}%)`,
          }}
        />
      ))}
      <Stars />
      <FloatingBytes />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 90% 85% at 50% 50%, transparent 55%, rgba(5, 4, 15, 0.6) 100%)" }}
      />
    </AbsoluteFill>
  );
};

const Stars: React.FC = () => {
  const t = useSec();
  return (
    <AbsoluteFill>
      {Array.from({ length: 70 }, (_, i) => {
        const size = 2 + random(`s${i}`) * 4;
        const twinkle = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(t * (1 + random(`w${i}`) * 2) + i));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${random(`x${i}`) * 100}%`,
              top: `${random(`y${i}`) * 100}%`,
              width: size,
              height: size,
              borderRadius: size,
              background: "#FFFFFF",
              opacity: twinkle * 0.6,
              boxShadow: `0 0 ${size * 3}px rgba(255,255,255,0.8)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const BYTES = ["3F", "A0", "0x1F", "5B", "E1", "7C", "0D", "FF", "42", "9A", "0x16", "C8"];

const FloatingBytes: React.FC = () => {
  const t = useSec();
  return (
    <AbsoluteFill style={{ fontFamily: fonts.mono, color: "#B9A8FF" }}>
      {Array.from({ length: 22 }, (_, i) => {
        const speed = 20 + random(`fs${i}`) * 30;
        const y = (((random(`fy${i}`) * 1300 - t * speed) % 1300) + 1300) % 1300 - 110;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${random(`fx${i}`) * 96}%`,
              top: y,
              fontSize: 22 + random(`fz${i}`) * 22,
              opacity: 0.12 + random(`fo${i}`) * 0.12,
              rotate: `${Math.sin(t + i) * 8}deg`,
            }}
          >
            {BYTES[i % BYTES.length]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// --- Mascot -----------------------------------------------------------------------

export type Mood = "happy" | "sad" | "wow" | "think";

/** The mascot: a save file as a little envelope with a face. `hop` makes it
 * bounce. */
export const Mascot: React.FC<{
  mood: Mood;
  size?: number;
  hop?: boolean;
  magnifier?: boolean;
  style?: React.CSSProperties;
}> = ({ mood, size = 260, hop = false, magnifier = false, style }) => {
  const t = useSec();
  // Bounce with squash and stretch.
  const phase = (t * 2.2) % 1;
  const lift = hop ? Math.sin(phase * Math.PI) * 34 : Math.sin(t * 2.4) * 6;
  const squash = hop ? 1 + (phase < 0.08 || phase > 0.92 ? 0.08 : -0.03) : 1;
  // Blink every few seconds.
  const blink = (t % 3.1) < 0.12 ? 0.12 : 1;
  const shake = mood === "sad" ? Math.sin(t * 40) * 2 : 0;
  const tears = mood === "sad";
  return (
    <div style={{ width: size, height: size, ...style }}>
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        style={{ overflow: "visible", translate: `${shake}px ${-lift}px`, scale: `${1 / squash} ${squash}`, transformOrigin: "50% 100%" }}
      >
        <defs>
          <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF8EC" />
            <stop offset="100%" stopColor="#F3DFC2" />
          </linearGradient>
          <linearGradient id="flap" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F7E6CC" />
            <stop offset="100%" stopColor="#E8CCA4" />
          </linearGradient>
        </defs>
        {/* Shadow. */}
        <ellipse cx="100" cy="194" rx={62 - lift * 0.5} ry="8" fill="rgba(0,0,0,0.35)" />
        {/* Feet. */}
        <rect x="60" y="170" width="24" height="20" rx="10" fill="#E0A96B" />
        <rect x="116" y="170" width="24" height="20" rx="10" fill="#E0A96B" />
        {/* Envelope body, its side folds and the flap. */}
        <rect x="20" y="58" width="160" height="118" rx="18" fill="url(#paper)" stroke="#E2C59C" strokeWidth="3" />
        <path d="M22 168 L84 120 M178 168 L116 120" stroke="#E8CCA4" strokeWidth="4" strokeLinecap="round" />
        <path d="M22 66 Q22 58 30 58 L170 58 Q178 58 178 66 L108 116 Q100 122 92 116 Z" fill="url(#flap)" stroke="#E2C59C" strokeWidth="3" />
        {/* Wax seal with a heart. */}
        <circle cx="100" cy="112" r="17" fill="#E2455F" />
        <circle cx="100" cy="112" r="12" fill="none" stroke="#B82A44" strokeWidth="2" />
        <path d="M100 119 L93 112 A4 4 0 0 1 100 106 A4 4 0 0 1 107 112 Z" fill="#FFD1DA" />
        {/* Eyes. */}
        {mood === "happy" ? (
          <>
            <path d="M58 146 Q68 134 78 146" stroke="#3A1E1A" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M122 146 Q132 134 142 146" stroke="#3A1E1A" strokeWidth="6" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="68" cy="144" rx="8" ry={(mood === "wow" ? 12 : 10) * blink} fill="#3A1E1A" />
            <ellipse cx="132" cy="144" rx="8" ry={(mood === "wow" ? 12 : 10) * blink} fill="#3A1E1A" />
            <circle cx="71" cy="140" r={3 * blink} fill="#FFF" />
            <circle cx="135" cy="140" r={3 * blink} fill="#FFF" />
          </>
        )}
        {mood === "sad" && (
          <>
            <path d="M56 128 L76 133" stroke="#3A1E1A" strokeWidth="5" strokeLinecap="round" />
            <path d="M144 128 L124 133" stroke="#3A1E1A" strokeWidth="5" strokeLinecap="round" />
          </>
        )}
        {/* Cheeks. */}
        <ellipse cx="50" cy="158" rx="10" ry="6" fill="#FF6F8E" opacity="0.5" />
        <ellipse cx="150" cy="158" rx="10" ry="6" fill="#FF6F8E" opacity="0.5" />
        {/* Mouth. */}
        {mood === "happy" && <path d="M90 152 Q100 164 110 152 Z" fill="#7A2E2A" />}
        {mood === "sad" && <path d="M90 162 Q100 152 110 162" stroke="#3A1E1A" strokeWidth="5" fill="none" strokeLinecap="round" />}
        {mood === "wow" && <ellipse cx="100" cy="158" rx="7" ry="9" fill="#7A2E2A" />}
        {mood === "think" && <path d="M91 158 L109 156" stroke="#3A1E1A" strokeWidth="5" strokeLinecap="round" />}
        {/* Tears. */}
        {tears &&
          [0, 1].map((k) => {
            const drop = ((t * 1.4 + k * 0.5) % 1);
            return (
              <ellipse
                key={k}
                cx={k ? 134 : 66}
                cy={152 + drop * 30}
                rx="5"
                ry="8"
                fill="#7CC7FF"
                opacity={1 - drop}
              />
            );
          })}
        {magnifier && (
          <g style={{ rotate: `${Math.sin(t * 2) * 10}deg`, transformOrigin: "160px 150px" }}>
            <line x1="170" y1="150" x2="198" y2="182" stroke="#6B4A2E" strokeWidth="12" strokeLinecap="round" />
            <circle cx="152" cy="130" r="30" fill="rgba(180,230,255,0.35)" stroke="#E9EEF7" strokeWidth="8" />
            <path d="M138 120 Q146 110 158 112" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        )}
      </svg>
    </div>
  );
};

/** A speech bubble that pops in at `from`. */
export const Bubble: React.FC<{ text: string; from: number; until?: number; style?: React.CSSProperties }> = ({
  text,
  from,
  until = Infinity,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const pop = spring({ frame: frame - from * fps, fps, config: { damping: 11, mass: 0.6 } });
  const out = Number.isFinite(until) ? ramp(t, until, 0.25) : 0;
  return (
    <div
      style={{
        position: "absolute",
        padding: "18px 30px",
        borderRadius: 28,
        background: "#FFFFFF",
        color: "#2A1F3D",
        fontFamily: fonts.sans,
        fontSize: 38,
        fontWeight: 600,
        whiteSpace: "nowrap",
        boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
        scale: `${pop * (1 - out)}`,
        transformOrigin: "0% 100%",
        ...style,
      }}
    >
      {text}
    </div>
  );
};

// --- Effects ------------------------------------------------------------------------

const starPath = "M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5 Z";

/** Twinkling four-point stars around (x, y), appearing at `from`. */
export const Sparkles: React.FC<{ x: number; y: number; from: number; spread?: number; count?: number }> = ({
  x,
  y,
  from,
  spread = 260,
  count = 9,
}) => {
  const t = useSec();
  if (t < from) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <svg width="1920" height="1080" style={{ position: "absolute" }}>
        {Array.from({ length: count }, (_, i) => {
          const a = random(`sa${i}${x}`) * Math.PI * 2;
          const d = spread * (0.4 + 0.6 * random(`sd${i}${x}`));
          const life = t - from - random(`st${i}${x}`) * 0.4;
          const s = life < 0 ? 0 : Math.sin(Math.min(1, life / 0.9) * Math.PI) * (1.2 + random(`ss${i}${y}`) * 1.6);
          return (
            <path
              key={i}
              d={starPath}
              fill={[palette.gold, "#FFFFFF", palette.pink, palette.teal][i % 4]}
              transform={`translate(${x + Math.cos(a) * d} ${y + Math.sin(a) * d}) scale(${s}) rotate(${t * 90})`}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/** A burst of confetti from (x, y) at `from`. */
export const Confetti: React.FC<{ x: number; y: number; from: number; count?: number }> = ({
  x,
  y,
  from,
  count = 60,
}) => {
  const t = useSec();
  const life = t - from;
  if (life < 0 || life > 2.6) return null;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {Array.from({ length: count }, (_, i) => {
        const angle = -Math.PI / 2 + (random(`ca${i}`) - 0.5) * 2.4;
        const speed = 700 + random(`cv${i}`) * 900;
        const px = x + Math.cos(angle) * speed * life;
        const py = y + Math.sin(angle) * speed * life + 900 * life * life;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: 14,
              height: 24,
              borderRadius: 4,
              background: [palette.gold, palette.pink, palette.teal, palette.violet, palette.orange][i % 5],
              rotate: `${life * (300 + random(`cr${i}`) * 600)}deg`,
              opacity: interpolate(life, [1.8, 2.6], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** A gold coin. */
export const Coin: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 70, style }) => (
  <div
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: size,
      background: "radial-gradient(circle at 35% 30%, #FFF2B0 0%, #FFD45E 40%, #E9A21F 100%)",
      border: `${size * 0.07}px solid #C9861A`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: fonts.latin,
      fontWeight: 800,
      fontSize: size * 0.48,
      color: "#9A5E0B",
      boxShadow: "0 6px 16px rgba(0,0,0,0.3)",
      ...style,
    }}
  >
    z
  </div>
);

/** A little delivery truck carrying `cargo`. */
export const Truck: React.FC<{ cargo: string; style?: React.CSSProperties }> = ({ cargo, style }) => {
  const t = useSec();
  const bump = Math.abs(Math.sin(t * 14)) * 3;
  return (
    <div style={{ position: "absolute", width: 420, height: 200, ...style }}>
      <svg viewBox="0 0 420 200" width="420" height="200" style={{ overflow: "visible", translate: `0px ${-bump}px` }}>
        <rect x="10" y="40" width="270" height="120" rx="18" fill="#FFD45E" />
        <rect x="280" y="80" width="110" height="80" rx="16" fill="#FF6FAE" />
        <rect x="300" y="92" width="60" height="36" rx="8" fill="#BFE7FF" />
        <circle cx="330" cy="110" r="5" fill="#2A1F3D" />
        <path d="M322 122 Q330 128 338 122" stroke="#2A1F3D" strokeWidth="3" fill="none" strokeLinecap="round" />
      </svg>
      {[80, 330].map((cx) => (
        <svg key={cx} viewBox="-26 -26 52 52" width="52" height="52" style={{ position: "absolute", left: cx - 26, top: 146, rotate: `${-t * 720}deg` }}>
          <circle r="24" fill="#2A1F3D" />
          <circle r="10" fill="#C9C2DE" />
          <rect x="-2" y="-20" width="4" height="12" fill="#C9C2DE" />
        </svg>
      ))}
      <div
        style={{
          position: "absolute",
          left: 10,
          top: 40,
          width: 270,
          height: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily: fonts.sans,
          fontSize: 34,
          fontWeight: 700,
          color: "#5A3A06",
          lineHeight: 1.25,
          whiteSpace: "pre-line",
          translate: `0px ${-bump}px`,
        }}
      >
        {cargo}
      </div>
    </div>
  );
};

/** A fingerprint whose ridges draw themselves from `from`. */
export const Fingerprint: React.FC<{ size: number; from: number; color?: string }> = ({ size, from, color = palette.teal }) => {
  const t = useSec();
  const draw = ramp(t, from, 1.4);
  const rings = [12, 22, 32, 42, 52, 62];
  return (
    <svg viewBox="-70 -80 140 160" width={size} height={size * 1.15}>
      {rings.map((r, i) => {
        const len = Math.PI * r * 1.6;
        return (
          <path
            key={r}
            d={`M ${-r} ${10 + i * 2} A ${r} ${r * 1.15} 0 1 1 ${r * 0.9} ${18 + i * 2}`}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={len}
            strokeDashoffset={len * (1 - Math.min(1, draw * 1.3 - i * 0.05))}
            opacity={0.9}
          />
        );
      })}
    </svg>
  );
};

// --- Devices --------------------------------------------------------------------------

/** A PSP-style handheld; `children` are drawn on its screen (480 x 272). */
export const Psp: React.FC<{ width?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({
  width = 760,
  style,
  children,
}) => {
  const s = width / 760;
  return (
    <div style={{ position: "absolute", width, height: 330 * s, ...style }}>
      <svg viewBox="0 0 760 330" width={width} height={330 * s} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="pspBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A3550" />
            <stop offset="100%" stopColor="#1C1930" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="760" height="330" rx="165" fill="url(#pspBody)" stroke="#5B5478" strokeWidth="4" />
        <rect x="134" y="26" width="492" height="282" rx="12" fill="#0A0814" />
        {/* D-pad. */}
        <g transform="translate(70 150)" fill="#8D86AA">
          <rect x="-14" y="-40" width="28" height="80" rx="6" />
          <rect x="-40" y="-14" width="80" height="28" rx="6" />
        </g>
        <circle cx="70" cy="245" r="17" fill="#6E678C" />
        {/* Face buttons. */}
        <g transform="translate(690 150)" fontFamily="Arial" fontWeight="700" textAnchor="middle" fontSize="20">
          <circle cx="0" cy="-36" r="17" fill="#2A2640" />
          <text x="0" y="-29" fill="#4CE0B3">△</text>
          <circle cx="36" cy="0" r="17" fill="#2A2640" />
          <text x="36" y="7" fill="#FF6B7D">○</text>
          <circle cx="0" cy="36" r="17" fill="#2A2640" />
          <text x="0" y="43" fill="#7FA6FF">✕</text>
          <circle cx="-36" cy="0" r="17" fill="#2A2640" />
          <text x="-36" y="7" fill="#FF8DE0">□</text>
        </g>
        <text x="380" y="322" fill="#8D86AA" fontFamily="Arial" fontSize="16" fontWeight="700" textAnchor="middle" letterSpacing="6">PSP</text>
      </svg>
      <div style={{ position: "absolute", left: 140 * s, top: 32 * s, width: 480 * s, height: 270 * s, overflow: "hidden", borderRadius: 8 }}>
        {children}
      </div>
    </div>
  );
};

/** A phone in landscape; `children` are drawn on its screen. */
export const Phone: React.FC<{ width?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({
  width = 640,
  style,
  children,
}) => {
  const h = width * 0.48;
  return (
    <div
      style={{
        position: "absolute",
        width,
        height: h,
        borderRadius: h * 0.18,
        background: "linear-gradient(160deg, #E9EDF5, #9EA7BA)",
        padding: h * 0.045,
        boxShadow: "0 30px 60px rgba(0,0,0,0.45)",
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: h * 0.14,
          background: "#0A0814",
          overflow: "hidden",
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            left: 10,
            top: "50%",
            width: h * 0.08,
            height: h * 0.3,
            translate: "0px -50%",
            borderRadius: 20,
            background: "#000",
          }}
        />
      </div>
    </div>
  );
};

/** A screen glow with a label, for device screens. */
export const ScreenLabel: React.FC<{ text: string; color: string }> = ({ text, color }) => (
  <AbsoluteFill
    style={{
      alignItems: "center",
      justifyContent: "center",
      background: `radial-gradient(circle at 50% 40%, ${color}55, transparent 70%)`,
      fontFamily: fonts.sans,
      fontSize: 34,
      fontWeight: 700,
      color: "#FFFFFF",
      letterSpacing: 2,
    }}
  >
    {text}
  </AbsoluteFill>
);

// --- Hunting-themed cast (original designs) ---------------------------------------------

/** A chibi hunter. `poor`: patched rags and a stick (no save); `rich`: full
 * golden armor and a glowing greatsword (save restored). */
export const Hunter: React.FC<{
  size?: number;
  gear: "poor" | "rich";
  mood: "cry" | "happy" | "cheer";
  style?: React.CSSProperties;
}> = ({ size = 260, gear, mood, style }) => {
  const t = useSec();
  const rich = gear === "rich";
  const bob = mood === "cheer" ? Math.abs(Math.sin(t * 5)) * 12 : Math.sin(t * 3) * 4;
  const shake = mood === "cry" ? Math.sin(t * 38) * 2.5 : 0;
  const arm = mood === "cheer" ? -70 + Math.sin(t * 8) * 18 : mood === "cry" ? 30 : -10 + Math.sin(t * 2) * 4;
  const glow = 0.6 + 0.4 * Math.sin(t * 5);
  const body = rich ? "#E8B53C" : "#9C7A55";
  const trim = rich ? "#FFF0B0" : "#7A5B3A";
  return (
    <svg viewBox="0 0 200 220" width={size} height={size * 1.1} style={{ overflow: "visible", ...style }}>
      <defs>
        <radialGradient id="aura">
          <stop offset="0%" stopColor="#FFE58A" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFE58A" stopOpacity="0" />
        </radialGradient>
      </defs>
      {rich && <circle cx="100" cy="120" r={96 + glow * 8} fill="url(#aura)" />}
      <ellipse cx="100" cy="212" rx="55" ry="7" fill="rgba(0,0,0,0.35)" />
      <g transform={`translate(${shake} ${-bob})`}>
        {/* Weapon on the back. */}
        {rich ? (
          <g transform="rotate(-28 100 120)">
            <rect x="88" y="0" width="42" height="160" rx="8" fill="#DDE8FF" stroke="#8FA3D9" strokeWidth="4" />
            <rect x="100" y="10" width="18" height="140" rx="6" fill="#9EE7FF" opacity={glow} />
            <rect x="78" y="150" width="62" height="14" rx="5" fill="#C9902A" />
            <rect x="102" y="162" width="14" height="36" rx="4" fill="#7A4A2A" />
          </g>
        ) : (
          <g transform="rotate(-20 100 120)">
            <rect x="104" y="40" width="12" height="150" rx="6" fill="#8A6A44" />
            <circle cx="110" cy="40" r="9" fill="#7A5B3A" />
          </g>
        )}
        {/* Legs and body. */}
        <rect x="70" y="170" width="22" height="34" rx="8" fill={rich ? "#B07D1F" : "#6E5A45"} />
        <rect x="108" y="170" width="22" height="34" rx="8" fill={rich ? "#B07D1F" : "#6E5A45"} />
        <rect x="58" y="112" width="84" height="68" rx="22" fill={body} stroke={trim} strokeWidth="4" />
        {rich ? (
          <>
            <path d="M58 140 L142 140" stroke="#C0392B" strokeWidth="10" />
            <circle cx="100" cy="128" r="9" fill="#5FD3FF" stroke="#FFF0B0" strokeWidth="3" />
            <path d="M46 116 Q58 98 74 112 L70 126 Z M154 116 Q142 98 126 112 L130 126 Z" fill="#F7D36B" stroke="#FFF0B0" strokeWidth="2" />
          </>
        ) : (
          <>
            {/* Patches. */}
            <rect x="70" y="124" width="16" height="14" fill="#B89870" transform="rotate(-8 78 131)" />
            <rect x="112" y="150" width="14" height="12" fill="#B89870" transform="rotate(10 119 156)" />
            <path d="M72 126 l12 10 M84 126 l-12 10" stroke="#5A4630" strokeWidth="2" />
          </>
        )}
        {/* Arms. */}
        <g transform={`rotate(${arm} 140 124)`}>
          <rect x="136" y="118" width="18" height="46" rx="9" fill={body} />
          <circle cx="145" cy="166" r="11" fill="#FFD9B8" />
        </g>
        <g transform={`rotate(${mood === "cry" ? -30 : 0} 60 124)`}>
          <rect x="46" y="118" width="18" height="46" rx="9" fill={body} />
          <circle cx="55" cy="166" r="11" fill="#FFD9B8" />
        </g>
        {/* Head. */}
        <circle cx="100" cy="86" r="42" fill="#FFD9B8" />
        {rich ? (
          <>
            <path d="M56 84 Q58 36 100 34 Q142 36 144 84 L132 80 Q100 60 68 80 Z" fill="#E8B53C" stroke="#FFF0B0" strokeWidth="3" />
            <path d="M100 32 L92 2 L108 2 Z" fill="#C0392B" />
            <path d="M62 58 L30 36 L56 76 Z M138 58 L170 36 L144 76 Z" fill="#FFF0B0" />
            <circle cx="100" cy="50" r="7" fill="#5FD3FF" />
          </>
        ) : (
          /* Messy hair. */
          <path d="M58 82 Q56 44 100 42 Q144 44 142 82 L134 70 L126 80 L116 66 L104 78 L94 64 L84 78 L74 66 L66 80 Z" fill="#5A4630" />
        )}
        {mood === "happy" || mood === "cheer" ? (
          <>
            <path d="M80 94 Q86 86 92 94" stroke="#2A1F3D" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M108 94 Q114 86 120 94" stroke="#2A1F3D" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M88 106 Q100 120 112 106 Z" fill="#7A2E2A" />
          </>
        ) : (
          <>
            {/* Crying: shut eyes, wobbly mouth, streams of tears. */}
            <path d="M78 92 L92 96 M122 92 L108 96" stroke="#2A1F3D" strokeWidth="4" strokeLinecap="round" />
            <path d="M90 114 Q95 106 100 112 Q105 106 110 114" stroke="#2A1F3D" strokeWidth="4" fill="none" strokeLinecap="round" />
            {[0, 1].map((k) =>
              [0, 1, 2].map((j) => {
                const d = ((t * 1.6 + j / 3) % 1);
                return (
                  <ellipse key={`${k}${j}`} cx={(k ? 112 : 88) + (k ? 1 : -1) * d * 24} cy={100 + d * 30} rx="5" ry="7" fill="#7CC7FF" opacity={1 - d} />
                );
              }),
            )}
          </>
        )}
        <ellipse cx="76" cy="104" rx="7" ry="4" fill="#FF8FA3" opacity="0.6" />
        <ellipse cx="124" cy="104" rx="7" ry="4" fill="#FF8FA3" opacity="0.6" />
      </g>
    </svg>
  );
};

/** A companion kitten with a scarf and a little backpack. */
export const Kitty: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 200, style }) => {
  const t = useSec();
  const tail = Math.sin(t * 4) * 18;
  const ear = Math.sin(t * 6) > 0.95 ? -10 : 0;
  const blink = (t % 2.9) < 0.12 ? 0.15 : 1;
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} style={{ overflow: "visible", ...style }}>
      <ellipse cx="100" cy="192" rx="48" ry="7" fill="rgba(0,0,0,0.35)" />
      <g transform={`rotate(${tail} 140 160)`}>
        <path d="M140 160 Q186 150 176 104" stroke="#C7B9E8" strokeWidth="14" fill="none" strokeLinecap="round" />
      </g>
      <rect x="62" y="118" width="76" height="70" rx="30" fill="#E9E1FA" />
      <rect x="118" y="124" width="30" height="40" rx="8" fill="#7A5AA6" />
      <circle cx="100" cy="88" r="50" fill="#E9E1FA" />
      <g transform={`rotate(${ear} 68 52)`}>
        <path d="M58 64 L60 22 L92 46 Z" fill="#E9E1FA" />
        <path d="M64 56 L66 32 L84 46 Z" fill="#FFB3C7" />
      </g>
      <path d="M142 64 L140 22 L108 46 Z" fill="#E9E1FA" />
      <path d="M136 56 L134 32 L116 46 Z" fill="#FFB3C7" />
      <ellipse cx="82" cy="90" rx="7" ry={10 * blink} fill="#2A1F3D" />
      <ellipse cx="118" cy="90" rx="7" ry={10 * blink} fill="#2A1F3D" />
      <circle cx="85" cy="86" r={2.5 * blink} fill="#FFF" />
      <circle cx="121" cy="86" r={2.5 * blink} fill="#FFF" />
      <path d="M96 104 L104 104 L100 109 Z" fill="#FF8FA3" />
      <path d="M100 109 Q94 116 88 112 M100 109 Q106 116 112 112" stroke="#2A1F3D" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M58 102 L36 98 M58 108 L36 112 M142 102 L164 98 M142 108 L164 112" stroke="#B3A6D4" strokeWidth="3" strokeLinecap="round" />
      {/* Scarf. */}
      <path d="M60 126 Q100 142 140 126 L138 138 Q100 152 62 138 Z" fill="#FF6FAE" />
      <rect x="120" y="134" width="14" height="30" rx="6" fill="#FF6FAE" transform="rotate(-12 127 134)" />
    </svg>
  );
};

/** A round little wyvern flapping its wings. */
export const Wyvern: React.FC<{ size?: number; style?: React.CSSProperties }> = ({ size = 280, style }) => {
  const t = useSec();
  const flap = Math.sin(t * 9) * 22;
  const hover = Math.sin(t * 2.5) * 10;
  const blink = (t % 3.3) < 0.12 ? 0.15 : 1;
  return (
    <svg viewBox="0 0 240 200" width={size} height={size * 0.83} style={{ overflow: "visible", ...style }}>
      <g transform={`translate(0 ${hover})`}>
        <g transform={`rotate(${-flap} 90 96)`}>
          <path d="M90 96 L18 40 Q40 86 22 110 Q54 96 90 112 Z" fill="#E0566A" stroke="#9E2F42" strokeWidth="4" strokeLinejoin="round" />
        </g>
        <g transform={`rotate(${flap} 150 96)`}>
          <path d="M150 96 L222 40 Q200 86 218 110 Q186 96 150 112 Z" fill="#E0566A" stroke="#9E2F42" strokeWidth="4" strokeLinejoin="round" />
        </g>
        <path d="M150 150 Q200 170 214 140" stroke="#F06D7F" strokeWidth="16" fill="none" strokeLinecap="round" />
        <ellipse cx="120" cy="120" rx="58" ry="52" fill="#F06D7F" />
        <ellipse cx="120" cy="136" rx="36" ry="28" fill="#FFD3A8" />
        <path d="M92 76 L84 52 L104 70 Z M148 76 L156 52 L136 70 Z" fill="#FFD45E" />
        <ellipse cx="102" cy="108" rx="8" ry={11 * blink} fill="#2A1F3D" />
        <ellipse cx="138" cy="108" rx="8" ry={11 * blink} fill="#2A1F3D" />
        <circle cx="105" cy="104" r={3 * blink} fill="#FFF" />
        <circle cx="141" cy="104" r={3 * blink} fill="#FFF" />
        <path d="M110 128 Q120 136 130 128" stroke="#2A1F3D" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M113 130 L116 136 L119 130 M121 130 L124 136 L127 130" fill="#FFFFFF" />
      </g>
    </svg>
  );
};
