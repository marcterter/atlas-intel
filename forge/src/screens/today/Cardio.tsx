import { useMemo, useState } from 'react'
import { Icon } from '../../components/Icon.tsx'
import { Field, NumInput, Sheet, confirmDialog } from '../../components/ui.tsx'
import { SessionRecap } from '../training/SessionRecap.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { CARDIO_TYPES, INTENSITY, cardioMinutes, dayCardio, lastCardio, weekCardioMinutes } from '../../lib/cardio.ts'
import { fmt, fmtDuration } from '../../lib/format.ts'
import { relativeDay, todayISO } from '../../lib/date.ts'
import type { CardioEntry, CardioIntensity, ISODate } from '../../lib/types.ts'

const DURATIONS = [15, 20, 30, 45, 60]

/** Noter (ou modifier) un cardio : l'activité, la durée, l'intensité ; distance et kcal en option. */
export function CardioSheet({ date, entry }: { date: ISODate; entry?: CardioEntry }) {
  const saveCardio = useStore((s) => s.saveCardio)
  const deleteCardio = useStore((s) => s.deleteCardio)
  // Par défaut : le dernier cardio noté (on refait souvent le même).
  const last = useStore((s) => lastCardio(s.cardio))
  const start = entry ?? last
  const known = (t: string | undefined) => !!t && CARDIO_TYPES.includes(t)
  const [type, setType] = useState<string>(start?.type && known(start.type) ? start.type : start?.type ? 'Autre' : CARDIO_TYPES[0])
  const [other, setOther] = useState(start?.type && !known(start.type) ? start.type : '')
  const [minutes, setMinutes] = useState<number | null>(entry?.minutes ?? last?.minutes ?? 30)
  const [intensity, setIntensity] = useState<CardioIntensity | null>(entry ? entry.intensity : (last?.intensity ?? null))
  const [km, setKm] = useState<number | null>(entry?.km ?? null)
  const [kcal, setKcal] = useState<number | null>(entry?.kcal ?? null)
  const label = type === 'Autre' ? other.trim() : type
  const valid = !!label && !!minutes && minutes > 0 && minutes <= 600

  return (
    <Sheet
      title={entry ? 'Modifier le cardio' : `Cardio · ${relativeDay(date)}`}
      closeIcon="x"
      footer={
        <>
          {entry && (
            <button
              className="btn danger"
              aria-label="Supprimer"
              onClick={async () => {
                if (await confirmDialog({ title: 'Supprimer ce cardio ?', confirm: 'Supprimer', danger: true })) {
                  deleteCardio(entry.id)
                  ui.pop()
                }
              }}
            >
              <Icon name="trash" size={20} />
            </button>
          )}
          <button
            className="btn grow"
            disabled={!valid}
            onClick={() => {
              saveCardio({ id: entry?.id, date: entry?.date ?? date, type: label, minutes: Math.round(minutes ?? 0), intensity, km, kcal })
              ui.pop()
              ui.toast(`Cardio noté · ${Math.round(minutes ?? 0)} min`, 'ok')
            }}
          >
            {entry ? 'Enregistrer' : `Ajouter · ${fmt(minutes ?? 0)} min`}
          </button>
        </>
      }
    >
      <div className="stack" style={{ gap: 18 }}>
        <div>
          <div className="section-label">Activité</div>
          <div className="chips wrap">
            {[...CARDIO_TYPES, 'Autre'].map((t) => (
              <button key={t} className={`chip ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
                {t}
              </button>
            ))}
          </div>
          {type === 'Autre' && (
            <input className="input" style={{ marginTop: 10 }} value={other} onChange={(e) => setOther(e.target.value)} placeholder="ex : Vélo d’appartement, randonnée…" autoFocus />
          )}
        </div>
        <div>
          <div className="section-label">Durée</div>
          <div className="chips wrap">
            {DURATIONS.map((d) => (
              <button key={d} className={`chip ${minutes === d ? 'active' : ''}`} onClick={() => setMinutes(d)}>
                {d} min
              </button>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <NumInput value={minutes} decimal={false} onChange={setMinutes} suffix="min" />
          </div>
        </div>
        <div>
          <div className="section-label">Intensité</div>
          <div className="chips wrap">
            {(Object.keys(INTENSITY) as CardioIntensity[]).map((k) => (
              <button key={k} className={`chip ${intensity === k ? 'active' : ''}`} onClick={() => setIntensity(intensity === k ? null : k)}>
                {INTENSITY[k].label} <span className="faint">· {INTENSITY[k].hint}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid-2">
          <Field label="Distance (facultatif)">
            <NumInput value={km} onChange={setKm} suffix="km" />
          </Field>
          <Field label="Kcal montre (facultatif)">
            <NumInput value={kcal} decimal={false} onChange={setKcal} suffix="kcal" />
          </Field>
        </div>
        <div className="faint small">Les minutes vont dans la colonne Cardio du suivi de ton coach, l’activité dans la note du jour. Les kcal ne sont pas ajoutées à tes objectifs.</div>
      </div>
    </Sheet>
  )
}

/** Carte « Cardio » d'Aujourd'hui : ce qui est fait ce jour-là (noté ici ou pendant une séance) et le total de la semaine. */
export function CardioCard({ date }: { date: ISODate }) {
  const cardio = useStore((s) => s.cardio)
  const sessions = useStore((s) => s.sessions)
  const customExercises = useStore((s) => s.customExercises)
  const coachNote = useStore((s) => s.targets.cardioNote)
  const items = useMemo(() => dayCardio({ cardio, sessions, customExercises }, date), [cardio, sessions, customExercises, date])
  const week = useMemo(() => weekCardioMinutes({ cardio, sessions, customExercises }, date), [cardio, sessions, customExercises, date])
  const total = cardioMinutes(items)
  const when = date === todayISO() ? 'aujourd’hui' : 'ce jour-là'

  return (
    <div className="card">
      <div className="card-head" style={{ marginBottom: items.length ? 8 : 0 }}>
        <div className="icon-tile">
          <Icon name="zap" size={20} />
        </div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="card-title">Cardio</div>
          <div className="faint small ellipsis">{total ? `${fmtDuration(total * 60_000)} ${when}` : `Pas de cardio ${when}`}</div>
        </div>
        <button className="icon-btn accent" onClick={() => ui.push(<CardioSheet date={date} />)} aria-label="Ajouter du cardio">
          <Icon name="plus" />
        </button>
      </div>
      {items.map((i) => (
        <button
          key={i.id}
          className="list-item"
          style={{ padding: '9px 0', minHeight: 0, borderTop: 0 }}
          onClick={() => {
            if (i.source === 'saisie') {
              const entry = cardio.find((c) => c.id === i.id)
              if (entry) ui.push(<CardioSheet date={date} entry={entry} />)
            } else {
              ui.push(<SessionRecap sessionId={i.id.split(':')[0]} />)
            }
          }}
        >
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="title">{i.label}</div>
            <div className="meta">
              {[i.intensity ? INTENSITY[i.intensity].label : '', i.km ? `${fmt(i.km, 1)} km` : '', i.source === 'seance' ? `pendant ${i.sessionName}` : ''].filter(Boolean).join(' · ') || 'Touche pour modifier'}
            </div>
          </div>
          <span className="num bold">{i.minutes} min</span>
        </button>
      ))}
      {(week > 0 || coachNote) && (
        <div className="tiny faint" style={{ marginTop: 8 }}>
          {[week > 0 ? `Cette semaine : ${fmtDuration(week * 60_000)}` : '', coachNote ? `Coach : ${coachNote}` : ''].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>
  )
}
