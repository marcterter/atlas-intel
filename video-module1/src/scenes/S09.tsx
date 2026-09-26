import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Icon, Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import { Caps, Electron, Hole, Ion, Note, Txt, wander } from "./S04";

// ——— 1. Formation de la zone appauvrie, champ interne, équilibre ———
const Junction: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t0 = cues.s(0);
  const tDiff = cues.s(1, 1.5);
  const tRec = cues.s(2);
  const tZone = cues.s(3);
  const tEq = cues.beat(2);
  const X0 = 300;
  const XJ = 960;
  const X1 = 1620;
  const Y0 = 250;
  const Y1 = 510;
  const rowsY = [290, 350, 410, 470];
  const colX = (k: number, n: boolean) =>
    n ? XJ + 33 + 66 * k : X0 + 33 + 66 * k;
  const ZL = 850;
  const ZR = 1070;
  const diff = progress(frame, tDiff, 4);
  const rec = progress(frame, tRec, 1);
  const zone = progress(frame, tZone, 0.8);
  const onC = progress(frame, t0 + 30, 0.6);
  const ions: React.ReactNode[] = [];
  const carriers: React.ReactNode[] = [];
  [false, true].forEach((n) => {
    for (let k = 0; k < 10; k++)
      rowsY.forEach((y, r) => {
        const x = colX(k, n);
        const inZone = x > ZL && x < ZR;
        ions.push(
          <Ion
            key={`i${n}${k}${r}`}
            x={x}
            y={y}
            sign={n ? "+" : "-"}
            r={9}
            color={
              inZone && zone > 0
                ? n
                  ? COLORS.accent
                  : COLORS.warm
                : COLORS.inkFaint
            }
            o={progress(frame, t0 + 10 + k * 2, 0.5)}
          />,
        );
        // Porteur mobile associé à chaque dopant.
        const [dx, dy] = wander(`${n}${k}${r}`, frame, 10);
        const bx = x + (random(`bx${n}${k}${r}`) - 0.5) * 30;
        const by = y + 28;
        if (inZone) {
          // Les porteurs proches de la jonction diffusent de l'autre côté, puis se recombinent.
          const dir = n ? -1 : 1;
          const travel = 150 + random(`tr${n}${k}${r}`) * 90;
          const cx = bx + dir * travel * diff + dx * 0.4;
          const o = onC * (1 - rec);
          carriers.push(
            n ? (
              <Electron
                key={`c${n}${k}${r}`}
                x={cx}
                y={by + dy * 0.5}
                r={6}
                o={o}
              />
            ) : (
              <Hole
                key={`c${n}${k}${r}`}
                x={cx}
                y={by + dy * 0.5}
                r={6.5}
                o={o}
              />
            ),
          );
          // Éclat de recombinaison.
          if (rec > 0 && rec < 1) {
            carriers.push(
              <circle
                key={`f${n}${k}${r}`}
                cx={cx}
                cy={by + dy * 0.5}
                r={6 + rec * 18}
                fill="none"
                stroke={COLORS.ink}
                strokeWidth={1.2}
                opacity={(1 - rec) * 0.8}
              />,
            );
          }
        } else {
          carriers.push(
            n ? (
              <Electron
                key={`c${n}${k}${r}`}
                x={bx + dx}
                y={by + dy * 0.6}
                r={6}
                o={onC}
              />
            ) : (
              <Hole
                key={`c${n}${k}${r}`}
                x={bx + dx}
                y={by + dy * 0.6}
                r={6.5}
                o={onC}
              />
            ),
          );
        }
      });
  });
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={roundRectPath(X0, Y0, X1 - X0, Y1 - Y0, 6)}
          start={t0}
          duration={1.2}
          stroke={COLORS.inkSoft}
          width={1.6}
        />
        <DrawPath
          d={`M ${XJ} ${Y0} V ${Y1}`}
          start={t0 + 10}
          duration={0.6}
          stroke={COLORS.inkFaint}
          width={1.2}
        />
        <Caps
          x={(X0 + XJ) / 2}
          y={225}
          text="région p"
          start={t0 + 6}
          color={COLORS.warm}
        />
        <Caps
          x={(XJ + X1) / 2}
          y={225}
          text="région n"
          start={t0 + 6}
          color={COLORS.accent}
        />
        {/* Zone appauvrie */}
        <rect
          x={ZL}
          y={Y0}
          width={ZR - ZL}
          height={Y1 - Y0}
          fill={COLORS.ink}
          opacity={0.06 * zone}
        />
        <DrawPath
          d={`M ${ZL} ${Y0} V ${Y1} M ${ZR} ${Y0} V ${Y1}`}
          start={tZone}
          duration={0.6}
          stroke={COLORS.inkSoft}
          width={1.2}
        />
        {ions}
        {carriers}
      </Svg>
      <Stage from={cues.s(1)} to={tRec}>
        <Svg>
          <Caps x={960} y={Y1 + 40} text="diffusion" start={cues.s(1, 0.6)} />
          <Arrow
            x1={1180}
            y1={Y1 + 85}
            x2={760}
            y2={Y1 + 85}
            start={cues.s(1, 1)}
            stroke={COLORS.accent}
          />
          <SvgText
            x={1200}
            y={Y1 + 85}
            text="électrons : n → p"
            start={cues.s(1, 1.3)}
            size={24}
            color={COLORS.accent}
            anchor="start"
          />
          <Arrow
            x1={740}
            y1={Y1 + 130}
            x2={1160}
            y2={Y1 + 130}
            start={cues.s(1, 3)}
            stroke={COLORS.warm}
          />
          <SvgText
            x={720}
            y={Y1 + 130}
            text="trous : p → n"
            start={cues.s(1, 3.3)}
            size={24}
            color={COLORS.warm}
            anchor="end"
          />
        </Svg>
      </Stage>
      {/* Étiquettes qui remplacent les flèches de diffusion à partir de la recombinaison */}
      <Stage from={tRec} to={tEq}>
        <Svg>
          <SvgText
            x={960}
            y={Y1 + 40}
            text="une partie se recombine : électron + trou → plus de porteurs mobiles"
            start={tRec}
            size={26}
          />
          <Caps
            x={960}
            y={Y1 + 110}
            text="zone appauvrie : ions fixes, sans porteurs mobiles"
            start={tZone + 10}
            color={COLORS.ink}
          />
          <Arrow
            x1={ZR - 10}
            y1={Y1 + 170}
            x2={ZL + 10}
            y2={Y1 + 170}
            start={tZone + 50}
            stroke={COLORS.ink}
            width={2.6}
          />
          <SvgText
            x={ZR + 20}
            y={Y1 + 170}
            text="champ électrique interne E (de ⊕ vers ⊖)"
            start={tZone + 56}
            size={26}
            anchor="start"
          />
        </Svg>
      </Stage>
    </AbsoluteFill>
  );
};

