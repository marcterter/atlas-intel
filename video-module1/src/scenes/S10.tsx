import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
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
import { Caps, Note } from "./S04";

// Géométrie d'une coupe de MOSFET planaire (pédagogique, non à l'échelle).
export const mosGeom = (cx: number, Y: number, k = 1) => ({
  cx,
  Y,
  bodyL: cx - 400 * k,
  bodyR: cx + 400 * k,
  bodyB: Y + 290 * k,
  srcL: cx - 370 * k,
  srcR: cx - 150 * k,
  drnL: cx + 150 * k,
  drnR: cx + 370 * k,
  wellD: 110 * k,
  oxL: cx - 170 * k,
  oxR: cx + 170 * k,
  oxH: 16 * k,
  gateL: cx - 160 * k,
  gateR: cx + 160 * k,
  gateT: Y - 110 * k,
  termY: Y - 180 * k,
  sX: cx - 260 * k,
  dX: cx + 260 * k,
});

const wellPath = (l: number, r: number, Y: number, d: number) =>
  `M ${l} ${Y} V ${Y + d - 24} Q ${l} ${Y + d} ${l + 24} ${Y + d} H ${r - 24} Q ${r} ${Y + d} ${r} ${Y + d - 24} V ${Y}`;

// Coupe de MOSFET : chaque élément apparaît à son instant (undefined = caché).
export const Mosfet: React.FC<{
  cx: number;
  Y: number;
  k?: number;
  body?: number;
  bodyHi?: number;
  sd?: number;
  oxide?: number;
  gate?: number;
  terminals?: number;
  labels?: number;
  bodyContact?: boolean;
}> = ({
  cx,
  Y,
  k = 1,
  body,
  bodyHi,
  sd,
  oxide,
  gate,
  terminals,
  labels,
  bodyContact = true,
}) => {
  const frame = useCurrentFrame();
  const g = mosGeom(cx, Y, k);
  const hi = bodyHi === undefined ? 0 : progress(frame, bodyHi, 0.8);
  const size = Math.max(22, 26 * k);
  return (
    <g>
      {body !== undefined && (
        <>
          <rect
            x={g.bodyL}
            y={Y}
            width={g.bodyR - g.bodyL}
            height={g.bodyB - Y}
            fill={COLORS.warm}
            opacity={0.03 + 0.07 * hi}
          />
          <DrawPath
            d={`M ${g.bodyL} ${Y} V ${g.bodyB} H ${g.bodyR} V ${Y} H ${g.bodyL}`}
            start={body}
            duration={1}
            stroke={hi > 0 ? COLORS.warm : COLORS.inkSoft}
            width={1.6}
          />
        </>
      )}
      {sd !== undefined && (
        <>
          <path
            d={wellPath(g.srcL, g.srcR, Y, g.wellD) + " Z"}
            fill={COLORS.accent}
            opacity={0.1 * progress(frame, sd + 10, 0.6)}
          />
          <path
            d={wellPath(g.drnL, g.drnR, Y, g.wellD) + " Z"}
            fill={COLORS.accent}
            opacity={0.1 * progress(frame, sd + 10, 0.6)}
          />
          <DrawPath
            d={`${wellPath(g.srcL, g.srcR, Y, g.wellD)} ${wellPath(g.drnL, g.drnR, Y, g.wellD)}`}
            start={sd}
            duration={0.9}
            stroke={COLORS.accent}
            width={1.8}
          />
        </>
      )}
      {oxide !== undefined && (
        <rect
          x={g.oxL}
          y={Y - g.oxH}
          width={g.oxR - g.oxL}
          height={g.oxH}
          fill={COLORS.warm}
          opacity={0.55 * progress(frame, oxide, 0.6)}
        />
      )}
      {gate !== undefined && (
        <>
          <rect
            x={g.gateL}
            y={g.gateT}
            width={g.gateR - g.gateL}
            height={Y - g.oxH - g.gateT}
            fill={COLORS.ink}
            opacity={0.08 * progress(frame, gate + 10, 0.6)}
          />
          <DrawPath
            d={roundRectPath(
              g.gateL,
              g.gateT,
              g.gateR - g.gateL,
              Y - g.oxH - g.gateT,
              4,
            )}
            start={gate}
            duration={0.8}
            stroke={COLORS.ink}
            width={2}
          />
        </>
      )}
      {terminals !== undefined && (
        <>
          <DrawPath
            d={`M ${g.sX} ${Y} V ${g.termY} M ${cx} ${g.gateT} V ${g.termY} M ${g.dX} ${Y} V ${g.termY}${bodyContact ? ` M ${cx} ${g.bodyB} V ${g.bodyB + 30 * k}` : ""}`}
            start={terminals}
            duration={0.7}
            stroke={COLORS.inkSoft}
            width={1.6}
          />
          {[
            [g.sX, "S"],
            [cx, "G"],
            [g.dX, "D"],
          ].map(([x, l]) => (
            <g key={l}>
              <circle
                cx={x as number}
                cy={g.termY}
                r={6}
                fill={COLORS.ink}
                opacity={progress(frame, terminals + 16, 0.4)}
              />
              <SvgText
                x={x as number}
                y={g.termY - 30}
                text={l as string}
                start={terminals + 16}
                size={size + 4}
                weight={400}
              />
            </g>
          ))}
          {bodyContact && (
            <SvgText
              x={cx + 30}
              y={g.bodyB + 20 * k}
              text="B"
              start={terminals + 16}
              size={size}
              weight={400}
              anchor="start"
            />
          )}
        </>
      )}
      {labels !== undefined && (
        <>
          <SvgText
            x={(g.srcL + g.srcR) / 2}
            y={Y + g.wellD / 2}
            text="n+"
            start={labels}
            size={size}
            color={COLORS.accent}
          />
          <SvgText
            x={(g.drnL + g.drnR) / 2}
            y={Y + g.wellD / 2}
            text="n+"
            start={labels}
            size={size}
            color={COLORS.accent}
          />
          <SvgText
            x={cx}
            y={g.bodyB - 36 * k}
            text="corps p"
            start={labels}
            size={size}
            color={COLORS.warm}
          />
        </>
      )}
    </g>
  );
};

