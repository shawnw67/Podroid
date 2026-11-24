// Die-cut sticker illustrations: flat colours, ink outlines, a white edge
// and a hard shadow. All original drawings.

import React from "react";
import { useCurrentFrame } from "remotion";
import { col, font, ink } from "./kit";

const S = 6; // outline width inside the drawings

/** White die-cut edge plus hard shadow around any drawing. */
export const edge = `drop-shadow(5px 0 0 #fff) drop-shadow(-5px 0 0 #fff) drop-shadow(0 5px 0 #fff) drop-shadow(0 -5px 0 #fff) drop-shadow(10px 10px 0 ${ink})`;

const Svg: React.FC<{ w: number; h: number; scale?: number; children: React.ReactNode }> = ({ w, h, scale = 1, children }) => (
  <svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`} style={{ overflow: "visible", filter: edge, display: "block" }}>
    {children}
  </svg>
);

const Padlock: React.FC<{ x: number; y: number; color: string }> = ({ x, y, color }) => (
  <g transform={`translate(${x} ${y})`}>
    <path d="M -24 0 V -22 A 24 24 0 0 1 24 -22 V 0" fill="none" stroke={ink} strokeWidth={10} />
    <rect x={-38} y={-4} width={76} height={60} rx={10} fill={color} stroke={ink} strokeWidth={S} />
    <circle cx={0} cy={22} r={8} fill={ink} />
    <rect x={-3} y={24} width={6} height={18} fill={ink} />
  </g>
);

/** A sealed envelope. `locked` adds a padlock; `label` is written on it. */
export const Envelope: React.FC<{ color?: string; label?: string; locked?: string; scale?: number }> = ({
  color = col.cream,
  label,
  locked,
  scale = 1,
}) => (
  <Svg w={340} h={230} scale={scale}>
    <rect x={6} y={6} width={328} height={218} rx={18} fill={color} stroke={ink} strokeWidth={S} />
    <path d="M 12 16 L 170 126 L 328 16" fill="none" stroke={ink} strokeWidth={S} strokeLinejoin="round" />
    <path d="M 12 214 L 128 106 M 328 214 L 212 106" fill="none" stroke={ink} strokeWidth={4} opacity={0.5} />
    {label !== undefined && (
      <g>
        <rect x={70} y={150} width={200} height={50} rx={8} fill="#fff" stroke={ink} strokeWidth={4} />
        <text x={170} y={186} textAnchor="middle" fontFamily={font.mono} fontSize={26} fill={ink}>
          {label}
        </text>
      </g>
    )}
    {locked !== undefined && <Padlock x={170} y={100} color={locked} />}
  </Svg>
);

/** A sheet of paper with writing on it. */
export const Letter: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <Svg w={230} h={290} scale={scale}>
    <path d="M 8 8 H 170 L 222 60 V 282 H 8 Z" fill="#fff" stroke={ink} strokeWidth={S} strokeLinejoin="round" />
    <path d="M 170 8 V 60 H 222" fill={col.cream} stroke={ink} strokeWidth={S} strokeLinejoin="round" />
    {[90, 126, 162, 198, 234].map((y, i) => (
      <path key={y} d={`M 36 ${y} H ${[190, 160, 190, 120, 175][i]}`} stroke={ink} strokeWidth={8} strokeLinecap="round" opacity={0.75} />
    ))}
    <text x={36} y={62} fontFamily={font.mono} fontSize={26} fill={col.red}>
      ¥ HP ⚔
    </text>
  </Svg>
);

/** A thumbprint. */
export const Print: React.FC<{ color?: string; scale?: number }> = ({ color = col.pink, scale = 1 }) => (
  <Svg w={200} h={250} scale={scale}>
    <ellipse cx={100} cy={125} rx={90} ry={116} fill={color} stroke={ink} strokeWidth={S} />
    {[18, 34, 50, 66, 82].map((r, i) => (
      <path
        key={r}
        d={`M ${100 - r} ${140 + i * 3} C ${100 - r} ${80 - r * 0.6}, ${100 + r} ${80 - r * 0.6}, ${100 + r} ${140 + i * 2}`}
        fill="none"
        stroke={ink}
        strokeWidth={6}
        strokeLinecap="round"
      />
    ))}
    <path d="M 40 190 C 70 214, 130 214, 160 190" fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" />
  </Svg>
);

/** A key. */
export const Key: React.FC<{ color?: string; scale?: number }> = ({ color = col.yellow, scale = 1 }) => (
  <Svg w={300} h={140} scale={scale}>
    <circle cx={70} cy={70} r={56} fill={color} stroke={ink} strokeWidth={S} />
    <circle cx={60} cy={70} r={18} fill={col.cream} stroke={ink} strokeWidth={S} />
    <path d="M 124 56 H 290 V 84 H 270 V 110 H 246 V 84 H 226 V 104 H 204 V 84 H 124 Z" fill={color} stroke={ink} strokeWidth={S} strokeLinejoin="round" />
  </Svg>
);

/** A handheld console (no logos). */
export const Psp: React.FC<{ scale?: number; screen?: React.ReactNode }> = ({ scale = 1 }) => (
  <Svg w={460} h={210} scale={scale}>
    <rect x={6} y={6} width={448} height={198} rx={96} fill="#3A3A4A" stroke={ink} strokeWidth={S} />
    <rect x={120} y={30} width={220} height={150} rx={10} fill={col.blue} stroke={ink} strokeWidth={S} />
    <path d="M 140 160 L 190 100 L 220 130 L 260 80 L 320 160 Z" fill={col.mint} stroke={ink} strokeWidth={4} strokeLinejoin="round" />
    <circle cx={290} cy={66} r={16} fill={col.yellow} stroke={ink} strokeWidth={4} />
    <path d="M 52 92 h 18 v -18 h 16 v 18 h 18 v 16 h -18 v 18 h -16 v -18 h -18 Z" fill="#ddd" stroke={ink} strokeWidth={4} />
    {[
      [400, 72, col.mint],
      [376, 100, col.pink],
      [424, 100, col.red],
      [400, 128, col.blue],
    ].map(([x, y, c]) => (
      <circle key={`${x},${y}`} cx={x as number} cy={y as number} r={12} fill={c as string} stroke={ink} strokeWidth={4} />
    ))}
  </Svg>
);

/** A phone (no logos). */
export const Phone: React.FC<{ scale?: number }> = ({ scale = 1 }) => (
  <Svg w={200} h={380} scale={scale}>
    <rect x={6} y={6} width={188} height={368} rx={34} fill="#F4F4F8" stroke={ink} strokeWidth={S} />
    <rect x={22} y={44} width={156} height={290} rx={10} fill={col.purple} stroke={ink} strokeWidth={S} />
    <rect x={76} y={18} width={48} height={12} rx={6} fill={ink} />
    <circle cx={100} cy={354} r={10} fill="none" stroke={ink} strokeWidth={4} />
    {[0, 1, 2, 3].map((r) =>
      [0, 1, 2].map((c) => (
        <rect key={`${r},${c}`} x={38 + c * 46} y={66 + r * 62} width={32} height={32} rx={8} fill={[col.yellow, col.mint, col.pink, col.orange][(r + c) % 4]} stroke={ink} strokeWidth={3} />
      )),
    )}
  </Svg>
);

/** A rubber stamp impression. */
export const Stamp: React.FC<{ text: string; color?: string; size?: number }> = ({ text, color = col.red, size = 96 }) => (
  <div
    style={{
      padding: `${size * 0.12}px ${size * 0.35}px`,
      border: `${size * 0.11}px solid ${color}`,
      borderRadius: size * 0.18,
      color,
      fontFamily: font.title,
      fontSize: size,
      lineHeight: 1.1,
      whiteSpace: "nowrap",
      background: "rgba(255,255,255,0.55)",
      boxShadow: `inset 0 0 0 ${size * 0.05}px rgba(255,255,255,0.6)`,
      mixBlendMode: "multiply",
    }}
  >
    {text}
  </div>
);

/** A chibi hunter. Poor: plain clothes and a stick; rich: shiny armour. */
export const Hunter: React.FC<{ rich?: boolean; mood?: "cry" | "happy"; scale?: number }> = ({ rich = false, mood = "happy", scale = 1 }) => {
  const frame = useCurrentFrame();
  const tear = (frame % 16) / 16;
  const skin = "#FFD9B8";
  const body = rich ? col.yellow : "#C9A27A";
  return (
    <Svg w={260} h={340} scale={scale}>
      {/* weapon */}
      {rich ? (
        <g transform="rotate(-20 210 180)">
          <rect x={200} y={20} width={30} height={200} rx={6} fill="#E8F1FF" stroke={ink} strokeWidth={S} />
          <rect x={186} y={210} width={58} height={18} rx={6} fill={col.red} stroke={ink} strokeWidth={S} />
          <rect x={206} y={226} width={18} height={44} rx={4} fill="#8B5A2B" stroke={ink} strokeWidth={S} />
        </g>
      ) : (
        <path d="M 214 120 L 236 290" stroke="#8B5A2B" strokeWidth={14} strokeLinecap="round" />
      )}
      {/* legs + body */}
      <rect x={86} y={262} width={34} height={60} rx={10} fill={rich ? "#B07B00" : "#8B6A4A"} stroke={ink} strokeWidth={S} />
      <rect x={140} y={262} width={34} height={60} rx={10} fill={rich ? "#B07B00" : "#8B6A4A"} stroke={ink} strokeWidth={S} />
      <path d="M 70 190 Q 130 160 190 190 L 200 280 H 60 Z" fill={body} stroke={ink} strokeWidth={S} strokeLinejoin="round" />
      {rich ? (
        <>
          <path d="M 60 196 Q 40 180 50 160 Q 80 170 92 190 Z" fill={col.yellow} stroke={ink} strokeWidth={S} />
          <path d="M 200 196 Q 220 180 210 160 Q 180 170 168 190 Z" fill={col.yellow} stroke={ink} strokeWidth={S} />
          <circle cx={130} cy={224} r={16} fill={col.red} stroke={ink} strokeWidth={S} />
        </>
      ) : (
        <>
          <rect x={92} y={220} width={26} height={22} fill="#A0805C" stroke={ink} strokeWidth={4} transform="rotate(-8 105 231)" />
          <path d="M 150 250 l 10 -8 l 6 10" fill="none" stroke={ink} strokeWidth={4} />
        </>
      )}
      {/* head */}
      <circle cx={130} cy={110} r={74} fill={skin} stroke={ink} strokeWidth={S} />
      {rich ? (
        <>
          <path d="M 54 108 Q 56 30 130 28 Q 204 30 206 108 L 180 96 L 130 104 L 80 96 Z" fill={col.yellow} stroke={ink} strokeWidth={S} strokeLinejoin="round" />
          <path d="M 130 30 Q 150 -20 196 -6 Q 160 4 150 34 Z" fill={col.red} stroke={ink} strokeWidth={S} strokeLinejoin="round" />
          <path d="M 86 50 L 96 70 M 174 50 L 164 70" stroke={ink} strokeWidth={4} />
        </>
      ) : (
        <path d="M 60 96 Q 66 40 130 36 Q 196 40 200 96 Q 170 70 130 76 Q 90 70 60 96 Z" fill="#6B4A2E" stroke={ink} strokeWidth={S} strokeLinejoin="round" />
      )}
      {/* face */}
      {mood === "cry" ? (
        <>
          <path d="M 92 120 L 112 128 M 168 120 L 148 128" stroke={ink} strokeWidth={7} strokeLinecap="round" />
          <path d="M 108 168 Q 130 150 152 168" fill="none" stroke={ink} strokeWidth={7} strokeLinecap="round" />
          <path d={`M 98 136 Q 92 ${150 + tear * 40} 96 ${160 + tear * 60}`} stroke={col.blue} strokeWidth={10} strokeLinecap="round" fill="none" />
          <path d={`M 162 136 Q 168 ${150 + tear * 40} 164 ${160 + tear * 60}`} stroke={col.blue} strokeWidth={10} strokeLinecap="round" fill="none" />
        </>
      ) : (
        <>
          <path d="M 92 124 Q 102 110 112 124 M 148 124 Q 158 110 168 124" fill="none" stroke={ink} strokeWidth={7} strokeLinecap="round" />
          <path d="M 104 150 Q 130 182 156 150 Z" fill={col.red} stroke={ink} strokeWidth={6} strokeLinejoin="round" />
          <circle cx={82} cy={146} r={10} fill={col.pink} opacity={0.8} />
          <circle cx={178} cy={146} r={10} fill={col.pink} opacity={0.8} />
        </>
      )}
    </Svg>
  );
};

/** The SHA-1 "fingerprint machine": a box with a hopper and turning gears. */
export const Machine: React.FC<{ running: boolean; scale?: number }> = ({ running, scale = 1 }) => {
  const frame = useCurrentFrame();
  const a = running ? frame * 6 : 0;
  const gear = (cx: number, cy: number, r: number, dir: number, color: string) => (
    <g transform={`rotate(${a * dir} ${cx} ${cy})`}>
      {Array.from({ length: 8 }).map((_, i) => (
        <rect
          key={i}
          x={cx - 9}
          y={cy - r - 14}
          width={18}
          height={24}
          fill={color}
          stroke={ink}
          strokeWidth={4}
          transform={`rotate(${i * 45} ${cx} ${cy})`}
        />
      ))}
      <circle cx={cx} cy={cy} r={r} fill={color} stroke={ink} strokeWidth={S} />
      <circle cx={cx} cy={cy} r={r * 0.35} fill={col.cream} stroke={ink} strokeWidth={S} />
    </g>
  );
  const shake = running ? Math.sin(frame * 1.7) * 3 : 0;
  return (
    <Svg w={520} h={460} scale={scale}>
      <g transform={`translate(${shake} 0)`}>
        <path d="M 150 10 H 370 L 310 110 H 210 Z" fill={col.orange} stroke={ink} strokeWidth={S} strokeLinejoin="round" />
        <rect x={40} y={100} width={440} height={300} rx={28} fill={col.blue} stroke={ink} strokeWidth={S} />
        <rect x={80} y={140} width={360} height={130} rx={18} fill={col.cream} stroke={ink} strokeWidth={S} />
        {gear(170, 205, 40, 1, col.yellow)}
        {gear(262, 205, 30, -1.3, col.pink)}
        {gear(350, 205, 40, 1, col.mint)}
        <text x={260} y={350} textAnchor="middle" fontFamily={font.number} fontSize={70} fill="#fff" stroke={ink} strokeWidth={4} paintOrder="stroke">
          SHA-1
        </text>
        <rect x={440} y={300} width={70} height={50} rx={10} fill={col.yellow} stroke={ink} strokeWidth={S} />
        <rect x={110} y={396} width={40} height={50} fill="#666" stroke={ink} strokeWidth={S} />
        <rect x={370} y={396} width={40} height={50} fill="#666" stroke={ink} strokeWidth={S} />
      </g>
    </Svg>
  );
};

/** A chunky five-pointed star. */
export const Star: React.FC<{ color?: string; scale?: number }> = ({ color = col.yellow, scale = 1 }) => {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 ? 34 : 80;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    return `${90 + r * Math.cos(a)},${90 + r * Math.sin(a)}`;
  }).join(" ");
  return (
    <Svg w={180} h={180} scale={scale}>
      <polygon points={pts} fill={color} stroke={ink} strokeWidth={S} strokeLinejoin="round" />
    </Svg>
  );
};
