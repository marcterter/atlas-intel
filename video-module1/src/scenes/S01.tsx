import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { icons, roundRectPath } from "../components/icons";
import { FlowChain, Icon, Link, Svg, SvgText } from "../components/kit";
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

// Titre du module, sur un fond de charges qui dérivent lentement dans un canal.
const Hero: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(0);
  const channelY = 700;
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 210,
          width: "100%",
          textAlign: "center",
        }}
      >
        <FadeIn start={t}>
          <div
            style={{
              ...textStyle(20, 400),
              color: COLORS.inkSoft,
              letterSpacing: "0.35em",
            }}
          >
            FORMATION INFRASTRUCTURE IA
          </div>
        </FadeIn>
        <FadeIn start={t + 18} style={{ marginTop: 22 }}>
          <div
            style={{
              ...textStyle(30, 400),
              color: COLORS.accent,
              letterSpacing: "0.4em",
            }}
          >
            MODULE 1
          </div>
        </FadeIn>
        <FadeIn start={cues.s(1)} style={{ marginTop: 26 }}>
          <div style={textStyle(60, 200)}>
            Physique des semi-conducteurs et transistors
          </div>
        </FadeIn>
        <FadeIn start={cues.s(1, 2.2)} style={{ marginTop: 16 }}>
          <div
            style={{
              ...textStyle(34, 300),
              color: COLORS.warm,
              fontStyle: "italic",
            }}
          >
            Du courant électrique aux calculs de l’IA
          </div>
        </FadeIn>
      </div>
      <Svg>
        {/* Un canal conducteur qui se trace, puis des électrons qui le parcourent. */}
        <DrawPath
          d={`M 360 ${channelY - 40} H 1560`}
          start={cues.s(1, 0.8)}
          duration={1.6}
          stroke={COLORS.inkFaint}
          width={1}
        />
        <DrawPath
          d={`M 360 ${channelY + 40} H 1560`}
          start={cues.s(1, 0.8)}
          duration={1.6}
          stroke={COLORS.inkFaint}
          width={1}
        />
        {new Array(26).fill(0).map((_, i) => {
          const appear = progress(frame, cues.s(1, 1.6) + i * 3, 0.5);
          const speed = 1.2 + random(`v${i}`) * 0.8;
          const x =
            360 + ((random(`x${i}`) * 1200 + (frame - t) * speed) % 1200);
          const y = channelY + (random(`y${i}`) - 0.5) * 56;
          const edge = Math.min(1, (x - 360) / 80, (1560 - x) / 80);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3.2}
              fill={COLORS.accent}
              opacity={appear * 0.8 * Math.max(0, edge)}
            />
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

// Du système complet (module 0) à l'intérieur de la puce, puis au transistor.
const ZoomIn: React.FC = () => {
  const cues = useCues();
  const t = cues.beat(1);
  const zoom2 = cues.s(4);
  const Y = 520;
  // Coupe simplifiée de transistor : corps, source, drain, isolant, grille.
  const tx = 1440;
  const transistor = [
    roundRectPath(tx - 170, Y - 10, 340, 130, 6),
    `M ${tx - 150} ${Y - 10} V ${Y + 34} H ${tx - 70} V ${Y - 10}`,
    `M ${tx + 70} ${Y - 10} V ${Y + 34} H ${tx + 150} V ${Y - 10}`,
    `M ${tx - 70} ${Y - 18} H ${tx + 70}`,
    roundRectPath(tx - 60, Y - 80, 120, 56, 4),
  ].join(" ");
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 180,
          width: "100%",
          textAlign: "center",
        }}
      >
        <FadeIn start={t}>
          <div
            style={{
              ...textStyle(20, 400),
              color: COLORS.inkSoft,
              letterSpacing: "0.3em",
            }}
          >
            COURS ET CAHIER DE VALIDATION ·{" "}
            <Counter
              from={1}
              to={18}
              start={t + 6}
              duration={1.2}
              style={{ color: COLORS.ink }}
            />{" "}
            SEPTEMBRE{" "}
            <Counter
              from={2016}
              to={2026}
              start={t + 6}
              duration={1.6}
              style={{ color: COLORS.ink }}
            />
          </div>
        </FadeIn>
      </div>
      <Svg>
        {/* Module 0 : le système complet */}
        <Icon name="rack" x={480} y={Y} size={70} start={cues.s(3)} />
        <Icon
          name="rack"
          x={390}
          y={Y + 20}
          size={50}
          start={cues.s(3, 0.3)}
          color={COLORS.inkSoft}
        />
        <Icon
          name="rack"
          x={570}
          y={Y + 20}
          size={50}
          start={cues.s(3, 0.3)}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={480}
          y={Y + 150}
          text={"Module 0\nle système complet"}
          start={cues.s(3, 0.5)}
          size={24}
          color={COLORS.inkSoft}
        />
        {/* Zoom vers la puce */}
        <DrawPath
          d={`M 560 ${Y - 60} L 860 ${Y - 90} M 560 ${Y + 60} L 860 ${Y + 90}`}
          start={zoom2}
          duration={0.8}
          stroke={COLORS.inkFaint}
          width={1}
        />
        <DrawPath
          d={icons.chip(960, Y, 90)}
          start={zoom2 + 12}
          duration={1.1}
          stroke={COLORS.accent}
        />
        <SvgText
          x={960}
          y={Y + 150}
          text={"Module 1\nà l’intérieur de la puce"}
          start={zoom2 + 24}
          size={24}
          color={COLORS.accent}
        />
        {/* Zoom vers le transistor */}
        <DrawPath
          d={`M 1010 ${Y - 20} L 1250 ${Y - 90} M 1010 ${Y + 20} L 1250 ${Y + 130}`}
          start={zoom2 + 22}
          duration={0.7}
          stroke={COLORS.inkFaint}
          width={1}
        />
        <DrawPath
          d={transistor}
          start={zoom2 + 30}
          duration={1.0}
          stroke={COLORS.ink}
        />
        <SvgText
          x={tx}
          y={Y + 180}
          text="le transistor"
          start={zoom2 + 48}
          size={24}
          color={COLORS.ink}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Transistor → circuits → opérations logiques → performances et coûts.
const Chain: React.FC = () => {
  const cues = useCues();
  const t = cues.beat(2);
  const step = 1.6 * FPS;
  return (
    <AbsoluteFill>
      <FlowChain
        y={470}
        items={[
          "Transistor",
          "Circuits de transistors",
          "Opérations logiques",
          "Performances et coûts",
        ]}
        starts={[t, t + step, t + 2 * step, cues.s(6)]}
        h={120}
        size={26}
        highlight={[3]}
      />
      <Svg>
        <SvgText
          x={340}
          y={600}
          text="contrôle un courant"
          start={t + 10}
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={760}
          y={600}
          text="transforment des tensions…"
          start={t + step + 10}
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={1170}
          y={600}
          text="…en opérations"
          start={t + 2 * step + 10}
          size={22}
          color={COLORS.inkSoft}
        />
      </Svg>
      <FadeIn
        start={cues.s(6, 1.5)}
        style={{
          position: "absolute",
          top: 680,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(28, 300) }}>
          Leur <span style={{ color: COLORS.accent }}>vitesse</span> et leur{" "}
          <span style={{ color: COLORS.warm }}>consommation</span> se retrouvent
          dans l’infrastructure
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Le fil directeur en trois temps.
const PILLARS: {
  title: string;
  icon: "network" | "check" | "bolt";
  sub: string;
}[] = [
  { title: "Contrôler les charges", icon: "network", sub: "le transistor" },
  {
    title: "Construire des circuits fiables",
    icon: "check",
    sub: "la logique CMOS",
  },
  {
    title: "Plus de travail utile",
    icon: "bolt",
    sub: "dans un budget de puissance limité",
  },
];

const Thread: React.FC = () => {
  const cues = useCues();
  const t = cues.beat(3);
  const XS = [520, 960, 1400];
  const at = (i: number) => t + FPS * (1.6 + i * 1.5);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 200,
          width: "100%",
          textAlign: "center",
        }}
      >
        <FadeIn start={t}>
          <div
            style={{
              ...textStyle(20, 400),
              color: COLORS.accent,
              letterSpacing: "0.32em",
            }}
          >
            LE FIL DIRECTEUR
          </div>
        </FadeIn>
      </div>
      <Svg>
        {XS.map((x, i) => (
          <g key={x}>
            <DrawPath
              d={roundRectPath(x - 190, 330, 380, 300, 14)}
              start={at(i)}
              duration={0.8}
              stroke={i === 2 ? COLORS.warm : COLORS.ink}
              width={1.6}
            />
            <Icon
              name={PILLARS[i].icon}
              x={x}
              y={420}
              size={40}
              start={at(i) + 10}
              color={i === 2 ? COLORS.warm : COLORS.accent}
            />
            {i < 2 && (
              <Link
                from={[x + 190, 480]}
                to={[XS[i + 1] - 190, 480]}
                start={at(i + 1) - 6}
                gap={8}
              />
            )}
          </g>
        ))}
      </Svg>
      {XS.map((x, i) => (
        <FadeIn
          key={x}
          start={at(i) + 14}
          style={{
            position: "absolute",
            top: 500,
            left: x - 180,
            width: 360,
            textAlign: "center",
          }}
        >
          <div style={{ ...textStyle(30, 300), lineHeight: 1.25 }}>
            {PILLARS[i].title}
          </div>
          <div
            style={{
              ...textStyle(22, 300),
              color: COLORS.inkSoft,
              marginTop: 12,
            }}
          >
            {PILLARS[i].sub}
          </div>
        </FadeIn>
      ))}
    </AbsoluteFill>
  );
};

// Scène 1 — Ouverture du module 1.
export const S01: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(1)}>
        <Hero />
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(2)}>
        <ZoomIn />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(3)}>
        <Chain />
      </Stage>
      <Stage from={cues.beat(3)}>
        <Thread />
      </Stage>
    </AbsoluteFill>
  );
};
