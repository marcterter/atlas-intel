import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { icons, roundRectPath } from "../components/icons";
import { FlowChain, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT, FPS } from "../theme";
import { Flow, SvgCaps, TextAt, accentA, caps, warmA } from "./S23";

// --- 1. Un fil de puce : résistance et capacité.
const zig = (x: number, y: number, w: number) => {
  const n = 6;
  const pts = [`M ${x} ${y}`];
  for (let i = 1; i < n; i++)
    pts.push(`L ${x + (w * i) / n} ${y + (i % 2 ? -12 : 12)}`);
  pts.push(`L ${x + w} ${y}`);
  return pts.join(" ");
};

const Wire: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const s2 = cues.s(2);
  const yW = 330;
  const yL = 500;
  const yG = 610;
  const x0 = 220;
  const seg = 220;
  const thin = progress(frame, s2 + FPS * 0.8, 1.2);
  return (
    <AbsoluteFill>
      <Title
        kicker="Les limites physiques"
        text="Les connexions deviennent une partie du problème"
        start={cues.s(0)}
      />
      <Svg>
        {/* Le fil entre deux portes */}
        <DrawPath
          d={`M ${x0 - 40} ${yW - 24} L ${x0} ${yW} L ${x0 - 40} ${yW + 24} Z`}
          start={t}
          duration={0.5}
          stroke={COLORS.ink}
        />
        <DrawPath
          d={`M ${x0} ${yW} H ${x0 + 4 * seg}`}
          start={t + 6}
          duration={1}
          stroke={COLORS.accent}
          width={4}
        />
        <DrawPath
          d={`M ${x0 + 4 * seg} ${yW - 24} L ${x0 + 4 * seg + 40} ${yW} L ${x0 + 4 * seg} ${yW + 24} Z`}
          start={t + 20}
          duration={0.5}
          stroke={COLORS.ink}
        />
        <SvgText
          x={x0 + 2 * seg}
          y={yW - 36}
          text="fil métallique de la puce"
          start={t + 10}
          size={24}
          color={COLORS.accent}
        />
        {/* Modèle RC en échelle */}
        <SvgCaps
          x={x0 - 40}
          y={yL - 60}
          text="modèle électrique"
          start={t + FPS * 1.2}
          anchor="start"
        />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <DrawPath
              d={zig(x0 + i * seg, yL, seg * 0.6)}
              start={t + FPS * (1.4 + i * 0.25)}
              duration={0.5}
              stroke={COLORS.warm}
              width={1.8}
            />
            <DrawPath
              d={`M ${x0 + i * seg + seg * 0.6} ${yL} H ${x0 + (i + 1) * seg}`}
              start={t + FPS * (1.6 + i * 0.25)}
              duration={0.3}
              stroke={COLORS.ink}
              width={1.6}
            />
            <DrawPath
              d={`M ${x0 + (i + 1) * seg} ${yL} V ${yL + 40} M ${x0 + (i + 1) * seg - 22} ${yL + 40} H ${x0 + (i + 1) * seg + 22} M ${x0 + (i + 1) * seg - 22} ${yL + 54} H ${x0 + (i + 1) * seg + 22} M ${x0 + (i + 1) * seg} ${yL + 54} V ${yG}`}
              start={t + FPS * (2.2 + i * 0.25)}
              duration={0.5}
              stroke={COLORS.accent}
              width={1.6}
            />
          </g>
        ))}
        <DrawPath
          d={`M ${x0} ${yG} H ${x0 + 4 * seg + 20}`}
          start={t + FPS * 2.2}
          duration={0.8}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        <SvgText
          x={x0 + seg * 0.3}
          y={yL - 34}
          text="R"
          start={t + FPS * 1.6}
          size={28}
          color={COLORS.warm}
        />
        <SvgText
          x={x0 + seg + 42}
          y={yL + 48}
          text="C"
          start={t + FPS * 2.4}
          size={28}
          color={COLORS.accent}
          anchor="start"
        />
        <SvgText
          x={x0 + 2 * seg}
          y={yG + 40}
          text="délai du fil ∝ R × C"
          start={t + FPS * 3}
          size={28}
          color={COLORS.ink}
        />
        {/* Section du fil : plus fine → R plus grande */}
        <SvgCaps x={1500} y={yL - 110} text="section du fil" start={s2} />
        <rect
          x={1320}
          y={yL - 60}
          width={120}
          height={80}
          fill={accentA(0.35)}
          stroke={COLORS.accent}
          strokeWidth={1.6}
          opacity={progress(frame, s2, 0.5)}
        />
        <rect
          x={1560 + 30 * thin}
          y={yL - 60}
          width={120 - 60 * thin}
          height={80}
          fill={warmA(0.35)}
          stroke={COLORS.warm}
          strokeWidth={1.6}
          opacity={progress(frame, s2 + 10, 0.5)}
        />
        <SvgText x={1380} y={yL + 60} text="large" start={s2} size={24} />
        <SvgText
          x={1620}
          y={yL + 60}
          text="plus fin"
          start={s2 + 10}
          size={24}
          color={COLORS.warm}
        />
        <text
          x={1620}
          y={yL + 100}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={26}
          fill={COLORS.warm}
          opacity={thin}
        >
          R × {(1 / (1 - 0.5 * thin)).toFixed(1).replace(".", ",")}
        </text>
      </Svg>
      <TextAt
        x={1300}
        y={yL + 150}
        w={480}
        start={s2 + FPS * 1.6}
        align="center"
      >
        <div style={{ ...textStyle(28, 300) }}>R = ρ × longueur / section</div>
      </TextAt>
    </AbsoluteFill>
  );
};

