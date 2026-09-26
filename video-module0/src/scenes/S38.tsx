import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { circlePath, roundRectPath } from "../components/icons";
import { Icon, Svg, SvgText, Title } from "../components/kit";
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

// Équivalence en grand, en haut de l'écran.
const Eq: React.FC<{ start: number; children: React.ReactNode }> = ({
  start,
  children,
}) => (
  <FadeIn
    start={start}
    style={{
      position: "absolute",
      top: 215,
      width: "100%",
      textAlign: "center",
    }}
  >
    <div style={textStyle(66, 200)}>{children}</div>
  </FadeIn>
);

// Ligne « utilité » en bas de la zone utile.
const Use: React.FC<{ start: number; text: string; top?: number }> = ({
  start,
  text,
  top = 770,
}) => (
  <FadeIn
    start={start}
    style={{ position: "absolute", top, width: "100%", textAlign: "center" }}
  >
    <div
      style={{
        ...textStyle(20, 500),
        color: COLORS.inkSoft,
        letterSpacing: "0.3em",
        marginBottom: 10,
      }}
    >
      UTILITÉ
    </div>
    <div style={{ ...textStyle(34, 300), color: COLORS.accent }}>{text}</div>
  </FadeIn>
);

// Compteur avec séparateur de milliers dès 1 000 (8 760, 1 000).
const Num: React.FC<{ to: number; start: number; duration?: number }> = ({
  to,
  start,
  duration = 1.5,
}) => {
  const frame = useCurrentFrame();
  const v = Math.round(to * progress(frame, start, duration));
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {v.toLocaleString("fr-FR")}
    </span>
  );
};

const Op: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: COLORS.accent }}>{children}</span>
);

// 1 octet = 8 bits : huit cases s'allument une à une.
const Byte: React.FC = () => {
  const cues = useCues();
  const t = cues.s(1);
  const bits = [0, 1, 1, 0, 1, 0, 0, 1];
  const x0 = 600;
  return (
    <AbsoluteFill>
      <Eq start={t}>
        1 octet <Op>=</Op> <Counter to={8} start={t + 10} duration={1.4} /> bits
      </Eq>
      <Svg>
        <DrawPath
          d={roundRectPath(x0 - 16, 420, 752, 122, 16)}
          start={t + 6}
          duration={0.9}
          stroke={COLORS.accent}
        />
        {bits.map((b, i) => (
          <g key={i}>
            <DrawPath
              d={roundRectPath(x0 + i * 90, 436, 80, 90, 8)}
              start={t + 10 + i * 5}
              duration={0.4}
              stroke={COLORS.inkSoft}
              width={1.4}
            />
            <SvgText
              x={x0 + i * 90 + 40}
              y={481}
              text={String(b)}
              start={t + 14 + i * 5}
              size={40}
              weight={200}
            />
          </g>
        ))}
        <SvgText
          x={960}
          y={590}
          text="1 case = 1 bit · 8 cases = 1 octet"
          start={t + 60}
          size={24}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={640}
          y={670}
          text="Réseau : débits souvent en bits/s"
          start={cues.s(1, 2.4)}
          size={26}
        />
        <SvgText
          x={1280}
          y={670}
          text="Mémoire : en octets"
          start={cues.s(1, 3)}
          size={26}
        />
      </Svg>
      <Use
        start={cues.s(1, 2)}
        text="Éviter la confusion entre débits réseau et mémoire"
      />
    </AbsoluteFill>
  );
};

// 1 Go = 10⁹ octets (décimal) ; le Gio est binaire.
const Giga: React.FC = () => {
  const cues = useCues();
  const t = cues.s(2);
  const gio = cues.s(2, 6.2);
  return (
    <AbsoluteFill>
      <Eq start={t}>
        1 Go <Op>=</Op> 10⁹ octets
      </Eq>
      <Svg>
        <Icon
          name="memory"
          x={960}
          y={390}
          size={34}
          start={t + 8}
          color={COLORS.accent}
        />
      </Svg>
      <div
        style={{
          position: "absolute",
          top: 460,
          width: "100%",
          textAlign: "center",
        }}
      >
        <FadeIn start={t + 14}>
          <div style={textStyle(54, 200)}>
            <Counter to={1e9} start={t + 14} duration={2.4} /> octets
          </div>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.inkSoft,
              letterSpacing: "0.28em",
              marginTop: 8,
            }}
          >
            CONVENTION DÉCIMALE
          </div>
        </FadeIn>
        <FadeIn start={gio} style={{ marginTop: 44 }}>
          <div style={{ ...textStyle(40, 200), color: COLORS.warm }}>
            1 Gio = 2³⁰ = <Counter to={1073741824} start={gio} duration={1.6} />{" "}
            octets
          </div>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.warm,
              letterSpacing: "0.28em",
              marginTop: 8,
              opacity: 0.8,
            }}
          >
            CONVENTION BINAIRE, DIFFÉRENTE
          </div>
        </FadeIn>
      </div>
      <Use start={cues.s(2, 4)} text="Mesurer une capacité" />
    </AbsoluteFill>
  );
};

