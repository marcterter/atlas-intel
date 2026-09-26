import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { circlePath, roundRectPath } from "../components/icons";
import { Svg, SvgText, Title } from "../components/kit";
import {
  Counter,
  DrawPath,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import { Eq, FictiveTag, Pos, Takeaway, Unit, small } from "./S33";

type Die = { x: number; y: number; c: number; order: number; bad: number };

// Grille de dies entièrement contenus dans le wafer, les n plus proches du centre.
// bad : 0 = bon, 1 = défectueux, 0,5 = « demi-die » (moyenne fractionnaire).
const makeDies = (
  cx: number,
  cy: number,
  r: number,
  c: number,
  n: number,
  nBad: number,
  half: boolean,
  seed: string,
): Die[] => {
  const cells: { x: number; y: number; far: number; ang: number }[] = [];
  const k = Math.ceil(r / c) + 1;
  for (let i = -k; i < k; i++) {
    for (let j = -k; j < k; j++) {
      const x = i * c;
      const y = j * c;
      const far = Math.max(
        ...[
          [x, y],
          [x + c, y],
          [x, y + c],
          [x + c, y + c],
        ].map(([a, b]) => Math.hypot(a, b)),
      );
      if (far <= r - 6)
        cells.push({ x, y, far, ang: Math.atan2(y + c / 2, x + c / 2) });
    }
  }
  cells.sort((a, b) => a.far - b.far || a.ang - b.ang);
  const kept = cells.slice(0, n);
  // Défauts plus fréquents vers le bord.
  const rank = kept
    .map((d, i) => ({ i, w: random(`${seed}${i}`) + (d.far / r) * 0.9 }))
    .sort((a, b) => b.w - a.w)
    .map((o) => o.i);
  const badSet = new Map<number, number>();
  rank.slice(0, nBad).forEach((i) => badSet.set(i, 1));
  if (half) badSet.set(rank[nBad], 0.5);
  return kept.map((d, i) => ({
    x: cx + d.x,
    y: cy + d.y,
    c,
    order: i / n,
    bad: badSet.get(i) ?? 0,
  }));
};

const R = 160;
const WA = { x: 560, y: 420 };
const WB = { x: 1360, y: 420 };
const DIES_A = makeDies(WA.x, WA.y, R, 24, 100, 20, false, "a");
const DIES_B = makeDies(WB.x, WB.y, R, 21, 130, 32, true, "b");

const Wafer: React.FC<{
  cx: number;
  cy: number;
  dies: Die[];
  start: number;
  diesAt: number;
  badAt: number;
}> = ({ cx, cy, dies, start, diesAt, badAt }) => {
  const frame = useCurrentFrame();
  const bad = progress(frame, badAt, 0.8);
  return (
    <g>
      <DrawPath
        d={circlePath(cx, cy, R)}
        start={start}
        duration={1.2}
        stroke={COLORS.ink}
        width={1.6}
      />
      {/* Encoche du wafer */}
      <DrawPath
        d={`M ${cx - 10} ${cy + R - 1} L ${cx} ${cy + R - 12} L ${cx + 10} ${cy + R - 1}`}
        start={start + 20}
        duration={0.4}
        stroke={COLORS.inkSoft}
        width={1.4}
      />
      {dies.map((d, i) => {
        const o = progress(frame, diesAt + d.order * FPS * 1.4, 0.3);
        if (o === 0) return null;
        const g = 1.5;
        const isBad = d.bad > 0 && bad > 0;
        const color = isBad && d.bad === 1 ? COLORS.warm : COLORS.accent;
        return (
          <g key={i} opacity={o}>
            <rect
              x={d.x + g}
              y={d.y + g}
              width={d.c - 2 * g}
              height={d.c - 2 * g}
              fill={color}
              fillOpacity={isBad && d.bad === 1 ? 0.08 * (1 - bad) : 0.22}
              stroke={color}
              strokeWidth={1.1}
            />
            {isBad && d.bad === 1 && (
              <path
                d={`M ${d.x + 5} ${d.y + 5} L ${d.x + d.c - 5} ${d.y + d.c - 5} M ${d.x + d.c - 5} ${d.y + 5} L ${d.x + 5} ${d.y + d.c - 5}`}
                stroke={COLORS.warm}
                strokeWidth={1.4}
                opacity={bad}
              />
            )}
            {isBad && d.bad === 0.5 && (
              <rect
                x={d.x + d.c / 2}
                y={d.y + g}
                width={d.c / 2 - g}
                height={d.c - 2 * g}
                fill={COLORS.nightTop}
                stroke={COLORS.warm}
                strokeWidth={1.1}
                opacity={bad}
              />
            )}
          </g>
        );
      })}
    </g>
  );
};

// Colonne d'une génération : en-tête, wafer, décompte des dies, équation.
const Generation: React.FC<{
  name: string;
  cx: number;
  cy: number;
  dies: Die[];
  price: string;
  raw: number;
  yieldPct: number;
  good: number;
  goodDec: number;
  start: number;
  eqAt: number;
  cost: number;
  approx: boolean;
}> = ({
  name,
  cx,
  cy,
  dies,
  price,
  raw,
  yieldPct,
  good,
  goodDec,
  start,
  eqAt,
  cost,
  approx,
}) => {
  const diesAt = start + FPS * 3.4;
  const badAt = start + FPS * 5.4;
  const left = cx - 390;
  return (
    <AbsoluteFill>
      <Pos start={start} left={left} top={180} width={780} align="center">
        <div style={small(COLORS.accent)}>GÉNÉRATION {name}</div>
      </Pos>
      <Pos
        start={start + FPS * 1.8}
        left={left}
        top={214}
        width={780}
        align="center"
      >
        <div style={textStyle(30, 300)}>
          wafer à <span style={{ color: COLORS.warm }}>{price} €</span>
        </div>
      </Pos>
      <Svg>
        <Wafer
          cx={cx}
          cy={cy}
          dies={dies}
          start={start + 10}
          diesAt={diesAt}
          badAt={badAt}
        />
      </Svg>
      <Eq
        y={594}
        size={37}
        left={left}
        width={780}
        parts={[
          {
            node: (
              <>
                <Counter to={raw} start={diesAt} duration={1.4} />
                <Unit>dies bruts</Unit>
              </>
            ),
            at: diesAt,
          },
          { node: "×", at: badAt, op: true },
          {
            node: (
              <>
                {yieldPct} %<Unit>rendement</Unit>
              </>
            ),
            at: badAt,
          },
          { node: "=", at: badAt + FPS * 0.8, op: true },
          {
            node: (
              <>
                <Counter
                  to={good}
                  decimals={goodDec}
                  start={badAt + FPS * 0.8}
                  duration={1}
                />
                <Unit>dies bons</Unit>
              </>
            ),
            at: badAt + FPS * 0.8,
            hi: true,
          },
        ]}
      />
      <Pos start={eqAt} left={left} top={676} width={780} align="center">
        <div style={small()}>COÛT WAFER PAR DIE BON</div>
      </Pos>
      <Eq
        y={712}
        size={44}
        left={left}
        width={780}
        parts={[
          {
            node: (
              <>
                {price}
                <Unit>€</Unit>
              </>
            ),
            at: eqAt + FPS * 2.4,
          },
          { node: "÷", at: eqAt + FPS * 3.4, op: true },
          {
            node: `(${raw} × ${(yieldPct / 100).toFixed(2).replace(".", ",")})`,
            at: eqAt + FPS * 4.2,
          },
          { node: approx ? "≈" : "=", at: eqAt + FPS * 6, op: true },
          {
            node: (
              <>
                <Counter to={cost} start={eqAt + FPS * 6.2} duration={1.2} />
                <Unit>€</Unit>
              </>
            ),
            at: eqAt + FPS * 6.2,
            hi: true,
          },
        ]}
      />
    </AbsoluteFill>
  );
};

const Wafers: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const cmp = cues.s(5);
  return (
    <AbsoluteFill>
      <Generation
        name="A"
        cx={WA.x}
        cy={WA.y}
        dies={DIES_A}
        price="20 000"
        raw={100}
        yieldPct={80}
        good={80}
        goodDec={0}
        start={cues.s(1)}
        eqAt={cues.s(3)}
        cost={250}
        approx={false}
      />
      <Generation
        name="B"
        cx={WB.x}
        cy={WB.y}
        dies={DIES_B}
        price="26 000"
        raw={130}
        yieldPct={75}
        good={97.5}
        goodDec={1}
        start={cues.s(2)}
        eqAt={cues.s(4)}
        cost={267}
        approx={true}
      />
      {/* Légende au centre */}
      <Svg>
        <rect
          x={800}
          y={300}
          width={20}
          height={20}
          fill={COLORS.accent}
          fillOpacity={0.22}
          stroke={COLORS.accent}
          opacity={progress(frame, cues.s(1, 5.4), 0.6)}
        />
        <SvgText
          x={836}
          y={310}
          text="die bon"
          start={cues.s(1, 5.4)}
          anchor="start"
          size={22}
          color={COLORS.inkSoft}
        />
        <DrawPath
          d={`${roundRectPath(800, 344, 20, 20, 1)} M 804 348 L 816 360 M 816 348 L 804 360`}
          start={cues.s(1, 5.4)}
          duration={0.5}
          stroke={COLORS.warm}
          width={1.4}
        />
        <SvgText
          x={836}
          y={354}
          text="die défectueux"
          start={cues.s(1, 5.6)}
          anchor="start"
          size={22}
          color={COLORS.inkSoft}
        />
      </Svg>
      <Pos start={cmp} left={720} top={410} width={480} align="center">
        <div style={small(COLORS.accent)}>DIES BONS PAR WAFER</div>
        <div style={{ ...textStyle(30, 300), marginTop: 6 }}>
          A 80 <span style={{ color: COLORS.accent }}>&lt;</span> B 97,5
        </div>
      </Pos>
      <Pos
        start={cmp + FPS * 2}
        left={720}
        top={510}
        width={480}
        align="center"
      >
        <div style={small(COLORS.warm)}>COÛT PAR DIE BON</div>
        <div style={{ ...textStyle(30, 300), marginTop: 6 }}>
          A 250 € <span style={{ color: COLORS.warm }}>&lt;</span> B 267 €
        </div>
      </Pos>
    </AbsoluteFill>
  );
};

