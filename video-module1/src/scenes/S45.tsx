import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { circlePath, roundRectPath } from "../components/icons";
import { SAFE, Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT, FPS } from "../theme";

// ——— Glossaire en fiches (partagé avec S46) ———

export type GlossItem = {
  term: string;
  en?: string;
  def: React.ReactNode;
  Visual: React.FC<{ start: number }>;
};

// Zone du schéma de rappel : x 660 → 1720, y 420 → 820 ; centre (GX, GY).
export const GX = 1190;
export const GY = 620;

// Liste des termes à gauche, fiche du terme courant à droite avec son schéma.
export const GlossDeck: React.FC<{
  items: GlossItem[];
  starts: number[];
  end: number;
  heading: string;
}> = ({ items, starts, end, heading }) => {
  const frame = useCurrentFrame();
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  const top = 230;
  const listW = 400;
  const cardLeft = 640;
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", top, left: SAFE.left, width: listW }}>
        <FadeIn start={starts[0] - 10}>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.inkSoft,
              letterSpacing: "0.3em",
              marginBottom: 22,
            }}
          >
            {heading.toUpperCase()}
          </div>
        </FadeIn>
        {items.map((it, i) => {
          const o = progress(frame, starts[i], 0.5);
          const active = i === current;
          return (
            <div
              key={it.term}
              style={{
                height: 70,
                display: "flex",
                alignItems: "center",
                gap: 18,
                opacity: o * (active ? 1 : 0.42),
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 38,
                  background: active ? COLORS.accent : COLORS.inkFaint,
                }}
              />
              <div style={textStyle(30, active ? 400 : 300)}>{it.term}</div>
            </div>
          );
        })}
      </div>
      <Svg>
        <DrawPath
          d={`M ${cardLeft - 40} ${top} V 800`}
          start={starts[0] - 6}
          duration={1}
          stroke={COLORS.inkFaint}
          width={1}
        />
      </Svg>
      {items.map((it, i) => {
        const from = starts[i];
        const to = i < items.length - 1 ? starts[i + 1] : end + 60;
        if (frame < from - 2 || frame > to) return null;
        const fadeOut = interpolate(frame, [to - 10, to], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const V = it.Visual;
        return (
          <AbsoluteFill key={it.term} style={{ opacity: fadeOut }}>
            <div
              style={{
                position: "absolute",
                top: top - 40,
                left: cardLeft,
                width: SAFE.right - cardLeft,
              }}
            >
              <FadeIn start={from}>
                <div style={textStyle(56, 200)}>
                  {it.term}
                  {it.en && (
                    <span
                      style={{
                        ...textStyle(26, 400),
                        color: COLORS.inkSoft,
                        letterSpacing: "0.12em",
                        marginLeft: 24,
                      }}
                    >
                      {it.en}
                    </span>
                  )}
                </div>
              </FadeIn>
              <FadeIn start={from + 10} style={{ marginTop: 16 }}>
                <div
                  style={{
                    ...textStyle(32, 300),
                    lineHeight: 1.35,
                    color: COLORS.ink,
                  }}
                >
                  {it.def}
                </div>
              </FadeIn>
            </div>
            <Svg>
              <V start={from + 18} />
            </Svg>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};

export const Lbl: React.FC<{
  x: number;
  y: number;
  text: string;
  start: number;
  color?: string;
  anchor?: "start" | "middle" | "end";
  size?: number;
}> = ({ x, y, text, start, color = COLORS.inkSoft, anchor, size = 24 }) => (
  <SvgText
    x={x}
    y={y}
    text={text}
    start={start}
    size={size}
    anchor={anchor}
    color={color}
  />
);

// ——— Schémas de rappel ———

// Dopage : un réseau de silicium où deux atomes sont remplacés.
const Doping: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const cols = 7;
  const dx = 110;
  const x0 = GX - ((cols - 1) * dx) / 2;
  const ys = [520, 620, 720];
  const swap = start + 1.2 * FPS;
  const sw = progress(frame, swap, 0.6);
  const lattice = [
    ...ys.map((y) => `M ${x0} ${y} H ${x0 + (cols - 1) * dx}`),
    ...new Array(cols)
      .fill(0)
      .map((_, i) => `M ${x0 + i * dx} ${ys[0]} V ${ys[2]}`),
  ].join(" ");
  const nx = x0 + 1 * dx;
  const px = x0 + 5 * dx;
  const t = (frame - swap) / FPS;
  return (
    <g>
      <DrawPath
        d={lattice}
        start={start}
        duration={1}
        stroke={COLORS.inkFaint}
        width={1.4}
      />
      {ys.map((y, r) =>
        new Array(cols).fill(0).map((_, c) => {
          const x = x0 + c * dx;
          const special = r === 1 && (c === 1 || c === 5);
          const color = special
            ? c === 1
              ? COLORS.accent
              : COLORS.warm
            : COLORS.ink;
          const label = special && sw > 0.5 ? (c === 1 ? "P" : "B") : "Si";
          const o = progress(frame, start + 4 + (r * cols + c), 0.4);
          return (
            <g key={`${r}-${c}`} opacity={o}>
              <circle
                cx={x}
                cy={y}
                r={27}
                fill="#0a1a3d"
                stroke={special && sw > 0 ? color : COLORS.inkSoft}
                strokeWidth={special ? 2 : 1.2}
              />
              <text
                x={x}
                y={y + 8}
                textAnchor="middle"
                fontFamily={FONT}
                fontSize={22}
                fontWeight={special ? 500 : 300}
                fill={special && sw > 0.5 ? color : COLORS.ink}
              >
                {label}
              </text>
            </g>
          );
        }),
      )}
      {/* Électron libre autour du donneur, trou près de l'accepteur */}
      <circle
        cx={nx + 55 * Math.cos(t * 2.2)}
        cy={ys[1] - 50 + 18 * Math.sin(t * 2.2)}
        r={8}
        fill={COLORS.accent}
        opacity={progress(frame, swap + 12, 0.5)}
      />
      <circle
        cx={px + 55}
        cy={ys[1] - 50}
        r={9}
        fill="none"
        stroke={COLORS.warm}
        strokeWidth={2}
        strokeDasharray="4 4"
        opacity={progress(frame, swap + 18, 0.5)}
      />
      <Lbl
        x={nx}
        y={790}
        text="type n : un électron en plus"
        start={swap + 20}
        color={COLORS.accent}
      />
      <Lbl
        x={px}
        y={790}
        text="type p : un électron manque"
        start={swap + 26}
        color={COLORS.warm}
      />
    </g>
  );
};

// Trou : une place vide qui avance quand les électrons comblent le vide.
const Hole: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const n = 8;
  const dx = 120;
  const x0 = GX - ((n - 1) * dx) / 2;
  const y = 580;
  const go = start + 1.2 * FPS;
  const stepF = 22;
  const e = Math.max(0, frame - go);
  const k = Math.min(n - 2, Math.floor(e / stepF));
  const f = k >= n - 2 ? 1 : Math.min(1, (e - k * stepF) / 10);
  const h = 0 + k; // position du trou avant le saut en cours
  const holeX = frame < go ? x0 : x0 + (h + (k >= n - 2 ? 0 : f)) * dx;
  const appear = progress(frame, start, 0.6);
  return (
    <g opacity={appear}>
      <DrawPath
        d={`M ${x0 - 60} ${y} H ${x0 + (n - 1) * dx + 60}`}
        start={start}
        duration={0.8}
        stroke={COLORS.inkFaint}
      />
      {new Array(n).fill(0).map((_, i) => {
        if (i === 0) return null;
        // L'électron i occupe la place i, sauf s'il a déjà sauté vers la gauche.
        let x = x0 + i * dx;
        if (frame >= go) {
          if (i <= k) x = x0 + (i - 1) * dx;
          else if (i === k + 1 && k < n - 2) x = x0 + i * dx - f * dx;
          if (k >= n - 2 && i === n - 1) x = x0 + (i - 1) * dx;
        }
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={14}
            fill={COLORS.accent}
            opacity={0.85}
          />
        );
      })}
      <circle
        cx={holeX}
        cy={y}
        r={20}
        fill="none"
        stroke={COLORS.warm}
        strokeWidth={2.4}
        strokeDasharray="5 5"
      />
      <text
        x={holeX}
        y={y + 9}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={26}
        fill={COLORS.warm}
      >
        +
      </text>
      <Arrow
        x1={GX + 200}
        y1={690}
        x2={GX - 200}
        y2={690}
        start={go}
        duration={0.8}
        stroke={COLORS.accent}
      />
      <Lbl
        x={GX - 230}
        y={690}
        text="électrons"
        start={go + 4}
        color={COLORS.accent}
        anchor="end"
      />
      <Arrow
        x1={GX - 200}
        y1={760}
        x2={GX + 200}
        y2={760}
        start={go + 20}
        duration={0.8}
        stroke={COLORS.warm}
      />
      <Lbl
        x={GX + 230}
        y={760}
        text="trou : porteur positif"
        start={go + 24}
        color={COLORS.warm}
        anchor="start"
      />
    </g>
  );
};

// Jonction PN : région p, région n, zone appauvrie à l'interface.
const Junction: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const x0 = 800;
  const x1 = 1580;
  const y0 = 500;
  const y1 = 720;
  const mid = GX;
  const dep = 70;
  const on = progress(frame, start + 20, 0.8);
  const t = frame / FPS;
  return (
    <g>
      <DrawPath
        d={roundRectPath(x0, y0, x1 - x0, y1 - y0, 10)}
        start={start}
        duration={0.9}
        stroke={COLORS.inkSoft}
      />
      <rect
        x={mid - dep}
        y={y0 + 2}
        width={dep * 2}
        height={y1 - y0 - 4}
        fill={COLORS.ink}
        opacity={0.06 * on}
      />
      <DrawPath
        d={`M ${mid} ${y0 - 20} V ${y1 + 20}`}
        start={start + 16}
        duration={0.6}
        stroke={COLORS.accent}
        width={1.6}
      />
      {new Array(14).fill(0).map((_, i) => {
        const x = x0 + 40 + random(`hx${i}`) * (mid - dep - x0 - 70);
        const y =
          y0 +
          30 +
          random(`hy${i}`) * (y1 - y0 - 60) +
          5 * Math.sin(t * 1.3 + i);
        return (
          <circle
            key={`h${i}`}
            cx={x}
            cy={y}
            r={9}
            fill="none"
            stroke={COLORS.warm}
            strokeWidth={1.8}
            opacity={on}
          />
        );
      })}
      {new Array(14).fill(0).map((_, i) => {
        const x = mid + dep + 30 + random(`ex${i}`) * (x1 - mid - dep - 70);
        const y =
          y0 +
          30 +
          random(`ey${i}`) * (y1 - y0 - 60) +
          5 * Math.cos(t * 1.3 + i);
        return (
          <circle
            key={`e${i}`}
            cx={x}
            cy={y}
            r={7}
            fill={COLORS.accent}
            opacity={on}
          />
        );
      })}
      {[0, 1, 2, 3].map((i) => (
        <g key={i} opacity={progress(frame, start + 34 + i * 3, 0.4)}>
          <text
            x={mid - 36}
            y={y0 + 50 + i * 44}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={26}
            fill={COLORS.warm}
          >
            −
          </text>
          <text
            x={mid + 36}
            y={y0 + 50 + i * 44}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={26}
            fill={COLORS.accent}
          >
            +
          </text>
        </g>
      ))}
      <Lbl
        x={(x0 + mid - dep) / 2}
        y={y0 - 34}
        text="type p"
        start={start + 12}
        color={COLORS.warm}
        size={28}
      />
      <Lbl
        x={(x1 + mid + dep) / 2}
        y={y0 - 34}
        text="type n"
        start={start + 12}
        color={COLORS.accent}
        size={28}
      />
      <Lbl
        x={mid}
        y={y0 - 44}
        text="interface"
        start={start + 20}
        color={COLORS.ink}
      />
      <Lbl x={mid} y={y1 + 50} text="zone appauvrie" start={start + 40} />
    </g>
  );
};

