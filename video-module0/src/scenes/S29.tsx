import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Box, Icon, Link, Svg, SvgText, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT, FPS } from "../theme";

const small = (color: string): React.CSSProperties => ({
  ...textStyle(18, 500),
  color,
  letterSpacing: "0.28em",
  marginBottom: 14,
});

// 1 — Schéma CPO : puce et moteurs optiques dans un même assemblage.
const Cpo: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(1);
  const e = cues.s(2);
  const engines = [
    { x: 250, y: 495 },
    { x: 700, y: 495 },
  ];
  const light = progress(frame, t + FPS * 4, 3);
  return (
    <AbsoluteFill>
      <Svg>
        {/* Assemblage */}
        <DrawPath
          d={roundRectPath(200, 340, 620, 380, 20)}
          start={t}
          duration={1.2}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        <SvgText
          x={510}
          y={690}
          text="même assemblage"
          start={t + 20}
          size={22}
          color={COLORS.inkSoft}
          spacing="0.08em"
        />
        {/* Puce */}
        <DrawPath
          d={roundRectPath(430, 450, 160, 160, 8)}
          start={t + 12}
          duration={0.9}
          stroke={COLORS.ink}
        />
        <SvgText x={510} y={530} text="puce" start={t + 20} size={26} />
        {engines.map((m, i) => (
          <g key={i}>
            <DrawPath
              d={roundRectPath(m.x, m.y, 70, 70, 6)}
              start={t + FPS * (1.5 + i * 0.4)}
              duration={0.7}
              stroke={COLORS.accent}
            />
            {/* Liaisons électriques courtes */}
            <DrawPath
              d={
                i === 0
                  ? "M 320 515 H 430 M 320 545 H 430"
                  : "M 590 515 H 700 M 590 545 H 700"
              }
              start={e + 10}
              duration={0.6}
              stroke={COLORS.warm}
            />
            {/* Fibres optiques vers l'extérieur */}
            <DrawPath
              d={
                i === 0
                  ? "M 250 530 C 200 530, 190 600, 150 600"
                  : "M 770 530 C 820 530, 830 600, 870 600"
              }
              start={t + FPS * 2.4}
              duration={0.8}
              stroke={COLORS.accent}
            />
          </g>
        ))}
        {light > 0 && light < 1 && (
          <>
            <circle
              cx={250 - light * 100}
              cy={530 + light * 70}
              r={4}
              fill={COLORS.accent}
            />
            <circle
              cx={770 + light * 100}
              cy={530 + light * 70}
              r={4}
              fill={COLORS.accent}
            />
          </>
        )}
        <SvgText
          x={285}
          y={420}
          text="optique"
          start={t + FPS * 2}
          size={22}
          color={COLORS.accent}
        />
        <SvgText
          x={735}
          y={420}
          text="optique"
          start={t + FPS * 2.2}
          size={22}
          color={COLORS.accent}
        />
        <SvgText
          x={510}
          y={400}
          text="liaisons électriques raccourcies"
          start={e + 20}
          size={22}
          color={COLORS.warm}
        />
      </Svg>
      <div style={{ position: "absolute", left: 950, top: 330, width: 800 }}>
        <FadeIn start={t}>
          <div style={small(COLORS.accent)}>DÉFINITION</div>
          <div style={{ ...textStyle(30, 300), lineHeight: 1.4 }}>
            Des fonctions optiques intégrées au voisinage d’une puce, dans un
            même assemblage.
          </div>
        </FadeIn>
        <FadeIn start={e} style={{ marginTop: 26 }}>
          <div style={{ ...textStyle(30, 300), lineHeight: 1.4 }}>
            <span style={{ color: COLORS.warm }}>But :</span> réduire certaines
            liaisons électriques rapides et leurs contraintes.
          </div>
        </FadeIn>
        <FadeIn start={cues.s(3)} style={{ marginTop: 40 }}>
          <div style={small(COLORS.accent)}>FAIT PUBLIÉ · SOURCE 8</div>
          <div style={{ ...textStyle(30, 300), lineHeight: 1.4 }}>
            Broadcom présente déjà des produits fondés sur cette approche.
          </div>
        </FadeIn>
        <FadeIn start={cues.s(4)} style={{ marginTop: 18 }}>
          <div
            style={{
              ...textStyle(30, 300),
              lineHeight: 1.4,
              color: COLORS.warm,
            }}
          >
            Leur existence ne prouve pas une adoption universelle.
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

// 2 — La chaîne causale, en serpentin.
const CHAIN = [
  "Davantage de\ncommunication",
  "Distances et\ndébits requis",
  "Choix cuivre\nou optique",
  "Architecture\ndes modules",
  "Composants\nnécessaires",
  "Fournisseurs\nqualifiés",
  "Revenus",
];
const BW = 330;
const BH = 100;
const POS: [number, number][] = [
  [170, 360],
  [580, 360],
  [990, 360],
  [1400, 360],
  [1400, 600],
  [990, 600],
  [580, 600],
];

const Chain: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = CHAIN.map((_, i) => cues.s(6, 3.0 + i * 1.6));
  // Centres des boîtes et points de sortie/entrée.
  const c = POS.map(([x, y]) => [x + BW / 2, y + BH / 2] as [number, number]);
  const pts = c;
  const run = progress(frame, starts[6] + 20, 4);
  const seg = run * (pts.length - 1);
  const k = Math.min(pts.length - 2, Math.floor(seg));
  const f = seg - k;
  const px = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f;
  const py = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f;
  return (
    <AbsoluteFill>
      <FadeIn
        start={cues.s(6)}
        style={{
          position: "absolute",
          top: 250,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...small(COLORS.inkSoft), marginBottom: 0 }}>
          LA CHAÎNE À RECONSTRUIRE POUR TA CONVICTION
        </div>
      </FadeIn>
      <Svg>
        {CHAIN.map((label, i) => {
          const [x, y] = POS[i];
          return (
            <Box
              key={label}
              x={x}
              y={y}
              w={BW}
              h={BH}
              label={label}
              start={starts[i]}
              size={26}
              variant={i === 6 ? "hi" : i === 2 ? "side" : "default"}
            />
          );
        })}
        {CHAIN.slice(0, -1).map((_, i) => {
          const [x, y] = POS[i];
          const [nx, ny] = POS[i + 1];
          const from: [number, number] =
            ny > y
              ? [x + BW / 2, y + BH]
              : nx > x
                ? [x + BW, y + BH / 2]
                : [x, y + BH / 2];
          const to: [number, number] =
            ny > y
              ? [nx + BW / 2, ny]
              : nx > x
                ? [nx, ny + BH / 2]
                : [nx + BW, ny + BH / 2];
          return (
            <Link
              key={i}
              from={from}
              to={to}
              start={starts[i + 1] - 8}
              gap={6}
            />
          );
        })}
        {run > 0 && run < 1 && (
          <circle cx={px} cy={py} r={6} fill={COLORS.accent} opacity={0.9} />
        )}
        <SvgText
          x={335}
          y={650}
          text="donc…"
          start={starts[6] + 10}
          size={24}
          color={COLORS.inkSoft}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// 3 — Le marché total grandit, mais une fonction disparaît chez un fournisseur.
const Market: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(7, 1.5);
  const grow = progress(frame, t + FPS * 1.2, 2);
  const shrink = grow;
  const X = 440;
  const before = [
    { w: 360, label: "modules", color: COLORS.ink },
    { w: 260, label: "fonction X", color: COLORS.warm },
    { w: 240, label: "autres", color: COLORS.inkSoft },
  ];
  const after = [
    { w: 360 + 100 * grow, label: "modules", color: COLORS.ink },
    { w: 260 * (1 - shrink), label: "", color: COLORS.warm },
    { w: 240 + 60 * grow, label: "autres", color: COLORS.inkSoft },
    { w: 420 * grow, label: "nouveaux contenus", color: COLORS.accent },
  ];
  const row = (
    segs: { w: number; label: string; color: string }[],
    y: number,
    o: number,
  ) => {
    let x = X;
    return segs.map((s, i) => {
      const x0 = x;
      x += s.w;
      if (s.w < 2) return null;
      return (
        <g key={i} opacity={o}>
          <path
            d={roundRectPath(x0 + 3, y, s.w - 6, 56, 6)}
            fill={s.color}
            opacity={0.16}
          />
          <path
            d={roundRectPath(x0 + 3, y, s.w - 6, 56, 6)}
            fill="none"
            stroke={s.color}
            strokeWidth={1.5}
          />
          {s.w > 150 && s.label && (
            <text
              x={x0 + s.w / 2}
              y={y + 36}
              textAnchor="middle"
              fontFamily={FONT}
              fontWeight={300}
              fontSize={24}
              fill={s.color}
            >
              {s.label}
            </text>
          )}
        </g>
      );
    });
  };
  const oB = progress(frame, t, 0.6);
  const oA = progress(frame, t + FPS * 1.5, 0.6);
  return (
    <AbsoluteFill>
      <FadeIn
        start={t}
        style={{ position: "absolute", left: 160, top: 260, width: 1600 }}
      >
        <div style={small(COLORS.warm)}>POINT ANALYSTE</div>
        <div style={{ ...textStyle(32, 300), lineHeight: 1.4 }}>
          Une nouvelle architecture peut{" "}
          <span style={{ color: COLORS.accent }}>
            agrandir le marché optique total
          </span>{" "}
          tout en{" "}
          <span style={{ color: COLORS.warm }}>
            supprimant une fonction chez un fournisseur particulier
          </span>
          .
        </div>
      </FadeIn>
      <Svg>
        <SvgText
          x={400}
          y={508}
          text="Aujourd’hui"
          start={t}
          size={26}
          anchor="end"
          color={COLORS.inkSoft}
        />
        <SvgText
          x={400}
          y={668}
          text="Nouvelle architecture"
          start={t + FPS * 1.5}
          size={26}
          anchor="end"
          color={COLORS.inkSoft}
        />
        {row(before, 480, oB)}
        {row(after, 640, oA)}
        <SvgText
          x={X + 460}
          y={740}
          text="fonction X supprimée"
          start={t + FPS * 3.2}
          size={24}
          color={COLORS.warm}
        />
        <DrawPath
          d={`M ${X} 720 V 710 M ${X} 715 H ${X + 1180 * Math.max(grow, 0.01)}`}
          start={t + FPS * 1.2}
          duration={0.3}
          stroke={COLORS.inkFaint}
          width={1}
        />
        <SvgText
          x={X + 1180}
          y={750}
          text="marché total ↑"
          start={t + FPS * 3.2}
          size={24}
          color={COLORS.accent}
          anchor="end"
        />
      </Svg>
    </AbsoluteFill>
  );
};

// 4 — Trois signaux.
const SIGNALS = [
  {
    title: "Qualification",
    icon: "check" as const,
    lines: [
      "démontré ?",
      "testé par un client ?",
      "validé pour un déploiement ?",
    ],
  },
  {
    title: "Industrialisation",
    icon: "factory" as const,
    lines: [
      "Quelle capacité fonctionne",
      "effectivement ?",
      "Avec quel rendement ?",
    ],
  },
  {
    title: "Valeur",
    icon: "euro" as const,
    lines: [
      "Quel composant gagne ou perd",
      "du contenu par système ?",
      "À quel prix ?",
    ],
  },
];
const SX = [420, 960, 1500];

const Signals: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = [cues.s(9), cues.s(10), cues.s(11)];
  return (
    <AbsoluteFill>
      <FadeIn
        start={cues.s(8)}
        style={{
          position: "absolute",
          top: 250,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(40, 200)}>Trois signaux à surveiller</div>
      </FadeIn>
      <Svg>
        {SIGNALS.map((s, i) => (
          <g key={s.title}>
            <Icon
              name={s.icon}
              x={SX[i]}
              y={420}
              size={36}
              start={starts[i]}
              color={COLORS.accent}
            />
            <SvgText
              x={SX[i]}
              y={505}
              text={s.title}
              start={starts[i] + 8}
              size={34}
              weight={300}
            />
            {i === 0 ? (
              // Échelle de qualification : trois marches.
              s.lines.map((l, j) => (
                <g key={l}>
                  <circle
                    cx={SX[i] - 170}
                    cy={590 + j * 64}
                    r={6}
                    fill={j === 2 ? COLORS.accent : "none"}
                    stroke={j === 2 ? COLORS.accent : COLORS.inkSoft}
                    strokeWidth={1.5}
                    opacity={progress(frame, cues.s(9, 1.6 + j * 1.3), 0.5)}
                  />
                  <SvgText
                    x={SX[i] - 145}
                    y={590 + j * 64}
                    text={l}
                    start={cues.s(9, 1.6 + j * 1.3)}
                    size={28}
                    anchor="start"
                    color={j === 2 ? COLORS.accent : COLORS.ink}
                  />
                </g>
              ))
            ) : (
              <SvgText
                x={SX[i]}
                y={640}
                text={s.lines.join("\n")}
                start={starts[i] + 14}
                size={28}
                color={COLORS.ink}
                lineHeight={1.5}
              />
            )}
          </g>
        ))}
        <DrawPath
          d={`M ${SX[0] - 170} 596 V 718`}
          start={cues.s(9, 1.6)}
          duration={2.6}
          stroke={COLORS.inkFaint}
          width={1}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Scène 29 — Le cas de la photonique.
export const S29: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Title
        kicker="CPO · Co-Packaged Optics"
        text="Le cas de la photonique"
        start={cues.s(0)}
        top={100}
      />
      <Stage from={cues.s(1)} to={cues.s(6)}>
        <Cpo />
      </Stage>
      <Stage from={cues.s(6)} to={cues.s(7, 1.5)}>
        <Chain />
      </Stage>
      <Stage from={cues.s(7, 1.5)} to={cues.s(8)}>
        <Market />
      </Stage>
      <Stage from={cues.s(8)}>
        <Signals />
      </Stage>
    </AbsoluteFill>
  );
};
