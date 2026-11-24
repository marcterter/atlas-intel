import { memo, useEffect, useMemo, useState } from 'react'
import { Sheet, confirmDialog, menuDialog, promptText, useNow } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { SwipeToDelete } from '../../components/Swipe.tsx'
import { ExercisePicker } from './ExercisePicker.tsx'
import { RestTimerBar } from './RestTimer.tsx'
import { SessionRecap } from './SessionRecap.tsx'
import { ReorderSheet } from './Reorder.tsx'
import { ExerciseProgress } from '../progress/ExerciseProgress.tsx'
import { findExercise, MUSCLE_LABEL } from '../../data/exercises.ts'
import { useStore } from '../../store/store.ts'
import { ui, useUI } from '../../store/ui.ts'
import {
  addExercise,
  addSet,
  doNow,
  doNowIndex,
  insertSet,
  lastSetAt,
  nearestFilled,
  removeExercise,
  removeSet,
  replaceExercise,
  shouldRestAfter,
  suggestedEnd,
  toggleSetDone,
  toggleSupersetWithNext,
  updateExercise,
  updateSet,
} from '../../lib/sessionOps.ts'
import { lastNoteFor, previousSets, sessionTonnage, sessionWorkSets, setLabel } from '../../lib/training.ts'
import { adviseExercise, type Trend } from '../../lib/progression.ts'
import { exerciseAdviceFor } from '../../lib/agent.ts'
import { assignMakeUps, countForLabel, makeUpOptions } from '../../lib/makeup.ts'
import { coachChoices, coachMapping, coachPlanFor } from '../../lib/coachMap.ts'
import { fmtClock, fmtDuration, fmtKg, fmtTimer, fmtTonnage, parseNum } from '../../lib/format.ts'
import { keepScreenOn, haptic, unlockAudio } from '../../lib/device.ts'
import { relativeDay, todayISO } from '../../lib/date.ts'
import { syncNow } from '../../lib/sync.ts'
import type { Exercise, Session, SessionExercise, SetEntry, SetType } from '../../lib/types.ts'

