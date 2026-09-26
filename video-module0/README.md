# Module 0 en vidéo — « Du sable au token »

Projet Remotion qui transforme le module 0 (*Comprendre toute la chaîne de
l’infrastructure IA*) en épisodes MP4 1920×1080, narrés en français.

Style : motion design minimaliste sur fond bleu nuit étoilé, une idée par scène,
chapitre en haut à gauche (`01 | La carte du système`), sous-titre centré en bas,
typographie Inter fine, visuels 100 % vectoriels (tracés, compteurs, flèches,
particules lentes), fondus entre scènes.

## Fonctionnement

1. `narration/module0.json` : épisodes → scènes → phrases, chaque phrase portant
   l’index de son « beat » du HTML (utilisé pour caler les animations). Le champ
   facultatif `say` remplace le texte lu par la voix.
2. `tools/tts.py` synthétise chaque phrase, assemble une piste par scène
   (`public/audio/<scène>.wav`) et écrit les timings dans
   `src/generated/timings.json`.
3. Remotion cale la durée de chaque scène sur son audio (+ marges), synchronise
   sous-titres et animations sur le début de chaque phrase, et enchaîne les
   scènes par des fondus.

## Commandes

```bash
npm i
# la voix off (public/audio, ~110 Mo) n’est pas versionnée : la générer avant le rendu
tools/setup-tts.sh                          # moteur de voix local (Kokoro)
npm run tts -- --only S01                   # voix d'une scène
npm run tts -- --episode E01                # voix d'un épisode (scènes de E01)
npm run tts -- --engine elevenlabs          # ELEVENLABS_API_KEY (+ ELEVENLABS_VOICE_ID)
npm run tts -- --engine say --voice Thomas  # macOS
npm run dev                                 # prévisualisation (Remotion Studio)
npx remotion render Scene-S01 output/scene.mp4
npm run render:all                          # tous les épisodes → output/
```

Voix par défaut : Kokoro v1.0, voix `ff_siwis`, calculée en local. Le
dictionnaire de prononciation (`PRONUNCIATION` dans `tools/tts.py`) épelle les
sigles (IA, GPU, HBM…) et francise « token ». Il ne modifie jamais les
sous-titres.

## Découpage en épisodes

La narration et les 46 scènes viennent de `narration/source/module0-video.html`
(`node tools/import-html.mjs` régénère `narration/module0.json`). Le bandeau en
haut à gauche indique le chapitre de chaque scène ; les épisodes regroupent des
chapitres consécutifs pour tenir entre 3 et 5 min (`narration/episodes.json`).
Durée totale : environ 38 min.

| Ép. | Titre | Chapitres | Scènes | Durée |
|----|-------|-----------|--------|-------|
| 01 | Ouverture et carte du système | 00 Ouverture, 01 La carte du système | S01–S05 | 3 min 21 |
| 02 | De ta question aux objets physiques | 02 De ta question à la réponse, 03 Les objets | S06–S12 | 4 min 40 |
| 03 | Les fournisseurs | 04 Les fournisseurs | S13–S18 | 4 min 54 |
| 04 | Calcul, mémoire, électricité et chaleur | 05 Calcul, mémoire, communication, 06 L'électricité et la chaleur | S19–S24 | 5 min 19 |
| 05 | Flux, contraintes et technologies | 07 Flux et contraintes, 08 Les technologies qui déplacent les contraintes | S25–S29 | 5 min 02 |
| 06 | Modèle économique, tokens et marge | 09 Premier modèle économique, 10 Du matériel aux tokens et à la marge | S30–S34 | 4 min 33 |
| 07 | Scénarios, entreprises et glossaire | 11 Scénarios et entreprises, 12 Unités et glossaire | S35–S40 | 4 min 24 |
| 08 | Sources et cahier de validation | 13 Sources et méthode, 14 Le test, 15 Fin | S41–S46 | 5 min 29 |
