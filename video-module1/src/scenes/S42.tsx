import React from "react";
import { AbsoluteFill } from "remotion";
import { Title } from "../components/kit";
import { FadeIn, textStyle, useCues } from "../components/motion";
import { COLORS } from "../theme";
import { Table3, TableRow } from "./S40";

// Scène 42 — Scénarios favorables et défavorables, thème par thème.
export const S42: React.FC = () => {
  const cues = useCues();
  const s = cues.s;
  const rows: TableRow[] = [
    {
      icon: "chip",
      cells: [
        "Nouvelle génération de transistors",
        "Gains utiles et rendement satisfaisant",
        "Gain absorbé par le coût, la fuite ou les défauts",
      ],
      at: [s(1), s(2), s(3)],
    },
    {
      icon: "gear",
      cells: [
        "Équipements plus sophistiqués",
        "Étapes additionnelles et valeur élevée",
        "Productivité qui réduit les besoins, ou procédé remplacé",
      ],
      at: [s(4), s(5), s(6)],
    },
    {
      icon: "bolt",
      cells: [
        "Spécialisation du calcul",
        "Moins d’énergie par tâche pertinente",
        "Faible flexibilité, ou coûts de développement non amortis",
      ],
      at: [s(7), s(8), s(9)],
    },
    {
      icon: "wafer",
      cells: [
        "Miniaturisation",
        "Plus de fonctions à coût acceptable",
        "Surcoût du wafer et contraintes du système",
      ],
      at: [s(10), s(11), s(12)],
    },
  ];
  return (
    <AbsoluteFill>
      <Title
        text="Scénarios favorables et défavorables"
        start={s(0)}
        top={105}
      />
      <Table3
        headerAt={s(0, 1.4)}
        cols={[
          { label: "THÈME", color: COLORS.ink },
          { label: "SCÉNARIO FAVORABLE", color: COLORS.accent },
          { label: "SCÉNARIO DÉFAVORABLE", color: COLORS.warm },
        ]}
        rows={rows}
      />
      <FadeIn
        start={s(0, 2.4)}
        style={{
          position: "absolute",
          top: 832,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ ...textStyle(24, 300), color: COLORS.inkSoft }}>
          Pour chaque thème, suivre les deux issues : le même progrès peut créer
          ou détruire de la valeur
        </div>
      </FadeIn>
    </AbsoluteFill>
  );
};
