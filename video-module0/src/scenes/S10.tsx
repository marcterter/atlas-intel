import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { circlePath, roundRectPath } from "../components/icons";
import { Link, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";

const CX = 520;
const CY = 560;
const accentA = (a: number) => `rgba(143, 208, 255, ${a})`;

type Obj = { term: string; def: string; why: string };
const OBJS: Obj[] = [
  {
    term: "Silicium purifié",
    def: "Matériau de départ de nombreuses puces",
    why: "Sa pureté et ses propriétés conditionnent la fabrication",
  },
  {
    term: "Wafer",
    def: "Disque sur lequel on fabrique de nombreux circuits",
    why: "Une usine traite des wafers avant d’obtenir des puces séparées",
  },
  {
    term: "Transistor",
    def: "Dispositif minuscule contrôlant un courant",
    why: "Des ensembles de transistors réalisent calcul et mémorisation",
  },
  {
    term: "Die",
    def: "Morceau de semi-conducteur contenant un circuit, après découpe",
    why: "C’est la puce physique nue",
  },
  {
    term: "Packaging",
    def: "Techniques d’assemblage, de protection et de connexion",
    why: "Rend les dies utilisables dans le système",
  },
];

// Fiche texte à droite : terme, définition, pourquoi il compte.
const Card: React.FC<{ obj: Obj; a: number; b: number }> = ({ obj, a, b }) => (
  <div style={{ position: "absolute", top: 330, left: 1000, width: 780 }}>
    <FadeIn start={a}>
      <div style={textStyle(58, 200)}>{obj.term}</div>
    </FadeIn>
    <FadeIn start={a + 12} style={{ marginTop: 36 }}>
      <div
        style={{
          ...textStyle(20, 500),
          color: COLORS.inkSoft,
          letterSpacing: "0.28em",
          marginBottom: 10,
        }}
      >
        DÉFINITION
      </div>
      <div style={{ ...textStyle(32, 300), lineHeight: 1.35 }}>{obj.def}</div>
    </FadeIn>
    <FadeIn start={b} style={{ marginTop: 34 }}>
      <div
        style={{
          ...textStyle(20, 500),
          color: COLORS.inkSoft,
          letterSpacing: "0.28em",
          marginBottom: 10,
        }}
      >
        POURQUOI IL COMPTE
      </div>
      <div
        style={{
          ...textStyle(32, 300),
          lineHeight: 1.35,
          color: COLORS.accent,
        }}
      >
        {obj.why}
      </div>
    </FadeIn>
  </div>
);

// Frise des cinq objets, l'objet courant en surbrillance.
const Strip: React.FC<{ starts: number[] }> = ({ starts }) => {
  const frame = useCurrentFrame();
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  return (
    <div
      style={{
        position: "absolute",
        top: 205,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        gap: 20,
      }}
    >
      {OBJS.map((o, i) => (
        <React.Fragment key={o.term}>
          {i > 0 && (
            <span
              style={{
                ...textStyle(22, 300),
                color: COLORS.inkFaint,
                opacity: progress(frame, starts[0] - 20 + i * 3, 0.4),
              }}
            >
              →
            </span>
          )}
          <span
            style={{
              ...textStyle(22, 500),
              letterSpacing: "0.16em",
              color: i === current ? COLORS.accent : COLORS.inkSoft,
              opacity:
                progress(frame, starts[0] - 20 + i * 3, 0.4) *
                (i === current ? 1 : 0.6),
            }}
          >
            {o.term.toUpperCase()}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

// 1. Réseau cristallin de silicium ; une impureté est éliminée.
const Lattice: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const frame = useCurrentFrame();
  const n = 6;
  const step = 80;
  const x0 = CX - ((n - 1) * step) / 2;
  const y0 = CY - ((n - 1) * step) / 2;
  const imp = { r: 2, c: 3 };
  const clean = progress(frame, b + 20, 1);
  const els: React.ReactNode[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const x = x0 + c * step;
      const y = y0 + r * step;
      const at = a + 8 + (r + c) * 2;
      if (c < n - 1)
        els.push(
          <DrawPath
            key={`h${r}${c}`}
            d={`M ${x + 14} ${y} H ${x + step - 14}`}
            start={at + 4}
            duration={0.3}
            stroke={COLORS.inkFaint}
            width={2}
          />,
        );
      if (r < n - 1)
        els.push(
          <DrawPath
            key={`v${r}${c}`}
            d={`M ${x} ${y + 14} V ${y + step - 14}`}
            start={at + 4}
            duration={0.3}
            stroke={COLORS.inkFaint}
            width={2}
          />,
        );
      const isImp = r === imp.r && c === imp.c;
      const o = progress(frame, at, 0.4);
      els.push(
        <circle
          key={`a${r}${c}`}
          cx={x}
          cy={y}
          r={11}
          fill={
            isImp
              ? interpolate(clean, [0, 1], [0, 1]) > 0.5
                ? accentA(0.35)
                : "rgba(255, 211, 138, 0.5)"
              : accentA(0.25)
          }
          stroke={isImp && clean < 0.5 ? COLORS.warm : COLORS.accent}
          strokeWidth={1.5}
          opacity={o}
        />,
      );
    }
  }
  return (
    <g>
      {els}
      <SvgText
        x={CX}
        y={CY + 270}
        text={clean < 0.5 ? "impureté" : "silicium très pur"}
        start={clean < 0.5 ? b : b + 30}
        size={24}
        color={clean < 0.5 ? COLORS.warm : COLORS.accent}
      />
    </g>
  );
};

// 2. Wafer couvert de circuits, qui se séparent ensuite en puces.
const Wafer: React.FC<{ a: number; b: number; r?: number; cx?: number }> = ({
  a,
  b,
  r = 230,
  cx = CX,
}) => {
  const frame = useCurrentFrame();
  const cell = r / 5;
  const split = progress(frame, b + 10, 1.4);
  const dies: React.ReactNode[] = [];
  let k = 0;
  for (let i = -5; i < 5; i++) {
    for (let j = -5; j < 5; j++) {
      const x = cx + j * cell;
      const y = CY + i * cell;
      const corners = [
        [x, y],
        [x + cell, y],
        [x, y + cell],
        [x + cell, y + cell],
      ];
      if (corners.some(([px, py]) => Math.hypot(px - cx, py - CY) > r - 6))
        continue;
      const mx = x + cell / 2 - cx;
      const my = y + cell / 2 - CY;
      const dx = mx * 0.18 * split;
      const dy = my * 0.18 * split;
      dies.push(
        <path
          key={k}
          d={roundRectPath(x + 3 + dx, y + 3 + dy, cell - 6, cell - 6, 3)}
          fill={accentA(0.12)}
          stroke={COLORS.accent}
          strokeWidth={1.2}
          opacity={progress(frame, a + 14 + k * 0.6, 0.3)}
        />,
      );
      k++;
    }
  }
  return (
    <g>
      <g opacity={1 - split * 0.8}>
        <DrawPath
          d={circlePath(cx, CY, r)}
          start={a}
          duration={1}
          stroke={COLORS.ink}
        />
      </g>
      {dies}
    </g>
  );
};

// 3. Transistor : la grille ouvre ou ferme le passage du courant.
const Transistor: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const frame = useCurrentFrame();
  const t = frame - a - 40;
  const on = t > 0 && Math.floor(t / 45) % 2 === 0;
  const sub = { x: 250, y: 560, w: 540, h: 110 };
  const bits = [1, 0, 1, 1, 0, 0, 1, 0];
  return (
    <g>
      <DrawPath
        d={roundRectPath(sub.x, sub.y, sub.w, sub.h, 8)}
        start={a}
        duration={0.8}
        stroke={COLORS.inkSoft}
      />
      <DrawPath
        d={roundRectPath(290, 520, 130, 50, 6)}
        start={a + 10}
        duration={0.5}
        stroke={COLORS.ink}
      />
      <DrawPath
        d={roundRectPath(620, 520, 130, 50, 6)}
        start={a + 14}
        duration={0.5}
        stroke={COLORS.ink}
      />
      <path
        d={roundRectPath(445, 460, 150, 44, 6)}
        fill={on ? accentA(0.45) : "none"}
      />
      <DrawPath
        d={roundRectPath(445, 460, 150, 44, 6)}
        start={a + 20}
        duration={0.5}
        stroke={COLORS.accent}
      />
      <SvgText x={355} y={480} text="Source" start={a + 24} size={24} />
      <SvgText
        x={520}
        y={420}
        text="Grille"
        start={a + 28}
        size={24}
        color={COLORS.accent}
      />
      <SvgText x={685} y={480} text="Drain" start={a + 32} size={24} />
      {/* Canal : le courant ne passe que si la grille est active. */}
      {on &&
        [0, 1, 2, 3, 4].map((i) => {
          const p = ((t % 45) / 45 + i / 5) % 1;
          return (
            <circle
              key={i}
              cx={380 + p * 280}
              cy={560}
              r={6}
              fill={COLORS.warm}
            />
          );
        })}
      <SvgText
        x={CX}
        y={710}
        text={on ? "courant : passe" : "courant : bloqué"}
        start={a + 40}
        size={24}
        color={on ? COLORS.warm : COLORS.inkSoft}
      />
      {/* Des milliards de transistors : calcul et mémorisation (0 / 1). */}
      {bits.map((bit, i) => {
        const flip =
          Math.floor(Math.max(0, frame - b) / 20 + i * 0.7) % 3 === 0;
        const v = flip ? 1 - bit : bit;
        const o = progress(frame, b + 10 + i * 3, 0.4);
        return (
          <g key={i} opacity={o}>
            <path
              d={roundRectPath(CX - 244 + i * 62, 770, 50, 50, 6)}
              fill={v ? accentA(0.3) : "none"}
              stroke={COLORS.accent}
              strokeWidth={1.4}
            />
            <text
              x={CX - 219 + i * 62}
              y={804}
              textAnchor="middle"
              fontFamily='"Inter Variable", Inter, sans-serif'
              fontSize={24}
              fontWeight={300}
              fill={COLORS.ink}
            >
              {v}
            </text>
          </g>
        );
      })}
    </g>
  );
};

// 4. Die : on découpe le wafer et on en extrait un morceau.
const Die: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const frame = useCurrentFrame();
  const lift = progress(frame, a + 40, 1.2);
  const r = 170;
  const cx = 320;
  const cell = r / 4;
  const srcX = cx + 2;
  const srcY = CY - cell + 2;
  const big = 260;
  const bx = interpolate(lift, [0, 1], [srcX, 600]);
  const by = interpolate(lift, [0, 1], [srcY, CY - big / 2]);
  const s = interpolate(lift, [0, 1], [cell - 4, big]);
  const lines = [0.2, 0.4, 0.6, 0.8];
  return (
    <g>
      <DrawPath d={circlePath(cx, CY, r)} start={a} duration={0.8} />
      {[-3, -2, -1, 0, 1, 2, 3].map((k) => {
        const o = k * cell;
        const h = Math.sqrt(r * r - o * o);
        return (
          <g key={k}>
            <DrawPath
              d={`M ${cx + o} ${CY - h} V ${CY + h}`}
              start={a + 10 + k + 3}
              duration={0.5}
              stroke={COLORS.inkSoft}
              width={1}
            />
            <DrawPath
              d={`M ${cx - h} ${CY + o} H ${cx + h}`}
              start={a + 14 + k + 3}
              duration={0.5}
              stroke={COLORS.inkSoft}
              width={1}
            />
          </g>
        );
      })}
      <SvgText
        x={cx}
        y={CY + r + 44}
        text="découpe"
        start={a + 20}
        size={24}
        color={COLORS.inkSoft}
      />
      {lift > 0 && (
        <g>
          <path
            d={roundRectPath(srcX, srcY, cell - 4, cell - 4, 2)}
            fill="#030817"
            stroke={COLORS.inkFaint}
          />
          <path
            d={roundRectPath(bx, by, s, s, 6)}
            fill="rgba(10, 26, 61, 0.95)"
            stroke={COLORS.accent}
            strokeWidth={2}
          />
          {lift > 0.95 &&
            lines.map((l, i) => (
              <g key={i}>
                <DrawPath
                  d={`M ${bx + 20} ${by + s * l} H ${bx + s * (0.4 + (i % 2) * 0.4)} V ${by + s * l + 20}`}
                  start={a + 80 + i * 4}
                  duration={0.6}
                  stroke={COLORS.accent}
                  width={1.4}
                />
                <DrawPath
                  d={`M ${bx + s * l} ${by + 20} V ${by + s * 0.3}`}
                  start={a + 84 + i * 4}
                  duration={0.4}
                  stroke={COLORS.accent}
                  width={1.4}
                />
              </g>
            ))}
        </g>
      )}
      <SvgText
        x={730}
        y={CY + big / 2 + 44}
        text="puce physique nue"
        start={b}
        size={26}
        color={COLORS.accent}
      />
    </g>
  );
};

// 5. Packaging : le die est assemblé, protégé et connecté.
const Package: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const frame = useCurrentFrame();
  const bumps = new Array(9).fill(0).map((_, i) => 400 + i * 30);
  const balls = new Array(8).fill(0).map((_, i) => 305 + i * 60);
  return (
    <g transform="translate(-50 0)">
      {/* Couvercle (protection) */}
      <DrawPath
        d={`M 300 520 V 400 H 740 V 520`}
        start={a + 50}
        duration={0.8}
        stroke={COLORS.inkSoft}
      />
      <path
        d={roundRectPath(390, 450, 260, 60, 6)}
        fill={accentA(0.2 * progress(frame, a + 8, 0.5))}
      />
      <DrawPath
        d={roundRectPath(390, 450, 260, 60, 6)}
        start={a}
        duration={0.6}
        stroke={COLORS.accent}
      />
      <SvgText
        x={520}
        y={480}
        text="die"
        start={a + 8}
        size={24}
        color={COLORS.accent}
      />
      {bumps.map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={520}
          r={6}
          fill={COLORS.warm}
          opacity={progress(frame, a + 20 + i, 0.3)}
        />
      ))}
      <DrawPath
        d={roundRectPath(270, 528, 500, 64, 6)}
        start={a + 28}
        duration={0.7}
        stroke={COLORS.ink}
      />
      {balls.map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={606}
          r={11}
          fill="none"
          stroke={COLORS.warm}
          strokeWidth={1.6}
          opacity={progress(frame, a + 40 + i, 0.3)}
        />
      ))}
      <SvgText
        x={840}
        y={420}
        text="protection"
        start={a + 56}
        size={24}
        anchor="start"
        color={COLORS.inkSoft}
      />
      <SvgText
        x={840}
        y={520}
        text="connexion"
        start={a + 26}
        size={24}
        anchor="start"
        color={COLORS.warm}
      />
      <SvgText
        x={840}
        y={570}
        text="assemblage"
        start={a + 34}
        size={24}
        anchor="start"
        color={COLORS.ink}
      />
      {/* Utilisable dans le système : posé sur la carte. */}
      <DrawPath
        d={`M 180 ${630} H 860`}
        start={b}
        duration={0.8}
        stroke={COLORS.accent}
        width={3}
      />
      <SvgText
        x={520}
        y={690}
        text="vers le système"
        start={b + 12}
        size={26}
        color={COLORS.accent}
      />
    </g>
  );
};

