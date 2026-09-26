import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
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

// ——— Primitives partagées par les scènes de physique (S04 → S12) ———

// Électron : petit point plein, couleur d'accent.
export const Electron: React.FC<{
  x: number;
  y: number;
  r?: number;
  o?: number;
  color?: string;
}> = ({ x, y, r = 5.5, o = 1, color = COLORS.accent }) =>
  o <= 0 ? null : <circle cx={x} cy={y} r={r} fill={color} opacity={o} />;

// Trou : petit cercle vide.
export const Hole: React.FC<{
  x: number;
  y: number;
  r?: number;
  o?: number;
  color?: string;
}> = ({ x, y, r = 6.5, o = 1, color = COLORS.warm }) =>
  o <= 0 ? null : (
    <circle
      cx={x}
      cy={y}
      r={r}
      fill="none"
      stroke={color}
      strokeWidth={2}
      opacity={o}
    />
  );

// Ion fixe : ⊕ ou ⊖.
export const Ion: React.FC<{
  x: number;
  y: number;
  sign: "+" | "-";
  r?: number;
  o?: number;
  color?: string;
}> = ({ x, y, sign, r = 10, o = 1, color = COLORS.inkSoft }) => {
  if (o <= 0) return null;
  const k = r * 0.55;
  const d =
    `${circlePath(x, y, r)} M ${x - k} ${y} H ${x + k}` +
    (sign === "+" ? ` M ${x} ${y - k} V ${y + k}` : "");
  return (
    <path d={d} fill="none" stroke={color} strokeWidth={1.6} opacity={o} />
  );
};

// Petit mouvement brownien déterministe (lissé).
export const wander = (seed: string, frame: number, amp: number) => {
  const a = random(`${seed}a`) * 6.28;
  const b = random(`${seed}b`) * 6.28;
  const w1 = 0.02 + random(`${seed}c`) * 0.03;
  const w2 = 0.02 + random(`${seed}d`) * 0.03;
  return [
    amp *
      (Math.sin(frame * w1 + a) * 0.7 + Math.sin(frame * w2 * 1.7 + b) * 0.3),
    amp *
      (Math.cos(frame * w2 + b) * 0.7 + Math.sin(frame * w1 * 1.3 + a) * 0.3),
  ];
};

// Étiquette SVG en petites capitales.
export const Caps: React.FC<{
  x: number;
  y: number;
  text: string;
  start: number;
  color?: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
}> = ({
  x,
  y,
  text,
  start,
  color = COLORS.inkSoft,
  size = 22,
  anchor = "middle",
}) => (
  <SvgText
    x={x}
    y={y}
    text={text.toUpperCase()}
    start={start}
    size={size}
    weight={500}
    color={color}
    anchor={anchor}
    spacing="0.16em"
  />
);

// Encadré positionné librement : étiquette en capitales + texte.
const NOTE = {
  warn: { label: "ATTENTION", color: COLORS.warm },
  keep: { label: "À RETENIR", color: COLORS.accent },
  analyst: { label: "POINT ANALYSTE", color: COLORS.warm },
  phys: { label: "REPÈRE PHYSIQUE", color: COLORS.accent },
  src: { label: "SOURCE", color: COLORS.inkSoft },
};
export const Note: React.FC<{
  kind: keyof typeof NOTE;
  x: number;
  y: number;
  width: number;
  start: number;
  label?: string;
  size?: number;
  children: React.ReactNode;
}> = ({ kind, x, y, width, start, label, size = 30, children }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, start, 0.7);
  const { color, label: l } = NOTE[kind];
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        padding: "6px 0 6px 30px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 2,
          height: `${p * 100}%`,
          background: color,
        }}
      />
      <FadeIn start={start + 4}>
        <div
          style={{
            ...textStyle(22, 500),
            color,
            letterSpacing: "0.26em",
            marginBottom: 10,
          }}
        >
          {label ?? l}
        </div>
      </FadeIn>
      <FadeIn start={start + 10}>
        <div style={{ ...textStyle(size, 300), lineHeight: 1.35 }}>
          {children}
        </div>
      </FadeIn>
    </div>
  );
};

