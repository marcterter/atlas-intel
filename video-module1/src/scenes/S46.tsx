import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { circlePath, icons, roundRectPath } from "../components/icons";
import { Arrow, DrawPath, progress, useCues } from "../components/motion";
import { COLORS, FONT, FPS } from "../theme";
import { GX, GlossDeck, GlossItem, Lbl, MosfetCut } from "./S45";

// Capacité : les armatures se chargent quand la tension monte ; Q = C × V.
const Capa: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const cx = 960;
  const cy = 590;
  const charge = progress(frame, start + 20, 2);
  const n = Math.round(charge * 5);
  return (
    <g>
      <DrawPath
        d={`M ${cx - 180} ${cy} H ${cx - 20} M ${cx - 20} ${cy - 90} V ${cy + 90} M ${cx + 20} ${cy - 90} V ${cy + 90} M ${cx + 20} ${cy} H ${cx + 180}`}
        start={start}
        duration={1}
        stroke={COLORS.ink}
      />
      {new Array(n).fill(0).map((_, i) => (
        <g key={i}>
          <text
            x={cx - 42}
            y={cy - 64 + i * 34}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={24}
            fill={COLORS.accent}
          >
            +
          </text>
          <text
            x={cx + 42}
            y={cy - 64 + i * 34}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={24}
            fill={COLORS.warm}
          >
            −
          </text>
        </g>
      ))}
      {/* Jauge de tension */}
      <DrawPath
        d={roundRectPath(1300, 470, 40, 240, 8)}
        start={start + 6}
        duration={0.6}
        stroke={COLORS.inkSoft}
        width={1.4}
      />
      <rect
        x={1304}
        y={706 - 232 * charge}
        width={32}
        height={232 * charge}
        rx={6}
        fill={COLORS.accent}
        opacity={0.45}
      />
      <Lbl x={1320} y={740} text="V" start={start + 8} color={COLORS.accent} />
      <Lbl
        x={1380}
        y={590}
        text="Q = C × V"
        start={start + 30}
        color={COLORS.ink}
        anchor="start"
        size={34}
      />
      <DrawPath
        d={circlePath(920, 780, 18) + ` M 920 780 V 768 M 920 780 H 930`}
        start={start + 2.8 * FPS}
        duration={0.5}
        stroke={COLORS.warm}
      />
      <Lbl
        x={950}
        y={780}
        text="du temps"
        start={start + 2.9 * FPS}
        color={COLORS.warm}
        anchor="start"
      />
      <DrawPath
        d={icons.bolt(1170, 780, 18)}
        start={start + 3.4 * FPS}
        duration={0.5}
        stroke={COLORS.warm}
      />
      <Lbl
        x={1200}
        y={780}
        text="de l’énergie"
        start={start + 3.5 * FPS}
        color={COLORS.warm}
        anchor="start"
      />
      <Lbl
        x={660}
        y={780}
        text="Commuter coûte :"
        start={start + 2.6 * FPS}
        anchor="start"
      />
    </g>
  );
};

// Fuite : transistor bloqué, un filet de courant subsiste.
const Leak: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const top = 520;
  const y = top + 90 + 12;
  const sx = GX - 270;
  const dx = GX + 270;
  const on = progress(frame, start + 1.4 * FPS, 0.8);
  const t = (frame - start) / FPS;
  return (
    <g>
      <MosfetCut start={start} top={top} flow={false} />
      {new Array(3).fill(0).map((_, i) => {
        const p = (t / 4 + i / 3) % 1;
        return (
          <circle
            key={i}
            cx={sx + p * (dx - sx)}
            cy={y}
            r={4}
            fill={COLORS.warm}
            opacity={on * Math.sin(Math.PI * p)}
          />
        );
      })}
      <Lbl
        x={GX}
        y={440}
        text="état bloqué : grille à 0"
        start={start + 0.8 * FPS}
        color={COLORS.ink}
      />
      <Lbl
        x={GX}
        y={top + 90 + 48}
        text="courant de fuite"
        start={start + 1.8 * FPS}
        color={COLORS.warm}
      />
    </g>
  );
};

