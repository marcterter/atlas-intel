import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { circlePath, icons, roundRectPath } from "../components/icons";
import { Link, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";

const accentA = (a: number) => `rgba(143, 208, 255, ${a})`;
const warmA = (a: number) => `rgba(255, 211, 138, ${a})`;

// Grille de dies inscrite dans un disque.
const dieGrid = (cx: number, cy: number, r: number, n: number) => {
  const cell = (2 * r) / n;
  const out: { x: number; y: number; s: number }[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = cx - r + j * cell;
      const y = cy - r + i * cell;
      const far = [
        [x, y],
        [x + cell, y],
        [x, y + cell],
        [x + cell, y + cell],
      ].some(([px, py]) => Math.hypot(px - cx, py - cy) > r - 4);
      if (!far) out.push({ x, y, s: cell });
    }
  }
  return out;
};

// --- 1. Trois supports ---------------------------------------------------
const SUPPORTS = [
  { name: "Wafer", role: "sert à fabriquer les puces" },
  { name: "Substrat de boîtier", role: "supporte et connecte le package" },
  { name: "PCB", role: "relie des composants à l’échelle d’une carte" },
];
const XS = [420, 960, 1500];
const Supports: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const st = [cues.s(1), cues.s(2), cues.s(3)];
  const current = st.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  const cy = 440;
  const wafer = dieGrid(XS[0], cy, 130, 8);
  return (
    <AbsoluteFill>
      <Title
        kicker="À ne pas confondre"
        text="Trois supports différents"
        start={cues.s(0)}
      />
      <Svg>
        {/* Wafer */}
        <DrawPath d={circlePath(XS[0], cy, 140)} start={st[0]} duration={0.9} />
        {wafer.map((d, i) => (
          <path
            key={i}
            d={roundRectPath(d.x + 2, d.y + 2, d.s - 4, d.s - 4, 2)}
            fill={accentA(0.12)}
            stroke={COLORS.accent}
            strokeWidth={1}
            opacity={progress(frame, st[0] + 10 + i * 0.5, 0.3)}
          />
        ))}
        {/* Substrat de boîtier : coupe d'un package */}
        <path
          d={roundRectPath(XS[1] - 60, cy - 70, 120, 40, 5)}
          fill={accentA(0.1)}
          opacity={progress(frame, st[1], 0.4)}
        />
        <DrawPath
          d={roundRectPath(XS[1] - 60, cy - 70, 120, 40, 5)}
          start={st[1]}
          duration={0.5}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={XS[1]}
          y={cy - 50}
          text="die"
          start={st[1] + 6}
          size={22}
          color={COLORS.inkSoft}
        />
        {new Array(7).fill(0).map((_, i) => (
          <circle
            key={i}
            cx={XS[1] - 48 + i * 16}
            cy={cy - 22}
            r={4}
            fill={COLORS.warm}
            opacity={progress(frame, st[1] + 8 + i, 0.3)}
          />
        ))}
        <path
          d={roundRectPath(XS[1] - 150, cy - 14, 300, 56, 6)}
          fill={accentA(0.18)}
          opacity={progress(frame, st[1] + 14, 0.5)}
        />
        <DrawPath
          d={roundRectPath(XS[1] - 150, cy - 14, 300, 56, 6)}
          start={st[1] + 10}
          duration={0.7}
          stroke={COLORS.accent}
        />
        {new Array(8).fill(0).map((_, i) => (
          <circle
            key={i}
            cx={XS[1] - 126 + i * 36}
            cy={cy + 56}
            r={9}
            fill="none"
            stroke={COLORS.warm}
            strokeWidth={1.4}
            opacity={progress(frame, st[1] + 20 + i, 0.3)}
          />
        ))}
        {/* PCB : carte avec composants et pistes */}
        <path
          d={roundRectPath(XS[2] - 200, cy - 110, 400, 240, 10)}
          fill={accentA(0.1)}
          opacity={progress(frame, st[2] + 10, 0.5)}
        />
        <DrawPath
          d={roundRectPath(XS[2] - 200, cy - 110, 400, 240, 10)}
          start={st[2]}
          duration={0.8}
          stroke={COLORS.accent}
        />
        {[
          [-150, -70, 110, 110],
          [0, -70, 70, 50],
          [100, -70, 60, 50],
          [0, 20, 160, 60],
          [-150, 60, 90, 40],
        ].map(([dx, dy, w, h], i) => (
          <DrawPath
            key={i}
            d={roundRectPath(XS[2] + dx, cy + dy, w, h, 4)}
            start={st[2] + 12 + i * 4}
            duration={0.4}
            stroke={COLORS.ink}
            width={1.4}
          />
        ))}
        <DrawPath
          d={`M ${XS[2] - 40} ${cy - 15} H ${XS[2]} M ${XS[2] + 70} ${cy - 45} H ${XS[2] + 100} M ${XS[2] - 60} ${cy + 80} H ${XS[2]} M ${XS[2] + 35} ${cy - 20} V ${cy + 20}`}
          start={st[2] + 34}
          duration={0.6}
          stroke={COLORS.warm}
          width={1.6}
        />
      </Svg>
      {SUPPORTS.map((s, i) => (
        <div
          key={s.name}
          style={{
            position: "absolute",
            top: 640,
            left: XS[i] - 250,
            width: 500,
            textAlign: "center",
            opacity:
              progress(frame, st[i] + 6, 0.5) *
              (current === i || current === -1 ? 1 : 0.55),
          }}
        >
          <div style={{ ...textStyle(40, 200), color: COLORS.ink }}>
            {s.name}
          </div>
          <div
            style={{
              ...textStyle(28, 300),
              color: COLORS.accent,
              marginTop: 12,
              lineHeight: 1.3,
            }}
          >
            {s.role}
          </div>
        </div>
      ))}
    </AbsoluteFill>
  );
};

