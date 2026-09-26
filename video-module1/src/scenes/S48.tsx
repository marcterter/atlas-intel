import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { roundRectPath } from "../components/icons";
import { Box, Icon, Link, Svg, Title } from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  progress,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

// ——— Méthode ———

const METHOD: {
  icon: "book" | "magnifier" | "pencil";
  s: number;
  color: string;
  text: React.ReactNode;
}[] = [
  {
    icon: "book",
    s: 1,
    color: COLORS.accent,
    text: (
      <>
        Fondamentaux physiques vérifiés à partir de{" "}
        <span style={{ color: COLORS.accent }}>ressources universitaires</span>{" "}
        et de documentation technique
      </>
    ),
  },
  {
    icon: "magnifier",
    s: 2,
    color: COLORS.warm,
    text: (
      <>
        Ressources anciennes : pertinentes pour les{" "}
        <span style={{ color: COLORS.accent }}>principes</span>,{" "}
        <span style={{ color: COLORS.warm }}>
          pas une preuve des performances ni des calendriers industriels de 2026
        </span>
      </>
    ),
  },
  {
    icon: "pencil",
    s: 3,
    color: COLORS.ink,
    text: "Les schémas de ce cours sont pédagogiques et originaux",
  },
];

const Method: React.FC = () => {
  const cues = useCues();
  const ys = [300, 470, 650];
  return (
    <AbsoluteFill>
      <Title
        text="Sources et approfondissements"
        kicker="La méthode"
        start={0}
      />
      <Svg>
        {METHOD.map((m, i) => (
          <Icon
            key={i}
            name={m.icon}
            x={300}
            y={ys[i] + 30}
            size={30}
            start={cues.s(m.s)}
            color={m.color}
          />
        ))}
      </Svg>
      {METHOD.map((m, i) => (
        <FadeIn
          key={i}
          start={cues.s(m.s, 0.2)}
          style={{ position: "absolute", top: ys[i], left: 380, width: 1300 }}
        >
          <div style={{ ...textStyle(34, 300), lineHeight: 1.4 }}>{m.text}</div>
        </FadeIn>
      ))}
    </AbsoluteFill>
  );
};

// ——— Les neuf sources ———

type Source = {
  who: string;
  short: string;
  title: string;
  what: string;
  s: number;
  mit: boolean;
};

const SOURCES: Source[] = [
  {
    who: "MIT 6.012 · Lecture 1",
    short: "MIT · L1",
    title: "Introduction to Semiconductors",
    what: "Porteurs, silicium, dopage et transport",
    s: 5,
    mit: true,
  },
  {
    who: "MIT 6.012 · Lecture 4",
    short: "MIT · L4",
    title: "p-n Junctions Electrostatics",
    what: "Zone appauvrie et équilibre de la jonction",
    s: 6,
    mit: true,
  },
  {
    who: "MIT 6.012 · Lecture 9",
    short: "MIT · L9",
    title: "MOS Capacitors I",
    what: "Champ de grille et inversion",
    s: 7,
    mit: true,
  },
  {
    who: "MIT 6.012 · Lecture 14",
    short: "MIT · L14",
    title: "Digital Circuits : Inverter Basics",
    what: "Inverseur et niveaux logiques",
    s: 8,
    mit: true,
  },
  {
    who: "MIT 6.012 · Lecture 15",
    short: "MIT · L15",
    title: "Digital Circuits : CMOS",
    what: "Délais et consommation",
    s: 9,
    mit: true,
  },
  {
    who: "Texas Instruments · note SCAA035B",
    short: "TI",
    title: "CMOS Power Consumption and CPD Calculation",
    what: "Distinction entre consommation statique et dynamique",
    s: 11,
    mit: false,
  },
  {
    who: "MIT 6.012 · Lecture 16",
    short: "MIT · L16",
    title: "CMOS Scaling : The Roadmap",
    what: "Fuite sous le seuil et miniaturisation",
    s: 10,
    mit: true,
  },
  {
    who: "ASML",
    short: "ASML",
    title: "Moore’s Law",
    what: "Histoire et portée de la loi de Moore",
    s: 12,
    mit: false,
  },
  {
    who: "Dennard et coauteurs · 1974",
    short: "Dennard",
    title:
      "Design of Ion Implanted MOSFETs With Very Small Physical Dimensions",
    what: "Article fondateur, référencé par IBM Research",
    s: 13,
    mit: false,
  },
];

