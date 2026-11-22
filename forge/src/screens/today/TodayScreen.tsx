import { useMemo } from 'react'
import { Icon } from '../../components/Icon.tsx'
import { Ring, promptNumber } from '../../components/ui.tsx'
import { MiniBars } from '../../components/charts.tsx'
import { MacroSummary } from '../diet/components.tsx'
import { openAddFood } from '../diet/DietScreen.tsx'
import { ActiveSessionBanner } from '../training/ActiveSession.tsx'
import { startRoutine } from '../training/TrainingScreen.tsx'
import { SessionRecap } from '../training/SessionRecap.tsx'
import { StepsSheet } from './StepsSheet.tsx'
import { SyncChip } from '../profile/SyncChip.tsx'
import { DayLogCard } from './DayLog.tsx'
import { DayTypeSwitch, useDayLabel } from '../diet/DayType.tsx'
import { useStore } from '../../store/store.ts'
import { dayTargets } from '../../store/selectors.ts'
import { ui, useUI } from '../../store/ui.ts'
import { addDays, cap, dayLetter, dayNum, formatLong, lastNDays, relativeDay, todayISO, weekDays } from '../../lib/date.ts'
import { dayTotals } from '../../lib/nutrition.ts'
import { weekAverage } from '../../lib/body.ts'
import { sessionDurationMs, sessionTonnage, sessionWorkSets } from '../../lib/training.ts'
import { fmt, fmtDuration, fmtKg, fmtSigned, fmtTonnage } from '../../lib/format.ts'

export async function editWeight(date: string) {
  const s = useStore.getState()
  const cur = s.weighins.find((w) => w.date === date)
  const last = [...s.weighins].filter((w) => w.date < date).pop()
  const v = await promptNumber({
    title: `Pesée · ${relativeDay(date)}`,
    hint: 'Le matin, à jeun, après être passé aux toilettes.',
    initial: cur?.kg ?? last?.kg ?? null,
    suffix: 'kg',
    decimal: true,
    allowClear: !!cur,
  })
  if (v === undefined) return
  if (v != null && (v < 30 || v > 300)) return ui.toast('Poids invalide', 'err')
  s.setWeighIn(date, v == null ? null : Math.round(v * 10) / 10)
}

function WeekStrip({ date, onSelect }: { date: string; onSelect: (d: string) => void }) {
  const entries = useStore((s) => s.entries)
  const sessions = useStore((s) => s.sessions)
  const today = todayISO()
  const days = weekDays(date)
  const logged = useMemo(() => {
    const set = new Set<string>()
    for (const e of entries) set.add(e.date)
    for (const s of sessions) set.add(s.date)
    return set
  }, [entries, sessions])
  const streak = useMemo(() => {
    let n = 0
    let d = logged.has(today) ? today : addDays(today, -1)
    while (logged.has(d)) {
      n++
      d = addDays(d, -1)
    }
    return n
  }, [logged, today])
  return (
    <div className="week-strip">
      <button className="icon-btn" style={{ width: 26 }} onClick={() => onSelect(addDays(date, -7))} aria-label="Semaine précédente">
        <Icon name="chevron-left" size={18} />
      </button>
      <div className="days">
        {days.map((d) => (
          <button key={d} className={`day-cell ${d === date ? 'selected' : ''} ${d === today ? 'today' : ''}`} onClick={() => onSelect(d)}>
            <span className="l">{dayLetter(d)}</span>
            <span className="n">{dayNum(d)}</span>
            {d <= today ? (
              <span className={`mark ${logged.has(d) ? 'on' : 'off'}`}>{logged.has(d) && <Icon name="check" size={10} stroke={4} />}</span>
            ) : (
              <span className="mark" />
            )}
          </button>
        ))}
      </div>
      <button className="icon-btn" style={{ width: 26 }} onClick={() => onSelect(addDays(date, 7))} aria-label="Semaine suivante" disabled={addDays(date, 7) > addDays(today, 6)}>
        <Icon name="chevron-right" size={18} />
      </button>
      <div className="streak" title="Jours d'affilée avec un suivi">
        <Icon name="flame" size={16} fill stroke={0} />
        <span className="num">{streak}</span>
      </div>
    </div>
  )
}

