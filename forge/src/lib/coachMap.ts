// Séance à toi (« Upper 1 ») comptée pour un jour du programme du coach (le lundi) : chaque exercice
// prend la ligne d'un exercice prévu ce jour-là chez le coach, le même s'il y est, sinon le plus
// proche du même muscle (mots du nom en commun : « Écarté poulie basse » → « Écarté à la poulie sur
// banc »). Le script l'écrit comme un remplacement. Ce qui ne trouve pas de ligne reste hors programme.
import { findExercise, normalize } from '../data/exercises.ts'
import type { Exercise, Routine, Session } from './types.ts'

export interface CoachLink {
  targetId: string
  target: string
  /** Le même exercice que celui du coach (pas un remplacement). */
  exact: boolean
}

const LINK = new Set(['a', 'au', 'aux', 'la', 'le', 'les', 'l', 'de', 'du', 'des', 'd', 'en', 'et', 'avec', 'sur', 'sous', 'par'])
const stem = (w: string) => {
  let x = w.length > 3 ? w.replace(/[sx]$/, '') : w
  if (x.length > 4) x = x.replace(/e$/, '')
  return x
}
const words = (name: string) =>
  normalize(name)
    .split(' ')
    .filter((w) => w && !LINK.has(w))
    .map(stem)
/** Mots de matériel ou de côté : un point commun moins parlant que le mouvement. */
const GEAR = new Set(['machine', 'poulie', 'cable', 'halteres', 'haltere', 'barre', 'smith', 'banc', 'kettlebell', 'elastique', 'unilateral', 'bilateral', 'assis', 'debout', 'guidee', 'corde', 'cuff', 'poignet'].map(stem))

/** Proximité de deux exercices : 100 si c'est le même, 0 si les muscles diffèrent. */
export function closeness(a: Exercise, b: Exercise): number {
  if (a.id === b.id || normalize(a.name) === normalize(b.name)) return 100
  if (a.kind === 'cardio' || b.kind === 'cardio' || a.muscle !== b.muscle) return 0
  const wb = new Set(words(b.name))
  let score = 5
  for (const w of new Set(words(a.name))) if (wb.has(w)) score += GEAR.has(w) ? 2 : 10
  if (a.equipment === b.equipment) score += 1
  return score
}

/** Programme du coach pour cette séance, si elle compte pour un jour du programme sans être sa séance à lui. */
export function coachPlanFor(s: Session, routines: Routine[]): Routine | null {
  if (!s.coachDay) return null
  const plan = routines.find((r) => r.coachDay === s.coachDay)
  return plan && plan.id !== s.routineId ? plan : null
}

/** Ligne du coach de chaque exercice (les rattrapages pour un autre jour restent à part). */
export function coachMapping(s: Session, routines: Routine[], custom: Exercise[]): Map<string, CoachLink> {
  const out = new Map<string, CoachLink>()
  const plan = coachPlanFor(s, routines)
  if (!plan) return out
  const items = [...new Map(plan.items.map((it) => [it.exerciseId, findExercise(it.exerciseId, custom)])).values()]
  const taken = new Set<string>()
  const auto: Session['exercises'] = []
  // Choix faits à la main d'abord.
  for (const ex of s.exercises) {
    if (ex.pour || ex.coachTarget === null) continue
    if (ex.coachTarget === undefined) {
      auto.push(ex)
      continue
    }
    const t = items.find((i) => i.id === ex.coachTarget)
    if (!t || taken.has(t.id)) continue
    taken.add(t.id)
    out.set(ex.uid, { targetId: t.id, target: t.name, exact: closeness(findExercise(ex.exerciseId, custom), t) >= 100 })
  }
  // Puis les plus proches d'abord (à égalité : l'ordre de la séance, puis celui du programme).
  const pairs: { uid: string; t: Exercise; score: number }[] = []
  for (const ex of auto) {
    const exo = findExercise(ex.exerciseId, custom)
    for (const t of items) {
      const score = closeness(exo, t)
      if (score > 0) pairs.push({ uid: ex.uid, t, score })
    }
  }
  pairs.sort((a, b) => b.score - a.score)
  for (const p of pairs) {
    if (out.has(p.uid) || taken.has(p.t.id)) continue
    taken.add(p.t.id)
    out.set(p.uid, { targetId: p.t.id, target: p.t.name, exact: p.score >= 100 })
  }
  return out
}

/** Exercices du coach encore libres pour cet exercice (même muscle d'abord), pour le choix à la main. */
export function coachChoices(s: Session, exUid: string, routines: Routine[], custom: Exercise[]): Exercise[] {
  const plan = coachPlanFor(s, routines)
  const ex = s.exercises.find((e) => e.uid === exUid)
  if (!plan || !ex) return []
  const map = coachMapping(s, routines, custom)
  const takenByOthers = new Set([...map].filter(([uid]) => uid !== exUid).map(([, l]) => l.targetId))
  const exo = findExercise(ex.exerciseId, custom)
  const items = [...new Map(plan.items.map((it) => [it.exerciseId, findExercise(it.exerciseId, custom)])).values()]
  return items.filter((t) => !takenByOthers.has(t.id)).sort((a, b) => closeness(exo, b) - closeness(exo, a))
}

/**
 * Fige les lignes du coach à la fin de la séance : un remplacement pour chaque exercice placé sur la
 * ligne d'un autre. Un remplacement entre tes exercices à toi n'a pas de sens chez le coach : retiré.
 */
export function freezeCoachMapping(s: Session, routines: Routine[], custom: Exercise[]): Session {
  if (!coachPlanFor(s, routines)) return s
  const map = coachMapping(s, routines, custom)
  return {
    ...s,
    exercises: s.exercises.map((e) => {
      if (e.pour) return e
      const m = map.get(e.uid)
      const replacedFrom = m && !m.exact ? m.targetId : undefined
      if (e.replacedFrom === replacedFrom) return e
      const next = { ...e }
      if (replacedFrom) next.replacedFrom = replacedFrom
      else delete next.replacedFrom
      return next
    }),
  }
}

/** Relie après coup une séance à un jour du programme du coach (null : plus reliée). */
export function linkSessionToDay(s: Session, day: string | null, routines: Routine[], custom: Exercise[]): Session {
  const coachIds = new Set(routines.filter((r) => r.coachDay).flatMap((r) => r.items.map((it) => it.exerciseId)))
  // Les anciens remplacements vers une ligne du coach sont recalculés.
  const base: Session = {
    ...s,
    coachDay: day,
    exercises: s.exercises.map((e) => {
      if (e.pour || !e.replacedFrom || !coachIds.has(e.replacedFrom)) return e
      const next = { ...e }
      delete next.replacedFrom
      return next
    }),
  }
  return day ? freezeCoachMapping(base, routines, custom) : base
}

/** « LUNDI » → « Lun. » */
export function shortCoachDay(day: string): string {
  const d = day.toLowerCase()
  return `${d.charAt(0).toUpperCase()}${d.slice(1, 3)}.`
}
