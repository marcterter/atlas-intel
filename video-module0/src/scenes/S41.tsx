import React from "react";
import { AbsoluteFill } from "remotion";
import { roundRectPath } from "../components/icons";
import {
  Callout,
  Chip,
  DeckItem,
  Icon,
  Svg,
  SvgText,
  TermDeck,
  Title,
} from "../components/kit";
import {
  DrawPath,
  FadeIn,
  Stage,
  textStyle,
  useCues,
} from "../components/motion";
import { COLORS } from "../theme";

const SOURCES: { who: string; doc: string; what: string }[] = [
  {
    who: "ASML",
    doc: "Six crucial steps in semiconductor manufacturing",
    what: "Procédés de dépôt, lithographie et gravure",
  },
  {
    who: "Ajinomoto",
    doc: "Our Technologies",
    what: "Rôle du film ABF et fourniture aux fabricants de substrats",
  },
  {
    who: "Micron",
    doc: "HBM4 in High-Volume Production, NVIDIA Vera Rubin",
    what: "Communiqué du 16 mars 2026 : production et échantillonnage HBM4",
  },
  {
    who: "Vertiv",
    doc: "End-to-End AI Power and Cooling Solutions",
    what: "Plaques froides et refroidissement liquide",
  },
  {
    who: "TSMC via la SEC",
    doc: "Board resolutions of August 11, 2026",
    what: "Autorisations d’investissement : fabrication et packaging",
  },
  {
    who: "AIE",
    doc: "Key Questions on Energy and AI",
    what: "Synthèse 2026 : raccordement et production électrique sur site",
  },
  {
    who: "Broadcom",
    doc: "First 102.4 Tbps Switch in Production Volume",
    what: "Annonce du 12 mars 2026 sur Tomahawk 6",
  },
  {
    who: "Broadcom",
    doc: "Tomahawk 6 Davisson with Co-Packaged Optics",
    what: "Architecture de commutateur intégrant de l’optique",
  },
];

const ITEMS: DeckItem[] = SOURCES.map((s, i) => ({
  term: `${i + 1} · ${s.who}`,
  icon: "book",
  lines: [
    { label: `Source ${i + 1} · ${s.who}`, text: s.doc },
    { label: "Ce qu’elle documente", text: s.what, tone: "accent" },
  ],
}));

// Trois statuts d'information à ne jamais mélanger.
const KINDS = [
  {
    label: "Fait publié",
    text: "Information attribuée à une source identifiée",
    icon: "book" as const,
    color: COLORS.accent,
  },
  {
    label: "Exemple pédagogique",
    text: "Nombres fictifs servant à apprendre un calcul",
    icon: "pencil" as const,
    color: COLORS.ink,
  },
  {
    label: "Hypothèse",
    text: "Relation ou scénario à tester avec des données",
    icon: "magnifier" as const,
    color: COLORS.warm,
  },
];