const CARD_W = 150;
const CARD_GAP = 22;
const CARD_X0 = 960 - (9 * CARD_W + 8 * CARD_GAP) / 2;
const CARD_Y = 190;

const Sources: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(4);
  const mitOn = progress(frame, cues.s(4, 1), 0.6);
  const starts = SOURCES.map((s) => cues.s(s.s));
  // Source courante : la dernière commencée.
  let current = -1;
  SOURCES.forEach((s, i) => {
    if (frame >= starts[i] && (current < 0 || starts[i] > starts[current]))
      current = i;
  });
  return (
    <AbsoluteFill>
      <Svg>
        {SOURCES.map((s, i) => {
          const x = CARD_X0 + i * (CARD_W + CARD_GAP);
          const active = i === current;
          const seen = frame >= starts[i];
          const stroke = active
            ? COLORS.accent
            : s.mit
              ? mitOn > 0.5 && !seen
                ? COLORS.accent
                : COLORS.inkSoft
              : COLORS.inkFaint;
          return (
            <g
              key={i}
              opacity={
                progress(frame, t + i * 3, 0.5) *
                (active ? 1 : seen ? 0.7 : 0.55)
              }
            >
              <path
                d={roundRectPath(x, CARD_Y, CARD_W, 100, 10)}
                fill={active ? COLORS.accent : "#ffffff"}
                fillOpacity={active ? 0.12 : 0.03}
                stroke={stroke}
                strokeWidth={active ? 2.2 : 1.3}
              />
              <text
                x={x + CARD_W / 2}
                y={CARD_Y + 48}
                textAnchor="middle"
                fontFamily="Inter Variable, Inter, sans-serif"
                fontSize={36}
                fontWeight={200}
                fill={active ? COLORS.accent : COLORS.ink}
              >
                {i + 1}
              </text>
              <text
                x={x + CARD_W / 2}
                y={CARD_Y + 82}
                textAnchor="middle"
                fontFamily="Inter Variable, Inter, sans-serif"
                fontSize={22}
                fontWeight={400}
                fill={COLORS.inkSoft}
              >
                {s.short}
              </text>
            </g>
          );
        })}
      </Svg>
      {/* Ouverture : le cours du MIT */}
      <Stage from={t} to={starts[0]}>
        <div
          style={{
            position: "absolute",
            top: 420,
            width: "100%",
            textAlign: "center",
          }}
        >
          <FadeIn start={t + 10}>
            <div
              style={{
                ...textStyle(22, 500),
                color: COLORS.inkSoft,
                letterSpacing: "0.3em",
              }}
            >
              LA BASE UNIVERSITAIRE
            </div>
            <div
              style={{
                ...textStyle(56, 200),
                color: COLORS.accent,
                marginTop: 16,
              }}
            >
              Le cours MIT 6.012
            </div>
            <div
              style={{
                ...textStyle(30, 300),
                color: COLORS.inkSoft,
                marginTop: 14,
              }}
            >
              la majorité des sources de ce module
            </div>
          </FadeIn>
        </div>
      </Stage>
      {/* Fiche de la source courante */}
      {SOURCES.map((s, i) => {
        const next = starts.filter((x) => x > starts[i]);
        const to = next.length ? Math.min(...next) : cues.s(14);
        return (
          <Stage key={i} from={starts[i]} to={to}>
            <Svg>
              <DrawPath
                d={roundRectPath(260, 360, 1400, 340, 18)}
                start={starts[i]}
                duration={0.8}
                stroke={COLORS.inkFaint}
                width={1.4}
              />
              <Icon
                name="book"
                x={1580}
                y={430}
                size={30}
                start={starts[i] + 6}
                color={COLORS.accent}
              />
            </Svg>
            <div
              style={{ position: "absolute", top: 400, left: 330, width: 1200 }}
            >
              <FadeIn start={starts[i]}>
                <div
                  style={{
                    ...textStyle(24, 500),
                    color: COLORS.accent,
                    letterSpacing: "0.22em",
                  }}
                >
                  SOURCE {i + 1} · {s.who.toUpperCase()}
                </div>
              </FadeIn>
              <FadeIn start={starts[i] + 8} style={{ marginTop: 24 }}>
                <div
                  style={{
                    ...textStyle(s.title.length > 45 ? 40 : 50, 200),
                    fontStyle: "italic",
                    lineHeight: 1.25,
                  }}
                >
                  {s.title}
                </div>
              </FadeIn>
              <FadeIn start={starts[i] + 20} style={{ marginTop: 40 }}>
                <div
                  style={{
                    ...textStyle(22, 500),
                    color: COLORS.inkSoft,
                    letterSpacing: "0.3em",
                    marginBottom: 10,
                  }}
                >
                  CE QU’ELLE APPORTE
                </div>
                <div style={{ ...textStyle(36, 300), color: COLORS.warm }}>
                  {s.what}
                </div>
              </FadeIn>
            </div>
          </Stage>
        );
      })}
    </AbsoluteFill>
  );
};

