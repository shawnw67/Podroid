import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { codeExcerpt } from "./code-excerpt";
import { android, brand, Feature, Game, Lang, memory, outro, tech, timeline } from "./config";
import {
  AndroidPhone,
  At,
  Background,
  Caption,
  ClassicPhone,
  MediaView,
  OUT_DURATION,
  useRamp,
  useT,
} from "./components";
import { colors, ease, fonts, sizes } from "./theme";

const len = (act: { start: number; end: number }) => act.end - act.start;

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Center: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", ...style }}>
    {children}
  </AbsoluteFill>
);

// Small tag with an accent dot, for edge labels and footers.
const Tag: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 14,
      fontFamily: fonts.latin,
      fontSize: sizes.small,
      color: colors.muted,
      letterSpacing: "0.12em",
      ...style,
    }}
  >
    <span style={{ width: 8, height: 8, borderRadius: 4, background: colors.accent }} />
    {children}
  </div>
);

// Act 1 — 有些游戏，留在了过去。
export const MemoryScene: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = useT();
  const reveal = useRamp(0.2, 2.6);
  const drift = interpolate(t, [0, len(timeline.memory) + 1], [1.0, 1.05], clamp);
  return (
    <AbsoluteFill>
      <Background glow={0.1 + reveal * 0.08} />
      <Center style={{ paddingBottom: 140 }}>
        <div style={{ opacity: reveal, transform: `scale(${drift}) translateY(${(1 - reveal) * 20}px)` }}>
          <ClassicPhone width={980}>
            <MediaView
              media={memory.screen}
              style={{ width: "100%", height: "100%", filter: "saturate(0.8) sepia(0.12) brightness(0.92)" }}
            />
          </ClassicPhone>
        </div>
      </Center>
      <Center style={{ justifyContent: "flex-end", paddingBottom: 120 }}>
        <Caption inAt={memory.caption.in} outAt={memory.caption.out} style={{ fontSize: sizes.subtitle }}>
          {memory.caption.text[lang]}
        </Caption>
      </Center>
    </AbsoluteFill>
  );
};

// Act 2 — the launcher in hand, then a game running on the phone.
export const AndroidScene: React.FC<{ lang: Lang }> = ({ lang }) => {
  const t = useT();
  const toGame = interpolate(t, [android.switchAt - 0.45, android.switchAt + 0.45], [0, 1], {
    ...clamp,
    easing: ease,
  });
  const drift = interpolate(t, [0, len(timeline.android)], [0.98, 1.01], clamp);
  return (
    <AbsoluteFill>
      <Background />
      <Center style={{ paddingBottom: 150 }}>
        <div style={{ position: "absolute", opacity: 1 - toGame, transform: `scale(${drift})` }}>
          <AndroidPhone height={780} screen={android.launcherAspect}>
            <MediaView
              media={android.launcher}
              placeholder={android.launcherLabel}
              style={{ width: "100%", height: "100%" }}
            />
          </AndroidPhone>
        </div>
        <div style={{ position: "absolute", opacity: toGame, transform: `scale(${drift})` }}>
          <AndroidPhone width={1520} screen={android.runningAspect}>
            <MediaView
              media={android.running}
              placeholder={android.runningLabel}
              style={{ width: "100%", height: "100%" }}
            />
          </AndroidPhone>
        </div>
      </Center>
      {android.captions.map((c) => (
        <Caption
          key={c.text.zh}
          inAt={c.in}
          outAt={c.out}
          style={{ position: "absolute", bottom: 110, width: "100%", textAlign: "center", fontSize: sizes.subtitle }}
        >
          {c.text[lang]}
        </Caption>
      ))}
      <Caption inAt={android.edgeLabels.in} rise={0} style={{ position: "absolute", left: 96, bottom: 60 }}>
        <Tag>{android.edgeLabels.left}</Tag>
      </Caption>
      <Caption inAt={android.edgeLabels.in} rise={0} style={{ position: "absolute", right: 96, bottom: 60 }}>
        <Tag>{android.edgeLabels.right}</Tag>
      </Caption>
    </AbsoluteFill>
  );
};

