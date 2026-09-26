import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { IconName, circlePath, roundRectPath } from "../components/icons";
import { Icon, Link, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import { Pos, small } from "./S33";

// L'annonce stylisée au centre.
const CARD = { x: 770, y: 320, w: 380, h: 340 };

const Announcement: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const o = progress(frame, start + 10, 0.6);
  return (
    <AbsoluteFill>
      <Svg>
        <path
          d={roundRectPath(CARD.x, CARD.y, CARD.w, CARD.h, 16)}
          fill="#ffffff"
          fillOpacity={0.04 * o}
        />
        <DrawPath
          d={roundRectPath(CARD.x, CARD.y, CARD.w, CARD.h, 16)}
          start={start}
          duration={0.9}
          stroke={COLORS.ink}
          width={1.6}
        />
        {/* Lignes de texte factices */}
        {[0, 1, 2].map((i) => (
          <path
            key={i}
            d={`M ${CARD.x + 40} ${CARD.y + 250 + i * 24} H ${CARD.x + CARD.w - 40 - i * 60}`}
            stroke={COLORS.inkFaint}
            strokeWidth={6}
            strokeLinecap="round"
            opacity={progress(frame, start + 20 + i * 4, 0.5)}
          />
        ))}
      </Svg>
      <Pos
        start={start + 8}
        left={CARD.x}
        top={CARD.y + 34}
        width={CARD.w}
        align="center"
      >
        <div style={small()}>ANNONCE TECHNIQUE</div>
        <div
          style={{ ...textStyle(80, 200), color: COLORS.accent, marginTop: 14 }}
        >
          +30 %
        </div>
        <div style={{ ...textStyle(26, 300), marginTop: 4 }}>« de gain »</div>
      </Pos>
      <Pos
        start={start + 20}
        left={CARD.x}
        top={CARD.y + CARD.h + 14}
        width={CARD.w}
        align="center"
      >
        <div style={{ ...textStyle(22, 300), color: COLORS.inkSoft }}>
          annonce fictive
        </div>
      </Pos>
    </AbsoluteFill>
  );
};

type Q = {
  side: "l" | "r";
  top: number;
  text: string;
  chips: { t: string; at: number }[];
  arrows?: boolean;
};

const QS: Q[] = [
  {
    side: "l",
    top: 225,
    text: "Le gain porte-t-il sur…",
    chips: [
      { t: "la puissance", at: 1.8 },
      { t: "l’énergie", at: 2.5 },
      { t: "la vitesse", at: 3.2 },
      { t: "la densité", at: 3.9 },
      { t: "le coût ?", at: 4.6 },
    ],
  },
  {
    side: "r",
    top: 285,
    text: "Quelles grandeurs sont maintenues constantes pendant la comparaison ?",
    chips: [],
  },
  {
    side: "l",
    top: 470,
    text: "Que mesure-t-on ?",
    chips: [
      { t: "un transistor", at: 2.4 },
      { t: "un circuit test", at: 3.3 },
      { t: "une puce livrée", at: 4.2 },
      { t: "une application", at: 5.1 },
    ],
    arrows: true,
  },
  {
    side: "r",
    top: 470,
    text: "Le gain inclut-il…",
    chips: [
      { t: "les fuites", at: 2.2 },
      { t: "les mémoires", at: 3 },
      { t: "les interconnexions", at: 3.8 },
      { t: "le refroidissement ?", at: 4.8 },
    ],
  },
  {
    side: "l",
    top: 690,
    text: "Le produit est-il…",
    chips: [
      { t: "démontré", at: 2.2 },
      { t: "qualifié", at: 3 },
      { t: "produit en volume, rendement rentable ?", at: 4 },
    ],
    arrows: true,
  },
];

const QW = 560;
const qx = (q: Q) => (q.side === "l" ? 140 : 1220);

