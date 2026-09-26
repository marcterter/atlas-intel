import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Box, Icon, Svg, SvgText } from "../components/kit";
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
import { CmosInv, MosfetCut } from "./S45";

// ——— Briques communes aux scènes du test (S49 à S53) ———

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
              fontFamily={FONT}
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
  points?: number;
}> = ({ index, title, start, kicker, perQuestion, points }) => {
  const p = PARTS[index];
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 190,
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
            <Counter
              to={points ?? p.points}
              start={start + 22}
              duration={1.2}
            />
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
export const PartTag: React.FC<{
  index: number;
  start: number;
  text?: string;
}> = ({ index, start, text }) => {
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
        {text ??
          `PARTIE ${p.letter} · ${p.name.toUpperCase()} · ${p.points} POINTS`}
      </div>
    </FadeIn>
  );
};

// Carte question : identifiant, barème, énoncé. Jamais de réponse.
export const QuestionCard: React.FC<{
  id: string;
  points: number;
  start: number;
  top?: number;
  size?: number;
  children: React.ReactNode;
}> = ({ id, points, start, top = 160, size = 40, children }) => {
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
          <div style={{ ...textStyle(80, 200), color: COLORS.accent }}>
            {id}
          </div>
        </FadeIn>
        <div
          style={{
            margin: "6px auto 0",
            height: 1.5,
            width: 200 * line,
            background: COLORS.inkFaint,
          }}
        />
        <FadeIn start={start + 8}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.warm,
              letterSpacing: "0.3em",
              marginTop: 12,
            }}
          >
            {points} POINTS
          </div>
        </FadeIn>
        <div
          style={{ ...textStyle(size, 300), lineHeight: 1.35, marginTop: 26 }}
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
}> = ({ ids, starts, y = 826 }) => {
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
              margin: "6px auto 0",
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

// Point d'interrogation qui apparaît en fondu.
export const Ask: React.FC<{
  x: number;
  y: number;
  start: number;
  size?: number;
}> = ({ x, y, start, size = 44 }) => (
  <SvgText
    x={x}
    y={y}
    text="?"
    start={start}
    size={size}
    weight={300}
    color={COLORS.warm}
  />
);

// Espace insécable avant « ? », « ! », « : », « ; ».
export const nb = (t: string) => t.replace(/ ([?!:;])/g, "\u00a0$1");

// ——— Schémas évocateurs (sans réponse) ———

// A1 : trois matériaux, lequel fait un bon interrupteur ?
const A1Visual: React.FC<{ start: number }> = ({ start }) => {
  const mats = ["Métal", "Semi-conducteur", "Isolant"];
  return (
    <Svg>
      {mats.map((m, i) => (
        <Box
          key={m}
          x={430 + i * 380}
          y={590}
          w={300}
          h={90}
          label={m}
          start={start + i * 8}
          size={28}
          variant={i === 1 ? "hi" : "muted"}
        />
      ))}
      {/* Interrupteur ouvert sous le semi-conducteur */}
      <DrawPath
        d="M 880 750 H 930 L 990 722 M 1000 750 H 1040"
        start={start + 30}
        duration={0.7}
        stroke={COLORS.accent}
      />
      <circle cx={930} cy={750} r={4} fill={COLORS.accent} />
      <circle cx={1000} cy={750} r={4} fill={COLORS.accent} />
      <SvgText
        x={1070}
        y={750}
        text="interrupteur ?"
        start={start + 36}
        size={24}
        anchor="start"
        color={COLORS.warm}
      />
    </Svg>
  );
};

// A2 : deux réseaux dopés, et la question de la charge globale.
const MiniLattice: React.FC<{
  cx: number;
  cy: number;
  dopant: string;
  color: string;
  start: number;
}> = ({ cx, cy, dopant, color, start }) => {
  const frame = useCurrentFrame();
  const o = progress(frame, start, 0.6);
  const pts = [-1, 0, 1].flatMap((r) => [-1, 0, 1].map((c) => [c, r]));
  return (
    <g opacity={o}>
      {pts.map(([c, r]) => {
        const center = c === 0 && r === 0;
        return (
          <g key={`${c}${r}`}>
            <circle
              cx={cx + c * 64}
              cy={cy + r * 56}
              r={22}
              fill="none"
              stroke={center ? color : COLORS.inkSoft}
              strokeWidth={center ? 2 : 1.2}
            />
            <text
              x={cx + c * 64}
              y={cy + r * 56 + 8}
              textAnchor="middle"
              fontFamily={FONT}
              fontSize={22}
              fill={center ? color : COLORS.ink}
            >
              {center ? dopant : "Si"}
            </text>
          </g>
        );
      })}
    </g>
  );
};

const A2Visual: React.FC<{ start: number }> = ({ start }) => (
  <Svg>
    <MiniLattice
      cx={760}
      cy={660}
      dopant="P"
      color={COLORS.accent}
      start={start}
    />
    <MiniLattice
      cx={1160}
      cy={660}
      dopant="B"
      color={COLORS.warm}
      start={start + 10}
    />
    <SvgText
      x={760}
      y={560}
      text="type n"
      start={start + 4}
      size={28}
      color={COLORS.accent}
    />
    <SvgText
      x={1160}
      y={560}
      text="type p"
      start={start + 14}
      size={28}
      color={COLORS.warm}
    />
    <SvgText
      x={900}
      y={768}
      text="charge globale ?"
      start={start + 4.5 * 30}
      size={26}
      color={COLORS.warm}
    />
  </Svg>
);

// A3 : coupe de MOSFET, rôle de chaque élément.
const A3Visual: React.FC<{ start: number }> = ({ start }) => (
  <Svg>
    <g transform="translate(960 680) scale(0.7)">
      <MosfetCut start={start} cx={0} top={-138} labels={false} flow={false} />
    </g>
    <SvgText x={960} y={566} text="grille" start={start + 20} size={24} />
    <SvgText
      x={1250}
      y={641}
      text="isolant"
      start={start + 22}
      size={24}
      anchor="start"
      color={COLORS.warm}
    />
    <SvgText
      x={690}
      y={690}
      text="source"
      start={start + 22}
      size={24}
      anchor="end"
      color={COLORS.accent}
    />
    <SvgText
      x={1250}
      y={692}
      text="drain"
      start={start + 22}
      size={24}
      anchor="start"
      color={COLORS.accent}
    />
    <Ask x={960} y={718} start={start + 5.6 * 30} size={36} />
  </Svg>
);

// A4 : inverseur CMOS, entrée haute ; sorties à trouver.
const A4Visual: React.FC<{ start: number }> = ({ start }) => (
  <Svg>
    <g transform="translate(960 670) scale(0.75)">
      <CmosInv start={start} cx={0} cy={0} labels={false} />
    </g>
    <SvgText
      x={770}
      y={670}
      text="entrée haute"
      start={start + 20}
      size={24}
      anchor="end"
      color={COLORS.accent}
    />
    <SvgText
      x={1150}
      y={670}
      text="sortie ?"
      start={start + 26}
      size={24}
      anchor="start"
      color={COLORS.warm}
    />
    <SvgText
      x={1010}
      y={617}
      text="PMOS ?"
      start={start + 30}
      size={24}
      anchor="start"
      color={COLORS.warm}
    />
    <SvgText
      x={1010}
      y={722}
      text="NMOS ?"
      start={start + 30}
      size={24}
      anchor="start"
      color={COLORS.warm}
    />
    <SvgText
      x={1010}
      y={557}
      text="VDD"
      start={start + 14}
      size={22}
      anchor="start"
      color={COLORS.inkSoft}
    />
  </Svg>
);

// A5 : deux notions côte à côte.
const A5Visual: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const shrink = progress(frame, start + 20, 1.2);
  const s = 110 - 32 * shrink;
  return (
    <Svg>
      <DrawPath
        d="M 600 740 L 820 580"
        start={start}
        duration={1}
        stroke={COLORS.accent}
        width={2.5}
      />
      <DrawPath
        d="M 580 750 H 840 M 580 750 V 560"
        start={start}
        duration={0.6}
        stroke={COLORS.inkSoft}
        width={1.4}
      />
      <SvgText
        x={710}
        y={780}
        text="Loi de Moore"
        start={start + 6}
        size={26}
        color={COLORS.accent}
      />
      <path
        d={roundRectPath(1240 - s / 2, 660 - s / 2, s, s, 4)}
        fill="none"
        stroke={COLORS.warm}
        strokeWidth={2}
        opacity={progress(frame, start + 10, 0.5)}
      />
      <SvgText
        x={1240}
        y={780}
        text="Scaling de Dennard"
        start={start + 14}
        size={26}
        color={COLORS.warm}
      />
      <SvgText
        x={960}
        y={660}
        text="≠ ?"
        start={start + 30}
        size={44}
        weight={200}
        color={COLORS.ink}
      />
    </Svg>
  );
};

