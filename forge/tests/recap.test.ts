import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildRecap } from '../src/lib/sync.ts'
import type { Exercise, Session, SessionExercise, SetEntry } from '../src/lib/types.ts'

const custom: Exercise[] = [
  { id: 'x-ecarte-poulie', name: 'Écarté à la poulie sur banc', muscle: 'pectoraux', equipment: 'poulie', kind: 'weight', custom: true },
  { id: 'x-ecarte-halteres', name: 'Écarté haltères', muscle: 'pectoraux', equipment: 'halteres', kind: 'weight', custom: true },
  { id: 'x-marteau', name: 'Curl marteau', muscle: 'biceps', equipment: 'halteres', kind: 'weight', custom: true },
]
const set = (done: boolean, type: SetEntry['type'] = 'normal'): SetEntry => ({ id: `${done}-${type}-${Math.random()}`, type, weight: 20, reps: 10, seconds: null, km: null, kcal: null, done })
const ex = (uid: string, exerciseId: string, sets: SetEntry[], extra: Partial<SessionExercise> = {}): SessionExercise => ({ uid, exerciseId, sets, restSec: 90, superset: null, ...extra })
const session = (id: string, date: string, exercises: SessionExercise[], extra: Partial<Session> = {}): Session => ({
  id,
  routineId: null,
  name: 'Upper 1',
  date,
  startedAt: new Date(`${date}T18:00:00`).getTime(),
  endedAt: new Date(`${date}T19:00:00`).getTime(),
  exercises,
  ...extra,
})

test('récap coach : séances des 14 derniers jours en bref (séries faites hors échauffement, remplacements, rattrapages)', () => {
  const sessions: Session[] = [
    session('vieille', '2026-11-11', [ex('a', 'x-marteau', [set(true)])]), // la fenêtre va du 12 au 25 : hors fenêtre
    session('importee', '2026-11-20', [ex('a', 'x-marteau', [set(true)])], { imported: true }), // historique du coach
    session('vide', '2026-11-21', [ex('a', 'x-marteau', [set(false)])]), // rien de fait
    session(
      'lundi',
      '2026-11-23',
      [
        ex('a', 'x-ecarte-halteres', [set(true, 'echauffement'), set(true), set(true), set(false)], { replacedFrom: 'x-ecarte-poulie' }),
        ex('b', 'x-marteau', [set(true), set(true), set(true)], {
          pour: { coachDay: 'JEUDI', date: '2026-11-19', session: 'Upper B', target: 'Curl pupitre unilatéral avec haltères', targetId: 'x-pupitre' },
        }),
      ],
      { coachDay: 'LUNDI' },
    ),
  ]
  const r = buildRecap({ sessions, customExercises: custom, entries: [] }, '2026-11-25')
  assert.equal(r.depuis, '2026-11-12', 'déjà suivi avant la fenêtre : 14 jours')
  assert.deepEqual(
    r.seances.map((s) => s.date),
    ['2026-11-23'],
    'ni la séance d’avant la fenêtre, ni l’historique importé, ni une séance sans série faite',
  )
  assert.deepEqual(r.seances[0], {
    date: '2026-11-23',
    nom: 'Upper 1',
    jourCoach: 'LUNDI',
    exercices: [
      { nom: 'Écarté haltères', remplace: 'Écarté à la poulie sur banc', pour: null, n: 2 },
      { nom: 'Curl marteau', remplace: '', pour: { jourCoach: 'JEUDI', date: '2026-11-19', exercice: 'Curl pupitre unilatéral avec haltères', seance: 'Upper B' }, n: 3 },
    ],
  })
})

test('récap coach : la fenêtre commence au premier jour suivi dans l’app (séance ou repas)', () => {
  const lundi = session('lundi', '2026-11-23', [ex('a', 'x-marteau', [set(true)])])
  const repas = { id: 'e1', date: '2026-11-22', meal: 'dejeuner', foodId: 'f', name: 'Riz', grams: 100, n: { kcal: 130, protein: 3, carbs: 28, fat: 0 }, createdAt: 0 }
  assert.equal(buildRecap({ sessions: [lundi], customExercises: custom, entries: [] }, '2026-11-27').depuis, '2026-11-23')
  assert.equal(buildRecap({ sessions: [lundi], customExercises: custom, entries: [repas as never] }, '2026-11-27').depuis, '2026-11-22')
  assert.equal(buildRecap({ sessions: [], customExercises: custom, entries: [] }, '2026-11-27').depuis, '2026-11-27', 'rien de suivi : aujourd’hui')
})
