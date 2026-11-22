import type { ISODate, StepsDay, WeighIn } from './types.ts'
import { addDays, startOfWeek, weekDays } from './date.ts'

export function weighInOn(list: WeighIn[], date: ISODate): WeighIn | undefined {
  return list.find((w) => w.date === date)
}

/** Moyenne des pesées de la semaine (lundi → dimanche) contenant `date`. */
export function weekAverage(list: WeighIn[], date: ISODate): { avg: number | null; count: number } {
  const days = new Set(weekDays(date))
  const vals = list.filter((w) => days.has(w.date)).map((w) => w.kg)
  if (!vals.length) return { avg: null, count: 0 }
  return { avg: vals.reduce((a, b) => a + b, 0) / vals.length, count: vals.length }
}

/** Moyennes hebdomadaires sur les `n` dernières semaines (la plus ancienne d'abord). */
export function weeklyAverages(list: WeighIn[], ref: ISODate, n = 12): { week: ISODate; avg: number | null; count: number }[] {
  const start = startOfWeek(ref)
  return Array.from({ length: n }, (_, i) => {
    const week = addDays(start, -7 * (n - 1 - i))
    return { week, ...weekAverage(list, week) }
  })
}

export function latestWeight(list: WeighIn[], upTo?: ISODate): WeighIn | undefined {
  let best: WeighIn | undefined
  for (const w of list) {
    if (upTo && w.date > upTo) continue
    if (!best || w.date > best.date) best = w
  }
  return best
}

export function stepsOn(list: StepsDay[], date: ISODate): number | null {
  return list.find((s) => s.date === date)?.steps ?? null
}

/** Fusionne des pas reçus du sheet : la donnée la plus récente gagne. */
export function mergeSteps(local: StepsDay[], incoming: StepsDay[]): StepsDay[] {
  const map = new Map(local.map((s) => [s.date, s]))
  for (const s of incoming) {
    const cur = map.get(s.date)
    if (!cur || s.at > cur.at) map.set(s.date, s)
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
}
