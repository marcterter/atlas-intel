import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Svg, SvgText, Title } from "../components/kit";
import {
  Counter,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT } from "../theme";
import { Caps, Electron, Hole, Ion, Note, Sign, Txt, wander } from "./S04";

type Pt = [number, number];

// Réseau carré 2D (représentation plane du cristal) : atomes, liaisons à 2 électrons.
const Lattice: React.FC<{
  xs: number[];
  ys: number[];
  start: number;
  label: (c: number, r: number) => string;
  labelColor?: (c: number, r: number) => string;
  r?: number;
  // électron de liaison manquant : [indice de liaison, électron 0|1]
  hideElectron?: (bond: number, k: number) => boolean;
  highlight?: (c: number, r: number) => boolean;
}> = ({
  xs,
  ys,
  start,
  label,
  labelColor = () => COLORS.ink,
  r = 32,
  hideElectron = () => false,
  highlight = () => false,
}) => {
  const frame = useCurrentFrame();
  const bonds: [Pt, Pt][] = [];
  ys.forEach((y, ri) =>
    xs.forEach((x, ci) => {
      if (ci < xs.length - 1)
        bonds.push([
          [x, y],
          [xs[ci + 1], y],
        ]);
      if (ri < ys.length - 1)
        bonds.push([
          [x, y],
          [x, ys[ri + 1]],
        ]);
    }),
  );
  // Liaisons vers l'extérieur du fragment (le cristal continue).
  const stubs: string[] = [];
  xs.forEach((x) => {
    stubs.push(`M ${x} ${ys[0] - r} V ${ys[0] - r - 40}`);
    stubs.push(
      `M ${x} ${ys[ys.length - 1] + r} V ${ys[ys.length - 1] + r + 40}`,
    );
  });
  ys.forEach((y) => {
    stubs.push(`M ${xs[0] - r} ${y} H ${xs[0] - r - 40}`);
    stubs.push(
      `M ${xs[xs.length - 1] + r} ${y} H ${xs[xs.length - 1] + r + 40}`,
    );
  });
  const eO = progress(frame, start + 30, 0.8);
  return (
    <g>
      <DrawPath
        d={bonds
          .map(([a, b]) =>
            a[1] === b[1]
              ? `M ${a[0] + r} ${a[1]} H ${b[0] - r}`
              : `M ${a[0]} ${a[1] + r} V ${b[1] - r}`,
          )
          .concat(stubs)
          .join(" ")}
        start={start + 10}
        duration={1.2}
        stroke={COLORS.inkFaint}
        width={1.6}
      />
      {bonds.map(([a, b], i) => {
        const mx = (a[0] + b[0]) / 2;
        const my = (a[1] + b[1]) / 2;
        const horiz = a[1] === b[1];
        return [0, 1].map((k) => {
          const off = k === 0 ? -8 : 8;
          const x = mx + (horiz ? 0 : off);
          const y = my + (horiz ? off : 0);
          return hideElectron(i, k) ? null : (
            <circle
              key={`${i}-${k}`}
              cx={x}
              cy={y}
              r={4}
              fill={COLORS.inkSoft}
              opacity={eO}
            />
          );
        });
      })}
      {ys.map((y, ri) =>
        xs.map((x, ci) => {
          const o = progress(frame, start + (ci + ri) * 3, 0.5);
          const hi = highlight(ci, ri);
          return (
            <g key={`${ci}-${ri}`} opacity={o}>
              <circle
                cx={x}
                cy={y}
                r={r}
                fill={hi ? COLORS.accent : "none"}
                fillOpacity={hi ? 0.12 : 0}
                stroke={hi ? COLORS.accent : COLORS.ink}
                strokeWidth={1.6}
              />
              <text
                x={x}
                y={y + 9}
                textAnchor="middle"
                fontFamily={FONT}
                fontSize={26}
                fontWeight={300}
                fill={labelColor(ci, ri)}
              >
                {label(ci, ri)}
              </text>
            </g>
          );
        }),
      )}
    </g>
  );
};

