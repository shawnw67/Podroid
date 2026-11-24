// The v0.3.26 release video: four new features in under a minute, cut to
// scripts/make_music_upbeat.py (128 BPM). Like the promo's config, this is
// the file to edit for timing, text and footage. Times are in seconds unless
// they say bars; one bar is 1.875 s.

export const VERSION = "v0.3.26";

export const BPM = 128;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
export const bar = (n: number) => n * BAR;

// The beat drops on bar 4 (see make_music_upbeat.py); the groove ends on 26.
export const DROP = bar(4);
export const END_HIT = bar(26);
export const RELEASE_SECONDS = END_HIT + 4;

// Recordings from the OnePlus tablet (UFtouchHLE v0.3.26), normalized to
// 1696×1200 at 30 FPS. Screen aspect is 3392 / 2400.
const REC = "assets/v0326/";
export const SCREEN = 3392 / 2400;

export const clips = {
  mhfu: REC + "clips/mhfu.mp4",
  mhfuWide: REC + "clips/mhfu_wide.mp4",
  shortcut: REC + "clips/shortcut.mp4",
  library: REC + "clips/library.mp4",
  posters: REC + "海报墙.jpg",
  playtimeCard: REC + "playtime_card.jpg",
  playtimeDetail: REC + "playtime_detail.jpg",
};

// A view into the screen: (cx, cy) is the screen point, in fractions, at the
// centre of the frame, and `w` is the whole screen's width in pixels.
export type View = { cx: number; cy: number; w: number };
// Keyframes at seconds into the shot.
export type Move = { at: number; view: View }[];

export type Shot = {
  src: string;
  // Absolute start and end, and where in the clip the shot starts.
  from: number;
  to: number;
  clipAt?: number;
  // Frame size in pixels.
  width: number;
  height: number;
  move: Move;
};

export type Chip = { text: string; at: number; until?: number; color?: string };

export type Section = {
  index: string;
  title: string;
  subtitle: string;
  // The title card's bar; the section's shots follow it.
  start: number;
  end: number;
  shots: Shot[];
  chips: Chip[];
};

// The UI on the launcher fills only the top of the landscape screen, so
// launcher shots look at parts of it up close.
const W = 1440;
const H = 780;
const full = (w: number): View => ({ cx: 0.5, cy: 0.5, w });

