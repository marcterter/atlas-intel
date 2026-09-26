import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { circlePath, roundRectPath } from "../components/icons";
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
import { COLORS, FONT, FPS } from "../theme";

// ---------------------------------------------------------------------------
// Petits outils partagés par les scènes S23 à S32.
// ---------------------------------------------------------------------------

export const accentA = (a: number) => `rgba(143, 208, 255, ${a})`;
export const warmA = (a: number) => `rgba(255, 211, 138, ${a})`;
export const inkA = (a: number) => `rgba(232, 240, 255, ${a})`;

// Étiquette en petites capitales.
export const caps = (
  color: string = COLORS.inkSoft,
  size = 22,
): React.CSSProperties => ({
  ...textStyle(size, 500),
  color,
  letterSpacing: "0.22em",
});

// Bloc de texte HTML positionné, qui apparaît en fondu.
export const TextAt: React.FC<{
  x: number;
  y: number;
  w?: number;
  start: number;
  align?: "left" | "center" | "right";
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ x, y, w = 600, start, align = "left", style, children }) => {
  const left = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  return (
    <FadeIn
      start={start}
      style={{ position: "absolute", left, top: y, width: w, textAlign: align }}
    >
      <div style={{ ...textStyle(30, 300), lineHeight: 1.35, ...style }}>
        {children}
      </div>
    </FadeIn>
  );
};

// Pastille (exemple fictif, source, mise en garde…).
export const Pill: React.FC<{
  text: string;
  start: number;
  x: number;
  y: number;
  tone?: "accent" | "warm" | "ink";
  align?: "left" | "center" | "right";
}> = ({ text, start, x, y, tone = "warm", align = "right" }) => {
  const color =
    tone === "warm"
      ? COLORS.warm
      : tone === "ink"
        ? COLORS.inkSoft
        : COLORS.accent;
  return (
    <TextAt x={x} y={y} w={700} start={start} align={align}>
      <span
        style={{
          ...caps(color, 22),
          border: `1.5px solid ${color}`,
          borderRadius: 999,
          padding: "7px 18px",
        }}
      >
        {text}
      </span>
    </TextAt>
  );
};

// Étiquette SVG en petites capitales.
export const SvgCaps: React.FC<{
  x: number;
  y: number;
  text: string;
  start: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  size?: number;
}> = ({
  x,
  y,
  text,
  start,
  color = COLORS.inkSoft,
  anchor = "middle",
  size = 22,
}) => (
  <SvgText
    x={x}
    y={y}
    text={text}
    start={start}
    size={size}
    weight={500}
    color={color}
    anchor={anchor}
    spacing="0.16em"
  />
);

// Position le long d'une polyligne (t entre 0 et 1).
const along = (pts: [number, number][], t: number): [number, number] => {
  const lens = pts
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = lens.reduce((a, b) => a + b, 0);
  let d = t * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i] || i === lens.length - 1) {
      const k = lens[i] === 0 ? 0 : Math.min(1, d / lens[i]);
      return [
        pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k,
        pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k,
      ];
    }
    d -= lens[i];
  }
  return pts[pts.length - 1];
};

