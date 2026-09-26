import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Box, Icon, Link, Svg, SvgText, Title } from "../components/kit";
import {
  Counter,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";
import { Caps, Note } from "./S04";

const QUESTIONS = [
  "Pourquoi plus de GPU ne donne-t-il pas toujours plus de tokens ?",
  "Quelle différence entre capacité et bande passante mémoire ?",
  "Pourquoi un composant indispensable ne garantit-il pas un investissement rentable ?",
];

// Trois questions de rappel, une à la fois, puis la consigne.
const Recall: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = [cues.s(1), cues.s(2), cues.s(3)];
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  const answer = cues.s(4);
  return (
    <AbsoluteFill>
      <Title
        kicker="Avant de lire"
        text="Trois questions de rappel du module 0"
        start={cues.s(0)}
      />
      {QUESTIONS.map((q, i) => {
        const o = progress(frame, starts[i], 0.6);
        const active = i === current && frame < answer;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 260,
              top: 290 + i * 115,
              width: 1400,
              display: "flex",
              alignItems: "baseline",
              gap: 36,
              opacity: o * (active ? 1 : 0.5),
              transform: `translateX(${(1 - o) * -16}px)`,
            }}
          >
            <span
              style={{
                ...textStyle(64, 200),
                color: active ? COLORS.accent : COLORS.inkSoft,
                minWidth: 50,
              }}
            >
              {i + 1}
            </span>
            <span style={{ ...textStyle(34, 300), lineHeight: 1.3 }}>{q}</span>
          </div>
        );
      })}
      <Svg>
        <Icon
          name="pencil"
          x={300}
          y={660}
          size={26}
          start={answer}
          color={COLORS.accent}
        />
      </Svg>
      <FadeIn
        start={answer + 6}
        style={{ position: "absolute", left: 360, top: 638 }}
      >
        <div style={textStyle(32, 300)}>
          Réponds à l’oral ou sur une feuille.
        </div>
      </FadeIn>
      <Note kind="warn" x={260} y={720} width={1400} start={cues.s(5)}>
        Ce rappel ne valide pas automatiquement le module 0 et n’entre pas dans
        la note du module 1.
      </Note>
    </AbsoluteFill>
  );
};

// La méthode : mécanismes avant équations, exemples chiffrés fictifs.
const Method: React.FC = () => {
  const cues = useCues();
  const t = cues.beat(5);
  const t2 = cues.s(7);
  return (
    <AbsoluteFill>
      <Title kicker="Méthode" text="Comment progresser" start={t} />
      <Svg>
        <Caps x={960} y={290} text="ordre de lecture" start={t + 10} />
        <Box
          x={520}
          y={330}
          w={380}
          h={110}
          label="1 · Mécanisme"
          sub="comment ça marche"
          start={t + 30}
          variant="hi"
          size={32}
        />
        <Link from={[900, 385]} to={[1020, 385]} start={t + 60} />
        <Box
          x={1020}
          y={330}
          w={380}
          h={110}
          label="2 · Équations"
          sub="ensuite seulement"
          start={t + 70}
          size={32}
        />
        {/* Exemples chiffrés : fictifs, mais la relation cause → effet est réelle */}
        <Caps
          x={960}
          y={560}
          text="exemples chiffrés"
          start={t2}
          color={COLORS.warm}
        />
        <Box
          x={520}
          y={600}
          w={300}
          h={100}
          label="cause"
          sub="valeur fictive"
          start={t2 + 20}
          variant="side"
          size={30}
        />
        <Link from={[820, 650]} to={[1100, 650]} start={t2 + 40} />
        <SvgText
          x={960}
          y={620}
          text="relation à retenir"
          start={t2 + 50}
          size={24}
          color={COLORS.accent}
        />
        <Box
          x={1100}
          y={600}
          w={300}
          h={100}
          label="effet"
          sub="valeur fictive"
          start={t2 + 50}
          variant="side"
          size={30}
        />
        <SvgText
          x={960}
          y={770}
          text="On apprend le lien de cause à effet, pas les chiffres."
          start={t2 + 80}
          size={30}
          weight={300}
        />
      </Svg>
    </AbsoluteFill>
  );
};

