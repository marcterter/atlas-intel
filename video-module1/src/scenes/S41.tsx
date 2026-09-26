import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { icons, roundRectPath } from "../components/icons";
import { Svg, SvgText, Title } from "../components/kit";
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
import { FictiveTag, Pos, Takeaway, small } from "./S33";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// En-tête d'hypothèse : numéro + énoncé.
const Header: React.FC<{ n: number; text: string; start: number }> = ({
  n,
  text,
  start,
}) => (
  <>
    <Pos start={start} left={140} top={112} width={1300}>
      <div style={small(COLORS.accent)}>HYPOTHÈSE {n}</div>
    </Pos>
    <Pos start={start + 8} left={140} top={146} width={1400}>
      <div style={textStyle(40, 200)}>{text}</div>
    </Pos>
  </>
);

// Colonne « À vérifier » : chaque point se coche à son tour.
const Verify: React.FC<{
  items: string[];
  starts: number[];
  left?: number;
  top?: number;
}> = ({ items, starts, left = 1260, top = 300 }) => (
  <AbsoluteFill>
    <Takeaway
      start={starts[0] - 16}
      left={left}
      top={top}
      width={1780 - left}
      label="À VÉRIFIER"
      color={COLORS.warm}
      size={28}
    >
      {items.map((it, i) => (
        <FadeIn key={it} start={starts[i]} rise={8}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              marginTop: i === 0 ? 4 : 14,
            }}
          >
            <svg width={26} height={26} style={{ flexShrink: 0 }}>
              <path
                d={icons.magnifier(13, 13, 10)}
                stroke={COLORS.warm}
                strokeWidth={1.8}
                fill="none"
              />
            </svg>
            <span style={textStyle(30, 300)}>{it}</span>
          </div>
        </FadeIn>
      ))}
    </Takeaway>
  </AbsoluteFill>
);

// ——— Hypothèse 1 : la puce ne rétrécit pas partout comme la logique ———
const BLOCKS = [
  { name: "logique", share: 0.5, k: 0.6, color: COLORS.accent, at: 5.4 },
  { name: "mémoire", share: 0.25, k: 0.85, color: COLORS.ink, at: 7.6 },
  { name: "connexions", share: 0.15, k: 0.95, color: COLORS.inkSoft, at: 8.8 },
  { name: "analogique", share: 0.1, k: 1, color: COLORS.warm, at: 9.9 },
];
const BX = 520;
const BWID = 640;
const BH = 70;

const StackBar: React.FC<{
  y: number;
  start: number;
  shrinkBase?: number;
}> = ({ y, start, shrinkBase }) => {
  const frame = useCurrentFrame();
  const o = progress(frame, start, 0.6);
  let x = BX;
  return (
    <g opacity={o}>
      {BLOCKS.map((b) => {
        const p =
          shrinkBase === undefined
            ? 0
            : progress(frame, shrinkBase + FPS * (b.at - 5.4), 1);
        const w = BWID * b.share * (1 - (1 - b.k) * p);
        const x0 = x;
        x += w;
        return (
          <path
            key={b.name}
            d={roundRectPath(x0 + 2, y, Math.max(0, w - 4), BH, 6)}
            fill={b.color}
            fillOpacity={0.22}
            stroke={b.color}
            strokeWidth={1.4}
          />
        );
      })}
    </g>
  );
};

