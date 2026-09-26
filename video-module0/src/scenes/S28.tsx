import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Chip, Icon, Link, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

const TECHS = [
  {
    short: "Mémoire",
    name: "Mémoire plus dense et plus rapide",
    icon: "memory" as const,
    problem: "Capacité insuffisante et attente des données.",
    trade: "Empilement et test ; coût, rendement et chaleur.",
  },
  {
    short: "Chiplets",
    name: "Chiplets",
    icon: "chip" as const,
    problem: "Limites de taille ou de coût d’une puce unique.",
    trade:
      "Plusieurs dies coopèrent ; interconnexions et assemblage plus complexes.",
  },
  {
    short: "Optique",
    name: "Optique rapprochée des puces",
    icon: "light" as const,
    problem: "Contraintes de certaines liaisons électriques rapides.",
    trade: "Moteurs optiques et lasers ; maintenance, fiabilité et test.",
  },
  {
    short: "Tension",
    name: "Tension de distribution plus élevée",
    icon: "bolt" as const,
    problem: "Intensités et pertes dans certaines parties du système.",
    trade: "Conversion et protection ; isolation et intégration.",
  },
  {
    short: "Liquide",
    name: "Refroidissement liquide",
    icon: "snow" as const,
    problem: "Concentration de la chaleur.",
    trade: "Plaques froides et échangeurs ; coût et exploitation.",
  },
  {
    short: "Logiciel",
    name: "Optimisation des modèles et logiciels",
    icon: "gear" as const,
    problem: "Trop de calculs ou de transferts par résultat.",
    trade: "Meilleure efficacité ; qualité, flexibilité et complexité.",
  },
];

const XS = TECHS.map((_, i) => 300 + i * 264);
const BOX = { y: 500, h: 250, w: 500 };
const COLS = [160, 710, 1260];

const small = (color: string): React.CSSProperties => ({
  ...textStyle(18, 500),
  color,
  letterSpacing: "0.28em",
  marginBottom: 18,
});

// Bandeau des six évolutions ; celle en cours s'allume.
const Strip: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = TECHS.map((_, k) => cues.s(3 + 3 * k));
  const cur = starts.reduce((a, s, i) => (frame >= s ? i : a), -1);
  return (
    <Svg>
      {TECHS.map((t, i) => {
        const on = i === cur;
        const appear = cues.s(1, 0.4 * i);
        const lit = progress(frame, starts[i], 0.5);
        const color = on ? COLORS.accent : COLORS.ink;
        return (
          <g key={t.short} opacity={cur === -1 || on ? 1 : 0.4}>
            <Icon
              name={t.icon}
              x={XS[i]}
              y={318}
              size={30}
              start={appear}
              color={color}
            />
            <SvgText
              x={XS[i]}
              y={388}
              text={t.short}
              start={appear + 6}
              size={24}
              weight={on ? 400 : 300}
              color={color}
            />
            {on && (
              <DrawPath
                d={`M ${XS[i] - 50} 420 H ${XS[i] + 50}`}
                start={starts[i]}
                duration={0.5}
                stroke={COLORS.accent}
              />
            )}
            {lit > 0 && !on && (
              <circle cx={XS[i]} cy={420} r={3} fill={COLORS.inkSoft} />
            )}
          </g>
        );
      })}
    </Svg>
  );
};

const Card: React.FC<{
  x: number;
  start: number;
  stroke: string;
  head: string;
  headColor: string;
  children: React.ReactNode;
}> = ({ x, start, stroke, head, headColor, children }) => (
  <>
    <Svg>
      <DrawPath
        d={roundRectPath(x, BOX.y, BOX.w, BOX.h, 14)}
        start={start}
        duration={0.7}
        stroke={stroke}
        width={1.6}
      />
    </Svg>
    <FadeIn
      start={start + 8}
      style={{
        position: "absolute",
        left: x + 40,
        top: BOX.y + 40,
        width: BOX.w - 80,
      }}
    >
      <div style={small(headColor)}>{head}</div>
      {children}
    </FadeIn>
  </>
);

// Problème → évolution → compromis, pour une technologie.
const Flow: React.FC<{ k: number }> = ({ k }) => {
  const cues = useCues();
  const t = TECHS[k];
  const sName = cues.s(3 + 3 * k);
  const sProb = cues.s(4 + 3 * k);
  const sTrade = cues.s(5 + 3 * k);
  const cy = BOX.y + BOX.h / 2;
  return (
    <AbsoluteFill>
      <Card
        x={COLS[1]}
        start={sName}
        stroke={COLORS.accent}
        head="ÉVOLUTION"
        headColor={COLORS.accent}
      >
        <div style={{ ...textStyle(40, 200), lineHeight: 1.25 }}>{t.name}</div>
      </Card>
      <Card
        x={COLS[0]}
        start={sProb}
        stroke={COLORS.warm}
        head="PROBLÈME VISÉ"
        headColor={COLORS.warm}
      >
        <div style={{ ...textStyle(30, 300), lineHeight: 1.4 }}>
          {t.problem}
        </div>
      </Card>
      <Card
        x={COLS[2]}
        start={sTrade}
        stroke={COLORS.inkSoft}
        head="COMPROMIS À SUIVRE"
        headColor={COLORS.inkSoft}
      >
        <div style={{ ...textStyle(30, 300), lineHeight: 1.4 }}>{t.trade}</div>
      </Card>
      <Svg>
        <Link
          from={[COLS[0] + BOX.w, cy]}
          to={[COLS[1], cy]}
          start={sProb + 12}
          gap={6}
          color={COLORS.warm}
        />
        <Link
          from={[COLS[1] + BOX.w, cy]}
          to={[COLS[2], cy]}
          start={sTrade + 8}
          gap={6}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Scène 28 — Six évolutions : chaque fois un problème visé et un compromis.
export const S28: React.FC = () => {
  const cues = useCues();
  const starts = TECHS.map((_, k) => cues.s(3 + 3 * k));
  return (
    <AbsoluteFill>
      <Title
        kicker="Cinq prochaines années"
        text="Les technologies qui déplacent les contraintes"
        start={cues.s(0)}
        top={100}
      />
      <Strip />
      <Stage from={cues.s(1)} to={starts[0]}>
        <FadeIn
          start={cues.s(1, 0.8)}
          style={{
            position: "absolute",
            top: 520,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div style={textStyle(34, 300)}>
            Des pistes d’analyse, pas un calendrier
          </div>
        </FadeIn>
        <FadeIn
          start={cues.s(2)}
          style={{
            position: "absolute",
            top: 610,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div style={{ ...textStyle(28, 300), color: COLORS.inkSoft }}>
            Calendriers et adoption dépendront…
          </div>
        </FadeIn>
        <div
          style={{
            position: "absolute",
            top: 700,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 30,
          }}
        >
          <Chip text="des performances" start={cues.s(2, 2.4)} />
          <Chip text="des coûts" start={cues.s(2, 3.2)} tone="warm" />
          <Chip text="de la fiabilité" start={cues.s(2, 4.0)} tone="ink" />
        </div>
      </Stage>
      {TECHS.map((t, k) => (
        <Stage
          key={t.short}
          from={starts[k]}
          to={k < TECHS.length - 1 ? starts[k + 1] : undefined}
        >
          <Flow k={k} />
        </Stage>
      ))}
    </AbsoluteFill>
  );
};