// Particules lentes qui suivent un trajet (charges, courant, chaleur).
export const Flow: React.FC<{
  pts: [number, number][];
  start: number;
  n?: number;
  period?: number; // secondes pour parcourir le trajet
  color?: string;
  r?: number;
  stop?: number; // frame à partir de laquelle le flux s'éteint
  jitter?: number;
  opacity?: number;
}> = ({
  pts,
  start,
  n = 8,
  period = 3,
  color = COLORS.warm,
  r = 4,
  stop,
  jitter = 0,
  opacity = 0.9,
}) => {
  const frame = useCurrentFrame();
  if (frame < start) return null;
  const appear = progress(frame, start, 0.6);
  const fade =
    stop === undefined
      ? 1
      : interpolate(frame, [stop, stop + 12], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
  if (fade <= 0) return null;
  return (
    <g>
      {new Array(n).fill(0).map((_, i) => {
        const t = ((((frame - start) / (period * FPS) + i / n) % 1) + 1) % 1;
        const [x, y] = along(pts, t);
        const edge = Math.min(1, t / 0.12, (1 - t) / 0.12);
        const j = jitter ? Math.sin(i * 7.3 + frame * 0.05) * jitter : 0;
        return (
          <circle
            key={i}
            cx={x + j * 0.3}
            cy={y + j}
            r={r}
            fill={color}
            opacity={appear * fade * edge * opacity}
          />
        );
      })}
    </g>
  );
};

// Signal d'horloge carré qui défile (période en px ; 0 = horloge arrêtée).
export const clockPath = (
  x: number,
  y: number,
  w: number,
  amp: number,
  period: number,
  phase: number,
) => {
  if (period <= 0) return `M ${x} ${y + amp / 2} H ${x + w}`;
  const half = period / 2;
  let d = "";
  let cx = x - (((phase % period) + period) % period);
  let high = true;
  const pts: string[] = [];
  while (cx < x + w) {
    const a = Math.max(x, cx);
    const b = Math.min(x + w, cx + half);
    const yy = high ? y - amp / 2 : y + amp / 2;
    if (b > a) pts.push(`${pts.length ? "L" : "M"} ${a} ${yy} L ${b} ${yy}`);
    cx += half;
    high = !high;
  }
  d = pts.join(" ");
  return d;
};

// Segment de barre horizontal qui s'allonge.
export const BarSeg: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  start: number;
  color: string;
  duration?: number;
}> = ({ x, y, w, h, start, color, duration = 0.9 }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, start, duration);
  if (p <= 0) return null;
  return (
    <g>
      <rect x={x} y={y} width={w * p} height={h} fill={color} opacity={0.22} />
      <rect
        x={x}
        y={y}
        width={w * p}
        height={h}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
      />
    </g>
  );
};

// Numéro cerclé dans un SVG.
export const NumBadge: React.FC<{
  x: number;
  y: number;
  n: string;
  start: number;
  color?: string;
}> = ({ x, y, n, start, color = COLORS.warm }) => {
  const frame = useCurrentFrame();
  const o = progress(frame, start, 0.5);
  return (
    <g opacity={o}>
      <circle
        cx={x}
        cy={y}
        r={17}
        fill="#0a1a3d"
        stroke={color}
        strokeWidth={1.6}
      />
      <text
        x={x}
        y={y + 8}
        textAnchor="middle"
        fontFamily={FONT}
        fontWeight={500}
        fontSize={22}
        fill={color}
      >
        {n}
      </text>
    </g>
  );
};

// ---------------------------------------------------------------------------
// Scène 23 — Consommer sans calculer.
// ---------------------------------------------------------------------------

// 1. Un bloc au repos consomme quand même.
const Idle: React.FC = () => {
  const cues = useCues();
  const t = cues.s(1);
  const cx = 960;
  return (
    <AbsoluteFill>
      <Title
        kicker="Fuites et limites de la tension"
        text="La puce consomme aussi sans calcul utile"
        start={cues.s(0)}
      />
      <Svg>
        {/* Rails d'alimentation */}
        <DrawPath
          d="M 560 350 H 1360"
          start={t}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <DrawPath
          d="M 560 760 H 1360"
          start={t}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <SvgCaps
          x={540}
          y={350}
          text="VDD"
          start={t + 6}
          anchor="end"
          color={COLORS.ink}
        />
        <SvgCaps
          x={540}
          y={760}
          text="MASSE"
          start={t + 3}
          anchor="end"
          color={COLORS.ink}
        />
        {/* Bloc logique au repos */}
        <DrawPath
          d={roundRectPath(cx - 190, 440, 380, 230, 14)}
          start={t + 6}
          duration={0.8}
          stroke={COLORS.ink}
        />
        <DrawPath
          d={`M ${cx} 350 V 440 M ${cx} 670 V 760`}
          start={t + 9}
          duration={0.5}
          stroke={COLORS.inkSoft}
        />
        <SvgText x={cx} y={520} text="bloc logique" start={t + 10} size={30} />
        <SvgText
          x={cx}
          y={565}
          text="aucune opération utile"
          start={t + 13}
          size={24}
          color={COLORS.inkSoft}
        />
        {/* Horloge plate : pas d'activité */}
        <DrawPath
          d={`M ${cx - 140} 625 H ${cx + 140}`}
          start={t + 15}
          duration={0.8}
          stroke={COLORS.accent}
          width={1.6}
        />
        <SvgCaps
          x={cx}
          y={605}
          text="aucune transition"
          start={t + 18}
          color={COLORS.accent}
        />
        {/* Fuite qui traverse malgré tout */}
        <Flow
          pts={[
            [cx, 352],
            [cx, 440],
          ]}
          start={t + 24}
          n={3}
          period={2.4}
          r={4}
        />
        <Flow
          pts={[
            [cx - 150, 450],
            [cx - 150, 660],
          ]}
          start={t + 26}
          n={5}
          period={3.6}
          r={3.5}
          opacity={0.6}
        />
        <Flow
          pts={[
            [cx + 150, 450],
            [cx + 150, 660],
          ]}
          start={t + 28}
          n={5}
          period={3.8}
          r={3.5}
          opacity={0.6}
        />
        <Flow
          pts={[
            [cx, 670],
            [cx, 758],
          ]}
          start={t + 26}
          n={3}
          period={2.4}
          r={4}
        />
      </Svg>
      <TextAt x={1420} y={500} w={360} start={t + 30}>
        <div style={caps(COLORS.warm)}>COURANT DE FUITE</div>
        <div
          style={{ ...textStyle(28, 300), marginTop: 10, color: COLORS.ink }}
        >
          un courant passe quand même : la puissance n’est pas nulle
        </div>
      </TextAt>
    </AbsoluteFill>
  );
};

