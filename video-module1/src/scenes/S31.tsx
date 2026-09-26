import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Callout, Svg, SvgText, Title } from "../components/kit";
import {
  Arrow,
  DrawPath,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS, FONT, FPS } from "../theme";
import { Flow, SvgCaps, TextAt, accentA, caps, inkA } from "./S23";

const ITEMS = ["FinFET", "GAA", "Isolant high-k", "Chiplets"];

// Fiche de droite : nom, intuition, compromis.
const Card: React.FC<{
  name: string;
  sub?: string;
  idea: React.ReactNode;
  cost: React.ReactNode;
  at: number;
  costAt: number;
}> = ({ name, sub, idea, cost, at, costAt }) => (
  <>
    <TextAt x={1000} y={250} w={780} start={at}>
      <div style={textStyle(54, 200)}>{name}</div>
      {sub && (
        <div
          style={{ ...textStyle(24, 300), color: COLORS.inkSoft, marginTop: 6 }}
        >
          {sub}
        </div>
      )}
    </TextAt>
    <TextAt x={1000} y={400} w={780} start={at + 12}>
      <div style={caps(COLORS.accent)}>INTUITION</div>
      <div style={{ ...textStyle(30, 300), marginTop: 10 }}>{idea}</div>
    </TextAt>
    <TextAt x={1000} y={600} w={780} start={costAt}>
      <div style={caps(COLORS.warm)}>COMPROMIS À ÉTUDIER</div>
      <div style={{ ...textStyle(30, 300), marginTop: 10 }}>{cost}</div>
    </TextAt>
  </>
);

// Flèche courte d'influence de la grille (vers le point x, y, depuis la direction a).
const Ctrl: React.FC<{
  x: number;
  y: number;
  dx: number;
  dy: number;
  start: number;
}> = ({ x, y, dx, dy, start }) => (
  <Arrow
    x1={x - dx * 34}
    y1={y - dy * 34}
    x2={x - dx * 6}
    y2={y - dy * 6}
    start={start}
    duration={0.4}
    stroke={COLORS.accent}
    width={2}
  />
);

// Coupe d'un FinFET (vue perpendiculaire au canal).
const FinFET: React.FC<{
  cx: number;
  start: number;
  s?: number;
  arrows?: boolean;
}> = ({ cx, start, s = 1, arrows = true }) => {
  const frame = useCurrentFrame();
  const base = 640;
  const fw = 60 * s;
  const fh = 200 * s;
  const o = progress(frame, start, 0.6);
  const gx0 = cx - fw / 2 - 40 * s;
  const gx1 = cx + fw / 2 + 40 * s;
  const gt = base - fh - 40 * s;
  const gate = `M ${gx0} ${base} V ${gt} H ${gx1} V ${base} H ${cx + fw / 2 + 8} V ${base - fh - 8} H ${cx - fw / 2 - 8} V ${base} Z`;
  return (
    <g opacity={o}>
      <rect
        x={cx - 170 * s}
        y={base}
        width={340 * s}
        height={70 * s}
        fill="none"
        stroke={COLORS.inkSoft}
        strokeWidth={1.4}
      />
      <rect
        x={cx - fw / 2}
        y={base - fh}
        width={fw}
        height={fh}
        fill={accentA(0.3)}
        stroke={COLORS.accent}
        strokeWidth={1.6}
      />
      <path
        d={gate}
        fill={inkA(0.12)}
        stroke={COLORS.ink}
        strokeWidth={1.8}
        opacity={progress(frame, start + 12, 0.6)}
      />
      {arrows && (
        <>
          <Ctrl
            x={cx - fw / 2}
            y={base - fh / 2}
            dx={1}
            dy={0}
            start={start + 24}
          />
          <Ctrl
            x={cx + fw / 2}
            y={base - fh / 2}
            dx={-1}
            dy={0}
            start={start + 30}
          />
          <Ctrl x={cx} y={base - fh} dx={0} dy={1} start={start + 36} />
        </>
      )}
    </g>
  );
};

const Overview: React.FC = () => {
  const cues = useCues();
  const t = cues.s(1);
  return (
    <AbsoluteFill>
      {ITEMS.map((it, i) => (
        <TextAt
          key={it}
          x={170 + i * 410 + 190}
          y={440}
          w={380}
          start={t + i * 8}
          align="center"
        >
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.accent,
              letterSpacing: "0.2em",
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </div>
          <div style={{ ...textStyle(40, 200), marginTop: 10 }}>{it}</div>
        </TextAt>
      ))}
    </AbsoluteFill>
  );
};

