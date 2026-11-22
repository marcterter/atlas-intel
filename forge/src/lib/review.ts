// Bilan du lundi : l'évolution du poids moyen de la semaine dit s'il faut monter ou baisser les macros.
import { addDays, startOfWeek } from './date.ts'
import { KCAL_PER_KG } from './energy.ts'
import { fmt, fmtKg } from './format.ts'
import type { FoodEntry, Goal, ISODate, MacroTargets, Targets, WeighIn } from './types.ts'

/** Rythme visé, en % du poids par semaine (assez large pour ne pas courir après l'eau). */
export const RATES: Record<Goal, { min: number; max: number }> = {
  seche: { min: -1, max: -0.4 },
  maintien: { min: -0.35, max: 0.35 },
  prise: { min: 0.05, max: 0.5 },
}

/** Pesées minimum par semaine pour comparer deux moyennes. */
export const MIN_WEIGHINS = 3

export type ReviewKind = 'manque' | 'ok' | 'diete' | 'ajuste'

export interface WeekReview {
  /** Lundi du bilan (clé de la décision). */
  monday: ISODate
  /** Semaine passée, lundi → dimanche. */
  from: ISODate
  to: ISODate
  count: number
  prevCount: number
  avg: number | null
  deltaKg: number | null
  goal: Goal
  kind: ReviewKind
  /** Ajustement proposé, en kcal par jour (0 = on garde). */
  deltaKcal: number
  next: Targets | null
  title: string
  detail: string
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length
const r5 = (x: number) => Math.round(x / 5) * 5
const r10 = (x: number) => Math.round(x / 10) * 10
const r50 = (x: number) => Math.round(x / 50) * 50

/** Ajustement pris sur les glucides (protéines intactes) ; sous 60 g de glucides, le reste sur les lipides. */
function shiftMacros(m: MacroTargets, deltaKcal: number, weightKg: number): MacroTargets {
  let carbs = m.carbs + r5(deltaKcal / 4)
  let fat = m.fat
  if (carbs < 60) {
    const missing = (60 - carbs) * 4
    carbs = 60
    fat = Math.max(r5(weightKg * 0.6), fat - r5(missing / 9))
  }
  return { ...m, kcal: r10(m.kcal + deltaKcal), carbs, fat }
}

/** Mêmes kcal en plus ou en moins les jours ON et OFF (l'écart entre les deux ne change pas). */
export function shiftTargets(t: Targets, deltaKcal: number, weightKg: number): Targets {
  return { ...t, base: shiftMacros(t.base, deltaKcal, weightKg), rest: t.rest ? shiftMacros(t.rest, deltaKcal, weightKg) : null }
}

function rangeText(goal: Goal, minKg: number, maxKg: number): string {
  const k = (x: number) => fmt(Math.abs(x), 1)
  if (goal === 'seche') return `En sèche, la cible est de perdre ${k(maxKg)} à ${k(minKg)} kg par semaine.`
  if (goal === 'prise') return `En prise de masse, la cible est de prendre jusqu’à ${k(maxKg)} kg par semaine.`
  return `En maintien, la cible est de rester à ±${k(maxKg)} kg.`
}

/**
 * Compare la moyenne des pesées de la semaine passée (lundi → dimanche) à celle d'avant, par rapport au
 * rythme visé pour l'objectif. Hors cible : ±100 à 200 kcal par jour (la moitié de l'écart constaté,
 * pour ne pas sur-réagir à l'eau), sauf si les apports notés expliquent l'écart.
 */
export function weekReview(input: {
  today: ISODate
  goal: Goal
  targets: Targets
  weighins: WeighIn[]
  entries: FoodEntry[]
  /** Objectifs de chaque jour (Jour ON ou OFF). */
  targetFor: (date: ISODate) => MacroTargets
}): WeekReview {
  const { goal, targets } = input
  const monday = startOfWeek(input.today)
  const from = addDays(monday, -7)
  const to = addDays(monday, -1)
  const kgIn = (a: ISODate, b: ISODate) => input.weighins.filter((w) => w.date >= a && w.date <= b).map((w) => w.kg)
  const cur = kgIn(from, to)
  const prev = kgIn(addDays(monday, -14), addDays(monday, -8))
  const base = { monday, from, to, count: cur.length, prevCount: prev.length, goal, deltaKcal: 0, next: null }

  if (cur.length < MIN_WEIGHINS || prev.length < MIN_WEIGHINS) {
    return {
      ...base,
      avg: cur.length ? mean(cur) : null,
      deltaKg: null,
      kind: 'manque',
      title: 'Pas assez de pesées',
      detail: `Pour te proposer un ajustement, il faut au moins ${MIN_WEIGHINS} pesées par semaine, le matin à jeun (semaine dernière : ${cur.length}, celle d’avant : ${prev.length}).`,
    }
  }

  const avg = mean(cur)
  const prevAvg = mean(prev)
  const deltaKg = avg - prevAvg
  const pct = (deltaKg / prevAvg) * 100
  const rate = RATES[goal]
  const minKg = (prevAvg * rate.min) / 100
  const maxKg = (prevAvg * rate.max) / 100
  const moved =
    Math.abs(deltaKg) < 0.05
      ? `Ta moyenne n’a pas bougé (${fmtKg(Math.round(avg * 10) / 10)} kg).`
      : `Ta moyenne a ${deltaKg < 0 ? 'baissé' : 'monté'} de ${fmt(Math.abs(deltaKg), 1)} kg (${fmtKg(Math.round(avg * 10) / 10)} kg).`
  const ctx = `${moved} ${rangeText(goal, minKg, maxKg)}`
  const withData = { ...base, avg, deltaKg }

  if (pct >= rate.min && pct <= rate.max) {
    return { ...withData, kind: 'ok', title: 'Dans la cible : on garde', detail: `${ctx} C’est bon, on garde tes macros.` }
  }

  // +1 : il faut manger plus (perte trop rapide, prise trop lente) · −1 : manger moins.
  const dir = pct < rate.min ? 1 : -1

  // Les apports notés expliquent-ils l'écart ? Alors ce ne sont pas les macros qu'il faut changer.
  const perDay = new Map<ISODate, number>()
  for (const e of input.entries) if (e.date >= from && e.date <= to) perDay.set(e.date, (perDay.get(e.date) ?? 0) + e.n.kcal)
  const logged = [...perDay].filter(([, k]) => k >= 1200)
  if (logged.length >= 4) {
    const intake = mean(logged.map(([, k]) => k))
    const target = mean(logged.map(([d]) => input.targetFor(d).kcal))
    const ratio = intake / target
    if ((dir < 0 && ratio > 1.08) || (dir > 0 && ratio < 0.92)) {
      const gap = Math.round((ratio - 1) * 100)
      return {
        ...withData,
        kind: 'diete',
        title: 'On garde, mais colle à tes objectifs',
        detail: `${ctx} Mais tu as mangé ${fmt(r10(intake))} kcal par jour en moyenne pour ${fmt(r10(target))} visées (${gap > 0 ? '+' : ''}${gap} %) : ce n’est pas aux macros de bouger. Essaie d’abord de t’y tenir cette semaine.`,
      }
    }
  }

  const outsideKg = dir > 0 ? minKg - deltaKg : deltaKg - maxKg
  const deltaKcal = dir * Math.min(200, Math.max(100, r50(((outsideKg * KCAL_PER_KG) / 7) * 0.5)))
  const next = shiftTargets(targets, deltaKcal, avg)
  const why =
    goal === 'seche'
      ? dir < 0
        ? deltaKg >= 0
          ? 'Tu ne perds plus :'
          : 'Tu perds moins vite que prévu :'
        : 'Tu perds plus vite que prévu : on remonte un peu pour garder ton muscle,'
      : goal === 'prise'
        ? dir > 0
          ? 'Tu ne prends pas assez :'
          : 'Tu prends trop vite (surtout du gras) :'
        : dir < 0
          ? 'Tu prends du poids :'
          : 'Tu perds du poids :'
  const grams = Math.abs(r5(deltaKcal / 4))
  return {
    ...withData,
    kind: 'ajuste',
    deltaKcal,
    next,
    title: `${deltaKcal > 0 ? '+' : '−'}${fmt(Math.abs(deltaKcal))} kcal par jour`,
    detail: `${ctx} ${why} je te propose ${deltaKcal > 0 ? '+' : '−'}${fmt(Math.abs(deltaKcal))} kcal par jour, pris sur les glucides (${deltaKcal > 0 ? '+' : '−'}${grams} g), protéines inchangées.`,
  }
}
