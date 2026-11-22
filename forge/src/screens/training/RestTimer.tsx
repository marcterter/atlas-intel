import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/store.ts'
import { fmtTimer } from '../../lib/format.ts'
import { beep, haptic } from '../../lib/device.ts'
import { Icon } from '../../components/Icon.tsx'
import { findExercise } from '../../data/exercises.ts'

let alertedFor = 0

/** Chrono de repos : se lance à la validation d'une série, bipe et vibre à la fin. */
export function RestTimerBar({ inSheet = false }: { inSheet?: boolean }) {
  const timer = useStore((s) => s.restTimer)
  const adjust = useStore((s) => s.adjustRest)
  const clear = useStore((s) => s.clearRest)
  const sound = useStore((s) => s.settings.sound)
  const hapticsOn = useStore((s) => s.settings.haptics)
  const active = useStore((s) => s.active)
  const custom = useStore((s) => s.customExercises)
  const [now, setNow] = useState(() => Date.now())
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!timer) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [timer])

  const remaining = timer ? Math.ceil((timer.endsAt - now) / 1000) : 0
  const finished = !!timer && remaining <= 0

  useEffect(() => {
    if (!timer || !finished) return
    if (alertedFor !== timer.endsAt) {
      alertedFor = timer.endsAt
      // Pas d'alerte si l'app était en arrière-plan depuis longtemps.
      if (Date.now() - timer.endsAt < 5000) {
        if (sound) beep()
        if (hapticsOn) haptic(true)
      }
    }
    clearTimer.current = setTimeout(() => clear(), 6000)
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current)
    }
  }, [finished, timer, sound, hapticsOn, clear])

  if (!timer) return null
  const pct = Math.max(0, Math.min(1, 1 - (timer.endsAt - now) / 1000 / timer.total))
  const ex = active?.exercises.find((e) => e.uid === timer.exerciseUid)
  const nextLabel = ex ? findExercise(ex.exerciseId, custom).name : null

  return (
    <div className={`rest-bar ${finished ? 'finished' : ''}`} style={inSheet ? { bottom: 'calc(var(--safe-bottom) + 14px)' } : undefined} role="timer">
      <div className="row">
        <div className="grow">
          <div className="tiny faint bold ellipsis" style={{ letterSpacing: '.08em', maxWidth: '44vw' }}>
            {finished ? 'C’EST REPARTI !' : 'REPOS'}
            {nextLabel && !finished ? ` · ${nextLabel}` : ''}
          </div>
          <div className="rest-time" style={{ color: finished ? 'var(--ok)' : undefined }}>
            {finished ? '0:00' : fmtTimer(remaining)}
          </div>
        </div>
        {!finished && (
          <>
            <button className="btn soft small" onClick={() => adjust(-15)} aria-label="Moins 15 secondes">
              −15
            </button>
            <button className="btn soft small" onClick={() => adjust(15)} aria-label="Plus 15 secondes">
              +15
            </button>
          </>
        )}
        <button className="icon-btn filled" onClick={clear} aria-label="Arrêter le chrono">
          <Icon name={finished ? 'check' : 'x'} size={20} />
        </button>
      </div>
      <div className="bar thin" style={{ marginTop: 10 }}>
        <i style={{ width: `${pct * 100}%`, background: finished ? 'var(--ok)' : 'var(--accent)' }} />
      </div>
    </div>
  )
}
