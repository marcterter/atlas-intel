import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { icons, roundRectPath } from "../components/icons";
import { Callout, Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
  DrawPath,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import { Pill, TextAt, caps } from "./S23";

const line = (pts: [number, number][]) =>
  pts
    .map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");

// Abscisse 0 → 1 (générations) ; deux panneaux : dimensions, puis tensions.
const X = (u: number) => 240 + u * 860;
const sample = (f: (u: number) => number) =>
  line(
    new Array(41)
      .fill(0)
      .map((_, i) => [X(i / 40), f(i / 40)] as [number, number]),
  );
const knee = 0.42;
const flat = (a: number, u: number) =>
  u < knee
    ? a + 250 * u
    : a + 250 * knee + 30 * (1 - Math.exp(-(u - knee) * 3));
const dims = (u: number) => 290 + 160 * u;
const ideal = (u: number) => 510 + 250 * u;
const vdd = (u: number) => flat(510, u);
const vth = (u: number) => flat(590, u);

const Curves: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const c = cues.s(2);
  const causes = [
    {
      name: "Fuites",
      text: "un seuil plus bas fait grimper le courant sous le seuil",
    },
    {
      name: "Marges de fonctionnement",
      text: "variations, bruit : il faut garder de la réserve",
    },
    {
      name: "Effets de canal court",
      text: "le drain perturbe la barrière contrôlée par la grille",
    },
  ];
  return (
    <AbsoluteFill>
      <Title
        kicker="Moore et Dennard"
        text="Pourquoi ce raisonnement a cessé de tout résoudre"
        start={cues.s(0)}
      />
      <Svg>
        {/* Panneau des dimensions */}
        <DrawPath
          d={`M ${X(0)} 270 V 470`}
          start={t}
          duration={0.5}
          stroke={COLORS.inkSoft}
        />
        <DrawPath
          d={sample(dims)}
          start={t + 10}
          duration={2}
          stroke={COLORS.accent}
          width={2.4}
        />
        <SvgText
          x={X(0) + 14}
          y={275}
          text="dimensions"
          start={t + 10}
          size={24}
          color={COLORS.accent}
          anchor="start"
        />
        {/* Panneau des tensions */}
        <DrawPath
          d={`M ${X(0)} 490 V 800 H ${X(1) + 20}`}
          start={t + FPS * 1.4}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <path
          d={sample(ideal)}
          fill="none"
          stroke={COLORS.inkSoft}
          strokeWidth={1.6}
          strokeDasharray="7 8"
          opacity={progress(frame, t + FPS * 3.4, 1)}
        />
        <DrawPath
          d={sample(vdd)}
          start={t + FPS * 2}
          duration={2.2}
          stroke={COLORS.warm}
          width={2.4}
        />
        <DrawPath
          d={sample(vth)}
          start={t + FPS * 2.8}
          duration={2.2}
          stroke={COLORS.warm}
          width={1.4}
        />
        <SvgText
          x={X(0.62)}
          y={vdd(0.62) - 22}
          text="tension VDD"
          start={t + FPS * 3.4}
          size={24}
          color={COLORS.warm}
          anchor="start"
        />
        <SvgText
          x={X(0.62)}
          y={vth(0.62) + 30}
          text="seuil Vth"
          start={t + FPS * 4}
          size={24}
          color={COLORS.warm}
          anchor="start"
        />
        <SvgText
          x={X(1) + 12}
          y={ideal(1) - 6}
          text="Dennard idéal"
          start={t + FPS * 4.2}
          size={22}
          color={COLORS.inkSoft}
          anchor="start"
        />
        <Arrow
          x1={X(0.93)}
          y1={vdd(0.93) + 8}
          x2={X(0.93)}
          y2={ideal(0.93) - 8}
          start={t + FPS * 4.8}
          stroke={COLORS.warm}
          width={1.6}
        />
        <SvgText
          x={X(0.93) - 14}
          y={(vdd(0.93) + ideal(0.93)) / 2 - 18}
          text="écart"
          start={t + FPS * 5}
          size={24}
          color={COLORS.warm}
          anchor="end"
        />
        <SvgText
          x={X(1) + 20}
          y={832}
          text="générations successives → (schéma qualitatif, échelle log)"
          start={t + 6}
          size={22}
          color={COLORS.inkSoft}
          anchor="end"
        />
      </Svg>
      <TextAt x={1320} y={300} w={460} start={c}>
        <div style={caps(COLORS.warm)}>POURQUOI V ET VTH PLAFONNENT</div>
      </TextAt>
      {causes.map((k, i) => (
        <TextAt
          key={k.name}
          x={1320}
          y={370 + i * 140}
          w={460}
          start={c + FPS * (0.6 + i * 1.3)}
        >
          <div style={{ ...textStyle(30, 400), color: COLORS.warm }}>
            {k.name}
          </div>
          <div
            style={{
              ...textStyle(24, 300),
              color: COLORS.inkSoft,
              marginTop: 6,
            }}
          >
            {k.text}
          </div>
        </TextAt>
      ))}
    </AbsoluteFill>
  );
};

