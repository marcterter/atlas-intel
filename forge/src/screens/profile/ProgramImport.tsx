import { useEffect, useMemo, useState } from 'react'
import { Sheet, Spinner, Toggle } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { MUSCLE_LABEL, TEMPLATE_ROUTINES, normalize } from '../../data/exercises.ts'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { fetchProgram } from '../../lib/sync.ts'
import { planImport, type CoachProgram } from '../../lib/coach.ts'
import { fmt } from '../../lib/format.ts'
import type { MacroTargets, Targets } from '../../lib/types.ts'

function toMacros(t: { kcal: number; protein?: number; carbs?: number; fat?: number } | null | undefined): MacroTargets | null {
  if (!t?.kcal) return null
  return { kcal: Math.round(t.kcal), protein: Math.round(t.protein ?? 0), carbs: Math.round(t.carbs ?? 0), fat: Math.round(t.fat ?? 0) }
}

/** Importe le programme de l'onglet Entraînement (noms exacts), l'historique des semaines remplies et les objectifs Nutrition. */
export function ProgramImport() {
  const [program, setProgram] = useState<CoachProgram | null>(null)
  const [error, setError] = useState('')
  const customExercises = useStore((s) => s.customExercises)
  const routines = useStore((s) => s.routines)
  const sessions = useStore((s) => s.sessions)
  const targets = useStore((s) => s.targets)
  const defaultRest = useStore((s) => s.settings.defaultRestSec)
  const applyImport = useStore((s) => s.applyImport)
  const setTargets = useStore((s) => s.setTargets)
  const [removeTemplates, setRemoveTemplates] = useState(true)
  const [useTargets, setUseTargets] = useState(true)

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
  // Séances d'exemple de l'accueil, jamais utilisées : inutiles une fois le vrai programme importé.
  const templates = useMemo(
    () => routines.filter((r) => !r.coachDay && TEMPLATE_ROUTINES.some((t) => t.name === r.name) && !sessions.some((x) => x.routineId === r.id)),
    [routines, sessions],
  )
  const coachTargets: Targets | null = useMemo(() => {
    const on = toMacros(program?.objectifs?.on)
    if (!on) return null
    return { base: on, rest: toMacros(program?.objectifs?.off), steps: program?.objectifs?.pas ?? targets.steps, fiber: Math.round(program?.objectifs?.on?.fiber ?? targets.fiber) }
  }, [program, targets])
  const weeks = program ? [...new Set(program.historique.map((h) => h.semaine))].sort((a, b) => a - b) : []

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
              if (useTargets && coachTargets) setTargets(coachTargets)
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
            <Spinner /> Lecture du sheet du coach…
          </div>
        )}
        {error && <div className="callout" style={{ borderColor: 'var(--danger)' }}>{error}</div>}
        {plan && program && (
          <>
            <div className="callout accent small">
              Programme de la <b>semaine {program.semaine}</b>{program.semaineActuelle === program.semaine ? ' (semaine en cours)' : ''}, avec les noms exacts du coach : chaque séance terminée s’écrit sur la bonne ligne de l’onglet Entraînement.
              {weeks.length > 0 && (
                <>
                  {' '}
                  Tes charges des semaines {weeks.join(', ')} deviennent ton historique ({plan.history.length} séances) : tu sauras quoi battre dès la première séance.
                </>
              )}
            </div>

            {coachTargets && (
              <div className="card tight">
                <div className="row-between">
                  <div className="grow">
                    <div className="bold">Objectifs de l’onglet Nutrition</div>
                    <div className="faint small" style={{ marginTop: 4 }}>
                      Jour ON : {fmt(coachTargets.base.kcal)} kcal · P {coachTargets.base.protein} · G {coachTargets.base.carbs} · L {coachTargets.base.fat}
                      {coachTargets.rest && (
                        <>
                          <br />
                          Jour OFF : {fmt(coachTargets.rest.kcal)} kcal · P {coachTargets.rest.protein} · G {coachTargets.rest.carbs} · L {coachTargets.rest.fat}
                        </>
                      )}
                      <br />
                      Pas : {fmt(coachTargets.steps)} · fibres {coachTargets.fiber} g
                    </div>
                  </div>
                  <Toggle on={useTargets} onChange={setUseTargets} label="Utiliser les objectifs du coach" />
                </div>
              </div>
            )}

            {plan.routines.map((r) => {
              const last = [...program.historique].reverse().find((h) => h.jour === r.coachDay)
              const exists = routines.some((x) => x.id === r.id)
              return (
                <div className="card flush" key={r.id}>
                  <div className="row" style={{ padding: '14px 16px 8px' }}>
                    <div className="grow">
                      <div className="card-title">{r.name}</div>
                      <div className="faint small">
                        {r.items.length} exercices{last ? ` · dernières charges : semaine ${last.semaine}` : ''}
                        {exists ? ' · mise à jour' : ''}
                      </div>
                    </div>
                    <span className="badge accent">{r.coachDay}</span>
                  </div>
                  <div className="list">
                    {r.items.map((it) => {
                      const ex = exById.get(it.exerciseId)
                      const perf = last?.exercices.find((e) => ex && normalize(e.nom) === normalize(ex.name))?.perf ?? ''
                      return (
                        <div className="list-item" key={it.uid} style={{ minHeight: 0, padding: '9px 16px' }}>
                          <div className="grow" style={{ minWidth: 0 }}>
                            <div className="small bold ellipsis">{ex?.name}</div>
                            <div className="tiny faint ellipsis">
                              {ex ? MUSCLE_LABEL[ex.muscle] : ''} · {it.sets} × {it.reps || '?'}
                              {it.rir ? ` · RIR ${it.rir}` : ''}
                              {perf ? ` · ${perf}` : ''}
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
                <Icon name="info" size={14} style={{ verticalAlign: -2 }} /> {plan.newExercises.length} exercices créés. Le groupe musculaire est deviné d’après le nom.
              </div>
            )}
          </>
        )}
      </div>
    </Sheet>
  )
}
