import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  Box,
  Equation,
  Icon,
  Link,
  Svg,
  SvgText,
  Title,
} from "../components/kit";
import {
  Arrow,
  Counter,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";

const label = (color: string = COLORS.inkSoft): React.CSSProperties => ({
  ...textStyle(22, 500),
  color,
  letterSpacing: "0.26em",
});

// Octets qui quittent la mémoire, opérations effectuées dans le processeur.
const Intensity: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const on = progress(frame, t + 30, 0.6);
  return (
    <AbsoluteFill>
      <Title
        text="Pourquoi doubler le calcul peut peu changer le résultat"
        start={cues.s(0)}
      />
      <Svg>
        <Icon name="memory" x={520} y={440} size={70} start={t} />
        <SvgText
          x={520}
          y={560}
          text="niveau de mémoire"
          start={t + 8}
          size={26}
          color={COLORS.inkSoft}
        />
        <Icon
          name="chip"
          x={1400}
          y={440}
          size={70}
          start={t + 10}
          color={COLORS.accent}
        />
        <SvgText
          x={1400}
          y={560}
          text="processeur"
          start={t + 16}
          size={26}
          color={COLORS.inkSoft}
        />
        <DrawPath
          d="M 620 440 H 1300"
          start={t + 20}
          duration={0.8}
          stroke={COLORS.inkFaint}
        />
        {/* Un octet transféré (carré) … */}
        {new Array(5).fill(0).map((_, i) => {
          const ph = ((frame - t) / FPS / 3 + i / 5) % 1;
          return (
            <rect
              key={i}
              x={630 + ph * 640 - 9}
              y={431}
              width={18}
              height={18}
              fill="none"
              stroke={COLORS.ink}
              strokeWidth={1.6}
              opacity={on}
            />
          );
        })}
        {/* … plusieurs opérations (étincelles) autour du processeur */}
        {new Array(8).fill(0).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 + frame / 40;
          const pulse = 0.5 + 0.5 * Math.sin(frame / 6 + i);
          return (
            <circle
              key={i}
              cx={1400 + Math.cos(a) * 110}
              cy={440 + Math.sin(a) * 110}
              r={4}
              fill={COLORS.accent}
              opacity={on * pulse}
            />
          );
        })}
        <SvgText
          x={960}
          y={400}
          text="octets transférés"
          start={t + 30}
          size={26}
          color={COLORS.ink}
        />
      </Svg>
      <Equation
        parts={[
          "Intensité arithmétique",
          "=",
          "opérations",
          "÷",
          "octet transféré",
        ]}
        starts={[
          cues.s(1, 0.3),
          cues.s(1, 1.5),
          cues.s(1, 2.5),
          cues.s(1, 3.2),
          cues.s(1, 3.8),
        ]}
        y={650}
        size={50}
      />
    </AbsoluteFill>
  );
};

