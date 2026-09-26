import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Box, Icon, Link, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

// Trois couches : le travail, les fonctions, la réalité industrielle.
const Layers: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t1 = cues.s(1);
  const t2 = cues.s(2);
  const t3 = cues.s(3);
  const fns = [
    { label: "Calcul", icon: "chip" as const },
    { label: "Mémoire", icon: "memory" as const },
    { label: "Échanges", icon: "network" as const },
  ];
  const ind = [
    { label: "Fabriqués", icon: "factory" as const },
    { label: "Assemblés", icon: "stack" as const },
    { label: "Installés", icon: "rack" as const },
    { label: "Alimentés", icon: "bolt" as const },
    { label: "Refroidis", icon: "snow" as const },
  ];
  const layerLabel = (y: number, text: string, start: number) => (
    <SvgText
      x={150}
      y={y}
      text={text}
      start={start}
      anchor="start"
      size={22}
      weight={500}
      spacing="0.22em"
      color={COLORS.inkSoft}
    />
  );
  return (
    <AbsoluteFill>
      <Svg>
        {layerLabel(300, "TRAVAIL", t1)}
        <Box
          x={760}
          y={255}
          w={600}
          h={90}
          label="Le travail que le système doit accomplir"
          start={t1 + 6}
          variant="hi"
          size={28}
        />
        {layerLabel(490, "FONCTIONS", t2)}
        {fns.map((f, i) => {
          const x = 660 + i * 280;
          return (
            <g key={f.label}>
              <Link from={[1060, 345]} to={[x + 120, 440]} start={t2 + i * 4} />
              <path
                d={roundRectPath(x, 445, 240, 90, 12)}
                fill="#ffffff"
                opacity={0.05 * progress(frame, t2 + 20 + i * 8, 0.6)}
              />
              <DrawPath
                d={roundRectPath(x, 445, 240, 90, 12)}
                start={t2 + 10 + i * 8}
                duration={0.7}
              />
              <Icon
                name={f.icon}
                x={x + 50}
                y={490}
                size={18}
                start={t2 + 20 + i * 8}
                color={COLORS.accent}
              />
              <SvgText
                x={x + 88}
                y={490}
                text={f.label}
                start={t2 + 18 + i * 8}
                anchor="start"
                size={28}
              />
            </g>
          );
        })}
        {layerLabel(700, "RÉALITÉ INDUSTRIELLE", t3)}
        <DrawPath
          d={`M 1060 535 V 630`}
          start={t3}
          duration={0.5}
          stroke={COLORS.inkSoft}
        />
        {ind.map((s, i) => {
          const x = 603 + i * 186;
          const at = cues.s(3, 0.9 + i * 0.6);
          return (
            <g key={s.label}>
              <path
                d={roundRectPath(x, 640, 170, 120, 12)}
                fill={COLORS.warm}
                opacity={0.05 * progress(frame, at, 0.5)}
              />
              <DrawPath
                d={roundRectPath(x, 640, 170, 120, 12)}
                start={at}
                duration={0.5}
                stroke={COLORS.warm}
                width={1.6}
              />
              <Icon
                name={s.icon}
                x={x + 85}
                y={680}
                size={20}
                start={at + 4}
                color={COLORS.warm}
              />
              <SvgText
                x={x + 85}
                y={730}
                text={s.label}
                start={at + 6}
                size={24}
              />
              {i < ind.length - 1 && (
                <DrawPath
                  d={`M ${x + 170} 700 H ${x + 186}`}
                  start={at + 8}
                  duration={0.3}
                  stroke={COLORS.inkSoft}
                />
              )}
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

// Les quatre questions à poser à chaque couche.
const QUESTIONS = [
  { q: "Quelle fonction ?", icon: "gear" as const },
  { q: "Quelle contrainte ?", icon: "bottleneck" as const },
  { q: "Quel fournisseur qualifié ?", icon: "factory" as const },
  { q: "Quelle traduction en bénéfices ?", icon: "euro" as const },
];
const Questions: React.FC = () => {
  const cues = useCues();
  const at = [2.4, 3.4, 4.4, 5.6].map((d) => cues.s(4, d));
  return (
    <AbsoluteFill>
      <FadeIn
        start={cues.s(4)}
        style={{
          position: "absolute",
          top: 250,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.inkSoft,
            letterSpacing: "0.3em",
          }}
        >
          À CHAQUE COUCHE, QUATRE QUESTIONS
        </div>
      </FadeIn>
      <Svg>
        {QUESTIONS.map((q, i) => {
          const x = 180 + i * 400;
          const color = i === 1 ? COLORS.warm : COLORS.accent;
          return (
            <g key={q.q}>
              <DrawPath
                d={roundRectPath(x, 360, 360, 300, 16)}
                start={at[i]}
                duration={0.7}
                stroke={color}
              />
              <SvgText
                x={x + 180}
                y={410}
                text={String(i + 1).padStart(2, "0")}
                start={at[i] + 4}
                size={24}
                weight={400}
                color={color}
                spacing="0.1em"
              />
              <Icon
                name={q.icon}
                x={x + 180}
                y={490}
                size={34}
                start={at[i] + 6}
                color={color}
              />
              <SvgText
                x={x + 180}
                y={600}
                text={q.q
                  .replace(" qualifié", "\nqualifié")
                  .replace(" en bénéfices", "\nen bénéfices")}
                start={at[i] + 10}
                size={30}
              />
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

// Pouvoir de négociation : la rareté le fait monter, trois forces peuvent l'effacer.
const Power: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const up = progress(frame, cues.s(5, 0.6), 1.6);
  const forces = [
    "Nouvelles capacités",
    "Architecture différente",
    "Demande insuffisante",
  ];
  const fAt = [0.6, 2.0, 3.6].map((d) => cues.s(6, d));
  const down = interpolate(frame, [fAt[0], fAt[2] + 30], [0, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const level = up * (1 - down);
  const base = 720;
  const h = 360 * level;
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={`M 420 ${base} H 900`}
          start={cues.s(5)}
          duration={0.6}
          stroke={COLORS.inkFaint}
        />
        <rect
          x={560}
          y={base - h}
          width={200}
          height={h}
          fill={COLORS.accent}
          opacity={0.22}
        />
        <rect
          x={560}
          y={base - h}
          width={200}
          height={2}
          fill={COLORS.accent}
        />
        <SvgText
          x={660}
          y={base + 40}
          text="Pouvoir de négociation"
          start={cues.s(5, 0.4)}
          size={28}
          color={COLORS.accent}
        />
        <Icon
          name="factory"
          x={660}
          y={270}
          size={30}
          start={cues.s(5)}
          color={COLORS.warm}
        />
        <SvgText
          x={660}
          y={325}
          text="Rareté industrielle"
          start={cues.s(5)}
          size={26}
          color={COLORS.warm}
        />
        {forces.map((f, i) => {
          const y = 420 + i * 110;
          return (
            <g key={f}>
              <SvgText
                x={1080}
                y={y}
                text={f}
                start={fAt[i]}
                anchor="start"
                size={32}
              />
              <Link
                from={[1060, y]}
                to={[790, base - 360 * up * (1 - down) + 20]}
                start={fAt[i] + 4}
                color={COLORS.warm}
              />
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

// Scène 40 — Résumé investisseur.
export const S40: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Title text="Résumé investisseur" start={0} top={105} />
      <Stage from={cues.s(1)} to={cues.s(4)}>
        <Layers />
      </Stage>
      <Stage from={cues.s(4)} to={cues.s(5)}>
        <Questions />
      </Stage>
      <Stage from={cues.s(5)} to={cues.s(7)}>
        <Power />
      </Stage>
      <Stage from={cues.s(7)}>
        <Svg>
          <Icon
            name="bottleneck"
            x={960}
            y={380}
            size={70}
            start={cues.s(7)}
            color={COLORS.warm}
            duration={1}
          />
        </Svg>
        <div
          style={{
            position: "absolute",
            top: 500,
            width: "100%",
            textAlign: "center",
          }}
        >
          <FadeIn start={cues.s(7, 0.2)}>
            <div
              style={{
                ...textStyle(24, 500),
                color: COLORS.inkSoft,
                letterSpacing: "0.3em",
              }}
            >
              AVANT DE CHERCHER LE GAGNANT
            </div>
          </FadeIn>
          <FadeIn start={cues.s(7, 1.6)} style={{ marginTop: 30 }}>
            <div style={textStyle(52, 200)}>
              Identifie{" "}
              <span style={{ color: COLORS.warm }}>la contrainte</span>,
            </div>
          </FadeIn>
          <FadeIn start={cues.s(7, 2.8)} style={{ marginTop: 14 }}>
            <div style={textStyle(52, 200)}>
              puis compte{" "}
              <span style={{ color: COLORS.accent }}>
                ce qui permet de la résoudre
              </span>
              .
            </div>
          </FadeIn>
        </div>
      </Stage>
    </AbsoluteFill>
  );
};