// Texte HTML positionné (corps de texte), en fondu.
export const Txt: React.FC<{
  x: number;
  y: number;
  start: number;
  width?: number;
  size?: number;
  weight?: number;
  color?: string;
  align?: "left" | "center" | "right";
  children: React.ReactNode;
}> = ({
  x,
  y,
  start,
  width = 600,
  size = 30,
  weight = 300,
  color = COLORS.ink,
  align = "left",
  children,
}) => (
  <FadeIn
    start={start}
    style={{
      position: "absolute",
      left: x,
      top: y,
      width,
      textAlign: align,
    }}
  >
    <div style={{ ...textStyle(size, weight), color, lineHeight: 1.35 }}>
      {children}
    </div>
  </FadeIn>
);

// Petit signe « + » ou « − » dessiné (charges de surface, noyau…).
export const Sign: React.FC<{
  x: number;
  y: number;
  sign: "+" | "-";
  s?: number;
  o?: number;
  color?: string;
  width?: number;
}> = ({ x, y, sign, s = 8, o = 1, color = COLORS.ink, width = 2 }) =>
  o <= 0 ? null : (
    <path
      d={
        `M ${x - s} ${y} H ${x + s}` +
        (sign === "+" ? ` M ${x} ${y - s} V ${y + s}` : "")
      }
      stroke={color}
      strokeWidth={width}
      opacity={o}
      strokeLinecap="round"
    />
  );

// ——— Scène 4 ———

// L'atome : noyau positif, électrons négatifs (représentation symbolique).
const Atom: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const cx = 960;
  const cy = 540;
  const orbits = [0, 60, 120];
  const on = progress(frame, t + 20, 0.8);
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={circlePath(cx, cy, 34)}
          start={t}
          duration={0.8}
          stroke={COLORS.warm}
          width={2}
        />
        <Sign
          x={cx}
          y={cy}
          sign="+"
          s={14}
          color={COLORS.warm}
          o={progress(frame, t + 12, 0.5)}
        />
        {orbits.map((deg, i) => {
          const a = (deg * Math.PI) / 180;
          const rx = 210;
          const ry = 70;
          const pts = new Array(49).fill(0).map((_, k) => {
            const th = (k / 48) * Math.PI * 2;
            const x = rx * Math.cos(th);
            const y = ry * Math.sin(th);
            return `${k === 0 ? "M" : "L"} ${cx + x * Math.cos(a) - y * Math.sin(a)} ${cy + x * Math.sin(a) + y * Math.cos(a)}`;
          });
          const th = (frame - t) * 0.035 * (1 + i * 0.15) + i * 2.1;
          const ex = rx * Math.cos(th);
          const ey = ry * Math.sin(th);
          return (
            <g key={deg}>
              <DrawPath
                d={pts.join(" ")}
                start={t + 8 + i * 6}
                duration={1.2}
                stroke={COLORS.inkFaint}
                width={1.4}
              />
              <Electron
                x={cx + ex * Math.cos(a) - ey * Math.sin(a)}
                y={cy + ex * Math.sin(a) + ey * Math.cos(a)}
                r={8}
                o={on}
              />
            </g>
          );
        })}
        {/* Légendes */}
        <DrawPath
          d={`M ${cx - 40} ${cy + 20} L ${cx - 360} ${cy + 190}`}
          start={t + 30}
          duration={0.6}
          stroke={COLORS.inkSoft}
          width={1.2}
        />
        <SvgText
          x={cx - 380}
          y={cy + 215}
          text="noyau positif (+)"
          start={t + 40}
          size={30}
          color={COLORS.warm}
          anchor="end"
        />
        <DrawPath
          d={`M ${cx + 200} ${cy - 50} L ${cx + 380} ${cy - 170}`}
          start={t + 50}
          duration={0.6}
          stroke={COLORS.inkSoft}
          width={1.2}
        />
        <SvgText
          x={cx + 400}
          y={cy - 185}
          text="électrons (charge négative −)"
          start={t + 60}
          size={30}
          color={COLORS.accent}
          anchor="start"
        />
        <Caps
          x={cx}
          y={cy + 290}
          text="représentation symbolique, non à l’échelle"
          start={t + 80}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Un solide : réseau d'atomes liés, électrons liés et quelques électrons mobiles.