export function ActiveSession() {
  const active = useStore((s) => s.active)
  const history = useStore((s) => s.sessions)
  const custom = useStore((s) => s.customExercises)
  const routines = useStore((s) => s.routines)
  const keepAwake = useStore((s) => s.settings.keepAwake)
  const defaultRest = useStore((s) => s.settings.defaultRestSec)
  const updateActive = useStore((s) => s.updateActive)
  const finishSession = useStore((s) => s.finishSession)
  const discardSession = useStore((s) => s.discardSession)
  const now = useNow(1000)

  useEffect(() => {
    if (!keepAwake) return
    void keepScreenOn(true)
    return () => void keepScreenOn(false)
  }, [keepAwake])

  useEffect(() => {
    if (!active) useUI.getState().pop()
  }, [active])

  // Rattrapages : un exercice d'une autre séance du programme (les bras de l'Upper faits avant les
  // jambes) compte pour elle chez le coach. Choix automatique, modifiable sur la carte de l'exercice.
  const makeUps = useMemo(() => {
    if (!active) return null
    const assigned = assignMakeUps(active, history, routines, custom)
    const kept = new Set(active.exercises.filter((e) => e.pour === null && makeUpOptions(active, e, history, routines, custom).length).map((e) => e.uid))
    return { assigned, kept }
  }, [active, history, routines, custom])

  // Séance à toi comptée pour un jour du programme : la ligne du coach de chaque exercice.
  const coachLines = useMemo(() => (active && coachPlanFor(active, routines) ? coachMapping(active, routines, custom) : null), [active, routines, custom])

  if (!active) return null

  const tonnage = sessionTonnage(active, custom)
  const done = sessionWorkSets(active)

  const finish = async () => {
    const hasWork = active.exercises.some((e) => e.sets.some((x) => x.done))
    if (!hasWork) {
      if (await confirmDialog({ title: 'Aucune série validée', message: 'Abandonner cette séance ? Rien ne sera enregistré.', confirm: 'Abandonner', danger: true })) {
        discardSession()
      }
      return
    }
    const pending = active.exercises.reduce((n, e) => n + e.sets.filter((x) => !x.done).length, 0)
    const pendingText = pending ? `${pending} série${pending > 1 ? 's' : ''} non validée${pending > 1 ? 's' : ''} ne ser${pending > 1 ? 'ont' : 'a'} pas enregistrée${pending > 1 ? 's' : ''}.` : ''
    // Séance oubliée : on propose de la terminer juste après la dernière série (durée juste chez le coach).
    const late = suggestedEnd(active)
    let endedAt: number | undefined
    if (late) {
      const last = lastSetAt(active) ?? late
      const c = await menuDialog(`Ta dernière série date de ${fmtClock(last)}.${pendingText ? ` ${pendingText}` : ''}`, [
        { id: 'late', label: `Terminer à ${fmtClock(late)} · ${fmtDuration(late - active.startedAt)}`, icon: 'clock' },
        { id: 'now', label: `Terminer maintenant · ${fmtDuration(Date.now() - active.startedAt)}`, icon: 'check' },
      ])
      if (!c) return
      if (c === 'late') endedAt = late
    } else {
      const ok = await confirmDialog({ title: 'Terminer la séance ?', message: pendingText || 'Bravo, tout est validé.', confirm: 'Terminer' })
      if (!ok) return
    }
    const id = finishSession(endedAt)
    if (id) {
      useUI.getState().replaceTop(<SessionRecap sessionId={id} />, `recap-${id}`)
      void syncNow()
    }
  }

  const headerMenu = async () => {
    const c = await menuDialog(null, [
      { id: 'rename', label: 'Renommer la séance', icon: 'pencil' },
      { id: 'note', label: 'Note de séance', icon: 'note' },
      ...(active.exercises.length > 1 ? [{ id: 'order', label: 'Réorganiser les exercices', icon: 'list' }] : []),
      { id: 'discard', label: 'Abandonner la séance', icon: 'trash', danger: true },
    ])
    if (c === 'rename') {
      const name = await promptText({ title: 'Nom de la séance', initial: active.name })
      if (name?.trim()) updateActive((s) => ({ ...s, name: name.trim() }))
    }
    if (c === 'note') {
      const note = await promptText({ title: 'Note de séance', initial: active.note ?? '', multiline: true, placeholder: 'Forme du jour, sommeil, douleurs…' })
      if (note !== undefined) updateActive((s) => ({ ...s, note }))
    }
    if (c === 'order') ui.push(<ReorderSheet />)
    if (c === 'discard' && (await confirmDialog({ title: 'Abandonner ?', message: 'Les séries de cette séance seront perdues.', confirm: 'Abandonner', danger: true }))) {
      discardSession()
    }
  }

  return (
    <>
      <Sheet
        title={
          <span onClick={headerMenu} style={{ cursor: 'pointer' }}>
            {active.name}
          </span>
        }
        closeIcon="chevron-down"
        right={
          <>
            <button className="icon-btn" onClick={headerMenu} aria-label="Options">
              <Icon name="more" />
            </button>
            <button className="btn small ok" onClick={finish}>
              Terminer
            </button>
          </>
        }
      >
        <div className="grid-3" style={{ marginBottom: 14 }}>
          <div className="stat">
            <div className="k">Durée</div>
            <div className="v">{fmtTimer((now - active.startedAt) / 1000)}</div>
          </div>
          <div className="stat">
            <div className="k">Séries</div>
            <div className="v">{done}</div>
          </div>
          <div className="stat">
            <div className="k">Tonnage</div>
            <div className="v">{fmtTonnage(tonnage)}</div>
          </div>
        </div>

        <div className="stack">
          {active.exercises.length === 0 && (
            <div className="callout">Séance libre : ajoute tes exercices au fur et à mesure.</div>
          )}
          {active.exercises.map((ex, i) => (
            <ExerciseBlock
              key={ex.uid}
              ex={ex}
              count={active.exercises.length}
              nextSuperset={active.exercises[i + 1]?.superset ?? null}
              startedAt={active.startedAt}
              coachDay={active.coachDay ?? null}
              history={history}
              custom={custom}
              countDay={makeUps?.assigned.get(ex.uid)?.coachDay}
              countLabel={(() => {
                const cf = makeUps?.assigned.get(ex.uid)
                return cf ? countForLabel(cf, findExercise(ex.exerciseId, custom).name) : undefined
              })()}
              keptHere={!!makeUps?.kept.has(ex.uid)}
              coachLine={(() => {
                if (!coachLines || ex.pour || makeUps?.assigned.has(ex.uid) || findExercise(ex.exerciseId, custom).kind === 'cardio') return undefined
                const l = coachLines.get(ex.uid)
                return l ? (l.exact ? undefined : l.target) : null
              })()}
            />
          ))}
          <button
            className="btn soft block"
            onClick={() =>
              ui.push(
                <ExercisePicker
                  onPick={(ids) => {
                    updateActive((s) => ids.reduce((acc, id) => addExercise(acc, id, findExercise(id, custom).kind === 'cardio' ? 60 : defaultRest, findExercise(id, custom).kind === 'cardio' ? 1 : 3), s))
                  }}
                />,
              )
            }
          >
            <Icon name="plus" size={20} /> Ajouter un exercice
          </button>
          <button className="btn ok block" onClick={finish}>
            <Icon name="check" size={20} /> Terminer la séance
          </button>
          <div style={{ height: 120 }} />
        </div>
      </Sheet>
      <RestTimerBar inSheet />
    </>
  )
}

