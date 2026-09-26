# Module 1 en vidéo — « Du courant électrique aux calculs de l’IA »

Projet Remotion qui transforme le module 1 (*Physique des semi-conducteurs et
transistors*) en épisodes MP4 1920×1080, narrés en français. Même outillage que
`video-module0/`.

Style : motion design minimaliste sur fond bleu nuit étoilé, une idée par scène,
chapitre en haut à gauche (`01 | La carte du système`), sous-titre centré en bas,
typographie Inter fine, visuels 100 % vectoriels (tracés, compteurs, flèches,
particules lentes), fondus entre scènes.

## Fonctionnement

1. `narration/module1.json` : épisodes → scènes → phrases, chaque phrase portant
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

Pas de HTML de narration pour ce module : la narration a été écrite à partir du PDF
dans `narration/source/module1-scenes.json` (scènes, beats et note de visuel), puis
`node tools/import-scenes.mjs` produit `narration/module1.json`. Relecture :
`narration/module1-narration.md`. Voix plus posée que le module 0 (vitesse 0,9,
0,5 s entre les phrases). Épisodes : `narration/episodes.json` (14 épisodes, un
chapitre ou deux par épisode).