// 1 To/s : un flux de particules traverse un tuyau.
const Flow: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(3);
  const x0 = 420;
  const x1 = 1500;
  const on = progress(frame, t + 20, 0.6);
  return (
    <AbsoluteFill>
      <Eq start={t}>
        1 To/s <Op>=</Op> 10¹² octets par seconde
      </Eq>
      <Svg>
        <DrawPath
          d={`M ${x0} 440 H ${x1}`}
          start={t + 8}
          duration={1}
          stroke={COLORS.inkSoft}
        />
        <DrawPath
          d={`M ${x0} 560 H ${x1}`}
          start={t + 8}
          duration={1}
          stroke={COLORS.inkSoft}
        />
        {new Array(36).fill(0).map((_, i) => {
          const speed = 260 + random(`v${i}`) * 120;
          const x =
            x0 +
            ((random(`p${i}`) * (x1 - x0) + ((frame - t) / FPS) * speed) %
              (x1 - x0));
          const y = 455 + random(`y${i}`) * 90;
          const edge = Math.min(1, (x - x0) / 60, (x1 - x) / 60);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={4}
              fill={COLORS.accent}
              opacity={on * 0.85 * Math.max(0, edge)}
            />
          );
        })}
        <Icon
          name="network"
          x={x1 + 70}
          y={500}
          size={28}
          start={t + 30}
          color={COLORS.accent}
        />
      </Svg>
      <div
        style={{
          position: "absolute",
          top: 610,
          width: "100%",
          textAlign: "center",
        }}
      >
        <FadeIn start={t + 24}>
          <div style={textStyle(44, 200)}>
            <Counter to={1e12} start={t + 24} duration={2.4} /> octets
            <span style={{ color: COLORS.accent }}> chaque seconde</span>
          </div>
        </FadeIn>
      </div>
      <Use start={cues.s(3, 3)} text="Mesurer un débit" />
    </AbsoluteFill>
  );
};

// Échelle des puissances : W → kW → MW → GW, chaque marche × 1 000.
const STEPS = [
  { unit: "W", name: "watt", icon: "chip" as const, tag: "composant" },
  { unit: "kW", name: "kilowatt", icon: "rack" as const, tag: "" },
  { unit: "MW", name: "mégawatt", icon: "building" as const, tag: "site" },
  {
    unit: "GW",
    name: "gigawatt",
    icon: "factory" as const,
    tag: "grande infrastructure",
  },
];
const Ladder: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(4);
  const at = [t, t + 10, cues.s(4, 2.6), cues.s(5)];
  const base = 720;
  return (
    <AbsoluteFill>
      <Svg>
        {STEPS.map((s, i) => {
          const x = 250 + i * 370;
          const top = 610 - i * 100;
          const hi = i === 0 || i === 2 || i === 3;
          const color = i === 3 ? COLORS.accent : COLORS.ink;
          return (
            <g key={s.unit}>
              <path
                d={`M ${x} ${base} V ${top} H ${x + 310} V ${base}`}
                fill={COLORS.accent}
                opacity={0.05 * progress(frame, at[i] + 10, 0.6)}
              />
              <DrawPath
                d={`M ${x} ${base} V ${top} H ${x + 310} V ${base}`}
                start={at[i]}
                duration={0.8}
                stroke={color}
              />
              <SvgText
                x={x + 155}
                y={top + 50}
                text={s.unit}
                start={at[i] + 8}
                size={52}
                weight={200}
                color={color}
              />
              <SvgText
                x={x + 155}
                y={top + 100}
                text={s.name}
                start={at[i] + 12}
                size={24}
                color={COLORS.inkSoft}
              />
              {hi && (
                <Icon
                  name={s.icon}
                  x={x + 155}
                  y={top - 70}
                  size={28}
                  start={i === 3 ? at[i] + 20 : cues.s(4, 3.4 + (i ? 0.5 : 0))}
                  color={COLORS.accent}
                />
              )}
              {s.tag && (
                <SvgText
                  x={x + 155}
                  y={top - 22}
                  text={s.tag}
                  start={
                    i === 3 ? cues.s(5, 2.2) : cues.s(4, 3.5 + (i ? 0.5 : 0))
                  }
                  size={22}
                  weight={400}
                  color={COLORS.accent}
                />
              )}
            </g>
          );
        })}
        <DrawPath
          d={`M 200 ${base} H 1740`}
          start={t}
          duration={1.2}
          stroke={COLORS.inkFaint}
        />
      </Svg>
      {[1, 2, 3].map((i) => {
        const x = 250 + i * 370 - 12;
        const y = 610 - i * 100 + 30;
        return (
          <FadeIn
            key={i}
            start={at[i] + 4}
            style={{
              position: "absolute",
              left: x - 240,
              top: y - 18,
              width: 240,
              textAlign: "right",
            }}
          >
            <div style={{ ...textStyle(26, 400), color: COLORS.warm }}>
              × <Num to={1000} start={at[i] + 4} duration={1} />
            </div>
          </FadeIn>
        );
      })}
      <Stage from={t} to={cues.s(5)}>
        <Use start={cues.s(4, 3.6)} text="Passer du composant au site" />
      </Stage>
      <Stage from={cues.s(5)}>
        <Use start={cues.s(5, 2)} text="Comparer de grandes infrastructures" />
      </Stage>
    </AbsoluteFill>
  );
};