// Scène 10 — Les objets de la fabrication au serveur (1/2).
export const S10: React.FC = () => {
  const cues = useCues();
  const starts = [1, 3, 5, 7, 9].map((i) => cues.s(i));
  const whys = [2, 4, 6, 8, 10].map((i) => cues.s(i));
  const ends = [...starts.slice(1), cues.end + FPS];
  const visuals = [Lattice, Wafer, Transistor, Die, Package];
  return (
    <AbsoluteFill>
      <Title
        kicker="Les objets"
        text="De la fabrication au serveur"
        top={100}
        start={cues.s(0)}
      />
      <Strip starts={starts} />
      {OBJS.map((o, i) => {
        const V = visuals[i];
        return (
          <Stage key={o.term} from={starts[i]} to={ends[i]}>
            <Svg>
              <V a={starts[i]} b={whys[i]} />
            </Svg>
            <Card obj={o} a={starts[i]} b={whys[i]} />
          </Stage>
        );
      })}
      <Stage from={0} to={starts[0]}>
        <Svg>
          <Link from={[420, 560]} to={[1500, 560]} start={cues.s(0, 0.8)} />
          <SvgText
            x={420}
            y={620}
            text="fabrication"
            start={cues.s(0, 0.8)}
            size={26}
            color={COLORS.inkSoft}
          />
          <SvgText
            x={1500}
            y={620}
            text="serveur"
            start={cues.s(0, 1.8)}
            size={26}
            color={COLORS.accent}
          />
        </Svg>
      </Stage>
    </AbsoluteFill>
  );
};
