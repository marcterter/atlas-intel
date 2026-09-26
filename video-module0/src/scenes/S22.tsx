import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { IconName, circlePath, icons } from "../components/icons";
import {
  Box,
  Callout,
  Equation,
  Icon,
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
import { COLORS, FONT, FPS } from "../theme";

const label = (color: string = COLORS.inkSoft): React.CSSProperties => ({
  ...textStyle(22, 500),
  color,
  letterSpacing: "0.26em",
});

const Pct: React.FC<{
  from: number;
  to: number;
  start: number;
  duration?: number;
  color?: string;
}> = ({ from, to, start, duration = 1.4, color }) => {
  const frame = useCurrentFrame();
  const v = Math.round(from + (to - from) * progress(frame, start, duration));
  return (
    <span style={{ fontVariantNumeric: "tabular-nums", color }}>{v} %</span>
  );
};

// Du réseau aux puces : chaque conversion perd un peu d'énergie, tout finit en chaleur.
const STEPS = ["transportée", "transformée", "distribuée"];
const SX = [560, 900, 1240];
const CY = 520;

const Chain: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t2 = cues.s(2);
  const t3 = cues.s(3);
  const t4 = cues.s(4);
  const flowOn = progress(frame, t2 + 50, 0.6);
  const lossOn = progress(frame, t3, 0.6);
  const heatOn = progress(frame, t4, 0.8);
  return (
    <AbsoluteFill>
      <Title text="L’électricité et la chaleur" start={cues.s(0)} />
      <Svg>
        <Icon
          name="bolt"
          x={240}
          y={CY}
          size={50}
          start={cues.s(1)}
          color={COLORS.accent}
        />
        <SvgText
          x={240}
          y={CY + 90}
          text="réseau électrique"
          start={cues.s(1, 0.3)}
          size={24}
          color={COLORS.inkSoft}
        />
        <Icon name="chip" x={1640} y={CY} size={50} start={cues.s(1, 0.6)} />
        <SvgText
          x={1640}
          y={CY + 90}
          text="puces"
          start={cues.s(1, 0.8)}
          size={24}
          color={COLORS.inkSoft}
        />
        {/* Pas de liaison directe */}
        <path
          d={`M 290 ${CY - 70} Q 940 ${CY - 330} 1590 ${CY - 70}`}
          fill="none"
          stroke={COLORS.inkSoft}
          strokeWidth={1.5}
          strokeDasharray="8 10"
          opacity={
            progress(frame, cues.s(1, 1.4), 0.6) *
            (1 - progress(frame, t2, 0.6))
          }
        />
        <path
          d={icons.cross(940, CY - 200, 22)}
          fill="none"
          stroke={COLORS.warm}
          strokeWidth={3}
          opacity={
            progress(frame, cues.s(1, 2.4), 0.4) *
            (1 - progress(frame, t2, 0.6))
          }
        />
        {STEPS.map((s, i) => (
          <Box
            key={s}
            x={SX[i] - 120}
            y={CY - 50}
            w={240}
            h={100}
            label={s}
            start={cues.s(2, 1 + i * 0.9)}
            size={26}
          />
        ))}
        {[240, ...SX, 1640].slice(0, -1).map((x, i) => {
          const x1 = i === 0 ? 300 : x + 120;
          const x2 = i === 3 ? 1580 : SX[i] - 120;
          return (
            <DrawPath
              key={i}
              d={`M ${x1} ${CY} H ${x2}`}
              start={cues.s(2, 0.8 + i * 0.9)}
              duration={0.5}
              stroke={COLORS.inkFaint}
            />
          );
        })}
        {/* Énergie qui circule */}
        {new Array(16).fill(0).map((_, i) => {
          const ph = ((frame - t2) / FPS / 4 + i / 16) % 1;
          const x = 300 + ph * 1280;
          const inBox = SX.some((sx) => Math.abs(x - sx) < 120);
          return inBox ? null : (
            <circle
              key={i}
              cx={x}
              cy={CY}
              r={4}
              fill={COLORS.accent}
              opacity={flowOn * (1 - ph * 0.35)}
            />
          );
        })}
        {/* Pertes à chaque conversion */}
        {SX.map((sx, k) =>
          new Array(4).fill(0).map((_, i) => {
            const ph = ((frame - t3) / FPS / 2.2 + i / 4 + k * 0.13) % 1;
            return (
              <circle
                key={`${k}-${i}`}
                cx={sx - 40 + i * 26 + Math.sin(ph * 6 + i) * 6}
                cy={CY - 60 - ph * 110}
                r={4}
                fill={COLORS.warm}
                opacity={lossOn * (1 - ph)}
              />
            );
          }),
        )}
        <SvgText
          x={900}
          y={CY - 210}
          text="pertes à chaque conversion"
          start={t3}
          size={26}
          color={COLORS.warm}
        />
        {/* Chaleur qui quitte les puces */}
        {[0, 1, 2].map((k) => {
          const ph = ((frame - t4) / FPS / 1.8 + k / 3) % 1;
          const y = CY - 70 - ph * 150;
          return (
            <path
              key={k}
              d={`M ${1600} ${y} q 10 -12 20 0 t 20 0 t 20 0 t 20 0`}
              fill="none"
              stroke={COLORS.warm}
              strokeWidth={2}
              opacity={heatOn * (1 - ph)}
            />
          );
        })}
      </Svg>
      <FadeIn
        start={t4}
        style={{
          position: "absolute",
          top: 720,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(32, 300)}>
          L’énergie consommée finit presque entièrement en{" "}
          <span style={{ color: COLORS.warm }}>chaleur à évacuer</span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// P = U × I : à puissance constante, l'aire du rectangle reste la même.
const Power: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t8 = cues.s(8);
  const u = 1 + progress(frame, t8 + 20, 2.2);
  const w = 260 * u;
  const h = 260 / u;
  const x0 = 380;
  const y0 = 820;
  const on = progress(frame, t8, 0.6);
  const legend = [
    { k: "P", t: "puissance", u: "watts" },
    { k: "U", t: "tension", u: "volts" },
    { k: "I", t: "intensité", u: "ampères" },
  ];
  return (
    <AbsoluteFill>
      <FadeIn
        start={cues.s(5)}
        style={{
          position: "absolute",
          top: 120,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={label(COLORS.accent)}>DEUX RELATIONS PHYSIQUES · 1</div>
      </FadeIn>
      <Equation
        parts={["P", "=", "U", "×", "I"]}
        starts={[
          cues.s(6),
          cues.s(6, 0.4),
          cues.s(6, 0.8),
          cues.s(6, 1.1),
          cues.s(6, 1.4),
        ]}
        y={165}
        size={100}
      />
      <div
        style={{
          position: "absolute",
          top: 330,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 120,
        }}
      >
        {legend.map((l, i) => (
          <FadeIn key={l.k} start={cues.s(7, i * 1.4)}>
            <div style={textStyle(30, 300)}>
              <span style={{ color: COLORS.accent, fontWeight: 400 }}>
                {l.k}
              </span>{" "}
              {l.t} <span style={{ color: COLORS.inkSoft }}>({l.u})</span>
            </div>
          </FadeIn>
        ))}
      </div>
      <Svg>
        <rect
          x={x0}
          y={y0 - h}
          width={w}
          height={h}
          fill={COLORS.accent}
          fillOpacity={0.12}
          stroke={COLORS.accent}
          strokeWidth={2}
          opacity={on}
        />
        <text
          x={x0 + w / 2}
          y={y0 - h / 2 + 10}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={300}
          fontSize={30}
          fill={COLORS.ink}
          opacity={on}
        >
          P
        </text>
        <text
          x={x0 + w / 2}
          y={y0 + 40}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={300}
          fontSize={26}
          fill={COLORS.inkSoft}
          opacity={on}
        >
          U × {u.toFixed(1).replace(".", ",")}
        </text>
        <text
          x={x0 - 20}
          y={y0 - h / 2 + 8}
          textAnchor="end"
          fontFamily={FONT}
          fontWeight={300}
          fontSize={26}
          fill={COLORS.inkSoft}
          opacity={on}
        >
          I ÷ {u.toFixed(1).replace(".", ",")}
        </text>
      </Svg>
      <FadeIn
        start={t8 + 10}
        style={{ position: "absolute", left: 1120, top: 540, width: 620 }}
      >
        <div style={label(COLORS.accent)}>MÊME PUISSANCE</div>
        <div style={{ ...textStyle(34, 300), marginTop: 14, lineHeight: 1.35 }}>
          Augmenter la tension{" "}
          <span style={{ color: COLORS.accent }}>réduit l’intensité</span>{" "}
          nécessaire.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Pertes = R × I² : diviser I par deux divise les pertes par quatre.
const Losses: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t11 = cues.s(11);
  const sq = 320;
  const x0 = 300;
  const y0 = 440;
  const q = progress(frame, t11 + 30, 1);
  const zig = `M 1180 360 H 1240 ${[0, 1, 2, 3, 4, 5].map((i) => `L ${1255 + i * 25} ${i % 2 === 0 ? 340 : 380}`).join(" ")} L 1400 360 H 1460`;
  return (
    <AbsoluteFill>
      <FadeIn
        start={cues.s(9)}
        style={{
          position: "absolute",
          top: 120,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={label(COLORS.warm)}>DEUX RELATIONS PHYSIQUES · 2</div>
      </FadeIn>
      <Equation
        parts={["Pertes résistives", "=", "R", "×", "I²"]}
        starts={[
          cues.s(9, 0.6),
          cues.s(9, 1.4),
          cues.s(9, 1.8),
          cues.s(9, 2.1),
          cues.s(9, 2.5),
        ]}
        y={165}
        size={80}
      />
      <Svg>
        <DrawPath
          d={zig}
          start={cues.s(10)}
          duration={1}
          stroke={COLORS.warm}
          width={2.5}
        />
        <SvgText
          x={1320}
          y={420}
          text="R : résistance du conducteur"
          start={cues.s(10, 0.4)}
          size={26}
          color={COLORS.inkSoft}
        />
        {/* Carré de côté I : l'aire représente I² */}
        <DrawPath
          d={`M ${x0} ${y0} h ${sq} v ${sq} h ${-sq} Z`}
          start={t11}
          duration={0.9}
          stroke={COLORS.ink}
        />
        <DrawPath
          d={`M ${x0 + sq / 2} ${y0} v ${sq} M ${x0} ${y0 + sq / 2} h ${sq}`}
          start={t11 + 40}
          duration={0.8}
          stroke={COLORS.inkFaint}
          width={1.5}
        />
        <rect
          x={x0}
          y={y0 + sq / 2}
          width={sq / 2}
          height={sq / 2}
          fill={COLORS.warm}
          opacity={0.35 * q}
        />
        <SvgText
          x={x0 + sq / 2}
          y={y0 + sq + 36}
          text="I"
          start={t11 + 10}
          size={26}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={x0 - 30}
          y={y0 + sq / 2}
          text="I"
          start={t11 + 10}
          size={26}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={x0 + sq / 4}
          y={y0 + (3 * sq) / 4}
          text="I/2"
          start={t11 + 50}
          size={24}
          color={COLORS.warm}
        />
      </Svg>
      <div style={{ position: "absolute", left: 800, top: 490, width: 900 }}>
        <FadeIn start={t11 + 20}>
          <div style={{ ...textStyle(64, 200) }}>
            I ÷ 2 <span style={{ color: COLORS.accent }}>→</span>{" "}
            <span style={{ color: COLORS.warm }}>pertes ÷ 4</span>
          </div>
        </FadeIn>
        <FadeIn
          start={t11 + 40}
          style={{ marginTop: 26, display: "flex", gap: 60 }}
        >
          <div>
            <div style={label()}>INTENSITÉ</div>
            <div style={{ ...textStyle(44, 200), marginTop: 6 }}>
              <Pct from={100} to={50} start={t11 + 45} />
            </div>
          </div>
          <div>
            <div style={label(COLORS.warm)}>PERTES</div>
            <div style={{ ...textStyle(44, 200), marginTop: 6 }}>
              <Pct from={100} to={25} start={t11 + 45} color={COLORS.warm} />
            </div>
          </div>
        </FadeIn>
        <FadeIn start={t11 + 80} style={{ marginTop: 14 }}>
          <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
            à résistance constante
          </div>
        </FadeIn>
      </div>
      <FadeIn
        start={cues.s(12)}
        style={{ position: "absolute", left: 800, top: 780, width: 960 }}
      >
        <div
          style={{
            ...textStyle(30, 300),
            color: COLORS.accent,
            lineHeight: 1.35,
          }}
        >
          D’où l’intérêt de tensions de distribution plus élevées dans certaines
          parties du système.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const COSTS: { icon: IconName; t: string }[] = [
  { icon: "gear", t: "convertir" },
  { icon: "stack", t: "isoler" },
  { icon: "check", t: "protéger" },
  { icon: "chip", t: "intégrer" },
];

const NotFree: React.FC = () => {
  const cues = useCues();
  const t = cues.s(13);
  return (
    <AbsoluteFill>
      <Svg>
        {COSTS.map((c, i) => {
          const x = 480 + i * 320;
          const at = cues.s(13, 1 + i * 1.6);
          return (
            <g key={c.t}>
              <DrawPath
                d={circlePath(x, 300, 72)}
                start={at}
                duration={0.7}
                stroke={COLORS.warm}
                width={1.6}
              />
              <Icon
                name={c.icon}
                x={x}
                y={300}
                size={32}
                start={at + 6}
                color={COLORS.warm}
              />
              <SvgText x={x} y={410} text={c.t} start={at + 10} size={30} />
            </g>
          );
        })}
      </Svg>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 140,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(32, 300)}>
          Il faut ensuite convertir pour les composants, et donc :
        </div>
      </FadeIn>
      <Callout kind="warn" start={cues.s(14)} y={520} width={1300} size={40}>
        Une tension plus élevée n’est pas un{" "}
        <span style={{ color: COLORS.warm }}>gain gratuit</span> à tous les
        niveaux.
      </Callout>
    </AbsoluteFill>
  );
};

// Scène 22 — L'électricité et la chaleur : deux relations physiques.
export const S22: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(5)}>
        <Chain />
      </Stage>
      <Stage from={cues.s(5)} to={cues.s(9)}>
        <Power />
      </Stage>
      <Stage from={cues.s(9)} to={cues.s(13)}>
        <Losses />
      </Stage>
      <Stage from={cues.s(13)}>
        <NotFree />
      </Stage>
    </AbsoluteFill>
  );
};
