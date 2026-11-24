// The full sticker-style save-crack video: the sample's first three stations,
// then finding the secret in the game's code, moving the letter from the PSP
// layout to the iOS one, the whole conversion and the release.

import React from "react";
import { Audio } from "@remotion/media";
import { interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import data from "../savecrack/data.json";
import { Envelope, Hunter, Letter, Phone, Print, Psp, Stamp, Star } from "./art";
import { Arrow, Badge, Big, Canvas, Card, col, font, ink, Place, ramp, Shot, Tag, useSec } from "./kit";
import { parts, Sfx, StationA, StationB, StationC } from "./StickerSample";

export const FULL_SECONDS = 69;

const shots: Shot[] = [
  { at: 0, x: 960, y: 540, zoom: 1 },
  { at: 5.6, x: 960, y: 560, zoom: 1.06 },
  { at: 7.4, x: 2900, y: 540, zoom: 0.95 },
  { at: 12.6, x: 2920, y: 560, zoom: 0.97 },
  { at: 14.4, x: 3560, y: 760, zoom: 1.1 },
  { at: 17.6, x: 5500, y: 540, zoom: 1 },
  { at: 25.0, x: 5500, y: 560, zoom: 1.04 },
  { at: 26.8, x: 7700, y: 540, zoom: 1 },
  { at: 33.0, x: 7700, y: 560, zoom: 1 },
  { at: 34.6, x: 7700, y: 880, zoom: 1 },
  { at: 37.6, x: 9900, y: 540, zoom: 1 },
  { at: 41.2, x: 9900, y: 560, zoom: 1.02 },
  { at: 42.6, x: 9960, y: 1000, zoom: 1 },
  { at: 46.0, x: 9960, y: 1020, zoom: 1.02 },
  { at: 47.4, x: 9900, y: 1400, zoom: 1 },
  { at: 51.0, x: 9900, y: 1420, zoom: 1.03 },
  { at: 52.8, x: 12340, y: 560, zoom: 0.78 },
  { at: 58.6, x: 12340, y: 580, zoom: 0.82 },
  { at: 60.6, x: 12300, y: 1550, zoom: 1 },
  { at: 68.9, x: 12300, y: 1560, zoom: 1.06 },
];

/** A station drawn in its own coordinates (x0, y0 is its top-left corner on
 * the canvas) and its own clock (starting at `from` seconds). */
const Station: React.FC<{ x0: number; y0?: number; from: number; children: React.ReactNode }> = ({ x0, y0 = 0, from, children }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.round(from * fps)} layout="none">
      <div style={{ position: "absolute", left: x0, top: y0 }}>{children}</div>
    </Sequence>
  );
};

// --- X: where the secret is ------------------------------------------------------------

const CODE_NOTES: Record<string, { text: string; color: string; at: number }> = {
  "3227a0": { text: "① 算出指纹", color: col.blue, at: 3.0 },
  "3227b2": { text: "② 0x14 = 20 字节", color: col.pink, at: 3.8 },
  "3227c8": { text: "③ 和信里存的逐字节比", color: col.yellow, at: 4.6 },
  "3227d2": { text: "④ 不一样 → 存档已损坏", color: col.red, at: 5.4 },
};

const CODE = data.checkCode.filter((l) => l.address >= "3227a0" && !l.op.startsWith("v"));
const LINE = 44;
const CODE_TOP = 525 - (24 + 60 + CODE.length * LINE + 24) / 2;
const lineY = (i: number) => CODE_TOP + 6 + 24 + 60 + i * LINE + LINE / 2;

