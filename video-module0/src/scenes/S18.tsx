import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { circlePath, icons, roundRectPath } from "../components/icons";
import {
  Box,
  Callout,
  Icon,
  Link,
  Svg,
  SvgText,
  Title,
} from "../components/kit";
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

// Coupe d'un substrat multicouche : cœur, pistes de cuivre et films isolants ABF.
const CrossSection: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const x0 = 470;
  const w = 720;
  const layers = [
    { kind: "cu", y: 262 },
    { kind: "abf", y: 274 },
    { kind: "cu", y: 312 },
    { kind: "abf", y: 324 },
    { kind: "core", y: 362 },
    { kind: "abf", y: 412 },
    { kind: "cu", y: 450 },
    { kind: "abf", y: 462 },
    { kind: "cu", y: 500 },
  ];
  return (
    <g>
      {layers.map((l, i) => {
        const at = start + i * 4;
        if (l.kind === "abf") {
          const o = progress(frame, at, 0.6);
          return (
            <g key={i}>
              <rect
                x={x0}
                y={l.y}
                width={w * o}
                height={36}
                fill={COLORS.accent}
                opacity={0.16}
              />
              <DrawPath
                d={`M ${x0} ${l.y} H ${x0 + w} M ${x0} ${l.y + 36} H ${x0 + w}`}
                start={at}
                duration={0.6}
                stroke={COLORS.accent}
                width={1.2}
              />
            </g>
          );
        }
        if (l.kind === "core") {
          return (
            <DrawPath
              key={i}
              d={roundRectPath(x0, l.y, w, 50, 4)}
              start={at}
              duration={0.7}
              stroke={COLORS.inkSoft}
              width={1.4}
            />
          );
        }
        // Pistes de cuivre, segments discontinus.
        const segs = [0, 1, 2, 3, 4, 5]
          .map((k) => {
            const sx = x0 + 20 + k * 120 + (i % 3) * 18;
            return `M ${sx} ${l.y + 6} H ${sx + 70}`;
          })
          .join(" ");
        return (
          <DrawPath
            key={i}
            d={segs}
            start={at}
            duration={0.6}
            stroke={COLORS.ink}
            width={5}
          />
        );
      })}
      {/* Vias verticaux qui traversent les films */}
      {[0, 2, 4].map((k) => {
        const vx = x0 + 55 + k * 120 + 18;
        return (
          <DrawPath
            key={k}
            d={`M ${vx} 268 V 506`}
            start={start + 40}
            duration={0.8}
            stroke={COLORS.inkSoft}
            width={2}
          />
        );
      })}
    </g>
  );
};

const CHAIN = [
  { label: "Ajinomoto", sub: "film ABF", variant: "side" as const },
  { label: "Fabricants", sub: "de substrats", variant: "default" as const },
  { label: "Packaging", sub: "boîtier", variant: "default" as const },
  { label: "Accélérateur", sub: "", variant: "hi" as const },
];
const CX = [180, 600, 1020, 1440];
const CW = 320;
const CY = 640;

