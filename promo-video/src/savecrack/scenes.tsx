// The scenes of the save-crack video. Times inside a scene are in seconds
// from the scene's start.
//
// The story: a hunter whose save won't load is broke and in tears; the save
// (an envelope) gets cracked step by step; at the end it loads and the
// hunter's fancy gear is back.

import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { fonts } from "../theme";
import data from "./data.json";
import {
  Aurora,
  Bubble,
  Coin,
  Confetti,
  Fingerprint as FingerprintArt,
  Hunter,
  Kitty,
  Mascot,
  palette,
  Phone,
  Psp,
  ScreenLabel,
  Sparkles,
  Truck,
  Wyvern,
} from "./fun";
import { c, Caption, Check, Chip, Counter, Headline, Panel, ramp, Typed, usePop, useSec } from "./ui";

/** A sound effect at `at` seconds into the scene. */
const Sfx: React.FC<{ src: string; at: number; volume?: number }> = ({ src, at, volume = 0.6 }) => {
  const { fps } = useVideoConfig();
  return (
    <Sequence from={Math.round(at * fps)} layout="none">
      <Audio src={staticFile(`savecrack/${src}.wav`)} volume={volume} />
    </Sequence>
  );
};

/** Keystroke sounds while `text` is typed at `cps` chars/s. */
const TypingSfx: React.FC<{ text: string; from: number; cps?: number }> = ({ text, from, cps = 28 }) => (
  <>
    {Array.from({ length: Math.ceil(text.length / 3) }, (_, i) => (
      <Sfx key={i} src="sfx_type" at={from + (i * 3) / cps} volume={0.35} />
    ))}
  </>
);

/** Positions children at (x, y), fading them in over [from, from + 0.5] and
 * out over [until, until + 0.4]. */
const Place: React.FC<{
  x: number;
  y: number;
  from?: number;
  until?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ x, y, from = 0, until = Infinity, children, style }) => {
  const t = useSec();
  const show = ramp(t, from, 0.5) * (1 - ramp(t, until, 0.4));
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: show, scale: `${0.8 + 0.2 * show}`, ...style }}>
      {children}
    </div>
  );
};

// --- 1. Opening -----------------------------------------------------------------

/** A poster-style title card: night sky, moon, mountains, a wyvern flying by. */
const TitleCard: React.FC<{ from: number }> = ({ from }) => {
  const t = useSec();
  const show = ramp(t, from, 0.6);
  const shrink = ramp(t, from + 2.0, 0.8);
  return (
    <AbsoluteFill style={{ opacity: show }}>
      <svg width="1920" height="1080" style={{ position: "absolute", opacity: 1 - shrink * 0.6 }}>
        <defs>
          <radialGradient id="moon">
            <stop offset="0%" stopColor="#FFF6D6" />
            <stop offset="70%" stopColor="#FFE29A" />
            <stop offset="100%" stopColor="#FFE29A" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={1460} cy={260 - (1 - show) * 60} r="190" fill="url(#moon)" />
        <path d="M0 820 L220 600 L360 720 L560 470 L760 700 L900 610 L1100 780 L1300 560 L1520 760 L1700 620 L1920 760 L1920 1080 L0 1080 Z" fill="#2A1E52" opacity="0.9" />
        <path d="M0 900 L260 760 L480 860 L700 720 L980 880 L1240 740 L1500 880 L1720 790 L1920 860 L1920 1080 L0 1080 Z" fill="#1A1238" />
      </svg>
      <div style={{ position: "absolute", left: interpolate(t - from, [0, 3], [-300, 1700]), top: 140 }}>
        <Wyvern size={220} />
      </div>
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 330 - shrink * 220,
          scale: `${1 - shrink * 0.35}`,
        }}
      >
        <div style={{ fontFamily: fonts.sans, fontSize: 46, color: "#FFE29A", letterSpacing: 10, textShadow: "0 0 20px #FFB84D" }}>
          怪物猎人 携带版 2nd G
        </div>
        <div
          style={{
            marginTop: 14,
            fontFamily: fonts.sans,
            fontSize: 150,
            fontWeight: 800,
            background: "linear-gradient(180deg, #FFFFFF 0%, #FFE29A 60%, #FF9F5A 100%)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 6px 24px rgba(255, 150, 80, 0.55))",
            letterSpacing: 8,
          }}
        >
          存档大搬家
        </div>
        <div style={{ marginTop: 6, fontFamily: fonts.latin, fontSize: 54, fontWeight: 700, color: "#FFFFFF", letterSpacing: 6 }}>
          <span style={{ color: palette.violet }}>PSP</span> → <span style={{ color: palette.teal }}>iOS</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** The envelope leaps from the PSP's screen into the phone's. */
