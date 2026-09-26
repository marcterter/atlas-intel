import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Callout, Svg, Title } from "../components/kit";
import {
  Arrow,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

const small = (color: string): React.CSSProperties => ({
  ...textStyle(18, 500),
  color,
  letterSpacing: "0.28em",
});

const ROWS = [
  {
    d: "Mémoire avancée",
    f: "Contenu par accélérateur en hausse et offre qualifiée limitée.",
    u: "Nouvelles capacités et baisse des prix.",
  },
  {
    d: "Packaging",
    f: "Assemblages complexes et valeur ajoutée croissante.",
    u: "Défauts et coûts absorbant cette valeur.",
  },
  {
    d: "Photonique",
    f: "Plus de liaisons et de débit.",
    u: "Adoption différée ou déplacement de valeur entre composants.",
  },
  {
    d: "Électricité et froid",
    f: "Puissance installée et densité croissantes.",
    u: "Retards, annulations et concurrence sur les prix.",
  },
  {
    d: "Cloud IA",
    f: "Bonne utilisation et demande solvable durable.",
    u: "Prix de location en baisse et matériel sous-utilisé.",
  },
];

const COL = { d: 160, f: 600, u: 1220 };
const W = { d: 400, f: 540, u: 550 };
const TOP = 340;
const RH = 104;

const Scenarios: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = ROWS.map((_, k) => cues.s(2 + 3 * k));
  const cur = starts.reduce((a, s, i) => (frame >= s ? i : a), -1);
  const h = cues.s(2) - 12;
  return (
    <AbsoluteFill>
      <FadeIn
        start={h}
        style={{ position: "absolute", left: COL.d, top: 290, width: W.d }}
      >
        <div style={small(COLORS.inkSoft)}>DOMAINE</div>
      </FadeIn>
      <FadeIn
        start={h + 5}
        style={{ position: "absolute", left: COL.f + 40, top: 290, width: W.f }}
      >
        <div style={small(COLORS.accent)}>SCÉNARIO FAVORABLE</div>
      </FadeIn>
      <FadeIn
        start={h + 10}
        style={{ position: "absolute", left: COL.u + 40, top: 290, width: W.u }}
      >
        <div style={small(COLORS.warm)}>SCÉNARIO DÉFAVORABLE</div>
      </FadeIn>
      <Svg>
        <Arrow
          x1={COL.f + 12}
          y1={310}
          x2={COL.f + 12}
          y2={286}
          start={h + 5}
          duration={0.4}
          stroke={COLORS.accent}
        />
        <Arrow
          x1={COL.u + 12}
          y1={286}
          x2={COL.u + 12}
          y2={310}
          start={h + 10}
          duration={0.4}
          stroke={COLORS.warm}
        />
        <DrawPath
          d={`M ${COL.d} 326 H 1770`}
          start={h}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1}
        />
        <DrawPath
          d={`M ${COL.u - 30} 340 V ${TOP + RH * 5}`}
          start={h + 10}
          duration={1.5}
          stroke={COLORS.inkFaint}
          width={1}
        />
        {ROWS.map((_, k) => (
          <DrawPath
            key={k}
            d={`M ${COL.d} ${TOP + (k + 1) * RH} H 1770`}
            start={starts[k] + 6}
            duration={0.8}
            stroke={COLORS.inkFaint}
            width={1}
          />
        ))}
      </Svg>
      {ROWS.map((row, k) => {
        const active = k === cur;
        const dim = active ? 1 : 0.5;
        const y = TOP + k * RH;
        const cell: React.CSSProperties = {
          position: "absolute",
          top: y,
          height: RH,
          display: "flex",
          alignItems: "center",
        };
        const od = progress(frame, starts[k], 0.6);
        const of = progress(frame, cues.s(3 + 3 * k), 0.6);
        const ou = progress(frame, cues.s(4 + 3 * k), 0.6);
        return (
          <React.Fragment key={row.d}>
            <div
              style={{
                position: "absolute",
                left: COL.d - 24,
                top: y + 22,
                width: 3,
                height: RH - 44,
                background: COLORS.accent,
                opacity: active ? od : 0,
              }}
            />
            <div
              style={{ ...cell, left: COL.d, width: W.d, opacity: od * dim }}
            >
              <div style={textStyle(32, active ? 400 : 300)}>{row.d}</div>
            </div>
            <div
              style={{
                ...cell,
                left: COL.f + 40,
                width: W.f,
                opacity: of * dim,
              }}
            >
              <div style={{ ...textStyle(28, 300), lineHeight: 1.3 }}>
                {row.f}
              </div>
            </div>
            <div
              style={{
                ...cell,
                left: COL.u + 40,
                width: W.u - 40,
                opacity: ou * dim,
              }}
            >
              <div
                style={{
                  ...textStyle(28, 300),
                  lineHeight: 1.3,
                  color: COLORS.warm,
                }}
              >
                {row.u}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// Scène 35 — Scénarios favorables et défavorables, domaine par domaine.
export const S35: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Title
        kicker="Scénarios et entreprises"
        text="Scénarios et entreprises à retenir"
        start={cues.s(0)}
        top={100}
      />
      <Stage from={0} to={cues.s(2)}>
        <Callout kind="warn" start={cues.s(1)} y={380} width={1300} size={38}>
          Ces scénarios sont des{" "}
          <span style={{ color: COLORS.warm }}>hypothèses d’analyse</span>, pas
          des recommandations d’achat.
        </Callout>
      </Stage>
      <Stage from={cues.s(2)}>
        <FadeIn
          start={cues.s(2)}
          style={{
            position: "absolute",
            top: 232,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div style={{ ...small(COLORS.warm), opacity: 0.8 }}>
            HYPOTHÈSES D’ANALYSE · PAS DES RECOMMANDATIONS D’ACHAT
          </div>
        </FadeIn>
        <Scenarios />
      </Stage>
    </AbsoluteFill>
  );
};
