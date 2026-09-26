import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { circlePath, icons, roundRectPath } from "../components/icons";
import { Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import { Pos, small } from "./S33";

const PX = 960;
const PY = 300;
const HALF = 430;
const STRING = 190;

// Pastille HTML posée dans un plateau.
const Weight: React.FC<{
  start: number;
  text: React.ReactNode;
  color: string;
}> = ({ start, text, color }) => (
  <FadeIn start={start} rise={-20}>
    <div
      style={{
        ...textStyle(24, 400),
        color,
        border: `1.5px solid ${color}`,
        borderRadius: 10,
        padding: "8px 16px",
        marginTop: 8,
        textAlign: "center",
        background: "rgba(3, 8, 23, 0.6)",
      }}
    >
      {text}
    </div>
  </FadeIn>
);

// Balance : le coût du die (A) contre les gains système possibles de B.
const Balance: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t1 = cues.s(1);
  const levers = [t1 + FPS * 3, t1 + FPS * 5.6, t1 + FPS * 7.6];
  // Inclinaison : penche vers A, puis bascule à mesure que B gagne des arguments.
  const deg = interpolate(
    frame,
    [
      cues.s(0, 1.6),
      cues.s(0, 2.6),
      levers[0],
      levers[0] + 20,
      levers[1],
      levers[1] + 20,
      levers[2],
      levers[2] + 20,
    ],
    [0, -7, -7, -2, -2, 3, 3, 7],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const a = (deg * Math.PI) / 180;
  const ends = [-1, 1].map((k) => ({
    x: PX + k * HALF * Math.cos(a),
    y: PY + k * HALF * Math.sin(a),
  }));
  const o = progress(frame, cues.s(0, 0.6), 0.8);
  const panW = 300;
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={`M ${PX} ${PY} V 640 M ${PX - 90} 640 H ${PX + 90}`}
          start={cues.s(0, 0.4)}
          duration={0.8}
          stroke={COLORS.inkSoft}
          width={2}
        />
        <g opacity={o}>
          <path
            d={`M ${ends[0].x} ${ends[0].y} L ${ends[1].x} ${ends[1].y}`}
            stroke={COLORS.ink}
            strokeWidth={2.4}
          />
          <path d={circlePath(PX, PY, 8)} fill={COLORS.ink} />
          {ends.map((e, i) => (
            <g key={i}>
              <path
                d={`M ${e.x} ${e.y} L ${e.x - panW / 2} ${e.y + STRING} M ${e.x} ${e.y} L ${e.x + panW / 2} ${e.y + STRING}`}
                stroke={COLORS.inkFaint}
                strokeWidth={1.2}
              />
              <path
                d={`M ${e.x - panW / 2 - 10} ${e.y + STRING} Q ${e.x} ${e.y + STRING + 46} ${e.x + panW / 2 + 10} ${e.y + STRING}`}
                fill="none"
                stroke={i === 0 ? COLORS.ink : COLORS.accent}
                strokeWidth={2}
              />
            </g>
          ))}
        </g>
      </Svg>
      {/* Contenu des plateaux (empilé au-dessus du plateau). */}
      {ends.map((e, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: e.x - 170,
            width: 340,
            bottom: 1080 - (e.y + STRING + 4),
            display: "flex",
            flexDirection: "column-reverse",
          }}
        >
          {i === 0 ? (
            <Weight
              start={cues.s(0, 1.4)}
              color={COLORS.ink}
              text="die bon : 250 € < 267 €"
            />
          ) : (
            <>
              <Weight
                start={levers[0]}
                color={COLORS.accent}
                text="consommation ↓"
              />
              <Weight
                start={levers[1]}
                color={COLORS.accent}
                text="débit utile ↑"
              />
              <Weight
                start={levers[2]}
                color={COLORS.accent}
                text="plus de mémoire ↑"
              />
            </>
          )}
        </div>
      ))}
      {ends.map((e, i) => (
        <div
          key={`l${i}`}
          style={{
            position: "absolute",
            left: e.x - 220,
            width: 440,
            top: e.y + STRING + 40,
            textAlign: "center",
          }}
        >
          <FadeIn start={i === 0 ? cues.s(0, 1.2) : t1}>
            <div style={textStyle(40, 200)}>{i === 0 ? "A" : "B"}</div>
          </FadeIn>
          <FadeIn start={i === 0 ? cues.s(0, 2) : t1 + FPS * 8.6}>
            <div
              style={{
                ...small(i === 0 ? COLORS.inkSoft : COLORS.accent),
                marginTop: 4,
              }}
            >
              {i === 0 ? "GAGNE SUR LE COÛT DU DIE" : "PEUT GAGNER SUR LE COÛT"}
            </div>
            {i === 1 && (
              <div style={{ ...small(COLORS.accent), marginTop: 6 }}>
                TOTAL D’EXPLOITATION
              </div>
            )}
          </FadeIn>
        </div>
      ))}
      <Pos
        start={t1 + FPS * 1.2}
        left={660}
        top={196}
        width={600}
        align="center"
      >
        <div style={{ ...textStyle(24, 300), color: COLORS.warm }}>
          si B va « suffisamment » loin
        </div>
      </Pos>
    </AbsoluteFill>
  );
};

