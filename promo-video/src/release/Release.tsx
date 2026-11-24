import { Audio } from "@remotion/media";
import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { brand, FPS } from "../config";
import { sec } from "../components";
import { colors, ease, fonts } from "../theme";
import {
  audio,
  BAR,
  BEAT,
  bar,
  Chip,
  DROP,
  END_HIT,
  Move,
  outro,
  RELEASE_SECONDS,
  SCREEN,
  Section,
  sections,
  Shot,
  VERSION,
  View,
  wide,
} from "./config";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const palette = {
  green: colors.accent,
  blue: "#3D8BFF",
  yellow: "#FFC93C",
  pink: "#FF5C8A",
};

// Absolute time in seconds; Sequences below keep the absolute clock by
// passing their start down.
const Clock = React.createContext(0);
const useTime = () => useCurrentFrame() / FPS + React.useContext(Clock);

const At: React.FC<{ from: number; to?: number; children: React.ReactNode; name?: string }> = ({
  from,
  to,
  children,
  name,
}) => {
  const offset = React.useContext(Clock);
  return (
    <Sequence
      from={sec(from - offset)}
      durationInFrames={to === undefined ? undefined : Math.max(1, sec(to - from))}
      layout="none"
      name={name}
    >
      <Clock.Provider value={from}>{children}</Clock.Provider>
    </Sequence>
  );
};

// Springy 0→1 from `at`, overshooting a little.
const usePop = (at: number, damping = 11) => {
  const { fps } = useVideoConfig();
  const t = useTime();
  return spring({ frame: Math.max(0, (t - at) * fps), fps, config: { damping, stiffness: 170, mass: 0.7 } });
};

// 1 on each beat after the drop, decaying quickly.
const usePulse = () => {
  const t = useTime();
  if (t < DROP || t > END_HIT + 0.3) return 0;
  const phase = ((t - DROP) % BEAT) / BEAT;
  return Math.exp(-phase * 7);
};

const Backdrop: React.FC = () => {
  const t = useTime();
  const pulse = usePulse();
  const a = t * 18;
  return (
    <AbsoluteFill style={{ background: "#070B16", overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${30 + 12 * Math.sin(t * 0.5)}% ${35 + 10 * Math.cos(t * 0.4)}%, rgba(61,139,255,0.42) 0%, transparent 45%),
            radial-gradient(circle at ${72 + 10 * Math.cos(t * 0.45)}% ${65 + 12 * Math.sin(t * 0.35)}%, rgba(139,212,72,0.30) 0%, transparent 42%),
            radial-gradient(circle at ${80 + 8 * Math.sin(t * 0.3)}% ${18 + 6 * Math.cos(t * 0.5)}%, rgba(255,92,138,0.22) 0%, transparent 35%)`,
          opacity: 0.85 + pulse * 0.15,
        }}
      />
      {/* Diagonal stripes drifting along. */}
      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(120deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 64px)`,
          backgroundPosition: `${a}px 0`,
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 60%, rgba(0,0,0,0.6) 100%)" }}
      />
    </AbsoluteFill>
  );
};

// A screen recording or screenshot seen through a frame, moving between
// keyframed views.
const lerpView = (move: Move, t: number): View => {
  if (move.length === 1 || t <= move[0].at) return move[0].view;
  for (let i = 1; i < move.length; i++) {
    const a = move[i - 1];
    const b = move[i];
    if (t <= b.at) {
      const k = ease((t - a.at) / (b.at - a.at));
      return {
        cx: a.view.cx + (b.view.cx - a.view.cx) * k,
        cy: a.view.cy + (b.view.cy - a.view.cy) * k,
        w: a.view.w + (b.view.w - a.view.w) * k,
      };
    }
  }
  return move[move.length - 1].view;
};

const Screen: React.FC<{ src: string; clipAt?: number; width: number; height: number; view: View }> = ({
  src,
  clipAt = 0,
  width,
  height,
  view,
}) => {
  const w = view.w;
  const h = w / SCREEN;
  // Keep the screen covering the frame.
  const left = Math.min(0, Math.max(width - w, width / 2 - view.cx * w));
  const top = Math.min(0, Math.max(height - h, height / 2 - view.cy * h));
  const style: React.CSSProperties = { position: "absolute", left, top, width: w, height: h };
  return src.endsWith(".mp4") ? (
    <OffthreadVideo src={staticFile(src)} trimBefore={Math.round(clipAt * FPS)} muted style={style} />
  ) : (
    <Img src={staticFile(src)} style={style} />
  );
};

