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
import { COLORS } from "../theme";
import { Caps, Electron, Hole } from "./S04";

// Bande d'énergie : rectangle, rempli d'électrons (occupé) ou vide.
export const Band: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  start: number;
  filled?: number; // progression du remplissage (0 → 1)
  color?: string;
  dotStep?: number;
}> = ({
  x,
  y,
  w,
  h,
  start,
  filled = 0,
  color = COLORS.inkSoft,
  dotStep = 22,
}) => {
  const cols = Math.floor((w - 10) / dotStep);
  const rows = Math.floor((h - 10) / dotStep);
  const ox = x + (w - (cols - 1) * dotStep) / 2;
  const oy = y + (h - (rows - 1) * dotStep) / 2;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={4}
        fill={COLORS.accent}
        opacity={0.1 * filled}
      />
      <DrawPath
        d={roundRectPath(x, y, w, h, 4)}
        start={start}
        duration={0.9}
        stroke={color}
        width={1.6}
      />
      {filled > 0 &&
        new Array(cols * rows).fill(0).map((_, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          // Remplissage de bas en haut.
          const k = (rows - 1 - r) / rows;
          const o = Math.min(1, Math.max(0, (filled - k) * rows));
          return (
            <Electron
              key={i}
              x={ox + c * dotStep}
              y={oy + r * dotStep}
              r={4}
              o={o * 0.85}
            />
          );
        })}
    </g>
  );
};

