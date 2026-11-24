import { test } from 'node:test'
import assert from 'node:assert/strict'
import { coachChoices, coachMapping, freezeCoachMapping, linkSessionToDay } from '../src/lib/coachMap.ts'
import { assignMakeUps, refreshLaterMakeUps } from '../src/lib/makeup.ts'
import { sessionFromRoutine } from '../src/lib/sessionOps.ts'
import { findExercise } from '../src/data/exercises.ts'
import type { Exercise, Routine, Session, SessionExercise, SetEntry } from '../src/lib/types.ts'

// Programme du coach (exercices créés à l'import) et séance à toi « Upper 1 » (exercices de l'app).
const coach: Exercise[] = [
  { id: 'c-tv', name: 'Tirage vertical unilatéral', muscle: 'dos', equipment: 'poulie', kind: 'weight', custom: true },
  { id: 'c-dc', name: 'Développé couché à la smith', muscle: 'pectoraux', equipment: 'smith', kind: 'weight', custom: true },
  { id: 'c-th', name: 'Tirage horizontal machine', muscle: 'dos', equipment: 'machine', kind: 'weight', custom: true },
  { id: 'c-ec', name: 'Écarté à la poulie sur banc', muscle: 'pectoraux', equipment: 'poulie', kind: 'weight', custom: true },
  { id: 'c-el', name: 'Élévation latérale unilatéral cuff de poignet', muscle: 'epaules', equipment: 'poulie', kind: 'weight', custom: true },
  { id: 'c-cp', name: 'Curl pupitre unilatéral avec haltères', muscle: 'biceps', equipment: 'halteres', kind: 'weight', custom: true },
  { id: 'c-tri', name: 'Overhead triceps extension cable', muscle: 'triceps', equipment: 'poulie', kind: 'weight', custom: true },
  { id: 'c-add', name: 'Adductor machine', muscle: 'adducteurs', equipment: 'machine', kind: 'weight', custom: true },
]
const item = (exerciseId: string) => ({ uid: `i-${exerciseId}`, exerciseId, sets: 3, reps: '10,8,6', restSec: 120, superset: null })
const upperA: Routine = { id: 'r-ua', name: 'Upper A', coachDay: 'LUNDI', items: ['c-tv', 'c-dc', 'c-th', 'c-ec', 'c-el', 'c-cp', 'c-tri'].map(item), createdAt: 0, updatedAt: 0 }
const lowerB: Routine = { id: 'r-lb', name: 'Lower B', coachDay: 'VENDREDI', items: ['c-add'].map(item), createdAt: 0, updatedAt: 0 }
const upper1: Routine = {
  id: 'r-u1',
  name: 'Upper 1',
  countsFor: 'LUNDI',
  items: ['ecarte-halteres', 'tirage-vertical', 'di-smith', 'rowing-poitrine', 'ecarte-poulie-basse', 'elev-lat-halteres'].map(item),
  createdAt: 0,
  updatedAt: 0,
}
const routines = [upperA, lowerB, upper1]
const done = (): SetEntry => ({ id: Math.random().toString(36).slice(2), type: 'normal', weight: 20, reps: 10, seconds: null, km: null, kcal: null, done: true })
const withSets = (s: Session): Session => ({ ...s, exercises: s.exercises.map((e) => ({ ...e, sets: [done(), done()] })) })
const name = (id: string | undefined) => (id ? findExercise(id, coach).name : null)

test('séance à toi comptée pour le lundi : chaque exercice prend la ligne la plus proche chez le coach', () => {
  const s = withSets(sessionFromRoutine(upper1, 'Upper 1', new Date('2026-11-23T12:00:00').getTime()))
  assert.equal(s.coachDay, 'LUNDI')
  const map = coachMapping(s, routines, coach)
  const by = Object.fromEntries(s.exercises.map((e) => [findExercise(e.exerciseId, coach).name, map.get(e.uid)?.target ?? null]))
  assert.deepEqual(by, {
    'Écarté haltères': null, // les deux lignes pectoraux sont prises par plus proche que lui : hors programme
    'Tirage vertical': 'Tirage vertical unilatéral',
    'Développé incliné Smith': 'Développé couché à la smith',
    'Rowing appui poitrine': 'Tirage horizontal machine',
    'Écarté poulie basse': 'Écarté à la poulie sur banc',
    'Élévations latérales haltères': 'Élévation latérale unilatéral cuff de poignet',
  })
  // Figé à la fin : des remplacements, que le script écrit sur les lignes du lundi.
  const frozen = freezeCoachMapping(s, routines, coach)
  assert.deepEqual(frozen.exercises.map((e) => name(e.replacedFrom)), [null, 'Tirage vertical unilatéral', 'Développé couché à la smith', 'Tirage horizontal machine', 'Écarté à la poulie sur banc', 'Élévation latérale unilatéral cuff de poignet'])
  // La séance du coach elle-même n'est pas concernée.
  assert.equal(coachMapping(withSets(sessionFromRoutine(upperA, 'Upper A')), routines, coach).size, 0)
})