const H1: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(3);
  const rows = [
    { y: 330, label: "Puce actuelle", sub: "100 % de surface", at: t + 10 },
    {
      y: 470,
      label: "Si tout rétrécissait",
      sub: "comme la logique",
      at: t + FPS * 2.4,
    },
    {
      y: 610,
      label: "Puce réelle",
      sub: "chaque bloc à son rythme",
      at: t + FPS * 5,
    },
  ];
  const theo = BWID * 0.6;
  const real = BWID * BLOCKS.reduce((acc, b) => acc + b.share * b.k, 0); // 0,755
  const gapAt = t + FPS * 10.6;
  return (
    <AbsoluteFill>
      <Header
        n={1}
        text="Le marché surestime un gain de densité"
        start={cues.s(2)}
      />
      {/* Légende des blocs */}
      <div
        style={{
          position: "absolute",
          left: BX,
          top: 262,
          display: "flex",
          gap: 26,
        }}
      >
        {BLOCKS.map((b, i) => (
          <FadeIn key={b.name} start={t + 10 + i * 4} rise={6}>
            <span
              style={{
                ...textStyle(22, 400),
                color: b.color,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  border: `1.4px solid ${b.color}`,
                  background: "rgba(255,255,255,0.08)",
                  display: "inline-block",
                }}
              />
              {b.name}
            </span>
          </FadeIn>
        ))}
      </div>
      {rows.map((r) => (
        <Pos key={r.label} start={r.at} left={140} top={r.y + 2} width={360}>
          <div style={textStyle(28, 400)}>{r.label}</div>
          <div style={{ ...textStyle(22, 300), color: COLORS.inkSoft }}>
            {r.sub}
          </div>
        </Pos>
      ))}
      <Svg>
        <StackBar y={rows[0].y} start={rows[0].at} />
        {/* Théorique : tout à 60 % */}
        <path
          d={roundRectPath(BX + 2, rows[1].y, theo - 4, BH, 6)}
          fill={COLORS.accent}
          fillOpacity={0.1}
          stroke={COLORS.accent}
          strokeWidth={1.4}
          strokeDasharray="7 6"
          opacity={progress(frame, rows[1].at, 0.6)}
        />
        <SvgText
          x={BX + theo + 20}
          y={rows[1].y + BH / 2}
          text="−40 %"
          start={rows[1].at + 12}
          anchor="start"
          size={30}
          weight={300}
          color={COLORS.accent}
        />
        <StackBar y={rows[2].y} start={rows[2].at} shrinkBase={t + FPS * 5.6} />
        {/* Écart entre promesse et réalité */}
        <DrawPath
          d={`M ${BX + theo} ${rows[1].y + BH + 6} V ${rows[2].y + BH + 24} M ${BX + real} ${rows[2].y - 6} V ${rows[2].y + BH + 24}`}
          start={gapAt}
          duration={0.6}
          stroke={COLORS.warm}
          width={1.4}
        />
        <DrawPath
          d={`M ${BX + theo} ${rows[2].y + BH + 16} H ${BX + real}`}
          start={gapAt + 10}
          duration={0.5}
          stroke={COLORS.warm}
          width={2}
        />
      </Svg>
      <Pos
        start={gapAt + 6}
        left={BX + real + 20}
        top={rows[2].y + 10}
        width={300}
      >
        <div style={{ ...textStyle(30, 300), color: COLORS.warm }}>
          ≈ −
          <Counter to={24.5} decimals={1} start={gapAt + 6} duration={1} /> %
        </div>
      </Pos>
      <Pos start={gapAt + 16} left={BX} top={rows[2].y + BH + 34} width={700}>
        <div style={{ ...textStyle(24, 300), color: COLORS.warm }}>
          l’écart : la puce rétrécit moins que la densité théorique
        </div>
      </Pos>
      <Pos start={t + FPS * 1} left={BX} top={816} width={700}>
        <div style={{ ...textStyle(22, 300), color: COLORS.inkSoft }}>
          Répartition et facteurs de réduction fictifs, pour l’illustration
        </div>
      </Pos>
      <Verify
        items={["surface réelle", "répartition des blocs", "coût du die bon"]}
        starts={[cues.s(4, 1), cues.s(4, 2), cues.s(4, 3)]}
      />
    </AbsoluteFill>
  );
};

// ——— Hypothèse 2 : l'efficacité peut accroître la demande ———
const OX = 300;
const OY = 790;

