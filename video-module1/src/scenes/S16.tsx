import React from "react";
import { getPointAtLength, getLength } from "@remotion/paths";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT } from "../theme";
import { gateBody } from "./S15";

const Bit: React.FC<{
  x: number;
  y: number;
  v: number | string;
  size?: number;
  o?: number;
}> = ({ x, y, v, size = 38, o = 1 }) => (
  <text
    x={x}
    y={y + size * 0.35}
    textAnchor="middle"
    fontFamily={FONT}
    fontSize={size}
    fontWeight={300}
    fill={v === 1 ? COLORS.accent : v === 0 ? COLORS.inkSoft : COLORS.warm}
    opacity={o}
  >
    {v}
  </text>
);

// Beats 1 et 2 : combinatoire à gauche, séquentiel à droite.
const Compare: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t1 = cues.beat(1);
  const t2 = cues.beat(2);
  // Combinatoire : les entrées changent, la sortie suit aussitôt.
  const k = Math.max(0, Math.floor((frame - t1 - 40) / 28));
  const A = [0, 1, 1, 0, 1][k % 5];
  const B = [1, 1, 0, 0, 1][k % 5];
  const S = A & B ? 0 : 1;
  const showC = frame > t1 + 40;
  // Séquentiel : le registre ne change qu'aux fronts d'horloge.
  const tick = Math.max(0, Math.floor((frame - t2 - 50) / 40));
  const flash = frame > t2 + 50 ? 1 - ((frame - t2 - 50) % 40) / 14 : 0;
  const reg = new Array(8)
    .fill(0)
    .map((_, i) => ((tick * 5 + i * 3) % 7 > 3 ? 1 : 0));
  const showR = frame > t2 + 50;
  return (
    <AbsoluteFill>
      <Svg>
        {/* Combinatoire */}
        <SvgText
          x={520}
          y={250}
          text="COMBINATOIRE"
          start={t1}
          size={24}
          weight={500}
          spacing="0.3em"
          color={COLORS.accent}
        />
        <DrawPath
          d={roundRectPath(420, 360, 200, 160, 14)}
          start={t1 + 4}
          duration={0.7}
        />
        <SvgText x={520} y={440} text="logique" start={t1 + 10} size={28} />
        <DrawPath
          d="M 240 400 H 420 M 240 480 H 420"
          start={t1 + 10}
          duration={0.6}
          stroke={COLORS.inkSoft}
        />
        <Arrow
          x1={620}
          y1={440}
          x2={790}
          y2={440}
          start={t1 + 14}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={220}
          y={400}
          text="A"
          start={t1 + 12}
          size={26}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <SvgText
          x={220}
          y={480}
          text="B"
          start={t1 + 12}
          size={26}
          anchor="end"
          color={COLORS.inkSoft}
        />
        {showC && (
          <g>
            <Bit x={320} y={372} v={A} />
            <Bit x={320} y={452} v={B} />
            <Bit x={720} y={410} v={S} />
          </g>
        )}
        <SvgText
          x={520}
          y={600}
          text={
            "sortie = f(entrées présentes)\nréagit dès que les entrées changent"
          }
          start={t1 + 30}
          size={26}
          color={COLORS.ink}
        />
        <SvgText
          x={520}
          y={700}
          text="aucune mémoire"
          start={t1 + 50}
          size={24}
          color={COLORS.inkSoft}
        />
        {/* Séparateur */}
        <DrawPath
          d="M 960 240 V 760"
          start={t2}
          duration={0.8}
          stroke={COLORS.inkFaint}
          width={1}
        />
        {/* Séquentiel */}
        <SvgText
          x={1380}
          y={250}
          text="SÉQUENTIEL"
          start={t2}
          size={24}
          weight={500}
          spacing="0.3em"
          color={COLORS.warm}
        />
        <DrawPath
          d={roundRectPath(1060, 360, 180, 160, 14)}
          start={t2 + 4}
          duration={0.7}
        />
        <SvgText x={1150} y={440} text="logique" start={t2 + 10} size={28} />
        <Arrow
          x1={1240}
          y1={440}
          x2={1320}
          y2={440}
          start={t2 + 14}
          stroke={COLORS.inkSoft}
        />
        {/* Registre : rangée de 8 bits */}
        <DrawPath
          d={roundRectPath(1320, 400, 400, 80, 10)}
          start={t2 + 16}
          duration={0.7}
          stroke={COLORS.warm}
        />
        {new Array(7).fill(0).map((_, i) => (
          <DrawPath
            key={i}
            d={`M ${1370 + i * 50} 400 V 480`}
            start={t2 + 22}
            duration={0.3}
            stroke={COLORS.inkFaint}
            width={1}
          />
        ))}
        {showR &&
          reg.map((v, i) => (
            <Bit key={i} x={1345 + i * 50} y={440} v={v} size={32} />
          ))}
        {showR && flash > 0 && (
          <path
            d={roundRectPath(1320, 400, 400, 80, 10)}
            fill={COLORS.warm}
            opacity={0.15 * flash}
          />
        )}
        {/* Boucle d'état */}
        <DrawPath
          d="M 1520 480 V 590 H 1020 V 480 H 1060"
          start={t2 + 30}
          duration={1}
          stroke={COLORS.warm}
        />
        <DrawPath
          d="M 1048 470 L 1060 480 L 1048 490"
          start={t2 + 58}
          duration={0.3}
          stroke={COLORS.warm}
        />
        <SvgText
          x={1270}
          y={620}
          text="état réutilisé à l’étape suivante"
          start={t2 + 40}
          size={24}
          color={COLORS.warm}
        />
        {/* Horloge */}
        <DrawPath
          d="M 1440 340 v -30 h 20 v 30 h 20 v -30 h 20 v 30"
          start={t2 + 36}
          duration={0.7}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={1580}
          y={326}
          text="horloge"
          start={t2 + 40}
          size={22}
          anchor="start"
          color={COLORS.inkSoft}
        />
        <Arrow
          x1={1520}
          y1={350}
          x2={1520}
          y2={396}
          start={t2 + 42}
          duration={0.4}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={1520}
          y={700}
          text={"registre : des bits gardés\npour les prochaines étapes"}
          start={cues.s(3)}
          size={26}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Beat 3 : cellule de mémoire statique, deux inverseurs en boucle.
const LOOP = "M 1030 400 H 1150 V 620 H 1030 M 890 620 H 770 V 400 H 890";
const Sram: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(3);
  const cut = cues.s(4, 5.2);
  const off = progress(frame, cut, 0.6);
  const on = progress(frame, t + 40, 0.6) * (1 - off);
  const right = "M 1030 400 H 1150 V 620 H 1030";
  const left = "M 890 620 H 770 V 400 H 890";
  const dots = [right, left].flatMap((d, j) => {
    const L = getLength(d);
    return [0, 1, 2].map((i) => {
      const p = getPointAtLength(
        d,
        (((frame * 3 + (i * L) / 3 + j * 40) % L) + L) % L,
      );
      return (
        <circle
          key={`${j}${i}`}
          cx={p?.x ?? 0}
          cy={p?.y ?? 0}
          r={4.5}
          fill={j === 0 ? COLORS.accent : COLORS.inkSoft}
          opacity={on}
        />
      );
    });
  });
  return (
    <AbsoluteFill>
      <Svg>
        {/* Inverseur du haut, vers la droite */}
        <DrawPath
          d={gateBody("NON", 960, 400, 70)}
          start={t + 4}
          duration={0.8}
        />
        {/* Inverseur du bas, vers la gauche (miroir) */}
        <g transform="translate(1920 0) scale(-1 1)">
          <DrawPath
            d={gateBody("NON", 960, 620, 70)}
            start={t + 12}
            duration={0.8}
          />
        </g>
        <DrawPath
          d={LOOP}
          start={t + 20}
          duration={1.2}
          stroke={COLORS.inkSoft}
        />
        {dots}
        <Bit
          x={1210}
          y={510}
          v={off > 0.5 ? "?" : 1}
          size={48}
          o={progress(frame, t + 40, 0.5)}
        />
        <Bit
          x={710}
          y={510}
          v={off > 0.5 ? "?" : 0}
          size={48}
          o={progress(frame, t + 40, 0.5)}
        />
        <SvgText
          x={960}
          y={300}
          text={off > 0.5 ? "alimentation coupée" : "alimenté (VDD)"}
          start={t + 30}
          size={26}
          weight={400}
          color={off > 0.5 ? COLORS.inkSoft : COLORS.warm}
        />
        <SvgText
          x={960}
          y={740}
          text={
            "chaque inverseur maintient l’entrée de l’autre :\nl’état 1 / 0 se conserve"
          }
          start={t + 50}
          size={28}
        />
      </Svg>
      <FadeIn
        start={cut + 10}
        style={{
          position: "absolute",
          top: 820,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(26, 400), color: COLORS.warm }}>
          sans alimentation, l’état est perdu
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 16 — Calculer et mémoriser.
export const S16: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Title
        kicker="Deux usages distincts"
        text="Calculer et mémoriser"
        start={cues.s(0)}
        top={100}
      />
      <Stage from={0} to={cues.beat(1)}>
        <div
          style={{
            position: "absolute",
            top: 430,
            width: "100%",
            display: "flex",
            justifyContent: "center",
            gap: 220,
          }}
        >
          <FadeIn start={cues.s(0, 1)}>
            <div style={{ ...textStyle(56, 200), color: COLORS.accent }}>
              calculer
            </div>
            <div
              style={{
                ...textStyle(26, 300),
                color: COLORS.inkSoft,
                marginTop: 12,
              }}
            >
              transformer des entrées
            </div>
          </FadeIn>
          <FadeIn start={cues.s(0, 1.8)}>
            <div style={{ ...textStyle(56, 200), color: COLORS.warm }}>
              mémoriser
            </div>
            <div
              style={{
                ...textStyle(26, 300),
                color: COLORS.inkSoft,
                marginTop: 12,
              }}
            >
              conserver un état
            </div>
          </FadeIn>
        </div>
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(3)}>
        <Compare />
      </Stage>
      <Stage from={cues.beat(3)}>
        <FadeIn
          start={cues.beat(3)}
          style={{
            position: "absolute",
            top: 210,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.accent,
              letterSpacing: "0.3em",
            }}
          >
            CELLULE DE MÉMOIRE STATIQUE (SRAM)
          </div>
        </FadeIn>
        <Sram />
      </Stage>
    </AbsoluteFill>
  );
};
