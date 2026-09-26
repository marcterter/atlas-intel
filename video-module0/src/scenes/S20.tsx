import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { circlePath, icons, roundRectPath } from "../components/icons";
import { Box, Icon, Svg, SvgText, Title } from "../components/kit";
import {
  Counter,
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

// Pile de dies mémoire dessinée couche par couche.
const DieStack: React.FC<{
  x: number;
  bottom: number;
  w: number;
  n: number;
  h: number;
  start: number;
  every?: number;
  color?: string;
}> = ({ x, bottom, w, n, h, start, every = 3, color = COLORS.accent }) => {
  const frame = useCurrentFrame();
  return (
    <g>
      {new Array(n).fill(0).map((_, i) => {
        const p = progress(frame, start + i * every, 0.4);
        if (p === 0) return null;
        const y = bottom - (i + 1) * h;
        return (
          <rect
            key={i}
            x={x}
            y={y + (1 - p) * -30}
            width={w}
            height={h - 3}
            rx={2}
            fill={color}
            fillOpacity={0.14}
            stroke={color}
            strokeWidth={1.2}
            opacity={p}
          />
        );
      })}
    </g>
  );
};

const HBM: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t1 = cues.s(1);
  const t2 = cues.s(2);
  const base = 720;
  const sx = 600;
  const sw = 240;
  const px = 1000;
  const pw = 320;
  const flow = progress(frame, t2 + 30, 0.6);
  return (
    <AbsoluteFill>
      <Title
        kicker="HBM"
        text="High Bandwidth Memory"
        start={cues.s(0)}
        top={110}
      />
      <FadeIn
        start={cues.s(0, 2.5)}
        style={{
          position: "absolute",
          top: 262,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300), color: COLORS.inkSoft }}>
          mémoire à très haute bande passante
        </div>
      </FadeIn>
      <Svg>
        {/* Substrat / interposeur */}
        <DrawPath
          d={roundRectPath(520, base + 6, 880, 34, 6)}
          start={cues.s(0, 1)}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        <DieStack x={sx} bottom={base} w={sw} n={12} h={26} start={t1} />
        {/* Connexions verticales à travers la pile */}
        {[0.2, 0.4, 0.6, 0.8].map((k, i) => (
          <DrawPath
            key={k}
            d={`M ${sx + sw * k} ${base - 12 * 26 + 4} V ${base + 20}`}
            start={t1 + 45 + i * 4}
            duration={0.9}
            stroke={COLORS.ink}
            width={1.2}
          />
        ))}
        {/* Processeur */}
        <DrawPath
          d={roundRectPath(px, base - 200, pw, 200, 10)}
          start={t2}
          duration={0.9}
          stroke={COLORS.ink}
        />
        <Icon
          name="chip"
          x={px + pw / 2}
          y={base - 118}
          size={38}
          start={t2 + 12}
        />
        <SvgText
          x={px + pw / 2}
          y={base - 40}
          text="Processeur"
          start={t2 + 18}
          size={26}
        />
        {/* Données : de la pile vers le processeur, à travers l'interposeur */}
        {new Array(24).fill(0).map((_, i) => {
          const lane = i % 4;
          const ph = ((frame - t2 - 30) / FPS / 1.4 + i / 24) % 1;
          const x0 = sx + sw * (0.2 + lane * 0.2);
          const x = x0 + ph * (px + 40 + lane * 60 - x0);
          const y = base + 16 + lane * 4;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3.5}
              fill={COLORS.accent}
              opacity={flow * 0.9}
            />
          );
        })}
        <SvgText
          x={(sx + sw + px) / 2}
          y={base + 80}
          text="tout près du processeur"
          start={t2 + 30}
          size={26}
          color={COLORS.accent}
        />
      </Svg>
      <div
        style={{
          position: "absolute",
          left: sx - 330,
          top: base - 12 * 26 - 20,
          width: 300,
          textAlign: "right",
          opacity: progress(frame, t1 + 4, 0.6),
        }}
      >
        <span style={{ ...textStyle(72, 200), color: COLORS.accent }}>
          <Counter to={12} start={t1} duration={1.3} />
        </span>
        <div style={{ ...textStyle(28, 300), color: COLORS.inkSoft }}>
          dies empilés
        </div>
      </div>
      <FadeIn
        start={t1 + 60}
        style={{
          position: "absolute",
          left: sx - 330,
          top: base - 70,
          width: 300,
          textAlign: "right",
        }}
      >
        <div style={{ ...textStyle(26, 300), color: COLORS.inkSoft }}>
          nombreuses connexions
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const Fact: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(4);
  const stats = [
    {
      to: 36,
      dec: 0,
      unit: "Go",
      sub: "par empilement HBM4",
      at: cues.s(4, 4.2),
      pre: "",
    },
    {
      to: 12,
      dec: 0,
      unit: "dies",
      sub: "mémoire empilés",
      at: cues.s(4, 6.2),
      pre: "",
    },
    {
      to: 2.8,
      dec: 1,
      unit: "To/s",
      sub: "bande passante par empilement",
      at: cues.s(4, 8.8),
      pre: "> ",
    },
  ];
  const tl = 700;
  const xs = [700, 1240];
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 200, top: 150, width: 1520 }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 2,
            height: progress(frame, cues.s(3), 0.8) * 110,
            background: COLORS.accent,
          }}
        />
        <FadeIn start={cues.s(3)} style={{ marginLeft: 40 }}>
          <div style={label(COLORS.accent)}>FAIT PUBLIÉ · [3]</div>
        </FadeIn>
        <FadeIn start={t} style={{ marginLeft: 40, marginTop: 16 }}>
          <div style={textStyle(40, 300)}>
            16 mars 2026 · Micron annonce des livraisons en volume de HBM4
          </div>
        </FadeIn>
      </div>
      <div
        style={{
          position: "absolute",
          top: 330,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 90,
        }}
      >
        {stats.map((s) => (
          <FadeIn
            key={s.unit}
            start={s.at}
            style={{ width: 440, textAlign: "center" }}
          >
            <div style={textStyle(96, 200)}>
              <span style={{ color: COLORS.inkSoft, fontSize: 60 }}>
                {s.pre}
              </span>
              <Counter to={s.to} decimals={s.dec} start={s.at} duration={1.3} />
              <span style={{ fontSize: 44, color: COLORS.accent }}>
                {" "}
                {s.unit}
              </span>
            </div>
            <div
              style={{
                ...textStyle(26, 300),
                color: COLORS.inkSoft,
                marginTop: 4,
              }}
            >
              {s.sub}
            </div>
          </FadeIn>
        ))}
      </div>
      <Svg>
        <Arrow2 x1={400} x2={1560} y={tl + 100} start={cues.s(5)} />
        {xs.map((x, i) => (
          <DrawPath
            key={x}
            d={circlePath(x, tl + 100, 9)}
            start={i === 0 ? cues.s(5, 0.6) : cues.s(6, 1.2)}
            duration={0.4}
            stroke={i === 0 ? COLORS.warm : COLORS.accent}
            width={2.5}
          />
        ))}
        <DieStack
          x={xs[0] - 190}
          bottom={tl + 70}
          w={60}
          n={16}
          h={7}
          every={1}
          start={cues.s(5, 0.8)}
          color={COLORS.warm}
        />
        <DieStack
          x={xs[1] - 190}
          bottom={tl + 70}
          w={60}
          n={12}
          h={7}
          every={1}
          start={cues.s(6, 1.4)}
        />
        <SvgText
          x={xs[0] - 110}
          y={tl + 20}
          text={"48 Go · 16 dies"}
          start={cues.s(5, 1.2)}
          size={28}
          anchor="start"
          color={COLORS.warm}
        />
        <SvgText
          x={xs[1] - 110}
          y={tl + 20}
          text={"36 Go · 12 dies"}
          start={cues.s(6, 1.6)}
          size={28}
          anchor="start"
          color={COLORS.accent}
        />
        <SvgText
          x={xs[0]}
          y={tl + 146}
          text="ÉCHANTILLONS"
          start={cues.s(5, 0.8)}
          size={22}
          weight={500}
          spacing="0.24em"
          color={COLORS.warm}
        />
        <SvgText
          x={xs[1]}
          y={tl + 146}
          text="PRODUCTION EN VOLUME"
          start={cues.s(6, 1.4)}
          size={22}
          weight={500}
          spacing="0.24em"
          color={COLORS.accent}
        />
      </Svg>
      <FadeIn
        start={cues.s(6)}
        style={{
          position: "absolute",
          top: tl - 90,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(28, 300), color: COLORS.ink }}>
          Deux étapes différentes
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Axe horizontal avec pointe.
const Arrow2: React.FC<{
  x1: number;
  x2: number;
  y: number;
  start: number;
}> = ({ x1, x2, y, start }) => (
  <g>
    <DrawPath
      d={`M ${x1} ${y} H ${x2}`}
      start={start}
      duration={1}
      stroke={COLORS.inkSoft}
      width={1.5}
    />
    <DrawPath
      d={`M ${x2 - 12} ${y - 8} L ${x2} ${y} L ${x2 - 12} ${y + 8}`}
      start={start + 26}
      duration={0.3}
      stroke={COLORS.inkSoft}
      width={1.5}
    />
  </g>
);

