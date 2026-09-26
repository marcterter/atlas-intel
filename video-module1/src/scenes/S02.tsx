import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { circlePath, icons, roundRectPath } from "../components/icons";
import { Svg, Title } from "../components/kit";
import { DrawPath, progress, textStyle, useCues } from "../components/motion";
import { COLORS } from "../theme";

// Ellipse tournée, en polyligne (pour les pictogrammes).
const ell = (cx: number, cy: number, rx: number, ry: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return new Array(33)
    .fill(0)
    .map((_, k) => {
      const th = (k / 32) * Math.PI * 2;
      const x = rx * Math.cos(th);
      const y = ry * Math.sin(th);
      return `${k === 0 ? "M" : "L"} ${cx + x * Math.cos(a) - y * Math.sin(a)} ${cy + x * Math.sin(a) + y * Math.cos(a)}`;
    })
    .join(" ");
};

// Pictogrammes propres au module 1, centrés sur (x, y), taille ≈ 2·s.
const picto: ((x: number, y: number, s: number) => string)[] = [
  // 1. Atome
  (x, y, s) =>
    `${circlePath(x, y, s * 0.16)} ${ell(x, y, s, s * 0.38, 30)} ${ell(x, y, s, s * 0.38, -30)}`,
  // 2. Bandes d'énergie : deux bandes séparées par un écart
  (x, y, s) =>
    `${roundRectPath(x - s, y - s * 0.9, s * 2, s * 0.6, 3)} ${roundRectPath(x - s, y + s * 0.3, s * 2, s * 0.6, 3)} M ${x} ${y - s * 0.22} V ${y + s * 0.22}`,
  // 3. Jonction PN
  (x, y, s) =>
    `${roundRectPath(x - s, y - s * 0.6, s * 2, s * 1.2, 3)} M ${x} ${y - s * 0.6} V ${y + s * 0.6} ${circlePath(x - s * 0.5, y, s * 0.16)} ${circlePath(x + s * 0.5, y, s * 0.08)}`,
  // 4. Coupe de MOSFET
  (x, y, s) =>
    `M ${x - s} ${y - s * 0.1} H ${x + s} M ${x - s * 0.9} ${y - s * 0.1} V ${y + s * 0.35} H ${x - s * 0.45} V ${y - s * 0.1} M ${x + s * 0.45} ${y - s * 0.1} V ${y + s * 0.35} H ${x + s * 0.9} V ${y - s * 0.1} ${roundRectPath(x - s * 0.4, y - s * 0.75, s * 0.8, s * 0.45, 2)}`,
  // 5. Fréquence : une onde
  (x, y, s) =>
    `M ${x - s} ${y} C ${x - s * 0.75} ${y - s * 1.1} ${x - s * 0.25} ${y - s * 1.1} ${x} ${y} C ${x + s * 0.25} ${y + s * 1.1} ${x + s * 0.75} ${y + s * 1.1} ${x + s} ${y}`,
  // 6. Puissance
  icons.bolt,
  // 7. Loi de Moore
  icons.chart,
  // 8. Questions industrielles et économiques
  icons.factory,
];

const SKILLS = [
  "Expliquer atome, électron, courant, tension et bande d’énergie",
  "Distinguer conducteur, isolant et semi-conducteur",
  "Comprendre le dopage, les électrons, les trous et la jonction PN",
  "Reconstruire le fonctionnement d’un MOSFET et d’un inverseur CMOS",
  "Relier fréquence, capacité électrique, tension et consommation",
  "Distinguer puissance dynamique, courants de fuite et énergie par opération",
  "Expliquer les différences entre loi de Moore et scaling de Dennard",
  "Traduire ces contraintes en questions industrielles et économiques",
];

// Scène 2 — Les huit compétences, en grille 2 × 4 qui s'allume au fil de l'énumération.
export const S02: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = SKILLS.map((_, i) => cues.s(i + 1));
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  const colX = [150, 980];
  const rowY = (r: number) => 270 + r * 150;
  const allOn = frame > cues.end - 20;

  return (
    <AbsoluteFill>
      <Title
        kicker="Ouverture"
        text="Les huit compétences à acquérir"
        start={cues.s(0)}
      />
      <Svg>
        {SKILLS.map((_, i) => {
          const x = colX[Math.floor(i / 4)] + 50;
          const y = rowY(i % 4) + 50;
          const active = i === current || allOn;
          return (
            <DrawPath
              key={i}
              d={picto[i](x, y, 30)}
              start={starts[i]}
              duration={0.9}
              stroke={active ? COLORS.accent : COLORS.inkSoft}
              width={2}
            />
          );
        })}
      </Svg>
      {SKILLS.map((s, i) => {
        const o = progress(frame, starts[i], 0.6);
        const active = i === current || allOn;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: colX[Math.floor(i / 4)] + 120,
              top: rowY(i % 4) + 4,
              width: 670,
              opacity: o * (active ? 1 : 0.5),
              transform: `translateY(${(1 - o) * 10}px)`,
            }}
          >
            <div
              style={{
                ...textStyle(22, 500),
                color: COLORS.accent,
                letterSpacing: "0.2em",
                marginBottom: 6,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ ...textStyle(28, 300), lineHeight: 1.3 }}>{s}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