const TYPE_SHORT: Record<SetType, string> = { normal: '', echauffement: 'É', degressive: 'D', echec: 'F' }
const TYPE_CLASS: Record<SetType, string> = { normal: '', echauffement: 'warm', degressive: 'drop', echec: 'fail' }

const ExerciseBlock = memo(function ExerciseBlock({
  ex,
  count,
  nextSuperset,
  startedAt,
  coachDay,
  history,
  custom,
  countDay,
  countLabel,
  keptHere,
  coachLine,
}: {
  ex: SessionExercise
  count: number
  nextSuperset: string | null
  startedAt: number
  coachDay: string | null
  history: Session[]
  custom: Exercise[]
  /** Rattrapage : jour du coach et séance pour lesquels l'exercice compte. */
  countDay?: string
  countLabel?: string
  /** Rattrapage possible, mais l'exercice est gardé dans cette séance. */
  keptHere?: boolean
  /** Séance à toi comptée pour un jour du programme : exercice du coach remplacé (null : hors programme). */
  coachLine?: string | null
}) {
  const updateActive = useStore((s) => s.updateActive)
  const startRest = useStore((s) => s.startRest)
  const autoRest = useStore((s) => s.settings.autoRest)
  const hapticsOn = useStore((s) => s.settings.haptics)
  const exo = findExercise(ex.exerciseId, custom)
  const day = countDay ?? coachDay
  const prev = useMemo(() => previousSets(history, ex.exerciseId, startedAt, day), [history, ex.exerciseId, startedAt, day])
  const lastNote = useMemo(() => lastNoteFor(history, ex.exerciseId, startedAt), [history, ex.exerciseId, startedAt])
  // Objectif du jour (charge conseillée), recalculé à chaque série validée.
  const advice = useMemo(() => adviseExercise(ex, history, custom, startedAt, day), [ex, history, custom, startedAt, day])
  const allDone = ex.sets.length > 0 && ex.sets.every((x) => x.done)
  // Conseil de l'agent IA du lundi pour cet exercice (s'il en a donné un).
  const aiTip = useStore((s) => exerciseAdviceFor(s.conseils, exo.name, todayISO()))
  const [shakeId, setShakeId] = useState<string | null>(null)
  const [showNote, setShowNote] = useState(!!ex.note)
  const kind = exo.kind
  const linkedNext = ex.superset != null && ex.superset === nextSuperset

  const onToggle = (st: SetEntry) => {
    unlockAudio()
    let becameDone = false
    const ok = updateActive((s) => {
      const next = toggleSetDone(s, ex.uid, st.id, history, custom)
      if (next) becameDone = !st.done
      return next
    })
    if (!ok) {
      setShakeId(st.id)
      setTimeout(() => setShakeId(null), 350)
      ui.toast(kind === 'weight' ? 'Indique la charge et les répétitions' : kind === 'bodyweight' ? 'Indique les répétitions' : 'Indique la durée', 'err')
      return
    }
    if (becameDone) {
      if (hapticsOn) haptic(false)
      const s = useStore.getState().active
      if (autoRest && s && shouldRestAfter(s, ex.uid) && st.type !== 'echauffement') startRest(ex.restSec, ex.uid)
      else if (autoRest && st.type === 'echauffement') startRest(Math.min(60, ex.restSec), ex.uid)
    }
  }

  // Supprimer une série (glissé vers la gauche ou menu du numéro), avec « Annuler ».
  const deleteSet = (st: SetEntry) => {
    const index = ex.sets.findIndex((x) => x.id === st.id)
    if (!updateActive((s) => removeSet(s, ex.uid, st.id))) return
    ui.undo(`Série supprimée · ${exo.name}`, () => updateActive((s) => insertSet(s, ex.uid, st, index)))
  }

  const setMenu = async (st: SetEntry) => {
    const c = await menuDialog('Série', [
      { id: 'normal', label: 'Série normale' },
      { id: 'echauffement', label: 'Échauffement (É)' },
      { id: 'degressive', label: 'Dégressive (D)' },
      { id: 'echec', label: "Jusqu'à l'échec (F)" },
      { id: 'delete', label: 'Supprimer la série', icon: 'trash', danger: true },
    ])
    if (!c) return
    if (c === 'delete') deleteSet(st)
    else updateActive((s) => updateSet(s, ex.uid, st.id, { type: c as SetType }))
  }

  // Pour quelle séance compte cet exercice (rattrapage) : celle proposée, une autre, ou celle-ci.
  const makeUpMenu = async () => {
    const st = useStore.getState()
    const cur = st.active
    if (!cur) return
    const opts = makeUpOptions(cur, ex, st.sessions, st.routines, st.customExercises)
    const chosen = assignMakeUps(cur, st.sessions, st.routines, st.customExercises).get(ex.uid)
    const same = (o: { coachDay: string; date: string; targetId: string }) => !!chosen && chosen.coachDay === o.coachDay && chosen.date === o.date && chosen.targetId === o.targetId
    const c = await menuDialog('Compter cet exercice pour…', [
      ...opts.map((o, k) => ({ id: `o${k}`, label: `${countForLabel(o, exo.name)}${same(o) ? ' ✓' : ''}`, icon: 'calendar' })),
      { id: 'here', label: `Cette séance (${cur.name})${chosen ? '' : ' ✓'}`, icon: 'dumbbell' },
    ])
    if (c === 'here') updateActive((s) => updateExercise(s, ex.uid, { pour: null }))
    else if (c?.startsWith('o')) {
      const { exact: _exact, ...pour } = opts[Number(c.slice(1))]
      updateActive((s) => updateExercise(s, ex.uid, { pour }))
    }
  }

  // Séance à toi : pour quel exercice du programme du coach compte celui-ci (ou aucun).
  const coachMenu = async () => {
    const st = useStore.getState()
    const cur = st.active
    if (!cur) return
    const choices = coachChoices(cur, ex.uid, st.routines, st.customExercises)
    const current = coachMapping(cur, st.routines, st.customExercises).get(ex.uid)?.targetId
    const c = await menuDialog('Chez le coach, cet exercice compte pour…', [
      ...choices.map((t) => ({ id: `t:${t.id}`, label: `${t.name}${t.id === current ? ' ✓' : ''}`, icon: 'swap' })),
      { id: 'none', label: `Hors programme (note du jour)${current ? '' : ' ✓'}`, icon: 'note' },
      ...(ex.coachTarget !== undefined ? [{ id: 'auto', label: 'Choix automatique', icon: 'bolt' }] : []),
    ])
    if (!c) return
    if (c === 'none') updateActive((s) => updateExercise(s, ex.uid, { coachTarget: null }))
    else if (c === 'auto') updateActive((s) => updateExercise(s, ex.uid, { coachTarget: undefined }))
    else updateActive((s) => updateExercise(s, ex.uid, { coachTarget: c.slice(2) }))
  }

  const exMenu = async () => {
    const cur = useStore.getState().active
    const canNow = !!cur && doNowIndex(cur, ex.uid) != null
    const c = await menuDialog(exo.name, [
      // Remonter l'exercice à l'endroit où on en est (machine enfin libre…), superset compris.
      ...(canNow ? [{ id: 'now', label: 'Faire maintenant', icon: 'arrow-up' }] : []),
      { id: 'replace', label: 'Remplacer (machine prise…)', icon: 'swap' },
      { id: 'superset', label: linkedNext ? 'Retirer le superset' : 'Superset avec le suivant', icon: 'link' },
      { id: 'note', label: 'Ajouter une note', icon: 'note' },
      { id: 'rest', label: `Temps de repos (${fmtTimer(ex.restSec)})`, icon: 'clock' },
      { id: 'history', label: 'Voir la progression', icon: 'trend' },
      ...(count > 1 ? [{ id: 'order', label: 'Réorganiser la séance', icon: 'list' }] : []),
      { id: 'remove', label: "Retirer l'exercice", icon: 'trash', danger: true },
    ])
    if (c === 'replace')
      ui.push(
        <ExercisePicker
          title="Remplacer par…"
          multi={false}
          onPick={([id]) => {
            updateActive((s) => replaceExercise(s, ex.uid, id))
            ui.toast('Exercice remplacé', 'ok')
          }}
        />,
      )
    if (c === 'superset') updateActive((s) => toggleSupersetWithNext(s, ex.uid))
    if (c === 'note') setShowNote(true)
    if (c === 'history') ui.push(<ExerciseProgress exerciseId={ex.exerciseId} />)
    if (c === 'now' && updateActive((s) => doNow(s, ex.uid))) {
      // On suit l'exercice jusqu'à sa nouvelle place.
      requestAnimationFrame(() => {
        const el = document.getElementById(`ex-${ex.uid}`)
        if (!el) return
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        el.classList.add('flash')
        setTimeout(() => el.classList.remove('flash'), 1300)
      })
    }
    if (c === 'order') ui.push(<ReorderSheet />)
    if (c === 'rest') {
      const r = await menuDialog('Temps de repos', [45, 60, 75, 90, 120, 150, 180, 240, 300].map((v) => ({ id: String(v), label: fmtTimer(v) })))
      if (r) updateActive((s) => updateExercise(s, ex.uid, { restSec: Number(r) }))
    }
    if (c === 'remove' && (await confirmDialog({ title: 'Retirer cet exercice ?', confirm: 'Retirer', danger: true }))) {
      updateActive((s) => removeExercise(s, ex.uid))
    }
  }

  const cols =
    kind === 'weight'
      ? ['Kg', 'Reps']
      : kind === 'bodyweight'
        ? ['+Kg', 'Reps']
        : kind === 'duration'
          ? ['Sec', '']
          : ['Min', 'Km']

  let normalIdx = 0

  return (
    <div id={`ex-${ex.uid}`} className={`ex-card ${ex.superset ? 'superset' : ''}`}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <button className="grow" style={{ textAlign: 'left' }} onClick={() => ui.push(<ExerciseProgress exerciseId={ex.exerciseId} />)}>
          {ex.superset && <div className="superset-tag">SUPERSET</div>}
          <div className="ex-name">{exo.name}</div>
          <div className="faint small">
            {MUSCLE_LABEL[exo.muscle]}
            {ex.repsTarget ? ` · objectif ${ex.repsTarget}` : ''}
            {ex.rir ? ` · RIR ${ex.rir}` : ''} · repos {fmtTimer(ex.restSec)}
            {ex.replacedFrom ? ` · remplace ${findExercise(ex.replacedFrom, custom).name}` : ''}
          </div>
        </button>
        <button className="icon-btn" onClick={exMenu} aria-label="Options de l'exercice">
          <Icon name="more" />
        </button>
      </div>

      {(countLabel || keptHere) && (
        <button className={`makeup-chip ${countLabel ? '' : 'off'}`} onClick={makeUpMenu}>
          <Icon name="calendar" size={14} />
          <span className="grow">
            {countLabel ? (
              <>
                Rattrapage · compte pour <b>{countLabel}</b>
              </>
            ) : (
              'Compté dans cette séance · rattrapage possible'
            )}
          </span>
          <Icon name="chevron-right" size={14} />
        </button>
      )}

      {coachLine !== undefined && !(countLabel || keptHere) && (
        <button className={`makeup-chip ${coachLine ? '' : 'off'}`} onClick={coachMenu}>
          <Icon name="swap" size={14} />
          <span className="grow">
            {coachLine ? (
              <>
                Chez le coach : compte pour <b>{coachLine}</b>
              </>
            ) : (
              'Chez le coach : hors programme (note du jour)'
            )}
          </span>
          <Icon name="chevron-right" size={14} />
        </button>
      )}

      {advice && !allDone && (
        <div className={`advice ${advice.trend}`}>
          <div className="advice-line">
            <Icon name={advice.trend === 'up' ? 'arrow-up' : advice.trend === 'down' ? 'arrow-down' : 'target'} size={14} stroke={2.6} />
            <b>Objectif</b>
            <span className="num">{advice.summary}</span>
          </div>
          <div className="advice-why">{advice.why}</div>
        </div>
      )}

      {aiTip && (
        <div className="ai-tip">
          <Icon name="bolt" size={14} />
          <span>
            <b>Agent IA</b> · {aiTip}
          </span>
        </div>
      )}

      {lastNote && (
        <div className="small" style={{ marginTop: 8, color: 'var(--text-2)', fontStyle: 'italic' }}>
          <Icon name="note" size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
          {relativeDay(lastNote.date)} : {lastNote.note}
        </div>
      )}

      <div className={`sets-head ${kind === 'cardio' ? 'cardio' : ''}`}>
        <span className="center">Série</span>
        <span>Précédent</span>
        <span className="center">{cols[0]}</span>
        <span className="center">{kind === 'cardio' ? 'Km' : cols[1]}</span>
        <span />
      </div>
      {ex.sets.map((st, i) => {
        if (st.type !== 'echauffement') normalIdx++
        const p = prev[i]
        const before = nearestFilled(ex.sets, i)
        const adv = advice?.sets[i] ?? null
        // Les cases vides affichent l'objectif du jour (sinon la dernière fois) : ✓ le valide tel quel.
        const ph = (field: 'weight' | 'reps' | 'seconds' | 'km') => {
          const v = adv && field !== 'km' ? adv[field] : (p?.[field] ?? before?.[field])
          return v != null ? fmtKg(field === 'seconds' && kind === 'cardio' ? Math.round(v / 60) : v) : ''
        }
        const tone: Trend | undefined = adv && !st.done ? adv.trend : undefined
        return (
          <SwipeToDelete key={st.id} className="swipe-set" onDelete={() => deleteSet(st)} vibrate={hapticsOn}>
          <div className={`set-row ${kind === 'cardio' ? 'cardio' : ''} ${st.done ? 'done' : ''} ${shakeId === st.id ? 'shake' : ''}`}>
            <button className={`set-num ${TYPE_CLASS[st.type]}`} onClick={() => setMenu(st)} aria-label="Type de série">
              {TYPE_SHORT[st.type] || normalIdx}
            </button>
            <button
              className="prev"
              onClick={() =>
                p &&
                !st.done &&
                updateActive((s) => updateSet(s, ex.uid, st.id, { weight: p.weight, reps: p.reps, seconds: p.seconds, km: p.km }))
              }
            >
              {p ? setLabel(p, kind) : '–'}
            </button>
            {kind === 'weight' || kind === 'bodyweight' ? (
              <>
                <SetField value={st.weight} placeholder={ph('weight')} tone={tone} decimal onChange={(v) => updateActive((s) => updateSet(s, ex.uid, st.id, { weight: v }))} />
                <SetField value={st.reps} placeholder={ph('reps')} tone={tone === 'down' ? undefined : tone && 'same'} onChange={(v) => updateActive((s) => updateSet(s, ex.uid, st.id, { reps: v == null ? null : Math.round(v) }))} />
              </>
            ) : kind === 'duration' ? (
              <>
                <SetField value={st.seconds} placeholder={ph('seconds')} tone={tone} onChange={(v) => updateActive((s) => updateSet(s, ex.uid, st.id, { seconds: v == null ? null : Math.round(v) }))} />
                <span />
              </>
            ) : (
              <>
                <SetField
                  value={st.seconds != null ? Math.round(st.seconds / 60) : null}
                  placeholder={ph('seconds')}
                  onChange={(v) => updateActive((s) => updateSet(s, ex.uid, st.id, { seconds: v == null ? null : Math.round(v * 60) }))}
                />
                <SetField value={st.km} placeholder={ph('km')} decimal onChange={(v) => updateActive((s) => updateSet(s, ex.uid, st.id, { km: v }))} />
              </>
            )}
            <button className={`check-btn ${st.done ? 'on' : ''}`} onClick={() => onToggle(st)} aria-label={st.done ? 'Annuler la validation' : 'Valider la série'}>
              <Icon name="check" size={20} stroke={3} />
            </button>
          </div>
          </SwipeToDelete>
        )
      })}

      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn soft small grow" onClick={() => updateActive((s) => addSet(s, ex.uid))}>
          <Icon name="plus" size={18} /> Série
        </button>
        {!showNote && (
          <button className="btn ghost small" onClick={() => setShowNote(true)}>
            <Icon name="note" size={18} /> Note
          </button>
        )}
      </div>
      {showNote && (
        <textarea
          className="input"
          style={{ marginTop: 8, minHeight: 64 }}
          placeholder="Sensations, réglages machine, objectif pour la prochaine fois…"
          value={ex.note ?? ''}
          onChange={(e) => updateActive((s) => updateExercise(s, ex.uid, { note: e.target.value }))}
        />
      )}
      {kind === 'cardio' && (
        <div className="faint tiny" style={{ marginTop: 6 }}>
          Min = durée en minutes. Les kcal du cardio ne sont pas déduites de ta diète.
        </div>
      )}
    </div>
  )
})