// MOSFET : coupe simplifiée ; la tension de grille ouvre un canal.
export const MosfetCut: React.FC<{
  start: number;
  cx?: number;
  top?: number;
  labels?: boolean;
  flow?: boolean;
}> = ({ start, cx = GX, top = 520, labels = true, flow = true }) => {
  const frame = useCurrentFrame();
  const sub = { x: cx - 390, y: top + 90, w: 780, h: 180 };
  const sx = cx - 360;
  const dx = cx + 180;
  const on = flow ? progress(frame, start + 1.6 * FPS, 0.8) : 0;
  const t = (frame - start) / FPS;
  return (
    <g>
      <DrawPath
        d={roundRectPath(sub.x, sub.y, sub.w, sub.h, 8)}
        start={start}
        duration={0.8}
        stroke={COLORS.inkSoft}
      />
      <DrawPath
        d={`M ${sx} ${sub.y} V ${sub.y + 60} Q ${sx} ${sub.y + 76} ${sx + 16} ${sub.y + 76} H ${sx + 164} Q ${sx + 180} ${sub.y + 76} ${sx + 180} ${sub.y + 60} V ${sub.y}`}
        start={start + 8}
        duration={0.6}
        stroke={COLORS.accent}
      />
      <DrawPath
        d={`M ${dx} ${sub.y} V ${sub.y + 60} Q ${dx} ${sub.y + 76} ${dx + 16} ${sub.y + 76} H ${dx + 164} Q ${dx + 180} ${sub.y + 76} ${dx + 180} ${sub.y + 60} V ${sub.y}`}
        start={start + 8}
        duration={0.6}
        stroke={COLORS.accent}
      />
      <path
        d={roundRectPath(cx - 180, sub.y - 14, 360, 14, 2)}
        fill={COLORS.warm}
        opacity={0.4 * progress(frame, start + 14, 0.5)}
      />
      <DrawPath
        d={roundRectPath(cx - 160, sub.y - 84, 320, 70, 6)}
        start={start + 16}
        duration={0.6}
        stroke={COLORS.ink}
      />
      <rect
        x={cx - 180}
        y={sub.y + 2}
        width={360}
        height={16}
        fill={COLORS.accent}
        opacity={0.4 * on}
      />
      {flow &&
        new Array(7).fill(0).map((_, i) => {
          const p = (t / 1.8 + i / 7) % 1;
          return (
            <circle
              key={i}
              cx={sx + 90 + p * (dx + 90 - sx - 90)}
              cy={sub.y + 10}
              r={5}
              fill={COLORS.accent}
              opacity={on * Math.sin(Math.PI * p)}
            />
          );
        })}
      {labels && (
        <>
          <Lbl
            x={cx}
            y={sub.y - 49}
            text="grille"
            start={start + 22}
            color={COLORS.ink}
          />
          <Lbl
            x={sx + 90}
            y={sub.y - 30}
            text="source"
            start={start + 14}
            color={COLORS.accent}
          />
          <Lbl
            x={dx + 90}
            y={sub.y - 30}
            text="drain"
            start={start + 14}
            color={COLORS.accent}
          />
          <DrawPath
            d={`M ${cx + 180} ${sub.y - 7} H ${cx + 400}`}
            start={start + 20}
            duration={0.4}
            stroke={COLORS.inkFaint}
            width={1}
          />
          <Lbl
            x={cx + 410}
            y={sub.y - 7}
            text="isolant"
            start={start + 22}
            color={COLORS.warm}
            anchor="start"
          />
          {flow && (
            <Lbl
              x={cx}
              y={sub.y + 48}
              text="canal"
              start={start + 1.8 * FPS}
              color={COLORS.accent}
            />
          )}
          <Lbl x={cx} y={sub.y + 140} text="substrat" start={start + 10} />
        </>
      )}
    </g>
  );
};

