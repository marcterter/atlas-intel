import React from "react";
import { SceneDef } from "../data";
import { Fallback } from "./Fallback";
import { S01 } from "./S01";

export { Fallback };

// Visuel propre à chaque scène (identifiant de narration/module0.json).
export const visuals: Record<string, React.FC<{ scene: SceneDef }>> = {
  S01,
};