// Puissance (niveau) × durée = énergie (surface).
const Energy: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(6);
  const x0 = 620;
  const x1 = 1300;
  const yBase = 660;
  const yLevel = 470;
  const sweep = progress(frame, t + 30, 2.6);
  return (
    <AbsoluteFill>
      <Eq start={t}>
        1 MW <Op>×</Op> 1 h <Op>=</Op>{" "}
        <Counter to={1} start={t + 30} duration={2.6} /> MWh
      </Eq>
      <Svg>
        <DrawPath
          d={`M ${x0} 400 V ${yBase} H ${x1 + 60}`}
          start={t}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <rect
          x={x0}
          y={yLevel}
          width={(x1 - x0) * sweep}
          height={yBase - yLevel}
          fill={COLORS.accent}
          opacity={0.2}
        />
        <DrawPath
          d={`M ${x0} ${yLevel} H ${x1}`}
          start={t + 14}
          duration={0.6}
          stroke={COLORS.warm}
          width={3}
        />
        <DrawPath
          d={`M ${x1} ${yBase - 10} V ${yBase + 10}`}
          start={t + 20}
          duration={0.2}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={x0 - 20}
          y={yLevel}
          text="1 MW"
          start={t + 16}
          anchor="end"
          size={26}
          color={COLORS.warm}
        />
        <SvgText
          x={x0}
          y={yBase + 34}
          text="0"
          start={t + 16}
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={x1}
          y={yBase + 34}
          text="1 heure"
          start={t + 20}
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={x1 + 40}
          y={yLevel - 40}
          text="Puissance = niveau"
          start={cues.s(6, 3)}
          anchor="start"
          size={26}
          color={COLORS.warm}
        />
        <SvgText
          x={(x0 + x1) / 2}
          y={(yLevel + yBase) / 2}
          text="Énergie = surface"
          start={cues.s(6, 3.4)}
          size={28}
          color={COLORS.accent}
        />
      </Svg>
      <Use start={cues.s(6, 3)} text="Distinguer puissance et énergie" />
    </AbsoluteFill>
  );
};

// Un an de fonctionnement continu : 8 760 heures, donc 8 760 MWh.
const Year: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(7);
  const cx = 960;
  const cy = 520;
  const r = 130;
  const sweep = progress(frame, t + 10, 3.4);
  const a = sweep * Math.PI * 2 - Math.PI / 2;
  return (
    <AbsoluteFill>
      <Eq start={t}>
        1 MW <Op>×</Op> <Num to={8760} start={t + 10} duration={3.4} /> h{" "}
        <Op>=</Op> <Num to={8760} start={t + 10} duration={3.4} /> MWh
      </Eq>
      <Svg>
        <path
          d={circlePath(cx, cy, r)}
          fill="none"
          stroke={COLORS.inkFaint}
          strokeWidth={2}
          opacity={progress(frame, t, 0.5)}
        />
        {new Array(12).fill(0).map((_, i) => {
          const ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
          return (
            <line
              key={i}
              x1={cx + Math.cos(ang) * (r - 10)}
              y1={cy + Math.sin(ang) * (r - 10)}
              x2={cx + Math.cos(ang) * (r + 10)}
              y2={cy + Math.sin(ang) * (r + 10)}
              stroke={COLORS.inkSoft}
              strokeWidth={2}
              opacity={sweep * 12 >= i ? 1 : 0.2}
            />
          );
        })}
        {sweep > 0 && (
          <path
            d={
              sweep >= 0.999
                ? circlePath(cx, cy, r)
                : `M ${cx} ${cy - r} A ${r} ${r} 0 ${sweep > 0.5 ? 1 : 0} 1 ${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r}`
            }
            fill="none"
            stroke={COLORS.accent}
            strokeWidth={4}
          />
        )}
        <SvgText
          x={cx}
          y={cy - 14}
          text="1 an"
          start={t + 8}
          size={40}
          weight={200}
        />
        <SvgText
          x={cx}
          y={cy + 30}
          text="365 j × 24 h"
          start={t + 16}
          size={24}
          color={COLORS.inkSoft}
        />
      </Svg>
      <FadeIn
        start={cues.s(7, 4.4)}
        style={{
          position: "absolute",
          top: 685,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(24, 400), color: COLORS.warm }}>
          Hors année bissextile
        </div>
      </FadeIn>
      <Use start={cues.s(7, 3.4)} text="Consommation annuelle" />
    </AbsoluteFill>
  );
};