function SetField({
  value,
  placeholder,
  decimal,
  tone,
  onChange,
}: {
  value: number | null
  placeholder: string
  decimal?: boolean
  /** Couleur de l'objectif affiché en grisé : hausse, maintien ou baisse de charge. */
  tone?: Trend
  onChange: (v: number | null) => void
}) {
  const [raw, setRaw] = useState(value != null ? String(value).replace('.', ',') : '')
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    if (focused) return
    setRaw(value != null ? String(value).replace('.', ',') : '')
  }, [value, focused])
  return (
    <input
      className={`set-input ${tone ? `tone-${tone}` : ''}`}
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={raw}
      placeholder={placeholder}
      onFocus={(e) => {
        setFocused(true)
        e.currentTarget.select()
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        setRaw(e.target.value)
        onChange(parseNum(e.target.value))
      }}
    />
  )
}

/** Bandeau "séance en cours" affiché sur les onglets quand la séance est réduite. */
export function ActiveSessionBanner() {
  const active = useStore((s) => s.active)
  const now = useNow(1000)
  if (!active) return null
  const sets = sessionWorkSets(active)
  return (
    <button className="card pressable" style={{ borderColor: 'rgba(255,107,44,.45)', background: 'var(--accent-soft)' }} onClick={() => ui.push(<ActiveSession />, 'active-session')}>
      <div className="row">
        <div className="icon-tile">
          <Icon name="dumbbell" />
        </div>
        <div className="grow">
          <div className="bold">{active.name} · en cours</div>
          <div className="small muted">
            {fmtDuration(now - active.startedAt)} · {sets} série{sets > 1 ? 's' : ''} validée{sets > 1 ? 's' : ''}
          </div>
        </div>
        <span className="btn small">Reprendre</span>
      </div>
    </button>
  )
}
