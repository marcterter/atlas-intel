// Changements de programme proposés par l'agent IA du lundi (« +1 série de curl », « remplace la
// leg press par la hack squat »), appliqués d'un geste à tes séances dans l'app.
import { EXERCISES, findExercise, MUSCLE_LABEL, normalize } from '../data/exercises.ts'
import { sameName } from './agent.ts'
import { guessEquipment, guessKind, guessMuscle } from './coach.ts'
import { uid } from './id.ts'
import type { Exercise, Muscle, ProgramChange, Routine, RoutineItem } from './types.ts'

/** Clé stable d'un changement (pour retenir s'il a été appliqué ou ignoré). */
export function changeKey(c: ProgramChange): string {
  return JSON.stringify([c.type, normalize(c.seance), normalize(c.exercice), c.series ?? null, c.reps ?? null, c.rir ?? null, c.par ? normalize(c.par) : null])
}

export function findRoutine(routines: Routine[], name: string): Routine | undefined {
  return routines.find((r) => normalize(r.name) === normalize(name)) ?? routines.find((r) => sameName(r.name, name))
}

function itemIndex(items: RoutineItem[], name: string, custom: Exercise[]): number {
  const exact = items.findIndex((it) => normalize(findExercise(it.exerciseId, custom).name) === normalize(name))
  return exact >= 0 ? exact : items.findIndex((it) => sameName(findExercise(it.exerciseId, custom).name, name))
}

const MUSCLES = Object.keys(MUSCLE_LABEL) as Muscle[]
const asMuscle = (m: string | undefined): Muscle | null => {
  if (!m) return null
  const n = normalize(m).replace(/ /g, '_')
  return MUSCLES.find((x) => x === n || normalize(MUSCLE_LABEL[x]) === normalize(m)) ?? null
}

/** L'exercice de ce nom (celui de l'app, ou un des tiens), sinon un nouvel exercice à toi. */
export function resolveExercise(name: string, muscle: string | undefined, fallback: Muscle | null, custom: Exercise[]): { exercise: Exercise; custom: Exercise[] } {
  const all = [...custom, ...EXERCISES]
  const found = all.find((e) => normalize(e.name) === normalize(name)) ?? all.find((e) => sameName(e.name, name))
  if (found) return { exercise: found, custom }
  const m = asMuscle(muscle) ?? fallback ?? guessMuscle(name)
  const exercise: Exercise = { id: uid('x'), name: name.trim(), muscle: m, equipment: guessEquipment(name), kind: guessKind(name, m), custom: true }
  return { exercise, custom: [...custom, exercise] }
}

/** Un superset réduit à un seul exercice n'en est plus un. */
function tidySupersets(items: RoutineItem[]): RoutineItem[] {
  return items.map((it) => (it.superset && items.filter((x) => x.superset === it.superset).length < 2 ? { ...it, superset: null } : it))
}

/** « Upper 1 · Curl pupitre : 3 → 4 séries » */
export function describeChange(c: ProgramChange, routines: Routine[], custom: Exercise[]): string {
  const r = findRoutine(routines, c.seance)
  const it = r ? r.items[itemIndex(r.items, c.exercice, custom)] : undefined
  const head = `${r?.name ?? c.seance} · ${c.exercice}`
  switch (c.type) {
    case 'series':
      return `${head} : ${it ? `${it.sets} → ` : ''}${c.series} série${(c.series ?? 0) > 1 ? 's' : ''}`
    case 'reps':
      return `${head} : reps ${it?.reps ? `${it.reps} → ` : ''}${c.reps}`
    case 'rir':
      return `${head} : RIR ${it?.rir ? `${it.rir} → ` : ''}${c.rir}`
    case 'ajouter':
      return `${r?.name ?? c.seance} : ajouter ${c.exercice} (${c.series ?? 3} × ${c.reps ?? '8-12'})${c.apres ? ` après ${c.apres}` : ''}`
    case 'retirer':
      return `${r?.name ?? c.seance} : retirer ${c.exercice}`
    case 'remplacer':
      return `${head} → ${c.par}`
  }
}

export type ApplyResult = { ok: true; routines: Routine[]; custom: Exercise[]; label: string } | { ok: false; error: string; label: string }

/** Applique un changement aux séances (et crée l'exercice s'il n'existe pas dans l'app). */
export function applyChange(c: ProgramChange, routines: Routine[], custom: Exercise[], now = Date.now()): ApplyResult {
  const label = describeChange(c, routines, custom)
  const r = findRoutine(routines, c.seance)
  if (!r) return { ok: false, error: `Séance « ${c.seance} » introuvable`, label }
  let items = [...r.items]
  let nextCustom = custom
  if (c.type === 'ajouter') {
    const res = resolveExercise(c.exercice, c.muscle, null, custom)
    if (items.some((it) => it.exerciseId === res.exercise.id)) return { ok: false, error: `${res.exercise.name} est déjà dans ${r.name}`, label }
    nextCustom = res.custom
    const after = c.apres ? itemIndex(items, c.apres, custom) : -1
    const ref = after >= 0 ? items[after] : items[items.length - 1]
    // Après le superset entier de l'exercice de référence.
    let at = after >= 0 ? after + 1 : items.length
    if (after >= 0 && items[after].superset) while (at < items.length && items[at].superset === items[after].superset) at++
    const kind = res.exercise.kind
    items.splice(at, 0, {
      uid: uid('i'),
      exerciseId: res.exercise.id,
      sets: c.series ?? (kind === 'cardio' ? 1 : 3),
      reps: c.reps ?? (kind === 'cardio' ? '20 min' : '8-12'),
      restSec: ref?.restSec ?? 120,
      superset: null,
      ...(c.rir ? { rir: c.rir } : {}),
    })
  } else {
    const i = itemIndex(items, c.exercice, custom)
    if (i < 0) return { ok: false, error: `« ${c.exercice} » introuvable dans ${r.name}`, label }
    const it = items[i]
    if (c.type === 'series') items[i] = { ...it, sets: Math.min(10, Math.max(1, c.series ?? it.sets)) }
    if (c.type === 'reps') items[i] = { ...it, reps: c.reps ?? it.reps }
    if (c.type === 'rir') items[i] = { ...it, rir: c.rir ?? it.rir }
    if (c.type === 'retirer') items = tidySupersets(items.filter((_, k) => k !== i))
    if (c.type === 'remplacer') {
      const res = resolveExercise(c.par ?? '', c.muscle, findExercise(it.exerciseId, custom).muscle, custom)
      if (items.some((x, k) => k !== i && x.exerciseId === res.exercise.id)) return { ok: false, error: `${res.exercise.name} est déjà dans ${r.name}`, label }
      nextCustom = res.custom
      items[i] = { ...it, exerciseId: res.exercise.id, ...(c.series ? { sets: c.series } : {}), ...(c.reps ? { reps: c.reps } : {}), ...(c.rir ? { rir: c.rir } : {}) }
    }
  }
  const next: Routine = { ...r, items, updatedAt: now }
  return { ok: true, routines: routines.map((x) => (x.id === r.id ? next : x)), custom: nextCustom, label }
}
