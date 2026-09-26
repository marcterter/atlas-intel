import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { Arrow, Counter, DrawPath, FadeIn, progress, textStyle, useCues } from "../components/motion";
import { COLORS, FPS, HEIGHT, WIDTH } from "../theme";

const CHAIN_Y = 610;
const XS = [400, 680, 960, 1240, 1520];
const LABELS = ["Sable", "Wafer", "Puce", "Serveur", "Token"];

const circle = (cx: number, cy: number, r: number) =>
  `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy}`;

const Sand: React.FC<{ x: number; start: number }> = ({ x, start }) => {
  const frame = useCurrentFrame();
  return (
    <g>
      {new Array(18).fill(0).map((_, i) => {
        const a = random(`sa${i}`) * Math.PI * 2;
        const d = Math.sqrt(random(`sd${i}`)) * 42;
        const p = progress(frame, start + i * 1.2, 0.4);
        return (
          <circle
            key={i}
            cx={x + Math.cos(a) * d}
            cy={CHAIN_Y + Math.sin(a) * d * 0.8 + (1 - p) * 10}
            r={2 + random(`sr${i}`) * 2.2}
            fill={COLORS.warm}
            opacity={p * 0.85}
          />
        );
      })}
    </g>
  );
};

const Wafer: React.FC<{ x: number; start: number }> = ({ x, start }) => {
  const r = 58;
  const grid = [-36, -12, 12, 36]
    .map((o) => {
      const h = Math.sqrt(r * r - o * o) - 6;
      return `M ${x + o} ${CHAIN_Y - h} L ${x + o} ${CHAIN_Y + h} M ${x - h} ${CHAIN_Y + o} L ${x + h} ${CHAIN_Y + o}`;
    })
    .join(" ");
  return (
    <g>
      <DrawPath d={circle(x, CHAIN_Y, r)} start={start} duration={0.7} />
      <DrawPath d={grid} start={start + 10} duration={0.8} stroke={COLORS.inkSoft} width={1} />
    </g>
  );
};

const Die: React.FC<{ x: number; start: number }> = ({ x, start }) => {
  const s = 42;
  const y = CHAIN_Y;
  const pins = [-24, -8, 8, 24]
    .map(
      (o) =>
        `M ${x + o} ${y - s} L ${x + o} ${y - s - 12} M ${x + o} ${y + s} L ${x + o} ${y + s + 12} ` +
        `M ${x - s} ${y + o} L ${x - s - 12} ${y + o} M ${x + s} ${y + o} L ${x + s + 12} ${y + o}`,
    )
    .join(" ");
  return (
    <g>
      <DrawPath d={`M ${x - s} ${y - s} H ${x + s} V ${y + s} H ${x - s} Z`} start={start} duration={0.6} />
      <DrawPath
        d={`M ${x - 20} ${y - 20} H ${x + 20} V ${y + 20} H ${x - 20} Z`}
        start={start + 8}
        duration={0.5}
        stroke={COLORS.accent}
        width={1.5}
      />
      <DrawPath d={pins} start={start + 14} duration={0.6} stroke={COLORS.inkSoft} width={1.5} />
    </g>
  );
};

const Server: React.FC<{ x: number; start: number }> = ({ x, start }) => {
  const w = 44;
  const h = 64;
  const y = CHAIN_Y;
  const slots = [-38, -14, 10, 34].map((o) => `M ${x - w + 10} ${y + o} H ${x + w - 26}`).join(" ");
  const frame = useCurrentFrame();
  return (
    <g>
      <DrawPath d={`M ${x - w} ${y - h} H ${x + w} V ${y + h} H ${x - w} Z`} start={start} duration={0.7} />
      <DrawPath d={slots} start={start + 10} duration={0.6} stroke={COLORS.inkSoft} width={1.5} />
      {[-38, -14, 10, 34].map((o, i) => (
        <circle
          key={o}
          cx={x + w - 14}
          cy={y + o}
          r={3}
          fill={COLORS.accent}
          opacity={progress(frame, start + 20 + i * 3, 0.2) * (0.6 + 0.4 * Math.sin(frame / 6 + i))}
        />
      ))}
    </g>
  );
};

