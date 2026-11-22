import { create } from 'zustand'
import type {
  AppData,
  CheckIn,
  DayLog,
  DirtyState,
  Exercise,
  Food,
  FoodEntry,
  ISODate,
  MacroTargets,
  MealId,
  Profile,
  Recipe,
  ReviewDecision,
  Routine,
  Session,
  Settings,
  StepsDay,
  SyncConfig,
  Targets,
} from '../lib/types.ts'
import { uid } from '../lib/id.ts'
import { todayISO } from '../lib/date.ts'
import { TEMPLATE_ROUTINES } from '../data/exercises.ts'
import { mergeSteps } from '../lib/body.ts'
import { finalizeSession, sessionFromRoutine, sessionHasWork } from '../lib/sessionOps.ts'
import { clearData, loadData, requestPersistence, saveData } from './persist.ts'
import type { ImportPlan } from '../lib/coach.ts'

export function defaultData(): AppData {
  return {
    version: 1,
    onboarded: false,
    profile: { name: '', sex: 'H', birthYear: 1992, heightCm: 178, activity: 'modere', goal: 'seche' },
    targets: {
      base: { kcal: 2400, protein: 170, carbs: 260, fat: 75 },
      rest: null,
      steps: 10000,
      fiber: 30,
    },
    settings: { defaultRestSec: 120, sound: true, haptics: true, keepAwake: true, autoRest: true, shortcutName: 'Forge pas' },
    routines: [],
    sessions: [],
    active: null,
    restTimer: null,
    customExercises: [],
    foods: {},
    favorites: [],
    recents: [],
    recipes: [],
    entries: [],
    weighins: [],
    steps: [],
    checkins: [],
    daylogs: {},
    reviews: {},
    dayType: {},
    sync: { url: '', token: '', coachUrl: '', enabled: false, lastPushAt: null, lastPullAt: null, lastError: null, scriptVersion: null },
    dirty: { days: {}, sessions: {}, checkins: {} },
  }
}

const DATA_KEYS = Object.keys(defaultData()) as (keyof AppData)[]

/** Complète des données chargées (ancienne version, import) avec les valeurs par défaut. */
export function migrate(raw: unknown): AppData {
  const d = defaultData()
  if (!raw || typeof raw !== 'object') return d
  const r = raw as Partial<AppData>
  return {
    ...d,
    ...r,
    version: 1,
    profile: { ...d.profile, ...(r.profile ?? {}) },
    targets: { ...d.targets, ...(r.targets ?? {}), base: { ...d.targets.base, ...(r.targets?.base ?? {}) } },
    settings: { ...d.settings, ...(r.settings ?? {}) },
    sync: { ...d.sync, ...(r.sync ?? {}) },
    dirty: { ...d.dirty, ...(r.dirty ?? {}) },
    foods: r.foods ?? {},
    dayType: r.dayType ?? {},
    daylogs: r.daylogs ?? {},
    reviews: r.reviews ?? {},
  }
}

export function pickData(s: AppData): AppData {
  const out = {} as Record<string, unknown>
  for (const k of DATA_KEYS) out[k] = s[k]
  return out as unknown as AppData
}

const bump = (rec: Record<string, number>, key: string) => ({ ...rec, [key]: (rec[key] ?? 0) + 1 })
const touchDays = (dirty: DirtyState, ...dates: ISODate[]): DirtyState => {
  let days = dirty.days
  for (const d of dates) days = bump(days, d)
  return { ...dirty, days }
}

export interface Actions {
  completeOnboarding: (profile: Profile, targets: Targets, weightKg: number | null, withTemplates: boolean) => void
  updateProfile: (patch: Partial<Profile>) => void
  setTargets: (t: Targets) => void
  setBaseTargets: (t: MacroTargets) => void
  updateSettings: (patch: Partial<Settings>) => void
  setDayType: (date: ISODate, training: boolean | null) => void

  saveRoutine: (r: Routine) => void
  deleteRoutine: (id: string) => void
  duplicateRoutine: (id: string) => void
  addTemplates: () => void
  addCustomExercise: (ex: Omit<Exercise, 'id' | 'custom'>) => string

  startSession: (routineId: string | null, name?: string) => void
  updateActive: (fn: (s: Session) => Session | null) => boolean
  finishSession: () => string | null
  discardSession: () => void
  startRest: (sec: number, exerciseUid: string | null) => void
  adjustRest: (deltaSec: number) => void
  clearRest: () => void
  updateSession: (id: string, fn: (s: Session) => Session) => void
  deleteSession: (id: string) => void

