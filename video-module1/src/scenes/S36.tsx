import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { IconName, circlePath, roundRectPath } from "../components/icons";
import { Icon, Link, Svg, SvgText, Title } from "../components/kit";
import {
  Counter,
  DrawPath,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import { Eq, Pos, Takeaway, small } from "./S33";

// Le procédé s'allonge : 5 étapes, puis 8 avec des étapes, mesures et équipements en plus.
const STEPS: { label: string; slot: number; add?: boolean }[] = [
  { label: "dépôt", slot: 0 },
  { label: "lithographie", slot: 1 },
  { label: "+ étape", slot: 2, add: true },
  { label: "gravure", slot: 3 },
  { label: "+ mesure", slot: 4, add: true },
  { label: "dopage", slot: 5 },
  { label: "+ équipement", slot: 6, add: true },
  { label: "nettoyage", slot: 7 },
];

const Process: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(0, 0.8);
  const grow = cues.s(1, 0.9);
  const p = progress(frame, grow, 1.4);
  const pitch = 200;
  const w = 172;
  const h = 84;
  const y = 430;
  const base = STEPS.filter((s) => !s.add);
  return (
    <AbsoluteFill>
      <Svg>
        {STEPS.map((s) => {
          const baseIdx = base.indexOf(s);
          const x0 = 960 + (baseIdx - 2) * pitch;
          const x1 = 960 + (s.slot - 3.5) * pitch;
          const x = s.add ? x1 : x0 + (x1 - x0) * p;
          const at = s.add
            ? grow + FPS * (1.6 + 1.0 * STEPS.filter((o) => o.add).indexOf(s))
            : t + baseIdx * 6;
          const o = progress(frame, at, 0.6);
          if (o === 0) return null;
          const color = s.add ? COLORS.accent : COLORS.inkSoft;
          return (
            <g key={s.label} opacity={o}>
              <path
                d={roundRectPath(x - w / 2, y, w, h, 10)}
                fill={s.add ? COLORS.accent : "#ffffff"}
                fillOpacity={s.add ? 0.12 : 0.04}
                stroke={color}
                strokeWidth={s.add ? 2 : 1.4}
              />
              <text
                x={x}
                y={y + h / 2 + 8}
                textAnchor="middle"
                fontFamily={textStyle(24).fontFamily}
                fontSize={24}
                fontWeight={s.add ? 400 : 300}
                fill={s.add ? COLORS.accent : COLORS.ink}
              >
                {s.label}
              </text>
            </g>
          );
        })}
        <DrawPath
          d={`M ${960 - 3.5 * pitch - w / 2} ${y + h + 50} H ${960 + 3.5 * pitch + w / 2}`}
          start={grow + FPS * 1.2}
          duration={1.2}
          stroke={COLORS.inkFaint}
          width={1.4}
        />
      </Svg>
      <Pos start={t} left={0} top={320} width={1920} align="center">
        <div style={small()}>
          PROCÉDÉ ·{" "}
          <span style={{ color: COLORS.ink }}>
            <Counter from={5} to={8} start={grow} duration={2.6} />
          </span>{" "}
          ÉTAPES
        </div>
      </Pos>
      <Pos
        start={grow + FPS * 2}
        left={0}
        top={600}
        width={1920}
        align="center"
      >
        <div style={textStyle(32, 300)}>
          Un procédé plus exigeant peut demander davantage{" "}
          <span style={{ color: COLORS.accent }}>
            d’étapes, de mesures ou d’équipements
          </span>
        </div>
      </Pos>
    </AbsoluteFill>
  );
};

// Le revenu du fournisseur dépend de plusieurs facteurs.
const CX = 1060;
const CY = 480;
const FACTORS: {
  label: string;
  x: number;
  y: number;
  at: number;
  icon: IconName;
}[] = [
  { label: "machines achetées", x: 1060, y: 250, at: 3.6, icon: "factory" },
  { label: "prix", x: 1520, y: 350, at: 5, icon: "euro" },
  { label: "productivité", x: 1540, y: 620, at: 6, icon: "gear" },
  { label: "services", x: 1260, y: 760, at: 7.2, icon: "person" },
  { label: "part de marché", x: 820, y: 760, at: 8.2, icon: "chart" },
];

