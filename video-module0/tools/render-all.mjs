// Rend chaque épisode dans output/, par exemple output/module0-01-la-carte-du-systeme.mp4.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { episodes } = JSON.parse(readFileSync(new URL("../narration/module0.json", import.meta.url)));
const only = process.argv[2];

for (const ep of episodes) {
  if (only && ep.id !== only) continue;
  const out = `output/module0-${ep.num}-${ep.slug}.mp4`;
  console.log(`→ ${out}`);
  execFileSync("npx", ["remotion", "render", `Episode-${ep.id}`, out], { stdio: "inherit" });
}
