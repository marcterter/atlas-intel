import { evolvePath } from "@remotion/paths";
import React, { createContext, useContext } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT, FPS } from "../theme";

// Chaque scène expose le début de ses phrases (s) et de ses beats (beat), en frames,
// pour caler les animations sur la voix. end = fin de la voix.
export type Cues = {
  s: (sentence: number, delayS?: number) => number;
  beat: (beat: number, delayS?: number) => number;
  end: number;
};
export const CueContext = createContext<Cues>({ s: () => 0, beat: () => 0, end: 0 });
export const useCues = () => useContext(CueContext);

const ease = Easing.inOut(Easing.cubic);

export const progress = (frame: number, start: number, durationS: number) =>
  interpolate(frame, [start, start + durationS * FPS], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

// Trait vectoriel qui se dessine.
export const DrawPath: React.FC<{
  d: string;
  start: number;
  duration?: number;
  stroke?: string;
  width?: number;
  fill?: string;
}> = ({ d, start, duration = 1.2, stroke = COLORS.ink, width = 2, fill }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, start, duration);
  if (p === 0) return null;
  const { strokeDasharray, strokeDashoffset } = evolvePath(p, d);
  return (
    <path
      d={d}
      fill={fill ?? "none"}
      fillOpacity={fill ? p : undefined}
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={strokeDasharray}
      strokeDashoffset={strokeDashoffset}
    />
  );
};

// Flèche qui se trace, puis sa pointe apparaît.
export const Arrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  start: number;
  duration?: number;
  stroke?: string;
  width?: number;
}> = ({ x1, y1, x2, y2, start, duration = 0.8, stroke = COLORS.inkSoft, width = 2 }) => {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 12;
  const head = [angle - 0.45, angle + 0.45]
    .map((a) => `M ${x2 - size * Math.cos(a)} ${y2 - size * Math.sin(a)} L ${x2} ${y2}`)
    .join(" ");
  return (
    <g>
      <DrawPath d={`M ${x1} ${y1} L ${x2} ${y2}`} start={start} duration={duration} stroke={stroke} width={width} />
      <DrawPath d={head} start={start + duration * FPS * 0.85} duration={0.25} stroke={stroke} width={width} />
    </g>
  );
};

// Apparition douce avec léger glissement vertical.
export const FadeIn: React.FC<{
  start: number;
  duration?: number;
  rise?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ start, duration = 0.8, rise = 16, style, children }) => {
  const frame = useCurrentFrame();
  const p = progress(frame, start, duration);
  return (
    <div style={{ ...style, opacity: p, transform: `translateY(${(1 - p) * rise}px)` }}>
      {children}
    </div>
  );
};

// Nombre qui s'incrémente, formaté à la française.
export const Counter: React.FC<{
  from?: number;
  to: number;
  start: number;
  duration?: number;
  decimals?: number;
  style?: React.CSSProperties;
}> = ({ from = 0, to, start, duration = 1.5, decimals = 0, style }) => {
  const frame = useCurrentFrame();
  const value = from + (to - from) * progress(frame, start, duration);
  const text = value.toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: to >= 10000,
  });
  return <span style={{ fontVariantNumeric: "tabular-nums", ...style }}>{text}</span>;
};

// Groupe visible entre deux instants, avec fondu d'entrée et de sortie.
export const Stage: React.FC<{ from: number; to?: number; children: React.ReactNode }> = ({
  from,
  to,
  children,
}) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [from - 4, from + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut =
    to === undefined
      ? 1
      : interpolate(frame, [to - 12, to], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = Math.min(fadeIn, fadeOut);
  if (opacity <= 0) return null;
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

export const textStyle = (size: number, weight = 200): React.CSSProperties => ({
  fontFamily: FONT,
  fontWeight: weight,
  fontSize: size,
  color: COLORS.ink,
  letterSpacing: "-0.01em",
});
