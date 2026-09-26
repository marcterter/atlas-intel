import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { IconName, icons, roundRectPath } from "../components/icons";
import { Icon, Svg, SvgText, Title } from "../components/kit";
import {
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

type Flow = {
  name: string;
  icon: IconName;
  steps: string[];
  q: string;
  color: string;
  kind: "box" | "dot" | "euro";
};
const FLOWS: Flow[] = [
  {
    name: "Objets physiques",
    icon: "stack",
    steps: ["Matériaux", "Puces", "Systèmes", "Installation"],
    q: "Qu’est-ce qui peut effectivement être livré ?",
    color: COLORS.ink,
    kind: "box",
  },
  {
    name: "Données",
    icon: "memory",
    steps: ["Stockage", "Mémoire", "Processeurs", "Réseau"],
    q: "Qu’est-ce qui limite le travail utile ?",
    color: COLORS.accent,
    kind: "dot",
  },
  {
    name: "Argent",
    icon: "euro",
    steps: ["Clients", "Services IA", "Infrastructures", "Fournisseurs"],
    q: "Qui facture quoi, quand et avec quelle marge ?",
    color: COLORS.warm,
    kind: "euro",
  },
];
const LY = (i: number) => 280 + i * 200;
const SX = (j: number) => 640 + j * 330;

const Lane: React.FC<{
  f: Flow;
  i: number;
  start: number;
  qStart: number;
  active: boolean;
}> = ({ f, i, start, qStart, active }) => {
  const frame = useCurrentFrame();
  const y = LY(i);
  const on = progress(frame, start + 40, 0.6);
  return (
    <g opacity={active ? 1 : 0.5}>
      <Icon
        name={f.icon}
        x={190}
        y={y}
        size={26}
        start={start}
        color={f.color}
      />
      <SvgText
        x={240}
        y={y}
        text={f.name}
        start={start + 4}
        size={32}
        anchor="start"
        color={f.color}
      />
      <DrawPath
        d={`M ${SX(0) - 80} ${y} H ${SX(3) + 80}`}
        start={start + 8}
        duration={1.2}
        stroke={COLORS.inkFaint}
        width={1.5}
      />
      {f.steps.map((s, j) => (
        <g key={s}>
          <rect
            x={SX(j) - 110}
            y={y - 26}
            width={220}
            height={52}
            rx={26}
            fill="#0a1a3d"
            opacity={progress(frame, start + 10 + j * 12, 0.4)}
          />
          <DrawPath
            d={roundRectPath(SX(j) - 110, y - 26, 220, 52, 26)}
            start={start + 10 + j * 12}
            duration={0.5}
            stroke={f.color}
            width={1.4}
          />
          <SvgText
            x={SX(j)}
            y={y}
            text={s}
            start={start + 14 + j * 12}
            size={24}
          />
        </g>
      ))}
      {new Array(6).fill(0).map((_, k) => {
        const ph = ((frame - start) / FPS / 4 + k / 6) % 1;
        const x = SX(0) - 80 + ph * (SX(3) - SX(0) + 160);
        const inPill = [0, 1, 2, 3].some((j) => Math.abs(x - SX(j)) < 116);
        if (inPill) return null;
        if (f.kind === "box")
          return (
            <rect
              key={k}
              x={x - 7}
              y={y - 7}
              width={14}
              height={14}
              fill="none"
              stroke={f.color}
              strokeWidth={1.6}
              opacity={on}
            />
          );
        if (f.kind === "dot")
          return (
            <circle key={k} cx={x} cy={y} r={5} fill={f.color} opacity={on} />
          );
        return (
          <path
            key={k}
            d={icons.euro(x, y, 9)}
            fill="none"
            stroke={f.color}
            strokeWidth={1.6}
            opacity={on}
          />
        );
      })}
      <SvgText
        x={SX(0) - 110}
        y={y + 62}
        text={f.q}
        start={qStart}
        size={26}
        anchor="start"
        color={COLORS.inkSoft}
      />
    </g>
  );
};

const Flows: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = [cues.s(2), cues.s(4), cues.s(6)];
  const qs = [cues.s(3), cues.s(5), cues.s(7)];
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), 0);
  return (
    <AbsoluteFill>
      <Title
        kicker="Trois flux traversent la chaîne"
        text="Les flux et les contraintes actuelles"
        start={cues.s(0)}
        top={110}
      />
      <Svg>
        {FLOWS.map((f, i) => (
          <Lane
            key={f.name}
            f={f}
            i={i}
            start={starts[i]}
            qStart={qs[i]}
            active={i === current || frame >= cues.s(7, 2)}
          />
        ))}
      </Svg>
    </AbsoluteFill>
  );
};

