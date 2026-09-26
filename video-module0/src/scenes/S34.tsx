import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { circlePath } from "../components/icons";
import { Icon, Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";

const small = (color: string): React.CSSProperties => ({
  ...textStyle(18, 500),
  color,
  letterSpacing: "0.28em",
});

const STEPS = [
  "Besoin\ntechnique",
  "Produit\nadopté",
  "Volumes\nlivrés",
  "Prix\nréalisé",
  "Marge",
  "Trésorerie",
  "Valeur pour\nl’actionnaire",
];
const X = (i: number) => 230 + i * 243;
const Y = 400;

// Texte bas de l'étape courante, en fondu enchaîné.
const Line: React.FC<{
  from: number;
  to: number;
  children: React.ReactNode;
}> = ({ from, to, children }) => {
  const frame = useCurrentFrame();
  const o = Math.min(
    progress(frame, from, 0.6),
    interpolate(frame, [to - 10, to], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  if (o <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 640,
        left: 260,
        width: 1400,
        textAlign: "center",
        opacity: o,
      }}
    >
      {children}
    </div>
  );
};

const Thesis: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = STEPS.map((_, i) => cues.s(0, 2.4 + i * 0.9));
  const run = progress(frame, starts[6] + 10, 2.5);
  const brk = cues.s(1);
  const ex1 = cues.s(2);
  const ex2 = cues.s(3);
  const end = cues.s(4);
  const on = (a: number, b: number) =>
    Math.min(
      progress(frame, a, 0.5),
      interpolate(frame, [b - 10, b], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );
  const o1 = on(ex1, ex2);
  const o2 = on(ex2, end);
  return (
    <AbsoluteFill>
      <Svg>
        {STEPS.map((s, i) => (
          <g key={s}>
            <DrawPath
              d={circlePath(X(i), Y, 16)}
              start={starts[i]}
              duration={0.5}
              stroke={i === 6 ? COLORS.accent : COLORS.ink}
              width={2}
            />
            <SvgText
              x={X(i)}
              y={Y + 72}
              text={s}
              start={starts[i] + 4}
              size={26}
              weight={300}
            />
            {i < STEPS.length - 1 && (
              <DrawPath
                d={`M ${X(i) + 24} ${Y} H ${X(i + 1) - 24}`}
                start={starts[i + 1] - 6}
                duration={0.5}
                stroke={COLORS.inkSoft}
                width={1.5}
              />
            )}
            {/* Point de rupture possible sur chaque passage */}
            {i < STEPS.length - 1 && (
              <DrawPath
                d={`M ${X(i) + 112} ${Y - 16} L ${X(i) + 124} ${Y - 2} L ${X(i) + 116} ${Y + 2} L ${X(i) + 128} ${Y + 16}`}
                start={brk + 20 + i * 5}
                duration={0.4}
                stroke={COLORS.warm}
                width={2.2}
              />
            )}
          </g>
        ))}
        {run > 0 && run < 1 && (
          <circle
            cx={X(0) + run * (X(6) - X(0))}
            cy={Y}
            r={6}
            fill={COLORS.accent}
          />
        )}
        {/* Exemple 1 : volumes ↑, prix ↓ */}
        <g opacity={o1}>
          <Arrow
            x1={X(2)}
            y1={Y - 40}
            x2={X(2)}
            y2={Y - 110}
            start={ex1 + 10}
            stroke={COLORS.accent}
          />
          <Arrow
            x1={X(3)}
            y1={Y - 110}
            x2={X(3)}
            y2={Y - 40}
            start={ex1 + FPS * 2.4}
            stroke={COLORS.warm}
          />
          <DrawPath
            d={`M ${X(2) - 60} ${Y + 130} H ${X(3) + 60}`}
            start={ex1}
            duration={0.6}
            stroke={COLORS.warm}
            width={1.5}
          />
        </g>
        {/* Exemple 2 : revenus ↑ mais trésorerie faible */}
        <g opacity={o2}>
          <Arrow
            x1={X(3)}
            y1={Y - 40}
            x2={X(3)}
            y2={Y - 110}
            start={ex2 + 10}
            stroke={COLORS.accent}
          />
          <Arrow
            x1={X(5)}
            y1={Y - 110}
            x2={X(5)}
            y2={Y - 40}
            start={ex2 + FPS * 2.4}
            stroke={COLORS.warm}
          />
          <DrawPath
            d={`M ${X(3) - 60} ${Y + 130} H ${X(5) + 60}`}
            start={ex2}
            duration={0.6}
            stroke={COLORS.warm}
            width={1.5}
          />
        </g>
      </Svg>
      <Line from={brk} to={ex1}>
        <div style={{ ...textStyle(38, 200), color: COLORS.warm }}>
          Une thèse peut échouer à chacun de ces passages.
        </div>
      </Line>
      <Line from={ex1} to={ex2}>
        <div style={{ ...small(COLORS.warm), marginBottom: 16 }}>
          VOLUMES ↑ · PRIX ↓
        </div>
        <div style={{ ...textStyle(32, 300), lineHeight: 1.4 }}>
          Un composant plus présent dans chaque rack peut subir une baisse de
          prix qui limite la progression des revenus.
        </div>
      </Line>
      <Line from={ex2} to={end}>
        <div style={{ ...small(COLORS.warm), marginBottom: 16 }}>
          REVENUS ↑ · TRÉSORERIE ↓
        </div>
        <div style={{ ...textStyle(32, 300), lineHeight: 1.4 }}>
          Une hausse des revenus peut demander tant d’investissement qu’elle
          produit peu de trésorerie.
        </div>
      </Line>
    </AbsoluteFill>
  );
};

// Capex et TAM.
const Defs: React.FC = () => {
  const cues = useCues();
  const c = cues.s(4);
  const t = cues.s(5);
  return (
    <AbsoluteFill>
      <Svg>
        <Icon
          name="factory"
          x={330}
          y={360}
          size={46}
          start={c}
          color={COLORS.accent}
        />
        <Icon
          name="euro"
          x={430}
          y={360}
          size={26}
          start={c + 10}
          color={COLORS.accent}
        />
        <DrawPath
          d={circlePath(370, 640, 100)}
          start={t}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        <DrawPath
          d={circlePath(370, 640, 30)}
          start={cues.s(6)}
          duration={0.6}
          stroke={COLORS.warm}
          width={1.6}
        />
        <SvgText
          x={370}
          y={770}
          text="périmètre défini"
          start={t + 20}
          size={22}
          color={COLORS.inkSoft}
        />
      </Svg>
      <FadeIn
        start={c}
        style={{ position: "absolute", left: 560, top: 300, width: 1200 }}
      >
        <div style={{ ...small(COLORS.accent), marginBottom: 14 }}>
          CAPEX · CAPITAL EXPENDITURE
        </div>
        <div style={textStyle(40, 200)}>Dépenses d’investissement</div>
      </FadeIn>
      <FadeIn
        start={t}
        style={{ position: "absolute", left: 560, top: 560, width: 1200 }}
      >
        <div style={{ ...small(COLORS.accent), marginBottom: 14 }}>
          TAM · TOTAL ADDRESSABLE MARKET
        </div>
        <div style={{ ...textStyle(36, 200), lineHeight: 1.3 }}>
          Marché théoriquement accessible selon un périmètre défini
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(6)}
        style={{ position: "absolute", left: 560, top: 720, width: 1200 }}
      >
        <div style={{ ...textStyle(32, 300), color: COLORS.warm }}>
          Pas des ventes garanties.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 34 — Les passages à vérifier dans une thèse.
export const S34: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(4)}>
        <Title
          kicker="Du matériel aux tokens et à la marge"
          text="Les passages à vérifier dans une thèse"
          start={cues.s(0)}
          top={100}
        />
        <Thesis />
      </Stage>
      <Stage from={cues.s(4)}>
        <Title
          kicker="Vocabulaire"
          text="Deux sigles à connaître"
          start={cues.s(4)}
          top={100}
        />
        <Defs />
      </Stage>
    </AbsoluteFill>
  );
};
