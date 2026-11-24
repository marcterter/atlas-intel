// Macros proposées par l'agent IA du lundi : lues depuis le sheet, comparées aux tiennes, appliquées d'un geste.
import { normalize } from '../data/exercises.ts'
import { GOALS, kcalFromMacros } from './nutrition.ts'
import { fmt } from './format.ts'
import type { Goal, MacroProposal, MacroTargets, Targets } from './types.ts'

const num = (v: unknown) => {
  const n = Number(typeof v === 'string' ? v.replace(',', '.').trim() : v)
  return v == null || v === '' || !Number.isFinite(n) ? NaN : n
}

/**
 * Un jour de macros (clés de l'app ou en français), dans des bornes plausibles. Des kcal qui s'écartent
 * des grammes de plus de 30 kcal sont recalculées (4/4/9) : les objectifs restent cohérents.
 */
function parseDay(raw: unknown): MacroTargets | null {
  if (!raw || typeof raw !== 'object') return null
  const x = raw as Record<string, unknown>
  const protein = Math.round(num(x.protein ?? x.proteines ?? x.protéines))
  const carbs = Math.round(num(x.carbs ?? x.glucides))
  const fat = Math.round(num(x.fat ?? x.lipides))
  if (!(protein >= 40 && protein <= 400) || !(carbs >= 0 && carbs <= 900) || !(fat >= 20 && fat <= 300)) return null
  const fromMacros = kcalFromMacros({ protein, carbs, fat })
  let kcal = Math.round(num(x.kcal))
  if (!(Math.abs(kcal - fromMacros) <= 30)) kcal = fromMacros
  if (kcal < 1000 || kcal > 6000) return null
  return { kcal, protein, carbs, fat }
}

/** « prise », « Prise de masse », « sèche », « maintien »… → la phase de l'app. */
export function parseGoal(v: unknown): Goal | undefined {
  const t = normalize(String(v ?? ''))
  if (!t) return undefined
  if (t.startsWith('seche') || t === 'cut') return 'seche'
  if (t.startsWith('maintien') || t === 'maintenance') return 'maintien'
  if (t.startsWith('prise') || t.includes('masse') || t === 'bulk') return 'prise'
  return undefined
}

/** Macros proposées par l'agent (`{ jourOn, jourOff, fibres, phase, pourquoi }`), gardées si le jour ON est complet. */
export function parseMacroProposal(raw: unknown): MacroProposal | null {
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw)
    } catch {
      return null
    }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const x = raw as Record<string, unknown>
  const on = parseDay(x.jourOn ?? x.on)
  if (!on) return null
  const off = parseDay(x.jourOff ?? x.off)
  const fibres = Math.round(num(x.fibres ?? x.fiber))
  const phase = parseGoal(x.phase)
  const pourquoi = String(x.pourquoi ?? '')
    .trim()
    .slice(0, 300)
  return { on, ...(off ? { off } : {}), ...(fibres >= 10 && fibres <= 80 ? { fibres } : {}), ...(phase ? { phase } : {}), pourquoi }
}

/** Tes objectifs une fois la proposition appliquée (jour OFF et fibres inchangés si l'agent n'en propose pas). */
export function applyMacroProposal(t: Targets, m: MacroProposal): Targets {
  return { ...t, base: m.on, rest: m.off ?? t.rest, fiber: m.fibres ?? t.fiber }
}

const same = (a: MacroTargets | null | undefined, b: MacroTargets) =>
  !!a && a.kcal === b.kcal && a.protein === b.protein && a.carbs === b.carbs && a.fat === b.fat

/** La proposition ne change rien à tes objectifs ni à ta phase. */
export function proposalIsCurrent(t: Targets, goal: Goal, m: MacroProposal): boolean {
  return (!m.phase || m.phase === goal) && same(t.base, m.on) && (!m.off || same(t.rest, m.off)) && (m.fibres == null || m.fibres === t.fiber)
}

export interface ProposalLine {
  label: string
  from: string
  to: string
  /** Détail des grammes : « P 145 · G 365 → 400 · L 65 ». */
  detail?: string
}

function gramsDetail(a: MacroTargets | null, b: MacroTargets): string {
  const part = (l: string, x: number | undefined, y: number) => (x == null || x === y ? `${l} ${y}` : `${l} ${x} → ${y}`)
  return `${part('P', a?.protein, b.protein)} · ${part('G', a?.carbs, b.carbs)} · ${part('L', a?.fat, b.fat)} g`
}

/** Ce qui change, ligne par ligne : phase, jour ON, jour OFF, fibres. */
export function describeMacroProposal(t: Targets, goal: Goal, m: MacroProposal): ProposalLine[] {
  const out: ProposalLine[] = []
  if (m.phase && m.phase !== goal) out.push({ label: 'Phase', from: GOALS[goal].label, to: GOALS[m.phase].label })
  const onLabel = t.rest || m.off ? 'Jour ON' : 'Chaque jour'
  out.push({ label: onLabel, from: `${fmt(t.base.kcal)}`, to: `${fmt(m.on.kcal)} kcal`, detail: gramsDetail(t.base, m.on) })
  if (m.off) out.push({ label: 'Jour OFF', from: t.rest ? `${fmt(t.rest.kcal)}` : '—', to: `${fmt(m.off.kcal)} kcal`, detail: gramsDetail(t.rest, m.off) })
  if (m.fibres != null && m.fibres !== t.fiber) out.push({ label: 'Fibres', from: `${t.fiber}`, to: `${m.fibres} g` })
  return out
}

/** Résumé pour le message « Annuler » : « ON 2 770 · OFF 2 400 kcal ». */
export function proposalSummary(m: MacroProposal): string {
  const kcal = m.off ? `ON ${fmt(m.on.kcal)} · OFF ${fmt(m.off.kcal)} kcal` : `${fmt(m.on.kcal)} kcal`
  return m.phase ? `${GOALS[m.phase].label} · ${kcal}` : kcal
}
