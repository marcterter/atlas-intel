import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
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
import { COLORS } from "../theme";
import { PARTS, PartIntro, PartTag, ScoreBar } from "./S49";

// Consigne : plus de transistors ne rend pas automatiquement la puce meilleure.
const Prompt: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const outs = [
    { label: "plus rapide", at: cues.s(1, 4.4) },
    { label: "moins énergivore", at: cues.s(1, 5.6) },
    { label: "moins coûteuse à exploiter", at: cues.s(1, 6.8) },
  ];
  return (
    <AbsoluteFill>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 180,
          left: 260,
          width: 1400,
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(38, 300), lineHeight: 1.35 }}>
          Explique pourquoi une puce contenant{" "}
          <span style={{ color: COLORS.accent }}>davantage de transistors</span>{" "}
          n’est pas automatiquement…
        </div>
      </FadeIn>
      <Svg>
        {/* Une puce dont la grille de transistors se densifie */}
        {new Array(36).fill(0).map((_, i) => {
          const r = Math.floor(i / 6);
          const c = i % 6;
          const extra = (r + c) % 2 === 1;
          const o = extra
            ? progress(frame, cues.s(1, 1.8) + i, 0.3)
            : progress(frame, cues.s(1, 1), 0.5);
          return (
            <rect
              key={i}
              x={300 + c * 44}
              y={430 + r * 44}
              width={32}
              height={32}
              rx={4}
              fill={extra ? COLORS.accent : COLORS.ink}
              opacity={0.45 * o}
            />
          );
        })}
        <DrawPath
          d={roundRectPath(280, 410, 276, 276, 12)}
          start={cues.s(1, 0.8)}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={418}
          y={730}
          text="+ de transistors"
          start={cues.s(1, 1.8)}
          size={28}
          color={COLORS.accent}
        />
        {outs.map((o, i) => (
          <g key={o.label}>
            <Link
              from={[580, 548]}
              to={[930, 440 + i * 120]}
              start={o.at - 6}
              color={COLORS.warm}
            />
            <Box
              x={960}
              y={400 + i * 120}
              w={640}
              h={84}
              label={o.label}
              start={o.at}
              size={32}
              variant="side"
            />
          </g>
        ))}
        <SvgText
          x={1280}
          y={790}
          text="pas automatiquement"
          start={cues.s(1, 8)}
          size={26}
          weight={400}
          color={COLORS.warm}
        />
      </Svg>
    </AbsoluteFill>
  );
};

const AUDIENCES = [
  {
    id: "D1",
    who: "À un client non technique",
    how: "En trois phrases, avec une analogie et sa limite",
    s: 2,
  },
  {
    id: "D2",
    who: "À un analyste financier",
    how: "En reliant physique, coût de fabrication et coût du service",
    s: 3,
  },
  {
    id: "D3",
    who: "À un interlocuteur technique",
    how: "Avec tension, capacité, fréquence, fuites et limites du système",
    s: 4,
  },
];