const SAME = ["même service", "mêmes contraintes de qualité", "même délai"];

const SameService: React.FC = () => {
  const cues = useCues();
  const t = cues.s(2);
  return (
    <AbsoluteFill>
      <Pos start={t} left={0} top={742} width={1920} align="center">
        <div style={small(COLORS.ink)}>COMPARER DES SYSTÈMES QUI RENDENT</div>
      </Pos>
      <div
        style={{
          position: "absolute",
          top: 790,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 60,
        }}
      >
        {SAME.map((s, i) => (
          <FadeIn key={s} start={t + FPS * (1.6 + i * 1.6)}>
            <div
              style={{
                ...textStyle(28, 300),
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <svg width={30} height={30}>
                <path
                  d={icons.check(15, 15, 11)}
                  stroke={COLORS.accent}
                  strokeWidth={2}
                  fill="none"
                />
              </svg>
              {s}
            </div>
          </FadeIn>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Triangle PPA avec un point d'arbitrage qui se déplace.
const TRI = {
  perf: { x: 560, y: 270 },
  power: { x: 290, y: 700 },
  area: { x: 830, y: 700 },
};

const Ppa: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(3);
  const tri = `M ${TRI.perf.x} ${TRI.perf.y} L ${TRI.area.x} ${TRI.area.y} L ${TRI.power.x} ${TRI.power.y} Z`;
  const cx = (TRI.perf.x + TRI.power.x + TRI.area.x) / 3;
  const cy = (TRI.perf.y + TRI.power.y + TRI.area.y) / 3;
  // Le point erre entre les sommets (arbitrage), puis se fixe vers la performance.
  const s4 = cues.s(4);
  const s5 = cues.s(5);
  const toward = (p: { x: number; y: number }, k: number) => ({
    x: cx + (p.x - cx) * k,
    y: cy + (p.y - cy) * k,
  });
  const keys = [
    { f: s4, p: { x: cx, y: cy } },
    { f: s4 + 25, p: toward(TRI.power, 0.55) },
    { f: s4 + 50, p: toward(TRI.area, 0.55) },
    { f: s4 + 75, p: toward(TRI.perf, 0.55) },
    { f: s5, p: { x: cx, y: cy } },
    { f: s5 + 30, p: toward(TRI.perf, 0.72) },
  ];
  const fs = keys.map((k) => k.f);
  const dx = interpolate(
    frame,
    fs,
    keys.map((k) => k.p.x),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const dy = interpolate(
    frame,
    fs,
    keys.map((k) => k.p.y),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const dot = progress(frame, s4, 0.5);
  const favor = progress(frame, s5 + 20, 0.6);
  const labels = [
    { p: TRI.perf, dy: -44, en: "PERFORMANCE", fr: "performance", at: 1.6 },
    { p: TRI.power, dy: 50, en: "POWER", fr: "puissance", at: 1 },
    { p: TRI.area, dy: 50, en: "AREA", fr: "surface", at: 2.6 },
  ];
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={tri}
          start={t}
          duration={1.4}
          stroke={COLORS.inkSoft}
          width={1.6}
        />
        {[TRI.perf, TRI.power, TRI.area].map((p, i) => (
          <path
            key={i}
            d={circlePath(p.x, p.y, 8)}
            fill={i === 0 && favor > 0 ? COLORS.accent : COLORS.ink}
            opacity={progress(frame, t + FPS * labels[i === 0 ? 0 : i].at, 0.4)}
          />
        ))}
        {dot > 0 && (
          <>
            <path
              d={`M ${cx} ${cy} L ${dx} ${dy}`}
              stroke={COLORS.inkFaint}
              strokeWidth={1}
              strokeDasharray="4 6"
            />
            <path d={circlePath(dx, dy, 12)} fill={COLORS.warm} opacity={dot} />
            <path
              d={circlePath(dx, dy, 22)}
              fill="none"
              stroke={COLORS.warm}
              strokeWidth={1}
              opacity={dot * 0.5}
            />
          </>
        )}
      </Svg>
      {labels.map((l) => (
        <Pos
          key={l.en}
          start={t + FPS * l.at}
          left={l.p.x - 200}
          top={l.p.y + l.dy - 20}
          width={400}
          align="center"
        >
          <div style={small(COLORS.accent)}>{l.en}</div>
          <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
            {l.fr}
          </div>
        </Pos>
      ))}
      <Pos start={s4} left={cx - 300} top={790} width={600} align="center">
        <div style={{ ...textStyle(26, 300), color: COLORS.warm }}>
          un langage d’arbitrage
        </div>
      </Pos>
      <Pos start={s5 + 20} left={cx - 300} top={830} width={600} align="center">
        <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
          un fabricant peut privilégier l’un des trois
        </div>
      </Pos>
    </AbsoluteFill>
  );
};

const CLAIMS = [
  { v: "−25 %", what: "de puissance", cond: "à performance égale" },
  { v: "+15 %", what: "de performance", cond: "à puissance égale" },
  { v: "−30 %", what: "de surface", cond: "sur un bloc logique" },
];

// Trois pourcentages annoncés dans des conditions différentes : pas d'addition.
const NoSum: React.FC = () => {
  const cues = useCues();
  const t = cues.s(5, 2.2);
  const x = 1060;
  const w = 640;
  const ys = [300, 450, 600];
  return (
    <AbsoluteFill>
      <Pos start={t - 10} left={x} top={236} width={w}>
        <div style={small(COLORS.warm)}>TROIS ANNONCES · CHIFFRES FICTIFS</div>
      </Pos>
      <Svg>
        {ys.map((y, i) => (
          <DrawPath
            key={y}
            d={roundRectPath(x, y, w, 96, 12)}
            start={t + i * 12}
            duration={0.6}
            stroke={COLORS.inkSoft}
            width={1.4}
          />
        ))}
        {[0, 1].map((i) => {
          const cyy = ys[i] + 96 + 27;
          const at = t + FPS * 2.4 + i * 8;
          return (
            <g key={i}>
              <SvgText
                x={x + w / 2}
                y={cyy}
                text="+"
                start={t + 30}
                size={40}
                weight={200}
                color={COLORS.accent}
              />
              <DrawPath
                d={`M ${x + w / 2 - 24} ${cyy + 20} L ${x + w / 2 + 24} ${cyy - 20}`}
                start={at}
                duration={0.4}
                stroke={COLORS.warm}
                width={3}
              />
            </g>
          );
        })}
      </Svg>
      {CLAIMS.map((c, i) => (
        <Pos
          key={c.v}
          start={t + i * 12 + 6}
          left={x + 30}
          top={ys[i] + 16}
          width={w - 60}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
            <span style={{ ...textStyle(44, 200), color: COLORS.accent }}>
              {c.v}
            </span>
            <span style={textStyle(28, 300)}>{c.what}</span>
          </div>
          <div style={{ ...textStyle(22, 300), color: COLORS.inkSoft }}>
            {c.cond}
          </div>
        </Pos>
      ))}
      <Pos start={t + FPS * 3.2} left={x} top={722} width={w} align="center">
        <div style={{ ...textStyle(28, 300), color: COLORS.warm }}>
          <span style={{ textDecoration: "line-through" }}>
            un gain cumulé de 70 %
          </span>{" "}
          : conditions différentes
        </div>
      </Pos>
    </AbsoluteFill>
  );
};

// Scène 35 — Pourquoi le client peut préférer B ; le langage PPA.
export const S35: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(3)}>
        <Title
          text="Pourquoi le client peut préférer B"
          start={cues.s(0)}
          top={105}
        />
        <Balance />
        <SameService />
      </Stage>
      <Stage from={cues.s(3)}>
        <Title
          text="PPA · Power, Performance, Area"
          start={cues.s(3)}
          top={105}
        />
        <Ppa />
      </Stage>
      <Stage from={cues.s(5, 2)}>
        <NoSum />
      </Stage>
    </AbsoluteFill>
  );
};
