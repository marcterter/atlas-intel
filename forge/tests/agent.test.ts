import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildContexte, exerciseAdviceFor, parseConseils, recentNotes } from '../src/lib/agent.ts'
import { fiberReference } from '../src/lib/nutrition.ts'
import { addDays } from '../src/lib/date.ts'
import type { CheckIn, DayLog, Exercise, Session, SessionExercise, SetEntry } from '../src/lib/types.ts'

test('agent IA : conseils renvoyés par le script, nettoyés', () => {
  assert.equal(parseConseils(null), null)
  assert.equal(parseConseils({ semaine: '2026-11-23', texte: '   ' }), null)
  assert.equal(parseConseils({ semaine: 'lundi', texte: 'Salut' }), null)
  // Ancien script : pas encore de conseils par exercice.
  assert.deepEqual(parseConseils({ semaine: '2026-11-23', date: '2026-11-23T07:02', texte: '## Diète\n- OK' }), {
    semaine: '2026-11-23',
    date: '2026-11-23T07:02',
    texte: '## Diète\n- OK',
    exercices: [],
  })
  const c = parseConseils({
    semaine: '2026-11-23',
    texte: 'x',
    exercices: [{ nom: ' Leg press ', conseil: ' Monte à 190 kg. ' }, { nom: '', conseil: 'ignoré' }, null, { nom: 'Squat' }],
  })
  assert.deepEqual(c?.exercices, [{ nom: 'Leg press', conseil: 'Monte à 190 kg.' }])
})

test('agent IA : conseil par exercice, retrouvé par son nom', () => {
  const c = parseConseils({
    semaine: '2026-11-23',
    texte: 'x',
    exercices: [
      { nom: 'Developpe couche smith', conseil: 'Passe à 57,5 kg sur la 1re série.' },
      { nom: 'Leg press', conseil: 'Garde 180 kg, vise 12 reps.' },
    ],
  })
  // Sans accents ni casse, et même sans « à la ».
  assert.equal(exerciseAdviceFor(c, 'Développé couché à la smith', '2026-11-24'), 'Passe à 57,5 kg sur la 1re série.')
  assert.equal(exerciseAdviceFor(c, 'LEG PRESS', '2026-11-24'), 'Garde 180 kg, vise 12 reps.')
  assert.equal(exerciseAdviceFor(c, 'Leg curl', '2026-11-24'), null)
  // Valable deux semaines après le bilan, pas au-delà.
  assert.equal(exerciseAdviceFor(c, 'Leg press', '2026-12-07'), 'Garde 180 kg, vise 12 reps.')
  assert.equal(exerciseAdviceFor(c, 'Leg press', '2026-12-08'), null)
  assert.equal(exerciseAdviceFor(null, 'Leg press', '2026-11-24'), null)
})

const custom: Exercise[] = [
  { id: 'x-dc', name: 'Développé couché à la smith', muscle: 'pectoraux', equipment: 'smith', kind: 'weight', custom: true },
  { id: 'x-marteau', name: 'Curl marteau', muscle: 'biceps', equipment: 'halteres', kind: 'weight', custom: true },
]
const set = (weight: number, reps: number, done = true): SetEntry => ({ id: `${weight}-${reps}-${done}`, type: 'normal', weight, reps, seconds: null, km: null, kcal: null, done })
const ex = (uid: string, exerciseId: string, sets: SetEntry[], extra: Partial<SessionExercise> = {}): SessionExercise => ({ uid, exerciseId, sets, restSec: 120, superset: null, ...extra })
const session = (id: string, date: string, name: string, exercises: SessionExercise[], extra: Partial<Session> = {}): Session => ({
  id,
  routineId: null,
  name,
  date,
  startedAt: new Date(`${date}T18:00:00`).getTime(),
  endedAt: null,
  exercises,
  ...extra,
})
const log = (date: string, note: string): DayLog => ({ date, sleepH: 5, sleepQ: 4, energy: 3, motivation: 5, satiety: null, digestion: null, waterL: null, note, at: 1 })

