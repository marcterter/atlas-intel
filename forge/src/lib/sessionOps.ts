// Opérations pures sur une séance en cours (testables, utilisées par le store).
import { findExercise } from '../data/exercises.ts'
import type { Exercise, Routine, Session, SessionExercise, SetEntry } from './types.ts'
import { uid } from './id.ts'
import { todayISO } from './date.ts'
import { previousSets } from './training.ts'

export function blankSet(from?: Partial<SetEntry>): SetEntry {
  return {
    id: uid('s'),
    type: from?.type === 'echauffement' ? 'echauffement' : 'normal',
    weight: from?.weight ?? null,
    reps: from?.reps ?? null,
    seconds: from?.seconds ?? null,
    km: from?.km ?? null,
    kcal: from?.kcal ?? null,
    done: false,
  }
}

function newExercise(exerciseId: string, sets: number, restSec: number, extra: Partial<SessionExercise> = {}): SessionExercise {
  return {
    uid: uid('e'),
    exerciseId,
    sets: Array.from({ length: Math.max(1, sets) }, () => blankSet()),
    restSec,
    superset: null,
    ...extra,
  }
}

export function sessionFromRoutine(routine: Routine | null, name: string, now = Date.now()): Session {
  return {
    id: uid('w'),
    routineId: routine?.id ?? null,
    name: routine?.name ?? name,
    date: todayISO(),
    startedAt: now,
    endedAt: null,
    coachDay: routine?.coachDay ?? null,
    exercises: (routine?.items ?? []).map((it) =>
      newExercise(it.exerciseId, it.sets, it.restSec, { repsTarget: it.reps, superset: it.superset, note: '', rir: it.rir }),
    ),
  }
}

const mapEx = (s: Session, exUid: string, fn: (e: SessionExercise) => SessionExercise): Session => ({
  ...s,
  exercises: s.exercises.map((e) => (e.uid === exUid ? fn(e) : e)),
})

export function addExercise(s: Session, exerciseId: string, restSec: number, sets = 3): Session {
  return { ...s, exercises: [...s.exercises, newExercise(exerciseId, sets, restSec)] }
}

export function removeExercise(s: Session, exUid: string): Session {
  return { ...s, exercises: s.exercises.filter((e) => e.uid !== exUid) }
}

export function replaceExercise(s: Session, exUid: string, exerciseId: string): Session {
  return mapEx(s, exUid, (e) => ({
    ...e,
    exerciseId,
    replacedFrom: e.replacedFrom ?? e.exerciseId,
    sets: e.sets.map((x) => (x.done ? x : blankSet({ type: x.type }))),
  }))
}

export function moveExercise(s: Session, exUid: string, dir: -1 | 1): Session {
  const i = s.exercises.findIndex((e) => e.uid === exUid)
  const j = i + dir
  if (i < 0 || j < 0 || j >= s.exercises.length) return s
  const list = [...s.exercises]
  ;[list[i], list[j]] = [list[j], list[i]]
  return { ...s, exercises: list }
}

export function addSet(s: Session, exUid: string): Session {
  return mapEx(s, exUid, (e) => {
    const last = e.sets[e.sets.length - 1]
    return { ...e, sets: [...e.sets, blankSet(last ? { weight: last.weight, reps: last.reps, seconds: last.seconds } : undefined)] }
  })
}

export function removeSet(s: Session, exUid: string, setId: string): Session {
  return mapEx(s, exUid, (e) => ({ ...e, sets: e.sets.filter((x) => x.id !== setId) }))
}

export function updateSet(s: Session, exUid: string, setId: string, patch: Partial<SetEntry>): Session {
  return mapEx(s, exUid, (e) => ({ ...e, sets: e.sets.map((x) => (x.id === setId ? { ...x, ...patch } : x)) }))
}

export function updateExercise(s: Session, exUid: string, patch: Partial<SessionExercise>): Session {
  return mapEx(s, exUid, (e) => ({ ...e, ...patch }))
}

/**
 * Valide / dévalide une série. Si les champs sont vides, reprend les valeurs de la dernière fois
 * (même numéro de série). Renvoie null si la série ne peut pas être validée (rien à enregistrer).
 */