const Revenue: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(2);
  const t3 = cues.s(3);
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={circlePath(CX, CY, 96)}
          start={t}
          duration={1}
          stroke={COLORS.accent}
          width={2}
        />
        <Icon
          name="euro"
          x={CX}
          y={CY - 30}
          size={24}
          start={t + 10}
          color={COLORS.accent}
        />
        <SvgText
          x={CX}
          y={CY + 30}
          text={"revenu du\nfournisseur"}
          start={t + 14}
          size={24}
          weight={400}
        />
        {FACTORS.map((f) => {
          const at = t + FPS * f.at;
          const d = Math.hypot(f.x - CX, f.y - CY);
          const ux = (f.x - CX) / d;
          const uy = (f.y - CY) / d;
          return (
            <g key={f.label}>
              <Link
                from={[f.x - ux * 60, f.y - uy * 60]}
                to={[CX + ux * 100, CY + uy * 100]}
                start={at}
                color={COLORS.accent}
              />
              <Icon
                name={f.icon}
                x={f.x}
                y={f.y - 14}
                size={22}
                start={at}
                color={COLORS.ink}
              />
              <SvgText
                x={f.x}
                y={f.y + 34}
                text={f.label}
                start={at + 6}
                size={26}
                weight={300}
              />
            </g>
          );
        })}
        {/* La complexité seule : un lien en pointillés, insuffisant. */}
        <SvgText
          x={430}
          y={450}
          text={"procédé\nplus complexe"}
          start={t + 6}
          size={28}
          weight={300}
          color={COLORS.inkSoft}
        />
        <path
          d={`M 560 470 L ${CX - 110} ${CY}`}
          stroke={COLORS.inkSoft}
          strokeWidth={1.6}
          strokeDasharray="8 10"
          opacity={progress(frame, t + 12, 0.6)}
        />
        <DrawPath
          d={`M ${(560 + CX - 110) / 2 - 24} ${(470 + CY) / 2 - 24} L ${(560 + CX - 110) / 2 + 24} ${(470 + CY) / 2 + 24} M ${(560 + CX - 110) / 2 + 24} ${(470 + CY) / 2 - 24} L ${(560 + CX - 110) / 2 - 24} ${(470 + CY) / 2 + 24}`}
          start={t3 + 10}
          duration={0.5}
          stroke={COLORS.warm}
          width={2.4}
        />
      </Svg>
      <Takeaway
        start={t3}
        left={180}
        top={610}
        width={520}
        label="ATTENTION"
        color={COLORS.warm}
        size={28}
      >
        « Plus complexe » ne suffit pas à calculer une croissance.
      </Takeaway>
    </AbsoluteFill>
  );
};

// Revenus d'équipements ≈ unités vendues × prix moyen + services.
const Formula: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(4);
  const bx = 360;
  const bw = 1200;
  const split = 0.78;
  const a = progress(frame, t + FPS * 3.6, 1);
  const b = progress(frame, t + FPS * 5.2, 0.8);
  return (
    <AbsoluteFill>
      <Eq
        y={300}
        size={48}
        parts={[
          { node: "Revenus d’équipements", at: t, soft: true },
          { node: "≈", at: t + FPS * 1.8, op: true },
          { node: "unités vendues", at: t + FPS * 2.4 },
          { node: "×", at: t + FPS * 3.2, op: true },
          { node: "prix moyen", at: t + FPS * 3.6, hi: true },
          { node: "+", at: t + FPS * 4.8, op: true },
          { node: "services", at: t + FPS * 5.2 },
        ]}
      />
      <Svg>
        {a > 0 && (
          <path
            d={roundRectPath(bx, 460, (bw * split - 8) * a, 100, 10)}
            fill={COLORS.accent}
            fillOpacity={0.18}
            stroke={COLORS.accent}
            strokeWidth={2}
          />
        )}
        {b > 0 && (
          <path
            d={roundRectPath(
              bx + bw * split,
              460,
              bw * (1 - split) * b,
              100,
              10,
            )}
            fill="#ffffff"
            fillOpacity={0.06}
            stroke={COLORS.ink}
            strokeWidth={1.6}
          />
        )}
        <SvgText
          x={bx + (bw * split) / 2}
          y={510}
          text="unités vendues × prix moyen"
          start={t + FPS * 4}
          size={28}
          weight={300}
        />
        <SvgText
          x={bx + bw * split + (bw * (1 - split)) / 2}
          y={510}
          text="services"
          start={t + FPS * 5.4}
          size={28}
          weight={300}
        />
        <SvgText
          x={bx + (bw * split) / 2}
          y={600}
          text="une machine plus productive peut réduire le nombre d’unités"
          start={t + FPS * 4.4}
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={bx + bw * split + (bw * (1 - split)) / 2}
          y={600}
          text="maintenance, pièces…"
          start={t + FPS * 5.8}
          size={22}
          color={COLORS.inkSoft}
        />
      </Svg>
      <Pos start={t + FPS * 5.8} left={0} top={680} width={1920} align="center">
        <div style={{ ...textStyle(26, 300), color: COLORS.inkSoft }}>
          ≈ : une approximation, chaque terme se suit séparément
        </div>
      </Pos>
    </AbsoluteFill>
  );
};

