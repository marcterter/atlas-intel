// Charge conseillée pour la séance du jour : double progression à partir de la dernière fois,
// des répétitions visées par le coach (« 10,8,6 », « 5-8 ») et des paliers de charge réellement utilisés.
import { findExercise } from '../data/exercises.ts'
import { fmtKg } from './format.ts'
import type { Equipment, Exercise, Session, SessionExercise, SetEntry } from './types.ts'

export interface RepTarget {
  lo: number
  hi: number
  /** Cible précise (« 10 ») plutôt qu'une fourchette (« 8-10 »). */
  exact: boolean
}

export type Trend = 'up' | 'same' | 'down'

export interface SetAdvice {
  weight: number | null
  reps: number | null
  seconds: number | null
  trend: Trend
  /** Série de la dernière fois qui a servi de base. */
  from: SetEntry | null
  /** Hausse annulée : la série d'avant, aujourd'hui, a été nettement plus dure que prévu. */
  calmed?: boolean
}

export interface ExerciseAdvice {
  /** Alignées sur les séries de la séance (null pour un échauffement ou sans base). */
  sets: (SetAdvice | null)[]
  trend: Trend
  summary: string
  why: string
}

/** « 10,8,6 » → une cible par série · « 5-8 » ou « 8 à 10 » → fourchette · « 12 » → même cible partout. */
export function parseRepsScheme(scheme: string | null | undefined): RepTarget[] {
  const t = String(scheme ?? '')
    .toLowerCase()
    .trim()
  if (!t) return []
  const out: RepTarget[] = []
  for (const part of t.split(/[,;/+]/)) {
    const p = part.trim()
    const range = p.match(/^(\d{1,2})\s*(?:-|–|à|a)\s*(\d{1,2})/)
    if (range) {
      const a = Number(range[1])
      const b = Number(range[2])
      if (Math.min(a, b) > 0) out.push({ lo: Math.min(a, b), hi: Math.max(a, b), exact: a === b })
      continue
    }
    const one = p.match(/^(\d{1,2})(?!\d)/)
    if (one && Number(one[1]) > 0) out.push({ lo: Number(one[1]), hi: Number(one[1]), exact: true })
  }
  return out
}

const DEFAULT_STEP: Partial<Record<Equipment, number>> = { halteres: 2, kettlebell: 4 }

/**
 * Palier de charge : le plus petit écart entre deux charges déjà utilisées (1,25 kg sur des petits
 * haltères…), sans dépasser le palier habituel du matériel (2,5 kg, 2 kg en haltères, 4 kg en kettlebell).
 */
export function loadStep(weights: number[], equipment: Equipment): number {
  const def = DEFAULT_STEP[equipment] ?? 2.5
  const ws = [...new Set(weights.filter((w) => w > 0).map((w) => Math.round(w * 4) / 4))].sort((a, b) => a - b)
  let best = Infinity
  for (let i = 1; i < ws.length; i++) {
    const d = Math.round((ws[i] - ws[i - 1]) * 100) / 100
    if (d >= 1 && d < best) best = d
  }
  return best <= 5 ? Math.min(best, def) : def
}

const round2 = (x: number) => Math.round(x * 100) / 100

/** Palier réel pour cette charge : au moins ~2,5 % (5 kg à 180 kg à la presse, pas 2,5). */
function stepFor(w: number, step: number): number {
  return Math.max(step, Math.ceil((w * 0.025) / step - 1e-9) * step)
}

/** Charge + ou − un palier, recalée sur la grille si on en était tout proche (47,4 → 50). */
function shift(w: number, step: number, dir: 1 | -1): number {
  const x = w + dir * stepFor(w, step)
  const grid = Math.round(x / step) * step
  return round2(Math.abs(grid - x) <= 0.15 ? grid : x)
}

const isWork = (s: SetEntry) => s.type !== 'echauffement'
const DAY = 86_400_000

interface Reference {
  sets: SetEntry[]
  startedAt: number
}

