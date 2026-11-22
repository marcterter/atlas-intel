// Passerelle avec le sheet du coach : format des performances, progression, import du programme.
import { normalize } from '../data/exercises.ts'
import { e1rm, previousSets } from './training.ts'
import { uid } from './id.ts'
import type { Equipment, Exercise, ExerciseKind, ISODate, Muscle, Routine, Session, SessionExercise, SetEntry } from './types.ts'

const num = (v: number) => String(Math.round(v * 100) / 100).replace('.', ',')

/** Performances au format de l'onglet Entraînement : "52,5kg x 11 ; 47,5kg x 8". */
export function formatPerf(sets: SetEntry[], kind: ExerciseKind): string {
  return sets
    .filter((s) => s.done && s.type !== 'echauffement')
    .map((s) => {
      if (kind === 'weight') return `${num(s.weight ?? 0)}kg x ${s.reps ?? 0}`
      if (kind === 'bodyweight') return s.weight ? `+${num(s.weight)}kg x ${s.reps ?? 0}` : `PDC x ${s.reps ?? 0}`
      if (kind === 'duration') return `${s.seconds ?? 0} s`
      return `${Math.round((s.seconds ?? 0) / 60)} min`
    })
    .join(' ; ')
}

/** Lit ce que le coach (ou toi) a écrit : "52,5kg x 11 ; 12 x 7,5kg ; 30KGX8 ; 55x9 50x9" → séries. */
export function parsePerf(text: string): { weight: number; reps: number }[] {
  // 1) "52,5kg x 11"  2) "12 x 7,5kg" (reps d'abord)  3) "55x9" (sans unité : charge d'abord)
  const re = /(\d+(?:[.,]\d+)?)\s*kg\s*[x×*]\s*(\d+)|(\d+)\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*kg|(\d+(?:[.,]\d+)?)\s*[x×*]\s*(\d+)/gi
  const out: { weight: number; reps: number }[] = []
  for (const m of text.matchAll(re)) {
    const weight = parseFloat((m[1] ?? m[4] ?? m[5]).replace(',', '.'))
    const reps = parseInt(m[2] ?? m[3] ?? m[6], 10)
    if (reps > 0 && reps < 100 && weight >= 0 && weight < 1000) out.push({ weight, reps })
  }
  return out
}

export type ProgressLabel = 'OUI' | 'Maintenu' | 'Regressé' | ''

function score(sets: SetEntry[], kind: ExerciseKind): number {
  const work = sets.filter((s) => s.done && s.type !== 'echauffement')
  if (!work.length) return 0
  if (kind === 'weight' || (kind === 'bodyweight' && work.some((s) => (s.weight ?? 0) > 0))) {
    return Math.max(...work.map((s) => e1rm(s.weight ?? 0, s.reps ?? 0)))
  }
  if (kind === 'bodyweight') return Math.max(...work.map((s) => s.reps ?? 0))
  if (kind === 'duration') return Math.max(...work.map((s) => s.seconds ?? 0))
  return 0
}

/** Colonne « Progressé en POIDS / CHARGE ? » : meilleur 1RM estimé (ou reps, ou durée) vs la fois précédente. */
export function progressLabel(ex: SessionExercise, kind: ExerciseKind, history: Session[], before: number, coachDay?: string | null): ProgressLabel {
  if (kind === 'cardio') return ''
  const cur = score(ex.sets, kind)
  const prev = score(previousSets(history, ex.exerciseId, before, coachDay), kind)
  if (!cur || !prev) return ''
  const ratio = cur / prev
  if (ratio > 1.005) return 'OUI'
  if (ratio < 0.995) return 'Regressé'
  return 'Maintenu'
}

