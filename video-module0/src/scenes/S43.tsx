import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Box, Icon, Link, Svg, SvgText } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";
import { PartIntro, PartTag, QuestionCard, QuestionDots, Reveal } from "./S42";

// Enchaînement cause → mécanisme → effet ; sans explication, la chaîne est vide.
const Rules: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const hollow = progress(frame, cues.s(2, 0.8), 0.8);
  const steps = ["Cause", "Mécanisme", "Effet", "Conclusion"];
  return (
    <AbsoluteFill>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 300,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(40, 300)}>
          Déroule les relations de{" "}
          <span style={{ color: COLORS.accent }}>cause à effet</span>
        </div>
      </FadeIn>
      <Svg>
        {steps.map((s, i) => {
          const x = 260 + i * 380;
          const middle = i === 1 || i === 2;
          return (
            <g key={s} opacity={middle ? 1 - hollow * 0.75 : 1}>
              <Box
                x={x}
                y={480}
                w={260}
                h={100}
                label={s}
                start={t + 10 + i * 12}
                variant={i === 3 ? "hi" : "default"}
                size={30}
              />
              {i < steps.length - 1 && (
                <Link
                  from={[x + 260, 530]}
                  to={[x + 380, 530]}
                  start={t + 18 + i * 12}
                />
              )}
            </g>
          );
        })}
        {[1, 2].map((i) => (
          <path
            key={i}
            d={roundRectPath(260 + i * 380, 480, 260, 100, 12)}
            fill="none"
            stroke={COLORS.warm}
            strokeWidth={2}
            strokeDasharray="8 8"
            opacity={hollow}
          />
        ))}
      </Svg>
      <FadeIn
        start={cues.s(2)}
        style={{
          position: "absolute",
          top: 660,
          left: 260,
          width: 1400,
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(34, 300), color: COLORS.warm }}>
          Une conclusion juste sans explication ne suffit pas à montrer la
          maîtrise
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// B1 : le calcul double, la bande passante mémoire reste identique.
const B1Visual: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(4, 1.2);
  const grow = progress(frame, t + 20, 1.4);
  const base = 660;
  return (
    <Svg>
      <rect
        x={620}
        y={base}
        width={260 * (1 + grow)}
        height={34}
        rx={6}
        fill={COLORS.accent}
        opacity={0.35 * progress(frame, t, 0.5)}
      />
      <SvgText
        x={600}
        y={base + 17}
        text="Calcul"
        start={t}
        anchor="end"
        size={26}
      />
      <SvgText
        x={640 + 260 * (1 + grow)}
        y={base + 17}
        text="× 2"
        start={t + 30}
        anchor="start"
        size={26}
        color={COLORS.accent}
      />
      <rect
        x={620}
        y={base + 60}
        width={260}
        height={34}
        rx={6}
        fill={COLORS.warm}
        opacity={0.35 * progress(frame, t + 8, 0.5)}
      />
      <SvgText
        x={600}
        y={base + 77}
        text="Bande passante mémoire"
        start={t + 8}
        anchor="end"
        size={26}
      />
      <SvgText
        x={900}
        y={base + 77}
        text="inchangée"
        start={t + 40}
        anchor="start"
        size={26}
        color={COLORS.warm}
      />
    </Svg>
  );
};

// B2 : les accélérateurs sont prêts, le raccordement électrique fait attendre.
const B2Visual: React.FC = () => {
  const cues = useCues();
  const t = cues.s(8, 2);
  const y = 680;
  return (
    <Svg>
      <Icon name="factory" x={560} y={y} size={34} start={t} />
      <SvgText
        x={560}
        y={y + 60}
        text="Fabricant"
        start={t + 4}
        size={24}
        color={COLORS.inkSoft}
      />
      <Link from={[610, y]} to={[790, y]} start={t + 10} />
      <Icon
        name="chip"
        x={840}
        y={y}
        size={30}
        start={t + 16}
        color={COLORS.accent}
      />
      <SvgText
        x={840}
        y={y + 60}
        text="Accélérateurs"
        start={t + 20}
        size={24}
        color={COLORS.inkSoft}
      />
      <Link from={[890, y]} to={[1070, y]} start={t + 26} />
      <Icon name="building" x={1120} y={y} size={34} start={t + 32} />
      <SvgText
        x={1120}
        y={y + 60}
        text="Client"
        start={t + 36}
        size={24}
        color={COLORS.inkSoft}
      />
      <DrawPath
        d={`M 1180 ${y} H 1300`}
        start={cues.s(8, 3.6)}
        duration={0.5}
        stroke={COLORS.warm}
      />
      <Icon
        name="bolt"
        x={1350}
        y={y}
        size={34}
        start={cues.s(8, 3.8)}
        color={COLORS.warm}
      />
      <SvgText
        x={1350}
        y={y + 60}
        text="Raccordement en attente"
        start={cues.s(8, 4)}
        size={24}
        color={COLORS.warm}
      />
    </Svg>
  );
};

