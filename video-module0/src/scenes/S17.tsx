import React from "react";
import { AbsoluteFill } from "remotion";
import { Title } from "../components/kit";
import { Stage, useCues } from "../components/motion";
import { SupplierDeck, SupplierRow } from "./S16";

const ROWS: SupplierRow[] = [
  {
    term: "Optique",
    icon: "light",
    actors: ["Coherent", "Lumentum", "Fabrinet"],
    clients: "Fabricants de modules et de systèmes",
    check: ["Composants", "Assemblage", "Test"],
  },
  {
    term: "Conversion électrique",
    icon: "bolt",
    actors: ["Infineon", "onsemi", "Monolithic Power Systems"],
    clients: "Alimentations et cartes",
    check: ["Pertes", "Chaleur", "Densité"],
  },
  {
    term: "Électricité et refroidissement",
    icon: "snow",
    actors: ["Schneider Electric", "Eaton", "Vertiv"],
    clients: "Constructeurs et exploitants",
    check: ["Délais", "Puissance", "Intégration"],
  },
  {
    term: "Cloud et hébergement",
    icon: "cloud",
    actors: ["AWS", "Microsoft Azure", "Google Cloud", "CoreWeave", "Equinix"],
    clients: "Entreprises et développeurs",
    check: ["Utilisation", "Financement", "Raccordement"],
  },
];

// Scène 17 — Des substrats à l'exploitation cloud (2/2) : suite de la chaîne aval.
export const S17: React.FC = () => {
  const cues = useCues();
  return (
    <AbsoluteFill>
      <Title
        kicker="Suite de la chaîne aval"
        text="Des substrats à l’exploitation cloud"
        start={cues.s(0)}
        top={110}
      />
      <Stage from={cues.s(0, 0.3)}>
        <SupplierDeck
          rows={ROWS}
          starts={[1, 3, 5, 7].map((i) => cues.s(i))}
          clientStarts={[2, 4, 6, 8].map((i) => cues.s(i))}
          end={cues.end}
          intro={cues.s(0, 0.4)}
        />
      </Stage>
    </AbsoluteFill>
  );
};
