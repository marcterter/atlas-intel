import { EXERCISES, findExercise, normalize } from '../data/exercises.ts'
import { findBaseFood } from '../data/foods.ts'
import { recipePer100, recipeTotals, targetsFor } from '../lib/nutrition.ts'
import { fromISO, todayISO } from '../lib/date.ts'
import type { Exercise, Food, ISODate, MacroTargets, Recipe, Routine } from '../lib/types.ts'
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

const WEEKDAY: Record<string, number> = { dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6 }

/** Jours de la semaine prévus par le programme du coach (séances liées à LUNDI, MARDI…). */
export function plannedWeekdays(routines: Routine[]): Set<number> {
  const out = new Set<number>()
  for (const r of routines) {
    const d = WEEKDAY[normalize(r.coachDay ?? '')]
    if (d != null) out.add(d)
  }
  return out
}

type DayState = Pick<State, 'dayType' | 'sessions' | 'active' | 'routines' | 'customExercises'>
export type DaySource = 'manuel' | 'seance' | 'programme' | 'aucune'

/**
 * Jour ON (entraînement) ou OFF, sans le choix manuel : ON si une séance de muscu est faite ce jour-là,
 * ou, pour aujourd'hui et les jours à venir, si le programme du coach prévoit une séance ce jour de la semaine.
 */
export function autoDay(s: Omit<DayState, 'dayType'>, date: ISODate, today = todayISO()): { on: boolean; source: DaySource } {
  const trained = [...s.sessions, ...(s.active ? [s.active] : [])].some(
    (x) => x.date === date && x.exercises.some((e) => findExercise(e.exerciseId, s.customExercises).kind !== 'cardio'),
  )
  if (trained) return { on: true, source: 'seance' }
  if (date >= today && plannedWeekdays(s.routines).has(fromISO(date).getDay())) return { on: true, source: 'programme' }
  return { on: false, source: 'aucune' }
}

/** D'où vient le type du jour (pour l'afficher) : choix manuel, séance faite, programme… */
export function daySource(s: DayState, date: ISODate): DaySource {
  if (date in s.dayType) return 'manuel'
  return autoDay(s, date).source
}

export function isTrainingDay(s: DayState, date: ISODate): boolean {
  if (date in s.dayType) return s.dayType[date]
  return autoDay(s, date).on
}

export function dayTargets(s: DayState & Pick<State, 'targets'>, date: ISODate): MacroTargets {
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
