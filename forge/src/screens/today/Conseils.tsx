import { Icon } from '../../components/Icon.tsx'
import { Markdown } from '../../components/Markdown.tsx'
import { Sheet } from '../../components/ui.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { addDays, formatShort, todayISO } from '../../lib/date.ts'

/** Conseils complets de l'agent IA du lundi. */
export function ConseilsSheet() {
  const c = useStore((s) => s.conseils)
  return (
    <Sheet title="Conseils de la semaine">
      {c ? (
        <div className="stack">
          <div className="faint small">
            Semaine du {formatShort(c.semaine)} au {formatShort(addDays(c.semaine, 6))}
            {c.date ? ` · rédigés le ${new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
          </div>
          <Markdown text={c.texte} />
          <div className="callout small">Rédigés par Claude à partir de tes données (séances, diète, pas, poids, ressenti). Ce ne sont pas des avis médicaux, et ton coach reste ton référent pour le programme.</div>
        </div>
      ) : (
        <div className="faint">Pas encore de conseils : l’agent passe chaque lundi matin.</div>
      )}
    </Sheet>
  )
}

/** Carte d'Aujourd'hui : début des conseils de la semaine, jusqu'à ce qu'ils soient lus (et au plus deux semaines). */
export function ConseilsCard() {
  const c = useStore((s) => s.conseils)
  const vus = useStore((s) => s.conseilsVus)
  const markSeen = useStore((s) => s.markConseilsSeen)
  if (!c || vus === c.semaine || todayISO() > addDays(c.semaine, 14)) return null
  // Aperçu : les premières lignes (titres et puces), le reste dans « Tout lire ».
  const lines = c.texte.split('\n').filter((l) => l.trim())
  const preview = lines.slice(0, 6).join('\n')
  return (
    <div className="card conseils">
      <div className="card-head" style={{ marginBottom: 6 }}>
        <div className="icon-tile violet">
          <Icon name="bolt" size={20} />
        </div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="card-title">Conseils de la semaine</div>
          <div className="faint small">Agent IA · semaine du {formatShort(c.semaine)}</div>
        </div>
      </div>
      <Markdown text={preview} />
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn soft grow" onClick={markSeen}>
          OK, vu
        </button>
        <button className="btn grow" onClick={() => ui.push(<ConseilsSheet />)}>
          {lines.length > 6 ? 'Tout lire' : 'Ouvrir'}
        </button>
      </div>
    </div>
  )
}
