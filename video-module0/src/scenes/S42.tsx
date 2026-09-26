import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Bullets, Icon, Svg } from "../components/kit";
import {
  Counter,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

// ——— Briques communes aux scènes du test (S42 à S45) ———

export const PARTS = [
  { letter: "A", name: "Compréhension", points: 25 },
  { letter: "B", name: "Raisonnement", points: 30 },
  { letter: "C", name: "Application analyste", points: 30 },
  { letter: "D", name: "Feynman", points: 15 },
];

// Barre de 100 points découpée en quatre parties ; la partie courante se remplit.
export const ScoreBar: React.FC<{
  current: number;
  start: number;
  y?: number;
  showAll?: boolean;
  fillStarts?: number[];
}> = ({ current, start, y = 520, showAll = false, fillStarts }) => {
  const frame = useCurrentFrame();
  const x0 = 360;
  const scale = 12;
  let acc = 0;
  return (
    <Svg>
      {PARTS.map((p, i) => {
        const x = x0 + acc * scale;
        acc += p.points;
        const w = p.points * scale;
        const appear = progress(frame, start + i * 4, 0.5);
        const fill =
          i === current || showAll
            ? progress(
                frame,
                fillStarts
                  ? fillStarts[i]
                  : start + 12 + (showAll ? i * 20 : 0),
                1.2,
              )
            : i < current
              ? 1
              : 0;
        const on = i === current || showAll;
        const color = on ? COLORS.accent : COLORS.inkSoft;
        return (
          <g key={p.letter} opacity={appear}>
            <rect
              x={x + 3}
              y={y}
              width={w - 6}
              height={26}
              rx={6}
              fill="none"
              stroke={on ? COLORS.accent : COLORS.inkFaint}
              strokeWidth={1.5}
            />
            <rect
              x={x + 3}
              y={y}
              width={Math.max(0, (w - 6) * fill)}
              height={26}
              rx={6}
              fill={color}
              opacity={on ? 0.55 : 0.18}
            />
            <text
              x={x + w / 2}
              y={y + 66}
              textAnchor="middle"
              fontFamily="Inter Variable, Inter, sans-serif"
              fontSize={24}
              fontWeight={on ? 500 : 300}
              letterSpacing="0.12em"
              fill={on ? COLORS.accent : COLORS.inkSoft}
            >
              {p.letter} · {p.points}
            </text>
          </g>
        );
      })}
    </Svg>
  );
};

// Ouverture d'une partie : lettre, intitulé, points qui s'incrémentent, barre de score.
export const PartIntro: React.FC<{
  index: number;
  title: string;
  start: number;
  kicker?: string;
  perQuestion: string;
}> = ({ index, title, start, kicker, perQuestion }) => {
  const p = PARTS[index];
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 200,
          width: "100%",
          textAlign: "center",
        }}
      >
        {kicker && (
          <FadeIn start={start}>
            <div
              style={{
                ...textStyle(24, 500),
                color: COLORS.warm,
                letterSpacing: "0.3em",
                marginBottom: 18,
              }}
            >
              {kicker.toUpperCase()}
            </div>
          </FadeIn>
        )}
        <FadeIn start={start + 4}>
          <div style={textStyle(60, 200)}>
            Partie {p.letter} <span style={{ color: COLORS.inkSoft }}>·</span>{" "}
            {title}
          </div>
        </FadeIn>
      </div>
      <ScoreBar current={index} start={start + 10} y={420} />
      <div
        style={{
          position: "absolute",
          top: 560,
          width: "100%",
          textAlign: "center",
        }}
      >
        <FadeIn start={start + 20}>
          <div style={{ ...textStyle(110, 200), color: COLORS.accent }}>
            <Counter to={p.points} start={start + 22} duration={1.2} />
            <span style={{ fontSize: 44, color: COLORS.inkSoft }}> points</span>
          </div>
        </FadeIn>
        <FadeIn start={start + 40}>
          <div style={{ ...textStyle(30, 300), color: COLORS.ink }}>
            {perQuestion}
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// Rappel discret de la partie en cours, en haut.
export const PartTag: React.FC<{ index: number; start: number }> = ({
  index,
  start,
}) => {
  const p = PARTS[index];
  return (
    <FadeIn
      start={start}
      style={{
        position: "absolute",
        top: 110,
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
        PARTIE {p.letter} · {p.name.toUpperCase()} · {p.points} POINTS
      </div>
    </FadeIn>
  );
};

// Carte question : identifiant, barème, énoncé. Pas de réponse.
export const QuestionCard: React.FC<{
  id: string;
  points: number;
  start: number;
  top?: number;
  size?: number;
  children: React.ReactNode;
}> = ({ id, points, start, top = 250, size = 50, children }) => {
  const frame = useCurrentFrame();
  const line = progress(frame, start + 6, 0.8);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top,
          left: 200,
          width: 1520,
          textAlign: "center",
        }}
      >
        <FadeIn start={start}>
          <div style={{ ...textStyle(96, 200), color: COLORS.accent }}>
            {id}
          </div>
        </FadeIn>
        <div
          style={{
            margin: "8px auto 0",
            height: 1.5,
            width: 220 * line,
            background: COLORS.inkFaint,
          }}
        />
        <FadeIn start={start + 8}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.warm,
              letterSpacing: "0.3em",
              marginTop: 14,
            }}
          >
            {points} POINTS
          </div>
        </FadeIn>
        <div
          style={{
            ...textStyle(size, 300),
            lineHeight: 1.35,
            marginTop: 40,
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Repères des questions de la partie (en bas de la zone utile).
export const QuestionDots: React.FC<{
  ids: string[];
  starts: number[];
  y?: number;
}> = ({ ids, starts, y = 830 }) => {
  const frame = useCurrentFrame();
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  const gap = 130;
  const x0 = 960 - ((ids.length - 1) * gap) / 2;
  const appear = progress(frame, starts[0], 0.6);
  return (
    <div style={{ opacity: appear }}>
      {ids.map((id, i) => (
        <div
          key={id}
          style={{
            position: "absolute",
            top: y,
            left: x0 + i * gap - 50,
            width: 100,
            textAlign: "center",
            ...textStyle(24, i === current ? 500 : 300),
            letterSpacing: "0.1em",
            color:
              i === current
                ? COLORS.accent
                : i < current
                  ? COLORS.inkSoft
                  : COLORS.inkFaint,
          }}
        >
          {id}
          <div
            style={{
              margin: "8px auto 0",
              width: i === current ? 40 : 14,
              height: 2,
              background: i === current ? COLORS.accent : COLORS.inkFaint,
            }}
          />
        </div>
      ))}
    </div>
  );
};

// Texte qui apparaît en fondu à un instant donné (dans le flux).
export const Reveal: React.FC<{
  start: number;
  children: React.ReactNode;
  color?: string;
}> = ({ start, children, color }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [start, start + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <span style={{ opacity: o, color }}>{children}</span>;
};

// ——— Scène 42 — Partie A : test de compréhension ———

const QUESTIONS: { id: string; s: number; text: React.ReactNode }[] = [
  {
    id: "A1",
    s: 5,
    text: "Quelle différence fais-tu entre NVIDIA, TSMC et ASML dans la fabrication d’un système IA ?",
  },
  {
    id: "A2",
    s: 7,
    text: "Explique la différence entre capacité mémoire et bande passante mémoire.",
  },
  {
    id: "A3",
    s: 9,
    text: "Distingue un die, un substrat de boîtier et un PCB.",
  },
  {
    id: "A4",
    s: 11,
    text: "Quelle différence y a-t-il entre entraînement et inférence ?",
  },
];

export const S42: React.FC = () => {
  const cues = useCues();
  const qStarts = [5, 7, 9, 11, 13].map((i) => cues.s(i));
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(2)}>
        <PartIntro
          index={0}
          title="Test de compréhension"
          kicker="Le test commence"
          start={0}
          perQuestion="5 points par question"
        />
      </Stage>
      <Stage from={cues.s(2)} to={cues.s(5)}>
        <PartTag index={0} start={cues.s(2)} />
        <Svg>
          <Icon
            name="pencil"
            x={960}
            y={330}
            size={40}
            start={cues.s(2)}
            color={COLORS.accent}
          />
        </Svg>
        <Bullets
          top={450}
          left={420}
          width={1200}
          size={36}
          dimPast={false}
          starts={[cues.s(2), cues.s(3), cues.s(4)]}
          items={[
            "Première tentative sans regarder le cours",
            "Si tu bloques, écris ton raisonnement et ce qui te manque",
            <span key="w" style={{ color: COLORS.warm }}>
              Aucun corrigé n’est inclus
            </span>,
          ]}
        />
      </Stage>
      {QUESTIONS.map((q, i) => (
        <Stage key={q.id} from={cues.s(q.s)} to={qStarts[i + 1]}>
          <QuestionCard id={q.id} points={5} start={cues.s(q.s)}>
            <Reveal start={cues.s(q.s + 1)}>{q.text}</Reveal>
          </QuestionCard>
        </Stage>
      ))}
      <Stage from={cues.s(13)}>
        <QuestionCard id="A5" points={5} start={cues.s(13)}>
          <Reveal start={cues.s(14)}>
            Un développeur annonce un data center de{" "}
            <span style={{ color: COLORS.warm }}>
              <Counter to={200} start={cues.s(14, 0.4)} duration={1.6} /> MW
            </span>
            .
          </Reveal>{" "}
          <Reveal start={cues.s(15)}>
            Pourquoi cela ne suffit-il pas à connaître sa production de tokens
            ou ses revenus ?
          </Reveal>
        </QuestionCard>
      </Stage>
      <Stage from={cues.s(5)}>
        <PartTag index={0} start={cues.s(5)} />
        <QuestionDots ids={["A1", "A2", "A3", "A4", "A5"]} starts={qStarts} />
      </Stage>
    </AbsoluteFill>
  );
};
