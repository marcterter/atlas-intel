import { test } from 'node:test'
import assert from 'node:assert/strict'
import { lastSetAt, suggestedEnd } from '../src/lib/sessionOps.ts'
import type { Session, SetEntry } from '../src/lib/types.ts'

const t0 = new Date('2026-11-23T12:00:00').getTime()
const min = (n: number) => t0 + n * 60_000
const set = (doneAt: number | undefined, done = true): SetEntry => ({ id: String(doneAt), type: 'normal', weight: 50, reps: 8, seconds: null, km: null, kcal: null, done, doneAt })
const session: Session = {
  id: 's',
  routineId: null,
  name: 'Upper 1',
  date: '2026-11-23',
  startedAt: t0,
  endedAt: null,
  exercises: [
    { uid: 'a', exerciseId: 'x', sets: [set(min(20)), set(min(70))], restSec: 120, superset: null },
    { uid: 'b', exerciseId: 'y', sets: [set(min(60)), set(undefined, false)], restSec: 120, superset: null },
  ],
}

test('séance oubliée : fin proposée 5 min après la dernière série', () => {
  assert.equal(lastSetAt(session), min(70))
  // Terminée 30 min après la dernière série : rien à proposer.
  assert.equal(suggestedEnd(session, min(100)), null)
  // Terminée 8 h 33 après le début (lundi d'oubli) : fin à la dernière série + 5 min.
  assert.equal(suggestedEnd(session, min(513)), min(75))
  // Séance sans heure de série (reprise du sheet du coach) : rien.
  assert.equal(suggestedEnd({ ...session, exercises: [{ ...session.exercises[0], sets: [set(undefined)] }] }, min(513)), null)
})
