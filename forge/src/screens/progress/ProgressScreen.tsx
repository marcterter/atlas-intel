import { useMemo, useState } from 'react'
import { Segmented, Empty } from '../../components/ui.tsx'
import { HBars } from '../../components/charts.tsx'
import { Icon } from '../../components/Icon.tsx'
import { ExerciseProgress } from './ExerciseProgress.tsx'
import { BilanTab } from './Bilan.tsx'
import { SessionDetail } from '../training/SessionDetail.tsx'
import { findExercise, MUSCLE_LABEL, MUSCLE_ORDER } from '../../data/exercises.ts'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { exerciseHistory, sessionDurationMs, sessionTonnage, sessionWorkSets, setsByMuscle, tonnageByMuscle } from '../../lib/training.ts'
import { fmt, fmtDuration, fmtKg, fmtTonnage } from '../../lib/format.ts'
import { cap, monthLabel, relativeDay, todayISO } from '../../lib/date.ts'
import type { Muscle } from '../../lib/types.ts'

type Tab = 'progres' | 'bilan' | 'historique'

export function ProgressScreen() {
  const [tab, setTab] = useState<Tab>('progres')
  const sessions = useStore((s) => s.sessions)
  const checkins = useStore((s) => s.checkins)
  const weighins = useStore((s) => s.weighins)
  const subtitle =
    tab === 'progres'
      ? `${sessions.length} séance${sessions.length > 1 ? 's' : ''} analysée${sessions.length > 1 ? 's' : ''}`
      : tab === 'bilan'
        ? `${checkins.length} bilan${checkins.length > 1 ? 's' : ''} · ${weighins.length} pesée${weighins.length > 1 ? 's' : ''}`
        : 'Toutes tes séances'
  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <h1 className="display screen-title">{tab === 'progres' ? 'Progrès' : tab === 'bilan' ? 'Bilan' : 'Historique'}</h1>
          <div className="subtitle">{subtitle}</div>
        </div>
      </div>
      <div className="stack">
        <Segmented
          value={tab}
          onChange={setTab}
          options={[
            { value: 'progres', label: 'Progrès' },
            { value: 'bilan', label: 'Bilan' },
            { value: 'historique', label: 'Historique' },
          ]}
        />
        {tab === 'progres' && <ProgressTab />}
        {tab === 'bilan' && <BilanTab />}
        {tab === 'historique' && <HistoryTab />}
      </div>
    </div>
  )
}

function ProgressTab() {
  const sessions = useStore((s) => s.sessions)
  const custom = useStore((s) => s.customExercises)
  const [mode, setMode] = useState<'tonnage' | 'series'>('tonnage')
  const today = todayISO()

  const muscleRows = useMemo(() => {
    const m = mode === 'tonnage' ? tonnageByMuscle(sessions, today, 7, custom) : setsByMuscle(sessions, today, 7, custom)
    return MUSCLE_ORDER.filter((k) => k !== 'cardio' && (m.get(k) ?? 0) > 0)
      .map((k) => ({ label: MUSCLE_LABEL[k], value: m.get(k) ?? 0 }))
      .sort((a, b) => b.value - a.value)
  }, [sessions, custom, mode, today])

  const byMuscle = useMemo(() => {
    const ids = new Set<string>()
    for (const s of sessions) for (const e of s.exercises) ids.add(e.exerciseId)
    const groups = new Map<Muscle, { id: string; name: string; count: number; best: string; last: string }[]>()
    for (const id of ids) {
      const exo = findExercise(id, custom)
      const h = exerciseHistory(sessions, id, custom).filter((p) => p.stats.workSets > 0)
      if (!h.length) continue
      const bestW = Math.max(...h.map((p) => p.stats.maxWeight))
      const bestR = Math.max(...h.map((p) => p.stats.maxReps))
      const best = exo.kind === 'weight' || bestW > 0 ? `${fmtKg(bestW)} kg max` : exo.kind === 'duration' ? `${Math.max(...h.map((p) => p.stats.maxSeconds))} s max` : exo.kind === 'cardio' ? `${h.length} fois` : `${bestR} reps max`
      const list = groups.get(exo.muscle) ?? []
      list.push({ id, name: exo.name, count: h.length, best, last: h[h.length - 1].date })
      groups.set(exo.muscle, list)
    }
    return MUSCLE_ORDER.filter((m) => groups.has(m)).map((m) => ({ muscle: m, items: (groups.get(m) ?? []).sort((a, b) => b.last.localeCompare(a.last)) }))
  }, [sessions, custom])

  if (!sessions.length) {
    return (
      <div className="card">
        <Empty title="Rien à analyser… encore">Termine ta première séance : charge max, volume et records apparaîtront ici, exercice par exercice.</Empty>
      </div>
    )
  }

  return (
    <>
      <div className="card">
        <div className="card-head">
          <div className="icon-tile">
            <Icon name="chart" size={20} />
          </div>
          <div className="grow">
            <div className="bold">7 derniers jours</div>
            <div className="faint small">{mode === 'tonnage' ? 'Tonnage par groupe musculaire' : 'Séries effectives par groupe'}</div>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <Segmented value={mode} onChange={setMode} options={[{ value: 'tonnage', label: 'Tonnage' }, { value: 'series', label: 'Séries' }]} />
        </div>
        {muscleRows.length ? (
          <HBars rows={muscleRows} format={(n) => (mode === 'tonnage' ? fmtTonnage(n) : `${fmt(n)} sér.`)} />
        ) : (
          <div className="faint small">Aucune série cette semaine.</div>
        )}
      </div>

      {byMuscle.map((g) => (
        <div key={g.muscle}>
          <div className="section-label">{MUSCLE_LABEL[g.muscle]}</div>
          <div className="card flush list">
            {g.items.map((it) => (
              <button key={it.id} className="list-item" onClick={() => ui.push(<ExerciseProgress exerciseId={it.id} />)}>
                <div className="grow">
                  <div className="title">{it.name}</div>
                  <div className="meta">
                    {it.count} séance{it.count > 1 ? 's' : ''} · {it.best}
                  </div>
                </div>
                <Icon name="chevron-right" size={18} style={{ color: 'var(--text-3)' }} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

function HistoryTab() {
  const sessions = useStore((s) => s.sessions)
  const custom = useStore((s) => s.customExercises)
  const groups = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => b.startedAt - a.startedAt)
    const m = new Map<string, typeof sorted>()
    for (const s of sorted) {
      const k = monthLabel(s.date)
      m.set(k, [...(m.get(k) ?? []), s])
    }
    return [...m.entries()]
  }, [sessions])
  if (!sessions.length) {
    return (
      <div className="card">
        <Empty title="Aucune séance">Tes séances terminées s’afficheront ici.</Empty>
      </div>
    )
  }
  return (
    <>
      {groups.map(([month, list]) => (
        <div key={month}>
          <div className="section-label">
            {month}
          </div>
          <div className="card flush list">
            {list.map((s) => (
              <button key={s.id} className="list-item" onClick={() => ui.push(<SessionDetail sessionId={s.id} />)}>
                <div className="grow">
                  <div className="title">{s.name}</div>
                  <div className="meta">
                    {cap(relativeDay(s.date))} · {fmtDuration(sessionDurationMs(s))} · {sessionWorkSets(s)} séries
                  </div>
                </div>
                <div className="bold num small">{fmtTonnage(sessionTonnage(s, custom))}</div>
                <Icon name="chevron-right" size={18} style={{ color: 'var(--text-3)' }} />
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}
