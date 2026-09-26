import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { circlePath, roundRectPath } from "../components/icons";
import { FlowChain, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT } from "../theme";

export type GateKind = "NON" | "ET" | "OU" | "NAND";

// Contour d'une porte, centrée sur (x, y), de largeur 2·s.
export const gateBody = (kind: GateKind, x: number, y: number, s: number) => {
  const h = s * 0.8;
  const r = s * 0.14;
  if (kind === "NON") {
    const tip = x + s - 2 * r;
    return `M ${x - s} ${y - h} L ${tip} ${y} L ${x - s} ${y + h} Z ${circlePath(tip + r, y, r)}`;
  }
  if (kind === "OU") {
    return `M ${x - s} ${y - h} Q ${x - s * 0.5} ${y} ${x - s} ${y + h} Q ${x + s * 0.3} ${y + h} ${x + s} ${y} Q ${x + s * 0.3} ${y - h} ${x - s} ${y - h} Z`;
  }
  const end = kind === "NAND" ? x + s - 2 * r : x + s;
  const body = `M ${x - s} ${y - h} H ${end - h} A ${h} ${h} 0 0 1 ${end - h} ${y + h} H ${x - s} Z`;
  return kind === "NAND" ? `${body} ${circlePath(end + r, y, r)}` : body;
};

// Porte complète : corps, fils d'entrée et de sortie.
export const Gate: React.FC<{
  kind: GateKind;
  x: number;
  y: number;
  s: number;
  start: number;
  color?: string;
  lead?: number;
}> = ({ kind, x, y, s, start, color = COLORS.ink, lead = 50 }) => {
  const h = s * 0.8;
  const ins = kind === "NON" ? [y] : [y - h * 0.5, y + h * 0.5];
  const inX = kind === "OU" ? x - s + s * 0.2 : x - s;
  const leads = [
    ...ins.map((yy) => `M ${inX - lead} ${yy} H ${inX}`),
    `M ${x + s} ${y} H ${x + s + lead}`,
  ].join(" ");
  return (
    <g>
      <DrawPath
        d={gateBody(kind, x, y, s)}
        start={start}
        duration={0.8}
        stroke={color}
      />
      <DrawPath
        d={leads}
        start={start + 10}
        duration={0.5}
        stroke={COLORS.inkSoft}
      />
    </g>
  );
};

// Beat 0 : une porte générique.
const Generic: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const seq = [
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
  ];
  const k = Math.max(0, Math.floor((frame - t - 40) / 30)) % seq.length;
  const [a, b] = seq[k];
  const out = a & b ? 0 : 1;
  const show = frame > t + 40;
  const bit = (x: number, y: number, v: number) => (
    <text
      x={x}
      y={y + 14}
      textAnchor="middle"
      fontFamily={FONT}
      fontSize={40}
      fontWeight={300}
      fill={v ? COLORS.accent : COLORS.inkSoft}
    >
      {v}
    </text>
  );
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={roundRectPath(810, 400, 300, 220, 16)}
          start={t}
          duration={0.8}
        />
        <SvgText
          x={960}
          y={510}
          text={"porte\nlogique"}
          start={t + 10}
          size={32}
        />
        <DrawPath
          d="M 600 460 H 810 M 600 560 H 810 M 1110 510 H 1320"
          start={t + 14}
          duration={0.7}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={560}
          y={460}
          text="A"
          start={t + 20}
          size={30}
          anchor="end"
        />
        <SvgText
          x={560}
          y={560}
          text="B"
          start={t + 20}
          size={30}
          anchor="end"
        />
        <SvgText
          x={1360}
          y={510}
          text="sortie"
          start={t + 24}
          size={30}
          anchor="start"
        />
        {show && (
          <g>
            {bit(700, 430, a)}
            {bit(700, 530, b)}
            {bit(1215, 480, out)}
          </g>
        )}
        <SvgText
          x={960}
          y={720}
          text="entrées binaires (0 ou 1)  →  une sortie binaire"
          start={t + 30}
          size={28}
          color={COLORS.inkSoft}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Beat 1 : quatre fonctions de base.