// Les bandes : valence, conduction, bande interdite.
const Bands: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const x = 620;
  const w = 380;
  const cb = [290, 440];
  const vb = [620, 780];
  const tAxis = cues.s(1);
  const tBands = cues.s(2);
  const tVal = cues.beat(1);
  const tCond = cues.beat(2);
  const tGap = cues.beat(3);
  // Niveaux autorisés : des traits fins regroupés en deux paquets.
  const levels = new Array(22).fill(0).map((_, i) => {
    const inUpper = i < 11;
    const [a, b] = inUpper ? cb : vb;
    const k = (i % 11) / 10;
    return a + 8 + k * (b - a - 16);
  });
  const condO = progress(frame, tCond + 20, 0.6);
  return (
    <AbsoluteFill>
      <Svg>
        {/* Axe de l'énergie */}
        <Arrow
          x1={540}
          y1={820}
          x2={540}
          y2={260}
          start={tAxis}
          duration={1}
          stroke={COLORS.inkSoft}
        />
        <Caps x={540} y={230} text="énergie" start={tAxis + 10} />
        {/* Niveaux autorisés */}
        {levels.map((y, i) => (
          <DrawPath
            key={i}
            d={`M ${x + 10} ${y} H ${x + w - 10}`}
            start={tBands + (i % 11) * 2 + (i < 11 ? 12 : 0)}
            duration={0.5}
            stroke={COLORS.inkFaint}
            width={1.2}
          />
        ))}
        <Band
          x={x}
          y={vb[0]}
          w={w}
          h={vb[1] - vb[0]}
          start={tBands + 20}
          filled={progress(frame, tVal + 10, 2)}
          color={COLORS.ink}
        />
        <Band
          x={x}
          y={cb[0]}
          w={w}
          h={cb[1] - cb[0]}
          start={tBands + 32}
          color={frame > tCond ? COLORS.accent : COLORS.ink}
        />
        {/* Quelques électrons mobiles dans la bande de conduction */}
        {[0, 1, 2].map((i) => {
          const px =
            x + 30 + ((random(`cb${i}`) * 320 + (frame - tCond) * 1.4) % 320);
          return (
            <Electron key={i} x={px} y={cb[0] + 40 + i * 35} r={6} o={condO} />
          );
        })}
        {condO > 0 && (
          <Arrow
            x1={x + 120}
            y1={cb[0] - 22}
            x2={x + 260}
            y2={cb[0] - 22}
            start={tCond + 30}
            stroke={COLORS.accent}
          />
        )}
        {/* Bande interdite */}
        <rect
          x={x}
          y={cb[1]}
          width={w}
          height={vb[0] - cb[1]}
          fill={COLORS.warm}
          opacity={0.07 * progress(frame, tGap, 0.8)}
        />
        <Arrow
          x1={x + w / 2}
          y1={(cb[1] + vb[0]) / 2}
          x2={x + w / 2}
          y2={cb[1] + 6}
          start={tGap + 10}
          stroke={COLORS.warm}
        />
        <Arrow
          x1={x + w / 2}
          y1={(cb[1] + vb[0]) / 2}
          x2={x + w / 2}
          y2={vb[0] - 6}
          start={tGap + 10}
          stroke={COLORS.warm}
        />
        <SvgText
          x={x + w / 2 + 20}
          y={(cb[1] + vb[0]) / 2}
          text="Eg"
          start={tGap + 20}
          size={30}
          color={COLORS.warm}
          anchor="start"
        />
        {/* Traits de rappel vers les légendes */}
        <DrawPath
          d={`M ${x + w + 20} ${(vb[0] + vb[1]) / 2} H 1080`}
          start={tVal}
          duration={0.5}
          stroke={COLORS.inkFaint}
          width={1}
        />
        <DrawPath
          d={`M ${x + w + 20} ${(cb[0] + cb[1]) / 2} H 1080`}
          start={tCond}
          duration={0.5}
          stroke={COLORS.inkFaint}
          width={1}
        />
        <DrawPath
          d={`M ${x + w + 20} ${(cb[1] + vb[0]) / 2} H 1080`}
          start={tGap}
          duration={0.5}
          stroke={COLORS.inkFaint}
          width={1}
        />
      </Svg>
      {/* Légendes des étapes 1 et 2, remplacées ensuite par celles des bandes */}
      <Stage from={tAxis} to={tVal}>
        <FadeIn
          start={tAxis + 6}
          style={{ position: "absolute", left: 1100, top: 400, width: 640 }}
        >
          <div style={{ ...textStyle(32, 300), lineHeight: 1.35 }}>
            Un électron du solide n’a pas accès à{" "}
            <span style={{ color: COLORS.warm }}>n’importe quelle énergie</span>
          </div>
        </FadeIn>
        <FadeIn
          start={tBands + 6}
          style={{ position: "absolute", left: 1100, top: 560, width: 640 }}
        >
          <div style={{ ...textStyle(32, 300), lineHeight: 1.35 }}>
            Les <span style={{ color: COLORS.accent }}>états autorisés</span>{" "}
            sont regroupés en{" "}
            <span style={{ color: COLORS.accent }}>bandes</span>
          </div>
        </FadeIn>
      </Stage>
      <Stage from={tVal}>
        {[
          {
            top: cb[0] + 20,
            at: tCond,
            name: "Bande de conduction",
            text: "états où des électrons mobiles assurent le transport",
            c: COLORS.accent,
          },
          {
            top: cb[1] + 50,
            at: tGap,
            name: "Bande interdite",
            text: "aucun état électronique autorisé (cristal idéal)",
            c: COLORS.warm,
          },
          {
            top: vb[0] + 20,
            at: tVal,
            name: "Bande de valence",
            text: "notamment les états associés aux liaisons",
            c: COLORS.ink,
          },
        ].map((l) => (
          <FadeIn
            key={l.name}
            start={l.at + 8}
            style={{ position: "absolute", left: 1100, top: l.top, width: 680 }}
          >
            <div
              style={{
                ...textStyle(24, 500),
                color: l.c,
                letterSpacing: "0.18em",
              }}
            >
              {l.name.toUpperCase()}
            </div>
            <div style={{ ...textStyle(28, 300), marginTop: 8 }}>{l.text}</div>
          </FadeIn>
        ))}
      </Stage>
    </AbsoluteFill>
  );
};

