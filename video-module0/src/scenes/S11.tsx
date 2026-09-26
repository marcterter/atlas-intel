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
import { COLORS, FPS } from "../theme";

const accentA = (a: number) => `rgba(143, 208, 255, ${a})`;

type Obj = { term: string; def: string; why: string };
const OBJS: Obj[] = [
  {
    term: "Interposer",
    def: "Couche intermédiaire d’interconnexion, dans certaines architectures",
    why: "Permet de nombreuses connexions fines entre dies",
  },
  {
    term: "Substrat de boîtier",
    def: "Support électrique et mécanique du package",
    why: "Relie les connexions fines des puces à la carte",
  },
  {
    term: "PCB",
    def: "Printed Circuit Board ou circuit imprimé",
    why: "Porte composants et pistes conductrices à l’échelle d’une carte",
  },
  {
    term: "Serveur",
    def: "Machine comprenant processeurs, mémoires et autres éléments",
    why: "Exécute les tâches",
  },
  {
    term: "Rack et cluster",
    def: "Baie d’équipements et ensemble de machines interconnectées",
    why: "Organisent les ressources et permettent de répartir les travaux",
  },
];

const Card: React.FC<{ obj: Obj; a: number; b: number }> = ({ obj, a, b }) => (
  <div style={{ position: "absolute", top: 330, left: 1040, width: 740 }}>
    <FadeIn start={a}>
      <div style={textStyle(58, 200)}>{obj.term}</div>
    </FadeIn>
    <FadeIn start={a + 12} style={{ marginTop: 36 }}>
      <div
        style={{
          ...textStyle(20, 500),
          color: COLORS.inkSoft,
          letterSpacing: "0.28em",
          marginBottom: 10,
        }}
      >
        DÉFINITION
      </div>
      <div style={{ ...textStyle(32, 300), lineHeight: 1.35 }}>{obj.def}</div>
    </FadeIn>
    <FadeIn start={b} style={{ marginTop: 34 }}>
      <div
        style={{
          ...textStyle(20, 500),
          color: COLORS.inkSoft,
          letterSpacing: "0.28em",
          marginBottom: 10,
        }}
      >
        {obj.term === "Rack et cluster"
          ? "POURQUOI ILS COMPTENT"
          : "POURQUOI IL COMPTE"}
      </div>
      <div
        style={{
          ...textStyle(32, 300),
          lineHeight: 1.35,
          color: COLORS.accent,
        }}
      >
        {obj.why}
      </div>
    </FadeIn>
  </div>
);

