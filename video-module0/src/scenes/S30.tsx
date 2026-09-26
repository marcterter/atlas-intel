import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { icons, roundRectPath } from "../components/icons";
import { Callout, Icon, Svg, SvgText, Title } from "../components/kit";
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

const small = (color: string): React.CSSProperties => ({
  ...textStyle(18, 500),
  color,
  letterSpacing: "0.28em",
});

// Équation dont les termes peuvent contenir des compteurs.
type Part = { node: React.ReactNode; at: number; op?: boolean; hi?: boolean };
const Eq: React.FC<{ parts: Part[]; y: number; size?: number }> = ({
  parts,
  y,
  size = 56,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "baseline",
        gap: size * 0.32,
      }}
    >
      {parts.map((p, i) => {
        const o = progress(frame, p.at, 0.6);
        return (
          <span
            key={i}
            style={{
              ...textStyle(size, 200),
              color: p.op ? COLORS.accent : p.hi ? COLORS.accent : COLORS.ink,
              opacity: o,
              transform: `translateY(${(1 - o) * 12}px)`,
              display: "inline-block",
            }}
          >
            {p.node}
          </span>
        );
      })}
    </div>
  );
};

const Unit: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontSize: "0.55em", color: COLORS.inkSoft }}> {children}</span>
);

// Étiquette permanente en haut à droite.
const FictiveTag: React.FC<{ start: number }> = ({ start }) => (
  <FadeIn
    start={start}
    style={{ position: "absolute", top: 108, right: 140, textAlign: "right" }}
  >
    <span
      style={{
        ...small(COLORS.warm),
        border: `1.5px solid ${COLORS.warm}`,
        borderRadius: 999,
        padding: "8px 18px",
      }}
    >
      EXEMPLE FICTIF
    </span>
  </FadeIn>
);