// Le silicium : 4 électrons de valence, 4 liaisons ; le dopage.
const Silicon: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const tDop = cues.beat(1);
  const xs = [300, 470, 640, 810, 980];
  const ys = [330, 500, 670];
  const swap = progress(frame, tDop + 60, 0.8);
  return (
    <AbsoluteFill>
      <Svg>
        <Lattice
          xs={xs}
          ys={ys}
          start={t}
          label={(c, r) => (c === 2 && r === 1 && swap > 0.5 ? "?" : "Si")}
          labelColor={(c, r) =>
            c === 2 && r === 1 && swap > 0.5 ? COLORS.warm : COLORS.ink
          }
          highlight={(c, r) => c === 2 && r === 1 && frame < tDop}
        />
        {/* Les quatre liaisons de l'atome central */}
        {frame < tDop && (
          <DrawPath
            d="M 640 465 V 380 M 640 535 V 620 M 605 500 H 520 M 675 500 H 760"
            start={t + 60}
            duration={0.8}
            stroke={COLORS.accent}
            width={2.4}
          />
        )}
        {swap > 0 && (
          <circle
            cx={640}
            cy={500}
            r={32}
            fill="none"
            stroke={COLORS.warm}
            strokeWidth={2}
            opacity={swap}
          />
        )}
      </Svg>
      <Stage from={t} to={tDop}>
        <Txt x={1130} y={380} width={640} start={t + 50} size={34}>
          Chaque atome de silicium a{" "}
          <span style={{ color: COLORS.accent }}>4 électrons de valence</span>
        </Txt>
        <Txt
          x={1130}
          y={520}
          width={640}
          start={t + 80}
          size={30}
          color={COLORS.inkSoft}
        >
          Il les met en commun avec ses 4 voisins : un réseau de liaisons (2
          électrons par liaison)
        </Txt>
      </Stage>
      <Stage from={tDop}>
        <Note
          kind="keep"
          x={1130}
          y={300}
          width={640}
          label="DOPER"
          start={tDop + 10}
        >
          Incorporer une{" "}
          <span style={{ color: COLORS.warm }}>quantité contrôlée</span>{" "}
          d’autres atomes pour modifier les porteurs disponibles.
        </Note>
        <Note kind="warn" x={1130} y={580} width={640} start={cues.s(3)}>
          Ce n’est pas ajouter un courant depuis l’extérieur.
        </Note>
      </Stage>
    </AbsoluteFill>
  );
};

