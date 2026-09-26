import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { icons, roundRectPath } from "../components/icons";
import { Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
  Counter,
  DrawPath,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import { Flow, Pill, SvgCaps, TextAt, accentA, caps } from "./S23";

const Y0 = 620;
const PW = 2.6; // px par watt
const SX = 45; // px par seconde

// Compteur de joules avec séparateur de milliers.
const Joules: React.FC<{ to: number; start: number }> = ({ to, start }) => {
  const frame = useCurrentFrame();
  const v = Math.round(to * progress(frame, start, 1.4));
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {v.toLocaleString("fr-FR", { useGrouping: true })}
    </span>
  );
};

// Graphe puissance × temps : l'aire du rectangle est l'énergie.
const PowerChart: React.FC<{
  x0: number;
  watts: number;
  secs: number;
  axisAt: number;
  fillAt: number;
  energyAt: number;
  joules: number;
  name: string;
  color: string;
  fill: string;
}> = ({
  x0,
  watts,
  secs,
  axisAt,
  fillAt,
  energyAt,
  joules,
  name,
  color,
  fill,
}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, fillAt, 1.6);
  const w = secs * SX;
  const h = watts * PW;
  return (
    <>
      <Svg>
        <DrawPath
          d={`M ${x0} ${Y0 - 100 * PW - 30} V ${Y0} H ${x0 + 12 * SX + 40}`}
          start={axisAt}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={x0 - 12}
          y={Y0 - 100 * PW - 50}
          text="puissance (W)"
          start={axisAt + 6}
          size={22}
          color={COLORS.inkSoft}
          anchor="start"
        />
        <SvgText
          x={x0 + 12 * SX + 40}
          y={Y0 + 56}
          text="temps (s)"
          start={axisAt + 6}
          size={22}
          color={COLORS.inkSoft}
          anchor="end"
        />
        {[0, 10, 12].map((s) => (
          <SvgText
            key={s}
            x={x0 + s * SX}
            y={Y0 + 26}
            text={String(s)}
            start={axisAt + 8}
            size={22}
            color={COLORS.inkSoft}
          />
        ))}
        <SvgText
          x={x0 - 14}
          y={Y0 - h}
          text={String(watts)}
          start={fillAt}
          size={22}
          color={color}
          anchor="end"
        />
        <rect x={x0} y={Y0 - h} width={w * p} height={h} fill={fill} />
        {p > 0 && (
          <path
            d={`M ${x0} ${Y0 - h} H ${x0 + w * p} V ${Y0}`}
            fill="none"
            stroke={color}
            strokeWidth={2}
          />
        )}
        <SvgText
          x={x0 + w / 2}
          y={Y0 - h - 34}
          text={name}
          start={fillAt}
          size={26}
          color={color}
          weight={400}
        />
      </Svg>
      <TextAt
        x={x0 + w / 2}
        y={Y0 - h / 2 - 50}
        w={w}
        start={energyAt}
        align="center"
      >
        <div style={{ ...textStyle(52, 200) }}>
          <Joules to={joules} start={energyAt} />{" "}
          <span style={{ fontSize: 30, color: COLORS.inkSoft }}>J</span>
        </div>
        <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
          {watts} W × {secs} s
        </div>
      </TextAt>
    </>
  );
};

const Example: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t1 = cues.s(1);
  const e = cues.s(2);
  const s3 = cues.s(3);
  const s4 = cues.s(4);
  return (
    <AbsoluteFill>
      <Title
        kicker="Fuites et limites de la tension"
        text="Du calcul à l’infrastructure"
        start={cues.s(0)}
      />
      <Pill text="EXEMPLE FICTIF" start={t1} x={1780} y={112} />
      <PowerChart
        x0={260}
        watts={100}
        secs={10}
        axisAt={t1}
        fillAt={t1 + FPS * 1.4}
        energyAt={e + FPS * 0.3}
        joules={1000}
        name="Mode 1"
        color={COLORS.ink}
        fill={"rgba(232, 240, 255, 0.12)"}
      />
      <PowerChart
        x0={1060}
        watts={70}
        secs={12}
        axisAt={t1 + 10}
        fillAt={t1 + FPS * 4.6}
        energyAt={e + FPS * 2.4}
        joules={840}
        name="Mode 2"
        color={COLORS.accent}
        fill={accentA(0.16)}
      />
      <Svg>
        {/* Rappel du mode 1 sur le graphe du mode 2 */}
        <path
          d={`M ${1060} ${Y0 - 100 * PW} H ${1060 + 10 * SX} V ${Y0}`}
          fill="none"
          stroke={COLORS.inkSoft}
          strokeWidth={1.4}
          strokeDasharray="6 7"
          opacity={progress(frame, s3, 0.8)}
        />
        <SvgText
          x={1060 + 5 * SX}
          y={Y0 - 100 * PW - 22}
          text="mode 1"
          start={s3}
          size={22}
          color={COLORS.inkSoft}
        />
        <path
          d={`M ${1060 + 10 * SX} ${Y0 + 40} H ${1060 + 12 * SX}`}
          stroke={COLORS.warm}
          strokeWidth={3}
          opacity={progress(frame, s3 + FPS * 1.6, 0.5)}
        />
        <SvgCaps
          x={960}
          y={Y0 - 100 * PW - 90}
          text="énergie = puissance × temps = aire"
          start={e}
          color={COLORS.ink}
        />
      </Svg>
      <TextAt x={1330} y={705} w={560} start={s3 + 10} align="center">
        <div style={{ ...textStyle(36, 300), color: COLORS.accent }}>
          −<Counter to={16} start={s3 + 10} duration={1} /> % d’énergie
        </div>
        <div
          style={{ ...textStyle(28, 300), color: COLORS.warm, marginTop: 4 }}
        >
          mais +2 s : plus lent
        </div>
      </TextAt>
      <TextAt x={170} y={705} w={760} start={s4}>
        <div style={caps(COLORS.warm)}>POINT ANALYSTE · LE CHOIX DÉPEND</div>
        <div style={{ ...textStyle(28, 300), marginTop: 10 }}>
          du délai acceptable
        </div>
        <div style={{ ...textStyle(28, 300), marginTop: 4 }}>
          des autres consommations du système pendant ces 2 s
        </div>
      </TextAt>
    </AbsoluteFill>
  );
};

