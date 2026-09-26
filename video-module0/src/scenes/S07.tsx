import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { circlePath, roundRectPath } from "../components/icons";
import { Icon, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

const accentA = (a: number) => `rgba(143, 208, 255, ${a})`;
const warmA = (a: number) => `rgba(255, 211, 138, ${a})`;

const XS = [440, 960, 1480];
const DY = 240; // haut des schémas
const DS = 250; // taille des schémas

// CPU : quelques gros cœurs polyvalents, activés tour à tour.
const CpuCores: React.FC<{ cx: number; start: number }> = ({ cx, start }) => {
  const frame = useCurrentFrame();
  const size = 108;
  const gap = 20;
  const x0 = cx - size - gap / 2;
  const active = Math.floor(Math.max(0, frame - start - 20) / 12) % 4;
  return (
    <g>
      {[0, 1, 2, 3].map((i) => {
        const x = x0 + (i % 2) * (size + gap);
        const y = DY + 8 + Math.floor(i / 2) * (size + gap);
        const on = frame > start + 20 && i === active;
        return (
          <g key={i}>
            <path
              d={roundRectPath(x, y, size, size, 10)}
              fill={on ? accentA(0.28) : "none"}
            />
            <DrawPath
              d={roundRectPath(x, y, size, size, 10)}
              start={start + i * 4}
              duration={0.6}
              stroke={COLORS.ink}
            />
          </g>
        );
      })}
    </g>
  );
};

// GPU : une grille de nombreux petits cœurs qui travaillent en parallèle.
const GpuCores: React.FC<{ cx: number; start: number }> = ({ cx, start }) => {
  const frame = useCurrentFrame();
  const n = 12;
  const step = DS / n;
  const x0 = cx - DS / 2;
  const cells = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const idx = r * n + c;
      const appear = progress(frame, start + (r + c) * 1.2, 0.3);
      const wave = Math.sin((frame - start) / 7 - (r + c) * 0.18);
      const lit = frame > start + 40 ? 0.15 + 0.6 * Math.max(0, wave) : 0.15;
      cells.push(
        <rect
          key={idx}
          x={x0 + c * step + 2}
          y={DY + r * step + 2}
          width={step - 5}
          height={step - 5}
          rx={2}
          fill={accentA(lit)}
          stroke={COLORS.accent}
          strokeWidth={0.8}
          opacity={appear}
        />,
      );
    }
  }
  return <g>{cells}</g>;
};

// ASIC : un circuit dessiné autour d'un grand bloc dédié à une tâche.
const AsicBlocks: React.FC<{ cx: number; start: number }> = ({ cx, start }) => {
  const frame = useCurrentFrame();
  const x0 = cx - DS / 2;
  const pulse = 0.18 + 0.14 * Math.sin((frame - start) / 9);
  const blocks = [
    { x: 0, y: 0, w: 170, h: 170, main: true },
    { x: 185, y: 0, w: 65, h: 80 },
    { x: 185, y: 90, w: 65, h: 80 },
    { x: 0, y: 185, w: 120, h: 65 },
    { x: 130, y: 185, w: 120, h: 65 },
  ];
  return (
    <g>
      {blocks.map((b, i) => (
        <g key={i}>
          {b.main && frame > start + 20 && (
            <path
              d={roundRectPath(x0 + b.x, DY + b.y, b.w, b.h, 10)}
              fill={warmA(pulse)}
            />
          )}
          <DrawPath
            d={roundRectPath(x0 + b.x, DY + b.y, b.w, b.h, 10)}
            start={start + i * 5}
            duration={0.6}
            stroke={b.main ? COLORS.warm : COLORS.inkSoft}
          />
        </g>
      ))}
      <SvgText
        x={x0 + 85}
        y={DY + 85}
        text={"tâche\nciblée"}
        start={start + 24}
        size={22}
        weight={400}
        color={COLORS.warm}
      />
    </g>
  );
};

const TYPES = [
  {
    sigle: "CPU",
    en: "Central Processing Unit",
    fr: "Processeur central",
    role: "Tâches générales, coordination et traitement",
  },
  {
    sigle: "GPU",
    en: "Graphics Processing Unit",
    fr: "Processeur graphique",
    role: "Nombreux calculs parallèles, adaptés à une partie des opérations de l’IA",
  },
  {
    sigle: "ASIC",
    en: "Application Specific Integrated Circuit",
    fr: "Circuit spécialisé",
    role: "Conception qui privilégie certaines tâches ou certains besoins",
  },
];

