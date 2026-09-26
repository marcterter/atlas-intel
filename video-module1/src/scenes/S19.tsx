import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Equation, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT } from "../theme";

const mix = (a: number, b: number) => (a + b) / 2;

// Ondulations de chaleur au-dessus d'un transistor.
const Heat: React.FC<{ x: number; y: number; o: number }> = ({ x, y, o }) => {
  const frame = useCurrentFrame();
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      {[-24, 0, 24].map((dx, i) => {
        const ph = ((frame + i * 10) % 40) / 40;
        const yy = y - ph * 30;
        return (
          <path
            key={dx}
            d={`M ${x + dx} ${yy} q 6 -8 0 -16 q -6 -8 0 -16`}
            fill="none"
            stroke={COLORS.warm}
            strokeWidth={2}
            opacity={1 - ph}
          />
        );
      })}
    </g>
  );
};

const SX = 420;
const VDD_Y = 230;
const P_Y = 290;
const NODE_Y = 470;
const N_Y = 560;
const GND_Y = 720;
const CX = 700;

const Circuit: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const tDis = cues.s(3);
  const charge = progress(frame, t + 40, 3.5);
  const discharge = progress(frame, tDis + 20, 3);
  const q = charge * (1 - discharge);
  const pOn = progress(frame, t + 30, 0.4) * (1 - progress(frame, tDis, 0.4));
  const nOn = progress(frame, tDis, 0.4);
  const flowUp = charge > 0 && charge < 1;
  const flowDn = discharge > 0 && discharge < 1;
  const heatP =
    progress(frame, cues.s(2), 0.5) * (1 - progress(frame, tDis, 0.5));
  const heatN =
    progress(frame, tDis + 20, 0.5) *
    (1 - progress(frame, cues.beat(3) - 20, 0.5));
  const n = Math.round(q * 6);
  const sw = (
    y: number,
    label: string,
    on: number,
    color: string,
    start: number,
  ) => (
    <g>
      <path
        d={roundRectPath(SX - 70, y, 140, 80, 10)}
        fill={color}
        opacity={0.2 * on}
      />
      <DrawPath
        d={roundRectPath(SX - 70, y, 140, 80, 10)}
        start={start}
        duration={0.6}
        stroke={on > 0.5 ? color : COLORS.inkSoft}
      />
      <SvgText
        x={SX}
        y={y + 40}
        text={label}
        start={start + 6}
        size={26}
        weight={400}
      />
    </g>
  );
  const dots = (
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    show: boolean,
    seed: number,
  ) =>
    show
      ? [0, 1, 2, 3].map((i) => {
          const u = (((frame * 0.025 + i / 4 + seed) % 1) + 1) % 1;
          return (
            <circle
              key={i}
              cx={x0 + (x1 - x0) * u}
              cy={y0 + (y1 - y0) * u}
              r={5}
              fill={COLORS.accent}
            />
          );
        })
      : null;
  return (
    <Svg>
      <DrawPath
        d={`M ${SX - 110} ${VDD_Y} H ${SX + 110}`}
        start={t}
        duration={0.5}
        stroke={COLORS.warm}
        width={3}
      />
      <SvgText
        x={SX}
        y={VDD_Y - 30}
        text="VDD"
        start={t + 4}
        size={28}
        color={COLORS.warm}
      />
      <DrawPath
        d={`M ${SX} ${VDD_Y} V ${P_Y} M ${SX} ${P_Y + 80} V ${N_Y} M ${SX} ${N_Y + 80} V ${GND_Y} M ${SX} ${NODE_Y} H ${CX} V 500 M ${CX} 540 V ${GND_Y} M ${SX} ${GND_Y} H ${CX}`}
        start={t + 6}
        duration={1.2}
        stroke={COLORS.inkSoft}
      />
      <DrawPath
        d={`M ${CX - 70} 500 H ${CX + 70} M ${CX - 70} 540 H ${CX + 70}`}
        start={t + 14}
        duration={0.5}
        stroke={COLORS.ink}
        width={3}
      />
      <DrawPath
        d={`M ${mix(SX, CX) - 40} ${GND_Y} H ${mix(SX, CX) + 40} M ${mix(SX, CX) - 26} ${GND_Y + 12} H ${mix(SX, CX) + 26} M ${mix(SX, CX) - 12} ${GND_Y + 24} H ${mix(SX, CX) + 12}`}
        start={t + 20}
        duration={0.4}
        stroke={COLORS.ink}
      />
      <SvgText
        x={mix(SX, CX)}
        y={GND_Y + 56}
        text="masse"
        start={t + 22}
        size={22}
        color={COLORS.inkSoft}
      />
      {sw(P_Y, "PMOS", pOn, COLORS.accent, t + 8)}
      {sw(N_Y, "NMOS", nOn, COLORS.accent, t + 12)}
      <SvgText
        x={CX + 90}
        y={520}
        text={"connexion\n(capacité C)"}
        start={t + 18}
        size={24}
        anchor="start"
        color={COLORS.inkSoft}
      />
      {/* Charges stockées */}
      {new Array(6).fill(0).map((_, i) => (
        <text
          key={i}
          x={CX - 55 + i * 22}
          y={492}
          textAnchor="middle"
          fontFamily={FONT}
          fontSize={22}
          fill={COLORS.accent}
          opacity={i < n ? 1 : 0}
        >
          +
        </text>
      ))}
      {dots(SX, VDD_Y, SX, NODE_Y, flowUp, 0)}
      {dots(SX, NODE_Y, CX, NODE_Y, flowUp, 0.3)}
      {dots(CX, NODE_Y, SX, NODE_Y, flowDn, 0.1)}
      {dots(SX, NODE_Y, SX, GND_Y, flowDn, 0.6)}
      <Heat x={SX + 110} y={P_Y + 50} o={heatP} />
      <Heat x={SX + 110} y={N_Y + 50} o={heatN} />
      {/* Tension de la connexion */}
      <text
        x={CX + 90}
        y={600}
        fontFamily={FONT}
        fontSize={26}
        fill={COLORS.ink}
        opacity={progress(frame, t + 30, 0.5)}
      >
        V ={" "}
        {(q * 1).toLocaleString("fr-FR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}{" "}
        × VDD
      </text>
    </Svg>
  );
};

// Bilan d'énergie à droite.
const Ledger: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const X = 1000;
  const W = 700;
  const Y = 360;
  const supplied = progress(frame, t + 40, 3.5);
  const split = progress(frame, cues.s(2), 0.6);
  const lost = progress(frame, cues.s(3, 0.7), 3);
  const leftColor = lost > 0.5 ? COLORS.warm : COLORS.accent;
  return (
    <AbsoluteFill>
      <FadeIn
        start={t + 30}
        style={{ position: "absolute", left: X, top: Y - 90, width: W }}
      >
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.inkSoft,
            letterSpacing: "0.28em",
          }}
        >
          ÉNERGIE FOURNIE PAR L’ALIMENTATION
        </div>
      </FadeIn>
      <Svg>
        <DrawPath
          d={roundRectPath(X, Y, W, 60, 8)}
          start={t + 30}
          duration={0.6}
          stroke={COLORS.inkSoft}
          width={1.5}
        />
        {supplied > 0 && split === 0 && (
          <rect
            x={X + 4}
            y={Y + 4}
            width={(W - 8) * supplied}
            height={52}
            rx={6}
            fill={COLORS.accent}
            opacity={0.35}
          />
        )}
        {split > 0 && (
          <g opacity={split}>
            <rect
              x={X + 4}
              y={Y + 4}
              width={W / 2 - 8}
              height={52}
              rx={6}
              fill={leftColor}
              opacity={0.4}
            />
            <rect
              x={X + W / 2 + 4}
              y={Y + 4}
              width={W / 2 - 8}
              height={52}
              rx={6}
              fill={COLORS.warm}
              opacity={0.4}
            />
          </g>
        )}
        <SvgText
          x={X + W}
          y={Y + 100}
          text="C × VDD², fournie pendant la charge"
          start={t + 100}
          size={26}
          anchor="end"
        />
      </Svg>
      <FadeIn
        start={cues.s(2)}
        style={{
          position: "absolute",
          left: X,
          top: Y + 150,
          width: W / 2 - 20,
        }}
      >
        <div
          style={{
            ...textStyle(22, 500),
            color: leftColor,
            letterSpacing: "0.2em",
          }}
        >
          {lost > 0.5 ? "DISSIPÉE (NMOS)" : "STOCKÉE DANS C"}
        </div>
        <div style={{ ...textStyle(30, 300), marginTop: 8 }}>½ C × VDD²</div>
      </FadeIn>
      <FadeIn
        start={cues.s(2, 0.8)}
        style={{
          position: "absolute",
          left: X + W / 2 + 10,
          top: Y + 150,
          width: W / 2 - 10,
        }}
      >
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.warm,
            letterSpacing: "0.2em",
          }}
        >
          DISSIPÉE (PMOS)
        </div>
        <div style={{ ...textStyle(30, 300), marginTop: 8 }}>½ C × VDD²</div>
      </FadeIn>
      <FadeIn
        start={cues.s(3, 1)}
        style={{ position: "absolute", left: X, top: Y + 280, width: W }}
      >
        <div style={{ ...textStyle(26, 300), color: COLORS.inkSoft }}>
          À la décharge, l’énergie stockée part à son tour en chaleur dans le
          NMOS.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Beat 3 : fournie par cycle vs stockée.