// --- 2. Piège : « substrate » ---------------------------------------------
const Trap: React.FC = () => {
  const cues = useCues();
  const t = cues.s(4);
  return (
    <AbsoluteFill>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 170,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.warm,
            letterSpacing: "0.3em",
          }}
        >
          PIÈGE DE VOCABULAIRE
        </div>
        <div style={{ ...textStyle(84, 200), marginTop: 26 }}>
          « substrate »
        </div>
      </FadeIn>
      <Svg>
        <Link from={[900, 420]} to={[560, 540]} start={cues.s(4, 2.4)} />
        <Link from={[1020, 420]} to={[1360, 540]} start={cues.s(4, 3.4)} />
        <DrawPath
          d={icons.wafer(560, 600, 44)}
          start={cues.s(4, 3.2)}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={560}
          y={690}
          text="support de fabrication"
          start={cues.s(4, 3.4)}
          size={30}
        />
        <DrawPath
          d={`${roundRectPath(1300, 575, 120, 34, 4)} ${roundRectPath(1320, 555, 80, 20, 3)}`}
          start={cues.s(4, 3.6)}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={1360}
          y={690}
          text="substrat de boîtier"
          start={cues.s(4, 3.8)}
          size={30}
        />
      </Svg>
      <FadeIn
        start={cues.s(5)}
        style={{
          position: "absolute",
          top: 770,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(36, 300) }}>
          Demande toujours :{" "}
          <span style={{ color: COLORS.warm }}>
            de quel substrat s’agit-il ?
          </span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// --- 3. La boucle de fabrication -------------------------------------------
