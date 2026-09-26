import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Callout, Equation, Svg, SvgText, Title } from "../components/kit";
import {
  Counter,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT } from "../theme";

const tag = (color: string): React.CSSProperties => ({
  ...textStyle(22, 500),
  color,
  letterSpacing: "0.28em",
});

// Beat 0 : grille et connexions ≈ condensateur que l'on remplit de charges.
const Fill: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const c = t + 90;
  const q = progress(frame, c + 40, 4.5);
  const CX = 1150;
  const n = Math.round(q * 9);
  return (
    <AbsoluteFill>
      <Svg>
        {/* Grille et sa connexion */}
        <DrawPath
          d={roundRectPath(300, 420, 200, 60, 8)}
          start={t}
          duration={0.7}
        />
        <SvgText x={400} y={450} text="grille" start={t + 8} size={24} />
        <DrawPath
          d="M 280 510 H 520 M 280 560 H 520"
          start={t + 10}
          duration={0.6}
          stroke={COLORS.inkFaint}
          width={1.4}
        />
        <SvgText
          x={400}
          y={600}
          text="canal"
          start={t + 14}
          size={22}
          color={COLORS.inkSoft}
        />
        <DrawPath
          d="M 400 420 V 330 H 700"
          start={t + 16}
          duration={0.8}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={560}
          y={300}
          text="connexion"
          start={t + 22}
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={820}
          y={460}
          text="≈"
          start={c - 20}
          size={60}
          weight={200}
          color={COLORS.accent}
        />
        {/* Condensateur équivalent */}
        <DrawPath
          d={`M ${CX} 260 V 420 M ${CX - 130} 420 H ${CX + 130} M ${CX - 130} 500 H ${CX + 130} M ${CX} 500 V 620`}
          start={c}
          duration={1}
        />
        <DrawPath
          d={`M ${CX - 40} 620 H ${CX + 40} M ${CX - 26} 632 H ${CX + 26} M ${CX - 12} 644 H ${CX + 12}`}
          start={c + 10}
          duration={0.4}
        />
        <SvgText
          x={CX + 160}
          y={460}
          text="C"
          start={c + 10}
          size={40}
          anchor="start"
          weight={300}
        />
        <SvgText
          x={CX}
          y={230}
          text="courant I : on apporte des charges"
          start={c + 30}
          size={24}
          color={COLORS.accent}
        />
        {/* Charges + sur l'armature du haut, − en face */}
        {new Array(9).fill(0).map((_, i) => (
          <g key={i} opacity={i < n ? 1 : 0}>
            <text
              x={CX - 112 + i * 28}
              y={405}
              textAnchor="middle"
              fontFamily={FONT}
              fontSize={26}
              fill={COLORS.accent}
            >
              +
            </text>
            <text
              x={CX - 112 + i * 28}
              y={530}
              textAnchor="middle"
              fontFamily={FONT}
              fontSize={26}
              fill={COLORS.inkSoft}
            >
              −
            </text>
          </g>
        ))}
        {/* Charges qui descendent le fil */}
        {q > 0 &&
          q < 1 &&
          [0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={CX}
              cy={265 + (((frame - c) * 3 + i * 50) % 140)}
              r={4.5}
              fill={COLORS.accent}
            />
          ))}
        {/* Jauge de tension */}
        <DrawPath
          d={roundRectPath(1500, 300, 30, 300, 15)}
          start={c + 20}
          duration={0.6}
          stroke={COLORS.inkSoft}
          width={1.5}
        />
        {q > 0 && (
          <path
            d={roundRectPath(1504, 596 - 292 * q, 22, 292 * q, 11)}
            fill={COLORS.accent}
            opacity={0.7}
          />
        )}
        <SvgText
          x={1515}
          y={640}
          text="tension V"
          start={c + 24}
          size={24}
          color={COLORS.inkSoft}
        />
      </Svg>
      <FadeIn
        start={c + 60}
        style={{
          position: "absolute",
          top: 710,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(30, 300)}>
          Changer la tension ={" "}
          <span style={{ color: COLORS.accent }}>déplacer une charge</span>, ce
          qui prend du temps
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Beat 1 : C = charge par volt, Q = C × V.
const Charge: React.FC = () => {
  const cues = useCues();
  const t = cues.beat(1);
  const X0 = 300;
  const Y0 = 760;
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={`M ${X0} 300 V ${Y0} H 860`}
          start={t}
          duration={0.8}
          stroke={COLORS.inkSoft}
          width={1.5}
        />
        <SvgText
          x={X0 - 16}
          y={310}
          text="charge Q"
          start={t + 6}
          size={24}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <SvgText
          x={860}
          y={Y0 + 36}
          text="tension V"
          start={t + 6}
          size={24}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <DrawPath
          d={`M ${X0} ${Y0} L 820 360`}
          start={t + 14}
          duration={1}
          stroke={COLORS.accent}
          width={3}
        />
        <DrawPath
          d={`M 560 ${Y0 - 200} H 690 V ${Y0 - 300}`}
          start={t + 40}
          duration={0.6}
          stroke={COLORS.warm}
          width={1.5}
        />
        <SvgText
          x={625}
          y={Y0 - 175}
          text="+1 V"
          start={t + 48}
          size={22}
          color={COLORS.warm}
        />
        <SvgText
          x={710}
          y={Y0 - 250}
          text="C"
          start={t + 52}
          size={28}
          anchor="start"
          color={COLORS.warm}
        />
      </Svg>
      <FadeIn
        start={t + 10}
        style={{ position: "absolute", left: 1000, top: 330, width: 760 }}
      >
        <div style={tag(COLORS.accent)}>CAPACITÉ C</div>
        <div style={{ ...textStyle(32, 300), marginTop: 12 }}>
          quantité de charge nécessaire par volt
        </div>
        <div
          style={{
            ...textStyle(24, 300),
            marginTop: 10,
            color: COLORS.inkSoft,
          }}
        >
          unité : le farad (F)
        </div>
      </FadeIn>
      <div style={{ position: "absolute", left: 860, top: 560, width: 1040 }}>
        <Equation
          parts={["Q", "=", "C", "×", "V"]}
          starts={[
            cues.s(3),
            cues.s(3, 0.3),
            cues.s(3, 0.6),
            cues.s(3, 0.9),
            cues.s(3, 1.2),
          ]}
          y={0}
          size={72}
        />
      </div>
    </AbsoluteFill>
  );
};

