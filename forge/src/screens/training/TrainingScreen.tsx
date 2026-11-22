import { useMemo } from 'react'
import { Icon } from '../../components/Icon.tsx'
import { HBars } from '../../components/charts.tsx'
import { Empty, confirmDialog } from '../../components/ui.tsx'
import { ActiveSession, ActiveSessionBanner } from './ActiveSession.tsx'
import { RoutineEditor } from './RoutineEditor.tsx'
import { MUSCLE_LABEL, MUSCLE_ORDER } from '../../data/exercises.ts'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { setsByMuscle } from '../../lib/training.ts'
import { relativeDay, todayISO } from '../../lib/date.ts'
import { unlockAudio } from '../../lib/device.ts'

export function startRoutine(routineId: string | null) {
  const s = useStore.getState()
  unlockAudio()
  const open = () => ui.push(<ActiveSession />, 'active-session')
  if (s.active) {
    void confirmDialog({
      title: 'Une séance est en cours',
      message: `« ${s.active.name} » n'est pas terminée. La reprendre ?`,
      confirm: 'Reprendre',
    }).then((ok) => ok && open())
    return
  }
  s.startSession(routineId)
  open()
}

export function TrainingScreen() {
  const routines = useStore((s) => s.routines)
  const sessions = useStore((s) => s.sessions)
  const custom = useStore((s) => s.customExercises)
  const addTemplates = useStore((s) => s.addTemplates)

  const lastDone = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of sessions) {
      if (!s.routineId) continue
      const cur = m.get(s.routineId)
      if (!cur || s.date > cur) m.set(s.routineId, s.date)
    }
    return m
  }, [sessions])

  const weekSets = useMemo(() => {
    const m = setsByMuscle(sessions, todayISO(), 7, custom)
    return MUSCLE_ORDER.filter((k) => k !== 'cardio' && (m.get(k) ?? 0) > 0).map((k) => ({ label: MUSCLE_LABEL[k], value: m.get(k) ?? 0 }))
  }, [sessions, custom])

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <h1 className="display screen-title">Séance</h1>
          <div className="subtitle">
            {routines.length} séance{routines.length > 1 ? 's' : ''} au programme
          </div>
        </div>
        <button className="icon-btn filled" onClick={() => ui.push(<RoutineEditor />)} aria-label="Nouvelle séance">
          <Icon name="plus" />
        </button>
      </div>

      <div className="stack">
        <ActiveSessionBanner />

        <div className="section-label">Mes séances</div>
        {routines.length === 0 ? (
          <div className="card">
            <Empty title="Ton programme" action={
              <div className="stack">
                <button className="btn block" onClick={() => ui.push(<RoutineEditor />)}>
                  <Icon name="plus" size={20} /> Créer ma première séance
                </button>
                <button className="btn soft block" onClick={addTemplates}>
                  Ajouter des exemples Push / Pull / Legs
                </button>
              </div>
            }>
              Recrée les séances du programme de ton coach : exercices, séries, reps visées et repos.
            </Empty>
          </div>
        ) : (
          <div className="card flush list">
            {routines.map((r) => {
              const last = lastDone.get(r.id)
              return (
                <div className="list-item" key={r.id}>
                  <button className="grow" style={{ textAlign: 'left' }} onClick={() => ui.push(<RoutineEditor routineId={r.id} />)}>
                    <div className="title">
                      {r.name} {r.coachDay && <span className="badge" style={{ marginLeft: 4 }}>{r.coachDay.toLowerCase()}</span>}
                    </div>
                    <div className="meta">
                      {r.items.length} exercice{r.items.length > 1 ? 's' : ''}
                      {last ? ` · ${relativeDay(last)}` : ' · jamais faite'}
                    </div>
                  </button>
                  <button className="play-btn" onClick={() => startRoutine(r.id)} aria-label={`Démarrer ${r.name}`}>
                    <Icon name="play" size={18} fill stroke={0} />
                  </button>
                  <button className="icon-btn" onClick={() => ui.push(<RoutineEditor routineId={r.id} />)} aria-label={`Modifier ${r.name}`}>
                    <Icon name="pencil" size={18} />
                  </button>
                </div>
              )
            })}
            <button className="list-item" onClick={() => ui.push(<RoutineEditor />)}>
              <span className="icon-tile" style={{ width: 30, height: 30, borderRadius: 9 }}>
                <Icon name="plus" size={18} />
              </span>
              <span className="title accent">Nouvelle séance</span>
            </button>
          </div>
        )}

        <button className="btn soft block" onClick={() => startRoutine(null)}>
          <Icon name="bolt" size={20} /> Séance libre
        </button>

        <div className="card">
          <div className="card-head">
            <div className="icon-tile">
              <Icon name="chart" size={20} />
            </div>
            <div className="grow">
              <div className="bold">Volume de la semaine</div>
              <div className="faint small">Séries effectives par muscle · 7 derniers jours</div>
            </div>
          </div>
          {weekSets.length === 0 ? (
            <div className="faint small">Valide des séries pour voir ce que tu travailles… et ce que tu délaisses.</div>
          ) : (
            <HBars rows={weekSets.sort((a, b) => b.value - a.value)} format={(n) => `${n} sér.`} />
          )}
        </div>
      </div>
    </div>
  )
}
