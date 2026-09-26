import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { icons, roundRectPath } from "../components/icons";
import { Svg, Title } from "../components/kit";
import {
  DrawPath,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT } from "../theme";
import { TextAt, accentA, caps, clockPath, warmA } from "./S23";

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

type BlockState = {
  period: number; // période d'horloge en px (0 = arrêtée)
  sw: number; // part de commutation (0–1)
  leak: number; // part de fuite (0–1)
  power: number; // 1 = alimenté, 0 = coupé
  focus: number; // mise en avant
};

// Un bloc de la puce : horloge, logique qui commute, deux jauges.
const Block: React.FC<{
  x: number;
  y: number;
  name: string;
  st: BlockState;
  start: number;
  phase: number;
}> = ({ x, y, name, st, start, phase }) => {
  const frame = useCurrentFrame();
  const o = progress(frame, start, 0.6);
  const w = 330;
  const h = 260;
  const dim = 0.35 + 0.65 * st.power;
  return (
    <g opacity={o}>
      <path
        d={roundRectPath(x, y, w, h, 12)}
        fill={accentA(0.05 * st.power)}
        stroke={st.focus > 0.5 ? COLORS.accent : COLORS.inkSoft}
        strokeWidth={st.focus > 0.5 ? 2.2 : 1.4}
      />
      <text
        x={x + 20}
        y={y + 36}
        fontFamily={FONT}
        fontWeight={500}
        fontSize={22}
        fill={COLORS.ink}
        letterSpacing="0.12em"
        opacity={dim}
      >
        {name}
      </text>
      {/* Interrupteur d'alimentation */}
      <g
        stroke={st.power > 0.5 ? COLORS.ink : COLORS.warm}
        strokeWidth={2}
        opacity={0.9}
      >
        <path d={`M ${x + 250} ${y + 28} H ${x + 268}`} />
        <path
          d={`M ${x + 268} ${y + 28} L ${x + 268 + 22 * Math.cos(-0.7 * (1 - st.power))} ${y + 28 + 22 * Math.sin(-0.7 * (1 - st.power))}`}
        />
        <path d={`M ${x + 292} ${y + 28} H ${x + 310}`} />
      </g>
      <text
        x={x + 280}
        y={y + 56}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={22}
        fill={COLORS.inkSoft}
      >
        VDD
      </text>
      {/* Horloge */}
      <path
        d={clockPath(x + 20, y + 84, 200, 22, st.period, phase)}
        fill="none"
        stroke={COLORS.accent}
        strokeWidth={1.6}
        opacity={dim}
      />
      {/* Logique qui commute */}
      {new Array(12).fill(0).map((_, i) => {
        const cx = x + 30 + (i % 6) * 50;
        const cy = y + 122 + Math.floor(i / 6) * 26;
        const blink = 0.5 + 0.5 * Math.sin(frame * 0.35 + i * 2.1);
        return (
          <rect
            key={i}
            x={cx - 10}
            y={cy - 8}
            width={20}
            height={16}
            rx={3}
            fill={COLORS.accent}
            opacity={(0.12 + 0.6 * blink * st.sw) * dim}
          />
        );
      })}
      {/* Jauges */}
      {[
        {
          label: "commutation",
          v: st.sw,
          color: COLORS.accent,
          fill: accentA(0.35),
        },
        { label: "fuites", v: st.leak, color: COLORS.warm, fill: warmA(0.4) },
      ].map((g, i) => (
        <g key={g.label}>
          <text
            x={x + 20}
            y={y + 200 + i * 34}
            fontFamily={FONT}
            fontWeight={300}
            fontSize={22}
            fill={g.color}
          >
            {g.label}
          </text>
          <rect
            x={x + 170}
            y={y + 184 + i * 34}
            width={140}
            height={20}
            fill="none"
            stroke={COLORS.inkFaint}
          />
          <rect
            x={x + 170}
            y={y + 184 + i * 34}
            width={140 * g.v}
            height={20}
            fill={g.fill}
          />
        </g>
      ))}
    </g>
  );
};

