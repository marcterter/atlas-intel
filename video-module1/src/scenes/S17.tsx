import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Equation, Svg, SvgText, Title } from "../components/kit";
import {
  Counter,
  DrawPath,
  FadeIn,
  Stage,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

const clockPath = (x0: number, x1: number, y: number, P: number, amp = 50) => {
  let d = `M ${x0} ${y + amp}`;
  for (let x = x0; x + P <= x1 + 1; x += P) {
    d += ` H ${x + P * 0.1} V ${y - amp} H ${x + P * 0.6} V ${y + amp} H ${x + P}`;
  }
  return d;
};

// Beats 0 et 1 : l'horloge, sa fréquence et sa période.
const Clock: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const X0 = 240;
  const P = 240;
  const Y = 380;
  const n = 6;
  // Curseur qui parcourt le signal : chaque front montant lance une étape.
  const run = (frame - t - 40) / (P / 6);
  const step = Math.floor(Math.max(0, run));
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={clockPath(X0, X0 + n * P, Y, P)}
          start={t}
          duration={2}
          stroke={COLORS.accent}
          width={2.5}
        />
        <SvgText
          x={X0 - 20}
          y={Y}
          text="horloge"
          start={t}
          size={24}
          anchor="end"
          color={COLORS.inkSoft}
        />
        {new Array(n).fill(0).map((_, i) => (
          <SvgText
            key={i}
            x={X0 + P * (i + 0.6)}
            y={Y + 90}
            text={`étape ${i + 1}`}
            start={t + 20 + i * 8}
            size={22}
            color={
              step === i && frame < cues.beat(1) ? COLORS.ink : COLORS.inkSoft
            }
          />
        ))}
        {/* Période */}
        <DrawPath
          d={`M ${X0 + P * 0.1} ${Y - 80} V ${Y - 100} H ${X0 + P * 1.1} V ${Y - 80}`}
          start={cues.s(2, 5)}
          duration={0.8}
          stroke={COLORS.warm}
        />
        <SvgText
          x={X0 + P * 0.6}
          y={Y - 130}
          text="période T = 1 ns"
          start={cues.s(2, 5.4)}
          size={28}
          color={COLORS.warm}
        />
      </Svg>
      <FadeIn
        start={cues.s(2)}
        style={{
          position: "absolute",
          top: 520,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(40, 200)}>
          <span style={{ color: COLORS.accent }}>1 GHz</span> ={" "}
          <Counter to={1000000000} start={cues.s(2, 0.8)} duration={2.5} />{" "}
          cycles par seconde
        </div>
      </FadeIn>
      <Equation
        parts={["T", "=", "1", "÷", "f", "=", "1 ÷ 10⁹ Hz", "=", "1 ns"]}
        starts={[
          cues.s(3),
          cues.s(3, 0.4),
          cues.s(3, 0.8),
          cues.s(3, 1.1),
          cues.s(3, 1.4),
          cues.s(3, 2.2),
          cues.s(3, 2.4),
          cues.s(3, 3),
          cues.s(3, 3.2),
        ]}
        y={640}
        size={56}
      />
    </AbsoluteFill>
  );
};

