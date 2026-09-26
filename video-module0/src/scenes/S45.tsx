import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { icons, roundRectPath } from "../components/icons";
import { Box, Icon, Link, Svg, SvgText } from "../components/kit";
import {
  Counter,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import { PARTS, PartIntro, PartTag, ScoreBar } from "./S42";

// Plus de GPU en entrée, mais le débit de tokens reste bridé par un goulot.
const Prompt: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const neckX = 1020;
  return (
    <AbsoluteFill>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 190,
          left: 260,
          width: 1400,
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(40, 300), lineHeight: 1.35 }}>
          Explique pourquoi acheter davantage de GPU ne suffit pas toujours à
          produire{" "}
          <span style={{ color: COLORS.accent }}>davantage de tokens</span>
        </div>
      </FadeIn>
      <Svg>
        {new Array(9).fill(0).map((_, i) => (
          <DrawPath
            key={i}
            d={icons.chip(
              380 + (i % 3) * 110,
              440 + Math.floor(i / 3) * 100,
              32,
            )}
            start={cues.s(1, 1.5 + i * 0.15)}
            duration={0.5}
            stroke={i < 3 ? COLORS.ink : COLORS.accent}
            width={1.6}
          />
        ))}
        <SvgText
          x={490}
          y={760}
          text="+ de GPU"
          start={cues.s(1, 2.5)}
          size={26}
          color={COLORS.accent}
        />
        <DrawPath
          d={icons.bottleneck(neckX, 540, 110)}
          start={cues.s(1, 3)}
          duration={1}
          stroke={COLORS.warm}
        />
        {new Array(14).fill(0).map((_, i) => {
          const phase = (frame - cues.s(1, 3.5)) / FPS - i * 0.5;
          if (phase < 0) return null;
          const p = (phase / 3) % 1;
          const x = 640 + p * 800;
          const y =
            540 +
            (random(`g${i}`) - 0.5) * (Math.abs(x - neckX) < 90 ? 10 : 120);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={5}
              fill={COLORS.accent}
              opacity={0.8 * Math.min(1, (1 - p) * 4)}
            />
          );
        })}
        <Icon
          name="token"
          x={1500}
          y={540}
          size={44}
          start={cues.s(1, 4)}
          color={COLORS.accent}
        />
        <SvgText
          x={1500}
          y={640}
          text="Tokens"
          start={cues.s(1, 4.2)}
          size={26}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={neckX}
          y={680}
          text="?"
          start={cues.s(1, 4.6)}
          size={48}
          weight={200}
          color={COLORS.warm}
        />
      </Svg>
      <FadeIn
        start={cues.s(2)}
        style={{
          position: "absolute",
          top: 800,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(24, 500),
            color: COLORS.warm,
            letterSpacing: "0.26em",
          }}
        >
          ADAPTE TON EXPLICATION À TROIS INTERLOCUTEURS
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const AUDIENCES = [
  {
    id: "D1",
    who: "Un client sans connaissances techniques",
    how: "En trois phrases",
    s: 3,
  },
  {
    id: "D2",
    who: "Un analyste financier",
    how: "En reliant utilisation du matériel et rentabilité",
    s: 4,
  },
  {
    id: "D3",
    who: "Un interlocuteur technique",
    how: "En utilisant calcul, bande passante mémoire et communication",
    s: 5,
  },
];

