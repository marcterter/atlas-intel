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
