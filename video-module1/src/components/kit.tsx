// Briques de mise en scène partagées par toutes les scènes.
// Zone utile : x 140 → 1780, y 110 → 880 (le bas est réservé aux sous-titres,
// le coin haut gauche au bandeau de chapitre).
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT, FPS, HEIGHT, WIDTH } from "../theme";
import { IconName, icons, roundRectPath } from "./icons";
import { Arrow, DrawPath, FadeIn, progress, textStyle } from "./motion";

export const SAFE = { left: 140, right: 1780, top: 110, bottom: 880 };

// Calque SVG plein écran pour les tracés.
export const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg
    width={WIDTH}
    height={HEIGHT}
    style={{ position: "absolute", left: 0, top: 0 }}
  >
    {children}
  </svg>
);

// Titre de scène, centré en haut, avec surtitre facultatif.
export const Title: React.FC<{
  text: string;
  start: number;
  kicker?: string;
  top?: number;
}> = ({ text, start, kicker, top = 120 }) => (
  <div
    style={{ position: "absolute", top, width: "100%", textAlign: "center" }}
  >
    {kicker && (
      <FadeIn start={start}>
        <div
          style={{
            ...textStyle(18, 400),
            color: COLORS.accent,
            letterSpacing: "0.32em",
            marginBottom: 14,
          }}
        >
          {kicker.toUpperCase()}
        </div>
      </FadeIn>
    )}
    <FadeIn start={start + (kicker ? 6 : 0)}>
      <div style={textStyle(46, 200)}>{text}</div>
    </FadeIn>
  </div>
);

// Pictogramme tracé.
export const Icon: React.FC<{
  name: IconName;
  x: number;
  y: number;
  size?: number;
  start: number;
  color?: string;
  width?: number;
  duration?: number;
}> = ({
  name,
  x,
  y,
  size = 30,
  start,
  color = COLORS.ink,
  width = 2,
  duration = 0.8,
}) => (
  <DrawPath
    d={icons[name](x, y, size)}
    start={start}
    duration={duration}
    stroke={color}
    width={width}
  />
);

// Texte SVG multi-ligne (« \n ») qui apparaît en fondu.
export const SvgText: React.FC<{
  x: number;
  y: number;
  text: string;
  start: number;
  size?: number;
  weight?: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  lineHeight?: number;
  spacing?: string;
}> = ({
  x,
  y,
  text,
  start,
  size = 24,
  weight = 300,
  color = COLORS.ink,
  anchor = "middle",
  lineHeight = 1.3,
  spacing,
}) => {
  const frame = useCurrentFrame();
  const opacity = progress(frame, start, 0.6);
  const lines = text.split("\n");
  const y0 = y - ((lines.length - 1) * size * lineHeight) / 2 + size * 0.35;
  return (
    <text
      x={x}
      y={y0}
      textAnchor={anchor}
      fontFamily={FONT}
      fontWeight={weight}
      fontSize={size}
      fill={color}
      opacity={opacity}
      letterSpacing={spacing}
    >
      {lines.map((l, i) => (
        <tspan key={i} x={x} dy={i === 0 ? 0 : size * lineHeight}>
          {l}
        </tspan>
      ))}
    </text>
  );
};

export type BoxVariant = "default" | "hi" | "side" | "out" | "muted";
const boxStroke: Record<BoxVariant, string> = {
  default: COLORS.ink,
  hi: COLORS.accent,
  side: COLORS.warm,
  out: COLORS.accent,
  muted: COLORS.inkSoft,
};

// Boîte arrondie qui se trace, avec libellé centré (et sous-libellé facultatif).
export const Box: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  start: number;
  sub?: string;
  variant?: BoxVariant;
  size?: number;
}> = ({ x, y, w, h, label, start, sub, variant = "default", size = 24 }) => {
  const frame = useCurrentFrame();
  const fill = progress(frame, start + 10, 0.6);
  const stroke = boxStroke[variant];
  const cy = y + h / 2 - (sub ? size * 0.45 : 0);
  return (
    <g>
      <path
        d={roundRectPath(x, y, w, h, 12)}
        fill={
          variant === "hi" || variant === "out"
            ? COLORS.accent
            : variant === "side"
              ? COLORS.warm
              : "#ffffff"
        }
        opacity={0.06 * fill}
      />
      <DrawPath
        d={roundRectPath(x, y, w, h, 12)}
        start={start}
        duration={0.7}
        stroke={stroke}
        width={variant === "muted" ? 1.4 : 2}
      />
      <SvgText
        x={x + w / 2}
        y={cy}
        text={label}
        start={start + 8}
        size={size}
        weight={variant === "hi" ? 400 : 300}
      />
      {sub && (
        <SvgText
          x={x + w / 2}
          y={y + h / 2 + size * 0.75}
          text={sub}
          start={start + 14}
          size={size * 0.72}
          color={COLORS.inkSoft}
        />
      )}
    </g>
  );
};

