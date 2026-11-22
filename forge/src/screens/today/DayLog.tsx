import { useState } from 'react'
import { Sheet, NumInput, Stepper } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { relativeDay } from '../../lib/date.ts'
import { fmt } from '../../lib/format.ts'
import type { DayLog, ISODate } from '../../lib/types.ts'

type ScaleKey = 'sleepQ' | 'energy' | 'motivation' | 'satiety' | 'digestion'

/** Échelles reprises telles quelles du sheet du coach. */
export const SCALES: Record<ScaleKey, { label: string; min: number; max: number; hi: string; lo: string }> = {
  sleepQ: { label: 'Qualité du sommeil', min: 1, max: 10, hi: '10 = dormi comme un bébé', lo: '1 = pas fermé l’œil' },
  energy: { label: 'Énergie', min: 1, max: 10, hi: '10 = au top de ma forme', lo: '1 = complètement KO' },
  motivation: { label: 'Motivation', min: 1, max: 10, hi: '10 = incroyable', lo: '1 = zéro envie' },
  satiety: { label: 'Satiété', min: 1, max: 10, hi: '10 = plein à craquer', lo: '1 = affamé' },
  digestion: { label: 'Digestion', min: 0, max: 7, hi: '1 à 7 = échelle de Bristol', lo: '0 = pas été aux toilettes' },
}

const EMPTY = (date: ISODate): DayLog => ({ date, sleepH: null, sleepQ: null, energy: null, motivation: null, satiety: null, digestion: null, waterL: null, note: '', at: 0 })

export function dayLogFilled(log: DayLog | undefined): number {
  if (!log) return 0
  return [log.sleepH, log.sleepQ, log.energy, log.motivation, log.satiety, log.digestion].filter((v) => v != null).length
}

function ScaleRow({ k, value, onChange }: { k: ScaleKey; value: number | null; onChange: (v: number | null) => void }) {
  const sc = SCALES[k]
  const values = Array.from({ length: sc.max - sc.min + 1 }, (_, i) => sc.min + i)
  return (
    <div>
      <div className="row-between" style={{ marginBottom: 6 }}>
        <span className="small bold">{sc.label}</span>
        <span className="tiny faint">{value != null ? `${value}` : '—'}</span>
      </div>
      <div className="rating" style={{ gap: 4 }}>
        {values.map((n) => (
          <button key={n} className={value === n ? 'on' : ''} style={{ height: 34, fontSize: 14 }} onClick={() => onChange(value === n ? null : n)} aria-label={`${sc.label} ${n}`}>
            {n}
          </button>
        ))}
      </div>
      <div className="row-between tiny faint" style={{ marginTop: 4 }}>
        <span>{sc.lo}</span>
        <span>{sc.hi}</span>
      </div>
    </div>
  )
}