// PPA : triangle de compromis ; un point de conception se déplace.
const Ppa: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const A: [number, number] = [GX, 470];
  const B: [number, number] = [GX - 300, 760];
  const C: [number, number] = [GX + 300, 760];
  const t = (frame - start) / FPS;
  const w = [
    1 + 0.6 * Math.sin(t * 0.9),
    1 + 0.6 * Math.sin(t * 0.9 + 2.1),
    1 + 0.6 * Math.sin(t * 0.9 + 4.2),
  ];
  const s = w[0] + w[1] + w[2];
  const px = (A[0] * w[0] + B[0] * w[1] + C[0] * w[2]) / s;
  const py = (A[1] * w[0] + B[1] * w[1] + C[1] * w[2]) / s;
  const on = progress(frame, start + 30, 0.6);
  return (
    <g>
      <DrawPath
        d={`M ${A[0]} ${A[1]} L ${C[0]} ${C[1]} L ${B[0]} ${B[1]} Z`}
        start={start}
        duration={1.2}
        stroke={COLORS.inkSoft}
      />
      {[A, B, C].map((v, i) => (
        <line
          key={i}
          x1={px}
          y1={py}
          x2={v[0]}
          y2={v[1]}
          stroke={COLORS.inkFaint}
          strokeDasharray="6 6"
          opacity={on}
        />
      ))}
      <circle cx={px} cy={py} r={10} fill={COLORS.accent} opacity={on} />
      <Lbl
        x={A[0]}
        y={A[1] - 34}
        text="Puissance · Power"
        start={start + 10}
        color={COLORS.warm}
        size={28}
      />
      <Lbl
        x={B[0] - 20}
        y={B[1] + 40}
        text="Performance"
        start={start + 16}
        color={COLORS.accent}
        size={28}
      />
      <Lbl
        x={C[0] + 20}
        y={C[1] + 40}
        text="Surface · Area"
        start={start + 22}
        color={COLORS.ink}
        size={28}
      />
    </g>
  );
};

// FinFET et GAA : la grille entoure de plus en plus le canal.
const Geometries: React.FC<{ start: number }> = ({ start }) => {
  const xs = [860, 1190, 1520];
  const base = 700;
  const at = (i: number) => start + i * 1.1 * FPS;
  const gate = COLORS.warm;
  return (
    <g>
      {xs.map((x, i) => (
        <DrawPath
          key={x}
          d={`M ${x - 130} ${base} H ${x + 130}`}
          start={at(i)}
          duration={0.5}
          stroke={COLORS.inkSoft}
        />
      ))}
      {/* Planaire : grille sur une seule face */}
      <path
        d={roundRectPath(xs[0] - 100, base - 40, 200, 40, 4)}
        fill={COLORS.accent}
        opacity={0.35 * 1}
      />
      <DrawPath
        d={roundRectPath(xs[0] - 100, base - 90, 200, 40, 4)}
        start={at(0) + 8}
        duration={0.6}
        stroke={gate}
      />
      {/* FinFET : la grille enveloppe trois faces de l'aileron */}
      <path
        d={roundRectPath(xs[1] - 25, base - 130, 50, 130, 4)}
        fill={COLORS.accent}
        opacity={0.35}
      />
      <DrawPath
        d={`M ${xs[1] - 70} ${base} V ${base - 160} H ${xs[1] + 70} V ${base} M ${xs[1] - 40} ${base} V ${base - 145} H ${xs[1] + 40} V ${base}`}
        start={at(1) + 8}
        duration={0.8}
        stroke={gate}
      />
      {/* GAA : nanofeuillets entièrement entourés */}
      {[0, 1, 2].map((k) => {
        const y = base - 50 - k * 55;
        return (
          <g key={k}>
            <path
              d={roundRectPath(xs[2] - 60, y, 120, 20, 3)}
              fill={COLORS.accent}
              opacity={0.35}
            />
            <DrawPath
              d={roundRectPath(xs[2] - 76, y - 14, 152, 48, 8)}
              start={at(2) + 8 + k * 4}
              duration={0.6}
              stroke={gate}
            />
          </g>
        );
      })}
      <Lbl
        x={xs[0]}
        y={base + 40}
        text="planaire"
        start={at(0) + 10}
        color={COLORS.ink}
        size={28}
      />
      <Lbl x={xs[0]} y={base + 78} text="grille : 1 face" start={at(0) + 14} />
      <Lbl
        x={xs[1]}
        y={base + 40}
        text="FinFET"
        start={at(1) + 10}
        color={COLORS.ink}
        size={28}
      />
      <Lbl x={xs[1]} y={base + 78} text="grille : 3 faces" start={at(1) + 14} />
      <Lbl
        x={xs[2]}
        y={base + 40}
        text="GAA"
        start={at(2) + 10}
        color={COLORS.ink}
        size={28}
      />
      <Lbl
        x={xs[2]}
        y={base + 78}
        text="grille tout autour"
        start={at(2) + 14}
      />
      <Lbl
        x={1640}
        y={470}
        text="grille"
        start={at(0) + 12}
        color={gate}
        anchor="end"
      />
      <Lbl
        x={1640}
        y={505}
        text="canal"
        start={at(0) + 12}
        color={COLORS.accent}
        anchor="end"
      />
    </g>
  );
};

