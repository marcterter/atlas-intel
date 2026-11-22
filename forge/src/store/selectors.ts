import { EXERCISES, findExercise } from '../data/exercises.ts'
import { findBaseFood } from '../data/foods.ts'
import { recipePer100, recipeTotals, targetsFor } from '../lib/nutrition.ts'
import type { Exercise, Food, ISODate, MacroTargets, Recipe } from '../lib/types.ts'
import { useStore, type State } from './store.ts'
import { useMemo } from 'react'

export function recipeAsFood(r: Recipe): Food {
  const { grams } = recipeTotals(r)
  const portion = r.portions > 0 ? grams / r.portions : grams
  return {
    id: `r:${r.id}`,
    name: r.name,
    source: 'recette',
    per100: recipePer100(r),
    unit: 'g',
    portions: portion > 0 ? [{ label: '1 portion', grams: Math.round(portion) }] : [],
    category: 'Mes recettes',
  }
}

export function getFood(s: Pick<State, 'foods' | 'recipes'>, id: string): Food | undefined {
  if (id.startsWith('b:')) return findBaseFood(id)
  if (id.startsWith('r:')) {
    const r = s.recipes.find((x) => `r:${x.id}` === id)
    return r ? recipeAsFood(r) : undefined
  }
  return s.foods[id]
}

export function isTrainingDay(s: Pick<State, 'dayType' | 'sessions' | 'active'>, date: ISODate): boolean {
  if (date in s.dayType) return s.dayType[date]
  return s.sessions.some((x) => x.date === date) || s.active?.date === date
}

export function dayTargets(s: Pick<State, 'dayType' | 'sessions' | 'active' | 'targets'>, date: ISODate): MacroTargets {
  return targetsFor(s.targets, isTrainingDay(s, date))
}

export function useAllExercises(): Exercise[] {
  const custom = useStore((s) => s.customExercises)
  return useMemo(() => [...EXERCISES, ...custom].sort((a, b) => a.name.localeCompare(b.name, 'fr')), [custom])
}

export function useExercise(id: string): Exercise {
  const custom = useStore((s) => s.customExercises)
  return findExercise(id, custom)
}

export function usePersoFoods(): Food[] {
  const foods = useStore((s) => s.foods)
  const recipes = useStore((s) => s.recipes)
  return useMemo(
    () => [...Object.values(foods).filter((f) => f.source === 'perso'), ...recipes.map(recipeAsFood)],
    [foods, recipes],
  )
}
