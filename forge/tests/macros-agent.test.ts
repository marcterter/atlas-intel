import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyMacroProposal, describeMacroProposal, parseGoal, parseMacroProposal, proposalIsCurrent, proposalSummary } from '../src/lib/macroProposal.ts'
import { parseConseils } from '../src/lib/agent.ts'
import { kcalFromMacros } from '../src/lib/nutrition.ts'
import { defaultData, useStore } from '../src/store/store.ts'
import { todayISO } from '../src/lib/date.ts'
import type { Targets } from '../src/lib/types.ts'

const ON = { kcal: 2620, protein: 145, carbs: 365, fat: 65 }
const OFF = { kcal: 2105, protein: 145, carbs: 236, fat: 65 }
const targets: Targets = { base: ON, rest: OFF, steps: 15000, fiber: 30 }

test('macros de l’agent : mêmes clés que le contexte, ou en français ; kcal recalculées si elles ne collent pas', () => {
  const m = parseMacroProposal({
    jourOn: { kcal: 2770, protein: 150, carbs: 400, fat: 65 },
    jourOff: { kcal: '2 400', proteines: '150', glucides: '310,4', lipides: 65 }, // kcal illisibles : recalculées
    fibres: 35,
    phase: 'Prise de masse',
    pourquoi: ' Poids stable 3 semaines : on démarre la prise. ',
  })
  assert.deepEqual(m, {
    on: { kcal: 2770, protein: 150, carbs: 400, fat: 65 },
    off: { kcal: kcalFromMacros({ protein: 150, carbs: 310, fat: 65 }), protein: 150, carbs: 310, fat: 65 },
    fibres: 35,
    phase: 'prise',
    pourquoi: 'Poids stable 3 semaines : on démarre la prise.',
  })
  // Kcal à moins de 30 kcal des grammes : gardées telles quelles ; au-delà, recalculées.
  assert.equal(parseMacroProposal({ jourOn: { kcal: 2790, protein: 150, carbs: 400, fat: 65 } })?.on.kcal, 2790)
  assert.equal(parseMacroProposal({ jourOn: { kcal: 3000, protein: 150, carbs: 400, fat: 65 } })?.on.kcal, 2785)
  assert.equal(parseMacroProposal({ on: { protein: 150, carbs: 400, fat: 65 } })?.on.kcal, 2785)
  // Texte JSON (relu depuis le sheet) accepté.
  assert.equal(parseMacroProposal(JSON.stringify({ jourOn: ON, pourquoi: 'x' }))?.on.kcal, 2620)
})

test('macros de l’agent : écartées si le jour ON manque ou sort des bornes ; jour OFF, fibres, phase facultatifs', () => {
  assert.equal(parseMacroProposal(null), null)
  assert.equal(parseMacroProposal('pas du json'), null)
  assert.equal(parseMacroProposal([ON]), null)
  assert.equal(parseMacroProposal({ jourOff: OFF }), null, 'jour ON obligatoire')
  assert.equal(parseMacroProposal({ jourOn: { kcal: 2620, protein: 145, carbs: 365 } }), null, 'lipides manquants')
  assert.equal(parseMacroProposal({ jourOn: { kcal: 9000, protein: 600, carbs: 900, fat: 300 } }), null, 'protéines hors bornes')
  assert.equal(parseMacroProposal({ jourOn: { protein: 40, carbs: 20, fat: 20 } }), null, 'moins de 1 000 kcal')
  const m = parseMacroProposal({ jourOn: ON, jourOff: { kcal: 2000 }, fibres: 200, phase: 'hiver' })
  assert.deepEqual(m, { on: ON, pourquoi: '' })
  assert.equal(parseGoal('sèche'), 'seche')
  assert.equal(parseGoal('Maintien'), 'maintien')
  assert.equal(parseGoal('prise'), 'prise')
  assert.equal(parseGoal(''), undefined)
})