const Leap: React.FC<{ from: number }> = ({ from }) => {
  const t = useSec();
  const devices = ramp(t, from, 0.6);
  const p = ramp(t, from + 0.9, 1.2);
  // An arc from the PSP screen (left) to the phone screen (right).
  const x = interpolate(p, [0, 1], [430, 1340]);
  const y = 700 - Math.sin(p * Math.PI) * 150;
  const landed = p >= 1;
  return (
    <>
      <Psp width={640} style={{ left: 120 - (1 - devices) * 500, top: 620, opacity: devices }}>
        <ScreenLabel text="PSP 存档" color={palette.violet} />
      </Psp>
      <Phone width={600} style={{ left: 1200 + (1 - devices) * 500, top: 640, opacity: devices }}>
        <ScreenLabel text={landed ? "读档成功！" : "iOS 版"} color={landed ? palette.gold : palette.teal} />
      </Phone>
      {t >= from + 0.9 && (
        <div style={{ position: "absolute", left: x, top: y, rotate: `${p * 360}deg`, scale: `${landed ? 0 : 1}` }}>
          <Mascot mood="wow" size={170} />
        </div>
      )}
      <Sparkles x={1500} y={780} from={from + 2.1} spread={220} count={12} />
    </>
  );
};

export const Opening: React.FC = () => {
  const t = useSec();
  const alert = usePop(1.0);
  const sceneOut = ramp(t, 3.3, 0.4);
  return (
    <AbsoluteFill>
      <Aurora />
      {/* The broke hunter and the sad envelope. */}
      <AbsoluteFill style={{ opacity: 1 - sceneOut }}>
        <Place x={260} y={400}>
          <Hunter gear="poor" mood="cry" size={420} />
        </Place>
        <Place x={640} y={720}>
          <Kitty size={180} />
        </Place>
        <Bubble text="我的装备呢…" from={1.7} style={{ left: 640, top: 380 }} />
        <Place x={1170} y={560}>
          <Mascot mood="sad" size={300} />
        </Place>
        {/* The game's own alert. */}
        <div
          style={{
            position: "absolute",
            left: 1020,
            top: 230,
            width: 600,
            padding: "40px 0 30px",
            borderRadius: 32,
            background: "rgba(245, 246, 250, 0.97)",
            textAlign: "center",
            fontFamily: fonts.sans,
            boxShadow: "0 30px 90px rgba(0,0,0,0.55)",
            scale: `${alert}`,
            opacity: alert > 0.01 ? 1 : 0,
            translate: `${Math.sin(t * 60) * 7 * (1 - ramp(t, 1.1, 0.5))}px 0px`,
          }}
        >
          <div style={{ fontSize: 54, fontWeight: 700, color: "#D02840" }}>游戏存档已损坏</div>
          <div style={{ marginTop: 26, paddingTop: 20, borderTop: "2px solid #D6D9E0", fontSize: 38, color: "#2E6BD8" }}>确定</div>
        </div>
      </AbsoluteFill>
      <TitleCard from={3.4} />
      <Leap from={5.6} />
      <Sfx src="sfx_ok" at={1.0} volume={0.25} />
      <Sfx src="sfx_whoosh" at={3.3} volume={0.5} />
      <Sfx src="sfx_whoosh" at={6.5} volume={0.35} />
      <Sfx src="sfx_ok" at={7.7} volume={0.4} />
    </AbsoluteFill>
  );
};