const Film: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const flow = progress(frame, cues.s(3, 0.4), 2.2);
  return (
    <AbsoluteFill>
      <Title text="Un fournisseur indirect à comprendre" start={cues.s(0)} />
      <Svg>
        <CrossSection start={t + 10} />
        <Link
          from={[1300, 292]}
          to={[1200, 292]}
          start={t + 60}
          color={COLORS.accent}
        />
        {CHAIN.map((c, i) => {
          const at =
            i === 0
              ? cues.s(2)
              : i === 1
                ? cues.s(3)
                : cues.s(2, 0.8 + i * 0.3);
          return (
            <g key={c.label}>
              <Box
                x={CX[i]}
                y={CY}
                w={CW}
                h={96}
                label={c.label}
                sub={c.sub || undefined}
                start={at}
                variant={c.variant}
                size={28}
              />
              {i < 3 && (
                <Link
                  from={[CX[i] + CW, CY + 48]}
                  to={[CX[i + 1], CY + 48]}
                  start={i === 0 ? cues.s(3, 0.3) : at + 12}
                  color={i === 0 ? COLORS.warm : COLORS.inkSoft}
                />
              )}
            </g>
          );
        })}
        {/* Le film voyage vers les fabricants de substrats. */}
        {flow > 0 && flow < 1 && (
          <circle
            cx={CX[0] + CW + flow * (CX[1] - CX[0] - CW)}
            cy={CY + 48}
            r={6}
            fill={COLORS.warm}
          />
        )}
        {/* Accolade : en amont du package */}
        <DrawPath
          d={`M ${CX[0] + 10} ${CY + 120} V ${CY + 136} H ${CX[1] + CW - 10} V ${CY + 120}`}
          start={cues.s(2, 0.8)}
          duration={0.8}
          stroke={COLORS.warm}
          width={1.5}
        />
        <SvgText
          x={(CX[0] + CX[1] + CW) / 2}
          y={CY + 172}
          text="en amont du package"
          start={cues.s(2, 1.2)}
          size={26}
          color={COLORS.warm}
        />
        <SvgText
          x={CX[0] + CW - 14}
          y={CY - 22}
          text="[2]"
          start={cues.s(4)}
          size={22}
          anchor="end"
          color={COLORS.inkSoft}
        />
      </Svg>
      <FadeIn
        start={t + 50}
        style={{ position: "absolute", left: 1320, top: 250, width: 440 }}
      >
        <div style={label(COLORS.accent)}>ABF</div>
        <div style={{ ...textStyle(30, 300), marginTop: 10, lineHeight: 1.3 }}>
          Ajinomoto Build-up Film
        </div>
        <div
          style={{
            ...textStyle(26, 300),
            color: COLORS.inkSoft,
            marginTop: 12,
            lineHeight: 1.35,
          }}
        >
          film isolant de substrats multicouches performants
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Descendre les rangs de fournisseurs, jusqu'à une fonction critique cachée dans un groupe.
const TIERS = [
  { x: 1480, label: "Accélérateur", rank: "CLIENT FINAL" },
  { x: 1090, label: "Packaging", rank: "RANG 1" },
  { x: 700, label: "Substrats", rank: "RANG 2" },
  { x: 310, label: "Ajinomoto", rank: "RANG 3" },
];
const TY = 500;

const Tiers: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(5);
  const sweep = progress(frame, t + 20, 3.2);
  const mx = TIERS[0].x - sweep * (TIERS[0].x - TIERS[3].x);
  const g = cues.s(6);
  return (
    <AbsoluteFill>
      <Title text="Descendre au 2e et au 3e rang de fournisseurs" start={t} />
      <Svg>
        {TIERS.map((n, i) => {
          const at = t + 6 + i * 8;
          const deep = i >= 2;
          return (
            <g key={n.label}>
              <SvgText
                x={n.x}
                y={300}
                text={n.rank}
                start={at}
                size={22}
                weight={500}
                spacing="0.24em"
                color={deep ? COLORS.warm : COLORS.inkSoft}
              />
              <Box
                x={n.x - 140}
                y={TY - 42}
                w={280}
                h={84}
                label={n.label}
                start={at}
                variant={i === 0 ? "hi" : i === 3 ? "side" : "default"}
                size={28}
              />
              {i > 0 && (
                <Link
                  from={[n.x + 140, TY]}
                  to={[TIERS[i - 1].x - 140, TY]}
                  start={at + 6}
                />
              )}
            </g>
          );
        })}
        {sweep > 0 && (
          <path
            d={icons.magnifier(mx, 390, 26)}
            fill="none"
            stroke={COLORS.accent}
            strokeWidth={2}
            opacity={Math.min(1, sweep * 5) * (1 - progress(frame, g, 0.5))}
          />
        )}
        {/* Un groupe connu pour une tout autre activité, avec une fonction critique en son cœur. */}
        <DrawPath
          d={circlePath(TIERS[3].x, TY, 166)}
          start={g}
          duration={1.2}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        <circle
          cx={TIERS[3].x}
          cy={TY}
          r={166}
          fill={COLORS.warm}
          opacity={0.05 * progress(frame, g + 20, 0.8)}
        />
        <SvgText
          x={TIERS[3].x}
          y={TY + 90}
          text="fonction critique"
          start={g + 30}
          size={24}
          color={COLORS.warm}
        />
        <SvgText
          x={TIERS[3].x + 20}
          y={TY + 240}
          text="un groupe connu pour une tout autre activité"
          start={g + 24}
          size={26}
          anchor="start"
          color={COLORS.inkSoft}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Exposition technique forte, exposition financière faible.
const Exposure: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(7);
  const bar = progress(frame, cues.s(8), 1.4);
  const slice = progress(frame, cues.s(8, 2.5), 1.2);
  const grow = progress(frame, cues.s(9, 2.5), 1.4);
  const px = 1330;
  const py = 480;
  const r = 170;
  const sector = (deg: number) => {
    const a = (deg * Math.PI) / 180;
    return `M ${px} ${py} L ${px} ${py - r} A ${r} ${r} 0 ${deg > 180 ? 1 : 0} 1 ${px + r * Math.sin(a)} ${py - r * Math.cos(a)} Z`;
  };
  return (
    <AbsoluteFill>
      <Title text="Exposition technique et exposition financière" start={t} />
      <Svg>
        {/* Jauge technique */}
        <DrawPath
          d={roundRectPath(520, 290, 90, 380, 8)}
          start={t + 10}
          duration={0.8}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        <rect
          x={526}
          y={664 - 340 * bar}
          width={78}
          height={340 * bar}
          rx={4}
          fill={COLORS.accent}
          opacity={0.55}
        />
        {/* Revenus du groupe */}
        <DrawPath
          d={circlePath(px, py, r)}
          start={t + 16}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        {slice > 0 && (
          <path d={sector(26 * slice)} fill={COLORS.warm} opacity={0.75} />
        )}
        {grow > 0 && (
          <path
            d={sector(26 + 34 * grow)}
            fill="none"
            stroke={COLORS.warm}
            strokeWidth={2}
            strokeDasharray="6 8"
          />
        )}
      </Svg>
      <FadeIn
        start={t + 10}
        style={{
          position: "absolute",
          left: 250,
          top: 700,
          width: 630,
          textAlign: "center",
        }}
      >
        <div style={label(COLORS.accent)}>EXPOSITION TECHNIQUE</div>
        <div style={{ ...textStyle(28, 300), marginTop: 10 }}>
          activité technologique intéressante
        </div>
      </FadeIn>
      <FadeIn
        start={t + 16}
        style={{
          position: "absolute",
          left: px - 330,
          top: 700,
          width: 660,
          textAlign: "center",
        }}
      >
        <div style={label(COLORS.warm)}>EXPOSITION FINANCIÈRE</div>
        <div style={{ ...textStyle(28, 300), marginTop: 10 }}>
          … mais petite part des revenus du groupe
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(9)}
        style={{ position: "absolute", left: 830, top: 300, width: 300 }}
      >
        <div style={label(COLORS.warm)}>À ESTIMER</div>
        <div
          style={{
            ...textStyle(26, 300),
            marginTop: 12,
            lineHeight: 1.35,
          }}
        >
          contribution réelle aux bénéfices
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(9, 2.5)}
        style={{ position: "absolute", left: 830, top: 460, width: 300 }}
      >
        <div
          style={{
            ...textStyle(26, 300),
            lineHeight: 1.35,
            color: COLORS.warm,
          }}
        >
          capacité de cette contribution à croître
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const QUESTIONS = [
  { icon: "chart" as const, text: "Combien pèse-t-elle ?" },
  { icon: "stack" as const, text: "Combien d’unités ?" },
  { icon: "euro" as const, text: "Quelle marge ?" },
];

const Analyst: React.FC = () => {
  const cues = useCues();
  const t = cues.s(12);
  return (
    <AbsoluteFill>
      <Callout kind="analyst" start={cues.s(10)} y={170} width={1400} size={36}>
        La prochaine question n’est pas seulement{" "}
        <span style={{ color: COLORS.inkSoft }}>
          « est-ce indispensable ? »
        </span>
      </Callout>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 420,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(36, 300), color: COLORS.warm }}>
          mais : combien cela pèse-t-il, combien d’unités sont vendues, et avec
          quelle marge ?
        </div>
      </FadeIn>
      <Svg>
        {QUESTIONS.map((q, i) => (
          <g key={q.text}>
            <DrawPath
              d={circlePath(560 + i * 400, 640, 62)}
              start={t + FPS * (0.8 + i * 1.3)}
              duration={0.7}
              stroke={COLORS.warm}
              width={1.6}
            />
            <Icon
              name={q.icon}
              x={560 + i * 400}
              y={640}
              size={28}
              start={t + FPS * (1 + i * 1.3)}
              color={COLORS.warm}
            />
            <SvgText
              x={560 + i * 400}
              y={750}
              text={q.text}
              start={t + FPS * (1.1 + i * 1.3)}
              size={28}
            />
          </g>
        ))}
      </Svg>
    </AbsoluteFill>
  );
};

// Scène 18 — Un fournisseur indirect : Ajinomoto et le film ABF.
export const S18: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(5)}>
        <Film />
      </Stage>
      <Stage from={cues.s(5)} to={cues.s(7)}>
        <Tiers />
      </Stage>
      <Stage from={cues.s(7)} to={cues.s(10)}>
        <Exposure />
      </Stage>
      <Stage from={cues.s(10)}>
        <Analyst />
      </Stage>
    </AbsoluteFill>
  );
};