// Trois matériaux côte à côte, schéma qualitatif.
const Compare: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(4);
  const top = 360;
  const bottom = 760;
  const w = 280;
  const cols = [
    {
      name: "Métal",
      cx: 520,
      at: cues.s(7),
      cap: "états libres tout près\ndes états occupés",
    },
    {
      name: "Semi-conducteur",
      cx: 960,
      at: cues.s(8),
      cap: "écart franchissable par\nune fraction des électrons",
    },
    {
      name: "Isolant",
      cx: 1400,
      at: cues.s(9),
      cap: "écart généralement\nplus grand",
    },
  ];
  return (
    <AbsoluteFill>
      <Title text="Trois matériaux comparés" start={t} />
      <Svg>
        <Caps
          x={960}
          y={225}
          text="schéma qualitatif · non à l’échelle"
          start={t + 30}
          color={COLORS.warm}
        />
        <Arrow
          x1={250}
          y1={bottom}
          x2={250}
          y2={top - 20}
          start={t + 10}
          stroke={COLORS.inkSoft}
        />
        <Caps x={250} y={top - 45} text="énergie" start={t + 16} />
        {cols.map((c, i) => (
          <SvgText
            key={c.name}
            x={c.cx}
            y={300}
            text={c.name}
            start={i === 0 ? t + 20 : c.at}
            size={32}
            weight={300}
          />
        ))}
        {/* Métal : une bande en partie remplie, états libres juste au-dessus */}
        <Band
          x={cols[0].cx - w / 2}
          y={560}
          w={w}
          h={bottom - 560}
          start={cols[0].at}
          filled={progress(frame, cols[0].at + 10, 1)}
          color={COLORS.ink}
        />
        <DrawPath
          d={`M ${cols[0].cx - w / 2} 560 V 400 H ${cols[0].cx + w / 2} V 560`}
          start={cols[0].at + 20}
          duration={0.8}
          stroke={COLORS.accent}
          width={1.6}
        />
        {[0, 1, 2, 3].map((i) => {
          const x =
            cols[0].cx -
            w / 2 +
            20 +
            ((random(`m${i}`) * 240 + (frame - cols[0].at) * 1.8) % 240);
          return (
            <Electron
              key={i}
              x={x}
              y={540 - i * 16}
              r={5}
              o={progress(frame, cols[0].at + 40, 0.6)}
            />
          );
        })}
        {/* Semi-conducteur : petit écart */}
        <Band
          x={cols[1].cx - w / 2}
          y={400}
          w={w}
          h={130}
          start={cols[1].at}
          color={COLORS.accent}
        />
        <Band
          x={cols[1].cx - w / 2}
          y={620}
          w={w}
          h={bottom - 620}
          start={cols[1].at + 6}
          filled={progress(frame, cols[1].at + 10, 1)}
          color={COLORS.ink}
        />
        {[0, 1, 2].map((i) => {
          // Quelques électrons franchissent l'écart puis se déplacent.
          const jump = progress(frame, cols[1].at + 50 + i * 25, 0.8);
          const x = cols[1].cx - 90 + i * 90;
          const y = 640 + (500 - 640 + i * 10) * jump;
          const drift =
            jump >= 1 ? Math.sin((frame - cols[1].at) / 30 + i) * 30 : 0;
          return (
            <g key={i}>
              <Hole
                x={x}
                y={640}
                r={6}
                o={progress(frame, cols[1].at + 50 + i * 25, 0.3)}
              />
              <Electron
                x={x + drift}
                y={y}
                r={6}
                o={progress(frame, cols[1].at + 40 + i * 25, 0.3)}
              />
            </g>
          );
        })}
        <SvgText
          x={cols[1].cx + w / 2 + 16}
          y={575}
          text="petit"
          start={cols[1].at + 30}
          size={24}
          color={COLORS.warm}
          anchor="start"
        />
        {/* Isolant : grand écart */}
        <Band
          x={cols[2].cx - w / 2}
          y={400}
          w={w}
          h={80}
          start={cols[2].at}
          color={COLORS.inkSoft}
        />
        <Band
          x={cols[2].cx - w / 2}
          y={660}
          w={w}
          h={bottom - 660}
          start={cols[2].at + 6}
          filled={progress(frame, cols[2].at + 10, 0.8)}
          color={COLORS.ink}
        />
        <Arrow
          x1={cols[2].cx}
          y1={570}
          x2={cols[2].cx}
          y2={486}
          start={cols[2].at + 20}
          stroke={COLORS.warm}
        />
        <Arrow
          x1={cols[2].cx}
          y1={570}
          x2={cols[2].cx}
          y2={654}
          start={cols[2].at + 20}
          stroke={COLORS.warm}
        />
        <SvgText
          x={cols[2].cx + 16}
          y={570}
          text="grand"
          start={cols[2].at + 30}
          size={24}
          color={COLORS.warm}
          anchor="start"
        />
        {cols.map((c) => (
          <SvgText
            key={c.cap}
            x={c.cx}
            y={825}
            text={c.cap}
            start={c.at + 30}
            size={24}
            color={COLORS.inkSoft}
          />
        ))}
      </Svg>
    </AbsoluteFill>
  );
};

// Scène 5 — Les bandes d'énergie.
export const S05: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(4)}>
        <Title
          text="Pourquoi tous les matériaux ne conduisent pas pareil"
          start={cues.s(0)}
        />
        <Bands />
      </Stage>
      <Stage from={cues.beat(4)}>
        <Compare />
      </Stage>
    </AbsoluteFill>
  );
};