const Token: React.FC<{ x: number; start: number }> = ({ x, start }) => {
  const w = 62;
  const h = 26;
  const y = CHAIN_Y;
  const pill = `M ${x - w + h} ${y - h} H ${x + w - h} A ${h} ${h} 0 0 1 ${x + w - h} ${y + h} H ${x - w + h} A ${h} ${h} 0 0 1 ${x - w + h} ${y - h} Z`;
  return (
    <g>
      <DrawPath d={pill} start={start} duration={0.7} stroke={COLORS.accent} />
      <DrawPath d={`M ${x + 6} ${y - h + 8} V ${y + h - 8}`} start={start + 12} duration={0.3} stroke={COLORS.accent} width={1.5} />
      <DrawPath
        d={`M ${x - 36} ${y} H ${x - 8} M ${x + 18} ${y} H ${x + 38}`}
        start={start + 16}
        duration={0.4}
        stroke={COLORS.ink}
        width={3}
      />
    </g>
  );
};

const STATIONS = [Sand, Wafer, Die, Server, Token];

// Scène 1 : titre du module et chaîne « du sable au token ».
export const TitleChain: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const chainStart = cues.at(2);
  const step = 0.9 * FPS;
  const stationAt = (i: number) => chainStart + i * step;

  // Point lumineux qui parcourt la chaîne à mesure qu'elle se construit.
  const travel = progress(frame, chainStart, (XS.length - 1) * 0.9 + 0.2);
  const dotX = XS[0] + (XS[XS.length - 1] - XS[0]) * travel;

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 190, width: "100%", textAlign: "center" }}>
        <FadeIn start={cues.at(0)}>
          <div style={{ ...textStyle(22, 400), color: COLORS.accent, letterSpacing: "0.4em" }}>
            MODULE 0
          </div>
        </FadeIn>
        <FadeIn start={cues.at(1)} style={{ marginTop: 26 }}>
          <div style={textStyle(62, 200)}>Comprendre toute la chaîne de l’infrastructure IA</div>
        </FadeIn>
        <FadeIn start={cues.at(2)} style={{ marginTop: 18 }}>
          <div style={{ ...textStyle(34, 300), color: COLORS.warm, fontStyle: "italic" }}>
            Du sable au token
          </div>
        </FadeIn>
      </div>

      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        <DrawPath d={`M 760 440 H 1160`} start={cues.at(1, 0.6)} duration={1.2} stroke={COLORS.inkFaint} width={1} />
        {XS.slice(0, -1).map((x, i) => (
          <Arrow
            key={x}
            x1={x + 72}
            y1={CHAIN_Y}
            x2={XS[i + 1] - 72}
            y2={CHAIN_Y}
            start={stationAt(i) + 0.35 * FPS}
            duration={0.5}
          />
        ))}
        {STATIONS.map((Station, i) => (
          <Station key={i} x={XS[i]} start={stationAt(i)} />
        ))}
        {travel > 0 && travel < 1 && (
          <circle cx={dotX} cy={CHAIN_Y + 92} r={4} fill={COLORS.accent} opacity={0.9} />
        )}
      </svg>

      {LABELS.map((label, i) => (
        <FadeIn
          key={label}
          start={stationAt(i) + 0.3 * FPS}
          style={{
            position: "absolute",
            top: CHAIN_Y + 104,
            left: XS[i] - 100,
            width: 200,
            textAlign: "center",
          }}
        >
          <div style={{ ...textStyle(22, 300), color: COLORS.inkSoft, letterSpacing: "0.08em" }}>
            {label}
          </div>
        </FadeIn>
      ))}

      <div style={{ position: "absolute", top: 820, width: "100%", textAlign: "center" }}>
        <FadeIn start={cues.at(3)}>
          <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft, letterSpacing: "0.12em" }}>
            COURS <span style={{ color: COLORS.accent, margin: "0 18px" }}>+</span> CAHIER DE VALIDATION
          </div>
        </FadeIn>
        <FadeIn start={cues.at(4)} style={{ marginTop: 14 }}>
          <div style={{ ...textStyle(22, 300), color: COLORS.inkSoft }}>
            Repères industriels arrêtés au{" "}
            <Counter from={1} to={11} start={cues.at(4, 0.3)} duration={1.4} style={{ color: COLORS.ink }} />
            {" septembre "}
            <Counter from={2016} to={2026} start={cues.at(4, 0.3)} duration={1.8} style={{ color: COLORS.ink }} />
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};
