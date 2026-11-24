// Agent IA du lundi : jeton limité (lire la semaine, déposer des conseils) et contexte envoyé au sheet.
import { findExercise, MUSCLE_LABEL, normalize } from '../data/exercises.ts'
import { addDays } from './date.ts'
import { GOALS, ageFrom } from './nutrition.ts'
import { latestWeight } from './body.ts'
import { setLabel, setsByMuscle } from './training.ts'
import type { AiAdvice, AppData, ISODate, ProgramChange, ProgramChangeType } from './types.ts'

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

/** Même exercice ou même séance à l'écriture près : sans accents ni casse, mots dans n'importe quel ordre. */
export function sameName(a: string, b: string): boolean {
  if (normalize(a) === normalize(b)) return true
  const wa = words(a)
  return !!wa && wa === words(b)
}

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
  const programme = parseProgramChanges((c as { programme?: unknown }).programme)
  return { semaine, date: String(c.date ?? ''), texte, exercices, ...(programme.length ? { programme } : {}) }
}

const CHANGE_TYPES: ProgramChangeType[] = ['series', 'reps', 'rir', 'ajouter', 'retirer', 'remplacer']

/** Changements de programme renvoyés par le script, gardés seulement s'ils sont complets. */
export function parseProgramChanges(raw: unknown): ProgramChange[] {
  if (!Array.isArray(raw)) return []
  const txt = (v: unknown) => (v == null ? '' : String(v).trim())
  const out: ProgramChange[] = []
  for (const x of raw as Record<string, unknown>[]) {
    if (!x || typeof x !== 'object') continue
    const type = txt(x.type) as ProgramChangeType
    const c: ProgramChange = { type, seance: txt(x.seance), exercice: txt(x.exercice), pourquoi: txt(x.pourquoi) }
    const series = Math.round(Number(x.series))
    if (series >= 1 && series <= 10) c.series = series
    for (const k of ['reps', 'rir', 'par', 'apres', 'muscle'] as const) if (txt(x[k])) c[k] = txt(x[k])
    if (!CHANGE_TYPES.includes(type) || !c.seance || !c.exercice) continue
    if ((type === 'series' && !c.series) || (type === 'reps' && !c.reps) || (type === 'rir' && !c.rir) || (type === 'remplacer' && !c.par)) continue
    out.push(c)
  }
  return out.slice(0, 8)
}

function volumeByMuscle(sessions: AppData['sessions'], custom: AppData['customExercises'], today: ISODate) {
  const week = setsByMuscle(sessions, today, 7, custom)
  const month = setsByMuscle(sessions, today, 28, custom)
  const out: Record<string, { semaine: number; moyenne4sem: number }> = {}
  for (const [m, n] of month) {
    if (m === 'cardio') continue
    out[MUSCLE_LABEL[m]] = { semaine: week.get(m) ?? 0, moyenne4sem: Math.round((n / 4) * 10) / 10 }
  }
  return out
}

/** Une note écrite dans l'app, telle que l'agent la reçoit. */
export interface AgentNote {
  date: ISODate
  /** Où elle a été écrite : « Ressenti du jour », « Séance Lower B », « Curl marteau · Lower B », « Bilan ». */
  ou: string
  texte: string
  /** Note d'exercice : les séries faites ce jour-là (« 14 × 10, 14 × 9 »), pour relier la note à la perf. */
  series?: string
}

const NOTE_MAX = 300
/** Le contexte tient dans une seule cellule du sheet (50 000 caractères au plus) : on reste très en dessous. */
const NOTES_BUDGET = 6000

const clip = (t: string) => {
  const x = t.trim().replace(/\s+/g, ' ')
  return x.length > NOTE_MAX ? `${x.slice(0, NOTE_MAX - 1)}…` : x
}

/**
 * Tout ce que tu as écrit ces dernières semaines, du plus récent au plus ancien : notes de séance et
 * d'exercice, ressenti du jour, bilans. L'agent du lundi s'appuie dessus (douleur, fatigue, machine prise…).
 */
