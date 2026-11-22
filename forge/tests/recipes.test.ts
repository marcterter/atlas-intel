import { test } from 'node:test'
import assert from 'node:assert/strict'
import { portionText, recipePer100, recipeYield } from '../src/lib/nutrition.ts'
import { recipeAsFood } from '../src/store/selectors.ts'
import type { Recipe } from '../src/lib/types.ts'

// Pancakes : 100 g de flocons d'avoine, 2 œufs (120 g), 200 g de lait, 30 g de whey → 8 pancakes, 380 g une fois cuits
const pancakes: Recipe = {
  id: 'p',
  name: 'Pancakes protéinés',
  portions: 8,
  portionName: 'pancake',
  ingredients: [
    { foodId: 'b:avoine', name: 'Flocons d’avoine', grams: 100, per100: { kcal: 372, protein: 13.5, carbs: 58.7, fat: 7, fiber: 10 } },
    { foodId: 'b:oeuf', name: 'Œuf', grams: 120, per100: { kcal: 140, protein: 12.5, carbs: 0.7, fat: 9.8, fiber: 0 } },
    { foodId: 'b:lait', name: 'Lait demi-écrémé', grams: 200, per100: { kcal: 46, protein: 3.3, carbs: 4.8, fat: 1.6, fiber: 0 } },
    { foodId: 'b:whey', name: 'Whey', grams: 30, per100: { kcal: 380, protein: 78, carbs: 6, fat: 6, fiber: 0 } },
  ],
  createdAt: 0,
  updatedAt: 0,
}

test('recette : choisie comme un aliment, par part nommée ou la recette entière', () => {
  const total = 372 + 168 + 92 + 114 // 746 kcal pour 450 g d'ingrédients
  const f = recipeAsFood(pancakes)
  assert.deepEqual(f.portions, [
    { label: '1 pancake', grams: 56.3 },
    { label: 'Recette entière', grams: 450 },
  ])
  assert.ok(Math.abs((f.per100.kcal * 450) / 100 - total) < 0.5)
  assert.equal(Math.round((f.per100.kcal * 56.3) / 100), 93, '≈ 93 kcal le pancake')
})

test('recette : avec le poids cuit, les 100 g sont ceux du plat fini (on pèse sa part)', () => {
  const cooked = { ...pancakes, cookedGrams: 380 }
  assert.equal(recipeYield(cooked), 380)
  assert.equal(Math.round(recipePer100(cooked).kcal), Math.round((746 / 380) * 100))
  const f = recipeAsFood(cooked)
  assert.deepEqual(f.portions, [
    { label: '1 pancake', grams: 47.5 },
    { label: 'Recette entière', grams: 380 },
  ])
  // Les kcal d'un pancake ne changent pas, seul son poids (cuit) change
  assert.equal(Math.round((f.per100.kcal * 380) / 100 / 8), Math.round(746 / 8))
})

test('libellé de la quantité notée : « 3 pancakes », « 1,5 portion »', () => {
  assert.equal(portionText('1 pancake', 3), '3 pancakes')
  assert.equal(portionText('1 pancake', 1), '1 pancake')
  assert.equal(portionText('1 portion', 1.5), '1,5 portion')
  assert.equal(portionText('1 c. à soupe', 2), '2 c. à soupe')
  assert.equal(portionText('1 œuf', 2), '2 œufs')
  assert.equal(portionText('1 œuf moyen', 2), '2 œufs moyens')
  assert.equal(portionText('1 gros œuf', 3), '3 gros œufs')
  assert.equal(portionText('1 tranche de pain', 2), '2 tranches de pain')
  assert.equal(portionText('1 portion (15 g)', 2), '2 portions (15 g)')
  assert.equal(portionText('Recette entière', 0.5), '0,5 × Recette entière')
  assert.equal(portionText('Recette entière', 1), 'Recette entière')
})