// Flèche entre deux points, raccourcie aux extrémités.
export const Link: React.FC<{
  from: [number, number];
  to: [number, number];
  start: number;
  gap?: number;
  color?: string;
  width?: number;
}> = ({ from, to, start, gap = 10, color = COLORS.inkSoft, width = 1.8 }) => {
  const d = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const ux = (to[0] - from[0]) / d;
  const uy = (to[1] - from[1]) / d;
  return (
    <Arrow
      x1={from[0] + ux * gap}
      y1={from[1] + uy * gap}
      x2={to[0] - ux * gap}
      y2={to[1] - uy * gap}
      start={start}
      duration={0.6}
      stroke={color}
      width={width}
    />
  );
};

// Chaîne horizontale d'étapes reliées par des flèches, révélées une à une.
export const FlowChain: React.FC<{
  items: string[];
  starts: number[];
  y: number;
  x0?: number;
  x1?: number;
  h?: number;
  size?: number;
  highlight?: number[];
}> = ({
  items,
  starts,
  y,
  x0 = SAFE.left,
  x1 = SAFE.right,
  h = 90,
  size = 24,
  highlight = [],
}) => {
  const gap = 56;
  const w = (x1 - x0 - gap * (items.length - 1)) / items.length;
  return (
    <Svg>
      {items.map((label, i) => {
        const x = x0 + i * (w + gap);
        return (
          <g key={label}>
            <Box
              x={x}
              y={y - h / 2}
              w={w}
              h={h}
              label={label}
              start={starts[i]}
              size={size}
              variant={highlight.includes(i) ? "hi" : "default"}
            />
            {i < items.length - 1 && (
              <Link
                from={[x + w, y]}
                to={[x + w + gap, y]}
                start={starts[i + 1] - 8}
                gap={6}
              />
            )}
          </g>
        );
      })}
    </Svg>
  );
};

// Encadré : fait publié, point analyste, note ou définition.
const CALLOUT = {
  fact: { label: "FAIT PUBLIÉ", color: COLORS.accent },
  analyst: { label: "POINT ANALYSTE", color: COLORS.warm },
  note: { label: "À RETENIR", color: COLORS.ink },
  warn: { label: "ATTENTION", color: COLORS.warm },
  def: { label: "DÉFINITION", color: COLORS.accent },
};

export const Callout: React.FC<{
  kind: keyof typeof CALLOUT;
  start: number;
  children: React.ReactNode;
  y?: number;
  width?: number;
  label?: string;
  size?: number;
}> = ({ kind, start, children, y = 420, width = 1320, label, size = 34 }) => {
  const frame = useCurrentFrame();
  const { color, label: defaultLabel } = CALLOUT[kind];
  const p = progress(frame, start, 0.9);
  const x = (WIDTH - width) / 2;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: y,
          left: x,
          width,
          padding: "46px 64px 40px",
          boxSizing: "border-box",
        }}
      >
        {/* Filet vertical qui se trace, puis étiquette et texte. */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 2,
            height: `${p * 100}%`,
            background: color,
          }}
        />
        <FadeIn start={start + 6}>
          <div
            style={{
              ...textStyle(18, 500),
              color,
              letterSpacing: "0.3em",
              marginBottom: 20,
            }}
          >
            {label ?? defaultLabel}
          </div>
        </FadeIn>
        <FadeIn start={start + 12}>
          <div style={{ ...textStyle(size, 300), lineHeight: 1.4 }}>
            {children}
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// Équation affichée terme par terme.
export const Equation: React.FC<{
  parts: string[];
  starts: number[];
  y?: number;
  size?: number;
  color?: string;
}> = ({ parts, starts, y = 460, size = 64, color = COLORS.ink }) => {
  const frame = useCurrentFrame();
  const isOp = (p: string) => /^[=×÷+≤→−-]$|^min$/.test(p.trim());
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "baseline",
        gap: size * 0.32,
        flexWrap: "wrap",
        padding: "0 140px",
        boxSizing: "border-box",
      }}
    >
      {parts.map((p, i) => {
        const o = progress(frame, starts[Math.min(i, starts.length - 1)], 0.6);
        return (
          <span
            key={i}
            style={{
              ...textStyle(size, 200),
              color: isOp(p) ? COLORS.accent : color,
              opacity: o,
              transform: `translateY(${(1 - o) * 12}px)`,
              display: "inline-block",
            }}
          >
            {p}
          </span>
        );
      })}
    </div>
  );
};

