import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT, FPS } from "../theme";
import { Flow, SvgCaps, TextAt, accentA, caps, inkA } from "./S23";

const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const line = (pts: number[][]) =>
  pts
    .map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(" ");

// --- 1. Canal court : le drain empiète sur la barrière.
const ShortChannel: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const s2 = cues.s(2);
  const s3 = cues.s(3);
  const k = progress(frame, s2 + FPS * 1.2, 2.2); // 0 = canal long, 1 = canal court
  const appear = progress(frame, t + 10, 0.8);
  // Coupe
  const cx = 520;
  const y0 = 470;
  const Lc = mix(380, 150, k);
  const gl = cx - Lc / 2;
  const gr = cx + Lc / 2;
  const reach = mix(110, 150, k); // portée de l'influence du drain
  // Diagramme de bande (énergie des électrons le long du canal)
  const long = [
    [1000, 580],
    [1150, 580],
    [1220, 380],
    [1540, 380],
    [1610, 660],
    [1760, 660],
  ];
  const short = [
    [1000, 580],
    [1270, 580],
    [1340, 480],
    [1370, 486],
    [1470, 660],
    [1760, 660],
  ];
  const band = long.map((p, i) => [
    mix(p[0], short[i][0], k),
    mix(p[1], short[i][1], k),
  ]);
  const top = Math.min(band[2][1], band[3][1]);
  return (
    <AbsoluteFill>
      <Title
        kicker="Les limites physiques déplacent l’innovation"
        text="Pourquoi un petit transistor devient-il difficile à contrôler ?"
        start={cues.s(0)}
      />
      <Svg>
        <g opacity={appear}>
          {/* Substrat, source, drain, grille */}
          <rect
            x={170}
            y={y0}
            width={700}
            height={170}
            rx={6}
            fill="none"
            stroke={COLORS.inkSoft}
            strokeWidth={1.4}
          />
          <rect
            x={185}
            y={y0}
            width={gl - 185}
            height={60}
            rx={6}
            fill={accentA(0.2)}
            stroke={COLORS.accent}
            strokeWidth={1.4}
          />
          <rect
            x={gr}
            y={y0}
            width={855 - gr}
            height={60}
            rx={6}
            fill={accentA(0.2)}
            stroke={COLORS.accent}
            strokeWidth={1.4}
          />
          <rect x={gl} y={y0 - 12} width={Lc} height={10} fill={inkA(0.4)} />
          <rect
            x={gl}
            y={y0 - 92}
            width={Lc}
            height={78}
            rx={5}
            fill="none"
            stroke={COLORS.ink}
            strokeWidth={1.8}
          />
          <text
            x={cx}
            y={y0 - 44}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={26}
            fill={COLORS.ink}
          >
            grille
          </text>
          <text
            x={(185 + gl) / 2}
            y={y0 + 38}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={22}
            fill={COLORS.accent}
          >
            source
          </text>
          <text
            x={(gr + 855) / 2}
            y={y0 + 38}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={22}
            fill={COLORS.accent}
          >
            drain
          </text>
          {/* Longueur du canal */}
          <path
            d={`M ${gl} ${y0 + 200} H ${gr} M ${gl} ${y0 + 190} V ${y0 + 210} M ${gr} ${y0 + 190} V ${y0 + 210}`}
            stroke={COLORS.inkSoft}
            strokeWidth={1.4}
          />
          <text
            x={cx}
            y={y0 + 240}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={22}
            fill={COLORS.inkSoft}
          >
            longueur du canal
          </text>
          {/* Contrôle de la grille */}
          {[-0.3, 0, 0.3].map((f) => (
            <path
              key={f}
              d={`M ${cx + f * Lc} ${y0 - 2} V ${y0 + 34} M ${cx + f * Lc - 6} ${y0 + 26} L ${cx + f * Lc} ${y0 + 34} L ${cx + f * Lc + 6} ${y0 + 26}`}
              stroke={COLORS.accent}
              strokeWidth={1.6}
              fill="none"
            />
          ))}
        </g>
        {/* Influence du drain : arcs qui partent du drain vers la source */}
        <g opacity={progress(frame, s2 + FPS * 0.4, 0.8)}>
          {[0, 1, 2].map((i) => {
            const r = reach * (0.55 + i * 0.25);
            return (
              <path
                key={i}
                d={`M ${gr} ${y0 + 20 + i * 8} Q ${gr - r * 0.6} ${y0 + 70 + i * 18} ${gr - r} ${y0 + 24}`}
                fill="none"
                stroke={COLORS.warm}
                strokeWidth={1.6}
                strokeDasharray="5 5"
              />
            );
          })}
        </g>
        <SvgText
          x={cx}
          y={y0 - 120}
          text="contrôle de la grille"
          start={t + 20}
          size={22}
          color={COLORS.accent}
        />
        <SvgText
          x={780}
          y={y0 + 110}
          text="influence du drain"
          start={s2 + FPS * 0.6}
          size={22}
          color={COLORS.warm}
        />

        {/* Diagramme d'énergie */}
        <g opacity={progress(frame, t + FPS * 1.5, 0.8)}>
          <path
            d={line(band)}
            fill="none"
            stroke={COLORS.ink}
            strokeWidth={2.2}
          />
          <text
            x={1000}
            y={330}
            fontFamily={FONT}
            fontSize={22}
            fill={COLORS.inkSoft}
          >
            énergie d’un électron le long du canal
          </text>
          <text
            x={1020}
            y={630}
            fontFamily={FONT}
            fontSize={22}
            fill={COLORS.accent}
          >
            source
          </text>
          <text
            x={1740}
            y={710}
            textAnchor="end"
            fontFamily={FONT}
            fontSize={22}
            fill={COLORS.accent}
          >
            drain
          </text>
          <text
            x={(band[2][0] + band[3][0]) / 2}
            y={top - 20}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={22}
            fill={k > 0.5 ? COLORS.warm : COLORS.ink}
          >
            {k > 0.5
              ? "barrière abaissée par le drain"
              : "barrière fixée par la grille"}
          </text>
          {/* Électrons au pied de la barrière */}
          {new Array(9).fill(0).map((_, i) => (
            <circle
              key={i}
              cx={1020 + i * 14 + Math.sin(frame * 0.2 + i) * 3}
              cy={566 - (i % 3) * 10}
              r={4.5}
              fill={COLORS.accent}
            />
          ))}
        </g>
        {/* Électrons qui passent par-dessus la barrière abaissée */}
        <Flow
          pts={[
            [band[1][0], band[1][1] - 16],
            [band[2][0], band[2][1] - 14],
            [band[3][0], band[3][1] - 14],
            [band[4][0], band[4][1] - 16],
            [band[5][0] - 20, band[5][1] - 16],
          ]}
          start={s2 + FPS * 3.6}
          n={4}
          period={3}
          color={COLORS.warm}
          r={4.5}
        />
      </Svg>
      <Stage from={s3}>
        <TextAt x={170} y={760} w={760} start={s3}>
          <div style={{ ...textStyle(28, 300) }}>
            <span style={{ color: COLORS.accent }}>passant</span> : fort courant
            I<sub>on</sub>
            <span style={{ color: COLORS.accent }}> ✓</span>
          </div>
          <div style={{ ...textStyle(28, 300), marginTop: 6 }}>
            <span style={{ color: COLORS.warm }}>bloqué</span> : faible courant
            I<sub>off</sub>
            <span style={{ color: COLORS.warm }}> ✕ fuite ↑</span>
          </div>
        </TextAt>
        <TextAt x={1000} y={760} w={780} start={s3 + FPS * 3}>
          <div style={caps(COLORS.warm)}>EFFETS DE CANAL COURT</div>
          <div style={{ ...textStyle(28, 300), marginTop: 8 }}>
            obtenir les deux à la fois devient plus difficile
          </div>
        </TextAt>
      </Stage>
    </AbsoluteFill>
  );
};

