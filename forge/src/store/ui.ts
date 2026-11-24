import { create } from 'zustand'
import type { ReactNode } from 'react'
import { todayISO } from '../lib/date.ts'
import type { ISODate } from '../lib/types.ts'

export type Tab = 'today' | 'training' | 'diet' | 'progress' | 'profile'

interface SheetEntry {
  key: string
  node: ReactNode
}

export interface Toast {
  id: number
  text: string
  kind: 'info' | 'ok' | 'err'
  /** Bouton dans le toast (« Annuler ») : le toucher lance l'action et ferme le toast. */
  action?: { label: string; run: () => void }
}

interface UIState {
  tab: Tab
  date: ISODate
  sheets: SheetEntry[]
  toasts: Toast[]
  dialog: ReactNode | null
  setTab: (t: Tab) => void
  setDate: (d: ISODate) => void
  push: (node: ReactNode, key?: string) => void
  pop: () => void
  closeAll: () => void
  replaceTop: (node: ReactNode, key?: string) => void
  toast: (text: string, kind?: Toast['kind'], action?: Toast['action']) => void
  dismissToast: (id: number) => void
  openDialog: (node: ReactNode) => void
  closeDialog: () => void
}

let seq = 0

export const useUI = create<UIState>()((set, get) => ({
  tab: 'today',
  date: todayISO(),
  sheets: [],
  toasts: [],
  dialog: null,
  setTab: (tab) => set({ tab }),
  setDate: (date) => set({ date }),
  push: (node, key) => {
    const k = key ?? `sheet-${++seq}`
    set((s) => ({ sheets: [...s.sheets.filter((x) => x.key !== k), { key: k, node }] }))
  },
  pop: () => set((s) => ({ sheets: s.sheets.slice(0, -1) })),
  closeAll: () => set({ sheets: [] }),
  replaceTop: (node, key) => set((s) => ({ sheets: [...s.sheets.slice(0, -1), { key: key ?? `sheet-${++seq}`, node }] })),
  toast: (text, kind = 'info', action) => {
    const id = ++seq
    set((s) => ({ toasts: [...s.toasts, { id, text, kind, action }].slice(-3) }))
    setTimeout(() => get().dismissToast(id), action ? 5000 : kind === 'err' ? 4200 : 2600)
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  openDialog: (node) => set({ dialog: node }),
  closeDialog: () => {
    if (get().dialog) set({ dialog: null })
  },
}))

export const ui = {
  push: (node: ReactNode, key?: string) => useUI.getState().push(node, key),
  pop: () => useUI.getState().pop(),
  toast: (text: string, kind?: Toast['kind'], action?: Toast['action']) => useUI.getState().toast(text, kind, action),
  /** Toast « … · Annuler » après une suppression ou un ajout en un geste. */
  undo: (text: string, run: () => void) => useUI.getState().toast(text, 'info', { label: 'Annuler', run }),
  setTab: (t: Tab) => useUI.getState().setTab(t),
}