const Questions: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const current = QS.reduce(
    (acc, _, i) => (frame >= cues.s(i + 1) ? i : acc),
    -1,
  );
  return (
    <AbsoluteFill>
      <Announcement start={cues.s(0, 0.8)} />
      <Svg>
        {QS.map((q, i) => {
          const t = cues.s(i + 1);
          const y = q.top + 20;
          const from: [number, number] =
            q.side === "l" ? [qx(q) + QW - 10, y] : [qx(q) + 10, y];
          const cy = Math.min(Math.max(y, CARD.y + 30), CARD.y + CARD.h - 30);
          const to: [number, number] =
            q.side === "l" ? [CARD.x, cy] : [CARD.x + CARD.w, cy];
          const active = i === current;
          return (
            <g key={i}>
              <DrawPath
                d={`M ${from[0]} ${from[1]} C ${(from[0] + to[0]) / 2} ${from[1]} ${(from[0] + to[0]) / 2} ${to[1]} ${to[0]} ${to[1]}`}
                start={t}
                duration={0.8}
                stroke={active ? COLORS.accent : COLORS.inkFaint}
                width={1.4}
              />
              <path
                d={circlePath(to[0], to[1], 5)}
                fill={active ? COLORS.accent : COLORS.inkSoft}
                opacity={progress(frame, t + 20, 0.3)}
              />
            </g>
          );
        })}
      </Svg>
      {QS.map((q, i) => {
        const t = cues.s(i + 1);
        const active = i === current;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: qx(q),
              top: q.top,
              width: QW,
              opacity: active ? 1 : 0.55,
              textAlign: q.side === "l" ? "right" : "left",
            }}
          >
            <FadeIn start={t} rise={8}>
              <div style={small(COLORS.accent)}>
                QUESTION {String(i + 1).padStart(2, "0")}
              </div>
              <div
                style={{
                  ...textStyle(30, active ? 400 : 300),
                  lineHeight: 1.3,
                  marginTop: 6,
                }}
              >
                {q.text}
              </div>
            </FadeIn>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px 10px",
                marginTop: 12,
                justifyContent: q.side === "l" ? "flex-end" : "flex-start",
                alignItems: "center",
              }}
            >
              {q.chips.map((c, k) => (
                <React.Fragment key={c.t}>
                  {q.arrows && k > 0 && (
                    <FadeIn start={t + FPS * c.at - 4} rise={0}>
                      <span
                        style={{ ...textStyle(22, 300), color: COLORS.inkSoft }}
                      >
                        →
                      </span>
                    </FadeIn>
                  )}
                  <FadeIn start={t + FPS * c.at} rise={6}>
                    <span
                      style={{
                        ...textStyle(22, 400),
                        color: COLORS.ink,
                        border: `1.4px solid ${COLORS.inkSoft}`,
                        borderRadius: 999,
                        padding: "4px 14px",
                        display: "inline-block",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.t}
                    </span>
                  </FadeIn>
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Point analyste : de la brique physique au service vendu.
const CHAIN: { label: string; icon: IconName }[] = [
  { label: "transistor", icon: "chip" },
  { label: "circuit", icon: "network" },
  { label: "puce", icon: "memory" },
  { label: "système", icon: "rack" },
  { label: "service vendu", icon: "cloud" },
];
const UNITS = [
  { t: "coût par tâche", at: 3.8 },
  { t: "coût par token", at: 5 },
  { t: "coût par heure de calcul utile", at: 6.2 },
];

const Analyst: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t7 = cues.s(7);
  const t8 = cues.s(8);
  const y = 430;
  const w = 220;
  const gap = 90;
  const x0 = (1920 - (5 * w + 4 * gap)) / 2;
  const xs = CHAIN.map((_, i) => x0 + i * (w + gap));
  const h = 120;
  // Reconstruction : une impulsion part du transistor vers le service.
  const run = progress(frame, t8 + FPS * 0.6, 2.2);
  const px = xs[0] + w / 2 + (xs[4] - xs[0]) * run;
  return (
    <AbsoluteFill>
      <Pos start={cues.s(6)} left={140} top={200} width={1640} align="center">
        <div style={small(COLORS.warm)}>POINT ANALYSTE</div>
      </Pos>
      <Pos start={t7} left={140} top={244} width={1640} align="center">
        <div style={textStyle(38, 200)}>
          La bonne unité finale est celle du{" "}
          <span style={{ color: COLORS.warm }}>service vendu</span>
        </div>
      </Pos>
      <Svg>
        {CHAIN.map((c, i) => {
          const at = t7 + FPS * (0.4 + i * 0.4);
          const last = i === CHAIN.length - 1;
          return (
            <g key={c.label}>
              <path
                d={roundRectPath(xs[i], y, w, h, 14)}
                fill={last ? COLORS.warm : "#ffffff"}
                fillOpacity={(last ? 0.1 : 0.04) * progress(frame, at + 8, 0.5)}
              />
              <DrawPath
                d={roundRectPath(xs[i], y, w, h, 14)}
                start={at}
                duration={0.6}
                stroke={last ? COLORS.warm : COLORS.inkSoft}
                width={last ? 2 : 1.4}
              />
              <Icon
                name={c.icon}
                x={xs[i] + w / 2}
                y={y + 42}
                size={20}
                start={at + 6}
                color={last ? COLORS.warm : COLORS.accent}
              />
              <SvgText
                x={xs[i] + w / 2}
                y={y + 90}
                text={c.label}
                start={at + 8}
                size={26}
                weight={last ? 400 : 300}
              />
              {i < CHAIN.length - 1 && (
                <Link
                  from={[xs[i] + w, y + h / 2]}
                  to={[xs[i + 1], y + h / 2]}
                  start={at + 10}
                  gap={8}
                />
              )}
            </g>
          );
        })}
        {run > 0 && run < 1 && (
          <path
            d={circlePath(px, y + h + 30, 8)}
            fill={COLORS.accent}
            opacity={Math.sin(run * Math.PI)}
          />
        )}
        <DrawPath
          d={`M ${xs[0] + w / 2} ${y + h + 30} H ${xs[4] + w / 2}`}
          start={t8 + FPS * 0.6}
          duration={2.2}
          stroke={COLORS.accent}
          width={1.4}
        />
      </Svg>
      {/* Unités du service vendu */}
      <div
        style={{
          position: "absolute",
          top: 620,
          left: 140,
          width: 1640,
          display: "flex",
          justifyContent: "center",
          gap: 22,
        }}
      >
        {UNITS.map((u) => (
          <FadeIn key={u.t} start={t7 + FPS * u.at} rise={8}>
            <span
              style={{
                ...textStyle(28, 400),
                color: COLORS.warm,
                border: `1.5px solid ${COLORS.warm}`,
                borderRadius: 999,
                padding: "8px 24px",
                display: "inline-block",
              }}
            >
              {u.t}
            </span>
          </FadeIn>
        ))}
      </div>
      <Pos
        start={t7 + FPS * 8}
        left={140}
        top={694}
        width={1640}
        align="center"
      >
        <div style={{ ...textStyle(28, 300) }}>
          avec des{" "}
          <span style={{ color: COLORS.warm }}>
            contraintes de qualité explicites
          </span>
        </div>
      </Pos>
      <Pos start={t8} left={140} top={770} width={1640} align="center">
        <div style={{ ...textStyle(30, 300), color: COLORS.accent }}>
          Le transistor est un point de départ pour reconstruire ce résultat
        </div>
      </Pos>
    </AbsoluteFill>
  );
};

// Scène 43 — Les questions à poser à une annonce technique.
export const S43: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(6)}>
        <Title
          text="Les questions à poser à une annonce technique"
          start={cues.s(0)}
          top={105}
        />
        <Questions />
      </Stage>
      <Stage from={cues.s(6)}>
        <Analyst />
      </Stage>
    </AbsoluteFill>
  );
};
