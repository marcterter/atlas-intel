import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { icons, roundRectPath } from "../components/icons";
import { Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT, FPS } from "../theme";
import { Pill, TextAt, accentA, caps } from "./S23";

// Colonne : nom, mini-schéma, question, ce qu'elle ne garantit pas.
const Column: React.FC<{
  cx: number;
  name: string;
  question: string;
  nots: string[];
  at: number;
  nameAt: number;
  notAt: number;
  dim: number;
  children: React.ReactNode;
}> = ({ cx, name, question, nots, at, nameAt, notAt, dim, children }) => (
  <AbsoluteFill style={{ opacity: dim }}>
    <TextAt x={cx} y={250} w={700} start={nameAt} align="center">
      <div style={textStyle(44, 200)}>{name}</div>
    </TextAt>
    {children}
    <TextAt x={cx} y={500} w={680} start={at + 10} align="center">
      <div style={{ ...caps(COLORS.accent), marginBottom: 8 }}>QUESTION</div>
      <div style={{ ...textStyle(30, 300) }}>{question}</div>
    </TextAt>
    <TextAt x={cx} y={665} w={680} start={notAt} align="center">
      <div style={{ ...caps(COLORS.warm), marginBottom: 10 }}>
        NE GARANTIT PAS
      </div>
      {nots.map((n) => (
        <div key={n} style={{ ...textStyle(28, 300), marginTop: 4 }}>
          <span style={{ color: COLORS.warm }}>✕</span> {n}
        </div>
      ))}
    </TextAt>
  </AbsoluteFill>
);

const TwoIdeas: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const m = cues.s(1);
  const d = cues.s(3);
  const dimM = 1 - 0.55 * progress(frame, d - 10, 0.6);
  // Mini-schéma Moore : une puce qui accueille de plus en plus de composants.
  const grid = [2, 4, 8];
  const gi = Math.min(
    2,
    Math.floor(Math.max(0, frame - m - FPS) / (FPS * 1.2)),
  );
  const n = grid[gi];
  // Mini-schéma Dennard : un transistor et sa tension qui rétrécissent ensemble.
  const k = 1 - 0.3 * progress(frame, d + FPS * 1.5, 1.6);
  return (
    <AbsoluteFill>
      <Title
        kicker="Moore et Dennard"
        text="Deux idées, deux questions"
        start={cues.s(0)}
        top={110}
      />
      <Svg>
        <DrawPath
          d="M 960 260 V 820"
          start={cues.s(0, 1)}
          duration={1}
          stroke={COLORS.inkFaint}
          width={1}
        />
      </Svg>
      <Column
        cx={560}
        name="Loi de Moore"
        question="Combien de composants peut-on intégrer économiquement ?"
        nots={[
          "un doublement automatique des performances",
          "un calendrier physique obligatoire",
        ]}
        at={m}
        nameAt={cues.s(0, 1.4)}
        notAt={cues.s(2)}
        dim={dimM}
      >
        <Svg>
          <DrawPath
            d={roundRectPath(490, 330, 140, 140, 8)}
            start={m}
            duration={0.6}
            stroke={COLORS.ink}
          />
          {m < frame &&
            new Array(n * n).fill(0).map((_, i) => {
              const c = 120 / n;
              return (
                <rect
                  key={`${n}-${i}`}
                  x={500 + (i % n) * c + c * 0.15}
                  y={340 + Math.floor(i / n) * c + c * 0.15}
                  width={c * 0.7}
                  height={c * 0.7}
                  fill={accentA(0.5)}
                  opacity={progress(frame, m + 10, 0.4)}
                />
              );
            })}
          <SvgText
            x={700}
            y={400}
            text={`${n * n} composants`}
            start={m + 10}
            size={22}
            color={COLORS.inkSoft}
            anchor="start"
          />
        </Svg>
      </Column>
      <Column
        cx={1360}
        name="Scaling de Dennard"
        question="Comment dimensions, tensions et puissance évoluent-elles dans un modèle de miniaturisation ?"
        nots={[
          "une baisse éternelle de la tension",
          "une densité de puissance constante en pratique",
        ]}
        at={d}
        nameAt={cues.s(0, 3)}
        notAt={cues.s(4)}
        dim={1}
      >
        <Svg>
          <g opacity={progress(frame, d, 0.6)}>
            <rect
              x={1300 - 60 * k}
              y={420 - 80 * k}
              width={120 * k}
              height={80 * k}
              fill={accentA(0.2)}
              stroke={COLORS.accent}
              strokeWidth={1.6}
            />
            <text
              x={1300}
              y={452}
              textAnchor="middle"
              fontFamily={FONT}
              fontSize={22}
              fill={COLORS.inkSoft}
            >
              L × {k.toFixed(2).replace(".", ",")}
            </text>
            <rect
              x={1440}
              y={420 - 90 * k}
              width={24}
              height={90 * k}
              fill={accentA(0.35)}
            />
            <text
              x={1480}
              y={420 - 45 * k}
              fontFamily={FONT}
              fontSize={22}
              fill={COLORS.inkSoft}
            >
              V
            </text>
          </g>
        </Svg>
      </Column>
    </AbsoluteFill>
  );
};

