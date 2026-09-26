import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Callout, Svg, SvgText, Title } from "../components/kit";
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

// ——— Briques partagées par les scènes S33 à S43 ———

// Petites capitales espacées pour les étiquettes.
export const small = (
  color: string = COLORS.inkSoft,
  size = 22,
): React.CSSProperties => ({
  ...textStyle(size, 500),
  color,
  letterSpacing: "0.22em",
});

export const Unit: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ fontSize: "0.6em", color: COLORS.inkSoft }}> {children}</span>
);

// Équation dont les termes peuvent contenir des compteurs.
export type EqPart = {
  node: React.ReactNode;
  at: number;
  op?: boolean;
  hi?: boolean;
  warm?: boolean;
  soft?: boolean;
};
export const Eq: React.FC<{
  parts: EqPart[];
  y: number;
  size?: number;
  left?: number;
  width?: number;
}> = ({ parts, y, size = 48, left = 0, width = 1920 }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left,
        width,
        display: "flex",
        justifyContent: "center",
        alignItems: "baseline",
        gap: size * 0.3,
      }}
    >
      {parts.map((p, i) => {
        const o = progress(frame, p.at, 0.6);
        return (
          <span
            key={i}
            style={{
              ...textStyle(size, 200),
              color: p.warm
                ? COLORS.warm
                : p.op || p.hi
                  ? COLORS.accent
                  : p.soft
                    ? COLORS.inkSoft
                    : COLORS.ink,
              opacity: o,
              transform: `translateY(${(1 - o) * 12}px)`,
              display: "inline-block",
              whiteSpace: "nowrap",
            }}
          >
            {p.node}
          </span>
        );
      })}
    </div>
  );
};

// Pastille permanente en haut à droite (« Exemple fictif », « Piste d’analyse »…).
export const FictiveTag: React.FC<{ start: number; label?: string }> = ({
  start,
  label = "EXEMPLE FICTIF",
}) => (
  <FadeIn
    start={start}
    style={{ position: "absolute", top: 112, right: 140, textAlign: "right" }}
  >
    <span
      style={{
        ...small(COLORS.warm),
        border: `1.5px solid ${COLORS.warm}`,
        borderRadius: 999,
        padding: "8px 18px",
      }}
    >
      {label}
    </span>
  </FadeIn>
);

// Bloc de texte positionné qui apparaît en fondu.
export const Pos: React.FC<{
  start: number;
  left: number;
  top: number;
  width?: number;
  align?: "left" | "center" | "right";
  children: React.ReactNode;
}> = ({ start, left, top, width = 600, align = "left", children }) => (
  <FadeIn
    start={start}
    style={{ position: "absolute", left, top, width, textAlign: align }}
  >
    {children}
  </FadeIn>
);

// Encadré compact : filet vertical, étiquette, texte.
export const Takeaway: React.FC<{
  start: number;
  left: number;
  top: number;
  width: number;
  label: string;
  color?: string;
  size?: number;
  children: React.ReactNode;
}> = ({
  start,
  left,
  top,
  width,
  label,
  color = COLORS.accent,
  size = 30,
  children,
}) => {
  const frame = useCurrentFrame();
  const p = progress(frame, start, 0.8);
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width,
        padding: "6px 0 6px 30px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 2,
          height: `${p * 100}%`,
          background: color,
        }}
      />
      <FadeIn start={start + 4}>
        <div style={{ ...small(color), marginBottom: 10 }}>{label}</div>
      </FadeIn>
      <FadeIn start={start + 10}>
        <div style={{ ...textStyle(size, 300), lineHeight: 1.35 }}>
          {children}
        </div>
      </FadeIn>
    </div>
  );
};

// ——— Scène 33 ———

const X0 = 380;
const K = 3.2; // pixels par watt
const H = 86;