const Nav: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = [1, 2, 3, 4].map((b) => cues.beat(b));
  const cur = starts.reduce((a, s, i) => (frame >= s ? i : a), -1);
  return (
    <div
      style={{
        position: "absolute",
        top: 130,
        left: 0,
        width: "100%",
        justifyContent: "center",
        display: "flex",
        gap: 56,
      }}
    >
      {ITEMS.map((it, i) => (
        <div
          key={it}
          style={{
            ...caps(i === cur ? COLORS.accent : COLORS.inkFaint),
            fontSize: 22,
          }}
        >
          {it.toUpperCase()}
        </div>
      ))}
    </div>
  );
};

const FinStage: React.FC = () => {
  const cues = useCues();
  const t = cues.s(2);
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Svg>
        {/* Planaire, pour comparer */}
        <g opacity={progress(frame, t, 0.6)}>
          <rect
            x={190}
            y={560}
            width={260}
            height={140}
            fill="none"
            stroke={COLORS.inkSoft}
            strokeWidth={1.4}
          />
          <rect
            x={230}
            y={560}
            width={180}
            height={22}
            fill={accentA(0.3)}
            stroke={COLORS.accent}
            strokeWidth={1.4}
          />
          <rect
            x={230}
            y={470}
            width={180}
            height={82}
            rx={4}
            fill={inkA(0.12)}
            stroke={COLORS.ink}
            strokeWidth={1.8}
          />
        </g>
        <Ctrl x={320} y={560} dx={0} dy={1} start={t + 20} />
        <SvgText
          x={320}
          y={740}
          text="planaire : 1 face"
          start={t + 10}
          size={24}
          color={COLORS.inkSoft}
        />
        <FinFET cx={680} start={t + FPS * 1} />
        <SvgText
          x={680}
          y={760}
          text="FinFET : 3 faces"
          start={t + FPS * 1.4}
          size={24}
          color={COLORS.accent}
        />
        <SvgText
          x={770}
          y={390}
          text="grille"
          start={t + FPS * 1.4}
          size={22}
          color={COLORS.ink}
          anchor="start"
        />
        <SvgText
          x={560}
          y={560}
          text="aileron"
          start={t + FPS * 1.6}
          size={22}
          color={COLORS.accent}
          anchor="end"
        />
        <DrawPath
          d="M 568 556 L 655 556"
          start={t + FPS * 1.7}
          duration={0.4}
          stroke={COLORS.accent}
          width={1.2}
        />
        <SvgCaps x={520} y={300} text="coupe à travers le canal" start={t} />
      </Svg>
      <Card
        name="FinFET"
        idea="une grille contrôle un canal en forme d’aileron, sur plusieurs faces"
        cost="fabrication tridimensionnelle ; dimensions très contraintes"
        at={t}
        costAt={cues.s(3)}
      />
    </AbsoluteFill>
  );
};

const GaaStage: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(4);
  const cx = 640;
  const sheets = [440, 520, 600];
  const o = progress(frame, t + 10, 0.6);
  return (
    <AbsoluteFill>
      <Svg>
        <FinFET cx={260} start={t} s={0.7} arrows={false} />
        <SvgText
          x={260}
          y={750}
          text="FinFET : 3 faces"
          start={t + 6}
          size={22}
          color={COLORS.inkSoft}
        />
        {/* Grille qui enveloppe des nappes empilées */}
        <g opacity={o}>
          <rect
            x={cx - 170}
            y={640}
            width={340}
            height={70}
            fill="none"
            stroke={COLORS.inkSoft}
            strokeWidth={1.4}
          />
          <rect
            x={cx - 150}
            y={400}
            width={300}
            height={240}
            rx={6}
            fill={inkA(0.12)}
            stroke={COLORS.ink}
            strokeWidth={1.8}
          />
          {sheets.map((y) => (
            <g key={y}>
              <rect
                x={cx - 110}
                y={y - 8}
                width={220}
                height={44}
                rx={6}
                fill="#0a1a3d"
                stroke={COLORS.inkSoft}
                strokeWidth={1}
              />
              <rect
                x={cx - 100}
                y={y}
                width={200}
                height={28}
                rx={3}
                fill={accentA(0.35)}
                stroke={COLORS.accent}
                strokeWidth={1.4}
              />
            </g>
          ))}
        </g>
        <Ctrl x={cx} y={440} dx={0} dy={1} start={t + 30} />
        <Ctrl x={cx} y={468} dx={0} dy={-1} start={t + 36} />
        <Ctrl x={cx - 100} y={454} dx={1} dy={0} start={t + 42} />
        <Ctrl x={cx + 100} y={454} dx={-1} dy={0} start={t + 48} />
        <SvgText
          x={cx}
          y={750}
          text="GAA : nappes entourées sur 4 faces"
          start={t + 20}
          size={24}
          color={COLORS.accent}
        />
        <SvgText
          x={cx + 170}
          y={380}
          text="grille"
          start={t + 20}
          size={22}
          anchor="start"
        />
      </Svg>
      <Card
        name="GAA"
        sub="Gate All Around"
        idea="la grille entoure le canal, ici des nappes empilées"
        cost="meilleur contrôle électrostatique recherché, avec des procédés plus complexes"
        at={t}
        costAt={cues.s(5)}
      />
    </AbsoluteFill>
  );
};