// Bilan à l'équilibre : diffusion et dérive se compensent.
const Balance: React.FC = () => {
  const cues = useCues();
  const t = cues.beat(2);
  const tEq = cues.s(5);
  const y1 = 625;
  const y2 = 690;
  return (
    <AbsoluteFill>
      <Svg>
        <Arrow
          x1={1060}
          y1={560}
          x2={860}
          y2={560}
          start={t}
          stroke={COLORS.ink}
          width={2.6}
        />
        <SvgText
          x={1080}
          y={560}
          text="E : le champ s’oppose à la diffusion"
          start={t + 6}
          size={24}
          anchor="start"
        />
        <SvgText
          x={600}
          y={y1}
          text="diffusion"
          start={t + 20}
          size={26}
          color={COLORS.inkSoft}
          anchor="end"
        />
        <Arrow
          x1={900}
          y1={y1}
          x2={660}
          y2={y1}
          start={t + 20}
          stroke={COLORS.accent}
        />
        <Arrow
          x1={1020}
          y1={y1}
          x2={1260}
          y2={y1}
          start={t + 20}
          stroke={COLORS.warm}
        />
        <SvgText
          x={600}
          y={y2}
          text="dérive (champ)"
          start={tEq}
          size={26}
          color={COLORS.inkSoft}
          anchor="end"
        />
        <Arrow
          x1={660}
          y1={y2}
          x2={900}
          y2={y2}
          start={tEq + 10}
          stroke={COLORS.accent}
        />
        <Arrow
          x1={1260}
          y1={y2}
          x2={1020}
          y2={y2}
          start={tEq + 10}
          stroke={COLORS.warm}
        />
        <SvgText
          x={780}
          y={y1 - 26}
          text="électrons"
          start={t + 26}
          size={22}
          color={COLORS.accent}
        />
        <SvgText
          x={1140}
          y={y1 - 26}
          text="trous"
          start={t + 26}
          size={22}
          color={COLORS.warm}
        />
        <DrawPath
          d={`M 1300 ${y1 - 10} Q 1320 ${y1} 1320 ${(y1 + y2) / 2} Q 1320 ${y2} 1300 ${y2 + 10}`}
          start={tEq + 30}
          duration={0.5}
          stroke={COLORS.accent}
        />
      </Svg>
      <FadeIn
        start={tEq + 40}
        style={{ position: "absolute", left: 1345, top: 636 }}
      >
        <div style={{ ...textStyle(30, 300) }}>
          se compensent : courant net{" "}
          <span style={{ color: COLORS.accent }}>= 0</span>
        </div>
      </FadeIn>
      <Note kind="warn" x={300} y={740} width={900} start={cues.s(6)} size={28}>
        La barrière interne n’est pas une batterie utilisable gratuitement.
      </Note>
      <Txt
        x={1300}
        y={800}
        width={480}
        start={cues.s(7)}
        size={24}
        weight={400}
        color={COLORS.inkSoft}
      >
        SOURCE 2 · MIT 6.012, lecture 4
      </Txt>
    </AbsoluteFill>
  );
};

