import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadNotoSansSC } from "@remotion/google-fonts/NotoSansSC";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { Easing } from "remotion";

const inter = loadInter("normal", { weights: ["400", "500", "600"], subsets: ["latin"] });
const noto = loadNotoSansSC("normal", { weights: ["400", "500"] });
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export const fonts = {
  // Latin glyphs come from Inter, CJK glyphs fall through to Noto Sans SC.
  sans: `${inter.fontFamily}, ${noto.fontFamily}, "PingFang SC", sans-serif`,
  latin: `${inter.fontFamily}, sans-serif`,
  mono: `${mono.fontFamily}, Menlo, monospace`,
};

export const colors = {
  bgTop: "#0D1526",
  bgBottom: "#04060B",
  text: "#F2F4F8",
  muted: "#9AA4B8",
  faint: "rgba(242, 244, 248, 0.14)",
  accent: "#8BD448",
  device: "#1A1D24",
  deviceEdge: "#3A3F4A",
};

// Sizes from the brief: title 80–110, subtitle 48–64, body 40–52, small 32–40.
export const sizes = {
  title: 104,
  subtitle: 58,
  body: 46,
  small: 34,
};

export const ease = Easing.bezier(0.45, 0, 0.2, 1);