// CMOS : inverseur, un PMOS vers VDD, un NMOS vers la masse.
export const CmosInv: React.FC<{
  start: number;
  cx?: number;
  cy?: number;
  labels?: boolean;
}> = ({ start, cx = GX, cy = 620, labels = true }) => {
  const ch = cx + 20;
  const gx = cx - 4;
  const pT = cy - 110;
  const pB = cy - 30;
  const nT = cy + 30;
  const nB = cy + 110;
  const wires = [
    `M ${ch - 90} ${cy - 150} H ${ch + 90}`,
    `M ${ch} ${cy - 150} V ${pT} M ${ch} ${pB} V ${nT} M ${ch} ${nB} V ${cy + 150}`,
    `M ${ch - 40} ${cy + 150} H ${ch + 40} M ${ch - 26} ${cy + 162} H ${ch + 26} M ${ch - 12} ${cy + 174} H ${ch + 12}`,
    `M ${ch} ${cy} H ${ch + 220}`,
    `M ${gx - 22} ${pT + 40} H ${cx - 120} V ${nT + 40} H ${gx} M ${cx - 120} ${cy} H ${cx - 240}`,
  ].join(" ");
  const devs = [
    `M ${ch} ${pT} V ${pB} M ${gx} ${pT + 6} V ${pB - 6}`,
    `M ${ch} ${nT} V ${nB} M ${gx} ${nT + 6} V ${nB - 6}`,
  ].join(" ");
  return (
    <g>
      <DrawPath
        d={wires}
        start={start}
        duration={1.2}
        stroke={COLORS.inkSoft}
      />
      <DrawPath
        d={devs}
        start={start + 10}
        duration={0.6}
        stroke={COLORS.ink}
        width={3}
      />
      <DrawPath
        d={circlePath(gx - 12, pT + 40, 9)}
        start={start + 16}
        duration={0.3}
        stroke={COLORS.warm}
        width={2}
      />
      {labels && (
        <>
          <Lbl
            x={ch + 110}
            y={cy - 150}
            text="VDD"
            start={start + 14}
            color={COLORS.accent}
            anchor="start"
          />
          <Lbl
            x={ch + 40}
            y={cy - 70}
            text="PMOS · type p"
            start={start + 20}
            color={COLORS.warm}
            anchor="start"
          />
          <Lbl
            x={ch + 40}
            y={cy + 70}
            text="NMOS · type n"
            start={start + 20}
            color={COLORS.accent}
            anchor="start"
          />
          <Lbl
            x={cx - 250}
            y={cy}
            text="entrée"
            start={start + 24}
            anchor="end"
          />
          <Lbl
            x={ch + 234}
            y={cy}
            text="sortie"
            start={start + 24}
            anchor="start"
          />
          <Lbl
            x={ch + 60}
            y={cy + 162}
            text="masse"
            start={start + 24}
            anchor="start"
          />
        </>
      )}
    </g>
  );
};

