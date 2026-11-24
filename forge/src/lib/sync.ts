// Synchronisation avec le Google Sheet via le script Apps Script (voir apps-script/Code.gs).
import { useStore, type State } from '../store/store.ts'
import { dayTargets, isTrainingDay } from '../store/selectors.ts'
import { findExercise, MUSCLE_LABEL } from '../data/exercises.ts'
import { dayTotals, MEAL_LABEL } from './nutrition.ts'
import { sessionDurationMs, sessionTonnage, sessionWorkSets, setLabel } from './training.ts'
import { formatPerf, progressLabel, type CoachProgram } from './coach.ts'
import { cardioMinutes, cardioText, dayCardio } from './cardio.ts'
import { buildContexte, parseConseils } from './agent.ts'
import { weekAverage } from './body.ts'
import { addDays, todayISO } from './date.ts'
import type { DirtyState, ISODate, Session, StepsDay } from './types.ts'

const r1 = (n: number) => Math.round(n * 10) / 10

/** Version de apps-script/Code.gs livrée avec cette version de l'app. */
export const SCRIPT_VERSION = 9

export function scriptOutdated(s: Pick<State, 'sync'>): boolean {
  return s.sync.scriptVersion != null && s.sync.scriptVersion < SCRIPT_VERSION
}

export interface SyncResult {
  ok: boolean
  pushed: number
  pulledSteps: number
  message: string
}

export function isConfigured(s: Pick<State, 'sync'>): boolean {
  return s.sync.enabled && /^https:\/\/script\.google(usercontent)?\.com\//.test(s.sync.url) && s.sync.token.length >= 12
}

export function buildDay(s: State, date: ISODate) {
  const n = dayTotals(s.entries, date)
  const hasFood = s.entries.some((e) => e.date === date)
  const t = dayTargets(s, date)
  const w = s.weighins.find((x) => x.date === date)
  const wk = weekAverage(s.weighins, date)
  const st = s.steps.find((x) => x.date === date)
  const sessions = s.sessions.filter((x) => x.date === date && !x.imported)
  const log = s.daylogs[date]
  // Séances de musculation (nom) et cardio (minutes) séparés, comme dans le sheet du coach.
  const training = sessions.filter((x) => x.exercises.some((e) => findExercise(e.exerciseId, s.customExercises).kind !== 'cardio'))
  // Cardio noté depuis Aujourd'hui + cardio des séances ; le détail (lequel) part dans la note du jour.
  const cardio = dayCardio(s, date)
  const cardioMin = cardioMinutes(cardio)
  const cardioDetail = cardioText(cardio)
  return {
    date,
    poids: w ? w.kg : null,
    poidsMoyenSemaine: wk.avg != null ? Math.round(wk.avg * 100) / 100 : null,
    sommeil: log?.sleepH ?? null,
    qualiteSommeil: log?.sleepQ ?? null,
    energie: log?.energy ?? null,
    motivation: log?.motivation ?? null,
    satiete: log?.satiety ?? null,
    digestion: log?.digestion ?? null,
    eau: log?.waterL ?? null,
    notes: [log?.note?.trim() ?? '', cardioDetail ? `Cardio : ${cardioDetail}` : ''].filter(Boolean).join(' · '),
    entrainement: training.map((x) => x.name).join(' + '),
    cardio: cardioMin || null,
    cardioDetail,
    kcal: hasFood ? Math.round(n.kcal) : null,
    proteines: hasFood ? r1(n.protein) : null,
    glucides: hasFood ? r1(n.carbs) : null,
    lipides: hasFood ? r1(n.fat) : null,
    fibres: hasFood ? r1(n.fiber ?? 0) : null,
    objectifKcal: t.kcal,
    objectifProteines: t.protein,
    objectifGlucides: t.carbs,
    objectifLipides: t.fat,
    pas: st ? st.steps : null,
    pasMaj: st ? st.at : null,
    objectifPas: s.targets.steps,
    seance: sessions.map((x) => x.name).join(' + '),
    tonnage: sessions.length ? Math.round(sessions.reduce((a, x) => a + sessionTonnage(x, s.customExercises), 0)) : null,
    dureeSeanceMin: sessions.length ? Math.round(sessions.reduce((a, x) => a + sessionDurationMs(x), 0) / 60000) : null,
    typeJour: isTrainingDay(s, date) ? 'entrainement' : 'repos',
    repas: s.entries
      .filter((e) => e.date === date)
      .sort((a, b) => a.createdAt - b.createdAt)
      .map((e) => ({
        repas: MEAL_LABEL[e.meal],
        aliment: e.name,
        marque: e.brand ?? '',
        quantite: e.grams ? Math.round(e.grams) : null,
        portion: e.portionLabel ?? '',
        kcal: Math.round(e.n.kcal),
        proteines: r1(e.n.protein),
        glucides: r1(e.n.carbs),
        lipides: r1(e.n.fat),
      })),
  }
}