// Barre « avant » : 300 W dynamiques + 60 W fixes.
const BarBefore: React.FC<{ y: number; start: number }> = ({ y, start }) => {
  const frame = useCurrentFrame();
  const fill = progress(frame, start + 10, 0.8);
  const fixStart = start + FPS * 3.2;
  const fixFill = progress(frame, fixStart + 8, 0.8);
  return (
    <g>
      <SvgText
        x={150}
        y={y + H / 2}
        text="AVANT"
        start={start}
        anchor="start"
        size={22}
        weight={500}
        spacing="0.22em"
        color={COLORS.inkSoft}
      />
      <path
        d={roundRectPath(X0, y, 300 * K, H, 8)}
        fill={COLORS.accent}
        opacity={0.18 * fill}
      />
      <DrawPath
        d={roundRectPath(X0, y, 300 * K, H, 8)}
        start={start}
        duration={1}
        stroke={COLORS.accent}
      />
      <SvgText
        x={X0 + 150 * K}
        y={y + H / 2}
        text="300 W"
        start={start + 12}
        size={36}
        weight={300}
      />
      <SvgText
        x={X0 + 150 * K}
        y={y + H + 30}
        text="commutation · composante dynamique"
        start={start + 20}
        size={22}
        color={COLORS.accent}
      />
      <path
        d={roundRectPath(X0 + 300 * K + 6, y, 60 * K - 6, H, 8)}
        fill={COLORS.warm}
        opacity={0.2 * fixFill}
      />
      <DrawPath
        d={roundRectPath(X0 + 300 * K + 6, y, 60 * K - 6, H, 8)}
        start={fixStart}
        duration={0.7}
        stroke={COLORS.warm}
      />
      <SvgText
        x={X0 + 330 * K + 3}
        y={y + H / 2}
        text="60 W"
        start={fixStart + 10}
        size={32}
        weight={300}
      />
      <SvgText
        x={X0 + 330 * K + 3}
        y={y + H + 30}
        text="fuites · fixes"
        start={fixStart + 16}
        size={22}
        color={COLORS.warm}
      />
    </g>
  );
};

