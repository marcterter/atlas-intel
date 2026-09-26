import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { circlePath } from "../components/icons";
import { Icon, Link, Svg, SvgText } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";

// Grains de sable qui dérivent lentement vers le token.
const SandToToken: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const on = progress(frame, start, 0.8);
  return (
    <Svg>
      {new Array(28).fill(0).map((_, i) => {
        const t = ((frame - start) / FPS / 4 + random(`s${i}`)) % 1;
        const x = 620 + t * 680;
        const y = 560 + (random(`y${i}`) - 0.5) * 160 * (1 - t);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={2.5 + 2 * t}
            fill={t > 0.6 ? COLORS.accent : COLORS.warm}
            opacity={on * 0.7 * Math.sin(Math.PI * t)}
          />
        );
      })}
      <Icon
        name="wafer"
        x={540}
        y={560}
        size={60}
        start={start}
        color={COLORS.warm}
        duration={1}
      />
      <Icon
        name="token"
        x={1380}
        y={560}
        size={60}
        start={start + 20}
        color={COLORS.accent}
        duration={1}
      />
      <SvgText
        x={540}
        y={670}
        text="sable"
        start={start + 10}
        size={26}
        color={COLORS.warm}
      />
      <SvgText
        x={1380}
        y={670}
        text="token"
        start={start + 30}
        size={26}
        color={COLORS.accent}
      />
    </Svg>
  );
};

const FUNCTIONS = [
  { name: "Calculer", icon: "chip" as const },
  { name: "Mémoriser", icon: "memory" as const },
  { name: "Communiquer", icon: "network" as const },
  { name: "Alimenter", icon: "bolt" as const },
  { name: "Refroidir", icon: "snow" as const },
];

// Scène 46 — Carte de fin du module 0.
export const S46: React.FC = () => {
  const cues = useCues();
  const fnAt = [1.4, 2.0, 2.6, 3.4, 4.0].map((d) => cues.s(2, d));
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(2)}>
        <div
          style={{
            position: "absolute",
            top: 190,
            width: "100%",
            textAlign: "center",
          }}
        >
          <FadeIn start={0}>
            <div
              style={{
                ...textStyle(24, 500),
                color: COLORS.accent,
                letterSpacing: "0.34em",
              }}
            >
              FORMATION INFRASTRUCTURE IA
            </div>
          </FadeIn>
          <FadeIn start={8} style={{ marginTop: 20 }}>
            <div style={textStyle(72, 200)}>Module 0 terminé</div>
          </FadeIn>
        </div>
        <SandToToken start={cues.s(1)} />
        <FadeIn
          start={cues.s(1, 1.2)}
          style={{
            position: "absolute",
            top: 740,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div style={textStyle(56, 200)}>
            Du sable <span style={{ color: COLORS.inkSoft }}>au</span>{" "}
            <span style={{ color: COLORS.accent }}>token</span>
          </div>
        </FadeIn>
      </Stage>

      <Stage from={cues.s(2)} to={cues.s(4)}>
        <FadeIn
          start={cues.s(2)}
          style={{
            position: "absolute",
            top: 190,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div style={textStyle(46, 200)}>Cinq fonctions, toujours</div>
        </FadeIn>
        <Svg>
          {FUNCTIONS.map((f, i) => {
            const x = 960 + (i - 2) * 300;
            return (
              <g key={f.name}>
                <DrawPath
                  d={circlePath(x, 400, 78)}
                  start={fnAt[i]}
                  duration={0.7}
                  stroke={i >= 3 ? COLORS.warm : COLORS.accent}
                />
                <Icon
                  name={f.icon}
                  x={x}
                  y={400}
                  size={32}
                  start={fnAt[i] + 6}
                  color={i >= 3 ? COLORS.warm : COLORS.accent}
                />
                <SvgText
                  x={x}
                  y={530}
                  text={f.name}
                  start={fnAt[i] + 8}
                  size={30}
                />
                {i < 4 && (
                  <Link
                    from={[x + 78, 400]}
                    to={[x + 222, 400]}
                    start={fnAt[i + 1] - 6}
                    color={COLORS.inkFaint}
                  />
                )}
              </g>
            );
          })}
          <Icon
            name="bottleneck"
            x={960}
            y={660}
            size={46}
            start={cues.s(3)}
            color={COLORS.warm}
          />
        </Svg>
        <FadeIn
          start={cues.s(3, 0.8)}
          style={{
            position: "absolute",
            top: 740,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.inkSoft,
              letterSpacing: "0.3em",
              marginBottom: 12,
            }}
          >
            LA QUESTION RÉFLEXE
          </div>
          <div style={{ ...textStyle(40, 300), color: COLORS.warm }}>
            Qu’est-ce qui fait attendre le reste du système ?
          </div>
        </FadeIn>
      </Stage>

      <Stage from={cues.s(4)}>
        <Svg>
          <Icon
            name="pencil"
            x={700}
            y={400}
            size={46}
            start={cues.s(4)}
            color={COLORS.ink}
          />
          <Link from={[770, 400]} to={[890, 400]} start={cues.s(4, 1.2)} />
          <Icon
            name="book"
            x={960}
            y={400}
            size={46}
            start={cues.s(4, 1.6)}
            color={COLORS.ink}
          />
          <Link from={[1030, 400]} to={[1150, 400]} start={cues.s(4, 3)} />
          <Icon
            name="check"
            x={1220}
            y={400}
            size={40}
            start={cues.s(4, 3.4)}
            color={COLORS.accent}
            width={3}
          />
          <SvgText
            x={700}
            y={490}
            text="Tes mots, tes calculs"
            start={cues.s(4, 0.4)}
            size={24}
            color={COLORS.inkSoft}
          />
          <SvgText
            x={960}
            y={490}
            text="Envoi des réponses"
            start={cues.s(4, 1.8)}
            size={24}
            color={COLORS.inkSoft}
          />
          <SvgText
            x={1220}
            y={490}
            text="Correction"
            start={cues.s(4, 3.6)}
            size={24}
            color={COLORS.accent}
          />
        </Svg>
        <FadeIn
          start={cues.s(4, 0.6)}
          style={{
            position: "absolute",
            top: 570,
            left: 260,
            width: 1400,
            textAlign: "center",
          }}
        >
          <div style={{ ...textStyle(34, 300), lineHeight: 1.4 }}>
            Réponds au test avec tes mots et tes calculs, puis envoie tes
            réponses pour la correction.
          </div>
        </FadeIn>
        <FadeIn
          start={cues.s(5)}
          style={{
            position: "absolute",
            top: 730,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div style={{ ...textStyle(44, 200), color: COLORS.accent }}>
            Le module 1 commence après validation
          </div>
        </FadeIn>
      </Stage>
    </AbsoluteFill>
  );
};