// Réseau : équipement → switch → liaison optique → équipement.
const NY = 520;
const Network: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t9 = cues.s(9);
  const t10 = cues.s(10);
  const t11 = cues.s(11);
  const swX = 640;
  const eoX = 960;
  const oeX = 1380;
  const on = progress(frame, t10 + 20, 0.6);
  const onLight = progress(frame, t11 + 40, 0.6);
  // Paquets : un sur trois part vers la liaison optique, les autres vers d'autres équipements.
  const packets = new Array(9).fill(0).map((_, i) => {
    const ph = ((frame - t10) / FPS / 3 + i / 9) % 1;
    const route = i % 3; // 0 : optique, 1 : haut, 2 : bas
    let x = 0;
    let y = NY;
    if (ph < 0.4) {
      x = 300 + (ph / 0.4) * (swX - 60 - 300);
    } else {
      const q = (ph - 0.4) / 0.6;
      if (route === 0) {
        x = swX + 60 + q * (oeX + 50 - swX - 60);
      } else {
        x = swX + 60 + q * 200;
        y = NY + (route === 1 ? -1 : 1) * q * 150;
      }
    }
    const inLight = route === 0 && x > eoX + 50 && x < oeX - 50;
    return { x, y, inLight, route, ph };
  });
  return (
    <AbsoluteFill>
      <Title text="La coopération entre machines" start={cues.s(8)} />
      <Svg>
        <Icon name="server" x={220} y={NY} size={56} start={t9} />
        <Icon name="server" x={1680} y={NY} size={56} start={t9 + 8} />
        <SvgText
          x={220}
          y={NY + 100}
          text="Équipement"
          start={t9 + 10}
          size={26}
        />
        <SvgText
          x={1680}
          y={NY + 100}
          text="Équipement"
          start={t9 + 16}
          size={26}
        />
        <DrawPath
          d={`M 280 ${NY} H ${swX - 60}`}
          start={t9 + 20}
          duration={0.6}
          stroke={COLORS.inkFaint}
        />
        {/* Switch */}
        <Box
          x={swX - 60}
          y={NY - 60}
          w={120}
          h={120}
          label=""
          start={t10}
          variant="hi"
        />
        <Icon
          name="network"
          x={swX}
          y={NY}
          size={30}
          start={t10 + 8}
          color={COLORS.accent}
        />
        <SvgText
          x={swX}
          y={NY + 100}
          text={"Switch\n(commutateur)"}
          start={t10 + 10}
          size={26}
        />
        <DrawPath
          d={`M ${swX + 60} ${NY - 20} L ${swX + 260} ${NY - 170}`}
          start={t10 + 14}
          duration={0.5}
          stroke={COLORS.inkFaint}
        />
        <DrawPath
          d={`M ${swX + 60} ${NY + 20} L ${swX + 260} ${NY + 170}`}
          start={t10 + 18}
          duration={0.5}
          stroke={COLORS.inkFaint}
        />
        <DrawPath
          d={`M ${swX + 60} ${NY} H ${eoX}`}
          start={t10 + 22}
          duration={0.5}
          stroke={COLORS.inkFaint}
        />
        <SvgText
          x={swX + 280}
          y={NY - 190}
          text="autres équipements"
          start={t10 + 20}
          size={22}
          anchor="start"
          color={COLORS.inkSoft}
        />
        {/* Liaison optique */}
        <Box
          x={eoX}
          y={NY - 40}
          w={100}
          h={80}
          label="É → L"
          start={t11}
          size={22}
        />
        <Box
          x={oeX - 100}
          y={NY - 40}
          w={100}
          h={80}
          label="L → É"
          start={t11 + 30}
          size={22}
        />
        <DrawPath
          d={`M ${eoX + 100} ${NY} H ${oeX - 100}`}
          start={t11 + 10}
          duration={0.9}
          stroke={COLORS.accent}
          width={3}
        />
        <line
          x1={eoX + 100}
          y1={NY}
          x2={oeX - 100}
          y2={NY}
          stroke={COLORS.accent}
          strokeWidth={14}
          opacity={0.12 * onLight}
        />
        <DrawPath
          d={`M ${oeX} ${NY} H 1610`}
          start={t11 + 36}
          duration={0.5}
          stroke={COLORS.inkFaint}
        />
        <SvgText
          x={eoX + 50}
          y={NY + 90}
          text="électrique → lumière"
          start={t11 + 10}
          size={24}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={(eoX + oeX) / 2}
          y={NY - 70}
          text="lumière"
          start={t11 + 20}
          size={26}
          color={COLORS.accent}
        />
        <SvgText
          x={oeX - 50}
          y={NY + 90}
          text="lumière → électrique"
          start={t11 + 36}
          size={24}
          color={COLORS.inkSoft}
        />
        <SvgText
          x={(eoX + oeX) / 2}
          y={NY + 170}
          text="LIAISON OPTIQUE"
          start={t11 + 40}
          size={22}
          weight={500}
          spacing="0.26em"
          color={COLORS.accent}
        />
        {packets.map((p, i) => {
          // Après l'optique, le paquet rejoint l'équipement de droite.
          const pastOptic = p.route === 0 && p.x >= oeX + 50;
          if (p.route === 0 && onLight === 0 && p.x > eoX) return null;
          if (pastOptic) return null;
          return p.inLight ? (
            <rect
              key={i}
              x={p.x - 18}
              y={NY - 2}
              width={36}
              height={4}
              rx={2}
              fill={COLORS.accent}
              opacity={onLight}
            />
          ) : (
            <rect
              key={i}
              x={p.x - 7}
              y={p.y - 7}
              width={14}
              height={14}
              rx={2}
              fill="none"
              stroke={p.route === 0 ? COLORS.ink : COLORS.inkSoft}
              strokeWidth={1.6}
              opacity={on}
            />
          );
        })}
        {/* Dernier tronçon vers l'équipement de droite */}
        {new Array(3).fill(0).map((_, i) => {
          const ph = ((frame - t11 - 40) / FPS / 1.5 + i / 3) % 1;
          return (
            <rect
              key={i}
              x={oeX + 10 + ph * (1610 - oeX - 30) - 7}
              y={NY - 7}
              width={14}
              height={14}
              rx={2}
              fill="none"
              stroke={COLORS.ink}
              strokeWidth={1.6}
              opacity={onLight}
            />
          );
        })}
      </Svg>
      <FadeIn
        start={t9}
        style={{
          position: "absolute",
          top: 250,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300), color: COLORS.inkSoft }}>
          Le réseau transporte les informations entre équipements
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Pas de proportion automatique entre calcul et échanges.
const Coupling: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(12);
  const ox = 320;
  const oy = 800;
  const W = 620;
  const H = 400;
  const curves = [
    `M ${ox} ${oy} C ${ox + 200} ${oy - 40}, ${ox + 420} ${oy - 120}, ${ox + W} ${oy - H * 0.95}`,
    `M ${ox} ${oy} C ${ox + 200} ${oy - 160}, ${ox + 400} ${oy - 200}, ${ox + W} ${oy - H * 0.55}`,
    `M ${ox} ${oy} C ${ox + 240} ${oy - 40}, ${ox + 420} ${oy - 70}, ${ox + W} ${oy - H * 0.22}`,
  ];
  const factors = ["le modèle", "la répartition des tâches", "le logiciel"];
  return (
    <AbsoluteFill>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 150,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(40, 300)}>
          Plus de calcul <span style={{ color: COLORS.accent }}>→</span> des
          échanges plus importants
        </div>
      </FadeIn>
      <FadeIn
        start={cues.s(12, 2.6)}
        style={{
          position: "absolute",
          top: 222,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(32, 300), color: COLORS.warm }}>
          … si le travail réclame davantage de communication
        </div>
      </FadeIn>
      <Svg>
        <DrawPath
          d={`M ${ox} ${oy - H - 20} V ${oy} H ${ox + W + 30}`}
          start={t + 20}
          duration={1}
          stroke={COLORS.inkSoft}
          width={1.5}
        />
        <SvgText
          x={ox + W + 30}
          y={oy + 34}
          text="calcul"
          start={t + 30}
          size={24}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <SvgText
          x={ox - 16}
          y={oy - H - 30}
          text="échanges"
          start={t + 30}
          size={24}
          anchor="start"
          color={COLORS.inkSoft}
        />
        {curves.map((d, i) => (
          <DrawPath
            key={i}
            d={d}
            start={cues.s(13, 0.4 + i * 1.1)}
            duration={1}
            stroke={COLORS.accent}
            width={2}
          />
        ))}
        {/* La droite « proportionnelle » est barrée. */}
        <path
          d={`M ${ox} ${oy} L ${ox + W} ${oy - H}`}
          stroke={COLORS.inkSoft}
          strokeWidth={1.5}
          strokeDasharray="8 10"
          fill="none"
          opacity={progress(frame, cues.s(14), 0.6)}
        />
        <DrawPath
          d={icons.cross(ox + W * 0.62, oy - H * 0.62, 26)}
          start={cues.s(14, 0.5)}
          duration={0.5}
          stroke={COLORS.warm}
          width={3}
        />
      </Svg>
      <FadeIn
        start={cues.s(13)}
        style={{ position: "absolute", left: 1100, top: 400, width: 640 }}
      >
        <div style={label()}>LE LIEN DÉPEND DE</div>
      </FadeIn>
      {factors.map((f, i) => (
        <FadeIn
          key={f}
          start={cues.s(13, 0.4 + i * 1.1)}
          style={{
            position: "absolute",
            left: 1100,
            top: 460 + i * 64,
            width: 640,
          }}
        >
          <div style={{ ...textStyle(34, 300) }}>
            <span style={{ color: COLORS.accent }}>— </span>
            {f}
          </div>
        </FadeIn>
      ))}
      <FadeIn
        start={cues.s(14)}
        style={{ position: "absolute", left: 1100, top: 700, width: 640 }}
      >
        <div style={{ ...textStyle(34, 300), color: COLORS.warm }}>
          Ce n’est pas une proportion automatique.
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 20 — HBM, fait publié Micron, puis coopération entre machines.
export const S20: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(3)}>
        <HBM />
      </Stage>
      <Stage from={cues.s(3)} to={cues.s(8)}>
        <Fact />
      </Stage>
      <Stage from={cues.s(8)} to={cues.s(12)}>
        <Network />
      </Stage>
      <Stage from={cues.s(12)}>
        <Coupling />
      </Stage>
    </AbsoluteFill>
  );
};