const Audiences: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <FadeIn
        start={cues.s(2)}
        style={{
          position: "absolute",
          top: 170,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300), color: COLORS.inkSoft }}>
          Plus de transistors n’est pas automatiquement mieux : explique-le…
        </div>
      </FadeIn>
      <Svg>
        {AUDIENCES.map((a, i) => {
          const x = 200 + i * 520;
          const at = cues.s(a.s);
          return (
            <g key={a.id}>
              <DrawPath
                d={roundRectPath(x, 250, 480, 540, 16)}
                start={at}
                duration={0.8}
                stroke={COLORS.accent}
              />
              <Icon
                name="person"
                x={x + 240}
                y={340}
                size={40}
                start={at + 6}
              />
              <SvgText
                x={x + 240}
                y={430}
                text={a.id}
                start={at + 8}
                size={48}
                weight={200}
                color={COLORS.accent}
              />
              <SvgText
                x={x + 240}
                y={480}
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
            top: 530,
            left: 230 + i * 520,
            width: 420,
            textAlign: "center",
          }}
        >
          <div style={{ ...textStyle(30, 400), lineHeight: 1.3 }}>{a.who}</div>
          <div
            style={{
              ...textStyle(28, 300),
              color: COLORS.inkSoft,
              lineHeight: 1.35,
              marginTop: 16,
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
  const at = [1.4, 2.8, 4.0, 5.6].map((d) => cues.s(5, d));
  const total = cues.s(6);
  return (
    <AbsoluteFill>
      <FadeIn
        start={cues.s(5)}
        style={{
          position: "absolute",
          top: 160,
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
            top: 260 + i * 62,
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
          d="M 560 520 H 1360"
          start={total - 6}
          duration={0.5}
          stroke={COLORS.inkSoft}
        />
      </Svg>
      <FadeIn
        start={total}
        style={{
          position: "absolute",
          top: 535,
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
        start={cues.s(5)}
        fillStarts={at}
        y={680}
      />
    </AbsoluteFill>
  );
};

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
          top: 180,
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
                y={y + 140}
                text={b.label}
                start={at + 6}
                size={28}
                color={i === 1 ? COLORS.ink : b.color}
              />
            </g>
          );
        })}
        {[0, 60, 80, 90, 100].map((v) => (
          <SvgText
            key={v}
            x={x0 + v * k}
            y={y + 88}
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
      <FadeIn
        start={cues.s(9, 1)}
        style={{
          position: "absolute",
          top: 700,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(28, 300), color: COLORS.accent }}>
          seuil de validation : 80
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Après les réponses : correction, puis reprise ou module 2.
const Next: React.FC = () => {
  const cues = useCues();
  const t = cues.s(11);
  const steps = [
    { label: "Tes réponses", at: t },
    { label: "Correction\nquestion par question", at: cues.s(11, 1.2) },
    { label: "Note", at: cues.s(11, 2.6) },
  ];
  const w = 400;
  const gap = 100;
  const x0 = 960 - (3 * w + 2 * gap) / 2;
  const noteX = x0 + 2 * (w + gap) + w / 2;
  return (
    <AbsoluteFill>
      <Svg>
        {steps.map((s, i) => {
          const x = x0 + i * (w + gap);
          return (
            <g key={s.label}>
              <Box
                x={x}
                y={220}
                w={w}
                h={110}
                label={s.label}
                start={s.at}
                size={28}
                variant={i === 2 ? "hi" : "default"}
              />
              {i < 2 && (
                <Link
                  from={[x + w, 275]}
                  to={[x + w + gap, 275]}
                  start={steps[i + 1].at - 6}
                />
              )}
            </g>
          );
        })}
        <Link
          from={[noteX - 60, 330]}
          to={[640, 460]}
          start={cues.s(12)}
          color={COLORS.warm}
        />
        <Box
          x={180}
          y={460}
          w={880}
          h={150}
          label="Moins de 80 : reprise des lacunes"
          sub="puis 3 à 5 questions ciblées"
          start={cues.s(12, 0.4)}
          variant="side"
          size={32}
        />
        <Link
          from={[noteX + 20, 330]}
          to={[1440, 460]}
          start={cues.s(13)}
          color={COLORS.accent}
        />
        <Box
          x={1140}
          y={460}
          w={600}
          h={150}
          label="Validé : module 2"
          sub="prochaine étape du cursus"
          start={cues.s(13, 0.3)}
          variant="out"
          size={32}
        />
        <DrawPath
          d={icons.wafer(1300, 740, 44)}
          start={cues.s(13, 1)}
          duration={1}
          stroke={COLORS.accent}
        />
      </Svg>
      <FadeIn
        start={cues.s(13, 1.4)}
        style={{ position: "absolute", top: 715, left: 1370, width: 400 }}
      >
        <div style={{ ...textStyle(34, 200), color: COLORS.accent }}>
          Du silicium au wafer
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 53 — Partie D (Feynman), barème, bandes de notation et suite.
export const S53: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(1)}>
        <PartIntro
          index={3}
          title="Test de Feynman"
          start={0}
          perQuestion="5 points par explication"
        />
      </Stage>
      <Stage from={cues.s(1)} to={cues.s(5)}>
        <PartTag index={3} start={cues.s(1)} />
      </Stage>
      <Stage from={cues.s(1)} to={cues.s(2)}>
        <Prompt />
      </Stage>
      <Stage from={cues.s(2)} to={cues.s(5)}>
        <Audiences />
      </Stage>
      <Stage from={cues.s(5)} to={cues.s(7)}>
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