// VDD et Vth : la tension de grille monte, franchit le seuil, atteint l'alimentation.
const Levels: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const ox = 760;
  const oy = 800;
  const yTh = 690;
  const yDD = 500;
  const go = start + 0.8 * FPS;
  const curve = `M ${ox + 10} ${oy - 4} C ${ox + 260} ${oy - 4} ${ox + 300} ${yDD} ${ox + 560} ${yDD} H ${ox + 820}`;
  const crossed = frame > go + 0.9 * FPS;
  return (
    <g>
      <Arrow
        x1={ox}
        y1={oy}
        x2={ox + 860}
        y2={oy}
        start={start}
        stroke={COLORS.inkSoft}
      />
      <Arrow
        x1={ox}
        y1={oy}
        x2={ox}
        y2={yDD - 70}
        start={start}
        stroke={COLORS.inkSoft}
      />
      <Lbl
        x={ox + 860}
        y={oy + 34}
        text="temps"
        start={start + 6}
        anchor="end"
      />
      <Lbl
        x={ox - 16}
        y={yDD - 60}
        text="tension de grille"
        start={start + 6}
        anchor="start"
      />
      <path
        d={`M ${ox} ${yTh} H ${ox + 840}`}
        stroke={COLORS.warm}
        strokeWidth={1.6}
        strokeDasharray="10 8"
        opacity={progress(frame, start + 10, 0.6)}
      />
      <path
        d={`M ${ox} ${yDD} H ${ox + 840}`}
        stroke={COLORS.accent}
        strokeWidth={1.6}
        strokeDasharray="10 8"
        opacity={progress(frame, start + 16, 0.6)}
      />
      <Lbl
        x={ox - 20}
        y={yTh}
        text="Vth"
        start={start + 12}
        color={COLORS.warm}
        anchor="end"
        size={28}
      />
      <Lbl
        x={ox - 20}
        y={yDD}
        text="VDD"
        start={start + 18}
        color={COLORS.accent}
        anchor="end"
        size={28}
      />
      <DrawPath
        d={curve}
        start={go}
        duration={1.6}
        stroke={COLORS.ink}
        width={3}
      />
      <Lbl
        x={ox + 840}
        y={yTh + 30}
        text="seuil de conduction"
        start={start + 12}
        color={COLORS.warm}
        anchor="end"
      />
      <Lbl
        x={ox + 840}
        y={yDD - 30}
        text="tension d’alimentation"
        start={start + 18}
        color={COLORS.accent}
        anchor="end"
      />
      <text
        x={ox + 110}
        y={oy - 30}
        fontFamily={FONT}
        fontSize={24}
        fill={COLORS.inkSoft}
        opacity={progress(frame, go, 0.4) * (crossed ? 0.35 : 1)}
      >
        bloqué
      </text>
      <text
        x={ox + 820}
        y={yDD + 44}
        fontFamily={FONT}
        fontSize={24}
        textAnchor="end"
        fill={COLORS.accent}
        opacity={crossed ? progress(frame, go + 30, 0.4) : 0}
      >
        conduit
      </text>
    </g>
  );
};

