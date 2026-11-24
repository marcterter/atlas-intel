import { useMemo } from 'react'
import { Icon } from '../../components/Icon.tsx'
import { SwipeToDelete } from '../../components/Swipe.tsx'
import { menuDialog } from '../../components/ui.tsx'
import { DayTypeSwitch, useDayLabel } from './DayType.tsx'
import { AddFood } from './AddFood.tsx'
import { FoodDetail } from './FoodDetail.tsx'
import { MacroBars, MacroDots, MacroSummary } from './components.tsx'
import { RecipeEditor } from './Recipes.tsx'
import { useStore } from '../../store/store.ts'
import { dayTargets, getFood } from '../../store/selectors.ts'
import { ui, useUI } from '../../store/ui.ts'
import { MEALS, dayTotals, kcalFromMacros, macrosLookIncomplete, mealForNow, sumNutrients } from '../../lib/nutrition.ts'
import { addDays, cap, relativeDay, formatLong, todayISO } from '../../lib/date.ts'
import { fmt } from '../../lib/format.ts'
import { uid } from '../../lib/id.ts'
import type { FoodEntry, MealId } from '../../lib/types.ts'

export function openAddFood(date: string, meal?: MealId) {
  ui.push(<AddFood date={date} meal={meal ?? mealForNow()} />)
}

