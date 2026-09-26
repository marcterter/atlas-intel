import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { circlePath } from "../components/icons";
import { Icon, Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
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

const ROWS = [
  {
    p: "Technologie difficile à reproduire",
    m: "Précision, savoir-faire, brevets.",
    r: "Alternative technique.",
  },
  {
    p: "Fournisseur qualifié",
    m: "Coût et délai pour changer de fournisseur.",
    r: "Qualification d’un concurrent.",
  },
  {
    p: "Plateforme et logiciels",
    m: "Compatibilité et outils adoptés par les clients.",
    r: "Migration vers une autre plateforme.",
  },
  {
    p: "Capacité rare",
    m: "Difficulté d’ajouter rapidement de l’offre.",
    r: "Surcapacité ultérieure.",
  },
  {
    p: "Intégration fiable",
    m: "Maîtrise de la construction du système.",
    r: "Concurrence sur les prix.",
  },
  {
    p: "Électricité accessible",
    m: "Ressource locale difficile à obtenir.",
    r: "Coût excessif ou faible utilisation.",
  },
];

// 1 — Le fossé autour du château : la concurrence s'arrête au bord.
const Moat: React.FC = () => {
  const cues = useCues();
  const t = cues.s(1);
  const cx = 500;
  const cy = 540;
  const attackers = [0, 1, 2, 3, 4, 5].map((i) => (i * 60 * Math.PI) / 180);
  return (
    <AbsoluteFill>
      <Svg>
        <Icon name="building" x={cx} y={cy} size={56} start={t} />
        <DrawPath
          d={circlePath(cx, cy, 130)}
          start={t + 10}
          duration={1.2}
          stroke={COLORS.accent}
          width={2}
        />
        <DrawPath
          d={circlePath(cx, cy, 160)}
          start={t + 20}
          duration={1.2}
          stroke={COLORS.accent}
          width={1.2}
        />
        <SvgText
          x={cx}
          y={cy + 215}
          text="moat"
          start={t + 30}
          size={26}
          color={COLORS.accent}
          spacing="0.2em"
        />
        {attackers.map((a, i) => (
          <Arrow
            key={i}
            x1={cx + Math.cos(a) * 300}
            y1={cy + Math.sin(a) * 280}
            x2={cx + Math.cos(a) * 176}
            y2={cy + Math.sin(a) * 176}
            start={cues.s(2, 0.3 + i * 0.3)}
            duration={0.8}
            stroke={COLORS.warm}
          />
        ))}
        <SvgText
          x={cx + 300}
          y={cy - 290}
          text="concurrence"
          start={cues.s(2, 0.6)}
          size={24}
          color={COLORS.warm}
        />
      </Svg>
      <div style={{ position: "absolute", left: 1000, top: 380, width: 760 }}>
        <FadeIn start={t}>
          <div style={{ ...small(COLORS.accent), marginBottom: 16 }}>MOAT</div>
          <div style={{ ...textStyle(44, 200), lineHeight: 1.25 }}>
            Avantage concurrentiel durable
          </div>
        </FadeIn>
        <FadeIn start={cues.s(2)} style={{ marginTop: 30 }}>
          <div
            style={{
              ...textStyle(30, 300),
              lineHeight: 1.4,
              color: COLORS.inkSoft,
            }}
          >
            Il protège l’entreprise contre la concurrence et l’érosion des
            profits.
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

const COL = { p: 160, m: 660, r: 1330 };
const W = { p: 460, m: 620, r: 440 };
const TOP = 318;
const RH = 88;

// 2 — Le tableau, ligne par ligne.
const Table: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = ROWS.map((_, k) => cues.s(4 + 2 * k));
  const cur = starts.reduce((a, s, i) => (frame >= s ? i : a), -1);
  const h = cues.s(3);
  return (
    <AbsoluteFill>
      {[
        { x: COL.p, w: W.p, t: "PROTECTION POSSIBLE", c: COLORS.accent },
        { x: COL.m, w: W.m, t: "EXEMPLE DE MÉCANISME", c: COLORS.inkSoft },
        { x: COL.r, w: W.r, t: "RISQUE À VÉRIFIER", c: COLORS.warm },
      ].map((c, i) => (
        <FadeIn
          key={c.t}
          start={h + i * 5}
          style={{ position: "absolute", left: c.x, top: 262, width: c.w }}
        >
          <div style={small(c.c)}>{c.t}</div>
        </FadeIn>
      ))}
      <Svg>
        <DrawPath
          d={`M ${COL.p} 300 H 1770`}
          start={h}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1}
        />
        {ROWS.map((_, k) => (
          <DrawPath
            key={k}
            d={`M ${COL.p} ${TOP + (k + 1) * RH} H 1770`}
            start={starts[k] + 6}
            duration={0.8}
            stroke={COLORS.inkFaint}
            width={1}
          />
        ))}
      </Svg>
      {ROWS.map((row, k) => {
        const o = progress(frame, starts[k], 0.6);
        const or = progress(frame, cues.s(5 + 2 * k), 0.6);
        const active = k === cur;
        const dim = active ? 1 : 0.5;
        const y = TOP + k * RH;
        const cell: React.CSSProperties = {
          position: "absolute",
          top: y,
          height: RH,
          display: "flex",
          alignItems: "center",
        };
        return (
          <React.Fragment key={row.p}>
            <div
              style={{
                position: "absolute",
                left: COL.p - 24,
                top: y + 18,
                width: 3,
                height: RH - 36,
                background: COLORS.accent,
                opacity: active ? o : 0,
              }}
            />
            <div style={{ ...cell, left: COL.p, width: W.p, opacity: o * dim }}>
              <div
                style={{
                  ...textStyle(28, active ? 400 : 300),
                  lineHeight: 1.25,
                }}
              >
                {row.p}
              </div>
            </div>
            <div
              style={{
                ...cell,
                left: COL.m,
                width: W.m,
                opacity: progress(frame, starts[k] + FPS * 1.2, 0.6) * dim,
              }}
            >
              <div
                style={{
                  ...textStyle(27, 300),
                  lineHeight: 1.3,
                  color: COLORS.ink,
                }}
              >
                {row.m}
              </div>
            </div>
            <div
              style={{ ...cell, left: COL.r, width: W.r, opacity: or * dim }}
            >
              <div
                style={{
                  ...textStyle(27, 300),
                  lineHeight: 1.3,
                  color: COLORS.warm,
                }}
              >
                {row.r}
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// Scène 33 — Qui peut protéger ses profits : le moat et ses risques.
export const S33: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Title
        kicker="Du matériel aux tokens et à la marge"
        text="Qui peut protéger ses profits"
        start={cues.s(0)}
        top={100}
      />
      <Stage from={0} to={cues.s(3)}>
        <Moat />
      </Stage>
      <Stage from={cues.s(3)}>
        <Table />
      </Stage>
    </AbsoluteFill>
  );
};
