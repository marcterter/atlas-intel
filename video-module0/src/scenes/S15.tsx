import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Icon, Link, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

const accentA = (a: number) => `rgba(143, 208, 255, ${a})`;

// --- EDA et IP -------------------------------------------------------------
const Acronym: React.FC<{
  left: number;
  start: number;
  sigle: string;
  en: string;
  text: React.ReactNode;
}> = ({ left, start, sigle, en, text }) => (
  <div style={{ position: "absolute", top: 500, left, width: 700 }}>
    <FadeIn start={start}>
      <div style={{ ...textStyle(72, 200), color: COLORS.accent }}>{sigle}</div>
    </FadeIn>
    <FadeIn start={start + 10}>
      <div
        style={{
          ...textStyle(24, 400),
          color: COLORS.inkSoft,
          letterSpacing: "0.06em",
          marginTop: 4,
        }}
      >
        {en}
      </div>
    </FadeIn>
    <FadeIn start={start + 40} style={{ marginTop: 22 }}>
      <div style={{ ...textStyle(32, 300), lineHeight: 1.4 }}>{text}</div>
    </FadeIn>
  </div>
);

const EdaIp: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const a = cues.s(1);
  const b = cues.s(2);
  // IP : le même bloc réutilisé dans trois puces différentes.
  const dies = [1060, 1250, 1440];
  return (
    <AbsoluteFill>
      <Svg>
        {/* EDA : un circuit conçu puis vérifié à l'écran */}
        <DrawPath
          d={roundRectPath(220, 270, 380, 190, 12)}
          start={a + 6}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <DrawPath
          d="M 250 320 H 330 V 380 H 420 M 330 350 H 380 M 440 300 V 420 M 470 330 H 560 V 410"
          start={a + 20}
          duration={1.4}
          stroke={COLORS.accent}
          width={1.8}
        />
        <Icon
          name="pencil"
          x={660}
          y={320}
          size={30}
          start={a + 30}
          color={COLORS.ink}
        />
        <Icon
          name="magnifier"
          x={660}
          y={410}
          size={30}
          start={cues.s(1, 4)}
          color={COLORS.warm}
        />
        {dies.map((x, i) => (
          <g key={i}>
            <DrawPath
              d={roundRectPath(x, 280, 160, 160, 10)}
              start={b + 6 + i * 6}
              duration={0.6}
              stroke={COLORS.inkSoft}
            />
            {[0, 1, 2].map((k) => (
              <path
                key={k}
                d={roundRectPath(x + 14 + k * 46, 296, 38, 40, 4)}
                fill="none"
                stroke={COLORS.inkFaint}
                strokeWidth={1.2}
                opacity={progress(frame, b + 14 + i * 6, 0.4)}
              />
            ))}
            <path
              d={roundRectPath(x + 14, 350, 132, 74, 6)}
              fill={accentA(0.3)}
              stroke={COLORS.accent}
              strokeWidth={1.6}
              opacity={progress(frame, cues.s(2, 3) + i * 10, 0.5)}
            />
            <SvgText
              x={x + 80}
              y={387}
              text="bloc IP"
              start={cues.s(2, 3) + i * 10}
              size={22}
              weight={400}
            />
          </g>
        ))}
      </Svg>
      <Acronym
        left={220}
        start={a}
        sigle="EDA"
        en="Electronic Design Automation"
        text={
          <>
            Logiciels de <span style={{ color: COLORS.ink }}>conception</span>{" "}
            et de <span style={{ color: COLORS.warm }}>vérification</span>{" "}
            électroniques
          </>
        }
      />
      <Acronym
        left={1060}
        start={b}
        sigle="IP"
        en="Intellectual Property"
        text={
          <>
            Ici, notamment des{" "}
            <span style={{ color: COLORS.accent }}>
              blocs de conception réutilisables
            </span>{" "}
            dans une puce
          </>
        }
      />
    </AbsoluteFill>
  );
};

