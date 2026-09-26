import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { circlePath, roundRectPath } from "../components/icons";
import { Icon, Link, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";

const FONT_SVG = '"Inter Variable", Inter, sans-serif';

// Étape 4a : le modèle est réparti sur quatre accélérateurs qui échangent des données.
const ACC_X = [480, 800, 1120, 1440];
const Exchange: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const y = 600;
  return (
    <AbsoluteFill>
      <Svg>
        {/* Le modèle, découpé en quatre parts. */}
        {ACC_X.map((x, i) => (
          <g key={i}>
            <DrawPath
              d={roundRectPath(x - 140, 330, 280, 50, 8)}
              start={t + 10 + i * 6}
              duration={0.5}
              stroke={COLORS.accent}
            />
            <SvgText
              x={x}
              y={355}
              text={`partie ${i + 1}`}
              start={t + 16 + i * 6}
              size={22}
              color={COLORS.accent}
            />
            <Link
              from={[x, 380]}
              to={[x, y - 70]}
              start={t + 30 + i * 6}
              gap={6}
            />
            <Icon
              name="chip"
              x={x}
              y={y}
              size={58}
              start={t + 36 + i * 6}
              duration={0.8}
            />
            <SvgText
              x={x}
              y={y + 104}
              text="Accélérateur"
              start={t + 44 + i * 6}
              size={22}
              color={COLORS.inkSoft}
            />
          </g>
        ))}
        <SvgText
          x={960}
          y={290}
          text="MODÈLE RÉPARTI"
          start={t + 6}
          size={22}
          weight={500}
          spacing="0.28em"
          color={COLORS.accent}
        />
        {ACC_X.slice(0, 3).map((x, i) => (
          <DrawPath
            key={i}
            d={`M ${x + 70} ${y} H ${ACC_X[i + 1] - 70}`}
            start={t + 60 + i * 6}
            duration={0.6}
            stroke={COLORS.inkSoft}
            width={1.6}
          />
        ))}
        {/* Paquets de données qui circulent dans les deux sens. */}
        {frame > t + 80 &&
          ACC_X.slice(0, 3).map((x, i) =>
            [0, 1].map((dir) => {
              const period = 40 + i * 7;
              const ph =
                (((frame - t - 80 + dir * 17 + i * 11) % period) + period) %
                period;
              const p = ph / period;
              const a = x + 72;
              const b = ACC_X[i + 1] - 72;
              const px = dir === 0 ? a + (b - a) * p : b - (b - a) * p;
              return (
                <circle
                  key={`${i}-${dir}`}
                  cx={px}
                  cy={y + (dir === 0 ? -8 : 8)}
                  r={5}
                  fill={dir === 0 ? COLORS.accent : COLORS.ink}
                />
              );
            }),
          )}
      </Svg>
    </AbsoluteFill>
  );
};

