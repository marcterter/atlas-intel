import { test } from 'node:test'
import assert from 'node:assert/strict'
import { BASE_FOODS, QUICK_PRESETS, searchFoods } from '../src/data/foods.ts'
import { kcalFromMacros } from '../src/lib/nutrition.ts'

test('resto : plats à la pièce trouvés par leur nom ou par « resto », valeurs cohérentes (4/4/9)', () => {
  for (const q of ['california', 'nem', 'gyoza', 'rillettes', 'poulet roti', 'perle coco', 'brochette yakitori', 'escalope milanaise', 'carbonara', 'tiramisu']) {
    assert.ok(searchFoods(q, BASE_FOODS).length > 0, q)
  }
  const resto = BASE_FOODS.filter((f) => f.category === 'Resto & apéro')
  assert.ok(resto.length >= 15)
  assert.ok(searchFoods('resto', BASE_FOODS, 100).length >= resto.length, 'la catégorie se cherche')
  for (const f of resto) {
    const m = kcalFromMacros(f.per100) + 2 * (f.per100.fiber ?? 0)
    assert.ok(Math.abs(m - f.per100.kcal) <= f.per100.kcal * 0.06 + 3, `${f.name} : ${f.per100.kcal} kcal pour ${m} par les macros`)
    assert.ok((f.portions ?? []).length > 0, `${f.name} : une pièce à compter`)
  }
  assert.ok(BASE_FOODS.find((f) => f.name === 'Chips')?.portions?.some((p) => p.label === '1 bol apéro'))
})

test('ajout rapide : repères resto cohérents (kcal ≈ macros)', () => {
  assert.ok(QUICK_PRESETS.length >= 6)
  for (const p of QUICK_PRESETS) assert.ok(Math.abs(kcalFromMacros(p) - p.kcal) <= 30, `${p.label} : ${p.kcal} kcal pour ${kcalFromMacros(p)} par les macros`)
})