const STEPS = ["Dépôt", "Lithographie", "Gravure", "Nettoyage", "Contrôles"];
const LCX = 960;
const LCY = 530;
const LR = 250;
const nodePos = (i: number) => {
  const a = ((-90 + i * 72) * Math.PI) / 180;
  return { x: LCX + LR * Math.cos(a), y: LCY + LR * Math.sin(a) };
};
const Loop: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(7);
  const named = [3.3, 5.4, 7.0, 7.8, 8.6].map((d) => cues.s(7, d));
  const loopStart = cues.s(7, 9.4);
  const stepDur = 0.8 * FPS;
  // Étape active : d'abord au rythme de la voix, puis la boucle tourne seule.
  let step = named.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  let cycle = 0;
  if (frame >= loopStart) {
    const k = Math.floor((frame - loopStart) / stepDur);
    step = k % 5;
    cycle = 1 + Math.floor(k / 5);
  }
  const central = progress(frame, cues.s(8), 0.6);
  // Coupe du wafer : une couche par tour de boucle.
  const layers = Math.min(4, cycle + (step >= 0 ? 1 : 0));
  const lx = 880;
  const lw = 160;
  const baseY = 590;
  return (
    <AbsoluteFill>
      <Title text="Comment les circuits sont construits" start={cues.s(6)} />
      <Svg>
        {/* Coupe du wafer */}
        <DrawPath
          d={roundRectPath(lx, baseY, lw, 40, 4)}
          start={t}
          duration={0.6}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={LCX}
          y={baseY + 66}
          text="wafer"
          start={t + 8}
          size={22}
          color={COLORS.inkSoft}
        />
        {new Array(layers).fill(0).map((_, L) => {
          const y = baseY - (L + 1) * 26;
          const isCur = L === layers - 1 && cycle === L;
          const phase = isCur ? step : 5;
          const patterned = phase >= 2;
          const o = progress(
            frame,
            L === 0 ? named[0] : loopStart + (L - 1) * 5 * stepDur,
            0.4,
          );
          return (
            <g key={L} opacity={o}>
              {patterned ? (
                [0, 1, 2, 3].map((b) => (
                  <rect
                    key={b}
                    x={lx + 6 + b * 40}
                    y={y}
                    width={28}
                    height={22}
                    rx={2}
                    fill={L % 2 ? accentA(0.35) : "rgba(232, 240, 255, 0.28)"}
                  />
                ))
              ) : (
                <rect
                  x={lx}
                  y={y}
                  width={lw}
                  height={22}
                  rx={2}
                  fill={L % 2 ? accentA(0.35) : "rgba(232, 240, 255, 0.28)"}
                />
              )}
              {isCur && phase === 1 && (
                <g stroke={COLORS.accent} strokeWidth={1.4}>
                  {[0, 1, 2, 3].map((b) => (
                    <path
                      key={b}
                      d={`M ${lx + 20 + b * 40} ${y - 60} V ${y - 4}`}
                    />
                  ))}
                </g>
              )}
            </g>
          );
        })}
        {/* Anneau de la boucle */}
        <DrawPath
          d={circlePath(LCX, LCY, LR)}
          start={named[0] - 10}
          duration={2.4}
          stroke={COLORS.inkFaint}
          width={1.6}
        />
        {step >= 0 &&
          (() => {
            const p =
              frame >= loopStart
                ? ((frame - loopStart) % stepDur) / stepDur
                : 0;
            const a = ((-90 + (step + p) * 72) * Math.PI) / 180;
            return (
              <circle
                cx={LCX + LR * Math.cos(a)}
                cy={LCY + LR * Math.sin(a)}
                r={7}
                fill={COLORS.accent}
                opacity={interpolate(p, [0, 0.25, 0.75, 1], [0, 1, 1, 0])}
              />
            );
          })()}
        {STEPS.map((s, i) => {
          const { x, y } = nodePos(i);
          const on = i === step;
          const litho = i === 1 && central > 0;
          const w = 230;
          const h = 62;
          return (
            <g key={s}>
              <path
                d={roundRectPath(x - w / 2, y - h / 2, w, h, h / 2)}
                fill={
                  litho
                    ? accentA(0.12 + 0.12 * central)
                    : on
                      ? accentA(0.14)
                      : "#08142f"
                }
                opacity={progress(frame, named[i], 0.4)}
              />
              <DrawPath
                d={roundRectPath(x - w / 2, y - h / 2, w, h, h / 2)}
                start={named[i]}
                duration={0.6}
                stroke={on || litho ? COLORS.accent : COLORS.inkSoft}
                width={litho ? 2.6 : 1.8}
              />
              <SvgText
                x={x}
                y={y}
                text={s}
                start={named[i] + 4}
                size={28}
                weight={on || litho ? 400 : 300}
              />
            </g>
          );
        })}
      </Svg>
      <FadeIn
        start={cues.s(8, 0.4)}
        style={{
          position: "absolute",
          top: 810,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300) }}>
          La <span style={{ color: COLORS.accent }}>lithographie</span> : étape
          centrale parmi plusieurs procédés interdépendants
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(9)}
        style={{ position: "absolute", top: 560, right: 150 }}
      >
        <div
          style={{
            ...textStyle(22, 400),
            color: COLORS.inkSoft,
            letterSpacing: "0.2em",
          }}
        >
          SOURCE 1 · ASML
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// --- 4. Yield : dies bons et mauvais sur un wafer ---------------------------
const Yield: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(10);
  const cx = 560;
  const cy = 510;
  const r = 280;
  const dies = dieGrid(cx, cy, r, 12);
  const inspect = t + 30;
  const drop = progress(frame, cues.s(11, 0.6), 2.5);
  const threshold = interpolate(drop, [0, 1], [0.82, 0.3]);
  let checked = 0;
  let good = 0;
  const els = dies.map((d, i) => {
    const seen = frame >= inspect + i * 0.8;
    const ok = random(`y${i}`) < threshold;
    if (seen) {
      checked++;
      if (ok) good++;
    }
    const x = d.x + 3;
    const y = d.y + 3;
    const s = d.s - 6;
    return (
      <g key={i}>
        <path
          d={roundRectPath(x, y, s, s, 3)}
          fill={seen ? (ok ? accentA(0.35) : warmA(0.15)) : accentA(0.08)}
          stroke={seen ? (ok ? COLORS.accent : COLORS.warm) : COLORS.inkFaint}
          strokeWidth={1.2}
          opacity={progress(frame, t + i * 0.3, 0.3)}
        />
        {seen && !ok && (
          <path
            d={icons.cross(x + s / 2, y + s / 2, s * 0.35)}
            stroke={COLORS.warm}
            strokeWidth={1.4}
          />
        )}
      </g>
    );
  });
  const pct = checked ? Math.round((good / checked) * 100) : 0;
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath d={circlePath(cx, cy, r + 14)} start={t} duration={1} />
        {els}
      </Svg>
      <div style={{ position: "absolute", top: 230, left: 1000, width: 780 }}>
        <FadeIn start={t}>
          <div style={textStyle(64, 200)}>
            Yield{" "}
            <span style={{ ...textStyle(34, 300), color: COLORS.inkSoft }}>
              · rendement de fabrication
            </span>
          </div>
        </FadeIn>
        <FadeIn start={t + 20} style={{ marginTop: 22 }}>
          <div style={{ ...textStyle(30, 300), lineHeight: 1.4 }}>
            Part des unités satisfaisant les critères requis
          </div>
        </FadeIn>
        <FadeIn start={inspect} style={{ marginTop: 40 }}>
          <div
            style={{
              ...textStyle(120, 200),
              color: drop > 0.5 ? COLORS.warm : COLORS.accent,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {pct} %
          </div>
          <div
            style={{
              ...textStyle(24, 400),
              color: COLORS.inkSoft,
              letterSpacing: "0.12em",
            }}
          >
            {good} BONNES PUCES SUR {checked} CONTRÔLÉES
          </div>
        </FadeIn>
        <FadeIn start={cues.s(11, 0.4)} style={{ marginTop: 36 }}>
          <div
            style={{
              ...textStyle(30, 300),
              lineHeight: 1.4,
              color: COLORS.warm,
            }}
          >
            Capacité brute importante, rendement faible : peu de produits
            vendables
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// Scène 12 — Trois supports, piège « substrate », boucle de fabrication, yield.
export const S12: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(4)}>
        <Supports />
      </Stage>
      <Stage from={cues.s(4)} to={cues.s(6)}>
        <Trap />
      </Stage>
      <Stage from={cues.s(6)} to={cues.s(10)}>
        <Loop />
      </Stage>
      <Stage from={cues.s(10)}>
        <Yield />
      </Stage>
    </AbsoluteFill>
  );
};