// --- 3. The fingerprint -------------------------------------------------------------

const COMMAND = "grep CC_SHA1 MHP2G.disasm";

// Which lines of the check to point out, and what they mean.
const NOTES: Record<string, { text: string; color: string; at: number }> = {
  "3227a0": { text: "① 算出指纹", color: palette.blue, at: 4.2 },
  "3227b2": { text: "② 指纹 20 字节", color: palette.violet, at: 4.9 },
  "3227c8": { text: "③ 和信里的比对", color: palette.gold, at: 5.6 },
  "3227d2": { text: "④ 不一样 → 存档损坏", color: c.red, at: 6.3 },
};

const SAMPLES = ["存档 1", "存档 2", "存档 3", "存档 4"];

export const Fingerprint: React.FC = () => {
  const t = useSec();
  const codeIn = ramp(t, 3.4, 0.5);
  const codeOut = ramp(t, 7.0, 0.5);
  const formula = ramp(t, 7.3, 0.6);
  const allOk = 9.4 + 3 * 0.45;
  const mood = t >= allOk ? "happy" : t >= 4.2 ? "wow" : "think";
  return (
    <AbsoluteFill>
      <Aurora />
      <Headline text="游戏怎么知道信被拆过？" until={7.0} />
      <Headline text="每封信里藏着一枚「指纹」" from={7.3} />

      {/* Searching the game's code. */}
      <Panel title="终端" style={{ left: 160, top: 250, width: 1250, height: 220, opacity: 1 - ramp(t, 3.2, 0.4) }}>
        <div style={{ padding: "26px 36px", fontFamily: fonts.mono, fontSize: 36, color: c.text, lineHeight: "54px" }}>
          <div>
            <span style={{ color: c.green }}>$ </span>
            <Typed text={COMMAND} from={0.8} />
          </div>
          <div style={{ color: c.amber, opacity: ramp(t, 2.0, 0.2) }}>3227a0: bl SHA1 ← 读档时算了 SHA-1</div>
        </div>
      </Panel>

      {/* The check itself. */}
      <Panel
        title="游戏读档代码 · 0x322790"
        style={{ left: 120, top: 215, width: 880, height: 730, opacity: codeIn * (1 - codeOut), translate: `${(1 - codeIn) * 40}px 0px` }}
      >
        <div style={{ padding: "22px 36px", fontFamily: fonts.mono, fontSize: 31, lineHeight: "40px" }}>
          {data.checkCode
            .filter((line) => !/^(v|str)/.test(line.op))
            .map((line) => {
              const note = NOTES[line.address];
              const lit = note !== undefined && t >= note.at;
              return (
                <div
                  key={line.address}
                  style={{
                    color: lit ? note.color : c.muted,
                    fontWeight: lit ? 700 : 400,
                    background: lit ? `${note.color}22` : "transparent",
                    borderRadius: 8,
                  }}
                >
                  <span style={{ color: c.dim }}>{line.address} </span>
                  {line.op} {line.args}
                </div>
              );
            })}
        </div>
      </Panel>
      <div style={{ position: "absolute", left: 1050, top: 290, display: "flex", flexDirection: "column", gap: 30, opacity: 1 - codeOut }}>
        {Object.values(NOTES).map((note) => (
          <Chip key={note.text} text={note.text} color={note.color} from={note.at} />
        ))}
      </div>

      {/* The formula, then the four saves it was checked against. */}
      <AbsoluteFill style={{ alignItems: "center", opacity: formula }}>
        <div style={{ marginTop: 250, display: "flex", alignItems: "center", gap: 40 }}>
          <FingerprintArt size={150} from={7.4} />
          <div
            style={{
              padding: "30px 54px",
              borderRadius: 30,
              background: "rgba(255,255,255,0.1)",
              border: "2px solid rgba(255,255,255,0.25)",
              fontFamily: fonts.sans,
              fontSize: 60,
              color: c.text,
              scale: `${0.9 + 0.1 * formula}`,
            }}
          >
            指纹 = SHA-1（信的内容 + <span style={{ color: palette.gold }}>暗号</span>）
          </div>
        </div>
        <div style={{ marginTop: 26, fontFamily: fonts.mono, fontSize: 46, color: palette.gold, letterSpacing: 4 }}>
          暗号 “3Nc9<span style={{ color: "rgba(255,255,255,0.3)" }}>••••••••••••</span>Sb69”
        </div>
        <div style={{ marginTop: 46, display: "flex", gap: 50 }}>
          {SAMPLES.map((name, i) => (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "14px 26px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.08)",
                fontFamily: fonts.sans,
                fontSize: 40,
                color: c.text,
                opacity: ramp(t, 9.3 + i * 0.45, 0.2),
              }}
            >
              ✉️ {name}
              <Check from={9.4 + i * 0.45} size={50} />
            </div>
          ))}
        </div>
      </AbsoluteFill>

      {/* The envelope detective. */}
      <div style={{ position: "absolute", left: 1500, top: 640 }}>
        <Mascot mood={mood} size={300} magnifier={mood !== "happy"} hop={mood === "happy"} />
      </div>
      <Bubble text="让我查查…" from={0.6} until={3.2} style={{ left: 1380, top: 560 }} />
      <Bubble text="找到了！" from={4.2} until={6.9} style={{ left: 1430, top: 560 }} />
      <Confetti x={960} y={760} from={allOk} />
      <Caption text="4 份真实存档，指纹全部对上" from={allOk + 0.3} color={palette.gold} />

      <TypingSfx text={COMMAND} from={0.8} />
      {Object.values(NOTES).map((note) => (
        <Sfx key={note.text} src="sfx_type" at={note.at} volume={0.5} />
      ))}
      {SAMPLES.map((name, i) => (
        <Sfx key={name} src="sfx_ok" at={9.4 + i * 0.45} volume={0.35} />
      ))}
    </AbsoluteFill>
  );
};