// Le refroidissement : utile, mais il consomme lui-même.
const Cooling: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(5);
  const s6 = cues.s(6);
  const hot = progress(frame, s6, 0.8);
  return (
    <AbsoluteFill>
      <TextAt x={960} y={140} w={1400} start={t} align="center">
        <div style={textStyle(42, 200)}>Et le refroidissement ?</div>
      </TextAt>
      <Svg>
        {/* Réseau électrique */}
        <DrawPath d={icons.bolt(300, 490, 44)} start={t} stroke={COLORS.warm} />
        <SvgText
          x={300}
          y={580}
          text="électricité"
          start={t + 8}
          size={24}
          color={COLORS.ink}
        />
        {/* Puce */}
        <DrawPath
          d={roundRectPath(700, 290, 260, 150, 12)}
          start={t + 10}
          duration={0.7}
          stroke={COLORS.ink}
        />
        <DrawPath
          d={icons.chip(760, 365, 32)}
          start={t + 16}
          stroke={COLORS.accent}
        />
        <SvgText x={870} y={350} text="calcul" start={t + 18} size={28} />
        <SvgText
          x={870}
          y={390}
          text="(la puce)"
          start={t + 18}
          size={22}
          color={COLORS.inkSoft}
        />
        {/* Refroidissement */}
        <DrawPath
          d={roundRectPath(700, 560, 260, 150, 12)}
          start={t + 22}
          duration={0.7}
          stroke={hot > 0.5 ? COLORS.warm : COLORS.ink}
        />
        <DrawPath
          d={icons.snow(760, 635, 30)}
          start={t + 28}
          stroke={COLORS.accent}
        />
        <SvgText x={870} y={620} text="refroidis-" start={t + 30} size={26} />
        <SvgText x={870} y={655} text="sement" start={t + 30} size={26} />
        {/* Alimentation des deux */}
        <Arrow
          x1={350}
          y1={470}
          x2={690}
          y2={370}
          start={t + 20}
          stroke={COLORS.ink}
        />
        <Arrow
          x1={350}
          y1={510}
          x2={690}
          y2={630}
          start={s6 + 6}
          stroke={COLORS.warm}
          width={2.4}
        />
        <Flow
          pts={[
            [350, 470],
            [690, 370],
          ]}
          start={t + 30}
          n={5}
          period={2.4}
          color={COLORS.accent}
          r={3.5}
        />
        <Flow
          pts={[
            [350, 510],
            [690, 630],
          ]}
          start={s6 + 20}
          n={5}
          period={2.4}
          color={COLORS.warm}
          r={3.5}
        />
        {/* Chaleur de la puce vers le refroidissement, puis évacuée */}
        <Flow
          pts={[
            [1000, 365],
            [1080, 365],
            [1080, 635],
            [1000, 635],
          ]}
          start={t + FPS * 1.5}
          n={7}
          period={3.4}
          color={COLORS.warm}
          r={4}
          jitter={3}
        />
        <SvgText
          x={1100}
          y={500}
          text="chaleur"
          start={t + FPS * 1.5}
          size={24}
          color={COLORS.warm}
          anchor="start"
        />
        <Arrow
          x1={960}
          y1={690}
          x2={1180}
          y2={780}
          start={t + FPS * 2.4}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={1195}
          y={790}
          text="évacuée vers l’extérieur"
          start={t + FPS * 2.6}
          size={22}
          color={COLORS.inkSoft}
          anchor="start"
        />
        {/* Thermomètre */}
        <DrawPath
          d={icons.thermometer(640, 250, 26)}
          start={t + FPS * 3}
          stroke={COLORS.accent}
        />
      </Svg>
      <TextAt x={1300} y={260} w={480} start={t + FPS * 3.2}>
        <div style={caps(COLORS.accent)}>CE QU’IL APPORTE</div>
        <div style={{ ...textStyle(28, 300), marginTop: 8 }}>
          une température compatible avec le fonctionnement et les performances
        </div>
      </TextAt>
      <TextAt x={1300} y={470} w={480} start={s6 + 10}>
        <div style={caps(COLORS.warm)}>ATTENTION</div>
        <div style={{ ...textStyle(28, 300), marginTop: 8 }}>
          il ne supprime pas le coût électrique du calcul, et il consomme{" "}
          <span style={{ color: COLORS.warm }}>lui-même</span> de l’énergie
        </div>
      </TextAt>
    </AbsoluteFill>
  );
};

export const S26: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(3)}>
        <Example />
      </Stage>
      <Stage from={cues.beat(3)}>
        <Cooling />
      </Stage>
    </AbsoluteFill>
  );
};