  addEntry: (e: Omit<FoodEntry, 'id' | 'createdAt'>, food?: Food) => string
  updateEntry: (id: string, patch: Partial<FoodEntry>) => void
  deleteEntry: (id: string) => void
  copyEntries: (from: ISODate, to: ISODate, meal: MealId | null, toMeal?: MealId) => number
  saveFood: (f: Food) => void
  deleteFood: (id: string) => void
  toggleFavorite: (foodId: string, food?: Food) => void
  saveRecipe: (r: Recipe) => void
  deleteRecipe: (id: string) => void

  setWeighIn: (date: ISODate, kg: number | null) => void
  setSteps: (date: ISODate, steps: number | null, source?: StepsDay['source']) => void
  mergeRemoteSteps: (list: StepsDay[]) => void
  applyImport: (plan: ImportPlan, removeRoutineIds?: string[]) => void
  setDayLog: (date: ISODate, patch: Partial<Omit<DayLog, 'date' | 'at'>>) => void
  addWater: (date: ISODate, liters: number) => void
  /** Bilan du lundi : appliquer les objectifs proposés, garder les siens, ou simplement « vu ». */
  decideReview: (monday: ISODate, decision: Omit<ReviewDecision, 'at'>, next?: Targets | null) => void
  saveCheckIn: (c: CheckIn) => void
  deleteCheckIn: (id: string) => void

  setSync: (patch: Partial<SyncConfig>) => void
  clearDirty: (snapshot: DirtyState) => void

  importData: (raw: unknown) => void
  resetAll: () => Promise<void>
}

export type State = AppData & Actions & { hydrated: boolean }

