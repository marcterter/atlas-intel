import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
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

// Charges qui dérivent lentement de gauche à droite dans une bande.
export const Drift: React.FC<{
  x0: number;
  x1: number;
  y: number;
  h: number;
  n: number;
  speed: number;
  start: number;
  seed: string;
  color?: string;
  r?: number;
  opacity?: number;
}> = ({
  x0,
  x1,
  y,
  h,
  n,
  speed,
  start,
  seed,
  color = COLORS.accent,
  r = 4,
  opacity = 0.9,
}) => {
  const frame = useCurrentFrame();
  const appear = progress(frame, start, 0.8);
  if (appear === 0) return null;
  const L = x1 - x0;
  return (
    <g>
      {new Array(n).fill(0).map((_, i) => {
        const x =
          x0 +
          ((random(`${seed}x${i}`) * L +
            (frame - start) * speed * (0.8 + random(`${seed}v${i}`) * 0.4)) %
            L);
        const cy = y + (random(`${seed}y${i}`) - 0.5) * h;
        const edge = Math.max(0, Math.min(1, (x - x0) / 40, (x1 - x) / 40));
        return (
          <circle
            key={i}
            cx={x}
            cy={cy}
            r={r}
            fill={color}
            opacity={appear * edge * opacity}
          />
        );
      })}
    </g>
  );
};

// Coupe simplifiée d'un transistor : source, canal, drain, grille.
const Transistor: React.FC<{
  cx: number;
  y: number;
  start: number;
  on: boolean;
}> = ({ cx, y, start, on }) => {
  const frame = useCurrentFrame();
  const glow = progress(frame, start + 30, 0.8);
  const gateColor = on ? COLORS.accent : COLORS.inkSoft;
  return (
    <g>
      <DrawPath
        d={roundRectPath(cx - 270, y, 130, 90, 8)}
        start={start}
        duration={0.8}
      />
      <DrawPath
        d={roundRectPath(cx + 140, y, 130, 90, 8)}
        start={start}
        duration={0.8}
      />
      <DrawPath
        d={`M ${cx - 140} ${y + 12} H ${cx + 140} M ${cx - 140} ${y + 78} H ${cx + 140}`}
        start={start + 8}
        duration={0.8}
        stroke={COLORS.inkFaint}
        width={1.4}
      />
      {/* Isolant puis grille */}
      <DrawPath
        d={`M ${cx - 125} ${y - 10} H ${cx + 125}`}
        start={start + 12}
        duration={0.6}
        stroke={COLORS.inkSoft}
        width={3}
      />
      <path
        d={roundRectPath(cx - 115, y - 70, 230, 48, 6)}
        fill={gateColor}
        opacity={on ? 0.18 * glow : 0.05 * glow}
      />
      <DrawPath
        d={roundRectPath(cx - 115, y - 70, 230, 48, 6)}
        start={start + 16}
        duration={0.7}
        stroke={gateColor}
      />
      <SvgText
        x={cx}
        y={y - 46}
        text={on ? "grille activée" : "grille au repos"}
        start={start + 24}
        size={22}
        weight={400}
        color={gateColor}
      />
      <SvgText
        x={cx - 205}
        y={y + 118}
        text="Source"
        start={start + 20}
        size={22}
        color={COLORS.inkSoft}
      />
      <SvgText
        x={cx + 205}
        y={y + 118}
        text="Drain"
        start={start + 20}
        size={22}
        color={COLORS.inkSoft}
      />
    </g>
  );
};

