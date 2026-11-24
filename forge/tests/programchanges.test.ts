import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyChange, changeKey, describeChange } from '../src/lib/programChanges.ts'
import { parseConseils } from '../src/lib/agent.ts'
import { findExercise } from '../src/data/exercises.ts'
import type { Exercise, ProgramChange, Routine } from '../src/lib/types.ts'

const item = (uid: string, exerciseId: string, extra: Partial<Routine['items'][number]> = {}) => ({ uid, exerciseId, sets: 3, reps: '8-12', restSec: 90, superset: null, ...extra })
const upper1: Routine = {
  id: 'r-u1',
  name: 'Upper 1',
  countsFor: 'LUNDI',
  items: [
    item('a', 'tirage-vertical'),
    item('b', 'curl-incline', { superset: 's1' }),
    item('c', 'ext-corde', { superset: 's1' }),
    item('d', 'ecarte-halteres'),
  ],
  createdAt: 0,
  updatedAt: 0,
}
const routines: Routine[] = [upper1]
const custom: Exercise[] = []
const ch = (c: Partial<ProgramChange>): ProgramChange => ({ type: 'series', seance: 'Upper 1', exercice: '', pourquoi: '', ...c })
const names = (r: Routine, cu: Exercise[]) => r.items.map((it) => `${findExercise(it.exerciseId, cu).name}${it.superset ? '*' : ''} ${it.sets}×${it.reps}`)

test('programme proposé : séries, reps et RIR, retrouvés malgré les accents et la casse', () => {
  const r = applyChange(ch({ type: 'series', exercice: 'curl incline halteres', series: 4 }), routines, custom)
  assert.ok(r.ok)
  assert.equal(r.routines[0].items[1].sets, 4)
  assert.equal(r.label, 'Upper 1 · curl incline halteres : 3 → 4 séries')
  const reps = applyChange(ch({ type: 'reps', exercice: 'Tirage vertical', reps: '10-12' }), routines, custom)
  assert.ok(reps.ok && reps.routines[0].items[0].reps === '10-12')
  const rir = applyChange(ch({ type: 'rir', exercice: 'Écarté haltères', rir: '2' }), routines, custom)
  assert.ok(rir.ok && rir.routines[0].items[3].rir === '2')
  // La séance d'origine n'est pas modifiée (copie).
  assert.equal(upper1.items[1].sets, 3)
})

test('programme proposé : ajouter (après un superset, exercice connu ou nouveau), retirer, remplacer', () => {
  // Ajouté après le curl incliné : après tout son superset ; exercice de l'app, pas de nouvel exercice.
  const add = applyChange(ch({ type: 'ajouter', exercice: 'Curl marteau', series: 3, reps: '10-12', apres: 'Curl incliné haltères' }), routines, custom)
  assert.ok(add.ok)
  assert.deepEqual(names(add.routines[0], add.custom), ['Tirage vertical 3×8-12', 'Curl incliné haltères* 3×8-12', 'Extension triceps poulie corde* 3×8-12', 'Curl marteau 3×10-12', 'Écarté haltères 3×8-12'])
  assert.equal(add.custom.length, 0)
  // Exercice inconnu de l'app : créé avec le muscle donné.
  const spider = applyChange(ch({ type: 'ajouter', exercice: 'Curl araignée', muscle: 'biceps' }), routines, custom)
  assert.ok(spider.ok)
  assert.equal(spider.custom.length, 1)
  assert.deepEqual([spider.custom[0].name, spider.custom[0].muscle], ['Curl araignée', 'biceps'])
  // Retiré d'un superset : son partenaire n'est plus en superset.
  const rm = applyChange(ch({ type: 'retirer', exercice: 'Extension triceps poulie corde' }), routines, custom)
  assert.ok(rm.ok)
  assert.deepEqual(names(rm.routines[0], custom), ['Tirage vertical 3×8-12', 'Curl incliné haltères 3×8-12', 'Écarté haltères 3×8-12'])
  // Remplacé par un exercice inconnu : même muscle que celui qu'il remplace, séries gardées.
  const swap = applyChange(ch({ type: 'remplacer', exercice: 'Écarté haltères', par: 'Écarté machine convergente' }), routines, custom)
  assert.ok(swap.ok)
  assert.equal(findExercise(swap.routines[0].items[3].exerciseId, swap.custom).muscle, 'pectoraux')
  assert.equal(swap.label, 'Upper 1 · Écarté haltères → Écarté machine convergente')
})

test('programme proposé : séance ou exercice introuvable, doublon, clé stable, lecture des conseils', () => {
  const bad = applyChange(ch({ seance: 'Push', exercice: 'Dips', series: 4 }), routines, custom)
  assert.equal(bad.ok, false)
  assert.equal(!bad.ok && bad.error, 'Séance « Push » introuvable')
  const missing = applyChange(ch({ exercice: 'Squat', series: 4 }), routines, custom)
  assert.equal(!missing.ok && missing.error, '« Squat » introuvable dans Upper 1')
  const dup = applyChange(ch({ type: 'ajouter', exercice: 'Tirage vertical' }), routines, custom)
  assert.equal(!dup.ok && dup.error, 'Tirage vertical est déjà dans Upper 1')
  assert.equal(changeKey(ch({ exercice: 'Écarté Haltères', series: 4 })), changeKey(ch({ exercice: 'ecarte halteres', series: 4 })))
  assert.equal(describeChange(ch({ type: 'ajouter', exercice: 'Curl marteau', series: 3, reps: '10-12' }), routines, custom), 'Upper 1 : ajouter Curl marteau (3 × 10-12)')
  // Changements relus avec les conseils : les incomplets sont écartés.
  const c = parseConseils({
    semaine: '2026-11-30',
    texte: '## Cap',
    programme: [
      { type: 'series', seance: 'Upper 1', exercice: 'Curl incliné haltères', series: 4, pourquoi: 'Biceps sous la zone' },
      { type: 'series', seance: 'Upper 1', exercice: 'Tirage vertical' },
      { type: 'remplacer', seance: 'Upper 1', exercice: 'Écarté haltères' },
      { type: 'nager', seance: 'Upper 1', exercice: 'x' },
    ],
  })
  assert.equal(c?.programme?.length, 1)
  assert.equal(c?.programme?.[0].pourquoi, 'Biceps sous la zone')
})
