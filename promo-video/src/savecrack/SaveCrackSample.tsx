// A first sample of the save-crack video: three of its scenes back to back,
// with the soundtrack, to settle the look and the music.

import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Series, staticFile, useVideoConfig } from "remotion";
import { Fingerprint, Moving, Opening } from "./scenes";

export const SaveCrackSample: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#070B14" }}>
      <Series>
        <Series.Sequence durationInFrames={8 * fps}>
          <Opening />
        </Series.Sequence>
        <Series.Sequence durationInFrames={12 * fps}>
          <Fingerprint />
        </Series.Sequence>
        <Series.Sequence durationInFrames={15 * fps}>
          <Moving />
        </Series.Sequence>
      </Series>
      <Audio src={staticFile("savecrack/music.wav")} volume={0.55} />
    </AbsoluteFill>
  );
};
