import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
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

const small = (color: string): React.CSSProperties => ({
  ...textStyle(18, 500),
  color,
  letterSpacing: "0.28em",
});

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
              color: p.op || p.hi ? COLORS.accent : COLORS.ink,
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

// Grille de petits éléments révélée progressivement (un seul chemin SVG).
const Field: React.FC<{
  x: number;
  y: number;
  cols: number;
  rows: number;
  step: number;
  start: number;
  duration: number;
  color: string;
  mark: number;
}> = ({ x, y, cols, rows, step, start, duration, color, mark }) => {
  const frame = useCurrentFrame();
  const shown = Math.floor(cols * rows * progress(frame, start, duration));
  const d = useMemo(() => {
    const out: string[] = [];
    for (let i = 0; i < cols * rows; i++) {
      const cx = x + (i % cols) * step;
      const cy = y + Math.floor(i / cols) * step;
      out.push(`M ${cx} ${cy} h ${mark}`);
    }
    return out;
  }, [x, y, cols, rows, step, mark]);
  if (shown === 0) return null;
  return (
    <path
      d={d.slice(0, shown).join(" ")}
      stroke={color}
      strokeWidth={mark}
      strokeLinecap="butt"
      fill="none"
    />
  );
};

// 1 — 100 racks × 64 accélérateurs.
const Accelerators: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(2);
  const eq = t + FPS * 5.6;
  return (
    <AbsoluteFill>
      <Eq
        y={240}
        size={52}
        parts={[
          {
            node: (
              <>
                100<Unit>racks</Unit>
              </>
            ),
            at: eq,
          },
          { node: "×", at: eq + FPS * 1.2, op: true },
          {
            node: (
              <>
                64<Unit>accélérateurs</Unit>
              </>
            ),
            at: eq + FPS * 1.5,
          },
          { node: "=", at: eq + FPS * 2.2, op: true },
          {
            node: (
              <>
                <Counter to={6400} start={eq + FPS * 2.4} duration={1.5} />
                <Unit>accélérateurs</Unit>
              </>
            ),
            at: eq + FPS * 2.4,
            hi: true,
          },
        ]}
      />
      <Svg>
        {/* 100 racks */}
        {new Array(100).fill(0).map((_, i) => {
          const at = cues.s(0) + 10 + i * 0.5;
          const o = interpolate(frame, [at, at + 6], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return o > 0 ? (
            <path
              key={i}
              d={icons.rack(
                270 + (i % 10) * 28,
                410 + Math.floor(i / 10) * 28,
                10,
              )}
              stroke={COLORS.ink}
              strokeWidth={1}
              fill="none"
              opacity={o}
            />
          ) : null;
        })}
        <SvgText
          x={396}
          y={730}
          text="100 racks"
          start={cues.s(0, 1)}
          size={26}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={620}
          y={530}
          text="×"
          start={cues.s(1)}
          size={56}
          weight={200}
          color={COLORS.accent}
        />
        {/* Un rack : 8 × 8 accélérateurs */}
        <DrawPath
          d={roundRectPath(720, 380, 300, 300, 10)}
          start={cues.s(1)}
          duration={0.8}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        {new Array(64).fill(0).map((_, i) => {
          const at = cues.s(1, 0.5) + i * 0.8;
          const o = interpolate(frame, [at, at + 5], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return o > 0 ? (
            <rect
              key={i}
              x={738 + (i % 8) * 34}
              y={398 + Math.floor(i / 8) * 34}
              width={24}
              height={24}
              rx={3}
              fill="none"
              stroke={COLORS.accent}
              strokeWidth={1.3}
              opacity={o}
            />
          ) : null;
        })}
        <SvgText
          x={870}
          y={730}
          text="64 accélérateurs par rack"
          start={cues.s(1, 1)}
          size={26}
          color={COLORS.accent}
        />
        <SvgText
          x={1120}
          y={530}
          text="="
          start={eq + FPS * 2.2}
          size={56}
          weight={200}
          color={COLORS.accent}
        />
        <Field
          x={1230}
          y={392}
          cols={80}
          rows={80}
          step={4}
          mark={2}
          start={eq + FPS * 2.4}
          duration={2}
          color={COLORS.accent}
        />
        <SvgText
          x={1390}
          y={730}
          text="6 400 accélérateurs"
          start={eq + FPS * 3.2}
          size={26}
          color={COLORS.accent}
        />
      </Svg>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 790,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(26, 300), color: COLORS.inkSoft }}>
          Les 100 kW par rack sont supposés inclure les autres composants
          présents dans ces racks.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// 2 — Un composant présent 8 fois par accélérateur, à 200 €.
const Content: React.FC = () => {
  const cues = useCues();
  const t = cues.s(4);
  const eq = t + FPS * 5.2;
  const cx = 960;
  const cy = 430;
  return (
    <AbsoluteFill>
      <Svg>
        <Icon
          name="chip"
          x={cx}
          y={cy}
          size={56}
          start={t}
          color={COLORS.ink}
          duration={1}
        />
        {new Array(8).fill(0).map((_, i) => {
          const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
          const x = cx + Math.cos(a) * 130;
          const y = cy + Math.sin(a) * 110;
          return (
            <g key={i}>
              <DrawPath
                d={roundRectPath(x - 14, y - 14, 28, 28, 5)}
                start={t + FPS * 1 + i * 4}
                duration={0.4}
                stroke={COLORS.accent}
              />
            </g>
          );
        })}
        <SvgText
          x={620}
          y={cy}
          text={"× 8\npar accélérateur"}
          start={t + FPS * 1.6}
          size={30}
          color={COLORS.accent}
          weight={300}
        />
        <SvgText
          x={1300}
          y={cy}
          text={"200 €\nl’unité"}
          start={t + FPS * 3.2}
          size={30}
          color={COLORS.accent}
          weight={300}
        />
      </Svg>
      <Eq
        y={620}
        size={56}
        parts={[
          { node: "6 400", at: eq },
          { node: "×", at: eq + FPS * 0.8, op: true },
          { node: "8", at: eq + FPS * 1 },
          { node: "×", at: eq + FPS * 1.5, op: true },
          {
            node: (
              <>
                200<Unit>€</Unit>
              </>
            ),
            at: eq + FPS * 1.7,
          },
          { node: "=", at: eq + FPS * 2.6, op: true },
          {
            node: (
              <>
                <Counter to={10240000} start={eq + FPS * 2.8} duration={2} />
                <Unit>€</Unit>
              </>
            ),
            at: eq + FPS * 2.8,
            hi: true,
          },
        ]}
      />
      <FadeIn
        start={cues.s(5)}
        style={{
          position: "absolute",
          top: 740,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(28, 300), color: COLORS.inkSoft }}>
          Valeur totale de ce composant dans l’installation fictive
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// 3 — La part du fournisseur : 25 %.
const Share: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(6);
  const eq = t + FPS * 3.4;
  const X = 260;
  const W = 1400;
  const fill = progress(frame, t + FPS * 1.2, 1.4);
  return (
    <AbsoluteFill>
      <Eq
        y={240}
        size={52}
        parts={[
          {
            node: (
              <>
                10 240 000<Unit>€</Unit>
              </>
            ),
            at: eq,
          },
          { node: "×", at: eq + FPS * 1.6, op: true },
          { node: "25 %", at: eq + FPS * 2 },
          { node: "=", at: eq + FPS * 3, op: true },
          {
            node: (
              <>
                <Counter to={2560000} start={eq + FPS * 3.2} duration={1.8} />
                <Unit>€</Unit>
              </>
            ),
            at: eq + FPS * 3.2,
            hi: true,
          },
        ]}
      />
      <Svg>
        <DrawPath
          d={roundRectPath(X, 400, W, 90, 10)}
          start={t}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        {fill > 0 && (
          <path
            d={roundRectPath(X + 5, 405, (W / 4 - 10) * fill, 80, 7)}
            fill={COLORS.accent}
            opacity={0.3}
          />
        )}
        <DrawPath
          d={`M ${X + W / 4} 392 V 498`}
          start={t + FPS * 1.2}
          duration={0.5}
          stroke={COLORS.accent}
        />
        <SvgText
          x={X + W / 8}
          y={445}
          text="25 %"
          start={t + FPS * 1.5}
          size={34}
          weight={300}
          color={COLORS.accent}
        />
        <SvgText
          x={X + W / 8}
          y={530}
          text="part du fournisseur"
          start={t + FPS * 1.8}
          size={24}
          color={COLORS.accent}
        />
        <SvgText
          x={X + (W * 5) / 8}
          y={445}
          text="valeur totale du composant : 100 %"
          start={t + 10}
          size={26}
          color={COLORS.inkSoft}
        />
      </Svg>
      <FadeIn
        start={cues.s(7)}
        style={{
          position: "absolute",
          top: 610,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...small(COLORS.accent), marginBottom: 14 }}>
          CE QUE C’EST
        </div>
        <div style={textStyle(36, 300)}>
          Un chiffre d’affaires potentiel de livraison
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(8)}
        style={{
          position: "absolute",
          top: 750,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300), color: COLORS.warm }}>
          Ni un revenu annuel automatiquement récurrent, ni un bénéfice.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// 4 — La formule à réutiliser, avec ASP et BOM.
const Formula: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(9);
  const asp = progress(frame, cues.s(10), 0.6);
  const bom = progress(frame, cues.s(11), 0.6);
  const terms = [
    { term: "CA", ex: "", at: t + FPS * 1.6 },
    { term: "=", ex: "", at: t + FPS * 2.6, op: true },
    { term: "systèmes livrés", ex: "6 400", at: t + FPS * 3.4 },
    { term: "×", ex: "", at: t + FPS * 4.4, op: true },
    { term: "composants\npar système", ex: "8", at: t + FPS * 4.6, key: "bom" },
    { term: "×", ex: "", at: t + FPS * 5.6, op: true },
    { term: "prix moyen", ex: "200 €", at: t + FPS * 5.8, key: "asp" },
    { term: "×", ex: "", at: t + FPS * 6.6, op: true },
    { term: "part obtenue", ex: "25 %", at: t + FPS * 6.8 },
  ];
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
        <div style={small(COLORS.inkSoft)}>LA FORMULE À RÉUTILISER</div>
      </FadeIn>
      <div
        style={{
          position: "absolute",
          top: 310,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 26,
        }}
      >
        {terms.map((p, i) => {
          const o = progress(frame, p.at, 0.6);
          const h = p.key === "asp" ? asp : p.key === "bom" ? bom : 0;
          return (
            <div key={i} style={{ opacity: o, textAlign: "center" }}>
              <div
                style={{
                  ...textStyle(p.op ? 44 : 38, p.term === "CA" ? 300 : 200),
                  color: p.op
                    ? COLORS.accent
                    : h > 0.5
                      ? COLORS.accent
                      : COLORS.ink,
                  whiteSpace: "pre",
                  lineHeight: 1.15,
                  borderBottom: `2px solid rgba(143, 208, 255, ${h})`,
                  paddingBottom: 6,
                }}
              >
                {p.term}
              </div>
              {p.ex && (
                <div
                  style={{
                    ...textStyle(26, 300),
                    color: COLORS.inkSoft,
                    marginTop: 14,
                  }}
                >
                  ex. {p.ex}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <FadeIn
        start={cues.s(10)}
        style={{ position: "absolute", left: 300, top: 560, width: 1320 }}
      >
        <div style={{ ...small(COLORS.accent), marginBottom: 10 }}>
          ASP · AVERAGE SELLING PRICE
        </div>
        <div style={textStyle(32, 300)}>Prix moyen de vente</div>
      </FadeIn>
      <FadeIn
        start={cues.s(11)}
        style={{ position: "absolute", left: 300, top: 690, width: 1320 }}
      >
        <div style={{ ...small(COLORS.accent), marginBottom: 10 }}>
          BOM · BILL OF MATERIALS
        </div>
        <div style={{ ...textStyle(32, 300), lineHeight: 1.35 }}>
          Nomenclature : liste et quantités des composants nécessaires à la
          construction du système
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 31 — Des racks au contenu fournisseur.
export const S31: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <FictiveTag start={cues.s(0)} />
      <Stage from={0} to={cues.s(3)}>
        <Title
          kicker="Premier modèle économique"
          text="Des racks aux accélérateurs"
          start={cues.s(0)}
          top={100}
        />
        <Accelerators />
      </Stage>
      <Stage from={cues.s(3)} to={cues.s(9)}>
        <Title
          kicker="Premier modèle économique"
          text="Des accélérateurs au contenu fournisseur"
          start={cues.s(3)}
          top={100}
        />
      </Stage>
      <Stage from={cues.s(3)} to={cues.s(6)}>
        <Content />
      </Stage>
      <Stage from={cues.s(6)} to={cues.s(9)}>
        <Share />
      </Stage>
      <Stage from={cues.s(9)}>
        <Title
          kicker="Premier modèle économique"
          text="Le chiffre d’affaires d’un fournisseur"
          start={cues.s(9)}
          top={100}
        />
        <Formula />
      </Stage>
    </AbsoluteFill>
  );
};
