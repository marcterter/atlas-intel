import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { icons } from "../components/icons";
import { Callout, Svg, SvgText, Title } from "../components/kit";
import {
  Counter,
  DrawPath,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT, FPS } from "../theme";
import { Pill, SvgCaps, TextAt, accentA, caps, clockPath, warmA } from "./S23";

// Coupe simplifiée d'un transistor, à l'échelle k, posée sur la ligne y.
const Transistor: React.FC<{
  cx: number;
  y: number;
  k: number;
  start: number;
  color?: string;
}> = ({ cx, y, k, start, color = COLORS.ink }) => {
  const frame = useCurrentFrame();
  const o = progress(frame, start, 0.8);
  const W = 420 * k;
  const g = 160 * k;
  return (
    <g opacity={o}>
      <rect
        x={cx - W / 2}
        y={y}
        width={W}
        height={150 * k}
        rx={6}
        fill="none"
        stroke={COLORS.inkSoft}
        strokeWidth={1.4}
      />
      <rect
        x={cx - W / 2 + 14 * k}
        y={y}
        width={W / 2 - g / 2 - 14 * k}
        height={50 * k}
        rx={6}
        fill={accentA(0.2)}
        stroke={COLORS.accent}
        strokeWidth={1.4}
      />
      <rect
        x={cx + g / 2}
        y={y}
        width={W / 2 - g / 2 - 14 * k}
        height={50 * k}
        rx={6}
        fill={accentA(0.2)}
        stroke={COLORS.accent}
        strokeWidth={1.4}
      />
      <rect
        x={cx - g / 2}
        y={y - 10 * k}
        width={g}
        height={8 * k}
        fill="rgba(232, 240, 255, 0.4)"
      />
      <rect
        x={cx - g / 2}
        y={y - 80 * k}
        width={g}
        height={68 * k}
        rx={4}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
      />
      <path
        d={`M ${cx - g / 2} ${y + 170 * k} H ${cx + g / 2} M ${cx - g / 2} ${y + 160 * k} V ${y + 180 * k} M ${cx + g / 2} ${y + 160 * k} V ${y + 180 * k}`}
        stroke={COLORS.warm}
        strokeWidth={1.6}
      />
    </g>
  );
};

// --- 1. L'intuition : champ constant.
const Intuition: React.FC = () => {
  const cues = useCues();
  const t = cues.s(1);
  const small = t + FPS * 2.6;
  const s2 = cues.s(2);
  const s3 = cues.s(3);
  return (
    <AbsoluteFill>
      <Title
        kicker="Moore et Dennard"
        text="L’intuition du modèle de Dennard"
        start={cues.s(0)}
      />
      <Svg>
        <Transistor cx={520} y={470} k={1} start={t} />
        <SvgText
          x={520}
          y={470 + 208}
          text="L"
          start={t + 10}
          size={28}
          color={COLORS.warm}
        />
        <SvgText
          x={520}
          y={425}
          text="V"
          start={t + 10}
          size={30}
          color={COLORS.ink}
        />
        <Transistor
          cx={1300}
          y={500}
          k={0.7}
          start={small}
          color={COLORS.accent}
        />
        <SvgText
          x={1300}
          y={500 + 146}
          text="0,7 L"
          start={small + 10}
          size={26}
          color={COLORS.warm}
        />
        <SvgText
          x={1300}
          y={469}
          text="0,7 V"
          start={small + 10}
          size={24}
          color={COLORS.accent}
        />
        <DrawPath
          d="M 800 520 H 1080"
          start={small - 10}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <DrawPath
          d="M 1066 510 L 1080 520 L 1066 530"
          start={small + 12}
          duration={0.3}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={940}
          y={495}
          text="× 0,7 partout"
          start={small}
          size={24}
          color={COLORS.inkSoft}
        />
        <SvgCaps x={520} y={290} text="avant" start={t} />
        <SvgCaps
          x={1300}
          y={290}
          text="après"
          start={small}
          color={COLORS.accent}
        />
      </Svg>
      <Stage from={t} to={s2}>
        <TextAt x={960} y={740} w={1500} start={t + FPS * 4.2} align="center">
          <div style={textStyle(36, 200)}>
            champ électrique E = V / L ={" "}
            <span style={{ color: COLORS.accent }}>0,7 V / 0,7 L</span> :{" "}
            <span style={{ color: COLORS.accent }}>inchangé</span>
          </div>
          <div
            style={{
              ...textStyle(24, 300),
              color: COLORS.inkSoft,
              marginTop: 8,
            }}
          >
            modèle idéal à champ constant : dimensions et tensions réduites
            ensemble
          </div>
        </TextAt>
      </Stage>
      <Stage from={s2}>
        <TextAt x={960} y={730} w={1500} start={s2} align="center">
          <div style={{ ...textStyle(30, 300) }}>
            <span style={{ color: COLORS.accent }}>moins de surface</span> ·{" "}
            <span style={{ color: COLORS.accent }}>
              moins de charge à déplacer
            </span>{" "}
            · <span style={{ color: COLORS.accent }}>commute plus vite</span>
          </div>
        </TextAt>
        <TextAt x={960} y={790} w={1500} start={s3} align="center">
          <div style={{ ...textStyle(30, 300) }}>
            → on en place davantage,{" "}
            <span style={{ color: COLORS.warm }}>
              sans augmenter la puissance par unité de surface
            </span>
          </div>
        </TextAt>
      </Stage>
    </AbsoluteFill>
  );
};

