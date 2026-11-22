import { confirmDialog } from '../../components/ui.tsx'
import { TargetsEditor } from '../profile/ProfileForms.tsx'
import { useStore } from '../../store/store.ts'
import { autoDay, daySource, isTrainingDay, type DaySource } from '../../store/selectors.ts'
import { ui } from '../../store/ui.ts'
import type { ISODate } from '../../lib/types.ts'

export const DAY_SOURCE: Record<DaySource, string> = {
  manuel: 'choisi à la main',
  seance: 'séance faite',
  programme: 'séance prévue',
  aucune: 'sans séance',
}

/**
 * Interrupteur Jour ON / Jour OFF en un geste. Revenir au type « automatique » efface le choix manuel.
 * Sans objectifs OFF, propose de les définir.
 */
export function DayTypeSwitch({ date, size = 'normal' }: { date: ISODate; size?: 'normal' | 'small' }) {
  const on = useStore((s) => isTrainingDay(s, date))
  const auto = useStore((s) => autoDay(s, date).on)
  const hasOff = useStore((s) => !!s.targets.rest)
  const setDayType = useStore((s) => s.setDayType)

  const choose = async (next: boolean) => {
    if (next === on) return
    if (!hasOff) {
      const ok = await confirmDialog({
        title: 'Objectifs Jour OFF',
        message: 'Tu as les mêmes objectifs tous les jours. Définis tes macros des jours sans séance (ou reprends celles de ton coach).',
        confirm: 'Les définir',
      })
      if (ok) ui.push(<TargetsEditor withOff />)
      return
    }
    setDayType(date, next === auto ? null : next)
  }

  // Des <span role="button"> : l'interrupteur peut se trouver dans une carte cliquable.
  const seg = (value: boolean, label: string) => (
    <span
      role="button"
      tabIndex={0}
      aria-pressed={on === value}
      className={on === value ? `active ${value ? 'on' : 'off'}` : ''}
      onClick={(e) => {
        e.stopPropagation()
        void choose(value)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          void choose(value)
        }
      }}
    >
      {label}
    </span>
  )
  return (
    <span className={`daytype ${size}`} role="group" aria-label="Type de jour">
      {seg(true, 'ON')}
      {seg(false, 'OFF')}
    </span>
  )
}

/** Libellé du jour : « Jour ON · séance prévue » (court : « Séance prévue », l'interrupteur montrant déjà ON / OFF). */
export function useDayLabel(date: ISODate, short = false): string {
  const on = useStore((s) => isTrainingDay(s, date))
  const source = useStore((s) => daySource(s, date))
  if (short) return DAY_SOURCE[source].charAt(0).toUpperCase() + DAY_SOURCE[source].slice(1)
  return `Jour ${on ? 'ON' : 'OFF'} · ${DAY_SOURCE[source]}`
}
