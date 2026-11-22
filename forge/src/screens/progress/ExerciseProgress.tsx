import { useMemo, useState } from 'react'
import { Sheet, Segmented } from '../../components/ui.tsx'
import { LineChart } from '../../components/charts.tsx'
import { findExercise, MUSCLE_LABEL } from '../../data/exercises.ts'
import { useStore } from '../../store/store.ts'
import { exerciseHistory, setLabel } from '../../lib/training.ts'
import { fmt, fmtKg, fmtSigned, fmtTonnage } from '../../lib/format.ts'
import { formatShort, fromISO, relativeDay } from '../../lib/date.ts'

type Metric = 'charge' | 'volume' | 'e1rm' | 'reps' | 'duree'

export function ExerciseProgress({ exerciseId }: { exerciseId: string }) {
  const sessions = useStore((s) => s.sessions)
  const custom = useStore((s) => s.customExercises)
  const exo = findExercise(exerciseId, custom)
  const history = useMemo(() => exerciseHistory(sessions, exerciseId, custom), [sessions, exerciseId, custom])
  const weighted = exo.kind === 'weight'
  const [metric, setMetric] = useState<Metric>(weighted ? 'charge' : exo.kind === 'duration' ? 'duree' : 'reps')

  const withSets = history.filter((h) => h.stats.workSets > 0)
  const value = (m: Metric, h: (typeof history)[number]) =>
    m === 'charge' ? h.stats.maxWeight : m === 'volume' ? h.stats.volume : m === 'e1rm' ? h.stats.bestE1rm : m === 'reps' ? h.stats.maxReps : h.stats.maxSeconds

  const points = withSets.map((h) => ({
    x: fromISO(h.date).getTime(),
    y: Math.round(value(metric, h) * 10) / 10,
    label: formatShort(h.date),
    sub: `${formatShort(h.date)} · ${h.sets.map((s) => setLabel(s, exo.kind)).join(', ')}`,
  }))

  const unit = metric === 'reps' ? 'reps' : metric === 'duree' ? 's' : 'kg'
  const record = withSets.length ? Math.max(...withSets.map((h) => value(metric, h))) : 0
  const first = withSets[0] ? value(metric, withSets[0]) : 0
  const last = withSets.length ? value(metric, withSets[withSets.length - 1]) : 0
  const notes = history.filter((h) => h.note?.trim()).reverse()

  const fmtVal = (n: number) => (metric === 'volume' ? fmtTonnage(n) : `${fmtKg(Math.round(n * 10) / 10)} ${unit}`)

  return (
    <Sheet title={exo.name}>
      <div className="stack">
        <div className="faint">
          {MUSCLE_LABEL[exo.muscle]} · {withSets.length} séance{withSets.length > 1 ? 's' : ''}
        </div>
        {weighted && (
          <Segmented
            value={metric}
            onChange={setMetric}
            options={[
              { value: 'charge', label: 'Charge' },
              { value: 'volume', label: 'Volume' },
              { value: 'e1rm', label: '1RM estimé' },
            ]}
          />
        )}
        <div className="grid-3">
          <div className="stat">
            <div className="k">Record</div>
            <div className="v" style={{ color: 'var(--accent)', fontSize: 20 }}>
              {withSets.length ? fmtVal(record) : '–'}
            </div>
          </div>
          <div className="stat">
            <div className="k">Progrès</div>
            <div className="v" style={{ color: last - first >= 0 ? 'var(--ok)' : 'var(--danger)', fontSize: 20 }}>
              {withSets.length > 1 ? (metric === 'volume' ? fmtSigned(last - first) : `${fmtSigned(last - first, 1)}`) : '–'}
              {withSets.length > 1 && <small>{metric === 'volume' ? 'kg' : unit}</small>}
            </div>
          </div>
          <div className="stat">
            <div className="k">Séances</div>
            <div className="v" style={{ fontSize: 20 }}>
              {withSets.length}
            </div>
          </div>
        </div>
        <div className="card" style={{ paddingTop: 22 }}>
          <LineChart
            data={points}
            formatY={(n) => (metric === 'volume' ? (n >= 1000 ? `${fmt(n / 1000, 1)}t` : fmt(n)) : fmt(n, 1))}
            formatValue={(p) => fmtVal(p.y)}
            emptyLabel="Fais cet exercice pour voir ta courbe"
          />
        </div>

        {notes.length > 0 && (
          <>
            <div className="section-label">Notes</div>
            <div className="card stack">
              {notes.slice(0, 8).map((h) => (
                <div key={h.sessionId}>
                  <div className="tiny faint">{relativeDay(h.date)}</div>
                  <div className="small" style={{ fontStyle: 'italic' }}>
                    {h.note}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {withSets.length > 0 && (
          <>
            <div className="section-label">Historique</div>
            <div className="card flush list">
              {[...withSets].reverse().slice(0, 30).map((h) => (
                <div className="list-item" key={h.sessionId} style={{ alignItems: 'flex-start' }}>
                  <div style={{ width: 70 }} className="small faint">
                    {formatShort(h.date)}
                  </div>
                  <div className="grow small num">{h.sets.map((s) => setLabel(s, exo.kind)).join(' · ')}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Sheet>
  )
}