export function DietScreen() {
  const date = useUI((s) => s.date)
  const setDate = useUI((s) => s.setDate)
  const entries = useStore((s) => s.entries)
  const targets = useStore((s) => s.targets)
  const foods = useStore((s) => s.foods)
  const recipes = useStore((s) => s.recipes)
  const copyEntries = useStore((s) => s.copyEntries)
  const deleteEntries = useStore((s) => s.deleteEntries)
  const restoreEntries = useStore((s) => s.restoreEntries)
  const hapticsOn = useStore((s) => s.settings.haptics)
  const t = useStore((s) => dayTargets(s, date))
  const dayLabel = useDayLabel(date)
  const dayEntries = useMemo(() => entries.filter((e) => e.date === date).sort((a, b) => a.createdAt - b.createdAt), [entries, date])
  const totals = useMemo(() => dayTotals(entries, date), [entries, date])
  const yesterday = useMemo(() => entries.filter((e) => e.date === addDays(date, -1)), [entries, date])
  const yesterdayCount = yesterday.length

  // Copie d'hier (un repas ou toute la journée), annulable.
  const copyFromYesterday = (meal: MealId | null) => {
    const ids = copyEntries(addDays(date, -1), date, meal)
    if (!ids.length) {
      ui.toast('Rien à copier hier pour ce repas', 'info')
      return
    }
    const n = ids.length
    const where = meal ? ` · ${MEALS.find((m) => m.id === meal)?.label ?? ''}` : ''
    ui.undo(`${n} aliment${n > 1 ? 's' : ''} copié${n > 1 ? 's' : ''} depuis la veille${where}`, () => deleteEntries(ids))
  }

  const removeEntry = (e: FoodEntry) => {
    useStore.getState().deleteEntry(e.id)
    ui.undo(`Aliment retiré · ${e.name}`, () => restoreEntries([e]))
  }

  const openEntry = (e: FoodEntry) => {
    const food = e.foodId ? getFood({ foods, recipes }, e.foodId) : undefined
    if (food) ui.push(<FoodDetail food={food} date={date} meal={e.meal} entryId={e.id} />)
    else
      void menuDialog(e.name, [{ id: 'del', label: 'Retirer', icon: 'trash', danger: true }]).then((c) => {
        if (c === 'del') useStore.getState().deleteEntry(e.id)
      })
  }

  const mealMenu = async (meal: MealId) => {
    const c = await menuDialog(MEALS.find((m) => m.id === meal)?.label ?? '', [
      { id: 'copy', label: 'Copier le même repas d’hier', icon: 'copy' },
      { id: 'recipe', label: 'Enregistrer comme recette', icon: 'book' },
      { id: 'clear', label: 'Vider ce repas', icon: 'trash', danger: true },
    ])
    if (c === 'copy') copyFromYesterday(meal)
    if (c === 'recipe') {
      const ingredients = dayEntries
        .filter((e) => e.meal === meal && e.foodId && e.grams > 0)
        .map((e) => {
          const f = getFood({ foods, recipes }, e.foodId as string)
          return f ? { foodId: f.id, name: f.name, grams: e.grams, per100: f.per100 } : null
        })
        .filter((x): x is NonNullable<typeof x> => !!x)
      if (!ingredients.length) return ui.toast('Ajoute d’abord des aliments pesés', 'info')
      const id = uid()
      useStore.getState().saveRecipe({ id, name: `${MEALS.find((x) => x.id === meal)?.label ?? 'Repas'} maison`, portions: 1, ingredients, createdAt: Date.now(), updatedAt: Date.now() })
      ui.push(<RecipeEditor recipeId={id} />)
      ui.toast('Recette créée : renomme-la si besoin', 'ok')
    }
    if (c === 'clear') dayEntries.filter((e) => e.meal === meal).forEach((e) => useStore.getState().deleteEntry(e.id))
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <div>
          <h1 className="display screen-title">Diète</h1>
          <div className="subtitle">
            {cap(date === todayISO() ? formatLong(date) : relativeDay(date))}
          </div>
        </div>
        <div className="row" style={{ gap: 4 }}>
          <button className="icon-btn filled" onClick={() => setDate(addDays(date, -1))} aria-label="Jour précédent">
            <Icon name="chevron-left" />
          </button>
          <button className="icon-btn filled" onClick={() => setDate(addDays(date, 1))} aria-label="Jour suivant">
            <Icon name="chevron-right" />
          </button>
        </div>
      </div>

      <div className="stack">
        <div className="card">
          <MacroSummary n={totals} t={t} fiberGoal={targets.fiber} />
          <div className="hr" />
          <MacroBars n={totals} t={t} fiberGoal={targets.fiber} />
          {totals.kcal - kcalFromMacros(totals) > 60 && (
            // Les kcal des étiquettes comptent aussi les fibres (~2 kcal/g) et parfois des macros manquantes.
            <div className="faint tiny" style={{ marginTop: 12 }}>
              Étiquettes {fmt(totals.kcal)} kcal · tes macros en font {fmt(kcalFromMacros(totals))} (+ fibres ≈ {fmt((totals.fiber ?? 0) * 2)} kcal)
              {dayEntries.some((e) => macrosLookIncomplete(e.n)) ? ', le reste vient d’aliments aux valeurs incomplètes (⚠)' : ''}. Vise surtout tes macros.
            </div>
          )}
          <div className="row-between" style={{ marginTop: 14, gap: 10 }}>
            <div style={{ minWidth: 0 }}>
              <div className="bold small">{dayLabel}</div>
              <div className="tiny faint">
                {targets.rest ? `ON ${fmt(targets.base.kcal)} kcal · OFF ${fmt(targets.rest.kcal)} kcal` : 'Mêmes objectifs tous les jours'}
              </div>
            </div>
            <DayTypeSwitch date={date} />
          </div>
        </div>

        {dayEntries.length === 0 && yesterdayCount > 0 && (
          <button
            className="btn soft block"
            onClick={() => copyFromYesterday(null)}
          >
            <Icon name="copy" size={18} /> Reprendre la journée de la veille
          </button>
        )}

        {MEALS.map((m) => {
          const items = dayEntries.filter((e) => e.meal === m.id)
          const sub = sumNutrients(items.map((e) => e.n))
          // Repas vide aujourd'hui mais pris hier : le reprendre en un geste.
          const again = items.length === 0 ? yesterday.filter((e) => e.meal === m.id) : []
          return (
            <div className="card flush meal-card" key={m.id}>
              <div className="meal-head">
                <div className="grow">
                  <div className="card-title">{m.label}</div>
                  {items.length > 0 ? (
                    <div className="row small" style={{ gap: 10, marginTop: 2 }}>
                      <b className="num">{fmt(sub.kcal)} kcal</b>
                      <MacroDots n={sub} fiber />
                    </div>
                  ) : (
                    <div className="faint small">Rien pour l’instant</div>
                  )}
                </div>
                <button className="icon-btn" onClick={() => mealMenu(m.id)} aria-label={`Options ${m.label}`}>
                  <Icon name="more" />
                </button>
                <button className="icon-btn accent" onClick={() => openAddFood(date, m.id)} aria-label={`Ajouter au ${m.label}`}>
                  <Icon name="plus" />
                </button>
              </div>
              {again.length > 0 && (
                <button className="meal-again" onClick={() => copyFromYesterday(m.id)}>
                  <Icon name="copy" size={16} />
                  <span className="grow ellipsis">
                    Comme hier · {again.length} aliment{again.length > 1 ? 's' : ''}
                  </span>
                  <b className="num">{fmt(sumNutrients(again.map((e) => e.n)).kcal)} kcal</b>
                </button>
              )}
              {items.map((e) => (
                <SwipeToDelete key={e.id} onDelete={() => removeEntry(e)} label="Retirer" vibrate={hapticsOn}>
                <button className="food-row" onClick={() => openEntry(e)}>
                  <div className="grow" style={{ minWidth: 0 }}>
                    <div className="ellipsis" style={{ fontWeight: 600 }}>
                      {e.name}
                    </div>
                    <div className="faint small ellipsis">
                      {[e.brand, e.portionLabel ?? (e.grams ? `${fmt(e.grams)} g` : 'ajout rapide')].filter(Boolean).join(' · ')}
                      {macrosLookIncomplete(e.n) && <span style={{ color: 'var(--warn)' }}> · ⚠ macros à vérifier</span>}
                    </div>
                  </div>
                  <div className="kcal">{fmt(e.n.kcal)}</div>
                </button>
                </SwipeToDelete>
              ))}
            </div>
          )
        })}

        <button className="btn block" onClick={() => openAddFood(date)}>
          <Icon name="plus" size={20} /> Ajouter un aliment
        </button>
      </div>
    </div>
  )
}