test('agent IA : tes notes (séance, exercice, ressenti, bilan), de la plus récente à la plus ancienne', () => {
  const sessions = [
    session('a', '2026-11-23', 'Upper A', [ex('u1', 'x-dc', [set(55, 10), set(52.5, 9), set(50, 8, false)], { note: '  Épaule droite   qui tire ' }), ex('u2', 'x-marteau', [set(14, 10)], { note: '' })], {
      note: 'Grosse fatigue, mal dormi',
    }),
    session('b', '2026-11-27', 'Lower B', [
      ex('u3', 'x-marteau', [set(14, 10)], { note: 'Pupitre pris', pour: { coachDay: 'JEUDI', date: '2026-11-26', session: 'Upper B', target: 'Curl pupitre', targetId: 'x' } }),
    ]),
    // Historique repris du sheet du coach : ce ne sont pas tes notes.
    session('c', '2026-11-20', 'Upper B', [ex('u4', 'x-dc', [], { note: 'Repris du sheet du coach' })], { imported: true, note: 'Repris du sheet du coach' }),
    // Plus de 4 semaines : trop ancien.
    session('d', '2026-10-01', 'Upper A', [], { note: 'vieille note' }),
  ]
  const daylogs = { '2026-11-25': log('2026-11-25', 'Resto japonais'), '2026-11-26': log('2026-11-26', '   ') }
  const checkins: CheckIn[] = [{ id: 'k', date: '2026-11-28', measures: {}, photos: {}, ratings: {}, note: 'Semaine dure au boulot', at: 1 }]
  assert.deepEqual(recentNotes({ sessions, daylogs, checkins, customExercises: custom }, '2026-11-29'), [
    { date: '2026-11-28', ou: 'Bilan', texte: 'Semaine dure au boulot' },
    { date: '2026-11-27', ou: 'Curl marteau · Lower B (rattrapage Upper B)', texte: 'Pupitre pris', series: '14 × 10' },
    { date: '2026-11-25', ou: 'Ressenti du jour', texte: 'Resto japonais' },
    { date: '2026-11-23', ou: 'Séance Upper A', texte: 'Grosse fatigue, mal dormi' },
    { date: '2026-11-23', ou: 'Développé couché à la smith · Upper A', texte: 'Épaule droite qui tire', series: '55 × 10, 52,5 × 9' },
  ])

  // Bornées : une note très longue est coupée, et le tout tient largement dans une cellule du sheet.
  const many = Object.fromEntries(Array.from({ length: 28 }, (_, i) => addDays('2026-11-29', -i)).map((d) => [d, log(d, 'a'.repeat(1000))]))
  const capped = recentNotes({ sessions: [], daylogs: many, checkins: [], customExercises: [] }, '2026-11-29')
  assert.equal(capped[0].texte.length, 300)
  assert.equal(capped[0].date, '2026-11-29')
  assert.ok(capped.length >= 15 && capped.length < 28)
  assert.ok(JSON.stringify(capped).length < 8000)
})

test('agent IA : le contexte envoyé au sheet contient tes notes et ton objectif fibres', () => {
  const base = { kcal: 2640, protein: 180, carbs: 330, fat: 66 }
  const ctx = buildContexte(
    {
      profile: { name: 'M', sex: 'H', birthYear: 1990, heightCm: 180, goal: 'maintien', activity: 'modere', projet: '  Prise de masse   propre, date à décider ' } as never,
      targets: { base, rest: null, steps: 15000, fiber: 35 },
      routines: [],
      customExercises: custom,
      weighins: [],
      sessions: [session('a', '2026-11-23', 'Upper A', [], { note: 'RAS' })],
      daylogs: {},
      checkins: [],
      reviews: {},
    },
    '2026-11-24',
  )
  assert.equal(ctx.objectifs.fibres, 35)
  assert.equal(ctx.projet, 'Prise de masse propre, date à décider')
  assert.deepEqual(ctx.notes, [{ date: '2026-11-23', ou: 'Séance Upper A', texte: 'RAS' }])
  assert.deepEqual(ctx.decisionsMacros, [])
})

test('agent IA : il sait ce que tu as fait de ses macros et de celles du bilan de l’app', () => {
  const ctx = buildContexte(
    {
      profile: { name: 'M', sex: 'H', birthYear: 1990, heightCm: 180, goal: 'maintien', activity: 'modere' } as never,
      targets: { base: { kcal: 2640, protein: 180, carbs: 330, fat: 66 }, rest: null, steps: 15000, fiber: 35 },
      routines: [],
      customExercises: custom,
      weighins: [],
      sessions: [],
      daylogs: {},
      checkins: [],
      reviews: {
        '2026-11-30': { decision: 'applied', deltaKcal: 150, avg: 78, deltaKg: 0.1, at: 1, source: 'agent' }, // tranché via l'agent : déjà compté
        '2026-11-23': { decision: 'applied', deltaKcal: -100, avg: 78, deltaKg: 0.4, at: 1 },
        '2026-11-16': { decision: 'seen', deltaKcal: 0, avg: 78, deltaKg: 0, at: 1 },
        '2026-09-07': { decision: 'kept', deltaKcal: 100, avg: 80, deltaKg: -1, at: 1 }, // trop vieux
      },
      macrosVu: { '2026-11-23': 'applique', '2026-11-16': 'garde' },
    },
    '2026-12-01',
  )
  assert.deepEqual(ctx.decisionsMacros, [
    { semaine: '2026-11-23', par: 'agent', etat: 'appliquées' },
    { semaine: '2026-11-16', par: 'agent', etat: 'gardé les siennes' },
    { semaine: '2026-11-16', par: 'bilan de l’app', etat: 'appliquées', ecartKcal: -100 },
    { semaine: '2026-11-09', par: 'bilan de l’app', etat: 'vu (rien à changer)', ecartKcal: 0 },
  ])
})

test('objectif fibres : repère 14 g pour 1 000 kcal, jamais sous 30 g', () => {
  assert.equal(fiberReference(2640), 37)
  assert.equal(fiberReference(2100), 30)
  assert.equal(fiberReference(1500), 30)
})
