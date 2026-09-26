import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { circlePath, icons } from "../components/icons";
import { Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
  Counter,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import { Band } from "./S05";
import { Caps, Electron, Hole, Note, Txt } from "./S04";

// Pictogramme « dopage » : quatre atomes dont un différent.
const dopingIcon = (x: number, y: number, s: number) =>
  [
    [-0.5, -0.5],
    [0.5, -0.5],
    [-0.5, 0.5],
  ]
    .map(([a, b]) => circlePath(x + a * s, y + b * s, s * 0.28))
    .join(" ") +
  ` M ${x - s * 0.22} ${y - s * 0.5} H ${x + s * 0.22} M ${x - s * 0.5} ${y - s * 0.22} V ${y + s * 0.22}`;

const KNOBS = [
  { name: "dopage", at: 3.3, d: dopingIcon },
  {
    name: "champ électrique",
    at: 4.5,
    d: (x: number, y: number, s: number) =>
      `M ${x - s} ${y} H ${x + s} M ${x + s * 0.55} ${y - s * 0.45} L ${x + s} ${y} L ${x + s * 0.55} ${y + s * 0.45}`,
  },
  { name: "température", at: 6.0, d: icons.thermometer },
  { name: "lumière", at: 7.3, d: icons.light },
];
const LEVELS = [0.1, 0.4, 0.58, 0.76, 0.92];

// La conduction d'un semi-conducteur se règle fortement : quatre leviers.
const Gauge: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(1);
  const cx = 640;
  const cy = 700;
  const R = 280;
  const knobAt = KNOBS.map((k) => cues.s(2, k.at));
  let level = LEVELS[0];
  knobAt.forEach((a, i) => {
    level += (LEVELS[i + 1] - LEVELS[i]) * progress(frame, a, 0.8);
  });
  const ang = Math.PI * (1 - level);
  const arc = `M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`;
  const ticks = new Array(11)
    .fill(0)
    .map((_, i) => {
      const a = Math.PI * (1 - i / 10);
      return `M ${cx + Math.cos(a) * (R - 18)} ${cy - Math.sin(a) * (R - 18)} L ${cx + Math.cos(a) * R} ${cy - Math.sin(a) * R}`;
    })
    .join(" ");
  const on = progress(frame, t + 20, 0.6);
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath d={arc} start={t} duration={1.2} stroke={COLORS.inkSoft} />
        <DrawPath
          d={ticks}
          start={t + 16}
          duration={0.8}
          stroke={COLORS.inkFaint}
          width={1.4}
        />
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + Math.cos(ang) * R} ${cy - Math.sin(ang) * R}`}
          fill="none"
          stroke={COLORS.accent}
          strokeWidth={6}
          opacity={on}
        />
        <line
          x1={cx}
          y1={cy}
          x2={cx + Math.cos(ang) * (R - 40)}
          y2={cy - Math.sin(ang) * (R - 40)}
          stroke={COLORS.ink}
          strokeWidth={3}
          strokeLinecap="round"
          opacity={on}
        />
        <circle cx={cx} cy={cy} r={8} fill={COLORS.ink} opacity={on} />
        <SvgText
          x={cx - R}
          y={cy + 40}
          text="très faible"
          start={t + 20}
          size={24}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={cx + R}
          y={cy + 40}
          text="très forte"
          start={t + 20}
          size={24}
          color={COLORS.inkSoft}
        />
        <Caps x={cx} y={cy + 60} text="conduction" start={t + 10} />
        <SvgText
          x={cx}
          y={cy + 100}
          text="sur plusieurs ordres de grandeur"
          start={t + 30}
          size={24}
          color={COLORS.inkSoft}
        />
        {KNOBS.map((k, i) => {
          const y = 380 + i * 110;
          const active = progress(frame, knobAt[i], 0.4);
          return (
            <g key={k.name}>
              <DrawPath
                d={circlePath(1150, y, 40)}
                start={knobAt[i] - 6}
                duration={0.6}
                stroke={active > 0.5 ? COLORS.accent : COLORS.inkSoft}
                width={1.6}
              />
              <DrawPath
                d={k.d(1150, y, 20)}
                start={knobAt[i]}
                duration={0.6}
                stroke={COLORS.accent}
                width={2}
              />
              <SvgText
                x={1220}
                y={y}
                text={k.name}
                start={knobAt[i]}
                size={34}
                weight={300}
                anchor="start"
              />
            </g>
          );
        })}
      </Svg>
      <Txt x={1110} y={250} width={680} start={t + 10} size={28}>
        Modifier <span style={{ color: COLORS.accent }}>fortement</span> la
        conduction, par :
      </Txt>
    </AbsoluteFill>
  );
};

// Le silicium, et d'autres semi-conducteurs pour d'autres fonctions.
const Materials: React.FC = () => {
  const cues = useCues();
  const t = cues.beat(2);
  const others = [
    { n: "GaN", f: "électronique de puissance, radiofréquence" },
    { n: "SiC", f: "puissance à haute tension" },
    { n: "GaAs, InP", f: "optoélectronique : lasers, photodétecteurs" },
  ];
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={circlePath(480, 510, 130)}
          start={t}
          duration={1}
          stroke={COLORS.accent}
        />
        <SvgText
          x={480}
          y={500}
          text="Si"
          start={t + 10}
          size={90}
          weight={200}
        />
        <SvgText
          x={480}
          y={700}
          text={"silicium\nla base de la logique CMOS"}
          start={t + 16}
          size={26}
          color={COLORS.inkSoft}
        />
        <DrawPath
          d="M 740 330 V 760"
          start={cues.s(3, 2.5)}
          duration={0.8}
          stroke={COLORS.inkFaint}
          width={1}
        />
      </Svg>
      <Txt
        x={820}
        y={290}
        width={900}
        start={cues.s(3, 2.5)}
        size={24}
        weight={500}
        color={COLORS.inkSoft}
      >
        <span style={{ letterSpacing: "0.2em" }}>
          D’AUTRES MATÉRIAUX, D’AUTRES FONCTIONS
        </span>
      </Txt>
      {others.map((o, i) => (
        <FadeIn
          key={o.n}
          start={cues.s(3, 3 + i * 0.7)}
          style={{ position: "absolute", left: 820, top: 370 + i * 130 }}
        >
          <div style={{ ...textStyle(44, 200), color: COLORS.accent }}>
            {o.n}
          </div>
          <div style={{ ...textStyle(28, 300), color: COLORS.inkSoft }}>
            {o.f}
          </div>
        </FadeIn>
      ))}
    </AbsoluteFill>
  );
};

// Un électron promu laisse un trou ; le trou se déplace comme une charge positive.
const HoleMotion: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(3);
  const tJump = cues.s(4, 1.2);
  const tMove = cues.s(5, 1.5);
  const x0 = 200;
  const w = 800;
  const cb = [300, 420];
  const vb = [600, 740];
  const n = 15;
  const step = 56;
  const sx = (j: number) => x0 + 48 + j * step;
  const rowY = 630;
  const h0 = 5;
  // Saut de l'électron vers la bande de conduction.
  const jump = progress(frame, tJump, 0.9);
  const jumped = frame >= tJump;
  // Déplacement du trou sous le champ : un voisin comble le trou à chaque pas.
  const u = Math.max(0, (frame - tMove) / (1.0 * FPS));
  const steps = Math.min(6, Math.floor(u));
  const f = steps >= 6 ? 0 : Math.min(1, (u - Math.floor(u)) / 0.45);
  const m = frame >= tMove ? interpolate(f, [0, 1], [0, 1]) : 0;
  const h = h0 + steps;
  const holeX = sx(h) + (frame >= tMove && steps < 6 ? m * step : 0);
  // Électron de conduction : dérive vers la gauche (contre le champ).
  const ex = Math.max(
    x0 + 30,
    sx(h0) - Math.max(0, (frame - tMove) / FPS) * 38,
  );
  const ey = vb[0] + 30 + (cb[0] + 60 - vb[0] - 30) * jump;
  const fieldO = progress(frame, tMove - 20, 0.6);
  return (
    <AbsoluteFill>
      <Svg>
        <Band
          x={x0}
          y={cb[0]}
          w={w}
          h={cb[1] - cb[0]}
          start={t}
          color={COLORS.accent}
        />
        <Band
          x={x0}
          y={vb[0]}
          w={w}
          h={vb[1] - vb[0]}
          start={t + 6}
          color={COLORS.ink}
        />
        <Caps
          x={x0 + w + 20}
          y={(cb[0] + cb[1]) / 2}
          text="conduction"
          start={t + 10}
          anchor="start"
          color={COLORS.accent}
        />
        <Caps
          x={x0 + w + 20}
          y={(vb[0] + vb[1]) / 2}
          text="valence"
          start={t + 14}
          anchor="start"
        />
        {/* Électrons de valence : une rangée mobile, une rangée fixe */}
        {new Array(n).fill(0).map((_, j) => {
          const o = progress(frame, t + 10 + j, 0.4);
          const second = (
            <Electron key={`b${j}`} x={sx(j)} y={rowY + 70} r={6} o={o * 0.6} />
          );
          if (!jumped || j < h0) {
            return (
              <g key={j}>
                <Electron x={sx(j)} y={rowY} r={6} o={o} />
                {second}
              </g>
            );
          }
          // Sites après le trou initial.
          if (j === h0) return <g key={j}>{second}</g>;
          if (j <= h) {
            // déjà décalé d'un cran vers la gauche
            return (
              <g key={j}>
                <Electron x={sx(j - 1)} y={rowY} r={6} o={o} />
                {second}
              </g>
            );
          }
          if (j === h + 1 && frame >= tMove && steps < 6) {
            return (
              <g key={j}>
                <Electron x={sx(j) - m * step} y={rowY} r={6} o={o} />
                {second}
              </g>
            );
          }
          return (
            <g key={j}>
              <Electron x={sx(j)} y={rowY} r={6} o={o} />
              {second}
            </g>
          );
        })}
        {/* Le trou laissé */}
        <Hole x={holeX} y={rowY} r={9} o={jumped ? jump : 0} />
        {/* L'électron promu */}
        {jumped && <Electron x={ex} y={ey} r={8} />}
        <Arrow
          x1={sx(h0) + 40}
          y1={vb[0] - 20}
          x2={sx(h0) + 40}
          y2={cb[1] + 20}
          start={tJump - 20}
          stroke={COLORS.warm}
        />
        <SvgText
          x={sx(h0) - 30}
          y={(cb[1] + vb[0]) / 2}
          text={"énergie ≥ Eg\n(chaleur, lumière)"}
          start={tJump - 16}
          size={24}
          color={COLORS.warm}
          anchor="end"
        />
        <SvgText
          x={sx(h0) - 30}
          y={cb[0] - 30}
          text="électron promu"
          start={tJump + 20}
          size={26}
          color={COLORS.accent}
        />
        <SvgText
          x={sx(h0)}
          y={vb[1] + 40}
          text="trou"
          start={tJump + 26}
          size={28}
          color={COLORS.warm}
        />
        {/* Champ électrique et sens des mouvements */}
        <g opacity={fieldO}>
          <Arrow
            x1={x0 + 240}
            y1={230}
            x2={x0 + 640}
            y2={230}
            start={tMove - 20}
            stroke={COLORS.ink}
            width={2.4}
          />
        </g>
        <SvgText
          x={x0 + 200}
          y={230}
          text="champ E"
          start={tMove - 20}
          size={26}
          anchor="end"
        />
        <Arrow
          x1={sx(10)}
          y1={vb[1] + 40}
          x2={sx(7)}
          y2={vb[1] + 40}
          start={tMove + 40}
          stroke={COLORS.accent}
        />
        <SvgText
          x={sx(10) + 16}
          y={vb[1] + 40}
          text="les électrons voisins comblent le trou"
          start={tMove + 44}
          size={24}
          color={COLORS.accent}
          anchor="start"
        />
        <Arrow
          x1={sx(h0) + 40}
          y1={vb[0] - 36}
          x2={sx(h0 + 6)}
          y2={vb[0] - 36}
          start={tMove + 70}
          stroke={COLORS.warm}
          width={2.4}
        />
        <SvgText
          x={sx(h0) + 60}
          y={vb[0] - 66}
          text="le trou avance dans le sens du champ, comme une charge +"
          start={tMove + 76}
          size={24}
          color={COLORS.warm}
          anchor="start"
        />
      </Svg>
      <Note kind="keep" x={1250} y={260} width={530} start={cues.s(5)}>
        Le trou est une <span style={{ color: COLORS.warm }}>absence</span>{" "}
        d’électron qui se comporte, pour le transport, comme un porteur{" "}
        <span style={{ color: COLORS.warm }}>positif</span>.
      </Note>
      <Note kind="warn" x={1250} y={590} width={530} start={cues.s(6)}>
        Ce n’est pas un proton qui se déplace dans le cristal.
      </Note>
    </AbsoluteFill>
  );
};

// Repère physique : 1,1 eV pour le silicium ; l'eV est une énergie.
const Reference: React.FC = () => {
  const cues = useCues();
  const t = cues.beat(4);
  return (
    <AbsoluteFill>
      <Title
        kicker="Repère physique"
        text="La bande interdite du silicium"
        start={t}
      />
      <Svg>
        <Band
          x={260}
          y={300}
          w={380}
          h={110}
          start={t + 6}
          color={COLORS.accent}
        />
        <Band
          x={260}
          y={620}
          w={380}
          h={130}
          start={t + 10}
          filled={1}
          color={COLORS.ink}
        />
        <Arrow
          x1={450}
          y1={515}
          x2={450}
          y2={416}
          start={t + 20}
          stroke={COLORS.warm}
        />
        <Arrow
          x1={450}
          y1={515}
          x2={450}
          y2={614}
          start={t + 20}
          stroke={COLORS.warm}
        />
        <SvgText
          x={470}
          y={515}
          text="Eg"
          start={t + 26}
          size={30}
          color={COLORS.warm}
          anchor="start"
        />
      </Svg>
      <FadeIn
        start={t + 20}
        style={{ position: "absolute", left: 760, top: 290 }}
      >
        <div
          style={{
            ...textStyle(26, 500),
            color: COLORS.inkSoft,
            letterSpacing: "0.18em",
          }}
        >
          SILICIUM · TEMPÉRATURE AMBIANTE
        </div>
        <FadeIn start={cues.s(7, 3.2)}>
          <div
            style={{ ...textStyle(120, 200), color: COLORS.warm, marginTop: 6 }}
          >
            ≈{" "}
            <Counter
              to={1.1}
              start={cues.s(7, 3.5)}
              duration={1.4}
              decimals={1}
            />{" "}
            eV
          </div>
        </FadeIn>
      </FadeIn>
      <Note kind="warn" x={760} y={530} width={1000} start={cues.s(8)}>
        L’électronvolt est une unité d’
        <span style={{ color: COLORS.warm }}>énergie</span>, pas une tension.
        <div
          style={{
            ...textStyle(26, 300),
            color: COLORS.inkSoft,
            marginTop: 10,
          }}
        >
          1 eV = énergie gagnée par un électron qui traverse 1 V ≈ 1,6 × 10⁻¹⁹ J
        </div>
      </Note>
      <FadeIn
        start={cues.s(9)}
        style={{ position: "absolute", left: 790, top: 790 }}
      >
        <div
          style={{
            ...textStyle(24, 400),
            color: COLORS.inkSoft,
            letterSpacing: "0.06em",
          }}
        >
          SOURCE 1 · MIT 6.012, lecture 1 — Introduction to Semiconductors
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 6 — Ce que signifie semi-conducteur.
export const S06: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const strike = progress(frame, cues.s(1, 1.2), 0.6);
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(2)}>
        <Title text="Ce que signifie « semi-conducteur »" start={cues.s(0)} />
      </Stage>
      <Stage from={cues.s(1)} to={cues.beat(1)}>
        <FadeIn
          start={cues.s(1)}
          style={{
            position: "absolute",
            top: 450,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              ...textStyle(60, 200),
              color: COLORS.inkSoft,
              display: "inline-block",
              position: "relative",
            }}
          >
            conduire « à moitié »
            <div
              style={{
                position: "absolute",
                left: -10,
                top: "52%",
                height: 3,
                background: COLORS.warm,
                width: `${strike * 104}%`,
              }}
            />
          </div>
          <div
            style={{ ...textStyle(30, 300), color: COLORS.warm, marginTop: 24 }}
          >
            ce n’est pas l’intérêt
          </div>
        </FadeIn>
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(2)}>
        <Gauge />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(3)}>
        <Title
          text="Le silicium, un exemple parmi d’autres"
          start={cues.beat(2)}
        />
        <Materials />
      </Stage>
      <Stage from={cues.beat(3)} to={cues.beat(4)}>
        <HoleMotion />
      </Stage>
      <Stage from={cues.beat(4)}>
        <Reference />
      </Stage>
    </AbsoluteFill>
  );
};