// Liste à puces : chaque ligne s'allume à son tour, les précédentes s'estompent légèrement.
export const Bullets: React.FC<{
  items: React.ReactNode[];
  starts: number[];
  top?: number;
  left?: number;
  width?: number;
  size?: number;
  dimPast?: boolean;
  numbered?: boolean;
}> = ({
  items,
  starts,
  top = 280,
  left = 300,
  width = 1320,
  size = 32,
  dimPast = true,
  numbered = false,
}) => {
  const frame = useCurrentFrame();
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  return (
    <div style={{ position: "absolute", top, left, width }}>
      {items.map((item, i) => {
        const o = progress(frame, starts[i], 0.6);
        const active = !dimPast || i === current;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 26,
              marginBottom: size * 0.75,
              opacity: o * (active ? 1 : 0.45),
              transform: `translateX(${(1 - o) * -16}px)`,
            }}
          >
            <span
              style={{
                ...textStyle(numbered ? size * 0.6 : size, 400),
                color: COLORS.accent,
                minWidth: numbered ? size * 1.2 : size * 0.5,
                letterSpacing: numbered ? "0.1em" : undefined,
              }}
            >
              {numbered ? String(i + 1).padStart(2, "0") : "—"}
            </span>
            <span style={{ ...textStyle(size, 300), lineHeight: 1.35 }}>
              {item}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Tableau présenté ligne à ligne : liste des termes à gauche, fiche du terme courant à droite.
export type DeckItem = {
  term: string;
  lines: { label: string; text: string; tone?: "ink" | "accent" | "warm" }[];
  icon?: IconName;
};

export const TermDeck: React.FC<{
  items: DeckItem[];
  starts: number[];
  end: number;
  top?: number;
  listWidth?: number;
  termSize?: number;
  heading?: string;
}> = ({
  items,
  starts,
  end,
  top = 250,
  listWidth = 470,
  termSize = 26,
  heading,
}) => {
  const frame = useCurrentFrame();
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  const cardLeft = SAFE.left + listWidth + 70;
  const cardWidth = SAFE.right - cardLeft;
  const rowH = Math.min(78, 560 / items.length);
  return (
    <AbsoluteFill>
      {/* Liste des termes */}
      <div
        style={{ position: "absolute", top, left: SAFE.left, width: listWidth }}
      >
        {heading && (
          <FadeIn start={starts[0] - 10}>
            <div
              style={{
                ...textStyle(16, 500),
                color: COLORS.inkSoft,
                letterSpacing: "0.3em",
                marginBottom: 18,
              }}
            >
              {heading.toUpperCase()}
            </div>
          </FadeIn>
        )}
        {items.map((it, i) => {
          const o = progress(frame, starts[i], 0.5);
          const active = i === current;
          return (
            <div
              key={it.term}
              style={{
                height: rowH,
                display: "flex",
                alignItems: "center",
                gap: 18,
                opacity: o * (active ? 1 : 0.42),
              }}
            >
              <div
                style={{
                  width: 3,
                  height: rowH * 0.55,
                  background: active ? COLORS.accent : COLORS.inkFaint,
                }}
              />
              <div style={{ ...textStyle(termSize, active ? 400 : 300) }}>
                {it.term}
              </div>
            </div>
          );
        })}
      </div>
      {/* Séparateur vertical */}
      <Svg>
        <DrawPath
          d={`M ${cardLeft - 36} ${top} V ${top + Math.max(rowH * items.length, 380)}`}
          start={starts[0] - 6}
          duration={1}
          stroke={COLORS.inkFaint}
          width={1}
        />
      </Svg>
      {/* Fiche du terme courant */}
      {items.map((it, i) => {
        const from = starts[i];
        const to = i < items.length - 1 ? starts[i + 1] : end + 60;
        if (frame < from - 2 || frame > to) return null;
        const fadeOut = interpolate(frame, [to - 8, to], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={it.term}
            style={{
              position: "absolute",
              top,
              left: cardLeft,
              width: cardWidth,
              opacity: fadeOut,
            }}
          >
            {it.icon && (
              <Svg>
                <Icon
                  name={it.icon}
                  x={cardWidth - 70}
                  y={46}
                  size={38}
                  start={from + 4}
                  color={COLORS.accent}
                />
              </Svg>
            )}
            <FadeIn start={from}>
              <div style={textStyle(54, 200)}>{it.term}</div>
            </FadeIn>
            {it.lines.map((l, j) => (
              <FadeIn
                key={j}
                start={from + 10 + j * 14}
                style={{ marginTop: j === 0 ? 34 : 30 }}
              >
                <div
                  style={{
                    ...textStyle(16, 500),
                    color: COLORS.inkSoft,
                    letterSpacing: "0.28em",
                    marginBottom: 10,
                  }}
                >
                  {l.label.toUpperCase()}
                </div>
                <div
                  style={{
                    ...textStyle(32, 300),
                    lineHeight: 1.35,
                    color:
                      l.tone === "warm"
                        ? COLORS.warm
                        : l.tone === "accent"
                          ? COLORS.accent
                          : COLORS.ink,
                  }}
                >
                  {l.text}
                </div>
              </FadeIn>
            ))}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Pastille de mot-clé (anglais ↔ français, sigle…).
export const Chip: React.FC<{
  text: string;
  start: number;
  tone?: "accent" | "warm" | "ink";
}> = ({ text, start, tone = "accent" }) => {
  const color =
    tone === "warm" ? COLORS.warm : tone === "ink" ? COLORS.ink : COLORS.accent;
  return (
    <FadeIn start={start} rise={8} style={{ display: "inline-block" }}>
      <span
        style={{
          ...textStyle(22, 400),
          color,
          border: `1.5px solid ${color}`,
          borderRadius: 999,
          padding: "8px 22px",
          letterSpacing: "0.04em",
        }}
      >
        {text}
      </span>
    </FadeIn>
  );
};

export const secs = (s: number) => s * FPS;
