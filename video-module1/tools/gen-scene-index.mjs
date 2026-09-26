// Régénère src/scenes/index.ts à partir des fichiers src/scenes/Sxx.tsx présents.
import { readdirSync, writeFileSync } from "node:fs";

const dir = new URL("../src/scenes/", import.meta.url);
const ids = readdirSync(dir)
  .map((f) => f.match(/^(S\d\d)\.tsx$/)?.[1])
  .filter(Boolean)
  .sort();

writeFileSync(
  new URL("index.ts", dir),
  `// Fichier généré par tools/gen-scene-index.mjs — ne pas modifier à la main.
import React from "react";
import { SceneDef } from "../data";
import { Fallback } from "./Fallback";
${ids.map((id) => `import { ${id} } from "./${id}";`).join("\n")}

export { Fallback };

// Visuel propre à chaque scène (identifiant de narration/module1.json).
export const visuals: Record<string, React.FC<{ scene: SceneDef }>> = {
${ids.map((id) => `  ${id},`).join("\n")}
};
`,
);
console.log(`${ids.length} scènes : ${ids.join(" ")}`);
