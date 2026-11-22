import { useState } from 'react'
import { Icon } from '../../components/Icon.tsx'
import { Spinner } from '../../components/ui.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { dirtyCount, isConfigured, syncNow } from '../../lib/sync.ts'
import { SyncSetup } from './SyncSetup.tsx'

export function SyncChip() {
  const configured = useStore((s) => isConfigured(s))
  const pending = useStore((s) => dirtyCount(s))
  const error = useStore((s) => s.sync.lastError)
  const [busy, setBusy] = useState(false)

  if (!configured) {
    return (
      <button className="chip" onClick={() => ui.push(<SyncSetup />)} aria-label="Relier le Google Sheet">
        <Icon name="cloud-off" size={16} /> Sheet
      </button>
    )
  }
  const run = async () => {
    setBusy(true)
    const r = await syncNow()
    setBusy(false)
    ui.toast(r.message, r.ok ? 'ok' : 'err')
  }
  return (
    <button className="chip" onClick={run} aria-label="Synchroniser" style={error ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : undefined}>
      {busy ? <Spinner /> : <Icon name={error ? 'cloud-off' : 'cloud'} size={16} />}
      {pending > 0 ? pending : <Icon name="check" size={14} stroke={3} />}
    </button>
  )
}
