// Passerelle avec le sheet du coach : lecture/écriture des performances, import du programme, journée envoyée.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatPerf, guessMuscle, parsePerf, planImport, progressLabel, type CoachProgram } from '../src/lib/coach.ts'
import { buildDay } from '../src/lib/sync.ts'
import { defaultData, type State } from '../src/store/store.ts'
import type { Session, SetEntry } from '../src/lib/types.ts'

const set = (weight: number, reps: number, extra: Partial<SetEntry> = {}): SetEntry => ({ id: Math.random().toString(36), type: 'normal', weight, reps, seconds: null, km: null, kcal: null, done: true, ...extra })

test('lecture des charges telles qu’écrites dans le sheet du coach', () => {
  assert.deepEqual(parsePerf('35kg x 6, 30KGX8'), [{ weight: 35, reps: 6 }, { weight: 30, reps: 8 }])
  assert.deepEqual(parsePerf('52,5kg x 11 ; 47,4kg x 11 ; 47,5kgx8'), [{ weight: 52.5, reps: 11 }, { weight: 47.4, reps: 11 }, { weight: 47.5, reps: 8 }])
  assert.deepEqual(parsePerf('12 x 7,5kg ; 10 x 7,5kg ; 8 x 7,5kg'), [{ weight: 7.5, reps: 12 }, { weight: 7.5, reps: 10 }, { weight: 7.5, reps: 8 }])
  assert.deepEqual(parsePerf('55kgx9 ; 47,5kg x 10 . 45kg x 8').length, 3)
  assert.deepEqual(parsePerf('25kg x8 ; 25kg x 6'), [{ weight: 25, reps: 8 }, { weight: 25, reps: 6 }])
  assert.deepEqual(parsePerf('8,75kg x 6 ; 7,5kgx8 ; 6,25kg x 8').map((s) => s.weight), [8.75, 7.5, 6.25])
  assert.deepEqual(parsePerf('skip a cause du doigt'), [])
  assert.deepEqual(parsePerf(''), [])
})

test('écriture au même format', () => {
  assert.equal(formatPerf([set(52.5, 11), set(47.5, 8), set(20, 10, { type: 'echauffement' }), set(40, 5, { done: false })], 'weight'), '52,5kg x 11 ; 47,5kg x 8')
  assert.equal(formatPerf([set(0, 12), set(10, 8)], 'bodyweight'), 'PDC x 12 ; +10kg x 8')
  assert.equal(formatPerf([{ ...set(0, 0), seconds: 1800 }], 'cardio'), '30 min')
})

test('groupes musculaires devinés pour les exercices du coach', () => {
  const expected: Record<string, string> = {
    'Tirage vertical unilatéral': 'dos',
    'Développé couché à la smith': 'pectoraux',
    'Tirage horizontal machine': 'dos',
    'Écarté à la poulie sur banc': 'pectoraux',
    'Élévation latérale unilatéral cuff de poignet': 'epaules',
    'Curl pupitre unilatéral avec haltères': 'biceps',
    'Overhead triceps extension cable': 'triceps',
    'Rotation latérale abdos': 'abdos',
    'Adductor machine': 'adducteurs',
    'Seated leg curl': 'ischios',
    Pendulum: 'quadriceps',
    'Leg press': 'quadriceps',
    'Leg extension': 'quadriceps',
    'Extension mollet': 'mollets',
    'Crunch poulie abdos': 'abdos',
    'Développé incliné à la smith': 'pectoraux',
    'Stiff leg deadlift': 'ischios',
  }
  for (const [name, muscle] of Object.entries(expected)) assert.equal(guessMuscle(name), muscle, name)
})

const session = (id: string, startedAt: number, exerciseId: string, sets: SetEntry[]): Session => ({
  id,
  routineId: 'r',
  name: 'Upper A',
  date: '2026-11-20',
  startedAt,
  endedAt: startedAt + 3600_000,
  exercises: [{ uid: `${id}-e`, exerciseId, sets, restSec: 90, superset: null }],
})

test('« Progressé en POIDS / CHARGE ? » calculé par rapport à la fois précédente', () => {
  const prev = session('a', 1000, 'x1', [set(52.5, 11), set(47.5, 8)])
  const up = session('b', 2000, 'x1', [set(55, 10), set(50, 9)])
  const same = session('c', 2000, 'x1', [set(52.5, 11), set(45, 8)])
  const down = session('d', 2000, 'x1', [set(50, 9)])
  assert.equal(progressLabel(up.exercises[0], 'weight', [prev], up.startedAt), 'OUI')
  assert.equal(progressLabel(same.exercises[0], 'weight', [prev], same.startedAt), 'Maintenu')
  assert.equal(progressLabel(down.exercises[0], 'weight', [prev], down.startedAt), 'Regressé')
  assert.equal(progressLabel(up.exercises[0], 'weight', [], up.startedAt), '', 'première fois : rien')
})