const CodeCard: React.FC = () => {
  const t = useSec();
  return (
    <div
      style={{
        background: "#2B2D42",
        border: `6px solid ${ink}`,
        borderRadius: 22,
        boxShadow: `10px 10px 0 ${ink}`,
        padding: "0 0 24px",
        fontFamily: font.mono,
        fontSize: 36,
        color: "#E8E8F0",
        width: 780,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 60,
          background: col.yellow,
          borderBottom: `6px solid ${ink}`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 20px",
          marginBottom: 24,
        }}
      >
        {[col.red, col.orange, col.mint].map((c) => (
          <div key={c} style={{ width: 22, height: 22, borderRadius: 11, background: c, border: `3px solid ${ink}` }} />
        ))}
        <span style={{ fontFamily: font.body, fontSize: 32, color: ink, marginLeft: 8 }}>游戏读档的代码</span>
      </div>
      {CODE.map((l) => {
        const note = CODE_NOTES[l.address];
        const lit = note !== undefined && t >= note.at;
        return (
          <div
            key={l.address}
            style={{
              height: LINE,
              display: "flex",
              alignItems: "center",
              padding: "0 24px",
              background: lit ? note.color : "transparent",
              color: lit ? ink : undefined,
            }}
          >
            <span style={{ opacity: 0.5, width: 150 }}>{l.address}</span>
            <span style={{ width: 120 }}>{l.op}</span>
            <span>{l.args}</span>
          </div>
        );
      })}
    </div>
  );
};

const StationX: React.FC = () => (
  <>
    <Place x={960} y={88} at={0.8} seed="x-title">
      <Big size={88}>暗号藏在哪？翻游戏代码</Big>
    </Place>
    <Place x={600} y={525} at={1.6} tilt={-1.5} seed="x-code">
      <CodeCard />
    </Place>
    {CODE.map((l, i) => {
      const note = CODE_NOTES[l.address];
      if (note === undefined) return null;
      return (
        <React.Fragment key={l.address}>
          <Arrow from={[1010, lineY(i)]} to={[1160, lineY(i)]} at={note.at - 0.3} />
          <Place x={1440} y={lineY(i)} at={note.at} tilt={i % 2 ? 2 : -2} seed={`note-${i}`}>
            <Tag text={note.text} size={40} color={note.color} />
          </Place>
        </React.Fragment>
      );
    })}
    <Place x={960} y={975} at={6.6} tilt={-1} seed="x-salt">
      <Card color={col.mint} style={{ padding: "14px 30px", textAlign: "center" }}>
        <div style={{ fontSize: 38 }}>顺着 ① 往里看：算指纹时，信纸后面还拼了 20 个字符</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 40, marginTop: 6, fontFamily: font.mono, fontSize: 40 }}>
          <span>iOS 3Nc9●●●●●●●●●●●●Sb69</span>
          <span>PSP S)R?●●●●●●●●●●●●●●wR</span>
        </div>
      </Card>
    </Place>
  </>
);

// --- D: moving the letter ------------------------------------------------------------------

const Money: React.FC<{ label: string; value: number; bytes: string; color: string }> = ({ label, value, bytes, color }) => (
  <Card color={color} style={{ textAlign: "center", padding: "14px 34px" }}>
    <div style={{ fontSize: 40 }}>{label}</div>
    <div style={{ fontFamily: font.number, fontSize: 110, lineHeight: 1.1 }}>{value} z</div>
    <div
      style={{ fontFamily: font.mono, fontSize: 40, background: "#fff", border: `4px solid ${ink}`, borderRadius: 10, padding: "4px 14px" }}
    >
      {bytes}
    </div>
  </Card>
);

const RULER_X = 260;
const HEAD = 300;
const BLOCKS = [
  { w: 200, color: col.blue, label: "A" },
  { w: 280, color: col.pink, label: "怪物记录" },
  { w: 200, color: col.purple, label: "C" },
  { w: 200, color: col.orange, label: "D" },
];
const EXTRA = 240;
const GAPS = [0, 30, 40, 30];
const GAP_TEXT = ["", "+4", "+104", "+8"];

