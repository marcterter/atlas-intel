import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { icons, roundRectPath } from "../components/icons";
import { Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
  Counter,
  DrawPath,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT, FPS } from "../theme";
import { Pill, SvgCaps, TextAt, accentA, caps, warmA } from "./S23";

const line = (pts: [number, number][]) =>
  pts
    .map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");

// --- 1. Baisser VDD : moins d'énergie, mais des nœuds chargés plus lentement.
const Lower: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const move = progress(frame, t + FPS * 0.6, 1.8);
  const v = 1 - 0.3 * move;
  const sy = (x: number) => 780 - 360 * x; // curseur VDD
  const eAt = t + FPS * 1.6;
  const cAt = t + FPS * 4.4;
  // Courbes de charge d'un nœud : V(t) = VDD (1 − e^(−t/τ)).
  const px0 = 1120;
  const pw = 600;
  const py0 = 780;
  const ph = 330;
  const curve = (vdd: number, tau: number) =>
    line(
      new Array(61).fill(0).map((_, i) => {
        const s = i / 60;
        return [px0 + s * pw, py0 - ph * vdd * (1 - Math.exp(-s / tau))];
      }),
    );
  const t1 = 0.12 * Math.log(2);
  const t2 = 0.3 * Math.log(2);
  return (
    <AbsoluteFill>
      <Title
        kicker="Fuites et limites de la tension"
        text="Pourquoi ne pas baisser la tension indéfiniment ?"
        start={cues.s(0)}
      />
      <Svg>
        {/* Curseur VDD */}
        <DrawPath
          d={`M 300 ${sy(0)} V ${sy(1.05)}`}
          start={t}
          duration={0.6}
          stroke={COLORS.inkFaint}
          width={4}
        />
        <DrawPath
          d={`M 300 ${sy(1)} V ${sy(v)}`}
          start={t + FPS * 0.6}
          duration={0.1}
          stroke={COLORS.accent}
          width={4}
        />
        <circle
          cx={300}
          cy={sy(v)}
          r={14}
          fill="#0a1a3d"
          stroke={COLORS.accent}
          strokeWidth={2}
          opacity={progress(frame, t + 6, 0.4)}
        />
        <SvgCaps x={300} y={390} text="VDD" start={t} color={COLORS.ink} />
        <SvgText
          x={300}
          y={820}
          text="(relative)"
          start={t + 6}
          size={22}
          color={COLORS.inkSoft}
        />
        {/* Énergie de commutation ∝ C·VDD² */}
        <DrawPath
          d={`M 520 780 H 760`}
          start={eAt}
          duration={0.5}
          stroke={COLORS.inkSoft}
        />
        <rect
          x={580}
          y={780 - 360 * v * v * progress(frame, eAt, 0.6)}
          width={120}
          height={360 * v * v * progress(frame, eAt, 0.6)}
          fill={accentA(0.2)}
          stroke={COLORS.accent}
          strokeWidth={1.6}
        />
        <DrawPath
          d="M 570 420 H 710"
          start={eAt + 10}
          duration={0.4}
          stroke={COLORS.inkFaint}
          width={1.2}
        />
        <SvgText
          x={640}
          y={400}
          text="avant"
          start={eAt + 12}
          size={22}
          color={COLORS.inkSoft}
        />
      </Svg>
      <TextAt x={640} y={280} w={420} start={eAt} align="center">
        <div style={caps(COLORS.accent)}>ÉNERGIE DE COMMUTATION</div>
        <div
          style={{ ...textStyle(26, 300), color: COLORS.inkSoft, marginTop: 6 }}
        >
          ∝ C · VDD²
        </div>
      </TextAt>
      <TextAt x={640} y={800} w={420} start={eAt + 10} align="center">
        <div style={{ ...textStyle(40, 200), color: COLORS.accent }}>
          ×{" "}
          <Counter
            from={1}
            to={0.49}
            decimals={2}
            start={t + FPS * 0.6}
            duration={1.8}
          />
        </div>
      </TextAt>
      <TextAt x={300} y={310} w={200} start={t + 6} align="center">
        <div style={{ ...textStyle(34, 200) }}>
          <Counter
            from={1}
            to={0.7}
            decimals={2}
            start={t + FPS * 0.6}
            duration={1.8}
          />
        </div>
      </TextAt>
      {/* Charge d'un nœud */}
      <Svg>
        <DrawPath
          d={`M ${px0} ${py0 - ph - 20} V ${py0} H ${px0 + pw + 10}`}
          start={cAt}
          duration={0.6}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={px0 + pw}
          y={py0 + 30}
          text="temps"
          start={cAt + 6}
          size={22}
          color={COLORS.inkSoft}
          anchor="end"
        />
        <SvgText
          x={px0 - 14}
          y={py0 - ph - 20}
          text="tension du nœud"
          start={cAt + 6}
          size={22}
          color={COLORS.inkSoft}
          anchor="start"
        />
        <DrawPath
          d={curve(1, 0.12)}
          start={cAt + 10}
          duration={1.2}
          stroke={COLORS.ink}
        />
        <DrawPath
          d={curve(0.7, 0.3)}
          start={cAt + 34}
          duration={1.4}
          stroke={COLORS.warm}
        />
        <SvgText
          x={px0 + pw}
          y={py0 - ph - 22}
          text="VDD = 1"
          start={cAt + 30}
          size={22}
          color={COLORS.ink}
          anchor="end"
        />
        <SvgText
          x={px0 + pw}
          y={py0 - ph * 0.7 + 28}
          text="VDD = 0,7"
          start={cAt + 60}
          size={22}
          color={COLORS.warm}
          anchor="end"
        />
        {/* Instants où le nœud atteint la moitié de sa tension */}
        <DrawPath
          d={`M ${px0 + t1 * pw} ${py0 - ph * 0.5} V ${py0}`}
          start={cAt + 50}
          duration={0.4}
          stroke={COLORS.inkFaint}
          width={1.4}
        />
        <DrawPath
          d={`M ${px0 + t2 * pw} ${py0 - ph * 0.35} V ${py0}`}
          start={cAt + 70}
          duration={0.4}
          stroke={warmA(0.5)}
          width={1.4}
        />
        <Arrow
          x1={px0 + t1 * pw}
          y1={py0 - 20}
          x2={px0 + t2 * pw}
          y2={py0 - 20}
          start={cAt + 80}
          stroke={COLORS.warm}
          width={1.6}
        />
        <SvgText
          x={px0 + (t1 + t2) * pw * 0.5 + 60}
          y={py0 - 50}
          text="délai ↑"
          start={cAt + 86}
          size={24}
          color={COLORS.warm}
        />
      </Svg>
      <TextAt x={1420} y={290} w={640} start={cAt + 60} align="center">
        <div style={{ ...textStyle(24, 300), color: COLORS.warm }}>
          moins de courant de charge → nœud chargé plus lentement
        </div>
      </TextAt>
    </AbsoluteFill>
  );
};

