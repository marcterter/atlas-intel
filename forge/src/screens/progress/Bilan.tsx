import { useEffect, useMemo, useRef, useState } from 'react'
import { Sheet, Field, NumInput, Segmented, confirmDialog, menuDialog } from '../../components/ui.tsx'
import { isConfigured, syncNow } from '../../lib/sync.ts'
import { LineChart } from '../../components/charts.tsx'
import { Icon } from '../../components/Icon.tsx'
import { editWeight } from '../today/TodayScreen.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { deletePhoto, getPhoto, putPhoto } from '../../store/persist.ts'
import { addDays, cap, dayLetter, formatShort, fromISO, relativeDay, todayISO, weekDays } from '../../lib/date.ts'
import { weekAverage, weeklyAverages } from '../../lib/body.ts'
import { fmtKg, fmtSigned } from '../../lib/format.ts'
import { uid } from '../../lib/id.ts'
import { compressImage } from '../../lib/device.ts'
import type { CheckIn, MeasureKey, PhotoPose } from '../../lib/types.ts'

export const MEASURES: { key: MeasureKey; label: string }[] = [
  { key: 'taille', label: 'Tour de taille' },
  { key: 'hanches', label: 'Hanches' },
  { key: 'poitrine', label: 'Poitrine' },
  { key: 'bras', label: 'Bras' },
  { key: 'cuisse', label: 'Cuisse' },
  { key: 'mollet', label: 'Mollet' },
  { key: 'cou', label: 'Cou' },
]
const POSES: { key: PhotoPose; label: string }[] = [
  { key: 'face', label: 'Face' },
  { key: 'profil', label: 'Profil' },
  { key: 'dos', label: 'Dos' },
]

export function usePhotoUrl(id: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let revoked = false
    let u: string | null = null
    if (!id) {
      setUrl(null)
      return
    }
    void getPhoto(id).then((blob) => {
      if (revoked || !blob) return
      u = URL.createObjectURL(blob)
      setUrl(u)
    })
    return () => {
      revoked = true
      if (u) URL.revokeObjectURL(u)
    }
  }, [id])
  return url
}

function PhotoSlot({ id, label, onPick, onClear }: { id?: string; label: string; onPick?: (f: File) => void; onClear?: () => void }) {
  const url = usePhotoUrl(id)
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div>
      <button className="photo-slot" style={{ width: '100%' }} onClick={() => (onPick ? ref.current?.click() : undefined)}>
        {url ? (
          <img src={url} alt={label} />
        ) : (
          <span className="stack center" style={{ gap: 4, alignItems: 'center' }}>
            <Icon name="camera" size={22} />
            {label}
          </span>
        )}
      </button>
      {onPick && (
        <input
          ref={ref}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onPick(f)
            e.target.value = ''
          }}
        />
      )}
      {id && onClear && (
        <button className="link-btn tiny" style={{ marginTop: 4, color: 'var(--text-3)' }} onClick={onClear}>
          Retirer
        </button>
      )}
    </div>
  )
}