const Audiences: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <FadeIn
        start={cues.s(3)}
        style={{
          position: "absolute",
          top: 200,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300), color: COLORS.inkSoft }}>
          Plus de GPU ne suffit pas toujours pour plus de tokens : explique-le…
        </div>
      </FadeIn>
      <Svg>
        {AUDIENCES.map((a, i) => {
          const x = 200 + i * 520;
          const at = cues.s(a.s);
          return (
            <g key={a.id}>
              <DrawPath
                d={roundRectPath(x, 290, 480, 480, 16)}
                start={at}
                duration={0.8}
                stroke={COLORS.accent}
              />
              <Icon
                name="person"
                x={x + 240}
                y={380}
                size={40}
                start={at + 6}
              />
              <SvgText
                x={x + 240}
                y={470}
                text={a.id}
                start={at + 8}
                size={48}
                weight={200}
                color={COLORS.accent}
              />
              <SvgText
                x={x + 240}
                y={520}
                text="5 POINTS"
                start={at + 10}
                size={22}
                weight={500}
                spacing="0.25em"
                color={COLORS.warm}
              />
            </g>
          );
        })}
      </Svg>
      {AUDIENCES.map((a, i) => (
        <FadeIn
          key={a.id}
          start={cues.s(a.s, 0.5)}
          style={{
            position: "absolute",
            top: 560,
            left: 230 + i * 520,
            width: 420,
            textAlign: "center",
          }}
        >
          <div style={{ ...textStyle(30, 400), lineHeight: 1.3 }}>
            À {a.who.charAt(0).toLowerCase() + a.who.slice(1)}
          </div>
          <div
            style={{
              ...textStyle(26, 300),
              color: COLORS.inkSoft,
              lineHeight: 1.35,
              marginTop: 14,
            }}
          >
            {a.how}
          </div>
        </FadeIn>
      ))}
    </AbsoluteFill>
  );
};

