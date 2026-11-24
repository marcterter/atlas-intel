import { Sheet, confirmDialog, menuDialog, promptNumber, promptText } from '../../components/ui.tsx'
import { lastSetAt, suggestedEnd } from '../../lib/sessionOps.ts'
import { countForLabel } from '../../lib/makeup.ts'
import { Icon } from '../../components/Icon.tsx'
import { ExerciseProgress } from '../progress/ExerciseProgress.tsx'
import { findExercise, MUSCLE_LABEL } from '../../data/exercises.ts'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { exerciseVolume, sessionDurationMs, sessionTonnage, sessionWorkSets, setLabel } from '../../lib/training.ts'
import { fmtClock, fmtDuration, fmtTonnage } from '../../lib/format.ts'
import { cap, formatLong } from '../../lib/date.ts'

export function SessionDetail({ sessionId }: { sessionId: string }) {
  const session = useStore((s) => s.sessions.find((x) => x.id === sessionId))
  const custom = useStore((s) => s.customExercises)
  const updateSession = useStore((s) => s.updateSession)
  const deleteSession = useStore((s) => s.deleteSession)

  if (!session) {
    return (
      <Sheet title="Séance">
        <div className="empty">Cette séance a été supprimée.</div>
      </Sheet>
    )
  }

  const late = session.endedAt != null ? suggestedEnd(session, session.endedAt) : null

  const more = async () => {
    const c = await menuDialog(null, [
      { id: 'rename', label: 'Renommer', icon: 'pencil' },
      { id: 'note', label: 'Note de séance', icon: 'note' },
      { id: 'duration', label: 'Corriger la durée', icon: 'clock' },
      { id: 'delete', label: 'Supprimer la séance', icon: 'trash', danger: true },
    ])
    if (c === 'duration') {
      const min = await promptNumber({
        title: 'Durée de la séance',
        hint: 'En minutes, si tu as oublié de la terminer. Elle repart vers le sheet du coach.',
        initial: Math.round(sessionDurationMs(session) / 60000),
        suffix: 'min',
        decimal: false,
      })
      if (min != null && min > 0) updateSession(session.id, (s) => ({ ...s, endedAt: s.startedAt + Math.round(min) * 60000 }))
    }
    if (c === 'rename') {
      const name = await promptText({ title: 'Nom', initial: session.name })
      if (name?.trim()) updateSession(session.id, (s) => ({ ...s, name: name.trim() }))
    }
    if (c === 'note') {
      const note = await promptText({ title: 'Note de séance', initial: session.note ?? '', multiline: true })
      if (note !== undefined) updateSession(session.id, (s) => ({ ...s, note }))
    }
    if (c === 'delete' && (await confirmDialog({ title: 'Supprimer cette séance ?', message: 'Elle sera aussi retirée du sheet à la prochaine synchro.', confirm: 'Supprimer', danger: true }))) {
      deleteSession(session.id)
      ui.pop()
    }
  }

  return (
    <Sheet
      title={session.name}
      right={
        <button className="icon-btn" onClick={more} aria-label="Options">
          <Icon name="more" />
        </button>
      }
    >
      <div className="stack">
        <div className="muted">
          {cap(formatLong(session.date))}
        </div>
        {late != null && (
          // Séance terminée longtemps après la dernière série : un geste pour remettre la bonne durée.
          <div className="callout small row-between" style={{ gap: 10, flexWrap: 'wrap' }}>
            <span>
              Dernière série à {fmtClock(lastSetAt(session) ?? late)} : séance oubliée ?
            </span>
            <button className="link-btn" onClick={() => updateSession(session.id, (s) => ({ ...s, endedAt: late }))}>
              Durée : {fmtDuration(late - session.startedAt)}
            </button>
          </div>
        )}
        <div className="grid-3">
          <div className="stat">
            <div className="k">Durée</div>
            <div className="v">{fmtDuration(sessionDurationMs(session))}</div>
          </div>
          <div className="stat">
            <div className="k">Séries</div>
            <div className="v">{sessionWorkSets(session)}</div>
          </div>
          <div className="stat">
            <div className="k">Tonnage</div>
            <div className="v">{fmtTonnage(sessionTonnage(session, custom))}</div>
          </div>
        </div>
        {session.note && <div className="callout">{session.note}</div>}
        {session.exercises.map((ex) => {
          const exo = findExercise(ex.exerciseId, custom)
          const vol = exerciseVolume(ex, exo.kind)
          return (
            <button key={ex.uid} className="card pressable" onClick={() => ui.push(<ExerciseProgress exerciseId={ex.exerciseId} />)}>
              <div className="row-between">
                <div>
                  <div className="bold">{exo.name}</div>
                  <div className="faint small">
                    {MUSCLE_LABEL[exo.muscle]}
                    {vol > 0 ? ` · ${fmtTonnage(vol)}` : ''}
                  </div>
                  {ex.pour && <div className="small" style={{ color: '#60a5fa', marginTop: 2 }}>Rattrapage · compte pour {countForLabel(ex.pour, exo.name)}</div>}
                </div>
                <Icon name="chevron-right" size={18} style={{ color: 'var(--text-3)' }} />
              </div>
              <div className="chips wrap" style={{ marginTop: 10 }}>
                {ex.sets.map((st) => (
                  <span key={st.id} className="chip small num" style={st.type === 'echauffement' ? { color: 'var(--warn)' } : undefined}>
                    {st.type === 'echauffement' ? 'É · ' : st.type === 'degressive' ? 'D · ' : st.type === 'echec' ? 'F · ' : ''}
                    {setLabel(st, exo.kind)}
                  </span>
                ))}
              </div>
              {ex.note && (
                <div className="small muted" style={{ marginTop: 8, fontStyle: 'italic' }}>
                  {ex.note}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </Sheet>
  )
}
