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
  /** Ancien choix d'activité : utilisé seulement si les pas ne sont pas connus. */
  activity: Activity
  goal: Goal
  /** Pas par jour en moyenne (déclaré ; l'app prend ta vraie moyenne dès qu'elle en a assez). */
  stepsPerDay?: number | null
  /** Séances de sport par semaine. */
  sessionsPerWeek?: number | null
  /** Ton projet en quelques mots (prochaine phase, échéance, coach…) : lu chaque lundi par l'agent IA. */
  projet?: string
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
  /** Cardio prescrit par le coach, tel qu'il l'a écrit (« 60 min zone 2 »). */
  cardioNote?: string | null
}

export type CardioIntensity = 'zone2' | 'modere' | 'intense'

/** Cardio noté en deux gestes depuis Aujourd'hui (en plus du cardio des séances). */
export interface CardioEntry {
  id: string
  date: ISODate
  /** Activité : « Marche inclinée », « Vélo »… ou texte libre. */
  type: string
  minutes: number
  intensity: CardioIntensity | null
  km: number | null
  kcal: number | null
  at: number
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
  /** RIR (répétitions en réserve) visé, donné par le coach. */
  rir?: string
}

export interface Routine {
  id: string
  name: string
  items: RoutineItem[]
  createdAt: number
  updatedAt: number
  /** Jour correspondant dans l'onglet Entraînement du coach (ex : "LUNDI"). */
  coachDay?: string
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

/**
 * Rattrapage : exercice compté pour une autre séance du programme (les bras de l'Upper faits avant
 * les jambes). Le script l'écrit sur la ligne de cette séance chez le coach.
 */
export interface CountFor {
  /** Jour du coach (« JEUDI ») et date de la séance rattrapée. */
  coachDay: string
  date: ISODate
  /** Nom de cette séance (« Upper B »). */
  session: string
  /** Exercice du programme sur la ligne duquel écrire : le même, ou celui qu'il remplace. */
  target: string
  targetId: string
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
  rir?: string
  /** Rattrapage choisi (null : compté dans cette séance ; absent : choix automatique). */
  pour?: CountFor | null
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
  coachDay?: string | null
  /** Séance reprise du sheet du coach (historique) : jamais renvoyée vers le sheet. */
  imported?: boolean
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
  /** Nombre de parts que donne la recette. */
  portions: number
  /** Nom d'une part, au singulier : « pancake », « part », « tranche » (défaut : « portion »). */
  portionName?: string
  /** Poids du plat cuit, pour peser sa part en grammes (sinon : poids des ingrédients). */
  cookedGrams?: number | null
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

/** Suivi quotidien demandé par le coach (échelles du sheet « Suivi journalier »). */
export interface DayLog {
  date: ISODate
  /** Heures de sommeil */
  sleepH: number | null
  /** Qualité du sommeil, 1 à 10 */
  sleepQ: number | null
  energy: number | null
  motivation: number | null
  satiety: number | null
  /** 0 = pas été aux toilettes, 1-7 = échelle de Bristol */
  digestion: number | null
  waterL: number | null
  note: string
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
  /** Lien du Google Sheet du coach (inséré dans le script copié depuis l'app). */
  coachUrl: string
  enabled: boolean
  lastPushAt: number | null
  lastPullAt: number | null
  lastError: string | null
  /** Version du script Apps Script installé (renvoyée par le script), pour signaler une mise à jour. */
  scriptVersion?: number | null
  /** Empreinte du dernier contexte envoyé pour l'agent IA : renvoyé dès qu'il change, même sans autre donnée. */
  contexteKey?: string | null
}

export interface AiAdvice {
  /** Lundi de la semaine analysée. */
  semaine: ISODate
  /** Date de génération (ISO). */
  date: string
  /** Texte en Markdown simple (## titres, - puces, **gras**). */
  texte: string
  /** Conseils par exercice, affichés dans la séance sous l'objectif du jour. */
  exercices?: { nom: string; conseil: string }[]
}

export interface ReviewDecision {
  decision: 'applied' | 'kept' | 'seen'
  deltaKcal: number
  /** Poids moyen de la semaine et variation, pour l'historique. */
  avg: number | null
  deltaKg: number | null
  at: number
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
  daylogs: Record<ISODate, DayLog>
  /** Bilans du lundi déjà tranchés (clé : le lundi). */
  reviews: Record<ISODate, ReviewDecision>
  cardio: CardioEntry[]
  /** Derniers conseils de l'agent IA du lundi (récupérés depuis le sheet). */
  conseils: AiAdvice | null
  /** Semaine (lundi) dont les conseils ont été lus et masqués. */
  conseilsVus: ISODate | null
  /** Jour forcé en "entraînement" (true) ou "repos" (false) pour les objectifs. */
  dayType: Record<ISODate, boolean>
  sync: SyncConfig
  dirty: DirtyState
}
