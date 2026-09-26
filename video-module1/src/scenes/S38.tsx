import React from "react";
import { AbsoluteFill } from "remotion";
import { Title } from "../components/kit";
import { FictiveTag } from "./S33";
import { IndustryMap, MapRowDef } from "./S37";

const ROWS: MapRowDef[] = [
  {
    icon: "magnifier",
    need: "Détection des défauts",
    trade: "INSPECTION ET MÉTROLOGIE",
    tradeAt: 1.6,
    actors: [
      { name: "KLA", at: 3.3 },
      { name: "ASML", at: 4.3 },
    ],
    client: "Fabricants",
    indicator: "Sensibilité, débit de mesure et rendement",
    indicatorAt: 1.8,
  },
  {
    icon: "factory",
    need: "Fabrication intégrée",
    trade: "FONDERIES",
    tradeAt: 0.8,
    actors: [
      { name: "TSMC", at: 1.9 },
      { name: "Samsung Foundry", at: 2.8 },
      { name: "Intel Foundry", at: 3.9 },
    ],
    client: "Concepteurs",
    indicator: "Rendement, capacité et coût des dies bons",
    indicatorAt: 1.8,
  },
  {
    icon: "pencil",
    need: "Conception et vérification",
    trade: "LOGICIELS DE CONCEPTION (EDA)",
    tradeAt: 1,
    actors: [
      { name: "Cadence", at: 2.3 },
      { name: "Synopsys", at: 3.2 },
      { name: "Siemens EDA", at: 4.1 },
    ],
    client: "Concepteurs",
    indicator: "Complexité, outils et validation",
    indicatorAt: 1.8,
  },
  {
    icon: "chip",
    need: "Architecture du calcul",
    trade: "PUCES DE CALCUL",
    tradeAt: 0.8,
    actors: [
      { name: "NVIDIA", at: 1.8 },
      { name: "AMD", at: 2.7 },
      { name: "concepteurs spécialisés", at: 3.6, dashed: true },
    ],
    client: "Intégrateurs et exploitants",
    indicator: "Débit utile et efficacité",
    indicatorAt: 2.2,
  },
];

// Scène 38 — La chaîne industrielle : besoins physiques et métiers (2/2).
export const S38: React.FC = () => {
  return (
    <AbsoluteFill>
      <Title text="Besoins physiques et métiers" start={0} top={105} />
      <FictiveTag start={0} label="CARTE 2 / 2" />
      <IndustryMap rows={ROWS} firstSentence={0} />
    </AbsoluteFill>
  );
};
