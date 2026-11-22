// Stockage local : IndexedDB (fiable sur iPhone une fois l'app ajoutée à l'écran d'accueil),
// avec repli sur localStorage puis mémoire si le navigateur refuse.
import { createStore, del, delMany, get, keys, set, type UseStore } from 'idb-keyval'

const DATA_KEY = 'forge:data:v1'

let idb: UseStore | null = null
export type StorageMode = 'idb' | 'local' | 'memory'
let mode: StorageMode = 'memory'

function getIdb(): UseStore | null {
  if (idb) return idb
  try {
    if (typeof indexedDB === 'undefined') return null
    idb = createStore('forge', 'kv')
    return idb
  } catch {
    return null
  }
}

export function storageMode(): StorageMode {
  return mode
}

export async function loadData(): Promise<unknown | null> {
  const store = getIdb()
  if (store) {
    try {
      const v = await withTimeout(get(DATA_KEY, store), 4000)
      mode = 'idb'
      if (v != null) return v
      // Migration éventuelle depuis localStorage
      const ls = readLocal()
      return ls
    } catch {
      idb = null
    }
  }
  try {
    const ls = readLocal()
    mode = 'local'
    return ls
  } catch {
    mode = 'memory'
    return null
  }
}

function readLocal(): unknown | null {
  const raw = localStorage.getItem(DATA_KEY)
  return raw ? JSON.parse(raw) : null
}

export async function saveData(data: unknown): Promise<void> {
  if (mode === 'idb' && idb) {
    try {
      await set(DATA_KEY, data, idb)
      return
    } catch {
      mode = 'local'
    }
  }
  if (mode === 'local') {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data))
    } catch {
      mode = 'memory'
    }
  }
}

export async function clearData(): Promise<void> {
  try {
    if (idb) {
      const all = await keys(idb)
      await delMany(all.filter((k) => String(k).startsWith('forge:')), idb)
    }
  } catch {
    /* ignore */
  }
  memoryPhotos.clear()
  try {
    localStorage.removeItem(DATA_KEY)
  } catch {
    /* ignore */
  }
}

/** Demande au navigateur de ne pas effacer les données (iOS/Android). */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist()
  } catch {
    /* ignore */
  }
  return false
}

// --- Photos de bilan (stockées à part, compressées) ---

const photoKey = (id: string) => `forge:photo:${id}`
const memoryPhotos = new Map<string, Blob>()

export async function putPhoto(id: string, blob: Blob): Promise<void> {
  const store = getIdb()
  if (store && mode === 'idb') {
    try {
      await set(photoKey(id), blob, store)
      return
    } catch {
      /* repli mémoire */
    }
  }
  memoryPhotos.set(id, blob)
}

export async function getPhoto(id: string): Promise<Blob | undefined> {
  if (memoryPhotos.has(id)) return memoryPhotos.get(id)
  const store = getIdb()
  if (!store) return undefined
  try {
    return (await get(photoKey(id), store)) as Blob | undefined
  } catch {
    return undefined
  }
}

export async function deletePhoto(id: string): Promise<void> {
  memoryPhotos.delete(id)
  const store = getIdb()
  if (!store) return
  try {
    await del(photoKey(id), store)
  } catch {
    /* ignore */
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    p.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}
