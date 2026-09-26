import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { circlePath, roundRectPath } from "../components/icons";
import { Chip, Icon, Svg } from "../components/kit";
import {
  Counter,
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";
import { PartIntro, PartTag, nb } from "./S49";

// ——— Briques des cas chiffrés (partagées avec S52) ———

export const CaseHeader: React.FC<{
  id: string;
  title: string;
  start: number;
  points?: number;
  top?: number;
}> = ({ id, title, start, points = 10, top = 160 }) => (
  <FadeIn
    start={start}
    style={{ position: "absolute", top, width: "100%", textAlign: "center" }}
  >
    <div style={textStyle(46, 200)}>
      <span style={{ color: COLORS.accent }}>{id}</span>
      <span style={{ color: COLORS.inkSoft }}> · </span>
      {title}
      <span
        style={{
          ...textStyle(22, 500),
          color: COLORS.warm,
          letterSpacing: "0.25em",
          marginLeft: 26,
        }}
      >
        {points} POINTS
      </span>
    </div>
  </FadeIn>
);

export const SmallCaps: React.FC<{
  start: number;
  text: string;
  top: number;
  color?: string;
}> = ({ start, text, top, color = COLORS.inkSoft }) => (
  <FadeIn
    start={start}
    style={{ position: "absolute", top, width: "100%", textAlign: "center" }}
  >
    <div style={{ ...textStyle(22, 500), color, letterSpacing: "0.3em" }}>
      {text}
    </div>
  </FadeIn>
);

// Rappel compact des données, au-dessus des questions.
export const DataRecall: React.FC<{
  start: number;
  children: React.ReactNode;
  top?: number;
}> = ({ start, children, top = 240 }) => (
  <FadeIn
    start={start}
    style={{
      position: "absolute",
      top,
      left: 200,
      width: 1520,
      textAlign: "center",
    }}
  >
    <div style={{ ...textStyle(28, 300), color: COLORS.inkSoft }}>
      {children}
    </div>
  </FadeIn>
);

// Questions a, b, c : chaque ligne s'allume à son tour.
export const LetterQuestions: React.FC<{
  items: { s: number; text: React.ReactNode }[];
  top?: number;
}> = ({ items, top = 340 }) => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const starts = items.map((it) => cues.s(it.s));
  const current = starts.reduce((acc, s, i) => (frame >= s ? i : acc), -1);
  return (
    <div style={{ position: "absolute", top, left: 260, width: 1400 }}>
      {items.map((it, i) => {
        const o = progress(frame, starts[i], 0.6);
        const active = i === current;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 30,
              marginBottom: 44,
              opacity: o * (active ? 1 : 0.5),
              transform: `translateX(${(1 - o) * -16}px)`,
            }}
          >
            <span
              style={{
                ...textStyle(40, 200),
                color: COLORS.accent,
                minWidth: 40,
              }}
            >
              {String.fromCharCode(97 + i)}
            </span>
            <span style={{ ...textStyle(36, 300), lineHeight: 1.35 }}>
              {typeof it.text === "string" ? nb(it.text) : it.text}
            </span>
          </div>
        );
      })}
    </div>
  );
};

type Tile = {
  label: string;
  to: number;
  unit: string;
  prefix?: string;
  at: number;
  color?: string;
};