// Beats 0 à 2 : les deux états, Ion et Ioff, et leurs conséquences.
const TwoStates: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const XS = [560, 1360];
  const Y = 380;
  const fill = progress(frame, cues.s(3, 0.8), 1.2);
  const leak = progress(frame, cues.s(3, 4.5), 3);
  return (
    <AbsoluteFill>
      <Svg>
        {XS.map((x, i) => (
          <g key={x}>
            <SvgText
              x={x}
              y={265}
              text={i === 0 ? "ACTIVÉ" : "BLOQUÉ"}
              start={t + i * 20}
              size={24}
              weight={500}
              spacing="0.3em"
              color={i === 0 ? COLORS.accent : COLORS.inkSoft}
            />
            <Transistor cx={x} y={Y} start={t + i * 20} on={i === 0} />
          </g>
        ))}
        {/* Beaucoup de charges quand il est activé, un filet quand il est bloqué */}
        <Drift
          x0={XS[0] - 250}
          x1={XS[0] + 250}
          y={Y + 45}
          h={50}
          n={34}
          speed={3}
          start={t + 45}
          seed="on"
        />
        <Drift
          x0={XS[1] - 250}
          x1={XS[1] + 250}
          y={Y + 45}
          h={50}
          n={3}
          speed={0.8}
          start={t + 65}
          seed="off"
          color={COLORS.warm}
          r={3.5}
        />
        {/* Beat 2 : conséquences */}
        {[0, 1].map((i) => {
          const x = XS[i];
          const s = i === 0 ? cues.s(3) : cues.s(3, 4.5);
          const color = i === 0 ? COLORS.accent : COLORS.warm;
          const level = i === 0 ? fill : leak * 0.08;
          return (
            <g key={i}>
              <DrawPath
                d={roundRectPath(x - 220, 720, 440, 34, 17)}
                start={s}
                duration={0.7}
                stroke={COLORS.inkSoft}
                width={1.5}
              />
              {level > 0 && (
                <path
                  d={roundRectPath(
                    x - 216,
                    724,
                    Math.max(26, 432 * level),
                    26,
                    13,
                  )}
                  fill={color}
                  opacity={0.55}
                />
              )}
              <SvgText
                x={x}
                y={690}
                text={
                  i === 0
                    ? "charge de la connexion suivante"
                    : "énergie perdue à l’arrêt"
                }
                start={s}
                size={22}
                weight={400}
                color={COLORS.inkSoft}
              />
              <SvgText
                x={x}
                y={800}
                text={
                  i === 0
                    ? "Ion élevé → charge rapide"
                    : "Ioff faible → peu de pertes"
                }
                start={s + 20}
                size={28}
                color={color}
              />
            </g>
          );
        })}
      </Svg>
      {/* Beat 1 : nommer les deux courants */}
      {XS.map((x, i) => (
        <FadeIn
          key={x}
          start={cues.s(2, i * 1.2)}
          style={{
            position: "absolute",
            top: 530,
            left: x - 300,
            width: 600,
            textAlign: "center",
          }}
        >
          <span
            style={{
              ...textStyle(56, 200),
              color: i === 0 ? COLORS.accent : COLORS.warm,
            }}
          >
            I<sub style={{ fontSize: 30 }}>{i === 0 ? "on" : "off"}</sub>
          </span>
          <span
            style={{ ...textStyle(28, 300), color: COLORS.ink, marginLeft: 18 }}
          >
            {i === 0 ? "courant passant" : "courant bloqué (fuite)"}
          </span>
        </FadeIn>
      ))}
    </AbsoluteFill>
  );
};

// Courbe illustrative log(I) en fonction de la tension de grille.
const X0 = 300;
const X1 = 1040;
const YB = 790;
const YT = 290;
const logI = (v: number, vt: number) => {
  const x = (v - vt) / 0.08;
  const l = x > 30 ? x : Math.log(1 + Math.exp(x));
  return Math.log10(l * l);
};
const px = (v: number) => X0 + v * (X1 - X0);
const py = (l: number) => YB - ((l + 5) / 7.5) * (YB - YT);
const curve = (vt: number) =>
  new Array(61)
    .fill(0)
    .map((_, k) => {
      const v = k / 60;
      return `${k === 0 ? "M" : "L"} ${px(v).toFixed(1)} ${py(logI(v, vt)).toFixed(1)}`;
    })
    .join(" ");