const PARTS = [
  { name: "compréhension", pts: 25, at: 2.6 },
  { name: "raisonnement", pts: 30, at: 4.5 },
  { name: "application", pts: 30, at: 5.9 },
  { name: "explication", pts: 15, at: 7.1 },
];

// Le barème du test final et le seuil de validation.
const Grading: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(6);
  const x0 = 360;
  const W = 1200;
  const px = W / 100;
  const y = 440;
  const h = 70;
  const val = cues.s(9);
  const fill = progress(frame, val + 6, 1.3);
  let acc = 0;
  return (
    <AbsoluteFill>
      <Title kicker="Test final" text="Le barème, sur 100 points" start={t} />
      <FadeIn
        start={t + 20}
        style={{
          position: "absolute",
          top: 290,
          width: "100%",
          textAlign: "center",
        }}
      >
        <span
          style={{
            ...textStyle(24, 500),
            color: COLORS.warm,
            letterSpacing: "0.2em",
            border: `1.5px solid ${COLORS.warm}`,
            borderRadius: 999,
            padding: "8px 24px",
          }}
        >
          SANS CORRIGÉ
        </span>
      </FadeIn>
      <Svg>
        <DrawPath
          d={`M ${x0} ${y} H ${x0 + W} V ${y + h} H ${x0} Z`}
          start={t + 10}
          duration={1}
          stroke={COLORS.inkFaint}
          width={1.4}
        />
        {PARTS.map((p, i) => {
          const start = cues.s(8, p.at);
          const x = x0 + acc * px;
          acc += p.pts;
          const w = p.pts * px * progress(frame, start, 0.7);
          return (
            <g key={p.name}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill={COLORS.accent}
                opacity={0.12 + 0.1 * (i % 2)}
              />
              <DrawPath
                d={`M ${x + p.pts * px} ${y} V ${y + h}`}
                start={start + 10}
                duration={0.3}
                stroke={COLORS.inkSoft}
                width={1.4}
              />
              <SvgText
                x={x + (p.pts * px) / 2}
                y={y + h / 2}
                text={`${p.pts}`}
                start={start + 6}
                size={36}
                weight={300}
              />
              <SvgText
                x={x + (p.pts * px) / 2}
                y={y + h + 40}
                text={p.name}
                start={start + 4}
                size={26}
                color={COLORS.inkSoft}
              />
            </g>
          );
        })}
        {/* Seuil de validation à 80 */}
        <DrawPath
          d={`M ${x0 + 80 * px} ${y - 40} V ${y + h + 190}`}
          start={val}
          duration={0.5}
          stroke={COLORS.warm}
          width={2.4}
        />
        <rect
          x={x0}
          y={y + h + 110}
          width={80 * px * fill}
          height={24}
          fill={COLORS.warm}
          opacity={0.55}
        />
        <DrawPath
          d={`M ${x0} ${y + h + 110} H ${x0 + W} V ${y + h + 134} H ${x0} Z`}
          start={val}
          duration={0.6}
          stroke={COLORS.inkFaint}
          width={1.2}
        />
      </Svg>
      <FadeIn
        start={val + 4}
        style={{
          position: "absolute",
          left: x0 + 80 * px + 24,
          top: y + h + 150,
        }}
      >
        <div style={{ ...textStyle(32, 300), color: COLORS.warm }}>
          Validation à <Counter to={80} start={val + 6} duration={1.3} /> / 100
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 3 — Rappel du module 0 et méthode.
export const S03: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(5)}>
        <Recall />
      </Stage>
      <Stage from={cues.beat(5)} to={cues.beat(6)}>
        <Method />
      </Stage>
      <Stage from={cues.beat(6)}>
        <Grading />
      </Stage>
    </AbsoluteFill>
  );
};