// Étape 4b : un accélérateur attend… mais quoi ?
const WAITS = [
  {
    label: "Lecture mémoire",
    icon: "memory" as const,
    x: 540,
    y: 400,
    d: 1.6,
  },
  {
    label: "Résultat d’un autre\naccélérateur",
    icon: "chip" as const,
    x: 1380,
    y: 400,
    d: 3.2,
  },
  {
    label: "Communication réseau",
    icon: "network" as const,
    x: 540,
    y: 720,
    d: 5.2,
  },
  {
    label: "Tâche logicielle\npréalable",
    icon: "gear" as const,
    x: 1380,
    y: 720,
    d: 6.6,
  },
];
const Waiting: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(2);
  const cx = 960;
  const cy = 560;
  const spin = (frame - t) * 2;
  return (
    <AbsoluteFill>
      <Svg>
        <Icon
          name="chip"
          x={cx}
          y={cy}
          size={64}
          start={t}
          color={COLORS.warm}
        />
        <g transform={`rotate(${spin} ${cx} ${cy})`}>
          <path
            d={circlePath(cx, cy, 110)}
            fill="none"
            stroke={COLORS.warm}
            strokeWidth={2}
            strokeDasharray="10 16"
            opacity={progress(frame, t + 10, 0.6) * 0.8}
          />
        </g>
        <SvgText
          x={cx}
          y={cy + 150}
          text="EN ATTENTE"
          start={t + 14}
          size={22}
          weight={500}
          spacing="0.3em"
          color={COLORS.warm}
        />
        {WAITS.map((w) => {
          const at = cues.s(2, w.d);
          const dx = w.x < cx ? 1 : -1;
          return (
            <g key={w.label}>
              <Icon
                name={w.icon}
                x={w.x}
                y={w.y - 30}
                size={34}
                start={at}
                color={COLORS.ink}
              />
              <SvgText
                x={w.x}
                y={w.y + 50}
                text={w.label}
                start={at + 6}
                size={26}
                weight={300}
              />
              <Link
                from={[w.x + dx * 160, w.y - 20 + (w.y < cy ? 20 : -20)]}
                to={[cx - dx * 120, cy + (w.y < cy ? -60 : 60)]}
                start={at + 10}
                color={COLORS.warm}
                gap={6}
              />
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

// Étape 5 : génération autorégressive, token après token.
const OUT = ["La", "réponse", "arrive", "token", "par", "token", "…"];
const Generate: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(3);
  const rowY = 610;
  const pillH = 64;
  const ctxW = 250;
  const gap = 18;
  const widths = OUT.map((w) => Math.max(84, w.length * 19 + 52));
  const xs: number[] = [];
  let x = 190 + ctxW + gap;
  widths.forEach((w) => {
    xs.push(x);
    x += w + gap;
  });
  const genStart = cues.s(4, 1.2);
  const step = 1.25 * FPS;
  const tk = OUT.map((_, i) => genStart + i * step);
  const current = tk.reduce((acc, s, i) => (frame >= s - 14 ? i : acc), -1);
  const model = { x: 810, y: 290, w: 300, h: 90 };
  return (
    <AbsoluteFill>
      <Title kicker="Étape 5" text="La réponse se construit" start={t} />
      <Svg>
        <DrawPath
          d={roundRectPath(model.x, model.y, model.w, model.h, 14)}
          start={cues.s(4)}
          duration={0.7}
          stroke={COLORS.accent}
        />
        <SvgText
          x={960}
          y={model.y + model.h / 2}
          text="Modèle"
          start={cues.s(4, 0.3)}
          size={32}
          weight={300}
        />
        {/* Contexte : la question de départ. */}
        <DrawPath
          d={roundRectPath(190, rowY - pillH / 2, ctxW, pillH, pillH / 2)}
          start={cues.s(4, 0.2)}
          duration={0.6}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={190 + ctxW / 2}
          y={rowY}
          text="ta question"
          start={cues.s(4, 0.4)}
          size={28}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={190 + ctxW / 2}
          y={rowY + 70}
          text="CONTEXTE"
          start={cues.s(4, 0.5)}
          size={22}
          weight={500}
          spacing="0.25em"
          color={COLORS.inkSoft}
        />
        {/* Le modèle relit tout ce qui précède… */}
        <DrawPath
          d={`M 315 ${rowY - pillH / 2 - 6} C 315 360 560 ${model.y + model.h / 2} ${model.x - 8} ${model.y + model.h / 2}`}
          start={cues.s(4, 0.7)}
          duration={0.9}
          stroke={COLORS.inkSoft}
          width={1.6}
        />
        <SvgText
          x={600}
          y={462}
          text="contexte + tokens précédents"
          start={cues.s(4, 1)}
          size={24}
          color={COLORS.inkSoft}
        />
        {OUT.map((w, i) => {
          const at = tk[i];
          const o = progress(frame, at, 0.4);
          const isCur = i === current;
          const beam = progress(frame, at - 14, 0.45);
          const cxTok = xs[i] + widths[i] / 2;
          return (
            <g key={i}>
              {/* …puis produit le token suivant. */}
              {beam > 0 && isCur && (
                <path
                  d={`M 960 ${model.y + model.h + 6} L ${interpolate(beam, [0, 1], [960, cxTok])} ${interpolate(beam, [0, 1], [model.y + model.h + 6, rowY - pillH / 2 - 8])}`}
                  stroke={COLORS.accent}
                  strokeWidth={2}
                  fill="none"
                />
              )}
              <path
                d={roundRectPath(
                  xs[i],
                  rowY - pillH / 2,
                  widths[i],
                  pillH,
                  pillH / 2,
                )}
                fill={isCur ? "rgba(143, 208, 255, 0.12)" : "none"}
                stroke={COLORS.accent}
                strokeWidth={isCur ? 2 : 1.4}
                opacity={o}
              />
              <text
                x={cxTok}
                y={rowY + 11}
                textAnchor="middle"
                fontFamily={FONT_SVG}
                fontWeight={300}
                fontSize={32}
                fill={COLORS.ink}
                opacity={o}
              >
                {w}
              </text>
            </g>
          );
        })}
      </Svg>
      <FadeIn
        start={cues.s(4, 4)}
        style={{
          position: "absolute",
          top: 740,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300) }}>
          Génération{" "}
          <span style={{ color: COLORS.accent }}>autorégressive</span> : un
          token à la fois, chacun dépend des précédents
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Inférence ≠ entraînement.
const Words: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const a = cues.s(5);
  const b = cues.s(6);
  const eq = progress(frame, b - 6, 0.5);
  const cards = [
    {
      x: 230,
      term: "Inférence",
      def: "utilisation du modèle entraîné",
      color: COLORS.accent,
      at: a + 30,
      icon: "token" as const,
    },
    {
      x: 1030,
      term: "Entraînement",
      def: "processus qui ajuste ses paramètres",
      color: COLORS.warm,
      at: b,
      icon: "gear" as const,
    },
  ];
  return (
    <AbsoluteFill>
      <Title text="Deux mots à ne jamais confondre" start={a} />
      <Svg>
        {cards.map((c) => (
          <g key={c.term}>
            <DrawPath
              d={roundRectPath(c.x, 300, 660, 400, 18)}
              start={c.at}
              duration={0.9}
              stroke={c.color}
            />
            <Icon
              name={c.icon}
              x={c.x + 330}
              y={400}
              size={44}
              start={c.at + 10}
              color={c.color}
            />
            <SvgText
              x={c.x + 330}
              y={530}
              text={c.term}
              start={c.at + 14}
              size={54}
              weight={200}
              color={c.color}
            />
            <SvgText
              x={c.x + 330}
              y={620}
              text={c.def}
              start={c.at + 24}
              size={30}
              weight={300}
            />
          </g>
        ))}
        {trainingSpin(frame, b)}
      </Svg>
      <div
        style={{
          position: "absolute",
          top: 460,
          left: 900,
          width: 120,
          textAlign: "center",
          opacity: eq,
          ...textStyle(72, 200),
          color: COLORS.ink,
        }}
      >
        ≠
      </div>
    </AbsoluteFill>
  );
};

// Petite flèche circulaire autour de l'engrenage : les paramètres changent.
const trainingSpin = (frame: number, b: number) => {
  const p = progress(frame, b + 30, 0.8);
  if (p === 0) return null;
  const cx = 1360;
  const cy = 400;
  const spin = (frame - b) * 1.5;
  return (
    <g
      transform={`rotate(${spin} ${cx} ${cy})`}
      opacity={p}
      stroke={COLORS.warm}
      fill="none"
      strokeWidth={1.6}
    >
      <path d={`M ${cx + 70} ${cy} A 70 70 0 0 1 ${cx - 70} ${cy}`} />
      <path
        d={`M ${cx - 70} ${cy} l -8 -12 M ${cx - 70} ${cy} l 10 -10`}
        strokeLinecap="round"
      />
    </g>
  );
};

// Scène 8 — Étapes 4 et 5, puis inférence et entraînement.
export const S08: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(3)}>
        <Title
          kicker="Étape 4"
          text="Les composants échangent"
          start={cues.s(0)}
        />
      </Stage>
      <Stage from={cues.s(1) - 6} to={cues.s(2)}>
        <Exchange />
      </Stage>
      <Stage from={cues.s(2)} to={cues.s(3)}>
        <Waiting />
      </Stage>
      <Stage from={cues.s(3)} to={cues.s(5)}>
        <Generate />
      </Stage>
      <Stage from={cues.s(5)}>
        <Words />
      </Stage>
    </AbsoluteFill>
  );
};
