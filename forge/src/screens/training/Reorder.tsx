// Ordre de la séance : on fait glisser les exercices par leur poignée (un superset bouge d'un bloc).
// Près du haut ou du bas de l'écran, la liste défile toute seule.
import { useEffect, useRef, useState } from 'react'
import { Sheet } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { findExercise } from '../../data/exercises.ts'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { exerciseGroups, setExerciseOrder } from '../../lib/sessionOps.ts'
import { haptic } from '../../lib/device.ts'

interface Drag {
  id: number
  from: number
  to: number
  /** Position du doigt au départ et maintenant. */
  y0: number
  y: number
  /** Décalage de la ligne déplacée (doigt + défilement). */
  offset: number
  tops: number[]
  heights: number[]
  gap: number
  scroll0: number
  raf: number
}

const EDGE = 70

export function ReorderSheet() {
  const active = useStore((s) => s.active)
  const custom = useStore((s) => s.customExercises)
  const updateActive = useStore((s) => s.updateActive)
  const hapticsOn = useStore((s) => s.settings.haptics)
  const rows = useRef<(HTMLDivElement | null)[]>([])
  const body = useRef<HTMLDivElement>(null)
  const drag = useRef<Drag | null>(null)
  const [, setTick] = useState(0)
  const groups = active ? exerciseGroups(active.exercises) : []

  useEffect(() => () => cancelAnimationFrame(drag.current?.raf ?? 0), [])

  const compute = () => {
    const d = drag.current
    if (!d) return
    d.offset = d.y - d.y0 + (body.current?.scrollTop ?? 0) - d.scroll0
    // Place finale : le nombre d'autres exercices dont le milieu est au-dessus de celui qu'on déplace.
    const center = d.tops[d.from] + d.heights[d.from] / 2 + d.offset
    let to = 0
    d.tops.forEach((t, k) => {
      if (k !== d.from && t + d.heights[k] / 2 < center) to++
    })
    if (to !== d.to && hapticsOn) haptic(false)
    d.to = to
    setTick((n) => n + 1)
  }

  const autoScroll = () => {
    const d = drag.current
    const el = body.current
    if (!d || !el) return
    const r = el.getBoundingClientRect()
    let v = 0
    if (d.y < r.top + EDGE) v = -Math.ceil(((r.top + EDGE - d.y) / EDGE) * 12)
    else if (d.y > r.bottom - EDGE) v = Math.ceil(((d.y - r.bottom + EDGE) / EDGE) * 12)
    if (v) {
      const before = el.scrollTop
      el.scrollTop += v
      if (el.scrollTop !== before) compute()
    }
    d.raf = requestAnimationFrame(autoScroll)
  }

  const start = (e: React.PointerEvent, i: number) => {
    if (drag.current) return
    e.preventDefault()
    try {
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
    const rects = groups.map((_, k) => rows.current[k]?.getBoundingClientRect())
    const tops = rects.map((r) => r?.top ?? 0)
    const heights = rects.map((r) => r?.height ?? 0)
    const gap = groups.length > 1 ? Math.max(0, tops[1] - tops[0] - heights[0]) : 0
    drag.current = { id: e.pointerId, from: i, to: i, y0: e.clientY, y: e.clientY, offset: 0, tops, heights, gap, scroll0: body.current?.scrollTop ?? 0, raf: 0 }
    drag.current.raf = requestAnimationFrame(autoScroll)
    setTick((n) => n + 1)
  }

  const move = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    d.y = e.clientY
    compute()
  }

  const end = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d || e.pointerId !== d.id) return
    cancelAnimationFrame(d.raf)
    drag.current = null
    setTick((n) => n + 1)
    if (d.from === d.to) return
    const order = groups.map((_, k) => k)
    order.splice(d.from, 1)
    order.splice(d.to, 0, d.from)
    updateActive((s) => setExerciseOrder(s, order.flatMap((k) => groups[k].map((x) => x.uid))))
  }

  /** Décalage pendant le glissé : la ligne suit le doigt, les autres lui font de la place. */
  const shift = (i: number) => {
    const d = drag.current
    if (!d) return 0
    if (i === d.from) return d.offset
    const h = d.heights[d.from] + d.gap
    if (d.from < d.to && i > d.from && i <= d.to) return -h
    if (d.to < d.from && i >= d.to && i < d.from) return h
    return 0
  }

  const dragging = drag.current

  return (
    <Sheet
      title="Ordre de la séance"
      bodyRef={body}
      footer={
        <button className="btn block" onClick={() => ui.pop()}>
          OK
        </button>
      }
    >
      <div className="faint small" style={{ marginBottom: 12 }}>
        Fais glisser <Icon name="grip" size={14} style={{ verticalAlign: -2 }} /> pour changer l’ordre. Un superset bouge d’un bloc.
      </div>
      <div className="reorder">
        {groups.map((g, i) => {
          const done = g.reduce((n, e) => n + e.sets.filter((x) => x.done).length, 0)
          const total = g.reduce((n, e) => n + e.sets.length, 0)
          const finished = done > 0 && done === total
          const y = shift(i)
          return (
            <div
              key={g[0].uid}
              ref={(el) => {
                rows.current[i] = el
              }}
              className={`reorder-row ${dragging?.from === i ? 'dragging' : dragging ? 'shifting' : ''}`}
              style={y ? { transform: `translateY(${y}px)` } : undefined}
            >
              <span className={`reorder-num ${finished ? 'done' : ''}`}>{finished ? <Icon name="check" size={14} stroke={3} /> : i + 1}</span>
              <div className="grow" style={{ minWidth: 0 }}>
                {g.length > 1 && <div className="superset-tag">SUPERSET</div>}
                {g.map((e) => (
                  <div key={e.uid} className="ellipsis bold">
                    {findExercise(e.exerciseId, custom).name}
                  </div>
                ))}
                <div className="faint tiny">{done ? `${done}/${total} séries faites` : `${total} série${total > 1 ? 's' : ''}`}</div>
              </div>
              <span className="reorder-handle" onPointerDown={(e) => start(e, i)} onPointerMove={move} onPointerUp={end} onPointerCancel={end} aria-label="Déplacer">
                <Icon name="grip" />
              </span>
            </div>
          )
        })}
      </div>
    </Sheet>
  )
}
