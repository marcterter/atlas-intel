// Dépense énergétique : estimation (métabolisme de base × pas et séances), puis mesure réelle
// à partir de ce que tu manges et de la courbe de ton poids (le vrai « métabolisme rapide »).
import { activityFactor, ACTIVITY, bmr, GOALS, macrosFor } from './nutrition.ts'
import { addDays, diffDays } from './date.ts'
import { fmt } from './format.ts'
import type { FoodEntry, Goal, ISODate, MacroTargets, Profile, Routine, Session, StepsDay, WeighIn } from './types.ts'

/** kcal stockées / déstockées par kg de poids (mélange gras + eau + glycogène). */
export const KCAL_PER_KG = 7700

export interface ActivityLevel {
  steps: number | null
  stepsFrom: 'app' | 'profil' | null
  sessions: number | null
  sessionsFrom: 'profil' | 'app' | 'programme' | null
}

/**
 * Pas : ta vraie moyenne des 14 derniers jours dès qu'il y en a 7 enregistrés, sinon ce que tu as indiqué.
 * Séances : ce que tu as indiqué, sinon ta moyenne dans l'app (dès 2 semaines d'utilisation), sinon le
 * nombre de séances du programme de ton coach.
 */
export function activityLevel(profile: Profile, steps: StepsDay[], routines: Routine[], today: ISODate, sessions: Session[] = []): ActivityLevel {
  let s: number | null = null
  let stepsFrom: ActivityLevel['stepsFrom'] = null
  const from = addDays(today, -14)
  const recent = steps.filter((x) => x.date >= from && x.date < today && x.steps > 0)
  if (recent.length >= 7) {
    s = Math.round(recent.reduce((a, x) => a + x.steps, 0) / recent.length / 100) * 100
    stepsFrom = 'app'
  } else if (profile.stepsPerDay) {
    s = profile.stepsPerDay
    stepsFrom = 'profil'
  }
  let n: number | null = null
  let sessionsFrom: ActivityLevel['sessionsFrom'] = null
  const real = sessions.filter((x) => !x.imported && x.date < today)
  const first = real.reduce<ISODate | null>((a, x) => (!a || x.date < a ? x.date : a), null)
  const used = first ? Math.min(28, diffDays(first, today)) : 0
  const coachDays = new Set(routines.map((r) => r.coachDay).filter(Boolean)).size
  if (profile.sessionsPerWeek != null) {
    n = profile.sessionsPerWeek
    sessionsFrom = 'profil'
  } else if (used >= 14) {
    const count = real.filter((x) => x.date >= addDays(today, -used)).length
    n = Math.round(((count / used) * 7) * 2) / 2
    sessionsFrom = 'app'
  } else if (coachDays) {
    n = coachDays
    sessionsFrom = 'programme'
  }
  return { steps: s, stepsFrom, sessions: n, sessionsFrom }
}

export interface Estimate {
  bmr: number
  factor: number
  tdee: number
  /** Le calcul repose sur l'ancien choix d'activité (pas inconnus). */
  legacy: boolean
}

export function estimateEnergy(profile: Profile, weightKg: number, level: ActivityLevel, today = new Date()): Estimate {
  const b = bmr(profile, weightKg, today)
  const factor = activityFactor(level.steps, level.sessions, profile.activity)
  return { bmr: Math.round(b), factor, tdee: Math.round(b * factor), legacy: level.steps == null }
}

export interface Measured {
  tdee: number
  /** Apport moyen des jours complets. */
  intake: number
  kgPerWeek: number
  foodDays: number
  weighins: number
  spanDays: number
  confidence: 'moyenne' | 'bonne'
}

export interface MeasureProgress {
  foodDays: number
  weighins: number
  spanDays: number
}

export const MEASURE_NEEDS = { foodDays: 10, weighins: 8, spanDays: 14 }

/**
 * Dépense réelle sur les 4 dernières semaines : apport moyen des journées complètes (≥ 1 200 kcal)
 * moins la variation de poids (pente des pesées, 7 700 kcal par kg). Il faut 10 journées complètes
 * et 8 pesées étalées sur 2 semaines au moins.
 */
