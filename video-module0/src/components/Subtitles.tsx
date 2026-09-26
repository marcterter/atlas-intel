import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Sentence, SceneTiming } from "../data";
import { COLORS, FONT, FPS } from "../theme";

const FADE = 5;
const HOLD_S = 0.5;
const MAX_CHARS = 95;

// Coupe une phrase longue en morceaux lisibles, de préférence après une ponctuation.
const chunk = (text: string): string[] => {
  if (text.length <= MAX_CHARS) return [text];
  const words = text.split(" ");
  const parts: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const breakHere = current.length > MAX_CHARS * 0.55 && /[,;:]$/.test(current);
    if ((candidate.length > MAX_CHARS || breakHere) && current) {
      parts.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  parts.push(current);
  // Évite un dernier morceau orphelin de deux ou trois mots.
  if (parts.length > 1 && parts[parts.length - 1].length < 25) {
    const last = parts.pop()!;
    parts[parts.length - 1] += ` ${last}`;
  }
  return parts;
};

type Cue = { text: string; from: number; to: number };

const buildCues = (sentences: Sentence[], timing: SceneTiming): Cue[] =>
  sentences.flatMap((sentence, i) => {
    const t = timing.sentences[i];
    const next = timing.sentences[i + 1];
    const until = next ? next.start : t.end + HOLD_S;
    const parts = chunk(sentence.text.replace(/'/g, "’"));
    const total = parts.reduce((sum, p) => sum + p.length, 0);
    let cursor = t.start;
    return parts.map((text, j) => {
      const from = cursor;
      cursor += ((t.end - t.start) * text.length) / total;
      return { text, from, to: j === parts.length - 1 ? until : cursor };
    });
  });

// Affiche le morceau de phrase en cours de lecture, calé sur la voix off.
export const Subtitles: React.FC<{
  sentences: Sentence[];
  timing: SceneTiming;
  offset: number;
}> = ({ sentences, timing, offset }) => {
  const frame = useCurrentFrame();
  const t = (frame - offset) / FPS;
  const cue = buildCues(sentences, timing).find((c) => t >= c.from && t < c.to);
  if (!cue) return null;

  const inAt = offset + cue.from * FPS;
  const outAt = offset + cue.to * FPS;
  const opacity = Math.min(
    interpolate(frame, [inAt, inAt + FADE], [0, 1], { extrapolateRight: "clamp" }),
    interpolate(frame, [outAt - FADE, outAt], [1, 0], { extrapolateLeft: "clamp" }),
  );

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          maxWidth: 1320,
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
        {cue.text}
      </div>
    </div>
  );
};