// Beat 2 : à courant constant, la tension monte en rampe.
const Ramp: React.FC = () => {
  const cues = useCues();
  const t = cues.beat(2);
  const X0 = 300;
  const Y0 = 740;
  const s = t + 20;
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={`M ${X0} 320 V ${Y0} H 900`}
          start={t}
          duration={0.8}
          stroke={COLORS.inkSoft}
          width={1.5}
        />
        <SvgText
          x={X0 - 16}
          y={330}
          text="V"
          start={t + 6}
          size={28}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <SvgText
          x={900}
          y={Y0 + 36}
          text="temps"
          start={t + 6}
          size={24}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <DrawPath
          d={`M ${X0} 660 H 400 L 760 400 H 880`}
          start={s}
          duration={1.6}
          stroke={COLORS.accent}
          width={3}
        />
        <DrawPath
          d={`M 780 660 V 400 M 770 660 H 790 M 770 400 H 790`}
          start={s + 50}
          duration={0.6}
          stroke={COLORS.warm}
          width={1.5}
        />
        <SvgText
          x={800}
          y={530}
          text="ΔV"
          start={s + 56}
          size={28}
          anchor="start"
          color={COLORS.warm}
        />
        <DrawPath
          d={`M 400 700 H 760 M 400 690 V 710 M 760 690 V 710`}
          start={s + 64}
          duration={0.6}
          stroke={COLORS.warm}
          width={1.5}
        />
        <SvgText
          x={580}
          y={680}
          text="délai"
          start={s + 70}
          size={24}
          color={COLORS.warm}
        />
        <SvgText
          x={560}
          y={470}
          text={"pente = I ÷ C"}
          start={s + 80}
          size={24}
          anchor="end"
          color={COLORS.accent}
        />
      </Svg>
      <FadeIn
        start={t + 10}
        style={{ position: "absolute", left: 1000, top: 330, width: 760 }}
      >
        <div style={tag(COLORS.inkSoft)}>COURANT I À PEU PRÈS CONSTANT</div>
      </FadeIn>
      <div style={{ position: "absolute", left: 860, top: 420, width: 1040 }}>
        <Equation
          parts={["délai", "≈", "C", "×", "ΔV", "÷", "I"]}
          starts={[s + 20, s + 30, s + 40, s + 48, s + 56, s + 64, s + 72]}
          y={0}
          size={60}
        />
      </div>
      <FadeIn
        start={s + 110}
        style={{ position: "absolute", left: 1000, top: 560, width: 760 }}
      >
        <div style={{ ...textStyle(28, 300), lineHeight: 1.5 }}>
          <span style={{ color: COLORS.warm }}>plus de C</span> → plus lent
          <br />
          <span style={{ color: COLORS.accent }}>plus de I</span> → plus rapide
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Beat 3 : exemple chiffré.
const Example: React.FC = () => {
  const cues = useCues();
  const t = cues.s(5);
  const items = [
    { label: "CAPACITÉ", to: 2, dec: 0, unit: "fF", s: t + 10 },
    { label: "VARIATION ΔV", to: 0.7, dec: 1, unit: "V", s: t + 35 },
    { label: "COURANT", to: 100, dec: 0, unit: "µA", s: t + 60 },
  ];
  return (
    <AbsoluteFill>
      <Title
        kicker="Exemple fictif"
        text="Combien de temps pour charger ?"
        start={t}
        top={100}
      />
      <div
        style={{
          position: "absolute",
          top: 300,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 140,
        }}
      >
        {items.map((it) => (
          <FadeIn
            key={it.label}
            start={it.s}
            style={{ textAlign: "center", width: 360 }}
          >
            <div style={tag(COLORS.inkSoft)}>{it.label}</div>
            <div style={{ ...textStyle(80, 200), marginTop: 14 }}>
              <Counter to={it.to} decimals={it.dec} start={it.s} duration={1} />
              <span style={{ fontSize: 44, marginLeft: 12 }}>{it.unit}</span>
            </div>
          </FadeIn>
        ))}
      </div>
      <FadeIn
        start={t + 90}
        style={{
          position: "absolute",
          top: 520,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(34, 300), color: COLORS.inkSoft }}>
          2 × 10⁻¹⁵ F × 0,7 V ÷ 10⁻⁴ A = 1,4 × 10⁻¹¹ s
        </div>
      </FadeIn>
      <FadeIn
        start={t + 115}
        style={{
          position: "absolute",
          top: 610,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(90, 200), color: COLORS.accent }}>
          ≈ <Counter to={14} start={t + 115} duration={1.2} /> ps
        </div>
        <div
          style={{ ...textStyle(24, 300), color: COLORS.inkSoft, marginTop: 6 }}
        >
          picosecondes : millièmes de nanoseconde
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Beat 5 : fréquence et débit ne sont pas synonymes.
const Throughput: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(5);
  const X0 = 520;
  const P = 150;
  const n = 7;
  const run = frame - t - 50;
  const done = Math.max(0, Math.min(n, Math.floor(run / 30) + 1));
  const rows = [
    { name: "Processeur A", lanes: 1, y: 400 },
    { name: "Processeur B", lanes: 4, y: 610 },
  ];
  return (
    <AbsoluteFill>
      <Title
        kicker="Fréquence ≠ débit de calcul"
        text="Même horloge, travail différent"
        start={t}
        top={100}
      />
      <Svg>
        <DrawPath
          d={`M ${X0} 290 ${new Array(n)
            .fill(0)
            .map(
              (_, i) => `H ${X0 + i * P + 15} V 250 H ${X0 + i * P + 90} V 290`,
            )
            .join(" ")} H ${X0 + n * P}`}
          start={t + 10}
          duration={1.2}
          stroke={COLORS.accent}
        />
        <SvgText
          x={X0 - 30}
          y={270}
          text="même horloge (1 GHz)"
          start={t + 10}
          size={22}
          anchor="end"
          color={COLORS.accent}
        />
        {rows.map((r) => (
          <g key={r.name}>
            <SvgText
              x={X0 - 30}
              y={r.y}
              text={r.name}
              start={t + 20}
              size={28}
              anchor="end"
            />
            <SvgText
              x={X0 - 30}
              y={r.y + 36}
              text={`${r.lanes} opération${r.lanes > 1 ? "s" : ""} / cycle`}
              start={t + 26}
              size={22}
              anchor="end"
              color={COLORS.inkSoft}
            />
            {new Array(Math.min(done, n))
              .fill(0)
              .map((_, i) =>
                new Array(r.lanes)
                  .fill(0)
                  .map((__, l) => (
                    <rect
                      key={`${i}-${l}`}
                      x={X0 + i * P + 20}
                      y={r.y - (r.lanes * 30) / 2 + l * 30 + 4}
                      width={P - 40}
                      height={22}
                      rx={5}
                      fill={r.lanes > 1 ? COLORS.accent : COLORS.ink}
                      opacity={0.55}
                    />
                  )),
              )}
            <text
              x={X0 + n * P + 40}
              y={r.y + 12}
              fontFamily={FONT}
              fontSize={34}
              fontWeight={300}
              fill={COLORS.ink}
            >
              {done * r.lanes} op.
            </text>
          </g>
        ))}
      </Svg>
      <div
        style={{
          position: "absolute",
          top: 780,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {["architecture", "parallélisme", "alimentation en données"].map(
          (c, i) => (
            <FadeIn key={c} start={cues.s(7, 5 + i * 1.2)} rise={8}>
              <span
                style={{
                  ...textStyle(26, 400),
                  color: COLORS.accent,
                  border: `1.5px solid ${COLORS.accent}`,
                  borderRadius: 999,
                  padding: "8px 24px",
                }}
              >
                {c}
              </span>
            </FadeIn>
          ),
        )}
      </div>
    </AbsoluteFill>
  );
};

// Scène 18 — La capacité électrique.
export const S18: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(1)}>
        <Title
          kicker="Des interrupteurs aux calculs"
          text="La capacité électrique introduit une attente"
          start={cues.s(0)}
          top={100}
        />
        <Fill />
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(2)}>
        <Title
          kicker="Capacité"
          text="La charge par volt"
          start={cues.beat(1)}
          top={100}
        />
        <Charge />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(3)}>
        <Title
          kicker="Délai de charge"
          text="Un courant qui remplit une capacité"
          start={cues.beat(2)}
          top={100}
        />
        <Ramp />
      </Stage>
      <Stage from={cues.beat(3)} to={cues.beat(4)}>
        <Example />
      </Stage>
      <Stage from={cues.beat(4)} to={cues.beat(5)}>
        <Callout
          kind="warn"
          label="ATTENTION · MODÈLE SIMPLIFIÉ"
          start={cues.s(6)}
          y={300}
          width={1300}
        >
          Il explique l’effet de <span style={{ color: COLORS.warm }}>C</span>{" "}
          et de <span style={{ color: COLORS.accent }}>I</span> sur le délai.
          <div style={{ height: 20 }} />
          <FadeIn start={cues.s(6, 3.5)}>
            <span style={{ color: COLORS.inkSoft }}>
              Il ne prédit pas le délai complet d’un circuit réel.
            </span>
          </FadeIn>
        </Callout>
      </Stage>
      <Stage from={cues.beat(5)}>
        <Throughput />
      </Stage>
    </AbsoluteFill>
  );
};