const Threshold: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(3);
  const shift = progress(frame, cues.s(4, 3), 2.5);
  const vt = 0.42 - 0.14 * shift;
  const offY = py(logI(0, vt));
  const onY = py(logI(1, vt));
  const oldOffY = py(logI(0, 0.42));
  const oldOnY = py(logI(1, 0.42));
  const dotO = progress(frame, t + 40, 0.5);
  return (
    <AbsoluteFill>
      <Title
        kicker="Le seuil de conduction"
        text="Abaisser le seuil : Ion monte, mais Ioff aussi"
        start={t}
        top={100}
      />
      <Svg>
        {/* Axes */}
        <DrawPath
          d={`M ${X0} ${YT - 20} V ${YB} H ${X1 + 30}`}
          start={t + 6}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1.5}
        />
        <SvgText
          x={X0 - 20}
          y={YT - 10}
          text={"courant\n(échelle log)"}
          start={t + 14}
          size={22}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <SvgText
          x={(X0 + X1) / 2}
          y={YB + 62}
          text="tension de grille →"
          start={t + 14}
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={X0}
          y={YB + 28}
          text="0 V (bloqué)"
          start={t + 14}
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={X1}
          y={YB + 28}
          text="VDD (activé)"
          start={t + 14}
          size={22}
          color={COLORS.inkSoft}
        />
        {/* Courbe initiale, puis courbe décalée */}
        <DrawPath
          d={curve(0.42)}
          start={t + 20}
          duration={1.6}
          stroke={shift > 0 ? COLORS.inkFaint : COLORS.ink}
          width={2.5}
        />
        {shift > 0 && (
          <path d={curve(vt)} fill="none" stroke={COLORS.ink} strokeWidth={3} />
        )}
        {/* Ligne de seuil */}
        <g opacity={progress(frame, t + 34, 0.6)}>
          <path
            d={`M ${px(vt)} ${YT} V ${YB}`}
            stroke={COLORS.accent}
            strokeWidth={1.5}
            strokeDasharray="6 8"
          />
          <circle cx={px(vt)} cy={YB} r={9} fill={COLORS.accent} />
          <text
            x={px(vt) + 12}
            y={YT + 10}
            fontFamily={FONT}
            fontSize={24}
            fontWeight={400}
            fill={COLORS.accent}
          >
            seuil
          </text>
        </g>
        {/* Traces des anciennes valeurs */}
        {shift > 0.05 && (
          <g opacity={shift}>
            <circle cx={X0} cy={oldOffY} r={6} fill={COLORS.inkFaint} />
            <circle cx={X1} cy={oldOnY} r={6} fill={COLORS.inkFaint} />
          </g>
        )}
        <circle cx={X0} cy={offY} r={10} fill={COLORS.warm} opacity={dotO} />
        <circle cx={X1} cy={onY} r={10} fill={COLORS.accent} opacity={dotO} />
        <g opacity={dotO}>
          <text
            x={X0 + 22}
            y={offY + 8}
            fontFamily={FONT}
            fontSize={26}
            fill={COLORS.warm}
          >
            Ioff
          </text>
          <text
            x={X1 - 22}
            y={onY - 20}
            textAnchor="end"
            fontFamily={FONT}
            fontSize={26}
            fill={COLORS.accent}
          >
            Ion
          </text>
        </g>
        {shift > 0.9 && (
          <Arrow
            x1={X0 - 30}
            y1={oldOffY + 4}
            x2={X0 - 30}
            y2={offY - 4}
            start={cues.s(4, 5.6)}
            stroke={COLORS.warm}
          />
        )}
      </Svg>
      {/* Lecture à droite */}
      <div style={{ position: "absolute", left: 1170, top: 330, width: 610 }}>
        <FadeIn start={cues.s(4, 3)}>
          <div style={{ ...textStyle(30, 300) }}>
            <span style={{ color: COLORS.accent }}>←</span> seuil abaissé
          </div>
        </FadeIn>
        <FadeIn start={cues.s(4, 5)} style={{ marginTop: 40 }}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.accent,
              letterSpacing: "0.25em",
            }}
          >
            ION ↑
          </div>
          <div style={{ ...textStyle(30, 300), marginTop: 8 }}>
            conduction facilitée : plus rapide
          </div>
        </FadeIn>
        <FadeIn start={cues.s(4, 6.5)} style={{ marginTop: 36 }}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.warm,
              letterSpacing: "0.25em",
            }}
          >
            IOFF ↑↑
          </div>
          <div style={{ ...textStyle(30, 300), marginTop: 8 }}>
            fuite sous le seuil : bien plus de pertes à l’arrêt
          </div>
        </FadeIn>
        <FadeIn start={cues.s(4, 1)} style={{ marginTop: 44 }}>
          <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
            À dimensions et technologie comparables · courbe illustrative
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// Beat 4 : triangle d'arbitrage et transistor plus large.
const TradeOff: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(4);
  const A: [number, number] = [520, 280];
  const B: [number, number] = [260, 720];
  const C: [number, number] = [780, 720];
  const k = frame / 30;
  const dot = progress(frame, t + 40, 0.6);
  const dx = 520 + Math.sin(k * 0.9) * 50;
  const dy = 580 + Math.cos(k * 0.7) * 40;
  const s = cues.s(6);
  const grow = progress(frame, s + 10, 1.2);
  const W2 = 90 + 90 * grow;
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={`M ${A[0]} ${A[1]} L ${B[0]} ${B[1]} L ${C[0]} ${C[1]} Z`}
          start={t + 6}
          duration={1.4}
          stroke={COLORS.inkSoft}
          width={1.8}
        />
        <SvgText
          x={A[0]}
          y={A[1] - 34}
          text="Vitesse"
          start={t + 16}
          size={30}
          color={COLORS.accent}
        />
        <SvgText
          x={B[0]}
          y={B[1] + 44}
          text="Puissance"
          start={t + 22}
          size={30}
          color={COLORS.warm}
        />
        <SvgText
          x={C[0]}
          y={C[1] + 44}
          text="Surface"
          start={t + 28}
          size={30}
        />
        <circle cx={dx} cy={dy} r={10} fill={COLORS.ink} opacity={dot} />
        <SvgText
          x={520}
          y={640}
          text="choix du concepteur"
          start={t + 46}
          size={22}
          color={COLORS.inkSoft}
        />
        {/* Deux transistors vus de dessus : largeur W puis 2W */}
        <SvgText
          x={1340}
          y={250}
          text="TRANSISTOR PLUS LARGE"
          start={s}
          size={22}
          weight={500}
          spacing="0.25em"
          color={COLORS.inkSoft}
        />
        <DrawPath
          d={roundRectPath(1100, 480 - W2 / 2, 480, W2, 8)}
          start={s}
          duration={0.8}
          stroke={COLORS.ink}
        />
        <path
          d={roundRectPath(1300, 470 - W2 / 2, 80, W2 + 20, 4)}
          fill={COLORS.accent}
          opacity={0.15 * progress(frame, s, 0.8)}
        />
        <DrawPath
          d={roundRectPath(1300, 470 - W2 / 2, 80, W2 + 20, 4)}
          start={s + 6}
          duration={0.8}
          stroke={COLORS.accent}
        />
        <SvgText
          x={1340}
          y={455 - W2 / 2}
          text="grille"
          start={s + 12}
          size={22}
          color={COLORS.accent}
        />
        <SvgText
          x={1060}
          y={480}
          text="largeur"
          start={s + 12}
          size={22}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <Drift
          x0={1110}
          x1={1570}
          y={480}
          h={W2 - 20}
          n={Math.round(8 + 14 * grow)}
          speed={2.4}
          start={s + 14}
          seed="wide"
        />
        <SvgText
          x={1340}
          y={700}
          text="+ de courant → charge plus vite"
          start={s + 40}
          size={28}
          color={COLORS.accent}
        />
        <SvgText
          x={1340}
          y={760}
          text="+ de capacité électrique à charger"
          start={s + 70}
          size={28}
          color={COLORS.warm}
        />
      </Svg>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 110,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.warm,
            letterSpacing: "0.3em",
          }}
        >
          LE CONCEPTEUR ARBITRE
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 13 — Le compromis vitesse et fuite.
export const S13: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(3)}>
        <Title
          kicker="Du transistor réel au circuit CMOS"
          text="Le compromis vitesse et fuite"
          start={cues.s(0)}
          top={100}
        />
        <TwoStates />
      </Stage>
      <Stage from={cues.beat(3)} to={cues.beat(4)}>
        <Threshold />
      </Stage>
      <Stage from={cues.beat(4)}>
        <TradeOff />
      </Stage>
    </AbsoluteFill>
  );
};