const Card: React.FC<{ width: number; height: number; children: React.ReactNode; tilt?: number }> = ({
  width,
  height,
  children,
  tilt = 0,
}) => (
  <div
    style={{
      position: "relative",
      width,
      height,
      borderRadius: 26,
      overflow: "hidden",
      background: "#000",
      boxShadow: `0 0 0 3px rgba(255,255,255,0.12), 0 30px 90px rgba(0,0,0,0.6)`,
      transform: `rotate(${tilt}deg)`,
    }}
  >
    {children}
  </div>
);

// Shots cut on the beat: each one punches in from slightly larger.
const ShotView: React.FC<{ shot: Shot }> = ({ shot }) => {
  const t = useTime() - shot.from;
  const punch = usePop(shot.from, 14);
  const pulse = usePulse();
  const scale = 1.12 - 0.12 * punch + pulse * 0.008;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 100, paddingBottom: 150 }}>
      <div style={{ transform: `scale(${scale})` }}>
        <Card width={shot.width} height={shot.height}>
          <Screen src={shot.src} clipAt={shot.clipAt} width={shot.width} height={shot.height} view={lerpView(shot.move, t)} />
        </Card>
      </div>
    </AbsoluteFill>
  );
};

const ChipView: React.FC<{ chip: Chip; big?: boolean }> = ({ chip, big }) => {
  const t = useTime();
  const pop = usePop(chip.at, 9);
  const out = chip.until === undefined ? 0 : interpolate(t, [chip.until, chip.until + 0.15], [0, 1], clamp);
  const color = chip.color ?? palette.green;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 54,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: 1 - out,
        transform: `translateY(${out * 30}px) scale(${pop}) rotate(${(1 - pop) * -6}deg)`,
      }}
    >
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: big ? 60 : 52,
          fontWeight: 500,
          color: "#0A0F1C",
          background: color,
          padding: "16px 40px",
          borderRadius: 999,
          boxShadow: `0 12px 40px ${color}66`,
          letterSpacing: "0.03em",
          whiteSpace: "nowrap",
        }}
      >
        {chip.text}
      </div>
    </div>
  );
};

// Title card: the number slams in, then the title word by word.
const TitleCard: React.FC<{ section: Section }> = ({ section }) => {
  const at = section.start;
  const num = usePop(at, 10);
  const title = usePop(at + BEAT, 12);
  const sub = usePop(at + BEAT * 2, 12);
  const t = useTime();
  const out = interpolate(t, [at + BAR - 0.18, at + BAR], [0, 1], clamp);
  const pulse = usePulse();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - out }}>
      <div
        style={{
          fontFamily: fonts.latin,
          fontSize: 300,
          fontWeight: 600,
          lineHeight: 1,
          color: "transparent",
          WebkitTextStroke: `4px ${palette.green}`,
          transform: `scale(${(0.4 + 0.6 * num) * (1 + pulse * 0.04)}) rotate(${(1 - num) * -12}deg)`,
          opacity: Math.min(1, num * 2),
          marginBottom: 10,
        }}
      >
        {section.index}
      </div>
      <div
        style={{
          fontFamily: fonts.sans,
          fontSize: 100,
          fontWeight: 500,
          color: colors.text,
          transform: `translateY(${(1 - title) * 60}px) scale(${0.8 + 0.2 * title})`,
          opacity: Math.min(1, title * 1.5),
          letterSpacing: "0.02em",
        }}
      >
        {section.title}
      </div>
      <div
        style={{
          marginTop: 22,
          fontFamily: fonts.sans,
          fontSize: 46,
          color: colors.muted,
          transform: `translateY(${(1 - sub) * 40}px)`,
          opacity: Math.min(1, sub * 1.5),
          letterSpacing: "0.06em",
        }}
      >
        {section.subtitle}
      </div>
    </AbsoluteFill>
  );
};

// Section tag in the top left while its shots play.
const Corner: React.FC<{ section: Section }> = ({ section }) => {
  const pop = usePop(section.start + BAR, 13);
  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        top: 44,
        display: "flex",
        alignItems: "center",
        gap: 18,
        transform: `translateX(${(1 - pop) * -40}px)`,
        opacity: pop,
      }}
    >
      <span style={{ fontFamily: fonts.latin, fontSize: 40, fontWeight: 600, color: palette.green }}>{section.index}</span>
      <span style={{ fontFamily: fonts.sans, fontSize: 36, color: colors.text, letterSpacing: "0.04em" }}>{section.title}</span>
    </div>
  );
};