// Le modèle roofline : le minimum de deux plafonds.
const Roofline: React.FC = () => {
  const cues = useCues();
  const s = (d: number) => cues.s(2, d);
  return (
    <AbsoluteFill>
      <Title
        kicker="Modèle roofline"
        text="Une approximation utile"
        start={cues.s(2)}
      />
      <Svg>
        <Box
          x={710}
          y={290}
          w={500}
          h={90}
          label="Calcul soutenable"
          start={s(3.5)}
          variant="hi"
          size={32}
        />
        <SvgText
          x={960}
          y={440}
          text="≤ min"
          start={s(5.5)}
          size={40}
          weight={300}
          color={COLORS.accent}
        />
        <Link from={[900, 470]} to={[560, 560]} start={s(7)} />
        <Link from={[1020, 470]} to={[1360, 560]} start={s(7)} />
        <Box
          x={330}
          y={560}
          w={460}
          h={100}
          label="Calcul maximal"
          start={s(8)}
          size={30}
        />
        <Box
          x={1060}
          y={560}
          w={600}
          h={100}
          label="Débit mémoire × intensité"
          start={s(9.5)}
          size={30}
          variant="side"
        />
        <DrawPath
          d="M 440 720 H 680"
          start={s(8.4)}
          duration={0.6}
          stroke={COLORS.ink}
          width={3}
        />
        <DrawPath
          d="M 1250 760 L 1470 700"
          start={s(10)}
          duration={0.6}
          stroke={COLORS.warm}
          width={3}
        />
        <SvgText
          x={560}
          y={760}
          text="plafond de calcul"
          start={s(8.6)}
          size={24}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={1360}
          y={800}
          text="plafond mémoire"
          start={s(10.2)}
          size={24}
          color={COLORS.inkSoft}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Graphique log-log : intensité (op/octet) en abscisse, calcul (Mds op/s) en ordonnée.
const OX = 250;
const OY = 790;
const X = (i: number) => OX + (Math.log10(i) + 0.301) * 380;
const Y = (p: number) => OY - (Math.log10(p) - 1.699) * 265;

const Chart: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t4 = cues.s(4);
  const t5 = cues.s(5);
  const t6 = cues.s(6);
  const t7 = cues.s(7);
  const t8 = cues.s(8);
  const pt = progress(frame, t6 + 20, 0.6);
  const pulse = frame > t7 ? 0.5 + 0.5 * Math.sin((frame - t7) / 5) : 0;
  const right = X(50);
  return (
    <g>
      {/* Axes */}
      <DrawPath
        d={`M ${OX} ${Y(5000) - 10} V ${OY} H ${right + 20}`}
        start={cues.s(3)}
        duration={1}
        stroke={COLORS.inkSoft}
        width={1.5}
      />
      <SvgText
        x={OX}
        y={Y(5000) - 36}
        text="calcul (Mds op/s)"
        start={cues.s(3, 0.5)}
        size={22}
        anchor="start"
        color={COLORS.inkSoft}
      />
      <SvgText
        x={right + 20}
        y={OY + 64}
        text="intensité (op/octet)"
        start={cues.s(3, 0.5)}
        size={22}
        anchor="end"
        color={COLORS.inkSoft}
      />
      {[1, 2, 10, 20].map((v) => (
        <SvgText
          key={v}
          x={X(v)}
          y={OY + 26}
          text={String(v)}
          start={cues.s(3, 0.8)}
          size={22}
          color={v === 2 ? COLORS.warm : COLORS.inkSoft}
        />
      ))}
      {[100, 200, 1000, 2000].map((v) => (
        <SvgText
          key={v}
          x={OX - 14}
          y={Y(v)}
          text={v.toLocaleString("fr-FR")}
          start={cues.s(3, 0.8)}
          size={22}
          anchor="end"
          color={v === 200 ? COLORS.warm : COLORS.inkSoft}
        />
      ))}
      {/* Plafond de calcul */}
      <DrawPath
        d={`M ${X(10)} ${Y(1000)} H ${right}`}
        start={t4 + 30}
        duration={1}
        stroke={COLORS.ink}
        width={3}
      />
      <SvgText
        x={X(22)}
        y={Y(1000) + 34}
        text="calcul maximal"
        start={t4 + 40}
        size={24}
        color={COLORS.ink}
      />
      {/* Plafond mémoire : débit × intensité */}
      <DrawPath
        d={`M ${X(0.5)} ${Y(50)} L ${X(10)} ${Y(1000)}`}
        start={t5 + 20}
        duration={1.2}
        stroke={COLORS.warm}
        width={3}
      />
      <SvgText
        x={X(5) + 24}
        y={Y(300)}
        text="débit mémoire × intensité"
        start={t5 + 40}
        size={24}
        anchor="start"
        color={COLORS.warm}
      />
      {/* Point de fonctionnement à intensité 2 */}
      <DrawPath
        d={`M ${X(2)} ${OY} V ${Y(200)}`}
        start={t6 + 10}
        duration={0.6}
        stroke={COLORS.inkFaint}
        width={1.5}
      />
      <DrawPath
        d={`M ${OX} ${Y(200)} H ${X(2)}`}
        start={t6 + 16}
        duration={0.6}
        stroke={COLORS.inkFaint}
        width={1.5}
      />
      <circle
        cx={X(2)}
        cy={Y(200)}
        r={10 + pulse * 6}
        fill={COLORS.warm}
        opacity={pt}
      />
      {/* Calcul doublé : nouveau plafond, point inchangé */}
      <DrawPath
        d={`M ${X(10)} ${Y(1000)} L ${X(20)} ${Y(2000)}`}
        start={t7 + 10}
        duration={0.6}
        stroke={COLORS.warm}
        width={1.5}
      />
      <DrawPath
        d={`M ${X(20)} ${Y(2000)} H ${right}`}
        start={t7 + 20}
        duration={0.8}
        stroke={COLORS.accent}
        width={3}
      />
      <SvgText
        x={X(34)}
        y={Y(2000) - 30}
        text="calcul doublé"
        start={t7 + 26}
        size={24}
        color={COLORS.accent}
      />
      <SvgText
        x={X(2) + 24}
        y={Y(200) + 44}
        text="inchangé"
        start={t7 + 30}
        size={24}
        anchor="start"
        color={COLORS.warm}
      />
      {/* Leviers : relever la pente, ou déplacer le point vers la droite */}
      <Arrow
        x1={X(2)}
        y1={Y(200) - 20}
        x2={X(2)}
        y2={Y(400) - 10}
        start={t8 + 20}
        stroke={COLORS.accent}
      />
      <Arrow
        x1={X(2) + 18}
        y1={Y(200)}
        x2={X(4.5)}
        y2={Y(200)}
        start={t8 + 70}
        stroke={COLORS.accent}
      />
      <SvgText
        x={X(2) - 16}
        y={Y(400) - 10}
        text="débit ↑"
        start={t8 + 36}
        size={22}
        anchor="end"
        color={COLORS.accent}
      />
      <SvgText
        x={X(4.5) + 12}
        y={Y(200)}
        text="intensité ↑"
        start={t8 + 86}
        size={22}
        anchor="start"
        color={COLORS.accent}
      />
    </g>
  );
};

const Row: React.FC<{
  top: number;
  start: number;
  name: string;
  children: React.ReactNode;
  tone?: string;
}> = ({ top, start, name, children, tone = COLORS.inkSoft }) => (
  <FadeIn
    start={start}
    style={{ position: "absolute", left: 1180, top, width: 600 }}
  >
    <div style={label(tone)}>{name}</div>
    <div style={{ ...textStyle(52, 200), marginTop: 6 }}>{children}</div>
  </FadeIn>
);
// Compteur avec séparateur de milliers (1 000, 2 000).
const Num: React.FC<{
  from?: number;
  to: number;
  start: number;
  duration?: number;
  color?: string;
}> = ({ from = 0, to, start, duration = 1.2, color }) => {
  const frame = useCurrentFrame();
  const v = Math.round(from + (to - from) * progress(frame, start, duration));
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", color }}>
      {v.toLocaleString("fr-FR")}
    </span>
  );
};
const unit = (u: string) => (
  <span style={{ ...textStyle(26, 300), color: COLORS.inkSoft }}> {u}</span>
);