/** Formulaire "Ressenti du jour" : sommeil le matin, ressenti et eau dans la journée. */
export function DayLogSheet({ date }: { date: ISODate }) {
  const saved = useStore((s) => s.daylogs[date])
  const setDayLog = useStore((s) => s.setDayLog)
  const [d, setD] = useState<DayLog>(() => saved ?? EMPTY(date))
  const set = <K extends keyof DayLog>(k: K, v: DayLog[K]) => setD((x) => ({ ...x, [k]: v }))

  return (
    <Sheet
      title={`Ressenti · ${relativeDay(date)}`}
      closeIcon="x"
      footer={
        <button
          className="btn block"
          onClick={() => {
            const { date: _d, at: _a, ...patch } = d
            void _d
            void _a
            setDayLog(date, patch)
            ui.pop()
            ui.toast('Ressenti enregistré', 'ok')
          }}
        >
          Enregistrer
        </button>
      }
    >
      <div className="stack" style={{ gap: 18 }}>
        <div className="callout small">Les mêmes échelles que le « Suivi journalier » de ton coach : tout part dans son sheet.</div>

        <div className="section-label" style={{ margin: '0 4px -6px' }}>
          Le matin
        </div>
        <div className="row-between">
          <div>
            <div className="small bold">Durée de sommeil</div>
            <div className="tiny faint">en heures (ex : 7,5)</div>
          </div>
          <div style={{ width: 120 }}>
            <NumInput value={d.sleepH} onChange={(v) => set('sleepH', v == null ? null : Math.max(0, Math.min(16, Math.round(v * 2) / 2)))} suffix="h" style={{ height: 44 }} />
          </div>
        </div>
        <ScaleRow k="sleepQ" value={d.sleepQ} onChange={(v) => set('sleepQ', v)} />

        <div className="section-label" style={{ margin: '4px 4px -6px' }}>
          Dans la journée
        </div>
        <ScaleRow k="energy" value={d.energy} onChange={(v) => set('energy', v)} />
        <ScaleRow k="motivation" value={d.motivation} onChange={(v) => set('motivation', v)} />
        <ScaleRow k="satiety" value={d.satiety} onChange={(v) => set('satiety', v)} />
        <ScaleRow k="digestion" value={d.digestion} onChange={(v) => set('digestion', v)} />

        <div className="row-between">
          <div>
            <div className="small bold">Eau bue</div>
            <div className="tiny faint">par pas de 25 cl</div>
          </div>
          <Stepper value={d.waterL ?? 0} min={0} max={8} step={0.25} onChange={(v) => set('waterL', v)} format={(v) => `${fmt(v, 2)} L`} />
        </div>

        <label className="field">
          <span>Note du jour</span>
          <textarea className="input" value={d.note} onChange={(e) => set('note', e.target.value)} placeholder="Ex : trop de caféine, resto japonais, soirée pro…" />
        </label>
      </div>
    </Sheet>
  )
}

/** Carte de l'écran Aujourd'hui. */
export function DayLogCard({ date }: { date: ISODate }) {
  const log = useStore((s) => s.daylogs[date])
  const addWater = useStore((s) => s.addWater)
  const filled = dayLogFilled(log)
  const v = (n: number | null | undefined) => (n == null ? '–' : fmt(n, 1))
  return (
    <div className="card">
      <button className="card-head" style={{ width: '100%', textAlign: 'left' }} onClick={() => ui.push(<DayLogSheet date={date} />)}>
        <div className="icon-tile blue">
          <Icon name="heart" size={20} />
        </div>
        <div className="grow">
          <div className="card-title">Ressenti du jour</div>
          <div className="faint small">{filled === 6 ? 'Complet ✓' : `${filled}/6 rempli · pour ton coach`}</div>
        </div>
        <span className={`btn small ${filled === 6 ? 'soft' : ''}`}>{filled ? 'Modifier' : 'Remplir'}</span>
      </button>
      <div className="chips wrap">
        <span className="chip small">
          Sommeil {v(log?.sleepH)} h · {v(log?.sleepQ)}/10
        </span>
        <span className="chip small">Énergie {v(log?.energy)}</span>
        <span className="chip small">Motivation {v(log?.motivation)}</span>
        <span className="chip small">Satiété {v(log?.satiety)}</span>
        <span className="chip small">Digestion {v(log?.digestion)}</span>
      </div>
      {log?.note ? (
        <div className="small muted" style={{ marginTop: 10, fontStyle: 'italic' }}>
          {log.note}
        </div>
      ) : null}
      <div className="row-between" style={{ marginTop: 12 }}>
        <span className="small">
          Eau <b className="num">{fmt(log?.waterL ?? 0, 2)} L</b>
        </span>
        <div className="row" style={{ gap: 6 }}>
          <button className="chip small" onClick={() => addWater(date, 0.25)}>
            +25 cl
          </button>
          <button className="chip small" onClick={() => addWater(date, 0.5)}>
            +50 cl
          </button>
        </div>
      </div>
    </div>
  )
}
