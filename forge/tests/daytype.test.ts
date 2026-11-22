import { test } from 'node:test'
import assert from 'node:assert/strict'
import { autoDay, daySource, dayTargets, isTrainingDay, plannedWeekdays } from '../src/store/selectors.ts'
import { defaultOff, splitOnOff } from '../src/lib/energy.ts'
import type { Routine, Session, Targets } from '../src/lib/types.ts'

const routine = (coachDay: string): Routine => ({ id: coachDay, name: coachDay, items: [], createdAt: 0, updatedAt: 0, coachDay })
const session = (date: string, exerciseId: string): Session => ({
  id: `${date}-${exerciseId}`,
  routineId: null,
  name: 'x',
  date,
  startedAt: 0,
  endedAt: 1,
  exercises: [{ uid: 'e', exerciseId, restSec: 90, superset: null, sets: [] }],
})
const targets: Targets = { base: { kcal: 2640, protein: 215, carbs: 310, fat: 60 }, rest: { kcal: 2140, protein: 200, carbs: 200, fat: 60 }, steps: 15000, fiber: 30 }
const base = { dayType: {} as Record<string, boolean>, sessions: [] as Session[], active: null, routines: ['LUNDI', 'MARDI', 'JEUDI', 'VENDREDI'].map(routine), customExercises: [], targets }
const TODAY = '2026-11-22' // dimanche

test('jour ON : prévu au programme du coach (aujourd’hui et à venir), ou séance faite', () => {
  assert.deepEqual([...plannedWeekdays(base.routines)].sort(), [1, 2, 4, 5])
  assert.deepEqual(autoDay(base, '2026-11-23', TODAY), { on: true, source: 'programme' }, 'lundi à venir : séance prévue')
  assert.deepEqual(autoDay(base, '2026-11-25', TODAY), { on: false, source: 'aucune' }, 'mercredi : repos')
  assert.deepEqual(autoDay(base, '2026-11-16', TODAY), { on: false, source: 'aucune' }, 'lundi passé sans séance : OFF')
  const s = { ...base, sessions: [session('2026-11-18', 'dc-barre'), session('2026-11-19', 'tapis')] }
  assert.deepEqual(autoDay(s, '2026-11-18', TODAY), { on: true, source: 'seance' }, 'muscu un mercredi')
  assert.equal(autoDay(s, '2026-11-19', TODAY).on, false, 'cardio seul : reste OFF')
})

test('jour ON / OFF : le choix manuel l’emporte et change les objectifs', () => {
  const s = { ...base, dayType: { '2026-11-23': false, '2026-11-22': true } }
  assert.equal(isTrainingDay(s, '2026-11-23'), false)
  assert.equal(daySource(s, '2026-11-23'), 'manuel')
  assert.equal(dayTargets(s, '2026-11-23').kcal, 2140)
  assert.equal(dayTargets(s, '2026-11-22').kcal, 2640)
  assert.equal(dayTargets({ ...s, targets: { ...targets, rest: null } }, '2026-11-23').kcal, 2640, 'sans objectifs OFF : mêmes objectifs')
})

test('répartition ON / OFF : même moyenne sur la semaine, seuls les glucides changent', () => {
  // Moyenne de la semaine du coach : (4 × 2 640 + 3 × 2 140) / 7 ≈ 2 426 kcal
  const { on, off } = splitOnOff({ kcal: 2426, protein: 210, carbs: 262, fat: 60 }, 4)
  assert.deepEqual([on.kcal, off.kcal], [2630, 2150], 'proche des 2 640 / 2 140 du coach')
  assert.deepEqual([on.protein, on.fat, off.protein, off.fat], [210, 60, 210, 60])
  assert.deepEqual([on.carbs, off.carbs], [312, 192])
  const week = (4 * on.kcal + 3 * off.kcal) / 7
  assert.ok(Math.abs(week - 2426) <= 10, `moyenne conservée (${week})`)
  const marc = splitOnOff({ kcal: 2730, protein: 145, carbs: 390, fat: 65 }, 4)
  assert.deepEqual([marc.on.kcal, marc.off.kcal], [2970, 2430])
  assert.deepEqual(defaultOff({ kcal: 2640, protein: 215, carbs: 310, fat: 60 }), { kcal: 2120, protein: 215, carbs: 180, fat: 60 })
})