const EXCLUDED = [
  { label: "packaging", at: 1.8 },
  { label: "test", at: 2.8 },
  { label: "conception", at: 3.8 },
  { label: "frais fixes du concepteur", at: 5.2 },
  { label: "marge du concepteur", at: 7 },
];

// Ce que le coût wafer par die bon laisse de côté.
const NotIncluded: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(6);
  const x = 240;
  const w = 520;
  const base = 700;
  const h = 62;
  const gap = 12;
  return (
    <AbsoluteFill>
      <Pos start={t} left={x} top={200} width={900}>
        <div style={small(COLORS.warm)}>CE QUE LE CALCUL NE COMPREND PAS</div>
      </Pos>
      <Svg>
        <path
          d={roundRectPath(x, base, w, 80, 10)}
          fill={COLORS.accent}
          fillOpacity={0.18}
          stroke={COLORS.accent}
          strokeWidth={2}
          opacity={progress(frame, t, 0.6)}
        />
        <SvgText
          x={x + w / 2}
          y={base + 40}
          text="coût wafer par die bon · 250 € (A)"
          start={t + 4}
          size={26}
          weight={400}
        />
        {EXCLUDED.map((e, i) => {
          const y = base - (i + 1) * (h + gap);
          const at = t + FPS * e.at;
          return (
            <g key={e.label}>
              <DrawPath
                d={roundRectPath(x, y, w, h, 10)}
                start={at}
                duration={0.6}
                stroke={COLORS.warm}
                width={1.4}
              />
              <SvgText
                x={x + w / 2}
                y={y + h / 2}
                text={e.label}
                start={at + 6}
                size={26}
                color={COLORS.ink}
              />
            </g>
          );
        })}
        <DrawPath
          d={`M ${x + w + 24} ${base - 5 * (h + gap)} h 14 V ${base - gap} h -14`}
          start={t + FPS * 7.6}
          duration={0.8}
          stroke={COLORS.warm}
          width={1.6}
        />
        <SvgText
          x={x + w + 60}
          y={base - 2.5 * (h + gap)}
          text={"non inclus :\nle coût du produit\nlivré est plus élevé"}
          start={t + FPS * 7.8}
          anchor="start"
          size={24}
          color={COLORS.warm}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Un nombre fractionnaire de dies bons = une moyenne.
const Average: React.FC = () => {
  const cues = useCues();
  const t = cues.s(7);
  const counts = [97, 98, 97, 98];
  const xs = [1150, 1290, 1430, 1570];
  return (
    <AbsoluteFill>
      <Svg>
        {xs.map((x, i) => (
          <g key={x}>
            <DrawPath
              d={circlePath(x, 330, 52)}
              start={t + i * 5}
              duration={0.7}
              stroke={COLORS.inkSoft}
              width={1.4}
            />
            <SvgText
              x={x}
              y={330}
              text={String(counts[i])}
              start={t + 10 + i * 5}
              size={30}
              weight={300}
              color={COLORS.accent}
            />
          </g>
        ))}
        <SvgText
          x={1640}
          y={330}
          text="…"
          start={t + 30}
          size={30}
          anchor="start"
          color={COLORS.inkSoft}
        />
      </Svg>
      <Eq
        y={410}
        size={40}
        left={1060}
        width={620}
        parts={[
          { node: "moyenne", at: t + FPS * 1.4, soft: true },
          { node: "=", at: t + FPS * 1.8, op: true },
          {
            node: (
              <>
                <Counter
                  to={97.5}
                  decimals={1}
                  start={t + FPS * 2}
                  duration={1}
                />
                <Unit>dies bons</Unit>
              </>
            ),
            at: t + FPS * 2,
            hi: true,
          },
        ]}
      />
      <Takeaway
        start={t + FPS * 2.6}
        left={1080}
        top={520}
        width={640}
        label="NOTE"
        color={COLORS.ink}
        size={28}
      >
        Un nombre fractionnaire de dies bons représente une moyenne sur de
        nombreux wafers.
      </Takeaway>
    </AbsoluteFill>
  );
};

// Scène 34 — Deuxième cas résolu : le coût du die bon.
export const S34: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Title
        text="Cas résolu : le coût du die bon"
        start={cues.s(0)}
        top={105}
      />
      <FictiveTag start={cues.s(0)} />
      <Stage from={0} to={cues.s(6)}>
        <Wafers />
      </Stage>
      <Stage from={cues.s(6)}>
        <NotIncluded />
      </Stage>
      <Stage from={cues.s(7)}>
        <Average />
      </Stage>
    </AbsoluteFill>
  );
};
