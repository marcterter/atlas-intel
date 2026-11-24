import { Bar, Ring } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { fmt } from '../../lib/format.ts'
import type { MacroTargets, Nutrients } from '../../lib/types.ts'

/** Pastilles P / G / L, plus les fibres (en vert) : toujours pour un repas, sinon dès qu'il y en a. */
export function MacroDots({ n, fiber = false }: { n: Nutrients; fiber?: boolean }) {
  const showFiber = fiber || (n.fiber ?? 0) >= 0.5
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
      {showFiber && (
        <span title="Fibres">
          <i style={{ background: 'var(--fiber)' }} />
          {fmt(n.fiber ?? 0)}
        </span>
      )}
    </span>
  )
}

/** `onFiber` : la ligne Fibres se touche pour changer l'objectif (et reste affichée sans objectif). */
export function MacroBars({ n, t, fiberGoal, onFiber }: { n: Nutrients; t: MacroTargets; fiberGoal?: number; onFiber?: () => void }) {
  const rows = [
    { label: 'Protéines', v: n.protein, goal: t.protein, color: 'var(--protein)', min: false },
    { label: 'Glucides', v: n.carbs, goal: t.carbs, color: 'var(--carbs)', min: false },
    { label: 'Lipides', v: n.fat, goal: t.fat, color: 'var(--fat)', min: false },
    ...(fiberGoal || onFiber ? [{ label: 'Fibres', v: n.fiber ?? 0, goal: fiberGoal ?? 0, color: 'var(--fiber)', min: true, onClick: onFiber }] : []),
  ]
  return (
    <div className="stack" style={{ gap: 10 }}>
      {rows.map((r) => {
        const left = r.goal - r.v
        const tap = 'onClick' in r && r.onClick ? r.onClick : null
        const content = (
          <>
            <div className="top">
              <span>
                <b>{r.label}</b>{' '}
                <span className="faint num">
                  {fmt(r.v)}
                  {r.goal > 0 ? ` / ${fmt(r.goal)}` : ''} g
                </span>
                {tap && <Icon name="pencil" size={12} className="macro-edit" />}
              </span>
              {r.goal <= 0 ? (
                <span className="accent" style={{ fontWeight: 600 }}>
                  fixer un objectif
                </span>
              ) : r.min && left <= 0 ? (
                <span className="num ok" style={{ fontWeight: 600 }}>
                  objectif atteint ✓
                </span>
              ) : (
                <span className="num" style={{ color: left < 0 ? 'var(--danger)' : 'var(--text-2)', fontWeight: 600 }}>
                  {left >= 0 ? `reste ${fmt(left)} g` : `+${fmt(-left)} g`}
                </span>
              )}
            </div>
            {r.goal > 0 && <Bar value={r.v / r.goal} color={r.color} overOk={r.min} />}
          </>
        )
        return tap ? (
          <div
            className="macro-row tap"
            key={r.label}
            role="button"
            tabIndex={0}
            aria-label={`Objectif ${r.label.toLowerCase()}`}
            onClick={tap}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                tap()
              }
            }}
          >
            {content}
          </div>
        ) : (
          <div className="macro-row" key={r.label}>
            {content}
          </div>
        )
      })}
    </div>
  )
}

/** Carte "ce qu'il te reste" : anneau kcal + barres de macros. */
export function MacroSummary({ n, t, compact, fiberGoal }: { n: Nutrients; t: MacroTargets; compact?: boolean; fiberGoal?: number }) {
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
        {fiberGoal ? <MiniMacro label="F" v={n.fiber ?? 0} goal={fiberGoal} color="var(--fiber)" overOk /> : null}
      </div>
    </div>
  )
}

function MiniMacro({ label, v, goal, color, overOk }: { label: string; v: number; goal: number; color: string; overOk?: boolean }) {
  return (
    <div className="row" style={{ gap: 8 }}>
      <b className="tiny" style={{ width: 12, color }}>
        {label}
      </b>
      <div className="grow">
        <Bar value={goal > 0 ? v / goal : 0} color={color} thin overOk={overOk} />
      </div>
      <span className="tiny num muted" style={{ minWidth: 58, textAlign: 'right' }}>
        {fmt(v)}/{fmt(goal)} g
      </span>
    </div>
  )
}
