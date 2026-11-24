// Everything a non-programmer is likely to change lives here: shot timing,
// on-screen text, footage paths and audio cues. Times are in seconds.
//
// Media paths are relative to public/. A media slot set to `null` has no
// footage yet: previews show a labelled placeholder, and the game showcase
// drops games without footage (see `showPlaceholders`).

export type Lang = "zh" | "en";

export type Media =
  | {
      kind: "video";
      src: string;
      // Seconds to skip at the start of the clip.
      trimBefore?: number;
      // Playback speed; keep at 1 for gameplay so it stays authentic.
      playbackRate?: number;
      // How the clip fills its frame. "contain" keeps the whole picture.
      fit?: "cover" | "contain";
    }
  | { kind: "image"; src: string; fit?: "cover" | "contain" };

export type Text = Record<Lang, string>;

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Length of the crossfade between scenes.
export const CROSSFADE = 0.9;

// true: missing footage shows a "待替换素材" card (for previews).
// false: games without footage are left out and the others share the time.
export const showPlaceholders = false;

export const timeline = {
  memory: { start: 0, end: 10 },
  android: { start: 10, end: 22 },
  brand: { start: 22, end: 32 },
  games: { start: 32, end: 62 },
  features: { start: 62, end: 78 },
  tech: { start: 78, end: 84 },
  outro: { start: 84, end: 92 },
};

export const TOTAL_SECONDS = timeline.outro.end;

export const memory = {
  // Shown inside the early iPhone.
  screen: { kind: "image", src: "assets/footage/inotia1_title.jpg" } as Media,
  caption: {
    text: { zh: "有些游戏，留在了过去。", en: "Some games were left in the past." },
    in: 2.0,
    out: 9.0,
  },
};

// Recordings from the user's Android phone (UFtouchHLE v0.3.22).
const REC = "assets/ScreenRecorder/";

export const android = {
  // Launcher (portrait): the imported game list, then tapping a game.
  launcher: { kind: "video", src: REC + "启动器导入游戏.mp4", trimBefore: 1.2 } as Media | null,
  launcherLabel: "启动器录屏：游戏列表 → 点击游戏",
  launcherAspect: 1080 / 2340,
  // Then a landscape phone with a game running.
  running: { kind: "video", src: REC + "怪物猎人P2G游戏录屏.mp4", trimBefore: 32.3 } as Media | null,
  runningLabel: "游戏开始运行",
  runningAspect: 2340 / 1078,
  // When the launcher gives way to the game (seconds into the act).
  switchAt: 4.2,
  captions: [
    { text: { zh: "让早期 iOS 游戏", en: "Early iOS games," }, in: 0.8, out: 5.6 },
    {
      text: { zh: "在现代设备上重新运行。", en: "running again on modern devices." },
      in: 6.2,
      out: 11.2,
    },
  ],
  edgeLabels: { left: "32-bit ARM", right: "High-Level Emulation", in: 7.0 },
};

export const brand = {
  logo: "assets/brand/logo.png",
  title: "UFtouchHLE",
  subtitle: { zh: "经典 iOS 游戏高层模拟器", en: "A high-level emulator for classic iOS games" },
  platforms: "Android · Windows · macOS",
};

export type Game = {
  name: string;
  // Shown under the name; keep it short or leave empty.
  note?: string;
  media: Media | null;
  // Picture aspect ratio of the game (width / height).
  aspect: number;
};

