// Importe la narration de narration/source/module0-video.html dans narration/module0.json.
// Les scènes et le texte lu sont repris tels quels ; chaque « beat » est découpé en
// phrases (une piste audio et un sous-titre par phrase), en gardant son index pour
// caler les animations. Le regroupement en épisodes est défini par EPISODES.
import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync(new URL("../narration/source/module0-video.html", import.meta.url), "utf8");
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((m) => m[1])
  .find((s) => s.includes("const SCENES"));
const SCENES = new Function(`${script}; return SCENES;`)();

const CHAPTERS = [
  "Ouverture",
  "La carte du système",
  "De ta question à la réponse",
  "Les objets",
  "Les fournisseurs",
  "Calcul, mémoire, communication",
  "L'électricité et la chaleur",
  "Flux et contraintes",
  "Les technologies qui déplacent les contraintes",
  "Premier modèle économique",
  "Du matériel aux tokens et à la marge",
  "Scénarios et entreprises",
  "Unités et glossaire",
  "Sources et méthode",
  "Le test",
  "Fin",
];

// Épisodes de 3 à 5 minutes : chapitres regroupés ou découpés selon la durée de la voix.
// narration/episodes.json : [numéro, titre, première scène, dernière scène] (scènes du HTML, base 1).
const EPISODES = JSON.parse(readFileSync(new URL("../narration/episodes.json", import.meta.url), "utf8"));

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
    .split(/(?<=[.!?…])\s+(?=[A-ZÀÂÉÈÊÎÔÛÇ«"])/)
    .map((s) => s.trim())
    .filter(Boolean);

const scenes = SCENES.map((s, i) => {
  const chapter = CHAPTERS.indexOf(s.chapter);
  if (chapter === -1) throw new Error(`Chapitre inconnu : ${s.chapter}`);
  return {
    id: `S${num(i + 1)}`,
    chapter: num(chapter),
    chapterTitle: s.chapter,
    title: s.title,
    sentences: s.beats.flatMap((beat, b) => splitSentences(beat).map((text) => ({ text, beat: b }))),
  };
});

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
  new URL("../narration/module0.json", import.meta.url),
  JSON.stringify({ module: "Module 0 — Du sable au token", episodes }, null, 2) + "\n",
);
console.log(`${scenes.length} scènes, ${episodes.length} épisodes`);
