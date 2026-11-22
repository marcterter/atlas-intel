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
  toast: (text: string, kind?: Toast['kind']) => void
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
  toast: (text, kind = 'info') => {
    const id = ++seq
    set((s) => ({ toasts: [...s.toasts, { id, text, kind }].slice(-3) }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), kind === 'err' ? 4200 : 2600)
  },
  openDialog: (node) => set({ dialog: node }),
  closeDialog: () => {
    if (get().dialog) set({ dialog: null })
  },
}))

export const ui = {
  push: (node: ReactNode, key?: string) => useUI.getState().push(node, key),
  pop: () => useUI.getState().pop(),
  toast: (text: string, kind?: Toast['kind']) => useUI.getState().toast(text, kind),
  setTab: (t: Tab) => useUI.getState().setTab(t),
}
