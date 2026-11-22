import type { ISODate } from './types.ts'

const pad = (n: number) => String(n).padStart(2, '0')

export function toISO(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function todayISO(): ISODate {
  return toISO(new Date())
}

export function fromISO(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = fromISO(iso)
  d.setDate(d.getDate() + n)
  return toISO(d)
}

/** Nombre de jours de a vers b (b - a). */
export function diffDays(a: ISODate, b: ISODate): number {
  const ms = fromISO(b).getTime() - fromISO(a).getTime()
  return Math.round(ms / 86_400_000)
}

/** Lundi de la semaine contenant `iso`. */
export function startOfWeek(iso: ISODate): ISODate {
  const d = fromISO(iso)
  const dow = (d.getDay() + 6) % 7 // 0 = lundi
  return addDays(iso, -dow)
}

export function weekDays(iso: ISODate): ISODate[] {
  const start = startOfWeek(iso)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export function lastNDays(iso: ISODate, n: number): ISODate[] {
  return Array.from({ length: n }, (_, i) => addDays(iso, i - n + 1))
}

const DAY_LETTERS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const DAY_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.']
const DAY_LONG = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export function dayLetter(iso: ISODate): string {
  return DAY_LETTERS[fromISO(iso).getDay()]
}

export function dayShort(iso: ISODate): string {
  return DAY_SHORT[fromISO(iso).getDay()]
}

export function dayNum(iso: ISODate): number {
  return fromISO(iso).getDate()
}

/** "samedi 22 novembre" */
export function formatLong(iso: ISODate): string {
  const d = fromISO(iso)
  return `${DAY_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** "22 nov." */
export function formatShort(iso: ISODate): string {
  const d = fromISO(iso)
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

/** "22/11/2026" */
export function formatNumeric(iso: ISODate): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** "Aujourd'hui", "Hier", "Il y a 3 jours", "lun. 9 novembre" */
export function relativeDay(iso: ISODate, ref: ISODate = todayISO()): string {
  const n = diffDays(iso, ref)
  if (n === 0) return "Aujourd'hui"
  if (n === 1) return 'Hier'
  if (n === -1) return 'Demain'
  if (n > 1 && n < 7) return `Il y a ${n} jours`
  const d = fromISO(iso)
  return `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
}

/** Numéro de semaine ISO 8601. */
export function isoWeek(iso: ISODate): number {
  const d = fromISO(iso)
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayNr = (target.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const diff = target.getTime() - firstThursday.getTime()
  return 1 + Math.round((diff / 86_400_000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7)
}

export function monthLabel(iso: ISODate): string {
  const d = fromISO(iso)
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Majuscule sur la première lettre uniquement ("dimanche 22 novembre" -> "Dimanche 22 novembre"). */
export function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}
