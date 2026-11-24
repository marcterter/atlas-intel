import { Icon } from '../../components/Icon.tsx'
import { Markdown } from '../../components/Markdown.tsx'
import { Sheet } from '../../components/ui.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { addDays, formatShort, startOfWeek, todayISO } from '../../lib/date.ts'
import { changeKey, describeChange } from '../../lib/programChanges.ts'
import { describeMacroProposal, proposalIsCurrent, proposalSummary } from '../../lib/macroProposal.ts'
import type { AiAdvice } from '../../lib/types.ts'
import { CheckInEditor } from '../progress/Bilan.tsx'

/** Macros proposées par l'agent, encore à trancher (et qui changent vraiment quelque chose). */
export function useMacrosPending(c: AiAdvice | null): boolean {
  const vu = useStore((s) => (c ? s.macrosVu?.[c.semaine] : undefined))
  const current = useStore((s) => !!c?.macros && proposalIsCurrent(s.targets, s.profile.goal, c.macros))
  return !!c?.macros && !vu && !current
}

/**
 * Macros proposées par l'agent : phase, jour ON, jour OFF et fibres, de tes objectifs actuels aux nouveaux.
 * « Appliquer » les met dans tes objectifs (avec « Annuler »), « Garder mes macros » les écarte.
 * `compact` : dans la carte « Bilan du lundi », sans titre ni cadre.
 */