// Rangée de tuiles de données dont les valeurs s'incrémentent.
const Tiles: React.FC<{
  tiles: Tile[];
  y: number;
  w: number;
  gap?: number;
}> = ({ tiles, y, w, gap = 40 }) => {
  const x0 = 960 - (tiles.length * w + (tiles.length - 1) * gap) / 2;
  return (
    <AbsoluteFill>
      <Svg>
        {tiles.map((t, i) => (
          <DrawPath
            key={t.label}
            d={roundRectPath(x0 + i * (w + gap), y, w, 150, 14)}
            start={t.at - 6}
            duration={0.6}
            stroke={COLORS.inkSoft}
            width={1.4}
          />
        ))}
      </Svg>
      {tiles.map((t, i) => (
        <FadeIn
          key={t.label}
          start={t.at}
          style={{
            position: "absolute",
            top: y + 20,
            left: x0 + i * (w + gap),
            width: w,
            textAlign: "center",
          }}
        >
          <div
            style={{ ...textStyle(56, 200), color: t.color ?? COLORS.accent }}
          >
            {t.prefix && <span style={{ fontSize: 34 }}>{t.prefix} </span>}
            {t.to > 0 && <Counter to={t.to} start={t.at} duration={1.2} />}
            <span style={{ fontSize: 34, color: COLORS.ink }}> {t.unit}</span>
          </div>
          <div
            style={{
              ...textStyle(22, 500),
              color: COLORS.inkSoft,
              letterSpacing: "0.18em",
              marginTop: 8,
            }}
          >
            {t.label.toUpperCase()}
          </div>
        </FadeIn>
      ))}
    </AbsoluteFill>
  );
};

// ——— Scène 51 ———

const Rules: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <PartTag
        index={2}
        start={cues.s(1)}
        text="PARTIE C · APPLICATIONS CHIFFRÉES · CAS C1 ET C2 · 20 POINTS"
      />
      <FadeIn
        start={cues.s(1)}
        style={{
          position: "absolute",
          top: 280,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            ...textStyle(40, 400),
            color: COLORS.warm,
            letterSpacing: "0.3em",
            border: `2px solid ${COLORS.warm}`,
            borderRadius: 12,
            padding: "18px 40px",
          }}
        >
          CHIFFRES FICTIFS
        </div>
      </FadeIn>
      <Svg>
        <Icon
          name="pencil"
          x={960}
          y={500}
          size={34}
          start={cues.s(2)}
          color={COLORS.accent}
        />
      </Svg>
      <FadeIn
        start={cues.s(2, 0.2)}
        style={{
          position: "absolute",
          top: 570,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(36, 300)}>Écris toujours :</div>
      </FadeIn>
      <div
        style={{
          position: "absolute",
          top: 660,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 30,
        }}
      >
        <Chip text="les formules" start={cues.s(2, 0.8)} />
        <Chip text="les unités" start={cues.s(2, 1.6)} />
        <Chip
          text="les limites de tes conclusions"
          start={cues.s(2, 2.6)}
          tone="warm"
        />
      </div>
    </AbsoluteFill>
  );
};

const C1Data: React.FC = () => {
  const cues = useCues();
  const t = cues.s(3);
  const fixed = cues.s(7);
  return (
    <AbsoluteFill>
      <CaseHeader
        id="C1"
        title="Tension, fréquence et puissance totale"
        start={t}
      />
      <SmallCaps start={cues.s(4)} text="VERSION INITIALE" top={250} />
      <Tiles
        y={290}
        w={400}
        gap={60}
        tiles={[
          {
            label: "Puissance dynamique",
            to: 200,
            unit: "W",
            at: cues.s(4, 0.6),
          },
          {
            label: "Fuites et autres postes",
            to: 50,
            unit: "W",
            at: cues.s(4, 3.4),
            color: COLORS.warm,
          },
        ]}
      />
      <FadeIn
        start={fixed}
        style={{ position: "absolute", top: 335, left: 1420, width: 320 }}
      >
        <div
          style={{
            ...textStyle(22, 500),
            color: COLORS.warm,
            letterSpacing: "0.2em",
            lineHeight: 1.5,
            borderLeft: `2px solid ${COLORS.warm}`,
            paddingLeft: 18,
          }}
        >
          RESTENT FIXES
          <br />
          PAR HYPOTHÈSE
        </div>
      </FadeIn>
      <SmallCaps start={cues.s(5)} text="NOUVELLE VERSION" top={500} />
      <Tiles
        y={540}
        w={330}
        gap={30}
        tiles={[
          {
            label: "Capacité C",
            prefix: "−",
            to: 10,
            unit: "%",
            at: cues.s(5, 0.8),
          },
          {
            label: "Tension VDD",
            prefix: "−",
            to: 10,
            unit: "%",
            at: cues.s(5, 2.6),
          },
          {
            label: "Fréquence f",
            prefix: "+",
            to: 10,
            unit: "%",
            at: cues.s(5, 4.6),
          },
          {
            label: "Activité α",
            to: 0,
            unit: "inchangée",
            at: cues.s(6),
            color: COLORS.ink,
          },
        ]}
      />
    </AbsoluteFill>
  );
};