export function recentNotes(s: Pick<AppData, 'sessions' | 'daylogs' | 'checkins' | 'customExercises'>, today: ISODate, days = 28): AgentNote[] {
  const since = addDays(today, -days)
  const inRange = (d: ISODate) => d >= since && d <= today
  const all: AgentNote[] = []
  const sessions = s.sessions.filter((x) => !x.imported && inRange(x.date)).sort((a, b) => a.startedAt - b.startedAt)
  for (const x of sessions) {
    if (x.note?.trim()) all.push({ date: x.date, ou: `Séance ${x.name}`, texte: clip(x.note) })
    for (const ex of x.exercises) {
      if (!ex.note?.trim()) continue
      const exo = findExercise(ex.exerciseId, s.customExercises)
      const series = ex.sets
        .filter((st) => st.done)
        .map((st) => setLabel(st, exo.kind))
        .join(', ')
      all.push({
        date: x.date,
        ou: `${exo.name} · ${x.name}${ex.pour ? ` (rattrapage ${ex.pour.session})` : ''}`,
        texte: clip(ex.note),
        ...(series ? { series } : {}),
      })
    }
  }
  for (const log of Object.values(s.daylogs)) {
    if (inRange(log.date) && log.note?.trim()) all.push({ date: log.date, ou: 'Ressenti du jour', texte: clip(log.note) })
  }
  for (const c of s.checkins) {
    if (inRange(c.date) && c.note?.trim()) all.push({ date: c.date, ou: 'Bilan', texte: clip(c.note) })
  }
  // Du plus récent au plus ancien (tri stable : dans une journée, les séances gardent leur ordre).
  all.sort((a, b) => b.date.localeCompare(a.date))
  const out: AgentNote[] = []
  let size = 0
  for (const n of all) {
    size += n.ou.length + n.texte.length + (n.series?.length ?? 0)
    if (size > NOTES_BUDGET) break
    out.push(n)
  }
  return out
}

/** Ce que l'agent doit savoir en plus des chiffres du jour : objectif, cibles, programme, tes notes. */
export function buildContexte(
  s: Pick<AppData, 'profile' | 'targets' | 'routines' | 'customExercises' | 'weighins' | 'sessions' | 'daylogs' | 'checkins' | 'programmeVu'>,
  today: ISODate,
) {
  const w = latestWeight(s.weighins)
  return {
    objectif: GOALS[s.profile.goal].label,
    // Ce que tu vises, en tes mots (Profil → Mon profil → Mon projet).
    projet: s.profile.projet?.trim() ? clip(s.profile.projet).slice(0, NOTE_MAX) : null,
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
    // Tes séances dans l'app, avec les noms exacts que l'agent reprend pour proposer des changements.
    programme: s.routines.map((r) => ({
      seance: r.name,
      jourCoach: r.coachDay ?? null,
      comptePour: r.countsFor ?? null,
      exercices: r.items.map((it) => {
        const exo = findExercise(it.exerciseId, s.customExercises)
        return { nom: exo.name, muscle: MUSCLE_LABEL[exo.muscle], series: it.sets, reps: it.reps || null, rir: it.rir || null, ...(it.superset ? { superset: it.superset } : {}) }
      }),
    })),
    // Séries effectives par muscle : les 7 derniers jours et la moyenne des 4 dernières semaines.
    volumeParMuscle: volumeByMuscle(s.sessions, s.customExercises, today),
    // Ce que tu as fait de ses changements de programme ces 5 dernières semaines (appliqués ou ignorés).
    decisionsProgramme: Object.entries(s.programmeVu ?? {})
      .filter(([k]) => k.slice(0, 10) >= addDays(today, -35))
      .map(([k, etat]) => {
        const [type, seance, exercice, series, reps, rir, par] = JSON.parse(k.slice(11)) as (string | number | null)[]
        return { semaine: k.slice(0, 10), etat: etat === 'applique' ? 'appliqué' : 'ignoré', type, seance, exercice, series, reps, rir, par }
      }),
    notes: recentNotes(s, today),
  }
}
