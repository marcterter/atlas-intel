import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { IconName, circlePath, roundRectPath } from "../components/icons";
import { Icon, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";

type Pt = [number, number];

// Position le long d'une polyligne, t ∈ [0, 1].
const along = (pts: Pt[], t: number): Pt => {
  const lens = pts
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  let d = t * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) {
      const k = d / lens[i];
      return [
        pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k,
        pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k,
      ];
    }
    d -= lens[i];
  }
  return pts[pts.length - 1];
};
const poly = (pts: Pt[]) =>
  pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");

const NODES: { t: string; icon: IconName; at: number }[] = [
  { t: "Réseau\nélectrique", icon: "bolt", at: 2.8 },
  { t: "Poste de\ntransformation", icon: "gear", at: 4.3 },
  { t: "Distribution et\nprotection du site", icon: "building", at: 5.9 },
  { t: "Alimentation\nsecourue", icon: "stack", at: 8.0 },
  { t: "Alimentations\ndes équipements", icon: "server", at: 10.2 },
  { t: "Régulation\nprès des puces", icon: "chip", at: 11.8 },
];
const NX = (i: number) => 240 + i * 288;
const NY = 460;

const PowerPath: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const flowStart = cues.s(0, 12.5);
  const on = progress(frame, flowStart, 0.6);
  return (
    <AbsoluteFill>
      <Title text="Suivre l’électricité jusqu’à la puce" start={cues.s(0)} />
      <Svg>
        {NODES.map((n, i) => {
          const at = cues.s(0, n.at);
          const last = i === NODES.length - 1;
          const color = last
            ? COLORS.accent
            : i === 0
              ? COLORS.warm
              : COLORS.ink;
          return (
            <g key={n.t}>
              <DrawPath
                d={circlePath(NX(i), NY, 64)}
                start={at}
                duration={0.6}
                stroke={color}
                width={i === 3 ? 1.4 : 2}
              />
              {i === 3 && (
                <circle
                  cx={NX(i)}
                  cy={NY}
                  r={76}
                  fill="none"
                  stroke={COLORS.warm}
                  strokeWidth={1.2}
                  strokeDasharray="5 8"
                  opacity={progress(frame, at + 20, 0.6)}
                />
              )}
              <Icon
                name={n.icon}
                x={NX(i)}
                y={NY}
                size={30}
                start={at + 6}
                color={color}
              />
              <SvgText
                x={NX(i)}
                y={NY + 130}
                text={n.t}
                start={at + 8}
                size={26}
              />
              {i > 0 && (
                <DrawPath
                  d={`M ${NX(i - 1) + 70} ${NY} H ${NX(i) - 70}`}
                  start={at - 10}
                  duration={0.5}
                  stroke={COLORS.inkFaint}
                  width={1.5}
                />
              )}
            </g>
          );
        })}
        <SvgText
          x={NX(3)}
          y={NY - 110}
          text="selon l’architecture"
          start={cues.s(0, 9)}
          size={24}
          color={COLORS.warm}
        />
        {new Array(12).fill(0).map((_, i) => {
          const ph = ((frame - flowStart) / FPS / 5 + i / 12) % 1;
          const x = NX(0) + 70 + ph * (NX(5) - NX(0) - 140);
          const nearNode = [1, 2, 3, 4].some((k) => Math.abs(x - NX(k)) < 70);
          return nearNode ? null : (
            <circle
              key={i}
              cx={x}
              cy={NY}
              r={4}
              fill={COLORS.warm}
              opacity={on}
            />
          );
        })}
      </Svg>
      <FadeIn
        start={cues.s(1)}
        style={{
          position: "absolute",
          top: 720,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300), color: COLORS.inkSoft }}>
          Le détail varie selon les installations — reconstruit dans le{" "}
          <span style={{ color: COLORS.accent }}>module Énergie</span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Même puissance, surfaces différentes : la densité de chaleur change tout.
const HeatSource: React.FC<{
  cx: number;
  size: number;
  start: number;
  hot: boolean;
}> = ({ cx, size, start, hot }) => {
  const frame = useCurrentFrame();
  const top = 620 - size;
  const on = progress(frame, start + 20, 0.6);
  const color = hot ? COLORS.warm : COLORS.inkSoft;
  return (
    <g>
      <DrawPath
        d={roundRectPath(cx - size / 2, top, size, size, 6)}
        start={start}
        duration={0.7}
        stroke={color}
      />
      <rect
        x={cx - size / 2}
        y={top}
        width={size}
        height={size}
        rx={6}
        fill={COLORS.warm}
        opacity={(hot ? 0.3 : 0.08) * on}
      />
      {new Array(14).fill(0).map((_, i) => {
        const ph = ((frame - start) / FPS / 1.8 + i / 14) % 1;
        const x = cx - size / 2 + ((i * 0.618) % 1) * size;
        return (
          <circle
            key={i}
            cx={x}
            cy={top - 10 - ph * 90}
            r={hot ? 4 : 3.5}
            fill={COLORS.warm}
            opacity={on * (1 - ph) * 0.9}
          />
        );
      })}
    </g>
  );
};

