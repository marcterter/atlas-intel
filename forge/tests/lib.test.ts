import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addDays, diffDays, isoWeek, relativeDay, startOfWeek, weekDays } from '../src/lib/date.ts'
import { fmtDuration, fmtKg, fmtTimer, fmtTonnage, parseNum } from '../src/lib/format.ts'
import { bmr, dayTotals, kcalFromMacros, recipePer100, scaleNutrients, suggestTargets, targetsFor } from '../src/lib/nutrition.ts'
import { detectRecords, e1rm, previousSets, progressVsPrevious, sessionTonnage, setsByMuscle, tonnageEquivalent } from '../src/lib/training.ts'
import { mergeSteps, weekAverage } from '../src/lib/body.ts'
import { searchFoods, BASE_FOODS } from '../src/data/foods.ts'
import type { Session, SetEntry } from '../src/lib/types.ts'

const set = (weight: number, reps: number, extra: Partial<SetEntry> = {}): SetEntry => ({
  id: Math.random().toString(36),
  type: 'normal',
  weight,
  reps,
  seconds: null,
  km: null,
  kcal: null,
  done: true,
  ...extra,
})

const session = (id: string, date: string, startedAt: number, exercises: [string, SetEntry[]][], routineId: string | null = 'push'): Session => ({
  id,
  routineId,
  name: 'Push',
  date,
  startedAt,
  endedAt: startedAt + 3600_000,
  exercises: exercises.map(([exerciseId, sets], i) => ({ uid: `${id}-${i}`, exerciseId, sets, restSec: 90, superset: null })),
})

test('dates : semaine du lundi au dimanche, numéro ISO', () => {
  assert.equal(startOfWeek('2026-11-22'), '2026-11-16') // dimanche -> lundi précédent
  assert.equal(startOfWeek('2026-11-16'), '2026-11-16')
  assert.deepEqual(weekDays('2026-11-18')[6], '2026-11-22')
  assert.equal(addDays('2026-02-28', 1), '2026-03-01')
  assert.equal(diffDays('2026-11-01', '2026-11-22'), 21)
  assert.equal(isoWeek('2026-11-22'), 47)
  assert.equal(isoWeek('2027-01-01'), 53)
  assert.equal(relativeDay('2026-11-21', '2026-11-22'), 'Hier')
  assert.equal(relativeDay('2026-11-17', '2026-11-22'), 'Il y a 5 jours')
})

test('formats français', () => {
  assert.equal(fmtKg(87.5), '87,5')
  assert.equal(fmtTonnage(12800), '12,8 t')
  assert.equal(fmtTonnage(940), '940 kg')
  assert.equal(fmtDuration(64 * 60_000), '1 h 04')
  assert.equal(fmtTimer(90), '1:30')
  assert.equal(parseNum('87,5'), 87.5)
  assert.equal(parseNum(''), null)
})

test('nutrition : objectifs cohérents', () => {
  const p = { name: 'M', sex: 'H' as const, birthYear: 1990, heightCm: 180, activity: 'modere' as const, goal: 'seche' as const }
  const today = new Date(2026, 10, 22)
  const b = bmr(p, 80, today)
  assert.equal(Math.round(b), 10 * 80 + 6.25 * 180 - 5 * 36 + 5)
  const t = suggestTargets(p, 80, today)
  assert.equal(t.protein, 175) // 2,2 g/kg arrondi à 5
  assert.ok(t.fat >= 70)
  assert.ok(Math.abs(kcalFromMacros(t) - t.kcal) <= 25, 'les macros retombent sur les kcal')
  assert.ok(t.kcal < 2850 && t.kcal > 2000)
})

test('nutrition : quantités, journée, recettes, jour de repos', () => {
  const n = scaleNutrients({ kcal: 352, protein: 7, carbs: 79, fat: 0.6 }, 70)
  assert.equal(Math.round(n.kcal), 246)
  const entries = [
    { id: '1', date: '2026-11-22', meal: 'dejeuner' as const, foodId: null, name: 'x', grams: 0, n: { kcal: 500, protein: 40, carbs: 50, fat: 10 }, createdAt: 0 },
    { id: '2', date: '2026-11-22', meal: 'diner' as const, foodId: null, name: 'y', grams: 0, n: { kcal: 300, protein: 20, carbs: 20, fat: 15 }, createdAt: 0 },
    { id: '3', date: '2026-11-21', meal: 'diner' as const, foodId: null, name: 'z', grams: 0, n: { kcal: 999, protein: 1, carbs: 1, fat: 1 }, createdAt: 0 },
  ]
  assert.equal(dayTotals(entries, '2026-11-22').kcal, 800)
  const per100 = recipePer100({
    ingredients: [
      { foodId: 'a', name: 'flocons', grams: 50, per100: { kcal: 372, protein: 13.5, carbs: 58.7, fat: 7 } },
      { foodId: 'b', name: 'lait', grams: 150, per100: { kcal: 46, protein: 3.3, carbs: 4.8, fat: 1.6 } },
    ],
  })
  assert.equal(Math.round(per100.kcal), Math.round((372 * 0.5 + 46 * 1.5) / 2))
  const base = { kcal: 2400, protein: 170, carbs: 260, fat: 70 }
  const rest = { kcal: 2100, protein: 170, carbs: 190, fat: 75 }
  assert.equal(targetsFor({ base, rest, steps: 10000, fiber: 30 }, false), rest)
  assert.equal(targetsFor({ base, rest, steps: 10000, fiber: 30 }, true), base)
  assert.equal(targetsFor({ base, rest: null, steps: 10000, fiber: 30 }, false), base)
})

