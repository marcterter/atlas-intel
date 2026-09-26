import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { IconName } from "../components/icons";
import { Bullets, Icon, SAFE, Svg, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";

export type Supplier = {
  brick: string;
  icon: IconName;
  actors: string[];
  extra?: string;
  clients: string;
  issue: string;
};

const ROWS: Supplier[] = [
  {
    brick: "Wafers",
    icon: "wafer",
    actors: ["Shin-Etsu", "SUMCO", "GlobalWafers"],
    clients: "Fabricants de puces",
    issue: "Pureté, qualité et qualification",
  },
  {
    brick: "Matériaux de procédé",
    icon: "stack",
    actors: ["Air Liquide", "Merck", "JSR"],
    clients: "Usines de puces",
    issue: "Régularité des gaz, des produits chimiques et des résines",
  },
  {
    brick: "Conception assistée",
    icon: "pencil",
    actors: ["Synopsys", "Cadence", "Siemens EDA"],
    clients: "Concepteurs de puces",
    issue: "Complexité des circuits et coût des erreurs",
  },
  {
    brick: "Blocs de conception",
    icon: "chip",
    actors: ["Arm", "Synopsys", "Cadence"],
    clients: "Concepteurs",
    issue: "Compatibilité, performances et licences",
  },
  {
    brick: "Lithographie",
    icon: "light",
    actors: ["ASML", "Nikon", "Canon"],
    extra: "Nikon et Canon : sur d’autres segments",
    clients: "Fabricants de puces",
    issue: "Précision, productivité et coût",
  },
];

const Label: React.FC<{ text: string; color?: string }> = ({
  text,
  color = COLORS.inkSoft,
}) => (
  <div
    style={{
      ...textStyle(20, 500),
      color,
      letterSpacing: "0.28em",
      marginBottom: 12,
    }}
  >
    {text}
  </div>
);

// Tableau fournisseur présenté ligne à ligne : briques à gauche, fiche à droite.
export const SupplierDeck: React.FC<{
  rows: Supplier[];
  starts: number[];
  clientStarts: number[];
  end: number;
}> = ({ rows, starts, clientStarts, end }) => {
  const frame = useCurrentFrame();
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  const top = 260;
  const listW = 430;
  const cardLeft = SAFE.left + listW + 80;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top, left: SAFE.left, width: listW }}>
        <FadeIn start={starts[0] - 10}>
          <Label text="BRIQUE" />
        </FadeIn>
        {rows.map((r, i) => {
          const o = progress(frame, starts[i], 0.5);
          const on = i === current;
          return (
            <div
              key={r.brick}
              style={{
                height: 84,
                display: "flex",
                alignItems: "center",
                gap: 18,
                opacity: o * (on ? 1 : 0.42),
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 44,
                  background: on ? COLORS.accent : COLORS.inkFaint,
                }}
              />
              <div style={textStyle(28, on ? 400 : 300)}>{r.brick}</div>
            </div>
          );
        })}
      </div>
      <Svg>
        <DrawPath
          d={`M ${cardLeft - 40} ${top} V ${top + 480}`}
          start={starts[0] - 6}
          duration={1}
          stroke={COLORS.inkFaint}
          width={1}
        />
      </Svg>
      {rows.map((r, i) => {
        const from = starts[i];
        const to = i < rows.length - 1 ? starts[i + 1] : end + 60;
        if (frame < from - 2 || frame > to) return null;
        const fadeOut = interpolate(frame, [to - 8, to], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const cs = clientStarts[i];
        return (
          <div
            key={r.brick}
            style={{
              position: "absolute",
              top,
              left: cardLeft,
              width: SAFE.right - cardLeft,
              opacity: fadeOut,
            }}
          >
            <Svg>
              <Icon
                name={r.icon}
                x={SAFE.right - cardLeft - 50}
                y={40}
                size={34}
                start={from + 4}
                color={COLORS.accent}
              />
            </Svg>
            <FadeIn start={from}>
              <div style={textStyle(54, 200)}>{r.brick}</div>
            </FadeIn>
            <div style={{ marginTop: 34 }}>
              <FadeIn start={from + 8}>
                <Label text="ACTEURS REPÈRES" />
              </FadeIn>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {r.actors.map((a, k) => {
                  const o = progress(frame, from + 14 + k * 14, 0.5);
                  const main = !r.extra || k === 0;
                  const c = main ? COLORS.accent : COLORS.ink;
                  return (
                    <span
                      key={a}
                      style={{
                        ...textStyle(28, 400),
                        color: c,
                        border: `1.5px solid ${c}`,
                        borderRadius: 999,
                        padding: "8px 24px",
                        opacity: o * (main ? 1 : 0.7),
                        transform: `translateY(${(1 - o) * 8}px)`,
                      }}
                    >
                      {a}
                    </span>
                  );
                })}
              </div>
              {r.extra && (
                <FadeIn start={from + 60} style={{ marginTop: 14 }}>
                  <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
                    {r.extra}
                  </div>
                </FadeIn>
              )}
            </div>
            <FadeIn start={cs} style={{ marginTop: 34 }}>
              <Label text="CLIENTS" />
              <div style={textStyle(32, 300)}>{r.clients}</div>
            </FadeIn>
            <FadeIn
              start={cs + (1.1 + 0.05 * r.clients.length) * FPS}
              style={{ marginTop: 30 }}
            >
              <Label text="DIFFICULTÉ À EXAMINER" color={COLORS.warm} />
              <div
                style={{
                  ...textStyle(32, 300),
                  color: COLORS.warm,
                  lineHeight: 1.35,
                }}
              >
                {r.issue}
              </div>
            </FadeIn>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Scène 13 — Les fournisseurs en amont des systèmes (1/2).
export const S13: React.FC = () => {
  const cues = useCues();
  const starts = [4, 6, 8, 10, 12].map((i) => cues.s(i));
  const clientStarts = [5, 7, 9, 11, 13].map((i) => cues.s(i, 0.4));
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(4)}>
        <Title
          kicker="Les fournisseurs"
          text="En amont des systèmes"
          start={cues.s(0)}
        />
        <FadeIn
          start={cues.s(1) - 8}
          style={{ position: "absolute", top: 300, left: 300 }}
        >
          <Label text="À LIRE AVANT LE TABLEAU" color={COLORS.warm} />
        </FadeIn>
        <Bullets
          top={370}
          left={300}
          width={1320}
          size={34}
          starts={[cues.s(1), cues.s(2), cues.s(3)]}
          items={[
            <>
              Ces acteurs{" "}
              <span style={{ color: COLORS.accent }}>illustrent</span> les
              métiers.
            </>,
            <>
              Leur présence ne signifie pas qu’ils fournissent tous{" "}
              <span style={{ color: COLORS.warm }}>
                le même client ou le même système
              </span>
              .
            </>,
            <>
              Positions de marché et relations clients : approfondies et{" "}
              <span style={{ color: COLORS.accent }}>datées</span> dans les
              modules concernés.
            </>,
          ]}
        />
      </Stage>
      <Stage from={cues.s(4) - 10}>
        <Title
          kicker="Tableau · 1/2"
          text="Les fournisseurs en amont des systèmes"
          top={105}
          start={cues.s(4) - 10}
        />
        <SupplierDeck
          rows={ROWS}
          starts={starts}
          clientStarts={clientStarts}
          end={cues.end}
        />
      </Stage>
    </AbsoluteFill>
  );
};