// 2. Décomposition de la puissance totale.
const PARTS = [
  {
    name: "Commutation capacitive",
    what: "charger et décharger les capacités à chaque transition",
    formula: "≈ α · C · VDD² · f",
    color: COLORS.accent,
    w: 760,
    col: 450,
  },
  {
    name: "Courant traversant",
    what: "bref chemin direct VDD → masse pendant une transition",
    formula: "court-circuit transitoire",
    color: COLORS.ink,
    w: 150,
    col: 960,
  },
  {
    name: "Fuites",
    what: "courant permanent, même sans aucune transition",
    formula: "≈ VDD × I fuite",
    color: COLORS.warm,
    w: 490,
    col: 1470,
  },
];
const Decomp: React.FC = () => {
  const cues = useCues();
  const t = cues.s(2);
  const starts = [t + FPS * 1.2, t + FPS * 3.2, t + FPS * 5.4];
  const x0 = 260;
  const y = 380;
  const h = 90;
  let acc = x0;
  const segs = PARTS.map((p) => {
    const s = { x: acc, w: p.w };
    acc += p.w;
    return s;
  });
  return (
    <AbsoluteFill>
      <TextAt x={960} y={200} w={1400} start={t} align="center">
        <div style={textStyle(46, 200)}>
          P<sub style={{ fontSize: 26 }}>totale</sub> ={" "}
          <span style={{ color: COLORS.accent }}>commutation</span> +{" "}
          <span style={{ color: COLORS.ink }}>traversant</span> +{" "}
          <span style={{ color: COLORS.warm }}>fuites</span>
        </div>
      </TextAt>
      <Svg>
        {PARTS.map((p, i) => (
          <g key={p.name}>
            <BarSeg
              x={segs[i].x}
              y={y}
              w={p.w}
              h={h}
              start={starts[i]}
              color={p.color}
            />
            <DrawPath
              d={`M ${segs[i].x + p.w / 2} ${y + h + 8} L ${p.col} ${y + h + 70}`}
              start={starts[i] + 20}
              duration={0.5}
              stroke={COLORS.inkFaint}
              width={1.4}
            />
          </g>
        ))}
        <SvgCaps
          x={x0}
          y={y - 26}
          text="puissance totale (proportions illustratives)"
          start={t + 20}
          anchor="start"
        />
      </Svg>
      {PARTS.map((p, i) => (
        <TextAt
          key={p.name}
          x={p.col}
          y={y + h + 90}
          w={440}
          start={starts[i] + 22}
          align="center"
        >
          <div style={{ ...textStyle(32, 400), color: p.color }}>{p.name}</div>
          <div
            style={{ ...textStyle(26, 300), marginTop: 12, color: COLORS.ink }}
          >
            {p.what}
          </div>
          <div
            style={{
              ...textStyle(26, 300),
              marginTop: 14,
              color: COLORS.inkSoft,
            }}
          >
            {p.formula}
          </div>
        </TextAt>
      ))}
    </AbsoluteFill>
  );
};