const C1Questions: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <CaseHeader
        id="C1"
        title="Tension, fréquence et puissance totale"
        start={cues.s(8)}
      />
      <DataRecall start={cues.s(8)}>
        200 W dynamique · 50 W fixes · C −10 % · VDD −10 % · f +10 % · α
        inchangée
      </DataRecall>
      <LetterQuestions
        items={[
          { s: 8, text: "Calcule le rapport des puissances dynamiques." },
          {
            s: 9,
            text: "Calcule la nouvelle puissance totale et sa variation en pourcentage.",
          },
          {
            s: 10,
            text: "Pourquoi ne peut-on pas en déduire directement le nombre de tokens par seconde ?",
          },
        ]}
      />
    </AbsoluteFill>
  );
};

// Wafer schématique : un disque découpé en dies (plus petits pour B).
const Wafer: React.FC<{
  cx: number;
  cy: number;
  r: number;
  die: number;
  start: number;
  color: string;
}> = ({ cx, cy, r, die, start, color }) => {
  const frame = useCurrentFrame();
  const n = Math.ceil((2 * r) / die);
  const cells: React.ReactNode[] = [];
  let k = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x = cx - r + i * die;
      const y = cy - r + j * die;
      const corners = [
        [x, y],
        [x + die, y],
        [x, y + die],
        [x + die, y + die],
      ];
      if (corners.every(([a, b]) => Math.hypot(a - cx, b - cy) < r - 4)) {
        const o = progress(frame, start + 10 + k * 0.4, 0.3);
        cells.push(
          <rect
            key={`${i}-${j}`}
            x={x + 2}
            y={y + 2}
            width={die - 4}
            height={die - 4}
            rx={2}
            fill={color}
            opacity={0.35 * o}
          />,
        );
        k++;
      }
    }
  }
  return (
    <g>
      <DrawPath
        d={circlePath(cx, cy, r)}
        start={start}
        duration={0.8}
        stroke={color}
      />
      {cells}
    </g>
  );
};

const Process: React.FC<{
  name: string;
  x: number;
  start: number;
  price: number;
  dies: number;
  yieldPct: number;
  die: number;
  color: string;
}> = ({ name, x, start, price, dies, yieldPct, die, color }) => {
  const frame = useCurrentFrame();
  const bar = progress(frame, start + 60, 1);
  return (
    <AbsoluteFill>
      <Svg>
        <Wafer cx={x} cy={390} r={115} die={die} start={start} color={color} />
        <rect
          x={x - 180}
          y={740}
          width={360}
          height={16}
          rx={8}
          fill="none"
          stroke={COLORS.inkFaint}
          strokeWidth={1.4}
          opacity={progress(frame, start + 56, 0.4)}
        />
        <rect
          x={x - 180}
          y={740}
          width={360 * (yieldPct / 100) * bar}
          height={16}
          rx={8}
          fill={color}
          opacity={0.5}
        />
      </Svg>
      <FadeIn
        start={start}
        style={{ position: "absolute", top: 250, left: x - 380, width: 160 }}
      >
        <div style={{ ...textStyle(26, 500), color, letterSpacing: "0.2em" }}>
          PROCÉDÉ
        </div>
        <div style={{ ...textStyle(72, 200), color }}>{name}</div>
      </FadeIn>
      <div
        style={{
          position: "absolute",
          top: 530,
          left: x - 260,
          width: 520,
          textAlign: "center",
        }}
      >
        <FadeIn start={start + 16}>
          <div style={textStyle(40, 200)}>
            <Counter to={price} start={start + 16} duration={1.2} /> €{" "}
            <span style={{ ...textStyle(26, 300), color: COLORS.inkSoft }}>
              le wafer
            </span>
          </div>
        </FadeIn>
        <FadeIn start={start + 36} style={{ marginTop: 10 }}>
          <div style={textStyle(40, 200)}>
            <Counter to={dies} start={start + 36} duration={1} />{" "}
            <span style={{ ...textStyle(26, 300), color: COLORS.inkSoft }}>
              dies bruts
            </span>
          </div>
        </FadeIn>
        <FadeIn start={start + 56} style={{ marginTop: 10 }}>
          <div style={textStyle(40, 200)}>
            <span style={{ ...textStyle(26, 300), color: COLORS.inkSoft }}>
              rendement{" "}
            </span>
            <Counter to={yieldPct} start={start + 56} duration={1} /> %
          </div>
        </FadeIn>
      </div>
    </AbsoluteFill>
  );
};