// ——— 2. Polarisation directe et inverse, avec la caractéristique I(V) ———
const Bias: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const tF = cues.beat(3);
  const tR = cues.beat(4);
  const tB = cues.s(10, 2.5);
  const reverse = frame >= tR;
  const X0 = 180;
  const XJ = 530;
  const X1 = 880;
  const Y0 = 300;
  const Y1 = 480;
  // Demi-largeur de la zone appauvrie : équilibre → directe → inverse.
  const W = interpolate(
    frame,
    [tF + 20, tF + 60, tR, tR + 40],
    [60, 22, 22, 125],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const on = progress(frame, tF, 0.6);
  // Courant visible : fort en directe, quasi nul en inverse.
  const flow = reverse ? 0 : progress(frame, tF + 60, 0.8);
  const ions: React.ReactNode[] = [];
  for (let k = 0; k < 5; k++)
    [320, 370, 420, 460].forEach((y, r) => {
      const dxp = 12 + k * 25;
      if (dxp < W)
        ions.push(
          <Ion
            key={`p${k}${r}`}
            x={XJ - dxp}
            y={y}
            sign="-"
            r={8}
            color={COLORS.warm}
          />,
        );
      if (dxp < W)
        ions.push(
          <Ion
            key={`n${k}${r}`}
            x={XJ + dxp}
            y={y}
            sign="+"
            r={8}
            color={COLORS.accent}
          />,
        );
    });
  const carriers = new Array(18).fill(0).map((_, i) => {
    const u = random(`bu${i}`);
    const y = Y0 + 20 + random(`by${i}`) * (Y1 - Y0 - 40);
    const [dx, dy] = wander(`bw${i}`, frame, 6);
    // Porteurs majoritaires, repoussés hors de la zone appauvrie.
    const hx = X0 + 15 + u * (XJ - W - X0 - 30);
    const ex = XJ + W + 15 + u * (X1 - XJ - W - 30);
    return (
      <g key={i}>
        <Hole x={hx + dx} y={y + dy} r={6} o={on} />
        <Electron x={ex + dx} y={y + dy} r={5.5} o={on} />
      </g>
    );
  });
  // En directe : des porteurs franchissent la jonction en continu.
  const crossing = new Array(8).fill(0).map((_, i) => {
    const p = ((frame - tF) / (2 * FPS) + i / 8) % 1;
    const y = Y0 + 30 + (i % 4) * 38;
    return (
      <g key={i}>
        <Electron
          x={X1 - 20 - p * (X1 - X0 - 40)}
          y={y + 10}
          r={5.5}
          o={flow * Math.min(1, p * 8, (1 - p) * 8)}
        />
        <Hole
          x={X0 + 20 + p * (X1 - X0 - 40)}
          y={y - 8}
          r={6}
          o={flow * Math.min(1, p * 8, (1 - p) * 8)}
        />
      </g>
    );
  });
  // Pile : la plaque longue (+) côté p en directe, côté n en inverse.
  const bx = XJ;
  const by = 640;
  const plus = reverse ? bx + 12 : bx - 12;
  const minus = reverse ? bx - 12 : bx + 12;
  // Caractéristique I(V)
  const gx0 = 1080;
  const gx1 = 1740;
  const ox = 1420;
  const oy = 560;
  const Ifwd = (v: number) => Math.min(300, 4 * (Math.exp(v / 45) - 1));
  const fwd = new Array(40)
    .fill(0)
    .map((_, i) => {
      const v = (i / 39) * 200;
      return `${i === 0 ? "M" : "L"} ${ox + v} ${oy - Ifwd(v)}`;
    })
    .join(" ");
  const rev = `M ${ox} ${oy} L ${ox - 230} ${oy + 6} L ${ox - 250} ${oy + 12} Q ${ox - 262} ${oy + 30} ${ox - 268} ${oy + 220}`;
  const pF = progress(frame, tF + 60, 1.5);
  const pR = progress(frame, tR + 40, 1.5);
  const vDot = reverse ? -220 * pR : 190 * pF;
  const dotX = ox + vDot;
  const dotY = reverse ? oy + 6 * pR : oy - Ifwd(vDot);
  return (
    <AbsoluteFill>
      <Svg>
        {/* Bloc p | n */}
        <DrawPath
          d={roundRectPath(X0, Y0, X1 - X0, Y1 - Y0, 6)}
          start={tF}
          duration={0.8}
          stroke={COLORS.inkSoft}
          width={1.6}
        />
        <rect
          x={XJ - W}
          y={Y0}
          width={2 * W}
          height={Y1 - Y0}
          fill={COLORS.ink}
          opacity={0.07 * on}
        />
        <path
          d={`M ${XJ - W} ${Y0} V ${Y1} M ${XJ + W} ${Y0} V ${Y1}`}
          stroke={COLORS.inkSoft}
          strokeWidth={1.2}
          strokeDasharray="6 6"
          opacity={on}
        />
        <Caps
          x={(X0 + XJ) / 2 - 40}
          y={Y0 - 26}
          text="p"
          start={tF}
          color={COLORS.warm}
        />
        <Caps
          x={(XJ + X1) / 2 + 40}
          y={Y0 - 26}
          text="n"
          start={tF}
          color={COLORS.accent}
        />
        <SvgText
          x={XJ}
          y={Y0 - 26}
          text="zone appauvrie"
          start={tF + 10}
          size={22}
          color={COLORS.inkSoft}
        />
        <g opacity={on}>{ions}</g>
        {carriers}
        {crossing}
        {/* Circuit et pile */}
        <DrawPath
          d={`M ${X0} ${(Y0 + Y1) / 2} H ${X0 - 40} V ${by} H ${bx - 12} M ${bx + 12} ${by} H ${X1 + 40} V ${(Y0 + Y1) / 2} H ${X1}`}
          start={tF + 10}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1.6}
        />
        <line
          x1={plus}
          y1={by - 34}
          x2={plus}
          y2={by + 34}
          stroke={COLORS.ink}
          strokeWidth={3}
          opacity={on}
        />
        <line
          x1={minus}
          y1={by - 18}
          x2={minus}
          y2={by + 18}
          stroke={COLORS.ink}
          strokeWidth={3}
          opacity={on}
        />
        <text
          x={plus + (reverse ? 22 : -22)}
          y={by - 30}
          textAnchor="middle"
          fontSize={28}
          fill={COLORS.ink}
          opacity={on}
          fontFamily="Inter"
        >
          +
        </text>
        <text
          x={minus + (reverse ? -22 : 22)}
          y={by - 30}
          textAnchor="middle"
          fontSize={28}
          fill={COLORS.ink}
          opacity={on}
          fontFamily="Inter"
        >
          −
        </text>
        {/* Graphique I(V) */}
        <Arrow
          x1={gx0}
          y1={oy}
          x2={gx1}
          y2={oy}
          start={tF + 10}
          stroke={COLORS.inkSoft}
        />
        <Arrow
          x1={ox}
          y1={oy + 250}
          x2={ox}
          y2={230}
          start={tF + 10}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={gx1}
          y={oy + 34}
          text="tension V"
          start={tF + 16}
          size={22}
          color={COLORS.inkSoft}
          anchor="end"
        />
        <SvgText
          x={ox + 16}
          y={240}
          text="courant I"
          start={tF + 16}
          size={22}
          color={COLORS.inkSoft}
          anchor="start"
        />
        <DrawPath
          d={fwd}
          start={tF + 50}
          duration={1.5}
          stroke={COLORS.accent}
          width={2.6}
        />
        <DrawPath
          d={rev}
          start={tR + 30}
          duration={1.5}
          stroke={COLORS.warm}
          width={2.6}
        />
        <circle
          cx={dotX}
          cy={dotY}
          r={9}
          fill={COLORS.ink}
          opacity={progress(frame, tF + 50, 0.4)}
        />
        <SvgText
          x={ox + 150}
          y={oy + 40}
          text="directe"
          start={tF + 30}
          size={24}
          color={COLORS.accent}
        />
        <SvgText
          x={ox - 130}
          y={oy - 30}
          text="inverse"
          start={tR + 20}
          size={24}
          color={COLORS.warm}
        />
        <SvgText
          x={ox - 110}
          y={oy + 42}
          text="petit courant"
          start={tR + 70}
          size={22}
          color={COLORS.warm}
        />
        <DrawPath
          d={`M ${ox - 300} ${oy + 130} H ${ox - 280}`}
          start={tB}
          duration={0.3}
          stroke={COLORS.warm}
        />
        <SvgText
          x={ox - 305}
          y={oy + 130}
          text="claquage"
          start={tB}
          size={24}
          color={COLORS.warm}
          anchor="end"
        />
      </Svg>
      <Stage from={tF} to={tR}>
        <Txt x={180} y={720} width={880} start={tF + 30} size={30}>
          <span style={{ color: COLORS.accent }}>Polarisation directe</span> :
          la tension appliquée réduit la barrière ; le courant peut fortement
          augmenter.
        </Txt>
      </Stage>
      <Stage from={tR}>
        <Txt x={180} y={720} width={880} start={tR + 10} size={30}>
          <span style={{ color: COLORS.warm }}>Polarisation inverse</span> : la
          barrière et la zone appauvrie augmentent ; un petit courant subsiste,
          claquage possible à forte tension.
        </Txt>
      </Stage>
    </AbsoluteFill>
  );
};