export function buildSession(s: State, x: Session) {
  return {
    id: x.id,
    date: x.date,
    nom: x.name,
    debut: new Date(x.startedAt).toISOString(),
    dureeMin: Math.round(sessionDurationMs(x) / 60000),
    tonnage: Math.round(sessionTonnage(x, s.customExercises)),
    series: sessionWorkSets(x),
    note: x.note ?? '',
    jourCoach: x.coachDay ?? '',
    exercices: x.exercises.map((ex) => {
      const exo = findExercise(ex.exerciseId, s.customExercises)
      const work = ex.sets.filter((st) => st.done)
      return {
        nom: exo.name,
        groupe: MUSCLE_LABEL[exo.muscle],
        resume: work.map((st) => setLabel(st, exo.kind)).join(', '),
        perf: formatPerf(ex.sets, exo.kind),
        // Un rattrapage se compare à la même séance (jour du coach) que celle qu'il rattrape.
        progres: progressLabel(ex, exo.kind, s.sessions.filter((y) => y.id !== x.id), x.startedAt, ex.pour?.coachDay ?? x.coachDay),
        // Exercice prévu par le coach, si celui-ci l'a remplacé (machine prise…) : le script écrit sur sa ligne.
        remplace: ex.replacedFrom ? findExercise(ex.replacedFrom, s.customExercises).name : '',
        rir: ex.rir ?? '',
        note: ex.note ?? '',
        // Rattrapage : le script écrit cet exercice sur la ligne de la séance rattrapée (script v9).
        pour: ex.pour ? { jourCoach: ex.pour.coachDay, date: ex.pour.date, exercice: ex.pour.target, seance: ex.pour.session } : null,
        series: work.map((st, i) => ({
          n: i + 1,
          type: st.type,
          charge: st.weight,
          reps: st.reps,
          duree: st.seconds,
          km: st.km,
          kcal: st.kcal,
        })),
      }
    }),
  }
}

export function buildPayload(s: State, snap: DirtyState) {
  // Le jour de chaque séance envoyée part aussi : le script y note les exercices hors programme.
  const dates = new Set(Object.keys(snap.days))
  for (const id of Object.keys(snap.sessions)) {
    const x = s.sessions.find((y) => y.id === id)
    if (x && !x.imported) dates.add(x.date)
  }
  const days = [...dates].sort().map((d) => buildDay(s, d))
  const sessions = Object.keys(snap.sessions)
    .filter((id) => !s.sessions.find((y) => y.id === id)?.imported)
    .map((id) => {
      const x = s.sessions.find((y) => y.id === id)
      return x ? buildSession(s, x) : { id, deleted: true }
    })
  const bilans = Object.keys(snap.checkins).map((id) => {
    const c = s.checkins.find((y) => y.id === id)
    if (!c) return { id, deleted: true }
    return { id: c.id, date: c.date, mensurations: c.measures, note: c.note ?? '', photos: Object.keys(c.photos).length }
  })
  // Contexte pour l'agent IA du lundi (objectif, cibles ON / OFF, programme) : petit, envoyé à chaque fois.
  return { days, sessions, bilans, contexte: buildContexte(s, todayISO()) }
}

async function post(url: string, body: unknown): Promise<Record<string, unknown>> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 45000)
  try {
    // text/plain : requête "simple", pas de pré-vol CORS (indispensable avec Apps Script)
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, signal: ctrl.signal, redirect: 'follow' })
    const text = await res.text()
    return parseResponse(text)
  } finally {
    clearTimeout(t)
  }
}

