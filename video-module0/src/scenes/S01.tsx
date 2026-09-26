import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
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
import { COLORS, FPS, HEIGHT, WIDTH } from "../theme";

const CHAIN_Y = 640;
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
      <DrawPath
        d={grid}
        start={start + 10}
        duration={0.8}
        stroke={COLORS.inkSoft}
        width={1}
      />
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
      <DrawPath
        d={`M ${x - s} ${y - s} H ${x + s} V ${y + s} H ${x - s} Z`}
        start={start}
        duration={0.6}
      />
      <DrawPath
        d={`M ${x - 20} ${y - 20} H ${x + 20} V ${y + 20} H ${x - 20} Z`}
        start={start + 8}
        duration={0.5}
        stroke={COLORS.accent}
        width={1.5}
      />
      <DrawPath
        d={pins}
        start={start + 14}
        duration={0.6}
        stroke={COLORS.inkSoft}
        width={1.5}
      />
    </g>
  );
};

const Server: React.FC<{ x: number; start: number }> = ({ x, start }) => {
  const w = 44;
  const h = 64;
  const y = CHAIN_Y;
  const slots = [-38, -14, 10, 34]
    .map((o) => `M ${x - w + 10} ${y + o} H ${x + w - 26}`)
    .join(" ");
  const frame = useCurrentFrame();
  return (
    <g>
      <DrawPath
        d={`M ${x - w} ${y - h} H ${x + w} V ${y + h} H ${x - w} Z`}
        start={start}
        duration={0.7}
      />
      <DrawPath
        d={slots}
        start={start + 10}
        duration={0.6}
        stroke={COLORS.inkSoft}
        width={1.5}
      />
      {[-38, -14, 10, 34].map((o, i) => (
        <circle
          key={o}
          cx={x + w - 14}
          cy={y + o}
          r={3}
          fill={COLORS.accent}
          opacity={
            progress(frame, start + 20 + i * 3, 0.2) *
            (0.6 + 0.4 * Math.sin(frame / 6 + i))
          }
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
      <DrawPath
        d={`M ${x + 6} ${y - h + 8} V ${y + h - 8}`}
        start={start + 12}
        duration={0.3}
        stroke={COLORS.accent}
        width={1.5}
      />
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

const Hero: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const chainStart = cues.s(1, 0.4);
  const step = 0.75 * FPS;
  const stationAt = (i: number) => chainStart + i * step;
  const travel = progress(frame, chainStart, (XS.length - 1) * 0.75 + 0.2);
  const dotX = XS[0] + (XS[XS.length - 1] - XS[0]) * travel;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 200,
          width: "100%",
          textAlign: "center",
        }}
      >
        <FadeIn start={cues.s(0)}>
          <div
            style={{
              ...textStyle(20, 400),
              color: COLORS.inkSoft,
              letterSpacing: "0.35em",
            }}
          >
            FORMATION INFRASTRUCTURE IA
          </div>
        </FadeIn>
        <FadeIn start={cues.s(0, 0.9)} style={{ marginTop: 22 }}>
          <div
            style={{
              ...textStyle(30, 400),
              color: COLORS.accent,
              letterSpacing: "0.4em",
            }}
          >
            MODULE 0
          </div>
        </FadeIn>
        <FadeIn start={cues.s(1)} style={{ marginTop: 26 }}>
          <div style={textStyle(60, 200)}>
            Comprendre toute la chaîne de l’infrastructure IA
          </div>
        </FadeIn>
        <FadeIn start={cues.s(1, 1.6)} style={{ marginTop: 16 }}>
          <div
            style={{
              ...textStyle(34, 300),
              color: COLORS.warm,
              fontStyle: "italic",
            }}
          >
            Du sable au token
          </div>
        </FadeIn>
      </div>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        {XS.slice(0, -1).map((x, i) => (
          <Arrow
            key={x}
            x1={x + 72}
            y1={CHAIN_Y}
            x2={XS[i + 1] - 72}
            y2={CHAIN_Y}
            start={stationAt(i) + 0.3 * FPS}
            duration={0.45}
          />
        ))}
        {STATIONS.map((Station, i) => (
          <Station key={i} x={XS[i]} start={stationAt(i)} />
        ))}
        {travel > 0 && travel < 1 && (
          <circle cx={dotX} cy={CHAIN_Y + 92} r={4} fill={COLORS.accent} />
        )}
      </svg>
      {LABELS.map((label, i) => (
        <FadeIn
          key={label}
          start={stationAt(i) + 0.25 * FPS}
          style={{
            position: "absolute",
            top: CHAIN_Y + 104,
            left: XS[i] - 100,
            width: 200,
            textAlign: "center",
          }}
        >
          <div
            style={{
              ...textStyle(22, 300),
              color: COLORS.inkSoft,
              letterSpacing: "0.08em",
            }}
          >
            {label}
          </div>
        </FadeIn>
      ))}
    </AbsoluteFill>
  );
};

// Cours + cahier de validation, et date des repères qui s'incrémente.
const Dated: React.FC = () => {
  const cues = useCues();
  const t = cues.s(2);
  const bookY = 420;
  const book = (x: number) =>
    `M ${x - 70} ${bookY - 50} H ${x + 70} V ${bookY + 50} H ${x - 70} Z M ${x - 44} ${bookY - 18} H ${x + 44} M ${x - 44} ${bookY + 2} H ${x + 44} M ${x - 44} ${bookY + 22} H ${x + 16}`;
  const check = `M 1040 ${bookY + 2} L 1060 ${bookY + 22} L 1100 ${bookY - 22}`;
  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        <DrawPath d={book(820)} start={t} duration={0.9} />
        <DrawPath
          d={`M 1000 ${bookY - 50} H 1140 V ${bookY + 50} H 1000 Z`}
          start={t + 12}
          duration={0.9}
        />
        <DrawPath
          d={check}
          start={t + 30}
          duration={0.5}
          stroke={COLORS.accent}
          width={3}
        />
      </svg>
      <FadeIn
        start={t + 8}
        style={{
          position: "absolute",
          top: bookY + 70,
          left: 720,
          width: 200,
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(22, 300),
            color: COLORS.inkSoft,
            letterSpacing: "0.1em",
          }}
        >
          COURS
        </div>
      </FadeIn>
      <FadeIn
        start={t + 20}
        style={{
          position: "absolute",
          top: bookY + 70,
          left: 920,
          width: 300,
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(22, 300),
            color: COLORS.inkSoft,
            letterSpacing: "0.1em",
          }}
        >
          CAHIER DE VALIDATION
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(2, 2.4)}
        style={{
          position: "absolute",
          top: 640,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(20, 400),
            color: COLORS.inkSoft,
            letterSpacing: "0.3em",
          }}
        >
          REPÈRES INDUSTRIELS ARRÊTÉS AU
        </div>
        <div style={{ ...textStyle(64, 200), marginTop: 14 }}>
          <Counter from={1} to={11} start={cues.s(2, 2.6)} duration={1.4} />{" "}
          septembre{" "}
          <Counter
            from={2016}
            to={2026}
            start={cues.s(2, 2.6)}
            duration={1.8}
            style={{ color: COLORS.warm }}
          />
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const GOALS = [
  "Situer une entreprise dans la chaîne",
  "Expliquer son utilité",
  "Identifier ce qui pourrait limiter la production d’IA",
];
const GOAL_XS = [520, 960, 1400];
const GOAL_Y = 600;

const goalIcon = (i: number, x: number) => {
  const y = GOAL_Y;
  if (i === 0) {
    // une chaîne de maillons, l'un d'eux repéré
    return [
      `M ${x - 70} ${y} H ${x + 70}`,
      ...[-60, -20, 20, 60].map(
        (o) =>
          `M ${x + o - 6} ${y} A 6 6 0 1 0 ${x + o + 6} ${y} A 6 6 0 1 0 ${x + o - 6} ${y}`,
      ),
      `M ${x + 2} ${y} A 18 18 0 1 0 ${x + 38} ${y} A 18 18 0 1 0 ${x + 2} ${y}`,
    ].join(" ");
  }
  if (i === 1) {
    // une bulle d'explication
    return `M ${x - 56} ${y - 36} H ${x + 56} V ${y + 24} H ${x - 8} L ${x - 26} ${y + 44} V ${y + 24} H ${x - 56} Z M ${x - 34} ${y - 12} H ${x + 34} M ${x - 34} ${y + 6} H ${x + 14}`;
  }
  // un goulot d'étranglement
  return `M ${x - 60} ${y - 40} H ${x - 14} C ${x - 6} ${y - 40} ${x - 6} ${y - 10} ${x - 2} ${y - 10} H ${x + 2} C ${x + 6} ${y - 10} ${x + 6} ${y - 40} ${x + 14} ${y - 40} H ${x + 60} M ${x - 60} ${y + 40} H ${x - 14} C ${x - 6} ${y + 40} ${x - 6} ${y + 10} ${x - 2} ${y + 10} H ${x + 2} C ${x + 6} ${y + 10} ${x + 6} ${y + 40} ${x + 14} ${y + 40} H ${x + 60}`;
};

const Goals: React.FC = () => {
  const cues = useCues();
  const goalAt = (i: number) => cues.s(4, 0.9 + i * 1.5);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 210,
          width: "100%",
          textAlign: "center",
        }}
      >
        <FadeIn start={cues.s(3)}>
          <div
            style={{
              ...textStyle(20, 400),
              color: COLORS.accent,
              letterSpacing: "0.3em",
            }}
          >
            LE BUT DE CE PREMIER MODULE
          </div>
        </FadeIn>
        <FadeIn start={cues.s(3, 0.5)} style={{ marginTop: 24 }}>
          <div style={textStyle(52, 200)}>
            Comprendre la machine entière
            <br />
            <span style={{ color: COLORS.inkSoft }}>
              avant d’en démonter chaque pièce
            </span>
          </div>
        </FadeIn>
      </div>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        {GOAL_XS.map((x, i) => (
          <DrawPath
            key={x}
            d={goalIcon(i, x)}
            start={goalAt(i)}
            duration={0.9}
            stroke={i === 2 ? COLORS.warm : COLORS.ink}
          />
        ))}
      </svg>
      {GOALS.map((g, i) => (
        <FadeIn
          key={g}
          start={goalAt(i) + 8}
          style={{
            position: "absolute",
            top: GOAL_Y + 80,
            left: GOAL_XS[i] - 210,
            width: 420,
            textAlign: "center",
          }}
        >
          <div
            style={{
              ...textStyle(18, 400),
              color: COLORS.accent,
              letterSpacing: "0.2em",
            }}
          >
            0{i + 1}
          </div>
          <div
            style={{ ...textStyle(26, 300), marginTop: 10, lineHeight: 1.3 }}
          >
            {g}
          </div>
        </FadeIn>
      ))}
    </AbsoluteFill>
  );
};