// Beat 2 : le signal doit se stabiliser avant le front suivant.
const Settle: React.FC = () => {
  const cues = useCues();
  const t = cues.beat(2);
  const A = 400;
  const B = 1560;
  const SET = 1120;
  const segs = [
    {
      a: A,
      b: SET,
      label: "propagation\ndans la logique",
      color: COLORS.accent,
      s: 1.5,
    },
    {
      a: SET,
      b: 1330,
      label: "marge de\nmémorisation",
      color: COLORS.warm,
      s: 4,
    },
    {
      a: 1330,
      b: B,
      label: "incertitude\nd’horloge",
      color: COLORS.warm,
      s: 6,
    },
  ];
  // Données : plusieurs transitions parasites puis stabilisation.
  const data = `M 200 560 H ${A + 30} L ${A + 50} 500 H 560 L 580 560 H 660 L 680 500 H 760 L 780 560 H 860 L 880 500 H 980 L 1000 560 H 1060 L 1080 500 H ${B + 160}`;
  return (
    <AbsoluteFill>
      <Title
        kicker="Entre deux fronts d’horloge"
        text="Laisser les signaux se stabiliser"
        start={t}
        top={100}
      />
      <Svg>
        <SvgText
          x={180}
          y={330}
          text="horloge"
          start={t}
          size={24}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <DrawPath
          d={`M 200 360 H ${A} V 300 H ${A + 180} V 360 H ${B} V 300 H ${B + 160}`}
          start={t + 6}
          duration={1.2}
          stroke={COLORS.accent}
          width={2.5}
        />
        <SvgText
          x={A}
          y={265}
          text="front 1"
          start={t + 20}
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={B}
          y={265}
          text="front 2"
          start={t + 20}
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={180}
          y={530}
          text="signal"
          start={t + 20}
          size={24}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <DrawPath
          d={data}
          start={cues.s(4, 0.3)}
          duration={2.2}
          stroke={COLORS.ink}
          width={2.2}
        />
        <SvgText
          x={SET}
          y={470}
          text="stable"
          start={cues.s(4, 2.5)}
          size={22}
          color={COLORS.ink}
        />
        {[A, B].map((x) => (
          <path
            key={x}
            d={`M ${x} 290 V 780`}
            stroke={COLORS.inkFaint}
            strokeWidth={1}
            strokeDasharray="4 8"
          />
        ))}
        {segs.map((g) => (
          <g key={g.label}>
            <DrawPath
              d={`M ${g.a + 6} 640 H ${g.b - 6}`}
              start={cues.s(4, g.s)}
              duration={0.8}
              stroke={g.color}
              width={5}
            />
            <SvgText
              x={(g.a + g.b) / 2}
              y={700}
              text={g.label}
              start={cues.s(4, g.s + 0.3)}
              size={24}
              color={g.color}
            />
          </g>
        ))}
      </Svg>
    </AbsoluteFill>
  );
};

// Beats 3 et 4 : chemin critique, puis découpage en étages.
const Reg: React.FC<{ x: number; y: number; h: number; start: number }> = ({
  x,
  y,
  h,
  start,
}) => (
  <g>
    <DrawPath
      d={roundRectPath(x - 30, y - h / 2, 60, h, 8)}
      start={start}
      duration={0.6}
      stroke={COLORS.inkSoft}
    />
    <SvgText
      x={x}
      y={y + h / 2 + 30}
      text="registre"
      start={start + 6}
      size={22}
      color={COLORS.inkSoft}
    />
  </g>
);

const gateRow = (x0: number, x1: number, y: number, n: number) => {
  const gap = (x1 - x0) / n;
  const boxes = new Array(n)
    .fill(0)
    .map((_, i) =>
      roundRectPath(x0 + gap * i + gap * 0.5 - 22, y - 22, 44, 44, 6),
    )
    .join(" ");
  return { boxes, wire: `M ${x0} ${y} H ${x1}` };
};