// 3. Transistor bloqué et ses trois chemins de fuite.
const PATHS = [
  {
    n: "1",
    title: "Sous le seuil",
    text: "source → drain, alors que la grille bloque",
  },
  {
    n: "2",
    title: "À travers l’isolant",
    text: "de la grille vers le canal (effet tunnel)",
  },
  { n: "3", title: "Aux jonctions", text: "du drain vers le substrat" },
];
const Leaks: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(3);
  const at = [t + FPS * 1.4, t + FPS * 2.8, t + FPS * 4.0];
  const eq = cues.s(4);
  return (
    <AbsoluteFill>
      <TextAt x={960} y={140} w={1200} start={t} align="center">
        <div style={caps(COLORS.inkSoft)}>
          TRANSISTOR BLOQUÉ · TROIS CHEMINS DE FUITE
        </div>
      </TextAt>
      <Svg>
        {/* Substrat, source, drain, isolant, grille */}
        <DrawPath
          d={roundRectPath(300, 430, 800, 250, 8)}
          start={t}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <SvgCaps x={700} y={655} text="substrat p" start={t + 10} />
        <path
          d={`M 330 430 V 490 Q 330 515 355 515 H 505 Q 530 515 530 490 V 430 Z`}
          fill={accentA(0.14)}
          opacity={progress(frame, t + 6, 0.5)}
        />
        <DrawPath
          d={`M 330 430 V 490 Q 330 515 355 515 H 505 Q 530 515 530 490 V 430`}
          start={t + 4}
          duration={0.6}
          stroke={COLORS.accent}
        />
        <path
          d={`M 870 430 V 490 Q 870 515 895 515 H 1045 Q 1070 515 1070 490 V 430 Z`}
          fill={accentA(0.14)}
          opacity={progress(frame, t + 6, 0.5)}
        />
        <DrawPath
          d={`M 870 430 V 490 Q 870 515 895 515 H 1045 Q 1070 515 1070 490 V 430`}
          start={t + 4}
          duration={0.6}
          stroke={COLORS.accent}
        />
        <SvgText
          x={430}
          y={470}
          text="source n+"
          start={t + 10}
          size={22}
          color={COLORS.accent}
        />
        <SvgText
          x={970}
          y={470}
          text="drain n+"
          start={t + 10}
          size={22}
          color={COLORS.accent}
        />
        <rect
          x={530}
          y={416}
          width={340}
          height={14}
          fill={inkA(0.35)}
          opacity={progress(frame, t + 8, 0.5)}
        />
        <DrawPath
          d={roundRectPath(545, 330, 310, 84, 6)}
          start={t + 8}
          duration={0.6}
          stroke={COLORS.ink}
        />
        <SvgText x={700} y={362} text="grille" start={t + 14} size={26} />
        <SvgText
          x={700}
          y={396}
          text="0 V : bloqué"
          start={t + 16}
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={430}
          y={400}
          text="0 V"
          start={t + 14}
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={970}
          y={400}
          text="VDD"
          start={t + 14}
          size={22}
          color={COLORS.ink}
        />
        {/* ① sous le seuil */}
        <Arrow
          x1={540}
          y1={458}
          x2={860}
          y2={458}
          start={at[0]}
          stroke={COLORS.warm}
          width={1.6}
        />
        <Flow
          pts={[
            [520, 458],
            [880, 458],
          ]}
          start={at[0] + 10}
          n={5}
          period={3.2}
          r={4}
        />
        <NumBadge x={700} y={490} n="1" start={at[0]} />
        {/* ② à travers l'isolant */}
        <Arrow
          x1={800}
          y1={372}
          x2={800}
          y2={446}
          start={at[1]}
          stroke={COLORS.warm}
          width={1.6}
        />
        <Flow
          pts={[
            [800, 380],
            [800, 446],
          ]}
          start={at[1] + 10}
          n={2}
          period={2.4}
          r={3.5}
        />
        <NumBadge x={888} y={372} n="2" start={at[1]} />
        {/* ③ aux jonctions */}
        <Arrow
          x1={970}
          y1={520}
          x2={970}
          y2={610}
          start={at[2]}
          stroke={COLORS.warm}
          width={1.6}
        />
        <Flow
          pts={[
            [970, 520],
            [970, 620],
          ]}
          start={at[2] + 10}
          n={3}
          period={2.6}
          r={4}
        />
        <NumBadge x={1005} y={570} n="3" start={at[2]} />
      </Svg>
      {PATHS.map((p, i) => (
        <TextAt key={p.n} x={1180} y={320 + i * 120} w={600} start={at[i] + 6}>
          <div style={{ display: "flex", gap: 18, alignItems: "baseline" }}>
            <span style={{ ...textStyle(28, 500), color: COLORS.warm }}>
              {p.n}
            </span>
            <div>
              <div style={{ ...textStyle(30, 400) }}>{p.title}</div>
              <div
                style={{
                  ...textStyle(24, 300),
                  color: COLORS.inkSoft,
                  marginTop: 4,
                }}
              >
                {p.text}
              </div>
            </div>
          </div>
        </TextAt>
      ))}
      <TextAt x={960} y={720} w={1500} start={eq} align="center">
        <div style={textStyle(52, 200)}>
          P<sub style={{ fontSize: 28 }}>fuite</sub>{" "}
          <span style={{ color: COLORS.accent }}>≈</span> VDD{" "}
          <span style={{ color: COLORS.accent }}>×</span>{" "}
          <span style={{ color: COLORS.warm }}>
            I<sub style={{ fontSize: 28 }}>fuite</sub>
          </span>
        </div>
      </TextAt>
      <TextAt x={960} y={800} w={1200} start={eq + FPS * 2.5} align="center">
        <div style={{ ...textStyle(26, 300), color: COLORS.inkSoft }}>
          I<sub style={{ fontSize: 18 }}>fuite</sub> = courant de fuite total (1
          + 2 + 3, sur tous les transistors)
        </div>
      </TextAt>
    </AbsoluteFill>
  );
};