// --- 2. Près du seuil : délais longs et sensibles aux variations.
const NearVth: React.FC = () => {
  const cues = useCues();
  const t = cues.s(2);
  const x0 = 360;
  const x1 = 1300;
  const y0 = 760;
  const yTop = 250;
  const vmin = 0.2;
  const vmax = 1.0;
  const vth = 0.3;
  const X = (v: number) => x0 + ((v - vmin) / (vmax - vmin)) * (x1 - x0);
  const Y = (d: number) => Math.max(yTop, y0 - (d / 7) * (y0 - yTop));
  const dly = (v: number) =>
    v / Math.pow(v - vth, 1.3) / (1 / Math.pow(1 - vth, 1.3));
  const vs = new Array(80)
    .fill(0)
    .map((_, i) => 0.345 + (i / 79) * (1 - 0.345));
  const sig = (v: number) => Math.min(0.5, 0.06 + 0.02 / (v - vth));
  const mid = line(vs.map((v) => [X(v), Y(dly(v))]));
  const band =
    line(vs.map((v) => [X(v), Y(dly(v) * (1 + sig(v)))])) +
    " " +
    [...vs]
      .reverse()
      .map((v) => `L ${X(v).toFixed(1)} ${Y(dly(v) * (1 - sig(v))).toFixed(1)}`)
      .join(" ") +
    " Z";
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <TextAt x={960} y={130} w={1400} start={t} align="center">
        <div style={textStyle(40, 200)}>À proximité du seuil</div>
      </TextAt>
      <Svg>
        <DrawPath
          d={`M ${x0} ${yTop - 20} V ${y0} H ${x1 + 20}`}
          start={t}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={x1 + 10}
          y={y0 + 34}
          text="tension d’alimentation VDD →"
          start={t + 8}
          size={22}
          color={COLORS.inkSoft}
          anchor="end"
        />
        <SvgText
          x={x0 + 12}
          y={yTop - 10}
          text="délai d’une porte"
          start={t + 8}
          size={22}
          color={COLORS.inkSoft}
          anchor="start"
        />
        {/* Zone proche du seuil */}
        <rect
          x={X(vth)}
          y={yTop}
          width={X(0.45) - X(vth)}
          height={y0 - yTop}
          fill={warmA(0.08)}
          opacity={progress(frame, t + FPS * 1.5, 0.8)}
        />
        <DrawPath
          d={`M ${X(vth)} ${yTop} V ${y0}`}
          start={t + 10}
          duration={0.6}
          stroke={COLORS.warm}
          width={1.4}
        />
        <SvgText
          x={X(vth)}
          y={y0 + 34}
          text="seuil Vth"
          start={t + 14}
          size={22}
          color={COLORS.warm}
        />
        <path
          d={band}
          fill={warmA(0.18)}
          stroke="none"
          opacity={progress(frame, t + FPS * 4.2, 1)}
        />
        <DrawPath
          d={mid}
          start={t + FPS * 1.2}
          duration={1.6}
          stroke={COLORS.ink}
        />
        <SvgText
          x={X(0.95)}
          y={Y(1) - 34}
          text="délai moyen"
          start={t + FPS * 2.4}
          size={22}
          color={COLORS.ink}
        />
      </Svg>
      <TextAt x={1360} y={300} w={420} start={t + FPS * 2.6}>
        <div style={caps(COLORS.warm)}>PRÈS DU SEUIL</div>
        <div style={{ ...textStyle(28, 300), marginTop: 10 }}>
          le délai s’allonge brutalement
        </div>
      </TextAt>
      <TextAt x={1360} y={480} w={420} start={t + FPS * 4.4}>
        <div style={caps(COLORS.warm)}>DISPERSION</div>
        <div style={{ ...textStyle(28, 300), marginTop: 10 }}>
          la bande s’élargit : sensibilité aux variations (fabrication,
          température, tension)
        </div>
      </TextAt>
    </AbsoluteFill>
  );
};

