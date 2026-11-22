import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shiftTargets, weekReview } from '../src/lib/review.ts'
import { addDays } from '../src/lib/date.ts'
import type { FoodEntry, Goal, MacroTargets, Targets, WeighIn } from '../src/lib/types.ts'

const MONDAY = '2026-11-23'
const targets: Targets = { base: { kcal: 2640, protein: 215, carbs: 310, fat: 60 }, rest: { kcal: 2140, protein: 200, carbs: 200, fat: 60 }, steps: 15000, fiber: 30 }
/** 4 pesées par semaine autour des moyennes voulues (± 0,3 kg d'eau). */
function weighins(prevAvg: number, avg: number, perWeek = 4): WeighIn[] {
  const out: WeighIn[] = []
  const noise = [0.3, -0.3, 0.2, -0.2, 0.1, -0.1, 0]
  for (let i = 0; i < perWeek; i++) {
    out.push({ date: addDays(MONDAY, -14 + i * 2), kg: Math.round((prevAvg + noise[i % perWeek === 3 ? 0 : i]) * 10) / 10, at: 0 })
    out.push({ date: addDays(MONDAY, -7 + i * 2), kg: Math.round((avg + noise[i % perWeek === 3 ? 0 : i]) * 10) / 10, at: 0 })
  }
  return out
}
const flat = (kg: number, days: number[]): WeighIn[] => days.map((d) => ({ date: addDays(MONDAY, d), kg, at: 0 }))
const meals = (kcal: number, days = 6): FoodEntry[] =>
  Array.from({ length: days }, (_, i) => ({ id: `e${i}`, date: addDays(MONDAY, -7 + i), meal: 'dejeuner', foodId: null, name: 'Journée', grams: 0, n: { kcal, protein: 0, carbs: 0, fat: 0, fiber: 0 }, createdAt: 0 }))
const avgTarget = (): MacroTargets => ({ kcal: 2426, protein: 210, carbs: 262, fat: 60 })
const review = (goal: Goal, w: WeighIn[], entries: FoodEntry[] = [], today = MONDAY) => weekReview({ today, goal, targets, weighins: w, entries, targetFor: avgTarget })

test('bilan du lundi : sèche trop lente → −100 kcal sur les glucides, ON et OFF', () => {
  const r = review('seche', [...flat(72.5, [-14, -12, -10, -9]), ...flat(72.4, [-7, -5, -3, -2])])
  assert.equal(r.kind, 'ajuste')
  assert.equal(r.deltaKcal, -100)
  assert.deepEqual(r.next?.base, { kcal: 2540, protein: 215, carbs: 285, fat: 60 })
  assert.deepEqual(r.next?.rest, { kcal: 2040, protein: 200, carbs: 175, fat: 60 })
  assert.equal(r.title, '−100 kcal par jour')
  assert.match(r.detail, /baissé de 0,1 kg .* perdre 0,3 à 0,7 kg par semaine\. Tu perds moins vite que prévu : je te propose −100 kcal par jour, pris sur les glucides \(−25 g\)/)
  assert.deepEqual([r.from, r.to], ['2026-11-16', '2026-11-22'])
})

test('bilan du lundi : dans la cible → on garde', () => {
  const r = review('seche', weighins(72.6, 72.2))
  assert.equal(r.kind, 'ok')
  assert.equal(r.deltaKcal, 0)
  assert.equal(r.next, null)
})

test('bilan du lundi : perte trop rapide → on remonte (+150 kcal)', () => {
  const r = review('seche', [...flat(73.5, [-14, -12, -10]), ...flat(72.5, [-7, -5, -3])])
  assert.equal(r.kind, 'ajuste')
  assert.equal(r.deltaKcal, 150)
  assert.match(r.detail, /plus vite que prévu/)
})

test('bilan du lundi : poids en hausse mais apports au-dessus des objectifs → on garde', () => {
  const r = review('seche', [...flat(72, [-14, -12, -10]), ...flat(72.3, [-7, -5, -3])], meals(2800))
  assert.equal(r.kind, 'diete')
  assert.equal(r.deltaKcal, 0)
  assert.match(r.detail, /2.800 kcal par jour en moyenne pour 2.430 visées \(\+15 %\)/)
})

test('bilan du lundi : prise de masse qui stagne → +150 kcal ; pas assez de pesées → on le dit', () => {
  const r = review('prise', [...flat(72.5, [-14, -12, -10]), ...flat(72.3, [-7, -5, -3])])
  assert.deepEqual([r.kind, r.deltaKcal], ['ajuste', 150])
  const m = review('seche', [...flat(72.5, [-14, -12, -10]), ...flat(72.3, [-7, -5])])
  assert.equal(m.kind, 'manque')
  assert.match(m.detail, /semaine dernière : 2, celle d’avant : 3/)
  // Le mercredi, c'est toujours le bilan du lundi 23.
  assert.equal(review('seche', [], [], '2026-11-25').monday, MONDAY)
})

test('ajustement : glucides au plancher de 60 g, le reste sur les lipides', () => {
  const t = shiftTargets({ ...targets, base: { kcal: 1800, protein: 200, carbs: 80, fat: 60 }, rest: null }, -150, 72)
  assert.deepEqual(t.base, { kcal: 1650, protein: 200, carbs: 60, fat: 55 })
})
