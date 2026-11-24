import { findExercise } from '../data/exercises.ts'
import type { Exercise, ExerciseKind, ISODate, Muscle, Session, SessionExercise, SetEntry } from './types.ts'
import { addDays } from './date.ts'

export function isWorkSet(s: SetEntry): boolean {
  return s.done && s.type !== 'echauffement'
}

/** Volume (kg) d'une série : charge × reps. Pour le poids du corps, seul le lest compte. */
export function setVolume(s: SetEntry, kind: ExerciseKind): number {
  if (!isWorkSet(s)) return 0
  if (kind === 'weight' || kind === 'bodyweight') return (s.weight ?? 0) * (s.reps ?? 0)
  return 0
}

export function exerciseVolume(ex: SessionExercise, kind: ExerciseKind): number {
  return ex.sets.reduce((sum, s) => sum + setVolume(s, kind), 0)
}

export function sessionTonnage(session: Session, custom: Exercise[] = []): number {
  return session.exercises.reduce((sum, ex) => sum + exerciseVolume(ex, findExercise(ex.exerciseId, custom).kind), 0)
}

export function sessionWorkSets(session: Session): number {
  return session.exercises.reduce((n, ex) => n + ex.sets.filter(isWorkSet).length, 0)
}

export function sessionDurationMs(session: Session, now = Date.now()): number {
  return (session.endedAt ?? now) - session.startedAt
}

/** 1RM estimé (Epley). */
export function e1rm(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight
  return weight * (1 + Math.min(reps, 15) / 30)
}

export interface ExerciseStats {
  maxWeight: number
  maxWeightReps: number
  bestE1rm: number
  volume: number
  workSets: number
  maxReps: number
  maxSeconds: number
}

export function statsOf(ex: SessionExercise, kind: ExerciseKind): ExerciseStats {
  const st: ExerciseStats = { maxWeight: 0, maxWeightReps: 0, bestE1rm: 0, volume: 0, workSets: 0, maxReps: 0, maxSeconds: 0 }
  for (const s of ex.sets) {
    if (!isWorkSet(s)) continue
    st.workSets++
    const w = s.weight ?? 0
    const r = s.reps ?? 0
    if (w > st.maxWeight || (w === st.maxWeight && r > st.maxWeightReps)) {
      st.maxWeight = w
      st.maxWeightReps = r
    }
    st.bestE1rm = Math.max(st.bestE1rm, e1rm(w, r))
    st.maxReps = Math.max(st.maxReps, r)
    st.maxSeconds = Math.max(st.maxSeconds, s.seconds ?? 0)
    st.volume += setVolume(s, kind)
  }
  return st
}

export interface HistoryPoint {
  sessionId: string
  date: ISODate
  startedAt: number
  sets: SetEntry[]
  stats: ExerciseStats
  note?: string
}

/** Historique d'un exercice (séances terminées, de la plus ancienne à la plus récente). */
export function exerciseHistory(sessions: Session[], exerciseId: string, custom: Exercise[] = []): HistoryPoint[] {
  const kind = findExercise(exerciseId, custom).kind
  const pts: HistoryPoint[] = []
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (ex.exerciseId !== exerciseId) continue
      const stats = statsOf(ex, kind)
      if (stats.workSets === 0 && !ex.note) continue
      pts.push({ sessionId: s.id, date: s.date, startedAt: s.startedAt, sets: ex.sets.filter(isWorkSet), stats, note: ex.note })
    }
  }
  return pts.sort((a, b) => a.startedAt - b.startedAt)
}

/**
 * Séries réalisées la dernière fois sur cet exercice (avant `before`).
 * Avec `coachDay`, on compare d'abord au même jour du programme (comme le sheet du coach,
 * semaine après semaine), puis à la dernière fois toutes séances confondues.
 */
export function previousSets(sessions: Session[], exerciseId: string, before = Infinity, coachDay?: string | null): SetEntry[] {
  const pick = (keep: (s: Session, ex: SessionExercise) => boolean): SetEntry[] => {
    let best: { at: number; sets: SetEntry[] } | null = null
    for (const s of sessions) {
      if (s.startedAt >= before) continue
      for (const ex of s.exercises) {
        if (ex.exerciseId !== exerciseId || !keep(s, ex)) continue
        const done = ex.sets.filter((x) => x.done)
        if (!done.length) continue
        if (!best || s.startedAt > best.at) best = { at: s.startedAt, sets: done }
      }
    }
    return best?.sets ?? []
  }
  if (coachDay) {
    const same = pick((s, ex) => (ex.pour?.coachDay ?? s.coachDay) === coachDay)
    if (same.length) return same
  }
  return pick(() => true)
}

