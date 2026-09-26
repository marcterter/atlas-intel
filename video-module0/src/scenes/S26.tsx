import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { icons, roundRectPath } from "../components/icons";
import { Icon, Svg, SvgText, Title } from "../components/kit";
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

const small = (color: string = COLORS.inkSoft): React.CSSProperties => ({
  ...textStyle(18, 500),
  color,
  letterSpacing: "0.3em",
});

// Colonne de texte à droite : étiquette, fait, nuance, source.
const FactText: React.FC<{
  start: number;
  label: string;
  fact: React.ReactNode;
  nuance?: React.ReactNode;
  nuanceAt?: number;
  source: string;
  sourceAt: number;
}> = ({ start, label, fact, nuance, nuanceAt = 0, source, sourceAt }) => {
  const frame = useCurrentFrame();
  const bar = progress(frame, start, 0.9);
  return (
    <div style={{ position: "absolute", left: 900, top: 300, width: 860 }}>
      <div
        style={{
          position: "absolute",
          left: -40,
          top: 0,
          width: 2,
          height: 480 * bar,
          background: COLORS.accent,
        }}
      />
      <FadeIn start={start + 4}>
        <div style={{ ...small(COLORS.accent), marginBottom: 22 }}>{label}</div>
      </FadeIn>
      <FadeIn start={start + 10}>
        <div style={{ ...textStyle(32, 300), lineHeight: 1.4 }}>{fact}</div>
      </FadeIn>
      {nuance && (
        <FadeIn start={nuanceAt} style={{ marginTop: 36 }}>
          <div
            style={{
              ...textStyle(30, 300),
              lineHeight: 1.4,
              color: COLORS.warm,
            }}
          >
            {nuance}
          </div>
        </FadeIn>
      )}
      <FadeIn start={sourceAt} style={{ marginTop: 30 }}>
        <div style={small()}>{source}</div>
      </FadeIn>
    </div>
  );
};

// Fait 1 — TSMC : ce que couvrent les investissements, puis le délai jusqu'à la capacité.
const Tsmc: React.FC = () => {
  const cues = useCues();
  const t = cues.s(1);
  const items = [
    { icon: "wafer" as const, x: 260, label: "fabrication\navancée" },
    { icon: "stack" as const, x: 480, label: "packaging" },
    {
      icon: "building" as const,
      x: 700,
      label: "installations\nindustrielles",
    },
  ];
  const g = cues.s(2);
  return (
    <AbsoluteFill>
      <Svg>
        {items.map((it, i) => (
          <g key={it.label}>
            <Icon
              name={it.icon}
              x={it.x}
              y={400}
              size={42}
              start={t + FPS * (4 + i * 1.3)}
              color={COLORS.ink}
            />
            <SvgText
              x={it.x}
              y={494}
              text={it.label}
              start={t + FPS * (4.3 + i * 1.3)}
              size={24}
              color={COLORS.inkSoft}
            />
          </g>
        ))}
        {/* De l'autorisation à la capacité productive : un chemin long. */}
        <Icon
          name="check"
          x={240}
          y={680}
          size={30}
          start={g}
          color={COLORS.accent}
        />
        <SvgText
          x={240}
          y={750}
          text="autorisation"
          start={g + 6}
          size={24}
          color={COLORS.accent}
        />
        <DrawPath
          d="M 300 680 C 400 610, 520 750, 620 680"
          start={g + 12}
          duration={2.2}
          stroke={COLORS.warm}
          width={2}
        />
        <DrawPath
          d={icons.factory(700, 680, 42)}
          start={g + FPS * 2.2}
          duration={0.9}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={700}
          y={750}
          text="capacité productive"
          start={g + FPS * 2.4}
          size={24}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={460}
          y={620}
          text="délai"
          start={g + FPS * 1.2}
          size={22}
          color={COLORS.warm}
          spacing="0.2em"
        />
      </Svg>
      <FactText
        start={t}
        label="FAIT PUBLIÉ · 11 AOÛT 2026"
        fact={
          <>
            <span style={{ fontWeight: 400 }}>TSMC</span> approuve des
            investissements couvrant notamment fabrication avancée, packaging et
            installations industrielles.
          </>
        }
        nuance="Une autorisation d’investissement n’est pas une capacité immédiatement productive."
        nuanceAt={g}
        source="SOURCE 5"
        sourceAt={cues.s(3)}
      />
    </AbsoluteFill>
  );
};

// Fait 2 — AIE : le raccordement fait goulot, certains produisent sur site.
const Iea: React.FC = () => {
  const cues = useCues();
  const t = cues.s(4);
  const at = (s: number) => t + FPS * s;
  return (
    <AbsoluteFill>
      <Svg>
        <Icon
          name="bolt"
          x={240}
          y={440}
          size={44}
          start={at(1)}
          color={COLORS.ink}
        />
        <SvgText
          x={240}
          y={530}
          text="réseau"
          start={at(1.2)}
          size={24}
          color={COLORS.inkSoft}
        />
        <DrawPath
          d="M 290 440 H 400"
          start={at(2.5)}
          duration={0.5}
          stroke={COLORS.inkSoft}
        />
        <Icon
          name="bottleneck"
          x={470}
          y={440}
          size={60}
          start={at(3)}
          color={COLORS.warm}
          duration={1}
        />
        <SvgText
          x={470}
          y={530}
          text="raccordement"
          start={at(3.4)}
          size={24}
          color={COLORS.warm}
        />
        <DrawPath
          d="M 540 440 H 640"
          start={at(4)}
          duration={0.5}
          stroke={COLORS.inkSoft}
        />
        <Icon name="building" x={700} y={440} size={46} start={at(4.3)} />
        <SvgText
          x={700}
          y={530}
          text="centre de données"
          start={at(4.6)}
          size={24}
          color={COLORS.inkSoft}
        />
        {/* Production électrique sur site */}
        <Icon
          name="factory"
          x={700}
          y={720}
          size={40}
          start={at(7.5)}
          color={COLORS.accent}
        />
        <DrawPath
          d="M 700 670 V 505"
          start={at(8.3)}
          duration={0.6}
          stroke={COLORS.accent}
        />
        <SvgText
          x={540}
          y={720}
          text="production\nsur site"
          start={at(7.8)}
          size={24}
          color={COLORS.accent}
          anchor="end"
        />
      </Svg>
      <FactText
        start={t}
        label="FAIT PUBLIÉ · AGENCE INTERNATIONALE DE L’ÉNERGIE, 2026"
        fact={
          <>
            Des{" "}
            <span style={{ color: COLORS.warm }}>
              contraintes de raccordement
            </span>{" "}
            et le recours de certains développeurs américains à la{" "}
            <span style={{ color: COLORS.accent }}>
              production électrique sur site
            </span>
            .
          </>
        }
        source="SOURCE 6"
        sourceAt={cues.s(5)}
      />
    </AbsoluteFill>
  );
};