// Les cinq fonctions interdépendantes, reliées deux à deux.
const FUNCTIONS = [
  "Calculer",
  "Mémoriser",
  "Communiquer",
  "Alimenter",
  "Refroidir",
];
const CX = 960;
const CY = 510;
const RADIUS = 250;
const NODE_R = 58;
const nodePos = (i: number) => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
  return { x: CX + RADIUS * Math.cos(a), y: CY + RADIUS * Math.sin(a) };
};

const functionIcon = (i: number, x: number, y: number) => {
  switch (i) {
    case 0: // puce
      return `M ${x - 22} ${y - 22} H ${x + 22} V ${y + 22} H ${x - 22} Z M ${x - 10} ${y - 10} H ${x + 10} V ${y + 10} H ${x - 10} Z M ${x - 10} ${y - 22} V ${y - 30} M ${x + 10} ${y - 22} V ${y - 30} M ${x - 10} ${y + 22} V ${y + 30} M ${x + 10} ${y + 22} V ${y + 30}`;
    case 1: // empilement mémoire
      return (
        [-18, -6, 6, 18]
          .map((o) => `M ${x - 26} ${y + o} H ${x + 26}`)
          .join(" ") +
        ` M ${x - 26} ${y - 24} H ${x + 26} V ${y + 24} H ${x - 26} Z`
      );
    case 2: // échange
      return `M ${x - 28} ${y - 8} H ${x + 24} M ${x + 14} ${y - 18} L ${x + 26} ${y - 8} L ${x + 14} ${y + 2} M ${x + 28} ${y + 10} H ${x - 24} M ${x - 14} ${y} L ${x - 26} ${y + 10} L ${x - 14} ${y + 20}`;
    case 3: // éclair
      return `M ${x + 6} ${y - 30} L ${x - 14} ${y + 4} H ${x + 2} L ${x - 6} ${y + 30} L ${x + 16} ${y - 6} H ${x} Z`;
    default: // flocon
      return [0, 60, 120]
        .map((deg) => {
          const a = (deg * Math.PI) / 180;
          return `M ${x - 28 * Math.cos(a)} ${y - 28 * Math.sin(a)} L ${x + 28 * Math.cos(a)} ${y + 28 * Math.sin(a)}`;
        })
        .join(" ");
  }
};