// Frise : la cadence de Moore, révisée.
const X = (year: number) => 260 + (year - 1960) * 28;
const L2 = (year: number) =>
  year <= 1975 ? 6 + (year - 1965) : 16 + (year - 1975) * 0.5;
const Y = (l: number) => 760 - (l - 4) * 22;

const Timeline: React.FC = () => {
  const cues = useCues();
  const t = cues.s(5);
  const r = cues.s(6);
  const early = [1962, 1965, 1970, 1975].map((y) => [X(y), Y(L2(y))]);
  const late = [1975, 1980, 1985, 1990].map((y) => [X(y), Y(L2(y))]);
  const pl = (pts: number[][]) =>
    pts.map((p, i) => `${i ? "L" : "M"} ${p[0]} ${p[1]}`).join(" ");
  return (
    <AbsoluteFill>
      <TextAt x={960} y={130} w={1500} start={t} align="center">
        <div style={textStyle(40, 200)}>
          La loi de Moore : une observation, une trajectoire industrielle
        </div>
      </TextAt>
      <Svg>
        <DrawPath
          d={`M 260 290 V 780 H 1120`}
          start={t + 6}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        {[1960, 1965, 1970, 1975, 1980, 1985, 1990].map((y) => (
          <SvgText
            key={y}
            x={X(y)}
            y={806}
            text={String(y)}
            start={t + 12}
            size={22}
            color={COLORS.inkSoft}
          />
        ))}
        <SvgText
          x={272}
          y={280}
          text="composants par puce (échelle log)"
          start={t + 12}
          size={22}
          color={COLORS.inkSoft}
          anchor="start"
        />
        <DrawPath
          d={pl(early)}
          start={t + FPS * 2}
          duration={1.6}
          stroke={COLORS.accent}
          width={2.4}
        />
        <DrawPath
          d={pl(late)}
          start={r + FPS * 4}
          duration={1.6}
          stroke={COLORS.warm}
          width={2.4}
        />
        <DrawPath
          d={`M ${X(1975)} ${Y(16) - 20} V 780`}
          start={r + FPS * 3.8}
          duration={0.6}
          stroke={COLORS.inkFaint}
          width={1.2}
        />
        <SvgText
          x={X(1965) + 14}
          y={Y(L2(1965)) + 34}
          text="1965 : ≈ ×2 chaque année"
          start={r + FPS * 2}
          size={24}
          color={COLORS.accent}
          anchor="start"
        />
        <SvgText
          x={X(1975) + 14}
          y={Y(16) + 40}
          text="1975 : révisée vers ≈ ×2 tous les 2 ans"
          start={r + FPS * 4.3}
          size={24}
          color={COLORS.warm}
          anchor="start"
        />
      </Svg>
      <TextAt x={1200} y={330} w={560} start={t + FPS * 1}>
        <div style={caps(COLORS.accent)}>NATURE</div>
        <div style={{ ...textStyle(30, 300), marginTop: 8 }}>
          une observation, devenue une trajectoire suivie par l’industrie — pas
          une loi physique
        </div>
      </TextAt>
      <TextAt x={1200} y={560} w={560} start={cues.s(7)}>
        <div style={caps()}>HISTOIRE</div>
        <div style={{ ...textStyle(28, 300), marginTop: 8 }}>
          retracée par ASML
        </div>
      </TextAt>
      <Pill
        text="Source 8"
        start={cues.s(7)}
        x={1200}
        y={680}
        tone="ink"
        align="left"
      />
    </AbsoluteFill>
  );
};

