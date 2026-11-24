import { useEffect, useState } from 'react'
import { Sheet, Field, Spinner, Toggle, confirmDialog } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { SheetGuide, ShortcutGuide } from './Guides.tsx'
import { ProgramImport } from './ProgramImport.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { randomToken } from '../../lib/id.ts'
import { dirtyCount, ping, scriptOutdated, syncNow, SCRIPT_VERSION } from '../../lib/sync.ts'
import { agentLink } from '../../lib/agent.ts'
import { timeAgo } from '../../lib/format.ts'

export function SyncSetup() {
  const sync = useStore((s) => s.sync)
  const setSync = useStore((s) => s.setSync)
  const pending = useStore((s) => dirtyCount(s))
  const outdated = useStore((s) => scriptOutdated(s))
  const [url, setUrl] = useState(sync.url)
  const [token] = useState(() => sync.token || randomToken())
  useEffect(() => {
    // Le jeton est mémorisé tout de suite : il doit rester identique à celui collé dans le script.
    if (!useStore.getState().sync.token) setSync({ token })
  }, [token, setSync])
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const cleanUrl = url.trim()
  const urlOk = /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(cleanUrl)
  const coachOk = !sync.coachUrl || /^https:\/\/docs\.google\.com\/spreadsheets\/d\/[\w-]+/.test(sync.coachUrl.trim())

  const test = async () => {
    setTesting(true)
    setResult(null)
    const r = await ping(cleanUrl, token)
    setResult(r)
    setTesting(false)
    if (r.ok) {
      setSync({ url: cleanUrl, token, enabled: true, lastError: null, scriptVersion: r.version ?? null })
      const s = await syncNow()
      ui.toast(s.message, s.ok ? 'ok' : 'err')
    }
  }

  // L'appel au presse-papiers part directement du toucher : sinon Safari (iPhone) le refuse.
  const copy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text)
      ui.toast('Copié', 'ok')
      return true
    } catch {
      ui.toast('Copie impossible : sélectionne le texte', 'err')
      return false
    }
  }

  // Lien de l'agent calculé d'avance (le calcul est asynchrone), et affiché si la copie échoue.
  const [agentUrl, setAgentUrl] = useState('')
  const [showAgent, setShowAgent] = useState(false)
  useEffect(() => {
    let alive = true
    if (urlOk) void agentLink(cleanUrl, token).then((l) => alive && setAgentUrl(l))
    else setAgentUrl('')
    return () => {
      alive = false
    }
  }, [cleanUrl, token, urlOk])

  return (
    <Sheet title="Google Sheets">
      <div className="stack">
        <div className="callout accent">
          Tes séances, ta diète, tes pas et tes pesées sont envoyés dans un Google Sheet à toi. Le script recopie ensuite les chiffres dans le sheet de ton coach.
        </div>

        {sync.enabled && outdated && (
          <button className="callout warn pressable" style={{ textAlign: 'left' }} onClick={() => ui.push(<SheetGuide token={token} />)}>
            <b>Nouvelle version du script ({SCRIPT_VERSION})</b> : exercices remplacés, exercices en plus et séances décalées bien recopiés chez ton coach.
            Recopie le script depuis le guide, colle-le à la place de l’ancien, puis Déployer → Gérer les déploiements → ✏️ → Nouvelle version.
          </button>
        )}

        <button className="card pressable" onClick={() => ui.push(<SheetGuide token={token} />)}>
          <div className="row">
            <div className="icon-tile">
              <Icon name="book" size={20} />
            </div>
            <div className="grow">
              <div className="bold">Guide d’installation (5 min)</div>
              <div className="faint small">Créer le sheet, coller le script, le déployer</div>
            </div>
            <Icon name="chevron-right" size={18} style={{ color: 'var(--text-3)' }} />
          </div>
        </button>

        <Field label="Lien du sheet de ton coach" hint="Google Sheets → Partager → Copier le lien. Il est inséré dans le script que tu copies depuis le guide.">
          <input
            className="input mono"
            value={sync.coachUrl}
            onChange={(e) => setSync({ coachUrl: e.target.value.trim() })}
            placeholder="https://docs.google.com/spreadsheets/d/…"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </Field>
        {!coachOk && <div className="small danger">Le lien doit commencer par https://docs.google.com/spreadsheets/d/…</div>}

        <Field label="1. Ton jeton secret (déjà inclus dans le script copié)" hint="Il empêche quiconque d’écrire dans ton sheet.">
          <div className="row">
            <input className="input mono grow" value={token} readOnly onFocus={(e) => e.currentTarget.select()} />
            <button className="icon-btn filled" onClick={() => copy(token)} aria-label="Copier le jeton">
              <Icon name="copy" size={18} />
            </button>
          </div>
        </Field>

        <Field label="2. URL de l’application web Apps Script" hint="Elle se termine par /exec.">
          <input
            className="input mono"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/…/exec"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </Field>
        {cleanUrl && !urlOk && <div className="small danger">L’URL doit ressembler à https://script.google.com/macros/s/…/exec</div>}

        <button className="btn block" disabled={!urlOk || testing} onClick={test}>
          {testing ? <Spinner /> : <Icon name="link" size={20} />} Tester et relier
        </button>
        {result && <div className={`callout ${result.ok ? '' : ''}`} style={{ borderColor: result.ok ? 'var(--ok)' : 'var(--danger)' }}>{result.message}</div>}

        {sync.enabled && (
          <div className="card stack" style={{ gap: 8 }}>
            <div className="bold">Agent IA du lundi</div>
            <div className="faint small">
              Chaque lundi, Claude lit ta semaine (séances, diète, pas, poids, ressenti et tes notes) et dépose ses conseils, affichés sur Aujourd’hui. Ce lien lui donne seulement le droit de lire ta semaine et
              de déposer des conseils, jamais d’écrire dans tes données.
            </div>
            <button className="btn soft small" disabled={!agentUrl} onClick={() => void copy(agentUrl).then((ok) => !ok && setShowAgent(true))}>
              <Icon name="copy" size={16} /> Copier le lien de l’agent
            </button>
            {showAgent && agentUrl && (
              <input className="input mono small" value={agentUrl} readOnly onFocus={(e) => e.currentTarget.select()} aria-label="Lien de l’agent" />
            )}
          </div>
        )}

        {sync.enabled && (
          <button className="card pressable" onClick={() => ui.push(<ProgramImport />)}>
            <div className="row">
              <div className="icon-tile">
                <Icon name="dumbbell" size={20} />
              </div>
              <div className="grow">
                <div className="bold">Importer le programme du coach</div>
                <div className="faint small">Séances et exercices de l’onglet Entraînement, avec tes dernières charges</div>
              </div>
              <Icon name="chevron-right" size={18} style={{ color: 'var(--text-3)' }} />
            </div>
          </button>
        )}

        {sync.enabled && (
          <div className="card stack">
            <div className="row-between">
              <div>
                <div className="bold">Synchronisation automatique</div>
                <div className="faint small">
                  {sync.lastPushAt ? `Dernier envoi ${timeAgo(sync.lastPushAt)}` : 'Aucun envoi pour l’instant'}
                  {pending ? ` · ${pending} élément${pending > 1 ? 's' : ''} en attente` : ''}
                </div>
              </div>
              <Toggle on={sync.enabled} onChange={(v) => setSync({ enabled: v })} label="Synchronisation" />
            </div>
            {sync.lastError && <div className="small danger">{sync.lastError}</div>}
            <div className="grid-2">
              <button
                className="btn soft small"
                onClick={async () => {
                  const r = await syncNow()
                  ui.toast(r.message, r.ok ? 'ok' : 'err')
                }}
              >
                <Icon name="sync" size={18} /> Synchroniser
              </button>
              <button
                className="btn soft small"
                onClick={async () => {
                  if (!(await confirmDialog({ title: 'Tout renvoyer ?', message: 'Toutes tes journées et séances seront réécrites dans le sheet (utile après avoir changé la configuration du coach).', confirm: 'Renvoyer' }))) return
                  const s = useStore.getState()
                  const days: Record<string, number> = {}
                  const real = s.sessions.filter((x) => !x.imported)
                  for (const d of new Set([...s.entries.map((e) => e.date), ...s.weighins.map((w) => w.date), ...s.steps.map((x) => x.date), ...real.map((x) => x.date), ...Object.keys(s.daylogs)])) days[d] = 1
                  useStore.setState({
                    dirty: {
                      days,
                      sessions: Object.fromEntries(real.map((x) => [x.id, 1])),
                      checkins: Object.fromEntries(s.checkins.map((x) => [x.id, 1])),
                    },
                  })
                  const r = await syncNow()
                  ui.toast(r.message, r.ok ? 'ok' : 'err')
                }}
              >
                <Icon name="upload" size={18} /> Tout renvoyer
              </button>
            </div>
          </div>
        )}

        <button className="card pressable" onClick={() => ui.push(<ShortcutGuide />)}>
          <div className="row">
            <div className="icon-tile green">
              <Icon name="steps" size={20} />
            </div>
            <div className="grow">
              <div className="bold">Pas automatiques (Raccourci iOS)</div>
              <div className="faint small">Santé → Google Sheet → l’app</div>
            </div>
            <Icon name="chevron-right" size={18} style={{ color: 'var(--text-3)' }} />
          </div>
        </button>
      </div>
    </Sheet>
  )
}