const LETTERS = [
  { l: "M", en: "Metal", fr: "métal", x: 380, at: 1.6 },
  { l: "O", en: "Oxide", fr: "isolant", x: 620, at: 2.2 },
  { l: "S", en: "Semiconductor", fr: "semi-conducteur", x: 900, at: 2.8 },
  { l: "FE", en: "Field Effect", fr: "effet de champ", x: 1230, at: 3.8 },
  { l: "T", en: "Transistor", fr: "transistor", x: 1530, at: 4.8 },
];

// Le sigle MOSFET, et la structure qu'il décrit.
const Acronym: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const tFr = cues.s(1, 6);
  const tStack = cues.s(1, 7.8);
  const tOx = cues.beat(1);
  const oxHi = progress(frame, tOx, 0.6);
  return (
    <AbsoluteFill>
      {LETTERS.map((g, i) => {
        const hi = i === 1 ? oxHi : 0;
        return (
          <div
            key={g.l}
            style={{
              position: "absolute",
              left: g.x - 160,
              top: 250,
              width: 320,
              textAlign: "center",
            }}
          >
            <FadeIn start={cues.s(1, g.at)}>
              <div
                style={{
                  ...textStyle(100, 200),
                  color: hi > 0.5 ? COLORS.warm : COLORS.ink,
                }}
              >
                {g.l}
              </div>
              <div style={{ ...textStyle(30, 300), color: COLORS.inkSoft }}>
                {g.en}
              </div>
            </FadeIn>
            <FadeIn start={tFr + (i < 3 ? 60 : 0)}>
              <div
                style={{
                  ...textStyle(30, 400),
                  color: i === 1 ? COLORS.warm : COLORS.accent,
                  marginTop: 10,
                }}
              >
                {g.fr}
              </div>
            </FadeIn>
          </div>
        );
      })}
      {/* M-O-S : un empilement */}
      <Svg>
        <Caps
          x={520}
          y={580}
          text="la structure : un empilement"
          start={tStack}
        />
        <rect
          x={340}
          y={610}
          width={360}
          height={60}
          fill={COLORS.ink}
          opacity={0.1 * progress(frame, tStack, 0.6)}
        />
        <DrawPath
          d={roundRectPath(340, 610, 360, 60, 3)}
          start={tStack}
          duration={0.6}
          stroke={COLORS.ink}
        />
        <rect
          x={340}
          y={672}
          width={360}
          height={20}
          fill={COLORS.warm}
          opacity={(0.4 + 0.3 * oxHi) * progress(frame, tStack + 10, 0.6)}
        />
        <DrawPath
          d={roundRectPath(340, 694, 360, 110, 3)}
          start={tStack + 16}
          duration={0.6}
          stroke={COLORS.warm}
        />
        <SvgText
          x={720}
          y={640}
          text="métal (grille)"
          start={tStack + 4}
          size={24}
          anchor="start"
        />
        <SvgText
          x={720}
          y={682}
          text="isolant"
          start={tStack + 12}
          size={24}
          color={COLORS.warm}
          anchor="start"
        />
        <SvgText
          x={720}
          y={750}
          text="semi-conducteur"
          start={tStack + 20}
          size={24}
          color={COLORS.inkSoft}
          anchor="start"
        />
      </Svg>
      <Note
        kind="warn"
        x={1040}
        y={610}
        width={740}
        start={tOx + 10}
        size={28}
        label="LE MOT « OXIDE »"
      >
        Nom historique (oxyde de silicium). Il reste employé même quand
        l’empilement de grille utilise des matériaux avancés.
      </Note>
    </AbsoluteFill>
  );
};