/** Ouvre la feuille de partage iOS (WhatsApp, Messages…) avec les photos du bilan. */
async function sharePhotos(c: CheckIn) {
  const files: File[] = []
  for (const p of POSES) {
    const id = c.photos[p.key]
    if (!id) continue
    const blob = await getPhoto(id)
    if (blob) files.push(new File([blob], `bilan-${c.date}-${p.key}.jpg`, { type: 'image/jpeg' }))
  }
  if (!files.length) return
  try {
    if (navigator.canShare?.({ files })) {
      await navigator.share({ files, title: `Photos du bilan · ${c.date}` })
      return
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') return
  }
  ui.toast('Partage non disponible sur ce navigateur', 'err')
}

export function CheckInEditor({ checkinId }: { checkinId?: string }) {
  const existing = useStore((s) => s.checkins.find((c) => c.id === checkinId))
  const last = useStore((s) => [...s.checkins].filter((c) => c.id !== checkinId).pop())
  const save = useStore((s) => s.saveCheckIn)
  const del = useStore((s) => s.deleteCheckIn)
  const photosAgent = useStore((s) => s.settings.photosAgent)
  const updateSettings = useStore((s) => s.updateSettings)
  const configured = useStore((s) => isConfigured(s))
  const [draft, setDraft] = useState<CheckIn>(() => existing ?? { id: uid('c'), date: todayISO(), measures: {}, photos: {}, ratings: {}, note: '', at: Date.now() })
  const [busy, setBusy] = useState(false)

  const addPhoto = async (pose: PhotoPose | 'myair', f: File) => {
    setBusy(true)
    try {
      // Capture myAir : plus grande, pour que les chiffres restent lisibles.
      const blob = pose === 'myair' ? await compressImage(f, 1800, 0.88) : await compressImage(f)
      const id = uid('ph')
      await putPhoto(id, blob)
      setDraft((d) => (pose === 'myair' ? { ...d, myair: id } : { ...d, photos: { ...d.photos, [pose]: id } }))
    } catch {
      ui.toast('Photo illisible', 'err')
    } finally {
      setBusy(false)
    }
  }

  // Enregistrer : la première fois qu'il y a des photos, on demande si elles peuvent aller à l'agent du lundi.
  const onSave = async () => {
    const hasPhotos = Object.keys(draft.photos).length > 0 || !!draft.myair
    let send = photosAgent
    if (hasPhotos && configured && send == null) {
      const c = await menuDialog('Envoyer tes photos à l’agent du lundi ? Elles vont dans un dossier privé de ton Google Drive, et il les compare d’une semaine à l’autre.', [
        { id: 'yes', label: 'Oui, les envoyer', icon: 'upload' },
        { id: 'no', label: 'Non, elles restent sur mon téléphone', icon: 'x' },
      ])
      if (!c) return
      send = c === 'yes'
      updateSettings({ photosAgent: send })
    }
    save({ ...draft, at: Date.now() })
    ui.pop()
    ui.toast(send && hasPhotos ? 'Bilan enregistré · photos en route vers l’agent' : 'Bilan enregistré', 'ok')
    if (send && hasPhotos) void syncNow()
  }

  return (
    <Sheet
      title="Bilan de la semaine"
      closeIcon="x"
      footer={
        <>
          {existing && (
            <button
              className="btn danger"
              aria-label="Supprimer"
              onClick={async () => {
                if (await confirmDialog({ title: 'Supprimer ce bilan ?', confirm: 'Supprimer', danger: true })) {
                  Object.values(existing.photos).forEach((p) => p && void deletePhoto(p))
                  del(existing.id)
                  ui.pop()
                }
              }}
            >
              <Icon name="trash" size={20} />
            </button>
          )}
          <button className="btn grow" disabled={busy} onClick={() => void onSave()}>
            Enregistrer le bilan
          </button>
        </>
      }
    >
      <div className="stack">
        <Field label="Date">
          <input className="input" type="date" value={draft.date} max={todayISO()} onChange={(e) => e.target.value && setDraft({ ...draft, date: e.target.value })} />
        </Field>
        <div className="section-label">Mensurations (cm)</div>
        <div className="grid-2">
          {MEASURES.map((m) => (
            <Field key={m.key} label={m.label} hint={last?.measures[m.key] != null ? `dernier : ${fmtKg(last.measures[m.key])} cm` : undefined}>
              <NumInput
                value={draft.measures[m.key] ?? null}
                onChange={(v) => setDraft((d) => ({ ...d, measures: { ...d.measures, [m.key]: v ?? undefined } }))}
                suffix="cm"
              />
            </Field>
          ))}
        </div>
        <div className="section-label">Photos {busy && <span className="spinner" />}</div>
        <div className="grid-3">
          {POSES.map((p) => (
            <PhotoSlot
              key={p.key}
              id={draft.photos[p.key]}
              label={p.label}
              onPick={(f) => addPhoto(p.key, f)}
              onClear={() => setDraft((d) => {
                const photos = { ...d.photos }
                delete photos[p.key]
                return { ...d, photos }
              })}
            />
          ))}
        </div>
        <div className="faint tiny">
          Même lumière, même heure, même tenue d’une semaine à l’autre, entre vendredi et dimanche pour l’agent du lundi.{' '}
          {photosAgent ? 'Elles partent aussi dans un dossier privé de ton Google Drive, pour lui.' : 'Les photos restent sur ton téléphone.'}
        </div>
        <div className="section-label">Capture myAir</div>
        <div className="grid-3">
          <PhotoSlot id={draft.myair} label="myAir" onPick={(f) => addPhoto('myair', f)} onClear={() => setDraft((d) => ({ ...d, myair: undefined }))} />
          <div className="faint tiny" style={{ gridColumn: 'span 2', alignSelf: 'center' }}>
            Capture d’écran de ta semaine dans myAir (heures d’utilisation, événements/h, masque) : l’agent la lit avec tes photos.
          </div>
        </div>
        {Object.keys(draft.photos).length > 0 && (
          <button className="btn soft block" onClick={() => void sharePhotos(draft)}>
            <Icon name="upload" size={18} /> Envoyer les photos au coach
          </button>
        )}
        <Field label="Commentaire pour le coach">
          <textarea className="input" value={draft.note ?? ''} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Écarts, difficultés, victoires de la semaine…" />
        </Field>
      </div>
    </Sheet>
  )
}

export function CompareSheet() {
  const checkins = useStore((s) => s.checkins)
  const weighins = useStore((s) => s.weighins)
  const [a, setA] = useState(checkins[0]?.id ?? '')
  const [b, setB] = useState(checkins[checkins.length - 1]?.id ?? '')
  const ca = checkins.find((c) => c.id === a)
  const cb = checkins.find((c) => c.id === b)
  const wA = ca ? weekAverage(weighins, ca.date).avg : null
  const wB = cb ? weekAverage(weighins, cb.date).avg : null
  return (
    <Sheet title="Avant / après">
      <div className="stack">
        <div className="grid-2">
          {[
            [a, setA],
            [b, setB],
          ].map(([val, set], i) => (
            <select key={i} className="input" value={val as string} onChange={(e) => (set as (v: string) => void)(e.target.value)}>
              {checkins.map((c) => (
                <option key={c.id} value={c.id}>
                  {formatShort(c.date)} {fromISO(c.date).getFullYear()}
                </option>
              ))}
            </select>
          ))}
        </div>
        {POSES.map((p) => (
          <div key={p.key}>
            <div className="section-label">{p.label}</div>
            <div className="grid-2">
              <PhotoSlot id={ca?.photos[p.key]} label="—" />
              <PhotoSlot id={cb?.photos[p.key]} label="—" />
            </div>
          </div>
        ))}
        <div className="section-label">Évolution</div>
        <div className="card flush list">
          <div className="list-item">
            <div className="grow title">Poids moyen de la semaine</div>
            <div className="num small faint">{wA != null ? fmtKg(Math.round(wA * 10) / 10) : '–'} → </div>
            <div className="num bold">{wB != null ? fmtKg(Math.round(wB * 10) / 10) : '–'}</div>
            {wA != null && wB != null && <span className={`badge ${wB - wA <= 0 ? 'ok' : 'accent'}`}>{fmtSigned(wB - wA, 1)} kg</span>}
          </div>
          {MEASURES.map((m) => {
            const va = ca?.measures[m.key]
            const vb = cb?.measures[m.key]
            if (va == null && vb == null) return null
            return (
              <div className="list-item" key={m.key}>
                <div className="grow title">{m.label}</div>
                <div className="num small faint">{va != null ? fmtKg(va) : '–'} → </div>
                <div className="num bold">{vb != null ? fmtKg(vb) : '–'}</div>
                {va != null && vb != null && <span className="badge">{fmtSigned(vb - va, 1)} cm</span>}
              </div>
            )
          })}
        </div>
      </div>
    </Sheet>
  )
}

export function BilanTab() {
  const weighins = useStore((s) => s.weighins)
  const checkins = useStore((s) => s.checkins)
  const [view, setView] = useState<'journal' | 'evolution'>('journal')
  const today = todayISO()
  const days = weekDays(today)
  const wk = weekAverage(weighins, today)
  const prev = weekAverage(weighins, addDays(today, -7))
  const lastCheck = checkins[checkins.length - 1]
  const weeks = useMemo(() => weeklyAverages(weighins, today, 12), [weighins, today])
  const points = weeks
    .filter((w) => w.avg != null)
    .map((w) => ({ x: fromISO(w.week).getTime(), y: Math.round((w.avg as number) * 10) / 10, label: formatShort(w.week), sub: `Semaine du ${formatShort(w.week)} · ${w.count} pesée${w.count > 1 ? 's' : ''}` }))
  const daily = weighins.slice(-60).map((w) => ({ x: fromISO(w.date).getTime(), y: w.kg, label: formatShort(w.date) }))

  return (
    <div className="stack">
      <Segmented value={view} onChange={setView} options={[{ value: 'journal', label: 'Journal' }, { value: 'evolution', label: 'Évolution' }]} />
      {view === 'journal' ? (
        <>
          <div className="grid-2">
            <button className="card pressable" onClick={() => editWeight(today)}>
              <div className="row-between">
                <div className="icon-tile violet" style={{ width: 32, height: 32, borderRadius: 10 }}>
                  <Icon name="scale" size={18} />
                </div>
                {weighins.some((w) => w.date === today) && <Icon name="check" size={18} style={{ color: 'var(--ok)' }} />}
              </div>
              <div className="card-title" style={{ marginTop: 10, fontSize: 16 }}>
                Pesée
              </div>
              <div className="faint tiny">Chaque matin, à jeun</div>
              <div className="big-number" style={{ marginTop: 8, fontSize: 26 }}>
                {wk.avg != null ? fmtKg(Math.round(wk.avg * 10) / 10) : '–'}
                <span className="tiny faint" style={{ fontFamily: 'var(--font-body)' }}>
                  {' '}
                  kg moy.
                </span>
              </div>
              <div className="dots7" style={{ marginTop: 8, gap: 5 }}>
                {days.map((d) => (
                  <i key={d} className={`${weighins.some((w) => w.date === d) ? 'on' : ''} ${d === today ? 'today' : ''}`} style={{ width: 12, height: 12 }} title={dayLetter(d)} />
                ))}
              </div>
              {wk.avg != null && prev.avg != null && (
                <div className="tiny" style={{ marginTop: 6, color: wk.avg - prev.avg <= 0 ? 'var(--ok)' : 'var(--warn)' }}>
                  {fmtSigned(wk.avg - prev.avg, 1)} kg vs sem. dernière
                </div>
              )}
            </button>
            <button className="card pressable" onClick={() => ui.push(<CheckInEditor />)}>
              <div className="row-between">
                <div className="icon-tile" style={{ width: 32, height: 32, borderRadius: 10 }}>
                  <Icon name="list" size={18} />
                </div>
                {lastCheck && relativeDay(lastCheck.date).length > 0 && addDays(lastCheck.date, 7) > today && <Icon name="check" size={18} style={{ color: 'var(--ok)' }} />}
              </div>
              <div className="card-title" style={{ marginTop: 10, fontSize: 16 }}>
                Bilan complet
              </div>
              <div className="faint tiny">Mensurations + photos</div>
              <div className="small" style={{ marginTop: 10 }}>
                {lastCheck ? (
                  <>
                    Dernier : <b>{relativeDay(lastCheck.date).toLowerCase()}</b>
                  </>
                ) : (
                  'Aucun bilan'
                )}
              </div>
              <div className="link-btn small" style={{ marginTop: 8 }}>
                + Nouveau bilan
              </div>
            </button>
          </div>

          <div className="section-label">
            <span>Mes bilans</span>
            {checkins.length >= 2 && <button onClick={() => ui.push(<CompareSheet />)}>Avant / après</button>}
          </div>
          {checkins.length === 0 ? (
            <div className="callout">Un bilan par semaine (même jour, même heure) : mensurations, photos de face, profil et dos, et ton ressenti. Ton coach le retrouve dans le sheet.</div>
          ) : (
            <div className="card flush list">
              {[...checkins].reverse().map((c) => (
                <CheckInRow key={c.id} c={c} />
              ))}
            </div>
          )}

          <div className="section-label">Pesées récentes</div>
          <div className="card flush list">
            {weighins.length === 0 && <div className="empty small">Pèse-toi le matin : la moyenne de la semaine lisse les variations d’eau.</div>}
            {[...weighins].reverse().slice(0, 14).map((w) => (
              <button key={w.date} className="list-item" onClick={() => editWeight(w.date)}>
                <div className="grow title">
                  {cap(relativeDay(w.date))}
                </div>
                <div className="bold num">{fmtKg(w.kg)} kg</div>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="card" style={{ paddingTop: 20 }}>
            <div className="bold" style={{ marginBottom: 8 }}>
              Moyenne hebdomadaire
            </div>
            <LineChart data={points} color="var(--weight)" formatY={(n) => fmtKg(Math.round(n * 10) / 10)} formatValue={(p) => `${fmtKg(p.y)} kg`} emptyLabel="Pèse-toi quelques jours pour voir la tendance" />
          </div>
          <div className="card" style={{ paddingTop: 20 }}>
            <div className="bold" style={{ marginBottom: 8 }}>
              Pesées quotidiennes
            </div>
            <LineChart data={daily} color="var(--text-2)" formatY={(n) => fmtKg(Math.round(n * 10) / 10)} formatValue={(p) => `${fmtKg(p.y)} kg`} />
          </div>
          <MeasuresTable />
        </>
      )}
    </div>
  )
}

function CheckInRow({ c }: { c: CheckIn }) {
  const thumb = usePhotoUrl(c.photos.face ?? c.photos.profil ?? c.photos.dos)
  const nMeasures = Object.values(c.measures).filter((v) => v != null).length
  return (
    <button className="list-item" onClick={() => ui.push(<CheckInEditor checkinId={c.id} />)}>
      {thumb ? <img className="food-thumb" src={thumb} alt="" /> : <div className="food-thumb" />}
      <div className="grow">
        <div className="title">
          {cap(relativeDay(c.date))}
        </div>
        <div className="meta">
          {nMeasures} mesure{nMeasures > 1 ? 's' : ''} · {Object.keys(c.photos).length} photo{Object.keys(c.photos).length > 1 ? 's' : ''}
          {c.measures.taille != null ? ` · taille ${fmtKg(c.measures.taille)} cm` : ''}
        </div>
      </div>
      <Icon name="chevron-right" size={18} style={{ color: 'var(--text-3)' }} />
    </button>
  )
}

function MeasuresTable() {
  const checkins = useStore((s) => s.checkins)
  const rows = MEASURES.map((m) => {
    const vals = checkins.filter((c) => c.measures[m.key] != null)
    if (!vals.length) return null
    const first = vals[0].measures[m.key] as number
    const last = vals[vals.length - 1].measures[m.key] as number
    return { ...m, first, last, n: vals.length }
  }).filter((r): r is NonNullable<typeof r> => !!r)
  if (!rows.length) return <div className="callout">Les mensurations de tes bilans apparaîtront ici.</div>
  return (
    <div className="card flush list">
      {rows.map((r) => (
        <div className="list-item" key={r.key}>
          <div className="grow title">{r.label}</div>
          <div className="num small faint">{fmtKg(r.first)} → </div>
          <div className="num bold">{fmtKg(r.last)} cm</div>
          {r.n > 1 && <span className="badge">{fmtSigned(r.last - r.first, 1)}</span>}
        </div>
      ))}
    </div>
  )
}
