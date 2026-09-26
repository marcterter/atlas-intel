import React from "react";
import { AbsoluteFill } from "remotion";
import { Title } from "../components/kit";
import { useCues } from "../components/motion";
import { Supplier, SupplierDeck } from "./S13";

const ROWS: Supplier[] = [
  {
    brick: "Dépôt et gravure",
    icon: "stack",
    actors: ["Applied Materials", "Lam Research", "Tokyo Electron"],
    clients: "Fabricants de puces",
    issue: "Maîtrise des procédés et reproductibilité",
  },
  {
    brick: "Inspection et mesure",
    icon: "magnifier",
    actors: ["KLA", "ASML"],
    clients: "Fabricants de puces",
    issue: "Détecter les défauts sans ralentir excessivement",
  },
  {
    brick: "Fabrication sous contrat",
    icon: "factory",
    actors: ["TSMC", "Samsung Foundry", "Intel Foundry"],
    clients: "Concepteurs de puces",
    issue: "Rendement et capacité qualifiée",
  },
  {
    brick: "Mémoire",
    icon: "memory",
    actors: ["SK hynix", "Micron", "Samsung"],
    clients: "Fabricants de systèmes et de puces assemblées",
    issue: "Capacité, débit et rendement",
  },
  {
    brick: "Packaging et test",
    icon: "chip",
    actors: ["TSMC", "ASE", "Amkor"],
    clients: "Concepteurs",
    issue: "Complexité des assemblages, rendement et test",
  },
];

// Scène 14 — Les fournisseurs en amont des systèmes (2/2).
export const S14: React.FC = () => {
  const cues = useCues();
  const starts = [1, 3, 5, 7, 9].map((i) => cues.s(i));
  const clientStarts = [2, 4, 6, 8, 10].map((i) => cues.s(i, 0.4));
  return (
    <AbsoluteFill>
      <Title
        kicker="Tableau · 2/2"
        text="Les fournisseurs en amont des systèmes"
        top={105}
        start={cues.s(0)}
      />
      <SupplierDeck
        rows={ROWS}
        starts={starts}
        clientStarts={clientStarts}
        end={cues.end}
      />
    </AbsoluteFill>
  );
};
