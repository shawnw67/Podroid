import { Audio } from "@remotion/media";
import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { audio, Feature, features, games, Lang, showPlaceholders, timeline } from "./config";
import { Scene, sec } from "./components";
import {
  AndroidScene,
  BrandScene,
  FeaturesScene,
  GameShot,
  MemoryScene,
  OutroScene,
  TechScene,
} from "./scenes";

export type PromoProps = { lang: Lang };

// Consecutive features with the same screen orientation share one phone.
const featureRuns = () => {
  const runs: { first: number; items: Feature[] }[] = [];
  features.forEach((f, i) => {
    const prev = runs[runs.length - 1];
    if (prev && prev.items[0].aspect < 1 === f.aspect < 1) {
      prev.items.push(f);
    } else {
      runs.push({ first: i, items: [f] });
    }
  });
  return runs;
};

export const Promo: React.FC<PromoProps> = ({ lang }) => {
  const shown = games.filter((g) => showPlaceholders || g.media !== null);
  const span = timeline.games.end - timeline.games.start;
  const each = span / Math.max(1, shown.length);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Scene name="1 经典的记忆" {...timeline.memory} fadeIn={2.0}>
        <MemoryScene lang={lang} />
      </Scene>
      <Scene name="2 现代 Android" {...timeline.android}>
        <AndroidScene lang={lang} />
      </Scene>
      <Scene name="3 品牌亮相" {...timeline.brand}>
        <BrandScene lang={lang} />
      </Scene>
      {shown.map((game, i) => {
        const start = timeline.games.start + i * each;
        return (
          <Scene key={game.name} name={`4 ${game.name}`} start={start} end={start + each}>
            <GameShot game={game} seconds={each} />
          </Scene>
        );
      })}
      {featureRuns().map((run) => {
        const each = (timeline.features.end - timeline.features.start) / features.length;
        const start = timeline.features.start + run.first * each;
        return (
          <Scene key={run.first} name={`5 功能 ${run.first + 1}`} start={start} end={start + run.items.length * each}>
            <FeaturesScene
              lang={lang}
              items={run.items}
              first={run.first}
              total={features.length}
              each={each}
            />
          </Scene>
        );
      })}
      <Scene name="6 技术与开源" {...timeline.tech}>
        <TechScene lang={lang} />
      </Scene>
      <Scene name="7 品牌收尾" {...timeline.outro} fadeOut={2.0}>
        <OutroScene lang={lang} />
      </Scene>

      <Audio src={staticFile(audio.music.src)} volume={audio.music.volume} />
      {audio.cues.map((cue) => (
        <Sequence key={`${cue.src}@${cue.at}`} from={sec(cue.at)} name={`SFX ${cue.at}s`} layout="none">
          <Audio src={staticFile(cue.src)} volume={cue.volume} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