const Strip: React.FC<{ starts: number[] }> = ({ starts }) => {
  const frame = useCurrentFrame();
  const cues = useCues();
  const s0 = cues.s(0) + 10;
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  return (
    <div
      style={{
        position: "absolute",
        top: 205,
        width: "100%",
        display: "flex",
        justifyContent: "center",
        gap: 20,
      }}
    >
      {OBJS.map((o, i) => (
        <React.Fragment key={o.term}>
          {i > 0 && (
            <span
              style={{
                ...textStyle(22, 300),
                color: COLORS.inkFaint,
                opacity: progress(frame, s0 + i * 3, 0.4),
              }}
            >
              →
            </span>
          )}
          <span
            style={{
              ...textStyle(22, 500),
              letterSpacing: "0.16em",
              color: i === current ? COLORS.accent : COLORS.inkSoft,
              opacity:
                progress(frame, s0 + i * 3, 0.4) * (i === current ? 1 : 0.6),
            }}
          >
            {o.term.toUpperCase()}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
};

// Empilement en coupe : dies → interposer → substrat → PCB, qui se construit.
const StackView: React.FC<{ st: number[]; wh: number[] }> = ({ st, wh }) => {
  const frame = useCurrentFrame();
  const current = st.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  const col = (i: number) => (current === i ? COLORS.accent : COLORS.inkSoft);
  const a = st[0];
  const micro = new Array(12).fill(0).map((_, i) => 345 + i * 28);
  const c4 = new Array(10).fill(0).map((_, i) => 320 + i * 42);
  const balls = new Array(10).fill(0).map((_, i) => 272 + i * 53);
  const fine = progress(frame, wh[0], 1.2);
  return (
    <g>
      {/* Dies : processeur et pile mémoire */}
      <path d={roundRectPath(330, 390, 200, 70, 6)} fill={accentA(0.08)} />
      <DrawPath
        d={roundRectPath(330, 390, 200, 70, 6)}
        start={a - 10}
        duration={0.6}
        stroke={COLORS.ink}
      />
      <SvgText x={430} y={425} text="die" start={a - 4} size={22} />
      {[0, 1, 2, 3].map((k) => (
        <DrawPath
          key={k}
          d={roundRectPath(560, 380 + k * 20, 130, 16, 3)}
          start={a - 6 + k * 3}
          duration={0.4}
          stroke={COLORS.ink}
          width={1.4}
        />
      ))}
      <SvgText
        x={625}
        y={355}
        text="mémoire"
        start={a}
        size={22}
        color={COLORS.inkSoft}
      />
      {micro.map((x, i) =>
        x > 530 && x < 560 ? null : (
          <circle
            key={i}
            cx={x}
            cy={468}
            r={4}
            fill={COLORS.warm}
            opacity={progress(frame, a + i, 0.3)}
          />
        ),
      )}
      {/* Interposer */}
      <path
        d={roundRectPath(300, 476, 420, 30, 4)}
        fill={current === 0 ? accentA(0.18) : "none"}
      />
      <DrawPath
        d={roundRectPath(300, 476, 420, 30, 4)}
        start={a + 8}
        duration={0.7}
        stroke={col(0)}
      />
      {fine > 0 &&
        [0, 1, 2].map((k) => (
          <path
            key={k}
            d={`M ${470 + k * 18} 468 V ${482 + k * 7} H ${580 + k * 22} V 468`}
            stroke={COLORS.accent}
            strokeWidth={1.4}
            fill="none"
            opacity={fine}
          />
        ))}
      {/* Substrat de boîtier */}
      {c4.map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={516}
          r={6}
          fill="none"
          stroke={COLORS.warm}
          strokeWidth={1.4}
          opacity={progress(frame, st[1] + i, 0.3)}
        />
      ))}
      <path
        d={roundRectPath(250, 526, 520, 56, 6)}
        fill={current === 1 ? accentA(0.14) : "none"}
        opacity={progress(frame, st[1], 0.5)}
      />
      <DrawPath
        d={roundRectPath(250, 526, 520, 56, 6)}
        start={st[1]}
        duration={0.8}
        stroke={col(1)}
      />
      {progress(frame, wh[1], 0.8) > 0 &&
        [0, 1, 2, 3, 4].map((k) => (
          <path
            key={k}
            d={`M ${340 + k * 80} 530 L ${300 + k * 105} 578`}
            stroke={COLORS.accent}
            strokeWidth={1.2}
            opacity={progress(frame, wh[1] + k * 4, 0.5)}
          />
        ))}
      {/* PCB */}
      {balls.map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={596}
          r={11}
          fill="none"
          stroke={COLORS.warm}
          strokeWidth={1.6}
          opacity={progress(frame, st[2] + i, 0.3)}
        />
      ))}
      <path
        d={roundRectPath(150, 610, 720, 50, 6)}
        fill={current === 2 ? accentA(0.14) : "none"}
        opacity={progress(frame, st[2], 0.5)}
      />
      <DrawPath
        d={roundRectPath(150, 610, 720, 50, 6)}
        start={st[2]}
        duration={0.9}
        stroke={col(2)}
      />
      {/* Autres composants et pistes sur la carte */}
      <DrawPath
        d={roundRectPath(165, 560, 60, 50, 4)}
        start={st[2] + 20}
        duration={0.4}
        stroke={COLORS.inkSoft}
      />
      <DrawPath
        d={roundRectPath(795, 575, 60, 35, 4)}
        start={st[2] + 24}
        duration={0.4}
        stroke={COLORS.inkSoft}
      />
      <DrawPath
        d="M 195 640 H 520 M 540 632 H 825"
        start={st[2] + 30}
        duration={0.8}
        stroke={COLORS.accent}
        width={1.4}
      />
      {/* Légendes */}
      {[
        { y: 491, t: "interposer", i: 0 },
        { y: 554, t: "substrat", i: 1 },
        { y: 635, t: "PCB", i: 2 },
      ].map((l) => (
        <SvgText
          key={l.t}
          x={884}
          y={l.y}
          text={l.t}
          start={st[l.i] + 10}
          size={22}
          anchor="start"
          color={col(l.i)}
        />
      ))}
    </g>
  );
};