export function measureTdee(entries: FoodEntry[], weighins: WeighIn[], today: ISODate, windowDays = 28): { ok: true; value: Measured } | { ok: false; progress: MeasureProgress } {
  const from = addDays(today, -windowDays)
  const perDay = new Map<ISODate, number>()
  for (const e of entries) if (e.date >= from && e.date < today) perDay.set(e.date, (perDay.get(e.date) ?? 0) + e.n.kcal)
  const food = [...perDay.values()].filter((k) => k >= 1200 && k <= 7000)
  const ws = weighins.filter((w) => w.date >= from && w.date <= today).sort((a, b) => a.date.localeCompare(b.date))
  const spanDays = ws.length >= 2 ? diffDays(ws[0].date, ws[ws.length - 1].date) : 0
  const progress = { foodDays: food.length, weighins: ws.length, spanDays }
  if (food.length < MEASURE_NEEDS.foodDays || ws.length < MEASURE_NEEDS.weighins || spanDays < MEASURE_NEEDS.spanDays) return { ok: false, progress }

  // Pente des pesées (moindres carrés) : moins sensible à l'eau qu'un simple « dernier − premier ».
  const xs = ws.map((w) => diffDays(from, w.date))
  const ys = ws.map((w) => w.kg)
  const mx = xs.reduce((a, b) => a + b, 0) / xs.length
  const my = ys.reduce((a, b) => a + b, 0) / ys.length
  let num = 0
  let den = 0
  for (let i = 0; i < xs.length; i++) {
    num += (xs[i] - mx) * (ys[i] - my)
    den += (xs[i] - mx) ** 2
  }
  const slope = den > 0 ? num / den : 0 // kg par jour
  const intake = food.reduce((a, b) => a + b, 0) / food.length
  const value = intake - slope * KCAL_PER_KG
  if (!(value > 1200 && value < 6000)) return { ok: false, progress }
  return {
    ok: true,
    value: {
      tdee: Math.round(value / 10) * 10,
      intake: Math.round(intake / 10) * 10,
      kgPerWeek: Math.round(slope * 7 * 100) / 100,
      foodDays: food.length,
      weighins: ws.length,
      spanDays,
      confidence: food.length >= 18 && ws.length >= 12 && spanDays >= 21 ? 'bonne' : 'moyenne',
    },
  }
}

export interface GoalPlan {
  goal: Goal
  label: string
  targets: MacroTargets
  /** Variation de poids attendue (kg / semaine). */
  kgPerWeek: number
}

/** Maintien, sèche et prise de masse pour une dépense donnée. */
export function goalPlans(tdeeKcal: number, weightKg: number): GoalPlan[] {
  return (['seche', 'maintien', 'prise'] as Goal[]).map((goal) => {
    const targets = macrosFor(tdeeKcal * GOALS[goal].kcalFactor, goal, weightKg)
    return { goal, label: GOALS[goal].label, targets, kgPerWeek: Math.round((((targets.kcal - tdeeKcal) * 7) / KCAL_PER_KG) * 100) / 100 }
  })
}

export function activityText(level: ActivityLevel, profile: Profile): string {
  if (level.steps == null) return `activité « ${ACTIVITY[profile.activity].label} » (indique tes pas dans ton profil pour affiner)`
  const steps = `${fmt(level.steps)} pas/j${level.stepsFrom === 'app' ? ' (ta moyenne sur 14 j)' : ''}`
  const from = level.sessionsFrom === 'programme' ? ' (programme du coach)' : level.sessionsFrom === 'app' ? ' (ta moyenne dans l’app)' : ''
  const sessions = level.sessions != null ? `${String(level.sessions).replace('.', ',')} séance${level.sessions > 1 ? 's' : ''}/sem${from}` : 'séances non renseignées'
  return `${steps} · ${sessions}`
}

const r5 = (x: number) => Math.round(x / 5) * 5
const r10 = (x: number) => Math.round(x / 10) * 10

/**
 * Répartit un objectif moyen en Jour ON / Jour OFF, sans changer la moyenne de la semaine :
 * protéines et lipides identiques, un écart de ~20 % des kcal pris sur les glucides (comme ton coach :
 * 2 640 / 2 140 kcal pour une moyenne de ~2 430).
 */
export function splitOnOff(avg: MacroTargets, sessionsPerWeek: number): { on: MacroTargets; off: MacroTargets } {
  const n = Math.min(6, Math.max(1, Math.round(sessionsPerWeek)))
  const gap = r5((avg.kcal * 0.2) / 4) // grammes de glucides d'écart entre ON et OFF
  const up = r5((gap * (7 - n)) / 7)
  const down = Math.min(gap - up, Math.max(0, avg.carbs - 50))
  return {
    on: { ...avg, kcal: r10(avg.kcal + up * 4), carbs: avg.carbs + up },
    off: { ...avg, kcal: r10(avg.kcal - down * 4), carbs: avg.carbs - down },
  }
}

/** Jour OFF proposé à partir du Jour ON : mêmes protéines et lipides, ~20 % de kcal en moins sur les glucides. */
export function defaultOff(on: MacroTargets): MacroTargets {
  const cut = Math.min(r5((on.kcal * 0.2) / 4), Math.max(0, on.carbs - 50))
  return { ...on, kcal: r10(on.kcal - cut * 4), carbs: on.carbs - cut }
}