/** Dernière séance avec cet exercice (même jour du programme d'abord, comme le sheet du coach). */
function reference(history: Session[], exerciseId: string, before: number, coachDay?: string | null): { ref: Reference | null; lastAt: number | null; weights: number[] } {
  let same: Reference | null = null
  let any: Reference | null = null
  const weights: number[] = []
  for (const s of history) {
    if (s.startedAt >= before) continue
    for (const ex of s.exercises) {
      if (ex.exerciseId !== exerciseId) continue
      const done = ex.sets.filter((x) => x.done)
      for (const x of done) if (x.weight) weights.push(x.weight)
      if (!done.some(isWork)) continue
      const r = { sets: done, startedAt: s.startedAt }
      if (!any || s.startedAt > any.startedAt) any = r
      if (coachDay && s.coachDay === coachDay && (!same || s.startedAt > same.startedAt)) same = r
    }
  }
  return { ref: same ?? any, lastAt: any?.startedAt ?? null, weights }
}

/** Conseil pour une série « charge × reps », d'après la même série la dernière fois. */
export function adviseWeightSet(last: SetEntry, target: RepTarget | null, step: number): SetAdvice | null {
  const w = last.weight ?? 0
  const r = last.reps ?? 0
  if (w <= 0 || r <= 0) return null
  const lo = target?.lo ?? 8
  const hi = target?.hi ?? 12
  const exact = target ? target.exact : false
  // Au-delà du plafond on monte la charge : la fourchette haute, ou une rep de plus qu'une cible précise.
  const ceiling = exact ? hi + 1 : hi
  const e1 = w * (1 + r / 30) // Epley, sans plafond : sert juste à comparer deux charges proches
  const repsAt = (x: number) => 30 * (e1 / x - 1)
  const base = { seconds: null, from: last }
  if (r >= ceiling) {
    const up = shift(w, step, 1)
    const p = repsAt(up)
    if (p >= lo - 1 || r >= ceiling + 4) {
      const aim = exact || hi === lo ? lo : Math.max(lo, Math.min(hi - 1, Math.round(p)))
      return { ...base, weight: up, reps: aim, trend: 'up' }
    }
    // Palier suivant trop gros d'un coup (haltères légers…) : encore des reps avant de monter.
    return { ...base, weight: w, reps: r + 1, trend: 'same' }
  }
  if (r >= lo) return { ...base, weight: w, reps: Math.min(r + 1, ceiling), trend: 'same' }
  if (r >= lo - 2) return { ...base, weight: w, reps: r + 1, trend: 'same' }
  // Nettement sous la cible : la charge qui la permet, d'après la dernière série (deux paliers max).
  let down = shift(w, step, -1)
  if (repsAt(down) < lo - 1) {
    const further = shift(down, step, -1)
    if (further > 0) down = further
  }
  return down > 0 ? { ...base, weight: down, reps: lo, trend: 'down' } : { ...base, weight: w, reps: r + 1, trend: 'same' }
}

function adviseOther(last: SetEntry, kind: Exercise['kind'], target: RepTarget | null, step: number): SetAdvice | null {
  if (kind === 'bodyweight') {
    // Avec du lest : même logique qu'une charge. Sans : une rep de plus.
    if ((last.weight ?? 0) > 0) return adviseWeightSet(last, target, step)
    const r = last.reps ?? 0
    return r > 0 ? { weight: null, reps: r + 1, seconds: null, trend: 'same', from: last } : null
  }
  if (kind === 'duration') {
    const s = last.seconds ?? 0
    return s > 0 ? { weight: null, reps: null, seconds: s + 5, trend: 'up', from: last } : null
  }
  return null
}

function label(a: SetAdvice, kind: Exercise['kind']): string {
  if (a.seconds != null && a.reps == null) return `${a.seconds} s`
  if (kind === 'bodyweight' && !a.weight) return `PDC × ${a.reps}`
  return `${kind === 'bodyweight' ? '+' : ''}${fmtKg(a.weight)} × ${a.reps}`
}

function which(idx: number[], total: number): string {
  if (idx.length === total && total > 1) return 'toutes les séries'
  const n = idx.map((i) => i + 1)
  if (n.length === 1) return `la série ${n[0]}`
  return `les séries ${n.slice(0, -1).join(', ')} et ${n[n.length - 1]}`
}