// Serveur vu de dessus : processeurs, mémoires, autres éléments.
const Server: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const frame = useCurrentFrame();
  const busy = frame > b;
  return (
    <g>
      <DrawPath
        d={roundRectPath(180, 340, 680, 420, 16)}
        start={a}
        duration={1}
        stroke={COLORS.ink}
      />
      {[0, 1].map((k) => (
        <g key={k}>
          <Icon
            name="chip"
            x={330 + k * 200}
            y={470}
            size={56}
            start={a + 14 + k * 6}
            color={COLORS.accent}
          />
          {busy && (
            <path
              d={roundRectPath(330 + k * 200 - 42, 428, 84, 84, 6)}
              fill={accentA(
                0.15 + 0.2 * Math.abs(Math.sin((frame - b) / 8 + k)),
              )}
            />
          )}
        </g>
      ))}
      <SvgText
        x={430}
        y={570}
        text="processeurs"
        start={a + 24}
        size={22}
        color={COLORS.accent}
      />
      {[0, 1, 2, 3, 4, 5].map((k) => (
        <DrawPath
          key={k}
          d={roundRectPath(
            680 + (k % 2) * 60,
            390 + Math.floor(k / 2) * 60,
            40,
            44,
            3,
          )}
          start={a + 28 + k * 3}
          duration={0.4}
          stroke={COLORS.ink}
          width={1.4}
        />
      ))}
      <SvgText
        x={730}
        y={590}
        text="mémoires"
        start={a + 34}
        size={22}
        color={COLORS.inkSoft}
      />
      {[0, 1, 2].map((k) => (
        <DrawPath
          key={k}
          d={circlePath(290 + k * 110, 664, 30)}
          start={a + 40 + k * 4}
          duration={0.5}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
      ))}
      <DrawPath
        d={roundRectPath(660, 650, 160, 64, 6)}
        start={a + 48}
        duration={0.5}
        stroke={COLORS.inkSoft}
        width={1.4}
      />
      <SvgText
        x={740}
        y={682}
        text="alim."
        start={a + 52}
        size={22}
        color={COLORS.inkSoft}
      />
      <SvgText
        x={400}
        y={735}
        text="ventilation, réseau…"
        start={a + 52}
        size={22}
        color={COLORS.inkSoft}
      />
    </g>
  );
};

// Racks interconnectés : le travail est réparti entre les machines.
const Cluster: React.FC<{ a: number; b: number }> = ({ a, b }) => {
  const frame = useCurrentFrame();
  const xs = [210, 440, 670];
  return (
    <g>
      {xs.map((x, k) => (
        <g key={k}>
          <DrawPath
            d={roundRectPath(x, 400, 160, 300, 8)}
            start={a + k * 6}
            duration={0.7}
            stroke={COLORS.ink}
          />
          {[0, 1, 2, 3, 4].map((j) => (
            <path
              key={j}
              d={roundRectPath(x + 16, 416 + j * 56, 128, 42, 4)}
              fill={
                frame > b &&
                Math.floor((frame - b) / 10 + j * 1.7 + k * 2.3) % 4 === 0
                  ? accentA(0.35)
                  : "none"
              }
              stroke={COLORS.inkSoft}
              strokeWidth={1.2}
              opacity={progress(frame, a + 10 + k * 6 + j * 2, 0.3)}
            />
          ))}
        </g>
      ))}
      {/* Réseau commun */}
      <DrawPath
        d="M 290 360 H 750 M 290 360 V 400 M 520 360 V 400 M 750 360 V 400"
        start={a + 40}
        duration={0.9}
        stroke={COLORS.accent}
      />
      <SvgText
        x={520}
        y={330}
        text="CLUSTER"
        start={a + 50}
        size={22}
        weight={500}
        spacing="0.28em"
        color={COLORS.accent}
      />
      <SvgText
        x={290}
        y={740}
        text="rack"
        start={a + 20}
        size={22}
        color={COLORS.inkSoft}
      />
      {/* Travaux répartis : des paquets descendent vers chaque rack. */}
      {frame > b &&
        xs.map((x, k) => {
          const period = 36;
          const p = (((frame - b + k * 12) % period) + period) % period;
          const t = p / period;
          const px = 520 + (x + 80 - 520) * t;
          return (
            <circle
              key={k}
              cx={px}
              cy={360}
              r={6}
              fill={COLORS.warm}
              opacity={Math.min(1, (frame - b) / 10)}
            />
          );
        })}
    </g>
  );
};

// Scène 11 — Les objets de la fabrication au serveur (2/2).
export const S11: React.FC = () => {
  const cues = useCues();
  const st = [1, 3, 5, 6, 8].map((i) => cues.s(i));
  const wh = [2, 4, 5.5, 7, 9].map((i) =>
    Number.isInteger(i) ? cues.s(i) : cues.s(5, 3),
  );
  const ends = [...st.slice(1), cues.end + FPS];
  return (
    <AbsoluteFill>
      <Title
        kicker="Les objets (suite)"
        text="De la fabrication au serveur"
        top={100}
        start={cues.s(0)}
      />
      <Strip starts={st} />
      <Stage from={st[0] - 10} to={st[3]}>
        <Svg>
          <StackView st={st.slice(0, 3)} wh={wh} />
        </Svg>
      </Stage>
      <Stage from={st[3]} to={st[4]}>
        <Svg>
          <Server a={st[3]} b={wh[3]} />
        </Svg>
      </Stage>
      <Stage from={st[4]}>
        <Svg>
          <Cluster a={st[4]} b={wh[4]} />
        </Svg>
      </Stage>
      {OBJS.map((o, i) => (
        <Stage key={o.term} from={st[i]} to={ends[i]}>
          <Card obj={o} a={st[i]} b={wh[i]} />
        </Stage>
      ))}
    </AbsoluteFill>
  );
};