// ——— 3. Diode et transistor MOS ———
const DiodeVsMos: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(5);
  const tm = cues.s(12);
  // Coupe MOS miniature
  const mx = 1300;
  const my = 470;
  const ch = progress(frame, tm + 60, 0.8);
  return (
    <AbsoluteFill>
      <Svg>
        {/* Diode : triangle + barre */}
        <DrawPath
          d="M 360 470 H 470 M 470 420 V 520 L 560 470 Z M 560 420 V 520 M 560 470 H 670"
          start={t + 6}
          duration={1.2}
          stroke={COLORS.ink}
          width={2.4}
        />
        <SvgText
          x={470}
          y={560}
          text="p"
          start={t + 20}
          size={26}
          color={COLORS.warm}
        />
        <SvgText
          x={560}
          y={560}
          text="n"
          start={t + 20}
          size={26}
          color={COLORS.accent}
        />
        <Arrow
          x1={380}
          y1={360}
          x2={650}
          y2={360}
          start={t + 30}
          stroke={COLORS.accent}
          width={4}
        />
        <SvgText
          x={680}
          y={360}
          text="passe"
          start={t + 36}
          size={26}
          color={COLORS.accent}
          anchor="start"
        />
        <Arrow
          x1={620}
          y1={610}
          x2={560}
          y2={610}
          start={t + 50}
          stroke={COLORS.warm}
          width={1.2}
        />
        <SvgText
          x={640}
          y={610}
          text="presque rien"
          start={t + 56}
          size={26}
          color={COLORS.warm}
          anchor="start"
        />
        <DrawPath
          d="M 960 300 V 760"
          start={tm}
          duration={0.8}
          stroke={COLORS.inkFaint}
          width={1}
        />
        {/* MOS : corps p, source et drain n+, isolant, grille */}
        <DrawPath
          d={roundRectPath(mx - 260, my, 520, 200, 6)}
          start={tm + 10}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <DrawPath
          d={`M ${mx - 240} ${my} V ${my + 60} Q ${mx - 240} ${my + 80} ${mx - 220} ${my + 80} H ${mx - 120} Q ${mx - 100} ${my + 80} ${mx - 100} ${my + 60} V ${my} M ${mx + 100} ${my} V ${my + 60} Q ${mx + 100} ${my + 80} ${mx + 120} ${my + 80} H ${mx + 220} Q ${mx + 240} ${my + 80} ${mx + 240} ${my + 60} V ${my}`}
          start={tm + 20}
          duration={0.8}
          stroke={COLORS.accent}
        />
        <rect
          x={mx - 110}
          y={my - 14}
          width={220}
          height={12}
          fill={COLORS.warm}
          opacity={0.5 * progress(frame, tm + 30, 0.5)}
        />
        <DrawPath
          d={roundRectPath(mx - 100, my - 80, 200, 62, 4)}
          start={tm + 34}
          duration={0.6}
          stroke={COLORS.ink}
        />
        <rect
          x={mx - 100}
          y={my + 2}
          width={200}
          height={10}
          fill={COLORS.accent}
          opacity={0.7 * ch}
        />
        <SvgText x={mx} y={my - 49} text="grille" start={tm + 40} size={24} />
        <SvgText
          x={mx + 130}
          y={my - 8}
          text="isolant"
          start={tm + 44}
          size={22}
          color={COLORS.warm}
          anchor="start"
        />
        <SvgText
          x={mx - 170}
          y={my + 40}
          text="n+"
          start={tm + 30}
          size={24}
          color={COLORS.accent}
        />
        <SvgText
          x={mx + 170}
          y={my + 40}
          text="n+"
          start={tm + 30}
          size={24}
          color={COLORS.accent}
        />
        <SvgText
          x={mx}
          y={my + 140}
          text="corps p"
          start={tm + 30}
          size={24}
          color={COLORS.warm}
        />
        <SvgText
          x={mx}
          y={my + 40}
          text="canal"
          start={tm + 70}
          size={22}
          color={COLORS.accent}
        />
      </Svg>
      <Txt x={200} y={250} width={700} start={t} size={34} align="center">
        La diode
      </Txt>
      <Txt
        x={200}
        y={680}
        width={700}
        start={cues.s(11, 1.5)}
        size={28}
        align="center"
        color={COLORS.inkSoft}
      >
        exploite ce comportement asymétrique
      </Txt>
      <Txt x={1020} y={250} width={560} start={tm} size={34} align="center">
        Le transistor MOS
      </Txt>
      <Txt
        x={1020}
        y={700}
        width={560}
        start={tm + 80}
        size={28}
        align="center"
        color={COLORS.inkSoft}
      >
        une grille isolée contrôle un canal : pas une diode que l’on ouvre ou
        ferme
      </Txt>
    </AbsoluteFill>
  );
};