export function lastNoteFor(sessions: Session[], exerciseId: string, before = Infinity): { note: string; date: ISODate } | null {
  let best: { at: number; note: string; date: ISODate } | null = null
  for (const s of sessions) {
    if (s.startedAt >= before) continue
    for (const ex of s.exercises) {
      if (ex.exerciseId === exerciseId && ex.note?.trim() && (!best || s.startedAt > best.at)) {
        best = { at: s.startedAt, note: ex.note.trim(), date: s.date }
      }
    }
  }
  return best ? { note: best.note, date: best.date } : null
}

export type RecordKind = 'charge' | '1rm' | 'reps' | 'volume' | 'duree'

export interface RecordHit {
  exerciseId: string
  kind: RecordKind
  label: string
  value: number
  previous: number
  weight?: number
  reps?: number
}

/** Records battus par une séance par rapport à tout l'historique antérieur. */
export function detectRecords(session: Session, history: Session[], custom: Exercise[] = []): RecordHit[] {
  const before = history.filter((s) => s.id !== session.id && s.startedAt < session.startedAt)
  const hits: RecordHit[] = []
  const seen = new Set<string>()
  for (const ex of session.exercises) {
    if (seen.has(ex.exerciseId)) continue
    seen.add(ex.exerciseId)
    const exo = findExercise(ex.exerciseId, custom)
    const merged: SessionExercise = {
      ...ex,
      sets: session.exercises.filter((e) => e.exerciseId === ex.exerciseId).flatMap((e) => e.sets),
    }
    const now = statsOf(merged, exo.kind)
    if (now.workSets === 0) continue
    const past = exerciseHistory(before, ex.exerciseId, custom)
    if (past.length === 0) continue // première fois : pas un record
    const prevMaxW = Math.max(...past.map((p) => p.stats.maxWeight))
    const prevE1 = Math.max(...past.map((p) => p.stats.bestE1rm))
    const prevReps = Math.max(...past.map((p) => p.stats.maxReps))
    const prevSec = Math.max(...past.map((p) => p.stats.maxSeconds))
    if (exo.kind === 'weight' || (exo.kind === 'bodyweight' && now.maxWeight > 0)) {
      if (now.maxWeight > prevMaxW) {
        hits.push({ exerciseId: ex.exerciseId, kind: 'charge', label: 'Charge max', value: now.maxWeight, previous: prevMaxW, weight: now.maxWeight, reps: now.maxWeightReps })
        continue
      }
      if (now.bestE1rm > prevE1 + 0.01) {
        const best = merged.sets.filter(isWorkSet).reduce((a, b) => (e1rm(b.weight ?? 0, b.reps ?? 0) > e1rm(a.weight ?? 0, a.reps ?? 0) ? b : a))
        hits.push({ exerciseId: ex.exerciseId, kind: '1rm', label: '1RM estimé', value: now.bestE1rm, previous: prevE1, weight: best.weight ?? 0, reps: best.reps ?? 0 })
      }
    } else if (exo.kind === 'bodyweight') {
      if (now.maxReps > prevReps) hits.push({ exerciseId: ex.exerciseId, kind: 'reps', label: 'Répétitions', value: now.maxReps, previous: prevReps, reps: now.maxReps })
    } else if (exo.kind === 'duration') {
      if (now.maxSeconds > prevSec) hits.push({ exerciseId: ex.exerciseId, kind: 'duree', label: 'Durée', value: now.maxSeconds, previous: prevSec })
    }
  }
  return hits
}

/** Séance précédente comparable (même programme, sinon même nom). */
export function previousComparable(session: Session, history: Session[]): Session | null {
  const candidates = history
    .filter((s) => s.id !== session.id && s.startedAt < session.startedAt)
    .filter((s) => (session.routineId ? s.routineId === session.routineId : s.name === session.name))
  if (!candidates.length) return null
  return candidates.reduce((a, b) => (b.startedAt > a.startedAt ? b : a))
}

export interface Progress {
  exerciseId: string
  volumeDelta: number
  volumePct: number
}