const Density: React.FC = () => {
  const cues = useCues();
  const t4 = cues.s(4);
  return (
    <AbsoluteFill>
      <Title text="La puissance et la densité thermique" start={cues.s(2)} />
      <FadeIn
        start={cues.s(3)}
        style={{
          position: "absolute",
          top: 210,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300), color: COLORS.inkSoft }}>
          La difficulté du refroidissement dépend aussi de la{" "}
          <span style={{ color: COLORS.warm }}>densité de chaleur</span>
        </div>
      </FadeIn>
      <Svg>
        <HeatSource cx={620} size={260} start={t4} hot={false} />
        <HeatSource cx={1300} size={100} start={t4 + 30} hot />
        <SvgText
          x={620}
          y={670}
          text="même puissance, grande surface"
          start={t4 + 10}
          size={28}
        />
        <SvgText
          x={1300}
          y={670}
          text="petite surface : plus difficile"
          start={t4 + 40}
          size={28}
          color={COLORS.warm}
        />
        {/* Racks plus denses */}
        {[0, 1, 2].map((i) => (
          <Icon
            key={i}
            name="rack"
            x={560 + i * 70}
            y={790}
            size={30}
            start={cues.s(5, i * 0.2)}
            color={COLORS.inkSoft}
          />
        ))}
        <DrawPath
          d="M 760 790 H 850 M 838 782 L 850 790 L 838 798"
          start={cues.s(5, 0.8)}
          duration={0.5}
          stroke={COLORS.inkSoft}
        />
        <Icon
          name="rack"
          x={910}
          y={790}
          size={38}
          start={cues.s(5, 1.1)}
          color={COLORS.warm}
        />
        <Icon
          name="bolt"
          x={980}
          y={770}
          size={18}
          start={cues.s(5, 1.5)}
          color={COLORS.warm}
        />
        <Icon
          name="snow"
          x={980}
          y={818}
          size={16}
          start={cues.s(5, 1.8)}
          color={COLORS.accent}
        />
        <SvgText
          x={1030}
          y={790}
          text={"racks plus denses : puissance et\nrefroidissement concentrés"}
          start={cues.s(5, 1)}
          size={26}
          anchor="start"
          color={COLORS.inkSoft}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Chemin de la chaleur : puce → cold plate → liquide → échangeur (→ air).
const HOT: Pt[] = [
  [660, 600],
  [820, 600],
  [820, 420],
  [1300, 420],
];
const COLD: Pt[] = [
  [1400, 660],
  [1400, 740],
  [340, 740],
  [340, 600],
  [400, 600],
];

const ColdPlate: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t6 = cues.s(6);
  const t7 = cues.s(7);
  const flow = progress(frame, t7, 0.6);
  const air = progress(frame, cues.s(9), 0.6);
  const zig = `M 1320 470 ${[0, 1, 2, 3, 4, 5, 6].map((i) => `L ${i % 2 === 0 ? 1480 : 1320} ${490 + i * 22}`).join(" ")}`;
  return (
    <AbsoluteFill>
      <Title
        kicker="Refroidissement liquide"
        text="Les cold plates, ou plaques froides"
        start={t6}
      />
      <Svg>
        {/* Carte, puce et plaque froide */}
        <DrawPath
          d="M 360 680 H 700"
          start={t6 + 10}
          duration={0.6}
          stroke={COLORS.inkSoft}
          width={1.5}
        />
        <DrawPath
          d={roundRectPath(440, 640, 180, 40, 4)}
          start={t6 + 16}
          duration={0.6}
          stroke={COLORS.warm}
        />
        <rect
          x={440}
          y={640}
          width={180}
          height={40}
          rx={4}
          fill={COLORS.warm}
          opacity={0.25 + 0.15 * Math.sin(frame / 8)}
        />
        <DrawPath
          d={roundRectPath(400, 580, 260, 50, 6)}
          start={t6 + 30}
          duration={0.7}
          stroke={COLORS.accent}
        />
        <rect
          x={400}
          y={580}
          width={260}
          height={50}
          rx={6}
          fill={COLORS.accent}
          opacity={0.12 * progress(frame, t6 + 40, 0.6)}
        />
        <SvgText
          x={530}
          y={712}
          text="puce"
          start={t6 + 20}
          size={24}
          color={COLORS.warm}
        />
        <SvgText
          x={530}
          y={546}
          text="cold plate"
          start={t6 + 36}
          size={26}
          color={COLORS.accent}
        />
        {/* Circuit de liquide */}
        <DrawPath
          d={poly(HOT)}
          start={t7}
          duration={1}
          stroke={COLORS.warm}
          width={2.5}
        />
        <DrawPath
          d={poly(COLD)}
          start={t7 + 50}
          duration={1.2}
          stroke={COLORS.accent}
          width={2.5}
        />
        <DrawPath
          d={roundRectPath(1300, 380, 200, 280, 10)}
          start={t7 + 25}
          duration={0.7}
          stroke={COLORS.ink}
        />
        <DrawPath
          d={zig}
          start={t7 + 35}
          duration={0.8}
          stroke={COLORS.inkSoft}
          width={1.5}
        />
        <SvgText x={1400} y={350} text="échangeur" start={t7 + 35} size={26} />
        <SvgText
          x={1060}
          y={390}
          text="liquide chaud"
          start={t7 + 20}
          size={24}
          color={COLORS.warm}
        />
        <SvgText
          x={870}
          y={776}
          text="liquide refroidi"
          start={t7 + 70}
          size={24}
          color={COLORS.accent}
        />
        {new Array(10).fill(0).map((_, i) => {
          const ph = ((frame - t7) / FPS / 3 + i / 10) % 1;
          const [x, y] = along(HOT, ph);
          return (
            <circle
              key={`h${i}`}
              cx={x}
              cy={y}
              r={5}
              fill={COLORS.warm}
              opacity={flow}
            />
          );
        })}
        {new Array(12).fill(0).map((_, i) => {
          const ph = ((frame - t7) / FPS / 3.6 + i / 12) % 1;
          const [x, y] = along(COLD, ph);
          return (
            <circle
              key={`c${i}`}
              cx={x}
              cy={y}
              r={5}
              fill={COLORS.accent}
              opacity={flow * progress(frame, t7 + 60, 0.6)}
            />
          );
        })}
        {/* L'air traverse l'échangeur et emporte la chaleur */}
        {[0, 1, 2].map((k) => {
          const ph = ((frame - cues.s(9)) / FPS / 2 + k / 3) % 1;
          return (
            <g key={k} opacity={air}>
              <path
                d={`M ${1700 - ph * 180} ${450 + k * 70} h -40 m 10 -8 l -10 8 l 10 8`}
                fill="none"
                stroke={COLORS.accent}
                strokeWidth={2}
                opacity={1 - ph}
              />
            </g>
          );
        })}
        {[0, 1, 2].map((k) => {
          const ph = ((frame - cues.s(8)) / FPS / 1.8 + k / 3) % 1;
          return (
            <path
              key={k}
              d={`M ${1350 + k * 50} ${330 - ph * 110} q 8 -10 16 0 t 16 0`}
              fill="none"
              stroke={COLORS.warm}
              strokeWidth={2}
              opacity={progress(frame, cues.s(8), 0.6) * (1 - ph)}
            />
          );
        })}
        <SvgText
          x={1640}
          y={640}
          text="air"
          start={cues.s(9)}
          size={26}
          color={COLORS.accent}
        />
      </Svg>
      <FadeIn
        start={cues.s(8)}
        style={{ position: "absolute", left: 140, top: 820, width: 1200 }}
      >
        <div style={{ ...textStyle(30, 300) }}>
          Le liquide <span style={{ color: COLORS.warm }}>transporte</span> la
          chaleur ; il ne la fait pas disparaître.
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(10)}
        style={{
          position: "absolute",
          left: 1500,
          top: 826,
          width: 280,
          textAlign: "right",
        }}
      >
        <div style={{ ...textStyle(22, 400), color: COLORS.inkSoft }}>
          [4] Vertiv
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 23 — De la prise réseau à la puce, puis la densité thermique et les cold plates.
export const S23: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(2)}>
        <PowerPath />
      </Stage>
      <Stage from={cues.s(2)} to={cues.s(6)}>
        <Density />
      </Stage>
      <Stage from={cues.s(6)}>
        <ColdPlate />
      </Stage>
    </AbsoluteFill>
  );
};