export const useStore = create<State>()((set, get) => ({
  ...defaultData(),
  hydrated: false,

  completeOnboarding: (profile, targets, weightKg, withTemplates) => {
    set((s) => {
      const today = todayISO()
      const weighins = weightKg ? [...s.weighins.filter((w) => w.date !== today), { date: today, kg: weightKg, at: Date.now() }] : s.weighins
      return {
        onboarded: true,
        profile,
        targets,
        weighins,
        routines: withTemplates && s.routines.length === 0 ? templates() : s.routines,
        dirty: weightKg ? touchDays(s.dirty, today) : s.dirty,
      }
    })
  },
  updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
  setTargets: (t) => set(() => ({ targets: t })),
  setBaseTargets: (t) => set((s) => ({ targets: { ...s.targets, base: t } })),
  updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
  setDayType: (date, training) =>
    set((s) => {
      const dayType = { ...s.dayType }
      if (training == null) delete dayType[date]
      else dayType[date] = training
      return { dayType, dirty: touchDays(s.dirty, date) }
    }),

  saveRoutine: (r) =>
    set((s) => {
      const exists = s.routines.some((x) => x.id === r.id)
      const routine = { ...r, updatedAt: Date.now() }
      return { routines: exists ? s.routines.map((x) => (x.id === r.id ? routine : x)) : [...s.routines, routine] }
    }),
  deleteRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),
  duplicateRoutine: (id) =>
    set((s) => {
      const r = s.routines.find((x) => x.id === id)
      if (!r) return {}
      const now = Date.now()
      const copy: Routine = {
        ...r,
        id: uid('r'),
        name: `${r.name} (copie)`,
        items: r.items.map((it) => ({ ...it, uid: uid('i') })),
        createdAt: now,
        updatedAt: now,
      }
      return { routines: [...s.routines, copy] }
    }),
  addTemplates: () => set((s) => ({ routines: [...s.routines, ...templates()] })),
  addCustomExercise: (ex) => {
    const id = uid('x')
    set((s) => ({ customExercises: [...s.customExercises, { ...ex, id, custom: true }] }))
    return id
  },

  startSession: (routineId, name) => {
    const s = get()
    if (s.active) return
    const routine = routineId ? (s.routines.find((r) => r.id === routineId) ?? null) : null
    set({ active: sessionFromRoutine(routine, name ?? 'Séance libre'), restTimer: null })
  },
  updateActive: (fn) => {
    const cur = get().active
    if (!cur) return false
    const next = fn(cur)
    if (!next) return false
    set({ active: next })
    return true
  },
  finishSession: () => {
    const s = get()
    if (!s.active) return null
    if (!sessionHasWork(s.active)) {
      set({ active: null, restTimer: null })
      return null
    }
    const done = finalizeSession(s.active)
    const dayType = { ...s.dayType }
    if (dayType[done.date] === false) delete dayType[done.date]
    set({
      dayType,
      sessions: [...s.sessions, done],
      active: null,
      restTimer: null,
      dirty: { ...touchDays(s.dirty, done.date), sessions: bump(s.dirty.sessions, done.id) },
    })
    return done.id
  },
  discardSession: () => set({ active: null, restTimer: null }),
  startRest: (sec, exerciseUid) => set({ restTimer: { endsAt: Date.now() + sec * 1000, total: sec, exerciseUid } }),
  adjustRest: (delta) =>
    set((s) => {
      if (!s.restTimer) return {}
      const endsAt = Math.max(Date.now() + 1000, s.restTimer.endsAt + delta * 1000)
      return { restTimer: { ...s.restTimer, endsAt, total: Math.max(1, s.restTimer.total + delta) } }
    }),
  clearRest: () => set({ restTimer: null }),
  updateSession: (id, fn) =>
    set((s) => {
      const old = s.sessions.find((x) => x.id === id)
      if (!old) return {}
      const next = fn(old)
      return {
        sessions: s.sessions.map((x) => (x.id === id ? next : x)),
        dirty: { ...touchDays(s.dirty, old.date, next.date), sessions: bump(s.dirty.sessions, id) },
      }
    }),
  deleteSession: (id) =>
    set((s) => {
      const old = s.sessions.find((x) => x.id === id)
      if (!old) return {}
      return {
        sessions: s.sessions.filter((x) => x.id !== id),
        dirty: { ...touchDays(s.dirty, old.date), sessions: bump(s.dirty.sessions, id) },
      }
    }),

  addEntry: (e, food) => {
    const id = uid('f')
    set((s) => {
      const entry: FoodEntry = { ...e, id, createdAt: Date.now() }
      const foods = food && food.source !== 'base' ? { ...s.foods, [food.id]: food } : s.foods
      const recents = e.foodId ? [e.foodId, ...s.recents.filter((r) => r !== e.foodId)].slice(0, 60) : s.recents
      return { entries: [...s.entries, entry], foods, recents, dirty: touchDays(s.dirty, e.date) }
    })
    return id
  },
  updateEntry: (id, patch) =>
    set((s) => {
      const old = s.entries.find((x) => x.id === id)
      if (!old) return {}
      const next = { ...old, ...patch }
      return { entries: s.entries.map((x) => (x.id === id ? next : x)), dirty: touchDays(s.dirty, old.date, next.date) }
    }),
  deleteEntry: (id) =>
    set((s) => {
      const old = s.entries.find((x) => x.id === id)
      if (!old) return {}
      return { entries: s.entries.filter((x) => x.id !== id), dirty: touchDays(s.dirty, old.date) }
    }),
  copyEntries: (from, to, meal, toMeal) => {
    const src = get().entries.filter((e) => e.date === from && (meal == null || e.meal === meal))
    if (!src.length) return 0
    set((s) => ({
      entries: [
        ...s.entries,
        ...src.map((e, i) => ({ ...e, id: uid('f'), date: to, meal: toMeal ?? e.meal, createdAt: Date.now() + i })),
      ],
      dirty: touchDays(s.dirty, to),
    }))
    return src.length
  },
  saveFood: (f) => set((s) => ({ foods: { ...s.foods, [f.id]: f } })),
  deleteFood: (id) =>
    set((s) => {
      const foods = { ...s.foods }
      delete foods[id]
      return { foods, favorites: s.favorites.filter((x) => x !== id), recents: s.recents.filter((x) => x !== id) }
    }),
  toggleFavorite: (foodId, food) =>
    set((s) => {
      const isFav = s.favorites.includes(foodId)
      const foods = food && food.source !== 'base' && !s.foods[foodId] ? { ...s.foods, [foodId]: food } : s.foods
      return { favorites: isFav ? s.favorites.filter((x) => x !== foodId) : [foodId, ...s.favorites], foods }
    }),
  saveRecipe: (r) =>
    set((s) => {
      const exists = s.recipes.some((x) => x.id === r.id)
      const recipe = { ...r, updatedAt: Date.now() }
      return { recipes: exists ? s.recipes.map((x) => (x.id === r.id ? recipe : x)) : [...s.recipes, recipe] }
    }),
  deleteRecipe: (id) =>
    set((s) => ({
      recipes: s.recipes.filter((r) => r.id !== id),
      favorites: s.favorites.filter((x) => x !== `r:${id}`),
      recents: s.recents.filter((x) => x !== `r:${id}`),
    })),

  setWeighIn: (date, kg) =>
    set((s) => {
      const rest = s.weighins.filter((w) => w.date !== date)
      const weighins = kg == null ? rest : [...rest, { date, kg, at: Date.now() }].sort((a, b) => a.date.localeCompare(b.date))
      return { weighins, dirty: touchDays(s.dirty, date) }
    }),
  setSteps: (date, steps, source = 'manuel') =>
    set((s) => {
      const rest = s.steps.filter((x) => x.date !== date)
      const list = steps == null ? rest : [...rest, { date, steps, source, at: Date.now() }].sort((a, b) => a.date.localeCompare(b.date))
      return { steps: list, dirty: touchDays(s.dirty, date) }
    }),
  mergeRemoteSteps: (list) =>
    set((s) => {
      const merged = mergeSteps(s.steps, list)
      return { steps: merged }
    }),
  applyImport: (plan, removeRoutineIds = []) =>
    set((s) => {
      const incoming = new Map(plan.routines.map((r) => [r.id, r]))
      const routines = s.routines.filter((r) => !removeRoutineIds.includes(r.id)).map((r) => incoming.get(r.id) ?? r)
      for (const r of plan.routines) if (!s.routines.some((x) => x.id === r.id)) routines.push(r)
      return {
        customExercises: [...s.customExercises, ...plan.newExercises],
        routines,
        sessions: [...s.sessions, ...plan.history].sort((a, b) => a.startedAt - b.startedAt),
      }
    }),
  setDayLog: (date, patch) =>
    set((s) => {
      const cur: DayLog = s.daylogs[date] ?? { date, sleepH: null, sleepQ: null, energy: null, motivation: null, satiety: null, digestion: null, waterL: null, note: '', at: 0 }
      return { daylogs: { ...s.daylogs, [date]: { ...cur, ...patch, date, at: Date.now() } }, dirty: touchDays(s.dirty, date) }
    }),
  addWater: (date, liters) => {
    const cur = get().daylogs[date]?.waterL ?? 0
    get().setDayLog(date, { waterL: Math.max(0, Math.round((cur + liters) * 100) / 100) })
  },
  decideReview: (monday, decision, next) =>
    set((s) => ({
      reviews: { ...s.reviews, [monday]: { ...decision, at: Date.now() } },
      ...(decision.decision === 'applied' && next ? { targets: next } : {}),
    })),
  saveCheckIn: (c) =>
    set((s) => {
      const exists = s.checkins.some((x) => x.id === c.id)
      const checkins = (exists ? s.checkins.map((x) => (x.id === c.id ? c : x)) : [...s.checkins, c]).sort((a, b) =>
        a.date.localeCompare(b.date),
      )
      return { checkins, dirty: { ...s.dirty, checkins: bump(s.dirty.checkins, c.id) } }
    }),
  deleteCheckIn: (id) =>
    set((s) => ({ checkins: s.checkins.filter((c) => c.id !== id), dirty: { ...s.dirty, checkins: bump(s.dirty.checkins, id) } })),

  setSync: (patch) => set((s) => ({ sync: { ...s.sync, ...patch } })),
  clearDirty: (snap) =>
    set((s) => {
      const strip = (cur: Record<string, number>, sent: Record<string, number>) => {
        const out: Record<string, number> = {}
        for (const [k, v] of Object.entries(cur)) if (sent[k] !== v) out[k] = v
        return out
      }
      return {
        dirty: {
          days: strip(s.dirty.days, snap.days),
          sessions: strip(s.dirty.sessions, snap.sessions),
          checkins: strip(s.dirty.checkins, snap.checkins),
        },
      }
    }),

  importData: (raw) => set(() => ({ ...migrate(raw) })),
  resetAll: async () => {
    await clearData()
    set(() => ({ ...defaultData() }))
  },
}))

