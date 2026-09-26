import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Svg, SvgText } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT } from "../theme";

const small = (color: string = COLORS.inkSoft): React.CSSProperties => ({
  ...textStyle(22, 500),
  color,
  letterSpacing: "0.28em",
});

// Charges qui descendent le long d'un fil vertical, pendant une fenêtre de temps.
const VFlow: React.FC<{
  x: number;
  y0: number;
  y1: number;
  from: number;
  to: number;
  color: string;
  seed: string;
  n?: number;
  speed?: number;
  alpha?: number;
}> = ({ x, y0, y1, from, to, color, seed, n = 10, speed = 3, alpha = 0.9 }) => {
  const frame = useCurrentFrame();
  const o = progress(frame, from, 0.4) * (1 - progress(frame, to - 12, 0.4));
  if (o <= 0) return null;
  const L = y1 - y0;
  return (
    <g opacity={o * alpha}>
      {new Array(n).fill(0).map((_, i) => {
        const y =
          y0 + ((random(`${seed}${i}`) * L + (frame - from) * speed) % L);
        const dx = (random(`${seed}d${i}`) - 0.5) * 14;
        return <circle key={i} cx={x + dx} cy={y} r={4} fill={color} />;
      })}
    </g>
  );
};

// Beat 0 : NMOS et PMOS, commandes inversées.
const Pair: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const XS = [560, 1360];
  const rows = [
    {
      name: "NMOS",
      channel: "canal de type n : électrons",
      on: "grille haute (≈ VDD) → passant",
      off: "grille basse (≈ 0 V) → bloqué",
      t: cues.s(1),
    },
    {
      name: "PMOS",
      channel: "canal de type p : trous",
      on: "grille basse (≈ 0 V) → passant",
      off: "grille haute (≈ VDD) → bloqué",
      t: cues.s(1, 4),
    },
  ];
  return (
    <AbsoluteFill>
      <Svg>
        {rows.map((r, i) => {
          const x = XS[i];
          return (
            <g key={r.name}>
              <DrawPath
                d={roundRectPath(x - 330, 220, 660, 560, 16)}
                start={r.t}
                duration={0.9}
                stroke={COLORS.inkFaint}
                width={1.4}
              />
              <SvgText
                x={x}
                y={280}
                text={r.name}
                start={r.t + 6}
                size={52}
                weight={200}
                color={i === 0 ? COLORS.accent : COLORS.warm}
              />
              {/* Mini coupe : grille au-dessus d'un canal */}
              <DrawPath
                d={roundRectPath(x - 90, 350, 180, 40, 6)}
                start={r.t + 10}
                duration={0.6}
              />
              <SvgText
                x={x}
                y={370}
                text="grille"
                start={r.t + 16}
                size={22}
                color={COLORS.inkSoft}
              />
              <DrawPath
                d={`M ${x - 200} 410 H ${x + 200} M ${x - 200} 450 H ${x + 200}`}
                start={r.t + 14}
                duration={0.7}
                stroke={COLORS.inkSoft}
                width={1.4}
              />
              {new Array(9).fill(0).map((_, k) => {
                const cx = x - 160 + k * 40;
                return i === 0 ? (
                  <circle
                    key={k}
                    cx={cx}
                    cy={430}
                    r={6}
                    fill={COLORS.accent}
                    opacity={progress(frame, r.t + 20 + k * 3, 0.4)}
                  />
                ) : (
                  <circle
                    key={k}
                    cx={cx}
                    cy={430}
                    r={6}
                    fill="none"
                    stroke={COLORS.warm}
                    strokeWidth={2}
                    opacity={progress(frame, r.t + 20 + k * 3, 0.4)}
                  />
                );
              })}
              <SvgText
                x={x}
                y={500}
                text={r.channel}
                start={r.t + 22}
                size={28}
              />
              <SvgText
                x={x}
                y={620}
                text={r.on}
                start={r.t + 40}
                size={28}
                color={i === 0 ? COLORS.accent : COLORS.warm}
              />
              <SvgText
                x={x}
                y={680}
                text={r.off}
                start={r.t + 52}
                size={28}
                color={COLORS.inkSoft}
              />
            </g>
          );
        })}
        <SvgText
          x={960}
          y={830}
          text="commandes inversées"
          start={cues.s(1, 6.5)}
          size={30}
          color={COLORS.warm}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Beat 1 : l'acronyme CMOS.
const Acronym: React.FC = () => {
  const cues = useCues();
  const t = cues.s(2);
  const words = [
    ["C", "omplementary"],
    ["M", "etal"],
    ["O", "xide"],
    ["S", "emiconductor"],
  ];
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 260,
          width: "100%",
          textAlign: "center",
        }}
      >
        <FadeIn start={t}>
          <div style={{ ...textStyle(120, 200), letterSpacing: "0.2em" }}>
            CMOS
          </div>
        </FadeIn>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 36,
            marginTop: 30,
          }}
        >
          {words.map(([a, b], i) => (
            <FadeIn key={a} start={t + 20 + i * 12}>
              <span style={{ ...textStyle(40, 300), color: COLORS.accent }}>
                {a}
              </span>
              <span style={textStyle(40, 200)}>{b}</span>
            </FadeIn>
          ))}
        </div>
        <FadeIn start={t + 80} style={{ marginTop: 50 }}>
          <div style={textStyle(32, 300)}>
            Complémentaire : on combine{" "}
            <span style={{ color: COLORS.accent }}>NMOS</span> et{" "}
            <span style={{ color: COLORS.warm }}>PMOS</span>
          </div>
        </FadeIn>
        <FadeIn start={cues.s(3)} style={{ marginTop: 60 }}>
          <div style={small(COLORS.inkSoft)}>LE CIRCUIT LE PLUS SIMPLE</div>
          <div style={{ ...textStyle(46, 200), marginTop: 14 }}>
            l’inverseur
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// Géométrie de l'inverseur (schéma fonctionnel, pas de symboles normalisés).
const XC = 580;
const Y_VDD = 250;
const P_Y = 300;
const OUT_Y = 480;
const N_Y = 560;
const T_H = 100;
const GND_Y = 740;
const IN_X = 420;