const Critical: React.FC = () => {
  const cues = useCues();
  const t = cues.beat(3);
  const L = 330;
  const R = 1590;
  const paths = [
    { y: 330, n: 2, warm: false },
    { y: 450, n: 4, warm: false },
    { y: 570, n: 7, warm: true },
  ];
  return (
    <AbsoluteFill>
      <Title
        kicker="Le chemin critique"
        text="Le parcours le plus lent impose le rythme"
        start={t}
        top={100}
      />
      <Svg>
        <Reg x={L - 30} y={450} h={330} start={t + 6} />
        <Reg x={R + 30} y={450} h={330} start={t + 6} />
        {paths.map((p, i) => {
          const g = gateRow(L, R, p.y, p.n);
          const color = p.warm ? COLORS.warm : COLORS.inkSoft;
          const s = t + 20 + i * 18;
          return (
            <g key={p.y}>
              <DrawPath
                d={g.wire}
                start={s}
                duration={1}
                stroke={COLORS.inkFaint}
                width={1.4}
              />
              <DrawPath
                d={g.boxes}
                start={s + 8}
                duration={1}
                stroke={p.warm ? COLORS.warm : COLORS.ink}
                width={p.warm ? 2.5 : 1.8}
              />
              <SvgText
                x={R + 90}
                y={p.y}
                text={`${p.n} portes`}
                start={s + 20}
                size={24}
                anchor="start"
                color={color}
              />
            </g>
          );
        })}
        <SvgText
          x={960}
          y={640}
          text="chemin critique : le délai le plus long"
          start={t + 80}
          size={28}
          color={COLORS.warm}
        />
      </Svg>
      <FadeIn
        start={cues.s(6)}
        style={{
          position: "absolute",
          top: 700,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(34, 300)}>
          fréquence maximale ≈ 1 ÷{" "}
          <span style={{ color: COLORS.warm }}>délai du chemin critique</span>{" "}
          (+ marges)
        </div>
      </FadeIn>
      <div
        style={{
          position: "absolute",
          top: 790,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {["variations de fabrication", "tension", "température"].map((c, i) => (
          <FadeIn key={c} start={cues.s(6, 3.5 + i * 0.9)} rise={8}>
            <span
              style={{
                ...textStyle(24, 400),
                color: COLORS.warm,
                border: `1.5px solid ${COLORS.warm}`,
                borderRadius: 999,
                padding: "8px 22px",
              }}
            >
              {c}
            </span>
          </FadeIn>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const Pipeline: React.FC = () => {
  const cues = useCues();
  const t = cues.beat(4);
  const L = 330;
  const R = 1590;
  const M = 960;
  const top = gateRow(L, R, 330, 7);
  const a = gateRow(L, M - 40, 560, 4);
  const b = gateRow(M + 40, R, 560, 3);
  return (
    <AbsoluteFill>
      <Title
        kicker="Ajouter des étages"
        text="Couper le chemin en deux"
        start={t}
        top={100}
      />
      <Svg>
        <SvgText
          x={L - 80}
          y={330}
          text="avant"
          start={t}
          size={24}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <Reg x={L - 30} y={330} h={80} start={t} />
        <Reg x={R + 30} y={330} h={80} start={t} />
        <path d={top.wire} stroke={COLORS.inkFaint} strokeWidth={1.4} />
        <DrawPath d={top.boxes} start={t} duration={0.6} stroke={COLORS.warm} />
        <SvgText
          x={R + 90}
          y={330}
          text="1 cycle long"
          start={t + 10}
          size={24}
          anchor="start"
          color={COLORS.warm}
        />
        <SvgText
          x={L - 80}
          y={560}
          text="après"
          start={t + 20}
          size={24}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <Reg x={L - 30} y={560} h={80} start={t + 20} />
        <Reg x={M} y={560} h={80} start={t + 40} />
        <Reg x={R + 30} y={560} h={80} start={t + 20} />
        <DrawPath
          d={`${a.wire} ${b.wire}`}
          start={t + 26}
          duration={0.8}
          stroke={COLORS.inkFaint}
          width={1.4}
        />
        <DrawPath
          d={`${a.boxes} ${b.boxes}`}
          start={t + 30}
          duration={0.8}
          stroke={COLORS.accent}
        />
        <SvgText
          x={R + 90}
          y={560}
          text={"2 cycles\ncourts"}
          start={t + 50}
          size={24}
          anchor="start"
          color={COLORS.accent}
        />
      </Svg>
      <div
        style={{
          position: "absolute",
          top: 700,
          left: 240,
          width: 1440,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <FadeIn start={t + 60} style={{ width: 660 }}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.accent,
              letterSpacing: "0.28em",
            }}
          >
            GAIN
          </div>
          <div style={{ ...textStyle(30, 300), marginTop: 10 }}>
            chemin plus court par étage : horloge plus rapide possible
          </div>
        </FadeIn>
        <FadeIn start={cues.s(7, 3)} style={{ width: 660 }}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.warm,
              letterSpacing: "0.28em",
            }}
          >
            COÛT
          </div>
          <div style={{ ...textStyle(30, 300), marginTop: 10 }}>
            un registre de plus à coordonner, et plus de latence par résultat
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// Scène 17 — Fréquence et délai.
export const S17: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(2)}>
        <Title
          kicker="Des interrupteurs aux calculs"
          text="Fréquence et délai"
          start={cues.s(0)}
          top={100}
        />
        <Clock />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(3)}>
        <Settle />
      </Stage>
      <Stage from={cues.beat(3)} to={cues.beat(4)}>
        <Critical />
      </Stage>
      <Stage from={cues.beat(4)}>
        <Pipeline />
      </Stage>
    </AbsoluteFill>
  );
};