const Functions: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  // Les cinq nœuds apparaissent au rythme de l'énumération.
  const nodeAt = (i: number) => cues.s(5, 2.9 + i * 0.75);
  const linksAt = nodeAt(4) + 0.6 * FPS;
  // Phrase suivante : on ajoute du calcul, mais la mémoire fait attendre.
  const squeeze = cues.s(6);
  const pulse = progress(frame, squeeze + 0.8 * FPS, 0.6);
  const links: string[] = [];
  for (let i = 0; i < 5; i++) {
    for (let j = i + 1; j < 5; j++) {
      const a = nodePos(i);
      const b = nodePos(j);
      const d = Math.hypot(b.x - a.x, b.y - a.y);
      const ux = (b.x - a.x) / d;
      const uy = (b.y - a.y) / d;
      links.push(
        `M ${a.x + ux * (NODE_R + 8)} ${a.y + uy * (NODE_R + 8)} L ${b.x - ux * (NODE_R + 8)} ${b.y - uy * (NODE_R + 8)}`,
      );
    }
  }
  return (
    <AbsoluteFill>
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        <DrawPath
          d={links.join(" ")}
          start={linksAt}
          duration={1.4}
          stroke={COLORS.inkFaint}
          width={1.2}
        />
        {FUNCTIONS.map((f, i) => {
          const { x, y } = nodePos(i);
          const bottleneck = i === 1;
          const stroke = bottleneck && pulse > 0 ? COLORS.warm : COLORS.ink;
          return (
            <g key={f}>
              <DrawPath
                d={circle(x, y, NODE_R)}
                start={nodeAt(i)}
                duration={0.6}
                stroke={stroke}
                width={bottleneck ? 2 + pulse : 2}
              />
              <DrawPath
                d={functionIcon(i, x, y)}
                start={nodeAt(i) + 8}
                duration={0.6}
                stroke={i === 0 ? COLORS.accent : stroke}
                width={1.8}
              />
              {bottleneck && pulse > 0 && (
                <circle
                  cx={x}
                  cy={y}
                  r={NODE_R + 10 + 14 * pulse}
                  fill="none"
                  stroke={COLORS.warm}
                  opacity={0.5 * (1 - pulse)}
                />
              )}
            </g>
          );
        })}
        {/* On ajoute des processeurs : de nouvelles puces apparaissent autour de « Calculer ». */}
        {[-1, 1].map((side, k) => {
          const { x, y } = nodePos(0);
          const px = x + side * 118;
          return (
            <DrawPath
              key={side}
              d={`M ${px - 16} ${y - 16} H ${px + 16} V ${y + 16} H ${px - 16} Z M ${px - 7} ${y - 7} H ${px + 7} V ${y + 7} H ${px - 7} Z`}
              start={squeeze + k * 6}
              duration={0.5}
              stroke={COLORS.accent}
              width={1.5}
            />
          );
        })}
      </svg>
      {FUNCTIONS.map((f, i) => {
        const { x, y } = nodePos(i);
        const below = y > CY;
        return (
          <FadeIn
            key={f}
            start={nodeAt(i) + 6}
            style={{
              position: "absolute",
              top: below ? y + NODE_R + 14 : y - NODE_R - 44,
              left: x - 120,
              width: 240,
              textAlign: "center",
            }}
          >
            <div
              style={{
                ...textStyle(24, 300),
                color:
                  i === 1 && frame >= squeeze + 0.8 * FPS
                    ? COLORS.warm
                    : COLORS.ink,
              }}
            >
              {f}
            </div>
          </FadeIn>
        );
      })}
    </AbsoluteFill>
  );
};

// Scène 1 — Ouverture : titre, cadre du cours, but du module, cinq fonctions.
export const S01: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(2)}>
        <Hero />
      </Stage>
      <Stage from={cues.s(2)} to={cues.s(3)}>
        <Dated />
      </Stage>
      <Stage from={cues.s(3)} to={cues.s(5)}>
        <Goals />
      </Stage>
      <Stage from={cues.s(5)}>
        <Functions />
      </Stage>
    </AbsoluteFill>
  );
};