// --- 7. Moving house ------------------------------------------------------------------

/** One character's data as a bar: the front part, optionally the PSP's extra
 * bytes, then the back part at `tailLeft`. */
const SlotBar: React.FC<{
  label: string;
  color: string;
  top: number;
  extra: boolean;
  tailLeft: number;
  truck?: boolean;
}> = ({ label, color, top, extra, tailLeft, truck = false }) => (
  <div style={{ position: "absolute", left: 140, top, width: 1640, height: 190 }}>
    <div style={{ fontFamily: fonts.sans, fontSize: 40, color, marginBottom: 14, fontWeight: 600 }}>{label}</div>
    <div style={{ position: "relative", height: 120 }}>
      <Block left={0} top={30} width={720} color={color} text="角色 · 道具 · 装备" />
      {extra && <Block left={740} top={30} width={320} color="rgba(200,200,230,0.25)" text="PSP 多出来的" light />}
      {truck ? (
        <Truck cargo={"钱 · 公会卡\n任务记录"} style={{ left: tailLeft - 30, top: -60, scale: "0.85" }} />
      ) : (
        <Block left={tailLeft} top={30} width={420} color={palette.gold} text="钱 · 公会卡 · 任务记录" />
      )}
    </div>
  </div>
);

const Block: React.FC<{ left: number; top: number; width: number; color: string; text: string; light?: boolean }> = ({
  left,
  top,
  width,
  color,
  text,
  light = false,
}) => (
  <div
    style={{
      position: "absolute",
      left,
      top,
      width,
      height: 76,
      borderRadius: 38,
      background: color,
      border: light ? "3px dashed rgba(255,255,255,0.5)" : "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: fonts.sans,
      fontSize: 32,
      fontWeight: 700,
      color: light ? "#FFFFFF" : "#2A1F3D",
      boxShadow: light ? "none" : "0 10px 24px rgba(0,0,0,0.3)",
    }}
  >
    {text}
  </div>
);

