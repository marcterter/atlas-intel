import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Box, Icon, Link, Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT, FPS } from "../theme";

const X0 = 420;
const X1 = 1560;
const ROW_H = 86;
const rowY = (i: number) => 240 + i * 118;

// Une couche de la chaîne : étiquette à gauche, cadre, contenu.
const Layer: React.FC<{
  i: number;
  tag: string;
  start: number;
  hi?: boolean;
  children?: React.ReactNode;
}> = ({ i, tag, start, hi, children }) => {
  const frame = useCurrentFrame();
  const y = rowY(i);
  const color = hi ? COLORS.accent : COLORS.inkSoft;
  return (
    <g>
      <path
        d={roundRectPath(X0, y, X1 - X0, ROW_H, 12)}
        fill={hi ? COLORS.accent : "#ffffff"}
        opacity={0.05 * progress(frame, start + 8, 0.6)}
      />
      <DrawPath
        d={roundRectPath(X0, y, X1 - X0, ROW_H, 12)}
        start={start}
        duration={0.8}
        stroke={color}
        width={hi ? 2 : 1.4}
      />
      <SvgText
        x={X0 - 30}
        y={y + ROW_H / 2}
        text={tag}
        start={start + 4}
        size={22}
        weight={500}
        spacing="0.2em"
        anchor="end"
        color={hi ? COLORS.accent : COLORS.inkSoft}
      />
      {i > 0 && (
        <Arrow
          x1={960}
          y1={y - 30}
          x2={960}
          y2={y - 4}
          start={start - 4}
          duration={0.4}
          stroke={COLORS.inkSoft}
        />
      )}
      {children}
    </g>
  );
};

const FACTORS = ["V", "C", "α", "f", "fuites"];

const Chain: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t2 = cues.s(2);
  const t3 = cues.s(3);
  const t4 = cues.s(4);
  const t5 = cues.s(4, 3.2);
  const cy = (i: number) => rowY(i) + ROW_H / 2;
  const tt = (frame - t2) / FPS;
  return (
    <AbsoluteFill>
      <Title text="Résumé investisseur" start={0} top={120} />
      <Svg>
        <Layer i={0} tag="TRANSISTOR" start={cues.s(1)}>
          <SvgText
            x={760}
            y={cy(0)}
            text="Commande électrique"
            start={cues.s(1, 0.4)}
            size={30}
          />
          <Arrow
            x1={930}
            y1={cy(0)}
            x2={1060}
            y2={cy(0)}
            start={cues.s(1, 1.4)}
            stroke={COLORS.accent}
          />
          <SvgText
            x={1270}
            y={cy(0)}
            text="contrôle d’un courant"
            start={cues.s(1, 1.8)}
            size={30}
            color={COLORS.accent}
          />
        </Layer>
        <Layer i={1} tag="CIRCUITS" start={t2}>
          <SvgText
            x={820}
            y={cy(1)}
            text="Logique CMOS : on déplace des charges"
            start={t2 + 8}
            size={30}
          />
          {new Array(6).fill(0).map((_, k) => {
            const p = (tt / 2 + k / 6) % 1;
            return (
              <circle
                key={k}
                cx={1240 + p * 260}
                cy={cy(1)}
                r={6}
                fill={COLORS.accent}
                opacity={progress(frame, t2 + 20, 0.5) * Math.sin(Math.PI * p)}
              />
            );
          })}
        </Layer>
        <Layer i={2} tag="ÉNERGIE" start={t3}>
          <SvgText
            x={640}
            y={cy(2)}
            text="Budget électrique"
            start={t3 + 8}
            size={30}
          />
          {FACTORS.map((f, k) => {
            const x = 850 + k * 108;
            const at = cues.s(3, 1.2 + k * 0.9);
            return (
              <g key={f}>
                <DrawPath
                  d={roundRectPath(
                    x,
                    cy(2) - 26,
                    f.length > 2 ? 110 : 64,
                    52,
                    26,
                  )}
                  start={at}
                  duration={0.4}
                  stroke={COLORS.warm}
                  width={1.5}
                />
                <SvgText
                  x={x + (f.length > 2 ? 55 : 32)}
                  y={cy(2)}
                  text={f}
                  start={at + 4}
                  size={28}
                  color={COLORS.warm}
                />
              </g>
            );
          })}
          <SvgText
            x={1540}
            y={cy(2)}
            text="(une partie)"
            start={cues.s(3, 6)}
            size={22}
            anchor="end"
            color={COLORS.inkSoft}
          />
        </Layer>
        <Layer i={3} tag="FABRICATION" start={t4}>
          <SvgText
            x={960}
            y={cy(3)}
            text="Rendement et coût de fabrication"
            start={t4 + 8}
            size={30}
          />
        </Layer>
        <Layer i={4} tag="ÉCONOMIE" start={t5} hi>
          <SvgText
            x={960}
            y={cy(4)}
            text="Le progrès est-il exploitable économiquement ?"
            start={t5 + 8}
            size={30}
            color={COLORS.accent}
          />
        </Layer>
      </Svg>
    </AbsoluteFill>
  );
};

// Trois affirmations à ne pas confondre, puis la démarche d'analyse.
const Lesson: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(5);
  const d = cues.s(6);
  const items = [
    { text: "+ de transistors", at: t + 6 },
    { text: "+ de travail utile", at: cues.s(5, 2.2) },
    { text: "− de coût", at: cues.s(5, 4) },
  ];
  const w = 400;
  const gap = 140;
  const x0 = 960 - (3 * w + 2 * gap) / 2;
  return (
    <AbsoluteFill>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 170,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.warm,
            letterSpacing: "0.3em",
          }}
        >
          AUCUNE GARANTIE AUTOMATIQUE
        </div>
      </FadeIn>
      <Svg>
        {items.map((it, i) => {
          const x = x0 + i * (w + gap);
          return (
            <g key={it.text}>
              <Box
                x={x}
                y={240}
                w={w}
                h={110}
                label={it.text}
                start={it.at}
                size={34}
                variant={i === 0 ? "hi" : "default"}
              />
              {i < 2 && (
                <text
                  x={x + w + gap / 2}
                  y={312}
                  textAnchor="middle"
                  fontFamily={FONT}
                  fontSize={60}
                  fontWeight={200}
                  fill={COLORS.warm}
                  opacity={progress(frame, items[i + 1].at, 0.5)}
                >
                  ≠
                </text>
              )}
            </g>
          );
        })}
        <Icon
          name="magnifier"
          x={960}
          y={470}
          size={30}
          start={d}
          color={COLORS.accent}
        />
        <Box
          x={260}
          y={560}
          w={600}
          h={140}
          label="Gain au niveau du système"
          sub="d’abord"
          start={d + 10}
          size={32}
          variant="hi"
        />
        <Link from={[860, 630]} to={[1060, 630]} start={cues.s(6, 2.4)} />
        <Box
          x={1060}
          y={560}
          w={600}
          h={140}
          label={"Part de valeur conservée"}
          sub="par chaque entreprise, ensuite"
          start={cues.s(6, 2.8)}
          size={32}
          variant="side"
        />
      </Svg>
      <FadeIn
        start={d}
        style={{
          position: "absolute",
          top: 510,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.inkSoft,
            letterSpacing: "0.3em",
          }}
        >
          LA DÉMARCHE
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 47 — Résumé investisseur : la chaîne causale, puis la démarche.
export const S47: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(5)}>
        <Chain />
      </Stage>
      <Stage from={cues.s(5)}>
        <Lesson />
      </Stage>
    </AbsoluteFill>
  );
};
