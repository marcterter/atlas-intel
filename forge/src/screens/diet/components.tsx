import { Bar, Ring } from '../../components/ui.tsx'
import { fmt } from '../../lib/format.ts'
import type { MacroTargets, Nutrients } from '../../lib/types.ts'

export function MacroDots({ n }: { n: Nutrients }) {
  return (
    <span className="macro-dots">
      <span>
        <i style={{ background: 'var(--protein)' }} />
        {fmt(n.protein)}
      </span>
      <span>
        <i style={{ background: 'var(--carbs)' }} />
        {fmt(n.carbs)}
      </span>
      <span>
        <i style={{ background: 'var(--fat)' }} />
        {fmt(n.fat)}
      </span>
    </span>
  )
}

export function MacroBars({ n, t }: { n: Nutrients; t: MacroTargets }) {
  const rows = [
    { label: 'Protéines', v: n.protein, goal: t.protein, color: 'var(--protein)' },
    { label: 'Glucides', v: n.carbs, goal: t.carbs, color: 'var(--carbs)' },
    { label: 'Lipides', v: n.fat, goal: t.fat, color: 'var(--fat)' },
  ]
  return (
    <div className="stack" style={{ gap: 10 }}>
      {rows.map((r) => {
        const left = r.goal - r.v
        return (
          <div className="macro-row" key={r.label}>
            <div className="top">
              <span>
                <b>{r.label}</b> <span className="faint num">{fmt(r.v)} / {fmt(r.goal)} g</span>
              </span>
              <span className="num" style={{ color: left < 0 ? 'var(--danger)' : 'var(--text-2)', fontWeight: 600 }}>
                {left >= 0 ? `reste ${fmt(left)} g` : `+${fmt(-left)} g`}
              </span>
            </div>
            <Bar value={r.goal > 0 ? r.v / r.goal : 0} color={r.color} />
          </div>
        )
      })}
    </div>
  )
}

/** Carte "ce qu'il te reste" : anneau kcal + barres de macros. */
export function MacroSummary({ n, t, compact }: { n: Nutrients; t: MacroTargets; compact?: boolean }) {
  const left = t.kcal - n.kcal
  const over = left < 0
  return (
    <div className="row" style={{ gap: 16, alignItems: 'center' }}>
      <Ring value={t.kcal > 0 ? n.kcal / t.kcal : 0} size={compact ? 112 : 128} stroke={compact ? 10 : 11} color={over ? 'var(--danger)' : 'var(--accent)'}>
        <div className="big-number" style={{ fontSize: compact ? 26 : 30, color: over ? 'var(--danger)' : undefined }}>
          {fmt(Math.abs(left))}
        </div>
        <div className="tiny faint bold">{over ? 'KCAL EN TROP' : 'KCAL RESTANTES'}</div>
      </Ring>
      <div className="grow stack" style={{ gap: 9 }}>
        <div className="row-between small">
          <span className="muted">Mangé</span>
          <b className="num">{fmt(n.kcal)} kcal</b>
        </div>
        <div className="row-between small">
          <span className="muted">Objectif</span>
          <b className="num">{fmt(t.kcal)} kcal</b>
        </div>
        <div className="hr" style={{ margin: '2px 0' }} />
        <MiniMacro label="P" v={n.protein} goal={t.protein} color="var(--protein)" />
        <MiniMacro label="G" v={n.carbs} goal={t.carbs} color="var(--carbs)" />
        <MiniMacro label="L" v={n.fat} goal={t.fat} color="var(--fat)" />
      </div>
    </div>
  )
}

function MiniMacro({ label, v, goal, color }: { label: string; v: number; goal: number; color: string }) {
  return (
    <div className="row" style={{ gap: 8 }}>
      <b className="tiny" style={{ width: 12, color }}>
        {label}
      </b>
      <div className="grow">
        <Bar value={goal > 0 ? v / goal : 0} color={color} thin />
      </div>
      <span className="tiny num muted" style={{ minWidth: 58, textAlign: 'right' }}>
        {fmt(v)}/{fmt(goal)} g
      </span>
    </div>
  )
}