// --- 3. Courant de drain en échelle logarithmique.
const PX0 = 320;
const PX1 = 1180;
const PY0 = 760;
const PY1 = 250;
const VMAX = 0.6;
const DEC = 7;
const PX = (v: number) => PX0 + (v / VMAX) * (PX1 - PX0);
const PY = (L: number) => PY0 - (L / DEC) * (PY0 - PY1);
const LTH = 5.6;
const logI = (v: number, vth: number, S = 0.06) => {
  const lin = LTH + (v - vth) / S;
  const sat = LTH + 0.4 + 1.5 * (v - vth);
  const k = 4;
  return -Math.log(Math.exp(-k * lin) + Math.exp(-k * sat)) / k;
};
const curvePath = (vth: number, S = 0.06) =>
  line(
    new Array(90)
      .fill(0)
      .map((_, i) => (i / 89) * VMAX)
      .map(
        (v) => [PX(v), PY(Math.max(-0.3, logI(v, vth, S)))] as [number, number],
      )
      .filter((p) => p[1] <= PY0 + 1),
  );
const VTH1 = 0.3;
const VTH2 = 0.18;

const LogPlot: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(3);
  const shift = progress(frame, t + FPS * 2.6, 1.4);
  const vth = VTH1 + (VTH2 - VTH1) * shift;
  const b3 = cues.s(4);
  const b4 = cues.s(5);
  const s6 = cues.s(6);
  const dimOld = interpolate(frame, [b3, b3 + 20], [1, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const stepStarts = [0, 1, 2].map((i) => b4 + FPS * (1.2 + i * 1.3));
  const L0 = logI(0, VTH2);
  const slope = line([
    [PX(0), PY(L0)],
    [PX(VTH2 - 0.04), PY(logI(VTH2 - 0.04, VTH2))],
  ]);
  return (
    <AbsoluteFill>
      <Svg>
        {/* Axes et graduations en décades */}
        {new Array(DEC + 1).fill(0).map((_, i) => (
          <DrawPath
            key={i}
            d={`M ${PX0} ${PY(i)} H ${PX1}`}
            start={t + i * 2}
            duration={0.6}
            stroke={i === 0 ? COLORS.inkSoft : "rgba(232, 240, 255, 0.08)"}
            width={1}
          />
        ))}
        <DrawPath
          d={`M ${PX0} ${PY0} V ${PY1 - 20}`}
          start={t}
          duration={0.6}
          stroke={COLORS.inkSoft}
        />
        {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((v) => (
          <SvgText
            key={v}
            x={PX(v)}
            y={PY0 + 28}
            text={v.toLocaleString("fr-FR")}
            start={t + 8}
            size={22}
            color={COLORS.inkSoft}
          />
        ))}
        <SvgText
          x={PX1}
          y={PY0 + 64}
          text="tension de grille VGS (V)"
          start={t + 10}
          size={22}
          color={COLORS.inkSoft}
          anchor="end"
        />
        <SvgText
          x={PX0 - 16}
          y={PY1 - 40}
          text="courant de drain (échelle log : ×10 par ligne)"
          start={t + 10}
          size={22}
          color={COLORS.inkSoft}
          anchor="start"
        />
        {/* Courbe initiale puis seuil abaissé */}
        <g opacity={dimOld}>
          <DrawPath
            d={curvePath(VTH1)}
            start={t + 16}
            duration={1.4}
            stroke={COLORS.ink}
          />
        </g>
        {shift > 0 && (
          <path
            d={curvePath(vth)}
            fill="none"
            stroke={COLORS.accent}
            strokeWidth={2.2}
            opacity={Math.min(1, shift * 3)}
          />
        )}
        {/* Marqueurs de seuil */}
        <DrawPath
          d={`M ${PX(VTH1)} ${PY0 - 8} V ${PY0 + 8}`}
          start={t + 30}
          duration={0.3}
          stroke={COLORS.ink}
          width={2}
        />
        {shift > 0 && (
          <g>
            <path
              d={`M ${PX(vth)} ${PY0 - 8} V ${PY0 + 8}`}
              stroke={COLORS.accent}
              strokeWidth={2}
            />
            <text
              x={PX(vth)}
              y={PY0 - 18}
              textAnchor="middle"
              fontFamily={FONT}
              fontSize={22}
              fill={COLORS.accent}
              opacity={Math.min(1, shift * 3)}
            >
              Vth abaissé
            </text>
          </g>
        )}
        <SvgText
          x={PX(VTH1) + 20}
          y={PY0 - 18}
          text="Vth"
          start={t + 30}
          size={22}
          color={COLORS.ink}
          anchor="start"
        />
        {/* Courant à VGS = 0 : ×100 */}
        <circle
          cx={PX(0)}
          cy={PY(logI(0, VTH1))}
          r={6}
          fill={COLORS.ink}
          opacity={progress(frame, t + 40, 0.4) * dimOld}
        />
        {shift > 0 && (
          <circle cx={PX(0)} cy={PY(logI(0, vth))} r={6} fill={COLORS.warm} />
        )}
        <Arrow
          x1={PX0 - 26}
          y1={PY(logI(0, VTH1)) - 4}
          x2={PX0 - 26}
          y2={PY(L0) + 8}
          start={t + FPS * 4.2}
          stroke={COLORS.warm}
          width={1.8}
        />
        <SvgText
          x={PX0 - 40}
          y={(PY(logI(0, VTH1)) + PY(L0)) / 2}
          text="×100"
          start={t + FPS * 4.4}
          size={26}
          color={COLORS.warm}
          anchor="end"
        />
        {/* Pente sous le seuil */}
        <DrawPath
          d={slope}
          start={b3 + FPS * 1.5}
          duration={1.2}
          stroke={COLORS.warm}
          width={5}
        />
        {/* Escalier : 60 mV → ×10 */}
        {stepStarts.map((st, i) => {
          const va = 0.0 + i * 0.06;
          const La = logI(va, VTH2);
          const Lb = logI(va + 0.06, VTH2);
          return (
            <g key={i}>
              <DrawPath
                d={`M ${PX(va)} ${PY(La)} H ${PX(va + 0.06)} V ${PY(Lb)}`}
                start={st}
                duration={0.9}
                stroke={COLORS.ink}
                width={1.8}
              />
              {i === 0 && (
                <>
                  <SvgText
                    x={(PX(va) + PX(va + 0.06)) / 2}
                    y={PY(La) + 24}
                    text="60 mV"
                    start={st + 10}
                    size={22}
                    color={COLORS.ink}
                  />
                  <SvgText
                    x={PX(va + 0.06) + 12}
                    y={(PY(La) + PY(Lb)) / 2}
                    text="×10"
                    start={st + 20}
                    size={22}
                    color={COLORS.ink}
                    anchor="start"
                  />
                </>
              )}
            </g>
          );
        })}
        {/* Dispositif réel : pente moins raide */}
        <path
          d={curvePath(VTH2, 0.085)}
          fill="none"
          stroke={COLORS.warm}
          strokeWidth={2}
          strokeDasharray="10 9"
          opacity={progress(frame, s6, 1)}
        />
      </Svg>
      {/* Panneau d'explication */}
      <Stage from={t} to={b3}>
        <TextAt x={1260} y={300} w={520} start={t + FPS * 0.4}>
          <div style={caps(COLORS.accent)}>ABAISSER LE SEUIL VTH</div>
          <div style={{ ...textStyle(30, 300), marginTop: 12 }}>
            → la courbe glisse vers la gauche : plus de courant passant à VDD
            donné, donc plus de vitesse
          </div>
        </TextAt>
        <TextAt x={1260} y={560} w={520} start={t + FPS * 4.4}>
          <div style={caps(COLORS.warm)}>MAIS</div>
          <div style={{ ...textStyle(30, 300), marginTop: 12 }}>
            à VGS = 0 (transistor bloqué), le courant sous le seuil augmente :
            ici ×100 pour 120 mV
          </div>
        </TextAt>
      </Stage>
      <Stage from={b3}>
        <TextAt x={1260} y={270} w={520} start={b3 + 6}>
          <div style={caps(COLORS.warm)}>PENTE SOUS LE SEUIL</div>
          <div style={{ ...textStyle(52, 200), marginTop: 8 }}>
            ≥ ~60 mV <span style={{ fontSize: 30 }}>/ décade</span>
          </div>
          <div
            style={{
              ...textStyle(24, 300),
              color: COLORS.inkSoft,
              marginTop: 10,
            }}
          >
            MOSFET conventionnel thermionique idéal, à 300 K
          </div>
        </TextAt>
        <TextAt x={1260} y={500} w={520} start={b4 + FPS * 1.2}>
          <div style={{ ...textStyle(30, 300) }}>
            courant <span style={{ color: COLORS.accent }}>÷ 10</span> ⇔ grille{" "}
            <span style={{ color: COLORS.accent }}>− 60 mV</span> environ
          </div>
          <div
            style={{
              ...textStyle(24, 300),
              color: COLORS.inkSoft,
              marginTop: 8,
            }}
          >
            chaque marche : 60 mV → un facteur 10
          </div>
        </TextAt>
        <TextAt x={1260} y={660} w={520} start={s6 + 10}>
          <div style={{ ...textStyle(28, 300), color: COLORS.warm }}>
            en pointillés, un dispositif réel : pente souvent moins raide (&gt;
            60 mV/déc), donc moins favorable
          </div>
        </TextAt>
      </Stage>
    </AbsoluteFill>
  );
};

// --- 4. Ce que la règle n'est pas.
const Caveats: React.FC = () => {
  const cues = useCues();
  const t = cues.s(7);
  const items = [
    {
      no: "un seuil minimal de 60 mV",
      yes: "c’est une pente : mV par décade de courant",
    },
    {
      no: "une loi universelle de tout dispositif",
      yes: "une limite du MOSFET conventionnel thermionique idéal, à 300 K",
    },
  ];
  return (
    <AbsoluteFill>
      <TextAt x={960} y={170} w={1400} start={t} align="center">
        <div style={caps(COLORS.warm)}>ATTENTION · CE N’EST NI…</div>
      </TextAt>
      <Svg>
        {items.map((it, i) => (
          <g key={i}>
            <DrawPath
              d={roundRectPath(300, 280 + i * 250, 1320, 200, 14)}
              start={t + i * FPS * 2.4}
              duration={0.7}
              stroke={COLORS.inkSoft}
              width={1.4}
            />
            <DrawPath
              d={icons.cross(380, 380 + i * 250, 22)}
              start={t + 10 + i * FPS * 2.4}
              duration={0.5}
              stroke={COLORS.warm}
            />
          </g>
        ))}
      </Svg>
      {items.map((it, i) => (
        <TextAt
          key={i}
          x={450}
          y={315 + i * 250}
          w={1120}
          start={t + 8 + i * FPS * 2.4}
        >
          <div
            style={{
              ...textStyle(38, 200),
              textDecoration: "line-through",
              textDecorationColor: COLORS.warm,
              textDecorationThickness: 1.5,
            }}
          >
            {it.no}
          </div>
          <div
            style={{
              ...textStyle(28, 300),
              color: COLORS.accent,
              marginTop: 14,
            }}
          >
            → {it.yes}
          </div>
        </TextAt>
      ))}
      <Pill text="Source 7" start={cues.s(8)} x={1620} y={790} tone="ink" />
    </AbsoluteFill>
  );
};

export const S24: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(1)}>
        <Lower />
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(2)}>
        <NearVth />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(5)}>
        <LogPlot />
      </Stage>
      <Stage from={cues.beat(5)}>
        <Caveats />
      </Stage>
    </AbsoluteFill>
  );
};
