import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Equation, Svg, SvgText, Title } from "../components/kit";
import {
  Counter,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT } from "../theme";

const fr = (v: number, d = 0) =>
  v.toLocaleString("fr-FR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });

// Beat 0 : hypothèses, sous forme de curseurs.
const SLIDERS = [
  { sym: "C", name: "capacité", to: 85, delta: "−15 %", at: 1.2 },
  { sym: "VDD", name: "tension", to: 90, delta: "−10 %", at: 3.2 },
  { sym: "f", name: "fréquence", to: 120, delta: "+20 %", at: 5.2 },
  { sym: "α", name: "activité", to: 100, delta: "inchangée", at: 7.4 },
];
const TX0 = 640;
const TX1 = 1440;
const tx = (pct: number) => TX0 + ((pct - 50) / 80) * (TX1 - TX0);

const Sliders: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Svg>
        {SLIDERS.map((s, i) => {
          const y = 330 + i * 125;
          const t = cues.s(1, s.at);
          const p = progress(frame, t + 10, 1.2);
          const v = 100 + (s.to - 100) * p;
          const color =
            s.to < 100
              ? COLORS.accent
              : s.to > 100
                ? COLORS.warm
                : COLORS.inkSoft;
          return (
            <g key={s.sym} opacity={progress(frame, t - 10, 0.5)}>
              <text
                x={TX0 - 260}
                y={y + 12}
                fontFamily={FONT}
                fontSize={40}
                fontWeight={300}
                fill={COLORS.ink}
              >
                {s.sym}
              </text>
              <text
                x={TX0 - 150}
                y={y + 10}
                fontFamily={FONT}
                fontSize={24}
                fontWeight={300}
                fill={COLORS.inkSoft}
              >
                {s.name}
              </text>
              <path
                d={`M ${TX0} ${y} H ${TX1}`}
                stroke={COLORS.inkFaint}
                strokeWidth={3}
                strokeLinecap="round"
              />
              <path
                d={`M ${tx(100)} ${y - 16} V ${y + 16}`}
                stroke={COLORS.inkSoft}
                strokeWidth={1.5}
              />
              <path
                d={`M ${tx(100)} ${y} H ${tx(v)}`}
                stroke={color}
                strokeWidth={5}
                strokeLinecap="round"
              />
              <circle
                cx={tx(v)}
                cy={y}
                r={13}
                fill={COLORS.nightTop}
                stroke={color}
                strokeWidth={3}
              />
              <text
                x={TX1 + 50}
                y={y + 12}
                fontFamily={FONT}
                fontSize={34}
                fontWeight={300}
                fill={color}
              >
                {s.to === 100 ? s.delta : `${fr(v)} %`}
              </text>
              {s.to !== 100 && (
                <text
                  x={TX1 + 190}
                  y={y + 10}
                  fontFamily={FONT}
                  fontSize={24}
                  fontWeight={400}
                  fill={color}
                  opacity={p}
                >
                  ({s.delta})
                </text>
              )}
            </g>
          );
        })}
        <SvgText
          x={tx(100)}
          y={825}
          text="valeur de départ = 100 %"
          start={cues.s(1, 1)}
          size={22}
          color={COLORS.inkSoft}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Beats 1 et 2 : calcul du rapport puis barre de puissance.
const Ratio: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(2);
  const b2 = cues.beat(2);
  const bar = progress(frame, b2 + 10, 1.6);
  const W = 1000;
  const X = 460;
  const Y = 640;
  const w = W * (1 - 0.1738 * bar);
  return (
    <AbsoluteFill>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 240,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.inkSoft,
            letterSpacing: "0.28em",
          }}
        >
          P NOUVELLE ÷ P ANCIENNE (α INCHANGÉ)
        </div>
      </FadeIn>
      <Equation
        parts={["0,85", "×", "0,90²", "×", "1,20"]}
        starts={[t + 100, t + 115, t + 130, t + 160, t + 175]}
        y={300}
        size={72}
      />
      <FadeIn
        start={t + 230}
        style={{
          position: "absolute",
          top: 420,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(34, 300), color: COLORS.inkSoft }}>
          = 0,85 × 0,81 × 1,20 = 0,6885 × 1,20
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(3)}
        style={{
          position: "absolute",
          top: 480,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(64, 200), color: COLORS.accent }}>
          ={" "}
          <Counter to={0.8262} decimals={4} start={cues.s(3)} duration={1.2} />
        </div>
      </FadeIn>
      <Svg>
        <DrawPath
          d={roundRectPath(X, Y, W, 56, 8)}
          start={b2}
          duration={0.6}
          stroke={COLORS.inkSoft}
          width={1.5}
        />
        {bar > 0 && (
          <>
            <rect
              x={X + 4}
              y={Y + 4}
              width={w - 8}
              height={48}
              rx={6}
              fill={COLORS.accent}
              opacity={0.45}
            />
            <rect
              x={X + w}
              y={Y + 4}
              width={W - w - 4}
              height={48}
              rx={6}
              fill={COLORS.warm}
              opacity={0.2 * bar}
            />
          </>
        )}
        <SvgText
          x={X}
          y={Y - 26}
          text="puissance dynamique"
          start={b2}
          size={24}
          anchor="start"
          color={COLORS.inkSoft}
        />
        <SvgText
          x={X + W}
          y={Y - 26}
          text="100 %"
          start={b2}
          size={24}
          anchor="end"
          color={COLORS.inkSoft}
        />
        {bar > 0 && (
          <text
            x={X + w - 16}
            y={Y + 38}
            textAnchor="end"
            fontFamily={FONT}
            fontSize={28}
            fill={COLORS.ink}
          >
            {fr(100 - 17.38 * bar, 2)} %
          </text>
        )}
      </Svg>
      <FadeIn
        start={b2 + 40}
        style={{
          position: "absolute",
          top: Y + 80,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(46, 200), color: COLORS.warm }}>
          − <Counter to={17.38} decimals={2} start={b2 + 40} duration={1.2} /> %
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Beat 3 : ce que le résultat ne dit pas.
const Caveats: React.FC = () => {
  const cues = useCues();
  const items = [
    {
      at: cues.s(5),
      head: "PAS LA PUISSANCE TOTALE",
      text: "La puce consomme aussi par ses fuites, non incluses ici.",
    },
    {
      at: cues.s(6),
      head: "PAS LE GAIN DE DÉBIT",
      text: "Si l’application est limitée par la mémoire, +20 % de fréquence ne donne pas +20 % de travail.",
    },
  ];
  return (
    <AbsoluteFill>
      <Title
        kicker="Attention"
        text="Ce que −17,38 % ne dit pas"
        start={cues.beat(3)}
        top={100}
      />
      {items.map((it, i) => (
        <FadeIn
          key={it.head}
          start={it.at}
          style={{
            position: "absolute",
            top: 330 + i * 230,
            left: 300,
            width: 1320,
          }}
        >
          <div
            style={{
              borderLeft: `2px solid ${COLORS.warm}`,
              paddingLeft: 44,
              paddingTop: 6,
              paddingBottom: 6,
            }}
          >
            <div
              style={{
                ...textStyle(22, 500),
                color: COLORS.warm,
                letterSpacing: "0.3em",
              }}
            >
              {it.head}
            </div>
            <div
              style={{ ...textStyle(34, 300), marginTop: 14, lineHeight: 1.35 }}
            >
              {it.text}
            </div>
          </div>
        </FadeIn>
      ))}
    </AbsoluteFill>
  );
};

// Scène 21 — Exemple résolu.
export const S21: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(1)}>
        <Title
          kicker="Exemple fictif"
          text="Un exemple résolu de comparaison"
          start={cues.s(0)}
          top={100}
        />
        <Sliders />
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(3)}>
        <Title
          kicker="Puissance dynamique"
          text="Le rapport des puissances"
          start={cues.beat(1)}
          top={100}
        />
        <Ratio />
      </Stage>
      <Stage from={cues.beat(3)}>
        <Caveats />
      </Stage>
    </AbsoluteFill>
  );
};