const H2: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t6 = cues.s(6);
  const t7 = cues.s(7);
  const w0 = 420;
  const h0 = 170;
  const shrink = progress(frame, t6 + FPS * 1.2, 1.2);
  const grow = progress(frame, t6 + FPS * 3.6, 1.4);
  const w = w0 * (1 - 0.5 * shrink);
  const h = h0 * (1 + 1.4 * grow);
  const rectO = progress(frame, cues.s(5, 1), 0.6);
  const areaHi = progress(frame, t7, 0.8);
  return (
    <AbsoluteFill>
      <Header
        n={2}
        text="Le marché confond efficacité et baisse de dépense totale"
        start={cues.s(5)}
      />
      <Svg>
        <DrawPath
          d={`M ${OX} ${OY} H 1130 M ${OX} ${OY} V 250`}
          start={cues.s(5, 0.6)}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        {/* Avant : rectangle de référence */}
        <path
          d={roundRectPath(OX, OY - h0, w0, h0, 2)}
          fill="none"
          stroke={COLORS.ink}
          strokeWidth={1.4}
          strokeDasharray="7 6"
          opacity={rectO}
        />
        {/* Après : moins d'énergie par opération, plus d'opérations */}
        {shrink > 0 && (
          <path
            d={roundRectPath(OX, OY - h, w, h, 2)}
            fill={COLORS.accent}
            fillOpacity={0.12 + 0.12 * areaHi}
            stroke={COLORS.accent}
            strokeWidth={2}
          />
        )}
        <SvgText
          x={OX + w0 - 16}
          y={OY - h0 + 26}
          text="avant"
          start={cues.s(5, 1.2)}
          anchor="end"
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={OX + 16}
          y={OY - h + 26}
          text="après"
          start={t6 + FPS * 1.4}
          anchor="start"
          size={22}
          color={COLORS.accent}
        />
      </Svg>
      <Pos start={cues.s(5, 1)} left={OX + 20} top={OY + 12} width={820}>
        <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
          énergie par opération →
        </div>
      </Pos>
      <Pos start={cues.s(5, 1)} left={OX + 14} top={236} width={560}>
        <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
          ↑ quantité de travail demandée
        </div>
      </Pos>
      <Pos start={t6 + FPS * 1.4} left={OX + w0 + 24} top={OY - 90} width={400}>
        <div style={{ ...textStyle(26, 300), color: COLORS.accent }}>
          ← énergie / op. −50 %
        </div>
        <div style={{ ...textStyle(22, 300), color: COLORS.inkSoft }}>
          usages moins chers
        </div>
      </Pos>
      <Pos
        start={t6 + FPS * 3.8}
        left={OX + w0 / 2 + 20}
        top={OY - h0 * 2.4 + 10}
        width={400}
      >
        <div style={{ ...textStyle(26, 300), color: COLORS.accent }}>
          ↑ volume × 2,4
        </div>
        <div style={{ ...textStyle(22, 300), color: COLORS.inkSoft }}>
          la demande augmente
        </div>
      </Pos>
      {/* Surface = consommation totale */}
      <FadeIn
        start={t7}
        style={{ position: "absolute", left: 1200, top: 250, width: 580 }}
      >
        <div style={small(COLORS.ink)}>SURFACE = CONSOMMATION TOTALE</div>
        <div style={{ ...textStyle(28, 300), marginTop: 12, lineHeight: 1.35 }}>
          énergie par opération
          <span style={{ color: COLORS.accent }}> × </span>
          quantité de travail
        </div>
        <div style={{ ...textStyle(44, 200), marginTop: 14 }}>
          100 <span style={{ color: COLORS.accent }}>→</span>{" "}
          <Counter from={100} to={120} start={t7 + FPS * 1.5} duration={1.2} />
        </div>
        <div
          style={{ ...textStyle(22, 300), color: COLORS.inkSoft, marginTop: 6 }}
        >
          exemple fictif : 0,5 × 2,4 = 1,2
        </div>
        <div
          style={{ ...textStyle(24, 300), color: COLORS.warm, marginTop: 8 }}
        >
          dépend de l’efficacité ET de la demande
        </div>
      </FadeIn>
      <Verify
        top={590}
        items={["travail utile par watt", "quantité de travail demandée"]}
        starts={[cues.s(8, 1.6), cues.s(8, 3.2)]}
      />
    </AbsoluteFill>
  );
};

// ——— Hypothèse 3 : le coût d'une transition ———
const GX = 220;
const GY = 760;
const GW = 880;
const GH = 430;
const yld = (v: number) => GY - v * GH;