// --- Foundry, fab, fabless ---------------------------------------------------
const Foundry: React.FC = () => {
  const cues = useCues();
  const f = cues.s(3);
  const fab = cues.s(4);
  const fl = cues.s(5);
  return (
    <AbsoluteFill>
      <Svg>
        {/* Foundry : l'entreprise qui fabrique pour des clients */}
        <DrawPath
          d={roundRectPath(1000, 280, 700, 480, 20)}
          start={f}
          duration={1}
          stroke={COLORS.accent}
        />
        <SvgText
          x={1040}
          y={326}
          text="FOUNDRY · FONDERIE"
          start={f + 10}
          size={22}
          weight={500}
          spacing="0.24em"
          anchor="start"
          color={COLORS.accent}
        />
        <SvgText
          x={1350}
          y={380}
          text="fabrique des puces pour des clients"
          start={f + 20}
          size={30}
          weight={300}
        />
        {/* Fab : l'usine physique */}
        <DrawPath
          d={roundRectPath(1110, 440, 480, 270, 14)}
          start={fab}
          duration={0.8}
          stroke={COLORS.ink}
        />
        <Icon
          name="factory"
          x={1350}
          y={540}
          size={60}
          start={fab + 8}
          duration={1}
        />
        <SvgText
          x={1350}
          y={650}
          text="Fab : l’usine physique"
          start={fab + 14}
          size={30}
          weight={300}
        />
        {/* Fabless : conçoit sans fabriquer ses wafers */}
        <DrawPath
          d={roundRectPath(220, 380, 480, 280, 20)}
          start={fl}
          duration={0.9}
          stroke={COLORS.warm}
        />
        <Icon
          name="pencil"
          x={460}
          y={460}
          size={38}
          start={fl + 10}
          color={COLORS.warm}
        />
        <SvgText
          x={460}
          y={550}
          text="Fabless"
          start={fl + 14}
          size={44}
          weight={200}
          color={COLORS.warm}
        />
        <SvgText
          x={460}
          y={612}
          text="conçoit des puces"
          start={fl + 20}
          size={26}
          weight={300}
        />
        <Link
          from={[700, 470]}
          to={[1000, 470]}
          start={cues.s(5, 3.2)}
          color={COLORS.warm}
        />
        <SvgText
          x={850}
          y={440}
          text="conception"
          start={cues.s(5, 3.4)}
          size={24}
          color={COLORS.warm}
        />
        <Link
          from={[1000, 580]}
          to={[700, 580]}
          start={cues.s(5, 4.2)}
          color={COLORS.accent}
        />
        <SvgText
          x={850}
          y={612}
          text="puces"
          start={cues.s(5, 4.4)}
          size={24}
          color={COLORS.accent}
        />
      </Svg>
      <FadeIn
        start={cues.s(5, 4.6)}
        style={{
          position: "absolute",
          top: 790,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(30, 300)}>
          Fabless : sans exploiter{" "}
          <span style={{ color: COLORS.warm }}>
            sa propre fabrication de wafers
          </span>{" "}
          pour ces produits
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// --- Repère pratique : trois entreprises, trois métiers -----------------------
const TRIO = [
  {
    name: "NVIDIA",
    what: "conçoit notamment\ndes accélérateurs",
    icon: "chip" as const,
    d: 0.2,
  },
  {
    name: "TSMC",
    what: "services de fabrication\net de packaging",
    icon: "factory" as const,
    d: 3.2,
  },
  {
    name: "ASML",
    what: "équipements\nde lithographie",
    icon: "light" as const,
    d: 6.4,
  },
];
const XS = [460, 960, 1460];
const Trio: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const r = cues.s(8);
  return (
    <AbsoluteFill>
      <Title kicker="Repère pratique" text="Trois métiers" start={cues.s(6)} />
      <Svg>
        {TRIO.map((t, i) => {
          const at = cues.s(7, t.d);
          return (
            <g key={t.name}>
              <DrawPath
                d={roundRectPath(XS[i] - 210, 280, 420, 360, 18)}
                start={at}
                duration={0.8}
                stroke={COLORS.inkSoft}
              />
              <Icon
                name={t.icon}
                x={XS[i]}
                y={370}
                size={44}
                start={at + 8}
                color={COLORS.accent}
              />
              <SvgText
                x={XS[i]}
                y={480}
                text={t.name}
                start={at + 10}
                size={48}
                weight={200}
              />
              <SvgText
                x={XS[i]}
                y={570}
                text={t.what}
                start={at + 18}
                size={28}
                weight={300}
                color={COLORS.inkSoft}
              />
              {/* Rythmes de revenus différents : des graduations décalées. */}
              {new Array(12).fill(0).map((_, k) => {
                const period = [1, 3, 5][i];
                const tall = k % period === 0;
                return (
                  <path
                    key={k}
                    d={`M ${XS[i] - 176 + k * 32} ${tall ? 690 : 700} V 712`}
                    stroke={tall ? COLORS.warm : COLORS.inkFaint}
                    strokeWidth={tall ? 2 : 1.4}
                    opacity={progress(frame, r + 10 + k * 2 + i * 6, 0.3)}
                  />
                );
              })}
              <DrawPath
                d={`M ${XS[i] - 190} 712 H ${XS[i] + 190}`}
                start={r + 4 + i * 6}
                duration={0.6}
                stroke={COLORS.inkSoft}
                width={1.4}
              />
            </g>
          );
        })}
      </Svg>
      <FadeIn
        start={r + 20}
        style={{
          position: "absolute",
          top: 760,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(32, 300)}>
          Leurs revenus ne dépendent{" "}
          <span style={{ color: COLORS.warm }}>
            ni des mêmes unités, ni du même calendrier
          </span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 15 — Les métiers à ne pas confondre.
export const S15: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(6)}>
        <Title
          kicker="Vocabulaire"
          text="Les métiers à ne pas confondre"
          top={105}
          start={cues.s(0)}
        />
      </Stage>
      <Stage from={cues.s(1) - 6} to={cues.s(3)}>
        <EdaIp />
      </Stage>
      <Stage from={cues.s(3)} to={cues.s(6)}>
        <Foundry />
      </Stage>
      <Stage from={cues.s(6)}>
        <Trio />
      </Stage>
    </AbsoluteFill>
  );
};
