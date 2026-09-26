import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { circlePath, roundRectPath } from "../components/icons";
import { Icon, Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
  Counter,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";

// ——— Briques de la scène des repères ———

const Op: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span style={{ color: COLORS.accent }}>{children}</span>
);

// Numéro du repère, puis l'équivalence en grand.
const Eq: React.FC<{
  start: number;
  index: number;
  children: React.ReactNode;
}> = ({ start, index, children }) => (
  <div
    style={{
      position: "absolute",
      top: 140,
      width: "100%",
      textAlign: "center",
    }}
  >
    <FadeIn start={start}>
      <div
        style={{
          ...textStyle(22, 500),
          color: COLORS.inkSoft,
          letterSpacing: "0.32em",
        }}
      >
        REPÈRE {index} / 8
      </div>
    </FadeIn>
    <FadeIn start={start + 6} style={{ marginTop: 14 }}>
      <div style={textStyle(66, 200)}>{children}</div>
    </FadeIn>
  </div>
);

// Le « sens » du repère, en bas de la zone utile.
const Sens: React.FC<{
  start: number;
  children: React.ReactNode;
  warn?: React.ReactNode;
  warnStart?: number;
  top?: number;
}> = ({ start, children, warn, warnStart, top = 720 }) => (
  <div
    style={{ position: "absolute", top, width: "100%", textAlign: "center" }}
  >
    <FadeIn start={start}>
      <div
        style={{
          ...textStyle(22, 500),
          color: COLORS.inkSoft,
          letterSpacing: "0.32em",
          marginBottom: 10,
        }}
      >
        SENS
      </div>
      <div style={{ ...textStyle(34, 300), color: COLORS.accent }}>
        {children}
      </div>
    </FadeIn>
    {warn && (
      <FadeIn start={warnStart ?? start} style={{ marginTop: 10 }}>
        <div style={{ ...textStyle(32, 300), color: COLORS.warm }}>{warn}</div>
      </FadeIn>
    )}
  </div>
);

// Repère 1 — 1 GHz : une horloge dont une période dure 1 ns.
const Clock: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const x0 = 460;
  const per = 200;
  const hi = 360;
  const lo = 460;
  let d = `M ${x0} ${lo}`;
  for (let i = 0; i < 5; i++) {
    const x = x0 + i * per;
    d += ` V ${hi} H ${x + per / 2} V ${lo} H ${x + per}`;
  }
  // Curseur qui parcourt le signal.
  const scan = interpolate(
    frame,
    [t + 30, t + 30 + 5 * FPS],
    [x0, x0 + 5 * per],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const scanOn = progress(frame, t + 30, 0.4);
  return (
    <AbsoluteFill>
      <Eq start={t} index={1}>
        1 GHz <Op>=</Op> 10⁹ cycles par seconde
      </Eq>
      <Svg>
        <DrawPath d={d} start={t + 10} duration={2} stroke={COLORS.accent} />
        <line
          x1={scan}
          x2={scan}
          y1={hi - 20}
          y2={lo + 20}
          stroke={COLORS.inkSoft}
          strokeWidth={1}
          opacity={scanOn * 0.6}
        />
        {/* Une période marquée */}
        <DrawPath
          d={`M ${x0 + per} ${lo + 40} V ${lo + 58} H ${x0 + 2 * per} V ${lo + 40}`}
          start={t + 50}
          duration={0.6}
          stroke={COLORS.warm}
        />
        <SvgText
          x={x0 + 1.5 * per}
          y={lo + 92}
          text="1 période = 1 ns"
          start={t + 58}
          size={28}
          weight={400}
          color={COLORS.warm}
        />
        <SvgText
          x={x0 + 5 * per + 30}
          y={(hi + lo) / 2}
          text="horloge"
          start={t + 20}
          size={24}
          anchor="start"
          color={COLORS.inkSoft}
        />
      </Svg>
      <FadeIn
        start={t + 70}
        style={{
          position: "absolute",
          top: 600,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(34, 200), color: COLORS.ink }}>
          <Counter to={1e9} start={t + 70} duration={2} />{" "}
          <span style={{ color: COLORS.inkSoft }}>cycles en 1 seconde</span>
        </div>
      </FadeIn>
      <Sens
        start={cues.s(1, 3.5)}
        warn="≠ un milliard d’opérations garanties"
        warnStart={cues.s(2)}
      >
        Une période de 1 ns
      </Sens>
    </AbsoluteFill>
  );
};