const MUSCLE_RULES: [RegExp, Muscle][] = [
  [/\b(tapis|velo|rameur|elliptique|escaliers?|stair\w*|cardio|course|marche|hiit|corde a sauter|natation)\b/, 'cardio'],
  [/leg curl|ischio|stiff|roumain|romanian|jambes tendues|good morning|nordic/, 'ischios'],
  [/adduct/, 'adducteurs'],
  [/abduct|hip thrust|fessier|glute|pont/, 'fessiers'],
  [/mollet|calf|calves/, 'mollets'],
  [/abdo|crunch|gainage|planche|rotation|oblique|releve de jambes|ab wheel|roulette/, 'abdos'],
  [/leg press|presse|squat|pendulum|leg extension|hack|fente|lunge|step up|belt/, 'quadriceps'],
  [/lombaire|back extension/, 'lombaires'],
  [/shrug|trapeze/, 'trapezes'],
  [/triceps|pushdown|barre au front|skull|dips|kickback|extension nuque/, 'triceps'],
  [/curl|biceps/, 'biceps'],
  [/elevation|\blateral|militaire|overhead press|shoulder|epaule|face pull|oiseau|rear delt|arnold|reverse pec|tirage menton/, 'epaules'],
  [/developpe|bench|chest|pec|ecarte|fly|pompe|push up/, 'pectoraux'],
  [/tirage|rowing|row|pull|traction|lat |dorsal|pullover|deadlift|souleve de terre|chin/, 'dos'],
]

export function guessMuscle(name: string): Muscle {
  const n = ` ${normalize(name)} `
  for (const [re, m] of MUSCLE_RULES) if (re.test(n)) return m
  return 'abdos'
}

export function guessEquipment(name: string): Equipment {
  const n = normalize(name)
  if (/smith/.test(n)) return 'smith'
  if (/poulie|cable|cuff/.test(n)) return 'poulie'
  if (/haltere|dumbbell/.test(n)) return 'halteres'
  if (/kettlebell/.test(n)) return 'kettlebell'
  if (/machine|press|pendulum|leg (curl|extension)|adductor|abductor|pec deck|hack/.test(n)) return 'machine'
  if (/barre|bar\b|deadlift|souleve/.test(n)) return 'barre'
  return 'autre'
}

export function guessKind(name: string, muscle: Muscle): ExerciseKind {
  if (muscle === 'cardio') return 'cardio'
  const n = normalize(name)
  if (/gainage|planche|plank/.test(n)) return 'duration'
  if (/^(tractions?|pompes?|dips|pull ?ups?|chin ?ups?)\b/.test(n) && !/machine|assist/.test(n)) return 'bodyweight'
  return 'weight'
}

export interface CoachTargets {
  on: { kcal: number; protein?: number; carbs?: number; fat?: number; fiber?: number } | null
  off: { kcal: number; protein?: number; carbs?: number; fat?: number; fiber?: number } | null
  pas: number | null
}

export interface CoachProgram {
  /** Semaine dont on reprend le programme (séries, reps, RIR) : la semaine en cours si elle existe. */
  semaine: number
  semaineActuelle?: number | null
  seances: { jour: string; exercices: { nom: string; series?: number | null; reps?: string; rir: string }[] }[]
  /** Semaines déjà remplies dans le sheet du coach. */
  historique: { semaine: number; jour: string; date: ISODate | null; exercices: { nom: string; perf: string; notes?: string }[] }[]
  objectifs?: CoachTargets | null
}

export interface ImportPlan {
  semaine: number
  newExercises: Exercise[]
  routines: Routine[]
  history: Session[]
}

const LOWER: Muscle[] = ['quadriceps', 'ischios', 'fessiers', 'adducteurs', 'mollets']
const UPPER: Muscle[] = ['pectoraux', 'dos', 'epaules', 'biceps', 'triceps', 'trapezes', 'avant_bras']

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

/**
 * Prépare l'import du programme : exercices avec les noms exacts du coach (pour retrouver la bonne
 * ligne à chaque envoi), séances "Upper A / Lower A…" liées au jour du coach, et dernière semaine
 * remplie importée comme historique (colonne « Précédent » dès la première séance).
 */