// B3 : la croissance d'un marché ne garantit pas le gain d'un acteur donné.
const B3Visual: React.FC = () => {
  const cues = useCues();
  const t = cues.s(11, 2.5);
  const y = 690;
  return (
    <Svg>
      <Icon
        name="chart"
        x={760}
        y={y}
        size={40}
        start={t}
        color={COLORS.accent}
      />
      <SvgText
        x={760}
        y={y + 70}
        text="Croissance de la photonique"
        start={t + 6}
        size={24}
        color={COLORS.accent}
      />
      <SvgText
        x={960}
        y={y}
        text="≠"
        start={t + 20}
        size={60}
        weight={200}
        color={COLORS.warm}
      />
      <Icon
        name="euro"
        x={1160}
        y={y}
        size={36}
        start={t + 26}
        color={COLORS.warm}
      />
      <SvgText
        x={1160}
        y={y + 70}
        text="Gain pour un vendeur déjà en place"
        start={t + 30}
        size={24}
        color={COLORS.inkSoft}
      />
    </Svg>
  );
};

// Scène 43 — Partie B : test de raisonnement.
export const S43: React.FC = () => {
  const cues = useCues();
  const qStarts = [3, 7, 10].map((i) => cues.s(i));
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(1)}>
        <PartIntro
          index={1}
          title="Test de raisonnement"
          start={0}
          perQuestion="10 points par question"
        />
      </Stage>
      <Stage from={cues.s(1)} to={cues.s(3)}>
        <PartTag index={1} start={cues.s(1)} />
        <Rules />
      </Stage>
      <Stage from={cues.s(3)} to={cues.s(7)}>
        <QuestionCard id="B1" points={10} start={cues.s(3)} top={170} size={36}>
          <Reveal start={cues.s(4)}>
            Un accélérateur double sa puissance de calcul mais conserve la même
            bande passante mémoire.
          </Reveal>{" "}
          <Reveal start={cues.s(5)} color={COLORS.accent}>
            Dans quel cas le gain réel peut-il être faible ?
          </Reveal>{" "}
          <Reveal start={cues.s(6)} color={COLORS.accent}>
            Donne deux façons d’améliorer la situation.
          </Reveal>
        </QuestionCard>
        <B1Visual />
      </Stage>
      <Stage from={cues.s(7)} to={cues.s(10)}>
        <QuestionCard id="B2" points={10} start={cues.s(7)} top={170} size={36}>
          <Reveal start={cues.s(8)}>
            Un fabricant peut livrer davantage d’accélérateurs, mais son client
            attend son raccordement électrique.
          </Reveal>{" "}
          <Reveal start={cues.s(9)} color={COLORS.accent}>
            Explique le déplacement du bottleneck et deux conséquences
            économiques possibles.
          </Reveal>
        </QuestionCard>
        <B2Visual />
      </Stage>
      <Stage from={cues.s(10)}>
        <QuestionCard
          id="B3"
          points={10}
          start={cues.s(10)}
          top={170}
          size={36}
        >
          <Reveal start={cues.s(11)}>
            Pourquoi une forte croissance de la photonique pourrait-elle ne pas
            profiter à une entreprise qui vend déjà des composants optiques ?
          </Reveal>
        </QuestionCard>
        <B3Visual />
      </Stage>
      <Stage from={cues.s(3)}>
        <PartTag index={1} start={cues.s(3)} />
        <QuestionDots ids={["B1", "B2", "B3"]} starts={qStarts} />
      </Stage>
    </AbsoluteFill>
  );
};
