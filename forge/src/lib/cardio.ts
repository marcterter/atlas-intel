// Cardio du jour : ce qui est noté depuis Aujourd'hui + le cardio fait pendant une séance.
import { findExercise } from '../data/exercises.ts'
import { addDays, startOfWeek } from './date.ts'
import type { CardioEntry, CardioIntensity, Exercise, ISODate, Session } from './types.ts'

export const CARDIO_TYPES = ['Marche inclinée', 'Marche', 'Vélo', 'Elliptique', 'Rameur', 'Stairmaster', 'Course', 'Natation', 'Corde à sauter', 'HIIT']

export const INTENSITY: Record<CardioIntensity, { label: string; hint: string }> = {
  zone2: { label: 'Zone 2', hint: 'tu peux parler' },
  modere: { label: 'Modéré', hint: 'phrases courtes' },
  intense: { label: 'Intense', hint: 'fractionné, à fond' },
}

export interface CardioItem {
  id: string
  label: string
  minutes: number
  intensity: CardioIntensity | null
  km: number | null
  /** « saisie » : modifiable depuis Aujourd'hui ; « seance » : exercice cardio d'une séance. */
  source: 'saisie' | 'seance'
  sessionName?: string
}

type CardioState = { cardio: CardioEntry[]; sessions: Session[]; customExercises: Exercise[] }

export function dayCardio(s: CardioState, date: ISODate): CardioItem[] {
  const out: CardioItem[] = s.cardio
    .filter((c) => c.date === date)
    .sort((a, b) => a.at - b.at)
    .map((c) => ({ id: c.id, label: c.type, minutes: c.minutes, intensity: c.intensity, km: c.km, source: 'saisie' }))
  for (const x of s.sessions) {
    if (x.date !== date || x.imported) continue
    for (const e of x.exercises) {
      const exo = findExercise(e.exerciseId, s.customExercises)
      if (exo.kind !== 'cardio') continue
      const done = e.sets.filter((st) => st.done)
      const sec = done.reduce((a, st) => a + (st.seconds ?? 0), 0)
      const km = done.reduce((a, st) => a + (st.km ?? 0), 0)
      if (sec > 0) out.push({ id: `${x.id}:${e.uid}`, label: exo.name, minutes: Math.round(sec / 60), intensity: null, km: km || null, source: 'seance', sessionName: x.name })
    }
  }
  return out
}

export const cardioMinutes = (items: CardioItem[]) => items.reduce((a, i) => a + i.minutes, 0)

/** « 30 min marche inclinée (zone 2), 10 min vélo » */
export function cardioText(items: CardioItem[]): string {
  return items.map((i) => `${i.minutes} min ${i.label.toLowerCase()}${i.intensity ? ` (${INTENSITY[i.intensity].label.toLowerCase()})` : ''}`).join(', ')
}

/** Minutes de cardio de la semaine (lundi → dimanche) contenant `date`. */
export function weekCardioMinutes(s: CardioState, date: ISODate): number {
  const monday = startOfWeek(date)
  let total = 0
  for (let i = 0; i < 7; i++) total += cardioMinutes(dayCardio(s, addDays(monday, i)))
  return total
}

/** Dernier cardio noté : sert de valeur par défaut (on refait souvent le même). */
export function lastCardio(list: CardioEntry[]): CardioEntry | undefined {
  let best: CardioEntry | undefined
  for (const c of list) if (!best || c.at > best.at) best = c
  return best
}