// ——— Pour aller plus loin, et la mise en garde ———

const Further: React.FC = () => {
  const cues = useCues();
  const frame = useCurrentFrame();
  const t = cues.s(14);
  const c = cues.s(15);
  const w = cues.s(16);
  const cross = progress(frame, cues.s(16, 1.6), 0.5);
  return (
    <AbsoluteFill>
      <Title text="Pour aller plus loin après le test" start={t} top={120} />
      <Svg>
        <Icon
          name="book"
          x={560}
          y={270}
          size={32}
          start={t + 6}
          color={COLORS.accent}
        />
      </Svg>
      <FadeIn
        start={t + 8}
        style={{ position: "absolute", top: 230, left: 630, width: 1000 }}
      >
        <div
          style={{
            ...textStyle(24, 500),
            color: COLORS.accent,
            letterSpacing: "0.22em",
          }}
        >
          MIT 6.012 · LECTURE 11
        </div>
        <div style={{ ...textStyle(34, 300), marginTop: 8 }}>
          Les modèles de courant du MOSFET
        </div>
      </FadeIn>
      <Svg>
        <Box
          x={300}
          y={400}
          w={560}
          h={110}
          label="Modèles de canal long"
          sub="des outils d’intuition"
          start={c}
          size={30}
        />
        <Link from={[860, 455]} to={[1060, 455]} start={cues.s(15, 2)} />
        <Box
          x={1060}
          y={400}
          w={560}
          h={110}
          label="Transistors modernes"
          sub="modèles plus complets"
          start={cues.s(15, 2.4)}
          size={30}
          variant="hi"
        />
        <Box
          x={300}
          y={620}
          w={560}
          h={110}
          label="Équations du cours"
          start={w}
          size={30}
          variant="muted"
        />
        <Link
          from={[860, 675]}
          to={[1060, 675]}
          start={cues.s(16, 0.8)}
          color={COLORS.warm}
        />
        <Box
          x={1060}
          y={620}
          w={560}
          h={110}
          label="Valorisation · part de marché"
          start={cues.s(16, 1)}
          size={30}
          variant="side"
        />
        <g opacity={cross}>
          <path
            d="M 935 645 L 985 705 M 985 645 L 935 705"
            stroke={COLORS.warm}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </g>
      </Svg>
      <FadeIn
        start={cues.s(16, 2)}
        style={{
          position: "absolute",
          top: 760,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(30, 300), color: COLORS.warm }}>
          Aucun résultat n’en est déduit automatiquement
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};

// Scène 48 — Sources : méthode, neuf références numérotées, approfondissement.
export const S48: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Stage from={0} to={cues.s(4)}>
        <Method />
      </Stage>
      <Stage from={cues.s(4)} to={cues.s(14)}>
        <Sources />
      </Stage>
      <Stage from={cues.s(14)}>
        <Further />
      </Stage>
    </AbsoluteFill>
  );
};
