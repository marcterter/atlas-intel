import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import {
  IconName,
  circlePath,
  icons,
  roundRectPath,
} from "../components/icons";
import { Svg, Title } from "../components/kit";
import {
  Arrow,
  DrawPath,
  FadeIn,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import { small } from "./S33";

// ——— Tableau à trois colonnes rempli cellule par cellule (partagé avec S42) ———

export type TableCol = { label: string; color: string };
export type TableRow = { cells: string[]; at: number[]; icon?: IconName };

const CX = [140, 720, 1300];
const CW = 480;
export const T_TOP = 262;
export const T_PITCH = 140;
const T_H = 118;

export const Table3: React.FC<{
  cols: TableCol[];
  rows: TableRow[];
  headerAt: number;
  arrows?: boolean;
  marker?: boolean;
}> = ({ cols, rows, headerAt, arrows = false, marker = false }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {cols.map((c, j) => (
        <FadeIn
          key={c.label}
          start={headerAt + j * 8}
          style={{
            position: "absolute",
            left: CX[j],
            top: 200,
            width: CW,
            textAlign: "center",
          }}
        >
          <div
            style={{
              ...small(c.color),
              letterSpacing: "0.12em",
              whiteSpace: "nowrap",
            }}
          >
            {c.label}
          </div>
        </FadeIn>
      ))}
      <Svg>
        {cols.map((c, j) => (
          <DrawPath
            key={c.label}
            d={`M ${CX[j]} 240 H ${CX[j] + CW}`}
            start={headerAt + j * 8}
            duration={0.8}
            stroke={c.color}
            width={1.4}
          />
        ))}
        {rows.map((r, i) => {
          const y = T_TOP + i * T_PITCH;
          const mid = y + T_H / 2;
          return (
            <g key={i}>
              {r.cells.map((_, j) => {
                const at = r.at[j];
                const color = cols[j].color;
                return (
                  <g key={j}>
                    <path
                      d={roundRectPath(CX[j], y, CW, T_H, 12)}
                      fill={color}
                      fillOpacity={0.06 * progress(frame, at + 8, 0.6)}
                    />
                    <DrawPath
                      d={roundRectPath(CX[j], y, CW, T_H, 12)}
                      start={at}
                      duration={0.7}
                      stroke={color}
                      width={1.4}
                    />
                  </g>
                );
              })}
              {r.icon && (
                <DrawPath
                  d={icons[r.icon](CX[0] + 50, mid, 22)}
                  start={r.at[0] + 6}
                  duration={0.8}
                  stroke={cols[0].color}
                  width={1.6}
                />
              )}
              {arrows && (
                <>
                  <Arrow
                    x1={CX[0] + CW + 14}
                    y1={mid}
                    x2={CX[1] - 14}
                    y2={mid}
                    start={r.at[1] - 10}
                    duration={0.5}
                    stroke={cols[1].color}
                  />
                  <Arrow
                    x1={CX[1] + CW + 14}
                    y1={mid}
                    x2={CX[2] - 14}
                    y2={mid}
                    start={r.at[2] - 10}
                    duration={0.5}
                    stroke={cols[2].color}
                  />
                </>
              )}
              {marker &&
                (() => {
                  // La contrainte (point ambre) glisse du bottleneck vers la limite suivante.
                  const p1 = progress(frame, r.at[0] + 10, 0.6);
                  const p2 = progress(frame, r.at[2] - 24, 1.1);
                  if (p1 === 0) return null;
                  const x0 = CX[0] + CW - 26;
                  const x1 = CX[2] + CW - 26;
                  const x = x0 + (x1 - x0) * p2;
                  const lift = Math.sin(p2 * Math.PI) * 40;
                  return (
                    <g>
                      <path
                        d={circlePath(x, y + 22 - lift, 8)}
                        fill={COLORS.warm}
                        opacity={p1}
                      />
                      <path
                        d={circlePath(x, y + 22 - lift, 15)}
                        fill="none"
                        stroke={COLORS.warm}
                        strokeWidth={1}
                        opacity={p1 * 0.5}
                      />
                    </g>
                  );
                })()}
            </g>
          );
        })}
      </Svg>
      {rows.map((r, i) =>
        r.cells.map((text, j) => {
          const y = T_TOP + i * T_PITCH;
          const iconPad = j === 0 && r.icon ? 70 : 0;
          return (
            <FadeIn
              key={`${i}-${j}`}
              start={r.at[j] + 8}
              rise={8}
              style={{
                position: "absolute",
                left: CX[j] + 30 + iconPad,
                top: y,
                width: CW - 60 - iconPad,
                height: T_H,
                display: "flex",
                alignItems: "center",
                justifyContent: iconPad ? "flex-start" : "center",
                textAlign: iconPad ? "left" : "center",
              }}
            >
              <div
                style={{
                  ...textStyle(28, j === 0 ? 400 : 300),
                  lineHeight: 1.28,
                  color: COLORS.ink,
                }}
              >
                {text}
              </div>
            </FadeIn>
          );
        }),
      )}
    </AbsoluteFill>
  );
};

const ROWS = (s: (i: number, d?: number) => number): TableRow[] => [
  {
    cells: [
      "Fuite et contrôle de grille",
      "Géométrie et matériaux",
      "Rendement et difficulté de fabrication",
    ],
    at: [s(1, 0.2), s(1, 2.3), s(1, 5.6)],
  },
  {
    cells: [
      "Puissance de commutation",
      "Tension, capacité et activité réduites",
      "Délai, stabilité et débit réel",
    ],
    at: [s(2, 0.2), s(2, 2.2), s(2, 6.6)],
  },
  {
    cells: [
      "Coût du die bon",
      "Densité et rendement améliorés",
      "Prix du wafer et packaging",
    ],
    at: [s(3, 0.2), s(3, 1.7), s(3, 5)],
  },
  {
    cells: [
      "Déplacement de données",
      "Mémoire proche et architecture",
      "Interconnexion et chaleur",
    ],
    at: [s(4, 0.2), s(4, 1.8), s(4, 4.8)],
  },
];

// Scène 40 — Une matrice simple de suivi : bottleneck → réponse → limite suivante.
export const S40: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(0);
  const legend = interpolate(frame, [t + FPS * 5, t + FPS * 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <Title text="Une matrice simple de suivi" start={t} top={105} />
      <Table3
        headerAt={t + FPS * 3}
        arrows
        marker
        cols={[
          { label: "BOTTLENECK", color: COLORS.ink },
          { label: "RÉPONSE POSSIBLE", color: COLORS.accent },
          { label: "LIMITE SUIVANTE À SURVEILLER", color: COLORS.warm },
        ]}
        rows={ROWS(cues.s)}
      />
      <div
        style={{
          position: "absolute",
          top: 832,
          width: "100%",
          textAlign: "center",
          opacity: legend,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 14,
        }}
      >
        <svg width={20} height={20}>
          <circle cx={10} cy={10} r={7} fill={COLORS.warm} />
        </svg>
        <span style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
          chaque réponse déplace la contrainte : le point suivant à surveiller
        </span>
      </div>
    </AbsoluteFill>
  );
};
