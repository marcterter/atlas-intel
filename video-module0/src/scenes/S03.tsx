import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { circlePath } from "../components/icons";
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
import { COLORS } from "../theme";

const STEPS = [
  {
    title: "Lire",
    text: "pour comprendre\nles fonctions",
    icon: "book" as const,
  },
  {
    title: "Revenir",
    text: "sur les équations,\nles entreprises, les unités",
    icon: "pencil" as const,
  },
  {
    title: "Répondre",
    text: "avec tes mots,\ncalculs montrés",
    icon: "check" as const,
  },
];
const XS = [480, 960, 1440];
const Y = 470;

const Method: React.FC = () => {
  const cues = useCues();
  const starts = [cues.s(1), cues.s(2), cues.s(3)];
  return (
    <AbsoluteFill>
      <Title
        kicker="Ouverture"
        text="Comment travailler ce document"
        start={cues.s(0)}
      />
      <Svg>
        {STEPS.map((s, i) => (
          <g key={s.title}>
            <DrawPath
              d={circlePath(XS[i], Y, 84)}
              start={starts[i]}
              duration={0.8}
              stroke={i === 2 ? COLORS.accent : COLORS.ink}
            />
            <Icon
              name={s.icon}
              x={XS[i]}
              y={Y}
              size={34}
              start={starts[i] + 10}
              color={i === 2 ? COLORS.accent : COLORS.ink}
            />
            <SvgText
              x={XS[i]}
              y={Y + 140}
              text={s.title}
              start={starts[i] + 8}
              size={32}
              weight={300}
            />
            <SvgText
              x={XS[i]}
              y={Y + 210}
              text={s.text}
              start={starts[i] + 14}
              size={22}
              color={COLORS.inkSoft}
            />
            {i < 2 && (
              <Link
                from={[XS[i] + 84, Y]}
                to={[XS[i + 1] - 84, Y]}
                start={starts[i + 1] - 10}
                gap={16}
              />
            )}
          </g>
        ))}
      </Svg>
      <FadeIn
        start={cues.s(4, 1.2)}
        style={{
          position: "absolute",
          top: 250,
          left: XS[2] - 220,
          width: 440,
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(18, 500),
            color: COLORS.warm,
            letterSpacing: "0.22em",
          }}
        >
          AUCUN CORRIGÉ DANS LE CAHIER
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Jauge de validation : l'arc se remplit jusqu'au seuil de 80 / 100.
const Threshold: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(5);
  const cx = 960;
  const cy = 520;
  const r = 230;
  const arc = (from: number, to: number) => {
    const a0 = Math.PI * (1 - from);
    const a1 = Math.PI * (1 - to);
    return `M ${cx + r * Math.cos(a0)} ${cy - r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${cx + r * Math.cos(a1)} ${cy - r * Math.sin(a1)}`;
  };
  const tick = Math.PI * (1 - 0.8);
  const after = progress(frame, cues.s(6), 0.8);
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={arc(0, 1)}
          start={t}
          duration={0.8}
          stroke={COLORS.inkFaint}
          width={10}
        />
        <DrawPath
          d={arc(0, 0.8)}
          start={t + 10}
          duration={1.6}
          stroke={COLORS.accent}
          width={10}
        />
        <DrawPath
          d={`M ${cx + (r - 26) * Math.cos(tick)} ${cy - (r - 26) * Math.sin(tick)} L ${cx + (r + 26) * Math.cos(tick)} ${cy - (r + 26) * Math.sin(tick)}`}
          start={t + 50}
          duration={0.3}
          stroke={COLORS.warm}
          width={3}
        />
        {/* En dessous du seuil : on reprend ; au-dessus : module 1. */}
        <Link
          from={[cx - 60, cy + 150]}
          to={[cx - 380, cy + 150]}
          start={cues.s(6, 0.6)}
          color={COLORS.warm}
        />
        <Link
          from={[cx + 60, cy + 150]}
          to={[cx + 380, cy + 150]}
          start={cues.s(6, 2.6)}
          color={COLORS.accent}
        />
      </Svg>
      <div
        style={{
          position: "absolute",
          top: cy - 150,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(120, 200)}>
          <Counter from={0} to={80} start={t + 10} duration={1.6} />
          <span style={{ color: COLORS.inkSoft, fontSize: 56 }}> / 100</span>
        </div>
        <FadeIn start={t + 30}>
          <div
            style={{
              ...textStyle(20, 400),
              color: COLORS.inkSoft,
              letterSpacing: "0.3em",
              marginTop: 6,
            }}
          >
            SEUIL DE VALIDATION
          </div>
        </FadeIn>
      </div>
      <div
        style={{
          position: "absolute",
          top: cy + 180,
          left: cx - 560,
          width: 460,
          textAlign: "center",
          opacity: after,
        }}
      >
        <div style={{ ...textStyle(26, 300), color: COLORS.warm }}>
          Moins de 80 : reprise ciblée
        </div>
      </div>
      <FadeIn
        start={cues.s(6, 2.6)}
        style={{
          position: "absolute",
          top: cy + 180,
          left: cx + 100,
          width: 460,
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(26, 300), color: COLORS.accent }}>
          Validé : module 1
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 3 — Comment travailler ce document.
export const S03: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(5)}>
        <Method />
      </Stage>
      <Stage from={cues.s(5)}>
        <Threshold />
      </Stage>
    </AbsoluteFill>
  );
};
