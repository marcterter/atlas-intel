import { useRef } from 'react'
import { Icon } from '../../components/Icon.tsx'
import { Toggle, confirmDialog, menuDialog } from '../../components/ui.tsx'
import { ProfileEditor, TargetsEditor } from './ProfileForms.tsx'
import { SyncSetup } from './SyncSetup.tsx'
import { ShortcutGuide } from './Guides.tsx'
import { useStore, exportJSON, parseImport } from '../../store/store.ts'
import { checkForUpdate } from '../../lib/update.ts'
import { storageMode } from '../../store/persist.ts'
import { ui } from '../../store/ui.ts'
import { ACTIVITY, GOALS, ageFrom } from '../../lib/nutrition.ts'
import { fmt, fmtTimer, timeAgo } from '../../lib/format.ts'
import { dirtyCount, isConfigured } from '../../lib/sync.ts'
import { isIOS, isStandalone } from '../../lib/device.ts'
import { todayISO } from '../../lib/date.ts'

function Row({ icon, tile, title, meta, onClick, right }: { icon: string; tile?: string; title: string; meta?: string; onClick?: () => void; right?: React.ReactNode }) {
  const content = (
    <>
      <div className={`icon-tile ${tile ?? ''}`} style={{ width: 34, height: 34, borderRadius: 10 }}>
        <Icon name={icon} size={18} />
      </div>
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="title">{title}</div>
        {meta && <div className="meta ellipsis">{meta}</div>}
      </div>
      {right ?? (onClick ? <Icon name="chevron-right" size={18} style={{ color: 'var(--text-3)' }} /> : null)}
    </>
  )
  return onClick ? (
    <button className="list-item" onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className="list-item">{content}</div>
  )
}

