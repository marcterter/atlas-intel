import { test } from 'node:test'
import assert from 'node:assert/strict'
import { photosToSend } from '../src/lib/sync.ts'
import type { CheckIn } from '../src/lib/types.ts'

const c = (id: string, date: string, extra: Partial<CheckIn>): CheckIn => ({ id, date, measures: {}, photos: {}, ratings: {}, at: 0, ...extra })

test('photos pour l’agent : seulement les bilans récents, et les photos changées depuis le dernier envoi', () => {
  const list = photosToSend(
    [
      c('vieux', '2026-10-01', { photos: { face: 'p0' } }),
      c('semaine', '2026-11-28', {
        photos: { face: 'p1', dos: 'p3' },
        myair: 'm1',
        // Face déjà envoyée ; dos refait depuis l'envoi.
        envoye: { face: 'p1', dos: 'p2' },
      }),
    ],
    '2026-11-29',
  )
  assert.deepEqual(
    list.map((x) => [x.checkin, x.slot, x.photo]),
    [
      ['semaine', 'dos', 'p3'],
      ['semaine', 'myair', 'm1'],
    ],
  )
})
