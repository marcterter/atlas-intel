import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Callout, Icon, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

const TERMS = [
  { term: "Serveur", def: "Une machine informatique" },
  { term: "Rack", def: "Une baie accueillant des équipements" },
  { term: "Cluster", def: "Des machines qui travaillent ensemble" },
  { term: "Data center", def: "Le site qui les héberge" },
  {
    term: "Cloud",
    def: "Fournit et gère des ressources informatiques à distance",
  },
];

const RACK_W = 190;
const RACK_H = 250;
const RACK_Y = 440;
const rackX = (k: number) => 270 + k * (RACK_W + 30);
const slotY = (j: number) => RACK_Y + 16 + j * 46;

const Label: React.FC<{
  x: number;
  y: number;
  text: string;
  start: number;
  color: string;
}> = ({ x, y, text, start, color }) => (
  <SvgText
    x={x}
    y={y}
    text={text}
    start={start}
    size={22}
    weight={500}
    spacing="0.24em"
    anchor="start"
    color={color}
  />
);

// Emboîtement : serveur ⊂ rack ⊂ cluster ⊂ data center ⊂ cloud.
const Nested: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const st = [1, 2, 3, 4, 5].map((i) => cues.s(i));
  const current = st.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  const lit = (i: number) => (current === i ? COLORS.accent : COLORS.inkSoft);
  return (
    <AbsoluteFill>
      <Title
        kicker="De l’intérieur vers l’extérieur"
        text="Le vocabulaire de l’infrastructure"
        top={110}
        start={cues.s(0)}
      />
      <Svg>
        {/* Serveurs dans les racks */}
        {[0, 1, 2].map((k) =>
          [0, 1, 2, 3, 4].map((j) => {
            const first = k === 1 && j === 2;
            const at = first
              ? st[0]
              : k === 1
                ? st[1] + 10 + j * 3
                : st[2] + 10 + j * 3 + k * 4;
            return (
              <DrawPath
                key={`${k}-${j}`}
                d={roundRectPath(rackX(k) + 20, slotY(j), RACK_W - 40, 34, 5)}
                start={at}
                duration={first ? 0.8 : 0.4}
                stroke={first ? COLORS.accent : COLORS.inkSoft}
                width={first ? 2.4 : 1.4}
              />
            );
          }),
        )}
        {[0, 1, 2].map((k) => (
          <DrawPath
            key={k}
            d={roundRectPath(rackX(k), RACK_Y, RACK_W, RACK_H, 8)}
            start={k === 1 ? st[1] : st[2] + k * 4}
            duration={0.7}
            stroke={k === 1 ? lit(1) : COLORS.inkSoft}
          />
        ))}
        {/* Liens réseau entre racks */}
        {[0, 1].map((k) => (
          <DrawPath
            key={k}
            d={`M ${rackX(k) + RACK_W} ${RACK_Y + RACK_H / 2} H ${rackX(k + 1)}`}
            start={st[2] + 30}
            duration={0.4}
            stroke={lit(2)}
          />
        ))}
        <DrawPath
          d={roundRectPath(230, 400, 710, 330, 14)}
          start={st[2] + 16}
          duration={0.9}
          stroke={lit(2)}
        />
        <Label
          x={250}
          y={420}
          text="CLUSTER"
          start={st[2] + 24}
          color={lit(2)}
        />
        <DrawPath
          d={roundRectPath(190, 330, 790, 440, 18)}
          start={st[3]}
          duration={1}
          stroke={lit(3)}
        />
        <Label
          x={214}
          y={364}
          text="DATA CENTER"
          start={st[3] + 10}
          color={lit(3)}
        />
        <Icon
          name="building"
          x={930}
          y={364}
          size={20}
          start={st[3] + 14}
          color={lit(3)}
        />
        <DrawPath
          d={roundRectPath(150, 260, 870, 550, 30)}
          start={st[4]}
          duration={1.1}
          stroke={lit(4)}
        />
        <Label x={176} y={296} text="CLOUD" start={st[4] + 10} color={lit(4)} />
        <Icon
          name="cloud"
          x={960}
          y={296}
          size={26}
          start={st[4] + 14}
          color={lit(4)}
        />
      </Svg>
      {/* Définitions */}
      <div style={{ position: "absolute", top: 262, left: 1140, width: 640 }}>
        {TERMS.map((t, i) => {
          const o = progress(frame, st[i], 0.5);
          const on = current === i;
          return (
            <div
              key={t.term}
              style={{
                height: 112,
                opacity: o * (on ? 1 : 0.45),
                transform: `translateX(${(1 - o) * -14}px)`,
                borderLeft: `3px solid ${on ? COLORS.accent : COLORS.inkFaint}`,
                paddingLeft: 24,
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  ...textStyle(32, on ? 400 : 300),
                  color: on ? COLORS.accent : COLORS.ink,
                }}
              >
                {t.term}
              </div>
              <div
                style={{
                  ...textStyle(24, 300),
                  lineHeight: 1.3,
                  marginTop: 4,
                  color: COLORS.ink,
                }}
              >
                {t.def}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Point analyste : puissance théorique ≠ réponses utiles.
const Analyst: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const a = cues.s(7, 0.8);
  const b = cues.s(7, 3.2);
  const full = 900;
  const p1 = progress(frame, a, 1.2);
  const p2 = progress(frame, b, 1.2) * 0.38;
  const bars = [
    {
      label: "Puissance de calcul théorique",
      w: full * p1,
      color: COLORS.inkSoft,
      at: a,
    },
    {
      label: "Réponses utiles produites",
      w: full * p2,
      color: COLORS.warm,
      at: b,
    },
  ];
  return (
    <AbsoluteFill>
      <Callout kind="analyst" start={cues.s(6)} y={150} width={1440} size={34}>
        Acheter une puissance de calcul théorique{" "}
        <span style={{ color: COLORS.warm }}>ne garantit pas</span> de produire
        beaucoup de réponses utiles.
      </Callout>
      {bars.map((bar, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: 460 + i * 110,
            left: 240,
            display: "flex",
            alignItems: "center",
            gap: 30,
            opacity: progress(frame, bar.at - 10, 0.4),
          }}
        >
          <div
            style={{
              ...textStyle(26, 300),
              width: 440,
              textAlign: "right",
            }}
          >
            {bar.label}
          </div>
          <div
            style={{
              height: 22,
              width: bar.w,
              borderRadius: 11,
              background: bar.color,
            }}
          />
        </div>
      ))}
      <FadeIn
        start={cues.s(8)}
        style={{
          position: "absolute",
          top: 720,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(34, 300)}>
          La performance dépend{" "}
          <span style={{ color: COLORS.accent }}>du système</span> et{" "}
          <span style={{ color: COLORS.accent }}>du travail demandé</span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 9 — Serveur, rack, cluster, data center, cloud ; puis point analyste.
export const S09: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(6)}>
        <Nested />
      </Stage>
      <Stage from={cues.s(6)}>
        <Analyst />
      </Stage>
    </AbsoluteFill>
  );
};
