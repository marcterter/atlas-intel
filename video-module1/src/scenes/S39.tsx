import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { circlePath, icons, roundRectPath } from "../components/icons";
import { Icon, Link, Svg, SvgText, Title } from "../components/kit";
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
import { Pos, small } from "./S33";

// Chaîne d'étapes (boîtes reliées) utilisée dans les deux tableaux.
const BW = 160;
const BH = 90;
const GAP = 44;

// A — Un outil isolé contre le même outil inséré dans le procédé complet.
const Isolated: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t0 = cues.s(0, 0.6);
  const t1 = cues.s(1);
  const chainAt = t1 + FPS * 4.2;
  const othersAt = t1 + FPS * 6;
  const flowAt = t1 + FPS * 6.8;
  const reproAt = t1 + FPS * 8.3;
  const steps = ["dépôt", "lithographie", "OUTIL", "gravure", "inspection"];
  const x0 = 760;
  const y = 380;
  const xs = steps.map((_, i) => x0 + i * (BW + GAP));
  const endX = xs[4] + BW;
  const flow = frame - flowAt;
  return (
    <AbsoluteFill>
      {/* Panneau gauche : outil isolé */}
      <Pos start={t0} left={160} top={250} width={460} align="center">
        <div style={small()}>OUTIL ISOLÉ</div>
      </Pos>
      <Svg>
        <DrawPath
          d={roundRectPath(300, 330, 180, 140, 14)}
          start={t0}
          duration={0.8}
          stroke={COLORS.accent}
          width={2}
        />
        <Icon
          name="gear"
          x={390}
          y={400}
          size={40}
          start={t0 + 10}
          color={COLORS.accent}
        />
        <DrawPath
          d={icons.check(300, 530, 14)}
          start={t1 + 10}
          duration={0.5}
          stroke={COLORS.accent}
          width={2.4}
        />
        {/* Séparateur */}
        <DrawPath
          d="M 680 250 V 720"
          start={chainAt - 10}
          duration={0.8}
          stroke={COLORS.inkFaint}
          width={1}
        />
      </Svg>
      <Pos start={t1 + 10} left={330} top={512} width={320}>
        <div style={textStyle(28, 300)}>performance nominale</div>
      </Pos>
      <Pos start={t1 + FPS * 2} left={160} top={600} width={460} align="center">
        <div style={{ ...textStyle(30, 300), color: COLORS.warm }}>
          … ne suffit pas
        </div>
      </Pos>
      {/* Panneau droit : dans le procédé complet */}
      <Pos start={chainAt} left={x0} top={250} width={endX - x0} align="center">
        <div style={small(COLORS.accent)}>DANS LE PROCÉDÉ COMPLET</div>
      </Pos>
      <Svg>
        {steps.map((s, i) => {
          const tool = s === "OUTIL";
          const at = tool ? chainAt : othersAt + i * 5;
          return (
            <g key={s}>
              <path
                d={roundRectPath(xs[i], y, BW, BH, 12)}
                fill={tool ? COLORS.accent : "#ffffff"}
                fillOpacity={
                  (tool ? 0.12 : 0.04) * progress(frame, at + 8, 0.5)
                }
              />
              <DrawPath
                d={roundRectPath(xs[i], y, BW, BH, 12)}
                start={at}
                duration={0.6}
                stroke={tool ? COLORS.accent : COLORS.inkSoft}
                width={tool ? 2 : 1.4}
              />
              {tool ? (
                <Icon
                  name="gear"
                  x={xs[i] + BW / 2}
                  y={y + BH / 2}
                  size={26}
                  start={at + 6}
                  color={COLORS.accent}
                />
              ) : (
                <SvgText
                  x={xs[i] + BW / 2}
                  y={y + BH / 2}
                  text={s}
                  start={at + 6}
                  size={24}
                />
              )}
              {i < steps.length - 1 && (
                <Link
                  from={[xs[i] + BW, y + BH / 2]}
                  to={[xs[i + 1], y + BH / 2]}
                  start={othersAt + 10 + i * 4}
                  gap={4}
                />
              )}
            </g>
          );
        })}
        {/* Wafers qui traversent la chaîne. */}
        {flow > 0 &&
          new Array(7).fill(0).map((_, k) => {
            const len = endX - x0 + 80;
            const pos = (flow * 3.2 + k * (len / 7)) % len;
            const x = x0 - 40 + pos;
            const edge = Math.min(1, pos / 60, (len - pos) / 60);
            return (
              <path
                key={k}
                d={circlePath(x, y + BH + 40, 9)}
                fill="none"
                stroke={COLORS.accent}
                strokeWidth={1.6}
                opacity={Math.max(0, edge) * progress(frame, flowAt, 0.6)}
              />
            );
          })}
        {/* Sortie : une qualité reproductible. */}
        {new Array(6).fill(0).map((_, k) => {
          const cx = x0 + 140 + k * 140;
          const at = reproAt + k * 4;
          return (
            <g key={k}>
              <DrawPath
                d={circlePath(cx, 610, 26)}
                start={at}
                duration={0.5}
                stroke={COLORS.ink}
                width={1.4}
              />
              <DrawPath
                d={icons.check(cx, 610, 12)}
                start={at + 6}
                duration={0.4}
                stroke={COLORS.accent}
                width={2}
              />
            </g>
          );
        })}
      </Svg>
      <Pos
        start={othersAt + 20}
        left={x0}
        top={306}
        width={endX - x0}
        align="center"
      >
        <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
          avec les autres étapes
        </div>
      </Pos>
      <Pos
        start={reproAt + 10}
        left={x0}
        top={660}
        width={endX - x0}
        align="center"
      >
        <div style={textStyle(30, 300)}>
          une qualité{" "}
          <span style={{ color: COLORS.accent }}>reproductible</span>
        </div>
      </Pos>
    </AbsoluteFill>
  );
};