const HighK: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(6);
  const stacks = [
    { x: 200, tox: 16, name: "SiO₂ très mince", leak: true, at: t + FPS * 0.8 },
    {
      x: 570,
      tox: 60,
      name: "high-k plus épais",
      leak: false,
      at: t + FPS * 3,
    },
  ];
  return (
    <AbsoluteFill>
      <Svg>
        {stacks.map((s) => {
          const o = progress(frame, s.at, 0.6);
          const yG = 330;
          const yO = yG + 110;
          return (
            <g key={s.name} opacity={o}>
              <rect
                x={s.x}
                y={yG}
                width={300}
                height={110}
                rx={6}
                fill="none"
                stroke={COLORS.ink}
                strokeWidth={1.8}
              />
              <rect
                x={s.x}
                y={yO}
                width={300}
                height={s.tox}
                fill={s.leak ? inkA(0.25) : accentA(0.35)}
              />
              <rect
                x={s.x}
                y={yO + s.tox}
                width={300}
                height={110}
                rx={6}
                fill={accentA(0.1)}
                stroke={COLORS.accent}
                strokeWidth={1.4}
              />
              <text
                x={s.x + 150}
                y={yG + 64}
                textAnchor="middle"
                fontFamily={FONT}
                fontSize={24}
                fill={COLORS.ink}
              >
                grille
              </text>
              <text
                x={s.x + 150}
                y={yO + s.tox + 64}
                textAnchor="middle"
                fontFamily={FONT}
                fontSize={24}
                fill={COLORS.accent}
              >
                canal
              </text>
              <text
                x={s.x + 150}
                y={720}
                textAnchor="middle"
                fontFamily={FONT}
                fontSize={24}
                fill={COLORS.ink}
              >
                {s.name}
              </text>
              {/* Couplage identique */}
              <rect
                x={s.x + 30}
                y={745}
                width={240}
                height={14}
                fill={accentA(0.4)}
              />
              <text
                x={s.x + 150}
                y={790}
                textAnchor="middle"
                fontFamily={FONT}
                fontSize={22}
                fill={COLORS.inkSoft}
              >
                couplage grille-canal
              </text>
            </g>
          );
        })}
        {/* Fuite tunnel dans l'isolant mince */}
        {new Array(4).fill(0).map((_, i) => (
          <Flow
            key={i}
            pts={[
              [250 + i * 60, 430],
              [250 + i * 60, 470],
            ]}
            start={stacks[0].at + 20 + i * 5}
            n={1}
            period={1.4}
            r={4}
          />
        ))}
        <SvgText
          x={190}
          y={448}
          text="isolant"
          start={stacks[0].at}
          size={22}
          color={COLORS.inkSoft}
          anchor="end"
        />
        <SvgText
          x={720}
          y={470}
          text="isolant high-k"
          start={stacks[1].at}
          size={22}
          color={COLORS.ink}
        />
        <SvgText
          x={350}
          y={610}
          text="fuite tunnel"
          start={stacks[0].at + 20}
          size={22}
          color={COLORS.warm}
        />
        <SvgText
          x={720}
          y={640}
          text="fuite tunnel réduite"
          start={stacks[1].at + 20}
          size={22}
          color={COLORS.accent}
        />
      </Svg>
      <Card
        name="Isolant high-k"
        idea={
          <>
            forte permittivité ε : même couplage (C ∝ ε / épaisseur) sans
            isolant physiquement aussi mince
          </>
        }
        cost="qualité des interfaces, défauts, intégration"
        at={t}
        costAt={cues.s(7)}
      />
    </AbsoluteFill>
  );
};