export const sections: Section[] = [
  {
    index: "01",
    title: "怪物猎人 Freedom Unite",
    subtitle: "iOS 版 · 现已可玩",
    start: bar(4),
    end: bar(12),
    shots: [
      // Launcher: tapping MH Unite.
      {
        src: clips.mhfu,
        from: bar(5),
        to: bar(6),
        clipAt: 0.4,
        width: W,
        height: H,
        move: [
          { at: 0, view: { cx: 0.32, cy: 0.3, w: 2600 } },
          { at: 1.8, view: { cx: 0.3, cy: 0.3, w: 3000 } },
        ],
      },
      // The village, 4:3 like a Retina iPad.
      {
        src: clips.mhfu,
        from: bar(6),
        to: bar(9),
        clipAt: 37.4,
        width: 1040,
        height: 780,
        move: [
          { at: 0, view: full(1103) },
          { at: 3.6, view: full(1103) },
          { at: 5.6, view: { cx: 0.42, cy: 0.42, w: 1500 } },
        ],
      },
    ],
    chips: [
      { text: "以前一启动就崩溃", at: bar(5) + 0.1, until: bar(6) - 0.15, color: "#FF5C8A" },
      { text: "现在正常运行 ✓", at: bar(6) + 0.05, until: bar(7) - 0.15 },
      { text: "自动使用 Retina 高清资源", at: bar(7), until: bar(8) - 0.15, color: "#3D8BFF" },
      { text: "平板上按 Retina iPad 显示", at: bar(8), until: bar(9) - 0.15, color: "#FFC93C" },
    ],
  },
  {
    index: "02",
    title: "海报墙 + 桌面快捷方式",
    subtitle: "全新的安卓启动器",
    start: bar(12),
    end: bar(17),
    shots: [
      {
        src: clips.posters,
        from: bar(13),
        to: bar(15),
        width: W,
        height: H,
        move: [
          { at: 0, view: { cx: 0.25, cy: 0.42, w: 3000 } },
          { at: 3.75, view: { cx: 0.75, cy: 0.42, w: 3000 } },
        ],
      },
      // The system's "add to home screen" dialog.
      {
        src: clips.shortcut,
        from: bar(15),
        to: bar(16),
        clipAt: 19.6,
        width: W,
        height: H,
        move: [
          { at: 0, view: { cx: 0.5, cy: 0.5, w: 3300 } },
          { at: 1.875, view: { cx: 0.5, cy: 0.5, w: 3700 } },
        ],
      },
      // The new icon on the home screen, then straight into the game.
      {
        src: clips.shortcut,
        from: bar(16),
        to: bar(16) + BEAT * 2.5,
        clipAt: 22.4,
        width: W,
        height: H,
        move: [
          { at: 0, view: { cx: 0.56, cy: 0.42, w: 2400 } },
          { at: 1.1, view: { cx: 0.56, cy: 0.42, w: 3800 } },
        ],
      },
      {
        src: clips.shortcut,
        from: bar(16) + BEAT * 2.5,
        to: bar(17),
        clipAt: 33.4,
        width: W,
        height: H,
        move: [{ at: 0, view: full(1700) }],
      },
    ],
    chips: [
      { text: "封面来自 IGDB / 维基百科", at: bar(13), until: bar(14) - 0.15, color: "#3D8BFF" },
      { text: "没有封面？用 iTunesArtwork 合成", at: bar(14), until: bar(15) - 0.15, color: "#FFC93C" },
      { text: "长按游戏 → 添加到桌面", at: bar(15), until: bar(16) - 0.15 },
      { text: "点桌面图标，直接进游戏", at: bar(16), until: bar(17) - 0.1, color: "#FF5C8A" },
    ],
  },
  {
    index: "03",
    title: "游戏库管理",
    subtitle: "收藏 · 排序 · 筛选 · 详情页",
    start: bar(17),
    end: bar(23),
    shots: [
      // "Continue playing" banner and favourites on top.
      {
        src: clips.library,
        from: bar(18),
        to: bar(19),
        clipAt: 0.2,
        width: W,
        height: H,
        move: [
          { at: 0, view: { cx: 0.3, cy: 0.16, w: 3600 } },
          { at: 1.875, view: { cx: 0.3, cy: 0.22, w: 3000 } },
        ],
      },
      // Sorting.
      {
        src: clips.library,
        from: bar(19),
        to: bar(20),
        clipAt: 3.5,
        width: W,
        height: H,
        move: [
          { at: 0, view: { cx: 0.5, cy: 0.42, w: 2600 } },
          { at: 1.875, view: { cx: 0.5, cy: 0.38, w: 2300 } },
        ],
      },
      // Filtering by progress and favourites.
      {
        src: clips.library,
        from: bar(20),
        to: bar(21),
        clipAt: 6.1,
        width: W,
        height: H,
        move: [
          { at: 0, view: { cx: 0.32, cy: 0.3, w: 2700 } },
          { at: 1.875, view: { cx: 0.38, cy: 0.34, w: 2300 } },
        ],
      },
      // Long press: the detail page, setting progress and favourite.
      {
        src: clips.library,
        from: bar(21),
        to: bar(23),
        clipAt: 10.6,
        width: W,
        height: H,
        move: [
          { at: 0, view: { cx: 0, cy: 0.27, w: 2400 } },
          { at: 3.75, view: { cx: 0, cy: 0.28, w: 2550 } },
        ],
      },
    ],
    chips: [
      { text: "「继续游戏」横幅 · 收藏置顶", at: bar(18), until: bar(19) - 0.15, color: "#3D8BFF" },
      { text: "按最近游玩 / 名称 / 游玩时长排序", at: bar(19), until: bar(20) - 0.15, color: "#FFC93C" },
      { text: "按进度和收藏筛选", at: bar(20), until: bar(21) - 0.15, color: "#FF5C8A" },
      { text: "长按打开详情页：进度、收藏、所有操作", at: bar(21), until: bar(23) - 0.1 },
    ],
  },
  {
    index: "04",
    title: "游戏时长统计",
    subtitle: "自动记录，无需设置",
    start: bar(23),
    end: bar(26),
    shots: [
      {
        src: clips.playtimeCard,
        from: bar(24),
        to: bar(25),
        width: W,
        height: H,
        move: [
          { at: 0, view: { cx: 0.42, cy: 0.45, w: 3000 } },
          { at: 1.875, view: { cx: 0.42, cy: 0.52, w: 4600 } },
        ],
      },
      {
        src: clips.playtimeDetail,
        from: bar(25),
        to: bar(26),
        width: W,
        height: H,
        move: [
          { at: 0, view: { cx: 0.2, cy: 0.14, w: 3400 } },
          { at: 1.875, view: { cx: 0.18, cy: 0.11, w: 4400 } },
        ],
      },
    ],
    chips: [
      { text: "卡片上：上次游玩 · 累计时长", at: bar(24), until: bar(25) - 0.15, color: "#3D8BFF" },
      { text: "详情页上也有", at: bar(25), until: bar(26) - 0.1, color: "#FFC93C" },
    ],
  },
];

// MHFU's extended view: a 4:3 frame that stretches on the beat to the
// extended picture, which spans the screen's width at about 2.17:1.
export const wide = {
  src: clips.mhfuWide,
  from: bar(9),
  to: bar(12),
  clipAt: 34.2,
  expandAt: bar(10),
  height: 740,
  aspect: 1696 / 782,
  screenWidth: 740 * (1696 / 782),
  chips: [
    { text: "标准画面 4:3", at: bar(9), until: bar(10) - 0.1, color: "#9AA4B8" },
    { text: "扩展视野 · 和 P2G 一样", at: bar(10) + 0.3, until: bar(12) - 0.1 },
  ] as Chip[],
};

export const outro = {
  start: END_HIT,
  note: "Android 10 及以上 · 现已发布",
  url: "github.com/shawnw67/UFtouchHLE",
};

export const audio = {
  music: "audio/upbeat.wav",
  pop: "audio/sfx_pop.wav",
  whoosh: "audio/sfx_whoosh.wav",
};