const CHECKS = [
  { label: "reproductibilité", at: 4.3 },
  { label: "productivité", at: 5.3 },
  { label: "intégration", at: 6.2 },
  { label: "maintenance", at: 7.1 },
  { label: "coût global", at: 8.1 },
];

// B — Mur des coûts d'échec et de requalification, et les cinq preuves du challenger.
const Wall: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t2 = cues.s(2);
  const t3 = cues.s(3);
  const wx = 860;
  const ww = 220;
  const rows = 8;
  const bh = 56;
  const wy = 720 - rows * bh;
  return (
    <AbsoluteFill>
      {/* Challenger */}
      <Svg>
        <path
          d={roundRectPath(340, 250, 160, 120, 14)}
          fill="none"
          stroke={COLORS.accent}
          strokeWidth={1.6}
          strokeDasharray="7 7"
          opacity={progress(frame, t2, 0.6)}
        />
        <Icon
          name="gear"
          x={420}
          y={310}
          size={32}
          start={t2 + 6}
          color={COLORS.accent}
        />
      </Svg>
      <Svg>
        <Link
          from={[510, 310]}
          to={[850, 310]}
          start={t2 + FPS * 1.2}
          color={COLORS.accent}
        />
      </Svg>
      <Pos start={t2} left={190} top={384} width={460} align="center">
        <div style={small(COLORS.accent)}>CHALLENGER</div>
      </Pos>
      {/* Mur */}
      {new Array(rows).fill(0).map((_, r) => {
        const off = r % 2 === 0 ? 0 : ww / 4;
        const at = t2 + FPS * 0.6 + r * 5;
        const o = progress(frame, at, 0.4);
        if (o === 0) return null;
        const y = 720 - (r + 1) * bh;
        const cuts = [0, ww / 2 - off, ww - off, ww].filter(
          (c, i, arr) => c >= 0 && c <= ww && (i === 0 || c > arr[i - 1]),
        );
        return (
          <Svg key={r}>
            <g opacity={o} transform={`translate(0 ${(1 - o) * -20})`}>
              {cuts.slice(0, -1).map((c, i) => (
                <path
                  key={i}
                  d={roundRectPath(
                    wx + c + 2,
                    y + 2,
                    cuts[i + 1] - c - 4,
                    bh - 4,
                    4,
                  )}
                  fill={COLORS.warm}
                  fillOpacity={0.1}
                  stroke={COLORS.warm}
                  strokeWidth={1.2}
                />
              ))}
            </g>
          </Svg>
        );
      })}
      <Svg>
        <path
          d={roundRectPath(wx - 20, wy + bh * 2 + 8, ww + 40, 60, 8)}
          fill={COLORS.nightTop}
          opacity={0.85 * progress(frame, t2 + FPS * 2.2, 0.5)}
        />
        <path
          d={roundRectPath(wx - 20, wy + bh * 5 + 8, ww + 40, 60, 8)}
          fill={COLORS.nightTop}
          opacity={0.85 * progress(frame, t2 + FPS * 3.2, 0.5)}
        />
        <SvgText
          x={wx + ww / 2}
          y={wy + bh * 2 + 38}
          text="coûts d’échec"
          start={t2 + FPS * 2.2}
          size={26}
          color={COLORS.warm}
        />
        <SvgText
          x={wx + ww / 2}
          y={wy + bh * 5 + 38}
          text="requalification"
          start={t2 + FPS * 3.2}
          size={26}
          color={COLORS.warm}
        />
      </Svg>
      <Pos
        start={t2 + FPS * 4}
        left={wx - 150}
        top={wy - 50}
        width={ww + 300}
        align="center"
      >
        <div style={small(COLORS.warm)}>BARRIÈRE À L’ENTRÉE</div>
      </Pos>
      {/* Procédé qualifié du client */}
      <Svg>
        <DrawPath
          d={roundRectPath(1200, 380, 520, 170, 16)}
          start={t2 + 10}
          duration={0.9}
          stroke={COLORS.ink}
          width={1.6}
        />
        {[0, 1, 2, 3].map((i) => (
          <g key={i}>
            <DrawPath
              d={roundRectPath(1240 + i * 118, 425, 80, 56, 8)}
              start={t2 + 18 + i * 4}
              duration={0.5}
              stroke={COLORS.inkSoft}
              width={1.2}
            />
            {i < 3 && (
              <Link
                from={[1320 + i * 118, 453]}
                to={[1358 + i * 118, 453]}
                start={t2 + 26 + i * 4}
                gap={2}
              />
            )}
          </g>
        ))}
      </Svg>
      <Pos start={t2 + 20} left={1200} top={500} width={520} align="center">
        <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
          procédé qualifié du client
        </div>
      </Pos>
      {/* Ce que le challenger doit prouver */}
      <Pos start={t3} left={160} top={450} width={620}>
        <div style={textStyle(26, 300)}>
          plus qu’une{" "}
          <span
            style={{ color: COLORS.inkSoft, textDecoration: "line-through" }}
          >
            bonne démonstration
          </span>{" "}
          :
        </div>
      </Pos>
      {CHECKS.map((c, i) => {
        const at = t3 + FPS * c.at;
        const y = 510 + i * 60;
        return (
          <React.Fragment key={c.label}>
            <Svg>
              <DrawPath
                d={roundRectPath(200, y, 34, 34, 6)}
                start={at - 6}
                duration={0.4}
                stroke={COLORS.inkSoft}
                width={1.4}
              />
              <DrawPath
                d={icons.check(217, y + 17, 11)}
                start={at + 4}
                duration={0.4}
                stroke={COLORS.accent}
                width={2.4}
              />
            </Svg>
            <Pos start={at} left={256} top={y - 2} width={500}>
              <div style={textStyle(30, 300)}>{c.label}</div>
            </Pos>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

// C — Un acteur installé dont l'étape devient moins nécessaire.
const Bypass: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(4);
  const archAt = t + FPS * 3.2;
  const fade = progress(frame, archAt + FPS * 0.8, 1);
  const steps = [
    "étape 1",
    "étape 2",
    "étape de\nl’acteur installé",
    "étape 4",
    "étape 5",
  ];
  const w = 220;
  const gap = 70;
  const x0 = (1920 - (5 * w + 4 * gap)) / 2;
  const y = 470;
  const h = 110;
  const xs = steps.map((_, i) => x0 + i * (w + gap));
  const inst = 2;
  const stroke = interpolate(fade, [0, 1], [1, 0.4]);
  return (
    <AbsoluteFill>
      <Pos start={t} left={0} top={250} width={1920} align="center">
        <div style={small(COLORS.warm)}>À L’INVERSE</div>
      </Pos>
      <Svg>
        {steps.map((s, i) => {
          const isInst = i === inst;
          const at = t + 6 + i * 5;
          return (
            <g key={s} opacity={isInst ? stroke : 1}>
              <path
                d={roundRectPath(xs[i], y, w, h, 12)}
                fill={isInst ? COLORS.accent : "#ffffff"}
                fillOpacity={
                  (isInst ? 0.12 : 0.04) * progress(frame, at + 8, 0.5)
                }
                stroke="none"
              />
              <DrawPath
                d={roundRectPath(xs[i], y, w, h, 12)}
                start={at}
                duration={0.6}
                stroke={isInst ? COLORS.accent : COLORS.inkSoft}
                width={isInst ? 2 : 1.4}
              />
              <SvgText
                x={xs[i] + w / 2}
                y={y + h / 2}
                text={s}
                start={at + 6}
                size={isInst ? 24 : 26}
                weight={isInst ? 400 : 300}
                color={isInst ? COLORS.accent : COLORS.ink}
              />
              {i < steps.length - 1 && (
                <Link
                  from={[xs[i] + w, y + h / 2]}
                  to={[xs[i + 1], y + h / 2]}
                  start={at + 10}
                  gap={6}
                />
              )}
            </g>
          );
        })}
        {/* Nouvelle architecture : le flux contourne l'étape. */}
        <DrawPath
          d={`M ${xs[1] + w / 2} ${y} C ${xs[1] + w / 2} ${y - 150} ${xs[3] + w / 2} ${y - 150} ${xs[3] + w / 2} ${y - 6}`}
          start={archAt}
          duration={1.2}
          stroke={COLORS.accent}
          width={2.4}
        />
        <Arrow
          x1={xs[3] + w / 2}
          y1={y - 30}
          x2={xs[3] + w / 2}
          y2={y - 6}
          start={archAt + FPS * 1}
          duration={0.2}
          stroke={COLORS.accent}
          width={2.4}
        />
        <SvgText
          x={xs[2] + w / 2}
          y={y - 150}
          text="nouvelle architecture"
          start={archAt}
          size={28}
          weight={300}
          color={COLORS.accent}
        />
      </Svg>
      <FadeIn
        start={archAt + FPS * 1.6}
        style={{
          position: "absolute",
          top: y + h + 50,
          left: xs[2] - 200,
          width: w + 400,
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300), color: COLORS.warm }}>
          besoin de l’étape réduit → l’acteur installé peut perdre de la valeur
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 39 — Le client achète une fonction et une fiabilité.
export const S39: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Title
        text="Le client achète une fonction et une fiabilité"
        start={cues.s(0)}
        top={105}
      />
      <Stage from={0} to={cues.s(2)}>
        <Isolated />
      </Stage>
      <Stage from={cues.s(2)} to={cues.s(4)}>
        <Wall />
      </Stage>
      <Stage from={cues.s(4)}>
        <Bypass />
      </Stage>
    </AbsoluteFill>
  );
};