// Les trois paramètres du site.
const Params: React.FC = () => {
  const cues = useCues();
  const t = cues.s(4);
  const cards = [
    {
      x: 480,
      icon: "building" as const,
      label: "SITE",
      at: t + FPS * 2,
      value: <Counter to={12} start={t + FPS * 2} duration={1.2} />,
      unit: "MW",
    },
    {
      x: 960,
      icon: "gear" as const,
      label: "PUE",
      at: t + FPS * 4.3,
      value: (
        <Counter
          from={1}
          to={1.2}
          decimals={2}
          start={t + FPS * 4.3}
          duration={1.2}
        />
      ),
      unit: "",
    },
    {
      x: 1440,
      icon: "rack" as const,
      label: "RACK",
      at: t + FPS * 6.3,
      value: <Counter to={100} start={t + FPS * 6.3} duration={1.2} />,
      unit: "kW",
    },
  ];
  return (
    <AbsoluteFill>
      <Svg>
        {cards.map((c) => (
          <g key={c.label}>
            <DrawPath
              d={roundRectPath(c.x - 190, 360, 380, 380, 16)}
              start={c.at - 10}
              duration={0.8}
              stroke={COLORS.inkSoft}
              width={1.4}
            />
            <Icon
              name={c.icon}
              x={c.x}
              y={450}
              size={40}
              start={c.at - 4}
              color={COLORS.accent}
            />
          </g>
        ))}
      </Svg>
      {cards.map((c) => (
        <FadeIn
          key={c.label}
          start={c.at}
          style={{
            position: "absolute",
            left: c.x - 190,
            top: 530,
            width: 380,
            textAlign: "center",
          }}
        >
          <div style={small(COLORS.inkSoft)}>{c.label}</div>
          <div style={{ ...textStyle(88, 200), marginTop: 8 }}>
            {c.value}
            {c.unit && <Unit>{c.unit}</Unit>}
          </div>
        </FadeIn>
      ))}
      <FadeIn
        start={t + FPS * 7.5}
        style={{
          position: "absolute",
          top: 780,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(26, 300), color: COLORS.inkSoft }}>
          par rack, au point de fonctionnement retenu
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Définition du PUE sous forme de fraction.
const Pue: React.FC = () => {
  const cues = useCues();
  const t = cues.s(5);
  return (
    <AbsoluteFill>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 250,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(40, 200)}>
          PUE{" "}
          <span style={{ color: COLORS.inkSoft, fontSize: 30 }}>
            · Power Usage Effectiveness
          </span>
        </div>
      </FadeIn>
      <FadeIn
        start={t + FPS * 1.5}
        style={{ position: "absolute", left: 300, top: 470 }}
      >
        <div style={textStyle(52, 200)}>PUE =</div>
      </FadeIn>
      <FadeIn
        start={t + FPS * 3.2}
        style={{
          position: "absolute",
          left: 560,
          top: 400,
          width: 1000,
          textAlign: "center",
        }}
      >
        <div style={textStyle(42, 300)}>énergie totale du site</div>
      </FadeIn>
      <Svg>
        <DrawPath
          d="M 560 505 H 1560"
          start={t + FPS * 4.2}
          duration={0.8}
          stroke={COLORS.accent}
        />
      </Svg>
      <FadeIn
        start={t + FPS * 5}
        style={{
          position: "absolute",
          left: 560,
          top: 530,
          width: 1000,
          textAlign: "center",
        }}
      >
        <div style={textStyle(42, 300)}>
          énergie des équipements informatiques
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(6)}
        style={{
          position: "absolute",
          top: 720,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(28, 300), color: COLORS.warm }}>
          Hypothèse : rapport supposé applicable aux puissances au point étudié
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// 12 MW ÷ 1,20 = 10 MW : la barre du site se partage.
const Split: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(7);
  const X = 260;
  const W = 1400;
  const itW = (W * 10) / 12;
  const split = progress(frame, t + FPS * 4.4, 1.2);
  const other = progress(frame, cues.s(8), 1);
  return (
    <AbsoluteFill>
      <Eq
        y={240}
        parts={[
          { node: "Puissance informatique", at: t },
          { node: "=", at: t + FPS * 1.4, op: true },
          {
            node: (
              <>
                12<Unit>MW</Unit>
              </>
            ),
            at: t + FPS * 1.8,
          },
          { node: "÷", at: t + FPS * 2.6, op: true },
          { node: "1,20", at: t + FPS * 3 },
          { node: "=", at: t + FPS * 4.2, op: true },
          {
            node: (
              <>
                <Counter to={10} start={t + FPS * 4.4} duration={1.2} />
                <Unit>MW</Unit>
              </>
            ),
            at: t + FPS * 4.4,
            hi: true,
          },
        ]}
      />
      <Svg>
        <SvgText
          x={X}
          y={430}
          text="SITE · 12 MW"
          start={t + 10}
          size={22}
          weight={500}
          anchor="start"
          color={COLORS.inkSoft}
          spacing="0.2em"
        />
        <DrawPath
          d={roundRectPath(X, 470, W, 130, 12)}
          start={t + 10}
          duration={1}
          stroke={COLORS.ink}
          width={1.6}
        />
        {split > 0 && (
          <path
            d={roundRectPath(X + 6, 476, (itW - 12) * split, 118, 8)}
            fill={COLORS.accent}
            opacity={0.22}
          />
        )}
        <DrawPath
          d={`M ${X + itW} 470 V 600`}
          start={t + FPS * 4.4}
          duration={0.6}
          stroke={COLORS.accent}
        />
        {other > 0 && (
          <path
            d={roundRectPath(X + itW + 6, 476, (W - itW - 12) * other, 118, 8)}
            fill={COLORS.warm}
            opacity={0.22}
          />
        )}
        <SvgText
          x={X + itW / 2}
          y={535}
          text="10 MW"
          start={t + FPS * 5}
          size={44}
          weight={300}
          color={COLORS.accent}
        />
        <SvgText
          x={X + itW / 2}
          y={650}
          text="équipements informatiques"
          start={t + FPS * 5.2}
          size={26}
          color={COLORS.accent}
        />
        <SvgText
          x={X + itW + (W - itW) / 2}
          y={535}
          text="2 MW"
          start={cues.s(8, 0.4)}
          size={44}
          weight={300}
          color={COLORS.warm}
        />
        <SvgText
          x={X + itW + (W - itW) / 2}
          y={670}
          text={"autres consommations\net pertes du site"}
          start={cues.s(8, 1.5)}
          size={24}
          color={COLORS.warm}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// 10 000 kW ÷ 100 kW = 100 racks : la grille se remplit.
const Racks: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(9);
  const fill = t + FPS * 4.6;
  const reserve = progress(frame, cues.s(11, 1), 1.2);
  const cell = 46;
  const gx = 240;
  const gy = 380;
  return (
    <AbsoluteFill>
      <Eq
        y={250}
        size={52}
        parts={[
          { node: "Nombre de racks", at: t },
          { node: "=", at: t + FPS * 1.2, op: true },
          {
            node: (
              <>
                10 000<Unit>kW</Unit>
              </>
            ),
            at: t + FPS * 1.6,
          },
          { node: "÷", at: t + FPS * 2.8, op: true },
          {
            node: (
              <>
                100<Unit>kW</Unit>
              </>
            ),
            at: t + FPS * 3.2,
          },
          { node: "=", at: t + FPS * 4.4, op: true },
          {
            node: <Counter to={100} start={fill} duration={3} />,
            at: t + FPS * 4.6,
            hi: true,
          },
        ]}
      />
      <Svg>
        {new Array(100).fill(0).map((_, i) => {
          const r = Math.floor(i / 10);
          const c = i % 10;
          const at = fill + i * ((3 * FPS) / 100);
          const o = interpolate(frame, [at, at + 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          if (o === 0) return null;
          const reserved = r >= 8;
          const color = reserved && reserve > 0 ? COLORS.warm : COLORS.accent;
          return (
            <path
              key={i}
              d={icons.rack(
                gx + c * cell + cell / 2,
                gy + r * cell + cell / 2,
                17,
              )}
              fill="none"
              stroke={color}
              strokeWidth={1.3}
              opacity={o * (reserved ? 1 - 0.55 * reserve : 1)}
            />
          );
        })}
        {reserve > 0 && (
          <DrawPath
            d={`M ${gx - 14} ${gy + 8 * cell} V ${gy + 10 * cell}`}
            start={cues.s(11, 1)}
            duration={0.6}
            stroke={COLORS.warm}
          />
        )}
      </Svg>
      <FadeIn
        start={cues.s(10)}
        style={{ position: "absolute", left: 860, top: 400, width: 900 }}
      >
        <div style={{ ...small(COLORS.warm), marginBottom: 18 }}>
          MAXIMUM THÉORIQUE
        </div>
        <div style={{ ...textStyle(32, 300), lineHeight: 1.4 }}>
          Si toute la puissance informatique est affectée à ces racks.
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(11)}
        style={{ position: "absolute", left: 860, top: 600, width: 900 }}
      >
        <div
          style={{ ...textStyle(30, 300), lineHeight: 1.4, color: COLORS.warm }}
        >
          Une étude réelle réserve les consommations des autres équipements et
          les marges nécessaires.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 30 — Premier modèle économique : du site au nombre de racks.
export const S30: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(3)}>
        <Title
          kicker="Exemple pédagogique"
          text="Premier modèle économique"
          start={cues.s(0)}
          top={100}
        />
        <Callout
          kind="warn"
          label="EXEMPLE FICTIF"
          start={cues.s(1)}
          y={340}
          width={1300}
        >
          Toutes les données de cet exemple sont fictives et pédagogiques.
          <div style={{ height: 18 }} />
          <FadeIn start={cues.s(2)}>
            <span style={{ color: COLORS.inkSoft, fontSize: 30 }}>
              Elles ne décrivent ni un produit commercial ni une installation
              réelle.
            </span>
          </FadeIn>
        </Callout>
      </Stage>
      <Stage from={cues.s(3)}>
        <Title
          kicker="Premier modèle économique"
          text="Du site au nombre de racks"
          start={cues.s(3)}
          top={100}
        />
        <FictiveTag start={cues.s(3)} />
      </Stage>
      <Stage from={cues.s(3)} to={cues.s(5)}>
        <Params />
      </Stage>
      <Stage from={cues.s(5)} to={cues.s(7)}>
        <Pue />
      </Stage>
      <Stage from={cues.s(7)} to={cues.s(9)}>
        <Split />
      </Stage>
      <Stage from={cues.s(9)}>
        <Racks />
      </Stage>
    </AbsoluteFill>
  );
};