// ——— 4. Le lien industriel : position et concentration des dopants ———
const Industry: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(6);
  const tHeat = cues.s(15, 2);
  const x0 = 220;
  const x1 = 900;
  const ys = 470;
  const heat = progress(frame, tHeat, 1.5);
  const implant = progress(frame, t + 30, 3);
  // Profil de concentration en fonction de la profondeur.
  const gx = 1100;
  const gy = 300;
  const gw = 560;
  const gh = 340;
  const sigma = 0.1 + 0.08 * heat;
  const peak = 0.3;
  const prof = new Array(60)
    .fill(0)
    .map((_, i) => {
      const d = i / 59;
      const c =
        (0.1 / sigma) * Math.exp(-((d - peak) ** 2) / (2 * sigma * sigma));
      return `${i === 0 ? "M" : "L"} ${gx + c * gw * 0.9} ${gy + d * gh}`;
    })
    .join(" ");
  return (
    <AbsoluteFill>
      <Title
        kicker="Le lien industriel"
        text="Placer les dopants au bon endroit"
        start={t}
      />
      <Svg>
        {/* Tranche de silicium, vue en coupe */}
        <DrawPath
          d={`M ${x0} ${ys} H ${x1} V 780 H ${x0} Z`}
          start={t + 6}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1.6}
        />
        <Caps
          x={(x0 + x1) / 2}
          y={750}
          text="tranche de silicium (coupe)"
          start={t + 10}
        />
        {/* Ions implantés : pluie verticale puis dépôt à une profondeur donnée */}
        {new Array(40).fill(0).map((_, i) => {
          const x = x0 + 20 + random(`ix${i}`) * (x1 - x0 - 40);
          const depth =
            40 + random(`id${i}`) * 50 + (random(`ie${i}`) - 0.5) * 70 * heat;
          const delay = random(`it${i}`) * 0.7;
          const p = Math.min(1, Math.max(0, (implant - delay) / 0.3));
          const y = interpolate(p, [0, 1], [320, ys + depth]);
          return p > 0 ? (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={4.5}
              fill={COLORS.accent}
              opacity={0.9}
            />
          ) : null;
        })}
        {implant > 0 &&
          implant < 1 &&
          [0, 1, 2, 3, 4].map((k) => (
            <line
              key={k}
              x1={300 + k * 130}
              y1={330}
              x2={300 + k * 130}
              y2={420}
              stroke={COLORS.accent}
              strokeWidth={1.2}
              opacity={0.4}
            />
          ))}
        <SvgText
          x={(x0 + x1) / 2}
          y={300}
          text="implantation ionique"
          start={t + 20}
          size={26}
          color={COLORS.accent}
        />
        {/* Profil */}
        <Arrow
          x1={gx}
          y1={gy}
          x2={gx}
          y2={gy + gh + 20}
          start={t + 40}
          stroke={COLORS.inkSoft}
        />
        <Arrow
          x1={gx}
          y1={gy}
          x2={gx + gw + 20}
          y2={gy}
          start={t + 40}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={gx - 14}
          y={gy + gh}
          text="profondeur"
          start={t + 46}
          size={22}
          color={COLORS.inkSoft}
          anchor="end"
        />
        <SvgText
          x={gx + gw}
          y={gy - 26}
          text="concentration"
          start={t + 46}
          size={22}
          color={COLORS.inkSoft}
          anchor="end"
        />
        <path
          d={prof}
          fill="none"
          stroke={heat > 0 ? COLORS.warm : COLORS.accent}
          strokeWidth={2.6}
          opacity={progress(frame, t + 70, 0.8)}
        />
        <Icon
          name="thermometer"
          x={gx + 360}
          y={gy + gh - 40}
          size={32}
          start={tHeat - 10}
          color={COLORS.warm}
        />
        <SvgText
          x={gx + 400}
          y={gy + gh - 40}
          text="traitement thermique"
          start={tHeat - 6}
          size={22}
          color={COLORS.warm}
          anchor="start"
        />
        <Icon
          name="magnifier"
          x={gx + 24}
          y={782}
          size={22}
          start={cues.s(14)}
          color={COLORS.ink}
        />
      </Svg>
      <Txt x={gx} y={670} width={680} start={t + 90} size={28}>
        La <span style={{ color: COLORS.accent }}>position</span> et la{" "}
        <span style={{ color: COLORS.accent }}>concentration</span> des dopants
        influencent le comportement électrique.
      </Txt>
      <Txt x={gx + 70} y={762} width={620} start={cues.s(14, 0.3)} size={28}>
        procédés précis et contrôles
      </Txt>
      <Txt
        x={220}
        y={822}
        width={1560}
        start={cues.s(15, 0.5)}
        size={26}
        color={COLORS.inkSoft}
      >
        À suivre dans le module fabrication :{" "}
        <span style={{ color: COLORS.accent }}>implantation ionique</span> et{" "}
        <span style={{ color: COLORS.warm }}>traitements thermiques</span>
      </Txt>
    </AbsoluteFill>
  );
};

// Scène 9 — La jonction PN.
export const S09: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(3)}>
        <Title text="La jonction PN" start={cues.s(0)} />
        <Junction />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(3)}>
        <Balance />
      </Stage>
      <Stage from={cues.beat(3)} to={cues.beat(5)}>
        <Title text="Polariser la jonction" start={cues.beat(3)} />
        <Bias />
      </Stage>
      <Stage from={cues.beat(5)} to={cues.beat(6)}>
        <Title text="Diode et transistor MOS" start={cues.beat(5)} />
        <DiodeVsMos />
      </Stage>
      <Stage from={cues.beat(6)}>
        <Industry />
      </Stage>
    </AbsoluteFill>
  );
};