// Repère 2 — 1 nm : trois divisions par mille depuis le mètre.
const Nano: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(3);
  const xs = [420, 780, 1140, 1500];
  const labels = ["1 m", "1 mm", "1 µm", "1 nm"];
  const y = 440;
  const travel = interpolate(
    frame,
    [t + 30, t + 30 + 2.4 * FPS],
    [xs[0], xs[3]],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return (
    <AbsoluteFill>
      <Eq start={t} index={2}>
        1 nm <Op>=</Op> 10⁻⁹ m
      </Eq>
      <Svg>
        <DrawPath
          d={`M ${xs[0]} ${y} H ${xs[3]}`}
          start={t + 8}
          duration={1}
          stroke={COLORS.inkSoft}
        />
        {xs.map((x, i) => (
          <g key={x}>
            <DrawPath
              d={`M ${x} ${y - 16} V ${y + 16}`}
              start={t + 10 + i * 6}
              duration={0.3}
              stroke={i === 3 ? COLORS.accent : COLORS.ink}
            />
            <SvgText
              x={x}
              y={y + 52}
              text={labels[i]}
              start={t + 14 + i * 6}
              size={30}
              weight={i === 3 ? 400 : 300}
              color={i === 3 ? COLORS.accent : COLORS.ink}
            />
            {i < 3 && (
              <>
                <DrawPath
                  d={`M ${x + 20} ${y - 30} Q ${x + 180} ${y - 110} ${xs[i + 1] - 20} ${y - 30}`}
                  start={t + 30 + i * 24}
                  duration={0.7}
                  stroke={COLORS.inkFaint}
                />
                <SvgText
                  x={x + 180}
                  y={y - 100}
                  text="÷ 1 000"
                  start={t + 36 + i * 24}
                  size={24}
                  color={COLORS.inkSoft}
                />
              </>
            )}
          </g>
        ))}
        <circle
          cx={travel}
          cy={y}
          r={7}
          fill={COLORS.accent}
          opacity={progress(frame, t + 26, 0.4)}
        />
        <SvgText
          x={960}
          y={580}
          text="1 000 × 1 000 × 1 000 = 10⁹ divisions"
          start={t + 110}
          size={26}
          color={COLORS.inkSoft}
        />
      </Svg>
      <Sens
        start={cues.s(4)}
        warn="Un nom de nœud n’est pas une dimension universelle"
        warnStart={cues.s(4, 1.6)}
      >
        Une unité de longueur
      </Sens>
    </AbsoluteFill>
  );
};

// Repère 3 — 1 fF : l'échelle des préfixes, et un petit condensateur.
const Femto: React.FC = () => {
  const cues = useCues();
  const t = cues.s(5);
  const prefixes = ["F", "mF", "µF", "nF", "pF", "fF"];
  const x0 = 470;
  const step = 196;
  const y = 380;
  const cx = 960;
  const cy = 560;
  return (
    <AbsoluteFill>
      <Eq start={t} index={3}>
        1 fF <Op>=</Op> 10⁻¹⁵ F
      </Eq>
      <Svg>
        {prefixes.map((p, i) => {
          const x = x0 + i * step;
          const at = t + 16 + i * 8;
          return (
            <g key={p}>
              <DrawPath
                d={roundRectPath(x - 56, y - 32, 112, 64, 10)}
                start={at}
                duration={0.5}
                stroke={i === 5 ? COLORS.accent : COLORS.inkSoft}
                width={i === 5 ? 2 : 1.4}
              />
              <SvgText
                x={x}
                y={y}
                text={p}
                start={at + 4}
                size={30}
                weight={i === 5 ? 400 : 300}
                color={i === 5 ? COLORS.accent : COLORS.ink}
              />
              {i < 5 && (
                <SvgText
                  x={x + step / 2}
                  y={y - 58}
                  text="× 10⁻³"
                  start={at + 8}
                  size={22}
                  color={COLORS.inkSoft}
                />
              )}
              {i < 5 && (
                <Arrow
                  x1={x + 60}
                  y1={y}
                  x2={x + step - 60}
                  y2={y}
                  start={at + 6}
                  duration={0.4}
                  stroke={COLORS.inkFaint}
                />
              )}
            </g>
          );
        })}
        {/* Condensateur : deux armatures, des charges qui se font face */}
        <DrawPath
          d={`M ${cx - 200} ${cy} H ${cx - 16} M ${cx - 16} ${cy - 50} V ${cy + 50} M ${cx + 16} ${cy - 50} V ${cy + 50} M ${cx + 16} ${cy} H ${cx + 200}`}
          start={cues.s(5, 2.5)}
          duration={1}
          stroke={COLORS.ink}
        />
        {[-34, -12, 12, 34].map((dy, i) => (
          <g key={dy}>
            <SvgText
              x={cx - 36}
              y={cy + dy}
              text="+"
              start={cues.s(5, 3.2) + i * 4}
              size={22}
              color={COLORS.accent}
            />
            <SvgText
              x={cx + 36}
              y={cy + dy}
              text="−"
              start={cues.s(5, 3.2) + i * 4}
              size={22}
              color={COLORS.warm}
            />
          </g>
        ))}
        <SvgText
          x={cx + 240}
          y={cy}
          text="C"
          start={cues.s(5, 3)}
          size={36}
          weight={300}
          anchor="start"
          color={COLORS.accent}
        />
      </Svg>
      <Sens start={cues.s(5, 4)}>
        Un ordre d’unité utile pour de petites capacités de circuit
      </Sens>
    </AbsoluteFill>
  );
};