const Types: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = [cues.s(2), cues.s(3), cues.s(4)];
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  return (
    <AbsoluteFill>
      <Title
        kicker="Étape 3"
        text="Les processeurs effectuent les calculs"
        top={110}
        start={cues.s(0)}
      />
      <Svg>
        <CpuCores cx={XS[0]} start={starts[0] + 6} />
        <GpuCores cx={XS[1]} start={starts[1] + 6} />
        <AsicBlocks cx={XS[2]} start={starts[2] + 6} />
      </Svg>
      {TYPES.map((ty, i) => {
        const on = frame >= starts[i];
        const dim = current === -1 || i === current ? 1 : 0.45;
        const ph = progress(frame, cues.s(1, i * 0.2), 0.5);
        return (
          <div
            key={ty.sigle}
            style={{
              position: "absolute",
              top: DY + DS + 36,
              left: XS[i] - 230,
              width: 460,
              textAlign: "center",
              opacity: on ? dim : ph * 0.35,
            }}
          >
            <div
              style={{
                ...textStyle(64, 200),
                color:
                  i === 2 ? COLORS.warm : i === 1 ? COLORS.accent : COLORS.ink,
              }}
            >
              {ty.sigle}
            </div>
            {on && (
              <>
                <FadeIn start={starts[i] + 10}>
                  <div
                    style={{
                      ...textStyle(22, 400),
                      color: COLORS.inkSoft,
                      letterSpacing: "0.04em",
                      marginTop: 6,
                    }}
                  >
                    {ty.en}
                  </div>
                </FadeIn>
                <FadeIn start={starts[i] + 24}>
                  <div style={{ ...textStyle(28, 400), marginTop: 10 }}>
                    {ty.fr}
                  </div>
                </FadeIn>
                <FadeIn start={starts[i] + 50}>
                  <div
                    style={{
                      ...textStyle(28, 300),
                      lineHeight: 1.35,
                      marginTop: 22,
                    }}
                  >
                    {ty.role}
                  </div>
                </FadeIn>
              </>
            )}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// Les catégories se recouvrent : le GPU est lui-même un circuit spécialisé au sens large.
const Overlap: React.FC = () => {
  const cues = useCues();
  const t = cues.s(5);
  const v = cues.s(6);
  const cy = 580;
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
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.warm,
            letterSpacing: "0.3em",
            marginBottom: 16,
          }}
        >
          ATTENTION
        </div>
        <div style={textStyle(46, 200)}>
          Des catégories, pas des frontières absolues
        </div>
      </FadeIn>
      <Svg>
        <DrawPath
          d={circlePath(960, cy, 290)}
          start={v}
          duration={1.2}
          stroke={COLORS.warm}
        />
        <SvgText
          x={960}
          y={cy - 190}
          text={"CIRCUITS INTÉGRÉS\nSPÉCIALISÉS"}
          start={v + 14}
          size={22}
          weight={500}
          spacing="0.2em"
          color={COLORS.warm}
        />
        <SvgText
          x={960}
          y={cy - 120}
          text="au sens large"
          start={v + 20}
          size={24}
          color={COLORS.inkSoft}
        />
        <DrawPath
          d={circlePath(960, cy + 70, 110)}
          start={v + 30}
          duration={0.9}
          stroke={COLORS.accent}
        />
        <SvgText
          x={960}
          y={cy + 70}
          text="GPU"
          start={v + 44}
          size={48}
          weight={200}
          color={COLORS.accent}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Le langage des analystes : plateformes GPU contre accélérateurs maison des clouds.
const Versus: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(7);
  const panels = [
    {
      x: 240,
      label: "Plateformes GPU",
      sub: "",
      color: COLORS.accent,
      at: cues.s(7, 3),
    },
    {
      x: 1060,
      label: "Accélérateurs personnalisés",
      sub: "des grands clouds",
      color: COLORS.warm,
      at: cues.s(7, 5.2),
    },
  ];
  const vs = progress(frame, cues.s(7, 4.6), 0.5);
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
            color: COLORS.inkSoft,
            letterSpacing: "0.3em",
          }}
        >
          DANS LE LANGAGE DES ANALYSTES IA
        </div>
      </FadeIn>
      <Svg>
        {panels.map((p, i) => (
          <g key={i}>
            <DrawPath
              d={roundRectPath(p.x, 300, 620, 380, 18)}
              start={p.at}
              duration={0.9}
              stroke={p.color}
            />
            {i === 0 ? (
              <g>
                {new Array(24).fill(0).map((_, k) => (
                  <rect
                    key={k}
                    x={p.x + 250 + (k % 6) * 21}
                    y={360 + Math.floor(k / 6) * 21}
                    width={16}
                    height={16}
                    rx={2}
                    fill={accentA(
                      0.2 +
                        0.5 *
                          Math.max(0, Math.sin((frame - p.at) / 7 - k * 0.3)),
                    )}
                    opacity={progress(frame, p.at + 10 + k, 0.3)}
                  />
                ))}
              </g>
            ) : (
              <g>
                <Icon
                  name="cloud"
                  x={p.x + 270}
                  y={400}
                  size={48}
                  start={p.at + 10}
                  color={p.color}
                />
                <Icon
                  name="chip"
                  x={p.x + 370}
                  y={410}
                  size={34}
                  start={p.at + 20}
                  color={p.color}
                />
              </g>
            )}
            <SvgText
              x={p.x + 310}
              y={540}
              text={p.label}
              start={p.at + 16}
              size={36}
              weight={300}
            />
            {p.sub && (
              <SvgText
                x={p.x + 310}
                y={600}
                text={p.sub}
                start={p.at + 26}
                size={28}
                color={COLORS.inkSoft}
              />
            )}
          </g>
        ))}
      </Svg>
      <div
        style={{
          position: "absolute",
          top: 460,
          left: 900,
          width: 120,
          textAlign: "center",
          opacity: vs,
          ...textStyle(40, 200),
          color: COLORS.inkSoft,
        }}
      >
        vs
      </div>
    </AbsoluteFill>
  );
};

// Scène 7 — Étape 3 : CPU, GPU, ASIC.
export const S07: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(5)}>
        <Types />
      </Stage>
      <Stage from={cues.s(5)} to={cues.s(7)}>
        <Overlap />
      </Stage>
      <Stage from={cues.s(7)}>
        <Versus />
      </Stage>
    </AbsoluteFill>
  );
};