// Shown in this order. Each game gets an equal share of the showcase.
// `trimBefore` is where the clip is when the game's shot starts; the clip is
// also visible for half a crossfade before and after.
export const games: Game[] = [
  {
    name: "Monster Hunter Portable 2nd G",
    media: { kind: "video", src: REC + "怪物猎人P2G游戏录屏.mp4", trimBefore: 81.5 },
    aspect: 2340 / 1078,
  },
  {
    name: "Grand Theft Auto: Vice City",
    media: { kind: "video", src: REC + "侠盗猎车手：罪恶都市游戏录屏.mp4", trimBefore: 50.5 },
    // The recording has black bars; this aspect crops them off.
    aspect: 1918 / 1080,
  },
  {
    name: "Resident Evil: Mercenaries VS.",
    media: { kind: "video", src: REC + "生化危机：佣兵VS.游戏录屏.mp4", trimBefore: 24.9 },
    aspect: 1620 / 1080,
  },
  {
    name: "Dead Rising Mobile",
    media: { kind: "video", src: REC + "丧尸围城游戏录屏.mp4", trimBefore: 44.2 },
    aspect: 1620 / 1080,
  },
];

export type Feature = {
  text: Text;
  media: Media | null;
  placeholder: string;
  // Screen aspect (width / height) of the recording: portrait < 1 < landscape.
  aspect: number;
};

// Four features, an equal share of the act each. Consecutive features with
// the same orientation share one phone; only its screen changes.
export const features: Feature[] = [
  {
    text: { zh: "便捷导入与启动", en: "Import and play" },
    media: { kind: "video", src: REC + "启动器导入游戏.mp4", trimBefore: 0.9 },
    placeholder: "启动器录屏：导入游戏 → 启动",
    aspect: 1080 / 2340,
  },
  {
    text: { zh: "ZIP 存档导入导出", en: "ZIP save import & export" },
    media: { kind: "video", src: REC + "存档导入导出.mp4", trimBefore: 1.3 },
    placeholder: "启动器录屏：长按 → 导出 / 导入存档",
    aspect: 1080 / 2340,
  },
  {
    text: { zh: "模拟机型与画面", en: "Device and display options" },
    media: { kind: "video", src: REC + "启动器模拟机型与画面.mp4", trimBefore: 3.4 },
    placeholder: "启动器录屏：模拟机型 / 画面与按键布局",
    aspect: 1080 / 2340,
  },
  {
    text: { zh: "原生手柄支持", en: "Native controller support" },
    media: { kind: "video", src: REC + "手柄游戏画面.mp4", trimBefore: 4.5 },
    placeholder: "手柄实拍或手柄游玩录屏",
    aspect: 1880 / 862,
  },
];

export const tech = {
  file: "src/frameworks/game_controller.rs",
  caption: {
    text: { zh: "让过去的代码，在今天继续运行。", en: "Code from the past, running today." },
    in: 0.6,
    out: 5.4,
  },
  footer: "Open Source · Rust",
  layers: [
    { title: { zh: "游戏的 ARM 代码", en: "The game's ARM code" }, detail: "armv6 · armv7" },
    {
      title: { zh: "UFtouchHLE 实现的 iOS 接口", en: "iOS APIs, implemented by UFtouchHLE" },
      detail: "UIKit · OpenGL ES · GameController",
    },
    { title: { zh: "现代系统", en: "Modern systems" }, detail: "Android · Windows · macOS" },
  ],
};

export const outro = {
  logo: "assets/brand/logo.png",
  slogan: { zh: "让经典，再次运行。", en: "Bring the classics back to life." },
  name: "UFtouchHLE",
  url: "github.com/shawnw67/UFtouchHLE",
};

export const audio = {
  music: { src: "audio/music.wav", volume: 0.9 },
  // Cues at absolute times. Keep them sparse.
  cues: [
    { src: "audio/sfx_swell.wav", at: 8.9, volume: 0.22 },
    { src: "audio/sfx_swell.wav", at: 20.9, volume: 0.25 },
    { src: "audio/sfx_chime.wav", at: 22.9, volume: 0.32 },
    { src: "audio/sfx_swell.wav", at: 60.9, volume: 0.2 },
    { src: "audio/sfx_swell.wav", at: 76.9, volume: 0.2 },
    { src: "audio/sfx_chime.wav", at: 84.7, volume: 0.3 },
  ],
};