// Barème : chaque ligne s'ajoute et la barre de 100 points se remplit.
const Scale: React.FC = () => {
  const cues = useCues();
  const at = [1.0, 2.2, 3.4, 4.7].map((d) => cues.s(6, d));
  const total = cues.s(6, 5.8);
  return (
    <AbsoluteFill>
      <FadeIn
        start={cues.s(6)}
        style={{
          position: "absolute",
          top: 180,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(46, 200)}>Le barème</div>
      </FadeIn>
      {PARTS.map((p, i) => (
        <FadeIn
          key={p.letter}
          start={at[i]}
          style={{
            position: "absolute",
            top: 280 + i * 62,
            left: 560,
            width: 800,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <div style={textStyle(32, 300)}>
            <span style={{ color: COLORS.inkSoft, marginRight: 20 }}>
              {p.letter}
            </span>
            {p.name}
          </div>
          <div style={{ ...textStyle(38, 200), color: COLORS.accent }}>
            <Counter to={p.points} start={at[i]} duration={0.8} />
          </div>
        </FadeIn>
      ))}
      <Svg>
        <DrawPath
          d="M 560 540 H 1360"
          start={total - 6}
          duration={0.5}
          stroke={COLORS.inkSoft}
        />
      </Svg>
      <FadeIn
        start={total}
        style={{
          position: "absolute",
          top: 555,
          left: 560,
          width: 800,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div style={textStyle(34, 400)}>Total</div>
        <div style={{ ...textStyle(52, 200), color: COLORS.accent }}>
          <Counter to={100} start={total} duration={1} />
        </div>
      </FadeIn>
      <ScoreBar
        current={-1}
        showAll
        start={cues.s(6)}
        fillStarts={at}
        y={680}
      />
    </AbsoluteFill>
  );
};

// Bandes de notation sur une règle de 0 à 100.
const BANDS = [
  {
    from: 0,
    to: 60,
    range: "< 60",
    label: "Insuffisant",
    color: COLORS.warm,
    s: 7,
  },
  {
    from: 60,
    to: 80,
    range: "60–79",
    label: "Compréhension\npartielle",
    color: COLORS.inkSoft,
    s: 8,
  },
  {
    from: 80,
    to: 90,
    range: "80–89",
    label: "Module\nvalidé",
    color: COLORS.accent,
    s: 9,
  },
  {
    from: 90,
    to: 100,
    range: "90–100",
    label: "Maîtrise\nsolide",
    color: COLORS.accent,
    s: 10,
  },
];
const Bands: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const x0 = 180;
  const k = 15.6;
  const y = 440;
  return (
    <AbsoluteFill>
      <FadeIn
        start={cues.s(7)}
        style={{
          position: "absolute",
          top: 190,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(46, 200)}>Ta note sur 100</div>
      </FadeIn>
      <Svg>
        <DrawPath
          d={`M ${x0} ${y + 60} H ${x0 + 100 * k}`}
          start={cues.s(7)}
          duration={1}
          stroke={COLORS.inkFaint}
        />
        {BANDS.map((b, i) => {
          const at = cues.s(b.s);
          const o = progress(frame, at, 0.6);
          const xa = x0 + b.from * k;
          const w = (b.to - b.from) * k;
          return (
            <g key={b.range}>
              <rect
                x={xa + 3}
                y={y}
                width={Math.max(0, (w - 6) * o)}
                height={60}
                rx={8}
                fill={b.color}
                opacity={i === 3 ? 0.55 : 0.28}
              />
              <SvgText
                x={xa + w / 2}
                y={y - 40}
                text={b.range}
                start={at}
                size={32}
                weight={300}
                color={b.color}
              />
              <SvgText
                x={xa + w / 2}
                y={y + 130}
                text={b.label}
                start={at + 6}
                size={26}
                color={i === 1 ? COLORS.ink : b.color}
              />
            </g>
          );
        })}
        {[0, 60, 80, 90, 100].map((v) => (
          <SvgText
            key={v}
            x={x0 + v * k}
            y={y + 84}
            text={String(v)}
            start={cues.s(7)}
            size={22}
            color={COLORS.inkSoft}
          />
        ))}
        <DrawPath
          d={`M ${x0 + 80 * k} ${y - 14} V ${y + 74}`}
          start={cues.s(9)}
          duration={0.4}
          stroke={COLORS.accent}
          width={3}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Après les réponses : correction, puis rattrapage ou module 1.
const Next: React.FC = () => {
  const cues = useCues();
  const t = cues.s(11);
  const steps = [
    { label: "Tes réponses", at: t },
    { label: "Correction\nquestion par question", at: cues.s(11, 1.2) },
    { label: "Rappels\nsur les erreurs", at: cues.s(11, 2.6) },
    { label: "Note", at: cues.s(11, 3.6) },
  ];
  const w = 340;
  const gap = 80;
  const x0 = 960 - (4 * w + 3 * gap) / 2;
  const noteX = x0 + 3 * (w + gap) + w / 2;
  return (
    <AbsoluteFill>
      <Svg>
        {steps.map((s, i) => {
          const x = x0 + i * (w + gap);
          return (
            <g key={s.label}>
              <Box
                x={x}
                y={300}
                w={w}
                h={110}
                label={s.label}
                start={s.at}
                size={26}
                variant={i === 3 ? "hi" : "default"}
              />
              {i < 3 && (
                <Link
                  from={[x + w, 355]}
                  to={[x + w + gap, 355]}
                  start={steps[i + 1].at - 6}
                />
              )}
            </g>
          );
        })}
        <Link
          from={[noteX - 40, 410]}
          to={[640, 580]}
          start={cues.s(12)}
          color={COLORS.warm}
        />
        <Box
          x={180}
          y={580}
          w={920}
          h={140}
          label="Moins de 80 : rattrapage ciblé"
          sub="puis 3 à 5 nouvelles questions"
          start={cues.s(12, 0.4)}
          variant="side"
          size={32}
        />
        <Link
          from={[noteX + 20, 410]}
          to={[1470, 580]}
          start={cues.s(12, 3)}
          color={COLORS.accent}
        />
        <Box
          x={1180}
          y={580}
          w={580}
          h={140}
          label="Validé : module 1"
          sub="commence après validation"
          start={cues.s(12, 3.3)}
          variant="out"
          size={32}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Scène 45 — Partie D (Feynman), barème, bandes de notation et suite.
export const S45: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(1)}>
        <PartIntro
          index={3}
          title="Test de Feynman"
          start={0}
          perQuestion="3 interlocuteurs, 5 points chacun"
        />
      </Stage>
      <Stage from={cues.s(1)} to={cues.s(6)}>
        <PartTag index={3} start={cues.s(1)} />
      </Stage>
      <Stage from={cues.s(1)} to={cues.s(3)}>
        <Prompt />
      </Stage>
      <Stage from={cues.s(3)} to={cues.s(6)}>
        <Audiences />
      </Stage>
      <Stage from={cues.s(6)} to={cues.s(7)}>
        <Scale />
      </Stage>
      <Stage from={cues.s(7)} to={cues.s(11)}>
        <Bands />
      </Stage>
      <Stage from={cues.s(11)}>
        <Next />
      </Stage>
    </AbsoluteFill>
  );
};
