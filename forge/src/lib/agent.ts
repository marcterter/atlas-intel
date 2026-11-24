// Agent IA du lundi : jeton limité (lire la semaine, déposer des conseils) et contexte envoyé au sheet.
import { findExercise, normalize } from '../data/exercises.ts'
import { addDays } from './date.ts'
import { GOALS, ageFrom } from './nutrition.ts'
import { latestWeight } from './body.ts'
import type { AiAdvice, AppData, ISODate } from './types.ts'

/** SHA-256("forge-ia:" + jeton) en base64 URL, 24 caractères : le même calcul que le script (tokenIa_). */
export async function tokenIa(token: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`forge-ia:${token}`)))
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').slice(0, 24)
}

/** Lien à donner à l'agent : l'URL du script avec le jeton limité (jamais le jeton principal). */
export async function agentLink(url: string, token: string): Promise<string> {
  return `${url}${url.includes('?') ? '&' : '?'}token=${await tokenIa(token)}`
}

const LINK_WORDS = new Set(['a', 'au', 'aux', 'la', 'le', 'les', 'l', 'de', 'du', 'des', 'd', 'en', 'et', 'avec', 'sur'])
const words = (name: string) =>
  normalize(name)
    .split(' ')
    .filter((w) => w && !LINK_WORDS.has(w))
    .sort()
    .join(' ')

/**
 * Conseil de l'agent pour cet exercice, pendant les deux semaines qui suivent son bilan : même nom
 * (sans accents ni casse), ou mêmes mots dans un autre ordre (« Développé couché smith »).
 */
export function exerciseAdviceFor(c: AiAdvice | null, exerciseName: string, today: ISODate): string | null {
  if (!c?.exercices?.length || today > addDays(c.semaine, 14)) return null
  const key = normalize(exerciseName)
  const exact = c.exercices.find((x) => normalize(x.nom) === key)
  if (exact) return exact.conseil
  const loose = words(exerciseName)
  return (loose && c.exercices.find((x) => words(x.nom) === loose)?.conseil) || null
}

/** Conseils renvoyés par le script (onglet « Conseils IA »), nettoyés ; null s'il n'y en a pas. */
export function parseConseils(raw: unknown): AiAdvice | null {
  if (!raw || typeof raw !== 'object') return null
  const c = raw as { semaine?: unknown; date?: unknown; texte?: unknown; exercices?: unknown }
  const semaine = String(c.semaine ?? '')
  const texte = String(c.texte ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(semaine) || !texte) return null
  const exercices = (Array.isArray(c.exercices) ? c.exercices : [])
    .map((x: { nom?: unknown; conseil?: unknown } | null) => ({ nom: String(x?.nom ?? '').trim(), conseil: String(x?.conseil ?? '').trim() }))
    .filter((x) => x.nom && x.conseil)
  return { semaine, date: String(c.date ?? ''), texte, exercices }
}

/** Ce que l'agent doit savoir en plus des chiffres du jour : objectif, cibles, programme. */
export function buildContexte(s: Pick<AppData, 'profile' | 'targets' | 'routines' | 'customExercises' | 'weighins'>, today: ISODate) {
  const w = latestWeight(s.weighins)
  return {
    objectif: GOALS[s.profile.goal].label,
    sexe: s.profile.sex === 'H' ? 'homme' : 'femme',
    age: ageFrom(s.profile.birthYear, new Date(`${today}T12:00:00`)),
    tailleCm: s.profile.heightCm,
    poids: w ? { kg: w.kg, date: w.date } : null,
    pasParJourDeclares: s.profile.stepsPerDay ?? null,
    seancesParSemaine: s.profile.sessionsPerWeek ?? null,
    objectifs: {
      jourOn: s.targets.base,
      jourOff: s.targets.rest,
      pas: s.targets.steps,
      fibres: s.targets.fiber,
      cardioCoach: s.targets.cardioNote ?? null,
    },
    programme: s.routines.map((r) => ({
      seance: r.name,
      jourCoach: r.coachDay ?? null,
      exercices: r.items.map((it) => `${findExercise(it.exerciseId, s.customExercises).name} · ${it.sets} × ${it.reps || '?'}${it.rir ? ` · RIR ${it.rir}` : ''}`),
    })),
  }
}
