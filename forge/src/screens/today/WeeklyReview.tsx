import { Icon } from '../../components/Icon.tsx'
import { menuDialog } from '../../components/ui.tsx'
import { useStore } from '../../store/store.ts'
import { dayTargets } from '../../store/selectors.ts'
import { ui } from '../../store/ui.ts'
import { weekReview } from '../../lib/review.ts'
import { GOALS } from '../../lib/nutrition.ts'
import { dayNum, formatShort, todayISO } from '../../lib/date.ts'
import { fmt } from '../../lib/format.ts'
import type { Goal, Targets } from '../../lib/types.ts'

const kcalPair = (t: Targets) => (t.rest ? `ON ${fmt(t.base.kcal)} · OFF ${fmt(t.rest.kcal)} kcal` : `${fmt(t.base.kcal)} kcal`)

/**
 * Bilan du lundi : poids moyen de la semaine passée contre celle d'avant, et proposition d'ajustement
 * des macros. Reste affiché toute la semaine tant qu'il n'est pas tranché.
 */
export function WeeklyReviewCard() {
  const goal = useStore((s) => s.profile.goal)
  const targets = useStore((s) => s.targets)
  const weighins = useStore((s) => s.weighins)
  const entries = useStore((s) => s.entries)
  const reviews = useStore((s) => s.reviews)
  const decide = useStore((s) => s.decideReview)
  const updateProfile = useStore((s) => s.updateProfile)
  const review = weekReview({ today: todayISO(), goal, targets, weighins, entries, targetFor: (d) => dayTargets(useStore.getState(), d) })

  if (reviews[review.monday]) return null
  // Pas de carte pour qui ne se pèse pas du tout (nouvel utilisateur…).
  if (review.kind === 'manque' && review.count + review.prevCount === 0) return null

  const info = { deltaKcal: review.deltaKcal, avg: review.avg, deltaKg: review.deltaKg }
  const changeGoal = async () => {
    const g = await menuDialog(
      'Ton objectif',
      (Object.keys(GOALS) as Goal[]).map((k) => ({ id: k, label: `${GOALS[k].label}${k === goal ? ' ✓' : ''}` })),
    )
    if (g && g !== goal) updateProfile({ goal: g as Goal })
  }

  return (
    <div className={`card review ${review.kind}`}>
      <div className="card-head" style={{ marginBottom: 10 }}>
        <div className="icon-tile">
          <Icon name="trend" size={20} />
        </div>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="card-title">Bilan du lundi</div>
          <div className="faint small">
            Semaine du {dayNum(review.from)} au {formatShort(review.to)} ·{' '}
            <button className="link-btn" onClick={changeGoal} style={{ fontSize: 'inherit' }}>
              {GOALS[goal].label}
            </button>
          </div>
        </div>
      </div>
      <div className="review-title">{review.title}</div>
      <div className="small muted" style={{ marginTop: 4 }}>
        {review.detail}
      </div>
      {review.next && (
        <div className="review-next">
          <div className="bold num">{kcalPair(review.next)}</div>
          <div className="tiny faint">
            au lieu de {kcalPair(targets)} · glucides {review.next.base.carbs} g{review.next.rest ? ` / ${review.next.rest.carbs} g` : ''}
          </div>
        </div>
      )}
      <div className="row" style={{ marginTop: 12 }}>
        {review.kind === 'ajuste' && review.next ? (
          <>
            <button className="btn soft grow" onClick={() => decide(review.monday, { decision: 'kept', ...info })}>
              Garder mes macros
            </button>
            <button
              className="btn grow"
              onClick={() => {
                decide(review.monday, { decision: 'applied', ...info }, review.next)
                ui.toast(`Objectifs mis à jour : ${kcalPair(review.next as Targets)}`, 'ok')
              }}
            >
              Appliquer
            </button>
          </>
        ) : (
          <button className="btn soft block" onClick={() => decide(review.monday, { decision: 'seen', ...info })}>
            OK
          </button>
        )}
      </div>
    </div>
  )
}