export function AgentMacros({ c, compact = false }: { c: AiAdvice; compact?: boolean }) {
  const targets = useStore((s) => s.targets)
  const goal = useStore((s) => s.profile.goal)
  const state = useStore((s) => s.macrosVu?.[c.semaine])
  const decide = useStore((s) => s.decideAgentMacros)
  const m = c.macros
  if (!m) return null
  const current = proposalIsCurrent(targets, goal, m)
  // Le détail « avant → après » n'a de sens que tant que la proposition n'est pas dans tes objectifs.
  const lines = describeMacroProposal(targets, goal, m)
  const apply = () => {
    const { undo } = decide(c.semaine, 'applique')
    ui.undo(`Objectifs mis à jour · ${proposalSummary(m)}`, undo)
  }
  return (
    <div className={`agent-macros ${state ?? ''}`}>
      {!compact && <div className="section-label">Macros proposées</div>}
      <div className={compact ? '' : 'card tight'}>
        {!(state === 'applique' || current) && (
          <div className={`stack ${compact ? 'review-next' : ''}`} style={{ gap: 6 }}>
            {lines.map((l) => (
              <div key={l.label}>
                <div className="row-between small">
                  <span className="faint">{l.label}</span>
                  <span className="num">
                    <span className="faint">{l.from} → </span>
                    <b>{l.to}</b>
                  </span>
                </div>
                {l.detail && <div className="tiny faint num" style={{ textAlign: 'right' }}>{l.detail}</div>}
              </div>
            ))}
          </div>
        )}
        {m.pourquoi && <div className="faint small" style={{ marginTop: 6 }}>{m.pourquoi}</div>}
        <div className="row" style={{ gap: 8, marginTop: 10 }}>
          {state === 'applique' || current ? (
            <span className="small ok bold">{state === 'applique' ? `Appliqué ✓ · ${proposalSummary(m)}` : 'Ce sont déjà tes objectifs ✓'}</span>
          ) : state === 'garde' ? (
            <>
              <span className="small faint">Tu as gardé tes macros</span>
              <button className="link-btn small" onClick={() => decide(c.semaine, null)}>
                Revoir
              </button>
            </>
          ) : (
            <>
              <button className="btn soft grow" onClick={() => decide(c.semaine, 'garde')}>
                Garder mes macros
              </button>
              <button className="btn grow" onClick={apply}>
                Appliquer
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Changements de programme pas encore appliqués ni ignorés. */
function usePendingChanges(c: AiAdvice | null) {
  const vu = useStore((s) => s.programmeVu)
  return (c?.programme ?? []).filter((ch) => !vu?.[`${c?.semaine}#${changeKey(ch)}`])
}

/** Programme proposé par l'agent : chaque changement s'applique (ou s'ignore) d'un geste, avec « Annuler ». */
function ProgramProposals({ c }: { c: AiAdvice }) {
  const routines = useStore((s) => s.routines)
  const custom = useStore((s) => s.customExercises)
  const vu = useStore((s) => s.programmeVu)
  const apply = useStore((s) => s.applyProgramChanges)
  const setChange = useStore((s) => s.setProgramChange)
  const pending = usePendingChanges(c)
  if (!c.programme?.length) return null
  const run = (list: NonNullable<AiAdvice['programme']>) => {
    const r = apply(c.semaine, list)
    if (r.errors.length) ui.toast(r.errors.join(' · '), 'err')
    if (r.applied.length) ui.undo(r.applied.length > 1 ? `${r.applied.length} changements appliqués à tes séances` : `Appliqué · ${r.applied[0]}`, r.undo)
  }
  return (
    <div>
      <div className="section-label">Programme proposé</div>
      <div className="stack" style={{ gap: 8 }}>
        {c.programme.map((ch) => {
          const state = vu?.[`${c.semaine}#${changeKey(ch)}`]
          return (
            <div key={changeKey(ch)} className={`card tight prog-change ${state ?? ''}`}>
              <div className="bold small">{describeChange(ch, routines, custom)}</div>
              {ch.pourquoi && <div className="faint small" style={{ marginTop: 2 }}>{ch.pourquoi}</div>}
              <div className="row" style={{ gap: 8, marginTop: 8 }}>
                {state === 'applique' ? (
                  <span className="small ok bold">Appliqué ✓</span>
                ) : state === 'ignore' ? (
                  <>
                    <span className="small faint">Ignoré</span>
                    <button className="link-btn small" onClick={() => setChange(c.semaine, ch, null)}>
                      Revoir
                    </button>
                  </>
                ) : (
                  <>
                    <button className="btn small" onClick={() => run([ch])}>
                      Appliquer
                    </button>
                    <button className="btn soft small" onClick={() => setChange(c.semaine, ch, 'ignore')}>
                      Ignorer
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {pending.length > 1 && (
        <button className="btn block" style={{ marginTop: 10 }} onClick={() => run(pending)}>
          Tout appliquer ({pending.length})
        </button>
      )}
      <div className="faint tiny" style={{ marginTop: 6 }}>
        Tes séances changent dans l’app (pas chez ton coach). « Annuler » juste après pour revenir en arrière.
      </div>
    </div>
  )
}

/** Conseils complets de l'agent IA du lundi. */
export function ConseilsSheet() {
  const c = useStore((s) => s.conseils)
  return (
    <Sheet title="Conseils de la semaine">
      {c ? (
        <div className="stack">
          <div className="faint small">
            Semaine du {formatShort(c.semaine)} au {formatShort(addDays(c.semaine, 6))}
            {c.date ? ` · rédigés le ${new Date(c.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}` : ''}
          </div>
          <Markdown text={c.texte} />
          <AgentMacros c={c} />
          <ProgramProposals c={c} />
          {!!c.exercices?.length && (
            <div>
              <div className="section-label">Dans tes séances</div>
              <div className="stack" style={{ gap: 8 }}>
                {c.exercices.map((x) => (
                  <div key={x.nom} className="ai-tip" style={{ marginTop: 0 }}>
                    <Icon name="bolt" size={14} />
                    <span>
                      <b>{x.nom}</b> · {x.conseil}
                    </span>
                  </div>
                ))}
              </div>
              <div className="faint tiny" style={{ marginTop: 6 }}>
                Chaque conseil s’affiche aussi sous l’objectif de l’exercice, pendant ta séance.
              </div>
            </div>
          )}
          <div className="callout small">Rédigés par Claude à partir de tes données (séances, diète, pas, poids, ressenti), de tes notes et de tes photos de bilan. Ce ne sont pas des avis médicaux.</div>
        </div>
      ) : (
        <div className="faint">Pas encore de conseils : l’agent passe chaque lundi matin.</div>
      )}
    </Sheet>
  )
}

/**
 * Du vendredi au dimanche : les photos de la semaine pour l'agent du lundi (face, profil, dos et capture
 * myAir), tant qu'aucun bilan avec photos n'a moins de 4 jours.
 */
export function PhotosReminder() {
  const want = useStore((s) => s.settings.photosAgent !== false && s.sync.enabled)
  const recent = useStore((s) => s.checkins.some((c) => c.date >= addDays(todayISO(), -3) && (Object.keys(c.photos).length > 0 || !!c.myair)))
  const day = new Date().getDay()
  if (!want || recent || ![5, 6, 0].includes(day)) return null
  return (
    <button className="card pressable row" style={{ gap: 12, textAlign: 'left', width: '100%' }} onClick={() => ui.push(<CheckInEditor />)}>
      <div className="icon-tile violet">
        <Icon name="camera" size={20} />
      </div>
      <div className="grow" style={{ minWidth: 0 }}>
        <div className="bold">Photos de la semaine</div>
        <div className="faint small">Face, profil, dos et capture myAir avant lundi : l’agent suit ton physique d’une semaine à l’autre.</div>
      </div>
      <Icon name="chevron-right" size={18} />
    </button>
  )
}

function pendingLabel(macros: boolean, changes: number): string {
  const prog = `${changes} changement${changes > 1 ? 's' : ''} de programme`
  if (macros && changes) return `Nouvelles macros et ${prog} à valider`
  return macros ? 'Nouvelles macros à valider' : `${prog} à valider`
}

/** Carte d'Aujourd'hui : début des conseils de la semaine, jusqu'à ce qu'ils soient lus (et au plus deux semaines). */
export function ConseilsCard() {
  const c = useStore((s) => s.conseils)
  const vus = useStore((s) => s.conseilsVus)
  const markSeen = useStore((s) => s.markConseilsSeen)
  const pending = usePendingChanges(c)
  const macrosPending = useMacrosPending(c)
  // Le bilan du lundi de l'app montre déjà les macros de l'agent tant qu'il n'est pas tranché.
  const inReview = useStore((s) => !!c && c.semaine === addDays(startOfWeek(todayISO()), -7) && !s.reviews[startOfWeek(todayISO())])
  const macrosHere = macrosPending && !inReview
  if (!c || todayISO() > addDays(c.semaine, 14)) return null
  const toDecide = pending.length > 0 || macrosHere
  if (vus === c.semaine) {
    // Conseils lus : il ne reste qu'un rappel de ce qui attend encore une réponse.
    if (!toDecide) return null
    return (
      <button className="card pressable row conseils" style={{ gap: 12, textAlign: 'left', width: '100%' }} onClick={() => ui.push(<ConseilsSheet />)}>
        <div className="icon-tile violet">
          <Icon name="bolt" size={20} />
        </div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="bold">Conseils de la semaine</div>
          <div className="faint small">{pendingLabel(macrosHere, pending.length)}</div>
        </div>
        <Icon name="chevron-right" size={18} />
      </button>
    )
  }
  // Aperçu : les premières lignes (titres et puces), le reste dans « Tout lire ».
  const lines = c.texte.split('\n').filter((l) => l.trim())
  const preview = lines.slice(0, 6).join('\n')
  return (
    <div className="card conseils">
      <div className="card-head" style={{ marginBottom: 6 }}>
        <div className="icon-tile violet">
          <Icon name="bolt" size={20} />
        </div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="card-title">Conseils de la semaine</div>
          <div className="faint small">Agent IA · semaine du {formatShort(c.semaine)}</div>
        </div>
      </div>
      <Markdown text={preview} />
      {!!c.exercices?.length && (
        <div className="faint small" style={{ marginTop: 6 }}>
          + {c.exercices.length} conseil{c.exercices.length > 1 ? 's' : ''} par exercice, affiché{c.exercices.length > 1 ? 's' : ''} dans tes séances
        </div>
      )}
      {toDecide && (
        <button className="prog-pending" onClick={() => ui.push(<ConseilsSheet />)}>
          <Icon name="list" size={14} />
          <span className="grow">{pendingLabel(macrosHere, pending.length)}</span>
          <Icon name="chevron-right" size={14} />
        </button>
      )}
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn soft grow" onClick={markSeen}>
          OK, vu
        </button>
        <button className="btn grow" onClick={() => ui.push(<ConseilsSheet />)}>
          {lines.length > 6 ? 'Tout lire' : 'Ouvrir'}
        </button>
      </div>
    </div>
  )
}
