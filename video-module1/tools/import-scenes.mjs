// Importe la narration de narration/source/module1-scenes.json dans narration/module1.json.
// Chaque « beat » est découpé en phrases (une piste audio et un sous-titre par phrase),
// en gardant son index pour caler les animations. Les chapitres sont numérotés dans
// l'ordre d'apparition ; le regroupement en épisodes vient de narration/episodes.json.
import { readFileSync, writeFileSync } from "node:fs";

const SCENES = JSON.parse(readFileSync(new URL("../narration/source/module1-scenes.json", import.meta.url), "utf8"));
// [numéro, titre, première scène, dernière scène] (scènes numérotées à partir de 1).
const EPISODES = JSON.parse(readFileSync(new URL("../narration/episodes.json", import.meta.url), "utf8"));

const CHAPTERS = [...new Set(SCENES.map((s) => s.chapter))];
const num = (n) => String(n).padStart(2, "0");
const slugify = (s) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const splitSentences = (beat) =>
  beat
    .split(/(?<=[.!?…])\s+(?=[A-ZÀÂÉÈÊÎÔÛÇ«"0-9])/)
    .map((s) => s.trim())
    .filter(Boolean);

const scenes = SCENES.map((s, i) => ({
  id: `S${num(i + 1)}`,
  chapter: num(CHAPTERS.indexOf(s.chapter)),
  chapterTitle: s.chapter,
  title: s.title,
  sentences: s.beats.flatMap((beat, b) => splitSentences(beat).map((text) => ({ text, beat: b }))),
}));

const episodes = EPISODES.map(([n, title, first, last]) => ({
  id: `E${num(n)}`,
  num: num(n),
  title,
  slug: slugify(title),
  scenes: scenes.slice(first - 1, last),
}));

const covered = episodes.flatMap((e) => e.scenes).length;
if (covered !== scenes.length) throw new Error(`${covered} scènes rangées sur ${scenes.length}`);

writeFileSync(
  new URL("../narration/module1.json", import.meta.url),
  JSON.stringify({ module: "Module 1 — Du courant électrique aux calculs de l'IA", episodes }, null, 2) + "\n",
);
console.log(`${scenes.length} scènes, ${CHAPTERS.length} chapitres, ${episodes.length} épisodes`);