const Compare: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(3);
  const X = 560;
  const W = 900;
  const a = progress(frame, t + 10, 1.2);
  const b = progress(frame, cues.s(5, 1.5), 1);
  return (
    <AbsoluteFill>
      <Title
        kicker="Deux quantités à ne pas confondre"
        text="Fournie par cycle ou stockée ?"
        start={t}
        top={100}
      />
      <Svg>
        <SvgText
          x={X - 30}
          y={360}
          text={"fournie par cycle\n(charge + décharge)"}
          start={t + 10}
          size={26}
          anchor="end"
        />
        <rect
          x={X}
          y={330}
          width={W * a}
          height={60}
          rx={8}
          fill={COLORS.warm}
          opacity={0.45}
        />
        <SvgText
          x={X + W + 20}
          y={360}
          text="C × VDD²"
          start={t + 30}
          size={34}
          anchor="start"
          color={COLORS.warm}
        />
        <SvgText
          x={X - 30}
          y={500}
          text={"stockée à\nl’état chargé"}
          start={cues.s(5, 1.5)}
          size={26}
          anchor="end"
        />
        <rect
          x={X}
          y={470}
          width={(W / 2) * b}
          height={60}
          rx={8}
          fill={COLORS.accent}
          opacity={0.45}
        />
        <SvgText
          x={X + W / 2 + 20}
          y={500}
          text="½ C × VDD²"
          start={cues.s(5, 2.2)}
          size={34}
          anchor="start"
          color={COLORS.accent}
        />
        <DrawPath
          d={`M ${X + W / 2} 560 V 600 H ${X + W} V 560`}
          start={cues.s(6)}
          duration={0.8}
          stroke={COLORS.warm}
        />
      </Svg>
      <FadeIn
        start={cues.s(6, 0.6)}
        style={{
          position: "absolute",
          top: 630,
          left: X + W / 2 - 100,
          width: W / 2 + 200,
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.warm,
            letterSpacing: "0.28em",
          }}
        >
          ATTENTION
        </div>
        <div style={{ ...textStyle(34, 300), marginTop: 8 }}>
          les confondre = erreur d’un{" "}
          <span style={{ color: COLORS.warm }}>facteur deux</span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 19 — Une charge déplacée à chaque changement.
export const S19: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const b2 = cues.beat(2);
  const eqO = interpolate(frame, [b2, b2 + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(3)}>
        <Title
          kicker="Pourquoi commuter consomme"
          text="Une charge déplacée à chaque changement"
          start={cues.s(0)}
          top={100}
        />
        <Circuit />
        <Stage from={0} to={b2}>
          <Ledger />
        </Stage>
        <Stage from={b2}>
          <div style={{ opacity: eqO }}>
            <FadeIn
              start={b2}
              style={{ position: "absolute", left: 1000, top: 290, width: 720 }}
            >
              <div
                style={{
                  ...textStyle(22, 500),
                  color: COLORS.inkSoft,
                  letterSpacing: "0.28em",
                }}
              >
                CYCLE COMPLET : CHARGE PUIS DÉCHARGE
              </div>
            </FadeIn>
            <div
              style={{ position: "absolute", left: 860, top: 380, width: 1000 }}
            >
              <Equation
                parts={["E", "=", "C", "×", "VDD²"]}
                starts={[b2 + 10, b2 + 20, b2 + 30, b2 + 40, b2 + 50]}
                y={0}
                size={72}
              />
            </div>
            <FadeIn
              start={b2 + 70}
              style={{ position: "absolute", left: 1000, top: 540, width: 720 }}
            >
              <div style={{ ...textStyle(30, 300), lineHeight: 1.4 }}>
                fournie par l’alimentation, puis{" "}
                <span style={{ color: COLORS.warm }}>
                  entièrement dissipée en chaleur
                </span>
              </div>
            </FadeIn>
          </div>
        </Stage>
      </Stage>
      <Stage from={cues.beat(3)}>
        <Compare />
      </Stage>
    </AbsoluteFill>
  );
};
