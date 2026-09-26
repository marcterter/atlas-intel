import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { IconName, circlePath } from "../components/icons";
import { Icon, Link, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";

const label = (color: string = COLORS.inkSoft): React.CSSProperties => ({
  ...textStyle(22, 500),
  color,
  letterSpacing: "0.26em",
});

const TRIO: { icon: IconName; text: string }[] = [
  { icon: "chip", text: "Calcul" },
  { icon: "memory", text: "Mémoire" },
  { icon: "network", text: "Communication" },
];

const Intro: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const focus = progress(frame, cues.s(1), 0.8);
  return (
    <AbsoluteFill>
      <Title text="Calcul, mémoire et communication" start={cues.s(0)} />
      <Svg>
        {TRIO.map((t, i) => {
          const x = 560 + i * 400;
          const on = i === 0;
          const color = on ? COLORS.accent : COLORS.ink;
          return (
            <g key={t.text} opacity={on ? 1 : 1 - 0.6 * focus}>
              <DrawPath
                d={circlePath(x, 480, 100)}
                start={cues.s(0, 0.3 + i * 0.4)}
                duration={0.8}
                stroke={color}
              />
              <Icon
                name={t.icon}
                x={x}
                y={480}
                size={42}
                start={cues.s(0, 0.6 + i * 0.4)}
                color={color}
              />
              <SvgText
                x={x}
                y={640}
                text={t.text}
                start={cues.s(0, 0.8 + i * 0.4)}
                size={32}
                color={color}
              />
            </g>
          );
        })}
        {TRIO.slice(1).map((_, i) => (
          <Link
            key={i}
            from={[560 + i * 400 + 100, 480]}
            to={[560 + (i + 1) * 400 - 100, 480]}
            start={cues.s(0, 1.2)}
            gap={14}
            color={COLORS.inkFaint}
          />
        ))}
      </Svg>
      <FadeIn
        start={cues.s(1)}
        style={{
          position: "absolute",
          top: 720,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(36, 300), color: COLORS.accent }}>
          D’abord, la puissance de calcul
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const PARTS = [
  { k: "FL", en: "Floating-Point", fr: "virgule flottante" },
  { k: "OP", en: "Operations", fr: "opérations" },
  { k: "S", en: "Per Second", fr: "par seconde" },
];
const CHECKS = [
  "précision des nombres",
  "type d’opération",
  "conditions de mesure",
];

const Flops: React.FC = () => {
  const cues = useCues();
  const t = cues.s(2);
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: 150,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 110,
        }}
      >
        {PARTS.map((p, i) => (
          <div key={p.k} style={{ width: 360, textAlign: "center" }}>
            <FadeIn start={t + i * 6}>
              <div style={{ ...textStyle(130, 200), color: COLORS.accent }}>
                {p.k}
              </div>
            </FadeIn>
            <FadeIn start={t + FPS * (0.9 + i * 0.9)}>
              <div style={{ ...textStyle(30, 300), marginTop: 6 }}>{p.en}</div>
            </FadeIn>
            <FadeIn start={t + FPS * (3 + i * 0.8)}>
              <div
                style={{
                  ...textStyle(28, 300),
                  color: COLORS.inkSoft,
                  marginTop: 10,
                }}
              >
                {p.fr}
              </div>
            </FadeIn>
          </div>
        ))}
      </div>
      <FadeIn
        start={cues.s(3)}
        style={{
          position: "absolute",
          top: 520,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={label(COLORS.ink)}>UNE MESURE DE CAPACITÉ DE CALCUL</div>
      </FadeIn>
      <FadeIn
        start={cues.s(4)}
        style={{
          position: "absolute",
          top: 610,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300) }}>
          Comparer deux chiffres ? Vérifier d’abord :
        </div>
      </FadeIn>
      <Svg>
        {CHECKS.map((c, i) => {
          const x = 560 + i * 400;
          const at = cues.s(4, 2 + i * 1.3);
          return (
            <g key={c}>
              <Icon
                name="magnifier"
                x={x - 150}
                y={760}
                size={20}
                start={at}
                color={COLORS.warm}
              />
              <SvgText
                x={x - 116}
                y={760}
                text={c}
                start={at + 4}
                size={28}
                anchor="start"
                color={COLORS.warm}
              />
            </g>
          );
        })}
      </Svg>
    </AbsoluteFill>
  );
};

// Trois dimensions : la taille du seau, la largeur du tuyau, le délai d'arrivée.
const COLS = [420, 960, 1500];
const VY = 380;

const Bucket: React.FC<{ cx: number; start: number }> = ({ cx, start }) => {
  const frame = useCurrentFrame();
  const lvl = progress(frame, start + 20, 2.2);
  const top = 280;
  const bottom = 470;
  const y = bottom - lvl * 150;
  const half = (yy: number) => 80 + ((bottom - yy) / (bottom - top)) * 30;
  return (
    <g>
      {lvl > 0 && (
        <path
          d={`M ${cx - half(y)} ${y} L ${cx - 80} ${bottom} H ${cx + 80} L ${cx + half(y)} ${y} Z`}
          fill={COLORS.accent}
          opacity={0.35}
        />
      )}
      <DrawPath
        d={`M ${cx - 110} ${top} L ${cx - 80} ${bottom} H ${cx + 80} L ${cx + 110} ${top}`}
        start={start}
        duration={0.9}
        stroke={COLORS.ink}
      />
      <SvgText
        x={cx + 150}
        y={bottom - 20}
        text="Go"
        start={start + 30}
        size={24}
        anchor="start"
        color={COLORS.inkSoft}
      />
    </g>
  );
};

