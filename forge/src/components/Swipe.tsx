// Glisser une ligne vers la gauche pour la supprimer, comme dans Mail sur iPhone : un petit glissé
// révèle le bouton rouge, un grand glissé supprime directement. Le défilement vertical reste normal.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from './Icon.tsx'
import { haptic } from '../lib/device.ts'

/** Largeur du bouton révélé. */
const REVEAL = 88

/** Une seule ligne ouverte à la fois : on referme la précédente. */
let openRow: (() => void) | null = null

interface Gesture {
  id: number
  x0: number
  y0: number
  from: number
  mode: 'wait' | 'drag' | 'off'
  width: number
}

export function SwipeToDelete({
  children,
  onDelete,
  label = 'Supprimer',
  className = '',
  vibrate = true,
}: {
  children: ReactNode
  onDelete: () => void
  label?: string
  className?: string
  vibrate?: boolean
}) {
  const wrap = useRef<HTMLDivElement>(null)
  const [x, setXState] = useState(0)
  const xRef = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [armed, setArmedState] = useState(false)
  const armedRef = useRef(false)
  // Le rouge reste derrière la ligne le temps qu'elle se referme.
  const [shown, setShown] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const gesture = useRef<Gesture | null>(null)
  const swallowClick = useRef(false)
  const mounted = useRef(true)
  const onDeleteRef = useRef(onDelete)
  onDeleteRef.current = onDelete

  const helpers = useRef({
    setX(v: number) {
      xRef.current = v
      setXState(v)
    },
    setArmed(v: boolean) {
      armedRef.current = v
      setArmedState(v)
    },
    close() {
      helpers.setX(0)
      helpers.setArmed(false)
      if (openRow === helpers.close) openRow = null
    },
  }).current

  useEffect(
    () => () => {
      mounted.current = false
      if (openRow === helpers.close) openRow = null
    },
    [helpers],
  )

  const remove = () => {
    if (leaving) return
    const el = wrap.current
    setLeaving(true)
    setShown(true)
    helpers.setX(-(el?.offsetWidth ?? 420))
    if (openRow === helpers.close) openRow = null
    if (el) {
      el.style.height = `${el.offsetHeight}px`
      void el.offsetHeight
      el.style.height = '0px'
    }
    window.setTimeout(() => {
      onDeleteRef.current()
      // Si la ligne n'a pas disparu (suppression refusée), on la remet.
      window.setTimeout(() => {
        if (!mounted.current) return
        if (wrap.current) wrap.current.style.height = ''
        setLeaving(false)
        helpers.close()
      }, 400)
    }, 190)
  }

  const isOpen = x < 0 && !dragging && !leaving
  useEffect(() => {
    if (!isOpen) return
    // Toucher ailleurs referme la ligne.
    const onDown = (ev: PointerEvent) => {
      if (!wrap.current?.contains(ev.target as Node)) helpers.close()
    }
    document.addEventListener('pointerdown', onDown, true)
    return () => document.removeEventListener('pointerdown', onDown, true)
  }, [isOpen, helpers])

  const end = (e: React.PointerEvent, cancelled: boolean) => {
    const g = gesture.current
    if (!g || g.id !== e.pointerId) return
    gesture.current = null
    if (g.mode !== 'drag') return
    setDragging(false)
    swallowClick.current = true
    window.setTimeout(() => (swallowClick.current = false), 0)
    if (!cancelled && armedRef.current) return remove()
    helpers.setArmed(false)
    if (!cancelled && xRef.current < -REVEAL / 2) {
      helpers.setX(-REVEAL)
      openRow = helpers.close
    } else helpers.close()
  }

  return (
    <div
      ref={wrap}
      className={`swipe ${dragging ? 'dragging' : ''} ${armed ? 'armed' : ''} ${leaving ? 'leaving' : ''} ${className}`}
      onPointerDown={(e) => {
        if (leaving || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return
        // Curseur déjà dans un champ : on laisse sélectionner le texte.
        if (e.target === document.activeElement && (e.target as HTMLElement).tagName === 'INPUT') return
        if (openRow && openRow !== helpers.close) openRow()
        gesture.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, from: xRef.current, mode: 'wait', width: wrap.current?.offsetWidth ?? 360 }
      }}
      onPointerMove={(e) => {
        const g = gesture.current
        if (!g || g.id !== e.pointerId || g.mode === 'off') return
        const dx = e.clientX - g.x0
        const dy = e.clientY - g.y0
        if (g.mode === 'wait') {
          if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return
          // Défilement vertical, ou glissé vers la droite sur une ligne fermée : pas pour nous.
          if (Math.abs(dy) >= Math.abs(dx) || (dx > 0 && g.from === 0)) {
            g.mode = 'off'
            return
          }
          g.mode = 'drag'
          setDragging(true)
          setShown(true)
          try {
            wrap.current?.setPointerCapture(e.pointerId)
          } catch {
            /* ignore */
          }
        }
        const next = Math.min(0, g.from + dx)
        helpers.setX(next)
        const isArmed = -next > Math.min(g.width * 0.5, 200)
        if (isArmed !== armedRef.current) {
          helpers.setArmed(isArmed)
          if (isArmed && vibrate) haptic(false)
        }
      }}
      onPointerUp={(e) => end(e, false)}
      onPointerCancel={(e) => end(e, true)}
      onClickCapture={(e) => {
        if ((e.target as HTMLElement).closest('.swipe-act')) return
        // Après un glissé, ou ligne ouverte : le toucher referme au lieu d'agir.
        if (swallowClick.current || xRef.current < 0) {
          e.preventDefault()
          e.stopPropagation()
          if (xRef.current < 0 && !leaving) helpers.close()
        }
      }}
    >
      {(shown || x < 0) && (
        <div className="swipe-act">
          <button type="button" style={{ width: Math.max(REVEAL, -x) }} onClick={remove} aria-label={label}>
            <Icon name="trash" size={20} />
            <span>{label}</span>
          </button>
        </div>
      )}
      <div
        className="swipe-body"
        style={x ? { transform: `translateX(${x}px)` } : undefined}
        onTransitionEnd={() => {
          if (xRef.current === 0 && !gesture.current) setShown(false)
        }}
      >
        {children}
      </div>
    </div>
  )
}
