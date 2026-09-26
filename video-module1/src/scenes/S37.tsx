import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { circlePath, icons } from "../components/icons";
import { Callout, Svg, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import { FictiveTag, small } from "./S33";

// ——— Carte de la chaîne industrielle (partagée avec S38) ———

// Pictogrammes propres à la carte.
const extraIcons = {
  // Implantation : des flèches qui descendent dans une couche.
  doping: (x: number, y: number, s: number) =>
    [-0.6, 0, 0.6]
      .map(
        (k) =>
          `M ${x + k * s} ${y - s} V ${y + s * 0.2} M ${x + k * s - s * 0.2} ${y} L ${x + k * s} ${y + s * 0.2} L ${x + k * s + s * 0.2} ${y}`,
      )
      .join(" ") +
    ` M ${x - s} ${y + s * 0.5} H ${x + s} M ${x - s} ${y + s} H ${x + s}`,
};
export type MapIcon = keyof typeof icons | keyof typeof extraIcons;
const iconPath = (name: MapIcon, x: number, y: number, s: number) =>
  name in extraIcons
    ? extraIcons[name as keyof typeof extraIcons](x, y, s)
    : icons[name as keyof typeof icons](x, y, s);

export type MapRowDef = {
  icon: MapIcon;
  need: string;
  trade: string;
  // Acteurs, avec leur délai (s) après le début de la phrase ; group = sous-libellé facultatif.
  actors: { name: string; at: number; group?: string; dashed?: boolean }[];
  tradeAt: number;
  client: string;
  indicator: string;
  indicatorAt: number;
};

const COL = {
  need: { x: 140, w: 360 },
  trade: { x: 520, w: 690 },
  client: { x: 1230, w: 240 },
  ind: { x: 1490, w: 290 },
};
export const ROW_TOP = 252;
export const ROW_H = 152;

export const MapHeader: React.FC<{ start: number }> = ({ start }) => {
  const heads: [keyof typeof COL, string][] = [
    ["need", "BESOIN PHYSIQUE"],
    ["trade", "MÉTIER ET ACTEURS"],
    ["client", "CLIENTS"],
    ["ind", "INDICATEUR UTILE"],
  ];
  return (
    <AbsoluteFill>
      {heads.map(([k, label], i) => (
        <FadeIn
          key={k}
          start={start + i * 4}
          style={{
            position: "absolute",
            left: COL[k].x,
            top: 200,
            width: COL[k].w,
          }}
        >
          <div style={small(k === "ind" ? COLORS.warm : COLORS.inkSoft)}>
            {label}
          </div>
        </FadeIn>
      ))}
      <Svg>
        <DrawPath
          d={`M ${COL.need.x} ${ROW_TOP - 10} H 1780`}
          start={start}
          duration={1.2}
          stroke={COLORS.inkSoft}
          width={1}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Une ligne de la carte : besoin (pictogramme), métier et acteurs, client, indicateur.
export const MapRow: React.FC<{
  row: MapRowDef;
  index: number;
  start: number;
  clientStart: number;
  next: number;
}> = ({ row, index, start, clientStart, next }) => {
  const frame = useCurrentFrame();
  const top = ROW_TOP + index * ROW_H;
  const mid = top + ROW_H / 2 - 8;
  const active = frame >= start - 4 && frame < next;
  const dim = active ? 1 : 0.62;
  const bar = progress(frame, start, 0.5) * (active ? 1 : 0);
  const iconColor = active ? COLORS.accent : COLORS.inkSoft;
  const chipColor = (dashed?: boolean) =>
    dashed ? COLORS.inkSoft : active ? COLORS.ink : COLORS.inkSoft;
  let lastGroup: string | undefined;
  return (
    <AbsoluteFill style={{ opacity: frame < next ? 1 : dim }}>
      <Svg>
        <DrawPath
          d={circlePath(COL.need.x + 42, mid, 38)}
          start={start}
          duration={0.7}
          stroke={iconColor}
          width={1.4}
        />
        <DrawPath
          d={iconPath(row.icon, COL.need.x + 42, mid, 20)}
          start={start + 6}
          duration={0.8}
          stroke={iconColor}
          width={1.8}
        />
        <DrawPath
          d={`M ${COL.need.x} ${top + ROW_H - 10} H 1780`}
          start={start + 10}
          duration={1}
          stroke={COLORS.inkFaint}
          width={1}
        />
        {bar > 0 && (
          <path
            d={`M ${COL.need.x - 18} ${top + 6} V ${top + 6 + (ROW_H - 30) * bar}`}
            stroke={COLORS.accent}
            strokeWidth={3}
          />
        )}
      </Svg>
      <FadeIn
        start={start + 4}
        style={{
          position: "absolute",
          left: COL.need.x + 100,
          top,
          width: COL.need.w - 110,
          height: ROW_H - 20,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ ...textStyle(29, active ? 400 : 300), lineHeight: 1.25 }}>
          {row.need}
        </div>
      </FadeIn>
      <div
        style={{
          position: "absolute",
          left: COL.trade.x,
          top: top + 14,
          width: COL.trade.w,
        }}
      >
        <FadeIn start={start + FPS * row.tradeAt}>
          <div style={{ ...small(COLORS.accent), marginBottom: 12 }}>
            {row.trade}
          </div>
        </FadeIn>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "10px 12px",
          }}
        >
          {row.actors.map((a) => {
            const showGroup = a.group && a.group !== lastGroup;
            lastGroup = a.group ?? lastGroup;
            return (
              <React.Fragment key={a.name}>
                {showGroup && (
                  <FadeIn start={start + FPS * a.at - 6} rise={6}>
                    <span
                      style={{ ...textStyle(22, 300), color: COLORS.inkSoft }}
                    >
                      {a.group}
                    </span>
                  </FadeIn>
                )}
                <FadeIn start={start + FPS * a.at} rise={8}>
                  <span
                    style={{
                      ...textStyle(24, 400),
                      color: chipColor(a.dashed),
                      border: `1.5px ${a.dashed ? "dashed" : "solid"} ${chipColor(a.dashed)}`,
                      borderRadius: 999,
                      padding: "5px 15px",
                      display: "inline-block",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.name}
                  </span>
                </FadeIn>
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <FadeIn
        start={clientStart + 10}
        style={{
          position: "absolute",
          left: COL.client.x,
          top,
          width: COL.client.w,
          height: ROW_H - 20,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div style={{ ...textStyle(26, 300), lineHeight: 1.3 }}>
          {row.client}
        </div>
      </FadeIn>
      <FadeIn
        start={clientStart + FPS * row.indicatorAt}
        style={{
          position: "absolute",
          left: COL.ind.x,
          top,
          width: COL.ind.w,
          height: ROW_H - 20,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{ ...textStyle(26, 300), lineHeight: 1.3, color: COLORS.warm }}
        >
          {row.indicator}
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// La carte complète : en-tête + lignes synchronisées sur des paires de phrases.
export const IndustryMap: React.FC<{
  rows: MapRowDef[];
  firstSentence: number;
}> = ({ rows, firstSentence }) => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <MapHeader start={cues.s(firstSentence)} />
      {rows.map((r, i) => {
        const k = firstSentence + 2 * i;
        return (
          <MapRow
            key={r.need}
            row={r}
            index={i}
            start={cues.s(k)}
            clientStart={cues.s(k + 1)}
            next={i < rows.length - 1 ? cues.s(k + 2) : cues.end + 10 * FPS}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const ROWS: MapRowDef[] = [
  {
    icon: "wafer",
    need: "Support cristallin contrôlé",
    trade: "WAFERS",
    tradeAt: 2.2,
    actors: [
      { name: "Shin-Etsu", at: 3.5 },
      { name: "SUMCO", at: 4.5 },
      { name: "GlobalWafers", at: 5.3 },
    ],
    client: "Fabricants de puces",
    indicator: "Qualité et volumes qualifiés",
    indicatorAt: 2.4,
  },
  {
    icon: "light",
    need: "Motifs fins et alignés",
    trade: "LITHOGRAPHIE",
    tradeAt: 2.2,
    actors: [
      { name: "ASML", at: 3.5 },
      { name: "Nikon", at: 5.4, group: "autres segments :" },
      { name: "Canon", at: 6.2, group: "autres segments :" },
    ],
    client: "Fonderies et fabricants de mémoire",
    indicator: "Productivité et précision",
    indicatorAt: 3.4,
  },
  {
    icon: "stack",
    need: "Films et gravure maîtrisés",
    trade: "DÉPÔT ET GRAVURE",
    tradeAt: 0.6,
    actors: [
      { name: "Applied Materials", at: 2.5 },
      { name: "Lam Research", at: 3.8 },
      { name: "Tokyo Electron", at: 4.8 },
    ],
    client: "Fabricants",
    indicator: "Étapes de procédé et équipements requis",
    indicatorAt: 1.8,
  },
  {
    icon: "doping",
    need: "Dopage et traitements",
    trade: "ÉQUIPEMENTS SPÉCIALISÉS",
    tradeAt: 2.2,
    actors: [
      { name: "Applied Materials", at: 4, group: "notamment" },
      { name: "Axcelis", at: 5.5, group: "notamment" },
    ],
    client: "Fabricants",
    indicator: "Applications réellement adressées et qualifications",
    indicatorAt: 1.8,
  },
];

// Scène 37 — La chaîne industrielle : besoins physiques et métiers (1/2).
export const S37: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const out = interpolate(frame, [cues.s(2) - 12, cues.s(2)], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <div style={{ opacity: out }}>
        <Title
          text="La chaîne industrielle autour du transistor"
          start={cues.s(0)}
          top={150}
        />
      </div>
      <Stage from={0} to={cues.s(2)}>
        <Callout
          kind="warn"
          label="REPÈRES FONCTIONNELS · COMMENT LIRE CETTE CARTE"
          start={cues.s(1)}
          y={340}
          width={1300}
        >
          Ces entreprises{" "}
          <span style={{ color: COLORS.accent }}>illustrent les métiers</span>.
          <div style={{ height: 16 }} />
          <FadeIn start={cues.s(1, 3.4)}>
            <span style={{ color: COLORS.inkSoft, fontSize: 30 }}>
              La carte ne classe pas les parts de marché, et ne suppose pas une
              qualification identique sur tous les procédés.
            </span>
          </FadeIn>
        </Callout>
      </Stage>
      <Stage from={cues.s(2)}>
        <Title
          text="Besoins physiques et métiers"
          start={cues.s(2)}
          top={105}
        />
        <FictiveTag start={cues.s(2)} label="CARTE 1 / 2" />
        <IndustryMap rows={ROWS} firstSentence={2} />
      </Stage>
    </AbsoluteFill>
  );
};
