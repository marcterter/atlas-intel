import { useMemo, useState } from 'react'
import { Sheet, Field, Segmented } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { EQUIPMENT_LABEL, MUSCLE_LABEL, MUSCLE_ORDER, searchExercises } from '../../data/exercises.ts'
import { useAllExercises } from '../../store/selectors.ts'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import type { Equipment, ExerciseKind, Muscle } from '../../lib/types.ts'

export function ExercisePicker({
  title = 'Ajouter des exercices',
  multi = true,
  onPick,
}: {
  title?: string
  multi?: boolean
  onPick: (ids: string[]) => void
}) {
  const all = useAllExercises()
  const sessions = useStore((s) => s.sessions)
  const [q, setQ] = useState('')
  const [muscle, setMuscle] = useState<Muscle | 'tous' | 'recents'>('tous')
  const [picked, setPicked] = useState<string[]>([])

  const recentIds = useMemo(() => {
    const seen: string[] = []
    for (const s of [...sessions].sort((a, b) => b.startedAt - a.startedAt)) {
      for (const e of s.exercises) if (!seen.includes(e.exerciseId)) seen.push(e.exerciseId)
      if (seen.length > 30) break
    }
    return seen
  }, [sessions])

  const list = useMemo(() => {
    let l = searchExercises(q, all)
    if (muscle === 'recents') l = recentIds.map((id) => l.find((e) => e.id === id)).filter((e): e is (typeof l)[number] => !!e)
    else if (muscle !== 'tous') l = l.filter((e) => e.muscle === muscle)
    return l
  }, [q, all, muscle, recentIds])

  const toggle = (id: string) => {
    if (!multi) {
      onPick([id])
      ui.pop()
      return
    }
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  }

  return (
    <Sheet
      title={title}
      closeIcon="x"
      right={
        <button className="link-btn" style={{ padding: '0 8px' }} onClick={() => ui.push(<CustomExerciseForm onCreated={(id) => toggle(id)} />)}>
          Créer
        </button>
      }
      footer={
        multi && picked.length > 0 ? (
          <button
            className="btn block"
            onClick={() => {
              onPick(picked)
              ui.pop()
            }}
          >
            Ajouter {picked.length} exercice{picked.length > 1 ? 's' : ''}
          </button>
        ) : undefined
      }
    >
      <div className="stack">
        <div className="search">
          <Icon name="search" size={18} />
          <input className="input" placeholder="Rechercher (ex : développé, mollets…)" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="chips">
          <button className={`chip ${muscle === 'tous' ? 'active' : ''}`} onClick={() => setMuscle('tous')}>
            Tous
          </button>
          {recentIds.length > 0 && (
            <button className={`chip ${muscle === 'recents' ? 'active' : ''}`} onClick={() => setMuscle('recents')}>
              Récents
            </button>
          )}
          {MUSCLE_ORDER.map((m) => (
            <button key={m} className={`chip ${muscle === m ? 'active' : ''}`} onClick={() => setMuscle(m)}>
              {MUSCLE_LABEL[m]}
            </button>
          ))}
        </div>
        <div className="card flush list">
          {list.length === 0 && <div className="empty small">Aucun exercice. Tu peux le créer avec « Créer ».</div>}
          {list.map((e) => {
            const on = picked.includes(e.id)
            return (
              <button key={e.id} className="list-item" onClick={() => toggle(e.id)}>
                <div className="grow">
                  <div className="title">{e.name}</div>
                  <div className="meta">
                    {MUSCLE_LABEL[e.muscle]} · {EQUIPMENT_LABEL[e.equipment]}
                    {e.custom ? ' · perso' : ''}
                  </div>
                </div>
                {multi && (
                  <span className={`check-btn ${on ? 'on' : ''}`} style={{ width: 30, height: 30, borderRadius: 9 }}>
                    {on && <Icon name="check" size={18} stroke={3} />}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </Sheet>
  )
}

function CustomExerciseForm({ onCreated }: { onCreated: (id: string) => void }) {
  const add = useStore((s) => s.addCustomExercise)
  const [name, setName] = useState('')
  const [muscle, setMuscle] = useState<Muscle>('pectoraux')
  const [equipment, setEquipment] = useState<Equipment>('machine')
  const [kind, setKind] = useState<ExerciseKind>('weight')
  return (
    <Sheet
      title="Nouvel exercice"
      footer={
        <button
          className="btn block"
          disabled={!name.trim()}
          onClick={() => {
            const id = add({ name: name.trim(), muscle, equipment, kind })
            ui.pop()
            onCreated(id)
            ui.toast('Exercice créé', 'ok')
          }}
        >
          Créer l'exercice
        </button>
      }
    >
      <div className="stack">
        <Field label="Nom">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex : Presse à mollets unilatérale" autoFocus />
        </Field>
        <Field label="Type">
          <Segmented
            value={kind}
            onChange={setKind}
            options={[
              { value: 'weight', label: 'Charge' },
              { value: 'bodyweight', label: 'Poids du corps' },
              { value: 'duration', label: 'Durée' },
              { value: 'cardio', label: 'Cardio' },
            ]}
          />
        </Field>
        <Field label="Groupe musculaire">
          <div className="chips wrap">
            {MUSCLE_ORDER.map((m) => (
              <button key={m} className={`chip ${muscle === m ? 'active' : ''}`} onClick={() => setMuscle(m)}>
                {MUSCLE_LABEL[m]}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Matériel">
          <div className="chips wrap">
            {(Object.keys(EQUIPMENT_LABEL) as Equipment[]).map((k) => (
              <button key={k} className={`chip ${equipment === k ? 'active' : ''}`} onClick={() => setEquipment(k)}>
                {EQUIPMENT_LABEL[k]}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </Sheet>
  )
}