const Block: React.FC<{ x: number; y: number; w: number; color: string; text: string; at: number }> = ({ x, y, w, color, text, at }) => {
  const t = useSec();
  const show = ramp(t, at, 0.35);
  if (show <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: 96,
        background: color,
        border: `6px solid ${ink}`,
        borderRadius: 10,
        boxShadow: `6px 6px 0 ${ink}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font.body,
        fontSize: 32,
        color: ink,
        scale: `1 ${show}`,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {text}
    </div>
  );
};

const Ruler: React.FC<{ at: number }> = ({ at }) => {
  const t = useSec();
  const pspY = 860;
  const iosY = 1060;
  const iosX: number[] = [];
  const pspX: number[] = [];
  let ix = RULER_X + HEAD;
  let px = RULER_X + HEAD + EXTRA;
  BLOCKS.forEach((b, i) => {
    px += GAPS[i];
    iosX.push(ix);
    pspX.push(px);
    ix += b.w;
    px += b.w;
  });
  return (
    <>
      <Place x={960} y={740} at={at} seed="ruler-title">
        <Big size={70}>每个角色的信纸：后半截错位了</Big>
      </Place>
      <Place x={160} y={pspY + 48} at={at + 0.3} seed="psp-tag">
        <Tag text="PSP" size={40} color={col.white} />
      </Place>
      <Place x={160} y={iosY + 48} at={at + 0.3} seed="ios-tag">
        <Tag text="iOS" size={40} color={col.white} />
      </Place>
      <Block x={RULER_X} y={pspY} w={HEAD} color={col.mint} text="前 412,064 字节" at={at + 0.5} />
      <Block x={RULER_X} y={iosY} w={HEAD} color={col.mint} text="前 412,064 字节" at={at + 0.5} />
      <Block x={RULER_X + HEAD} y={pspY} w={EXTRA} color="#BDBDBD" text="多出 10,372" at={at + 1.0} />
      {BLOCKS.map((b, i) => (
        <React.Fragment key={b.label}>
          <Block x={pspX[i]} y={pspY} w={b.w} color={b.color} text={b.label} at={at + 1.3 + i * 0.25} />
          {GAPS[i] > 0 && (
            <div
              style={{
                position: "absolute",
                left: pspX[i] - GAPS[i] - 10,
                top: pspY - 58,
                width: GAPS[i] + 20,
                textAlign: "center",
                fontFamily: font.number,
                fontSize: 34,
                color: col.red,
                opacity: ramp(t, at + 2.4, 0.3),
              }}
            >
              {GAP_TEXT[i]}
            </div>
          )}
          <Arrow from={[pspX[i] + b.w / 2, pspY + 100]} to={[iosX[i] + b.w / 2, iosY - 6]} at={at + 2.8 + i * 0.3} color={col.red} />
          <Block x={iosX[i]} y={iosY} w={b.w} color={b.color} text={b.label} at={at + 3.0 + i * 0.3} />
        </React.Fragment>
      ))}
      <Place x={960} y={1250} at={at + 4.4} tilt={-1} seed="ruler-say">
        <Tag text="一块一块往前挪 10,372 ～ 10,488 字节" size={44} color={col.yellow} />
      </Place>
    </>
  );
};

const StationD: React.FC = () => {
  return (
    <>
      <Place x={960} y={110} at={0.8} seed="d-title">
        <Big size={100}>信纸也得搬家</Big>
      </Place>
      <Place x={960} y={240} at={1.3} tilt={-1} seed="d-sub">
        <Tag text="先找钱放哪：卖两样东西做实验" size={44} color={col.white} />
      </Place>
      <Place x={480} y={500} at={1.9} tilt={-3} seed="before">
        <Money label="卖之前" value={data.moneyBeforeValue} bytes={data.moneyBefore} color={col.cream} />
      </Place>
      <Arrow from={[730, 500]} to={[1150, 500]} bend={-0.15} at={2.6} />
      <Place x={1440} y={500} at={3.0} tilt={3} seed="after">
        <Money label="卖之后" value={data.moneyAfterValue} bytes={data.moneyAfter} color={col.yellow} />
      </Place>
      <Place x={960} y={330} at={3.4} tilt={6} seed="sell">
        <Tag text="卖 2 瓶药" size={34} color={col.pink} />
      </Place>
      <Place x={960} y={640} at={3.9} tilt={-2} seed="little-endian">
        <Card color={col.white} style={{ fontSize: 36, padding: "10px 24px" }}>
          倒着读：<span style={{ fontFamily: font.mono }}>0x0179</span> = 377
        </Card>
      </Place>
      <Place x={1440} y={330} at={4.4} tilt={-8} seed="money-here">
        <Stamp text="这 4 个字节就是钱" size={44} color={col.red} />
      </Place>
      <Ruler at={6.0} />
      <Repack at={10.8} />
    </>
  );
};

/** Monster records: two 16-bit numbers on PSP, one 32-bit number on iOS. */
const Repack: React.FC<{ at: number }> = ({ at }) => {
  const box = (text: string, color: string) => (
    <div
      style={{
        fontFamily: font.mono,
        fontSize: 52,
        background: color,
        border: `6px solid ${ink}`,
        borderRadius: 12,
        boxShadow: `6px 6px 0 ${ink}`,
        padding: "10px 22px",
      }}
    >
      {text}
    </div>
  );
  return (
    <>
      <Place x={960} y={1380} at={at} seed="repack-title">
        <Big size={70}>怪物记录 31 条：两格并成一格</Big>
      </Place>
      <Place x={380} y={1540} at={at + 0.6} tilt={-2} seed="repack-psp">
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          {box("03 00", col.pink)}
          {box("15 00", col.blue)}
        </div>
      </Place>
      <Place x={380} y={1650} at={at + 0.9} seed="repack-psp-tag">
        <Tag text="PSP：a = 3，b = 21" size={36} />
      </Place>
      <Arrow from={[620, 1540]} to={[790, 1540]} at={at + 1.3} />
      <Place x={960} y={1540} at={at + 1.6} tilt={3} seed="formula">
        <Card color={col.yellow} style={{ fontFamily: font.number, fontSize: 56, padding: "12px 28px" }}>
          a + b × 128
        </Card>
      </Place>
      <Arrow from={[1140, 1540]} to={[1300, 1540]} at={at + 2.1} />
      <Place x={1530} y={1540} at={at + 2.4} tilt={-2} seed="repack-ios">
        {box("83 0A 00 00", col.mint)}
      </Place>
      <Place x={1530} y={1650} at={at + 2.8} seed="repack-ios-tag">
        <Tag text="iOS：3 + 21 × 128 = 2,691" size={36} />
      </Place>
    </>
  );
};

// --- E: the whole conversion ---------------------------------------------------------------

const STEPS = [
  { title: "拆外层", sub: "KIRK 解密", color: col.blue },
  { title: "拆内层", sub: "反查表 + LCG", color: col.purple },
  { title: "搬家", sub: "挪块 + 并格", color: col.mint },
  { title: "重算指纹", sub: "换 iOS 暗号", color: col.pink },
  { title: "封内层", sub: "查表 + LCG", color: col.purple },
  { title: "封外层", sub: "AES 加密", color: col.orange },
];
const STEP_POS = [
  [360, 400],
  [910, 400],
  [1460, 400],
  [360, 820],
  [910, 820],
  [1460, 820],
];
const STEP_AT = (i: number) => 1.6 + i * 0.9;

/** What the save looks like after step `i` (-1: as it comes off the PSP). */
const tokenArt = (i: number) => {
  if (i < 0) return <Envelope color={col.blue} locked={col.yellow} />;
  if (i === 0) return <Envelope color={col.purple} locked={col.mint} />;
  if (i <= 2) return <Letter />;
  if (i === 3) return <Print color={col.pink} />;
  if (i === 4) return <Envelope color={col.purple} locked={col.mint} />;
  return <Envelope color={col.orange} locked={col.yellow} />;
};

const Token: React.FC = () => {
  const t = useSec();
  const stops: [number, number][] = [[-60, 400], ...STEP_POS.map(([x, y]) => [x, y - 200] as [number, number]), [1960, 640]];
  // Arrive at step i at STEP_AT(i); leave for the phone after the last one.
  const times = [1.0, ...STEPS.map((_, i) => STEP_AT(i)), STEP_AT(5) + 1.1];
  if (t < 0.9) return null;
  let k = 0;
  while (k < times.length - 1 && t >= times[k + 1]) k++;
  const next = Math.min(k + 1, stops.length - 1);
  const p = ramp(t, times[next] - 0.45, 0.45);
  const x = interpolate(p, [0, 1], [stops[k][0], stops[next][0]]);
  const y = interpolate(p, [0, 1], [stops[k][1], stops[next][1]]) - Math.sin(p * Math.PI) * 90;
  const step = (p >= 1 ? next : k) - 1;
  const done = t > times[times.length - 1];
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        translate: "-50% -50%",
        scale: done ? "0.35" : "0.5",
        rotate: `${Math.sin(t * 6) * 4}deg`,
      }}
    >
      {tokenArt(Math.min(step, 5))}
    </div>
  );
};

const StationE: React.FC = () => (
  <>
    <Place x={960} y={90} at={0.6} seed="e-title">
      <Big size={110}>PSP → iOS 全流程</Big>
    </Place>
    <Place x={-60} y={430} at={0.9} tilt={-6} seed="e-psp">
      <Psp scale={0.65} />
    </Place>
    {STEPS.map((s, i) => (
      <React.Fragment key={s.title}>
        <Place x={STEP_POS[i][0]} y={STEP_POS[i][1] + 60} at={STEP_AT(i)} tilt={i % 2 ? 2 : -2} seed={`step-${i}`}>
          <Card color={s.color} style={{ textAlign: "center", minWidth: 380, padding: "14px 24px" }}>
            <div style={{ fontFamily: font.title, fontSize: 64 }}>{s.title}</div>
            <div style={{ fontSize: 36 }}>{s.sub}</div>
          </Card>
        </Place>
        <Place x={STEP_POS[i][0] - 200} y={STEP_POS[i][1] - 10} at={STEP_AT(i) + 0.1} seed={`step-badge-${i}`}>
          <Badge n={i + 1} color={col.white} size={90} />
        </Place>
      </React.Fragment>
    ))}
    <Arrow from={[565, 460]} to={[705, 460]} at={STEP_AT(1) - 0.3} />
    <Arrow from={[1115, 460]} to={[1255, 460]} at={STEP_AT(2) - 0.3} />
    <Arrow from={[1500, 570]} to={[380, 690]} bend={0.12} at={STEP_AT(3) - 0.4} />
    <Arrow from={[565, 880]} to={[705, 880]} at={STEP_AT(4) - 0.3} />
    <Arrow from={[1115, 880]} to={[1255, 880]} at={STEP_AT(5) - 0.3} />
    <Place x={1960} y={640} at={STEP_AT(5) + 0.4} tilt={6} seed="e-phone">
      <Phone scale={1} />
    </Place>
    <Place x={1960} y={640} at={STEP_AT(5) + 1.6} tilt={-10} seed="e-ok">
      <Stamp text="读出来了！" color="#1E9E5A" size={74} />
    </Place>
    <Token />
  </>
);

// --- F: the result ---------------------------------------------------------------------------

const StationF: React.FC = () => (
  <>
    <Place x={250} y={600} at={0.3} tilt={-6} seed="f-poor">
      <Hunter mood="cry" scale={0.7} />
    </Place>
    <Arrow from={[400, 560]} to={[560, 520]} bend={-0.2} at={0.8} />
    <Place x={700} y={540} at={1.0} seed="f-rich">
      <Hunter rich mood="happy" scale={1.5} />
    </Place>
    {[
      [560, 170, col.yellow, 0.7],
      [1000, 220, col.pink, 0.5],
      [960, 860, col.mint, 0.55],
    ].map(([x, y, c, s], i) => (
      <Place key={i} x={x as number} y={y as number} at={1.3 + i * 0.2} tilt={i * 20} seed={`star-${i}`}>
        <Star color={c as string} scale={s as number} />
      </Place>
    ))}
    <Place x={1450} y={190} at={1.6} tilt={-6} seed="f-zero">
      <Stamp text="来回转换 0 字节差异" size={60} color={col.red} />
    </Place>
    <Place x={1450} y={360} at={2.4} tilt={2} seed="f-check">
      <Card color={col.white} style={{ fontSize: 38, padding: "12px 26px", lineHeight: 1.5 }}>
        钱 ✓　公会卡 ✓　讨伐数 ✓
        <br />
        训练所记录 ✓　怪物记录 ✓
      </Card>
    </Place>
    <Place x={1450} y={540} at={3.2} tilt={-2} seed="f-android">
      <Tag text="安卓启动器：一键「导入 PSP 存档」" size={42} color={col.mint} />
    </Place>
    <Place x={1400} y={720} at={4.2} tilt={-3} seed="f-version">
      <Big size={104}>UFtouchHLE v0.3.25</Big>
    </Place>
    <Place x={1400} y={870} at={5.0} tilt={1} seed="f-tool">
      <Tag text="转换器 mhp2g-save-tools · Rust · GPL-3.0" size={36} color={col.white} />
    </Place>
  </>
);

export const SaveCrackFull: React.FC = () => {
  const musicVolume = (f: number) => 0.55 * (1 - ramp(f / 30, FULL_SECONDS - 1.5, 1.5));
  return (
    <>
      <Canvas shots={shots} shakes={[3.0, 32.4, 60.8]} width={14000}>
        <StationA />
        <StationB />
        <Station x0={4540} from={16.0}>
          <StationX />
        </Station>
        <Station x0={2200} from={9.0}>
          <StationC ending={false} />
        </Station>
        <Station x0={8940} from={36.0}>
          <StationD />
        </Station>
        <Station x0={11340} from={51.0}>
          <StationE />
        </Station>
        <Station x0={11340} y0={1010} from={59.0}>
          <StationF />
        </Station>
      </Canvas>
      <Audio src={staticFile("savecrack/music.wav")} volume={musicVolume} />
      <Sfx src="sfx_whoosh" at={1.6} volume={0.45} />
      <Sfx src="sfx_ok" at={3.0} volume={0.3} />
      <Sfx src="sfx_whoosh" at={5.9} volume={0.4} />
      {parts.map((p) => (
        <Sfx key={p.n} src="sfx_type" at={p.at} volume={0.5} />
      ))}
      <Sfx src="sfx_whoosh" at={15.9} volume={0.4} />
      {Object.values(CODE_NOTES).map((n) => (
        <Sfx key={n.text} src="sfx_type" at={16 + n.at} volume={0.5} />
      ))}
      <Sfx src="sfx_ok" at={22.6} volume={0.35} />
      <Sfx src="sfx_whoosh" at={25.1} volume={0.4} />
      <Sfx src="sfx_ok" at={32.4} volume={0.5} />
      <Sfx src="sfx_ok" at={35.0} volume={0.35} />
      <Sfx src="sfx_whoosh" at={35.9} volume={0.4} />
      <Sfx src="sfx_ok" at={40.4} volume={0.4} />
      <Sfx src="sfx_whoosh" at={41.0} volume={0.35} />
      <Sfx src="sfx_whoosh" at={45.7} volume={0.35} />
      <Sfx src="sfx_ok" at={50.6} volume={0.35} />
      <Sfx src="sfx_whoosh" at={51.1} volume={0.45} />
      {STEPS.map((s, i) => (
        <Sfx key={s.title} src="sfx_type" at={51 + STEP_AT(i)} volume={0.5} />
      ))}
      <Sfx src="sfx_ok" at={51 + STEP_AT(5) + 1.6} volume={0.5} />
      <Sfx src="sfx_whoosh" at={58.9} volume={0.45} />
      <Sfx src="sfx_ok" at={60.6} volume={0.5} />
      <Sfx src="sfx_ok" at={63.2} volume={0.5} />
    </>
  );
};