const H3: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t9 = cues.s(9);
  const t10 = cues.s(10);
  // Courbe d'apprentissage : départ bas, montée vers 0,85.
  const pts = new Array(41).fill(0).map((_, i) => {
    const u = i / 40;
    const v = 0.85 - 0.6 * Math.exp(-3.2 * u);
    return [GX + u * GW, yld(v)] as const;
  });
  const curve = pts.map(([x, y], i) => `${i ? "L" : "M"} ${x} ${y}`).join(" ");
  const mature = yld(0.9);
  const area =
    `M ${GX} ${mature} ` +
    pts.map(([x, y]) => `L ${x} ${y}`).join(" ") +
    ` L ${GX + GW} ${mature} Z`;
  const areaO = progress(frame, t10 + FPS * 2.2, 1);
  return (
    <AbsoluteFill>
      <Header
        n={3}
        text="Le marché sous-estime les coûts d’une transition"
        start={t9}
      />
      <Svg>
        <DrawPath
          d={`M ${GX} ${GY} H ${GX + GW} M ${GX} ${GY} V ${GY - GH - 20}`}
          start={t9 + FPS * 1}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        <DrawPath
          d={`M ${GX} ${mature} H ${GX + GW}`}
          start={t9 + FPS * 1.8}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1.6}
        />
        <path d={area} fill={COLORS.warm} opacity={0.16 * areaO} />
        <DrawPath
          d={curve}
          start={t10}
          duration={2}
          stroke={COLORS.accent}
          width={2.4}
        />
      </Svg>
      <Pos
        start={t9 + FPS * 1}
        left={GX + GW - 300}
        top={GY + 12}
        width={300}
        align="right"
      >
        <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
          temps →
        </div>
      </Pos>
      <Pos start={t9 + FPS * 1} left={GX - 60} top={GY - GH - 70} width={300}>
        <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
          ↑ rendement
        </div>
      </Pos>
      <Pos
        start={t9 + FPS * 2}
        left={GX + GW - 420}
        top={mature - 42}
        width={420}
        align="right"
      >
        <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
          structure actuelle, maîtrisée
        </div>
      </Pos>
      <Pos start={t10 + 10} left={GX + 30} top={yld(0.25) + 16} width={440}>
        <div style={{ ...textStyle(26, 300), color: COLORS.accent }}>
          structure plus performante
        </div>
        <div style={{ ...textStyle(22, 300), color: COLORS.inkSoft }}>
          mais plus difficile à produire
        </div>
      </Pos>
      <Pos
        start={t10 + FPS * 2.6}
        left={GX + 250}
        top={yld(0.72) - 4}
        width={400}
      >
        <div style={{ ...textStyle(26, 300), color: COLORS.warm }}>
          coût de la transition
        </div>
      </Pos>
      <Pos start={t9 + FPS * 1.4} left={GX} top={GY + 50} width={700}>
        <div style={{ ...textStyle(22, 300), color: COLORS.inkSoft }}>
          Courbe schématique, sans échelle
        </div>
      </Pos>
      <Verify
        items={[
          "rendement",
          "qualification",
          "délais",
          "investissement",
          "coût du produit livré",
        ]}
        starts={[
          cues.s(11, 1.4),
          cues.s(11, 2.4),
          cues.s(11, 3.2),
          cues.s(11, 4),
          cues.s(11, 5),
        ]}
      />
    </AbsoluteFill>
  );
};

// ——— Ouverture : trois hypothèses, pistes d'analyse ———
const HYP = [
  { n: 1, text: "un gain de densité surestimé" },
  { n: 2, text: "efficacité ≠ baisse de dépense totale" },
  { n: 3, text: "les coûts d’une transition sous-estimés" },
];

const Intro: React.FC = () => {
  const cues = useCues();
  const t = cues.s(0);
  return (
    <AbsoluteFill>
      <Title
        kicker="Trois hypothèses à tester"
        text="Ce que le marché peut mal interpréter"
        start={t}
        top={150}
      />
      <Svg>
        {HYP.map((h, i) => (
          <DrawPath
            key={h.n}
            d={roundRectPath(270 + i * 470, 330, 440, 170, 14)}
            start={t + FPS * (1.6 + i * 0.5)}
            duration={0.8}
            stroke={COLORS.inkSoft}
            width={1.4}
          />
        ))}
      </Svg>
      {HYP.map((h, i) => (
        <Pos
          key={h.n}
          start={t + FPS * (1.9 + i * 0.5)}
          left={270 + i * 470}
          top={362}
          width={440}
          align="center"
        >
          <div style={small(COLORS.accent)}>HYPOTHÈSE {h.n}</div>
          <div
            style={{ ...textStyle(28, 300), marginTop: 12, padding: "0 24px" }}
          >
            {h.text}
          </div>
        </Pos>
      ))}
      <Takeaway
        start={cues.s(1)}
        left={420}
        top={590}
        width={1080}
        label="ATTENTION"
        color={COLORS.warm}
        size={32}
      >
        Ce sont des pistes d’analyse, pas des erreurs du consensus établies.
      </Takeaway>
    </AbsoluteFill>
  );
};

// Scène 41 — Trois hypothèses à tester.
export const S41: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const tagO = interpolate(
    frame,
    [cues.s(2) - 4, cues.s(2) + 10],
    [0, 1],
    clamp,
  );
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(2)}>
        <Intro />
      </Stage>
      <div style={{ opacity: tagO }}>
        <FictiveTag start={cues.s(2)} label="PISTE D’ANALYSE" />
      </div>
      <Stage from={cues.s(2)} to={cues.s(5)}>
        <H1 />
      </Stage>
      <Stage from={cues.s(5)} to={cues.s(9)}>
        <H2 />
      </Stage>
      <Stage from={cues.s(9)}>
        <H3 />
      </Stage>
    </AbsoluteFill>
  );
};