// The bar ticker along the bottom edge.
const Progress: React.FC = () => {
  const t = useTime();
  const k = interpolate(t, [DROP, END_HIT], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", left: 0, bottom: 0, height: 8, width: `${k * 100}%`, background: `linear-gradient(90deg, ${palette.blue}, ${palette.green}, ${palette.yellow})` }} />
  );
};

const Flash: React.FC<{ at: number; strength?: number }> = ({ at, strength = 0.55 }) => {
  const t = useTime();
  const o = interpolate(t, [at, at + 0.22], [strength, 0], clamp);
  return <AbsoluteFill style={{ background: "#fff", opacity: t >= at ? o : 0, pointerEvents: "none" }} />;
};

const Intro: React.FC = () => {
  const t = useTime();
  const logo = usePop(0.25, 10);
  const name = usePop(0.9, 12);
  const version = usePop(bar(2), 8);
  const four = usePop(bar(2) + BEAT * 2, 10);
  // On bar 3 the numbers 1–4 flash, one per beat.
  const count = t >= bar(3) && t < bar(4) ? Math.floor((t - bar(3)) / BEAT) : -1;
  const countPop = usePop(bar(3) + Math.max(0, count) * BEAT, 8);
  const colorsByCount = [palette.green, palette.blue, palette.yellow, palette.pink];
  return (
    <AbsoluteFill>
      {count < 0 ? (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <Img
            src={staticFile(brand.logo)}
            style={{
              width: 220,
              height: 220,
              transform: `scale(${logo}) rotate(${(1 - logo) * -20}deg)`,
              filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.5))",
              marginBottom: 34,
            }}
          />
          <div
            style={{
              fontFamily: fonts.latin,
              fontSize: 120,
              fontWeight: 600,
              color: colors.text,
              transform: `translateY(${(1 - name) * 50}px)`,
              opacity: Math.min(1, name * 1.5),
              display: "flex",
              gap: 30,
              alignItems: "baseline",
            }}
          >
            UFtouchHLE
            <span
              style={{
                color: palette.green,
                display: "inline-block",
                transform: `scale(${version}) rotate(${(1 - version) * 15}deg)`,
                opacity: Math.min(1, version * 2),
              }}
            >
              {VERSION}
            </span>
          </div>
          <div
            style={{
              marginTop: 26,
              fontFamily: fonts.sans,
              fontSize: 64,
              fontWeight: 500,
              color: "#0A0F1C",
              background: palette.yellow,
              padding: "10px 36px",
              borderRadius: 999,
              transform: `scale(${four}) rotate(${(1 - four) * -8}deg)`,
              opacity: Math.min(1, four * 2),
            }}
          >
            四项新功能！
          </div>
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", background: colorsByCount[count] }}>
          <div
            style={{
              fontFamily: fonts.latin,
              fontSize: 520,
              fontWeight: 600,
              color: "#0A0F1C",
              transform: `scale(${0.6 + 0.4 * countPop}) rotate(${(1 - countPop) * (count % 2 ? 10 : -10)}deg)`,
              lineHeight: 1,
            }}
          >
            {count + 1}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// MHFU's extended view: the 4:3 frame stretches to the extended picture.
const WideShot: React.FC = () => {
  const { fps } = useVideoConfig();
  const t = useTime();
  const enter = usePop(wide.from, 14);
  const stretch = spring({ frame: Math.max(0, (t - wide.expandAt) * fps), fps, config: { damping: 13, stiffness: 120 } });
  const pulse = usePulse();
  const h = wide.height;
  const w = h * (4 / 3 + (wide.aspect - 4 / 3) * stretch);
  const screenW = wide.screenWidth;
  const screenH = screenW / SCREEN;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 100, paddingBottom: 150 }}>
      <div style={{ transform: `scale(${(1.12 - 0.12 * enter) * (1 + pulse * 0.008)})`, position: "relative" }}>
        <Card width={w} height={h}>
          <OffthreadVideo
            src={staticFile(wide.src)}
            trimBefore={Math.round(wide.clipAt * FPS)}
            muted
            style={{ position: "absolute", left: (w - screenW) / 2, top: (h - screenH) / 2, width: screenW, height: screenH }}
          />
        </Card>
        {/* Arrows pushing the edges out as it stretches. */}
        {[-1, 1].map((side) => (
          <div
            key={side}
            style={{
              position: "absolute",
              top: h / 2 - 60,
              [side < 0 ? "left" : "right"]: -110 - 40 * stretch,
              fontSize: 110,
              lineHeight: "120px",
              color: palette.green,
              fontFamily: fonts.latin,
              fontWeight: 600,
              opacity: interpolate(t, [wide.expandAt - 0.2, wide.expandAt, wide.expandAt + 1.4, wide.expandAt + 1.8], [0, 1, 1, 0], clamp),
            }}
          >
            {side < 0 ? "‹" : "›"}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC = () => {
  const logo = usePop(outro.start, 9);
  const name = usePop(outro.start + BEAT, 11);
  const note = usePop(outro.start + BEAT * 2, 11);
  const url = usePop(outro.start + BEAT * 3, 12);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Img
        src={staticFile(brand.logo)}
        style={{ width: 200, height: 200, transform: `scale(${logo}) rotate(${(1 - logo) * 25}deg)`, marginBottom: 36, filter: "drop-shadow(0 26px 50px rgba(0,0,0,0.5))" }}
      />
      <div style={{ fontFamily: fonts.latin, fontSize: 110, fontWeight: 600, color: colors.text, transform: `scale(${0.7 + 0.3 * name})`, opacity: Math.min(1, name * 2) }}>
        UFtouchHLE <span style={{ color: palette.green }}>{VERSION}</span>
      </div>
      <div
        style={{
          marginTop: 28,
          fontFamily: fonts.sans,
          fontSize: 50,
          fontWeight: 500,
          color: "#0A0F1C",
          background: palette.yellow,
          padding: "10px 34px",
          borderRadius: 999,
          transform: `scale(${note})`,
        }}
      >
        {outro.note}
      </div>
      <div style={{ marginTop: 34, fontFamily: fonts.latin, fontSize: 40, color: colors.text, letterSpacing: "0.03em", opacity: url, transform: `translateY(${(1 - url) * 20}px)` }}>
        {outro.url}
      </div>
    </AbsoluteFill>
  );
};

export const Release: React.FC = () => {
  const total = sec(RELEASE_SECONDS);
  const allChips = [...sections.flatMap((s) => s.chips), ...wide.chips];
  // Cuts get a flash and a whoosh; chips and titles get a pop.
  const cuts = [DROP, ...sections.map((s) => s.start), wide.from, END_HIT];
  const pops = [
    bar(2),
    bar(2) + BEAT * 2,
    ...[0, 1, 2, 3].map((k) => bar(3) + k * BEAT),
    ...allChips.map((c) => c.at),
    ...sections.map((s) => s.start + BEAT),
  ];
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Backdrop />
      <At from={0} to={DROP} name="开场">
        <Intro />
      </At>
      {sections.map((s) => (
        <React.Fragment key={s.index}>
          <At from={s.start} to={s.start + BAR} name={`${s.index} 标题`}>
            <TitleCard section={s} />
          </At>
          {s.shots.map((shot, i) => (
            <At key={i} from={shot.from} to={shot.to} name={`${s.index} 镜头 ${i + 1}`}>
              <ShotView shot={shot} />
            </At>
          ))}
          <At from={s.start + BAR} to={s.end} name={`${s.index} 角标`}>
            <Corner section={s} />
          </At>
        </React.Fragment>
      ))}
      <At from={wide.from} to={wide.to} name="01 扩展视野">
        <WideShot />
      </At>
      {allChips.map((c) => (
        <At key={c.text} from={c.at} to={(c.until ?? c.at + BAR) + 0.2} name={`字幕 ${c.text}`}>
          <ChipView chip={c} />
        </At>
      ))}
      <At from={outro.start} name="收尾">
        <Outro />
      </At>
      <Progress />
      {cuts.map((at) => (
        <At key={at} from={at} to={at + 0.3}>
          <Flash at={at} />
        </At>
      ))}
      <FadeOut from={RELEASE_SECONDS - 0.8} />

      <Audio
        src={staticFile(audio.music)}
        volume={(f) => interpolate(f, [total - sec(1.2), total], [1, 0], clamp)}
      />
      {cuts.slice(1, -1).map((at) => (
        <Sequence key={`w${at}`} from={sec(at - 0.75)} layout="none">
          <Audio src={staticFile(audio.whoosh)} volume={0.35} />
        </Sequence>
      ))}
      {pops.map((at, i) => (
        <Sequence key={`p${i}`} from={sec(at)} layout="none">
          <Audio src={staticFile(audio.pop)} volume={0.28} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

const FadeOut: React.FC<{ from: number }> = ({ from }) => {
  const t = useCurrentFrame() / FPS;
  return <AbsoluteFill style={{ background: "#000", opacity: interpolate(t, [from, from + 0.8], [0, 1], clamp), pointerEvents: "none" }} />;
};