const Pipe: React.FC<{ cx: number; start: number }> = ({ cx, start }) => {
  const frame = useCurrentFrame();
  const on = progress(frame, start + 15, 0.6);
  const len = 440;
  const dots = new Array(36).fill(0).map((_, i) => {
    const lane = i % 4;
    const speed = 160; // px par seconde
    const pos =
      (((frame - start) / FPS) * speed + ((i * 97) % len) + len) % len;
    return { x: cx - len / 2 + pos, y: VY - 36 + lane * 24 };
  });
  return (
    <g>
      <DrawPath
        d={`M ${cx - 230} ${VY - 55} H ${cx + 230} M ${cx - 230} ${VY + 55} H ${cx + 230}`}
        start={start}
        duration={0.9}
        stroke={COLORS.ink}
      />
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={4}
          fill={COLORS.accent}
          opacity={on * 0.85}
        />
      ))}
      <SvgText
        x={cx}
        y={VY + 100}
        text="octets / seconde"
        start={start + 30}
        size={24}
        color={COLORS.inkSoft}
      />
    </g>
  );
};

const Delay: React.FC<{ cx: number; start: number }> = ({ cx, start }) => {
  const frame = useCurrentFrame();
  const cycle = 2.6 * FPS;
  const local = Math.max(0, frame - start - 20);
  const ph = (local % cycle) / cycle;
  const travel = Math.min(1, ph / 0.8);
  const a = ph * Math.PI * 2;
  const on = progress(frame, start + 20, 0.4);
  const clockY = VY - 70;
  return (
    <g>
      <DrawPath
        d={circlePath(cx - 200, VY + 40, 14)}
        start={start}
        duration={0.6}
        stroke={COLORS.ink}
      />
      <DrawPath
        d={circlePath(cx + 200, VY + 40, 14)}
        start={start + 6}
        duration={0.6}
        stroke={COLORS.ink}
      />
      <DrawPath
        d={`M ${cx - 180} ${VY + 40} H ${cx + 180}`}
        start={start + 10}
        duration={0.8}
        stroke={COLORS.inkFaint}
        width={1.5}
      />
      {/* Chronomètre */}
      <DrawPath
        d={circlePath(cx, clockY, 44)}
        start={start + 12}
        duration={0.7}
        stroke={COLORS.ink}
      />
      <line
        x1={cx}
        y1={clockY}
        x2={cx + 34 * Math.sin(a)}
        y2={clockY - 34 * Math.cos(a)}
        stroke={COLORS.accent}
        strokeWidth={2}
        opacity={on}
      />
      <circle
        cx={cx - 186 + travel * 372}
        cy={VY + 40}
        r={7}
        fill={COLORS.accent}
        opacity={on * (ph < 0.95 ? 1 : 0)}
      />
      <SvgText
        x={cx}
        y={VY + 100}
        text="délai avant la donnée"
        start={start + 30}
        size={24}
        color={COLORS.inkSoft}
      />
    </g>
  );
};

const DIMS = [
  {
    name: "Capacité",
    q: "Combien de données tiennent en mémoire ?",
    err: "Confondre volume disponible et vitesse",
  },
  {
    name: "Bande passante",
    q: "Combien de données sont transférées par seconde ?",
    err: "Croire qu’une grande capacité assure un débit élevé",
  },
  {
    name: "Latence",
    q: "Quel délai avant d’obtenir la donnée ?",
    err: "Confondre délai individuel et débit total",
  },
];

const Memory: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = [cues.s(6), cues.s(8), cues.s(10)];
  const errs = [cues.s(7), cues.s(9), cues.s(11)];
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), 0);
  return (
    <AbsoluteFill>
      <Title text="Les trois dimensions de la mémoire" start={cues.s(5)} />
      <Svg>
        <Bucket cx={COLS[0]} start={starts[0]} />
        <Pipe cx={COLS[1]} start={starts[1]} />
        <Delay cx={COLS[2]} start={starts[2]} />
        {[0, 1].map((i) => (
          <DrawPath
            key={i}
            d={`M ${(COLS[i] + COLS[i + 1]) / 2} 290 V 820`}
            start={starts[i + 1] - 10}
            duration={0.8}
            stroke={COLORS.inkFaint}
            width={1}
          />
        ))}
      </Svg>
      {DIMS.map((d, i) => (
        <div
          key={d.name}
          style={{
            position: "absolute",
            left: COLS[i] - 240,
            top: 530,
            width: 480,
            textAlign: "center",
            opacity: i === current ? 1 : 0.55,
          }}
        >
          <FadeIn start={starts[i] + 6}>
            <div
              style={{
                ...textStyle(40, 300),
                color: i === current ? COLORS.accent : COLORS.ink,
              }}
            >
              {d.name}
            </div>
            <div
              style={{ ...textStyle(28, 300), marginTop: 14, lineHeight: 1.35 }}
            >
              {d.q}
            </div>
          </FadeIn>
          <FadeIn start={errs[i]} style={{ marginTop: 26 }}>
            <div style={label(COLORS.warm)}>ERREUR À ÉVITER</div>
            <div
              style={{
                ...textStyle(26, 300),
                color: COLORS.warm,
                marginTop: 8,
                lineHeight: 1.35,
              }}
            >
              {d.err}
            </div>
          </FadeIn>
        </div>
      ))}
    </AbsoluteFill>
  );
};

// Scène 19 — La puissance de calcul (FLOPS) et les trois dimensions de la mémoire.
export const S19: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(2)}>
        <Intro />
      </Stage>
      <Stage from={cues.s(2)} to={cues.s(5)}>
        <Flops />
      </Stage>
      <Stage from={cues.s(5)}>
        <Memory />
      </Stage>
    </AbsoluteFill>
  );
};
