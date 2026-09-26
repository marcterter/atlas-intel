import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Callout, Icon, Link, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

// En-tête d'hypothèse : surtitre numéroté puis énoncé.
const Heading: React.FC<{ n: number; text: string; start: number }> = ({
  n,
  text,
  start,
}) => (
  <div
    style={{
      position: "absolute",
      top: 215,
      width: "100%",
      textAlign: "center",
    }}
  >
    <FadeIn start={start}>
      <div
        style={{
          ...textStyle(22, 500),
          color: COLORS.warm,
          letterSpacing: "0.3em",
          marginBottom: 12,
        }}
      >
        HYPOTHÈSE {n}
      </div>
    </FadeIn>
    <FadeIn start={start + 8}>
      <div style={textStyle(40, 300)}>{text}</div>
    </FadeIn>
  </div>
);

const Question: React.FC<{ start: number; children: React.ReactNode }> = ({
  start,
  children,
}) => (
  <FadeIn
    start={start}
    style={{
      position: "absolute",
      top: 770,
      left: 260,
      width: 1400,
      textAlign: "center",
    }}
  >
    <div
      style={{ ...textStyle(32, 300), color: COLORS.accent, lineHeight: 1.35 }}
    >
      {children}
    </div>
  </FadeIn>
);

// Hypothèse 1 : les commandes montent plus haut que la demande finale visible.
const Orders: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const base = 680;
  const full = 250;
  const hOrders = full * progress(frame, t + 20, 1.6);
  const hDemand = full * 0.55 * progress(frame, cues.s(2), 1.4);
  const gap = progress(frame, cues.s(2, 2), 0.8);
  return (
    <AbsoluteFill>
      <Heading
        n={1}
        text="Confondre commandes et consommation finale"
        start={t}
      />
      <Svg>
        <DrawPath
          d={`M 480 ${base} H 1440`}
          start={t + 10}
          duration={0.8}
          stroke={COLORS.inkFaint}
        />
        <rect
          x={620}
          y={base - hOrders}
          width={180}
          height={hOrders}
          fill={COLORS.accent}
          opacity={0.25}
        />
        <rect
          x={620}
          y={base - hOrders}
          width={180}
          height={2}
          fill={COLORS.accent}
        />
        <rect
          x={1120}
          y={base - hDemand}
          width={180}
          height={hDemand}
          fill={COLORS.ink}
          opacity={0.14}
        />
        <rect
          x={1120}
          y={base - full}
          width={180}
          height={full * 0.45}
          fill="none"
          stroke={COLORS.warm}
          strokeWidth={2}
          strokeDasharray="8 8"
          opacity={gap}
        />
        <SvgText
          x={1210}
          y={base - full * 0.775}
          text="?"
          start={cues.s(2, 2.4)}
          size={56}
          weight={200}
          color={COLORS.warm}
        />
        <Icon
          name="rack"
          x={710}
          y={base - full - 50}
          size={30}
          start={t + 50}
          color={COLORS.accent}
        />
        <Icon
          name="token"
          x={1210}
          y={base - full - 50}
          size={30}
          start={cues.s(2)}
        />
        <Link
          from={[820, base - full - 50]}
          to={[1100, base - full - 50]}
          start={cues.s(2, 0.6)}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={710}
          y={base + 36}
          text="Équipements commandés"
          start={t + 30}
          size={26}
          color={COLORS.accent}
        />
        <SvgText
          x={1210}
          y={base + 36}
          text="Consommation finale"
          start={cues.s(2)}
          size={26}
        />
      </Svg>
      <Question start={cues.s(2, 1)}>
        Les équipements commandés serviront-ils une demande suffisante pour
        rentabiliser les capacités ?
      </Question>
    </AbsoluteFill>
  );
};

// Hypothèse 2 : la valeur se redistribue entre composants photoniques.
const SEGS = [
  { name: "Composant A", before: 360, after: 700, color: COLORS.accent },
  { name: "Composant B", before: 360, after: 400, color: COLORS.ink },
  { name: "Composant C", before: 360, after: 140, color: COLORS.warm },
];
const Photonics: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(3);
  const x0 = 470;
  const pAfter = progress(frame, cues.s(4), 1.6);
  const bar = (y: number, key: "before" | "after", start: number) => {
    let x = x0;
    const grow = progress(frame, start, 1.2);
    return SEGS.map((s, i) => {
      const w =
        key === "before" ? s.before : s.before + (s.after - s.before) * pAfter;
      const seg = (
        <g key={s.name + key}>
          <rect
            x={x + 3}
            y={y}
            width={Math.max(0, w * grow - 6)}
            height={80}
            rx={8}
            fill={s.color}
            opacity={0.18}
          />
          <rect
            x={x + 3}
            y={y}
            width={Math.max(0, w * grow - 6)}
            height={80}
            rx={8}
            fill="none"
            stroke={s.color}
            strokeWidth={1.6}
          />
          {w > 200 && (
            <SvgText
              x={x + w / 2}
              y={y + 40}
              text={s.name}
              start={start + 12 + i * 6}
              size={24}
            />
          )}
          {w <= 200 && key === "after" && (
            <SvgText
              x={x + w / 2}
              y={y + 40}
              text="C"
              start={start + 12}
              size={24}
            />
          )}
        </g>
      );
      x += w;
      return seg;
    });
  };
  return (
    <AbsoluteFill>
      <Heading
        n={2}
        text="Sous-estimer le déplacement de valeur dans la photonique"
        start={t}
      />
      <Svg>
        <SvgText
          x={x0 - 30}
          y={410}
          text="Avant"
          start={t + 20}
          anchor="end"
          size={24}
          color={COLORS.inkSoft}
        />
        {bar(370, "before", t + 20)}
        <SvgText
          x={x0 - 30}
          y={570}
          text="Après"
          start={cues.s(4)}
          anchor="end"
          size={24}
          color={COLORS.inkSoft}
        />
        {frame >= cues.s(4) && bar(530, "after", cues.s(4))}
        <SvgText
          x={x0 + 350}
          y={650}
          text="↑ gagne du contenu"
          start={cues.s(4, 1.6)}
          size={26}
          color={COLORS.accent}
        />
        <SvgText
          x={x0 + 1160}
          y={650}
          text="↓ moins nécessaire"
          start={cues.s(4, 2.4)}
          size={26}
          color={COLORS.warm}
        />
      </Svg>
      <Question start={cues.s(4)}>
        Quels composants gagnent du contenu, et lesquels deviennent moins
        nécessaires ?
      </Question>
    </AbsoluteFill>
  );
};