const Chiplets: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(8);
  const split = t + FPS * 1.4;
  const dies = [
    [560, 340],
    [730, 340],
    [560, 510],
    [730, 510],
  ];
  return (
    <AbsoluteFill>
      <Svg>
        <DrawPath
          d={roundRectPath(190, 360, 260, 260, 8)}
          start={t}
          duration={0.8}
          stroke={COLORS.ink}
        />
        <SvgText x={320} y={490} text="un grand die" start={t + 10} size={26} />
        <SvgText
          x={320}
          y={660}
          text="monolithique"
          start={t + 10}
          size={22}
          color={COLORS.inkSoft}
        />
        <Arrow
          x1={470}
          y1={490}
          x2={530}
          y2={490}
          start={split - 10}
          stroke={COLORS.inkSoft}
        />
        <DrawPath
          d={roundRectPath(540, 320, 360, 360, 12)}
          start={split}
          duration={0.8}
          stroke={COLORS.inkSoft}
          width={1.4}
        />
        <SvgText
          x={720}
          y={715}
          text="boîtier : plusieurs dies reliés"
          start={split + 10}
          size={22}
          color={COLORS.inkSoft}
        />
        {dies.map(([x, y], i) => (
          <g key={i} opacity={progress(frame, split + 8 + i * 5, 0.5)}>
            <rect
              x={x}
              y={y}
              width={150}
              height={150}
              rx={6}
              fill={accentA(0.12)}
              stroke={COLORS.accent}
              strokeWidth={1.6}
            />
          </g>
        ))}
        {/* Échanges entre dies */}
        <Flow
          pts={[
            [710, 415],
            [730, 415],
          ]}
          start={cues.s(9)}
          n={2}
          period={1}
          r={4}
        />
        <Flow
          pts={[
            [710, 585],
            [730, 585],
          ]}
          start={cues.s(9, 0.3)}
          n={2}
          period={1}
          r={4}
        />
        <Flow
          pts={[
            [635, 490],
            [635, 510],
          ]}
          start={cues.s(9, 0.6)}
          n={2}
          period={1}
          r={4}
        />
        <Flow
          pts={[
            [805, 490],
            [805, 510],
          ]}
          start={cues.s(9, 0.9)}
          n={2}
          period={1}
          r={4}
        />
      </Svg>
      <Card
        name="Chiplets"
        idea="plusieurs dies coopèrent au lieu d’un très grand die unique"
        cost="du packaging et des échanges supplémentaires entre dies"
        at={t}
        costAt={cues.s(9)}
      />
    </AbsoluteFill>
  );
};

export const S31: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.beat(1)}>
        <Title
          kicker="Les limites physiques"
          text="Changer la géométrie et les matériaux"
          start={cues.s(0)}
        />
      </Stage>
      <Stage from={0} to={cues.beat(1)}>
        <Overview />
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(5)}>
        <Nav />
      </Stage>
      <Stage from={cues.beat(1)} to={cues.beat(2)}>
        <FinStage />
      </Stage>
      <Stage from={cues.beat(2)} to={cues.beat(3)}>
        <GaaStage />
      </Stage>
      <Stage from={cues.beat(3)} to={cues.beat(4)}>
        <HighK />
      </Stage>
      <Stage from={cues.beat(4)} to={cues.beat(5)}>
        <Chiplets />
      </Stage>
      <Stage from={cues.beat(5)}>
        <TextAt x={960} y={180} w={1400} start={cues.s(10)} align="center">
          <div style={textStyle(40, 200)}>
            Ces descriptions expliquent les mécanismes
          </div>
        </TextAt>
        <Callout kind="warn" start={cues.s(11)} y={330} width={1300}>
          Calendriers, rendements et parts de marché de chaque génération :
          étudiés dans les modules dédiés.{" "}
          <span style={{ color: COLORS.warm }}>
            Une architecture prometteuse
          </span>{" "}
          ne prouve pas qu’elle est déjà produite économiquement à grande
          échelle.
        </Callout>
      </Stage>
    </AbsoluteFill>
  );
};