// Barre « après » : la partie dynamique rétrécit de 20 %, les 60 W restent.
const BarAfter: React.FC<{ y: number; start: number; shrink: number }> = ({
  y,
  start,
  shrink,
}) => {
  const frame = useCurrentFrame();
  const o = progress(frame, start, 0.8);
  const p = progress(frame, shrink, 1.6);
  const dyn = 300 - 60 * p;
  const fixX = X0 + dyn * K + 6;
  const ghostO = progress(frame, shrink + 10, 0.6);
  return (
    <g opacity={o}>
      <SvgText
        x={150}
        y={y + H / 2}
        text="APRÈS"
        start={start}
        anchor="start"
        size={22}
        weight={500}
        spacing="0.22em"
        color={COLORS.inkSoft}
      />
      <path
        d={roundRectPath(X0, y, dyn * K, H, 8)}
        fill={COLORS.accent}
        fillOpacity={0.18}
        stroke={COLORS.accent}
        strokeWidth={2}
      />
      <path
        d={roundRectPath(fixX, y, 60 * K - 6, H, 8)}
        fill={COLORS.warm}
        fillOpacity={0.2}
        stroke={COLORS.warm}
        strokeWidth={2}
      />
      {/* Place libérée par la baisse de la composante dynamique. */}
      {ghostO > 0 && (
        <g opacity={ghostO}>
          <path
            d={roundRectPath(
              X0 + dyn * K + 60 * K + 6,
              y,
              (300 - dyn) * K,
              H,
              8,
            )}
            fill="none"
            stroke={COLORS.inkSoft}
            strokeWidth={1.4}
            strokeDasharray="6 7"
          />
        </g>
      )}
      <foreignObject x={X0} y={y} width={dyn * K} height={H}>
        <div
          style={{
            ...textStyle(36, 300),
            height: H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span>
            <Counter from={300} to={240} start={shrink} duration={1.6} />
            <Unit>W</Unit>
          </span>
        </div>
      </foreignObject>
      <SvgText
        x={fixX + 30 * K - 3}
        y={y + H / 2}
        text="60 W"
        start={start}
        size={32}
        weight={300}
      />
      <SvgText
        x={X0 + 120 * K}
        y={y + H + 30}
        text="composante dynamique −20 %"
        start={shrink}
        size={22}
        color={COLORS.accent}
      />
      <SvgText
        x={fixX + 30 * K - 3}
        y={y + H + 30}
        text="inchangés"
        start={start + 10}
        size={22}
        color={COLORS.warm}
      />
      <SvgText
        x={X0 + 330 * K}
        y={y - 22}
        text="−60 W"
        start={shrink + 20}
        size={22}
        color={COLORS.inkSoft}
      />
    </g>
  );
};

const Build: React.FC = () => {
  const cues = useCues();
  const t4 = cues.s(4);
  const t5 = cues.s(5);
  const yA = 240;
  const yB = 540;
  return (
    <AbsoluteFill>
      <Svg>
        <BarBefore y={yA} start={cues.s(2, 0.4)} />
        <BarAfter y={yB} start={cues.s(3)} shrink={cues.s(3, 2.2)} />
      </Svg>
      {/* Totaux à droite des barres. */}
      <Pos start={t4 + FPS * 4} left={1560} top={yA + 14} width={220}>
        <div style={{ ...textStyle(48, 200), color: COLORS.accent }}>
          <Counter to={360} start={t4 + FPS * 4} duration={1.2} />
          <Unit>W</Unit>
        </div>
      </Pos>
      <Pos start={t5 + FPS * 5.3} left={1560} top={yB + 14} width={220}>
        <div style={{ ...textStyle(48, 200), color: COLORS.accent }}>
          <Counter from={360} to={300} start={t5 + FPS * 5.3} duration={1.2} />
          <Unit>W</Unit>
        </div>
      </Pos>
      <Eq
        y={400}
        size={46}
        parts={[
          { node: "Puissance initiale", at: t4, soft: true },
          { node: "=", at: t4 + FPS * 1.4, op: true },
          { node: "300", at: t4 + FPS * 2 },
          { node: "+", at: t4 + FPS * 2.6, op: true },
          { node: "60", at: t4 + FPS * 3 },
          { node: "=", at: t4 + FPS * 3.6, op: true },
          {
            node: (
              <>
                <Counter to={360} start={t4 + FPS * 4} duration={1.2} />
                <Unit>W</Unit>
              </>
            ),
            at: t4 + FPS * 4,
            hi: true,
          },
        ]}
      />
      <Eq
        y={700}
        size={46}
        parts={[
          { node: "Puissance nouvelle", at: t5, soft: true },
          { node: "=", at: t5 + FPS * 1.4, op: true },
          { node: "300", at: t5 + FPS * 1.9 },
          { node: "×", at: t5 + FPS * 2.5, op: true },
          { node: "0,80", at: t5 + FPS * 2.9 },
          { node: "+", at: t5 + FPS * 3.8, op: true },
          { node: "60", at: t5 + FPS * 4.2 },
          { node: "=", at: t5 + FPS * 4.9, op: true },
          {
            node: (
              <>
                <Counter to={300} start={t5 + FPS * 5.3} duration={1.2} />
                <Unit>W</Unit>
              </>
            ),
            at: t5 + FPS * 5.3,
            hi: true,
          },
        ]}
      />
      <Pos
        start={t5 + FPS * 2.9}
        left={0}
        top={775}
        width={1920}
        align="center"
      >
        <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
          300 × 0,80 = 240 W dynamiques · les 60 W fixes s’ajoutent tels quels
        </div>
      </Pos>
    </AbsoluteFill>
  );
};

// Jauge normalisée à 100 % : partie conservée et partie gagnée.
const Gauge: React.FC<{
  y: number;
  start: number;
  pct: number;
  decimals: number;
  label: string;
  sub: string;
  color: string;
}> = ({ y, start, pct, decimals, label, sub, color }) => {
  const frame = useCurrentFrame();
  const gx = 720;
  const gw = 800;
  const h = 70;
  const cut = progress(frame, start + FPS * 1.2, 1.2);
  const keep = gw * (1 - (pct / 100) * cut);
  const o = progress(frame, start, 0.6);
  return (
    <>
      <Svg>
        <g opacity={o}>
          <path
            d={roundRectPath(gx, y, gw, h, 8)}
            fill="none"
            stroke={COLORS.inkFaint}
            strokeWidth={1.4}
            strokeDasharray="6 7"
          />
          <path
            d={roundRectPath(gx, y, keep, h, 8)}
            fill={COLORS.accent}
            fillOpacity={0.16}
            stroke={COLORS.accent}
            strokeWidth={1.6}
          />
          {cut > 0 && (
            <path
              d={roundRectPath(gx + keep + 4, y, gw - keep - 4, h, 8)}
              fill={color}
              fillOpacity={0.35}
            />
          )}
        </g>
      </Svg>
      <Pos start={start} left={150} top={y - 4} width={540}>
        <div style={small(COLORS.ink)}>{label}</div>
        <div
          style={{ ...textStyle(26, 300), color: COLORS.inkSoft, marginTop: 8 }}
        >
          {sub}
        </div>
      </Pos>
      <Pos start={start + FPS * 1.2} left={1550} top={y + 2} width={230}>
        <div style={{ ...textStyle(50, 200), color }}>
          −
          <Counter
            to={pct}
            decimals={decimals}
            start={start + FPS * 1.2}
            duration={1.2}
          />
          <Unit>%</Unit>
        </div>
      </Pos>
    </>
  );
};

const Compare: React.FC = () => {
  const cues = useCues();
  const t6 = cues.s(6);
  const t7 = cues.s(7);
  const guide = t7 + FPS * 2;
  return (
    <AbsoluteFill>
      <Eq
        y={215}
        size={50}
        parts={[
          { node: "Baisse totale", at: t6, soft: true },
          { node: "=", at: t6 + FPS * 1.4, op: true },
          { node: "60", at: t6 + FPS * 1.9 },
          { node: "÷", at: t6 + FPS * 2.4, op: true },
          { node: "360", at: t6 + FPS * 2.8 },
          { node: "≈", at: t6 + FPS * 3.6, op: true },
          {
            node: (
              <>
                <Counter
                  to={16.7}
                  decimals={1}
                  start={t6 + FPS * 3.8}
                  duration={1.3}
                />
                <Unit>%</Unit>
              </>
            ),
            at: t6 + FPS * 3.8,
            warm: true,
          },
        ]}
      />
      <Gauge
        y={360}
        start={t6 + FPS * 4.2}
        pct={16.7}
        decimals={1}
        label="SYSTÈME ENTIER"
        sub="360 W → 300 W"
        color={COLORS.warm}
      />
      <Gauge
        y={480}
        start={t7 + FPS * 0.3}
        pct={20}
        decimals={0}
        label="COMPOSANTE DYNAMIQUE"
        sub="300 W → 240 W"
        color={COLORS.ink}
      />
      <Svg>
        {/* Repère vertical : les deux gains ne s’alignent pas. */}
        <DrawPath
          d={`M ${720 + 800 * 0.8} 340 V 570`}
          start={guide}
          duration={0.6}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
      </Svg>
      <Pos start={guide} left={720} top={590} width={800} align="center">
        <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
          les 60 W fixes ne baissent pas : ils diluent le gain
        </div>
      </Pos>
      <Takeaway
        start={t7 + FPS * 1}
        left={300}
        top={670}
        width={1320}
        label="À RETENIR"
        size={32}
      >
        Un gain de 20 % sur une composante ne devient pas un gain de 20 % sur le
        système entier.
      </Takeaway>
    </AbsoluteFill>
  );
};

// Scène 33 — Premier cas résolu : la puissance totale.
export const S33: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(2)}>
        <Title
          kicker="Cas résolus"
          text="Les premiers calculs d’analyste"
          start={cues.s(0)}
          top={150}
        />
        <Callout
          kind="warn"
          label="EXEMPLE FICTIF"
          start={cues.s(1)}
          y={380}
          width={1300}
        >
          Tous les chiffres de cette partie sont fictifs.
          <div style={{ height: 16 }} />
          <span style={{ color: COLORS.inkSoft, fontSize: 30 }}>
            Ils servent à reconstruire un raisonnement, pas à valoriser une
            entreprise réelle.
          </span>
        </Callout>
      </Stage>
      <Stage from={cues.s(2)}>
        <Title
          text="Cas résolu : la puissance totale"
          start={cues.s(2)}
          top={105}
        />
        <FictiveTag start={cues.s(2)} />
      </Stage>
      <Stage from={cues.s(2)} to={cues.s(6)}>
        <Build />
      </Stage>
      <Stage from={cues.s(6)}>
        <Compare />
      </Stage>
    </AbsoluteFill>
  );
};
