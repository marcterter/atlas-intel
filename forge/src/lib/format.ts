const nf = (min: number, max: number) =>
  new Intl.NumberFormat('fr-FR', { minimumFractionDigits: min, maximumFractionDigits: max })

const f0 = nf(0, 0)
const f1 = nf(0, 1)
const f1fixed = nf(1, 1)
const f2 = nf(0, 2)

export function fmt(n: number | null | undefined, decimals = 0): string {
  if (n == null || !Number.isFinite(n)) return '–'
  if (decimals === 0) return f0.format(Math.round(n))
  if (decimals === 1) return f1.format(n)
  return f2.format(n)
}

export function fmtFixed1(n: number): string {
  return f1fixed.format(n)
}

/** 87.5 -> "87,5" ; 90 -> "90" */
export function fmtKg(n: number | null | undefined): string {
  if (n == null) return '–'
  return f2.format(Math.round(n * 100) / 100)
}

/** Tonnage lisible : 940 kg, 12,8 t */
export function fmtTonnage(kg: number): string {
  if (kg >= 1000) return `${f1.format(Math.round(kg / 100) / 10)} t`
  return `${f0.format(Math.round(kg))} kg`
}

export function fmtSigned(n: number, decimals = 0): string {
  const s = fmt(Math.abs(n), decimals)
  if (Math.abs(n) < (decimals ? 0.05 : 0.5)) return `±${s}`
  return n > 0 ? `+${s}` : `−${s}`
}

/** 3840000 ms -> "1 h 04" ; 2700000 -> "45 min" */
export function fmtDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  return `${h} h ${String(m).padStart(2, '0')}`
}

/** Heure d'un instant : « 14 h 05 ». */
export function fmtClock(ts: number): string {
  const d = new Date(ts)
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`
}

/** 90 -> "1:30" */
export function fmtTimer(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec))
  const m = Math.floor(s / 60)
  return `${m}:${String(s % 60).padStart(2, '0')}`
}

/** Parse "87,5" ou "87.5" -> 87.5 ; vide -> null */
export function parseNum(raw: string): number | null {
  const s = raw.replace(/\s/g, '').replace(',', '.')
  if (s === '' || s === '.' || s === '-') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export function plural(n: number, one: string, many: string): string {
  return `${fmt(n)} ${Math.abs(n) >= 2 ? many : one}`
}

/** "il y a 5 min", "il y a 2 h", "hier" … pour un timestamp */
export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.round((now - ts) / 1000)
  if (s < 60) return "à l'instant"
  const m = Math.round(s / 60)
  if (m < 60) return `il y a ${m} min`
  const h = Math.round(m / 60)
  if (h < 24) return `il y a ${h} h`
  const d = Math.round(h / 24)
  if (d === 1) return 'hier'
  return `il y a ${d} jours`
}