// PUE = énergie totale ÷ énergie informatique.
const Pue: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(8);
  const fillIt = progress(frame, cues.s(8, 2.6), 0.8);
  return (
    <AbsoluteFill>
      <Eq start={t}>
        PUE <Op>=</Op> énergie totale <Op>÷</Op> énergie informatique
      </Eq>
      <Svg>
        <path
          d={roundRectPath(560, 380, 800, 330, 18)}
          fill={COLORS.warm}
          opacity={0.05 * fillIt}
        />
        <DrawPath
          d={roundRectPath(560, 380, 800, 330, 18)}
          start={cues.s(8, 1.2)}
          duration={1}
          stroke={COLORS.warm}
        />
        <SvgText
          x={600}
          y={420}
          text="ÉNERGIE TOTALE DU SITE"
          start={cues.s(8, 1.6)}
          anchor="start"
          size={22}
          weight={500}
          spacing="0.2em"
          color={COLORS.warm}
        />
        <path
          d={roundRectPath(610, 460, 460, 210, 14)}
          fill={COLORS.accent}
          opacity={0.12 * fillIt}
        />
        <DrawPath
          d={roundRectPath(610, 460, 460, 210, 14)}
          start={cues.s(8, 2.6)}
          duration={0.8}
          stroke={COLORS.accent}
        />
        {[0, 1, 2].map((i) => (
          <Icon
            key={i}
            name="server"
            x={710 + i * 130}
            y={540}
            size={34}
            start={cues.s(8, 2.9 + i * 0.15)}
            color={COLORS.accent}
          />
        ))}
        <SvgText
          x={840}
          y={625}
          text="Équipements informatiques"
          start={cues.s(8, 3)}
          size={24}
          color={COLORS.accent}
        />
        <Icon
          name="snow"
          x={1215}
          y={530}
          size={30}
          start={cues.s(8, 3.4)}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={1215}
          y={610}
          text={"Refroidissement,\npertes…"}
          start={cues.s(8, 3.6)}
          size={22}
          color={COLORS.inkSoft}
        />
      </Svg>
      <Use
        start={cues.s(8, 4.2)}
        top={745}
        text="Relier le site à ses équipements informatiques"
      />
    </AbsoluteFill>
  );
};

// Scène 38 — Les unités de départ, présentées comme des équivalences animées.
export const S38: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  // Le titre reste, discret, pendant toute la scène.
  const titleDim = interpolate(frame, [cues.s(1) - 10, cues.s(1)], [1, 0.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <div style={{ opacity: titleDim }}>
        <Title
          text="Les unités de départ"
          kicker="Unités"
          start={0}
          top={100}
        />
      </div>
      <Stage from={cues.s(1)} to={cues.s(2)}>
        <Byte />
      </Stage>
      <Stage from={cues.s(2)} to={cues.s(3)}>
        <Giga />
      </Stage>
      <Stage from={cues.s(3)} to={cues.s(4)}>
        <Flow />
      </Stage>
      <Stage from={cues.s(4)} to={cues.s(6)}>
        <Ladder />
      </Stage>
      <Stage from={cues.s(6)} to={cues.s(7)}>
        <Energy />
      </Stage>
      <Stage from={cues.s(7)} to={cues.s(8)}>
        <Year />
      </Stage>
      <Stage from={cues.s(8)}>
        <Pue />
      </Stage>
    </AbsoluteFill>
  );
};
