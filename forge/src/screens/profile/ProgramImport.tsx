import { useEffect, useMemo, useState } from 'react'
import { Sheet, Spinner, Toggle } from '../../components/ui.tsx'
import { TEMPLATE_ROUTINES } from '../../data/exercises.ts'
import { Icon } from '../../components/Icon.tsx'
import { MUSCLE_LABEL } from '../../data/exercises.ts'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { fetchProgram } from '../../lib/sync.ts'
import { parsePerf, planImport, type CoachProgram } from '../../lib/coach.ts'
import { relativeDay } from '../../lib/date.ts'

/** Importe les séances de l'onglet Entraînement du coach (noms exacts) + la dernière semaine comme historique. */
export function ProgramImport() {
  const [program, setProgram] = useState<CoachProgram | null>(null)
  const [error, setError] = useState('')
  const customExercises = useStore((s) => s.customExercises)
  const routines = useStore((s) => s.routines)
  const sessions = useStore((s) => s.sessions)
  const defaultRest = useStore((s) => s.settings.defaultRestSec)
  const applyImport = useStore((s) => s.applyImport)
  const [removeTemplates, setRemoveTemplates] = useState(true)
  // Séances d'exemple de l'accueil, jamais utilisées : inutiles une fois le vrai programme importé.
  const templates = useMemo(
    () => routines.filter((r) => !r.coachDay && TEMPLATE_ROUTINES.some((t) => t.name === r.name) && !sessions.some((x) => x.routineId === r.id)),
    [routines, sessions],
  )

  useEffect(() => {
    fetchProgram()
      .then(setProgram)
      .catch((e) => setError(e instanceof Error ? e.message : 'Lecture impossible'))
  }, [])

  const plan = useMemo(
    () => (program ? planImport(program, { customExercises, routines, sessions }, defaultRest) : null),
    [program, customExercises, routines, sessions, defaultRest],
  )
  const exById = useMemo(() => new Map([...customExercises, ...(plan?.newExercises ?? [])].map((e) => [e.id, e])), [customExercises, plan])

  return (
    <Sheet
      title="Programme du coach"
      closeIcon="x"
      footer={
        plan && plan.routines.length ? (
          <button
            className="btn block"
            onClick={() => {
              applyImport(plan, removeTemplates ? templates.map((r) => r.id) : [])
              ui.pop()
              ui.toast(`${plan.routines.length} séances importées`, 'ok')
            }}
          >
            Importer {plan.routines.length} séance{plan.routines.length > 1 ? 's' : ''}
          </button>
        ) : undefined
      }
    >
      <div className="stack">
        {!program && !error && (
          <div className="row center" style={{ justifyContent: 'center', padding: 30 }}>
            <Spinner /> Lecture de l’onglet Entraînement…
          </div>
        )}
        {error && <div className="callout" style={{ borderColor: 'var(--danger)' }}>{error}</div>}
        {plan && program && (
          <>
            <div className="callout accent small">
              Les exercices gardent les noms exacts du coach : chaque séance terminée sera écrite sur la bonne ligne, dans le bloc de la semaine en cours. Les charges de la <b>semaine {program.semaine}</b> deviennent ton historique : tu sauras quoi battre dès la première séance.
            </div>
            {plan.routines.map((r) => {
              const seance = program.seances.find((x) => x.jour === r.coachDay)
              const exists = routines.some((x) => x.id === r.id)
              return (
                <div className="card flush" key={r.id}>
                  <div className="row" style={{ padding: '14px 16px 8px' }}>
                    <div className="grow">
                      <div className="card-title">{r.name}</div>
                      <div className="faint small">
                        {r.coachDay?.toLowerCase()} {seance?.date ? `· ${relativeDay(seance.date).toLowerCase()}` : ''} · {r.items.length} exercices
                        {exists ? ' · mise à jour' : ''}
                      </div>
                    </div>
                    <span className="badge accent">{r.coachDay}</span>
                  </div>
                  <div className="list">
                    {r.items.map((it, i) => {
                      const ex = exById.get(it.exerciseId)
                      const perf = seance?.exercices[i]?.perf ?? ''
                      return (
                        <div className="list-item" key={it.uid} style={{ minHeight: 0, padding: '9px 16px' }}>
                          <div className="grow" style={{ minWidth: 0 }}>
                            <div className="small bold ellipsis">{ex?.name}</div>
                            <div className="tiny faint ellipsis">
                              {ex ? MUSCLE_LABEL[ex.muscle] : ''} · {it.sets} séries{it.rir ? ` · RIR ${it.rir}` : ''}
                              {perf ? ` · ${parsePerf(perf).length ? perf : `« ${perf} »`}` : ''}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
            {templates.length > 0 && (
              <div className="row-between card tight">
                <div>
                  <div className="bold">Retirer les séances d’exemple</div>
                  <div className="faint small">{templates.map((r) => r.name).join(', ')}</div>
                </div>
                <Toggle on={removeTemplates} onChange={setRemoveTemplates} label="Retirer les séances d'exemple" />
              </div>
            )}
            {plan.newExercises.length > 0 && (
              <div className="faint small">
                <Icon name="info" size={14} style={{ verticalAlign: -2 }} /> {plan.newExercises.length} exercices créés. Le groupe musculaire est deviné d’après le nom : tu peux le corriger en recréant l’exercice si besoin.
              </div>
            )}
          </>
        )}
      </div>
    </Sheet>
  )
}