// 4. Ce dont dépendent les fuites ; leur part n'est pas universelle.
const FACTORS = [
  { name: "Technologie", sub: "procédé, matériaux" },
  { name: "Dimensions", sub: "canal, isolant" },
  { name: "Seuil Vth", sub: "Vth plus bas → fuite ↑" },
  { name: "Tension VDD", sub: "VDD plus haute → fuite ↑" },
  { name: "Température", sub: "plus chaud → fuite ↑" },
];
const Factors: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(5);
  const x0 = 200;
  const w = 280;
  const gap = 25;
  const cx = 960;
  const cy = 450;
  const s6 = cues.s(6);
  const shares = [0.18, 0.42, 0.3];
  return (
    <AbsoluteFill>
      <Svg>
        {FACTORS.map((f, i) => {
          const x = x0 + i * (w + gap);
          const st = t + FPS * (0.8 + i * 1.0);
          return (
            <g key={f.name}>
              <DrawPath
                d={roundRectPath(x, 170, w, 110, 12)}
                start={st}
                duration={0.6}
                stroke={COLORS.inkSoft}
                width={1.4}
              />
              <SvgText
                x={x + w / 2}
                y={208}
                text={f.name}
                start={st + 6}
                size={28}
                weight={400}
              />
              <SvgText
                x={x + w / 2}
                y={248}
                text={f.sub}
                start={st + 10}
                size={22}
                color={COLORS.inkSoft}
              />
              <Arrow
                x1={x + w / 2}
                y1={290}
                x2={cx + (x + w / 2 - cx) * 0.12}
                y2={cy - 52}
                start={st + 10}
                stroke={COLORS.inkFaint}
                width={1.4}
              />
            </g>
          );
        })}
        <DrawPath
          d={circlePath(cx, cy, 50)}
          start={t}
          duration={0.8}
          stroke={COLORS.warm}
        />
        <SvgText
          x={cx}
          y={cy}
          text="fuites"
          start={t + 8}
          size={28}
          color={COLORS.warm}
        />
        {/* Part des fuites : variable */}
        <SvgCaps
          x={cx}
          y={560}
          text="part des fuites dans la puissance totale"
          start={s6}
        />
        {shares.map((sh, i) => {
          const y = 600 + i * 72;
          const bw = 900;
          const bx = 560;
          const o = progress(frame, s6 + 8 + i * 8, 0.6);
          return (
            <g key={i} opacity={o}>
              <text
                x={bx - 24}
                y={y + 32}
                textAnchor="end"
                fontFamily={FONT}
                fontWeight={300}
                fontSize={24}
                fill={COLORS.inkSoft}
              >
                {["puce A", "puce B", "puce C"][i]}
              </text>
              <rect
                x={bx}
                y={y}
                width={bw * (1 - sh)}
                height={46}
                fill={accentA(0.14)}
                stroke={COLORS.accent}
                strokeWidth={1.2}
              />
              <rect
                x={bx + bw * (1 - sh)}
                y={y}
                width={bw * sh}
                height={46}
                fill={warmA(0.25)}
                stroke={COLORS.warm}
                strokeWidth={1.2}
              />
            </g>
          );
        })}
      </Svg>
      <TextAt x={1490} y={640} w={290} start={s6 + 30}>
        <div style={{ ...textStyle(26, 300), color: COLORS.warm }}>
          aucune part universelle
        </div>
        <div
          style={{ ...textStyle(22, 300), color: COLORS.inkSoft, marginTop: 8 }}
        >
          exemples illustratifs
        </div>
      </TextAt>
    </AbsoluteFill>
  );
};