const Lattice: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(1);
  const cols = 9;
  const rows = 4;
  const X = (c: number) => 440 + c * 130;
  const Y = (r: number) => 330 + r * 125;
  const bonds: [number, number, number, number][] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      if (c < cols - 1) bonds.push([X(c), Y(r), X(c + 1), Y(r)]);
      if (r < rows - 1) bonds.push([X(c), Y(r), X(c), Y(r + 1)]);
    }
  const bondD = bonds
    .map(([a, b, c, d]) => `M ${a + 22} ${b} L ${c - 22} ${d}`)
    .map((s, i) => {
      const [a, b, c, d] = bonds[i];
      return a === c ? `M ${a} ${b + 22} L ${c} ${d - 22}` : s;
    })
    .join(" ");
  const boundO = progress(frame, t + 40, 0.8);
  const mobileO = progress(frame, cues.s(2, 2.5), 0.8);
  const span = 1040 + 130;
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={bondD}
          start={t + 20}
          duration={1.4}
          stroke={COLORS.inkFaint}
          width={1.4}
        />
        {new Array(rows * cols).fill(0).map((_, i) => {
          const r = Math.floor(i / cols);
          const c = i % cols;
          const o = progress(frame, t + (c + r) * 2, 0.5);
          return (
            <g key={i} opacity={o}>
              <circle
                cx={X(c)}
                cy={Y(r)}
                r={20}
                fill="none"
                stroke={COLORS.ink}
                strokeWidth={1.6}
              />
              <Sign x={X(c)} y={Y(r)} sign="+" s={7} color={COLORS.warm} />
            </g>
          );
        })}
        {/* Électrons liés : deux par liaison */}
        {bonds.map(([a, b, c, d], i) => {
          const mx = (a + c) / 2;
          const my = (b + d) / 2;
          const horiz = b === d;
          return (
            <g key={i} opacity={boundO * 0.8}>
              <circle
                cx={mx + (horiz ? 0 : -6)}
                cy={my + (horiz ? -6 : 0)}
                r={3.5}
                fill={COLORS.inkSoft}
              />
              <circle
                cx={mx + (horiz ? 0 : 6)}
                cy={my + (horiz ? 6 : 0)}
                r={3.5}
                fill={COLORS.inkSoft}
              />
            </g>
          );
        })}
        {/* Électrons mobiles */}
        {new Array(7).fill(0).map((_, i) => {
          const base = random(`m${i}`) * span;
          const x = 375 + ((base + (frame - t) * 1.1) % span);
          const row = Math.floor(random(`r${i}`) * (rows - 1));
          const [dx, dy] = wander(`w${i}`, frame, 16);
          const y = Y(row) + 62 + dy;
          const edge = Math.min(1, (x - 375) / 60, (375 + span - x) / 60);
          return (
            <Electron
              key={i}
              x={x + dx}
              y={y}
              r={7}
              o={mobileO * Math.max(0, edge)}
            />
          );
        })}
        {/* Légende */}
        <circle
          cx={520}
          cy={820}
          r={4}
          fill={COLORS.inkSoft}
          opacity={boundO}
        />
        <SvgText
          x={545}
          y={820}
          text="électrons liés (engagés dans les liaisons)"
          start={t + 45}
          size={26}
          color={COLORS.inkSoft}
          anchor="start"
        />
        <Electron x={1130} y={820} r={7} o={mobileO} />
        <SvgText
          x={1155}
          y={820}
          text="électrons mobiles → transport du courant"
          start={cues.s(2, 3)}
          size={26}
          color={COLORS.accent}
          anchor="start"
        />
      </Svg>
      <Txt x={140} y={230} width={1640} start={t + 6} size={30} align="center">
        Dans un solide, les atomes sont liés entre eux
      </Txt>
    </AbsoluteFill>
  );
};

