import { test } from 'node:test'
import assert from 'node:assert/strict'
import { adviseExercise, adviseWeightSet, loadStep, parseRepsScheme } from '../src/lib/progression.ts'
import type { Exercise, Session, SessionExercise, SetEntry } from '../src/lib/types.ts'

const set = (weight: number | null, reps: number | null, extra: Partial<SetEntry> = {}): SetEntry => ({
  id: Math.random().toString(36).slice(2),
  type: 'normal',
  weight,
  reps,
  seconds: null,
  km: null,
  kcal: null,
  done: true,
  ...extra,
})
const DAY = 86_400_000
const NOW = new Date(2026, 10, 23, 18).getTime()

const custom: Exercise[] = [
  { id: 'x-dc', name: 'Développé couché à la smith', muscle: 'pectoraux', equipment: 'smith', kind: 'weight', custom: true },
  { id: 'x-elev', name: 'Élévation latérale unilatéral cuff de poignet', muscle: 'epaules', equipment: 'poulie', kind: 'weight', custom: true },
  { id: 'x-curl', name: 'Curl pupitre unilatéral avec haltères', muscle: 'biceps', equipment: 'halteres', kind: 'weight', custom: true },
  { id: 'x-press', name: 'Leg press', muscle: 'quadriceps', equipment: 'machine', kind: 'weight', custom: true },
  { id: 'x-trac', name: 'Tractions', muscle: 'dos', equipment: 'poids_du_corps', kind: 'bodyweight', custom: true },
]

function past(exerciseId: string, sets: SetEntry[], daysAgo = 7, coachDay: string | null = 'LUNDI'): Session {
  const at = NOW - daysAgo * DAY
  return { id: `w${exerciseId}${daysAgo}`, routineId: null, name: 'Upper A', date: '2026-11-16', startedAt: at, endedAt: at + 3600_000, coachDay, exercises: [{ uid: 'e', exerciseId, sets, restSec: 120, superset: null }] }
}
function today(exerciseId: string, repsTarget: string, n: number, sets?: SetEntry[]): SessionExercise {
  return { uid: 'cur', exerciseId, repsTarget, restSec: 120, superset: null, sets: sets ?? Array.from({ length: n }, () => set(null, null, { done: false })) }
}
const pick = (a: ReturnType<typeof adviseExercise>) => a?.sets.map((x) => (x ? [x.weight, x.reps, x.trend] : null))

test('reps visées du coach : cibles par série, fourchettes, texte libre', () => {
  assert.deepEqual(parseRepsScheme('10,8,6'), [
    { lo: 10, hi: 10, exact: true },
    { lo: 8, hi: 8, exact: true },
    { lo: 6, hi: 6, exact: true },
  ])
  assert.deepEqual(parseRepsScheme('5-8'), [{ lo: 5, hi: 8, exact: false }])
  assert.deepEqual(parseRepsScheme('8 à 10 / 6-8'), [
    { lo: 8, hi: 10, exact: false },
    { lo: 6, hi: 8, exact: false },
  ])
  assert.deepEqual(parseRepsScheme('max'), [])
  assert.deepEqual(parseRepsScheme(''), [])
})

test('palier de charge : déduit des charges utilisées, borné par le matériel', () => {
  assert.equal(loadStep([52.5, 47.4, 47.5], 'smith'), 2.5, '47,4 (faute de frappe) ignoré, écart de 5 ramené à 2,5')
  assert.equal(loadStep([6.25, 7.5, 8.75], 'poulie'), 1.25)
  assert.equal(loadStep([12, 14], 'halteres'), 2)
  assert.equal(loadStep([], 'halteres'), 2)
  assert.equal(loadStep([], 'kettlebell'), 4)
  assert.equal(loadStep([60, 50], 'machine'), 2.5)
})

test('double progression sur une série : monter, ajouter une rep, garder, alléger', () => {
  const t = (lo: number, hi = lo) => ({ lo, hi, exact: lo === hi })
  const up = adviseWeightSet(set(52.5, 11), t(10), 2.5)
  assert.deepEqual([up?.weight, up?.reps, up?.trend], [55, 10, 'up'], '11 reps pour 10 visées → +2,5 kg')
  const same = adviseWeightSet(set(55, 10), t(10), 2.5)
  assert.deepEqual([same?.weight, same?.reps, same?.trend], [55, 11, 'same'], 'cible tout juste atteinte → une rep de plus')
  const under = adviseWeightSet(set(12, 10), t(12), 2)
  assert.deepEqual([under?.weight, under?.reps, under?.trend], [12, 11, 'same'], '2 reps sous la cible → même charge')
  const down = adviseWeightSet(set(12, 7), t(10), 2)
  assert.deepEqual([down?.weight, down?.reps, down?.trend], [10, 10, 'down'], '7 reps pour 10 → charge qui permet 10')
  const fourchette = adviseWeightSet(set(180, 8), t(5, 8), 2.5)
  assert.deepEqual([fourchette?.weight, fourchette?.reps, fourchette?.trend], [185, 7, 'up'], 'haut de fourchette : +5 kg à 180 kg (2,5 %), reps estimées')
  const bigJump = adviseWeightSet(set(12, 13), t(12), 2)
  assert.deepEqual([bigJump?.weight, bigJump?.reps, bigJump?.trend], [12, 14, 'same'], '14 kg ≈ 7 reps : trop d’un coup, encore une rep')
  const forced = adviseWeightSet(set(12, 17), t(12), 2)
  assert.deepEqual([forced?.weight, forced?.trend], [14, 'up'], 'très au-dessus de la cible : on finit par monter')
})