const TBox: React.FC<{
  y: number;
  label: string;
  on: number;
  warm: boolean;
  start: number;
  showState: boolean;
}> = ({ y, label, on, warm, start, showState }) => {
  const color = warm ? COLORS.warm : on > 0.5 ? COLORS.accent : COLORS.inkSoft;
  const state = warm ? "conduit un instant" : on > 0.5 ? "passant" : "bloqué";
  return (
    <g>
      <path
        d={roundRectPath(XC - 80, y, 160, T_H, 10)}
        fill={warm ? COLORS.warm : COLORS.accent}
        opacity={0.22 * on}
      />
      <DrawPath
        d={roundRectPath(XC - 80, y, 160, T_H, 10)}
        start={start}
        duration={0.7}
        stroke={showState ? color : COLORS.ink}
      />
      <SvgText
        x={XC}
        y={y + T_H / 2}
        text={label}
        start={start + 8}
        size={28}
        weight={400}
      />
      {/* Grille : barre sur le côté gauche */}
      <DrawPath
        d={`M ${XC - 100} ${y + 14} V ${y + T_H - 14}`}
        start={start + 10}
        duration={0.4}
        stroke={COLORS.ink}
        width={4}
      />
      {showState && (
        <text
          x={XC + 110}
          y={y + T_H / 2 + 9}
          fontFamily={FONT}
          fontSize={26}
          fontWeight={400}
          fill={color}
        >
          {state}
        </text>
      )}
    </g>
  );
};

