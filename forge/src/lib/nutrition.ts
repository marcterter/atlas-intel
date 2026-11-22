import type { Activity, FoodEntry, Goal, ISODate, MacroTargets, MealId, Nutrients, Profile, Recipe, Targets } from './types.ts'

export const ACTIVITY: Record<Activity, { label: string; hint: string; factor: number }> = {
  sedentaire: { label: 'Sédentaire', hint: 'Bureau, peu de marche', factor: 1.2 },
  leger: { label: 'Légèrement actif', hint: '1-3 séances / semaine', factor: 1.375 },
  modere: { label: 'Actif', hint: '3-5 séances / semaine', factor: 1.55 },
  actif: { label: 'Très actif', hint: '6-7 séances / semaine', factor: 1.725 },
  tres_actif: { label: 'Extrêmement actif', hint: 'Travail physique + sport', factor: 1.9 },
}

export const GOALS: Record<Goal, { label: string; hint: string; kcalFactor: number; proteinPerKg: number }> = {
  seche: { label: 'Sèche', hint: 'Perdre du gras', kcalFactor: 0.82, proteinPerKg: 2.2 },
  maintien: { label: 'Maintien', hint: 'Recomposition', kcalFactor: 1, proteinPerKg: 2 },
  prise: { label: 'Prise de masse', hint: 'Prendre du muscle', kcalFactor: 1.1, proteinPerKg: 1.8 },
}

export const MEALS: { id: MealId; label: string }[] = [
  { id: 'petit_dej', label: 'Petit-déjeuner' },
  { id: 'dejeuner', label: 'Déjeuner' },
  { id: 'collation', label: 'Collation' },
  { id: 'diner', label: 'Dîner' },
]

export const MEAL_LABEL: Record<MealId, string> = Object.fromEntries(MEALS.map((m) => [m.id, m.label])) as Record<MealId, string>

/** Repas par défaut selon l'heure. */
export function mealForNow(d = new Date()): MealId {
  const h = d.getHours()
  if (h < 11) return 'petit_dej'
  if (h < 15) return 'dejeuner'
  if (h < 18) return 'collation'
  return 'diner'
}

export function ageFrom(birthYear: number, today = new Date()): number {
  return Math.max(14, today.getFullYear() - birthYear)
}

/** Métabolisme de base (Mifflin-St Jeor). */
export function bmr(p: Pick<Profile, 'sex' | 'heightCm' | 'birthYear'>, weightKg: number, today = new Date()): number {
  const age = ageFrom(p.birthYear, today)
  const base = 10 * weightKg + 6.25 * p.heightCm - 5 * age
  return p.sex === 'H' ? base + 5 : base - 161
}

/**
 * Coefficient d'activité. Avec les pas : 1,2 (journée assise, ~3 000 pas) + les pas au-delà
 * (+0,025 par tranche de 1 000, plafonné à +0,4) + les séances (+0,03 chacune par semaine, max +0,21).
 * Ex. : 15 000 pas et 4 séances → 1,62. Sans les pas : l'ancien choix d'activité.
 */
export function activityFactor(steps: number | null | undefined, sessionsPerWeek: number | null | undefined, legacy: Activity): number {
  if (steps == null || !(steps > 0)) return ACTIVITY[legacy].factor
  const walk = Math.min(0.4, Math.max(0, (steps - 3000) * 0.000025))
  const training = Math.min(0.21, Math.max(0, (sessionsPerWeek ?? 0) * 0.03))
  return Math.round((1.2 + walk + training) * 1000) / 1000
}

/** Dépense estimée (kcal/j, arrondie : même valeur partout dans l'app). */
export function tdee(p: Profile, weightKg: number, today = new Date()): number {
  return Math.round(bmr(p, weightKg, today) * activityFactor(p.stepsPerDay, p.sessionsPerWeek, p.activity))
}

const round = (n: number, step: number) => Math.round(n / step) * step

/** Macros pour un total de kcal : protéines g/kg selon l'objectif, lipides ~0,9 g/kg (≥ 22 % des kcal), glucides = le reste. */
export function macrosFor(kcalRaw: number, goal: Goal, weightKg: number): MacroTargets {
  const kcal = round(kcalRaw, 10)
  const protein = round(weightKg * GOALS[goal].proteinPerKg, 5)
  const fat = round(Math.max(weightKg * 0.9, (kcal * 0.22) / 9), 5)
  const carbs = Math.max(0, round((kcal - protein * 4 - fat * 9) / 4, 5))
  return { kcal, protein, carbs, fat }
}

