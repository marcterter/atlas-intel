import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { icons, roundRectPath } from "../components/icons";
import { Icon, Link, Svg, SvgText } from "../components/kit";
import {
  Arrow,
  DrawPath,
  Stage,
  progress,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import {
  PartIntro,
  PartTag,
  QuestionCard,
  QuestionDots,
  Reveal,
  nb,
} from "./S49";

// B1 : la tension baisse ; puissance et fréquence en question.
const B1Visual: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const drop = progress(frame, start + 10, 1.4);
  const h = 190 - 70 * drop;
  const base = 790;
  let wave = "M 1180 740";
  for (let i = 0; i < 4; i++) {
    const x = 1180 + i * 70;
    wave += ` V 680 H ${x + 35} V 740 H ${x + 70}`;
  }
  return (
    <Svg>
      <path
        d={roundRectPath(640, base - 190, 60, 190, 8)}
        fill="none"
        stroke={COLORS.inkFaint}
        strokeWidth={1.4}
        opacity={progress(frame, start, 0.5)}
      />
      <rect
        x={644}
        y={base - h}
        width={52}
        height={h - 4}
        rx={6}
        fill={COLORS.accent}
        opacity={0.45 * progress(frame, start, 0.5)}
      />
      <Arrow
        x1={740}
        y1={620}
        x2={740}
        y2={720}
        start={start + 12}
        stroke={COLORS.accent}
      />
      <SvgText
        x={670}
        y={570}
        text="VDD"
        start={start + 4}
        size={28}
        color={COLORS.accent}
      />
      <SvgText
        x={960}
        y={690}
        text="puissance dynamique ?"
        start={start + 2.8 * FPS}
        size={28}
        color={COLORS.warm}
      />
      <DrawPath
        d={wave}
        start={start + 6.6 * FPS}
        duration={1}
        stroke={COLORS.ink}
      />
      <SvgText
        x={1320}
        y={780}
        text="même fréquence ?"
        start={start + 7 * FPS}
        size={26}
        color={COLORS.warm}
      />
    </Svg>
  );
};

// B2 : deux fois plus de transistors, et le débit utile ?
const B2Visual: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const dbl = progress(frame, start + 12, 0.8);
  const cells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 8; c++) {
      const extra = c >= 4;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={560 + c * 34}
          y={610 + r * 34}
          width={24}
          height={24}
          rx={3}
          fill={extra ? COLORS.accent : COLORS.ink}
          opacity={(extra ? dbl : progress(frame, start, 0.5)) * 0.5}
        />,
      );
    }
  }
  return (
    <Svg>
      {cells}
      <SvgText
        x={690}
        y={775}
        text="transistors × 2"
        start={start + 16}
        size={26}
        color={COLORS.accent}
      />
      <Link from={[870, 670]} to={[1060, 670]} start={start + 30} />
      <Icon
        name="token"
        x={1150}
        y={670}
        size={40}
        start={start + 36}
        color={COLORS.ink}
      />
      <SvgText
        x={1150}
        y={760}
        text="débit utile × 2 ?"
        start={start + 42}
        size={26}
        color={COLORS.warm}
      />
      <SvgText
        x={1420}
        y={670}
        text={"3 raisons\n+ lien module 0"}
        start={start + 4.2 * FPS}
        size={24}
        color={COLORS.inkSoft}
      />
    </Svg>
  );
};

// B3 : nouvelle géométrie → équipementiers → bénéfices ?
const B3Visual: React.FC<{ start: number }> = ({ start }) => {
  const y = 680;
  return (
    <Svg>
      {[0, 1, 2].map((k) => (
        <g key={k}>
          <path
            d={roundRectPath(560 - 44, y + 18 - k * 34, 88, 14, 3)}
            fill={COLORS.accent}
            opacity={0.4}
          />
          <DrawPath
            d={roundRectPath(560 - 56, y + 6 - k * 34, 112, 38, 6)}
            start={start + k * 4}
            duration={0.5}
            stroke={COLORS.warm}
          />
        </g>
      ))}
      <SvgText
        x={560}
        y={780}
        text="nouvelle géométrie"
        start={start + 10}
        size={24}
      />
      <Link from={[650, y]} to={[830, y]} start={start + 20} />
      <DrawPath
        d={icons.factory(920, y, 40)}
        start={start + 26}
        duration={0.8}
        stroke={COLORS.ink}
      />
      <SvgText
        x={920}
        y={780}
        text="équipementiers"
        start={start + 32}
        size={24}
      />
      <Link from={[1010, y]} to={[1190, y]} start={start + 40} />
      <SvgText
        x={1280}
        y={y - 70}
        text="opportunité"
        start={start + 44}
        size={24}
        color={COLORS.accent}
      />
      <DrawPath
        d={icons.euro(1280, y, 36)}
        start={start + 5 * FPS}
        duration={0.8}
        stroke={COLORS.warm}
      />
      <SvgText
        x={1280}
        y={780}
        text="bénéfices ?"
        start={start + 5.2 * FPS}
        size={26}
        color={COLORS.warm}
      />
    </Svg>
  );
};

const QUESTIONS: {
  id: string;
  s: number[];
  text: string[];
  Visual: React.FC<{ start: number }>;
}[] = [
  {
    id: "B1",
    s: [1, 2, 3],
    text: [
      "La tension d’alimentation baisse.",
      "Pourquoi la puissance dynamique peut-elle diminuer fortement ?",
      "Pourquoi ne peut-on pas continuer indéfiniment à réduire cette tension tout en conservant la même fréquence ?",
    ],
    Visual: B1Visual,
  },
  {
    id: "B2",
    s: [4, 5, 6],
    text: [
      "Une puce contient deux fois plus de transistors.",
      "Déroule trois raisons pour lesquelles son débit utile peut ne pas doubler.",
      "Relie au moins une raison au module 0.",
    ],
    Visual: B2Visual,
  },
  {
    id: "B3",
    s: [7, 8],
    text: [
      "Une nouvelle géométrie de transistor améliore le contrôle de la grille.",
      "Explique comment elle peut créer une opportunité pour les équipementiers, et pourquoi cette opportunité ne garantit pas une hausse de leurs bénéfices.",
    ],
    Visual: B3Visual,
  },
];

// Scène 50 — Partie B : raisonnement, trois questions (énoncés seulement).
export const S50: React.FC = () => {
  const cues = useCues();
  const qStarts = QUESTIONS.map((q) => cues.s(q.s[0]));
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(1)}>
        <PartIntro
          index={1}
          title="Raisonnement"
          start={0}
          perQuestion="10 points par question"
        />
      </Stage>
      {QUESTIONS.map((q, i) => (
        <Stage key={q.id} from={qStarts[i]} to={qStarts[i + 1]}>
          <QuestionCard id={q.id} points={10} start={qStarts[i]} size={36}>
            {q.text.map((t, k) => (
              <React.Fragment key={k}>
                <Reveal start={cues.s(q.s[k])}>{nb(t)}</Reveal>{" "}
              </React.Fragment>
            ))}
          </QuestionCard>
          <q.Visual start={cues.s(q.s[0], 1)} />
        </Stage>
      ))}
      <Stage from={cues.s(1)}>
        <PartTag index={1} start={cues.s(1)} />
        <QuestionDots ids={QUESTIONS.map((q) => q.id)} starts={qStarts} />
      </Stage>
    </AbsoluteFill>
  );
};