export function toggleSetDone(
  s: Session,
  exUid: string,
  setId: string,
  history: Session[],
  custom: Exercise[],
  now = Date.now(),
): Session | null {
  const ex = s.exercises.find((e) => e.uid === exUid)
  if (!ex) return null
  const idx = ex.sets.findIndex((x) => x.id === setId)
  const st = ex.sets[idx]
  if (!st) return null
  if (st.done) return updateSet(s, exUid, setId, { done: false, doneAt: undefined })
  const kind = findExercise(ex.exerciseId, custom).kind
  const prev = previousSets(history, ex.exerciseId, s.startedAt, s.coachDay)
  const before = nearestFilled(ex.sets, idx)
  const ref = prev[idx] ?? before ?? prev[prev.length - 1]
  const patch: Partial<SetEntry> = { done: true, doneAt: now }
  if (kind === 'weight') {
    patch.weight = st.weight ?? ref?.weight ?? null
    patch.reps = st.reps ?? ref?.reps ?? null
    if (patch.weight == null || !patch.reps) return null
  } else if (kind === 'bodyweight') {
    patch.reps = st.reps ?? ref?.reps ?? null
    patch.weight = st.weight ?? null
    if (!patch.reps) return null
  } else if (kind === 'duration') {
    patch.seconds = st.seconds ?? ref?.seconds ?? null
    if (!patch.seconds) return null
  } else {
    patch.seconds = st.seconds ?? ref?.seconds ?? null
    patch.km = st.km ?? null
    patch.kcal = st.kcal ?? null
    if (!patch.seconds) return null
  }
  return updateSet(s, exUid, setId, patch)
}

/** Série la plus proche avant `idx` qui contient des valeurs (saisies ou validées). */
export function nearestFilled(sets: SetEntry[], idx: number): SetEntry | undefined {
  for (let k = idx - 1; k >= 0; k--) {
    const x = sets[k]
    if (x.weight != null || x.reps != null || x.seconds != null) return x
  }
  return undefined
}

/** Lie l'exercice au suivant en superset (ou délie s'ils le sont déjà). */
export function toggleSupersetWithNext(s: Session, exUid: string): Session {
  const i = s.exercises.findIndex((e) => e.uid === exUid)
  const a = s.exercises[i]
  const b = s.exercises[i + 1]
  if (!a || !b) return s
  const list = [...s.exercises]
  if (a.superset && a.superset === b.superset) {
    const group = a.superset
    const members = list.filter((e) => e.superset === group)
    // On coupe le groupe entre a et b.
    const cut = list.indexOf(b)
    for (let k = 0; k < list.length; k++) {
      if (list[k].superset !== group) continue
      if (k >= cut) list[k] = { ...list[k], superset: members.length > 2 && k > cut ? uid('ss') : null }
    }
    // Un exercice seul dans son groupe n'est plus en superset.
    return { ...s, exercises: cleanupSupersets(list) }
  }
  const group = a.superset ?? b.superset ?? uid('ss')
  list[i] = { ...a, superset: group }
  list[i + 1] = { ...b, superset: group }
  return { ...s, exercises: cleanupSupersets(list) }
}

function cleanupSupersets(list: SessionExercise[]): SessionExercise[] {
  const counts = new Map<string, number>()
  for (const e of list) if (e.superset) counts.set(e.superset, (counts.get(e.superset) ?? 0) + 1)
  return list.map((e) => (e.superset && (counts.get(e.superset) ?? 0) < 2 ? { ...e, superset: null } : e))
}

/** Faut-il lancer le chrono après cet exercice ? (pas au milieu d'un superset) */
export function shouldRestAfter(s: Session, exUid: string): boolean {
  const i = s.exercises.findIndex((e) => e.uid === exUid)
  const ex = s.exercises[i]
  if (!ex?.superset) return true
  const next = s.exercises[i + 1]
  return !next || next.superset !== ex.superset
}

/** Nettoie la séance à la fin : retire les séries non validées et les exercices vides. */
export function finalizeSession(s: Session, now = Date.now()): Session {
  const exercises = s.exercises
    .map((e) => ({ ...e, sets: e.sets.filter((x) => x.done) }))
    .filter((e) => e.sets.length > 0 || (e.note ?? '').trim() !== '')
  return { ...s, endedAt: now, exercises }
}

export function sessionHasWork(s: Session): boolean {
  return s.exercises.some((e) => e.sets.some((x) => x.done))
}
