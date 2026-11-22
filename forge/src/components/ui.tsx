import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon.tsx'
import { useUI } from '../store/ui.ts'
import { parseNum } from '../lib/format.ts'

// ---------- Panneaux plein écran ----------

export function SheetStack() {
  const sheets = useUI((s) => s.sheets)
  return (
    <>
      {sheets.map((s, i) => (
        <div key={s.key} className="sheet-layer" style={i === sheets.length - 1 ? undefined : { display: 'none' }}>
          {s.node}
        </div>
      ))}
    </>
  )
}

export function Sheet({
  title,
  onClose,
  closeIcon = 'chevron-left',
  right,
  footer,
  children,
  bodyRef,
}: {
  title: ReactNode
  onClose?: () => void
  closeIcon?: 'chevron-left' | 'x' | 'chevron-down'
  right?: ReactNode
  footer?: ReactNode
  children: ReactNode
  bodyRef?: React.Ref<HTMLDivElement>
}) {
  const pop = useUI((s) => s.pop)
  return (
    <>
      <div className="sheet-head">
        <div className="left">
          <button className="icon-btn" onClick={onClose ?? pop} aria-label="Fermer">
            <Icon name={closeIcon} />
          </button>
        </div>
        <div className="title ellipsis">{title}</div>
        <div className="right">{right}</div>
      </div>
      <div className="sheet-body" ref={bodyRef}>
        <div className="inner">{children}</div>
      </div>
      {footer && (
        <div className="sheet-foot">
          <div className="inner">{footer}</div>
        </div>
      )}
    </>
  )
}

// ---------- Toasts & dialogues ----------

export function Toasts() {
  const toasts = useUI((s) => s.toasts)
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.text}
        </div>
      ))}
    </div>
  )
}

export function DialogHost() {
  const dialog = useUI((s) => s.dialog)
  const close = useUI((s) => s.closeDialog)
  if (!dialog) return null
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog">
        {dialog}
      </div>
    </div>
  )
}

export function confirmDialog(opts: { title: string; message?: ReactNode; confirm?: string; danger?: boolean }): Promise<boolean> {
  return new Promise((resolve) => {
    const { openDialog, closeDialog } = useUI.getState()
    const done = (v: boolean) => {
      closeDialog()
      resolve(v)
    }
    openDialog(
      <div className="stack">
        <h3>{opts.title}</h3>
        {opts.message && <div className="muted small">{opts.message}</div>}
        <div className="row" style={{ marginTop: 6 }}>
          <button className="btn soft grow" onClick={() => done(false)}>
            Annuler
          </button>
          <button className={`btn grow ${opts.danger ? 'danger' : ''}`} onClick={() => done(true)}>
            {opts.confirm ?? 'Confirmer'}
          </button>
        </div>
      </div>,
    )
  })
}

export interface MenuItem {
  id: string
  label: string
  icon?: string
  danger?: boolean
}

export function menuDialog(title: string | null, items: MenuItem[]): Promise<string | null> {
  return new Promise((resolve) => {
    const { openDialog, closeDialog } = useUI.getState()
    const done = (v: string | null) => {
      closeDialog()
      resolve(v)
    }
    openDialog(
      <div>
        {title && <h3 style={{ marginBottom: 8 }}>{title}</h3>}
        {items.map((it) => (
          <button key={it.id} className={`menu-item ${it.danger ? 'danger' : ''}`} onClick={() => done(it.id)}>
            {it.icon && <Icon name={it.icon} size={20} />}
            {it.label}
          </button>
        ))}
        <button className="btn soft block" style={{ marginTop: 12 }} onClick={() => done(null)}>
          Annuler
        </button>
      </div>,
    )
  })
}

function NumberPrompt({
  title,
  hint,
  initial,
  suffix,
  decimal,
  onDone,
  allowClear,
}: {
  title: string
  hint?: ReactNode
  initial: number | null
  suffix?: string
  decimal?: boolean
  allowClear?: boolean
  onDone: (v: number | null | undefined) => void
}) {
  const [raw, setRaw] = useState(initial != null ? String(initial).replace('.', ',') : '')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 60)
    return () => clearTimeout(t)
  }, [])
  const value = parseNum(raw)
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault()
        if (value != null) onDone(value)
      }}
    >
      <h3>{title}</h3>
      {hint && <div className="muted small">{hint}</div>}
      <div className="input-suffix">
        <input
          ref={ref}
          className="input num"
          style={{ fontSize: 22, height: 56, fontWeight: 700 }}
          inputMode={decimal ? 'decimal' : 'numeric'}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="0"
        />
        {suffix && <em>{suffix}</em>}
      </div>
      <div className="row">
        {allowClear && initial != null ? (
          <button type="button" className="btn danger grow" onClick={() => onDone(null)}>
            Effacer
          </button>
        ) : (
          <button type="button" className="btn soft grow" onClick={() => onDone(undefined)}>
            Annuler
          </button>
        )}
        <button type="submit" className="btn grow" disabled={value == null}>
          Enregistrer
        </button>
      </div>
    </form>
  )
}

