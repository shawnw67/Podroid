// Sticker-style sample of the save-crack video: one wide canvas, the camera
// pushes from "it doesn't load" to how a save is built to how its fingerprint
// is checked.

import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { Envelope, Hunter, Key, Letter, Machine, Phone, Print, Psp, Stamp } from "./art";
import { Arrow, Badge, Big, Canvas, Card, col, CountUp, font, ink, Place, ramp, Shot, Tag, useSec } from "./kit";

export const STICKER_SECONDS = 30;

const shots: Shot[] = [
  { at: 0, x: 960, y: 540, zoom: 1 },
  { at: 5.6, x: 960, y: 560, zoom: 1.06 },
  { at: 7.4, x: 2900, y: 540, zoom: 0.95 },
  { at: 12.6, x: 2920, y: 560, zoom: 0.97 },
  { at: 14.4, x: 3560, y: 760, zoom: 1.1 },
  { at: 17.6, x: 5500, y: 540, zoom: 1 },
  { at: 24.0, x: 5500, y: 560, zoom: 1 },
  { at: 25.6, x: 5500, y: 880, zoom: 1 },
  { at: 29.6, x: 5520, y: 900, zoom: 1.05 },
];

export const Sfx: React.FC<{ src: string; at: number; volume?: number }> = ({ src, at, volume = 0.6 }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.round(at * fps)} layout="none">
      <Audio src={staticFile(`savecrack/${src}.wav`)} volume={volume} />
    </Sequence>
  );
};

// --- A: it doesn't load --------------------------------------------------------------

/** The save flies from the console to the phone between `at` and `at + 1.2`. */
const FlyingSave: React.FC<{ at: number }> = ({ at }) => {
  const t = useSec();
  const p = ramp(t, at, 1.2);
  if (t < at - 0.6) return null;
  const x = interpolate(p, [0, 1], [470, 1520]);
  const y = 420 - Math.sin(p * Math.PI) * 170;
  const appear = ramp(t, at - 0.6, 0.4);
  return (
    <div style={{ position: "absolute", left: x, top: y, translate: "-50% -50%", scale: `${0.7 * appear}`, rotate: `${-10 + p * 20}deg` }}>
      <Envelope label="savedata.dat" />
    </div>
  );
};

export const StationA: React.FC = () => (
  <>
    <Place x={960} y={110} at={0.2} seed="a-title">
      <Big size={104}>PSP 存档 → 手机版？</Big>
    </Place>
    <Place x={470} y={420} at={0.5} tilt={-4} seed="psp">
      <Psp scale={1.15} />
    </Place>
    <Place x={1520} y={430} at={0.8} tilt={5} seed="phone">
      <Phone scale={1.1} />
    </Place>
    <FlyingSave at={1.6} />
    <Place x={960} y={650} at={1.3} tilt={-2} seed="size">
      <Card color={col.yellow} style={{ fontSize: 48, display: "flex", alignItems: "baseline", gap: 16 }}>
        一个存档
        <span style={{ fontFamily: font.number, fontSize: 80 }}>
          <CountUp to={1483024} at={1.3} duration={1.2} />
        </span>
        字节
      </Card>
    </Place>
    <Place x={1520} y={430} at={3.0} tilt={-12} seed="fail">
      <Stamp text="读不出来！" size={96} />
    </Place>
    <Place x={720} y={870} at={3.5} seed="cry">
      <Hunter mood="cry" scale={0.95} />
    </Place>
    <Place x={1130} y={880} at={4.0} tilt={4} seed="cry-say">
      <Tag text="我的 200 小时……" size={54} />
    </Place>
  </>
);

// --- B: a save is a letter in two envelopes --------------------------------------------

export const parts = [
  {
    n: 1,
    at: 7.6,
    title: "外层信封",
    lines: ["PSP：KIRK 加密", "iOS：AES 加密"],
    color: col.blue,
    draw: <Envelope color={col.blue} locked={col.yellow} scale={0.95} />,
  },
  {
    n: 2,
    at: 8.6,
    title: "内层信封",
    lines: ["查表 + 两串", "随机数打乱"],
    color: col.purple,
    draw: <Envelope color={col.purple} locked={col.mint} scale={0.95} />,
  },
  { n: 3, at: 9.6, title: "信纸", lines: ["钱、道具、任务…", "1,482,984 字节"], color: col.cream, draw: <Letter scale={0.9} /> },
  { n: 4, at: 10.6, title: "指纹", lines: ["SHA-1", "20 字节"], color: col.pink, draw: <Print scale={0.95} /> },
  { n: 5, at: 11.4, title: "钥匙", lines: ["随机种子", "4 字节"], color: col.yellow, draw: <Key scale={0.85} /> },
];

