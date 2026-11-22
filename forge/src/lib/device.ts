// Son, vibration et écran allumé pendant la séance (au mieux selon le navigateur).

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    return ctx
  } catch {
    return null
  }
}

/** À appeler sur un geste utilisateur (iOS n'autorise le son qu'après une interaction). */
export function unlockAudio(): void {
  const a = audio()
  if (!a) return
  try {
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession
    if (session) session.type = 'transient'
  } catch {
    /* ignore */
  }
  if (a.state === 'suspended') void a.resume()
  try {
    const buf = a.createBuffer(1, 1, 22050)
    const src = a.createBufferSource()
    src.buffer = buf
    src.connect(a.destination)
    src.start(0)
  } catch {
    /* ignore */
  }
}

/** Trois bips courts, le dernier plus aigu. */
export function beep(): void {
  const a = audio()
  if (!a) return
  if (a.state === 'suspended') void a.resume()
  const t0 = a.currentTime + 0.02
  const notes = [
    { f: 880, t: 0 },
    { f: 880, t: 0.22 },
    { f: 1320, t: 0.44 },
  ]
  for (const n of notes) {
    const osc = a.createOscillator()
    const gain = a.createGain()
    osc.type = 'sine'
    osc.frequency.value = n.f
    gain.gain.setValueAtTime(0.0001, t0 + n.t)
    gain.gain.exponentialRampToValueAtTime(0.5, t0 + n.t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + n.t + (n.f > 1000 ? 0.35 : 0.16))
    osc.connect(gain).connect(a.destination)
    osc.start(t0 + n.t)
    osc.stop(t0 + n.t + 0.4)
  }
}

let hapticLabel: HTMLLabelElement | null = null

/** Vibration : API standard (Android) ou astuce du switch natif (iOS 18+). */
export function haptic(strong = true): void {
  try {
    if (typeof navigator.vibrate === 'function' && navigator.vibrate(strong ? [180, 90, 180] : 30)) return
  } catch {
    /* ignore */
  }
  try {
    if (!hapticLabel) {
      const input = document.createElement('input')
      input.type = 'checkbox'
      input.setAttribute('switch', '')
      input.id = 'forge-haptic'
      input.style.display = 'none'
      const label = document.createElement('label')
      label.htmlFor = 'forge-haptic'
      label.style.display = 'none'
      document.body.append(input, label)
      hapticLabel = label
    }
    hapticLabel.click()
    if (strong) setTimeout(() => hapticLabel?.click(), 140)
  } catch {
    /* ignore */
  }
}

let wakeLock: { release: () => Promise<void> } | null = null
let wantAwake = false

async function acquire() {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } }).wakeLock
    if (!wl || wakeLock) return
    wakeLock = await wl.request('screen')
    ;(wakeLock as unknown as EventTarget).addEventListener?.('release', () => {
      wakeLock = null
    })
  } catch {
    wakeLock = null
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (wantAwake && document.visibilityState === 'visible') void acquire()
  })
}

export async function keepScreenOn(on: boolean): Promise<void> {
  wantAwake = on
  if (on) await acquire()
  else if (wakeLock) {
    try {
      await wakeLock.release()
    } catch {
      /* ignore */
    }
    wakeLock = null
  }
}

export function isStandalone(): boolean {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
  } catch {
    return false
  }
}

export function isIOS(): boolean {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/** Compresse une photo (max 1280 px, JPEG) pour le stockage local. */
export async function compressImage(file: Blob, max = 1280, quality = 0.82): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * scale)
    const h = Math.round(img.naturalHeight * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const g = canvas.getContext('2d')
    if (!g) return file
    g.drawImage(img, 0, 0, w, h)
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', quality))
  } finally {
    URL.revokeObjectURL(url)
  }
}