// --- 2. L'article de 1974 : un modèle idéal.
const Paper: React.FC = () => {
  const cues = useCues();
  const t = cues.s(4);
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={icons.book(960, 250, 50)}
          start={t}
          stroke={COLORS.accent}
        />
      </Svg>
      <TextAt x={960} y={330} w={1400} start={t + 8} align="center">
        <div style={textStyle(52, 200)}>
          Dennard et coauteurs,{" "}
          <span style={{ color: COLORS.accent }}>1974</span>
        </div>
        <div
          style={{
            ...textStyle(30, 300),
            color: COLORS.inkSoft,
            marginTop: 12,
          }}
        >
          l’article fondateur sur les relations de miniaturisation des MOSFET
        </div>
      </TextAt>
      <Callout kind="warn" start={cues.s(5)} y={500} width={1300}>
        Le tableau qui suit illustre ce{" "}
        <span style={{ color: COLORS.warm }}>modèle idéal</span> : ce n’est pas
        une prévision pour les procédés modernes.
      </Callout>
      <Pill text="Source 9" start={cues.s(6)} x={1610} y={790} tone="ink" />
    </AbsoluteFill>
  );
};

// --- 3. Le tableau de Dennard, ligne par ligne.
type Row = {
  name: string;
  to: number;
  dec: number;
  why: string;
  at: number;
  hi?: boolean;
};