const Example: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t7 = cues.s(7);
  const t8 = cues.s(8);
  const numbersOut = interpolate(frame, [t8 - 6, t8 + 6], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const levers = [
    "Meilleur débit mémoire",
    "Plus de réutilisation des données proches du processeur",
    "Un logiciel réduisant les transferts",
  ];
  const leverAt = [cues.s(8, 1.8), cues.s(8, 3.6), cues.s(8, 6.4)];
  return (
    <AbsoluteFill>
      <Title
        kicker="Exemple fictif"
        text="Deux plafonds, un seul point"
        start={cues.s(3)}
        top={110}
      />
      <Svg>
        <Chart />
      </Svg>
      <div style={{ opacity: numbersOut }}>
        <Row
          top={250}
          start={cues.s(4)}
          name={frame < t7 ? "CALCUL MAXIMAL" : "CALCUL DOUBLÉ"}
          tone={frame < t7 ? COLORS.inkSoft : COLORS.accent}
        >
          <Num
            to={frame < t7 ? 1000 : 2000}
            from={frame < t7 ? 0 : 1000}
            start={frame < t7 ? cues.s(4, 1.5) : t7 + 6}
            color={frame < t7 ? COLORS.ink : COLORS.accent}
          />
          {unit("Mds op/s")}
        </Row>
        <Row top={380} start={cues.s(5)} name="DÉBIT MÉMOIRE">
          <Counter to={100} start={cues.s(5, 0.8)} duration={1} />
          {unit("Mds octets/s")}
        </Row>
        <Row top={510} start={cues.s(6)} name="INTENSITÉ">
          <Counter to={2} start={cues.s(6, 0.8)} duration={0.8} />
          {unit("op / octet")}
        </Row>
        <Row
          top={640}
          start={cues.s(6, 3.5)}
          name={frame < t7 ? "PLAFOND MÉMOIRE" : "PLAFOND MÉMOIRE : TOUJOURS"}
          tone={COLORS.warm}
        >
          <span style={{ color: COLORS.inkSoft, fontSize: 36 }}>
            100 × 2 ={" "}
          </span>
          <Counter
            to={200}
            start={cues.s(6, 4)}
            duration={1.2}
            style={{ color: COLORS.warm }}
          />
          {unit("Mds op/s")}
        </Row>
      </div>
      <FadeIn
        start={t8}
        style={{ position: "absolute", left: 1180, top: 250, width: 600 }}
      >
        <div style={label(COLORS.accent)}>LES LEVIERS</div>
      </FadeIn>
      {levers.map((l, i) => (
        <FadeIn
          key={l}
          start={leverAt[i]}
          style={{
            position: "absolute",
            left: 1180,
            top: 310 + i * 120,
            width: 580,
          }}
        >
          <div style={{ display: "flex", gap: 18, alignItems: "baseline" }}>
            <span style={{ ...textStyle(22, 500), color: COLORS.accent }}>
              0{i + 1}
            </span>
            <span style={{ ...textStyle(32, 300), lineHeight: 1.3 }}>{l}</span>
          </div>
        </FadeIn>
      ))}
      <FadeIn
        start={cues.s(9)}
        style={{ position: "absolute", left: 1180, top: 700, width: 580 }}
      >
        <div
          style={{
            ...textStyle(28, 300),
            color: COLORS.warm,
            lineHeight: 1.35,
          }}
        >
          Le réseau et la coordination peuvent imposer d’autres limites.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 21 — Intensité arithmétique, modèle roofline et exemple chiffré.
export const S21: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(2)}>
        <Intensity />
      </Stage>
      <Stage from={cues.s(2)} to={cues.s(3)}>
        <Roofline />
      </Stage>
      <Stage from={cues.s(3)}>
        <Example />
      </Stage>
    </AbsoluteFill>
  );
};