/** Objectifs suggérés depuis le profil (dépense estimée × facteur de l'objectif). */
export function suggestTargets(p: Profile, weightKg: number, today = new Date()): MacroTargets {
  return macrosFor(tdee(p, weightKg, today) * GOALS[p.goal].kcalFactor, p.goal, weightKg)
}

/** Kcal issues des macros (4/4/9). */
export function kcalFromMacros(m: Pick<MacroTargets, 'protein' | 'carbs' | 'fat'>): number {
  return Math.round(m.protein * 4 + m.carbs * 4 + m.fat * 9)
}

export const ZERO: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }

export function scaleNutrients(per100: Nutrients, grams: number): Nutrients {
  const k = grams / 100
  return {
    kcal: per100.kcal * k,
    protein: per100.protein * k,
    carbs: per100.carbs * k,
    fat: per100.fat * k,
    fiber: (per100.fiber ?? 0) * k,
  }
}

export function addNutrients(a: Nutrients, b: Nutrients): Nutrients {
  return {
    kcal: a.kcal + b.kcal,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
    fiber: (a.fiber ?? 0) + (b.fiber ?? 0),
  }
}

export function sumNutrients(list: Nutrients[]): Nutrients {
  return list.reduce(addNutrients, { ...ZERO })
}

export function entriesOn(entries: FoodEntry[], date: ISODate): FoodEntry[] {
  return entries.filter((e) => e.date === date)
}

export function dayTotals(entries: FoodEntry[], date: ISODate): Nutrients {
  return sumNutrients(entriesOn(entries, date).map((e) => e.n))
}

export function mealTotals(entries: FoodEntry[], date: ISODate, meal: MealId): Nutrients {
  return sumNutrients(entries.filter((e) => e.date === date && e.meal === meal).map((e) => e.n))
}

/** Objectifs applicables à une journée (jour d'entraînement ou de repos si le coach différencie). */
export function targetsFor(targets: Targets, isTrainingDay: boolean): MacroTargets {
  if (!targets.rest || isTrainingDay) return targets.base
  return targets.rest
}

export function recipeTotals(r: Pick<Recipe, 'ingredients'>): { n: Nutrients; grams: number } {
  const n = sumNutrients(r.ingredients.map((i) => scaleNutrients(i.per100, i.grams)))
  const grams = r.ingredients.reduce((s, i) => s + i.grams, 0)
  return { n, grams }
}

/** Poids du plat fini : le poids cuit s'il a été pesé, sinon la somme des ingrédients. */
export function recipeYield(r: Pick<Recipe, 'ingredients' | 'cookedGrams'>): number {
  return r.cookedGrams && r.cookedGrams > 0 ? r.cookedGrams : recipeTotals(r).grams
}

/** Valeurs d'une recette ramenées à 100 g du plat fini (pour la stocker comme un aliment). */
export function recipePer100(r: Pick<Recipe, 'ingredients' | 'cookedGrams'>): Nutrients {
  const { n } = recipeTotals(r)
  const grams = recipeYield(r)
  if (grams <= 0) return { ...ZERO }
  return scaleNutrients(n, (100 / grams) * 100)
}

/**
 * Quantité notée en toutes lettres : « 1 pancake » × 3 → « 3 pancakes », « 1 œuf moyen » × 2 → « 2 œufs moyens »,
 * « 1 tranche de pain » × 2 → « 2 tranches de pain », × 1,5 → « 1,5 tranche de pain ».
 */
export function portionText(label: string, count: number): string {
  if (count === 1) return label
  const n = String(Math.round(count * 100) / 100).replace('.', ',')
  const m = label.match(/^1 (.+)$/)
  if (!m) return `${n} × ${label}`
  if (count < 2) return `${n} ${m[1]}`
  let stop = false
  const words = m[1].split(' ').map((w) => {
    if (stop || /^(de|du|des|à|au|aux|en|pour|sans)$/i.test(w) || /^d[’']/i.test(w) || /^[(\d]/.test(w)) {
      stop = true
      return w
    }
    return /^[\p{L}-]+$/u.test(w) && !/[sxz]$/i.test(w) ? `${w}s` : w
  })
  return `${n} ${words.join(' ')}`
}

/** Part de chaque macro dans les kcal (pour les barres empilées). */
export function macroSplit(n: Nutrients): { protein: number; carbs: number; fat: number } {
  const p = n.protein * 4
  const c = n.carbs * 4
  const f = n.fat * 9
  const total = p + c + f
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 }
  return { protein: p / total, carbs: c / total, fat: f / total }
}
