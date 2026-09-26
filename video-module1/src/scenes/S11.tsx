import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
  DrawPath,
  Stage,
  progress,
  useCues,
} from "../components/motion";
import { COLORS, FPS } from "../theme";
import { Caps, Electron, Hole, Note, Sign, Txt, wander } from "./S04";
import { Mosfet, mosGeom } from "./S10";

const CX = 700;

// Opacité d'un groupe SVG visible entre deux instants (équivalent de Stage).
const win = (frame: number, from: number, to: number) =>
  Math.min(
    interpolate(frame, [from - 4, from + 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    interpolate(frame, [to - 12, to], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
const Y = 520;

// Coupe NMOS animée : trous du corps, électrons des régions n+, canal, flux.
const Section: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const g = mosGeom(CX, Y);
  const t0 = cues.s(0);
  const tOff = cues.beat(1);
  const tG = cues.beat(2);
  const tInv = cues.s(3);
  const tDS = cues.beat(3);
  const tNo = cues.beat(4);
  const tConv = cues.s(8, 1);
  const on = progress(frame, t0 + 40, 0.8);
  const push = progress(frame, tG + 20, 1.5);
  const attract = progress(frame, tG + 40, 2.5);
  const channel = progress(frame, tInv, 0.8);
  const flow = progress(frame, tDS + 20, 0.8);
  // Trous (porteurs majoritaires du corps p).
  const holes = new Array(34).fill(0).map((_, i) => {
    let x = g.bodyL + 20 + random(`hx${i}`) * (g.bodyR - g.bodyL - 40);
    let y = Y + 20 + random(`hy${i}`) * (g.bodyB - Y - 40);
    const inWell =
      y < Y + g.wellD + 10 &&
      ((x > g.srcL - 10 && x < g.srcR + 10) ||
        (x > g.drnL - 10 && x < g.drnR + 10));
    if (inWell) y += g.wellD + 20;
    const under = x > g.srcR && x < g.drnL;
    // Bande libre sous le canal pour les flèches de courant.
    if (under && y < Y + 220)
      y = interpolate(push, [0, 1], [y, Y + 225 + (y - Y) * 0.25]);
    else if (under && y < Y + 230) y = Y + 230;
    const [dx, dy] = wander(`hw${i}`, frame, 6);
    x += dx;
    return (
      <Hole key={i} x={x} y={Math.min(g.bodyB - 12, y + dy)} r={6} o={on} />
    );
  });
  // Électrons des régions n+ (très nombreux).
  const wellE = [g.srcL, g.drnL].flatMap((l, w) =>
    new Array(10).fill(0).map((_, i) => {
      const [dx, dy] = wander(`we${w}${i}`, frame, 5);
      const x = l + 30 + (i % 5) * 38 + dx;
      const y = Y + 25 + Math.floor(i / 5) * 40 + dy;
      return <Electron key={`${w}${i}`} x={x} y={y} r={5} o={on} />;
    }),
  );
  // Électrons attirés sous la grille, puis couche d'inversion.
  const chanE = new Array(9).fill(0).map((_, i) => {
    const target = g.srcR + 20 + i * ((g.drnL - g.srcR - 40) / 8);
    const from = i < 5 ? g.srcR - 20 : g.drnL + 20;
    const x = interpolate(attract, [0, 1], [from, target]);
    return (
      <Electron
        key={i}
        x={x}
        y={Y + 9}
        r={5}
        o={Math.min(attract * 3, 1) * (1 - flow)}
      />
    );
  });
  // Flux source → drain en présence de VDS.
  const path: [number, number][] = [
    [(g.srcL + g.srcR) / 2, Y + 60],
    [g.srcR, Y + 9],
    [g.drnL, Y + 9],
    [(g.drnL + g.drnR) / 2, Y + 60],
  ];
  const segs = path
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  const at = (u: number): [number, number] => {
    let s = u * total;
    let k = 0;
    while (k < segs.length - 1 && s > segs[k]) {
      s -= segs[k];
      k++;
    }
    const f = s / segs[k];
    return [
      path[k][0] + (path[k + 1][0] - path[k][0]) * f,
      path[k][1] + (path[k + 1][1] - path[k][1]) * f,
    ];
  };
  const flowE = new Array(14).fill(0).map((_, i) => {
    const u = ((frame - tDS) / (3 * FPS) + i / 14) % 1;
    const [x, y] = at(u);
    return (
      <Electron
        key={i}
        x={x}
        y={y}
        r={5.5}
        o={flow * Math.min(1, u * 10, (1 - u) * 10)}
      />
    );
  });
  const vgsOn = frame >= tG;
  return (
    <g>
      <Mosfet
        cx={CX}
        Y={Y}
        body={t0}
        sd={t0 + 10}
        oxide={t0 + 20}
        gate={t0 + 24}
        terminals={t0 + 30}
        labels={t0 + 40}
      />
      {holes}
      {wellE}
      {chanE}
      <rect
        x={g.srcR - 6}
        y={Y + 1}
        width={g.drnL - g.srcR + 12}
        height={16}
        fill={COLORS.accent}
        opacity={0.35 * channel}
      />
      {flowE}
      {/* Pas de canal : VGS = 0 */}
      <g opacity={win(frame, tOff, tG)}>
        <DrawPath
          d={`M ${CX - 30} ${Y + 40} L ${CX + 30} ${Y + 100} M ${CX + 30} ${Y + 40} L ${CX - 30} ${Y + 100}`}
          start={tOff + 30}
          duration={0.5}
          stroke={COLORS.warm}
          width={3}
        />
        <SvgText
          x={CX}
          y={Y + 140}
          text="pas de canal"
          start={tOff + 36}
          size={26}
          color={COLORS.warm}
        />
      </g>
      {/* Tensions appliquées */}
      <SvgText
        x={CX + 24}
        y={g.termY + 4}
        text={vgsOn ? "VGS > 0" : "VGS = 0"}
        start={vgsOn ? tG : tOff}
        size={26}
        color={vgsOn ? COLORS.accent : COLORS.warm}
        anchor="start"
      />
      <SvgText
        x={g.sX - 24}
        y={g.termY + 4}
        text="0 V"
        start={tOff}
        size={24}
        color={COLORS.inkSoft}
        anchor="end"
      />
      <SvgText
        x={g.dX + 24}
        y={g.termY + 4}
        text="VDS > 0"
        start={tDS}
        size={26}
        color={COLORS.accent}
        anchor="start"
      />
      {/* Charges positives sur la grille et champ à travers l'isolant */}
      {new Array(7).fill(0).map((_, i) => (
        <Sign
          key={i}
          x={g.gateL + 30 + i * 43}
          y={Y - g.oxH - 16}
          sign="+"
          s={7}
          color={COLORS.accent}
          o={progress(frame, tG + 6 + i * 2, 0.4)}
        />
      ))}
      {[-110, -40, 40, 110].map((dx) => (
        <Arrow
          key={dx}
          x1={CX + dx}
          y1={Y - 44}
          x2={CX + dx}
          y2={Y + 30}
          start={tG + 20}
          duration={0.6}
          stroke={COLORS.warm}
          width={1.4}
        />
      ))}
      <SvgText
        x={g.drnL + 40}
        y={Y - 50}
        text="champ"
        start={tG + 26}
        size={22}
        color={COLORS.warm}
        anchor="start"
      />
      {/* Courants */}
      <Arrow
        x1={g.srcR + 10}
        y1={Y + 150}
        x2={g.drnL - 10}
        y2={Y + 150}
        start={tDS + 30}
        stroke={COLORS.accent}
        width={2.4}
      />
      <SvgText
        x={CX}
        y={Y + 125}
        text="électrons : source → drain"
        start={tDS + 36}
        size={22}
        color={COLORS.accent}
      />
      <Arrow
        x1={g.drnL - 10}
        y1={Y + 200}
        x2={g.srcR + 10}
        y2={Y + 200}
        start={tConv}
        stroke={COLORS.warm}
        width={2.4}
      />
      <SvgText
        x={CX}
        y={Y + 175}
        text="courant conventionnel : drain → source"
        start={tConv + 6}
        size={22}
        color={COLORS.warm}
      />
      {/* Aucun électron ne vient de la grille */}
      <g opacity={win(frame, tNo, cues.beat(5))}>
        <path
          d={`M ${g.gateL + 40} ${Y - 90} V ${Y - 4}`}
          stroke={COLORS.warm}
          strokeWidth={2}
          strokeDasharray="6 6"
          opacity={progress(frame, tNo + 10, 0.4)}
        />
        <DrawPath
          d={`M ${g.gateL + 22} ${Y - 26} L ${g.gateL + 58} ${Y + 10} M ${g.gateL + 58} ${Y - 26} L ${g.gateL + 22} ${Y + 10}`}
          start={tNo + 24}
          duration={0.4}
          stroke={COLORS.warm}
          width={3.4}
        />
      </g>
    </g>
  );
};

// Coupe d'un transistor 3D (vue perpendiculaire au courant) : grille sur trois côtés.
const Fin: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const x = 1500;
  const yb = 800;
  return (
    <g>
      <DrawPath
        d={`M ${x - 180} ${yb} H ${x + 180}`}
        start={start}
        duration={0.6}
        stroke={COLORS.inkSoft}
      />
      <rect
        x={x - 26}
        y={yb - 130}
        width={52}
        height={130}
        fill={COLORS.warm}
        opacity={0.12 * progress(frame, start, 0.6)}
      />
      <DrawPath
        d={`M ${x - 26} ${yb} V ${yb - 130} H ${x + 26} V ${yb}`}
        start={start + 6}
        duration={0.6}
        stroke={COLORS.warm}
      />
      <path
        d={`M ${x - 70} ${yb} V ${yb - 170} H ${x + 70} V ${yb} H ${x + 34} V ${yb - 138} H ${x - 34} V ${yb} Z`}
        fill={COLORS.ink}
        opacity={0.12 * progress(frame, start + 20, 0.6)}
      />
      <DrawPath
        d={`M ${x - 70} ${yb} V ${yb - 170} H ${x + 70} V ${yb} M ${x - 34} ${yb} V ${yb - 138} H ${x + 34} V ${yb}`}
        start={start + 20}
        duration={0.8}
        stroke={COLORS.ink}
      />
      <SvgText
        x={x - 90}
        y={yb - 150}
        text="grille"
        start={start + 30}
        size={22}
        anchor="end"
      />
      <SvgText
        x={x + 90}
        y={yb - 60}
        text="ailette"
        start={start + 16}
        size={22}
        color={COLORS.warm}
        anchor="start"
      />
    </g>
  );
};

// Scène 11 — Un exemple NMOS.
export const S11: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const legendO = progress(frame, cues.s(0, 6), 0.6);
  const panel = { x: 1180, w: 600 };
  return (
    <AbsoluteFill>
      <Title
        kicker="Le transistor MOSFET"
        text="Un exemple NMOS"
        start={cues.s(0)}
      />
      <Svg>
        <Section />
      </Svg>
      <Stage from={0} to={cues.beat(1)}>
        <Txt x={panel.x} y={260} width={panel.w} start={cues.s(0, 1)} size={30}>
          Transistor <span style={{ color: COLORS.accent }}>planaire</span> à{" "}
          <span style={{ color: COLORS.accent }}>enrichissement</span>
        </Txt>
        <Txt
          x={panel.x}
          y={360}
          width={panel.w}
          start={cues.s(0, 5)}
          size={28}
          color={COLORS.inkSoft}
        >
          source et drain de type n (n+), dans un corps de type p
        </Txt>
        <Svg>
          <Electron x={panel.x + 12} y={530} r={6} o={legendO} />
          <Hole x={panel.x + 12} y={580} r={6.5} o={legendO} />
        </Svg>
        <Txt
          x={panel.x + 40}
          y={513}
          width={500}
          start={cues.s(0, 6)}
          size={26}
          color={COLORS.inkSoft}
        >
          électron
        </Txt>
        <Txt
          x={panel.x + 40}
          y={563}
          width={500}
          start={cues.s(0, 6)}
          size={26}
          color={COLORS.inkSoft}
        >
          trou (majoritaire dans le corps p)
        </Txt>
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(2)}>
        <Txt
          x={panel.x}
          y={300}
          width={panel.w}
          start={cues.beat(1, 0.3)}
          size={30}
        >
          <span style={{ color: COLORS.warm }}>Commande insuffisante</span> sur
          la grille : aucun canal riche en électrons ne relie la source et le
          drain.
        </Txt>
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(3)}>
        <Txt
          x={panel.x}
          y={260}
          width={panel.w}
          start={cues.beat(2, 0.3)}
          size={30}
        >
          Une tension{" "}
          <span style={{ color: COLORS.accent }}>grille-source positive</span>{" "}
          attire les électrons vers la surface.
        </Txt>
        <Txt x={panel.x} y={420} width={panel.w} start={cues.s(3)} size={30}>
          Une <span style={{ color: COLORS.accent }}>couche d’inversion</span>{" "}
          forme alors un canal conducteur de type n.
        </Txt>
        <Txt
          x={panel.x}
          y={580}
          width={panel.w}
          start={cues.s(3, 1.5)}
          size={26}
          color={COLORS.inkSoft}
        >
          (les trous sont repoussés vers le bas)
        </Txt>
        <Txt
          x={panel.x}
          y={680}
          width={panel.w}
          start={cues.s(4)}
          size={24}
          weight={400}
          color={COLORS.inkSoft}
        >
          SOURCE 3 · MIT 6.012, lecture 9
        </Txt>
      </Stage>
      <Stage from={cues.beat(3)} to={cues.beat(4)}>
        <Txt
          x={panel.x}
          y={300}
          width={panel.w}
          start={cues.beat(3, 0.3)}
          size={30}
        >
          Avec une différence de potentiel entre{" "}
          <span style={{ color: COLORS.accent }}>drain et source</span>, un
          courant circule dans le canal.
        </Txt>
      </Stage>
      <Stage from={cues.beat(4)} to={cues.beat(5)}>
        <Note
          kind="keep"
          x={panel.x}
          y={270}
          width={panel.w}
          start={cues.beat(4, 0.3)}
        >
          La grille commande le courant par le{" "}
          <span style={{ color: COLORS.accent }}>champ électrique</span>.
        </Note>
        <Note
          kind="warn"
          x={panel.x}
          y={470}
          width={panel.w}
          start={cues.s(6, 3)}
        >
          Les électrons du canal ne viennent pas de la grille : l’isolant les
          bloque.
        </Note>
      </Stage>
      <Stage from={cues.beat(5)}>
        <Svg>
          <Caps
            x={panel.x}
            y={265}
            text="précisions sur ce schéma"
            start={cues.beat(5)}
            anchor="start"
            color={COLORS.warm}
          />
          <Fin start={cues.s(9, 0.5)} />
        </Svg>
        <Txt
          x={panel.x}
          y={300}
          width={panel.w}
          start={cues.s(7, 0.4)}
          size={27}
        >
          — coupe pédagogique,{" "}
          <span style={{ color: COLORS.warm }}>non à l’échelle</span>
        </Txt>
        <Txt x={panel.x} y={360} width={panel.w} start={cues.s(8)} size={27}>
          — drain positif par rapport à la source ; courant conventionnel{" "}
          <span style={{ color: COLORS.warm }}>opposé</span> au déplacement des
          électrons
        </Txt>
        <Txt x={panel.x} y={500} width={panel.w} start={cues.s(9)} size={27}>
          — les transistors modernes peuvent être{" "}
          <span style={{ color: COLORS.accent }}>tridimensionnels</span> (grille
          sur plusieurs faces) :
        </Txt>
      </Stage>
    </AbsoluteFill>
  );
};