// Type n (phosphore) et type p (bore), côte à côte.
const Dopants: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const tn = cues.beat(2);
  const tp = cues.beat(3);
  const nx = [330, 510, 690];
  const px = [1230, 1410, 1590];
  const ys = [320, 480, 640];
  // Électron excédentaire du phosphore : d'abord près de P, puis libre.
  const free = progress(frame, cues.s(5, 0.3), 1.2);
  const [wx, wy] = wander("nfree", frame, 1);
  const orbit = (frame - tn) * 0.06;
  const nearX = nx[1] + 22 + Math.cos(orbit) * 6;
  const nearY = ys[1] - 44 + Math.sin(orbit) * 6;
  const roamX = nx[1] + Math.sin((frame - tn) / 40) * 150;
  const roamY = ys[1] - 80 + Math.sin((frame - tn) / 23) * 90 + wy * 10;
  const exX = interpolate(free, [0, 1], [nearX, roamX + wx * 30]);
  const exY = interpolate(free, [0, 1], [nearY, roamY]);
  // Trou du bore : liaison B → voisin de droite, puis il saute de liaison en liaison.
  // Indices de liaison (ordre de construction : ligne par ligne, horizontal puis vertical).
  const bondIndex = (ci: number, ri: number, horiz: boolean) => {
    let i = 0;
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) {
        if (c < 2) {
          if (r === ri && c === ci && horiz) return i;
          i++;
        }
        if (r < 2) {
          if (r === ri && c === ci && !horiz) return i;
          i++;
        }
      }
    return -1;
  };
  const path = [
    bondIndex(1, 1, true),
    bondIndex(2, 0, false),
    bondIndex(1, 0, true),
    bondIndex(0, 0, true),
    bondIndex(0, 0, false),
  ];
  const hopStart = cues.s(7, 0.4);
  const hop =
    frame < hopStart
      ? 0
      : Math.min(path.length - 1, Math.floor((frame - hopStart) / 22));
  const holeBond = path[hop];
  const bondMid = (i: number): Pt => {
    let k = 0;
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 3; c++) {
        if (c < 2) {
          if (k === i) return [(px[c] + px[c + 1]) / 2, ys[r] + 8];
          k++;
        }
        if (r < 2) {
          if (k === i) return [px[c] + 8, (ys[r] + ys[r + 1]) / 2];
          k++;
        }
      }
    return [0, 0];
  };
  const [hx, hy] = bondMid(holeBond);
  const holeO = progress(frame, tp + 30, 0.5);
  const ionN = progress(frame, cues.s(5, 1), 0.6);
  const ionP = progress(frame, cues.s(7, 0.8), 0.6);
  const rows = (
    type: string,
    ex: string,
    maj: React.ReactNode,
    at: number,
    at2: number,
    left: number,
    color: string,
  ) => (
    <div style={{ position: "absolute", left, top: 740, width: 640 }}>
      <FadeIn start={at}>
        <div style={{ ...textStyle(26, 500), color, letterSpacing: "0.2em" }}>
          {type}
        </div>
      </FadeIn>
      <FadeIn start={at + 12}>
        <div style={{ ...textStyle(28, 300), marginTop: 6 }}>{ex}</div>
      </FadeIn>
      <FadeIn start={at2}>
        <div
          style={{ ...textStyle(28, 300), marginTop: 4, color: COLORS.inkSoft }}
        >
          majoritaires : {maj}
        </div>
      </FadeIn>
    </div>
  );
  return (
    <AbsoluteFill>
      <Svg>
        <Lattice
          xs={nx}
          ys={ys}
          start={tn - 10}
          label={(c, r) => (c === 1 && r === 1 ? "P" : "Si")}
          labelColor={(c, r) =>
            c === 1 && r === 1 ? COLORS.accent : COLORS.ink
          }
          highlight={(c, r) => c === 1 && r === 1}
        />
        <Sign
          x={nx[1] + 22}
          y={ys[1] + 20}
          sign="+"
          s={6}
          color={COLORS.accent}
          o={ionN}
        />
        <Electron x={exX} y={exY} r={8} o={progress(frame, tn + 40, 0.5)} />
        <SvgText
          x={nx[1] + 120}
          y={ys[1] - 100}
          text="5ᵉ électron"
          start={tn + 50}
          size={24}
          color={COLORS.accent}
          anchor="start"
        />
        <Lattice
          xs={px}
          ys={ys}
          start={tp - 10}
          label={(c, r) => (c === 1 && r === 1 ? "B" : "Si")}
          labelColor={(c, r) => (c === 1 && r === 1 ? COLORS.warm : COLORS.ink)}
          highlight={(c, r) => c === 1 && r === 1}
          hideElectron={(i, k) => i === holeBond && k === 1 && frame > tp + 30}
        />
        <Sign
          x={px[1] + 22}
          y={ys[1] + 20}
          sign="-"
          s={6}
          color={COLORS.warm}
          o={ionP}
        />
        <Hole x={hx} y={hy} r={7} o={holeO} />
        <SvgText
          x={px[1] + 120}
          y={ys[1] - 100}
          text="liaison incomplète"
          start={tp + 40}
          size={24}
          color={COLORS.warm}
          anchor="start"
        />
        <DrawPath
          d="M 960 280 V 860"
          start={tp - 10}
          duration={0.8}
          stroke={COLORS.inkFaint}
          width={1}
        />
      </Svg>
      {rows(
        "TYPE n",
        "phosphore (5 électrons de valence) : donneur",
        <span style={{ color: COLORS.accent }}>électrons mobiles</span>,
        tn,
        cues.s(5),
        230,
        COLORS.accent,
      )}
      {rows(
        "TYPE p",
        "bore (3 électrons de valence) : accepteur",
        <span style={{ color: COLORS.warm }}>trous mobiles</span>,
        tp,
        cues.s(7),
        1100,
        COLORS.warm,
      )}
    </AbsoluteFill>
  );
};