// ——— Scène 49 ———

const QUESTIONS: {
  id: string;
  s: number[];
  text: string[];
  Visual: React.FC<{ start: number }>;
}[] = [
  {
    id: "A1",
    s: [4, 5],
    text: [
      "Pourquoi un semi-conducteur est-il utile pour fabriquer un interrupteur électronique ?",
      "Distingue sa fonction de celle d’un métal et d’un isolant.",
    ],
    Visual: A1Visual,
  },
  {
    id: "A2",
    s: [6, 7],
    text: [
      "Explique le dopage de type n et de type p.",
      "Pourquoi un matériau de type n n’est-il pas globalement chargé négativement ?",
    ],
    Visual: A2Visual,
  },
  {
    id: "A3",
    s: [8, 9],
    text: [
      "À quoi servent la grille, l’isolant, la source et le drain d’un MOSFET ?",
      "D’où viennent les électrons qui traversent le canal ?",
    ],
    Visual: A3Visual,
  },
  {
    id: "A4",
    s: [10],
    text: [
      "Dans un inverseur CMOS, que deviennent le NMOS, le PMOS et la sortie lorsque l’entrée est haute ?",
    ],
    Visual: A4Visual,
  },
  {
    id: "A5",
    s: [11, 12],
    text: [
      "Quelle différence fais-tu entre loi de Moore et scaling de Dennard ?",
      "Donne une chose que chacune ne garantit pas.",
    ],
    Visual: A5Visual,
  },
];

