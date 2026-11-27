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
  /**
   * Forme du jour : la dernière série faite aujourd'hui a dépassé (better) ou raté (worse) son objectif
   * d'environ 2 reps ou plus, et celle-ci a été recalculée en conséquence ; `today` : pas d'historique,
   * la série part de la précédente du jour.
   */
  form?: 'better' | 'worse' | 'today'
  /** Numéro (parmi les séries de travail) de la série du jour qui a servi de repère. */
  formFrom?: number
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
      if (coachDay && (ex.pour?.coachDay ?? s.coachDay) === coachDay && (!same || s.startedAt > same.startedAt)) same = r
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

const e1rm = (w: number, r: number) => w * (1 + r / 30)
/** Écart à l'objectif à partir duquel la suite s'ajuste : ~2 reps (vers 8-12 reps, une rep ≈ 2,5 %). */
const FORM_GAP = 0.045

/**
 * Recalcule une série d'après la forme du jour (rapport des 1RM estimés : série faite / son objectif).
 * Mêmes reps visées, charge refaite sur la grille (amortie aux trois quarts, deux paliers au plus) ;
 * si la charge ne bouge pas, une rep de plus ou de moins.
 */
export function adjustToForm(a: SetAdvice, ratio: number, step: number): SetAdvice {
  if (a.weight == null || a.reps == null || a.weight <= 0 || Math.abs(ratio - 1) < FORM_GAP) return a
  const better = ratio > 1
  const target = e1rm(a.weight, a.reps) * (1 + (ratio - 1) * 0.75)
  const max = 2 * stepFor(a.weight, step)
  let w = Math.round(target / (1 + a.reps / 30) / step) * step
  w = round2(Math.min(a.weight + max, Math.max(a.weight - max, w)))
  let reps = a.reps
  if (w === a.weight || w <= 0) {
    w = a.weight
    reps = Math.max(1, a.reps + (better ? 1 : -1))
  }
  const ref = a.from?.weight ?? a.weight
  const trend: Trend = w > ref ? 'up' : w < ref ? 'down' : 'same'
  return { ...a, weight: w, reps, trend, form: better ? 'better' : 'worse' }
}

/**
 * Objectif du jour pour un exercice. Prend aussi en compte la séance en cours : chaque série faite
 * aujourd'hui, comparée à son objectif, recale les suivantes (forme du jour). Sans historique, la suite
 * part de la dernière série du jour (même charge, reps visées par le coach).
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
  const doneToday = ex.sets.filter((x) => x.done && isWork(x))
  if (!ref && !(exo.kind === 'weight' && doneToday.some((x) => (x.weight ?? 0) > 0 && (x.reps ?? 0) > 0))) return null
  const targets = parseRepsScheme(ex.repsTarget)
  const step = loadStep([...weights, ...doneToday.map((x) => x.weight ?? 0)], exo.equipment)
  const lastWork = ref ? ref.sets.filter(isWork) : []
  // Après une coupure de 4 semaines ou plus, on reprend aux mêmes charges.
  const weeksOff = lastAt != null ? Math.floor((now - lastAt) / (7 * DAY)) : 0
  const comeback = weeksOff >= 4

  const out: (SetAdvice | null)[] = []
  let k = 0
  let prevPlan: SetAdvice | null = null
  // Dernière série de travail faite aujourd'hui : son numéro, ce qui a été fait, son objectif d'origine.
  let lastDone: { n: number; set: SetEntry; plan: SetAdvice | null } | null = null
  for (const st of ex.sets) {
    if (!isWork(st)) {
      out.push(null)
      continue
    }
    const target = targets[k] ?? targets[targets.length - 1] ?? null
    const last = lastWork[k]
    let plan: SetAdvice | null = null
    if (last) {
      if (comeback) plan = { weight: last.weight, reps: last.reps, seconds: last.seconds, trend: 'same', from: last }
      else plan = exo.kind === 'weight' ? adviseWeightSet(last, target, step) : adviseOther(last, exo.kind, target, step)
    } else if (prevPlan) {
      // Série en plus par rapport à la dernière fois : même charge que la précédente.
      plan = { weight: prevPlan.weight, reps: target?.lo ?? prevPlan.reps, seconds: prevPlan.seconds, trend: 'same', from: null }
    }
    let a = plan
    const did = lastDone?.set
    // (Une série déjà faite garde l'objectif recalculé qu'elle affichait.)
    if (exo.kind === 'weight' && lastDone && did && (did.weight ?? 0) > 0 && (did.reps ?? 0) > 0) {
      const p = lastDone.plan
      if (a && p?.weight && p.reps) {
        // Forme du jour : la dernière série faite contre son objectif recale celle-ci.
        const adjusted = adjustToForm(a, e1rm(did.weight as number, did.reps as number) / e1rm(p.weight, p.reps), step)
        if (adjusted !== a) a = { ...adjusted, formFrom: lastDone.n }
      } else if (!a) {
        // Pas d'historique : même charge que la dernière série du jour, reps visées ; 2 reps sous sa cible → un palier de moins.
        const prevTarget = targets[lastDone.n - 1] ?? targets[targets.length - 1] ?? null
        const short = prevTarget != null && (did.reps as number) <= prevTarget.lo - 2
        const w = short ? shift(did.weight as number, step, -1) : (did.weight as number)
        a = { weight: w > 0 ? w : did.weight, reps: target?.lo ?? did.reps, seconds: null, trend: short ? 'down' : 'same', from: null, form: 'today', formFrom: lastDone.n }
      }
    }
    out.push(a)
    if (plan) prevPlan = plan
    if (st.done) lastDone = { n: k + 1, set: st, plan }
    k++
  }
  const list = out.filter((a): a is SetAdvice => !!a)
  if (!list.length) return null

  const upIdx: number[] = []
  const downIdx: number[] = []
  list.forEach((a, j) => {
    if (a.trend === 'up') upIdx.push(j)
    if (a.trend === 'down') downIdx.push(j)
  })
  const trend: Trend = upIdx.length ? 'up' : downIdx.length ? 'down' : 'same'
  const adapted = out.filter((a): a is SetAdvice => !!a?.form)
  const cue = adapted[adapted.length - 1]
  let why: string
  if (cue?.form === 'today') why = `Pas encore d’historique : la suite d’après ta série ${cue.formFrom}`
  else if (cue) why = `Série ${cue.formFrom} ${cue.form === 'better' ? 'au-dessus de l’objectif : la suite monte' : 'sous l’objectif : la suite s’allège'}`
  else if (comeback) why = `Reprise après ${weeksOff} semaines : mêmes charges que la dernière fois`
  else if (exo.kind === 'duration') why = 'Tiens 5 secondes de plus'
  else if (exo.kind === 'bodyweight' && !list.some((a) => a.weight)) why = 'Une répétition de plus par série'
  else {
    const parts: string[] = []
    if (upIdx.length) parts.push(`Charge en hausse sur ${which(upIdx, list.length)} : reps visées dépassées la dernière fois`)
    if (downIdx.length) parts.push(`${upIdx.length ? 'allège' : 'Allège'} ${which(downIdx, list.length)} : trop loin des reps visées`)
    why = parts.length ? parts.join(' · ') : 'Même charge, vise une rep de plus'
  }
  return { sets: out, trend, summary: list.map((a) => label(a, exo.kind)).join(' · '), why }
}
