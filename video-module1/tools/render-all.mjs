// Rend chaque épisode dans output/, par exemple output/module1-01-ouverture-charges-et-bandes-d-energie.mp4.
// Au-delà de 29 Mo, une copie plus compressée est aussi produite dans output/partage/ pour l'envoi.
// Usage : node tools/render-all.mjs [E03]
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, statSync } from "node:fs";

const { episodes } = JSON.parse(readFileSync(new URL("../narration/module1.json", import.meta.url)));
const only = process.argv[2];
mkdirSync("output/partage", { recursive: true });

for (const ep of episodes) {
  if (only && ep.id !== only) continue;
  const name = `module1-${ep.num}-${ep.slug}.mp4`;
  console.log(`→ output/${name}`);
  execFileSync("npx", ["remotion", "render", `Episode-${ep.id}`, `output/${name}`], { stdio: "inherit" });
  if (statSync(`output/${name}`).size > 29 * 1024 * 1024) {
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", `output/${name}`, "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-c:a", "copy", `output/partage/${name}`]);
  }
  console.log(`fini: ${name}`);
}
