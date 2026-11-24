import { useState } from 'react'
import { Sheet, Field, Segmented, Stepper, confirmDialog, menuDialog } from '../../components/ui.tsx'
import { shortCoachDay } from '../../lib/coachMap.ts'
import { Icon } from '../../components/Icon.tsx'
import { ExercisePicker } from './ExercisePicker.tsx'
import { findExercise, MUSCLE_LABEL } from '../../data/exercises.ts'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { uid } from '../../lib/id.ts'
import { fmtTimer } from '../../lib/format.ts'
import type { Routine, RoutineItem } from '../../lib/types.ts'

const REST_OPTIONS = [45, 60, 75, 90, 120, 150, 180, 240]
const WEEK = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI', 'DIMANCHE']

export function RoutineEditor({ routineId }: { routineId?: string }) {
  const existing = useStore((s) => s.routines.find((r) => r.id === routineId))
  const custom = useStore((s) => s.customExercises)
  const defaultRest = useStore((s) => s.settings.defaultRestSec)
  const save = useStore((s) => s.saveRoutine)
  const del = useStore((s) => s.deleteRoutine)
  const duplicate = useStore((s) => s.duplicateRoutine)
  // Séances du programme du coach, du lundi au dimanche : une séance à toi peut compter pour l'une d'elles.
  const routines = useStore((s) => s.routines)
  const coachRoutines = routines.filter((r) => r.coachDay).sort((a, b) => WEEK.indexOf(a.coachDay as string) - WEEK.indexOf(b.coachDay as string))
  const [draft, setDraft] = useState<Routine>(
    () =>
      existing ?? {
        id: uid('r'),
        name: '',
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
  )

  const setItem = (u: string, patch: Partial<RoutineItem>) =>
    setDraft((d) => ({ ...d, items: d.items.map((it) => (it.uid === u ? { ...it, ...patch } : it)) }))

  const move = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const j = i + dir
      if (j < 0 || j >= d.items.length) return d
      const items = [...d.items]
      ;[items[i], items[j]] = [items[j], items[i]]
      return { ...d, items }
    })

  const toggleSuperset = (i: number) =>
    setDraft((d) => {
      const a = d.items[i]
      const b = d.items[i + 1]
      if (!a || !b) return d
      const items = [...d.items]
      if (a.superset && a.superset === b.superset) {
        items[i + 1] = { ...b, superset: null }
        if (!items.some((x, k) => k !== i && x.superset === a.superset)) items[i] = { ...a, superset: null }
      } else {
        const g = a.superset ?? b.superset ?? uid('ss')
        items[i] = { ...a, superset: g }
        items[i + 1] = { ...b, superset: g }
      }
      return { ...d, items }
    })

  const addExercises = (ids: string[]) =>
    setDraft((d) => ({
      ...d,
      items: [
        ...d.items,
        ...ids.map((exerciseId) => {
          const ex = findExercise(exerciseId, custom)
          const cardio = ex.kind === 'cardio'
          return { uid: uid('i'), exerciseId, sets: cardio ? 1 : 3, reps: cardio ? '20 min' : ex.kind === 'duration' ? '45 s' : '8-12', restSec: cardio ? 60 : defaultRest, superset: null }
        }),
      ],
    }))

  const canSave = draft.name.trim() !== '' && draft.items.length > 0

  const onMore = async () => {
    const choice = await menuDialog(null, [
      { id: 'dup', label: 'Dupliquer', icon: 'copy' },
      { id: 'del', label: 'Supprimer cette séance', icon: 'trash', danger: true },
    ])
    if (choice === 'dup' && existing) {
      duplicate(existing.id)
      ui.pop()
      ui.toast('Séance dupliquée', 'ok')
    }
    if (choice === 'del' && existing) {
      if (await confirmDialog({ title: 'Supprimer ?', message: `La séance « ${existing.name} » sera supprimée. L'historique est conservé.`, confirm: 'Supprimer', danger: true })) {
        del(existing.id)
        ui.pop()
      }
    }
  }

  return (
    <Sheet
      title={existing ? 'Modifier la séance' : 'Nouvelle séance'}
      closeIcon="x"
      right={
        existing ? (
          <button className="icon-btn" onClick={onMore} aria-label="Plus d'options">
            <Icon name="more" />
          </button>
        ) : undefined
      }
      footer={
        <button
          className="btn block"
          disabled={!canSave}
          onClick={() => {
            save({ ...draft, name: draft.name.trim() })
            ui.pop()
            ui.toast('Séance enregistrée', 'ok')
          }}
        >
          Enregistrer
        </button>
      }
    >
      <div className="stack">
        <Field label="Nom de la séance">
          <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="ex : Push, Haut du corps, Jambes A…" />
        </Field>

        {draft.coachDay ? (
          <div className="faint small">Séance du programme de ton coach ({draft.coachDay.toLowerCase()}).</div>
        ) : (
          coachRoutines.length > 0 && (
            <div className="field">
              <span>Chez le coach, compte pour</span>
              <Segmented
                value={draft.countsFor ?? 'none'}
                onChange={(v) => setDraft({ ...draft, countsFor: v === 'none' ? undefined : v })}
                options={[{ value: 'none', label: 'Aucun' }, ...coachRoutines.map((r) => ({ value: r.coachDay as string, label: shortCoachDay(r.coachDay as string) }))]}
              />
              <small className="faint">
                {draft.countsFor
                  ? `Ses exercices remplissent les lignes du ${draft.countsFor.toLowerCase()} (${coachRoutines.find((r) => r.coachDay === draft.countsFor)?.name ?? ''}) : le même exercice, sinon le plus proche du même muscle. Tu peux changer pendant la séance.`
                  : 'Ses exercices iront dans la note du jour de ton coach, sans ligne à eux.'}
              </small>
            </div>
          )
        )}

        {draft.items.length === 0 && (
          <div className="callout">Ajoute les exercices du programme de ton coach. Tu pourras régler séries, répétitions visées et temps de repos.</div>
        )}

        {draft.items.map((it, i) => {
          const ex = findExercise(it.exerciseId, custom)
          const linked = it.superset && draft.items[i + 1]?.superset === it.superset
          return (
            <div key={it.uid}>
              <div className={`ex-card ${it.superset ? 'superset' : ''}`}>
                <div className="row-between">
                  <div className="grow">
                    {it.superset && <div className="superset-tag">SUPERSET</div>}
                    <div className="ex-name">{ex.name}</div>
                    <div className="faint small">{MUSCLE_LABEL[ex.muscle]}</div>
                  </div>
                  <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter">
                    <Icon name="arrow-up" size={18} />
                  </button>
                  <button className="icon-btn" onClick={() => move(i, 1)} disabled={i === draft.items.length - 1} aria-label="Descendre">
                    <Icon name="arrow-down" size={18} />
                  </button>
                  <button className="icon-btn" onClick={() => setDraft((d) => ({ ...d, items: d.items.filter((x) => x.uid !== it.uid) }))} aria-label="Retirer">
                    <Icon name="trash" size={18} />
                  </button>
                </div>
                <div className="grid-3" style={{ marginTop: 10, alignItems: 'end' }}>
                  <label className="field">
                    <span className="tiny">Séries</span>
                    <Stepper value={it.sets} min={1} max={12} onChange={(v) => setItem(it.uid, { sets: v })} />
                  </label>
                  <label className="field">
                    <span className="tiny">{ex.kind === 'cardio' ? 'Objectif' : 'Reps visées'}</span>
                    <input className="input" style={{ height: 40 }} value={it.reps} onChange={(e) => setItem(it.uid, { reps: e.target.value })} />
                  </label>
                  <label className="field">
                    <span className="tiny">Repos</span>
                    <select className="input" style={{ height: 40, padding: '0 8px' }} value={it.restSec} onChange={(e) => setItem(it.uid, { restSec: Number(e.target.value) })}>
                      {[...new Set([...REST_OPTIONS, it.restSec])].sort((a, b) => a - b).map((s) => (
                        <option key={s} value={s}>
                          {fmtTimer(s)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              {i < draft.items.length - 1 && (
                <div className="center" style={{ margin: '6px 0 -4px' }}>
                  <button className={`chip small ${linked ? 'active' : ''}`} onClick={() => toggleSuperset(i)}>
                    <Icon name="link" size={14} /> {linked ? 'En superset' : 'Superset avec le suivant'}
                  </button>
                </div>
              )}
            </div>
          )
        })}

        <button className="btn soft block" onClick={() => ui.push(<ExercisePicker onPick={addExercises} />)}>
          <Icon name="plus" size={20} /> Ajouter des exercices
        </button>
      </div>
    </Sheet>
  )
}