// --- 2. À l'échelle d'un grand circuit.
const Floorplan: React.FC = () => {
  const cues = useCues();
  const t = cues.s(3);
  const s4 = cues.s(4);
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={roundRectPath(200, 200, 640, 640, 14)}
          start={t}
          duration={1}
          stroke={COLORS.inkSoft}
        />
        <SvgCaps
          x={520}
          y={180}
          text="un grand circuit (vue de dessus)"
          start={t}
        />
        {/* Bloc de calcul */}
        <DrawPath
          d={roundRectPath(240, 240, 220, 180, 8)}
          start={t + 10}
          duration={0.6}
          stroke={COLORS.accent}
        />
        <SvgText
          x={350}
          y={270}
          text="calcul"
          start={t + 16}
          size={24}
          color={COLORS.accent}
        />
        <DrawPath
          d={`${roundRectPath(310, 320, 26, 26, 3)} ${roundRectPath(352, 320, 26, 26, 3)}`}
          start={t + 22}
          duration={0.4}
          stroke={COLORS.ink}
        />
        <DrawPath
          d="M 336 333 H 352"
          start={t + 30}
          duration={0.3}
          stroke={COLORS.ink}
        />
        <SvgText
          x={350}
          y={385}
          text="transistors voisins"
          start={t + 30}
          size={22}
          color={COLORS.inkSoft}
        />
        {/* Mémoire loin */}
        <DrawPath
          d={roundRectPath(580, 620, 220, 180, 8)}
          start={t + 16}
          duration={0.6}
          stroke={COLORS.ink}
        />
        <DrawPath
          d={icons.memory(690, 700, 30)}
          start={t + 22}
          stroke={COLORS.ink}
        />
        <SvgText x={690} y={770} text="mémoire" start={t + 24} size={24} />
        {/* Autres blocs */}
        <DrawPath
          d={`${roundRectPath(580, 240, 220, 180, 8)} ${roundRectPath(240, 620, 220, 180, 8)}`}
          start={t + 20}
          duration={0.6}
          stroke={COLORS.inkFaint}
          width={1.2}
        />
        {/* Trajet long des données */}
        <DrawPath
          d="M 460 400 H 520 V 700 H 580"
          start={t + FPS * 2.4}
          duration={1}
          stroke={COLORS.warm}
          width={2}
        />
        <Flow
          pts={[
            [460, 400],
            [520, 400],
            [520, 700],
            [580, 700],
          ]}
          start={t + FPS * 3}
          n={6}
          period={3}
          r={4.5}
        />
        <SvgText
          x={540}
          y={560}
          text="long trajet"
          start={t + FPS * 3}
          size={22}
          color={COLORS.warm}
          anchor="start"
        />
      </Svg>
      <TextAt x={960} y={260} w={820} start={t + FPS * 1}>
        <div style={{ ...textStyle(32, 300) }}>
          Rapprocher des transistors ne raccourcit pas{" "}
          <span style={{ color: COLORS.warm }}>toutes</span> les communications.
        </div>
      </TextAt>
      <TextAt x={960} y={470} w={820} start={s4}>
        <div style={caps(COLORS.warm)}>DÉPLACER LES DONNÉES COÛTE</div>
        <div style={{ ...textStyle(30, 300), marginTop: 12 }}>
          du délai (fils longs, RC)
        </div>
        <div style={{ ...textStyle(30, 300), marginTop: 6 }}>
          de l’énergie (charger ces fils)
        </div>
        <div
          style={{ ...textStyle(30, 300), marginTop: 12, color: COLORS.warm }}
        >
          → cela peut limiter le système
        </div>
      </TextAt>
    </AbsoluteFill>
  );
};

