import { useMemo } from 'react'
import { Sheet } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { SessionDetail } from './SessionDetail.tsx'
import { findExercise } from '../../data/exercises.ts'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import {
  detectRecords,
  previousComparable,
  progressVsPrevious,
  sessionDurationMs,
  sessionTonnage,
  sessionWorkSets,
  tonnageEquivalent,
} from '../../lib/training.ts'
import { fmt, fmtDuration, fmtKg, fmtSigned, fmtTonnage } from '../../lib/format.ts'
import { isConfigured } from '../../lib/sync.ts'
import { countForLabel } from '../../lib/makeup.ts'
import type { CountFor } from '../../lib/types.ts'

export function SessionRecap({ sessionId }: { sessionId: string }) {
  const sessions = useStore((s) => s.sessions)
  const custom = useStore((s) => s.customExercises)
  const syncOn = useStore((s) => isConfigured(s))
  const session = sessions.find((s) => s.id === sessionId)

  const data = useMemo(() => {
    if (!session) return null
    const tonnage = sessionTonnage(session, custom)
    const prev = previousComparable(session, sessions)
    const prevTonnage = prev ? sessionTonnage(prev, custom) : null
    const records = detectRecords(session, sessions, custom)
    const progress = progressVsPrevious(session, sessions, custom).filter((p) => !records.some((r) => r.exerciseId === p.exerciseId))
    const sets = sessionWorkSets(session)
    const prevSets = prev ? sessionWorkSets(prev) : null
    return { tonnage, prev, prevTonnage, records, progress, sets, prevSets }
  }, [session, sessions, custom])

  if (!session || !data) {
    return (
      <Sheet title="Récap">
        <div className="empty">Séance introuvable.</div>
      </Sheet>
    )
  }

  const { tonnage, prevTonnage, records, progress, sets, prevSets } = data
  const delta = prevTonnage != null ? tonnage - prevTonnage : null
  const deltaPct = prevTonnage ? (delta ?? 0) / prevTonnage : null
  const better = (delta ?? 0) > 0 || records.length > 0
  const eq = tonnageEquivalent(tonnage)

  const headline = !data.prev ? 'Première séance enregistrée.' : better ? 'Tu as progressé.' : 'Séance bouclée.'
  const parts: string[] = []
  if (records.length) parts.push(`${records.length} record${records.length > 1 ? 's' : ''}`)
  if (deltaPct != null && Math.abs(deltaPct) >= 0.005) parts.push(`${deltaPct > 0 ? '+' : '−'}${fmt(Math.abs(deltaPct * 100))} % de volume vs la dernière fois`)
  if (!parts.length && data.prev) parts.push('Volume stable par rapport à la dernière fois')
  if (!data.prev) parts.push('La prochaine fois, tu verras ta progression ici')

  return (
    <Sheet
      title="Récap"
      closeIcon="x"
      footer={
        <>
          <button className="btn soft grow" onClick={() => ui.push(<SessionDetail sessionId={session.id} />)}>
            Détail
          </button>
          <button className="btn grow" onClick={() => ui.pop()}>
            Fermer
          </button>
        </>
      }
    >
      <div className="stack">
        <div className="row" style={{ gap: 8 }}>
          <span className="badge ok">
            <Icon name="check" size={13} stroke={3} /> {session.name}
          </span>
          {syncOn && <span className="badge">Envoi vers le sheet…</span>}
        </div>
        <h1 className="display" style={{ fontSize: 40, margin: '4px 0 0' }}>
          {headline.split(' ').map((w, i, arr) => (
            <span key={i} style={{ color: i >= arr.length - 2 && better ? 'var(--accent)' : undefined }}>
              {w}{' '}
            </span>
          ))}
        </h1>
        <div className="muted">{parts.join(' · ')}.</div>

        <div className="card">
          <div className="row-between">
            <div className="tiny faint bold" style={{ letterSpacing: '.08em' }}>
              TONNAGE TOTAL
            </div>
            {delta != null && (
              <span className={`badge ${delta >= 0 ? 'ok' : 'danger'}`}>
                {fmtSigned((deltaPct ?? 0) * 100)} % · {delta >= 0 ? '+' : '−'}
                {fmtTonnage(Math.abs(delta))}
              </span>
            )}
          </div>
          <div className="row" style={{ marginTop: 6 }}>
            <div className="huge-number grow" style={{ color: 'var(--accent)' }}>
              {fmtTonnage(tonnage)}
            </div>
            <div style={{ fontSize: 40 }} aria-hidden="true">
              {eq.emoji}
            </div>
          </div>
          <div className="bold" style={{ marginTop: 4 }}>
            {eq.label}.
          </div>
          {prevTonnage != null && <div className="callout small" style={{ marginTop: 12 }}>Dernière fois : {fmtTonnage(prevTonnage)}</div>}
        </div>

        <div className="grid-3">
          <div className="stat">
            <div className="k">Durée</div>
            <div className="v">{fmtDuration(sessionDurationMs(session))}</div>
          </div>
          <div className="stat">
            <div className="k">Séries</div>
            <div className="v">{sets}</div>
            {prevSets != null && <div className="tiny faint">{sets === prevSets ? 'comme avant' : `${sets > prevSets ? '+' : ''}${sets - prevSets} vs avant`}</div>}
          </div>
          <div className="stat">
            <div className="k">Records</div>
            <div className="v" style={{ color: records.length ? 'var(--ok)' : undefined }}>
              {records.length}
            </div>
          </div>
        </div>

        {session.exercises.some((e) => e.pour) && (
          <div className="makeup-chip" style={{ marginTop: 0 }}>
            <Icon name="calendar" size={14} />
            <span className="grow">
              {session.exercises
                .filter((e) => e.pour)
                .map((e) => {
                  const name = findExercise(e.exerciseId, custom).name
                  return `${name} compte pour ${countForLabel(e.pour as CountFor, name)}`
                })
                .join(' · ')}
              {' '}chez ton coach (rattrapage).
            </span>
          </div>
        )}

        {records.length > 0 && (
          <>
            <div className="section-label">
              <span>
                <Icon name="trophy" size={14} style={{ verticalAlign: -2, color: 'var(--warn)' }} /> Records
              </span>
            </div>
            <div className="card flush list">
              {records.map((r) => (
                <div className="list-item" key={r.exerciseId + r.kind}>
                  <div className="grow">
                    <div className="title">{findExercise(r.exerciseId, custom).name}</div>
                    <div className="meta">
                      {r.label} · avant {r.kind === 'reps' ? `${r.previous} reps` : r.kind === 'duree' ? `${r.previous} s` : `${fmtKg(r.previous)} kg`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="bold num">
                      {r.kind === 'reps' ? `${r.value} reps` : r.kind === 'duree' ? `${r.value} s` : r.kind === '1rm' ? `${fmtKg(r.weight)} kg × ${r.reps}` : `${fmtKg(r.weight)} kg × ${r.reps}`}
                    </div>
                    <div className="tiny ok bold">
                      +{r.kind === 'reps' ? `${r.value - r.previous} reps` : r.kind === 'duree' ? `${r.value - r.previous} s` : `${fmtKg(r.value - r.previous)} kg${r.kind === '1rm' ? ' (1RM est.)' : ''}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {progress.length > 0 && (
          <>
            <div className="section-label">En progression</div>
            <div className="card flush list">
              {progress.slice(0, 6).map((p) => (
                <div className="list-item" key={p.exerciseId}>
                  <Icon name="trend" size={18} style={{ color: 'var(--ok)' }} />
                  <div className="grow title">{findExercise(p.exerciseId, custom).name}</div>
                  <div className="bold ok num">+{fmt(p.volumePct * 100)} %</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Sheet>
  )
}
