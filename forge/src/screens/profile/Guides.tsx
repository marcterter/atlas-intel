import { useEffect, useState } from 'react'
import { Sheet } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { runShortcut } from '../today/StepsSheet.tsx'

async function copy(text: string, what = 'Copié') {
  try {
    await navigator.clipboard.writeText(text)
    ui.toast(what, 'ok')
  } catch {
    ui.toast('Copie impossible : sélectionne le texte à la main', 'err')
  }
}

const SCRIPT_URL = './forge-sheet-script.txt'

/** Guide : créer le Google Sheet et déployer le script Apps Script. */
export function SheetGuide({ token }: { token: string }) {
  const [script, setScript] = useState<string | null>(null)
  useEffect(() => {
    fetch(SCRIPT_URL)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then(setScript)
      .catch(() => setScript(null))
  }, [])
  const absoluteScriptUrl = new URL(SCRIPT_URL, window.location.href).href

  return (
    <Sheet title="Relier Google Sheets">
      <div className="stack">
        <div className="callout">
          À faire une seule fois, idéalement sur un ordinateur (l’éditeur de script Google est peu pratique sur téléphone).
        </div>
        <ol className="steps-list">
          <li>
            Crée un nouveau Google Sheet (<b>sheets.new</b>) et nomme-le par exemple <b>Forge – Suivi</b>. C’est <i>ton</i> sheet : l’app y range tout le détail.
          </li>
          <li>
            Dans ce sheet : menu <b>Extensions → Apps Script</b>. Efface le code présent et colle le script Forge.
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn small" disabled={!script} onClick={() => script && copy(script, 'Script copié')}>
                <Icon name="copy" size={16} /> Copier le script
              </button>
              <a className="btn soft small" href={absoluteScriptUrl} target="_blank" rel="noreferrer">
                Ouvrir
              </a>
            </div>
            <div className="faint tiny" style={{ marginTop: 6 }}>
              Lien à ouvrir sur l’ordinateur : <span className="mono">{absoluteScriptUrl}</span>
            </div>
          </li>
          <li>
            Tout en haut du script, remplace <span className="mono">COLLE_TON_JETON_ICI</span> par ton jeton :
            <div className="row" style={{ marginTop: 8 }}>
              <span className="mono grow callout" style={{ padding: '8px 10px' }}>
                {token}
              </span>
              <button className="icon-btn filled" onClick={() => copy(token, 'Jeton copié')} aria-label="Copier le jeton">
                <Icon name="copy" size={18} />
              </button>
            </div>
          </li>
          <li>
            Facultatif pour l’instant : colle l’URL du sheet de ton coach dans <span className="mono">COACH_SHEET_URL</span>. La correspondance avec ses colonnes se règle dans <span className="mono">COACH_MAPPING</span> (voir le README).
          </li>
          <li>
            Clique sur 💾 <b>Enregistrer</b>, puis <b>Déployer → Nouveau déploiement</b>. Type : <b>Application Web</b>. Exécuter en tant que : <b>Moi</b>. Qui a accès : <b>Tout le monde</b>. Puis <b>Déployer</b>.
          </li>
          <li>
            Google demande d’autoriser l’accès : choisis ton compte → <b>Paramètres avancés</b> → <b>Accéder à Forge (non sécurisé)</b> → <b>Autoriser</b>. C’est ton propre script, il n’écrit que dans tes sheets.
          </li>
          <li>
            Copie l’<b>URL de l’application Web</b> (elle finit par <span className="mono">/exec</span>), colle-la dans l’app puis touche <b>Tester et relier</b>.
          </li>
        </ol>
        <div className="callout small">
          Si tu modifies le script plus tard : <b>Déployer → Gérer les déploiements → ✏️ → Version : Nouvelle version</b>. L’URL reste la même.
        </div>
      </div>
    </Sheet>
  )
}

/** Guide : Raccourci iOS qui envoie les pas de Santé vers le sheet. */
export function ShortcutGuide() {
  const sync = useStore((s) => s.sync)
  const name = useStore((s) => s.settings.shortcutName) || 'Forge pas'
  const ready = !!sync.url && !!sync.token
  const urlPrefix = ready ? `${sync.url}?action=pas&token=${sync.token}&steps=` : ''

  return (
    <Sheet title="Pas automatiques">
      <div className="stack">
        <div className="callout accent">
          Une app web ne peut pas lire l’app Santé. Un Raccourci iOS le fait à sa place : il additionne tes pas du jour (iPhone + Apple Watch) et les envoie à ton sheet. Forge les récupère à chaque ouverture.
        </div>
        {!ready && <div className="callout">Relie d’abord ton Google Sheet (étape précédente) : l’URL du raccourci en dépend.</div>}

        <div className="section-label">1 · Créer le raccourci</div>
        <ol className="steps-list">
          <li>
            Ouvre l’app <b>Raccourcis</b> → onglet <b>Raccourcis</b> → <b>+</b>. Renomme-le exactement <b>{name}</b>.
          </li>
          <li>
            Ajoute l’action <b>Rechercher des échantillons de santé</b> : type <b>Nombre de pas</b>, date de début <b>est aujourd’hui</b>, <b>Regrouper par : Jour</b>.
          </li>
          <li>
            Ajoute <b>Calculer des statistiques</b> → <b>Somme</b> (des échantillons de santé).
          </li>
          <li>
            Ajoute <b>Obtenir le contenu de l’URL</b>. Dans le champ URL, colle :
            {ready ? (
              <div className="row" style={{ marginTop: 8 }}>
                <span className="mono grow callout" style={{ padding: '8px 10px' }}>
                  {urlPrefix}
                </span>
                <button className="icon-btn filled" onClick={() => copy(urlPrefix, 'URL copiée')} aria-label="Copier l’URL">
                  <Icon name="copy" size={18} />
                </button>
              </div>
            ) : (
              <span className="faint"> (disponible une fois le sheet relié)</span>
            )}
            puis, juste après <span className="mono">steps=</span>, insère la variable <b>Statistiques</b>. Méthode : <b>GET</b>.
          </li>
          <li>Lance-le une fois avec ▶︎ et autorise l’accès à Santé.</li>
        </ol>

        <div className="section-label">2 · L’automatiser</div>
        <ol className="steps-list">
          <li>
            Onglet <b>Automatisation</b> → <b>+</b> → <b>Heure de la journée</b> → par ex. <b>13:00</b>, <b>Quotidien</b>.
          </li>
          <li>
            Choisis <b>Exécuter immédiatement</b> (et désactive la notification), puis sélectionne le raccourci <b>{name}</b>.
          </li>
          <li>
            Recommence pour <b>19:00</b> et <b>22:30</b>. Chaque envoi remplace la valeur du jour.
          </li>
        </ol>
        <div className="callout small">
          iOS bloque l’accès à Santé quand l’iPhone est verrouillé : si une automatisation tombe à ce moment-là, la suivante rattrapera. Tu peux aussi toucher <b>Envoyer mes pas</b> dans l’app (carte Pas).
        </div>
        {ready && (
          <button className="btn soft block" onClick={runShortcut}>
            <Icon name="shortcut" size={18} /> Tester le raccourci
          </button>
        )}
      </div>
    </Sheet>
  )
}
