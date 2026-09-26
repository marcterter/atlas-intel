import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { IconName, circlePath, icons } from "../components/icons";
import { SAFE, Svg, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";

export type SupplierRow = {
  term: string;
  icon: IconName;
  actors: string[];
  clients: string;
  check: string[];
};

const LIST_X = SAFE.left + 40;
const CARD_X = 700;
const labelStyle = (color: string = COLORS.inkSoft): React.CSSProperties => ({
  ...textStyle(22, 500),
  color,
  letterSpacing: "0.26em",
});

// Chaîne verticale de briques à gauche, fiche de la brique courante à droite :
// acteurs repères (pastilles), puis clients et points à examiner.
export const SupplierDeck: React.FC<{
  rows: SupplierRow[];
  starts: number[];
  clientStarts: number[];
  end: number;
  intro: number;
  top?: number;
}> = ({ rows, starts, clientStarts, end, intro, top = 250 }) => {
  const frame = useCurrentFrame();
  const appear = (i: number) => intro + i * 0.35 * FPS;
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  const step = Math.min(120, 560 / rows.length);
  const nodeY = (i: number) => top + 40 + i * step;
  // Un point lumineux descend la chaîne vers la brique courante.
  const travel =
    current <= 0
      ? 0
      : interpolate(
          frame,
          [starts[current] - 6, starts[current] + 18],
          [current - 1, current],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={`M ${LIST_X} ${nodeY(0)} V ${nodeY(rows.length - 1)}`}
          start={intro - 6}
          duration={1.2}
          stroke={COLORS.inkFaint}
          width={1.5}
        />
        {rows.map((r, i) => {
          const active = i === current;
          const color = active ? COLORS.accent : COLORS.inkSoft;
          return (
            <g key={r.term} opacity={active ? 1 : 0.7}>
              <circle
                cx={LIST_X}
                cy={nodeY(i)}
                r={30}
                fill="#0a1a3d"
                opacity={progress(frame, appear(i), 0.4)}
              />
              <DrawPath
                d={circlePath(LIST_X, nodeY(i), 30)}
                start={appear(i)}
                duration={0.6}
                stroke={color}
                width={active ? 2 : 1.4}
              />
              <DrawPath
                d={icons[r.icon](LIST_X, nodeY(i), 15)}
                start={appear(i) + 6}
                duration={0.6}
                stroke={color}
                width={1.6}
              />
            </g>
          );
        })}
        {current >= 0 && (
          <circle
            cx={LIST_X}
            cy={nodeY(0) + travel * step}
            r={36}
            fill="none"
            stroke={COLORS.accent}
            strokeWidth={1}
            opacity={0.5}
          />
        )}
        {/* Filet de séparation */}
        <DrawPath
          d={`M ${CARD_X - 60} ${top} V ${top + 560}`}
          start={intro}
          duration={1}
          stroke={COLORS.inkFaint}
          width={1}
        />
      </Svg>
      {rows.map((r, i) => (
        <div
          key={r.term}
          style={{
            position: "absolute",
            left: LIST_X + 52,
            top: nodeY(i) - 18,
            width: CARD_X - LIST_X - 130,
            ...textStyle(26, i === current ? 400 : 300),
            color: i === current ? COLORS.ink : COLORS.inkSoft,
            opacity:
              progress(frame, starts[i], 0.5) * (i === current ? 1 : 0.6),
            whiteSpace: "nowrap",
          }}
        >
          {r.term}
        </div>
      ))}
      {rows.map((r, i) => {
        const from = starts[i];
        const to = i < rows.length - 1 ? starts[i + 1] : end + 60;
        if (frame < from - 2 || frame > to) return null;
        const fade = interpolate(frame, [to - 8, to], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const c = clientStarts[i];
        return (
          <div
            key={r.term}
            style={{
              position: "absolute",
              left: CARD_X,
              top,
              width: SAFE.right - CARD_X,
              opacity: fade,
            }}
          >
            <Svg>
              <DrawPath
                d={circlePath(SAFE.right - CARD_X - 70, 36, 52)}
                start={from}
                duration={0.8}
                stroke={COLORS.accent}
                width={1.4}
              />
              <DrawPath
                d={icons[r.icon](SAFE.right - CARD_X - 70, 36, 26)}
                start={from + 8}
                duration={0.8}
                stroke={COLORS.accent}
                width={2}
              />
            </Svg>
            <FadeIn start={from}>
              <div style={textStyle(56, 200)}>{r.term}</div>
            </FadeIn>
            <FadeIn start={from + 8} style={{ marginTop: 34 }}>
              <div style={labelStyle()}>ACTEURS REPÈRES</div>
            </FadeIn>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 16,
                marginTop: 18,
              }}
            >
              {r.actors.map((a, j) => {
                const o = progress(frame, from + 14 + j * 9, 0.5);
                return (
                  <span
                    key={a}
                    style={{
                      ...textStyle(30, 300),
                      border: `1.5px solid ${COLORS.inkFaint}`,
                      borderRadius: 999,
                      padding: "12px 30px",
                      opacity: o,
                      transform: `translateY(${(1 - o) * 10}px)`,
                    }}
                  >
                    {a}
                  </span>
                );
              })}
            </div>
            {/* Clients et difficulté à examiner */}
            <div style={{ display: "flex", gap: 60, marginTop: 80 }}>
              <FadeIn start={c} style={{ width: 460 }}>
                <div style={labelStyle(COLORS.accent)}>CLIENTS →</div>
                <div
                  style={{
                    ...textStyle(36, 300),
                    marginTop: 16,
                    lineHeight: 1.35,
                  }}
                >
                  {r.clients}
                </div>
              </FadeIn>
              <div style={{ flex: 1 }}>
                <FadeIn start={c + FPS * 1.2}>
                  <div style={labelStyle(COLORS.warm)}>À EXAMINER</div>
                </FadeIn>
                {r.check.map((k, j) => (
                  <FadeIn
                    key={k}
                    start={c + FPS * (1.6 + j * 0.7)}
                    style={{
                      marginTop: j === 0 ? 16 : 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 16,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        background: COLORS.warm,
                      }}
                    />
                    <span style={{ ...textStyle(34, 300), color: COLORS.warm }}>
                      {k}
                    </span>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const ROWS: SupplierRow[] = [
  {
    term: "Accélérateurs",
    icon: "chip",
    actors: ["NVIDIA", "AMD", "Équipes internes de grands clouds"],
    clients: "Exploitants et intégrateurs",
    check: ["Performance utile", "Logiciels"],
  },
  {
    term: "Substrats de boîtier",
    icon: "stack",
    actors: ["Ibiden", "Shinko", "Unimicron"],
    clients: "Packaging",
    check: ["Connexions fines", "Dimensions", "Déformation"],
  },
  {
    term: "Matériaux de substrat",
    icon: "wafer",
    actors: ["Ajinomoto"],
    clients: "Fabricants de substrats",
    check: ["Propriétés", "Qualification"],
  },
  {
    term: "Cartes et systèmes",
    icon: "server",
    actors: ["Quanta", "Wiwynn", "Foxconn", "Dell", "HPE"],
    clients: "Exploitants",
    check: ["Industrialisation", "Intégration", "Fiabilité"],
  },
  {
    term: "Réseaux",
    icon: "network",
    actors: ["Broadcom", "NVIDIA", "Arista", "Marvell"],
    clients: "Fabricants de systèmes et exploitants",
    check: ["Débit", "Latence", "Consommation"],
  },
];

// Scène 16 — Des substrats à l'exploitation cloud (1/2).
export const S16: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Title
        kicker="Brique · acteurs · clients"
        text="Des substrats à l’exploitation cloud"
        start={cues.s(0)}
        top={110}
      />
      <Stage from={cues.s(0, 0.8)}>
        <SupplierDeck
          rows={ROWS}
          starts={[1, 3, 5, 7, 9].map((i) => cues.s(i))}
          clientStarts={[2, 4, 6, 8, 10].map((i) => cues.s(i))}
          end={cues.end}
          intro={cues.s(0, 1)}
        />
      </Stage>
    </AbsoluteFill>
  );
};