test('séances : tonnage, précédent, records, progression', () => {
  const s1 = session('s1', '2026-11-09', 1000, [['dc-barre', [set(80, 8), set(80, 8), set(77.5, 7)]], ['elev-lat-halteres', [set(10, 15)]]])
  const s2 = session('s2', '2026-11-16', 2000, [['dc-barre', [set(20, 10, { type: 'echauffement' }), set(85, 6), set(82.5, 8)]]])
  const s3 = session('s3', '2026-11-22', 3000, [['dc-barre', [set(85, 7), set(85, 7), set(80, 9)]]])
  assert.equal(sessionTonnage(s1), 80 * 8 * 2 + 77.5 * 7 + 150)
  assert.equal(sessionTonnage(s2), 85 * 6 + 82.5 * 8) // échauffement exclu
  assert.deepEqual(previousSets([s1, s2], 'dc-barre', 3000).map((x) => x.weight), [20, 85, 82.5])
  assert.deepEqual(previousSets([s1, s2], 'elev-lat-halteres', 3000).map((x) => x.reps), [15])

  const r2 = detectRecords(s2, [s1, s2])
  assert.equal(r2.length, 1)
  assert.equal(r2[0].kind, 'charge')
  assert.equal(r2[0].value, 85)
  assert.equal(r2[0].previous, 80)

  const r3 = detectRecords(s3, [s1, s2, s3])
  assert.equal(r3.length, 1)
  assert.equal(r3[0].kind, '1rm') // même charge max mais 85 × 7 > 85 × 6
  assert.ok(Math.abs(r3[0].value - e1rm(85, 7)) < 1e-9)

  assert.equal(detectRecords(s1, [s1]).length, 0) // première séance : pas de record

  const prog = progressVsPrevious(s3, [s1, s2, s3])
  assert.equal(prog.length, 1)
  assert.ok(prog[0].volumeDelta > 0)

  const sets = setsByMuscle([s1, s2, s3], '2026-11-22', 7)
  assert.equal(sets.get('pectoraux'), 5) // s2 (2 séries effectives) + s3 (3)
  assert.equal(sets.get('epaules'), undefined)
})

test('équivalent tonnage', () => {
  assert.match(tonnageEquivalent(12800).label, /bus/)
  assert.equal(tonnageEquivalent(100).emoji, '💪')
})

test('poids : moyenne de la semaine, fusion des pas', () => {
  const w = [
    { date: '2026-11-16', kg: 77, at: 0 },
    { date: '2026-11-18', kg: 76.4, at: 0 },
    { date: '2026-11-22', kg: 76.6, at: 0 },
    { date: '2026-11-15', kg: 90, at: 0 },
  ]
  const { avg, count } = weekAverage(w, '2026-11-20')
  assert.equal(count, 3)
  assert.ok(Math.abs((avg ?? 0) - 76.666) < 0.01)
  const merged = mergeSteps(
    [{ date: '2026-11-21', steps: 5000, source: 'manuel', at: 10 }],
    [
      { date: '2026-11-21', steps: 8000, source: 'sante', at: 20 },
      { date: '2026-11-22', steps: 3000, source: 'sante', at: 20 },
    ],
  )
  assert.equal(merged.length, 2)
  assert.equal(merged[0].steps, 8000)
})

test('recherche d’aliments sans accents', () => {
  const r = searchFoods('oeuf', BASE_FOODS)
  assert.equal(r[0].name, 'Œuf entier')
  assert.ok(searchFoods('poulet cuit', BASE_FOODS).some((f) => f.name === 'Blanc de poulet cuit'))
  assert.ok(searchFoods('riz', BASE_FOODS).length >= 5)
  const ids = new Set(BASE_FOODS.map((f) => f.id))
  assert.equal(ids.size, BASE_FOODS.length, 'identifiants uniques')
})