// Act 3 — logo, name and platforms.
export const BrandScene: React.FC<{ lang: Lang }> = ({ lang }) => {
  const logoIn = useRamp(0.3, 1.4);
  const drift = interpolate(useT(), [0, len(timeline.brand)], [1, 1.03], clamp);
  return (
    <AbsoluteFill>
      <Background glow={0.26} />
      <Center style={{ transform: `scale(${drift})` }}>
        <Img
          src={staticFile(brand.logo)}
          style={{
            width: 260,
            height: 260,
            opacity: logoIn,
            transform: `translateY(${(1 - logoIn) * 20}px)`,
            filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.5))",
            marginBottom: 44,
          }}
        />
        <Caption inAt={1.0} style={{ fontFamily: fonts.latin, fontSize: sizes.title, fontWeight: 600, letterSpacing: "0.01em" }}>
          {brand.title}
        </Caption>
        <Caption inAt={1.8} style={{ fontSize: sizes.subtitle, color: colors.muted, marginTop: 18 }}>
          {brand.subtitle[lang]}
        </Caption>
      </Center>
      <Center style={{ justifyContent: "flex-end", paddingBottom: 90 }}>
        <Caption inAt={2.6} rise={0} style={{ fontFamily: fonts.latin, fontSize: sizes.small, color: colors.muted, letterSpacing: "0.18em" }}>
          {brand.platforms}
        </Caption>
      </Center>
    </AbsoluteFill>
  );
};

// Act 4 — one game, full attention. Promo places one per game.
export const GameShot: React.FC<{ game: Game; seconds: number }> = ({ game, seconds }) => {
  const maxW = 1500;
  const maxH = 860;
  const w = Math.min(maxW, maxH * game.aspect);
  const h = w / game.aspect;
  return (
    <AbsoluteFill>
      <Background glow={0.12} />
      <Center style={{ paddingBottom: 110 }}>
        <MediaView
          media={game.media}
          placeholder={`${game.name} 游戏录屏`}
          zoom={[1, 1.03]}
          zoomSeconds={seconds}
          style={{
            width: w,
            height: h,
            borderRadius: 18,
            boxShadow: `0 0 0 1px ${colors.faint}, 0 40px 120px rgba(0,0,0,0.6)`,
          }}
        />
      </Center>
      <div style={{ position: "absolute", left: (1920 - w) / 2, top: (1080 - 110 + h) / 2 + 34 }}>
        <Caption inAt={0.5} rise={10} style={{ fontFamily: fonts.latin, fontSize: sizes.body, fontWeight: 500, letterSpacing: "0.02em" }}>
          {game.name}
        </Caption>
      </div>
    </AbsoluteFill>
  );
};

// Act 5 — a run of features sharing one phone; only the screen and caption
// change. `first` is the run's first feature in the whole act (for the
// progress dots), and `each` is each feature's length.
export const FeaturesScene: React.FC<{
  lang: Lang;
  items: Feature[];
  first: number;
  total: number;
  each: number;
}> = ({ lang, items, first, total, each }) => {
  const t = useT();
  const portrait = items[0].aspect < 1;
  const phone = (
    <AndroidPhone {...(portrait ? { height: 860 } : { width: 1420 })} screen={items[0].aspect}>
      {items.map((f, i) => {
        const start = i * each;
        const opacity =
          i === 0 ? 1 : interpolate(t, [start - 0.4, start + 0.4], [0, 1], { ...clamp, easing: ease });
        return (
          <At key={f.text.zh} from={start - 0.45}>
            <div style={{ position: "absolute", inset: 0, opacity }}>
              <MediaView
                media={f.media}
                placeholder={f.placeholder}
                anchor={start}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </At>
        );
      })}
    </AndroidPhone>
  );
  const captions = items.map((f, i) => {
    const start = i * each;
    const last = i === items.length - 1;
    return (
      <Caption
        key={f.text.zh}
        inAt={start}
        // The run's last caption stays up until the scene fades out.
        outAt={last ? undefined : start + each - OUT_DURATION}
        style={{ position: "absolute", fontSize: portrait ? 64 : sizes.subtitle, whiteSpace: "nowrap" }}
      >
        {f.text[lang]}
      </Caption>
    );
  });
  const current = first + Math.min(items.length - 1, Math.max(0, Math.floor(t / each)));
  const dots = (
    <div style={{ display: "flex", gap: 14 }}>
      {Array.from({ length: total }, (_, k) => (
        <div
          key={k}
          style={{
            width: k === current ? 40 : 12,
            height: 6,
            borderRadius: 3,
            background: k === current ? colors.accent : colors.faint,
          }}
        />
      ))}
    </div>
  );
  return (
    <AbsoluteFill>
      <Background />
      {portrait ? (
        <>
          <div style={{ position: "absolute", left: 470, top: 0, bottom: 0, display: "flex", alignItems: "center" }}>
            {phone}
          </div>
          <div style={{ position: "absolute", left: 1020, top: 455 }}>{captions}</div>
          <div style={{ position: "absolute", left: 1022, top: 580 }}>{dots}</div>
        </>
      ) : (
        <>
          <Center style={{ paddingBottom: 170 }}>{phone}</Center>
          <div style={{ position: "absolute", bottom: 175, width: "100%", display: "flex", justifyContent: "center" }}>
            {captions}
          </div>
          <div style={{ position: "absolute", bottom: 64, width: "100%", display: "flex", justifyContent: "center" }}>
            {dots}
          </div>
        </>
      )}
    </AbsoluteFill>
  );
};

