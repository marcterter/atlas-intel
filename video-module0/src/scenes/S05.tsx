import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import {
  Callout,
  Icon,
  Link,
  Svg,
  SvgText,
  TermDeck,
  Title,
} from "../components/kit";
import {
  DrawPath,
  Stage,
  progress,
  textStyle,
  useCues,
  FadeIn,
} from "../components/motion";
import { icons } from "../components/icons";
import { COLORS, FPS } from "../theme";

// Électricité → usine → réponses.
const Factory: React.FC = () => {
  const cues = useCues();
  const t = cues.s(0);
  return (
    <AbsoluteFill>
      <Title
        text="Une usine qui transforme de l’électricité en réponses"
        start={t}
      />
      <Svg>
        <Icon
          name="bolt"
          x={560}
          y={520}
          size={60}
          start={t + 20}
          color={COLORS.warm}
        />
        <Link from={[640, 520]} to={[840, 520]} start={t + 40} />
        <Icon
          name="factory"
          x={960}
          y={520}
          size={80}
          start={t + 55}
          duration={1.2}
        />
        <Link from={[1080, 520]} to={[1280, 520]} start={t + 85} />
        <Icon
          name="token"
          x={1360}
          y={520}
          size={50}
          start={t + 100}
          color={COLORS.accent}
        />
        <SvgText
          x={560}
          y={640}
          text="Électricité"
          start={t + 30}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={960}
          y={640}
          text="…ou une cuisine"
          start={cues.s(0, 3.2)}
          color={COLORS.warm}
        />
        <SvgText
          x={1360}
          y={640}
          text="Réponses"
          start={t + 110}
          color={COLORS.inkSoft}
        />
      </Svg>
    </AbsoluteFill>
  );
};

const ROWS = [
  {
    term: "Calculer",
    image: "Les cuisiniers",
    q: "Peuvent-ils effectuer assez d’opérations ?",
    icon: "chip" as const,
  },
  {
    term: "Mémoriser",
    image: "Les ingrédients sur le plan de travail",
    q: "Les données sont-elles disponibles assez vite ?",
    icon: "memory" as const,
  },
  {
    term: "Communiquer",
    image: "Les passages entre les postes",
    q: "Les informations arrivent-elles à temps ?",
    icon: "network" as const,
  },
  {
    term: "Alimenter",
    image: "L’énergie de la cuisine",
    q: "La puissance nécessaire est-elle disponible ?",
    icon: "bolt" as const,
  },
  {
    term: "Refroidir",
    image: "L’évacuation de la chaleur",
    q: "Peut-on fonctionner sans surchauffe ?",
    icon: "snow" as const,
  },
];

// Plus de cuisiniers, mais les ingrédients arrivent au compte-gouttes par un goulot.
const Kitchen: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(11);
  const cooks = [0, 1, 2, 3, 4, 5];
  const neckX = 760;
  return (
    <AbsoluteFill>
      <Svg>
        {/* Réserve d'ingrédients et goulot */}
        <DrawPath
          d={icons.bottleneck(neckX, 470, 110)}
          start={t}
          duration={1}
          stroke={COLORS.warm}
        />
        {new Array(40).fill(0).map((_, i) => {
          const phase = (frame - t) / FPS - i * 0.45;
          if (phase < 0)
            return (
              <circle
                key={i}
                cx={420 + random(`k${i}`) * 180}
                cy={400 + random(`q${i}`) * 140}
                r={5}
                fill={COLORS.warm}
                opacity={0.7 * progress(frame, t + i, 0.3)}
              />
            );
          // Passage lent dans le goulot, puis vers les cuisiniers.
          const p = Math.min(1, phase / 3);
          const x = 600 + p * 640;
          const y = 470 + Math.sin(i) * (p > 0.5 ? 60 : 4);
          return p < 1 ? (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={5}
              fill={COLORS.warm}
              opacity={0.8}
            />
          ) : null;
        })}
        {cooks.map((c) => {
          const at = t + (c < 3 ? 20 : 20 + FPS * 1.8) + (c % 3) * 6;
          return (
            <DrawPath
              key={c}
              d={icons.person(
                1300 + (c % 3) * 120,
                400 + Math.floor(c / 3) * 150,
                34,
              )}
              start={at}
              duration={0.6}
              stroke={c < 3 ? COLORS.ink : COLORS.accent}
            />
          );
        })}
        <SvgText
          x={1420}
          y={640}
          text="+ de cuisiniers"
          start={t + FPS * 2}
          color={COLORS.accent}
        />
        <SvgText
          x={neckX}
          y={640}
          text="ingrédients"
          start={t + 15}
          color={COLORS.warm}
        />
      </Svg>
      <FadeIn
        start={cues.s(12)}
        style={{
          position: "absolute",
          top: 740,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(34, 300) }}>
          Le bon réflexe : chercher{" "}
          <span style={{ color: COLORS.warm }}>ce qui fait attendre</span> le
          reste du système
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(13)}
        style={{
          position: "absolute",
          top: 180,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(22, 400),
            color: COLORS.inkSoft,
            letterSpacing: "0.25em",
          }}
        >
          CONTRAINTES PHYSIQUES · PROGRAMMES PRÉCIS
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 5 — L'analogie de la cuisine, puis la notion de bottleneck.
export const S05: React.FC = () => {
  const cues = useCues();
  const deckStarts = [1, 3, 5, 7, 9].map((i) => cues.s(i));
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(1)}>
        <Factory />
      </Stage>
      <Stage from={cues.s(1)} to={cues.s(11)}>
        <Title text="Cinq fonctions, cinq images" start={cues.s(1)} top={110} />
        <TermDeck
          heading="Fonction"
          top={240}
          starts={deckStarts}
          end={cues.s(11)}
          items={ROWS.map((r) => ({
            term: r.term,
            icon: r.icon,
            lines: [
              { label: "Image mentale", text: r.image },
              { label: "Question à poser", text: r.q, tone: "accent" },
            ],
          }))}
        />
      </Stage>
      <Stage from={cues.s(11)} to={cues.s(14)}>
        <Kitchen />
      </Stage>
      <Stage from={cues.s(14)}>
        <Callout
          kind="def"
          label="BOTTLENECK"
          start={cues.s(14)}
          y={360}
          size={44}
        >
          Goulot d’étranglement :{" "}
          <span style={{ color: COLORS.warm }}>
            la contrainte qui limite le résultat global.
          </span>
        </Callout>
      </Stage>
    </AbsoluteFill>
  );
};
