import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Svg, SvgText, Title } from "../components/kit";
import {
  Counter,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

const X0 = 260;
const X1 = 1220;
const Y0 = 780;
const YT = 300;
const px = (t: number) => X0 + (t / 10) * (X1 - X0);
const py = (p: number) => Y0 - (p / 4) * (Y0 - YT);

const Axes: React.FC<{ start: number }> = ({ start }) => (
  <g>
    <DrawPath
      d={`M ${X0} ${YT - 20} V ${Y0} H ${X1 + 30}`}
      start={start}
      duration={0.8}
      stroke={COLORS.inkSoft}
      width={1.5}
    />
    <SvgText
      x={X0 - 16}
      y={YT}
      text="puissance"
      start={start + 6}
      size={24}
      anchor="end"
      color={COLORS.inkSoft}
    />
    <SvgText
      x={X1 + 30}
      y={Y0 + 36}
      text="temps"
      start={start + 6}
      size={24}
      anchor="end"
      color={COLORS.inkSoft}
    />
  </g>
);

// Beat 0 : la puissance est une hauteur, l'énergie une aire.
const pw = (t: number) =>
  1.6 + 0.8 * Math.sin(t * 1.3) + 0.4 * Math.sin(t * 3.1 + 1);
const Area: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const u = progress(frame, t + 30, 4) * 10;
  const pts = new Array(101).fill(0).map((_, k) => [k / 10, pw(k / 10)]);
  const line = pts
    .map(([a, b], k) => `${k ? "L" : "M"} ${px(a)} ${py(b)}`)
    .join(" ");
  const shown = pts.filter(([a]) => a <= u);
  const area =
    shown.length > 1
      ? `M ${px(0)} ${Y0} ${shown.map(([a, b]) => `L ${px(a)} ${py(b)}`).join(" ")} L ${px(u)} ${py(pw(u))} L ${px(u)} ${Y0} Z`
      : "";
  const energy = shown.reduce((s, [, b]) => s + b * 0.1, 0);
  return (
    <AbsoluteFill>
      <Svg>
        <Axes start={t} />
        <DrawPath
          d={line}
          start={t + 10}
          duration={1.5}
          stroke={COLORS.ink}
          width={2.5}
        />
        {area && <path d={area} fill={COLORS.accent} opacity={0.25} />}
        {u > 0 && u < 10 && (
          <path
            d={`M ${px(u)} ${YT} V ${Y0}`}
            stroke={COLORS.inkSoft}
            strokeWidth={1}
            strokeDasharray="4 6"
          />
        )}
      </Svg>
      <div style={{ position: "absolute", left: 1330, top: 330, width: 450 }}>
        <FadeIn start={t + 10}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.ink,
              letterSpacing: "0.28em",
            }}
          >
            PUISSANCE
          </div>
          <div
            style={{ ...textStyle(30, 300), marginTop: 10, lineHeight: 1.35 }}
          >
            un rythme : la <span style={{ color: COLORS.ink }}>hauteur</span> de
            la courbe, en watts
          </div>
        </FadeIn>
        <FadeIn start={t + 40} style={{ marginTop: 40 }}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.accent,
              letterSpacing: "0.28em",
            }}
          >
            ÉNERGIE
          </div>
          <div
            style={{ ...textStyle(30, 300), marginTop: 10, lineHeight: 1.35 }}
          >
            le cumul : l’<span style={{ color: COLORS.accent }}>aire</span> sous
            la courbe, en joules
          </div>
          <div
            style={{
              ...textStyle(48, 200),
              color: COLORS.accent,
              marginTop: 16,
            }}
          >
            {energy.toLocaleString("fr-FR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}{" "}
            J
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// Beat 1 : A puissant et rapide, B sobre et lent.
const Race: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(1);
  const run = progress(frame, t + 30, 4.5) * 8;
  const A = { p: 3, d: 2 };
  const B = { p: 1, d: 8 };
  const wA = Math.min(run, A.d);
  const wB = Math.min(run, B.d);
  return (
    <AbsoluteFill>
      <Svg>
        <Axes start={t} />
        {wB > 0 && (
          <rect
            x={px(0)}
            y={py(B.p)}
            width={px(wB) - px(0)}
            height={Y0 - py(B.p)}
            fill={COLORS.warm}
            opacity={0.22}
            stroke={COLORS.warm}
            strokeWidth={2}
          />
        )}
        {wA > 0 && (
          <rect
            x={px(0)}
            y={py(A.p)}
            width={px(wA) - px(0)}
            height={Y0 - py(A.p)}
            fill={COLORS.accent}
            opacity={0.3}
            stroke={COLORS.accent}
            strokeWidth={2}
          />
        )}
        <SvgText
          x={px(1)}
          y={py(A.p) - 28}
          text="A : 3 W"
          start={t + 30}
          size={26}
          color={COLORS.accent}
        />
        <SvgText
          x={px(5)}
          y={py(B.p) - 28}
          text="B : 1 W"
          start={t + 30}
          size={26}
          color={COLORS.warm}
        />
        <SvgText
          x={px(2)}
          y={Y0 + 36}
          text="2 s"
          start={t + 70}
          size={22}
          color={COLORS.accent}
        />
        <SvgText
          x={px(8)}
          y={Y0 + 36}
          text="8 s"
          start={t + 165}
          size={22}
          color={COLORS.warm}
        />
      </Svg>
      <div style={{ position: "absolute", left: 1330, top: 330, width: 450 }}>
        <FadeIn start={t + 70}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.accent,
              letterSpacing: "0.28em",
            }}
          >
            CIRCUIT A
          </div>
          <div style={{ ...textStyle(30, 300), marginTop: 8 }}>
            3 W × 2 s ={" "}
            <Counter
              to={6}
              start={t + 70}
              duration={0.8}
              style={{ color: COLORS.accent }}
            />{" "}
            J
          </div>
        </FadeIn>
        <FadeIn start={t + 165} style={{ marginTop: 30 }}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.warm,
              letterSpacing: "0.28em",
            }}
          >
            CIRCUIT B
          </div>
          <div style={{ ...textStyle(30, 300), marginTop: 8 }}>
            1 W × 8 s ={" "}
            <Counter
              to={8}
              start={t + 165}
              duration={0.8}
              style={{ color: COLORS.warm }}
            />{" "}
            J
          </div>
        </FadeIn>
        <FadeIn start={t + 185} style={{ marginTop: 30 }}>
          <div style={{ ...textStyle(28, 300), lineHeight: 1.35 }}>
            A, plus puissant, consomme{" "}
            <span style={{ color: COLORS.accent }}>moins d’énergie</span> pour
            la tâche
          </div>
        </FadeIn>
        <FadeIn start={cues.s(3)} style={{ marginTop: 36 }}>
          <div
            style={{ borderLeft: `2px solid ${COLORS.warm}`, paddingLeft: 24 }}
          >
            <div
              style={{
                ...textStyle(22, 500),
                color: COLORS.warm,
                letterSpacing: "0.28em",
              }}
            >
              CONDITION
            </div>
            <div
              style={{ ...textStyle(28, 300), marginTop: 8, lineHeight: 1.35 }}
            >
              même travail, même qualité de résultat
            </div>
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// Beats 2 et 3 : point analyste.
const LEVELS = ["transistor", "bloc", "puce", "système"];
const CONDS = ["à fréquence fixe", "à puissance fixe", "à surface fixe"];
const Analyst: React.FC = () => {
  const cues = useCues();
  const chip = (text: string, start: number) => (
    <FadeIn key={text} start={start} rise={8}>
      <span
        style={{
          ...textStyle(30, 300),
          border: `1.5px solid ${COLORS.warm}`,
          borderRadius: 999,
          padding: "12px 32px",
        }}
      >
        {text}
      </span>
    </FadeIn>
  );
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 230, left: 300, width: 1320 }}>
        <div
          style={{
            borderLeft: `2px solid ${COLORS.warm}`,
            paddingLeft: 56,
            paddingTop: 10,
            paddingBottom: 20,
          }}
        >
          <FadeIn start={cues.s(4)}>
            <div
              style={{
                ...textStyle(22, 500),
                color: COLORS.warm,
                letterSpacing: "0.3em",
              }}
            >
              POINT ANALYSTE
            </div>
            <div style={{ ...textStyle(40, 200), marginTop: 14 }}>
              Face à une annonce de gain, demande :
            </div>
          </FadeIn>
          <FadeIn start={cues.s(5)} style={{ marginTop: 50 }}>
            <div style={{ ...textStyle(30, 300), color: COLORS.inkSoft }}>
              1. À quel niveau ?
            </div>
          </FadeIn>
          <div
            style={{
              display: "flex",
              gap: 22,
              marginTop: 26,
              alignItems: "center",
            }}
          >
            {LEVELS.map((l, i) => (
              <React.Fragment key={l}>
                {chip(l, cues.s(5, 1.2 + i * 0.8))}
                {i < LEVELS.length - 1 && (
                  <FadeIn start={cues.s(5, 1.6 + i * 0.8)}>
                    <span
                      style={{ ...textStyle(26, 300), color: COLORS.inkSoft }}
                    >
                      ⊂
                    </span>
                  </FadeIn>
                )}
              </React.Fragment>
            ))}
          </div>
          <FadeIn start={cues.s(6)} style={{ marginTop: 60 }}>
            <div style={{ ...textStyle(30, 300), color: COLORS.inkSoft }}>
              2. Dans quelles conditions ?
            </div>
          </FadeIn>
          <div style={{ display: "flex", gap: 26, marginTop: 26 }}>
            {CONDS.map((c, i) => chip(c, cues.s(6, 1.2 + i * 0.9)))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// Scène 22 — Énergie et puissance.
export const S22: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(1)}>
        <Title
          kicker="Pourquoi commuter consomme"
          text="Énergie et puissance"
          start={cues.s(0)}
          top={100}
        />
        <Area />
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(2)}>
        <Title
          kicker="Exemple illustratif"
          text="Plus puissant, mais moins d’énergie"
          start={cues.beat(1)}
          top={100}
        />
        <Race />
      </Stage>
      <Stage from={cues.beat(2)}>
        <Analyst />
      </Stage>
    </AbsoluteFill>
  );
};
