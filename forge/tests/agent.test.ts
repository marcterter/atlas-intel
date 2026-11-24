import { test } from 'node:test'
import assert from 'node:assert/strict'
import { exerciseAdviceFor, parseConseils } from '../src/lib/agent.ts'

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
