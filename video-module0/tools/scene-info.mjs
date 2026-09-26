// Affiche, pour une scène, le visuel du HTML source et chaque phrase avec son beat et son début (s).
// Usage : node tools/scene-info.mjs S07
import { readFileSync } from "node:fs";

const id = process.argv[2];
const n = Number(id.slice(1));
const html = readFileSync(new URL("../narration/source/module0-video.html", import.meta.url), "utf8");
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes("const SCENES"));
const calls = [];
new Function("SCENES", "S0", `${script.replace("const SCENES = [];", "").replace(/const S = [^\n]*/, "const S=(c,t,v,b)=>SCENES.push({c,t,v,b});")}`)(calls);
const src = calls[n - 1];
const { episodes } = JSON.parse(readFileSync(new URL("../narration/module0.json", import.meta.url)));
const timings = JSON.parse(readFileSync(new URL("../src/generated/timings.json", import.meta.url)));
const scene = episodes.flatMap((e) => e.scenes).find((s) => s.id === id);
const t = timings[id];
console.log(`${id} — ${scene.chapter} ${scene.chapterTitle} — ${scene.title} — voix ${t.duration} s\n`);
console.log("VISUEL HTML :\n" + src.v.replace(/<[^>]+>/g, (m) => (/^<\/(div|tr|li|h2|p|g)>/.test(m) ? "\n" : " ")).replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n") + "\n");
scene.sentences.forEach((s, i) => console.log(`s${i}  beat ${s.beat}  @${t.sentences[i].start.toFixed(1)}s  ${s.text}`));
