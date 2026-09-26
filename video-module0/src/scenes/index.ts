// Fichier généré par tools/gen-scene-index.mjs — ne pas modifier à la main.
import React from "react";
import { SceneDef } from "../data";
import { Fallback } from "./Fallback";
import { S01 } from "./S01";
import { S02 } from "./S02";
import { S03 } from "./S03";
import { S04 } from "./S04";
import { S05 } from "./S05";

export { Fallback };

// Visuel propre à chaque scène (identifiant de narration/module0.json).
export const visuals: Record<string, React.FC<{ scene: SceneDef }>> = {
  S01,
  S02,
  S03,
  S04,
  S05,
};