const Table: React.FC<{ rows: Row[] }> = ({ rows }) => {
  const frame = useCurrentFrame();
  const cues = useCues();
  const x0 = 800;
  const y0 = 250;
  const rh = 68;
  const current = rows.reduce((a, r, i) => (frame >= r.at ? i : a), -1);
  return (
    <AbsoluteFill>
      <TextAt x={x0} y={170} w={980} start={cues.s(7)}>
        <div style={caps(COLORS.accent)}>
          SI LA DIMENSION LINÉAIRE EST MULTIPLIÉE PAR 0,7
        </div>
      </TextAt>
      <Svg>
        {rows.map((r, i) => (
          <path
            key={i}
            d={`M ${x0} ${y0 + (i + 1) * rh - 6} H 1780`}
            stroke={COLORS.inkFaint}
            strokeWidth={1}
            opacity={progress(frame, r.at, 0.5)}
          />
        ))}
        {current >= 0 && (
          <rect
            x={x0 - 16}
            y={y0 + current * rh - 4}
            width={4}
            height={rh - 10}
            fill={rows[current].hi ? COLORS.warm : COLORS.accent}
          />
        )}
      </Svg>
      {rows.map((r, i) => {
        const o = progress(frame, r.at, 0.5);
        const active = i === current;
        return (
          <div
            key={r.name}
            style={{
              position: "absolute",
              left: x0,
              top: y0 + i * rh,
              width: 980,
              height: rh - 8,
              display: "flex",
              alignItems: "center",
              opacity: o * (active ? 1 : 0.6),
            }}
          >
            <div
              style={{
                ...textStyle(28, active ? 400 : 300),
                width: 470,
                color: r.hi ? COLORS.warm : COLORS.ink,
              }}
            >
              {r.name}
            </div>
            <div
              style={{
                ...textStyle(40, 200),
                width: 180,
                color: r.hi ? COLORS.warm : COLORS.accent,
              }}
            >
              {r.hi ? (
                "≈ × 1"
              ) : (
                <>
                  ×{" "}
                  <Counter
                    from={1}
                    to={r.to}
                    decimals={r.dec}
                    start={r.at}
                    duration={1.2}
                  />
                </>
              )}
            </div>
            <div
              style={{
                ...textStyle(24, 300),
                color: COLORS.inkSoft,
                width: 330,
              }}
            >
              {r.why}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Petites barres verticales comparatives (avant = 1).
const Bars: React.FC<{
  items: { label: string; v: number; at: number; color?: string }[];
}> = ({ items }) => {
  const frame = useCurrentFrame();
  const base = 700;
  const H = 300;
  return (
    <Svg>
      {items.map((it, i) => {
        const x = 200 + i * 140;
        const p = progress(frame, it.at, 1.2);
        const v = 1 + (it.v - 1) * p;
        const o = progress(frame, it.at - 8, 0.4);
        return (
          <g key={it.label} opacity={o}>
            <rect
              x={x}
              y={base - H}
              width={70}
              height={H}
              fill="none"
              stroke={COLORS.inkFaint}
              strokeDasharray="5 6"
            />
            <rect
              x={x}
              y={base - H * v}
              width={70}
              height={H * v}
              fill={accentA(0.25)}
              stroke={it.color ?? COLORS.accent}
              strokeWidth={1.6}
            />
            <text
              x={x + 35}
              y={base + 36}
              textAnchor="middle"
              fontFamily={FONT}
              fontSize={24}
              fill={COLORS.ink}
            >
              {it.label}
            </text>
            <text
              x={x + 35}
              y={base - H * v - 14}
              textAnchor="middle"
              fontFamily={FONT}
              fontSize={24}
              fill={it.color ?? COLORS.accent}
            >
              {v.toFixed(2).replace(".", ",")}
            </text>
          </g>
        );
      })}
    </Svg>
  );
};

// Carré de transistors (n × n) dans une zone fixe.
const Grid: React.FC<{
  x: number;
  y: number;
  size: number;
  n: number;
  start: number;
  heat?: number;
  color?: string;
}> = ({ x, y, size, n, start, heat = 0, color = COLORS.accent }) => {
  const frame = useCurrentFrame();
  const pitch = size / n;
  const cell = pitch * 0.62;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={size}
        height={size}
        fill={warmA(0.3 * heat * progress(frame, start + 20, 0.8))}
        stroke={COLORS.inkSoft}
        strokeWidth={1.4}
        opacity={progress(frame, start - 6, 0.5)}
      />
      {new Array(n * n).fill(0).map((_, i) => (
        <rect
          key={i}
          x={x + (i % n) * pitch + (pitch - cell) / 2}
          y={y + Math.floor(i / n) * pitch + (pitch - cell) / 2}
          width={cell}
          height={cell}
          rx={2}
          fill={
            color === COLORS.accent
              ? accentA(0.45)
              : "rgba(232, 240, 255, 0.35)"
          }
          opacity={progress(frame, start + i * 0.6, 0.3)}
        />
      ))}
    </g>
  );
};

const LeftPanel: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const b3 = cues.beat(3);
  const b4 = cues.beat(4);
  const b5 = cues.beat(5);
  const b6 = cues.beat(6);
  const b7 = cues.beat(7);
  const b8 = cues.beat(8);
  const s7 = cues.s(7, 2.4);
  const side = interpolate(frame, [s7, s7 + 1.4 * FPS], [300, 210], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      {/* Surface ×0,49 */}
      <Stage from={b3} to={b4}>
        <Svg>
          <rect
            x={220}
            y={330}
            width={300}
            height={300}
            fill="none"
            stroke={COLORS.inkSoft}
            strokeWidth={1.4}
            strokeDasharray="6 6"
          />
          <rect
            x={220}
            y={630 - side}
            width={side}
            height={side}
            fill={accentA(0.22)}
            stroke={COLORS.accent}
            strokeWidth={1.8}
          />
          <SvgText
            x={370}
            y={660}
            text="côté : 1 → 0,7"
            start={b3 + 10}
            size={24}
            color={COLORS.ink}
          />
          <SvgText
            x={370}
            y={700}
            text="surface : 0,7 × 0,7 = 0,49"
            start={s7 + FPS * 1.4}
            size={24}
            color={COLORS.accent}
          />
        </Svg>
      </Stage>
      {/* Densité ×2 */}
      <Stage from={b4} to={b5}>
        <Svg>
          <Grid
            x={170}
            y={300}
            size={260}
            n={5}
            start={b4}
            color={COLORS.ink}
          />
          <Grid x={470} y={300} size={260} n={7} start={b4 + FPS * 1.4} />
          <SvgText x={300} y={600} text="25" start={b4 + 10} size={30} />
          <SvgText
            x={600}
            y={600}
            text="49"
            start={b4 + FPS * 2.4}
            size={30}
            color={COLORS.accent}
          />
          <SvgText
            x={450}
            y={660}
            text="même surface : ≈ 2 fois plus"
            start={b4 + FPS * 3}
            size={24}
            color={COLORS.inkSoft}
          />
          <SvgText
            x={450}
            y={700}
            text="1 / 0,49 ≈ 2,04"
            start={b4 + FPS * 3.4}
            size={24}
            color={COLORS.accent}
          />
        </Svg>
      </Stage>
      {/* V, C, charge, délai */}
      <Stage from={b5} to={b6}>
        <Bars
          items={[
            { label: "V", v: 0.7, at: b5 + 20 },
            { label: "C", v: 0.7, at: b5 + FPS * 2.4 },
            { label: "Q = C·V", v: 0.49, at: b5 + FPS * 4.2 },
            { label: "délai", v: 0.7, at: cues.s(10, 0.4) },
          ]}
        />
        <TextAt x={170} y={760} w={620} start={cues.s(10, 1.2)}>
          <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
            délai ∝ C·V / I ; le courant I suit aussi × 0,7
          </div>
        </TextAt>
      </Stage>
      {/* Fréquence ×1,43 */}
      <Stage from={b6} to={b7}>
        <Svg>
          <SvgCaps
            x={170}
            y={360}
            text="avant : période T"
            start={b6}
            anchor="start"
            color={COLORS.ink}
          />
          <path
            d={clockPath(170, 430, 560, 60, 160, 0)}
            fill="none"
            stroke={COLORS.ink}
            strokeWidth={1.8}
            opacity={progress(frame, b6, 0.6)}
          />
          <SvgCaps
            x={170}
            y={540}
            text="après : période 0,7 T"
            start={b6 + FPS * 1.2}
            anchor="start"
            color={COLORS.accent}
          />
          <path
            d={clockPath(170, 610, 560, 60, 112, 0)}
            fill="none"
            stroke={COLORS.accent}
            strokeWidth={1.8}
            opacity={progress(frame, b6 + FPS * 1.2, 0.6)}
          />
          <SvgText
            x={450}
            y={710}
            text="f = 1 / 0,7 ≈ 1,43"
            start={b6 + FPS * 2.4}
            size={28}
            color={COLORS.accent}
          />
        </Svg>
      </Stage>
      {/* Puissance par transistor */}
      <Stage from={b7} to={b8}>
        <TextAt x={450} y={330} w={620} start={b7} align="center">
          <div style={{ ...textStyle(30, 300) }}>P ≈ C · V² · f</div>
          <div
            style={{
              ...textStyle(34, 200),
              color: COLORS.accent,
              marginTop: 20,
            }}
          >
            0,7 × 0,49 × 1,43
          </div>
          <div
            style={{
              ...textStyle(52, 200),
              color: COLORS.accent,
              marginTop: 16,
            }}
          >
            ≈ 0,49
          </div>
          <div
            style={{
              ...textStyle(24, 300),
              color: COLORS.inkSoft,
              marginTop: 16,
            }}
          >
            puissance dynamique d’un transistor, à la nouvelle fréquence
          </div>
        </TextAt>
      </Stage>
      {/* Puissance par surface inchangée */}
      <Stage from={b8}>
        <Svg>
          <Grid
            x={170}
            y={300}
            size={260}
            n={5}
            start={b8}
            heat={1}
            color={COLORS.ink}
          />
          <Grid x={470} y={300} size={260} n={7} start={b8 + 10} heat={1} />
          <SvgText x={300} y={600} text="25 × 1" start={b8 + 20} size={28} />
          <SvgText
            x={600}
            y={600}
            text="49 × 0,49"
            start={b8 + 26}
            size={28}
            color={COLORS.accent}
          />
          <SvgText
            x={450}
            y={660}
            text="≈ 24 : même chaleur par surface"
            start={b8 + FPS * 1.6}
            size={26}
            color={COLORS.warm}
          />
        </Svg>
      </Stage>
    </AbsoluteFill>
  );
};

export const S28: React.FC = () => {
  const cues = useCues();
  const rows: Row[] = [
    {
      name: "Dimension linéaire",
      to: 0.7,
      dec: 1,
      why: "point de départ",
      at: cues.s(7),
    },
    {
      name: "Surface d’un transistor",
      to: 0.49,
      dec: 2,
      why: "0,7 × 0,7",
      at: cues.s(7, 4),
    },
    {
      name: "Densité géométrique idéale",
      to: 2.04,
      dec: 2,
      why: "1 / 0,49 (environ)",
      at: cues.s(8),
    },
    {
      name: "Tension",
      to: 0.7,
      dec: 1,
      why: "champ constant",
      at: cues.s(9, 1.4),
    },
    {
      name: "Capacité par transistor",
      to: 0.7,
      dec: 1,
      why: "surface / épaisseur",
      at: cues.s(9, 2.6),
    },
    {
      name: "Délai intrinsèque idéal",
      to: 0.7,
      dec: 1,
      why: "∝ C·V / I",
      at: cues.s(10),
    },
    {
      name: "Fréquence idéale",
      to: 1.43,
      dec: 2,
      why: "1 / 0,7 (environ)",
      at: cues.s(11),
    },
    {
      name: "Puissance dynamique / transistor",
      to: 0.49,
      dec: 2,
      why: "C·V²·f",
      at: cues.s(12),
    },
    {
      name: "Puissance par unité de surface",
      to: 1,
      dec: 0,
      why: "0,49 × 2,04 ≈ 1",
      at: cues.s(13),
      hi: true,
    },
  ];
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(2)}>
        <Intuition />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(3)}>
        <Paper />
      </Stage>
      <Stage from={cues.beat(3)}>
        <Table rows={rows} />
        <LeftPanel />
        <Pill
          text="Modèle idéal"
          start={cues.beat(3)}
          x={170}
          y={180}
          tone="warm"
          align="left"
        />
      </Stage>
    </AbsoluteFill>
  );
};