const C2Data: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <CaseHeader
        id="C2"
        title="Densité, rendement et coût du die bon"
        start={cues.s(11)}
      />
      <Process
        name="A"
        x={620}
        start={cues.s(12)}
        price={18000}
        dies={120}
        yieldPct={80}
        die={34}
        color={COLORS.accent}
      />
      <Process
        name="B"
        x={1300}
        start={cues.s(13)}
        price={24000}
        dies={160}
        yieldPct={70}
        die={29}
        color={COLORS.warm}
      />
      <FadeIn
        start={cues.s(14)}
        style={{
          position: "absolute",
          top: 790,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(28, 300), color: COLORS.inkSoft }}>
          On exclut :{" "}
          <span style={{ textDecoration: "line-through", color: COLORS.ink }}>
            packaging
          </span>
          {" · "}
          <span style={{ textDecoration: "line-through", color: COLORS.ink }}>
            test
          </span>
          {" · "}
          <span style={{ textDecoration: "line-through", color: COLORS.ink }}>
            conception
          </span>
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

const C2Questions: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <CaseHeader
        id="C2"
        title="Densité, rendement et coût du die bon"
        start={cues.s(15)}
      />
      <DataRecall start={cues.s(15)}>
        <span style={{ color: COLORS.accent }}>A</span> : 18 000 €, 120 dies, 80
        % · <span style={{ color: COLORS.warm }}>B</span> : 24 000 €, 160 dies,
        70 % · hors packaging, test, conception
      </DataRecall>
      <LetterQuestions
        items={[
          {
            s: 15,
            text: "Calcule le coût wafer par die bon pour A et pour B.",
          },
          {
            s: 16,
            text: "Quel rendement de B permettrait d’égaler le coût de A, tout le reste inchangé ?",
          },
          {
            s: 17,
            text: "Donne une raison pour laquelle un client pourrait choisir B malgré un coût par die supérieur.",
          },
        ]}
      />
    </AbsoluteFill>
  );
};

// Scène 51 — Partie C : cas chiffrés C1 et C2 (énoncés seulement).
export const S51: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(1)}>
        <PartIntro
          index={2}
          title="Applications chiffrées"
          start={0}
          points={20}
          perQuestion="Cas C1 et C2 · 10 points chacun"
        />
      </Stage>
      <Stage from={cues.s(1)} to={cues.s(3)}>
        <Rules />
      </Stage>
      <Stage from={cues.s(3)} to={cues.s(8)}>
        <C1Data />
      </Stage>
      <Stage from={cues.s(8)} to={cues.s(11)}>
        <C1Questions />
      </Stage>
      <Stage from={cues.s(11)} to={cues.s(15)}>
        <C2Data />
      </Stage>
      <Stage from={cues.s(15)}>
        <C2Questions />
      </Stage>
    </AbsoluteFill>
  );
};
