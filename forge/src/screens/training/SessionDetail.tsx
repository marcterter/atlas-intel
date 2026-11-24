import { Sheet, confirmDialog, menuDialog, promptNumber, promptText } from '../../components/ui.tsx'
import { lastSetAt, suggestedEnd } from '../../lib/sessionOps.ts'
import { coachPlanFor, linkSessionToDay, shortCoachDay } from '../../lib/coachMap.ts'
import { countForLabel, refreshLaterMakeUps } from '../../lib/makeup.ts'
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
  const routines = useStore((s) => s.routines)
  const saveRoutine = useStore((s) => s.saveRoutine)

  if (!session) {
    return (
      <Sheet title="Séance">
        <div className="empty">Cette séance a été supprimée.</div>
      </Sheet>
    )
  }

  const late = session.endedAt != null ? suggestedEnd(session, session.endedAt) : null
  // Séances du programme du coach, par jour : une séance à toi peut compter pour l'une d'elles.
  const coachRoutines = routines.filter((r) => r.coachDay)
  const ownRoutine = routines.find((r) => r.id === session.routineId && !r.coachDay)
  const linkedPlan = coachPlanFor(session, routines)
  const canLink =
    !session.imported &&
    coachRoutines.length > 0 &&
    !routines.some((r) => r.id === session.routineId && r.coachDay) &&
    session.exercises.some((e) => findExercise(e.exerciseId, custom).kind !== 'cardio')

  const linkToDay = async () => {
    const c = await menuDialog('Chez le coach, cette séance compte pour…', [
      ...coachRoutines.map((r) => ({ id: `d:${r.coachDay}`, label: `${shortCoachDay(r.coachDay as string)} · ${r.name}${session.coachDay === r.coachDay ? ' ✓' : ''}`, icon: 'calendar' })),
      { id: 'none', label: `Aucune (note du jour)${session.coachDay ? '' : ' ✓'}`, icon: 'note' },
    ])
    if (!c) return
    const day = c === 'none' ? null : c.slice(2)
    const st = useStore.getState()
    const linked = linkSessionToDay(session, day, st.routines, st.customExercises)
    updateSession(session.id, () => linked)
    // Les séances des jours suivants peuvent rattraper ses lignes restées vides (les bras de mardi pour lundi).
    const later = refreshLaterMakeUps(linked, session.coachDay, useStore.getState().sessions, st.routines, st.customExercises)
    for (const x of later) updateSession(x.id, () => x)
    ui.toast(
      day
        ? `Séance reliée : elle repart vers le sheet du coach${later.length ? ` (rattrapages revus dans ${later.length} autre${later.length > 1 ? 's' : ''} séance${later.length > 1 ? 's' : ''})` : ''}`
        : 'Séance détachée du programme',
      'ok',
    )
    // Et les prochaines fois ? La séance à toi d'origine peut toujours compter pour ce jour-là.
    if (day && ownRoutine && ownRoutine.countsFor !== day) {
      const plan = coachRoutines.find((r) => r.coachDay === day)
      const ok = await confirmDialog({
        title: 'Et les prochaines fois ?',
        message: `Compter « ${ownRoutine.name} » pour le ${day.toLowerCase()} (${plan?.name ?? ''}) à chaque fois ?`,
        confirm: 'Oui, toujours',
      })
      if (ok) saveRoutine({ ...ownRoutine, countsFor: day })
    }
  }

  const more = async () => {
    const c = await menuDialog(null, [
      { id: 'rename', label: 'Renommer', icon: 'pencil' },
      { id: 'note', label: 'Note de séance', icon: 'note' },
      { id: 'duration', label: 'Corriger la durée', icon: 'clock' },
      ...(canLink ? [{ id: 'link', label: 'Compter pour un jour du programme', icon: 'calendar' }] : []),
      { id: 'delete', label: 'Supprimer la séance', icon: 'trash', danger: true },
    ])
    if (c === 'link') await linkToDay()
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
        {canLink && (
          <button className="callout small row-between" style={{ gap: 10, textAlign: 'left', width: '100%' }} onClick={linkToDay}>
            <span>
              {linkedPlan
                ? `Chez le coach : compte pour le ${String(session.coachDay).toLowerCase()} (${linkedPlan.name})`
                : 'Chez le coach : reliée à aucune séance du programme (exercices en note du jour)'}
            </span>
            <span className="link-btn">{linkedPlan ? 'Changer' : 'Relier'}</span>
          </button>
        )}
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
                  {!ex.pour && linkedPlan && ex.replacedFrom && (
                    <div className="small" style={{ color: '#60a5fa', marginTop: 2 }}>Chez le coach : compte pour {findExercise(ex.replacedFrom, custom).name}</div>
                  )}
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
