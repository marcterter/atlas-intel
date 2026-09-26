import React, { useMemo } from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { COLORS, HEIGHT, WIDTH } from "../theme";

const STAR_COUNT = 240;
const DUST_COUNT = 36;

// Fond bleu nuit : étoiles fixes qui scintillent et poussière qui dérive lentement.
export const Background: React.FC = () => {
  const frame = useCurrentFrame();

  const stars = useMemo(
    () =>
      new Array(STAR_COUNT).fill(0).map((_, i) => ({
        x: random(`sx${i}`) * WIDTH,
        y: random(`sy${i}`) * HEIGHT,
        r: 0.4 + random(`sr${i}`) ** 3 * 1.6,
        base: 0.25 + random(`sb${i}`) * 0.55,
        speed: 0.02 + random(`ss${i}`) * 0.05,
        phase: random(`sp${i}`) * Math.PI * 2,
      })),
    [],
  );

  const dust = useMemo(
    () =>
      new Array(DUST_COUNT).fill(0).map((_, i) => ({
        x: random(`dx${i}`) * WIDTH,
        y: random(`dy${i}`) * HEIGHT,
        r: 1.5 + random(`dr${i}`) * 2.5,
        vx: (random(`dvx${i}`) - 0.5) * 0.25,
        vy: -0.08 - random(`dvy${i}`) * 0.18,
        alpha: 0.08 + random(`da${i}`) * 0.14,
      })),
    [],
  );

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 35%, ${COLORS.nightBottom} 0%, ${COLORS.nightTop} 75%)`,
      }}
    >
      <svg width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#ffffff"
            opacity={
              s.base * (0.65 + 0.35 * Math.sin(frame * s.speed + s.phase))
            }
          />
        ))}
        {dust.map((d, i) => {
          const x = (((d.x + d.vx * frame) % WIDTH) + WIDTH) % WIDTH;
          const y = (((d.y + d.vy * frame) % HEIGHT) + HEIGHT) % HEIGHT;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={d.r}
              fill={COLORS.accent}
              opacity={d.alpha}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
