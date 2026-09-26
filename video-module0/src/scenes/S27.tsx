import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Callout, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

const ROWS = [
  {
    name: "Fabrication et packaging",
    from: 2026,
    to: 2027,
    horizon: "2026–2027",
    check: "Capacité installée, qualifiée et rendement.",
    benef: "Fonderies, équipementiers",
    next: "Mémoire ou test",
  },
  {
    name: "Mémoire",
    from: 2026,
    to: 2028,
    horizon: "2026–2028",
    check: "Débit, capacité et volumes réellement livrés.",
    benef: "Mémoire, interconnexions",
    next: "Puissance ou chaleur",
  },
  {
    name: "Électricité",
    from: 2026,
    to: 2029,
    horizon: "2026–2029",
    check: "Dates de raccordement et de mise sous tension.",
    benef: "Équipements et ingénierie",
    next: "Coût et exploitation",
  },
  {
    name: "Communication",
    from: 2027,
    to: 2031,
    horizon: "2027–2031",
    check: "Adoption effective des architectures.",
    benef: "Réseau et optique",
    next: "Test et maintenance",
  },
  {
    name: "Demande solvable",
    from: 2026,
    to: 2031,
    horizon: "Toute période",
    check: "Contrats, utilisation et prix réalisés.",
    benef: "Exploitants efficaces",
    next: "Rentabilité du client final",
  },
];

const X0 = 640;
const YW = 185;
const YEARS = [2026, 2027, 2028, 2029, 2030, 2031];
const rowY = (i: number) => 330 + i * 64;

const label = (color: string): React.CSSProperties => ({
  ...textStyle(18, 500),
  color,
  letterSpacing: "0.28em",
  marginBottom: 12,
});

const Timeline: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = ROWS.map((_, k) => cues.s(3 + 3 * k));
  const cur = starts.reduce((a, s, i) => (frame >= s ? i : a), 0);
  const t = starts[0];
  return (
    <AbsoluteFill>
      <Svg>
        {/* Axe des années */}
        {YEARS.map((y, i) => (
          <g key={y}>
            <SvgText
              x={X0 + i * YW + YW / 2}
              y={262}
              text={String(y)}
              start={t - 20 + i * 3}
              size={22}
              weight={400}
              color={COLORS.inkSoft}
            />
            <DrawPath
              d={`M ${X0 + i * YW} 290 V ${rowY(4) + 30}`}
              start={t - 20 + i * 3}
              duration={0.8}
              stroke={COLORS.inkFaint}
              width={1}
            />
          </g>
        ))}
        <DrawPath
          d={`M ${X0 + 6 * YW} 290 V ${rowY(4) + 30}`}
          start={t - 2}
          duration={0.8}
          stroke={COLORS.inkFaint}
          width={1}
        />
        {ROWS.map((r, i) => {
          const s = starts[i];
          const grow = progress(frame, s, 1.2);
          const x = X0 + (r.from - 2026) * YW + 8;
          const w = ((r.to - r.from + 1) * YW - 16) * grow;
          const active = i === cur;
          const color = i === 4 ? COLORS.warm : COLORS.accent;
          const y = rowY(i);
          return (
            <g key={r.name} opacity={frame < s ? 0 : active ? 1 : 0.45}>
              <SvgText
                x={150}
                y={y}
                text={r.name}
                start={s}
                size={28}
                weight={active ? 400 : 300}
                anchor="start"
              />
              {w > 1 && (
                <>
                  <path
                    d={roundRectPath(x, y - 13, w, 26, 13)}
                    fill={color}
                    opacity={active ? 0.28 : 0.14}
                  />
                  <path
                    d={roundRectPath(x, y - 13, w, 26, 13)}
                    fill="none"
                    stroke={color}
                    strokeWidth={1.6}
                    strokeDasharray={i === 4 ? "6 8" : undefined}
                  />
                </>
              )}
            </g>
          );
        })}
      </Svg>
      {/* Fiche de la ligne courante */}
      {ROWS.map((r, i) => {
        const s = starts[i];
        const to = i < ROWS.length - 1 ? starts[i + 1] : cues.end + 60;
        if (frame < s - 2 || frame > to) return null;
        const out = interpolate(frame, [to - 8, to], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div key={r.name} style={{ opacity: out }}>
            <DrawDivider start={s} />
            <FadeIn
              start={s + 4}
              style={{ position: "absolute", left: 150, top: 690, width: 300 }}
            >
              <div style={label(i === 4 ? COLORS.warm : COLORS.accent)}>
                HORIZON
              </div>
              <div style={textStyle(40, 200)}>{r.horizon}</div>
            </FadeIn>
            <FadeIn
              start={cues.s(4 + 3 * i)}
              style={{ position: "absolute", left: 480, top: 690, width: 560 }}
            >
              <div style={label(COLORS.inkSoft)}>À VÉRIFIER</div>
              <div style={{ ...textStyle(30, 300), lineHeight: 1.35 }}>
                {r.check}
              </div>
            </FadeIn>
            <FadeIn
              start={cues.s(5 + 3 * i)}
              style={{ position: "absolute", left: 1110, top: 690, width: 660 }}
            >
              <div style={label(COLORS.inkSoft)}>BÉNÉFICIAIRES POSSIBLES</div>
              <div style={{ ...textStyle(30, 300), marginBottom: 22 }}>
                {r.benef}
              </div>
            </FadeIn>
            <FadeIn
              start={cues.s(5 + 3 * i, 2.2)}
              style={{ position: "absolute", left: 1110, top: 790, width: 660 }}
            >
              <div style={label(COLORS.warm)}>LIMITE SUIVANTE →</div>
              <div style={{ ...textStyle(30, 300), color: COLORS.warm }}>
                {r.next}
              </div>
            </FadeIn>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const DrawDivider: React.FC<{ start: number }> = ({ start }) => (
  <Svg>
    <DrawPath
      d="M 150 660 H 1770"
      start={start}
      duration={0.8}
      stroke={COLORS.inkFaint}
      width={1}
    />
  </Svg>
);

// Scène 27 — Matrice des bottlenecks sous forme de frise d'horizons.
export const S27: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Title
        kicker="Horizons d’investigation"
        text="Matrice initiale des bottlenecks"
        start={cues.s(0)}
        top={100}
      />
      <Stage from={0} to={cues.s(3)}>
        <Callout kind="analyst" start={cues.s(1)} y={330} width={1300}>
          Ces contraintes peuvent{" "}
          <span style={{ color: COLORS.warm }}>coexister</span>.
          <div style={{ height: 22 }} />
          <FadeIn start={cues.s(2)}>
            <span style={{ fontSize: 30, color: COLORS.inkSoft }}>
              Les périodes sont des horizons d’investigation, pas un classement
              universel des pénuries ni des prévisions certaines.
            </span>
          </FadeIn>
        </Callout>
      </Stage>
      <Stage from={cues.s(3)}>
        <Timeline />
      </Stage>
    </AbsoluteFill>
  );
};