const PARTS = [
  {
    name: "Grille (gate)",
    fn: "commande électriquement la formation et la conduction du canal",
    beat: 2,
  },
  {
    name: "Isolant de grille",
    fn: "sépare électriquement la grille du semi-conducteur, tout en transmettant l’effet du champ",
    beat: 3,
  },
  {
    name: "Source et drain",
    fn: "régions par lesquelles les porteurs entrent dans le canal, et en sortent",
    beat: 4,
  },
  {
    name: "Corps (body)",
    fn: "région semi-conductrice qui influence aussi le comportement",
    beat: 5,
  },
];

// La coupe du transistor, élément par élément, avec sa fonction.
const Anatomy: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const cx = 660;
  const Y = 520;
  const g = mosGeom(cx, Y);
  const tG = cues.beat(2);
  const tO = cues.beat(3);
  const tSD = cues.beat(4);
  const tB = cues.beat(5);
  const starts = PARTS.map((p) => cues.beat(p.beat));
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  return (
    <AbsoluteFill>
      <Svg>
        <Mosfet
          cx={cx}
          Y={Y}
          body={tG}
          bodyHi={tB}
          sd={tSD}
          oxide={tO}
          gate={tG + 10}
        />
        <SvgText
          x={cx}
          y={(g.gateT + Y) / 2 - 8}
          text="grille"
          start={tG + 20}
          size={26}
        />
        {/* Zone où se formera le canal */}
        <path
          d={`M ${g.srcR} ${Y + 8} H ${g.drnL}`}
          stroke={COLORS.accent}
          strokeWidth={2}
          strokeDasharray="8 8"
          opacity={progress(frame, tG + 40, 0.6)}
        />
        <SvgText
          x={cx}
          y={Y + 36}
          text="canal (à former)"
          start={tG + 46}
          size={22}
          color={COLORS.accent}
        />
        {/* Effet du champ transmis à travers l'isolant */}
        {[-90, -30, 30, 90].map((dx) => (
          <Arrow
            key={dx}
            x1={cx + dx}
            y1={Y - 44}
            x2={cx + dx}
            y2={Y + 2}
            start={tO + 30}
            duration={0.5}
            stroke={COLORS.warm}
            width={1.6}
          />
        ))}
        <DrawPath
          d={`M ${g.oxR + 4} ${Y - 8} L ${g.oxR + 60} ${Y - 60} H ${g.oxR + 90}`}
          start={tO + 10}
          duration={0.5}
          stroke={COLORS.warm}
          width={1.2}
        />
        <SvgText
          x={g.oxR + 96}
          y={Y - 60}
          text="isolant"
          start={tO + 16}
          size={24}
          color={COLORS.warm}
          anchor="start"
        />
        {/* Source et drain */}
        <SvgText
          x={(g.srcL + g.srcR) / 2}
          y={Y + 55}
          text="source"
          start={tSD + 20}
          size={26}
          color={COLORS.accent}
        />
        <SvgText
          x={(g.drnL + g.drnR) / 2}
          y={Y + 55}
          text="drain"
          start={tSD + 20}
          size={26}
          color={COLORS.accent}
        />
        <Arrow
          x1={(g.srcL + g.srcR) / 2 + 20}
          y1={Y + 85}
          x2={g.srcR + 10}
          y2={Y + 22}
          start={tSD + 40}
          stroke={COLORS.inkSoft}
        />
        <Arrow
          x1={g.drnL - 10}
          y1={Y + 22}
          x2={(g.drnL + g.drnR) / 2 - 20}
          y2={Y + 85}
          start={tSD + 60}
          stroke={COLORS.inkSoft}
        />
        <SvgText
          x={(g.srcL + g.srcR) / 2}
          y={Y + 150}
          text="les porteurs entrent"
          start={tSD + 50}
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={(g.drnL + g.drnR) / 2}
          y={Y + 150}
          text="et sortent"
          start={tSD + 70}
          size={22}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={cx}
          y={g.bodyB - 40}
          text="corps"
          start={tB + 10}
          size={26}
          color={COLORS.warm}
        />
      </Svg>
      <div style={{ position: "absolute", left: 1170, top: 250, width: 610 }}>
        {PARTS.map((p, i) => {
          const o = progress(frame, starts[i], 0.6);
          const active = i === current;
          return (
            <div
              key={p.name}
              style={{
                marginBottom: 30,
                opacity: o * (active ? 1 : 0.45),
                transform: `translateX(${(1 - o) * 16}px)`,
              }}
            >
              <div
                style={{
                  ...textStyle(24, 500),
                  color: i === 1 || i === 3 ? COLORS.warm : COLORS.accent,
                  letterSpacing: "0.16em",
                }}
              >
                {p.name.toUpperCase()}
              </div>
              <div
                style={{ ...textStyle(27, 300), lineHeight: 1.3, marginTop: 6 }}
              >
                {p.fn}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Scène 10 — Anatomie d'un MOSFET.
export const S10: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(2)}>
        <Title
          kicker="Le transistor MOSFET"
          text="Un interrupteur commandé"
          start={cues.s(0)}
        />
        <Acronym />
      </Stage>
      <Stage from={cues.beat(2)}>
        <Title text="Anatomie d’un MOSFET" start={cues.beat(2)} />
        <Anatomy />
      </Stage>
    </AbsoluteFill>
  );
};