// Les noms de nœuds ne sont pas une règle graduée.
const Nodes: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(8);
  const names = ["« 10 nm »", "« 7 nm »", "« 5 nm »", "« 3 nm »"];
  const strike = t + FPS * 3.2;
  return (
    <AbsoluteFill>
      <TextAt x={960} y={140} w={1500} start={t} align="center">
        <div style={textStyle(40, 200)}>Les noms de nœuds modernes</div>
      </TextAt>
      <Svg>
        {/* Règle graduée */}
        <DrawPath
          d={roundRectPath(360, 300, 1200, 110, 8)}
          start={t + 6}
          duration={0.8}
          stroke={COLORS.ink}
        />
        {new Array(41).fill(0).map((_, i) => (
          <path
            key={i}
            d={`M ${380 + i * 29} 300 V ${300 + (i % 10 === 0 ? 44 : i % 5 === 0 ? 30 : 16)}`}
            stroke={COLORS.inkSoft}
            strokeWidth={1.2}
            opacity={progress(frame, t + 10 + i * 0.5, 0.3)}
          />
        ))}
        {names.map((nm, i) => (
          <SvgText
            key={nm}
            x={380 + i * 290 + 145}
            y={380}
            text={nm}
            start={t + 20 + i * 6}
            size={28}
          />
        ))}
        {/* Barrée */}
        <DrawPath
          d="M 340 440 L 1580 270"
          start={strike}
          duration={0.7}
          stroke={COLORS.warm}
          width={3}
        />
        {/* Deux fabricants, même nom, contenus différents */}
        {[0, 1].map((i) => {
          const x = 420 + i * 620;
          const at = t + FPS * (4.2 + i * 0.8);
          return (
            <g key={i}>
              <DrawPath
                d={roundRectPath(x, 520, 460, 170, 12)}
                start={at}
                duration={0.7}
                stroke={COLORS.inkSoft}
                width={1.4}
              />
              <DrawPath
                d={icons.chip(x + 70, 605, 34)}
                start={at + 6}
                stroke={i ? COLORS.warm : COLORS.accent}
              />
              <SvgText
                x={x + 290}
                y={570}
                text={`Fabricant ${i ? "B" : "A"}`}
                start={at + 6}
                size={28}
              />
              <SvgText
                x={x + 290}
                y={612}
                text="nœud « N »"
                start={at + 10}
                size={24}
                color={COLORS.inkSoft}
              />
              <SvgText
                x={x + 290}
                y={652}
                text={
                  i
                    ? "densité, performances : différentes"
                    : "densité, performances : propres"
                }
                start={at + 14}
                size={22}
                color={i ? COLORS.warm : COLORS.accent}
              />
            </g>
          );
        })}
      </Svg>
      <TextAt x={960} y={730} w={1400} start={strike + 10} align="center">
        <div style={{ ...textStyle(30, 300) }}>
          <span style={{ color: COLORS.warm }}>
            Pas une règle graduée universelle
          </span>{" "}
          : un nom de nœud ne mesure pas directement une dimension, et ne
          compare pas directement tous les fabricants.
        </div>
      </TextAt>
      <Pill text="Source 8" start={cues.s(9)} x={1780} y={112} tone="ink" />
    </AbsoluteFill>
  );
};

export const S27: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(3)}>
        <TwoIdeas />
      </Stage>
      <Stage from={cues.beat(3)} to={cues.beat(4)}>
        <Timeline />
      </Stage>
      <Stage from={cues.beat(4)}>
        <Nodes />
      </Stage>
    </AbsoluteFill>
  );
};
