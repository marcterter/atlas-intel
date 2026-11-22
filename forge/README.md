# FORGE — séances, diète, pas et bilans dans une seule app

App web installable sur iPhone (PWA) : elle s'ouvre en plein écran depuis l'écran d'accueil et marche hors connexion à la salle.

![Aperçu des écrans](docs/apercu.png)

| Module | Ce que ça fait |
| --- | --- |
| **Séance** | Programmes (Push, Pull…), séance en direct avec **tes perfs de la dernière fois sur chaque série**, chrono de repos auto (bip, vibration, −15 / +15 s), échauffement / dégressive / échec, supersets, cardio, exercice de remplacement si la machine est prise, notes. Récap de fin : tonnage, records battus, comparaison avec la dernière fois. |
| **Diète** | Calories et macros **restantes** (objectifs différents jour d'entraînement / repos possibles), 4 repas, base d'aliments courants intégrée, recherche et **scan code-barres** Open Food Facts, ajout rapide, aliments et recettes perso, favoris, copie du repas de la veille. |
| **Pas** | Pas du jour et 7 derniers jours, envoyés par un **Raccourci iOS** depuis Santé (iPhone + Apple Watch), ou saisis à la main. |
| **Suivi** | Courbe par exercice (charge, volume, 1RM estimé), tonnage et séries par muscle sur 7 jours, historique. Pesée quotidienne avec **moyenne de la semaine**, bilan hebdo (mensurations, photos face/profil/dos, ressenti), avant / après. |
| **Google Sheets** | Tout part dans **ton** Google Sheet (onglets Jours, Repas, Séances, Détail séries, Pas, Bilans) puis le script recopie les chiffres dans **le sheet du coach**. |

Les données vivent sur le téléphone (IndexedDB). Sauvegarde / restauration en JSON dans Profil.

---

## 1. Mettre l'app en ligne (Vercel, 5 min)

Le dossier `forge/` est un projet Vite autonome, à côté d'Atlas Intel (rien n'est modifié côté Atlas Intel).

1. Sur [vercel.com](https://vercel.com) : **Add New → Project** → importe le repo `atlas-intel`.
2. **Root Directory** : clique sur *Edit* et choisis `forge`. Vercel détecte Vite tout seul (build `npm run build`, sortie `dist`).
3. **Deploy**. Tu obtiens une URL du type `forge-xxx.vercel.app`.

> Vercel déploie la branche `main`. Tant que le code est sur une autre branche, fusionne-la dans `main` (ou change la *Production Branch* dans Settings → Git).

## 2. L'installer sur l'iPhone

Ouvre l'URL dans **Safari** → bouton **Partager** → **Sur l'écran d'accueil**. Ouvre toujours Forge depuis cette icône : c'est là que tes données sont stockées (Safari et l'icône ne partagent pas les mêmes données).

## 3. Relier Google Sheets (une fois, idéalement sur ordinateur)

1. Crée un Google Sheet vide (`sheets.new`), par ex. **Forge – Suivi**.
2. **Extensions → Apps Script**, efface le code et colle [`apps-script/Code.gs`](apps-script/Code.gs) (aussi copiable depuis l'app : Profil → Google Sheets → Guide).
3. Remplace `COLLE_TON_JETON_ICI` par le jeton affiché dans l'app (Profil → Google Sheets).
4. **Déployer → Nouveau déploiement → Application Web** — Exécuter en tant que : **Moi** — Accès : **Tout le monde** → autorise.
5. Copie l'URL `…/exec` dans l'app → **Tester et relier**.

L'app envoie ensuite automatiquement : au démarrage, au retour dans l'app et quelques secondes après chaque modification (jamais pendant une séance en cours). Hors ligne, les modifications attendent le retour du réseau.

## 4. Les pas automatiques (Raccourci iOS)

Une app web ne peut pas lire Santé : un Raccourci le fait. Le pas-à-pas complet (avec l'URL à coller, jeton inclus) est dans l'app : **Profil → Pas automatiques**. En résumé :

`Rechercher des échantillons de santé (Nombre de pas, aujourd'hui, regrouper par jour)` → `Calculer des statistiques (Somme)` → `Obtenir le contenu de l'URL` : `https://script.google.com/…/exec?action=pas&token=TON_JETON&steps=[Statistiques]`

Puis 2 ou 3 automatisations **Heure de la journée** (13 h, 19 h, 22 h 30) en « Exécuter immédiatement ». iOS bloque Santé quand l'iPhone est verrouillé : un envoi raté est rattrapé par le suivant, ou via le bouton **Envoyer mes pas** de l'app.

## 5. Le sheet du coach

Dans `Code.gs` :

- `COACH_SHEET_URL` : l'URL du sheet du coach (il doit te l'avoir partagé **en modification**) ;
- `COACH_MAPPING` : où écrire chaque chiffre. Deux dispositions sont gérées :
  - **une ligne par jour** (dates dans une colonne) — exemple A dans le script ;
  - **une colonne par jour** (un onglet par semaine, dates sur une ligne) — exemple B.
- Le script n'écrit que dans les cellules configurées : formules et commentaires du coach ne sont pas touchés. Une date introuvable est signalée dans l'app.
- La fonction `diagnosticCoach()` (à lancer depuis l'éditeur) affiche la structure du sheet du coach pour régler la correspondance.

Après modification : Déployer → Gérer les déploiements → ✏️ → *Nouvelle version*, puis dans l'app **Profil → Google Sheets → Tout renvoyer** pour remplir l'historique.

---

## Développement

```bash
cd forge
npm install
npm run dev        # serveur local
npm test           # tests (calculs + script Apps Script simulé)
npm run typecheck
npm run build      # sortie dans dist/
```

- React 19 + TypeScript + Vite 8, `vite-plugin-pwa` (hors ligne), Zustand + IndexedDB (`idb-keyval`).
- Scan : `BarcodeDetector` natif, sinon `barcode-detector` (ZXing en WebAssembly, servi par l'app).
- Aliments du commerce : [Open Food Facts](https://world.openfoodfacts.org) (base libre). Aliments génériques : valeurs moyennes type Ciqual, pour 100 g.
- `scripts/render-icons.mjs` régénère les icônes à partir de `public/favicon.svg`.

## Limites connues

- Le bip de fin de repos ne sonne que si l'app est ouverte (l'écran reste allumé pendant la séance). Sur iPhone, la vibration demande iOS 18+.
- La recherche Open Food Facts et le scan demandent du réseau ; la base intégrée, elle, marche hors ligne.
- Les photos de bilan restent sur le téléphone (incluses dans les données locales, pas dans l'export JSON).
