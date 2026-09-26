import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Svg, SvgText } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

const TERMS = ["P", "≈", "α", "×", "C", "×", "VDD²", "×", "f"];

// Équation d'en-tête : terme par terme, puis le terme commenté s'allume.
const Header: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(0, 1.5);
  const beats = [1, 2, 3, 4].map((b) => cues.beat(b));
  const cur = beats.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  const activeIdx = frame >= cues.beat(5) ? -1 : ([2, 4, 6, 8][cur] ?? -1);
  const big = interpolate(frame, [cues.beat(1) - 20, cues.beat(1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const top = 330 - 150 * big;
  const size = 110 - 34 * big;
  return (
    <div
      style={{ position: "absolute", top, width: "100%", textAlign: "center" }}
    >
      <FadeIn start={t - 20}>
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.inkSoft,
            letterSpacing: "0.3em",
            marginBottom: 18,
          }}
        >
          PUISSANCE DYNAMIQUE
        </div>
      </FadeIn>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "baseline",
          gap: size * 0.3,
        }}
      >
        {TERMS.map((p, i) => {
          const o = progress(frame, t + i * 8, 0.5);
          const isOp = p === "≈" || p === "×";
          const dim = activeIdx >= 0 && i !== activeIdx && !isOp && i !== 0;
          const color =
            i === activeIdx
              ? p === "VDD²"
                ? COLORS.warm
                : COLORS.accent
              : isOp
                ? COLORS.accent
                : COLORS.ink;
          return (
            <span
              key={i}
              style={{
                ...textStyle(size, 200),
                color,
                opacity: o * (dim ? 0.35 : 1),
                display: "inline-block",
                transform: `translateY(${(1 - o) * 12}px)`,
              }}
            >
              {p === "P" ? (
                <>
                  P<sub style={{ fontSize: size * 0.4 }}>dyn</sub>
                </>
              ) : (
                p
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// Fiche d'un terme : symbole, signification, unité, effet, et un petit schéma.
const Card: React.FC<{
  sym: string;
  meaning: string;
  unit: string;
  effect: string;
  effectAt: number;
  start: number;
  warm?: boolean;
  children?: React.ReactNode;
}> = ({ sym, meaning, unit, effect, effectAt, start, warm, children }) => {
  const color = warm ? COLORS.warm : COLORS.accent;
  return (
    <AbsoluteFill>
      <FadeIn
        start={start}
        style={{
          position: "absolute",
          left: 160,
          top: 360,
          width: 240,
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(sym.length > 2 ? 84 : 130, 200), color }}>
          {sym}
        </div>
      </FadeIn>
      <div style={{ position: "absolute", left: 440, top: 380, width: 640 }}>
        <FadeIn start={start + 8}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.inkSoft,
              letterSpacing: "0.28em",
            }}
          >
            SIGNIFICATION
          </div>
          <div
            style={{ ...textStyle(32, 300), marginTop: 10, lineHeight: 1.35 }}
          >
            {meaning}
          </div>
        </FadeIn>
        <FadeIn start={start + 20} style={{ marginTop: 30 }}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.inkSoft,
              letterSpacing: "0.28em",
            }}
          >
            UNITÉ
          </div>
          <div style={{ ...textStyle(30, 300), marginTop: 10 }}>{unit}</div>
        </FadeIn>
        <FadeIn start={effectAt} style={{ marginTop: 30 }}>
          <div
            style={{ ...textStyle(22, 500), color, letterSpacing: "0.28em" }}
          >
            EFFET (LE RESTE FIXE)
          </div>
          <div
            style={{ ...textStyle(32, 300), marginTop: 10, lineHeight: 1.35 }}
          >
            {effect}
          </div>
        </FadeIn>
      </div>
      <Svg>{children}</Svg>
    </AbsoluteFill>
  );
};

// α : un nœud sur 8 cycles, deux montées 0 → 1.
const AlphaViz: React.FC<{ start: number }> = ({ start }) => {
  const x0 = 1180;
  const P = 70;
  const bits = [0, 0, 1, 1, 0, 0, 1, 0];
  let d = `M ${x0} ${bits[0] ? 560 : 620}`;
  bits.forEach((b, i) => {
    const y = b ? 560 : 620;
    d += ` L ${x0 + i * P} ${y} H ${x0 + (i + 1) * P}`;
  });
  const rises = bits
    .map((b, i) => (b && !bits[i - 1] ? i : -1))
    .filter((i) => i > 0);
  return (
    <g>
      <SvgText
        x={x0}
        y={460}
        text="un nœud, sur 8 cycles"
        start={start + 10}
        size={22}
        anchor="start"
        color={COLORS.inkSoft}
      />
      {new Array(9).fill(0).map((_, i) => (
        <path
          key={i}
          d={`M ${x0 + i * P} 510 V 650`}
          stroke={COLORS.inkFaint}
          strokeWidth={1}
        />
      ))}
      <DrawPath d={d} start={start + 16} duration={1.6} stroke={COLORS.ink} />
      {rises.map((i, k) => (
        <g key={i}>
          <circle
            cx={x0 + i * P}
            cy={590}
            r={16}
            fill="none"
            stroke={COLORS.accent}
            strokeWidth={2}
            opacity={1}
          />
          <SvgText
            x={x0 + i * P}
            y={530 - 0}
            text={`${k + 1}`}
            start={start + 50 + k * 10}
            size={24}
            color={COLORS.accent}
          />
        </g>
      ))}
      <SvgText
        x={x0 + 4 * P}
        y={710}
        text="2 montées 0 → 1 ÷ 8 cycles : α = 0,25"
        start={start + 80}
        size={26}
        color={COLORS.accent}
      />
    </g>
  );
};

// C : plus de capacité, plus de charges à déplacer.
const CViz: React.FC<{ start: number }> = ({ start }) => (
  <g>
    {[0, 1].map((k) => {
      const x = 1300 + k * 280;
      const w = k === 0 ? 70 : 120;
      return (
        <g key={k}>
          <DrawPath
            d={`M ${x} 480 V 540 M ${x - w} 540 H ${x + w} M ${x - w} 580 H ${x + w} M ${x} 580 V 640`}
            start={start + 10 + k * 12}
            duration={0.8}
            stroke={COLORS.ink}
            width={2.5}
          />
          {new Array(k === 0 ? 3 : 6).fill(0).map((_, i) => (
            <SvgText
              key={i}
              x={
                x -
                w +
                20 +
                i * ((2 * w - 40) / Math.max(1, (k === 0 ? 3 : 6) - 1))
              }
              y={524}
              text="+"
              start={start + 30 + k * 12 + i * 3}
              size={24}
              color={COLORS.accent}
            />
          ))}
          <SvgText
            x={x}
            y={690}
            text={k === 0 ? "petite C" : "grande C"}
            start={start + 20 + k * 12}
            size={24}
            color={COLORS.inkSoft}
          />
        </g>
      );
    })}
  </g>
);

// VDD² : -10 % de tension → -19 % de puissance.
const VddViz: React.FC<{ start: number; sq: number }> = ({ start, sq }) => {
  const frame = useCurrentFrame();
  const x0 = 1150;
  const W = 460;
  const a = progress(frame, start + 10, 1);
  const b = progress(frame, sq, 1);
  return (
    <g>
      <SvgText
        x={x0}
        y={470}
        text="exemple : VDD baisse de 10 %"
        start={start + 10}
        size={24}
        anchor="start"
        color={COLORS.inkSoft}
      />
      <SvgText
        x={x0}
        y={520}
        text="VDD"
        start={start + 10}
        size={22}
        anchor="start"
        color={COLORS.inkSoft}
      />
      <rect
        x={x0}
        y={535}
        width={W * 0.9 * a}
        height={34}
        rx={6}
        fill={COLORS.accent}
        opacity={0.45}
      />
      <path
        d={`M ${x0 + W} 530 V 574`}
        stroke={COLORS.inkFaint}
        strokeWidth={1.5}
      />
      <SvgText
        x={x0 + W * 0.9 + 14}
        y={552}
        text="0,90"
        start={start + 30}
        size={24}
        anchor="start"
      />
      <SvgText
        x={x0}
        y={620}
        text="puissance (VDD²)"
        start={sq}
        size={22}
        anchor="start"
        color={COLORS.inkSoft}
      />
      <rect
        x={x0}
        y={635}
        width={W * 0.81 * b}
        height={34}
        rx={6}
        fill={COLORS.warm}
        opacity={0.5}
      />
      <path
        d={`M ${x0 + W} 630 V 674`}
        stroke={COLORS.inkFaint}
        strokeWidth={1.5}
      />
      <SvgText
        x={x0 + W * 0.81 + 14}
        y={652}
        text="0,81 (−19 %)"
        start={sq + 20}
        size={24}
        anchor="start"
        color={COLORS.warm}
      />
    </g>
  );
};

// f : plus de cycles par seconde.
const FViz: React.FC<{ start: number }> = ({ start }) => {
  const wave = (y: number, P: number) => {
    let d = `M 1180 ${y + 25}`;
    for (let x = 1180; x + P <= 1700 + 1; x += P)
      d += ` H ${x + P * 0.1} V ${y - 25} H ${x + P * 0.6} V ${y + 25} H ${x + P}`;
    return d;
  };
  return (
    <g>
      <SvgText
        x={1180}
        y={480}
        text="f"
        start={start + 10}
        size={24}
        anchor="start"
        color={COLORS.inkSoft}
      />
      <DrawPath
        d={wave(540, 130)}
        start={start + 10}
        duration={1}
        stroke={COLORS.inkSoft}
      />
      <SvgText
        x={1180}
        y={610}
        text="2 × f : deux fois plus de charges par seconde"
        start={start + 30}
        size={22}
        anchor="start"
        color={COLORS.accent}
      />
      <DrawPath
        d={wave(670, 65)}
        start={start + 30}
        duration={1}
        stroke={COLORS.accent}
      />
    </g>
  );
};

// Beat 5 : circuit complet et capacité effective.
const Sum: React.FC = () => {
  const cues = useCues();
  const t = cues.beat(5);
  return (
    <AbsoluteFill>
      <FadeIn
        start={t + 10}
        style={{
          position: "absolute",
          top: 360,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.inkSoft,
            letterSpacing: "0.28em",
          }}
        >
          CIRCUIT COMPLET : SOMME SUR LES NŒUDS i
        </div>
        <div style={{ ...textStyle(54, 200), marginTop: 16 }}>
          P ≈ <span style={{ color: COLORS.accent }}>Σ</span> αᵢ × Cᵢ × VDD² × f
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(10)}
        style={{
          position: "absolute",
          top: 530,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.inkSoft,
            letterSpacing: "0.28em",
          }}
        >
          OU AVEC UNE CAPACITÉ EFFECTIVE
        </div>
        <div style={{ ...textStyle(54, 200), marginTop: 16 }}>
          P ≈ C<sub style={{ fontSize: 26 }}>eff</sub> × VDD² × f
          <span
            style={{
              ...textStyle(30, 300),
              color: COLORS.inkSoft,
              marginLeft: 30,
            }}
          >
            où C<sub style={{ fontSize: 16 }}>eff</sub> = Σ αᵢ × Cᵢ
          </span>
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(10, 4.5)}
        style={{
          position: "absolute",
          top: 700,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300), color: COLORS.warm }}>
          Attention : C<sub style={{ fontSize: 18 }}>eff</sub> intègre déjà
          l’activité, ne pas appliquer α une seconde fois
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const Sources: React.FC = () => {
  const cues = useCues();
  const t = cues.s(11);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top: 380, left: 360, width: 1200 }}>
        <FadeIn start={t}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.accent,
              letterSpacing: "0.3em",
            }}
          >
            SOURCES
          </div>
        </FadeIn>
        {[
          [
            "[5]",
            "Texas Instruments, note technique",
            "distingue puissance statique et dynamique",
          ],
          ["[6]", "MIT, cours", "compromis entre vitesse et dissipation"],
        ].map(([n, who, what], i) => (
          <FadeIn
            key={n}
            start={t + 30 + i * 90}
            style={{ marginTop: 34, display: "flex", gap: 30 }}
          >
            <div style={{ ...textStyle(34, 300), color: COLORS.accent }}>
              {n}
            </div>
            <div>
              <div style={textStyle(34, 300)}>{who}</div>
              <div
                style={{
                  ...textStyle(28, 300),
                  color: COLORS.inkSoft,
                  marginTop: 6,
                }}
              >
                {what}
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Scène 20 — La relation essentielle.
export const S20: React.FC = () => {
  const cues = useCues();
  const b = (i: number) => cues.beat(i);
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(11)}>
        <Header />
      </Stage>
      <Stage from={b(1)} to={b(2)}>
        <Card
          sym="α"
          meaning="nombre moyen de charges de 0 vers 1 par cycle, pour la capacité considérée"
          unit="sans unité (fraction)"
          effect="moins d’activité inutile → moins de puissance"
          effectAt={cues.s(2)}
          start={b(1)}
        >
          <AlphaViz start={b(1)} />
        </Card>
      </Stage>
      <Stage from={b(2)} to={b(3)}>
        <Card
          sym="C"
          meaning="capacité électrique commutée"
          unit="farads (F)"
          effect="moins de charge à déplacer → moins de puissance"
          effectAt={cues.s(4)}
          start={b(2)}
        >
          <CViz start={b(2)} />
        </Card>
      </Stage>
      <Stage from={b(3)} to={b(4)}>
        <Card
          sym="VDD²"
          meaning="tension d’alimentation"
          unit="volts (V)"
          effect="effet au carré : un levier particulièrement fort"
          effectAt={cues.s(6)}
          start={b(3)}
          warm
        >
          <VddViz start={b(3)} sq={cues.s(6)} />
        </Card>
      </Stage>
      <Stage from={b(4)} to={b(5)}>
        <Card
          sym="f"
          meaning="fréquence de l’horloge"
          unit="hertz (Hz)"
          effect="plus de cycles par seconde → plus de puissance"
          effectAt={cues.s(8)}
          start={b(4)}
        >
          <FViz start={b(4)} />
        </Card>
      </Stage>
      <Stage from={b(5)} to={cues.s(11)}>
        <Sum />
      </Stage>
      <Stage from={cues.s(11)}>
        <Sources />
      </Stage>
    </AbsoluteFill>
  );
};
