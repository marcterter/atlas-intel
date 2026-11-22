// Modèle de données de l'app. Toutes les dates "jour" sont des dates locales au format AAAA-MM-JJ.
export type ISODate = string

export type Sex = 'H' | 'F'
export type Activity = 'sedentaire' | 'leger' | 'modere' | 'actif' | 'tres_actif'
export type Goal = 'seche' | 'maintien' | 'prise'

export interface Profile {
  name: string
  sex: Sex
  birthYear: number
  heightCm: number
  activity: Activity
  goal: Goal
}

export interface MacroTargets {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export interface Targets {
  /** Objectifs d'un jour standard (ou jour d'entraînement si `rest` est défini). */
  base: MacroTargets
  /** Objectifs des jours de repos, si le coach en donne de différents. */
  rest: MacroTargets | null
  steps: number
  fiber: number
}

export type Muscle =
  | 'pectoraux'
  | 'dos'
  | 'epaules'
  | 'biceps'
  | 'triceps'
  | 'avant_bras'
  | 'trapezes'
  | 'abdos'
  | 'lombaires'
  | 'quadriceps'
  | 'ischios'
  | 'fessiers'
  | 'adducteurs'
  | 'mollets'
  | 'cardio'

export type Equipment =
  | 'barre'
  | 'halteres'
  | 'machine'
  | 'poulie'
  | 'poids_du_corps'
  | 'kettlebell'
  | 'smith'
  | 'cardio'
  | 'autre'

/**
 * weight : charge × répétitions
 * bodyweight : répétitions (+ lest optionnel)
 * duration : durée en secondes (gainage…)
 * cardio : minutes, km, kcal
 */
export type ExerciseKind = 'weight' | 'bodyweight' | 'duration' | 'cardio'

export interface Exercise {
  id: string
  name: string
  muscle: Muscle
  equipment: Equipment
  kind: ExerciseKind
  custom?: boolean
}

export interface RoutineItem {
  uid: string
  exerciseId: string
  sets: number
  reps: string
  restSec: number
  superset: string | null
  note?: string
}

export interface Routine {
  id: string
  name: string
  items: RoutineItem[]
  createdAt: number
  updatedAt: number
}

export type SetType = 'normal' | 'echauffement' | 'degressive' | 'echec'

export interface SetEntry {
  id: string
  type: SetType
  weight: number | null
  reps: number | null
  seconds: number | null
  km: number | null
  kcal: number | null
  done: boolean
  doneAt?: number
}

export interface SessionExercise {
  uid: string
  exerciseId: string
  sets: SetEntry[]
  restSec: number
  repsTarget?: string
  superset: string | null
  note?: string
  replacedFrom?: string
}

export interface Session {
  id: string
  routineId: string | null
  name: string
  date: ISODate
  startedAt: number
  endedAt: number | null
  exercises: SessionExercise[]
  note?: string
}

export interface Nutrients {
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  salt?: number
}

export type FoodSource = 'base' | 'off' | 'perso' | 'recette'

export interface Portion {
  label: string
  grams: number
}

export interface Food {
  /** 'b:…' base intégrée, 'off:<code-barres>' Open Food Facts, 'p:…' aliment perso, 'r:…' recette */
  id: string
  name: string
  brand?: string
  source: FoodSource
  per100: Nutrients
  unit: 'g' | 'ml'
  portions?: Portion[]
  barcode?: string
  image?: string
  category?: string
}

export type MealId = 'petit_dej' | 'dejeuner' | 'collation' | 'diner'

export interface FoodEntry {
  id: string
  date: ISODate
  meal: MealId
  /** null pour un ajout rapide (kcal/macros saisis à la main) */
  foodId: string | null
  name: string
  brand?: string
  grams: number
  portionLabel?: string
  /** Valeurs pour la quantité consommée (figées au moment de l'ajout). */
  n: Nutrients
  createdAt: number
}

export interface RecipeIngredient {
  foodId: string
  name: string
  grams: number
  per100: Nutrients
}

export interface Recipe {
  id: string
  name: string
  portions: number
  ingredients: RecipeIngredient[]
  minutes?: number
  note?: string
  photoId?: string | null
  createdAt: number
  updatedAt: number
}

export interface WeighIn {
  date: ISODate
  kg: number
  at: number
}

export interface StepsDay {
  date: ISODate
  steps: number
  source: 'manuel' | 'sante'
  at: number
}

export type MeasureKey = 'taille' | 'hanches' | 'poitrine' | 'bras' | 'cuisse' | 'mollet' | 'cou'
export type PhotoPose = 'face' | 'profil' | 'dos'
export type RatingKey = 'energie' | 'sommeil' | 'faim' | 'stress' | 'digestion'

export interface CheckIn {
  id: string
  date: ISODate
  measures: Partial<Record<MeasureKey, number>>
  photos: Partial<Record<PhotoPose, string>>
  ratings: Partial<Record<RatingKey, number>>
  note?: string
  at: number
}

export interface Settings {
  defaultRestSec: number
  sound: boolean
  haptics: boolean
  keepAwake: boolean
  autoRest: boolean
  shortcutName: string
}

export interface SyncConfig {
  url: string
  token: string
  enabled: boolean
  lastPushAt: number | null
  lastPullAt: number | null
  lastError: string | null
}

/** Éléments modifiés depuis la dernière synchro (valeur = compteur de révision). */
export interface DirtyState {
  days: Record<ISODate, number>
  sessions: Record<string, number>
  checkins: Record<string, number>
}

export interface RestTimer {
  endsAt: number
  total: number
  exerciseUid: string | null
}

export interface AppData {
  version: 1
  onboarded: boolean
  profile: Profile
  targets: Targets
  settings: Settings
  routines: Routine[]
  sessions: Session[]
  active: Session | null
  restTimer: RestTimer | null
  customExercises: Exercise[]
  foods: Record<string, Food>
  favorites: string[]
  recents: string[]
  recipes: Recipe[]
  entries: FoodEntry[]
  weighins: WeighIn[]
  steps: StepsDay[]
  checkins: CheckIn[]
  /** Jour forcé en "entraînement" (true) ou "repos" (false) pour les objectifs. */
  dayType: Record<ISODate, boolean>
  sync: SyncConfig
  dirty: DirtyState
}