const ITEMS: GlossItem[] = [
  {
    term: "Dopage",
    def: "Incorporation contrôlée d’atomes modifiant les porteurs disponibles.",
    Visual: Doping,
  },
  {
    term: "Trou",
    def: "Absence d’électron se comportant comme un porteur positif.",
    Visual: Hole,
  },
  {
    term: "Jonction PN",
    def: "Interface entre des régions de type p et de type n.",
    Visual: Junction,
  },
  {
    term: "MOSFET",
    def: "Transistor commandant un canal par le champ d’une grille isolée.",
    Visual: ({ start }) => <MosfetCut start={start} />,
  },
  {
    term: "CMOS",
    def: "Association complémentaire de transistors de type n et de type p.",
    Visual: ({ start }) => <CmosInv start={start} />,
  },
  {
    term: "VDD et Vth",
    def: "La tension d’alimentation, et la tension de seuil du transistor.",
    Visual: Levels,
  },
];

// Scène 45 — Glossaire (1/2) : six termes, chacun avec son schéma de rappel.
export const S45: React.FC = () => {
  const cues = useCues();
  const starts = [1, 2, 3, 4, 5, 6].map((i) => cues.s(i));
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(1)}>
        <Title
          text="Le vocabulaire à savoir expliquer"
          kicker="Glossaire · 1 / 2"
          start={0}
          top={400}
        />
      </Stage>
      <Stage from={cues.s(1)}>
        <GlossDeck
          items={ITEMS}
          starts={starts}
          end={cues.end}
          heading="Glossaire · 1 / 2"
        />
      </Stage>
    </AbsoluteFill>
  );
};
