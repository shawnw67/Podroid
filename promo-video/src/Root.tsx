import { Composition } from "remotion";
import { FPS, HEIGHT, TOTAL_SECONDS, WIDTH } from "./config";
import { Promo } from "./Promo";
import { RELEASE_SECONDS } from "./release/config";
import { Release } from "./release/Release";
import { SaveCrackSample } from "./savecrack/SaveCrackSample";
import { Cover } from "./sticker/Cover";
import { FULL_SECONDS, SaveCrackFull } from "./sticker/SaveCrackFull";
import { STICKER_SECONDS, StickerSample } from "./sticker/StickerSample";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="UFtouchHLE-Promo-CN"
        component={Promo}
        durationInFrames={Math.round(TOTAL_SECONDS * FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ lang: "zh" as const }}
      />
      <Composition
        id="UFtouchHLE-Promo-EN"
        component={Promo}
        durationInFrames={Math.round(TOTAL_SECONDS * FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ lang: "en" as const }}
      />
      <Composition
        id="UFtouchHLE-v0326-CN"
        component={Release}
        durationInFrames={Math.round(RELEASE_SECONDS * FPS)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="SaveCrack-Sample"
        component={SaveCrackSample}
        durationInFrames={1050}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition id="SaveCrack-Cover" component={Cover} durationInFrames={60} fps={30} width={1920} height={1080} />
      <Composition
        id="SaveCrack-Full"
        component={SaveCrackFull}
        durationInFrames={FULL_SECONDS * 30}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="SaveCrack-Sticker"
        component={StickerSample}
        durationInFrames={STICKER_SECONDS * 30}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