// Repère 4 — 1 ps : 1 ns = 1 000 ps, et le délai entre deux fronts.
const Pico: React.FC = () => {
  const cues = useCues();
  const t = cues.s(6);
  const yIn = 460;
  const yOut = 580;
  const edge = 820;
  const delay = 110;
  return (
    <AbsoluteFill>
      <Eq start={t} index={4}>
        1 ps <Op>=</Op> 10⁻¹² s
      </Eq>
      <FadeIn
        start={t + 16}
        style={{
          position: "absolute",
          top: 300,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(34, 200), color: COLORS.inkSoft }}>
          1 ns <Op>=</Op>{" "}
          <span style={{ color: COLORS.ink }}>
            <Counter to={1000} start={t + 16} duration={1.4} />
          </span>{" "}
          ps
        </div>
      </FadeIn>
      <Svg>
        <SvgText
          x={560}
          y={yIn - 30}
          text="entrée"
          start={t + 30}
          size={24}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <DrawPath
          d={`M 600 ${yIn} H ${edge} V ${yIn - 60} H 1360`}
          start={t + 30}
          duration={1.2}
          stroke={COLORS.ink}
        />
        <SvgText
          x={560}
          y={yOut - 30}
          text="sortie"
          start={t + 50}
          size={24}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <DrawPath
          d={`M 600 ${yOut} H ${edge + delay} V ${yOut - 60} H 1360`}
          start={t + 50}
          duration={1.2}
          stroke={COLORS.accent}
        />
        <DrawPath
          d={`M ${edge} ${yIn + 20} V ${yOut + 40} M ${edge + delay} ${yOut + 10} V ${yOut + 40}`}
          start={t + 90}
          duration={0.5}
          stroke={COLORS.inkFaint}
          width={1.2}
        />
        <Arrow
          x1={edge}
          y1={yOut + 30}
          x2={edge + delay}
          y2={yOut + 30}
          start={t + 100}
          duration={0.4}
          stroke={COLORS.warm}
        />
        <SvgText
          x={edge + delay / 2}
          y={yOut + 70}
          text="délai élémentaire"
          start={t + 106}
          size={26}
          weight={400}
          color={COLORS.warm}
        />
      </Svg>
      <Sens start={cues.s(6, 4)} top={730}>
        Une unité utile pour certains délais élémentaires
      </Sens>
    </AbsoluteFill>
  );
};