// Consigne : première tentative sans le cours ; définition + mécanisme.
const Instructions: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <PartTag index={0} start={cues.s(2)} />
      <Svg>
        <Icon
          name="pencil"
          x={960}
          y={250}
          size={36}
          start={cues.s(2)}
          color={COLORS.accent}
        />
      </Svg>
      <FadeIn
        start={cues.s(2, 0.3)}
        style={{
          position: "absolute",
          top: 330,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(40, 300)}>
          Première tentative :{" "}
          <span style={{ color: COLORS.accent }}>sans regarder le cours</span>
        </div>
      </FadeIn>
      <Svg>
        <Box
          x={300}
          y={540}
          w={600}
          h={130}
          label="Définition courte + mécanisme"
          start={cues.s(3, 0.4)}
          size={32}
          variant="hi"
        />
        <SvgText
          x={960}
          y={605}
          text="›"
          start={cues.s(3, 1.4)}
          size={80}
          weight={200}
          color={COLORS.accent}
        />
        <Box
          x={1020}
          y={540}
          w={600}
          h={130}
          label="Mot technique isolé"
          start={cues.s(3, 2)}
          size={32}
          variant="muted"
        />
      </Svg>
      <FadeIn
        start={cues.s(3, 2.6)}
        style={{
          position: "absolute",
          top: 720,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300), color: COLORS.inkSoft }}>
          une réponse courte qui explique vaut mieux qu’un terme savant
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

export const S49: React.FC = () => {
  const cues = useCues();
  const qStarts = QUESTIONS.map((q) => cues.s(q.s[0]));
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(2)}>
        <PartIntro
          index={0}
          title="Compréhension"
          kicker="Le test"
          start={0}
          perQuestion="5 points par question"
        />
      </Stage>
      <Stage from={cues.s(2)} to={cues.s(4)}>
        <Instructions />
      </Stage>
      {QUESTIONS.map((q, i) => (
        <Stage key={q.id} from={qStarts[i]} to={qStarts[i + 1]}>
          <QuestionCard id={q.id} points={5} start={qStarts[i]}>
            {q.text.map((t, k) => (
              <React.Fragment key={k}>
                <Reveal start={cues.s(q.s[k])}>{nb(t)}</Reveal>{" "}
              </React.Fragment>
            ))}
          </QuestionCard>
          <q.Visual start={cues.s(q.s[0], 1.2)} />
        </Stage>
      ))}
      <Stage from={cues.s(4)}>
        <PartTag index={0} start={cues.s(4)} />
        <QuestionDots ids={QUESTIONS.map((q) => q.id)} starts={qStarts} />
      </Stage>
    </AbsoluteFill>
  );
};
