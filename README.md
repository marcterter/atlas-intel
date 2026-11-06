# ATLAS INTEL — Guide de déploiement

## Prérequis (5 minutes)
1. Compte GitHub gratuit → github.com
2. Compte Vercel gratuit → vercel.com (connexion avec GitHub)

## Étapes

### 1. Mettre le projet sur GitHub
- Va sur github.com → New Repository
- Nomme-le "atlas-intel"
- Clique "Create repository"
- Sur la page suivante, clique "uploading an existing file"
- Glisse TOUT le dossier atlas-intel
- Clique "Commit changes"

### 2. Déployer sur Vercel
- Va sur vercel.com
- "Add New Project"
- Sélectionne ton repo "atlas-intel"
- Laisse tous les paramètres par défaut
- Clique "Deploy"
- En 2 minutes → ton URL type : atlas-intel-marc.vercel.app

### 3. Accès
- Téléphone : ouvre l'URL dans Safari/Chrome
- Ordinateur : même URL
- Les données se sauvegardent automatiquement (localStorage)

## Mise à jour du portfolio
Quand tu changes tes positions, dis-le à Claude qui te donnera
un fichier App.jsx mis à jour → tu remplaces le fichier sur GitHub
→ Vercel se redéploie automatiquement en 1 minute.

## Clé API
L'app utilise l'API Claude pour les mises à jour LIVE.
Elle est intégrée automatiquement dans claude.ai.
Si tu veux l'héberger séparément, contacte Claude pour adapter le code.

## Onglet DESK — le papier « One-Person Hedge Fund » appliqué

La partie calculable du papier *How to Build a One-Person Hedge Fund With Grok Bot* (sections III à VI).
Pas d'agents autonomes, aucun ordre envoyé à un courtier : l'app calcule, c'est toi qui exécutes.

| Sous-onglet | Ce qu'il fait | Papier |
|---|---|---|
| LABO | Charge 5 ans / 10 ans / max de cours journaliers (Yahoo via `/api/history`, ou import CSV), backteste le *Desk Signal* (ruban EMA 8/21/50/200, cassure 20 barres, volume ≥ 1,5×, RSI > 50, filtre ATR) et passe les 7 tests statistiques de la table III : n ≥ 30, R_net hors échantillon > 0, Sharpe déflaté ≥ 0,95, walk-forward ≥ 70 % de fenêtres positives, dernière année positive, plateau de paramètres ±20 %, test de bruit (+1 barre, slippage ×2). Verdict : promotion à l'échelon 1 ou cimetière. Export du Pine Script v6. | III, IV |
| TAILLE | Taille fixe-fractionnaire (13)–(14), Kelly/4 plafonné (15)–(16), fiche d'ordre au format fixe, contrôle des risques avec veto (f_max, heat ≤ 5 %, positions max, résultats pendant la détention, corrélation > 0,7, doublon, tickers interdits). | V |
| JOURNAL | Opérations simulées ou réelles, exécution vs plan, R, leçon obligatoire. Coupe-circuit (table V) recalculé en continu. | II.F, V.F |
| ÉCHELLE | Échelle de la simulation au réel en 5 échelons (table VI), test de cohérence z (19), dérive sous le 5e percentile Monte Carlo, revue du dimanche, cimetière des idées. | VI |
| RISQUE | Risque ouvert du desk (18), corrélation sur 1 an des lignes du portefeuille, volatilité σ_p (17), regroupement en « paris » à ρ > 0,7. | V.D |
| RÈGLES | Règles du desk modifiables, sauvegarde / restauration JSON. | II.C |

**Données de marché.** Une fois déployée sur Vercel, la fonction `api/history.js` récupère l'historique Yahoo Finance côté serveur.
C'est un point d'accès non officiel : il peut être limité ou changer. Dans ce cas, ou en local (`npm run dev`), utilise le bouton CSV
(export Yahoo, TradingView « Export chart data », Stooq ou Excel FR). Pour les titres européens, utilise le suffixe Yahoo (ENR.DE, MC.PA).

**Sauvegarde.** Journal, échelle et cimetière vivent dans le navigateur (localStorage). Exporte-les régulièrement depuis RÈGLES.

**Tests.** `npm test` (exemples chiffrés du papier, mécanique du backtest, DSR, CSV, contrôle des risques, coupe-circuit, échelle, API).
