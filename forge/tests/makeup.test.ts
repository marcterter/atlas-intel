import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assignMakeUps, freezeMakeUps, makeUpOptions } from '../src/lib/makeup.ts'
import { previousSets } from '../src/lib/training.ts'
import type { Exercise, Routine, Session, SessionExercise, SetEntry } from '../src/lib/types.ts'

const custom: Exercise[] = [
  { id: 'x-dc', name: 'Développé couché à la smith', muscle: 'pectoraux', equipment: 'smith', kind: 'weight', custom: true },
  { id: 'x-curl', name: 'Curl pupitre unilatéral avec haltères', muscle: 'biceps', equipment: 'halteres', kind: 'weight', custom: true },
  { id: 'x-tri', name: 'Overhead triceps extension cable', muscle: 'triceps', equipment: 'poulie', kind: 'weight', custom: true },
  { id: 'x-add', name: 'Adductor machine', muscle: 'adducteurs', equipment: 'machine', kind: 'weight', custom: true },
  { id: 'x-press', name: 'Leg press', muscle: 'quadriceps', equipment: 'machine', kind: 'weight', custom: true },
]
const item = (exerciseId: string) => ({ uid: `i-${exerciseId}`, exerciseId, sets: 3, reps: '12,10,8', restSec: 120, superset: null })
const routines: Routine[] = [
  { id: 'r-ua', name: 'Upper A', coachDay: 'LUNDI', items: [item('x-dc'), item('x-curl'), item('x-tri')], createdAt: 0, updatedAt: 0 },
  { id: 'r-ub', name: 'Upper B', coachDay: 'JEUDI', items: [item('x-dc'), item('x-curl'), item('x-tri')], createdAt: 0, updatedAt: 0 },
  { id: 'r-lb', name: 'Lower B', coachDay: 'VENDREDI', items: [item('x-add'), item('x-press')], createdAt: 0, updatedAt: 0 },
]
const done = (weight = 20, reps = 10): SetEntry => ({ id: Math.random().toString(36).slice(2), type: 'normal', weight, reps, seconds: null, km: null, kcal: null, done: true })
const ex = (exerciseId: string, uid = exerciseId, extra: Partial<SessionExercise> = {}): SessionExercise => ({ uid, exerciseId, sets: [done(), done()], restSec: 120, superset: null, ...extra })
const at = (date: string) => new Date(`${date}T18:00:00`).getTime()
function session(id: string, date: string, routine: Routine | null, exercises: SessionExercise[]): Session {
  return { id, routineId: routine?.id ?? null, name: routine?.name ?? 'Séance libre', date, startedAt: at(date), endedAt: at(date) + 3600_000, coachDay: routine?.coachDay ?? null, exercises }
}
const [UA, UB, LB] = routines

test('rattrapage : les bras faits avant les jambes comptent pour l’Upper où ils ont sauté', () => {
  const history = [
    session('lun', '2026-11-23', UA, [ex('x-dc'), ex('x-curl'), ex('x-tri')]), // bras faits lundi
    session('jeu', '2026-11-26', UB, [ex('x-dc')]), // bras sautés jeudi
  ]
  // Vendredi : variantes (curl marteau, extension corde) avant la Lower B.
  const fri = session('ven', '2026-11-27', LB, [ex('curl-marteau'), ex('ext-corde'), ex('x-add'), ex('x-press')])
  const made = assignMakeUps(fri, history, routines, custom)
  assert.deepEqual(made.get('curl-marteau'), { coachDay: 'JEUDI', date: '2026-11-26', session: 'Upper B', target: 'Curl pupitre unilatéral avec haltères', targetId: 'x-curl' })
  assert.equal(made.get('ext-corde')?.target, 'Overhead triceps extension cable')
  assert.equal(made.has('x-add'), false, 'prévu dans la Lower B')
  assert.equal(made.size, 2)

  // Lundi aussi sans bras : jeudi d'abord (le plus récent), lundi en 2e choix ; le même exercice passe devant.
  const history2 = [session('lun', '2026-11-23', UA, [ex('x-dc')]), history[1]]
  assert.deepEqual(makeUpOptions(fri, fri.exercises[0], history2, routines, custom).map((o) => o.coachDay), ['JEUDI', 'LUNDI'])
  const exact = session('ven', '2026-11-27', LB, [ex('x-curl', 'c1'), ex('curl-marteau', 'c2')])
  const m2 = assignMakeUps(exact, history2, routines, custom)
  assert.equal(m2.get('c1')?.coachDay, 'JEUDI')
  assert.equal(m2.get('c2')?.coachDay, 'LUNDI', 'une ligne du coach ne se rattrape qu’une fois')
})

test('rattrapage : déjà rattrapé, choix manuel, séance libre, trop ancien', () => {
  const thu = session('jeu', '2026-11-26', UB, [ex('x-dc')])
  // Bras déjà rattrapés samedi pour le jeudi : dimanche, plus rien à rattraper.
  const sat = freezeMakeUps(session('sam', '2026-11-28', null, [ex('x-curl')]), [thu], routines, custom)
  assert.equal(sat.exercises[0].pour?.coachDay, 'JEUDI', 'séance libre : rattrape aussi')
  const sun = session('dim', '2026-11-29', null, [ex('x-curl')])
  assert.equal(assignMakeUps(sun, [thu, sat], routines, custom).size, 0)
  // « Garder dans cette séance » est respecté.
  const kept = session('ven', '2026-11-27', LB, [ex('x-curl', 'c', { pour: null })])
  assert.equal(assignMakeUps(kept, [thu], routines, custom).size, 0)
  // Plus de 6 jours : trop loin.
  const later = session('ven2', '2026-12-03', LB, [ex('x-curl')])
  assert.equal(assignMakeUps(later, [thu], routines, custom).size, 0)
  // Exercice remplaçant un exercice prévu ce jour-là : pas un rattrapage.
  const swap = session('ven', '2026-11-27', LB, [ex('x-curl', 'c', { replacedFrom: 'x-press' })])
  assert.equal(assignMakeUps(swap, [thu], routines, custom).size, 0)
})

test('rattrapage : la colonne « Précédent » le compte pour la séance rattrapée', () => {
  const thuBefore = session('jeu0', '2026-11-19', UB, [{ ...ex('x-curl'), sets: [done(12, 8)] }])
  const fri = session('ven', '2026-11-27', LB, [
    { ...ex('x-curl'), sets: [done(14, 10)], pour: { coachDay: 'JEUDI', date: '2026-11-26', session: 'Upper B', target: 'Curl pupitre unilatéral avec haltères', targetId: 'x-curl' } },
  ])
  const next = previousSets([thuBefore, fri], 'x-curl', at('2026-12-03'), 'JEUDI')
  assert.deepEqual([next[0].weight, next[0].reps], [14, 10], 'le rattrapage du vendredi est la dernière fois « du jeudi »')
})