const PART_X = (i: number) => 2100 + i * 400;

export const StationB: React.FC = () => (
  <>
    <Place x={2900} y={110} at={6.6} seed="b-title">
      <Big size={100}>拆开一个存档</Big>
    </Place>
    {parts.map((p, i) => (
      <React.Fragment key={p.n}>
        <Place x={PART_X(i)} y={390} at={p.at} tilt={i % 2 ? 3 : -3} seed={`part-${i}`}>
          {p.draw}
        </Place>
        <Place x={PART_X(i) - 140} y={250} at={p.at + 0.15} seed={`badge-${i}`}>
          <Badge n={p.n} color={p.color} size={90} />
        </Place>
        <Place x={PART_X(i)} y={660} at={p.at + 0.3} tilt={i % 2 ? -2 : 2} seed={`label-${i}`}>
          <Card color={p.color} style={{ textAlign: "center", padding: "12px 20px", minWidth: 320 }}>
            <div style={{ fontFamily: font.title, fontSize: 56 }}>{p.title}</div>
            {p.lines.map((l) => (
              <div key={l} style={{ fontSize: 32 }}>
                {l}
              </div>
            ))}
          </Card>
        </Place>
        {i > 0 && <Arrow from={[PART_X(i - 1) + 150, 330]} to={[PART_X(i) - 170, 330]} bend={-0.25} at={p.at - 0.35} />}
      </React.Fragment>
    ))}
    <ByteRuler at={12.4} />
  </>
);

/** The whole save as one bar: the letter is nearly all of it. */
const ByteRuler: React.FC<{ at: number }> = ({ at }) => {
  const t = useSec();
  const grow = ramp(t, at, 0.9);
  if (t < at) return null;
  const left = 1960;
  const width = 1880;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left,
          top: 860,
          width: width * grow,
          height: 84,
          background: col.cream,
          border: `6px solid ${ink}`,
          borderRadius: 14,
          boxShadow: `8px 8px 0 ${ink}`,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          paddingLeft: 28,
          fontFamily: font.body,
          fontSize: 44,
          color: ink,
          whiteSpace: "nowrap",
        }}
      >
        信纸占了 99.998%
      </div>
      <Place x={left + width / 2} y={1000} at={at + 0.4} seed="ruler-total">
        <Tag text="整个存档 1,483,008 字节" size={42} color={col.white} />
      </Place>
      <Arrow from={[left + width - 10, 860]} to={[3960, 790]} bend={-0.25} at={at + 1.4} color={col.red} />
      <Place x={4180} y={760} at={at + 1.8} tilt={-3} seed="zoom">
        <Card color={col.white} style={{ padding: 20 }}>
          <div style={{ fontSize: 38, marginBottom: 12 }}>放大最后一小截</div>
          <div style={{ display: "flex", height: 96, border: `5px solid ${ink}`, borderRadius: 10, overflow: "hidden", fontSize: 36 }}>
            <div style={{ width: 70, background: col.cream, display: "flex", alignItems: "center", justifyContent: "center" }}>…</div>
            <div
              style={{
                width: 230,
                background: col.pink,
                borderLeft: `5px solid ${ink}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              指纹 20
            </div>
            <div
              style={{
                width: 140,
                background: col.yellow,
                borderLeft: `5px solid ${ink}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              钥匙 4
            </div>
          </div>
        </Card>
      </Place>
      <Place x={4120} y={990} at={at + 2.6} tilt={2} seed="check-first">
        <Tag text="游戏读档第一件事：对指纹" size={44} color={col.yellow} />
      </Place>
    </>
  );
};

// --- C: how the fingerprint is made --------------------------------------------------

