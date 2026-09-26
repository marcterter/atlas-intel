// Affiche, pour une scène, la note de visuel et chaque phrase avec son beat et son début (s).
// Usage : node tools/scene-info.mjs S07
import { readFileSync } from "node:fs";

const id = process.argv[2];
const src = JSON.parse(readFileSync(new URL("../narration/source/module1-scenes.json", import.meta.url)))[Number(id.slice(1)) - 1];
const { episodes } = JSON.parse(readFileSync(new URL("../narration/module1.json", import.meta.url)));
const timings = JSON.parse(readFileSync(new URL("../src/generated/timings.json", import.meta.url)));
const scene = episodes.flatMap((e) => e.scenes).find((s) => s.id === id);
const t = timings[id];
console.log(`${id} — ${scene.chapter} ${scene.chapterTitle} — ${scene.title} — voix ${t?.duration ?? "?"} s\n`);
console.log(`VISUEL PRÉVU :\n${src.visual}\n`);
scene.sentences.forEach((s, i) => console.log(`s${i}  beat ${s.beat}  @${t ? t.sentences[i].start.toFixed(1) : "?"}s  ${s.text}`));
