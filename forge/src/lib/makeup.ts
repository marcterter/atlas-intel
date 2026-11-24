// Rattrapage : un exercice prévu dans une autre séance du programme, pas fait ce jour-là (les bras de
// l'Upper faits avant les jambes), compte pour cette séance-là : le script l'écrit sur sa ligne chez le coach.
import { findExercise } from '../data/exercises.ts'
import { addDays } from './date.ts'
import type { CountFor, Exercise, Routine, Session, SessionExercise } from './types.ts'

export interface MakeUpOption extends CountFor {
  /** Même exercice que celui du programme (sinon : même muscle, écrit comme un remplacement). */
  exact: boolean
}

/** Une ligne du coach ne se rattrape qu'une fois. */
const claim = (o: CountFor) => `${o.date}|${o.coachDay}|${o.targetId}`

const ownPlan = (s: Session, routines: Routine[]) =>
  routines.find((r) => r.id === s.routineId) ?? (s.coachDay ? routines.find((r) => r.coachDay === s.coachDay) : undefined)

/**
 * Séances rattrapables pour cet exercice : les autres jours du programme faits dans les 6 derniers
 * jours où un exercice prévu n'a pas été fait (le même, sinon un du même muscle). Le même exercice
 * d'abord, puis le plus récent.
 */
export function makeUpOptions(s: Session, ex: SessionExercise, history: Session[], routines: Routine[], custom: Exercise[]): MakeUpOption[] {
  const exo = findExercise(ex.exerciseId, custom)
  if (exo.kind === 'cardio') return []
  // Prévu aujourd'hui (ou remplaçant un exercice prévu) : pas un rattrapage.
  const own = ownPlan(s, routines)
  if (own?.items.some((it) => it.exerciseId === ex.exerciseId || it.exerciseId === ex.replacedFrom)) return []
  const from = addDays(s.date, -6)
  const recent = history
    .filter((h) => h.id !== s.id && h.coachDay && h.coachDay !== s.coachDay && h.date >= from && h.date <= s.date && h.startedAt < s.startedAt)
    .sort((a, b) => b.startedAt - a.startedAt)
  const out: MakeUpOption[] = []
  const seen = new Set<string>()
  for (const h of recent) {
    const day = h.coachDay as string
    if (seen.has(day)) continue
    seen.add(day)
    const plan = routines.find((r) => r.coachDay === day)
    if (!plan) continue
    const done = new Set<string>()
    for (const e of h.exercises) {
      if (!e.sets.some((x) => x.done) || e.pour) continue
      done.add(e.exerciseId)
      if (e.replacedFrom) done.add(e.replacedFrom)
    }
    const skipped = plan.items.filter((it) => !done.has(it.exerciseId))
    const same = skipped.find((it) => it.exerciseId === ex.exerciseId)
    const twin =
      same ??
      skipped.find((it) => {
        const t = findExercise(it.exerciseId, custom)
        return t.kind !== 'cardio' && t.muscle === exo.muscle
      })
    if (!twin) continue
    out.push({ coachDay: day, date: h.date, session: h.name, target: findExercise(twin.exerciseId, custom).name, targetId: twin.exerciseId, exact: !!same })
  }
  return out.sort((a, b) => Number(b.exact) - Number(a.exact))
}

/** Rattrapage retenu pour chaque exercice : le choix fait dans la séance, sinon le premier possible. */
export function assignMakeUps(s: Session, history: Session[], routines: Routine[], custom: Exercise[]): Map<string, CountFor> {
  const taken = new Set<string>()
  for (const h of history) if (h.id !== s.id) for (const e of h.exercises) if (e.pour) taken.add(claim(e.pour))
  const out = new Map<string, CountFor>()
  for (const e of s.exercises)
    if (e.pour) {
      out.set(e.uid, e.pour)
      taken.add(claim(e.pour))
    }
  for (const e of s.exercises) {
    if (e.pour !== undefined) continue
    const o = makeUpOptions(s, e, history, routines, custom).find((x) => !taken.has(claim(x)))
    if (!o) continue
    const { exact: _exact, ...pour } = o
    out.set(e.uid, pour)
    taken.add(claim(pour))
  }
  return out
}

/** Fige les rattrapages à la fin de la séance (l'historique bougera ensuite). */
export function freezeMakeUps(s: Session, history: Session[], routines: Routine[], custom: Exercise[]): Session {
  const made = assignMakeUps(s, history, routines, custom)
  if (!made.size) return s
  return { ...s, exercises: s.exercises.map((e) => (e.pour === undefined && made.has(e.uid) ? { ...e, pour: made.get(e.uid) } : e)) }
}

/** « jeu. 26 » */
export function shortDay(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
}

/** « Upper B (jeu. 26) », et l'exercice remplacé s'il n'est pas le même. */
export function countForLabel(c: CountFor, exerciseName: string): string {
  const same = c.target.trim().toLowerCase() === exerciseName.trim().toLowerCase()
  return `${c.session} (${shortDay(c.date)})${same ? '' : ` · à la place de ${c.target}`}`
}