// Hypothèse 3 : du chiffre annoncé à la capacité réellement productive.
const CHECKS = ["Raccordé", "Équipé", "Testé", "Réellement utilisé"];
const Capacity: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(5);
  const checkAt = (i: number) => cues.s(6, 0.5 + i * 0.55);
  const done = progress(frame, checkAt(3) + 12, 0.6);
  return (
    <AbsoluteFill>
      <Heading
        n={3}
        text="Confondre puissance annoncée et capacité productive"
        start={t}
      />
      <Svg>
        <DrawPath
          d={roundRectPath(200, 380, 360, 220, 16)}
          start={t + 20}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={380}
          y={460}
          text="MW"
          start={t + 30}
          size={72}
          weight={200}
        />
        <SvgText
          x={380}
          y={550}
          text="Puissance annoncée"
          start={t + 36}
          size={26}
          color={COLORS.inkSoft}
        />
        <Link from={[560, 490]} to={[740, 490]} start={cues.s(6)} />
        {CHECKS.map((c, i) => {
          const y = 370 + i * 82;
          return (
            <g key={c}>
              <DrawPath
                d={roundRectPath(770, y, 44, 44, 8)}
                start={cues.s(6, 0.2 + i * 0.2)}
                duration={0.4}
                stroke={COLORS.inkSoft}
              />
              <Icon
                name="check"
                x={792}
                y={y + 22}
                size={15}
                start={checkAt(i)}
                color={COLORS.accent}
                width={3}
                duration={0.3}
              />
              <SvgText
                x={840}
                y={y + 22}
                text={c}
                start={cues.s(6, 0.4 + i * 0.2)}
                anchor="start"
                size={30}
              />
            </g>
          );
        })}
        <Link
          from={[1170, 490]}
          to={[1350, 490]}
          start={checkAt(3) + 8}
          color={COLORS.accent}
        />
        <path
          d={roundRectPath(1360, 380, 360, 220, 16)}
          fill={COLORS.accent}
          opacity={0.08 * done}
        />
        <DrawPath
          d={roundRectPath(1360, 380, 360, 220, 16)}
          start={checkAt(3) + 12}
          duration={0.8}
          stroke={COLORS.accent}
        />
        <Icon
          name="token"
          x={1540}
          y={450}
          size={34}
          start={checkAt(3) + 20}
          color={COLORS.accent}
        />
        <SvgText
          x={1540}
          y={540}
          text={"Capacité\nproductive"}
          start={checkAt(3) + 24}
          size={28}
        />
      </Svg>
      <Question start={cues.s(6)}>
        Le site est-il raccordé, équipé, testé et réellement utilisé ?
      </Question>
    </AbsoluteFill>
  );
};

// Scène 36 — Trois malentendus possibles du marché, puis le point analyste.
export const S36: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  // Trois repères indiquent l'hypothèse en cours.
  const current = frame >= cues.s(5) ? 2 : frame >= cues.s(3) ? 1 : 0;
  const dots = interpolate(
    frame,
    [cues.s(1), cues.s(1) + 10, cues.s(7, 1.2) - 10, cues.s(7, 1.2)],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill>
      <Title text="Ce que le marché pourrait mal comprendre" start={0} />
      <Stage from={0} to={cues.s(1)}>
        <Svg>
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <circle
                cx={760 + i * 200}
                cy={500}
                r={70}
                fill="none"
                stroke={COLORS.warm}
                strokeWidth={2}
                opacity={progress(frame, 12 + i * 10, 0.6)}
              />
              <SvgText
                x={760 + i * 200}
                y={500}
                text={String(i + 1)}
                start={18 + i * 10}
                size={56}
                weight={200}
              />
            </g>
          ))}
          <SvgText
            x={960}
            y={650}
            text="TROIS HYPOTHÈSES À TESTER"
            start={40}
            size={22}
            weight={500}
            spacing="0.3em"
            color={COLORS.inkSoft}
          />
        </Svg>
      </Stage>
      <Stage from={cues.s(1)} to={cues.s(3)}>
        <Orders />
      </Stage>
      <Stage from={cues.s(3)} to={cues.s(5)}>
        <Photonics />
      </Stage>
      <Stage from={cues.s(5)} to={cues.s(7, 1.2)}>
        <Capacity />
      </Stage>
      <Svg>
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            cx={1640 + i * 34}
            cy={140}
            r={7}
            fill={i === current ? COLORS.warm : COLORS.inkFaint}
            opacity={dots}
          />
        ))}
      </Svg>
      <Stage from={cues.s(7, 1.2)}>
        <Callout kind="analyst" start={cues.s(7, 1.2)} y={330} size={40}>
          À chaque analyse, demande aussi si la croissance attendue est{" "}
          <span style={{ color: COLORS.warm }}>
            déjà intégrée dans le cours de Bourse
          </span>
          .
        </Callout>
      </Stage>
    </AbsoluteFill>
  );
};
