// Cover image for the save-crack video: a big title that reads at thumbnail
// size, with the video's stickers around it. Render its last frame.

import React from "react";
import { AbsoluteFill } from "remotion";
import { Envelope, Hunter, Phone, Psp, Stamp, Star } from "./art";
import { Arrow, Big, col, paper, ink, Place, Tag } from "./kit";

export const Cover: React.FC = () => (
  <AbsoluteFill
    style={{
      background: paper,
      backgroundImage: `radial-gradient(${ink}22 2.4px, transparent 2.6px)`,
      backgroundSize: "44px 44px",
    }}
  >
    <Place x={500} y={90} at={0} tilt={-2} seed="cover-kicker">
      <Tag text="怪物猎人 P2G · 存档破解全过程" size={48} color={col.white} />
    </Place>
    <Place x={560} y={290} at={0} tilt={-3} seed="cover-l1">
      <Big size={210}>PSP 存档</Big>
    </Place>
    <Place x={640} y={540} at={0} tilt={-1} seed="cover-l2">
      <Big size={190} color={col.pink}>
        搬进手机！
      </Big>
    </Place>

    <Place x={1530} y={170} at={0} tilt={-6} seed="cover-psp">
      <Psp scale={1.05} />
    </Place>
    <Arrow from={[1420, 300]} to={[1540, 520]} bend={0.25} at={-1} />
    <Place x={1350} y={420} at={0} tilt={-12} seed="cover-env">
      <Envelope color={col.blue} locked={col.yellow} scale={0.6} />
    </Place>
    <Place x={1640} y={700} at={0} tilt={6} seed="cover-phone">
      <Phone scale={1.15} />
    </Place>
    <Place x={1640} y={720} at={0} tilt={-12} seed="cover-ok">
      <Stamp text="破解成功" color="#1E9E5A" size={92} />
    </Place>

    <Place x={170} y={860} at={0} tilt={-6} seed="cover-poor">
      <Hunter mood="cry" scale={0.75} />
    </Place>
    <Arrow from={[300, 860]} to={[420, 840]} bend={-0.25} at={-1} />
    <Place x={600} y={830} at={0} seed="cover-rich">
      <Hunter rich mood="happy" scale={1.05} />
    </Place>
    <Place x={1060} y={790} at={0} tilt={3} seed="cover-zero">
      <Stamp text="0 字节差异" size={70} color={col.red} />
    </Place>
    <Place x={1050} y={960} at={0} tilt={-2} seed="cover-version">
      <Tag text="UFtouchHLE v0.3.25" size={52} color={col.yellow} />
    </Place>
    <Place x={1180} y={120} at={0} tilt={15} seed="cover-star1">
      <Star color={col.yellow} scale={0.6} />
    </Place>
    <Place x={1880} y={1000} at={0} tilt={-10} seed="cover-star2">
      <Star color={col.mint} scale={0.5} />
    </Place>
  </AbsoluteFill>
);