async function getAction(url: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 30000)
  try {
    const qs = new URLSearchParams(params).toString()
    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}${qs}`, { signal: ctrl.signal, redirect: 'follow' })
    return parseResponse(await res.text())
  } finally {
    clearTimeout(t)
  }
}

function parseResponse(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text)
  } catch {
    if (/accounts\.google\.com|ServiceLogin|Sign in/i.test(text)) {
      throw new Error('Le script demande une connexion Google : redéploie-le avec l’accès « Tout le monde ».')
    }
    throw new Error('Réponse inattendue du script (vérifie l’URL /exec).')
  }
}

export interface CoachInfo {
  ok: boolean
  nom?: string
  suivi?: boolean
  semaines?: number[]
  message?: string
  entrainementErreur?: string
}

export function describeCoach(c: CoachInfo | null | undefined): string {
  if (!c) return 'sheet du coach non renseigné dans le script'
  if (!c.ok) return c.message ?? 'sheet du coach inaccessible'
  const parts = [`coach : « ${c.nom ?? ''} »`]
  parts.push(c.suivi ? 'Suivi journalier ✓' : 'onglet Suivi journalier introuvable')
  if (c.entrainementErreur) parts.push(c.entrainementErreur)
  else parts.push(c.semaines?.length ? `Entraînement : semaine${c.semaines.length > 1 ? 's' : ''} ${c.semaines.join(', ')}` : 'aucun bloc « Semaine N » dans Entraînement')
  return parts.join(' · ')
}

export async function ping(url: string, token: string): Promise<{ ok: boolean; message: string; coach?: CoachInfo | null; version?: number }> {
  try {
    const r = await getAction(url, { action: 'ping', token })
    if (r.ok) {
      const coach = (r.coach as CoachInfo | null | undefined) ?? null
      const version = Number(r.version) || 0
      const old = version < SCRIPT_VERSION ? ' · script à mettre à jour (voir le guide)' : ''
      return { ok: true, coach, version, message: `Connecté à « ${String(r.sheet ?? '')} » · ${describeCoach(coach)}${old}` }
    }
    return { ok: false, message: String(r.error ?? 'Erreur inconnue') }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : 'Connexion impossible' }
  }
}

/** Lit le programme (onglet Entraînement) du sheet du coach. */
export async function fetchProgram(): Promise<CoachProgram> {
  const { url, token } = useStore.getState().sync
  const r = await getAction(url, { action: 'programme', token })
  if (!r.ok) throw new Error(String(r.error ?? 'Lecture du programme impossible'))
  return {
    semaine: Number(r.semaine) || 0,
    semaineActuelle: (r.semaineActuelle as number | null | undefined) ?? null,
    seances: (r.seances as CoachProgram['seances']) ?? [],
    historique: (r.historique as CoachProgram['historique']) ?? [],
    objectifs: (r.objectifs as CoachProgram['objectifs']) ?? null,
    phase: typeof r.phase === 'string' ? r.phase : null,
  }
}

/** Conseils de l'agent IA du lundi, déposés dans le sheet (scripts version 7 et plus ; sinon rien). */
async function pullConseils(url: string, token: string): Promise<void> {
  try {
    const r = await getAction(url, { action: 'conseils', token })
    const c = r.ok ? parseConseils(r.conseils) : null
    if (c) useStore.getState().setConseils(c)
  } catch {
    /* script ancien ou hors connexion : on réessaiera à la prochaine synchro */
  }
}

let running: Promise<SyncResult> | null = null

/** Récupère les pas envoyés par le Raccourci iOS puis envoie les modifications locales. */
export function syncNow(opts: { pullOnly?: boolean } = {}): Promise<SyncResult> {
  if (running) return running
  running = doSync(opts).finally(() => {
    running = null
  })
  return running
}

async function doSync({ pullOnly }: { pullOnly?: boolean }): Promise<SyncResult> {
  const st = useStore.getState()
  if (!isConfigured(st)) return { ok: false, pushed: 0, pulledSteps: 0, message: 'Synchronisation non configurée' }
  const { url, token } = st.sync
  let pulledSteps = 0
  try {
    const r = await getAction(url, { action: 'steps', token, since: addDays(todayISO(), -30) })
    if (!r.ok) throw new Error(String(r.error ?? 'Erreur'))
    const list = (r.steps as { date: string; steps: number; at: number }[] | undefined) ?? []
    const incoming: StepsDay[] = list
      .filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x.date) && Number.isFinite(Number(x.steps)))
      .map((x) => ({ date: x.date, steps: Math.round(Number(x.steps)), source: 'sante', at: Number(x.at) || 0 }))
    const before = useStore.getState().steps
    useStore.getState().mergeRemoteSteps(incoming)
    pulledSteps = incoming.filter((x) => {
      const old = before.find((b) => b.date === x.date)
      return !old || x.at > old.at
    }).length
    useStore.getState().setSync({ lastPullAt: Date.now(), lastError: null })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Connexion impossible'
    useStore.getState().setSync({ lastError: message })
    return { ok: false, pushed: 0, pulledSteps, message }
  }
  await pullConseils(url, token)
  if (pullOnly) return { ok: true, pushed: 0, pulledSteps, message: 'Pas à jour' }

  const state = useStore.getState()
  const snap: DirtyState = structuredClone(state.dirty)
  const count = Object.keys(snap.days).length + Object.keys(snap.sessions).length + Object.keys(snap.checkins).length
  if (count === 0) return { ok: true, pushed: 0, pulledSteps, message: 'Tout est à jour' }
  try {
    const payload = buildPayload(state, snap)
    const r = await post(url, { action: 'push', token, app: 'forge', version: 1, ...payload })
    if (!r.ok) throw new Error(String(r.error ?? 'Erreur'))
    useStore.getState().clearDirty(snap)
    const coach = r.coach as { ok?: boolean; message?: string; info?: string } | undefined
    const warn = coach && coach.ok === false ? ` (coach : ${coach.message ?? 'erreur'})` : ''
    const info = coach?.info ? ` · ${coach.info}` : ''
    // Les scripts d'avant la version 4 ne renvoient pas leur version à l'envoi.
    const scriptVersion = Number(r.version) || 0
    useStore.getState().setSync({ lastPushAt: Date.now(), lastError: warn ? warn.trim() : null, scriptVersion })
    const old = scriptVersion < SCRIPT_VERSION ? ' · script à mettre à jour' : ''
    return { ok: true, pushed: count, pulledSteps, message: `Synchronisé${warn}${info}${old}` }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Envoi impossible'
    useStore.getState().setSync({ lastError: message })
    return { ok: false, pushed: 0, pulledSteps, message }
  }
}

export function dirtyCount(s: Pick<State, 'dirty'>): number {
  return Object.keys(s.dirty.days).length + Object.keys(s.dirty.sessions).length + Object.keys(s.dirty.checkins).length
}
