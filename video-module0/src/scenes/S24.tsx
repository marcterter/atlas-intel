import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { IconName, icons } from "../components/icons";
import {
  Box,
  Callout,
  Icon,
  Link,
  Svg,
  SvgText,
  Title,
} from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

const STEPS: { t: string; icon: IconName }[] = [
  { t: "Davantage de puissance par rack", icon: "bolt" },
  { t: "Intensités et chaleur à gérer", icon: "thermometer" },
  {
    t: "Évolution de la distribution électrique et du refroidissement",
    icon: "snow",
  },
  { t: "Composants et intégration supplémentaires", icon: "gear" },
  { t: "Changement du contenu fournisseur par rack", icon: "euro" },
];
const BX = 480;
const BW = 1000;
const BH = 80;
const by = (i: number) => 210 + i * 132;

const Chain: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = [1, 2, 3, 4, 5].map((i) => cues.s(i));
  // Une impulsion descend la chaîne au rythme de la voix.
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), 0);
  const pulse = progress(frame, starts[current], 0.5);
  return (
    <AbsoluteFill>
      <Title text="La chaîne causale" start={cues.s(0)} top={110} />
      <Svg>
        {STEPS.map((s, i) => (
          <g key={s.t} opacity={i === current ? 1 : 0.62}>
            <Box
              x={BX}
              y={by(i)}
              w={BW}
              h={BH}
              label={s.t}
              start={starts[i]}
              variant={i === 0 ? "side" : i === 4 ? "hi" : "default"}
              size={28}
            />
            <Icon
              name={s.icon}
              x={BX - 70}
              y={by(i) + BH / 2}
              size={26}
              start={starts[i] + 6}
              color={
                i === 0 ? COLORS.warm : i === 4 ? COLORS.accent : COLORS.ink
              }
            />
            {i > 0 && (
              <>
                <Link
                  from={[960, by(i - 1) + BH]}
                  to={[960, by(i)]}
                  start={starts[i] - 8}
                  gap={6}
                  color={COLORS.accent}
                />
                <SvgText
                  x={985}
                  y={by(i) - 26}
                  text="donc"
                  start={starts[i] - 4}
                  size={22}
                  anchor="start"
                  color={COLORS.accent}
                />
              </>
            )}
          </g>
        ))}
        {current > 0 && pulse < 1 && (
          <circle
            cx={960}
            cy={
              by(current - 1) +
              BH +
              pulse * (by(current) - by(current - 1) - BH)
            }
            r={6}
            fill={COLORS.accent}
          />
        )}
      </Svg>
    </AbsoluteFill>
  );
};

// Même puissance totale : six racks moyens ou trois racks deux fois plus puissants.
const RackGroup: React.FC<{
  cx: number;
  n: number;
  bolts: number;
  start: number;
  color: string;
}> = ({ cx, n, bolts, start, color }) => {
  const frame = useCurrentFrame();
  const gap = 90;
  const x0 = cx - ((n - 1) * gap) / 2;
  return (
    <g>
      {new Array(n).fill(0).map((_, i) => (
        <g key={i}>
          <Icon
            name="rack"
            x={x0 + i * gap}
            y={600}
            size={34}
            start={start + i * 4}
            color={COLORS.inkSoft}
          />
          {new Array(bolts).fill(0).map((__, b) => (
            <path
              key={b}
              d={icons.bolt(x0 + i * gap + (b - (bolts - 1) / 2) * 24, 535, 12)}
              fill="none"
              stroke={color}
              strokeWidth={1.8}
              opacity={progress(frame, start + 20 + i * 4, 0.5)}
            />
          ))}
        </g>
      ))}
    </g>
  );
};

const Analyst: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t8 = cues.s(8);
  const bar = progress(frame, t8 + 60, 1);
  return (
    <AbsoluteFill>
      <Callout kind="analyst" start={cues.s(6)} y={110} width={1460} size={34}>
        Vérifier séparément la{" "}
        <span style={{ color: COLORS.warm }}>puissance par rack</span>, le{" "}
        <span style={{ color: COLORS.warm }}>nombre de racks</span> et la{" "}
        <span style={{ color: COLORS.warm }}>puissance totale du site</span>.
      </Callout>
      <FadeIn
        start={t8}
        style={{
          position: "absolute",
          top: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300), color: COLORS.inkSoft }}>
          Des racks plus puissants n’impliquent pas forcément plus de puissance
          totale si leur nombre diminue.
        </div>
      </FadeIn>
      <Svg>
        <RackGroup
          cx={560}
          n={6}
          bolts={1}
          start={t8 + 10}
          color={COLORS.inkSoft}
        />
        <RackGroup
          cx={1360}
          n={3}
          bolts={2}
          start={t8 + 30}
          color={COLORS.warm}
        />
        <SvgText
          x={560}
          y={680}
          text="6 racks"
          start={t8 + 20}
          size={26}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={1360}
          y={680}
          text="3 racks deux fois plus puissants"
          start={t8 + 40}
          size={26}
          color={COLORS.warm}
        />
        <rect
          x={560 - 240}
          y={730}
          width={480 * bar}
          height={16}
          rx={8}
          fill={COLORS.accent}
          opacity={0.6}
        />
        <rect
          x={1360 - 240}
          y={730}
          width={480 * bar}
          height={16}
          rx={8}
          fill={COLORS.accent}
          opacity={0.6}
        />
        <SvgText
          x={960}
          y={738}
          text="="
          start={t8 + 80}
          size={44}
          color={COLORS.accent}
        />
        <SvgText
          x={960}
          y={800}
          text="même puissance totale"
          start={t8 + 90}
          size={26}
          color={COLORS.accent}
        />
        <DrawPath
          d="M 960 500 V 690"
          start={t8 + 10}
          duration={0.6}
          stroke={COLORS.inkFaint}
          width={1}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Scène 24 — La chaîne causale, puis le point analyste sur la puissance par rack.
export const S24: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(6)}>
        <Chain />
      </Stage>
      <Stage from={cues.s(6)}>
        <Analyst />
      </Stage>
    </AbsoluteFill>
  );
};
