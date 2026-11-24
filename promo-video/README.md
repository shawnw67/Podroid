# UFtouchHLE 宣传片

约 90 秒的中文产品宣传片，用 Remotion（React + TypeScript）制作，所有动效由代码控制。

- 输出：1920×1080 · 30 FPS · H.264 MP4
- 合成：`UFtouchHLE-Promo-CN`（中文）、`UFtouchHLE-Promo-EN`（无中文字幕的国际版，英文文案）
- 分镜与视觉规范：[docs/STORYBOARD.md](docs/STORYBOARD.md)
- 素材清单：[docs/ASSETS_NEEDED.md](docs/ASSETS_NEEDED.md)

## 目录

```text
src/config.ts        镜头时间、文字、素材路径、音效时间点（日常修改只改这里）
src/scenes.tsx       七幕场景
src/components.tsx   场景淡入淡出、字幕、设备外框、素材槽位
src/theme.ts         颜色、字体、字号、缓动曲线
src/code-excerpt.ts  第 6 幕使用的真实源码片段（scripts/extract-code.sh 生成）
scripts/make_music.py  合成原创配乐与音效
public/audio/        配乐与音效（脚本生成）
public/assets/       Logo 与录屏素材
```

## 预览与渲染

```bash
npm i
npx remotion studio
```

导出正式版：

```bash
npx remotion render UFtouchHLE-Promo-CN out/UFtouchHLE_Promo_CN.mp4 --codec=h264 --crf=16
```

国际版：

```bash
npx remotion render UFtouchHLE-Promo-EN out/UFtouchHLE_Promo_EN.mp4 --codec=h264 --crf=16
```

关键帧：

```bash
npx remotion still UFtouchHLE-Promo-CN out/keyframes/t36.jpg --frame=1080
```

字体（Inter、Noto Sans SC、JetBrains Mono，均为 OFL）在渲染时从 Google Fonts 加载，渲染需要联网。

## 替换素材

1. 把录屏放进 `public/assets/ScreenRecorder/` 或 `public/assets/footage/`。
2. 在 `src/config.ts` 中把对应的 `media: null` 改成
   `{ kind: "video", src: "assets/footage/文件名.mp4", trimBefore: 秒数 }`。
3. 游戏的 `aspect` 填画面宽高比（如 16 / 9、3 / 2），画面会按比例放大，宽度约占画面的 70–78%。
4. 正式导出前把 `showPlaceholders` 改为 `false`：没有录屏的游戏会被去掉，其余游戏平分 30 秒。

录屏用原速播放，默认静音。

## 配乐与音效

全部由 `scripts/make_music.py` 用振荡器和噪声合成，是本项目的原创作品，没有第三方版权。修改后重新生成：

```bash
python3 scripts/make_music.py
```

- `music.wav`：96 BPM，A 小调，Am(add9) – Fmaj7 – Cmaj7 – G6 循环。段落按七幕安排：开场只有铺底，10 秒起加入轻脉冲，游戏展示段节奏最完整，结尾回到主和弦并淡出。
- `sfx_swell.wav`：转场前的轻柔气流声。
- `sfx_chime.wav`：Logo 出现时的钟音。

音效的时间点和音量在 `src/config.ts` 的 `audio.cues` 中。

## 素材来源

- Logo：仓库 `res/icon_uf.png`（v0.3.22 正式图标）。
- Inotia 1 标题画面：维护者此前用 UFtouchHLE 在 Android 上截取的画面（`video/assets/`）。
- 启动器与游戏录屏：维护者用 UFtouchHLE v0.3.22 在 Android 手机上录制（`public/assets/ScreenRecorder/`）。录屏有黑边的游戏按画面比例裁切（见 `src/config.ts` 的 `aspect`）。
- 手柄画面（5d）带 bilibili 用户水印，使用前需确认授权。
- 第 6 幕源码：仓库 `src/frameworks/game_controller.rs` 原文。
- 早期 iPhone 与 Android 手机外框：代码绘制的简化轮廓，不含商标图像。

游戏画面版权归各自权利人所有，仅用于展示模拟器的运行效果；本项目不提供游戏文件。