// Feuille de route : les prochains modules.
const ROAD: {
  x: number;
  icon: IconName;
  kicker: string;
  text: string;
  at: (c: ReturnType<typeof useCues>) => number;
  here?: boolean;
}[] = [
  {
    x: 330,
    icon: "chip",
    kicker: "MODULE 1 · ICI",
    text: "le transistor",
    at: (c) => c.s(5),
    here: true,
  },
  {
    x: 750,
    icon: "wafer",
    kicker: "MODULE 2",
    text: "de la matière\nau wafer",
    at: (c) => c.s(5, 1.4),
  },
  {
    x: 1170,
    icon: "factory",
    kicker: "MODULE FABRICATION",
    text: "des besoins physiques\naux outils utilisés",
    at: (c) => c.s(6, 0.4),
  },
  {
    x: 1590,
    icon: "chart",
    kicker: "MODULE FONDERIES",
    text: "rendements\net coûts",
    at: (c) => c.s(6, 4.4),
  },
];

const Roadmap: React.FC = () => {
  const cues = useCues();
  const y = 440;
  return (
    <AbsoluteFill>
      <Svg>
        {ROAD.map((r, i) => {
          const at = r.at(cues);
          return (
            <g key={r.kicker}>
              {i > 0 && (
                <Link
                  from={[ROAD[i - 1].x + 80, y]}
                  to={[r.x - 80, y]}
                  start={at - 6}
                  color={COLORS.inkSoft}
                />
              )}
              <DrawPath
                d={circlePath(r.x, y, 72)}
                start={at}
                duration={0.8}
                stroke={r.here ? COLORS.inkSoft : COLORS.accent}
                width={r.here ? 1.4 : 2}
              />
              <Icon
                name={r.icon}
                x={r.x}
                y={y}
                size={32}
                start={at + 8}
                color={r.here ? COLORS.inkSoft : COLORS.accent}
              />
              <SvgText
                x={r.x}
                y={y + 124}
                text={r.kicker}
                start={at + 10}
                size={22}
                weight={500}
                spacing="0.18em"
                color={r.here ? COLORS.inkSoft : COLORS.accent}
              />
              <SvgText
                x={r.x}
                y={y + 190}
                text={r.text}
                start={at + 16}
                size={28}
                weight={300}
              />
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

// Scène 36 — Du transistor au contenu fournisseur.
export const S36: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const titleOut = interpolate(frame, [cues.s(5) - 12, cues.s(5)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <div style={{ opacity: titleOut }}>
        <Title
          text="Du transistor au contenu fournisseur"
          start={cues.s(0)}
          top={105}
        />
      </div>
      <Stage from={0} to={cues.s(2, 0.6)}>
        <Process />
      </Stage>
      <Stage from={cues.s(2, 0.6)} to={cues.s(4)}>
        <Revenue />
      </Stage>
      <Stage from={cues.s(4)} to={cues.s(5)}>
        <Formula />
      </Stage>
      <Stage from={cues.s(5)}>
        <Title text="La suite du parcours" start={cues.s(5)} top={105} />
        <Roadmap />
      </Stage>
    </AbsoluteFill>
  );
};