test('objectif du jour : développé couché smith (10,8,6) d’après la semaine dernière', () => {
  const history = [past('x-dc', [set(40, 10, { type: 'echauffement' }), set(55, 10), set(50, 10), set(50, 8)])]
  const a = adviseExercise(today('x-dc', '10,8,6', 3), history, custom, NOW, 'LUNDI')
  assert.deepEqual(pick(a), [
    [55, 11, 'same'],
    [52.5, 8, 'up'],
    [52.5, 6, 'up'],
  ])
  assert.equal(a?.trend, 'up')
  assert.equal(a?.summary, '55 × 11 · 52,5 × 8 · 52,5 × 6')
  assert.match(a?.why ?? '', /séries 2 et 3/)
})

test('objectif du jour : petits paliers (1,25 kg), série en plus, échauffement ignoré', () => {
  const history = [past('x-elev', [set(7.5, 12), set(7.5, 8), set(6.25, 8)])]
  const cur = today('x-elev', '12,10,8', 0, [set(5, 10, { type: 'echauffement', done: false }), ...Array.from({ length: 4 }, () => set(null, null, { done: false }))])
  const a = adviseExercise(cur, history, custom, NOW, 'LUNDI')
  assert.deepEqual(pick(a), [null, [7.5, 13, 'same'], [7.5, 9, 'same'], [6.25, 9, 'same'], [6.25, 8, 'same']])
})

test('objectif du jour : même jour du programme d’abord, reprise après une coupure', () => {
  const jeudi = past('x-curl', [set(14, 7), set(12, 8)], 3, 'JEUDI')
  const lundi = past('x-curl', [set(12, 10), set(12, 7)], 7, 'LUNDI')
  const a = adviseExercise(today('x-curl', '12,10,8', 2), [lundi, jeudi], custom, NOW, 'LUNDI')
  assert.deepEqual(pick(a), [
    [12, 11, 'same'],
    [10, 10, 'down'],
  ])
  const old = adviseExercise(today('x-curl', '12,10,8', 2), [past('x-curl', [set(12, 13), set(12, 11)], 30)], custom, NOW, 'LUNDI')
  assert.deepEqual(pick(old), [
    [12, 13, 'same'],
    [12, 11, 'same'],
  ])
  assert.match(old?.why ?? '', /Reprise après 4 semaines/)
})

test('objectif du jour : la série ratée aujourd’hui calme la suivante', () => {
  const history = [past('x-dc', [set(52.5, 11), set(50, 10), set(50, 8)])]
  const cur = today('x-dc', '10,8,6', 0, [set(55, 7), set(null, null, { done: false }), set(null, null, { done: false })])
  const a = adviseExercise(cur, history, custom, NOW, 'LUNDI')
  assert.deepEqual(pick(a), [
    [55, 10, 'up'],
    [50, 10, 'same'],
    [52.5, 6, 'up'],
  ])
  assert.match(a?.why ?? '', /la série 2 à la charge habituelle/)
})

test('objectif du jour : poids du corps (+1 rep) et nouvel exercice (rien à conseiller)', () => {
  const a = adviseExercise(today('x-trac', '8-10', 2), [past('x-trac', [set(null, 9), set(null, 7)])], custom, NOW, 'LUNDI')
  assert.deepEqual(pick(a), [
    [null, 10, 'same'],
    [null, 8, 'same'],
  ])
  assert.equal(a?.summary, 'PDC × 10 · PDC × 8')
  assert.equal(adviseExercise(today('x-press', '5-8', 2), [], custom, NOW, 'MARDI'), null)
})

test('✓ sur une série vide : valide l’objectif du jour affiché en grisé', async () => {
  const { toggleSetDone } = await import('../src/lib/sessionOps.ts')
  const history = [past('x-dc', [set(52.5, 11), set(50, 10), set(50, 8)])]
  const ex = today('x-dc', '10,8,6', 3)
  ex.sets[1].reps = 9 // seules les reps sont tapées sur la 2e série
  let s: Session = { id: 'cur', routineId: null, name: 'Upper A', date: '2026-11-23', startedAt: NOW, endedAt: null, coachDay: 'LUNDI', exercises: [ex] }
  s = toggleSetDone(s, 'cur', ex.sets[0].id, history, custom, NOW + 60_000) as Session
  assert.deepEqual([s.exercises[0].sets[0].weight, s.exercises[0].sets[0].reps, s.exercises[0].sets[0].done], [55, 10, true])
  s = toggleSetDone(s, 'cur', ex.sets[1].id, history, custom, NOW + 120_000) as Session
  assert.deepEqual([s.exercises[0].sets[1].weight, s.exercises[0].sets[1].reps], [52.5, 9])
})