const Kinds: React.FC = () => {
  const cues = useCues();
  const at = [cues.s(12), cues.s(13), cues.s(14)];
  return (
    <AbsoluteFill>
      <FadeIn
        start={cues.s(11)}
        style={{
          position: "absolute",
          top: 230,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(40, 200)}>Faits, estimations et hypothèses</div>
      </FadeIn>
      <Svg>
        {KINDS.map((k, i) => {
          const x = 200 + i * 520;
          return (
            <g key={k.label}>
              <DrawPath
                d={roundRectPath(x, 340, 480, 400, 16)}
                start={at[i]}
                duration={0.8}
                stroke={k.color}
              />
              <Icon
                name={k.icon}
                x={x + 240}
                y={430}
                size={38}
                start={at[i] + 8}
                color={k.color}
              />
              <SvgText
                x={x + 240}
                y={530}
                text={k.label.toUpperCase()}
                start={at[i] + 10}
                size={24}
                weight={500}
                spacing="0.2em"
                color={k.color}
              />
            </g>
          );
        })}
      </Svg>
      {KINDS.map((k, i) => (
        <FadeIn
          key={k.label}
          start={at[i] + 16}
          style={{
            position: "absolute",
            top: 580,
            left: 240 + i * 520,
            width: 400,
            textAlign: "center",
          }}
        >
          <div style={{ ...textStyle(30, 300), lineHeight: 1.35 }}>
            {k.text}
          </div>
        </FadeIn>
      ))}
    </AbsoluteFill>
  );
};

// Ce que mesure la validation.
const Validation: React.FC = () => {
  const cues = useCues();
  const t = cues.s(16);
  return (
    <AbsoluteFill>
      <FadeIn
        start={cues.s(15)}
        style={{
          position: "absolute",
          top: 230,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={textStyle(36, 300)}>
          Les cours et corrections devront conserver ces distinctions
        </div>
      </FadeIn>
      <div
        style={{
          position: "absolute",
          top: 310,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          gap: 24,
        }}
      >
        <Chip text="Fait publié" start={cues.s(15, 1)} />
        <Chip text="Exemple pédagogique" start={cues.s(15, 1.3)} tone="ink" />
        <Chip text="Hypothèse" start={cues.s(15, 1.6)} tone="warm" />
      </div>
      <FadeIn
        start={t}
        style={{
          position: "absolute",
          top: 440,
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
          LA VALIDATION DU MODULE MESURE
        </div>
      </FadeIn>
      <Svg>
        <Icon
          name="check"
          x={620}
          y={580}
          size={34}
          start={t + 20}
          color={COLORS.accent}
          width={3}
        />
        <SvgText
          x={620}
          y={680}
          text={"La compréhension\net le raisonnement"}
          start={t + 24}
          size={34}
          color={COLORS.accent}
        />
        <DrawPath
          d="M 960 520 V 740"
          start={t + 30}
          duration={0.6}
          stroke={COLORS.inkFaint}
        />
        <Icon
          name="cross"
          x={1300}
          y={580}
          size={34}
          start={cues.s(16, 3.4)}
          color={COLORS.warm}
          width={3}
        />
        <SvgText
          x={1300}
          y={680}
          text={"Pas la capacité à réciter\ndes annonces industrielles"}
          start={cues.s(16, 3.6)}
          size={34}
          color={COLORS.inkSoft}
        />
      </Svg>
    </AbsoluteFill>
  );
};

// Scène 41 — Sources, statut des informations et ce que mesure la validation.
export const S41: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Title text="Sources et méthode de lecture" start={0} top={100} />
      <Stage from={0} to={cues.s(2)}>
        <Svg>
          {[0, 1, 2].map((i) => (
            <Icon
              key={i}
              name="book"
              x={760 + i * 200}
              y={450}
              size={50}
              start={cues.s(1, i * 0.3)}
              color={i === 1 ? COLORS.accent : COLORS.ink}
            />
          ))}
        </Svg>
        <FadeIn
          start={cues.s(1, 0.6)}
          style={{
            position: "absolute",
            top: 580,
            width: "100%",
            textAlign: "center",
          }}
        >
          <div style={textStyle(36, 300)}>
            Les références documentent{" "}
            <span style={{ color: COLORS.accent }}>
              les procédés et les repères industriels
            </span>{" "}
            cités
          </div>
        </FadeIn>
      </Stage>
      <Stage from={cues.s(2)} to={cues.s(3)}>
        <Callout
          kind="warn"
          label="CARACTÉRISTIQUES CONSTRUCTEUR"
          start={cues.s(2)}
          y={300}
          size={38}
        >
          Les caractéristiques annoncées par les fabricants restent des
          caractéristiques constructeur :{" "}
          <span style={{ color: COLORS.warm }}>
            elles ne constituent pas une garantie de performance sur toutes les
            applications.
          </span>
        </Callout>
      </Stage>
      <Stage from={cues.s(3)} to={cues.s(11)}>
        <TermDeck
          heading="Huit sources"
          items={ITEMS}
          starts={[3, 4, 5, 6, 7, 8, 9, 10].map((i) => cues.s(i))}
          end={cues.s(11)}
          top={230}
          termSize={26}
        />
        {/* Grand numéro de la source courante, dans l’espace libre de la fiche. */}
        {[3, 4, 5, 6, 7, 8, 9, 10].map((si, i) => (
          <Stage key={si} from={cues.s(si)} to={cues.s(si + 1)}>
            <FadeIn
              start={cues.s(si, 0.3)}
              style={{
                position: "absolute",
                top: 560,
                left: 1380,
                width: 380,
                textAlign: "right",
              }}
            >
              <div style={{ ...textStyle(200, 200), color: COLORS.inkFaint }}>
                {i + 1}
                <span style={{ fontSize: 60 }}> / 8</span>
              </div>
            </FadeIn>
          </Stage>
        ))}
      </Stage>
      <Stage from={cues.s(11)} to={cues.s(15)}>
        <Kinds />
      </Stage>
      <Stage from={cues.s(15)}>
        <Validation />
      </Stage>
    </AbsoluteFill>
  );
};