// La promesse qui se fissure.
const Broken: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(3);
  const crack = t + FPS * 4;
  const split = progress(frame, crack + 10, 0.8);
  return (
    <AbsoluteFill>
      <Svg>
        <g
          transform={`translate(${-split * 10}, ${split * 6}) rotate(${-split * 1.5}, 960, 330)`}
        >
          <DrawPath
            d={roundRectPath(360, 220, 1200, 200, 16)}
            start={t}
            duration={0.8}
            stroke={COLORS.ink}
          />
        </g>
        <DrawPath
          d="M 1000 220 L 975 270 L 1010 300 L 970 350 L 1000 385 L 985 420"
          start={crack}
          duration={0.6}
          stroke={COLORS.warm}
          width={3}
        />
      </Svg>
      <TextAt x={960} y={250} w={1100} start={t + 8} align="center">
        <div style={caps()}>LA PROMESSE DE LA MINIATURISATION</div>
        <div style={{ ...textStyle(40, 200), marginTop: 18 }}>
          plus petit ⇒ automatiquement plus rapide, et aussi facile à refroidir
        </div>
      </TextAt>
      <TextAt x={960} y={500} w={1400} start={crack + 20} align="center">
        <div style={caps(COLORS.warm)}>
          SI LA TENSION NE BAISSE PLUS (ILLUSTRATION, MODÈLE IDÉAL)
        </div>
        <div style={{ ...textStyle(32, 300), marginTop: 18 }}>
          puissance par transistor ≈ C · V² · f ≈ 0,7 × 1 × 1,43 ≈{" "}
          <span style={{ color: COLORS.warm }}>1</span>
        </div>
        <div style={{ ...textStyle(32, 300), marginTop: 10 }}>
          × densité 2,04 → puissance par surface ≈{" "}
          <span style={{ color: COLORS.warm }}>× 2</span> : plus difficile à
          refroidir
        </div>
      </TextAt>
      <Pill text="Source 7" start={cues.s(4)} x={1780} y={790} tone="ink" />
    </AbsoluteFill>
  );
};

// Les réponses de l'industrie.
const ANSWERS: {
  name: string;
  text: string;
  icon: "stack" | "chip" | "bolt" | "memory";
}[] = [
  {
    name: "Parallélisme",
    text: "plusieurs unités plus sobres plutôt qu’une seule très rapide",
    icon: "stack",
  },
  {
    name: "Spécialisation",
    text: "des circuits dédiés à une tâche (accélérateurs)",
    icon: "chip",
  },
  {
    name: "Gestion de puissance",
    text: "clock gating, power gating, DVFS",
    icon: "bolt",
  },
  {
    name: "Mémoires et interconnexions",
    text: "déplacer les données plus efficacement",
    icon: "memory",
  },
];
const Answers: React.FC = () => {
  const cues = useCues();
  const t = cues.s(5);
  const at = [1.6, 3.0, 4.4, 6.2].map((d) => t + FPS * d);
  return (
    <AbsoluteFill>
      <TextAt x={960} y={150} w={1400} start={t} align="center">
        <div style={textStyle(42, 200)}>
          Ce changement a renforcé l’intérêt de…
        </div>
      </TextAt>
      <Svg>
        {ANSWERS.map((a, i) => {
          const x = 170 + i * 405;
          return (
            <g key={a.name}>
              <DrawPath
                d={roundRectPath(x, 290, 370, 420, 16)}
                start={at[i]}
                duration={0.8}
                stroke={COLORS.inkSoft}
                width={1.4}
              />
              <DrawPath
                d={icons[a.icon](x + 185, 390, 44)}
                start={at[i] + 8}
                stroke={COLORS.accent}
              />
            </g>
          );
        })}
      </Svg>
      {ANSWERS.map((a, i) => (
        <TextAt
          key={a.name}
          x={170 + i * 405 + 185}
          y={480}
          w={320}
          start={at[i] + 12}
          align="center"
        >
          <div style={{ ...textStyle(30, 400) }}>{a.name}</div>
          <div
            style={{
              ...textStyle(24, 300),
              color: COLORS.inkSoft,
              marginTop: 12,
            }}
          >
            {a.text}
          </div>
        </TextAt>
      ))}
    </AbsoluteFill>
  );
};

export const S29: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(2)}>
        <Curves />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(3)}>
        <Broken />
      </Stage>
      <Stage from={cues.beat(3)} to={cues.beat(4)}>
        <Answers />
      </Stage>
      <Stage from={cues.beat(4)}>
        <Callout kind="note" start={cues.s(6)} y={330} width={1300}>
          La fin du raisonnement « automatique » ne signifie pas que toute
          amélioration des transistors a cessé :{" "}
          <span style={{ color: COLORS.accent }}>
            ils continuent de s’améliorer
          </span>
          , par de nouvelles géométries et de nouveaux matériaux.
        </Callout>
      </Stage>
    </AbsoluteFill>
  );
};
