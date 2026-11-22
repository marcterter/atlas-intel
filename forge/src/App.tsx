import { useEffect, useRef } from 'react'
import { Icon } from './components/Icon.tsx'
import { DialogHost, SheetStack, Toasts } from './components/ui.tsx'
import { TodayScreen } from './screens/today/TodayScreen.tsx'
import { TrainingScreen } from './screens/training/TrainingScreen.tsx'
import { DietScreen } from './screens/diet/DietScreen.tsx'
import { ProgressScreen } from './screens/progress/ProgressScreen.tsx'
import { ProfileScreen } from './screens/profile/ProfileScreen.tsx'
import { Onboarding } from './screens/onboarding/Onboarding.tsx'
import { RestTimerBar } from './screens/training/RestTimer.tsx'
import { useStore } from './store/store.ts'
import { useUI, type Tab } from './store/ui.ts'
import { dirtyCount, isConfigured, syncNow } from './lib/sync.ts'
import { todayISO } from './lib/date.ts'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Aujourd’hui', icon: 'home' },
  { id: 'training', label: 'Séance', icon: 'dumbbell' },
  { id: 'diet', label: 'Diète', icon: 'food' },
  { id: 'progress', label: 'Suivi', icon: 'trend' },
  { id: 'profile', label: 'Profil', icon: 'user' },
]

function TabBar() {
  const tab = useUI((s) => s.tab)
  const setTab = useUI((s) => s.setTab)
  const active = useStore((s) => !!s.active)
  return (
    <nav className="tabbar" aria-label="Navigation principale">
      <div className="tabbar-inner">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => {
              setTab(t.id)
              window.scrollTo({ top: 0 })
            }}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <span className="tab-icon">
              <Icon name={t.icon} size={21} />
            </span>
            {t.label}
            {t.id === 'training' && active && <span className="dot" />}
          </button>
        ))}
      </div>
    </nav>
  )
}

/** Synchronise au démarrage, au retour dans l'app et quelques secondes après chaque modification. */
function useAutoSync() {
  const pending = useStore((s) => dirtyCount(s))
  const configured = useStore((s) => isConfigured(s))
  const lastRun = useRef(0)

  useEffect(() => {
    if (!configured) return
    const run = (force = false) => {
      if (!navigator.onLine) return
      if (!force && Date.now() - lastRun.current < 60_000) return
      lastRun.current = Date.now()
      void syncNow()
    }
    run(true)
    const onVis = () => document.visibilityState === 'visible' && run()
    const onOnline = () => run(true)
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('online', onOnline)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('online', onOnline)
    }
  }, [configured])

  useEffect(() => {
    if (!configured || pending === 0) return
    const t = setTimeout(() => {
      if (navigator.onLine && !useStore.getState().active) void syncNow()
    }, 12_000)
    return () => clearTimeout(t)
  }, [configured, pending])
}

/** Si l'app reste ouverte d'un jour à l'autre, on revient sur "aujourd'hui". */
function useDayRollover() {
  useEffect(() => {
    let wasToday = true
    const onVis = () => {
      const { date, setDate } = useUI.getState()
      if (document.visibilityState === 'hidden') wasToday = date === todayISO()
      else if (wasToday && date !== todayISO()) setDate(todayISO())
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])
}

export function App() {
  const hydrated = useStore((s) => s.hydrated)
  const onboarded = useStore((s) => s.onboarded)
  const tab = useUI((s) => s.tab)
  const sheetsOpen = useUI((s) => s.sheets.length > 0)
  useAutoSync()
  useDayRollover()

  if (!hydrated) {
    return (
      <div className="splash">
        <img src="./icon-192.png" alt="Forge" />
      </div>
    )
  }

  if (!onboarded) {
    return (
      <>
        <Onboarding />
        <Toasts />
        <DialogHost />
      </>
    )
  }

  return (
    <div className="app">
      {tab === 'today' && <TodayScreen />}
      {tab === 'training' && <TrainingScreen />}
      {tab === 'diet' && <DietScreen />}
      {tab === 'progress' && <ProgressScreen />}
      {tab === 'profile' && <ProfileScreen />}
      <TabBar />
      {!sheetsOpen && <RestTimerBar />}
      <SheetStack />
      <Toasts />
      <DialogHost />
    </div>
  )
}
