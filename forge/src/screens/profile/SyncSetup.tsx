import { useEffect, useState } from 'react'
import { Sheet, Field, Spinner, Toggle, confirmDialog } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { SheetGuide, ShortcutGuide } from './Guides.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { randomToken } from '../../lib/id.ts'
import { dirtyCount, ping, syncNow } from '../../lib/sync.ts'
import { timeAgo } from '../../lib/format.ts'

export function SyncSetup() {
  const sync = useStore((s) => s.sync)
  const setSync = useStore((s) => s.setSync)
  const pending = useStore((s) => dirtyCount(s))
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

  const test = async () => {
    setTesting(true)
    setResult(null)
    const r = await ping(cleanUrl, token)
    setResult(r)
    setTesting(false)
    if (r.ok) {
      setSync({ url: cleanUrl, token, enabled: true, lastError: null })
      const s = await syncNow()
      ui.toast(s.message, s.ok ? 'ok' : 'err')
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      ui.toast('Copié', 'ok')
    } catch {
      ui.toast('Copie impossible : sélectionne le texte', 'err')
    }
  }

  return (
    <Sheet title="Google Sheets">
      <div className="stack">
        <div className="callout accent">
          Tes séances, ta diète, tes pas et tes pesées sont envoyés dans un Google Sheet à toi. Le script recopie ensuite les chiffres dans le sheet de ton coach.
        </div>

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

        <Field label="1. Ton jeton secret (à coller dans le script)" hint="Il empêche quiconque d’écrire dans ton sheet.">
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
                  for (const d of new Set([...s.entries.map((e) => e.date), ...s.weighins.map((w) => w.date), ...s.steps.map((x) => x.date), ...s.sessions.map((x) => x.date)])) days[d] = 1
                  useStore.setState({
                    dirty: {
                      days,
                      sessions: Object.fromEntries(s.sessions.map((x) => [x.id, 1])),
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