const Inverter: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(2);
  const sLow = cues.s(6);
  const sHigh = cues.s(8);
  const sTr = cues.s(11);
  const pOn =
    progress(frame, sLow, 0.5) * (1 - progress(frame, sHigh, 0.5)) +
    0.6 * progress(frame, sTr, 0.5);
  const nOn = progress(frame, sHigh, 0.5) - 0.4 * progress(frame, sTr, 0.5);
  const warm = frame >= sTr;
  const showState = frame >= sLow;
  const inTxt =
    frame >= sTr
      ? "0 → VDD"
      : frame >= sHigh
        ? "VDD"
        : frame >= sLow
          ? "0 V"
          : "";
  const outTxt =
    frame >= sTr
      ? "VDD → 0"
      : frame >= sHigh
        ? "≈ 0 V : 0"
        : frame >= cues.s(7)
          ? "≈ VDD : 1"
          : "";
  const outColor = frame >= sHigh ? COLORS.inkSoft : COLORS.accent;
  // Niveau de la sortie : monte à l'entrée basse, descend à l'entrée haute.
  const level =
    progress(frame, sLow + 15, 2) * (1 - progress(frame, sHigh + 15, 2));
  const noPath =
    progress(frame, cues.s(10, 1), 0.6) * (1 - progress(frame, sTr, 0.4));
  return (
    <AbsoluteFill>
      <Svg>
        {/* Alimentation */}
        <DrawPath
          d={`M ${XC - 120} ${Y_VDD} H ${XC + 120}`}
          start={t}
          duration={0.6}
          stroke={COLORS.warm}
          width={3}
        />
        <SvgText
          x={XC}
          y={Y_VDD - 30}
          text="VDD (alimentation)"
          start={t + 6}
          size={24}
          weight={400}
          color={COLORS.warm}
        />
        <DrawPath
          d={`M ${XC} ${Y_VDD} V ${P_Y} M ${XC} ${P_Y + T_H} V ${N_Y} M ${XC} ${N_Y + T_H} V ${GND_Y}`}
          start={t + 8}
          duration={1}
          stroke={COLORS.inkSoft}
        />
        <TBox
          y={P_Y}
          label="PMOS"
          on={pOn}
          warm={warm}
          start={t + 10}
          showState={showState}
        />
        <TBox
          y={N_Y}
          label="NMOS"
          on={nOn}
          warm={warm}
          start={t + 16}
          showState={showState}
        />
        {/* Masse */}
        <DrawPath
          d={`M ${XC - 50} ${GND_Y} H ${XC + 50} M ${XC - 32} ${GND_Y + 12} H ${XC + 32} M ${XC - 14} ${GND_Y + 24} H ${XC + 14}`}
          start={t + 24}
          duration={0.6}
          stroke={COLORS.ink}
        />
        <SvgText
          x={XC + 80}
          y={GND_Y + 12}
          text="masse (0 V)"
          start={t + 28}
          size={24}
          anchor="start"
          color={COLORS.inkSoft}
        />
        {/* Entrée reliée aux deux grilles */}
        <DrawPath
          d={`M 200 ${OUT_Y} H ${IN_X} M ${IN_X} ${P_Y + T_H / 2} V ${N_Y + T_H / 2} M ${IN_X} ${P_Y + T_H / 2} H ${XC - 100} M ${IN_X} ${N_Y + T_H / 2} H ${XC - 100}`}
          start={cues.s(4)}
          duration={1.2}
          stroke={COLORS.accent}
        />
        <circle
          cx={IN_X}
          cy={OUT_Y}
          r={6}
          fill={COLORS.accent}
          opacity={progress(frame, cues.s(4, 0.6), 0.4)}
        />
        <SvgText
          x={200}
          y={OUT_Y - 34}
          text="Entrée"
          start={cues.s(4)}
          size={28}
          anchor="start"
          color={COLORS.accent}
        />
        <SvgText
          x={IN_X - 12}
          y={P_Y + T_H / 2 - 22}
          text="grilles"
          start={cues.s(4, 1)}
          size={22}
          anchor="end"
          color={COLORS.inkSoft}
        />
        {/* Sortie */}
        <DrawPath
          d={`M ${XC} ${OUT_Y} H ${XC + 240}`}
          start={cues.s(5)}
          duration={0.7}
          stroke={COLORS.ink}
        />
        <circle
          cx={XC}
          cy={OUT_Y}
          r={7}
          fill={COLORS.ink}
          opacity={progress(frame, cues.s(5), 0.4)}
        />
        <SvgText
          x={XC + 250}
          y={OUT_Y}
          text="Sortie"
          start={cues.s(5, 0.3)}
          size={28}
          anchor="start"
        />
        {/* Indicateur de niveau de sortie */}
        {showState && (
          <g>
            <path
              d={roundRectPath(XC + 410, OUT_Y - 40, 18, 80, 9)}
              fill="none"
              stroke={COLORS.inkSoft}
              strokeWidth={1.4}
            />
            <path
              d={roundRectPath(
                XC + 412,
                OUT_Y + 38 - 76 * level,
                14,
                Math.max(2, 76 * level),
                7,
              )}
              fill={COLORS.accent}
              opacity={0.8}
            />
          </g>
        )}
        {/* Valeurs d'entrée et de sortie */}
        <text
          x={200}
          y={OUT_Y + 50}
          fontFamily={FONT}
          fontSize={30}
          fontWeight={300}
          fill={COLORS.accent}
        >
          {inTxt}
        </text>
        <text
          x={XC + 250}
          y={OUT_Y + 50}
          fontFamily={FONT}
          fontSize={30}
          fontWeight={300}
          fill={outColor}
        >
          {outTxt}
        </text>
        {/* Charges : la sortie se charge depuis VDD, puis se décharge vers la masse */}
        <VFlow
          x={XC}
          y0={Y_VDD}
          y1={OUT_Y}
          from={sLow + 10}
          to={sLow + 90}
          color={COLORS.accent}
          seed="up"
        />
        <VFlow
          x={XC}
          y0={OUT_Y}
          y1={GND_Y}
          from={sHigh + 10}
          to={sHigh + 90}
          color={COLORS.accent}
          seed="dn"
        />
        <VFlow
          x={XC}
          y0={Y_VDD}
          y1={GND_Y}
          from={sTr + 20}
          to={sTr + 80}
          color={COLORS.warm}
          seed="tr"
          n={16}
          speed={5}
        />
        <VFlow
          x={XC}
          y0={Y_VDD}
          y1={GND_Y}
          from={sTr + 80}
          to={cues.beat(6)}
          color={COLORS.warm}
          seed="lk"
          n={3}
          speed={0.8}
          alpha={0.6}
        />
        {/* Modèle idéal : pas de chemin continu entre VDD et masse */}
        {noPath > 0 && (
          <g opacity={noPath}>
            <path
              d={`M ${XC - 150} ${Y_VDD + 10} V ${GND_Y - 10}`}
              stroke={COLORS.warm}
              strokeWidth={2}
              strokeDasharray="6 8"
            />
            <path
              d={`M ${XC - 170} ${OUT_Y - 20} L ${XC - 130} ${OUT_Y + 20} M ${XC - 130} ${OUT_Y - 20} L ${XC - 170} ${OUT_Y + 20}`}
              stroke={COLORS.warm}
              strokeWidth={3}
            />
          </g>
        )}
      </Svg>
    </AbsoluteFill>
  );
};

