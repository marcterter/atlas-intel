import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cardioMinutes, cardioText, dayCardio, lastCardio, weekCardioMinutes } from '../src/lib/cardio.ts'
import type { CardioEntry, Exercise, Session } from '../src/lib/types.ts'

const velo: Exercise = { id: 'x-velo', name: 'Vélo', muscle: 'cardio', equipment: 'cardio', kind: 'cardio', custom: true }
const entry = (date: string, type: string, minutes: number, at: number, intensity: CardioEntry['intensity'] = null): CardioEntry => ({ id: `${date}-${type}`, date, type, minutes, intensity, km: null, kcal: null, at })
const session = (id: string, date: string, seconds: number, imported = false): Session => ({
  id,
  routineId: null,
  name: 'Upper A',
  date,
  startedAt: 0,
  endedAt: 1,
  imported,
  exercises: [{ uid: 'e1', exerciseId: 'x-velo', restSec: 60, superset: null, sets: [{ id: 's', type: 'normal', weight: null, reps: null, seconds, km: 4, kcal: null, done: true }] }],
})

test('cardio du jour : noté depuis Aujourd’hui + pendant une séance (pas l’historique importé)', () => {
  const s = {
    cardio: [entry('2026-11-22', 'Marche inclinée', 45, 2, 'zone2'), entry('2026-11-21', 'Rameur', 20, 1)],
    sessions: [session('w1', '2026-11-22', 600), session('w2', '2026-11-22', 900, true)],
    customExercises: [velo],
  }
  const items = dayCardio(s, '2026-11-22')
  assert.deepEqual(
    items.map((i) => [i.label, i.minutes, i.source]),
    [
      ['Marche inclinée', 45, 'saisie'],
      ['Vélo', 10, 'seance'],
    ],
  )
  assert.equal(cardioMinutes(items), 55)
  assert.equal(cardioText(items), '45 min marche inclinée (zone 2), 10 min vélo')
  assert.equal(weekCardioMinutes(s, '2026-11-22'), 75, 'semaine du lundi 16 au dimanche 22')
  assert.equal(weekCardioMinutes(s, '2026-11-23'), 0, 'nouvelle semaine')
  assert.equal(lastCardio(s.cardio)?.type, 'Marche inclinée')
})