export const StationC: React.FC<{ ending?: boolean }> = ({ ending = true }) => {
  const t = useSec();
  return (
    <>
      <Place x={5500} y={110} at={17.0} seed="c-title">
        <Big size={100}>指纹怎么算？</Big>
      </Place>
      <Place x={4840} y={370} at={18.0} tilt={-5} seed="c-letter">
        <Letter scale={0.8} />
      </Place>
      <Place x={4840} y={570} at={18.2} seed="c-letter-tag">
        <Tag text="信纸" size={40} />
      </Place>
      <Place x={4840} y={665} at={18.5} seed="plus">
        <Big size={90} color={col.white}>
          +
        </Big>
      </Place>
      <Place x={4920} y={810} at={18.8} tilt={3} seed="secret">
        <Card color={col.mint} style={{ textAlign: "center", padding: "12px 24px" }}>
          <div style={{ fontSize: 36 }}>暗号（藏在游戏里）</div>
          <div style={{ fontFamily: font.mono, fontSize: 40, letterSpacing: 1 }}>3Nc9●●●●●●●●●●●●Sb69</div>
        </Card>
      </Place>
      <Arrow from={[4980, 330]} to={[5370, 260]} bend={-0.15} at={19.4} />
      <Arrow from={[5190, 740]} to={[5400, 300]} bend={0.2} at={19.6} />
      <Place x={5530} y={500} at={18.6} seed="machine">
        <Machine running={t > 20 && t < 22.2} scale={1} />
      </Place>
      <Arrow from={[5800, 600]} to={[6060, 420]} bend={-0.2} at={22.0} />
      <Place x={6180} y={400} at={22.2} tilt={-4} seed="out">
        <Print color={col.orange} scale={0.72} />
      </Place>
      <Place x={6180} y={235} at={22.4} tilt={4} seed="out-tag">
        <Tag text="算出来的" size={36} />
      </Place>
      <Place x={6180} y={585} at={22.7} seed="eq">
        <Big size={96} color={col.white}>
          =
        </Big>
      </Place>
      <Place x={6180} y={770} at={22.9} tilt={4} seed="stored">
        <Print color={col.pink} scale={0.72} />
      </Place>
      <Place x={6180} y={935} at={23.0} tilt={-4} seed="stored-tag">
        <Tag text="信里存的" size={36} />
      </Place>
      <Place x={6180} y={585} at={23.4} tilt={-10} seed="match">
        <Stamp text="对上了！" color="#1E9E5A" size={84} />
      </Place>
      <Place x={5200} y={1080} at={24.6} tilt={-2} seed="salt">
        <Card color={col.yellow} style={{ fontSize: 42, padding: "14px 26px" }}>
          PSP 和 iOS 暗号不同 → 换平台要
          <span style={{ fontFamily: font.title }}>换暗号重算</span>
        </Card>
      </Place>
      <Place x={5100} y={1210} at={26.0} tilt={2} seed="four">
        <Tag text="4 个真存档全部验证 ✓" size={46} color={col.mint} />
      </Place>
      {ending && (
        <>
          <Place x={6100} y={1200} at={26.8} seed="happy">
            <Hunter rich mood="happy" scale={0.95} />
          </Place>
          <Place x={5200} y={1340} at={28.0} seed="next">
            <Big size={76} color={col.pink}>
              下一站：搬家 →
            </Big>
          </Place>
        </>
      )}
    </>
  );
};

export const StickerSample: React.FC = () => {
  const musicVolume = (f: number) => 0.55 * (1 - ramp(f / 30, STICKER_SECONDS - 1.2, 1.2));
  return (
    <AbsoluteFill>
      <Canvas shots={shots} shakes={[3.0, 23.4]} width={6800}>
        <StationA />
        <StationB />
        <StationC />
      </Canvas>
      <Audio src={staticFile("savecrack/music.wav")} volume={musicVolume} />
      <Sfx src="sfx_whoosh" at={1.6} volume={0.45} />
      <Sfx src="sfx_ok" at={3.0} volume={0.3} />
      <Sfx src="sfx_whoosh" at={5.9} volume={0.4} />
      {parts.map((p) => (
        <Sfx key={p.n} src="sfx_type" at={p.at} volume={0.5} />
      ))}
      <Sfx src="sfx_whoosh" at={15.9} volume={0.4} />
      <Sfx src="sfx_ok" at={23.4} volume={0.5} />
      <Sfx src="sfx_whoosh" at={24.1} volume={0.35} />
      <Sfx src="sfx_ok" at={26.0} volume={0.35} />
    </AbsoluteFill>
  );
};