// Le courant : charge qui traverse une section, par seconde.
const Current: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(2);
  const x0 = 260;
  const L = 1400;
  const xs = 960;
  const yc = 470;
  const v = 4;
  const N = 64;
  const count0 = t + 1.6 * FPS;
  let count = 0;
  const dots = new Array(N).fill(0).map((_, i) => {
    const off = random(`c${i}`) * L;
    const u = off + (frame - t) * v;
    const s = xs - x0;
    if (frame > count0) {
      const u0 = off + (count0 - t) * v;
      count += Math.floor((u - s) / L) - Math.floor((u0 - s) / L);
    }
    const x = x0 + (u % L);
    const y = yc + (random(`cy${i}`) - 0.5) * 110;
    const edge = Math.min(1, (x - x0) / 70, (x0 + L - x) / 70);
    return { x, y, o: Math.max(0, edge) };
  });
  const on = progress(frame, t + 10, 0.6);
  const elapsed = Math.max(0, (frame - count0) / FPS);
  const counting = progress(frame, count0, 0.4);
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={`M ${x0} ${yc - 75} H ${x0 + L} M ${x0} ${yc + 75} H ${x0 + L}`}
          start={t}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1.6}
        />
        {dots.map((d, i) => (
          <Electron key={i} x={d.x} y={d.y} o={on * d.o} r={6} />
        ))}
        <path
          d={`M ${xs} ${yc - 75} A 30 75 0 0 1 ${xs} ${yc + 75} A 30 75 0 0 1 ${xs} ${yc - 75}`}
          fill={COLORS.accent}
          fillOpacity={0.1 * counting}
          stroke={COLORS.accent}
          strokeWidth={2}
          opacity={progress(frame, t + 24, 0.6)}
        />
        <Caps
          x={xs}
          y={yc - 105}
          text="section du conducteur"
          start={t + 30}
          color={COLORS.accent}
        />
      </Svg>
      <div
        style={{
          position: "absolute",
          top: 600,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 120,
          opacity: counting,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.inkSoft,
              letterSpacing: "0.2em",
            }}
          >
            CHARGES COMPTÉES
          </div>
          <div
            style={{
              ...textStyle(60, 200),
              color: COLORS.accent,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {count}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.inkSoft,
              letterSpacing: "0.2em",
            }}
          >
            TEMPS ÉCOULÉ
          </div>
          <div
            style={{
              ...textStyle(60, 200),
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {elapsed.toLocaleString("fr-FR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}{" "}
            s
          </div>
        </div>
      </div>
      <FadeIn
        start={cues.s(3, 3.2)}
        style={{
          position: "absolute",
          top: 780,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(36, 300)}>
          courant <span style={{ color: COLORS.accent }}>I</span> = charge ÷
          temps
          <span style={{ color: COLORS.inkSoft, fontSize: 28 }}>
            {"   "}· 1 ampère = 1 coulomb par seconde
          </span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// La tension : différence de potentiel = énergie par unité de charge.
const Voltage: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(3);
  const hi = 330;
  const lo = 690;
  // Une charge descend du niveau haut au niveau bas, en boucle.
  const cyc = ((frame - t - 40) / (3.2 * FPS)) % 1;
  const ph = Math.max(0, cyc);
  const bx = 420 + ph * 520;
  const by = hi + (lo - hi) * Math.min(1, Math.max(0, (ph - 0.3) / 0.4));
  const ballO = progress(frame, t + 40, 0.4) * (frame > t + 40 ? 1 : 0);
  const released = ph > 0.7 ? 1 - (ph - 0.7) / 0.3 : 0;
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={`M 380 ${hi} H 580 L 780 ${lo} H 980`}
          start={t}
          duration={1.2}
          stroke={COLORS.ink}
          width={2}
        />
        <Caps
          x={380}
          y={hi - 34}
          text="potentiel haut"
          start={t + 10}
          anchor="start"
        />
        <Caps
          x={980}
          y={lo + 40}
          text="potentiel bas"
          start={t + 16}
          anchor="end"
        />
        {/* Différence de potentiel */}
        <Arrow
          x1={1080}
          y1={(hi + lo) / 2}
          x2={1080}
          y2={hi + 6}
          start={t + 20}
          stroke={COLORS.accent}
        />
        <Arrow
          x1={1080}
          y1={(hi + lo) / 2}
          x2={1080}
          y2={lo - 6}
          start={t + 20}
          stroke={COLORS.accent}
        />
        <DrawPath
          d={`M 980 ${hi} H 1100 M 980 ${lo} H 1100`}
          start={t + 14}
          duration={0.6}
          stroke={COLORS.inkFaint}
          width={1}
        />
        <SvgText
          x={1110}
          y={(hi + lo) / 2}
          text="V"
          start={t + 30}
          size={50}
          color={COLORS.accent}
          anchor="start"
        />
        {/* Charge d'essai */}
        <circle
          cx={bx}
          cy={by - 18}
          r={16}
          fill="none"
          stroke={COLORS.ink}
          strokeWidth={2}
          opacity={ballO}
        />
        <SvgText
          x={bx}
          y={by - 18}
          text="q"
          start={t + 40}
          size={22}
          weight={400}
        />
        {/* Énergie cédée en bas */}
        {[0, 1, 2].map((k) => (
          <path
            key={k}
            d={`M ${840 + k * 36} ${lo - 30} q 8 -14 0 -28 q -8 -14 0 -28`}
            fill="none"
            stroke={COLORS.warm}
            strokeWidth={2}
            opacity={released * ballO}
          />
        ))}
      </Svg>
      <Txt x={1220} y={330} width={560} start={t + 30} size={36}>
        Tension = différence de potentiel
      </Txt>
      <Txt x={1220} y={450} width={560} start={cues.s(4, 3.5)} size={32}>
        = <span style={{ color: COLORS.warm }}>énergie</span> échangée par unité
        de <span style={{ color: COLORS.accent }}>charge</span>
      </Txt>
      <Txt
        x={1220}
        y={590}
        width={560}
        start={cues.s(4, 5)}
        size={28}
        color={COLORS.inkSoft}
      >
        1 volt = 1 joule par coulomb
      </Txt>
    </AbsoluteFill>
  );
};

// L'analogie hydraulique : débit ↔ courant, différence de pression ↔ tension.
const Water: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(4);
  const flowO = progress(frame, t + 30, 0.6);
  // Réservoir haut (gauche), réservoir bas (droite), tuyau entre les deux.
  const pipe = `M 400 460 H 520 L 700 640 H 860`;
  const drops = new Array(9).fill(0).map((_, i) => {
    const p = ((frame - t) / (2.4 * FPS) + i / 9) % 1;
    // Parcours le long du tuyau (trois segments).
    const segs = [
      [400, 460, 520, 460],
      [520, 460, 700, 640],
      [700, 640, 860, 640],
    ];
    const lens = segs.map(([a, b, c, d]) => Math.hypot(c - a, d - b));
    const tot = lens.reduce((x, y) => x + y, 0);
    let s = p * tot;
    let k = 0;
    while (k < 2 && s > lens[k]) {
      s -= lens[k];
      k++;
    }
    const [a, b, c, d] = segs[k];
    const f = s / lens[k];
    return [a + (c - a) * f, b + (d - b) * f];
  });
  return (
    <AbsoluteFill>
      <Svg>
        <Caps x={560} y={250} text="l’image de l’eau" start={t} />
        {/* Réservoir haut */}
        <DrawPath
          d="M 200 300 V 500 H 400 V 300"
          start={t + 4}
          duration={0.8}
          stroke={COLORS.ink}
        />
        <rect
          x={202}
          y={340}
          width={196}
          height={158}
          fill={COLORS.accent}
          opacity={0.14 * progress(frame, t + 18, 0.6)}
        />
        {/* Réservoir bas */}
        <DrawPath
          d="M 860 560 V 740 H 1060 V 560"
          start={t + 8}
          duration={0.8}
          stroke={COLORS.ink}
        />
        <rect
          x={862}
          y={660}
          width={196}
          height={78}
          fill={COLORS.accent}
          opacity={0.14 * progress(frame, t + 18, 0.6)}
        />
        <DrawPath
          d={pipe}
          start={t + 14}
          duration={0.9}
          stroke={COLORS.inkFaint}
          width={16}
        />
        {drops.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={4}
            fill={COLORS.accent}
            opacity={flowO}
          />
        ))}
        {/* Débit et différence de pression */}
        <Arrow
          x1={560}
          y1={520}
          x2={640}
          y2={600}
          start={cues.s(5, 3.2)}
          stroke={COLORS.accent}
        />
        <SvgText
          x={680}
          y={540}
          text="débit"
          start={cues.s(5, 3.4)}
          size={28}
          color={COLORS.accent}
          anchor="start"
        />
        <DrawPath
          d="M 160 340 H 130 V 660 H 160"
          start={cues.s(5, 5.4)}
          duration={0.6}
          stroke={COLORS.warm}
        />
        <SvgText
          x={130}
          y={700}
          text={"différence\nde pression"}
          start={cues.s(5, 5.6)}
          size={26}
          color={COLORS.warm}
          anchor="start"
        />
      </Svg>
      {/* Correspondances */}
      <div style={{ position: "absolute", left: 1170, top: 380, width: 620 }}>
        {[
          {
            water: "débit",
            elec: "courant",
            unit: "ampère",
            at: cues.s(5, 3.2),
            c: COLORS.accent,
          },
          {
            water: "différence de pression",
            elec: "tension",
            unit: "volt",
            at: cues.s(5, 5.4),
            c: COLORS.warm,
          },
        ].map((r) => (
          <FadeIn key={r.elec} start={r.at} style={{ marginBottom: 60 }}>
            <div style={{ ...textStyle(30, 300), color: COLORS.inkSoft }}>
              {r.water}
            </div>
            <div style={{ ...textStyle(40, 300), color: r.c, marginTop: 6 }}>
              ↔ {r.elec}{" "}
              <span style={{ ...textStyle(26, 300), color: COLORS.inkSoft }}>
                ({r.unit})
              </span>
            </div>
          </FadeIn>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// La limite de l'analogie : les électrons circulent en boucle, l'énergie sort en chaleur.
const Loop: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(5);
  const x0 = 360;
  const x1 = 1100;
  const y0 = 260;
  const y1 = 600;
  const W = x1 - x0;
  const H = y1 - y0;
  const P = 2 * (W + H);
  const at = (s: number): [number, number] => {
    s = ((s % P) + P) % P;
    if (s < W) return [x0 + s, y0];
    if (s < W + H) return [x1, y0 + (s - W)];
    if (s < 2 * W + H) return [x1 - (s - W - H), y1];
    return [x0, y1 - (s - 2 * W - H)];
  };
  const on = progress(frame, t + 24, 0.6);
  const heat = progress(frame, cues.s(7), 0.8);
  const chipY = (y0 + y1) / 2;
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={`M ${x0} ${chipY - 12} V ${y0} H ${x1} V ${chipY - 60} M ${x1} ${chipY + 60} V ${y1} H ${x0} V ${chipY + 12}`}
          start={t}
          duration={1.2}
          stroke={COLORS.inkSoft}
          width={1.6}
        />
        {/* Source d'énergie (pile) sur le côté gauche */}
        <DrawPath
          d={`M ${x0 - 34} ${chipY - 12} H ${x0 + 34} M ${x0 - 18} ${chipY + 12} H ${x0 + 18}`}
          start={t + 10}
          duration={0.5}
          stroke={COLORS.ink}
          width={3}
        />
        <Caps x={x0 - 60} y={chipY} text="source" start={t + 14} anchor="end" />
        {/* La puce sur le côté droit */}
        <DrawPath
          d={roundRectPath(x1 - 60, chipY - 60, 120, 120, 8)}
          start={t + 12}
          duration={0.6}
          stroke={COLORS.accent}
        />
        <SvgText
          x={x1}
          y={chipY}
          text="puce"
          start={t + 16}
          size={26}
          color={COLORS.accent}
        />
        {/* Électrons qui circulent en boucle */}
        {new Array(22).fill(0).map((_, i) => {
          const [x, y] = at(i * (P / 22) + (frame - t) * 2.2);
          const inside =
            (Math.abs(x - x1) < 60 && Math.abs(y - chipY) < 60) ||
            (Math.abs(x - x0) < 40 && Math.abs(y - chipY) < 40);
          return <Electron key={i} x={x} y={y} r={6} o={inside ? 0 : on} />;
        })}
        {/* Chaleur */}
        {[0, 1, 2].map((k) => {
          const rise = ((frame / 40 + k / 3) % 1) * 12;
          return (
            <path
              key={k}
              d={`M ${x1 + 90} ${chipY - 40 + k * 40 - rise} q 16 -8 32 0 t 32 0 t 32 0`}
              fill="none"
              stroke={COLORS.warm}
              strokeWidth={2.2}
              opacity={heat * (0.5 + 0.5 * Math.sin(frame / 8 + k))}
            />
          );
        })}
        <SvgText
          x={x1 + 140}
          y={chipY + 100}
          text="chaleur"
          start={cues.s(7, 0.4)}
          size={28}
          color={COLORS.warm}
        />
        {/* Énergie : de la source vers la puce */}
        <Arrow
          x1={x0 + 60}
          y1={chipY}
          x2={x1 - 80}
          y2={chipY}
          start={cues.s(7)}
          stroke={COLORS.warm}
          width={2.5}
        />
        <SvgText
          x={(x0 + x1) / 2}
          y={chipY - 30}
          text="énergie"
          start={cues.s(7, 0.2)}
          size={28}
          color={COLORS.warm}
        />
        <SvgText
          x={(x0 + x1) / 2}
          y={y0 - 34}
          text="les électrons circulent en boucle"
          start={t + 30}
          size={26}
          color={COLORS.accent}
        />
      </Svg>
      <Note kind="warn" x={1420} y={250} width={380} start={t + 6} size={28}>
        L’image a une limite : les électrons ne sont pas consommés dans la puce.
      </Note>
      <Note kind="keep" x={360} y={690} width={1200} start={cues.s(7, 1)}>
        Le circuit reçoit de l’énergie et la dissipe surtout sous forme de
        chaleur.
      </Note>
    </AbsoluteFill>
  );
};

// Scène 4 — Atome, électron, courant et tension.
export const S04: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill style={{ fontFamily: FONT }}>
      <Stage from={0} to={cues.beat(1)}>
        <Title
          kicker="Des charges aux bandes d’énergie"
          text="Atome, électron, courant et tension"
          start={cues.s(0)}
        />
        <Atom />
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(2)}>
        <Lattice />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(3)}>
        <Title text="Le courant" start={cues.beat(2)} />
        <Current />
      </Stage>
      <Stage from={cues.beat(3)} to={cues.beat(4)}>
        <Title text="La tension" start={cues.beat(3)} />
        <Voltage />
      </Stage>
      <Stage from={cues.beat(4)} to={cues.beat(5)}>
        <Water />
      </Stage>
      <Stage from={cues.beat(5)}>
        <Loop />
      </Stage>
    </AbsoluteFill>
  );
};
