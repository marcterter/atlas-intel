import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { circlePath, roundRectPath } from "../components/icons";
import { Icon, Link, Svg, SvgText } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";

const PATH = [
  "Charges",
  "Bandes",
  "Dopage",
  "MOSFET",
  "CMOS",
  "Logique",
  "Énergie",
  "Système",
];

// Le parcours du module : huit étapes qui s'allument l'une après l'autre.
const Journey: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t0 = cues.s(1, 0.4);
  const step = 1.1 * FPS;
  const xs = PATH.map((_, i) => 250 + i * 203);
  const yOf = (i: number) => 540 - Math.sin((i / 7) * Math.PI) * 50;
  const pos = interpolate(frame, [t0, t0 + 7 * step], [0, 7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const k = Math.min(6, Math.floor(pos));
  const f = pos - k;
  const dotX = xs[k] + (xs[k + 1] - xs[k]) * f;
  const dotY = yOf(k) + (yOf(k + 1) - yOf(k)) * f;
  const line = xs.map((x, i) => `${i ? "L" : "M"} ${x} ${yOf(i)}`).join(" ");
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 170,
          width: "100%",
          textAlign: "center",
        }}
      >
        <FadeIn start={0}>
          <div
            style={{
              ...textStyle(24, 500),
              color: COLORS.accent,
              letterSpacing: "0.34em",
            }}
          >
            FORMATION INFRASTRUCTURE IA
          </div>
        </FadeIn>
        <FadeIn start={8} style={{ marginTop: 20 }}>
          <div style={textStyle(72, 200)}>Module 1 terminé</div>
        </FadeIn>
      </div>
      <Svg>
        <DrawPath
          d={line}
          start={t0 - 6}
          duration={7 * 1.1}
          stroke={COLORS.inkFaint}
          width={1.4}
        />
        {PATH.map((p, i) => {
          const at = t0 + i * step;
          const lit = progress(frame, at, 0.5);
          const color = i >= 6 ? COLORS.warm : COLORS.accent;
          return (
            <g key={p}>
              <circle
                cx={xs[i]}
                cy={yOf(i)}
                r={34}
                fill={color}
                opacity={0.1 * lit}
              />
              <DrawPath
                d={circlePath(xs[i], yOf(i), 34)}
                start={at}
                duration={0.5}
                stroke={color}
              />
              <SvgText
                x={xs[i]}
                y={yOf(i)}
                text={String(i + 1)}
                start={at + 4}
                size={26}
                weight={300}
                color={color}
              />
              <SvgText
                x={xs[i]}
                y={yOf(i) + 72}
                text={p}
                start={at + 6}
                size={28}
                color={COLORS.ink}
              />
            </g>
          );
        })}
        <circle
          cx={dotX}
          cy={dotY}
          r={8}
          fill={COLORS.ink}
          opacity={progress(frame, t0, 0.4) * (pos >= 7 ? 0 : 1)}
        />
      </Svg>
      <FadeIn
        start={cues.s(1, 1)}
        style={{
          position: "absolute",
          top: 720,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(40, 200)}>
          Du <span style={{ color: COLORS.accent }}>courant électrique</span>{" "}
          aux <span style={{ color: COLORS.warm }}>calculs de l’IA</span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const PILLARS: {
  title: string;
  icon: "network" | "check" | "bolt";
  sub: string;
  d: number;
}[] = [
  {
    title: "Contrôler les charges",
    icon: "network",
    sub: "le transistor",
    d: 1.6,
  },
  {
    title: "Construire des circuits fiables",
    icon: "check",
    sub: "la logique CMOS",
    d: 3.6,
  },
  {
    title: "Plus de travail utile",
    icon: "bolt",
    sub: "dans un budget de puissance limité",
    d: 5.8,
  },
];

// Le fil directeur en trois temps.
const Thread: React.FC = () => {
  const cues = useCues();
  const XS = [520, 960, 1400];
  const at = (i: number) => cues.s(2, PILLARS[i].d);
  return (
    <AbsoluteFill>
      <FadeIn
        start={cues.s(2)}
        style={{
          position: "absolute",
          top: 200,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.accent,
            letterSpacing: "0.32em",
          }}
        >
          GARDE LE FIL DIRECTEUR
        </div>
      </FadeIn>
      <Svg>
        {XS.map((x, i) => (
          <g key={x}>
            <DrawPath
              d={roundRectPath(x - 190, 320, 380, 320, 14)}
              start={at(i)}
              duration={0.8}
              stroke={i === 2 ? COLORS.warm : COLORS.ink}
              width={1.6}
            />
            <Icon
              name={PILLARS[i].icon}
              x={x}
              y={410}
              size={40}
              start={at(i) + 10}
              color={i === 2 ? COLORS.warm : COLORS.accent}
            />
            {i < 2 && (
              <Link
                from={[x + 190, 480]}
                to={[XS[i + 1] - 190, 480]}
                start={at(i + 1) - 6}
                gap={8}
              />
            )}
          </g>
        ))}
      </Svg>
      {XS.map((x, i) => (
        <FadeIn
          key={x}
          start={at(i) + 14}
          style={{
            position: "absolute",
            top: 490,
            left: x - 175,
            width: 350,
            textAlign: "center",
          }}
        >
          <div style={{ ...textStyle(30, 300), lineHeight: 1.25 }}>
            {PILLARS[i].title}
          </div>
          <div
            style={{
              ...textStyle(24, 300),
              color: COLORS.inkSoft,
              marginTop: 12,
              lineHeight: 1.3,
            }}
          >
            {PILLARS[i].sub}
          </div>
        </FadeIn>
      ))}
    </AbsoluteFill>
  );
};

// Répondre au test, puis le module 2.
const NextStep: React.FC = () => {
  const cues = useCues();
  const t = cues.s(3);
  const m2 = cues.s(4);
  return (
    <AbsoluteFill>
      <Svg>
        <Icon
          name="pencil"
          x={760}
          y={300}
          size={40}
          start={t}
          color={COLORS.ink}
        />
        <Link from={[830, 300]} to={[1090, 300]} start={cues.s(3, 1.2)} />
        <Icon
          name="check"
          x={1160}
          y={300}
          size={36}
          start={cues.s(3, 1.6)}
          color={COLORS.accent}
          width={3}
        />
        <SvgText
          x={760}
          y={380}
          text="tes mots, tes calculs"
          start={cues.s(3, 0.4)}
          size={26}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={1160}
          y={380}
          text="envoie tes réponses"
          start={cues.s(3, 1.8)}
          size={26}
          color={COLORS.accent}
        />
        <DrawPath
          d={circlePath(700, 640, 90)}
          start={m2}
          duration={1}
          stroke={COLORS.accent}
        />
        {[-60, -30, 0, 30, 60].map((o) => (
          <DrawPath
            key={`h${o}`}
            d={`M ${700 - Math.sqrt(90 * 90 - o * o) + 6} ${640 + o} H ${700 + Math.sqrt(90 * 90 - o * o) - 6}`}
            start={m2 + 10}
            duration={0.6}
            stroke={COLORS.inkFaint}
            width={1}
          />
        ))}
        {[-60, -30, 0, 30, 60].map((o) => (
          <DrawPath
            key={`v${o}`}
            d={`M ${700 + o} ${640 - Math.sqrt(90 * 90 - o * o) + 6} V ${640 + Math.sqrt(90 * 90 - o * o) - 6}`}
            start={m2 + 14}
            duration={0.6}
            stroke={COLORS.inkFaint}
            width={1}
          />
        ))}
      </Svg>
      <FadeIn
        start={m2 + 6}
        style={{ position: "absolute", top: 580, left: 860, width: 900 }}
      >
        <div
          style={{
            ...textStyle(24, 500),
            color: COLORS.accent,
            letterSpacing: "0.32em",
          }}
        >
          PROCHAINE ÉTAPE · MODULE 2
        </div>
        <div style={{ ...textStyle(56, 200), marginTop: 12 }}>
          Du silicium au wafer
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 54 — Carte de fin du module 1.
export const S54: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(2)}>
        <Journey />
      </Stage>
      <Stage from={cues.s(2)} to={cues.s(3)}>
        <Thread />
      </Stage>
      <Stage from={cues.s(3)}>
        <NextStep />
      </Stage>
    </AbsoluteFill>
  );
};