// 5. Ralentir l'horloge : la commutation baisse, la fuite reste.
const SlowClock: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(7);
  const rows = [
    { y: 300, label: "horloge f", period: 60, k: 1 },
    { y: 500, label: "horloge f / 2", period: 120, k: 0.5 },
  ];
  const bx = 640;
  const h = 80;
  return (
    <AbsoluteFill>
      <TextAt x={960} y={150} w={1400} start={t} align="center">
        <div style={textStyle(40, 200)}>
          Réduire la fréquence, sans couper l’alimentation
        </div>
      </TextAt>
      <Svg>
        {rows.map((r, i) => {
          const st = t + FPS * (0.3 + i * 1.1);
          const o = progress(frame, st, 0.6);
          const sw = 620 * r.k;
          const cw = 120 * r.k;
          return (
            <g key={r.label}>
              <g opacity={o}>
                <path
                  d={clockPath(
                    220,
                    r.y + h / 2,
                    330,
                    44,
                    r.period,
                    (frame - t) * 2,
                  )}
                  stroke={COLORS.accent}
                  strokeWidth={1.8}
                  fill="none"
                />
              </g>
              <SvgCaps
                x={220}
                y={r.y - 20}
                text={r.label}
                start={st}
                anchor="start"
                color={COLORS.ink}
              />
              <BarSeg
                x={bx}
                y={r.y}
                w={sw}
                h={h}
                start={st + 6}
                color={COLORS.accent}
              />
              <BarSeg
                x={bx + sw}
                y={r.y}
                w={cw}
                h={h}
                start={st + 14}
                color={COLORS.ink}
                duration={0.5}
              />
              <BarSeg
                x={bx + sw + cw}
                y={r.y}
                w={400}
                h={h}
                start={st + 20}
                color={COLORS.warm}
                duration={0.7}
              />
              <SvgText
                x={bx + sw / 2}
                y={r.y + h / 2}
                text="commutation"
                start={st + 16}
                size={24}
                color={COLORS.accent}
              />
              <SvgText
                x={bx + sw + cw + 200}
                y={r.y + h / 2}
                text="fuites"
                start={st + 26}
                size={24}
                color={COLORS.warm}
              />
            </g>
          );
        })}
        {/* Repères : la fuite a la même taille */}
        <DrawPath
          d={`M ${bx + 310 + 60} 600 V 620 H ${bx + 310 + 60 + 400} V 600`}
          start={t + FPS * 2.4}
          duration={0.6}
          stroke={COLORS.warm}
          width={1.4}
        />
        <SvgText
          x={bx + 370 + 200}
          y={650}
          text="fuite : inchangée"
          start={t + FPS * 2.6}
          size={26}
          color={COLORS.warm}
        />
        <DrawPath
          d={`M ${bx} 600 V 620 H ${bx + 310} V 600`}
          start={t + FPS * 2.0}
          duration={0.6}
          stroke={COLORS.accent}
          width={1.4}
        />
        <SvgText
          x={bx + 155}
          y={650}
          text="÷ 2"
          start={t + FPS * 2.2}
          size={26}
          color={COLORS.accent}
        />
      </Svg>
      <TextAt x={260} y={720} w={1400} start={t + FPS * 3.1}>
        <div style={caps(COLORS.warm)}>ATTENTION</div>
        <div style={{ ...textStyle(32, 300), marginTop: 10 }}>
          Ralentir l’horloge réduit la commutation ; tant que le bloc reste
          alimenté, la fuite demeure.
        </div>
      </TextAt>
    </AbsoluteFill>
  );
};

export const S23: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(1)}>
        <Idle />
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(2)}>
        <Decomp />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(3)}>
        <Leaks />
      </Stage>
      <Stage from={cues.beat(3)} to={cues.beat(4)}>
        <Factors />
      </Stage>
      <Stage from={cues.beat(4)}>
        <SlowClock />
      </Stage>
    </AbsoluteFill>
  );
};