test('macros de l’agent : appliquées sur tes objectifs, décrites ligne par ligne', () => {
  const m = parseMacroProposal({ jourOn: { kcal: 2770, protein: 145, carbs: 403, fat: 65 }, jourOff: { kcal: 2255, protein: 145, carbs: 274, fat: 65 }, phase: 'prise', fibres: 35, pourquoi: 'x' })!
  assert.deepEqual(applyMacroProposal(targets, m), { ...targets, base: m.on, rest: m.off, fiber: 35 })
  // Sans jour OFF proposé : ton jour OFF ne bouge pas.
  const onlyOn = parseMacroProposal({ jourOn: m.on })!
  assert.deepEqual(applyMacroProposal(targets, onlyOn).rest, OFF)
  // Espaces des milliers (insécables) ramenées à de simples espaces.
  const sp = (x: string) => x.replace(/[  ]/g, ' ')
  assert.deepEqual(
    describeMacroProposal(targets, 'maintien', m).map((l) => [l.label, sp(l.from), sp(l.to), l.detail ?? '']),
    [
      ['Phase', 'Maintien', 'Prise de masse', ''],
      ['Jour ON', '2 620', '2 770 kcal', 'P 145 · G 365 → 403 · L 65 g'],
      ['Jour OFF', '2 105', '2 255 kcal', 'P 145 · G 236 → 274 · L 65 g'],
      ['Fibres', '30', '35 g', ''],
    ],
  )
  assert.equal(sp(proposalSummary(m)), 'Prise de masse · ON 2 770 · OFF 2 255 kcal')
  assert.equal(proposalIsCurrent(targets, 'maintien', m), false)
  assert.equal(proposalIsCurrent(applyMacroProposal(targets, m), 'prise', m), true)
  assert.equal(proposalIsCurrent(applyMacroProposal(targets, m), 'maintien', m), false, 'la phase compte aussi')
  // Relues avec les conseils.
  const c = parseConseils({ semaine: '2026-11-23', texte: '## Diète', macros: { jourOn: m.on, jourOff: m.off, pourquoi: 'x' } })
  assert.deepEqual(c?.macros?.on, m.on)
  assert.equal(parseConseils({ semaine: '2026-11-23', texte: '## Diète', macros: null })?.macros, undefined)
})

test('macros de l’agent : « Appliquer » change objectifs, phase et fibres, tranche le bilan du lundi ; « Annuler » remet tout', () => {
  const macros = parseMacroProposal({ jourOn: { kcal: 2770, protein: 145, carbs: 403, fat: 65 }, jourOff: { kcal: 2255, protein: 145, carbs: 274, fat: 65 }, phase: 'prise', fibres: 35, pourquoi: 'x' })!
  const weighins = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-23', '2026-11-24', '2026-11-25'].map((date, i) => ({ date, kg: i < 3 ? 78 : 78.2, at: 0 }))
  const fresh = () =>
    useStore.setState({
      ...defaultData(),
      profile: { ...defaultData().profile, goal: 'maintien' },
      targets,
      weighins,
      conseils: { semaine: '2026-11-23', date: '', texte: '## Diète', exercices: [], macros },
    })
  fresh()
  const st = () => useStore.getState()
  const { undo } = st().decideAgentMacros('2026-11-23', 'applique')
  assert.deepEqual(st().targets.base, macros.on)
  assert.deepEqual(st().targets.rest, macros.off)
  assert.equal(st().targets.fiber, 35)
  assert.equal(st().profile.goal, 'prise')
  assert.equal(st().macrosVu?.['2026-11-23'], 'applique')
  const r = st().reviews['2026-11-30']
  assert.deepEqual([r.decision, r.source, r.deltaKcal, Math.round((r.avg ?? 0) * 10) / 10, Math.round((r.deltaKg ?? 0) * 10) / 10], ['applied', 'agent', 150, 78.2, 0.2])
  assert.ok(st().dirty.days[todayISO()], 'les objectifs du jour repartent vers le sheet')
  undo()
  assert.deepEqual(st().targets, targets)
  assert.equal(st().profile.goal, 'maintien')
  assert.deepEqual(st().macrosVu, {})
  assert.deepEqual(st().reviews, {})

  // « Garder mes macros » : rien ne change, le bilan du lundi est tranché ; « Revoir » le rouvre.
  fresh()
  st().decideAgentMacros('2026-11-23', 'garde')
  assert.deepEqual(st().targets, targets)
  assert.equal(st().reviews['2026-11-30'].decision, 'kept')
  st().decideAgentMacros('2026-11-23', null)
  assert.deepEqual([st().macrosVu, st().reviews], [{}, {}])

  // Bilan de l'app déjà tranché à la main : on n'y touche pas.
  fresh()
  useStore.setState({ reviews: { '2026-11-30': { decision: 'applied', deltaKcal: 100, avg: 78.2, deltaKg: 0.2, at: 1 } } })
  st().decideAgentMacros('2026-11-23', 'applique')
  assert.equal(st().reviews['2026-11-30'].source, undefined)
  assert.equal(st().reviews['2026-11-30'].deltaKcal, 100)
  // Conseils d'une autre semaine : rien à appliquer.
  fresh()
  st().decideAgentMacros('2026-11-16', 'applique')
  assert.deepEqual(st().targets, targets)
})