// Act 6 — real source and a three-layer sketch of high-level emulation.
export const TechScene: React.FC<{ lang: Lang }> = ({ lang }) => {
  const scroll = interpolate(useT(), [0, len(timeline.tech) + 1], [0, -90], clamp);
  const panel = useRamp(0.1, 1.0);
  return (
    <AbsoluteFill>
      <Background glow={0.1} />
      <div
        style={{
          position: "absolute",
          left: 110,
          top: 110,
          width: 1020,
          height: 690,
          borderRadius: 16,
          background: "rgba(8, 12, 20, 0.85)",
          boxShadow: `0 0 0 1px ${colors.faint}`,
          overflow: "hidden",
          opacity: panel,
        }}
      >
        <div style={{ padding: "18px 26px", fontFamily: fonts.mono, fontSize: 22, color: colors.muted, borderBottom: `1px solid ${colors.faint}` }}>
          {tech.file}
        </div>
        <div style={{ position: "absolute", top: 64, bottom: 0, left: 0, right: 0, overflow: "hidden" }}>
          <pre
            style={{
              margin: 0,
              padding: "22px 26px",
              fontFamily: fonts.mono,
              fontSize: 19,
              lineHeight: 1.65,
              color: "#C9D3E3",
              transform: `translateY(${scroll}px)`,
              whiteSpace: "pre",
            }}
          >
            {codeExcerpt.trim()}
          </pre>
          <AbsoluteFill
            style={{ background: "linear-gradient(90deg, transparent 88%, rgba(8,12,20,0.95) 100%), linear-gradient(180deg, transparent 80%, rgba(8,12,20,0.95) 100%)" }}
          />
        </div>
      </div>
      <div style={{ position: "absolute", left: 1180, top: 130, width: 630, display: "flex", flexDirection: "column", gap: 26 }}>
        {tech.layers.map((layer, i) => (
          <Caption key={layer.detail} inAt={0.5 + i * 0.35} rise={12}>
            <div
              style={{
                padding: "24px 30px",
                borderRadius: 14,
                background: i === 1 ? "rgba(139, 212, 72, 0.10)" : "rgba(255,255,255,0.04)",
                boxShadow: `0 0 0 1px ${i === 1 ? "rgba(139,212,72,0.45)" : colors.faint}`,
              }}
            >
              <div style={{ fontSize: 36, color: colors.text }}>{layer.title[lang]}</div>
              <div style={{ fontFamily: fonts.latin, fontSize: 26, color: colors.muted, marginTop: 8 }}>{layer.detail}</div>
            </div>
          </Caption>
        ))}
      </div>
      <Caption
        inAt={tech.caption.in}
        style={{ position: "absolute", bottom: 150, width: "100%", textAlign: "center", fontSize: sizes.body }}
      >
        {tech.caption.text[lang]}
      </Caption>
      <Caption inAt={1.2} rise={0} style={{ position: "absolute", bottom: 72, width: "100%", display: "flex", justifyContent: "center" }}>
        <Tag>{tech.footer}</Tag>
      </Caption>
    </AbsoluteFill>
  );
};

// Act 7 — closing card.
export const OutroScene: React.FC<{ lang: Lang }> = ({ lang }) => {
  const logoIn = useRamp(0.4, 1.4);
  return (
    <AbsoluteFill>
      <Background glow={0.24} />
      <Center>
        <Img
          src={staticFile(outro.logo)}
          style={{
            width: 200,
            height: 200,
            opacity: logoIn,
            transform: `translateY(${(1 - logoIn) * 16}px)`,
            filter: "drop-shadow(0 26px 50px rgba(0,0,0,0.5))",
            marginBottom: 48,
          }}
        />
        <Caption inAt={0.9} style={{ fontSize: sizes.title * 0.92, fontWeight: 500 }}>
          {outro.slogan[lang]}
        </Caption>
        <Caption inAt={1.5} style={{ fontFamily: fonts.latin, fontSize: sizes.subtitle, fontWeight: 600, marginTop: 30 }}>
          {outro.name}
        </Caption>
        <Caption inAt={1.9} rise={0} style={{ fontFamily: fonts.latin, fontSize: 38, color: colors.muted, marginTop: 22, letterSpacing: "0.03em" }}>
          {outro.url}
        </Caption>
      </Center>
    </AbsoluteFill>
  );
};