// Fait 3 — Tomahawk 6 : 102,4 Tb/s, débit agrégé de tous les ports.
const Switch: React.FC = () => {
  const cues = useCues();
  const t = cues.s(6);
  const frame = useCurrentFrame();
  const n = 12;
  const ys = new Array(n).fill(0).map((_, i) => 470 + i * 26);
  const one = progress(frame, cues.s(7, 2.6), 0.6);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 270,
          width: 640,
          textAlign: "center",
        }}
      >
        <FadeIn start={t + FPS * 4}>
          <div style={textStyle(96, 200)}>
            <Counter to={102.4} decimals={1} start={t + FPS * 4} duration={2} />
            <span style={{ fontSize: 40, color: COLORS.inkSoft }}> Tb/s</span>
          </div>
        </FadeIn>
      </div>
      <Svg>
        <DrawPath
          d={roundRectPath(200, 520, 260, 200, 14)}
          start={t + FPS * 1.5}
          duration={0.9}
          stroke={COLORS.ink}
        />
        <SvgText
          x={330}
          y={600}
          text="Tomahawk 6"
          start={t + FPS * 2}
          size={26}
        />
        <SvgText
          x={330}
          y={645}
          text="commutateur"
          start={t + FPS * 2.2}
          size={22}
          color={COLORS.inkSoft}
        />
        {ys.map((y, i) => (
          <DrawPath
            key={i}
            d={`M 460 ${540 + i * 14} C 540 ${540 + i * 14}, 580 ${y}, 700 ${y}`}
            start={t + FPS * 2.5 + i * 3}
            duration={0.6}
            stroke={
              i === 5
                ? one > 0
                  ? COLORS.warm
                  : COLORS.inkSoft
                : COLORS.inkSoft
            }
            width={i === 5 ? 1.5 + one * 1.5 : 1.5}
          />
        ))}
        {/* Accolade : la somme de tous les ports. */}
        <DrawPath
          d={`M 720 ${ys[0]} H 735 V ${ys[n - 1]} H 720 M 735 ${(ys[0] + ys[n - 1]) / 2} H 750`}
          start={cues.s(7)}
          duration={0.8}
          stroke={COLORS.accent}
        />
        <SvgText
          x={760}
          y={430}
          text="débit agrégé"
          start={cues.s(7, 0.6)}
          size={24}
          color={COLORS.accent}
          anchor="end"
        />
        <SvgText
          x={600}
          y={800}
          text="une connexion : une fraction"
          start={cues.s(7, 2.8)}
          size={24}
          color={COLORS.warm}
        />
      </Svg>
      <FactText
        start={t}
        label="FAIT PUBLIÉ · MARS 2026"
        fact={
          <>
            <span style={{ fontWeight: 400 }}>Broadcom</span> annonce des
            livraisons en volume du commutateur Tomahawk 6 de 102,4 térabits/s.
          </>
        }
        nuance="C’est le débit agrégé du commutateur, pas celui d’une connexion individuelle."
        nuanceAt={cues.s(7)}
        source="SOURCE 7"
        sourceAt={cues.s(8)}
      />
    </AbsoluteFill>
  );
};

// Pastilles 1 · 2 · 3 sous le titre.
const Dots: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = [cues.s(1), cues.s(4), cues.s(6)];
  const cur = starts.reduce((a, s, i) => (frame >= s ? i : a), 0);
  return (
    <div
      style={{
        position: "absolute",
        top: 222,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        gap: 40,
      }}
    >
      {starts.map((s, i) => (
        <div
          key={i}
          style={{
            ...textStyle(22, i === cur ? 500 : 300),
            color: i === cur ? COLORS.accent : COLORS.inkSoft,
            opacity: progress(frame, s - 10, 0.5) * (i === cur ? 1 : 0.6),
            letterSpacing: "0.2em",
          }}
        >
          {`0${i + 1}`}
        </div>
      ))}
    </div>
  );
};

// Scène 26 — Trois repères industriels vérifiés.
export const S26: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Title
        kicker="Faits publiés"
        text="Trois repères industriels vérifiés"
        start={cues.s(0)}
        top={100}
      />
      <Dots />
      <Stage from={cues.s(1)} to={cues.s(4)}>
        <Tsmc />
      </Stage>
      <Stage from={cues.s(4)} to={cues.s(6)}>
        <Iea />
      </Stage>
      <Stage from={cues.s(6)}>
        <Switch />
      </Stage>
    </AbsoluteFill>
  );
};
