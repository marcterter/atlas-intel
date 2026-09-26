import React from "react";
import { AbsoluteFill } from "remotion";
import { DeckItem, Icon, Svg, TermDeck, Title } from "../components/kit";
import { Stage, useCues } from "../components/motion";
import { COLORS } from "../theme";

const def = (text: string, tone?: "accent" | "warm") => ({
  label: "Définition",
  text,
  tone,
});

const ITEMS: DeckItem[] = [
  {
    term: "Token",
    icon: "token",
    lines: [
      def("Unité traitée ou produite par le modèle"),
      {
        label: "Utilité",
        text: "Mesure une partie de l’activité IA",
        tone: "accent",
      },
    ],
  },
  {
    term: "Inférence",
    icon: "cloud",
    lines: [def("Utilisation d’un modèle entraîné pour produire le service")],
  },
  {
    term: "Wafer et die",
    icon: "wafer",
    lines: [
      { label: "Wafer", text: "Disque de fabrication" },
      { label: "Die", text: "Puce nue qui en est issue", tone: "accent" },
    ],
  },
  {
    term: "Packaging",
    icon: "stack",
    lines: [
      def("Assemblage et connexion des puces dans un système utilisable"),
    ],
  },
  {
    term: "HBM",
    icon: "memory",
    lines: [
      def("Mémoire à très haute bande passante, proche de l’accélérateur"),
    ],
  },
  {
    term: "Bande passante et latence",
    icon: "network",
    lines: [
      { label: "Bande passante", text: "Quantité transférable par seconde" },
      { label: "Latence", text: "Délai d’un transfert", tone: "accent" },
    ],
  },
  {
    term: "Yield",
    icon: "check",
    lines: [
      { label: "En français", text: "Rendement" },
      def("Part des unités répondant aux critères requis"),
    ],
  },
  {
    term: "Bottleneck",
    icon: "bottleneck",
    lines: [def("Contrainte qui limite le résultat global", "warm")],
  },
  {
    term: "BOM et ASP",
    icon: "euro",
    lines: [
      { label: "BOM", text: "Nomenclature des composants" },
      { label: "ASP", text: "Prix moyen de vente", tone: "accent" },
    ],
  },
  {
    term: "Capex et TAM",
    icon: "chart",
    lines: [
      { label: "Capex", text: "Dépenses d’investissement" },
      {
        label: "TAM",
        text: "Marché total théoriquement accessible",
        tone: "accent",
      },
    ],
  },
  {
    term: "Moat",
    icon: "building",
    lines: [def("Avantage concurrentiel qui aide à protéger les profits")],
  },
];

// Scène 39 — Glossaire : révision rapide des onze concepts essentiels.
export const S39: React.FC = () => {
  const cues = useCues();
  const starts = ITEMS.map((_, i) => cues.s(i + 1));
  return (
    <AbsoluteFill>
      <Title
        kicker="Révision rapide"
        text="Les concepts essentiels"
        start={0}
        top={100}
      />
      <TermDeck
        heading="Glossaire"
        items={ITEMS}
        starts={starts}
        end={cues.end}
        top={250}
        termSize={24}
      />
      {/* Grand pictogramme du terme courant, tracé dans l’espace libre de la fiche. */}
      {ITEMS.map((it, i) => (
        <Stage
          key={it.term}
          from={starts[i]}
          to={i < ITEMS.length - 1 ? starts[i + 1] : cues.end + 60}
        >
          <Svg>
            <Icon
              name={it.icon ?? "book"}
              x={1560}
              y={680}
              size={100}
              start={starts[i] + 10}
              duration={1.2}
              width={1.5}
              color={COLORS.inkFaint}
            />
          </Svg>
        </Stage>
      ))}
    </AbsoluteFill>
  );
};