const GATES: { kind: GateKind; rule: string; n: number }[] = [
  { kind: "NON", rule: "inverse l’entrée", n: 2 },
  { kind: "ET", rule: "1 si A et B valent 1", n: 6 },
  { kind: "OU", rule: "1 si A ou B vaut 1", n: 6 },
  { kind: "NAND", rule: "NON-ET : 0 seulement\nsi A et B valent 1", n: 4 },
];

const Four: React.FC = () => {
  const cues = useCues();
  const t = cues.s(2);
  const XS = [370, 773, 1177, 1580];
  return (
    <AbsoluteFill>
      <Svg>
        {GATES.map((g, i) => {
          const s = t + i * 14;
          return (
            <g key={g.kind}>
              <Gate
                kind={g.kind}
                x={XS[i]}
                y={450}
                s={70}
                start={s}
                color={g.kind === "NAND" ? COLORS.accent : COLORS.ink}
              />
              <SvgText
                x={XS[i]}
                y={320}
                text={g.kind}
                start={s + 6}
                size={40}
                weight={300}
                color={g.kind === "NAND" ? COLORS.accent : COLORS.ink}
              />
              <SvgText
                x={XS[i]}
                y={600}
                text={g.rule}
                start={s + 16}
                size={26}
                color={COLORS.inkSoft}
              />
              <SvgText
                x={XS[i]}
                y={710}
                text={`${g.n} transistors`}
                start={cues.s(2, 2.5) + i * 6}
                size={24}
                weight={400}
                color={COLORS.warm}
              />
            </g>
          );
        })}
        <SvgText
          x={960}
          y={790}
          text="en logique CMOS statique classique"
          start={cues.s(2, 3)}
          size={22}
          color={COLORS.inkSoft}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Beat 2 : table de vérité NAND.
const ROWS = [
  [0, 0, 1],
  [0, 1, 1],
  [1, 0, 1],
  [1, 1, 0],
];

const Truth: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = [cues.s(4), cues.s(5), cues.s(6), cues.s(7)];
  const cur = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  const t = cues.beat(2);
  const row = cur >= 0 ? ROWS[cur] : null;
  const TX = 1060;
  const colX = [TX, TX + 200, TX + 420];
  const bit = (x: number, y: number, v: number, big = false) => (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontFamily={FONT}
      fontSize={big ? 44 : 34}
      fontWeight={300}
      fill={v ? COLORS.accent : COLORS.warm}
    >
      {v}
    </text>
  );
  return (
    <AbsoluteFill>
      <Svg>
        <Gate
          kind="NAND"
          x={560}
          y={480}
          s={120}
          start={t}
          color={COLORS.accent}
          lead={90}
        />
        <SvgText
          x={560}
          y={480}
          text="NAND"
          start={t + 10}
          size={30}
          weight={400}
        />
        <SvgText
          x={330}
          y={432}
          text="A"
          start={t + 10}
          size={28}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <SvgText
          x={330}
          y={528}
          text="B"
          start={t + 10}
          size={28}
          anchor="end"
          color={COLORS.inkSoft}
        />
        {row && (
          <g>
            {bit(385, 420, row[0], true)}
            {bit(385, 516, row[1], true)}
            {bit(830, 468, row[2], true)}
          </g>
        )}
        {/* Tableau */}
        {["A", "B", "Sortie"].map((h, j) => (
          <SvgText
            key={h}
            x={colX[j]}
            y={300}
            text={h}
            start={t + 10}
            size={28}
            weight={400}
            color={COLORS.inkSoft}
          />
        ))}
        <DrawPath
          d={`M ${TX - 80} 335 H ${TX + 520}`}
          start={t + 10}
          duration={0.8}
          stroke={COLORS.inkFaint}
          width={1.5}
        />
        {ROWS.map((r, i) => {
          const o = progress(frame, starts[i], 0.5);
          const y = 400 + i * 80;
          const active = i === cur;
          return (
            <g key={i} opacity={o * (active ? 1 : 0.55)}>
              {active && (
                <rect
                  x={TX - 80}
                  y={y - 48}
                  width={600}
                  height={70}
                  rx={10}
                  fill={COLORS.accent}
                  opacity={0.08}
                />
              )}
              {bit(colX[0], y, r[0])}
              {bit(colX[1], y, r[1])}
              {bit(colX[2], y, r[2])}
            </g>
          );
        })}
      </Svg>
      <FadeIn
        start={cues.s(3)}
        style={{ position: "absolute", left: 250, top: 680, width: 700 }}
      >
        <div style={{ ...textStyle(30, 300), lineHeight: 1.35 }}>
          Sortie <span style={{ color: COLORS.warm }}>0</span> seulement si A{" "}
          <span style={{ color: COLORS.accent }}>et</span> B valent 1
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Beat 3 : NAND suffit pour construire les autres fonctions.
const Universal: React.FC = () => {
  const cues = useCues();
  const t = cues.beat(3);
  const s = 42;
  return (
    <AbsoluteFill>
      <Svg>
        {/* NON = NAND aux entrées reliées */}
        <SvgText x={420} y={330} text="NON" start={t} size={36} weight={300} />
        <Gate
          kind="NAND"
          x={440}
          y={480}
          s={s}
          start={t + 6}
          color={COLORS.accent}
          lead={36}
        />
        <DrawPath
          d={`M 320 480 H 362 M 362 463 V 497`}
          start={t + 16}
          duration={0.5}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={420}
          y={640}
          text={"entrées reliées"}
          start={t + 20}
          size={24}
          color={COLORS.inkSoft}
        />
        {/* ET = NAND puis NON */}
        <SvgText
          x={960}
          y={330}
          text="ET"
          start={t + 12}
          size={36}
          weight={300}
        />
        <Gate
          kind="NAND"
          x={880}
          y={480}
          s={s}
          start={t + 18}
          color={COLORS.accent}
          lead={36}
        />
        <Gate
          kind="NAND"
          x={1050}
          y={480}
          s={s}
          start={t + 26}
          color={COLORS.accent}
          lead={36}
        />
        <DrawPath
          d={`M 958 480 H 972 M 972 463 V 497`}
          start={t + 30}
          duration={0.4}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={960}
          y={640}
          text={"NAND suivie d’un NON"}
          start={t + 32}
          size={24}
          color={COLORS.inkSoft}
        />
        {/* OU = NON sur chaque entrée puis NAND */}
        <SvgText
          x={1500}
          y={330}
          text="OU"
          start={t + 24}
          size={36}
          weight={300}
        />
        <Gate
          kind="NAND"
          x={1390}
          y={420}
          s={30}
          start={t + 30}
          color={COLORS.accent}
          lead={26}
        />
        <Gate
          kind="NAND"
          x={1390}
          y={540}
          s={30}
          start={t + 34}
          color={COLORS.accent}
          lead={26}
        />
        <Gate
          kind="NAND"
          x={1590}
          y={480}
          s={s}
          start={t + 40}
          color={COLORS.accent}
          lead={36}
        />
        <DrawPath
          d="M 1446 420 H 1490 V 463 H 1512 M 1446 540 H 1490 V 497 H 1512 M 1300 420 H 1334 M 1334 408 V 432 M 1300 540 H 1334 M 1334 528 V 552"
          start={t + 44}
          duration={0.6}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={1500}
          y={640}
          text={"entrées inversées\npuis NAND"}
          start={t + 46}
          size={24}
          color={COLORS.inkSoft}
        />
      </Svg>
      <FadeIn
        start={t + 50}
        style={{
          position: "absolute",
          top: 740,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300) }}>
          <span style={{ color: COLORS.accent }}>NAND</span> est universelle :
          toutes les fonctions logiques peuvent en être construites
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Beat 5 : une multiplication multi-bits, un réseau de cellules.
const Array8: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(5);
  const N = 8;
  const cell = 52;
  const x0 = 560 - (N * cell) / 2;
  const y0 = 250;
  return (
    <AbsoluteFill>
      <Svg>
        <SvgText
          x={560}
          y={210}
          text="MULTIPLICATION 8 BITS × 8 BITS"
          start={t}
          size={22}
          weight={500}
          spacing="0.2em"
          color={COLORS.inkSoft}
        />
        {new Array(N * N).fill(0).map((_, k) => {
          const i = k % N;
          const j = Math.floor(k / N);
          const o = progress(frame, t + 10 + (i + j) * 4, 0.4);
          const x = x0 + i * cell;
          const y = y0 + j * cell;
          return (
            <g key={k} opacity={o}>
              <rect
                x={x + 6}
                y={y + 6}
                width={cell - 12}
                height={cell - 12}
                rx={4}
                fill="none"
                stroke={COLORS.inkSoft}
                strokeWidth={1.2}
              />
              {[0, 1, 2, 3].map((d) => (
                <circle
                  key={d}
                  cx={x + 16 + (d % 2) * 20}
                  cy={y + 16 + Math.floor(d / 2) * 20}
                  r={2.6}
                  fill={COLORS.accent}
                  opacity={0.4 + 0.6 * random(`c${k}${d}`)}
                />
              ))}
              {i < N - 1 && (
                <path
                  d={`M ${x + cell - 6} ${y + cell / 2} H ${x + cell + 6}`}
                  stroke={COLORS.inkFaint}
                  strokeWidth={1.2}
                />
              )}
              {j < N - 1 && (
                <path
                  d={`M ${x + cell / 2} ${y + cell - 6} V ${y + cell + 6}`}
                  stroke={COLORS.inkFaint}
                  strokeWidth={1.2}
                />
              )}
            </g>
          );
        })}
        <SvgText
          x={560}
          y={y0 + N * cell + 40}
          text={
            "64 cellules, chacune faite de portes,\nelles-mêmes faites de transistors"
          }
          start={t + 60}
          size={24}
          color={COLORS.inkSoft}
        />
      </Svg>
      <FadeIn
        start={t + 40}
        style={{ position: "absolute", left: 1000, top: 290, width: 760 }}
      >
        <div style={{ ...textStyle(34, 300), lineHeight: 1.35 }}>
          Une opération sur des nombres de plusieurs bits mobilise{" "}
          <span style={{ color: COLORS.accent }}>beaucoup de transistors</span>{" "}
          et de connexions.
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(11)}
        style={{ position: "absolute", left: 1000, top: 540, width: 760 }}
      >
        <div
          style={{ borderLeft: `2px solid ${COLORS.warm}`, paddingLeft: 36 }}
        >
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.warm,
              letterSpacing: "0.3em",
            }}
          >
            ATTENTION
          </div>
          <div
            style={{ ...textStyle(32, 300), marginTop: 14, lineHeight: 1.35 }}
          >
            Un transistor seul ne réalise pas une opération IA complète.
          </div>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 15 — De la porte logique au processeur.
export const S15: React.FC = () => {
  const cues = useCues();
  const b4 = cues.beat(4);
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(1)}>
        <Title
          kicker="Des interrupteurs aux calculs"
          text="De la porte logique au processeur"
          start={cues.s(0)}
          top={100}
        />
        <Generic />
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(2)}>
        <Title text="Quatre fonctions de base" start={cues.beat(1)} top={110} />
        <Four />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(3)}>
        <Title
          kicker="Table de vérité"
          text="La fonction NAND"
          start={cues.beat(2)}
          top={100}
        />
        <Truth />
      </Stage>
      <Stage from={cues.beat(3)} to={b4}>
        <Title
          kicker="Tout à partir de NAND"
          text="Construire les autres fonctions"
          start={cues.beat(3)}
          top={100}
        />
        <Universal />
      </Stage>
      <Stage from={b4} to={cues.beat(5)}>
        <Title
          kicker="Assemblage"
          text="Des portes aux blocs de calcul"
          start={b4}
          top={100}
        />
        <FlowChain
          y={480}
          items={[
            "Portes logiques",
            "Additionneurs",
            "Multiplicateurs",
            "Circuits de commande",
          ]}
          starts={[b4 + 10, b4 + 60, b4 + 105, b4 + 150]}
          h={120}
          size={28}
        />
        <FadeIn
          start={b4 + 170}
          style={{
            position: "absolute",
            top: 640,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div style={{ ...textStyle(28, 300), color: COLORS.inkSoft }}>
            chaque niveau combine les blocs du niveau précédent
          </div>
        </FadeIn>
      </Stage>
      <Stage from={cues.beat(5)}>
        <Array8 />
      </Stage>
    </AbsoluteFill>
  );
};