/** Saisie rapide d'un nombre. Renvoie undefined si annulé, null si effacé. */
export function promptNumber(opts: {
  title: string
  hint?: ReactNode
  initial: number | null
  suffix?: string
  decimal?: boolean
  allowClear?: boolean
}): Promise<number | null | undefined> {
  return new Promise((resolve) => {
    const { openDialog, closeDialog } = useUI.getState()
    openDialog(
      <NumberPrompt
        {...opts}
        onDone={(v) => {
          closeDialog()
          resolve(v)
        }}
      />,
    )
  })
}

// ---------- Petits composants ----------

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button key={o.value} role="tab" aria-selected={o.value === value} className={o.value === value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return <button className={`toggle ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />
}

export function Stepper({ value, min = 0, max = 99, step = 1, onChange, format }: { value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void; format?: (v: number) => string }) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, value - step))} aria-label="Moins">
        <Icon name="minus" size={18} />
      </button>
      <span className="num">{format ? format(value) : value}</span>
      <button onClick={() => onChange(Math.min(max, value + step))} aria-label="Plus">
        <Icon name="plus" size={18} />
      </button>
    </div>
  )
}

export function Ring({
  value,
  size = 120,
  stroke = 11,
  color = 'var(--accent)',
  track = 'var(--surface-3)',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  track?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value))
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}

export function Bar({ value, color, thin, overOk }: { value: number; color?: string; thin?: boolean; overOk?: boolean }) {
  const over = value > 1 && !overOk
  return (
    <div className={`bar ${thin ? 'thin' : ''}`}>
      <i style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, background: over ? 'var(--danger)' : color }} />
    </div>
  )
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="display">{title}</div>
      {children && <div className="small" style={{ marginBottom: 14 }}>{children}</div>}
      {action}
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small className="faint">{hint}</small>}
    </label>
  )
}

/** Champ numérique contrôlé tolérant la virgule. */
export function NumInput({
  value,
  onChange,
  placeholder,
  decimal = true,
  className = 'input num',
  suffix,
  style,
  autoFocus,
}: {
  value: number | null
  onChange: (v: number | null) => void
  placeholder?: string
  decimal?: boolean
  className?: string
  suffix?: string
  style?: React.CSSProperties
  autoFocus?: boolean
}) {
  const [raw, setRaw] = useState(value != null ? String(value).replace('.', ',') : '')
  const last = useRef(value)
  useEffect(() => {
    if (value !== last.current) {
      last.current = value
      const parsed = parseNum(raw)
      if (parsed !== value) setRaw(value != null ? String(value).replace('.', ',') : '')
    }
  }, [value, raw])
  const input = (
    <input
      className={className}
      style={style}
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={raw}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onChange={(e) => {
        setRaw(e.target.value)
        const v = parseNum(e.target.value)
        last.current = v
        onChange(v)
      }}
      onFocus={(e) => e.currentTarget.select()}
    />
  )
  if (!suffix) return input
  return (
    <div className="input-suffix">
      {input}
      <em>{suffix}</em>
    </div>
  )
}

export function Spinner() {
  return <span className="spinner" aria-label="Chargement" />
}

function TextPrompt({ title, initial, placeholder, multiline, onDone }: { title: string; initial: string; placeholder?: string; multiline?: boolean; onDone: (v: string | undefined) => void }) {
  const [v, setV] = useState(initial)
  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault()
        onDone(v)
      }}
    >
      <h3>{title}</h3>
      {multiline ? (
        <textarea className="input" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} autoFocus />
      ) : (
        <input className="input" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} autoFocus />
      )}
      <div className="row">
        <button type="button" className="btn soft grow" onClick={() => onDone(undefined)}>
          Annuler
        </button>
        <button type="submit" className="btn grow">
          Valider
        </button>
      </div>
    </form>
  )
}

export function promptText(opts: { title: string; initial?: string; placeholder?: string; multiline?: boolean }): Promise<string | undefined> {
  return new Promise((resolve) => {
    const { openDialog, closeDialog } = useUI.getState()
    openDialog(
      <TextPrompt
        title={opts.title}
        initial={opts.initial ?? ''}
        placeholder={opts.placeholder}
        multiline={opts.multiline}
        onDone={(v) => {
          closeDialog()
          resolve(v)
        }}
      />,
    )
  })
}

/** Re-rend le composant toutes les `ms` millisecondes. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}