export function TodayScreen() {
  const date = useUI((s) => s.date)
  const setDate = useUI((s) => s.setDate)
  const name = useStore((s) => s.profile.name)
  const entries = useStore((s) => s.entries)
  const steps = useStore((s) => s.steps)
  const stepsGoal = useStore((s) => s.targets.steps)
  const fiberGoal = useStore((s) => s.targets.fiber)
  const weighins = useStore((s) => s.weighins)
  const sessions = useStore((s) => s.sessions)
  const routines = useStore((s) => s.routines)
  const custom = useStore((s) => s.customExercises)
  const active = useStore((s) => s.active)
  const t = useStore((s) => dayTargets(s, date))
  const dayLabel = useDayLabel(date, true)
  const today = todayISO()

  const totals = useMemo(() => dayTotals(entries, date), [entries, date])
  const daySteps = steps.find((s) => s.date === date)
  const last7 = lastNDays(date, 7)
  const w = weighins.find((x) => x.date === date)
  const wk = weekAverage(weighins, date)
  const prevWk = weekAverage(weighins, addDays(date, -7))
  const wkDots = weekDays(date).map((d) => ({ d, on: weighins.some((x) => x.date === d) }))
  const daySessions = sessions.filter((s) => s.date === date)

  const hour = new Date().getHours()
  const hello = hour < 5 ? 'Bonne nuit' : hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <h1 className="display screen-title">{date === today ? 'Aujourd’hui' : relativeDay(date)}</h1>
          <div className="subtitle">
            {date === today ? `${hello}${name ? ` ${name}` : ''} · ${formatLong(date)}` : cap(formatLong(date))}
          </div>
        </div>
        <SyncChip />
      </div>

      <div className="stack">
        <WeekStrip date={date} onSelect={setDate} />
        {date !== today && (
          <button className="link-btn" onClick={() => setDate(today)} style={{ alignSelf: 'center' }}>
            Revenir à aujourd’hui
          </button>
        )}

        <ActiveSessionBanner />

        <button className="card pressable" onClick={() => ui.setTab('diet')}>
          <div className="card-head">
            <div className="icon-tile">
              <Icon name="food" size={20} />
            </div>
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="card-title">Calories</div>
              <div className="faint small ellipsis">{dayLabel}</div>
            </div>
            <DayTypeSwitch date={date} size="small" />
            <span
              className="icon-btn accent"
              role="button"
              aria-label="Ajouter un aliment"
              onClick={(e) => {
                e.stopPropagation()
                openAddFood(date)
              }}
            >
              <Icon name="plus" />
            </span>
          </div>
          <MacroSummary n={totals} t={t} compact fiberGoal={fiberGoal} />
        </button>

        <div className="grid-2">
          <button className="card pressable" onClick={() => ui.push(<StepsSheet date={date} />)}>
            <div className="row-between">
              <div className="icon-tile green" style={{ width: 32, height: 32, borderRadius: 10 }}>
                <Icon name="steps" size={18} />
              </div>
              <span className="tiny faint bold">PAS</span>
            </div>
            <div className="row" style={{ marginTop: 10, gap: 10 }}>
              <Ring value={stepsGoal ? (daySteps?.steps ?? 0) / stepsGoal : 0} size={54} stroke={7} color="var(--steps)">
                <span className="tiny bold">{stepsGoal ? Math.min(999, Math.round(((daySteps?.steps ?? 0) / stepsGoal) * 100)) : 0}%</span>
              </Ring>
              <div>
                <div className="big-number" style={{ fontSize: 24 }}>
                  {daySteps ? fmt(daySteps.steps) : '–'}
                </div>
                <div className="tiny faint">/ {fmt(stepsGoal)}</div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <MiniBars values={last7.map((d) => steps.find((s) => s.date === d)?.steps ?? null)} labels={last7.map(dayLetter)} goal={stepsGoal} height={34} highlight={6} />
            </div>
          </button>

          <button className="card pressable" onClick={() => editWeight(date)}>
            <div className="row-between">
              <div className="icon-tile violet" style={{ width: 32, height: 32, borderRadius: 10 }}>
                <Icon name="scale" size={18} />
              </div>
              <span className="tiny faint bold">POIDS</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <div className="big-number" style={{ fontSize: 24 }}>
                {w ? fmtKg(w.kg) : '–'}
                <span className="small faint" style={{ fontFamily: 'var(--font-body)' }}>
                  {' '}
                  kg
                </span>
              </div>
              <div className="tiny faint">{w ? 'pesée du jour' : 'Toucher pour te peser'}</div>
            </div>
            <div className="dots7" style={{ marginTop: 12, gap: 5 }}>
              {wkDots.map((x) => (
                <i key={x.d} className={`${x.on ? 'on' : ''} ${x.d === date ? 'today' : ''}`} style={{ width: 12, height: 12 }} />
              ))}
            </div>
            <div className="tiny" style={{ marginTop: 8 }}>
              <span className="faint">Moy. semaine </span>
              <b className="num">{wk.avg != null ? fmtKg(Math.round(wk.avg * 10) / 10) : '–'}</b>
              {wk.avg != null && prevWk.avg != null && (
                <span className="num" style={{ color: wk.avg - prevWk.avg <= 0 ? 'var(--ok)' : 'var(--warn)', marginLeft: 4 }}>
                  {fmtSigned(wk.avg - prevWk.avg, 1)}
                </span>
              )}
            </div>
          </button>
        </div>

        <DayLogCard date={date} />

        <div className="card">
          <div className="card-head" style={{ marginBottom: daySessions.length || !active ? 12 : 0 }}>
            <div className="icon-tile">
              <Icon name="dumbbell" size={20} />
            </div>
            <div className="grow">
              <div className="card-title">Séance</div>
              <div className="faint small">{daySessions.length ? 'Bien joué 💪' : date === today ? 'Au programme aujourd’hui ?' : 'Pas de séance ce jour-là'}</div>
            </div>
          </div>
          {daySessions.map((s) => (
            <button key={s.id} className="list-item" style={{ padding: '10px 0', borderTop: 0 }} onClick={() => ui.push(<SessionRecap sessionId={s.id} />)}>
              <div className="grow">
                <div className="title">{s.name}</div>
                <div className="meta">
                  {fmtDuration(sessionDurationMs(s))} · {sessionWorkSets(s)} séries · {fmtTonnage(sessionTonnage(s, custom))}
                </div>
              </div>
              <span className="badge ok">
                <Icon name="check" size={12} stroke={3} /> Faite
              </span>
            </button>
          ))}
          {date === today && !active && (
            <div className="chips" style={{ marginTop: daySessions.length ? 8 : 0 }}>
              {routines.map((r) => (
                <button key={r.id} className="chip" onClick={() => startRoutine(r.id)}>
                  <Icon name="play" size={12} fill stroke={0} /> {r.name}
                </button>
              ))}
              <button className="chip" onClick={() => (routines.length ? startRoutine(null) : ui.setTab('training'))}>
                <Icon name="bolt" size={14} /> {routines.length ? 'Séance libre' : 'Créer mon programme'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