// --- 2. Un isolant de grille qui s'amincit.
const ThinOxide: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(4);
  const thin = progress(frame, t + FPS * 0.8, 2);
  const tox = mix(70, 16, thin);
  const x = 560;
  const w = 800;
  const yG = 280;
  const hG = 150;
  const yO = yG + hG;
  const yC = yO + tox;
  const n = Math.round(mix(0, 10, thin));
  return (
    <AbsoluteFill>
      <TextAt x={960} y={150} w={1400} start={t} align="center">
        <div style={textStyle(40, 200)}>Réduire l’isolant de grille</div>
      </TextAt>
      <Svg>
        <rect
          x={x}
          y={yG}
          width={w}
          height={hG}
          rx={8}
          fill="none"
          stroke={COLORS.ink}
          strokeWidth={1.8}
        />
        <rect x={x} y={yO} width={w} height={tox} fill={inkA(0.22)} />
        <rect
          x={x}
          y={yC}
          width={w}
          height={150}
          rx={8}
          fill={accentA(0.1)}
          stroke={COLORS.accent}
          strokeWidth={1.6}
        />
        <text
          x={x - 30}
          y={yG + hG / 2 + 8}
          textAnchor="end"
          fontFamily={FONT}
          fontSize={26}
          fill={COLORS.ink}
        >
          grille
        </text>
        <text
          x={x - 30}
          y={yO + tox / 2 + 8}
          textAnchor="end"
          fontFamily={FONT}
          fontSize={26}
          fill={COLORS.inkSoft}
        >
          isolant
        </text>
        <text
          x={x - 30}
          y={yC + 80}
          textAnchor="end"
          fontFamily={FONT}
          fontSize={26}
          fill={COLORS.accent}
        >
          canal
        </text>
        <path
          d={`M ${x + w + 30} ${yO} V ${yC} M ${x + w + 22} ${yO} H ${x + w + 38} M ${x + w + 22} ${yC} H ${x + w + 38}`}
          stroke={COLORS.warm}
          strokeWidth={1.6}
        />
        <text
          x={x + w + 52}
          y={(yO + yC) / 2 + 8}
          fontFamily={FONT}
          fontSize={24}
          fill={COLORS.warm}
        >
          épaisseur ↓
        </text>
        {/* Électrons qui traversent par effet tunnel */}
        {new Array(10).fill(0).map((_, i) => {
          if (i >= n) return null;
          const px = x + 60 + i * 76 + random(`tx${i}`) * 20;
          const ph = (((frame * 0.02 + random(`tp${i}`)) % 1) + 1) % 1;
          const py = yG + hG - 30 + ph * (tox + 90);
          return (
            <circle
              key={i}
              cx={px}
              cy={py}
              r={5}
              fill={COLORS.warm}
              opacity={Math.min(1, (1 - ph) * 4, ph * 4)}
            />
          );
        })}
      </Svg>
      <TextAt
        x={960}
        y={yC + 190}
        w={1400}
        start={t + FPS * 2.2}
        align="center"
      >
        <div style={{ ...textStyle(30, 300) }}>
          isolant très mince → des électrons le traversent :{" "}
          <span style={{ color: COLORS.warm }}>
            fuite de grille par effet tunnel
          </span>
        </div>
      </TextAt>
    </AbsoluteFill>
  );
};