test('séance à toi : choix à la main, hors programme, et liaison après coup', () => {
  const s = withSets(sessionFromRoutine(upper1, 'Upper 1'))
  const ecarteH = s.exercises[0]
  // Les choix libres pour l'écarté haltères : pectoraux d'abord, les lignes déjà prises exclues.
  const choices = coachChoices(s, ecarteH.uid, routines, coach).map((x) => x.name)
  assert.equal(choices.includes('Écarté à la poulie sur banc'), false)
  // À la main : l'écarté haltères prend la ligne de l'écarté ; l'écarté poulie basse se replie ailleurs.
  const manual: Session = { ...s, exercises: s.exercises.map((e, i) => (i === 0 ? { ...e, coachTarget: 'c-ec' } : e)) }
  const m = coachMapping(manual, routines, coach)
  assert.equal(m.get(ecarteH.uid)?.target, 'Écarté à la poulie sur banc')
  assert.equal(m.get(s.exercises[4].uid)?.target, undefined)
  // Hors programme à la main.
  const off: Session = { ...s, exercises: s.exercises.map((e, i) => (i === 1 ? { ...e, coachTarget: null } : e)) }
  assert.equal(coachMapping(off, routines, coach).has(s.exercises[1].uid), false)
  // Séance de lundi déjà finie, sans jour du coach : reliée après coup, puis déliée.
  const monday: Session = { ...s, coachDay: null, endedAt: 1 }
  const linked = linkSessionToDay(monday, 'LUNDI', routines, coach)
  assert.equal(linked.coachDay, 'LUNDI')
  assert.equal(name(linked.exercises[3].replacedFrom), 'Tirage horizontal machine')
  const unlinked = linkSessionToDay(linked, null, routines, coach)
  assert.equal(unlinked.coachDay, null)
  assert.equal(unlinked.exercises.some((e) => e.replacedFrom), false)
})

test('séance à toi : les bras faits mardi rattrapent ceux que la séance du lundi n’a pas pris', () => {
  const monday = freezeCoachMapping(withSets({ ...sessionFromRoutine(upper1, 'Upper 1'), id: 'lun', date: '2026-11-23', startedAt: new Date('2026-11-23T12:00:00').getTime(), endedAt: 1 }), routines, coach)
  const tuesday: Session = withSets({
    ...sessionFromRoutine(lowerB, 'Lower B'),
    id: 'mar',
    date: '2026-11-24',
    startedAt: new Date('2026-11-24T18:00:00').getTime(),
    exercises: [
      { uid: 'curl', exerciseId: 'curl-incline', sets: [], restSec: 90, superset: null },
      { uid: 'nuque', exerciseId: 'ext-nuque-poulie', sets: [], restSec: 90, superset: null },
      { uid: 'add', exerciseId: 'c-add', sets: [], restSec: 90, superset: null },
    ] as SessionExercise[],
  })
  const made = assignMakeUps(tuesday, [monday], routines, coach)
  assert.equal(made.get('curl')?.target, 'Curl pupitre unilatéral avec haltères')
  assert.equal(made.get('nuque')?.target, 'Overhead triceps extension cable')
  assert.equal(made.has('add'), false)
})

test('relier lundi après coup : les bras de mardi rattrapent ses lignes, et tombent si on le détache', () => {
  const at = (d: string, h: number) => new Date(`${d}T${String(h).padStart(2, '0')}:00:00`).getTime()
  // Lundi : « Upper 1 » finie avant la liaison (aucun jour du coach) ; mardi : bras en plus, rien rattrapé.
  const monday: Session = withSets({ ...sessionFromRoutine({ ...upper1, countsFor: undefined }, 'Upper 1'), id: 'lun', date: '2026-11-23', startedAt: at('2026-11-23', 12), endedAt: at('2026-11-23', 13) })
  const tuesday: Session = withSets({
    ...sessionFromRoutine(lowerB, 'Lower B'),
    id: 'mar',
    date: '2026-11-24',
    startedAt: at('2026-11-24', 18),
    endedAt: at('2026-11-24', 19),
    exercises: [
      { uid: 'curl', exerciseId: 'curl-incline', sets: [], restSec: 90, superset: null },
      { uid: 'add', exerciseId: 'c-add', sets: [], restSec: 90, superset: null },
    ] as SessionExercise[],
  })
  assert.equal(monday.coachDay, null)
  const linked = linkSessionToDay(monday, 'LUNDI', routines, coach)
  const later = refreshLaterMakeUps(linked, monday.coachDay, [monday, tuesday], routines, coach)
  assert.equal(later.length, 1)
  assert.equal(later[0].exercises[0].pour?.target, 'Curl pupitre unilatéral avec haltères')
  assert.equal(later[0].exercises[0].pour?.date, '2026-11-23')
  // Détachée : le rattrapage vers lundi tombe.
  const unlinked = linkSessionToDay(linked, null, routines, coach)
  const back = refreshLaterMakeUps(unlinked, 'LUNDI', [unlinked, later[0]], routines, coach)
  assert.equal(back[0].exercises[0].pour, undefined)
})