function templates(): Routine[] {
  const now = Date.now()
  return TEMPLATE_ROUTINES.map((t, i) => ({
    id: uid('r'),
    name: t.name,
    createdAt: now + i,
    updatedAt: now + i,
    items: t.items.map(([exerciseId, sets, reps, restSec]) => ({ uid: uid('i'), exerciseId, sets, reps, restSec, superset: null })),
  }))
}

// --- Chargement / sauvegarde automatique ---

let saveTimer: ReturnType<typeof setTimeout> | null = null
let lastSaved: AppData | null = null

function flush() {
  if (saveTimer) {
    clearTimeout(saveTimer)
    saveTimer = null
  }
  const data = pickData(useStore.getState())
  if (lastSaved && DATA_KEYS.every((k) => lastSaved![k] === data[k])) return
  lastSaved = data
  void saveData(data)
}

export async function hydrate(): Promise<void> {
  const raw = await loadData()
  if (raw) useStore.setState({ ...migrate(raw) })
  lastSaved = pickData(useStore.getState())
  useStore.setState({ hydrated: true })
  useStore.subscribe(() => {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(flush, 250)
  })
  const onHide = () => {
    if (document.visibilityState === 'hidden') flush()
  }
  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('pagehide', flush)
  void requestPersistence()
}

export function exportJSON(): string {
  return JSON.stringify({ app: 'forge', exportedAt: new Date().toISOString(), data: pickData(useStore.getState()) }, null, 1)
}

export function parseImport(text: string): AppData {
  const parsed = JSON.parse(text)
  const data = parsed?.app === 'forge' ? parsed.data : parsed
  if (!data || typeof data !== 'object' || !('sessions' in data || 'entries' in data)) {
    throw new Error('Fichier non reconnu')
  }
  return migrate(data)
}