/** Exercices dont le volume a progressé par rapport à la dernière fois. */
export function progressVsPrevious(session: Session, history: Session[], custom: Exercise[] = []): Progress[] {
  const out: Progress[] = []
  for (const ex of session.exercises) {
    const kind = findExercise(ex.exerciseId, custom).kind
    if (kind !== 'weight') continue
    const prev = previousSets(history.filter((s) => s.id !== session.id), ex.exerciseId, session.startedAt)
    const prevVol = prev.reduce((s, x) => s + setVolume(x, kind), 0)
    const vol = exerciseVolume(ex, kind)
    if (prevVol > 0 && vol > prevVol) out.push({ exerciseId: ex.exerciseId, volumeDelta: vol - prevVol, volumePct: (vol - prevVol) / prevVol })
  }
  return out.sort((a, b) => b.volumePct - a.volumePct)
}

function inWindow(s: Session, ref: ISODate, days: number) {
  const from = addDays(ref, -(days - 1))
  return s.date >= from && s.date <= ref
}

/** Séries effectives par groupe musculaire sur les `days` derniers jours. */
export function setsByMuscle(sessions: Session[], ref: ISODate, days = 7, custom: Exercise[] = []): Map<Muscle, number> {
  const m = new Map<Muscle, number>()
  for (const s of sessions) {
    if (!inWindow(s, ref, days)) continue
    for (const ex of s.exercises) {
      const muscle = findExercise(ex.exerciseId, custom).muscle
      const n = ex.sets.filter(isWorkSet).length
      if (n) m.set(muscle, (m.get(muscle) ?? 0) + n)
    }
  }
  return m
}

/** Tonnage par groupe musculaire sur les `days` derniers jours. */
export function tonnageByMuscle(sessions: Session[], ref: ISODate, days = 7, custom: Exercise[] = []): Map<Muscle, number> {
  const m = new Map<Muscle, number>()
  for (const s of sessions) {
    if (!inWindow(s, ref, days)) continue
    for (const ex of s.exercises) {
      const exo = findExercise(ex.exerciseId, custom)
      const v = exerciseVolume(ex, exo.kind)
      if (v) m.set(exo.muscle, (m.get(exo.muscle) ?? 0) + v)
    }
  }
  return m
}

const EQUIVALENTS: { kg: number; one: string; many: string; emoji: string }[] = [
  { kg: 50000, one: 'un char d’assaut', many: 'chars d’assaut', emoji: '🪖' },
  { kg: 30000, one: 'une baleine à bosse', many: 'baleines à bosse', emoji: '🐋' },
  { kg: 18000, one: 'un camion de pompiers', many: 'camions de pompiers', emoji: '🚒' },
  { kg: 12000, one: 'un bus', many: 'bus', emoji: '🚌' },
  { kg: 6000, one: 'un éléphant d’Afrique', many: 'éléphants d’Afrique', emoji: '🐘' },
  { kg: 3500, one: 'un rhinocéros', many: 'rhinocéros', emoji: '🦏' },
  { kg: 1500, one: 'une voiture', many: 'voitures', emoji: '🚗' },
  { kg: 600, one: 'un piano à queue', many: 'pianos à queue', emoji: '🎹' },
  { kg: 250, one: 'un lion', many: 'lions', emoji: '🦁' },
]

/** "Le poids d’un bus.", "Autant que 2 pianos à queue.", ou un encouragement sous 250 kg. */
export function tonnageEquivalent(kg: number): { label: string; emoji: string; count: number } {
  const eq = EQUIVALENTS.find((e) => kg >= e.kg)
  if (!eq) return { label: 'Chaque kilo compte', emoji: '💪', count: 0 }
  const count = Math.floor(kg / eq.kg)
  return { label: count >= 2 ? `Autant que ${count} ${eq.many}` : `Le poids d’${eq.one}`, emoji: eq.emoji, count }
}

/** Résumé texte d'une série : "80 × 8", "12 reps", "45 s", "20 min · 3,2 km". */
export function setLabel(s: SetEntry, kind: ExerciseKind): string {
  const num = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',')
  if (kind === 'weight') return `${num(s.weight ?? 0)} × ${s.reps ?? 0}`
  if (kind === 'bodyweight') return s.weight ? `${s.reps ?? 0} reps +${num(s.weight)} kg` : `${s.reps ?? 0} reps`
  if (kind === 'duration') return `${s.seconds ?? 0} s`
  const parts = [`${Math.round((s.seconds ?? 0) / 60)} min`]
  if (s.km) parts.push(`${num(s.km)} km`)
  if (s.kcal) parts.push(`${s.kcal} kcal`)
  return parts.join(' · ')
}