// Repère 5 — 1 W = 1 J/s : un débit constant remplit une réserve d'énergie.
const Watt: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(7);
  const go = t + 24;
  const dur = 4 * FPS;
  const k = interpolate(frame, [go, go + dur], [0, 4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const tankX = 1140;
  const tankTop = 360;
  const tankH = 260;
  const fillH = (k / 4) * (tankH - 20);
  return (
    <AbsoluteFill>
      <Eq start={t} index={5}>
        1 W <Op>=</Op> 1 J par seconde
      </Eq>
      <Svg>
        {/* Débit : la puissance */}
        <DrawPath
          d={`M 560 ${tankTop - 20} H ${tankX + 90} V ${tankTop + 10}`}
          start={t + 8}
          duration={1}
          stroke={COLORS.inkSoft}
        />
        {new Array(8).fill(0).map((_, i) => {
          const ph = ((frame - go) / FPS / 1.2 + i / 8) % 1;
          if (frame < go || frame > go + dur + 20) return null;
          const len = 560 + (tankX + 90 - 560) * ph;
          return (
            <circle
              key={i}
              cx={len}
              cy={tankTop - 20}
              r={5}
              fill={COLORS.accent}
              opacity={0.8}
            />
          );
        })}
        <SvgText
          x={760}
          y={tankTop - 60}
          text="PUISSANCE · débit"
          start={t + 14}
          size={24}
          weight={500}
          spacing="0.18em"
          color={COLORS.accent}
        />
        {/* Réservoir : l'énergie accumulée */}
        <DrawPath
          d={`M ${tankX} ${tankTop} V ${tankTop + tankH} H ${tankX + 180} V ${tankTop}`}
          start={t + 12}
          duration={0.8}
          stroke={COLORS.ink}
        />
        <rect
          x={tankX + 6}
          y={tankTop + tankH - fillH - 4}
          width={168}
          height={fillH}
          fill={COLORS.warm}
          opacity={0.35}
        />
        <SvgText
          x={tankX + 360}
          y={tankTop + tankH / 2 - 60}
          text="ÉNERGIE · quantité"
          start={t + 14}
          size={24}
          weight={500}
          spacing="0.18em"
          color={COLORS.warm}
        />
      </Svg>
      <div
        style={{
          position: "absolute",
          top: tankTop + 110,
          left: tankX + 220,
          width: 300,
          textAlign: "center",
        }}
      >
        <FadeIn start={go}>
          <div style={{ ...textStyle(52, 200), color: COLORS.warm }}>
            <Counter to={4} start={go} duration={4} /> J
          </div>
        </FadeIn>
      </div>
      <div
        style={{
          position: "absolute",
          top: tankTop + 60,
          left: 540,
          width: 480,
          textAlign: "center",
        }}
      >
        <FadeIn start={go}>
          <div style={{ ...textStyle(52, 200), color: COLORS.accent }}>1 W</div>
          <div style={{ ...textStyle(28, 300), color: COLORS.inkSoft }}>
            pendant <Counter to={4} start={go} duration={4} /> s
          </div>
        </FadeIn>
      </div>
      <Sens start={cues.s(7, 2.2)}>Puissance et énergie sont différentes</Sens>
    </AbsoluteFill>
  );
};

// Repère 6 — bande interdite du silicium ≈ 1,1 eV.
const Gap: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(8);
  const x0 = 620;
  const x1 = 1300;
  const cTop = 330;
  const vTop = 560;
  const bandH = 70;
  const jump = progress(frame, cues.s(8, 3.2), 1.2);
  const ex = 900;
  const ey = vTop + 30 + (cTop + 40 - (vTop + 30)) * jump;
  return (
    <AbsoluteFill>
      <Eq start={t} index={6}>
        Bande interdite du silicium <Op>≈</Op> 1,1 eV
      </Eq>
      <Svg>
        <path
          d={roundRectPath(x0, cTop, x1 - x0, bandH, 8)}
          fill={COLORS.accent}
          opacity={0.1 * progress(frame, t + 16, 0.6)}
        />
        <DrawPath
          d={roundRectPath(x0, cTop, x1 - x0, bandH, 8)}
          start={t + 10}
          duration={0.8}
          stroke={COLORS.accent}
        />
        <path
          d={roundRectPath(x0, vTop, x1 - x0, bandH, 8)}
          fill={COLORS.ink}
          opacity={0.1 * progress(frame, t + 22, 0.6)}
        />
        <DrawPath
          d={roundRectPath(x0, vTop, x1 - x0, bandH, 8)}
          start={t + 16}
          duration={0.8}
          stroke={COLORS.ink}
        />
        <SvgText
          x={x0 - 30}
          y={cTop + bandH / 2}
          text={"bande de\nconduction"}
          start={t + 20}
          size={24}
          anchor="end"
          color={COLORS.accent}
        />
        <SvgText
          x={x0 - 30}
          y={vTop + bandH / 2}
          text={"bande de\nvalence"}
          start={t + 24}
          size={24}
          anchor="end"
          color={COLORS.ink}
        />
        <Arrow
          x1={1160}
          y1={vTop - 6}
          x2={1160}
          y2={cTop + bandH + 8}
          start={t + 34}
          duration={0.6}
          stroke={COLORS.warm}
        />
        <Arrow
          x1={1160}
          y1={cTop + bandH + 8}
          x2={1160}
          y2={vTop - 6}
          start={t + 34}
          duration={0.6}
          stroke={COLORS.warm}
        />
        <SvgText
          x={x1 + 30}
          y={(cTop + bandH + vTop) / 2 - 20}
          text="bande interdite"
          start={t + 40}
          size={24}
          anchor="start"
          color={COLORS.warm}
        />
        {/* Un électron franchit la bande interdite et laisse un trou */}
        <circle
          cx={ex}
          cy={ey}
          r={9}
          fill={COLORS.accent}
          opacity={progress(frame, cues.s(8, 2.6), 0.4)}
        />
        <DrawPath
          d={circlePath(ex, vTop + 30, 9)}
          start={cues.s(8, 4.2)}
          duration={0.4}
          stroke={COLORS.ink}
          width={1.6}
        />
      </Svg>
      <div
        style={{
          position: "absolute",
          top: (cTop + bandH + vTop) / 2,
          left: x1 + 30,
          width: 300,
        }}
      >
        <FadeIn start={t + 44}>
          <div style={{ ...textStyle(46, 200), color: COLORS.warm }}>
            ≈ <Counter to={1.1} decimals={1} start={t + 44} duration={1.2} /> eV
          </div>
        </FadeIn>
      </div>
      <Svg>
        <Icon
          name="thermometer"
          x={640}
          y={760}
          size={28}
          start={cues.s(8, 1.8)}
          color={COLORS.accent}
        />
      </Svg>
      <Sens start={cues.s(8, 1.8)}>Un repère à température ambiante</Sens>
    </AbsoluteFill>
  );
};

