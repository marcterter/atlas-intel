import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
  DrawPath,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import { Electron, Note, Sign, Txt } from "./S04";
import { Mosfet, mosGeom } from "./S10";

// Les bornes du transistor et les tensions entre elles, puis la courbe I(VGS).
const Voltages: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const g = mosGeom(560, 590, 0.8);
  const tGS = cues.beat(1);
  const tDS = cues.beat(2);
  const tTh = cues.beat(3);
  const tSub = cues.s(4, 1);
  const top = g.termY - 16;
  // Graphique : log(ID) en fonction de VGS.
  const gx = 1080;
  const gw = 640;
  const base = 780;
  const vt = 0.45;
  const L = (v: number) =>
    v < vt
      ? 0.9 * v
      : 0.9 * vt + 0.35 * (1 - Math.exp(-(v - vt) * (0.9 / 0.35)));
  const yOf = (v: number) => base - 20 - L(v) * 620;
  const xOf = (v: number) => gx + v * gw;
  const curve = new Array(61)
    .fill(0)
    .map((_, i) => `${i === 0 ? "M" : "L"} ${xOf(i / 60)} ${yOf(i / 60)}`)
    .join(" ");
  const sub = new Array(28)
    .fill(0)
    .map((_, i) => {
      const v = (i / 27) * vt;
      return `L ${xOf(v)} ${yOf(v)}`;
    })
    .join(" ");
  const subArea = `M ${gx} ${base} ${sub} L ${xOf(vt)} ${base} Z`;
  return (
    <AbsoluteFill>
      <Svg>
        <Mosfet
          cx={560}
          Y={590}
          k={0.8}
          body={cues.s(0)}
          sd={cues.s(0)}
          oxide={cues.s(0, 0.4)}
          gate={cues.s(0, 0.4)}
          terminals={cues.s(0, 0.8)}
          labels={cues.s(0, 1)}
        />
        {/* VGS : entre grille et source */}
        <DrawPath
          d={`M ${g.sX + 6} ${top} Q ${(g.sX + g.cx) / 2} ${top - 60} ${g.cx - 6} ${top}`}
          start={tGS}
          duration={0.7}
          stroke={COLORS.accent}
          width={2.4}
        />
        <SvgText
          x={(g.sX + g.cx) / 2}
          y={top + 38}
          text="VGS"
          start={tGS + 10}
          size={30}
          weight={400}
          color={COLORS.accent}
        />
        {/* VDS : entre drain et source */}
        <DrawPath
          d={`M ${g.sX} ${top - 10} Q ${g.cx} ${top - 190} ${g.dX} ${top - 10}`}
          start={tDS}
          duration={0.8}
          stroke={COLORS.warm}
          width={2.4}
        />
        <SvgText
          x={g.cx}
          y={top - 120}
          text="VDS"
          start={tDS + 10}
          size={30}
          weight={400}
          color={COLORS.warm}
        />
      </Svg>
      <Txt
        x={140}
        y={215}
        width={840}
        start={tGS + 14}
        size={24}
        color={COLORS.inkSoft}
        align="center"
      >
        {frame < tDS
          ? "VGS : tension grille-source"
          : "VDS : tension drain-source"}
      </Txt>
      {/* Courbe ID(VGS) */}
      <Stage from={tTh}>
        <Svg>
          <Arrow
            x1={gx}
            y1={base}
            x2={gx + gw + 30}
            y2={base}
            start={tTh}
            stroke={COLORS.inkSoft}
          />
          <Arrow
            x1={gx}
            y1={base}
            x2={gx}
            y2={250}
            start={tTh}
            stroke={COLORS.inkSoft}
          />
          <SvgText
            x={gx + gw + 30}
            y={base + 34}
            text="VGS"
            start={tTh + 6}
            size={24}
            color={COLORS.inkSoft}
            anchor="end"
          />
          <SvgText
            x={gx + 14}
            y={262}
            text="courant de drain (échelle log)"
            start={tTh + 6}
            size={22}
            color={COLORS.inkSoft}
            anchor="start"
          />
          <DrawPath
            d={`M ${xOf(vt)} ${base} V 300`}
            start={tTh + 10}
            duration={0.6}
            stroke={COLORS.inkFaint}
            width={1.4}
          />
          <SvgText
            x={xOf(vt)}
            y={base + 34}
            text="Vth"
            start={tTh + 14}
            size={28}
            weight={400}
            color={COLORS.accent}
          />
          <SvgText
            x={xOf(vt) + 14}
            y={320}
            text="repère de formation du canal"
            start={tTh + 30}
            size={22}
            color={COLORS.accent}
            anchor="start"
          />
          {/* Interrupteur idéal : rien sous le seuil, tout au-dessus */}
          <path
            d={`M ${gx} ${base - 4} H ${xOf(vt)} V ${yOf(1)} H ${gx + gw}`}
            fill="none"
            stroke={COLORS.inkSoft}
            strokeWidth={1.6}
            strokeDasharray="7 7"
            opacity={progress(frame, tSub, 0.6)}
          />
          <SvgText
            x={xOf(vt) - 14}
            y={420}
            text="interrupteur idéal"
            start={tSub}
            size={22}
            color={COLORS.inkSoft}
            anchor="end"
          />
          {/* Transistor réel */}
          <path
            d={subArea}
            fill={COLORS.warm}
            opacity={0.14 * progress(frame, tSub + 60, 0.8)}
          />
          <DrawPath
            d={curve}
            start={tSub + 20}
            duration={1.6}
            stroke={COLORS.accent}
            width={3}
          />
          <SvgText
            x={xOf(0.72)}
            y={yOf(0.72) + 40}
            text="transistor réel"
            start={tSub + 50}
            size={22}
            color={COLORS.accent}
            anchor="start"
          />
          <SvgText
            x={xOf(0.3)}
            y={base - 50}
            text={"courant sous\nle seuil ≠ 0"}
            start={tSub + 70}
            size={24}
            color={COLORS.warm}
          />
        </Svg>
      </Stage>
    </AbsoluteFill>
  );
};

