import { useEffect, useMemo, useRef, useState } from 'react'

export interface Point {
  x: number
  y: number
  label: string
  sub?: string
}

function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [w, setW] = useState(320)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const update = () => setW(Math.max(160, el.clientWidth))
    update()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) {
    const d = Math.abs(min) * 0.1 || 1
    min -= d
    max += d
  }
  const span = max - min
  const rough = span / (count - 1)
  const mag = 10 ** Math.floor(Math.log10(rough))
  const norm = rough / mag
  const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag
  const start = Math.floor(min / step) * step
  const ticks: number[] = []
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(Math.round(v * 1000) / 1000)
  return ticks
}

export function LineChart({
  data,
  height = 190,
  color = 'var(--accent)',
  formatY = (n) => String(Math.round(n)),
  formatValue,
  emptyLabel = 'Pas encore assez de données',
}: {
  data: Point[]
  height?: number
  color?: string
  formatY?: (n: number) => string
  formatValue?: (p: Point) => string
  emptyLabel?: string
}) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [sel, setSel] = useState<number | null>(null)
  const pad = { l: 38, r: 12, t: 16, b: 24 }
  const iw = width - pad.l - pad.r
  const ih = height - pad.t - pad.b

  const model = useMemo(() => {
    if (!data.length) return null
    const ys = data.map((d) => d.y)
    const ticks = niceTicks(Math.min(...ys), Math.max(...ys))
    const y0 = ticks[0]
    const y1 = ticks[ticks.length - 1]
    const xs = data.map((d) => d.x)
    const x0 = Math.min(...xs)
    const x1 = Math.max(...xs)
    const sx = (x: number) => (x1 === x0 ? pad.l + iw / 2 : pad.l + ((x - x0) / (x1 - x0)) * iw)
    const sy = (y: number) => pad.t + ih - ((y - y0) / (y1 - y0 || 1)) * ih
    const pts = data.map((d) => ({ ...d, px: sx(d.x), py: sy(d.y) }))
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ')
    const area = `${line} L${pts[pts.length - 1].px.toFixed(1)},${pad.t + ih} L${pts[0].px.toFixed(1)},${pad.t + ih} Z`
    return { ticks, pts, line, area, sy }
  }, [data, iw, ih, pad.l, pad.t])

  if (!model) {
    return (
      <div ref={ref} className="center faint small" style={{ height, display: 'grid', placeItems: 'center' }}>
        {emptyLabel}
      </div>
    )
  }
  const active = sel != null && model.pts[sel] ? model.pts[sel] : model.pts[model.pts.length - 1]
  const gid = `g${Math.abs(hash(color))}`

  const pick = (clientX: number, rect: DOMRect) => {
    const x = clientX - rect.left
    let best = 0
    let bd = Infinity
    model.pts.forEach((p, i) => {
      const d = Math.abs(p.px - x)
      if (d < bd) {
        bd = d
        best = i
      }
    })
    setSel(best)
  }

  const labelIdx = model.pts.length <= 3 ? model.pts.map((_, i) => i) : [0, Math.floor((model.pts.length - 1) / 2), model.pts.length - 1]

  return (
    <div ref={ref} style={{ position: 'relative', userSelect: 'none' }}>
      <div className="row-between" style={{ minHeight: 34, marginBottom: 4, gap: 8 }}>
        <div className="faint tiny ellipsis" style={{ minWidth: 0 }}>
          {active.sub ?? active.label}
        </div>
        <b className="num" style={{ color, whiteSpace: 'nowrap' }}>
          {formatValue ? formatValue(active) : formatY(active.y)}
        </b>
      </div>
      <svg
        width={width}
        height={height}
        style={{ display: 'block', touchAction: 'pan-y' }}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerMove={(e) => e.buttons && pick(e.clientX, e.currentTarget.getBoundingClientRect())}
      >
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity="0.28" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {model.ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={width - pad.r} y1={model.sy(t)} y2={model.sy(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={pad.l - 7} y={model.sy(t) + 4} fontSize="10.5" fill="var(--text-3)" textAnchor="end">
              {formatY(t)}
            </text>
          </g>
        ))}
        {model.pts.length > 1 && <path d={model.area} fill={`url(#${gid})`} />}
        {model.pts.length > 1 && <path d={model.line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
        <line x1={active.px} x2={active.px} y1={pad.t} y2={pad.t + ih} stroke="var(--line-strong)" strokeDasharray="3 3" />
        {model.pts.map((p, i) => (
          <circle key={i} cx={p.px} cy={p.py} r={p === active ? 5.5 : 3} fill={p === active ? color : 'var(--bg)'} stroke={color} strokeWidth="2" />
        ))}
        {labelIdx.map((i) => (
          <text
            key={i}
            x={model.pts[i].px}
            y={height - 6}
            fontSize="10.5"
            fill="var(--text-3)"
            textAnchor={i === 0 && model.pts.length > 1 ? 'start' : i === model.pts.length - 1 && model.pts.length > 1 ? 'end' : 'middle'}
          >
            {model.pts[i].label}
          </text>
        ))}
      </svg>
    </div>
  )
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

export function MiniBars({
  values,
  labels,
  goal,
  color = 'var(--steps)',
  height = 92,
  highlight,
}: {
  values: (number | null)[]
  labels: string[]
  goal?: number
  color?: string
  height?: number
  highlight?: number
}) {
  const max = Math.max(goal ?? 0, ...values.map((v) => v ?? 0), 1) * 1.08
  const goalY = goal ? height - (goal / max) * height : null
  return (
    <div>
      <div style={{ position: 'relative', height, display: 'grid', gridTemplateColumns: `repeat(${values.length}, 1fr)`, gap: 6, alignItems: 'end' }}>
        {goalY != null && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: goalY, borderTop: '1.5px dashed var(--line-strong)' }} />
        )}
        {values.map((v, i) => {
          const h = v ? Math.max(4, (v / max) * height) : 3
          const reached = goal ? (v ?? 0) >= goal : false
          return (
            <div
              key={i}
              style={{
                height: h,
                borderRadius: 7,
                background: v ? color : 'var(--surface-3)',
                opacity: v ? (i === highlight || reached ? 1 : 0.55) : 1,
                transition: 'height 0.4s ease',
              }}
            />
          )
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${values.length}, 1fr)`, gap: 6, marginTop: 6 }}>
        {labels.map((l, i) => (
          <div key={i} className="tiny center" style={{ color: i === highlight ? 'var(--text)' : 'var(--text-3)', fontWeight: 700 }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  )
}

export function HBars({ rows, color = 'var(--accent)', format }: { rows: { label: string; value: number }[]; color?: string; format: (n: number) => string }) {
  const max = Math.max(...rows.map((r) => r.value), 1)
  return (
    <div className="hbars">
      {rows.map((r) => (
        <div className="hbar" key={r.label}>
          <span className="lbl ellipsis">{r.label}</span>
          <div className="bar thin">
            <i style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </div>
          <span className="val">{format(r.value)}</span>
        </div>
      ))}
    </div>
  )
}
