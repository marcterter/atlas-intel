import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { IconName } from "../components/icons";
import { Icon, Svg, Title } from "../components/kit";
import { progress, textStyle, useCues } from "../components/motion";
import { COLORS } from "../theme";

const SKILLS: { text: string; icon: IconName }[] = [
  {
    text: "Expliquer ce qui se passe matériellement lorsqu’une IA répond",
    icon: "token",
  },
  {
    text: "Distinguer conception, fabrication et assemblage d’une puce",
    icon: "gear",
  },
  {
    text: "Comprendre les rôles du calcul, de la mémoire et du réseau",
    icon: "chip",
  },
  {
    text: "Situer le die, le packaging, le substrat et le circuit imprimé",
    icon: "stack",
  },
  {
    text: "Relier les performances à l’électricité et au refroidissement",
    icon: "bolt",
  },
  {
    text: "Distinguer capacité annoncée, opérationnelle et production vendue",
    icon: "chart",
  },
  {
    text: "Reconstruire un chiffre d’affaires fournisseur à partir d’une architecture",
    icon: "euro",
  },
  {
    text: "Expliquer pourquoi une technologie indispensable ne garantit pas un bon investissement",
    icon: "magnifier",
  },
];

// Scène 2 — Les huit compétences, en grille 2 × 4 qui s'allume au fil de l'énumération.
export const S02: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = SKILLS.map((_, i) => cues.s(i + 1));
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  const colX = [170, 990];
  const rowY = (r: number) => 270 + r * 150;

  return (
    <AbsoluteFill>
      <Title
        kicker="Ouverture"
        text="Les compétences à acquérir"
        start={cues.s(0)}
      />
      <Svg>
        {SKILLS.map((s, i) => {
          const x = colX[Math.floor(i / 4)] + 44;
          const y = rowY(i % 4) + 44;
          return (
            <Icon
              key={i}
              name={s.icon}
              x={x}
              y={y}
              size={24}
              start={starts[i]}
              color={i === current ? COLORS.accent : COLORS.inkSoft}
            />
          );
        })}
      </Svg>
      {SKILLS.map((s, i) => {
        const o = progress(frame, starts[i], 0.6);
        const active = i === current;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: colX[Math.floor(i / 4)] + 110,
              top: rowY(i % 4) + 8,
              width: 660,
              opacity: o * (active ? 1 : 0.5),
              transform: `translateY(${(1 - o) * 10}px)`,
            }}
          >
            <div
              style={{
                ...textStyle(16, 500),
                color: COLORS.accent,
                letterSpacing: "0.2em",
                marginBottom: 6,
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </div>
            <div style={{ ...textStyle(27, 300), lineHeight: 1.3 }}>
              {s.text}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