const RECAP = [
  { s: "VGS", t: "tension grille-source", c: COLORS.accent },
  { s: "VDS", t: "tension drain-source", c: COLORS.warm },
  { s: "Vth", t: "tension de seuil", c: COLORS.accent },
  {
    s: "VDD",
    t: "alimentation du circuit (utilisée plus loin)",
    c: COLORS.ink,
  },
];

// VDD, l'alimentation, et le récapitulatif des quatre notations.
const Supply: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(4);
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d="M 260 320 H 860"
          start={t + 30}
          duration={0.7}
          stroke={COLORS.ink}
          width={3}
        />
        <SvgText
          x={250}
          y={320}
          text="VDD"
          start={t + 36}
          size={34}
          weight={400}
          anchor="end"
        />
        <DrawPath
          d="M 260 760 H 860"
          start={t + 30}
          duration={0.7}
          stroke={COLORS.inkSoft}
          width={3}
        />
        <SvgText
          x={250}
          y={760}
          text="0 V"
          start={t + 36}
          size={30}
          color={COLORS.inkSoft}
          anchor="end"
        />
        <DrawPath
          d={roundRectPath(400, 450, 320, 180, 10)}
          start={t + 44}
          duration={0.7}
          stroke={COLORS.accent}
        />
        <SvgText
          x={560}
          y={540}
          text={"circuit\n(transistors)"}
          start={t + 50}
          size={28}
          color={COLORS.accent}
        />
        <Arrow
          x1={560}
          y1={326}
          x2={560}
          y2={444}
          start={t + 56}
          stroke={COLORS.warm}
        />
        <DrawPath
          d="M 560 630 V 754"
          start={t + 56}
          duration={0.6}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={580}
          y={385}
          text="alimentation"
          start={t + 62}
          size={24}
          color={COLORS.warm}
          anchor="start"
        />
      </Svg>
      <div style={{ position: "absolute", left: 1000, top: 290, width: 780 }}>
        {RECAP.map((r, i) => {
          const o = progress(frame, t + i * 8, 0.5);
          const cur = i === 3;
          return (
            <div
              key={r.s}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 30,
                marginBottom: 34,
                opacity: o * (cur ? 1 : 0.5),
              }}
            >
              <span
                style={{ ...textStyle(46, 300), color: r.c, minWidth: 110 }}
              >
                {r.s}
              </span>
              <span style={{ ...textStyle(30, 300) }}>{r.t}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// La grille, un petit condensateur : la charger et la décharger coûte de l'énergie.
const GateEnergy: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(5);
  const tCyc = cues.s(7, 0.5);
  const tLeak = cues.s(7, 4.5);
  const x0 = 300;
  const x1 = 820;
  const gy = 480;
  // Cycle charge / décharge (4 s).
  const T = 4 * FPS;
  const ph = frame < tCyc ? -1 : ((frame - tCyc) % T) / T;
  const q =
    ph < 0
      ? 0
      : ph < 0.375
        ? ph / 0.375
        : ph < 0.5
          ? 1
          : ph < 0.875
            ? 1 - (ph - 0.5) / 0.375
            : 0;
  const charging = ph >= 0 && ph < 0.375;
  const discharging = ph >= 0.5 && ph < 0.875;
  const noDC = progress(frame, t + 20, 0.6);
  const leak = progress(frame, tLeak, 0.6);
  return (
    <AbsoluteFill>
      <Svg>
        {/* Grille, isolant, corps */}
        <rect
          x={x0}
          y={gy - 50}
          width={x1 - x0}
          height={50}
          fill={COLORS.ink}
          opacity={0.1}
        />
        <DrawPath
          d={roundRectPath(x0, gy - 50, x1 - x0, 50, 4)}
          start={t}
          duration={0.7}
          stroke={COLORS.ink}
        />
        <rect
          x={x0 - 10}
          y={gy}
          width={x1 - x0 + 20}
          height={18}
          fill={COLORS.warm}
          opacity={0.5 * progress(frame, t + 6, 0.5)}
        />
        <rect
          x={x0 - 60}
          y={gy + 18}
          width={x1 - x0 + 120}
          height={200}
          fill={COLORS.warm}
          opacity={0.04}
        />
        <DrawPath
          d={`M ${x0 - 60} ${gy + 18} H ${x1 + 60} V ${gy + 218} H ${x0 - 60} Z`}
          start={t + 6}
          duration={0.8}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        <SvgText
          x={x1 + 30}
          y={gy - 25}
          text="grille"
          start={t + 8}
          size={24}
          anchor="start"
        />
        <SvgText
          x={x1 + 80}
          y={gy + 9}
          text="isolant"
          start={t + 12}
          size={24}
          color={COLORS.warm}
          anchor="start"
        />
        <SvgText
          x={(x0 + x1) / 2}
          y={gy + 190}
          text="semi-conducteur"
          start={t + 14}
          size={24}
          color={COLORS.inkSoft}
        />
        {/* Fil de grille et source d'énergie */}
        <DrawPath
          d={`M ${(x0 + x1) / 2} ${gy - 50} V 290`}
          start={t + 10}
          duration={0.6}
          stroke={COLORS.inkSoft}
          width={1.8}
        />
        <SvgText
          x={(x0 + x1) / 2}
          y={265}
          text={
            frame < tCyc
              ? "commande de grille"
              : charging || (ph >= 0.375 && ph < 0.5)
                ? "reliée à VDD : charge"
                : "reliée à 0 V : décharge"
          }
          start={t + 14}
          size={26}
          color={charging ? COLORS.warm : COLORS.ink}
        />
        {/* Idéalement : pas de courant continu à travers l'isolant */}
        <g opacity={noDC * (1 - progress(frame, tCyc - 10, 0.4))}>
          <path
            d={`M ${x0 + 90} ${gy - 70} V ${gy + 60}`}
            stroke={COLORS.accent}
            strokeWidth={2}
            strokeDasharray="6 6"
          />
          <path
            d={`M ${x0 + 70} ${gy - 10} L ${x0 + 110} ${gy + 30} M ${x0 + 110} ${gy - 10} L ${x0 + 70} ${gy + 30}`}
            stroke={COLORS.warm}
            strokeWidth={3.4}
          />
          <text
            x={x0 + 130}
            y={gy + 70}
            fontSize={24}
            fill={COLORS.accent}
            fontFamily="Inter"
            fontWeight={300}
          >
            pas de courant continu
          </text>
        </g>
        {/* Charges : + sur la grille, électrons sous l'isolant */}
        {new Array(10).fill(0).map((_, i) => {
          const x = x0 + 30 + i * ((x1 - x0 - 60) / 9);
          return (
            <g key={i}>
              <Sign
                x={x}
                y={gy - 16}
                sign="+"
                s={7}
                color={COLORS.accent}
                o={Math.min(1, q * 10 - i)}
              />
              <Electron x={x} y={gy + 30} r={5.5} o={Math.min(1, q * 10 - i)} />
            </g>
          );
        })}
        {/* Énergie fournie à la charge, chaleur à la décharge */}
        {charging &&
          [0, 1, 2].map((k) => {
            const y = 300 + (((frame - tCyc) * 3 + k * 40) % 120);
            return (
              <path
                key={k}
                d={`M ${(x0 + x1) / 2 - 10} ${y} L ${(x0 + x1) / 2} ${y + 14} L ${(x0 + x1) / 2 + 10} ${y}`}
                fill="none"
                stroke={COLORS.warm}
                strokeWidth={2.4}
              />
            );
          })}
        {ph >= 0 && (
          <text
            x={(x0 + x1) / 2 + 26}
            y={360}
            fontSize={24}
            fill={COLORS.warm}
            fontFamily="Inter"
            fontWeight={300}
            opacity={charging ? 1 : 0}
          >
            énergie
          </text>
        )}
        {discharging &&
          [0, 1, 2].map((k) => (
            <path
              key={k}
              d={`M ${(x0 + x1) / 2 + 40 + k * 30} 400 q 8 -12 0 -24 q -8 -12 0 -24`}
              fill="none"
              stroke={COLORS.warm}
              strokeWidth={2}
              opacity={0.5 + 0.5 * Math.sin(frame / 6 + k)}
            />
          ))}
        {ph >= 0 && (
          <text
            x={(x0 + x1) / 2 + 140}
            y={370}
            fontSize={24}
            fill={COLORS.warm}
            fontFamily="Inter"
            fontWeight={300}
            opacity={discharging ? 1 : 0}
          >
            chaleur
          </text>
        )}
        {/* Courants de fuite à travers l'isolant */}
        {leak > 0 &&
          [0, 1, 2, 3].map((k) => {
            const p = ((frame - tLeak) / 50 + k * 0.37) % 1;
            const x = x0 + 120 + k * 110;
            return (
              <circle
                key={k}
                cx={x}
                cy={gy - 20 + p * 60}
                r={3.5}
                fill={COLORS.warm}
                opacity={leak * Math.min(1, p * 5, (1 - p) * 5)}
              />
            );
          })}
        {leak > 0 && (
          <text
            x={x0 - 20}
            y={gy + 90}
            textAnchor="end"
            fontSize={24}
            fill={COLORS.warm}
            fontFamily="Inter"
            fontWeight={300}
            opacity={leak}
          >
            fuites
          </text>
        )}
      </Svg>
      <Txt x={1020} y={260} width={760} start={t + 10} size={30}>
        Idéalement, l’isolant bloque le{" "}
        <span style={{ color: COLORS.accent }}>courant continu</span> de grille.
      </Txt>
      <Txt x={1020} y={400} width={760} start={cues.s(7)} size={30}>
        Mais <span style={{ color: COLORS.warm }}>charger et décharger</span> la
        grille demande de l’énergie, et les dispositifs réels ont des{" "}
        <span style={{ color: COLORS.warm }}>courants de fuite</span>.
      </Txt>
      <Note
        kind="keep"
        x={1020}
        y={620}
        width={760}
        start={cues.s(8)}
        size={34}
      >
        Grille isolée ≠ transistor gratuit en énergie.
      </Note>
    </AbsoluteFill>
  );
};

// Scène 12 — Trois tensions à distinguer.
export const S12: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(4)}>
        <Title
          kicker="Le transistor MOSFET"
          text="Trois tensions à distinguer"
          start={cues.s(0)}
        />
        <Voltages />
      </Stage>
      <Stage from={cues.beat(4)} to={cues.beat(5)}>
        <Title text="VDD, l’alimentation" start={cues.beat(4)} />
        <Supply />
      </Stage>
      <Stage from={cues.beat(5)}>
        <Title
          text="Une grille isolée, mais pas gratuite"
          start={cues.beat(5)}
        />
        <GateEnergy />
      </Stage>
    </AbsoluteFill>
  );
};
