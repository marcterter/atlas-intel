import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { circlePath, icons, roundRectPath } from "../components/icons";
import { Icon, Link, Svg, SvgText, Title } from "../components/kit";
import {
  Counter,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";

const accentA = (a: number) => `rgba(143, 208, 255, ${a})`;

// Vue d'ensemble : les cinq étapes du chemin d'une requête.
const STEPS = [
  "Texte → nombres",
  "Modèle en mémoire",
  "Calculs",
  "Échanges",
  "Réponse",
];
const Overview: React.FC = () => {
  const cues = useCues();
  const t = cues.s(0);
  const xs = STEPS.map((_, i) => 400 + i * 280);
  const y = 500;
  return (
    <AbsoluteFill>
      <Title
        kicker="Le chemin d’une requête"
        text="De ta question à la réponse"
        start={t}
      />
      <Svg>
        <SvgText
          x={200}
          y={y}
          text="Question"
          start={t + 6}
          size={24}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={1740}
          y={y}
          text="Réponse"
          start={t + 70}
          size={24}
          color={COLORS.accent}
        />
        {xs.map((x, i) => (
          <g key={i}>
            <DrawPath
              d={circlePath(x, y, 46)}
              start={t + 10 + i * 12}
              duration={0.6}
              stroke={i < 2 ? COLORS.accent : COLORS.inkSoft}
            />
            <SvgText
              x={x}
              y={y}
              text={String(i + 1)}
              start={t + 16 + i * 12}
              size={34}
              weight={200}
            />
            <SvgText
              x={x}
              y={y + 96}
              text={STEPS[i]}
              start={t + 20 + i * 12}
              size={24}
              color={i < 2 ? COLORS.ink : COLORS.inkSoft}
            />
            {i < xs.length - 1 && (
              <Link
                from={[x + 46, y]}
                to={[xs[i + 1] - 46, y]}
                start={t + 18 + i * 12}
                gap={10}
              />
            )}
          </g>
        ))}
        <Link from={[270, y]} to={[354, y]} start={t + 8} gap={4} />
        <Link from={[1566, y]} to={[1660, y]} start={t + 66} gap={4} />
      </Svg>
    </AbsoluteFill>
  );
};

// Étape 1 : la phrase se découpe en tokens, puis chaque token devient un nombre.
const TOKENS = [
  { t: "Le", n: 4213, kind: "mot", space: false },
  { t: "mot", n: 882, kind: "mot", space: true },
  { t: "infra", n: 19, kind: "fragment", space: true },
  { t: "struc", n: 7701, kind: "fragment", space: false },
  { t: "ture", n: 325, kind: "fragment", space: false },
  { t: ".", n: 13, kind: "signe", space: false },
];
const Tokens: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const split = progress(frame, cues.s(2, 0.4), 1.1);
  const kinds = progress(frame, cues.s(3, 0.5), 0.6);
  return (
    <AbsoluteFill>
      <Title
        kicker="Étape 1"
        text="Le texte devient des nombres"
        start={cues.s(1)}
      />
      <div
        style={{
          position: "absolute",
          top: 330,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        {TOKENS.map((tk, i) => {
          const kindStart = cues.s(3, 0.4 + i * 0.35);
          const numStart = cues.s(4, 0.2 + i * 0.25);
          const tone =
            tk.kind === "mot"
              ? COLORS.ink
              : tk.kind === "signe"
                ? COLORS.warm
                : COLORS.accent;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                marginLeft: i === 0 ? 0 : (tk.space ? 18 : 0) + split * 26,
              }}
            >
              <div style={{ position: "relative", height: 40, width: "100%" }}>
                <div
                  style={{
                    position: "absolute",
                    left: -100,
                    right: -100,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    ...textStyle(22, 500),
                    color: tone,
                    letterSpacing: "0.14em",
                    opacity: kinds > 0 ? progress(frame, kindStart, 0.5) : 0,
                  }}
                >
                  {tk.kind.toUpperCase()}
                </div>
              </div>
              <FadeIn start={cues.s(1, 0.6)} rise={10}>
                <div
                  style={{
                    ...textStyle(68, 200),
                    padding: `6px ${split * 22}px 10px`,
                    borderRadius: 14,
                    border: `1.5px solid ${accentA(split * 0.9)}`,
                    background: accentA(split * 0.06),
                  }}
                >
                  {tk.t}
                </div>
              </FadeIn>
              <div
                style={{
                  width: 2,
                  height: 70 * progress(frame, numStart - 10, 0.5),
                  background: COLORS.inkSoft,
                  marginTop: 16,
                }}
              />
              <div style={{ position: "relative", height: 70, width: "100%" }}>
                <div
                  style={{
                    position: "absolute",
                    left: -100,
                    right: -100,
                    top: 14,
                    textAlign: "center",
                    ...textStyle(46, 200),
                    color: COLORS.accent,
                    opacity: progress(frame, numStart, 0.5),
                  }}
                >
                  <Counter to={tk.n} start={numStart} duration={1.2} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <FadeIn
        start={cues.s(2, 0.2)}
        style={{
          position: "absolute",
          top: 250,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(22, 400),
            color: COLORS.inkSoft,
            letterSpacing: "0.3em",
          }}
        >
          DÉCOUPAGE EN TOKENS
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(5)}
        style={{
          position: "absolute",
          top: 720,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(34, 300) }}>
          Un token n’est{" "}
          <span style={{ color: COLORS.warm }}>pas systématiquement</span> un
          mot
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Étape 2 : les poids sont copiés du stockage vers la mémoire des processeurs,
// puis y restent pour servir de nombreuses demandes.
const COLS = 5;
const ROWS = 4;
const WEIGHTS = new Array(COLS * ROWS).fill(0).map((_, i) => {
  const v = (random(`w${i}`) * 2 - 1) * 1.6;
  return v.toFixed(2).replace(".", ",");
});
const Memory: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(6);
  const store = { x: 200, y: 420, w: 420, h: 270 };
  const mem = { x: 940, y: 420, w: 420, h: 270 };
  const cell = (b: typeof store, i: number) => ({
    x: b.x + 60 + (i % COLS) * 75,
    y: b.y + 70 + Math.floor(i / COLS) * 46,
  });
  const chipX = 1560;
  const chipY = 555;
  const load = cues.s(8, 1.5);
  // Demandes : de petits tokens arrivent au processeur à intervalle régulier.
  const reqStart = cues.s(9, 0.3);
  const period = 0.22 * FPS;
  const nReq = Math.max(0, Math.floor((frame - reqStart) / period) + 1);
  return (
    <AbsoluteFill>
      <Title
        kicker="Étape 2"
        text="Le modèle est disponible en mémoire"
        start={t}
      />
      <FadeIn
        start={cues.s(7)}
        style={{
          position: "absolute",
          top: 270,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(32, 300) }}>
          <span style={{ color: COLORS.accent }}>Paramètres = poids</span> :
          nombres ajustés pendant l’apprentissage
        </div>
      </FadeIn>
      <Svg>
        <DrawPath
          d={roundRectPath(store.x, store.y, store.w, store.h, 16)}
          start={cues.s(7, 0.3)}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={store.x + store.w / 2}
          y={store.y + store.h + 44}
          text="STOCKAGE"
          start={cues.s(7, 0.6)}
          size={22}
          weight={500}
          spacing="0.25em"
          color={COLORS.inkSoft}
        />
        <DrawPath
          d={roundRectPath(mem.x, mem.y, mem.w, mem.h, 16)}
          start={cues.s(8)}
          duration={0.8}
          stroke={COLORS.accent}
        />
        <SvgText
          x={mem.x + mem.w / 2}
          y={mem.y + mem.h + 44}
          text="MÉMOIRES DES PROCESSEURS"
          start={cues.s(8, 0.3)}
          size={22}
          weight={500}
          spacing="0.25em"
          color={COLORS.accent}
        />
        <Icon
          name="chip"
          x={chipX}
          y={chipY}
          size={80}
          start={cues.s(8, 0.4)}
          duration={1}
        />
        <SvgText
          x={chipX}
          y={mem.y + mem.h + 44}
          text="PROCESSEUR"
          start={cues.s(8, 0.6)}
          size={22}
          weight={500}
          spacing="0.25em"
          color={COLORS.inkSoft}
        />
        <Link
          from={[mem.x + mem.w, chipY]}
          to={[chipX - 80, chipY]}
          start={cues.s(8, 0.8)}
          gap={8}
        />
        <Link
          from={[store.x + store.w, chipY]}
          to={[mem.x, chipY]}
          start={cues.s(8, 1)}
          gap={14}
          color={COLORS.accent}
        />
        {WEIGHTS.map((w, i) => {
          const a = cell(store, i);
          const b = cell(mem, i);
          const appear = progress(frame, cues.s(7, 0.8) + i * 1.5, 0.4);
          const p = progress(frame, load + i * 3, 1.1);
          const x = interpolate(p, [0, 1], [a.x, b.x]);
          const y =
            interpolate(p, [0, 1], [a.y, b.y]) - Math.sin(p * Math.PI) * 80;
          return (
            <g key={i}>
              {/* La copie reste dans le stockage, en retrait. */}
              <text
                x={a.x}
                y={a.y}
                textAnchor="middle"
                fontFamily="Inter Variable, Inter, sans-serif"
                fontWeight={300}
                fontSize={22}
                fill={COLORS.inkSoft}
                opacity={appear * (p > 0 ? 0.45 : 1)}
              >
                {w}
              </text>
              {p > 0 && (
                <text
                  x={x}
                  y={y}
                  textAnchor="middle"
                  fontFamily="Inter Variable, Inter, sans-serif"
                  fontWeight={300}
                  fontSize={22}
                  fill={COLORS.accent}
                >
                  {w}
                </text>
              )}
            </g>
          );
        })}
        {new Array(Math.min(nReq, 40)).fill(0).map((_, k) => {
          const born = reqStart + k * period;
          const p = progress(frame, born, 1.2);
          if (p >= 1) return null;
          const x0 = 1560 + (random(`r${k}`) - 0.5) * 160;
          const y = interpolate(p, [0, 1], [330, chipY - 70]);
          const x = interpolate(p, [0, 1], [x0, chipX]);
          return (
            <path
              key={k}
              d={icons.token(x, y, 16)}
              stroke={COLORS.warm}
              strokeWidth={1.6}
              fill="none"
              opacity={Math.min(1, (1 - p) * 3)}
            />
          );
        })}
      </Svg>
      <FadeIn
        start={cues.s(9, 0.6)}
        style={{
          position: "absolute",
          top: 790,
          left: 780,
          width: 1000,
          textAlign: "right",
        }}
      >
        <div style={{ ...textStyle(26, 300), color: COLORS.warm }}>
          Les poids restent en mémoire pour traiter de nombreuses demandes
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 6 — De ta question à la réponse : étapes 1 et 2.
export const S06: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(1)}>
        <Overview />
      </Stage>
      <Stage from={cues.s(1)} to={cues.s(6)}>
        <Tokens />
      </Stage>
      <Stage from={cues.s(6)}>
        <Memory />
      </Stage>
    </AbsoluteFill>
  );
};
