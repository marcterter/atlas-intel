import { useState } from 'react'
import { Sheet, Ring, promptNumber, Spinner } from '../../components/ui.tsx'
import { MiniBars } from '../../components/charts.tsx'
import { Icon } from '../../components/Icon.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { dayLetter, lastNDays, relativeDay, todayISO } from '../../lib/date.ts'
import { fmt, timeAgo } from '../../lib/format.ts'
import { isConfigured, syncNow } from '../../lib/sync.ts'
import { isIOS } from '../../lib/device.ts'
import { ShortcutGuide } from '../profile/Guides.tsx'

export async function editSteps(date: string) {
  const cur = useStore.getState().steps.find((s) => s.date === date)
  const v = await promptNumber({
    title: `Pas · ${relativeDay(date)}`,
    hint: 'Saisie manuelle (remplacée si ton iPhone envoie une valeur plus récente).',
    initial: cur?.steps ?? null,
    suffix: 'pas',
    allowClear: true,
  })
  if (v === undefined) return
  useStore.getState().setSteps(date, v == null ? null : Math.round(v), 'manuel')
}

/** Lance le Raccourci iOS qui lit Santé et envoie les pas au Google Sheet. */
export function runShortcut() {
  const name = useStore.getState().settings.shortcutName || 'Forge pas'
  window.location.href = `shortcuts://run-shortcut?name=${encodeURIComponent(name)}`
}

export function StepsSheet({ date }: { date: string }) {
  const steps = useStore((s) => s.steps)
  const goal = useStore((s) => s.targets.steps)
  const configured = useStore((s) => isConfigured(s))
  const lastPull = useStore((s) => s.sync.lastPullAt)
  const [busy, setBusy] = useState(false)
  const days = lastNDays(date, 7)
  const values = days.map((d) => steps.find((s) => s.date === d)?.steps ?? null)
  const today = steps.find((s) => s.date === date)
  const avg = values.filter((v): v is number => v != null)
  const mean = avg.length ? avg.reduce((a, b) => a + b, 0) / avg.length : null

  const refresh = async () => {
    setBusy(true)
    const r = await syncNow({ pullOnly: true })
    setBusy(false)
    ui.toast(r.ok ? (r.pulledSteps ? 'Pas mis à jour' : 'Aucun nouveau relevé') : r.message, r.ok ? 'ok' : 'err')
  }

  return (
    <Sheet title="Pas">
      <div className="stack">
        <div className="card center" style={{ display: 'grid', placeItems: 'center', gap: 6 }}>
          <Ring value={goal ? (today?.steps ?? 0) / goal : 0} size={170} stroke={13} color="var(--steps)">
            <div className="big-number" style={{ fontSize: 36 }}>
              {today ? fmt(today.steps) : '–'}
            </div>
            <div className="tiny faint bold">/ {fmt(goal)} PAS</div>
          </Ring>
          <div className="muted small">
            {relativeDay(date)}
            {today ? ` · ${today.source === 'sante' ? 'depuis Santé' : 'saisi à la main'} · ${timeAgo(today.at)}` : ''}
          </div>
          <button className="btn soft small" onClick={() => editSteps(date)}>
            <Icon name="pencil" size={16} /> Saisir à la main
          </button>
        </div>

        <div className="card">
          <div className="row-between" style={{ marginBottom: 12 }}>
            <div className="bold">7 derniers jours</div>
            <div className="faint small">moyenne {mean != null ? fmt(mean) : '–'}</div>
          </div>
          <MiniBars values={values} labels={days.map(dayLetter)} goal={goal} highlight={6} />
        </div>

        <div className="section-label">Depuis ton iPhone</div>
        {configured ? (
          <div className="card stack">
            <div className="small muted">
              Ton Raccourci iOS lit tes pas dans Santé (iPhone + Apple Watch) et les envoie à ton Google Sheet. L’app les récupère à chaque ouverture.
              {lastPull ? ` Dernière vérification ${timeAgo(lastPull)}.` : ''}
            </div>
            <div className="grid-2">
              {isIOS() && (
                <button className="btn small" onClick={runShortcut}>
                  <Icon name="shortcut" size={18} /> Envoyer mes pas
                </button>
              )}
              <button className="btn soft small" onClick={refresh} disabled={busy}>
                {busy ? <Spinner /> : <Icon name="sync" size={18} />} Récupérer
              </button>
            </div>
            <button className="link-btn" style={{ textAlign: 'left' }} onClick={() => ui.push(<ShortcutGuide />)}>
              Configurer le Raccourci iOS →
            </button>
          </div>
        ) : (
          <div className="callout">
            Pour que tes pas remontent tout seuls, relie d’abord ton Google Sheet (Profil → Synchronisation), puis crée le Raccourci iOS.{' '}
            <button className="link-btn" onClick={() => ui.push(<ShortcutGuide />)}>
              Voir le guide
            </button>
          </div>
        )}
        {date !== todayISO() && <div className="faint small center">Tu consultes {relativeDay(date).toLowerCase()}.</div>}
      </div>
    </Sheet>
  )
}