// Repère 7 — −10 % de tension → −19 % sur V².
const VSquare: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(9);
  const shrink = progress(frame, cues.s(9, 1.6), 1.4);
  const x0 = 560;
  const full = 800;
  const rows = [
    { label: "V", k: 0.9, text: "− 10 %", y: 340 },
    { label: "V²", k: 0.81, text: "− 19 %", y: 470 },
  ];
  return (
    <AbsoluteFill>
      <Eq start={t} index={7}>
        Tension <Op>−10 %</Op> → V² <Op>−19 %</Op>
      </Eq>
      <Svg>
        {rows.map((r, i) => {
          const w = full * (1 - (1 - r.k) * shrink);
          const appear = progress(frame, t + 10 + i * 8, 0.6);
          return (
            <g key={r.label} opacity={appear}>
              <text
                x={x0 - 30}
                y={r.y + 32}
                textAnchor="end"
                fontFamily="Inter Variable, Inter, sans-serif"
                fontSize={40}
                fontWeight={300}
                fill={COLORS.ink}
              >
                {r.label}
              </text>
              <rect
                x={x0}
                y={r.y}
                width={full}
                height={46}
                rx={8}
                fill="none"
                stroke={COLORS.inkFaint}
                strokeWidth={1.4}
              />
              <rect
                x={x0}
                y={r.y}
                width={w}
                height={46}
                rx={8}
                fill={i === 0 ? COLORS.accent : COLORS.warm}
                opacity={0.45}
              />
              <text
                x={x0 + full + 30}
                y={r.y + 32}
                fontFamily="Inter Variable, Inter, sans-serif"
                fontSize={32}
                fontWeight={400}
                fill={i === 0 ? COLORS.accent : COLORS.warm}
                opacity={shrink}
              >
                {r.text}
              </text>
            </g>
          );
        })}
      </Svg>
      <FadeIn
        start={cues.s(9, 3.2)}
        style={{
          position: "absolute",
          top: 570,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(48, 200) }}>
          0,9² <Op>=</Op>{" "}
          <Counter
            from={0.9}
            to={0.81}
            decimals={2}
            start={cues.s(9, 3.4)}
            duration={1.2}
          />
        </div>
      </FadeIn>
      <Sens start={cues.s(9, 5)} top={690}>
        P<sub style={{ fontSize: 22 }}>dyn</sub> ∝ α · C · V² · f — les autres
        facteurs restant fixes
      </Sens>
    </AbsoluteFill>
  );
};

