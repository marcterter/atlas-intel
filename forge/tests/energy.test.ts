import { test } from 'node:test'
import assert from 'node:assert/strict'
import { activityFactor, bmr, suggestTargets } from '../src/lib/nutrition.ts'
import { activityLevel, estimateEnergy, goalPlans, measureTdee } from '../src/lib/energy.ts'
import { addDays } from '../src/lib/date.ts'
import type { FoodEntry, Profile, Routine, StepsDay, WeighIn } from '../src/lib/types.ts'

const NOW = new Date(2026, 10, 22, 12)
const TODAY = '2026-11-22'
const marc: Profile = { name: 'Marc', sex: 'H', birthYear: 1995, heightCm: 178, activity: 'modere', goal: 'maintien', stepsPerDay: 15000, sessionsPerWeek: 4 }

test('coefficient d’activité : pas et séances plutôt qu’une case à cocher', () => {
  assert.equal(activityFactor(15000, 4, 'sedentaire'), 1.62)
  assert.equal(activityFactor(3000, 0, 'tres_actif'), 1.2)
  assert.equal(activityFactor(10000, 3, 'sedentaire'), 1.465)
  assert.equal(activityFactor(40000, 12, 'sedentaire'), 1.81, 'plafonné')
  assert.equal(activityFactor(null, 4, 'modere'), 1.55, 'sans les pas : ancien choix')
})

test('calculateur : maintien, sèche et prise de masse côte à côte', () => {
  assert.equal(bmr(marc, 72, NOW), 1682.5)
  const est = estimateEnergy(marc, 72, { steps: 15000, stepsFrom: 'profil', sessions: 4, sessionsFrom: 'profil' }, NOW)
  assert.deepEqual(est, { bmr: 1683, factor: 1.62, tdee: 2726, legacy: false })
  const plans = goalPlans(est.tdee, 72)
  assert.deepEqual(
    plans.map((p) => [p.goal, p.targets.kcal, p.kgPerWeek]),
    [
      ['seche', 2240, -0.44],
      ['maintien', 2730, 0],
      ['prise', 3000, 0.25],
    ],
  )
  assert.deepEqual(plans[0].targets, { kcal: 2240, protein: 160, carbs: 255, fat: 65 })
  assert.equal(suggestTargets(marc, 72, NOW).kcal, 2730, 'le profil donne le même maintien')
})

test('activité : vraie moyenne de pas dès 7 jours, séances du programme du coach', () => {
  const steps: StepsDay[] = Array.from({ length: 10 }, (_, i) => ({ date: addDays(TODAY, -1 - i), steps: 12000 + i * 100, source: 'sante', at: 0 }))
  const routines = ['LUNDI', 'MARDI', 'JEUDI', 'VENDREDI'].map((d, i) => ({ id: `r${i}`, name: 'x', items: [], createdAt: 0, updatedAt: 0, coachDay: d })) as Routine[]
  const noDeclared = { ...marc, stepsPerDay: null, sessionsPerWeek: null }
  assert.deepEqual(activityLevel(noDeclared, steps, routines, TODAY), { steps: 12500, stepsFrom: 'app', sessions: 4, sessionsFrom: 'programme' })
  assert.deepEqual(activityLevel(marc, steps.slice(0, 5), [], TODAY), { steps: 15000, stepsFrom: 'profil', sessions: 4, sessionsFrom: 'profil' })
  assert.equal(activityLevel(noDeclared, [], [], TODAY).steps, null)
  // 3 semaines d'utilisation, 10 séances → ~3,5 par semaine (prioritaire sur le programme)
  const done = Array.from({ length: 10 }, (_, i) => ({ id: `w${i}`, routineId: null, name: 'x', date: addDays(TODAY, -2 - i * 2), startedAt: 0, endedAt: 0, exercises: [] }))
  const imported = { ...done[0], id: 'imp', date: '2026-10-05', imported: true }
  const lvl = activityLevel(noDeclared, [], routines, TODAY, [...done, imported])
  assert.deepEqual([lvl.sessions, lvl.sessionsFrom], [3.5, 'app'])
})

const entry = (date: string, kcal: number): FoodEntry => ({ id: date, date, meal: 'dejeuner', foodId: null, name: 'Journée', grams: 0, n: { kcal, protein: 0, carbs: 0, fat: 0, fiber: 0 }, createdAt: 0 })

test('dépense réelle : apports moyens corrigés de la courbe de poids', () => {
  const entries: FoodEntry[] = []
  const weighins: WeighIn[] = []
  for (let i = 1; i <= 24; i++) {
    const date = addDays(TODAY, -i)
    entries.push(entry(date, i % 3 ? 2750 : 2850)) // ≈ 2 783 kcal/j
    if (i % 2 === 0) weighins.push({ date, kg: 74 - ((24 - i) * 0.3) / 7 + (i % 4 ? 0.2 : -0.2), at: 0 }) // −0,3 kg/sem + eau
  }
  entries.push(entry(addDays(TODAY, -3), -1900)) // journée mal saisie (≈ 800 kcal) : ignorée
  const r = measureTdee(entries, weighins, TODAY)
  assert.ok(r.ok, JSON.stringify(r))
  if (!r.ok) return
  assert.ok(r.value.kgPerWeek <= -0.25 && r.value.kgPerWeek >= -0.33, `pente ≈ −0,3 kg/sem malgré l’eau, obtenu ${r.value.kgPerWeek}`)
  assert.equal(r.value.foodDays, 23)
  assert.equal(r.value.intake, 2780)
  // Dépense = apports + ce que la perte de poids a fourni (≈ 0,3 kg × 7 700 / 7 ≈ 330 kcal/j)
  assert.ok(r.value.tdee >= 3060 && r.value.tdee <= 3120, `≈ 3 100 kcal, obtenu ${r.value.tdee}`)
  assert.equal(r.value.confidence, 'bonne', '23 journées, 12 pesées sur 22 jours')
})

test('dépense réelle : pas assez de données → ce qu’il manque', () => {
  const entries = Array.from({ length: 6 }, (_, i) => entry(addDays(TODAY, -1 - i), 2600))
  const weighins: WeighIn[] = [{ date: addDays(TODAY, -5), kg: 72, at: 0 }, { date: TODAY, kg: 71.8, at: 0 }]
  const r = measureTdee(entries, weighins, TODAY)
  assert.deepEqual(r, { ok: false, progress: { foodDays: 6, weighins: 2, spanDays: 5 } })
})