// --- 3. La chaîne causale.
const Chain: React.FC = () => {
  const cues = useCues();
  const t = cues.s(5);
  const s6 = cues.s(6);
  const w = (1640 - 3 * 56) / 4;
  return (
    <AbsoluteFill>
      <TextAt x={960} y={180} w={1400} start={t} align="center">
        <div style={textStyle(40, 200)}>La chaîne</div>
      </TextAt>
      <FlowChain
        y={460}
        h={170}
        size={26}
        items={[
          "Plus de\ntransistors\ndisponibles",
          "Davantage\nde fonctions\npossibles",
          "Plus de\ncommunications\net de mémoire",
          "Pression :\ninterconnexions,\npackaging, énergie",
        ]}
        starts={[0.4, 3.2, 6.2, 9.6].map((d) => t + FPS * d)}
        highlight={[3]}
      />
      <Svg>
        {[0, 1, 2].map((i) => {
          const mx = 140 + (i + 1) * w + i * 56 + 28;
          return (
            <g key={i}>
              <DrawPath
                d={`M ${mx} 480 V 600`}
                start={s6 + i * 6}
                duration={0.5}
                stroke={COLORS.warm}
                width={1.2}
              />
              <SvgText
                x={mx}
                y={640}
                text={"dépend de\nl’architecture"}
                start={s6 + 6 + i * 6}
                size={22}
                color={COLORS.warm}
              />
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

// --- 4. ×10 transistors et budget de puissance.
const TimesTen: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(7);
  const base = 760;
  const budget = 540;
  const topClip = 280;
  const bars = [
    {
      x: 330,
      h: 160,
      label: "aujourd’hui",
      at: t + FPS * 1.2,
      color: COLORS.accent,
    },
    {
      x: 760,
      h: 1600,
      label: "× 10 transistors\nsans rien revoir",
      at: t + FPS * 4,
      color: COLORS.warm,
    },
    {
      x: 1190,
      h: 200,
      label: "× 10, en revoyant tension,\nactivité et architecture",
      at: t + FPS * 10,
      color: COLORS.accent,
    },
  ];
  return (
    <AbsoluteFill>
      <TextAt x={960} y={130} w={1500} start={t} align="center">
        <div style={textStyle(40, 200)}>
          La question de la multiplication par dix
        </div>
      </TextAt>
      <Svg>
        <DrawPath
          d={`M 240 ${base} H 1560`}
          start={t}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <path
          d={`M 240 ${budget} H 1560`}
          stroke={COLORS.warm}
          strokeWidth={1.6}
          strokeDasharray="10 8"
          opacity={progress(frame, t + 10, 0.6)}
        />
        <SvgText
          x={1570}
          y={budget}
          text={"budget de\npuissance"}
          start={t + 10}
          size={24}
          color={COLORS.warm}
          anchor="start"
        />
        {bars.map((b) => {
          const p = progress(frame, b.at, 1.6);
          const h = Math.min(b.h * p, base - topClip);
          const over = b.h * p > base - topClip;
          return (
            <g key={b.x} opacity={progress(frame, b.at - 6, 0.3)}>
              <rect
                x={b.x}
                y={base - h}
                width={160}
                height={h}
                fill={b.color === COLORS.warm ? warmA(0.25) : accentA(0.22)}
                stroke={b.color}
                strokeWidth={1.6}
              />
              {over && (
                <path
                  d={`M ${b.x - 10} ${topClip + 8} l 45 -14 l 45 14 l 45 -14 l 45 14`}
                  stroke={COLORS.warm}
                  strokeWidth={2}
                  fill="none"
                />
              )}
              <SvgText
                x={b.x + 80}
                y={base + 44}
                text={b.label}
                start={b.at}
                size={24}
                color={COLORS.ink}
              />
            </g>
          );
        })}
        <SvgText
          x={840}
          y={topClip - 30}
          text="dépasse le budget"
          start={t + FPS * 6.5}
          size={28}
          color={COLORS.warm}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// --- 5. La limite suivante.
const NEXT: { name: string; icon: "memory" | "network" | "euro" }[] = [
  { name: "débit mémoire", icon: "memory" },
  { name: "réseau", icon: "network" },
  { name: "coût de fabrication", icon: "euro" },
];
const Next: React.FC = () => {
  const cues = useCues();
  const t = cues.s(8);
  const s9 = cues.s(9);
  return (
    <AbsoluteFill>
      <TextAt x={960} y={150} w={1500} start={t} align="center">
        <div style={textStyle(40, 200)}>
          Même ce problème résolu, la limite suivante peut être…
        </div>
      </TextAt>
      <Svg>
        {NEXT.map((n, i) => {
          const x = 420 + i * 540;
          const at = t + FPS * (2 + i * 1.3);
          return (
            <g key={n.name}>
              <DrawPath
                d={roundRectPath(x - 200, 290, 400, 250, 16)}
                start={at}
                duration={0.7}
                stroke={COLORS.inkSoft}
                width={1.4}
              />
              <DrawPath
                d={icons[n.icon](x, 380, 40)}
                start={at + 8}
                stroke={COLORS.warm}
              />
              <SvgText x={x} y={480} text={n.name} start={at + 12} size={32} />
            </g>
          );
        })}
        <DrawPath
          d={icons.bottleneck(960, 640, 40)}
          start={s9}
          stroke={COLORS.accent}
        />
      </Svg>
      <TextAt x={960} y={700} w={1400} start={s9 + 6} align="center">
        <div style={{ ...textStyle(40, 200) }}>
          Reviens toujours au{" "}
          <span style={{ color: COLORS.accent }}>bottleneck</span> du travail
          réel.
        </div>
      </TextAt>
    </AbsoluteFill>
  );
};

export const S32: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(1)}>
        <Wire />
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(2)}>
        <Floorplan />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(3)}>
        <Chain />
      </Stage>
      <Stage from={cues.beat(3)} to={cues.beat(4)}>
        <TimesTen />
      </Stage>
      <Stage from={cues.beat(4)}>
        <Next />
      </Stage>
    </AbsoluteFill>
  );
};