// Partie droite, beats 2 à 4 : explication puis tableau d'états.
const RX = 1060;
const COLS = ["Entrée", "PMOS", "NMOS", "Sortie"];
const ROWS = [
  ["≈ 0 V", "passant", "bloqué", "≈ VDD"],
  ["≈ VDD", "bloqué", "passant", "≈ 0 V"],
];

const Explain: React.FC = () => {
  const cues = useCues();
  return (
    <div style={{ position: "absolute", left: RX, top: 300, width: 700 }}>
      <FadeIn start={cues.s(4)}>
        <div style={small(COLORS.accent)}>ENTRÉE</div>
        <div style={{ ...textStyle(32, 300), marginTop: 10 }}>
          reliée aux deux grilles : elle commande PMOS et NMOS en même temps
        </div>
      </FadeIn>
      <FadeIn start={cues.s(5)} style={{ marginTop: 50 }}>
        <div style={small(COLORS.ink)}>SORTIE</div>
        <div style={{ ...textStyle(32, 300), marginTop: 10 }}>
          tirée soit vers <span style={{ color: COLORS.warm }}>VDD</span> par le
          PMOS, soit vers la{" "}
          <span style={{ color: COLORS.inkSoft }}>masse</span> par le NMOS
        </div>
      </FadeIn>
    </div>
  );
};