export function planImport(
  program: CoachProgram,
  existing: { customExercises: Exercise[]; routines: Routine[]; sessions: Session[] },
  defaultRestSec: number,
  now = Date.now(),
): ImportPlan {
  const byName = new Map(existing.customExercises.map((e) => [normalize(e.name), e]))
  const newExercises: Exercise[] = []
  const exerciseFor = (nom: string): Exercise => {
    const key = normalize(nom)
    const found = byName.get(key)
    if (found) return found
    const muscle = guessMuscle(nom)
    const ex: Exercise = { id: uid('x'), name: nom.trim(), muscle, equipment: guessEquipment(nom), kind: guessKind(nom, muscle), custom: true }
    byName.set(key, ex)
    newExercises.push(ex)
    return ex
  }

  const counters: Record<string, number> = {}
  const routines: Routine[] = []
  const history: Session[] = []

  for (const seance of program.seances) {
    if (!seance.exercices.length) continue
    const exercises = seance.exercices.map((e) => ({ src: e, ex: exerciseFor(e.nom) }))
    const lower = exercises.filter((x) => LOWER.includes(x.ex.muscle)).length
    const upper = exercises.filter((x) => UPPER.includes(x.ex.muscle)).length
    const total = Math.max(1, lower + upper)
    const type = lower / total >= 0.6 ? 'Lower' : upper / total >= 0.6 ? 'Upper' : 'Full body'
    counters[type] = (counters[type] ?? 0) + 1
    const letter = String.fromCharCode(64 + counters[type])
    const previous = existing.routines.find((r) => r.coachDay === seance.jour)
    // Séries à défaut : celles réalisées la dernière fois sur ce jour.
    const lastPerf = [...program.historique].reverse().find((h) => h.jour === seance.jour)
    routines.push({
      id: previous?.id ?? uid('r'),
      name: previous?.name ?? `${type} ${letter}`,
      coachDay: seance.jour,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
      items: exercises.map(({ src, ex }) => {
        const kept = previous?.items.find((it) => it.exerciseId === ex.id)
        const done = parsePerf(lastPerf?.exercices.find((e) => normalize(e.nom) === normalize(src.nom))?.perf ?? '').length
        return {
          uid: kept?.uid ?? uid('i'),
          exerciseId: ex.id,
          sets: Math.min(8, Math.max(1, Number(src.series) || done || kept?.sets || 3)),
          reps: src.reps || kept?.reps || '',
          restSec: kept?.restSec ?? (ex.kind === 'cardio' ? 60 : defaultRestSec),
          superset: kept?.superset ?? null,
          rir: src.rir || kept?.rir || '',
        }
      }),
    })
  }

  // Historique : chaque semaine déjà remplie dans le sheet du coach.
  for (const h of program.historique) {
    if (!h.date) continue
    if (existing.sessions.some((s) => s.imported && s.coachDay === h.jour && s.date === h.date)) continue
    const routine = routines.find((r) => r.coachDay === h.jour) ?? existing.routines.find((r) => r.coachDay === h.jour)
    const startedAt = new Date(`${h.date}T18:00:00`).getTime()
    const sessionExercises: SessionExercise[] = []
    for (const e of h.exercices) {
      const ex = exerciseFor(e.nom)
      const parsed = parsePerf(e.perf)
      const note = [parsed.length ? '' : e.perf, e.notes ?? ''].filter(Boolean).join(' · ')
      if (!parsed.length && !note) continue
      sessionExercises.push({
        uid: uid('e'),
        exerciseId: ex.id,
        restSec: defaultRestSec,
        superset: null,
        note,
        sets: parsed.map((p, i) => ({
          id: uid('s'),
          type: 'normal',
          weight: p.weight,
          reps: p.reps,
          seconds: null,
          km: null,
          kcal: null,
          done: true,
          doneAt: startedAt + i * 120_000,
        })),
      })
    }
    if (!sessionExercises.some((e) => e.sets.length)) continue
    history.push({
      id: uid('w'),
      routineId: routine?.id ?? null,
      name: `${routine?.name ?? cap(h.jour)} · semaine ${h.semaine}`,
      date: h.date,
      startedAt,
      endedAt: startedAt + 60 * 60_000,
      exercises: sessionExercises,
      coachDay: h.jour,
      imported: true,
      note: 'Repris du sheet du coach',
    })
  }
  return { semaine: program.semaine, newExercises, routines, history }
}