export function ProfileScreen() {
  const profile = useStore((s) => s.profile)
  const targets = useStore((s) => s.targets)
  const settings = useStore((s) => s.settings)
  const update = useStore((s) => s.updateSettings)
  const sync = useStore((s) => s.sync)
  const configured = useStore((s) => isConfigured(s))
  const pending = useStore((s) => dirtyCount(s))
  const sessionsCount = useStore((s) => s.sessions.length)
  const entriesCount = useStore((s) => s.entries.length)
  const fileRef = useRef<HTMLInputElement>(null)

  const exportData = async () => {
    const json = exportJSON()
    const name = `forge-sauvegarde-${todayISO()}.json`
    const file = new File([json], name, { type: 'application/json' })
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Sauvegarde Forge' })
        return
      }
    } catch {
      /* repli téléchargement */
    }
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  const importData = async (f: File) => {
    try {
      const data = parseImport(await f.text())
      if (!(await confirmDialog({ title: 'Remplacer les données ?', message: `La sauvegarde contient ${data.sessions.length} séances et ${data.entries.length} aliments. Tes données actuelles seront remplacées.`, confirm: 'Importer', danger: true }))) return
      useStore.getState().importData(data)
      ui.toast('Sauvegarde importée', 'ok')
    } catch {
      ui.toast('Fichier de sauvegarde invalide', 'err')
    }
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <h1 className="display screen-title">Profil</h1>
          <div className="subtitle">
            {profile.name || 'Toi'} · {ageFrom(profile.birthYear)} ans · {profile.heightCm} cm
          </div>
        </div>
      </div>

      <div className="stack">
        <div className="card flush list">
          <Row
            icon="user"
            title="Mon profil"
            meta={[
              GOALS[profile.goal].label,
              profile.stepsPerDay ? `${fmt(profile.stepsPerDay)} pas/j` : ACTIVITY[profile.activity].label,
              profile.sessionsPerWeek != null ? `${profile.sessionsPerWeek} séance${profile.sessionsPerWeek > 1 ? 's' : ''}/sem` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
            onClick={() => ui.push(<ProfileEditor />)}
          />
          <Row
            icon="target"
            title="Objectifs du jour"
            meta={
              targets.rest
                ? `ON ${fmt(targets.base.kcal)} · OFF ${fmt(targets.rest.kcal)} kcal · ${fmt(targets.steps)} pas`
                : `${fmt(targets.base.kcal)} kcal · P ${targets.base.protein} · G ${targets.base.carbs} · L ${targets.base.fat} · ${fmt(targets.steps)} pas`
            }
            onClick={() => ui.push(<TargetsEditor />)}
          />
        </div>

        <div className="section-label">Coach & synchronisation</div>
        <div className="card flush list">
          <Row
            icon={configured ? 'cloud' : 'cloud-off'}
            tile={configured ? 'green' : ''}
            title="Google Sheets"
            meta={
              configured
                ? sync.lastError
                  ? `Erreur : ${sync.lastError}`
                  : `${sync.lastPushAt ? `Envoyé ${timeAgo(sync.lastPushAt)}` : 'Relié'}${pending ? ` · ${pending} en attente` : ''}`
                : 'Non relié : touche pour configurer'
            }
            onClick={() => ui.push(<SyncSetup />)}
          />
          <Row icon="steps" tile="green" title="Pas automatiques" meta="Raccourci iOS Santé → sheet" onClick={() => ui.push(<ShortcutGuide />)} />
        </div>

        <div className="section-label">Séances</div>
        <div className="card flush list">
          <Row
            icon="clock"
            title="Repos par défaut"
            meta="Pour les nouveaux exercices"
            onClick={async () => {
              const c = await menuDialog('Repos par défaut', [60, 90, 120, 150, 180, 240].map((v) => ({ id: String(v), label: fmtTimer(v) })))
              if (c) update({ defaultRestSec: Number(c) })
            }}
            right={<span className="badge">{fmtTimer(settings.defaultRestSec)}</span>}
          />
          <Row icon="play" title="Chrono auto après chaque série" right={<Toggle on={settings.autoRest} onChange={(v) => update({ autoRest: v })} label="Chrono auto" />} />
          <Row icon="zap" title="Bip à la fin du repos" right={<Toggle on={settings.sound} onChange={(v) => update({ sound: v })} label="Son" />} />
          <Row icon="bolt" title="Vibration" meta="Android, et iPhone sous iOS 18+" right={<Toggle on={settings.haptics} onChange={(v) => update({ haptics: v })} label="Vibration" />} />
          <Row icon="info" title="Garder l’écran allumé" meta="Pendant une séance" right={<Toggle on={settings.keepAwake} onChange={(v) => update({ keepAwake: v })} label="Écran allumé" />} />
        </div>

        {!isStandalone() && (
          <>
            <div className="section-label">Installer l’app</div>
            <div className="callout">
              {isIOS() ? (
                <>
                  Dans Safari, touche <b>Partager</b> <Icon name="upload" size={14} style={{ verticalAlign: -2 }} /> puis <b>Sur l’écran d’accueil</b>. Forge s’ouvrira en plein écran, hors connexion, et tes données y seront mieux protégées.
                </>
              ) : (
                <>Dans le menu du navigateur, choisis « Installer l’application » ou « Ajouter à l’écran d’accueil ».</>
              )}
            </div>
          </>
        )}

        <div className="section-label">Mes données</div>
        <div className="card flush list">
          <Row icon="download" title="Exporter une sauvegarde" meta={`${sessionsCount} séances · ${entriesCount} aliments notés`} onClick={exportData} />
          <Row icon="upload" title="Importer une sauvegarde" onClick={() => fileRef.current?.click()} />
          <Row
            icon="trash"
            title="Tout effacer"
            meta="Remet l’app à zéro sur ce téléphone"
            onClick={async () => {
              if (await confirmDialog({ title: 'Tout effacer ?', message: 'Séances, diète, pesées… tout sera supprimé de ce téléphone. Ton Google Sheet n’est pas touché.', confirm: 'Tout effacer', danger: true })) {
                await useStore.getState().resetAll()
              }
            }}
          />
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void importData(f)
            e.target.value = ''
          }}
        />
        <div className="faint tiny center" style={{ marginTop: 8 }}>
          Forge · version du {new Date(__APP_BUILD__.date).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} ({__APP_BUILD__.sha}) · {location.host}
          <br />
          stockage {storageMode() === 'idb' ? 'local (IndexedDB)' : storageMode() === 'local' ? 'local (localStorage)' : 'temporaire'} · données sur ce téléphone
        </div>
        <button
          className="link-btn"
          style={{ alignSelf: 'center' }}
          onClick={async () => {
            const r = await checkForUpdate()
            ui.toast(
              r === 'nouvelle' ? 'Mise à jour en cours : l’app va se recharger' : r === 'a-jour' ? 'Tu as la dernière version' : 'Vérification impossible (hors connexion ?)',
              r === 'indisponible' ? 'err' : 'ok',
            )
          }}
        >
          Rechercher une mise à jour
        </button>
      </div>
    </div>
  )
}