// Chaque couche encaisse et dépense à un moment différent.
const ROWS = [
  { t: "Un équipementier vend ses machines", x: 360, w: 320, at: 0 },
  {
    t: "Les puces fabriquées servent des utilisateurs",
    x: 820,
    w: 360,
    at: 3.5,
  },
  { t: "Un cloud paie ses serveurs", x: 560, w: 320, at: 0 },
  { t: "Assez de clients arrivent", x: 1180, w: 420, at: 2.5 },
];

const Timing: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const at = (i: number) =>
    i < 2 ? cues.s(8, ROWS[i].at) : cues.s(9, ROWS[i].at);
  return (
    <AbsoluteFill>
      <Title text="Longtemps avant…" start={cues.s(8)} top={110} />
      <Svg>
        <DrawPath
          d="M 300 790 H 1700"
          start={cues.s(8)}
          duration={1.2}
          stroke={COLORS.inkSoft}
          width={1.5}
        />
        <DrawPath
          d="M 1688 782 L 1700 790 L 1688 798"
          start={cues.s(8, 1)}
          duration={0.3}
          stroke={COLORS.inkSoft}
          width={1.5}
        />
        <SvgText
          x={1700}
          y={826}
          text="temps"
          start={cues.s(8, 1)}
          size={22}
          anchor="end"
          color={COLORS.inkSoft}
        />
        {ROWS.map((r, i) => {
          const y = 250 + i * 130 + (i >= 2 ? 20 : 0);
          const p = progress(frame, at(i), 0.9);
          const color = i % 2 === 0 ? COLORS.accent : COLORS.warm;
          return (
            <g key={r.t}>
              <rect
                x={r.x}
                y={y}
                width={r.w * p}
                height={34}
                rx={17}
                fill={color}
                opacity={0.35}
              />
              <SvgText
                x={r.x}
                y={y - 22}
                text={r.t}
                start={at(i)}
                size={26}
                anchor="start"
              />
              <DrawPath
                d={`M ${r.x} ${y + 40} V 790`}
                start={at(i) + 10}
                duration={0.6}
                stroke={COLORS.inkFaint}
                width={1}
              />
            </g>
          );
        })}
        <DrawPath
          d={`M 680 267 C 760 267, 760 397, 820 397`}
          start={cues.s(8, 4)}
          duration={0.8}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        <DrawPath
          d={`M 880 547 C 1000 547, 1080 677, 1180 677`}
          start={cues.s(9, 3)}
          duration={0.8}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
      </Svg>
      <FadeIn
        start={cues.s(10)}
        style={{
          position: "absolute",
          top: 836,
          left: 300,
          width: 1300,
          textAlign: "left",
        }}
      >
        <div style={{ ...textStyle(28, 300), color: COLORS.warm }}>
          Les bénéfices n’arrivent pas au même moment dans chaque couche.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Double comptage : la valeur des composants est déjà dans le prix du serveur.
const PARTS: IconName[] = ["chip", "memory", "network", "bolt"];

const DoubleCount: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t12 = cues.s(12);
  const t13 = cues.s(13);
  const b1 = progress(frame, t12 + 40, 1);
  const b2 = progress(frame, t13 + 20, 1);
  const sum = progress(frame, t13 + 70, 1);
  const bx = 900;
  return (
    <AbsoluteFill>
      <Title
        kicker="Attention"
        text="Le double comptage"
        start={cues.s(11)}
        top={110}
      />
      <Svg>
        <DrawPath
          d={roundRectPath(240, 300, 460, 400, 16)}
          start={t12}
          duration={0.9}
          stroke={COLORS.ink}
        />
        <SvgText
          x={470}
          y={740}
          text="prix d’un serveur"
          start={t12 + 10}
          size={26}
        />
        {PARTS.map((p, i) => {
          const cx = 360 + (i % 2) * 220;
          const cy = 410 + Math.floor(i / 2) * 180;
          return (
            <g key={p}>
              <DrawPath
                d={roundRectPath(cx - 80, cy - 60, 160, 120, 10)}
                start={t12 + 20 + i * 8}
                duration={0.5}
                stroke={COLORS.inkSoft}
                width={1.4}
              />
              <Icon
                name={p}
                x={cx}
                y={cy}
                size={30}
                start={t12 + 26 + i * 8}
                color={COLORS.accent}
              />
            </g>
          );
        })}
        {/* Marchés */}
        <SvgText
          x={bx}
          y={330}
          text="MARCHÉ DES SERVEURS"
          start={t12 + 40}
          size={22}
          weight={500}
          anchor="start"
          spacing="0.24em"
          color={COLORS.inkSoft}
        />
        <rect
          x={bx}
          y={350}
          width={480 * b1}
          height={40}
          rx={6}
          fill={COLORS.accent}
          opacity={0.45}
        />
        <rect
          x={bx}
          y={350}
          width={300 * b2}
          height={40}
          rx={6}
          fill="none"
          stroke={COLORS.warm}
          strokeWidth={2}
          strokeDasharray="6 6"
        />
        <SvgText
          x={bx + 150}
          y={420}
          text="dont composants"
          start={t13 + 30}
          size={22}
          color={COLORS.warm}
        />
        <SvgText
          x={bx}
          y={480}
          text="MARCHÉ DES COMPOSANTS"
          start={t13}
          size={22}
          weight={500}
          anchor="start"
          spacing="0.24em"
          color={COLORS.inkSoft}
        />
        <rect
          x={bx}
          y={500}
          width={300 * b2}
          height={40}
          rx={6}
          fill={COLORS.warm}
          opacity={0.45}
        />
        <SvgText
          x={bx}
          y={600}
          text="SOMME"
          start={t13 + 60}
          size={22}
          weight={500}
          anchor="start"
          spacing="0.24em"
          color={COLORS.inkSoft}
        />
        <rect
          x={bx}
          y={620}
          width={480 * sum}
          height={40}
          rx={6}
          fill={COLORS.accent}
          opacity={0.3}
        />
        <rect
          x={bx + 480}
          y={620}
          width={300 * sum}
          height={40}
          rx={6}
          fill={COLORS.warm}
          opacity={0.3}
        />
        <DrawPath
          d={icons.cross(bx + 390, 640, 30)}
          start={t13 + 110}
          duration={0.5}
          stroke={COLORS.warm}
          width={3}
        />
      </Svg>
      <FadeIn
        start={t12}
        style={{ position: "absolute", left: 240, top: 790, width: 700 }}
      >
        <div style={{ ...textStyle(28, 300) }}>
          Le prix d’un serveur inclut la valeur de plusieurs composants.
        </div>
      </FadeIn>
      <FadeIn
        start={t13 + 110}
        style={{ position: "absolute", left: bx, top: 690, width: 880 }}
      >
        <div
          style={{
            ...textStyle(28, 300),
            color: COLORS.warm,
            lineHeight: 1.35,
          }}
        >
          ≠ une dépense finale indépendante
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(11)}
        style={{ position: "absolute", left: bx, top: 250, width: 880 }}
      >
        <div style={label(COLORS.warm)}>ADDITIONNER LES DEUX MARCHÉS ?</div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 25 — Les trois flux, les décalages dans le temps, le double comptage.
export const S25: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(8)}>
        <Flows />
      </Stage>
      <Stage from={cues.s(8)} to={cues.s(11)}>
        <Timing />
      </Stage>
      <Stage from={cues.s(11)}>
        <DoubleCount />
      </Stage>
    </AbsoluteFill>
  );
};
