import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { circlePath, roundRectPath } from "../components/icons";
import { FlowChain, Icon, Link, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";

const small = (color: string): React.CSSProperties => ({
  ...textStyle(18, 500),
  color,
  letterSpacing: "0.28em",
});

const COSTS = [
  { label: "amortissement ou location du matériel", icon: "server" as const },
  { label: "énergie", icon: "bolt" as const },
  { label: "réseau", icon: "network" as const },
  { label: "hébergement", icon: "building" as const },
  { label: "maintenance", icon: "gear" as const },
  { label: "exploitation", icon: "person" as const },
];

// 1 — La fraction coûts / tokens.
const Fraction: React.FC = () => {
  const cues = useCues();
  const t = cues.s(1);
  const fx0 = 560;
  const fx1 = 1070;
  const fy = 480;
  const period = cues.s(2);
  const list = cues.s(3);
  return (
    <AbsoluteFill>
      <FadeIn
        start={t + FPS * 2.8}
        style={{
          position: "absolute",
          left: 160,
          top: fy - 34,
          width: 380,
          textAlign: "right",
        }}
      >
        <div style={textStyle(46, 200)}>
          Coût par token <span style={{ color: COLORS.accent }}>=</span>
        </div>
      </FadeIn>
      <FadeIn
        start={t + FPS * 4}
        style={{
          position: "absolute",
          left: fx0,
          top: fy - 130,
          width: fx1 - fx0,
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(38, 300), lineHeight: 1.25 }}>
          coûts attribuables
          <br />
          au service
        </div>
      </FadeIn>
      <FadeIn
        start={t + FPS * 5.4}
        style={{
          position: "absolute",
          left: fx0,
          top: fy + 22,
          width: fx1 - fx0,
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(38, 300), color: COLORS.accent }}>
          tokens produits
        </div>
      </FadeIn>
      <Svg>
        <DrawPath
          d={`M ${fx0} ${fy} H ${fx1}`}
          start={t + FPS * 5}
          duration={0.7}
          stroke={COLORS.ink}
        />
        {/* Même période : une réglette de temps sous la fraction. */}
        <DrawPath
          d={`M ${fx0} 640 V 660 M ${fx0} 650 H ${fx1} M ${fx1} 640 V 660`}
          start={period}
          duration={1}
          stroke={COLORS.warm}
        />
        <SvgText
          x={(fx0 + fx1) / 2}
          y={700}
          text="numérateur et dénominateur : même période"
          start={period + 12}
          size={24}
          color={COLORS.warm}
        />
        {/* Postes de coûts qui alimentent le numérateur. */}
        {COSTS.map((c, i) => {
          const y = 300 + i * 84;
          const at = list + FPS * (1.2 + i * 1.1);
          return (
            <g key={c.label}>
              <Icon
                name={c.icon}
                x={1270}
                y={y}
                size={20}
                start={at}
                color={COLORS.inkSoft}
                width={1.6}
              />
              <SvgText
                x={1310}
                y={y}
                text={c.label}
                start={at + 4}
                size={24}
                anchor="start"
              />
              <DrawPath
                d={`M 1235 ${y} C 1170 ${y}, 1150 ${fy - 80}, 1085 ${fy - 80}`}
                start={at + 6}
                duration={0.6}
                stroke={COLORS.inkFaint}
                width={1.2}
              />
            </g>
          );
        })}
      </Svg>
      <FadeIn
        start={list}
        style={{ position: "absolute", left: 1250, top: 220 }}
      >
        <div style={small(COLORS.inkSoft)}>LES COÛTS PEUVENT COMPRENDRE</div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// 2 — Comparer deux systèmes à conditions égales.
const Compare: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(4);
  const rows = [
    "même modèle",
    "même qualité de réponse",
    "mêmes exigences de délai",
  ];
  const tk = cues.s(5);
  const bars = progress(frame, tk + FPS * 1.5, 1.2);
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={roundRectPath(300, 330, 220, 250, 14)}
          start={t}
          duration={0.8}
          stroke={COLORS.ink}
        />
        <DrawPath
          d={roundRectPath(1400, 330, 220, 250, 14)}
          start={t + 6}
          duration={0.8}
          stroke={COLORS.ink}
        />
        <Icon name="server" x={410} y={430} size={42} start={t + 10} />
        <Icon name="server" x={1510} y={430} size={42} start={t + 16} />
        <SvgText x={410} y={530} text="Système A" start={t + 14} size={26} />
        <SvgText x={1510} y={530} text="Système B" start={t + 20} size={26} />
        {rows.map((r, i) => {
          const y = 380 + i * 75;
          const at = t + FPS * (1.6 + i * 1.5);
          return (
            <g key={r}>
              <DrawPath
                d={`M 540 ${y} H 700 M 1220 ${y} H 1380`}
                start={at}
                duration={0.6}
                stroke={COLORS.inkFaint}
                width={1.2}
              />
              <SvgText
                x={960}
                y={y}
                text={r}
                start={at + 6}
                size={28}
                color={COLORS.accent}
              />
            </g>
          );
        })}
        {/* Entrée ≠ sortie */}
        <SvgText
          x={560}
          y={700}
          text="tokens d’entrée"
          start={tk}
          size={28}
          anchor="end"
        />
        <SvgText
          x={560}
          y={780}
          text="tokens de sortie"
          start={tk + 10}
          size={28}
          anchor="end"
        />
        {bars > 0 && (
          <>
            <path
              d={roundRectPath(600, 686, 260 * bars, 28, 8)}
              fill={COLORS.accent}
              opacity={0.35}
            />
            <path
              d={roundRectPath(600, 766, 520 * bars, 28, 8)}
              fill={COLORS.warm}
              opacity={0.35}
            />
          </>
        )}
        <SvgText
          x={1180}
          y={740}
          text={"ressources mobilisées\nnon nécessairement identiques"}
          start={tk + FPS * 2.2}
          size={24}
          color={COLORS.inkSoft}
          anchor="start"
        />
      </Svg>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 250,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={small(COLORS.inkSoft)}>
          POUR COMPARER DEUX SYSTÈMES, FIXE
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// 3 — Ce dont dépend le résultat.
const FACTORS = [
  "prix d’achat",
  "utilisation réelle",
  "logiciel",
  "travail demandé",
  "durée de compétitivité\ndu matériel",
];
const Depends: React.FC = () => {
  const cues = useCues();
  const t = cues.s(6);
  const cx = 960;
  const cy = 570;
  return (
    <AbsoluteFill>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 250,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={small(COLORS.inkSoft)}>LE RÉSULTAT DÉPEND</div>
      </FadeIn>
      <Svg>
        <DrawPath
          d={circlePath(cx, cy, 110)}
          start={t}
          duration={0.9}
          stroke={COLORS.accent}
        />
        <SvgText
          x={cx}
          y={cy}
          text={"coût\npar token"}
          start={t + 10}
          size={30}
          weight={300}
          color={COLORS.accent}
        />
        {FACTORS.map((f, i) => {
          const a = -Math.PI / 2 + (i / FACTORS.length) * Math.PI * 2;
          const x = cx + Math.cos(a) * 520;
          const y = cy + Math.sin(a) * 230;
          const at = t + FPS * (2 + i * 1.3);
          return (
            <g key={f}>
              <SvgText x={x} y={y} text={f} start={at} size={28} />
              <Link
                from={[cx + Math.cos(a) * 330, cy + Math.sin(a) * 160]}
                to={[cx + Math.cos(a) * 125, cy + Math.sin(a) * 118]}
                start={at + 6}
              />
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

// Scène 32 — Le coût par token.
export const S32: React.FC = () => {
  const cues = useCues();
  const t = cues.s(7);
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(4)}>
        <Title
          kicker="Du matériel aux tokens et à la marge"
          text="Une première approximation du coût par token"
          start={cues.s(0)}
          top={100}
        />
        <Fraction />
      </Stage>
      <Stage from={cues.s(4)} to={cues.s(6)}>
        <Title
          kicker="Coût par token"
          text="Comparer à conditions égales"
          start={cues.s(4)}
          top={100}
        />
        <Compare />
      </Stage>
      <Stage from={cues.s(6)} to={t}>
        <Title
          kicker="Coût par token"
          text="Un résultat, plusieurs dépendances"
          start={cues.s(6)}
          top={100}
        />
        <Depends />
      </Stage>
      <Stage from={t}>
        <Title
          kicker="Coût par token"
          text="Un effet en chaîne possible"
          start={t}
          top={100}
        />
        <FlowChain
          y={500}
          h={150}
          size={28}
          items={[
            "Amélioration\ntechnique",
            "Coût unitaire ↓",
            "Demande ↑",
            "Obsolescence des\nanciens équipements ↑",
          ]}
          starts={[t + 10, t + FPS * 2.6, t + FPS * 4.2, t + FPS * 5.6]}
          highlight={[3]}
        />
      </Stage>
    </AbsoluteFill>
  );
};
