import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";
import { Caps, Electron, Hole, wander } from "./S04";

// Dérive (champ) et diffusion (gradient de concentration), côte à côte.
const Mechanisms: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const tD = cues.beat(1);
  const tF = cues.beat(2);
  const L = { x: 170, y: 330, w: 740, h: 280 };
  const R = { x: 1010, y: 330, w: 740, h: 280 };
  const onD = progress(frame, tD + 20, 0.6);
  const onF = progress(frame, tF + 10, 0.6);
  // Diffusion : étalement progressif depuis le bord gauche.
  const spread = 0.14 + 0.86 * progress(frame, tF + 30, 5.5);
  const profile = new Array(60)
    .fill(0)
    .map((_, i) => {
      const u = i / 59;
      const n = 0.14 / spread / (1 + Math.exp((u - spread) / 0.035));
      return `${i === 0 ? "M" : "L"} ${R.x + u * R.w} ${800 - n * 130}`;
    })
    .join(" ");
  return (
    <AbsoluteFill>
      <Svg>
        <Caps
          x={960}
          y={240}
          text="deux mécanismes coexistent"
          start={cues.s(1)}
        />
        {/* Panneau dérive */}
        <DrawPath
          d={roundRectPath(L.x, L.y, L.w, L.h, 10)}
          start={tD}
          duration={0.8}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        <SvgText
          x={L.x + L.w / 2}
          y={295}
          text="Dérive"
          start={tD}
          size={34}
          weight={300}
        />
        <Arrow
          x1={L.x + 200}
          y1={L.y + 40}
          x2={L.x + 540}
          y2={L.y + 40}
          start={tD + 10}
          stroke={COLORS.ink}
          width={2.4}
        />
        <SvgText
          x={L.x + 570}
          y={L.y + 40}
          text="champ E"
          start={tD + 16}
          size={26}
          anchor="start"
        />
        {new Array(16).fill(0).map((_, i) => {
          const isHole = i % 2 === 0;
          const v = isHole ? 1.1 : -1.5;
          const span = L.w - 60;
          const base = random(`d${i}`) * span;
          const [dx, dy] = wander(`dw${i}`, frame, 14);
          let x = (base + (frame - tD) * v + dx) % span;
          if (x < 0) x += span;
          const y = L.y + 90 + random(`dy${i}`) * (L.h - 120) + dy;
          const edge = Math.min(1, x / 40, (span - x) / 40);
          const o = onD * Math.max(0, edge);
          return isHole ? (
            <Hole key={i} x={L.x + 30 + x} y={y} o={o} />
          ) : (
            <Electron key={i} x={L.x + 30 + x} y={y} o={o} />
          );
        })}
        {/* Panneau diffusion */}
        <DrawPath
          d={roundRectPath(R.x, R.y, R.w, R.h, 10)}
          start={tF}
          duration={0.8}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        <SvgText
          x={R.x + R.w / 2}
          y={295}
          text="Diffusion"
          start={tF}
          size={34}
          weight={300}
        />
        {new Array(40).fill(0).map((_, i) => {
          const u = random(`f${i}`);
          const [dx, dy] = wander(`fw${i}`, frame, 10);
          const x = R.x + 20 + u * spread * (R.w - 40) + dx * spread;
          const y = R.y + 25 + random(`fy${i}`) * (R.h - 50) + dy;
          return (
            <Electron
              key={i}
              x={Math.max(R.x + 12, Math.min(R.x + R.w - 12, x))}
              y={y}
              o={onF}
            />
          );
        })}
        {/* Profil de concentration */}
        <DrawPath
          d={`M ${R.x} 800 H ${R.x + R.w}`}
          start={tF + 20}
          duration={0.6}
          stroke={COLORS.inkFaint}
          width={1}
        />
        <path
          d={profile}
          fill="none"
          stroke={COLORS.accent}
          strokeWidth={2.4}
          opacity={progress(frame, tF + 30, 0.6)}
        />
        <SvgText
          x={R.x}
          y={645}
          text="concentration"
          start={tF + 30}
          size={22}
          color={COLORS.inkSoft}
          anchor="start"
        />
        <Arrow
          x1={R.x + 300}
          y1={700}
          x2={R.x + 520}
          y2={700}
          start={tF + 80}
          stroke={COLORS.accent}
        />
        <SvgText
          x={R.x + 540}
          y={700}
          text="se répartit"
          start={tF + 90}
          size={24}
          color={COLORS.accent}
          anchor="start"
        />
      </Svg>
      <FadeIn
        start={tD + 30}
        style={{ position: "absolute", left: L.x, top: 650, width: L.w }}
      >
        <div style={{ ...textStyle(28, 300), lineHeight: 1.4 }}>
          Un <span style={{ color: COLORS.accent }}>champ électrique</span>{" "}
          entraîne les porteurs :
          <br />
          <span style={{ color: COLORS.warm }}>trous</span> dans le sens du
          champ, <span style={{ color: COLORS.accent }}>électrons</span> en sens
          inverse.
        </div>
      </FadeIn>
      <FadeIn
        start={tF + 110}
        style={{ position: "absolute", left: R.x, top: 820, width: R.w }}
      >
        <div style={{ ...textStyle(26, 300), color: COLORS.inkSoft }}>
          d’une zone concentrée vers une zone moins concentrée
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// La mobilité : même champ, vitesses différentes ; relation v = μE en régime linéaire.
const Mobility: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.beat(3);
  const lanes = [
    { y: 440, v: 3.2, label: "mobilité élevée" },
    { y: 620, v: 1.2, label: "mobilité plus faible" },
  ];
  const on = progress(frame, t + 30, 0.5);
  // Graphique v(E)
  const gx = 1150;
  const gy = 740;
  const gw = 560;
  const gh = 400;
  const curve = new Array(50)
    .fill(0)
    .map((_, i) => {
      const e = i / 49;
      const v = e / (1 + (e / 0.6) ** 3) ** (1 / 3);
      return `${i === 0 ? "M" : "L"} ${gx + e * gw} ${gy - v * gh * 1.4}`;
    })
    .join(" ");
  return (
    <AbsoluteFill>
      <Title text="La mobilité" start={t} />
      <Svg>
        <Arrow
          x1={320}
          y1={320}
          x2={760}
          y2={320}
          start={t + 6}
          stroke={COLORS.ink}
          width={2.4}
        />
        <SvgText
          x={790}
          y={320}
          text="même champ E"
          start={t + 12}
          size={26}
          anchor="start"
        />
        {lanes.map((l, i) => {
          // Électrons : ils avancent en sens inverse du champ.
          const x = 980 - (((((frame - t - 30) * l.v) % 760) + 760) % 760);
          const edge = Math.min(1, (x - 220) / 40, (980 - x) / 40);
          return (
            <g key={l.label}>
              <DrawPath
                d={`M 220 ${l.y} H 980`}
                start={t + 14 + i * 6}
                duration={0.7}
                stroke={COLORS.inkFaint}
                width={1}
              />
              <Electron x={x} y={l.y} r={10} o={on * Math.max(0, edge)} />
              <SvgText
                x={220}
                y={l.y - 40}
                text={l.label}
                start={t + 30 + i * 10}
                size={26}
                color={i === 0 ? COLORS.accent : COLORS.warm}
                anchor="start"
              />
            </g>
          );
        })}
        {/* v en fonction de E */}
        <Arrow
          x1={gx}
          y1={gy}
          x2={gx}
          y2={gy - gh - 20}
          start={cues.s(4, 3)}
          stroke={COLORS.inkSoft}
        />
        <Arrow
          x1={gx}
          y1={gy}
          x2={gx + gw + 20}
          y2={gy}
          start={cues.s(4, 3)}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={gx - 16}
          y={gy - gh}
          text="vitesse"
          start={cues.s(4, 3.3)}
          size={24}
          color={COLORS.inkSoft}
          anchor="end"
        />
        <SvgText
          x={gx + gw}
          y={gy + 36}
          text="champ E"
          start={cues.s(4, 3.3)}
          size={24}
          color={COLORS.inkSoft}
          anchor="end"
        />
        <DrawPath
          d={curve}
          start={cues.s(4, 4)}
          duration={1.6}
          stroke={COLORS.inkSoft}
          width={2}
        />
        <DrawPath
          d={`M ${gx} ${gy} L ${gx + 0.36 * gw} ${gy - 0.36 * gh * 1.4}`}
          start={cues.s(4, 5)}
          duration={0.8}
          stroke={COLORS.accent}
          width={4}
        />
        <SvgText
          x={gx + 170}
          y={gy - 30}
          text={"régime approximativement\nlinéaire : v = μ · E"}
          start={cues.s(4, 5.6)}
          size={24}
          color={COLORS.accent}
          anchor="start"
        />
      </Svg>
      <FadeIn
        start={cues.s(4, 1)}
        style={{ position: "absolute", left: 220, top: 700, width: 800 }}
      >
        <div style={{ ...textStyle(28, 300), lineHeight: 1.4 }}>
          La <span style={{ color: COLORS.accent }}>mobilité μ</span> : la
          facilité avec laquelle un porteur se déplace sous un champ.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 8 — Dérive et diffusion.
export const S08: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(3)}>
        <Title
          text="Pourquoi les porteurs se déplacent-ils ?"
          start={cues.s(0)}
        />
        <Mechanisms />
      </Stage>
      <Stage from={cues.beat(3)}>
        <Mobility />
      </Stage>
    </AbsoluteFill>
  );
};