/** Coins flying from the left into the counter. */
const CoinRain: React.FC<{ from: number }> = ({ from }) => {
  const t = useSec();
  return (
    <>
      {Array.from({ length: 10 }, (_, i) => {
        const p = ramp(t, from + i * 0.08, 0.7);
        if (p <= 0 || p >= 1) return null;
        return (
          <Coin
            key={i}
            size={60}
            style={{
              left: interpolate(p, [0, 1], [140 + i * 30, 900]),
              top: interpolate(p, [0, 1], [900, 520]) - Math.sin(p * Math.PI) * (240 + i * 20),
              rotate: `${p * 540}deg`,
            }}
          />
        );
      })}
    </>
  );
};

/** One record written two ways, as two puzzle halves becoming one piece. */
const Repack: React.FC<{ from: number }> = ({ from }) => {
  const t = useSec();
  const join = ramp(t, from + 0.9, 0.7);
  const show = ramp(t, from, 0.5);
  return (
    <AbsoluteFill style={{ alignItems: "center", opacity: show }}>
      <div style={{ marginTop: 250, fontFamily: fonts.sans, fontSize: 46, color: "#D9D2F5" }}>
        还有一处换了写法：讨伐记录
      </div>
      <div style={{ marginTop: 50, display: "flex", alignItems: "center", gap: 70 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: fonts.latin, fontSize: 38, color: palette.violet, fontWeight: 700, marginBottom: 16 }}>PSP</div>
          <div style={{ display: "flex", gap: 26 * (1 - join) }}>
            {["03 00", "15 00"].map((b, i) => (
              <div
                key={b}
                style={{
                  padding: "20px 30px",
                  borderRadius: 18,
                  background: i ? palette.pink : palette.violet,
                  fontFamily: fonts.mono,
                  fontSize: 54,
                  color: "#FFFFFF",
                  rotate: `${(1 - join) * (i ? 6 : -6)}deg`,
                }}
              >
                {b}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontFamily: fonts.sans, fontSize: 70, color: "#FFFFFF" }}>→</div>
        <div style={{ textAlign: "center", opacity: join, scale: `${0.6 + 0.4 * join}` }}>
          <div style={{ fontFamily: fonts.latin, fontSize: 38, color: palette.teal, fontWeight: 700, marginBottom: 16 }}>iOS</div>
          <div
            style={{
              padding: "20px 34px",
              borderRadius: 18,
              background: `linear-gradient(90deg, ${palette.violet}, ${palette.pink})`,
              fontFamily: fonts.mono,
              fontSize: 54,
              color: "#FFFFFF",
              boxShadow: `0 0 40px ${palette.pink}88`,
            }}
          >
            83 0A 00 00
          </div>
        </div>
      </div>
      <div style={{ marginTop: 44, display: "flex", alignItems: "center", gap: 20, fontFamily: fonts.sans, fontSize: 46, color: palette.gold, opacity: ramp(t, from + 1.8, 0.3) }}>
        和游戏自己算出来的一模一样 <Check from={from + 1.9} size={58} />
      </div>
    </AbsoluteFill>
  );
};

export const Moving: React.FC = () => {
  const t = useSec();
  const moneyOut = ramp(t, 4.8, 0.4);
  const barsIn = ramp(t, 5.1, 0.5) * (1 - ramp(t, 8.6, 0.4));
  const drive = ramp(t, 6.2, 1.6);
  const repackOut = ramp(t, 11.6, 0.4);
  const finale = 12.0;
  const flash = interpolate(t, [finale - 0.15, finale, finale + 0.5], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rich = t >= finale;
  return (
    <AbsoluteFill>
      <Aurora />
      <Headline text="信拆开了，可东西放的位置不一样" until={finale - 0.4} />

      {/* Finding the money by selling something. */}
      <AbsoluteFill style={{ alignItems: "center", opacity: ramp(t, 0.5, 0.5) * (1 - moneyOut) }}>
        <div style={{ marginTop: 260, fontFamily: fonts.sans, fontSize: 46, color: "#D9D2F5" }}>
          在游戏里卖掉两样道具，再对比存档
        </div>
        <div style={{ marginTop: 44, display: "flex", alignItems: "center", gap: 60, fontFamily: fonts.mono, fontSize: 64 }}>
          <span style={{ color: "#A99FCF" }}>{data.moneyBefore}</span>
          <span style={{ color: "#FFFFFF", fontFamily: fonts.sans }}>→</span>
          <span style={{ color: palette.gold, opacity: ramp(t, 2.0, 0.3) }}>{data.moneyAfter}</span>
        </div>
        <div style={{ marginTop: 34, fontFamily: fonts.sans, fontSize: 90, fontWeight: 800, color: "#FFFFFF" }}>
          💰{" "}
          <span style={{ color: palette.gold }}>
            <Counter from={data.moneyBeforeValue} to={data.moneyAfterValue} start={2.0} duration={1.0} />
          </span>{" "}
          z
        </div>
        <div style={{ marginTop: 30 }}>
          <Chip text="找到了：这 4 个字节就是「钱」" color={palette.gold} from={3.1} />
        </div>
      </AbsoluteFill>
      <CoinRain from={2.0} />

      {/* The back half of each character's data moved. */}
      <div style={{ opacity: barsIn }}>
        <SlotBar label="PSP 版存档里的一个角色" color={palette.violet} top={280} extra tailLeft={1080} />
        <SlotBar label="iOS 版存档里的同一个角色" color={palette.teal} top={560} extra={false} tailLeft={1080 - 340 * drive} truck={drive < 1} />
        <div style={{ position: "absolute", left: 0, right: 0, top: 870, textAlign: "center", fontFamily: fonts.sans, fontSize: 46, color: palette.gold, opacity: ramp(t, 6.2, 0.4) }}>
          后半段往前挪 <Counter from={0} to={10488} start={6.2} duration={1.6} /> 字节，才能对上
        </div>
      </div>

      <div style={{ opacity: 1 - repackOut }}>
        {t >= 8.9 && <Repack from={8.9} />}
      </div>

      {/* Finale: the save loads and the gear is back. */}
      <AbsoluteFill style={{ opacity: ramp(t, finale - 0.3, 0.3) }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 120, textAlign: "center", fontFamily: fonts.sans, fontSize: 84, fontWeight: 800, color: "#FFFFFF", textShadow: `0 0 30px ${palette.gold}` }}>
          {rich ? "读档成功，豪装回来了！" : ""}
        </div>
        <div style={{ position: "absolute", left: 760, top: 330 }}>
          <Hunter gear={rich ? "rich" : "poor"} mood={rich ? "cheer" : "cry"} size={400} />
        </div>
        <div style={{ position: "absolute", left: 470, top: 640 }}>
          <Kitty size={200} />
        </div>
        <div style={{ position: "absolute", left: 1200, top: 600 }}>
          <Mascot mood="happy" size={240} hop />
        </div>
        <div style={{ position: "absolute", left: 1350, top: 220 }}>
          <Wyvern size={240} />
        </div>
      </AbsoluteFill>
      <Sparkles x={960} y={560} from={finale} spread={420} count={16} />
      <Confetti x={960} y={700} from={finale + 0.1} count={90} />
      <AbsoluteFill style={{ background: "#FFFFFF", opacity: flash }} />

      <Sfx src="sfx_ok" at={3.1} volume={0.35} />
      <Sfx src="sfx_whoosh" at={6.1} volume={0.45} />
      <Sfx src="sfx_ok" at={10.8} volume={0.4} />
      <Sfx src="sfx_whoosh" at={finale - 0.3} volume={0.5} />
      <Sfx src="sfx_ok" at={finale} volume={0.5} />
    </AbsoluteFill>
  );
};
