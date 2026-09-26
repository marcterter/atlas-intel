# Module 0 en vidéo — « Du sable au token »

Projet Remotion qui transforme le module 0 (*Comprendre toute la chaîne de
l’infrastructure IA*) en épisodes MP4 1920×1080, narrés en français.

Style : motion design minimaliste sur fond bleu nuit étoilé, une idée par scène,
chapitre en haut à gauche (`01 | La carte du système`), sous-titre centré en bas,
typographie Inter fine, visuels 100 % vectoriels (tracés, compteurs, flèches,
particules lentes), fondus entre scènes.

## Fonctionnement

1. `narration/module0.json` : épisodes → scènes → phrases. Chaque phrase est un
   sous-titre ; le champ facultatif `say` remplace le texte lu par la voix.
2. `tools/tts.py` synthétise chaque phrase, assemble une piste par scène
   (`public/audio/<scène>.wav`) et écrit les timings dans
   `src/generated/timings.json`.
3. Remotion cale la durée de chaque scène sur son audio (+ marges), synchronise
   sous-titres et animations sur le début de chaque phrase, et enchaîne les
   scènes par des fondus.

## Commandes

```bash
npm i
tools/setup-tts.sh                          # moteur de voix local (Kokoro)
npm run tts -- --only E00-S01               # voix d'une scène
npm run tts -- --episode E01                # voix d'un épisode
npm run tts -- --engine elevenlabs          # ELEVENLABS_API_KEY (+ ELEVENLABS_VOICE_ID)
npm run tts -- --engine say --voice Thomas  # macOS
npm run dev                                 # prévisualisation (Remotion Studio)
npx remotion render Scene-E00-S01 output/scene.mp4
npm run render:all                          # tous les épisodes → output/
```

Voix par défaut : Kokoro v1.0, voix `ff_siwis`, calculée en local. Le
dictionnaire de prononciation (`PRONUNCIATION` dans `tools/tts.py`) épelle les
sigles (IA, GPU, HBM…) et francise « token ». Il ne modifie jamais les
sous-titres.

## Découpage prévu (épisodes de 3 à 5 min)

| Ép. | Chapitre | Pages du PDF |
|----|----------|--------------|
| 00 | Le but du module | 1 |
| 01 | La carte du système | 2 |
| 02 | De ta question à la réponse | 3 |
| 03 | Les objets, de la fabrication au serveur | 4 |
| 04 | Les fournisseurs en amont des systèmes | 5 |
| 05 | Des substrats à l’exploitation cloud | 6 |
| 06 | Calcul, mémoire et communication | 7 |
| 07 | L’électricité et la chaleur | 8 |
| 08 | Les flux et les contraintes actuelles | 9 |
| 09 | Les technologies qui déplacent les contraintes | 10 |
| 10 | Premier modèle économique | 11 |
| 11 | Du matériel aux tokens et à la marge | 12 |
| 12 | Scénarios et entreprises à retenir | 13 |
| 13 | Unités, glossaire et résumé investisseur | 14–15 |
| 14 | Le cahier de validation | 16–19 |
