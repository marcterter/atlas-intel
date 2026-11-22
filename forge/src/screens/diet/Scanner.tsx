import { useEffect, useRef, useState } from 'react'
import { Sheet, Spinner } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { FoodDetail } from './FoodDetail.tsx'
import { CustomFoodForm } from './CustomFood.tsx'
import { useStore } from '../../store/store.ts'
import { useUI } from '../../store/ui.ts'
import { lookupBarcode, type BarcodeResult } from '../../lib/off.ts'
import { haptic } from '../../lib/device.ts'
import type { Food, ISODate, MealId } from '../../lib/types.ts'

interface Detector {
  detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]>
}
type DetectorCtor = new (opts: { formats: string[] }) => Detector

async function getDetector(): Promise<DetectorCtor> {
  const native = (globalThis as unknown as { BarcodeDetector?: DetectorCtor & { getSupportedFormats?: () => Promise<string[]> } }).BarcodeDetector
  if (native?.getSupportedFormats) {
    try {
      const formats = await native.getSupportedFormats()
      if (formats.includes('ean_13')) return native
    } catch {
      /* repli sur le polyfill */
    }
  }
  const [mod, wasm] = await Promise.all([import('barcode-detector/ponyfill'), import('zxing-wasm/reader/zxing_reader.wasm?url')])
  mod.prepareZXingModule({
    overrides: {
      locateFile: (path: string, prefix: string) => (path.endsWith('.wasm') ? wasm.default : prefix + path),
    },
  })
  return mod.BarcodeDetector as unknown as DetectorCtor
}

/** Cherche d'abord dans mes aliments (codes déjà scannés ou créés), puis dans Open Food Facts. */
async function resolveBarcode(code: string): Promise<BarcodeResult> {
  const foods = useStore.getState().foods
  const local = Object.values(foods).find((f) => f.barcode === code)
  if (local) return { status: 'found', food: local }
  return lookupBarcode(code)
}

export function Scanner({ date, meal, onPick }: { date: ISODate; meal: MealId; onPick?: (food: Food, grams: number) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [status, setStatus] = useState<'starting' | 'scanning' | 'looking' | 'error'>('starting')
  const [error, setError] = useState('')
  const [manual, setManual] = useState('')
  const handled = useRef(false)
  const failed = useRef<{ code: string; at: number } | null>(null)

  const handle = async (code: string) => {
    if (handled.current) return
    // Après un échec réseau, on évite de relancer en boucle sur le même code.
    if (failed.current && failed.current.code === code && Date.now() - failed.current.at < 4000) return
    handled.current = true
    setStatus('looking')
    setError('')
    try {
      const r = await resolveBarcode(code)
      const { replaceTop, push } = useUI.getState()
      const openDetail = (f: Food) => push(<FoodDetail food={f} date={date} meal={meal} onPick={onPick} />)
      if (r.status === 'found') replaceTop(<FoodDetail food={r.food} date={date} meal={meal} onPick={onPick} />)
      else if (r.status === 'incomplete') replaceTop(<CustomFoodForm barcode={r.code} reason="incomplete" prefill={{ name: r.name, brand: r.brand }} onSaved={openDetail} />)
      else replaceTop(<CustomFoodForm barcode={r.code} onSaved={openDetail} />)
    } catch {
      failed.current = { code, at: Date.now() }
      handled.current = false
      setStatus('scanning')
      setError(
        navigator.onLine === false
          ? 'Pas de réseau : un nouveau produit a besoin d’internet pour être reconnu. Tes aliments récents et la base intégrée restent disponibles.'
          : 'Open Food Facts ne répond pas. Réessaie dans un instant, ou saisis le code ci-dessous.',
      )
    }
  }

  useEffect(() => {
    let stream: MediaStream | null = null
    let stopped = false
    let timer: ReturnType<typeof setTimeout> | null = null
    ;(async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('nocam')
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        })
        if (stopped) return
        const video = videoRef.current
        if (!video) return
        video.srcObject = stream
        await video.play().catch(() => undefined)
        const Ctor = await getDetector()
        const detector = new Ctor({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] })
        if (stopped) return
        setStatus('scanning')
        const tick = async () => {
          if (stopped) return
          try {
            if (!handled.current && video.readyState >= 2) {
              const codes = await detector.detect(video)
              const code = codes.find((c) => /^\d{8,14}$/.test(c.rawValue))
              if (code && !(failed.current?.code === code.rawValue && Date.now() - failed.current.at < 4000)) {
                haptic(false)
                void handle(code.rawValue)
              }
            }
          } catch {
            /* image suivante */
          }
          timer = setTimeout(tick, 160)
        }
        void tick()
      } catch (e) {
        setStatus('error')
        const name = e instanceof Error ? e.name : ''
        setError(
          name === 'NotAllowedError'
            ? "Accès à la caméra refusé. Autorise-le dans Réglages > Safari > Caméra, ou saisis le code ci-dessous."
            : 'Caméra indisponible. Saisis le code-barres ci-dessous.',
        )
      }
    })()
    return () => {
      stopped = true
      if (timer) clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Sheet title="Scanner" closeIcon="x">
      <div className="stack">
        <div className="scanner-view">
          <video ref={videoRef} playsInline muted autoPlay />
          <div className="scanner-frame" />
          {status === 'scanning' && <div className="scanner-line" />}
          {(status === 'starting' || status === 'looking') && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
              <div className="row" style={{ background: 'rgba(0,0,0,.6)', padding: '10px 14px', borderRadius: 12 }}>
                <Spinner /> {status === 'looking' ? 'Recherche du produit…' : 'Ouverture de la caméra…'}
              </div>
            </div>
          )}
        </div>
        {status === 'scanning' && <div className="center muted small">Place le code-barres dans le cadre</div>}
        {error && <div className="callout">{error}</div>}
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault()
            const code = manual.replace(/\D/g, '')
            if (code.length >= 8) void handle(code)
          }}
        >
          <input className="input grow" inputMode="numeric" placeholder="Saisir le code-barres" value={manual} onChange={(e) => setManual(e.target.value)} />
          <button className="btn" type="submit" disabled={manual.replace(/\D/g, '').length < 8} aria-label="Rechercher le code">
            <Icon name="search" size={20} />
          </button>
        </form>
      </div>
    </Sheet>
  )
}
