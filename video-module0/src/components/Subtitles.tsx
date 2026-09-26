import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Sentence, SceneTiming } from "../data";
import { COLORS, FONT, FPS } from "../theme";

const FADE = 6;
const HOLD_S = 0.5;

// Affiche la phrase en cours de lecture, calée sur les timings de la voix off.
export const Subtitles: React.FC<{
  sentences: Sentence[];
  timing: SceneTiming;
  offset: number;
}> = ({ sentences, timing, offset }) => {
  const frame = useCurrentFrame();
  const t = (frame - offset) / FPS;

  const index = timing.sentences.findIndex((s, i) => {
    const next = timing.sentences[i + 1];
    const until = next ? next.start : s.end + HOLD_S;
    return t >= s.start && t < until;
  });
  if (index === -1) return null;

  const s = timing.sentences[index];
  const next = timing.sentences[index + 1];
  const inAt = offset + s.start * FPS;
  const outAt = offset + (next ? next.start : s.end + HOLD_S) * FPS;
  const opacity = Math.min(
    interpolate(frame, [inAt, inAt + FADE], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(frame, [outAt - FADE, outAt], [1, 0], { extrapolateLeft: "clamp" }),
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 64,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          textAlign: "center",
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: 36,
          lineHeight: 1.35,
          color: COLORS.ink,
          textShadow: "0 2px 18px rgba(2, 6, 20, 0.9)",
          opacity,
        }}
      >
        {sentences[index].text.replace(/'/g, "’")}
      </div>
    </div>
  );
};