const PROGRAM: CoachProgram = {
  semaine: 1,
  debut: '2026-10-02',
  seances: [
    { jour: 'LUNDI', date: '2026-10-05', exercices: [{ nom: 'Tirage vertical unilatéral', rir: '0', perf: '35kg x 6, 30KGX8' }, { nom: 'Développé couché à la smith', rir: '1', perf: '52,5kg x 11 ; 47,4kg x 11 ; 47,5kgx8' }, { nom: 'Rotation latérale abdos', rir: '2', perf: '' }] },
    { jour: 'MARDI', date: '2026-10-06', exercices: [{ nom: 'Leg press', rir: '1', perf: '180kg x 8' }, { nom: 'Seated leg curl', rir: '0', perf: '60kg x 8 ; 50kg x 9' }, { nom: 'Adductor machine', rir: '0', perf: '60kg x 6 ; 50kg x 8' }] },
    { jour: 'JEUDI', date: '2026-10-08', exercices: [{ nom: 'Tirage vertical unilatéral', rir: '0', perf: '' }, { nom: 'Développé incliné à la smith', rir: '1', perf: '55kgx9' }] },
    { jour: 'VENDREDI', date: '2026-10-02', exercices: [{ nom: 'Leg press', rir: '1', perf: '70kg x 9 ; 62,5kg x 8' }, { nom: 'Stiff leg deadlift', rir: '1', perf: 'skip a cause du doigt' }, { nom: 'Leg extension', rir: '0', perf: '75kg x 7' }] },
  ],
}

test('import du programme : Upper A / Lower A / Upper B / Lower B, noms exacts, historique', () => {
  const plan = planImport(PROGRAM, { customExercises: [], routines: [], sessions: [] }, 120)
  assert.deepEqual(plan.routines.map((r) => [r.name, r.coachDay]), [
    ['Upper A', 'LUNDI'],
    ['Lower A', 'MARDI'],
    ['Upper B', 'JEUDI'],
    ['Lower B', 'VENDREDI'],
  ])
  // « Tirage vertical unilatéral » et « Leg press » ne sont créés qu'une fois.
  assert.equal(plan.newExercises.length, 9)
  assert.equal(plan.newExercises.find((e) => e.name === 'Développé couché à la smith')?.equipment, 'smith')
  const lundi = plan.routines[0]
  assert.deepEqual(lundi.items.map((i) => [i.sets, i.rir]), [[2, '0'], [3, '1'], [3, '2']])
  // Historique : 4 séances datées, séries lues dans le sheet ; « skip » gardé comme note.
  assert.equal(plan.history.length, 4)
  const h = plan.history.find((s) => s.coachDay === 'LUNDI')
  assert.ok(h?.imported)
  assert.equal(h?.date, '2026-10-05')
  assert.deepEqual(h?.exercises[1].sets.map((s) => [s.weight, s.reps]), [[52.5, 11], [47.4, 11], [47.5, 8]])
  const vendredi = plan.history.find((s) => s.coachDay === 'VENDREDI')
  assert.equal(vendredi?.exercises.find((e) => e.note)?.note, 'skip a cause du doigt')

  // Deuxième import : séances mises à jour (mêmes id), pas de doublons d'exercices ni d'historique.
  const again = planImport(PROGRAM, { customExercises: plan.newExercises, routines: plan.routines, sessions: plan.history }, 120)
  assert.equal(again.newExercises.length, 0)
  assert.deepEqual(again.routines.map((r) => r.id), plan.routines.map((r) => r.id))
  assert.equal(again.history.length, 0)
})

test('journée envoyée au sheet : ressenti, cardio séparé, pas de 0 kcal quand rien n’est noté', () => {
  const base = defaultData()
  const cardioEx = { id: 'x-esc', name: 'Escalier', muscle: 'cardio' as const, equipment: 'cardio' as const, kind: 'cardio' as const, custom: true }
  const s = {
    ...base,
    customExercises: [cardioEx],
    daylogs: { '2026-11-22': { date: '2026-11-22', sleepH: 7.5, sleepQ: 8, energy: 8, motivation: 9, satiety: 7, digestion: 4, waterL: 2, note: ' Resto japonais ', at: 1 } },
    sessions: [
      { ...session('m', 1000, 'dc-barre', [set(80, 8)]), date: '2026-11-22', name: 'Upper A' },
      { id: 'c', routineId: null, name: 'Cardio', date: '2026-11-22', startedAt: 5000, endedAt: 6000, exercises: [{ uid: 'c1', exerciseId: 'x-esc', sets: [{ ...set(0, 0), seconds: 1800 }], restSec: 60, superset: null }] },
      { ...session('old', 500, 'dc-barre', [set(70, 8)]), date: '2026-11-22', name: 'Importée', imported: true },
    ],
  } as unknown as State
  const d = buildDay(s, '2026-11-22')
  assert.equal(d.sommeil, 7.5)
  assert.equal(d.energie, 8)
  assert.equal(d.notes, 'Resto japonais')
  assert.equal(d.entrainement, 'Upper A', 'la séance cardio seule et l’historique importé ne comptent pas')
  assert.equal(d.cardio, 30)
  assert.equal(d.kcal, null, 'aucun aliment noté : le sheet du coach reste vide')
  assert.equal(d.pas, null)
})