test('série supprimée puis « Annuler » : elle revient à sa place', async () => {
  const { insertSet, removeSet } = await import('../src/lib/sessionOps.ts')
  const ex = today('x-dc', '10,8,6', 3)
  const s: Session = { id: 'cur', routineId: null, name: 'Upper A', date: '2026-11-23', startedAt: NOW, endedAt: null, coachDay: 'LUNDI', exercises: [ex] }
  const gone = ex.sets[1]
  const without = removeSet(s, 'cur', gone.id)
  assert.equal(without.exercises[0].sets.length, 2)
  const back = insertSet(without, 'cur', gone, 1)
  assert.deepEqual(back.exercises[0].sets.map((x) => x.id), ex.sets.map((x) => x.id))
  // Deux fois « Annuler » : pas de doublon.
  assert.equal(insertSet(back, 'cur', gone, 1).exercises[0].sets.length, 3)
})

test('chrono de repos : la série qui vient, superset compris, avec la charge visée', async () => {
  const { nextSetAfter, nextSetHint } = await import('../src/lib/sessionOps.ts')
  const history = [past('x-dc', [set(52.5, 11), set(50, 10), set(50, 8)])]
  const dc = today('x-dc', '10,8,6', 3)
  const elev: SessionExercise = { ...today('x-elev', '12', 2), uid: 'elev', superset: 's1' }
  const curl: SessionExercise = { ...today('x-curl', '12', 2), uid: 'curl', superset: 's1' }
  const press: SessionExercise = { ...today('x-press', '5-8', 2), uid: 'press' }
  Object.assign(dc.sets[0], { weight: 55, reps: 10, done: true }) // 1re série faite comme conseillé
  let s: Session = { id: 'cur', routineId: null, name: 'Upper A', date: '2026-11-23', startedAt: NOW, endedAt: null, coachDay: 'LUNDI', exercises: [dc, elev, curl, press] }
  // Même exercice : la série 2, à la charge conseillée.
  assert.deepEqual(nextSetHint(s, 'cur', history, custom), { name: 'Développé couché à la smith', set: 'série 2', target: '52,5 × 8' })
  // Superset : après A1 et B1, on revient à A2.
  dc.sets.forEach((x) => (x.done = true))
  elev.sets[0].done = true
  curl.sets[0].done = true
  assert.deepEqual(nextSetAfter(s, 'curl')?.ex.uid, 'elev')
  assert.equal(nextSetAfter(s, 'curl')?.index, 1)
  // Superset fini : exercice suivant ; sa charge est inconnue (jamais fait) mais saisie → affichée.
  elev.sets[1].done = true
  curl.sets[1].done = true
  press.sets[0].weight = 180
  press.sets[0].reps = 8
  assert.deepEqual(nextSetHint(s, 'curl', history, custom), { name: 'Leg press', set: 'série 1', target: '180 × 8' })
  // Un exercice sauté plus haut revient en dernier ; tout fait : plus rien.
  press.sets.forEach((x) => (x.done = true))
  dc.sets[2].done = false
  assert.equal(nextSetAfter(s, 'press')?.ex.uid, 'cur')
  dc.sets[2].done = true
  s = { ...s }
  assert.equal(nextSetHint(s, 'press', history, custom), null)
})

test('faire maintenant : l’exercice remonte après le dernier commencé, superset compris', async () => {
  const { doNow, doNowIndex, exerciseGroups, setExerciseOrder } = await import('../src/lib/sessionOps.ts')
  const mk = (uid: string, done: boolean, superset: string | null = null): SessionExercise => ({ ...today('x-dc', '10', 2), uid, superset, sets: [set(50, 10, { done }), set(50, 10, { done: false })] })
  const s: Session = {
    id: 'cur', routineId: null, name: 'Upper A', date: '2026-11-23', startedAt: NOW, endedAt: null, coachDay: 'LUNDI',
    exercises: [mk('a', true), mk('b', true, 's1'), mk('c', false, 's1'), mk('d', false), mk('e', false), mk('f', false)],
  }
  const order = (x: Session) => x.exercises.map((e) => e.uid).join('')
  // « e » se fait maintenant : juste après le superset b+c (commencé), avant « d ».
  assert.equal(order(doNow(s, 'e')), 'abcedf')
  // Déjà à sa place : rien à faire.
  assert.equal(doNowIndex(s, 'd'), null)
  // Un superset bouge d'un bloc ; rien de commencé ailleurs → en tête.
  const fresh: Session = { ...s, exercises: s.exercises.map((e) => ({ ...e, sets: e.sets.map((x) => ({ ...x, done: false })) })) }
  assert.equal(order(doNow(fresh, 'c')), 'bcadef')
  // Glisser-déposer : nouvel ordre, et les groupes pour l'écran de tri.
  assert.equal(order(setExerciseOrder(s, ['f', 'a', 'b', 'c'])), 'fabcde')
  assert.deepEqual(exerciseGroups(s.exercises).map((g) => g.map((e) => e.uid).join('')), ['a', 'bc', 'd', 'e', 'f'])
})