// Moore : trajectoire d'intégration ; Dennard : modèle de miniaturisation.
const MooreDennard: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const ox = 720;
  const oy = 760;
  const shrink = progress(frame, start + 1.6 * FPS, 1.2);
  const big = 150;
  const small = big / 1.4;
  const s = big - (big - small) * shrink;
  const qx = 1420;
  const qy = 620;
  return (
    <g>
      <Arrow
        x1={ox}
        y1={oy}
        x2={ox + 380}
        y2={oy}
        start={start}
        stroke={COLORS.inkSoft}
      />
      <Arrow
        x1={ox}
        y1={oy}
        x2={ox}
        y2={oy - 280}
        start={start}
        stroke={COLORS.inkSoft}
      />
      <DrawPath
        d={`M ${ox + 20} ${oy - 30} L ${ox + 340} ${oy - 250}`}
        start={start + 10}
        duration={1.2}
        stroke={COLORS.accent}
        width={2.5}
      />
      {[0, 1, 2, 3, 4].map((i) => (
        <circle
          key={i}
          cx={ox + 40 + i * 70}
          cy={oy - 44 - i * 48}
          r={6}
          fill={COLORS.accent}
          opacity={progress(frame, start + 14 + i * 5, 0.3)}
        />
      ))}
      <Lbl
        x={ox + 380}
        y={oy + 34}
        text="temps"
        start={start + 6}
        anchor="end"
      />
      <Lbl
        x={ox + 16}
        y={oy - 290}
        text="transistors par puce (log)"
        start={start + 6}
        anchor="start"
      />
      <Lbl
        x={ox + 190}
        y={oy + 80}
        text="Moore : trajectoire d’intégration"
        start={start + 20}
        color={COLORS.accent}
        size={26}
      />
      {/* Dennard : même carré, dimensions et tension réduites ensemble */}
      <DrawPath
        d={roundRectPath(qx - big / 2, qy - big / 2, big, big, 4)}
        start={start + 0.6 * FPS}
        duration={0.6}
        stroke={COLORS.inkFaint}
      />
      <path
        d={roundRectPath(qx - s / 2, qy - s / 2, s, s, 4)}
        fill={COLORS.warm}
        fillOpacity={0.12}
        stroke={COLORS.warm}
        strokeWidth={2}
        opacity={progress(frame, start + 1.2 * FPS, 0.4)}
      />
      <Lbl
        x={qx}
        y={qy - 110}
        text="dimensions ÷ k · tension ÷ k"
        start={start + 1.8 * FPS}
        color={COLORS.ink}
      />
      <Lbl
        x={qx}
        y={oy + 80}
        text="Dennard : modèle de miniaturisation"
        start={start + 2.4 * FPS}
        color={COLORS.warm}
        size={26}
      />
    </g>
  );
};

const ITEMS: GlossItem[] = [
  {
    term: "Capacité C",
    def: "Charge nécessaire par volt ; elle coûte du temps et de l’énergie à commuter.",
    Visual: Capa,
  },
  {
    term: "Fuite",
    en: "LEAKAGE",
    def: "Courant indésirable subsistant, notamment dans l’état bloqué.",
    Visual: Leak,
  },
  {
    term: "PPA",
    en: "POWER PERFORMANCE AREA",
    def: "Puissance, performance et surface.",
    Visual: Ppa,
  },
  {
    term: "FinFET et GAA",
    def: "Géométries améliorant le contrôle de la grille autour du canal.",
    Visual: Geometries,
  },
  {
    term: "Moore et Dennard",
    def: "Une trajectoire d’intégration, et un modèle physique de miniaturisation.",
    Visual: MooreDennard,
  },
];

// Scène 46 — Glossaire (2/2) : cinq termes, chacun avec son schéma de rappel.
export const S46: React.FC = () => {
  const cues = useCues();
  const starts = [0, 1, 2, 3, 4].map((i) => cues.s(i));
  return (
    <AbsoluteFill>
      <GlossDeck
        items={ITEMS}
        starts={starts}
        end={cues.end}
        heading="Glossaire · 2 / 2"
      />
    </AbsoluteFill>
  );
};