// --- 3. Classique contre quantique.
const Tunnel: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(5);
  const s6 = cues.s(6);
  const base = 680;
  const top = 400;
  const eY = 540;
  // Panneau classique
  const cxb = 620;
  const bw = 60;
  const period = 3 * FPS;
  const ph = ((((frame - t) % period) + period) % period) / period;
  const ballX = 240 + (cxb - 20 - 240) * (1 - Math.abs(1 - 2 * ph));
  // Panneau quantique
  const qx0 = 1040;
  const xb = 1380;
  const wq = mix(60, 190, progress(frame, s6 + FPS * 1.2, 1.6));
  const kap = 0.02;
  const A = 60;
  const kw = 0.07;
  const wave = new Array(141).fill(0).map((_, i) => {
    const x = qx0 + i * 5;
    let y: number;
    if (x < xb) y = eY - A * Math.cos(kw * (x - xb));
    else if (x < xb + wq) y = eY - A * Math.exp(-kap * (x - xb));
    else y = eY - A * Math.exp(-kap * wq) * Math.cos(kw * (x - xb - wq));
    return [x, y];
  });
  const trans = Math.exp(-kap * wq);
  const qAt = t + FPS * 4;
  return (
    <AbsoluteFill>
      <TextAt x={960} y={140} w={1500} start={t} align="center">
        <div style={textStyle(40, 200)}>
          L’effet tunnel, un phénomène quantique
        </div>
      </TextAt>
      <Svg>
        {/* Classique */}
        <SvgCaps
          x={520}
          y={300}
          text="modèle classique"
          start={t + 6}
          color={COLORS.ink}
        />
        <DrawPath
          d={`M 200 ${base} H 860`}
          start={t}
          duration={0.6}
          stroke={COLORS.inkSoft}
        />
        <rect
          x={cxb}
          y={top}
          width={bw}
          height={base - top}
          fill={inkA(0.14)}
          stroke={COLORS.inkSoft}
          opacity={progress(frame, t + 6, 0.5)}
        />
        <path
          d={`M 200 ${eY} H ${cxb - 4}`}
          stroke={COLORS.inkFaint}
          strokeDasharray="5 6"
          opacity={progress(frame, t + 10, 0.5)}
        />
        <text
          x={210}
          y={eY - 24}
          fontFamily={FONT}
          fontSize={22}
          fill={COLORS.inkSoft}
          opacity={progress(frame, t + 10, 0.5)}
        >
          énergie de l’électron
        </text>
        <circle
          cx={ballX}
          cy={eY}
          r={12}
          fill={COLORS.accent}
          opacity={progress(frame, t + 14, 0.5)}
        />
        <SvgText
          x={520}
          y={base + 50}
          text="il rebondit : barrière infranchissable"
          start={t + FPS * 2}
          size={24}
          color={COLORS.ink}
        />
        {/* Quantique */}
        <SvgCaps
          x={1380}
          y={300}
          text="modèle quantique"
          start={qAt}
          color={COLORS.accent}
        />
        <g opacity={progress(frame, qAt, 0.6)}>
          <path
            d={`M ${qx0} ${base} H 1740`}
            stroke={COLORS.inkSoft}
            strokeWidth={2}
          />
          <rect
            x={xb}
            y={top}
            width={wq}
            height={base - top}
            fill={inkA(0.14)}
            stroke={COLORS.inkSoft}
          />
        </g>
        <DrawPath
          d={line(wave)}
          start={qAt + 10}
          duration={1.8}
          stroke={COLORS.accent}
          width={2.2}
        />
        <SvgText
          x={1210}
          y={base + 50}
          text="onde de l’électron"
          start={qAt + 20}
          size={22}
          color={COLORS.accent}
        />
        <text
          x={1740}
          y={base + 50}
          textAnchor="end"
          fontFamily={FONT}
          fontSize={22}
          fill={COLORS.warm}
          opacity={progress(frame, qAt + FPS * 2, 0.5)}
        >
          {trans > 0.1 ? "une partie passe" : "presque rien ne passe"}
        </text>
      </Svg>
      <Stage from={s6}>
        <TextAt x={960} y={770} w={1500} start={s6 + 6} align="center">
          <div style={{ ...textStyle(28, 300) }}>
            <span style={{ ...caps(COLORS.warm), marginRight: 14 }}>
              ATTENTION
            </span>
            ne compte que pour des barrières très minces ; un isolant épais
            reste un isolant
          </div>
        </TextAt>
      </Stage>
    </AbsoluteFill>
  );
};

export const S30: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(3)}>
        <ShortChannel />
      </Stage>
      <Stage from={cues.beat(3)} to={cues.beat(4)}>
        <ThinOxide />
      </Stage>
      <Stage from={cues.beat(4)}>
        <Tunnel />
      </Stage>
    </AbsoluteFill>
  );
};