/**
 * Objectif du jour pour un exercice. Prend aussi en compte la séance en cours : si une série vient
 * d'être nettement plus dure que prévu, la suivante revient à la charge de la dernière fois.
 */
export function adviseExercise(
  ex: SessionExercise,
  history: Session[],
  custom: Exercise[],
  before: number,
  coachDay?: string | null,
  now = before,
): ExerciseAdvice | null {
  const exo = findExercise(ex.exerciseId, custom)
  if (exo.kind === 'cardio') return null
  const { ref, lastAt, weights } = reference(history, ex.exerciseId, before, coachDay)
  if (!ref) return null
  const targets = parseRepsScheme(ex.repsTarget)
  const step = loadStep(weights, exo.equipment)
  const lastWork = ref.sets.filter(isWork)
  // Après une coupure de 4 semaines ou plus, on reprend aux mêmes charges.
  const weeksOff = lastAt != null ? Math.floor((now - lastAt) / (7 * DAY)) : 0
  const comeback = weeksOff >= 4

  const out: (SetAdvice | null)[] = []
  let k = 0
  let prevAdvice: SetAdvice | null = null
  let prevToday: SetEntry | null = null
  for (const st of ex.sets) {
    if (!isWork(st)) {
      out.push(null)
      continue
    }
    const target = targets[k] ?? targets[targets.length - 1] ?? null
    const last = lastWork[k]
    let a: SetAdvice | null = null
    if (last) {
      if (comeback) a = { weight: last.weight, reps: last.reps, seconds: last.seconds, trend: 'same', from: last }
      else a = exo.kind === 'weight' ? adviseWeightSet(last, target, step) : adviseOther(last, exo.kind, target, step)
    } else if (prevAdvice) {
      // Série en plus par rapport à la dernière fois : même charge que la précédente.
      a = { weight: prevAdvice.weight, reps: target?.lo ?? prevAdvice.reps, seconds: prevAdvice.seconds, trend: 'same', from: null }
    }
    // Autorégulation : la série d'avant (aujourd'hui) a raté l'objectif de 2 reps ou plus.
    if (a && a.trend === 'up' && a.from && prevToday?.done && prevAdvice?.reps != null && (prevToday.reps ?? 0) <= prevAdvice.reps - 2) {
      a = { ...a, weight: a.from.weight, reps: a.from.reps, trend: 'same', calmed: true }
    }
    out.push(a)
    if (a) prevAdvice = a
    prevToday = st
    k++
  }
  const list = out.filter((a): a is SetAdvice => !!a)
  if (!list.length) return null

  const upIdx: number[] = []
  const downIdx: number[] = []
  const calmedIdx: number[] = []
  list.forEach((a, j) => {
    if (a.trend === 'up') upIdx.push(j)
    if (a.trend === 'down') downIdx.push(j)
    if (a.calmed) calmedIdx.push(j)
  })
  const trend: Trend = upIdx.length ? 'up' : downIdx.length ? 'down' : 'same'
  let why: string
  if (comeback) why = `Reprise après ${weeksOff} semaines : mêmes charges que la dernière fois`
  else if (exo.kind === 'duration') why = 'Tiens 5 secondes de plus'
  else if (exo.kind === 'bodyweight' && !list.some((a) => a.weight)) why = 'Une répétition de plus par série'
  else {
    const parts: string[] = []
    if (upIdx.length) parts.push(`Charge en hausse sur ${which(upIdx, list.length)} : reps visées dépassées la dernière fois`)
    if (downIdx.length) parts.push(`${upIdx.length ? 'allège' : 'Allège'} ${which(downIdx, list.length)} : trop loin des reps visées`)
    if (calmedIdx.length) {
      const what = which(calmedIdx, list.length)
      parts.push(`${parts.length ? what : what.charAt(0).toUpperCase() + what.slice(1)} à la charge habituelle : la série d’avant a été dure`)
    }
    why = parts.length ? parts.join(' · ') : 'Même charge, vise une rep de plus'
  }
  return { sets: out, trend, summary: list.map((a) => label(a, exo.kind)).join(' · '), why }
}