const Table: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const W = 170;
  const rowStart = [cues.s(6), cues.s(8)];
  const outStart = [cues.s(7), cues.s(9)];
  const active = frame >= cues.s(8) ? 1 : 0;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: RX, top: 290 }}>
        <FadeIn start={cues.beat(3)}>
          <div style={{ ...small(), marginBottom: 26 }}>ÉTATS STABILISÉS</div>
          <div style={{ display: "flex" }}>
            {COLS.map((c) => (
              <div
                key={c}
                style={{
                  ...textStyle(26, 400),
                  width: W,
                  color: COLORS.inkSoft,
                }}
              >
                {c}
              </div>
            ))}
          </div>
        </FadeIn>
        <FadeIn start={cues.beat(3)}>
          <div
            style={{
              height: 1.5,
              width: W * 4 - 30,
              background: COLORS.inkFaint,
              margin: "18px 0 10px",
            }}
          />
        </FadeIn>
        {ROWS.map((r, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              height: 80,
              alignItems: "center",
              opacity: frame >= rowStart[i] ? (active === i ? 1 : 0.5) : 0,
            }}
          >
            {r.map((cell, j) => {
              const s =
                j === 0
                  ? rowStart[i]
                  : j === 3
                    ? outStart[i]
                    : rowStart[i] + 30;
              const color =
                cell === "passant"
                  ? COLORS.accent
                  : cell === "bloqué"
                    ? COLORS.inkSoft
                    : COLORS.ink;
              return (
                <div
                  key={j}
                  style={{ width: W, opacity: progress(frame, s, 0.5) }}
                >
                  <span
                    style={{ ...textStyle(30, j === 3 ? 400 : 300), color }}
                  >
                    {cell}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <FadeIn
        start={cues.s(9, 1)}
        style={{ position: "absolute", left: RX, top: 620, width: 680 }}
      >
        <div style={{ ...textStyle(30, 300), color: COLORS.inkSoft }}>
          La sortie est toujours l’
          <span style={{ color: COLORS.accent }}>inverse</span> de l’entrée.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Partie droite, beat 5 : chronogramme d'une transition.
const Transition: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const x0 = RX;
  const x1 = 1740;
  const xm = (x0 + x1) / 2;
  const tr = 40;
  const rows = [
    { label: "entrée", y: 410, rising: true },
    { label: "sortie", y: 540, rising: false },
  ];
  const s = cues.s(11);
  const cursor = progress(frame, s + 10, 3);
  const cx = x0 + (x1 - x0) * cursor;
  return (
    <AbsoluteFill>
      <FadeIn
        start={cues.s(10)}
        style={{ position: "absolute", left: RX, top: 150, width: 700 }}
      >
        <div style={small(COLORS.ink)}>MODÈLE IDÉAL STABILISÉ</div>
        <div style={{ ...textStyle(30, 300), marginTop: 10 }}>
          Un des deux transistors est toujours bloqué : pas de chemin continu
          entre <span style={{ color: COLORS.warm }}>VDD</span> et la masse.
        </div>
      </FadeIn>
      <Svg>
        {rows.map((r) => {
          const hi = r.y - 40;
          const lo = r.y + 20;
          const a = r.rising ? lo : hi;
          const b = r.rising ? hi : lo;
          return (
            <g key={r.label}>
              <SvgText
                x={x0}
                y={r.y - 70}
                text={r.label}
                start={s}
                size={22}
                anchor="start"
                color={COLORS.inkSoft}
              />
              <DrawPath
                d={`M ${x0} ${a} H ${xm - tr} L ${xm + tr} ${b} H ${x1}`}
                start={s + 4}
                duration={1.2}
                stroke={r.rising ? COLORS.accent : COLORS.ink}
              />
            </g>
          );
        })}
        {/* Courant d'alimentation : pic bref pendant la transition, fuite de fond */}
        <SvgText
          x={x0}
          y={625}
          text="courant VDD → masse"
          start={s + 20}
          size={22}
          anchor="start"
          color={COLORS.inkSoft}
        />
        <DrawPath
          d={`M ${x0} 770 H ${x1}`}
          start={s + 20}
          duration={1}
          stroke={COLORS.inkFaint}
          width={1}
        />
        <DrawPath
          d={`M ${x0} 760 H ${xm - tr} C ${xm - 10} 760 ${xm - 16} 670 ${xm} 670 C ${xm + 16} 670 ${xm + 10} 760 ${xm + tr} 760 H ${x1}`}
          start={s + 24}
          duration={1.4}
          stroke={COLORS.warm}
          width={2.5}
        />
        <SvgText
          x={xm + 50}
          y={685}
          text="courant traversant bref"
          start={s + 50}
          size={24}
          anchor="start"
          color={COLORS.warm}
        />
        <SvgText
          x={x1}
          y={800}
          text="fuites persistantes"
          start={s + 80}
          size={22}
          anchor="end"
          color={COLORS.warm}
        />
        {cursor > 0 && cursor < 1 && (
          <path
            d={`M ${cx} 340 V 780`}
            stroke={COLORS.inkSoft}
            strokeWidth={1}
            strokeDasharray="4 6"
          />
        )}
        <SvgText
          x={x1}
          y={850}
          text="Source [4]"
          start={cues.s(12)}
          size={22}
          anchor="end"
          color={COLORS.inkSoft}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Beat 6 : le 0 et le 1 sont des plages de tension.
const Levels: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(6);
  const BX = 640;
  const yv = (v: number) => 780 - 420 * v;
  const wx0 = 760;
  const wx1 = 1720;
  const levels = [0.08, 0.9, 0.86, 0.12, 0.93];
  const seg = (wx1 - wx0) / levels.length;
  const pts = new Array(161).fill(0).map((_, k) => {
    const u = k / 160;
    const x = wx0 + u * (wx1 - wx0);
    const i = Math.min(levels.length - 1, Math.floor(u * levels.length));
    const local = u * levels.length - i;
    const prev = i === 0 ? levels[0] : levels[i - 1];
    const blend = Math.min(1, local / 0.18);
    const smooth = blend * blend * (3 - 2 * blend);
    const v =
      prev +
      (levels[i] - prev) * smooth +
      0.02 * Math.sin(k * 0.9) +
      0.015 * Math.sin(k * 0.37 + 1);
    return `${k === 0 ? "M" : "L"} ${x.toFixed(1)} ${yv(v).toFixed(1)}`;
  });
  const bands = [
    { a: 0, b: 0.3, label: "plage reconnue\ncomme 0", color: COLORS.accent },
    { a: 0.7, b: 1, label: "plage reconnue\ncomme 1", color: COLORS.accent },
  ];
  const o = progress(frame, t + 10, 0.8);
  return (
    <AbsoluteFill>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 120,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={small(COLORS.ink)}>À RETENIR</div>
        <div style={{ ...textStyle(40, 200), marginTop: 14 }}>
          Le 0 et le 1 sont des{" "}
          <span style={{ color: COLORS.accent }}>plages de tensions</span>{" "}
          reconnues par un circuit
        </div>
      </FadeIn>
      <Svg>
        {bands.map((b) => (
          <g key={b.label} opacity={o}>
            <rect
              x={BX - 30}
              y={yv(b.b)}
              width={60}
              height={yv(b.a) - yv(b.b)}
              fill={b.color}
              opacity={0.22}
            />
            <rect
              x={wx0}
              y={yv(b.b)}
              width={wx1 - wx0}
              height={yv(b.a) - yv(b.b)}
              fill={b.color}
              opacity={0.05}
            />
          </g>
        ))}
        <g opacity={o}>
          <rect
            x={BX - 30}
            y={yv(0.7)}
            width={60}
            height={yv(0.3) - yv(0.7)}
            fill={COLORS.inkFaint}
            opacity={0.35}
          />
        </g>
        <DrawPath
          d={`M ${BX - 30} ${yv(0)} H ${BX + 30} V ${yv(1)} H ${BX - 30} Z`}
          start={t + 4}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1.5}
        />
        <SvgText
          x={BX}
          y={yv(1) - 26}
          text="VDD"
          start={t + 8}
          size={24}
          color={COLORS.warm}
        />
        <SvgText
          x={BX}
          y={yv(0) + 30}
          text="0 V"
          start={t + 8}
          size={24}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={BX - 50}
          y={yv(0.15)}
          text={bands[0].label}
          start={t + 16}
          size={24}
          anchor="end"
          color={COLORS.accent}
        />
        <SvgText
          x={BX - 50}
          y={yv(0.85)}
          text={bands[1].label}
          start={t + 22}
          size={24}
          anchor="end"
          color={COLORS.accent}
        />
        <SvgText
          x={BX - 50}
          y={yv(0.5)}
          text={"zone non\ngarantie"}
          start={t + 28}
          size={22}
          anchor="end"
          color={COLORS.inkSoft}
        />
        {/* Signal réel, continu et bruité */}
        <DrawPath
          d={pts.join(" ")}
          start={cues.s(14)}
          duration={2.2}
          stroke={COLORS.ink}
          width={2.2}
        />
        <SvgText
          x={wx0}
          y={yv(1) - 26}
          text="tension réelle : continue"
          start={cues.s(14)}
          size={22}
          anchor="start"
          color={COLORS.inkSoft}
        />
        {levels.map((v, i) => (
          <SvgText
            key={i}
            x={wx0 + seg * (i + 0.6)}
            y={v > 0.5 ? yv(0.55) : yv(0.45)}
            text={v > 0.5 ? "1" : "0"}
            start={cues.s(14, 2 + i * 0.35)}
            size={44}
            weight={300}
            color={COLORS.accent}
          />
        ))}
      </Svg>
    </AbsoluteFill>
  );
};

// Scène 14 — L'inverseur CMOS.
export const S14: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const headO = interpolate(frame, [cues.beat(2), cues.beat(2) + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(1)}>
        <div
          style={{
            position: "absolute",
            top: 120,
            width: "100%",
            textAlign: "center",
          }}
        >
          <FadeIn start={0}>
            <div style={textStyle(46, 200)}>NMOS et PMOS</div>
          </FadeIn>
        </div>
        <Pair />
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(2)}>
        <Acronym />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(6)}>
        <div
          style={{ position: "absolute", top: 120, left: 200, opacity: headO }}
        >
          <div style={small(COLORS.accent)}>
            L’INVERSEUR CMOS · SCHÉMA FONCTIONNEL
          </div>
        </div>
        <Inverter />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(3)}>
        <Explain />
      </Stage>
      <Stage from={cues.beat(3)} to={cues.beat(5)}>
        <Table />
      </Stage>
      <Stage from={cues.beat(5)} to={cues.beat(6)}>
        <Transition />
      </Stage>
      <Stage from={cues.beat(6)}>
        <Levels />
      </Stage>
    </AbsoluteFill>
  );
};