export const S25: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const b1 = cues.beat(1);
  const b2 = cues.beat(2);
  const b3 = cues.beat(3);
  const gate = progress(frame, cues.s(1, 1.6), 0.8);
  const pgate = progress(frame, cues.s(3, 1.4), 0.9);
  const dvfs = progress(frame, cues.s(5, 2.2), 2.0);
  const phase = frame * 2;
  const focus = (from: number, to: number) =>
    frame >= from && frame < to ? 1 : 0;
  const states: BlockState[] = [
    { period: 40, sw: 1, leak: 1, power: 1, focus: 0 },
    {
      period: gate > 0.5 ? 0 : 40,
      sw: 1 - gate,
      leak: 1,
      power: 1,
      focus: focus(b1, b2),
    },
    {
      period: pgate > 0.5 ? 0 : 40,
      sw: 1 - pgate,
      leak: 1 - pgate,
      power: 1 - pgate,
      focus: focus(b2, b3),
    },
    {
      period: lerp(40, 70, dvfs),
      sw: lerp(1, 0.38, dvfs),
      leak: lerp(1, 0.75, dvfs),
      power: 1,
      focus: focus(b3, cues.end + 60),
    },
  ];
  const names = ["BLOC A", "BLOC B", "BLOC C", "BLOC D"];
  const pos = [
    [190, 270],
    [550, 270],
    [190, 560],
    [550, 560],
  ];
  const t0 = cues.s(0);
  // Curseurs DVFS : tension et fréquence liées.
  const vK = lerp(1, 0.8, dvfs);
  const fK = lerp(1, 0.6, dvfs);
  const sx = (k: number) => 1200 + 500 * k;
  const s6 = cues.s(6);
  return (
    <AbsoluteFill>
      <Title
        kicker="Fuites et limites de la tension"
        text="Trois leviers, logiciels et matériels"
        start={t0}
      />
      <Svg>
        <DrawPath
          d={roundRectPath(160, 240, 750, 610, 18)}
          start={t0 + 6}
          duration={1}
          stroke={COLORS.inkFaint}
          width={1.4}
        />
        {states.map((st, i) => (
          <Block
            key={i}
            x={pos[i][0]}
            y={pos[i][1]}
            name={names[i]}
            st={st}
            start={t0 + 12 + i * 5}
            phase={phase}
          />
        ))}
        {/* Annotations dans les blocs */}
        <text
          x={pos[1][0] + 230}
          y={pos[1][1] + 92}
          fontFamily={FONT}
          fontSize={22}
          fill={COLORS.accent}
          textAnchor="start"
          opacity={gate}
        >
          arrêtée
        </text>
        <text
          x={pos[2][0] + 165}
          y={pos[2][1] + 130}
          fontFamily={FONT}
          fontSize={24}
          fill={COLORS.warm}
          textAnchor="middle"
          opacity={pgate}
        >
          alimentation coupée
        </text>
        {/* Curseurs DVFS */}
        <g opacity={progress(frame, cues.s(5, 0.8), 0.6)}>
          {[
            { y: 610, label: "tension", k: vK },
            { y: 690, label: "fréquence", k: fK },
          ].map((c) => (
            <g key={c.label}>
              <text
                x={1000}
                y={c.y + 8}
                fontFamily={FONT}
                fontSize={24}
                fill={COLORS.ink}
                textAnchor="start"
              >
                {c.label}
              </text>
              <path
                d={`M ${sx(0)} ${c.y} H ${sx(1)}`}
                stroke={COLORS.inkFaint}
                strokeWidth={4}
              />
              <path
                d={`M ${sx(0)} ${c.y} H ${sx(c.k)}`}
                stroke={COLORS.accent}
                strokeWidth={4}
              />
              <circle
                cx={sx(c.k)}
                cy={c.y}
                r={12}
                fill="#0a1a3d"
                stroke={COLORS.accent}
                strokeWidth={2}
              />
            </g>
          ))}
          <path
            d={`M ${sx(vK)} 622 L ${sx(fK)} 678`}
            stroke={COLORS.accent}
            strokeWidth={1.4}
            strokeDasharray="5 6"
          />
        </g>
      </Svg>

      {/* Panneau de droite : un levier à la fois */}
      <Stage from={t0} to={b1}>
        <TextAt x={1000} y={300} w={760} start={t0 + 20}>
          <div style={caps()}>DANS CHAQUE BLOC, DEUX JAUGES</div>
          <div style={{ ...textStyle(30, 300), marginTop: 18 }}>
            <span style={{ color: COLORS.accent }}>commutation</span> :
            l’énergie des transitions
          </div>
          <div style={{ ...textStyle(30, 300), marginTop: 10 }}>
            <span style={{ color: COLORS.warm }}>fuites</span> : le courant
            permanent
          </div>
        </TextAt>
      </Stage>
      <Stage from={b1} to={b2}>
        <TextAt x={1000} y={280} w={760} start={b1}>
          <div style={textStyle(54, 200)}>Clock gating</div>
          <div style={{ ...textStyle(30, 300), marginTop: 16 }}>
            arrête l’horloge des blocs inutilisés (bloc B)
          </div>
        </TextAt>
        <TextAt x={1000} y={480} w={760} start={cues.s(2)}>
          <div style={{ ...textStyle(30, 300), color: COLORS.accent }}>
            commutation : supprimée
          </div>
          <div
            style={{ ...textStyle(30, 300), color: COLORS.warm, marginTop: 12 }}
          >
            fuites : peuvent rester (le bloc est toujours alimenté)
          </div>
        </TextAt>
      </Stage>
      <Stage from={b2} to={b3}>
        <TextAt x={1000} y={280} w={760} start={b2}>
          <div style={textStyle(54, 200)}>Power gating</div>
          <div style={{ ...textStyle(30, 300), marginTop: 16 }}>
            coupe l’alimentation de blocs (bloc C)
          </div>
        </TextAt>
        <TextAt x={1000} y={470} w={760} start={cues.s(4)}>
          <div style={{ ...textStyle(30, 300), color: COLORS.accent }}>
            commutation et fuites : supprimées
          </div>
        </TextAt>
        <Svg>
          <DrawPath
            d={icons.gear(1030, 610, 22)}
            start={cues.s(4, 2)}
            stroke={COLORS.warm}
          />
          <DrawPath
            d={icons.memory(1030, 700, 22)}
            start={cues.s(4, 3)}
            stroke={COLORS.warm}
          />
        </Svg>
        <TextAt x={1080} y={590} w={680} start={cues.s(4, 2)}>
          <div style={{ ...textStyle(28, 300), color: COLORS.warm }}>
            réveil à gérer : délai et énergie de remise sous tension
          </div>
        </TextAt>
        <TextAt x={1080} y={682} w={680} start={cues.s(4, 3)}>
          <div style={{ ...textStyle(28, 300), color: COLORS.warm }}>
            état à conserver : sauvegarder avant, restaurer après
          </div>
        </TextAt>
      </Stage>
      <Stage from={b3}>
        <TextAt x={1000} y={270} w={760} start={b3}>
          <div style={textStyle(54, 200)}>DVFS</div>
          <div
            style={{
              ...textStyle(24, 300),
              color: COLORS.inkSoft,
              marginTop: 6,
            }}
          >
            Dynamic Voltage and Frequency Scaling
          </div>
          <div style={{ ...textStyle(30, 300), marginTop: 14 }}>
            ajuste ensemble tension et fréquence (bloc D)
          </div>
        </TextAt>
        <TextAt x={1000} y={500} w={780} start={cues.s(5, 2.4)}>
          <div style={{ ...textStyle(26, 300), color: COLORS.inkSoft }}>
            fréquence plus basse → tension plus basse possible ; commutation ∝
            V² · f
          </div>
        </TextAt>
        <TextAt x={1000} y={740} w={780} start={s6}>
          <div style={caps(COLORS.warm)}>ARBITRAGE</div>
          <div style={{ ...textStyle(30, 300), marginTop: 8 }}>
            vitesse · puissance · délais · stabilité
          </div>
        </TextAt>
      </Stage>
    </AbsoluteFill>
  );
};