// Un bloc de type n reste globalement neutre.
const Neutral: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(4);
  const x0 = 220;
  const y0 = 290;
  const W = 680;
  const H = 440;
  const cols = 6;
  const rows = 4;
  const N = cols * rows;
  const eO = progress(frame, t + 30, 0.6);
  return (
    <AbsoluteFill>
      <Title text="Un matériau dopé reste neutre" start={t} />
      <Svg>
        <DrawPath
          d={`M ${x0} ${y0} H ${x0 + W} V ${y0 + H} H ${x0} Z`}
          start={t}
          duration={1}
          stroke={COLORS.accent}
          width={1.6}
        />
        <Caps
          x={x0 + W / 2}
          y={y0 + H + 36}
          text="silicium de type n"
          start={t + 10}
          color={COLORS.accent}
        />
        {new Array(N).fill(0).map((_, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          const x = x0 + 70 + c * ((W - 140) / (cols - 1));
          const y = y0 + 60 + r * ((H - 120) / (rows - 1));
          return (
            <Ion
              key={i}
              x={x}
              y={y}
              sign="+"
              r={12}
              color={COLORS.ink}
              o={progress(frame, t + 10 + i, 0.4)}
            />
          );
        })}
        {new Array(N).fill(0).map((_, i) => {
          const bx = random(`nx${i}`) * (W - 60);
          const by = random(`ny${i}`) * (H - 60);
          const [dx, dy] = wander(`nw${i}`, frame, 30);
          const x = x0 + 30 + Math.min(W - 60, Math.max(0, bx + dx));
          const y = y0 + 30 + Math.min(H - 60, Math.max(0, by + dy));
          return <Electron key={i} x={x} y={y} r={6} o={eO} />;
        })}
      </Svg>
      <div style={{ position: "absolute", left: 1000, top: 290, width: 780 }}>
        <FadeIn start={t + 20}>
          <div style={{ ...textStyle(32, 300) }}>
            <span style={{ color: COLORS.ink }}>
              <Counter to={N} start={t + 20} duration={1} />
            </span>{" "}
            dopants ionisés{" "}
            <span style={{ color: COLORS.inkSoft }}>(⊕ fixes)</span>
          </div>
        </FadeIn>
        <FadeIn start={t + 40} style={{ marginTop: 16 }}>
          <div style={{ ...textStyle(32, 300) }}>
            <span style={{ color: COLORS.accent }}>
              <Counter to={N} start={t + 40} duration={1} />
            </span>{" "}
            électrons mobiles <span style={{ color: COLORS.inkSoft }}>(−)</span>
          </div>
        </FadeIn>
        <FadeIn start={t + 70} style={{ marginTop: 20 }}>
          <div
            style={{ height: 1.5, background: COLORS.inkFaint, width: 520 }}
          />
          <div style={{ ...textStyle(40, 300), marginTop: 16 }}>
            charge nette = <span style={{ color: COLORS.accent }}>0</span>
          </div>
        </FadeIn>
      </div>
      <Note
        kind="warn"
        x={1000}
        y={560}
        width={780}
        start={cues.s(9)}
        size={28}
      >
        « n » ne veut pas dire chargé négativement : les électrons mobiles sont
        compensés par les dopants ionisés. Neutre loin des zones de charge
        d’espace.
      </Note>
      <FadeIn
        start={cues.s(10)}
        style={{ position: "absolute", left: 1030, top: 820 }}
      >
        <div
          style={{
            ...textStyle(24, 400),
            color: COLORS.inkSoft,
            letterSpacing: "0.06em",
          }}
        >
          SOURCE 1 · MIT 6.012, lecture 1
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 7 — Le dopage.
export const S07: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(2)}>
        <Title
          kicker="Silicium, dopage et jonction PN"
          text="Le dopage"
          start={cues.s(0)}
        />
        <Silicon />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(4)}>
        <Title text="Deux types de dopage" start={cues.beat(2)} />
        <Dopants />
      </Stage>
      <Stage from={cues.beat(4)}>
        <Neutral />
      </Stage>
    </AbsoluteFill>
  );
};