// Repère 8 — pente idéale sous le seuil ≈ 60 mV par décade à 300 K.
const Slope: React.FC = () => {
  const cues = useCues();
  const t = cues.s(10);
  const ox = 620;
  const oy = 640;
  const w = 720;
  const h = 330;
  // Droite sous le seuil (échelle log), puis saturation.
  const curve = `M ${ox + 20} ${oy - 20} L ${ox + 420} ${oy - 260} Q ${ox + 480} ${oy - 296} ${ox + w - 20} ${oy - 305}`;
  // Triangle de pente : 60 mV en abscisse, 1 décade en ordonnée.
  const ax = ox + 160;
  const ay = oy - 20 - (140 * 240) / 400;
  const bx = ax + 150;
  const by = ay - 90;
  return (
    <AbsoluteFill>
      <Eq start={t} index={8}>
        Pente idéale <Op>≈</Op> 60 mV par décade à 300 K
      </Eq>
      <Svg>
        <Arrow
          x1={ox}
          y1={oy}
          x2={ox + w + 20}
          y2={oy}
          start={t + 10}
          stroke={COLORS.inkSoft}
        />
        <Arrow
          x1={ox}
          y1={oy}
          x2={ox}
          y2={oy - h - 20}
          start={t + 10}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={ox + w + 20}
          y={oy + 36}
          text="tension de grille"
          start={t + 16}
          size={24}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <SvgText
          x={ox - 20}
          y={oy - h}
          text={"courant\n(échelle log)"}
          start={t + 16}
          size={24}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <DrawPath
          d={curve}
          start={t + 24}
          duration={1.6}
          stroke={COLORS.accent}
        />
        <DrawPath
          d={`M ${ax} ${ay} H ${bx} V ${by}`}
          start={t + 70}
          duration={0.8}
          stroke={COLORS.warm}
        />
        <SvgText
          x={(ax + bx) / 2}
          y={ay + 30}
          text="60 mV"
          start={t + 78}
          size={24}
          weight={400}
          color={COLORS.warm}
        />
        <SvgText
          x={bx + 16}
          y={(ay + by) / 2}
          text="× 10 (une décade)"
          start={t + 86}
          size={24}
          weight={400}
          anchor="start"
          color={COLORS.warm}
        />
        <SvgText
          x={ox + 420}
          y={oy - 40}
          text="région sous le seuil"
          start={t + 40}
          size={24}
          anchor="start"
          color={COLORS.inkSoft}
        />
      </Svg>
      <Sens
        start={cues.s(11)}
        warn="… et non un seuil de tension"
        warnStart={cues.s(11, 2.2)}
        top={690}
      >
        La limite thermionique conventionnelle sous le seuil
      </Sens>
    </AbsoluteFill>
  );
};

// Ouverture : les huit repères en pastilles.
const CHIPS = ["GHz", "nm", "fF", "ps", "W", "eV", "V²", "mV/décade"];
const Intro: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Title
        text="Les repères à connaître"
        kicker="Repères et glossaire"
        start={0}
        top={300}
      />
      <Svg>
        {CHIPS.map((c, i) => {
          const x = 960 + (i - 3.5) * 180;
          return (
            <g key={c}>
              <DrawPath
                d={circlePath(x, 560, 62)}
                start={cues.s(0, 0.4) + i * 3}
                duration={0.5}
                stroke={COLORS.inkFaint}
              />
              <SvgText
                x={x}
                y={560}
                text={c}
                start={cues.s(0, 0.6) + i * 3}
                size={c.length > 4 ? 22 : 30}
                weight={300}
                color={COLORS.accent}
              />
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

// Scène 44 — Les repères : huit équivalences, chacune avec son sens.
export const S44: React.FC = () => {
  const cues = useCues();
  const b = (i: number) => cues.beat(i);
  const parts = [Intro, Clock, Nano, Femto, Pico, Watt, Gap, VSquare, Slope];
  return (
    <AbsoluteFill>
      {parts.map((Part, i) => (
        <Stage key={i} from={b(i)} to={i < 8 ? b(i + 1) : undefined}>
          <Part />
        </Stage>
      ))}
    </AbsoluteFill>
  );
};
