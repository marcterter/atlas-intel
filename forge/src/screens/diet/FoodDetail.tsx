import { useMemo, useState } from 'react'
import { Sheet, Stepper, NumInput, confirmDialog } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { CustomFoodForm } from './CustomFood.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { MEALS, MEAL_LABEL, scaleNutrients } from '../../lib/nutrition.ts'
import { fmt } from '../../lib/format.ts'
import type { Food, ISODate, MealId, Portion } from '../../lib/types.ts'

export function FoodDetail({
  food,
  date,
  meal: initialMeal,
  entryId,
  initialGrams,
  onPick,
}: {
  food: Food
  date: ISODate
  meal: MealId
  entryId?: string
  initialGrams?: number
  /** Mode "choix d'ingrédient" (recettes) : renvoie la quantité au lieu d'ajouter au journal. */
  onPick?: (food: Food, grams: number) => void
}) {
  const addEntry = useStore((s) => s.addEntry)
  const updateEntry = useStore((s) => s.updateEntry)
  const deleteEntry = useStore((s) => s.deleteEntry)
  const toggleFavorite = useStore((s) => s.toggleFavorite)
  const isFav = useStore((s) => s.favorites.includes(food.id))
  const entry = useStore((s) => (entryId ? s.entries.find((e) => e.id === entryId) : undefined))

  const portions: Portion[] = useMemo(() => [...(food.portions ?? []), { label: `100 ${food.unit}`, grams: 100 }], [food])
  const startPortion = entry?.portionLabel ? portions.find((p) => entry.portionLabel?.endsWith(p.label)) : !entry && !initialGrams && food.portions?.length ? food.portions[0] : undefined
  const [portion, setPortion] = useState<Portion | null>(startPortion ?? null)
  const [count, setCount] = useState(() => (startPortion && entry ? Math.round((entry.grams / startPortion.grams) * 2) / 2 || 1 : 1))
  const [grams, setGrams] = useState<number | null>(entry?.grams ?? initialGrams ?? (startPortion ? startPortion.grams : 100))
  const [meal, setMeal] = useState<MealId>(entry?.meal ?? initialMeal)

  const qty = portion ? portion.grams * count : (grams ?? 0)
  const n = scaleNutrients(food.per100, qty)
  const valid = qty > 0

  const portionLabel = portion && portion.label !== `100 ${food.unit}` ? `${count === 1 ? '' : `${String(count).replace('.', ',')} × `}${portion.label}` : undefined

  const save = () => {
    if (!valid) return
    if (onPick) {
      onPick(food, qty)
      ui.pop()
      return
    }
    const payload = { date: entry?.date ?? date, meal, foodId: food.id, name: food.name, brand: food.brand, grams: qty, portionLabel, n }
    if (entry) {
      updateEntry(entry.id, payload)
      ui.pop()
      ui.toast('Modifié', 'ok')
    } else {
      addEntry(payload, food)
      ui.pop()
      ui.toast(`Ajouté · ${MEAL_LABEL[meal]}`, 'ok')
    }
  }

  return (
    <Sheet
      title={entry ? 'Modifier' : onPick ? 'Ingrédient' : 'Ajouter'}
      right={
        <>
          {food.source === 'perso' && (
            <button className="icon-btn" onClick={() => ui.push(<CustomFoodForm food={food} />)} aria-label="Modifier l'aliment">
              <Icon name="pencil" size={20} />
            </button>
          )}
          <button className="icon-btn" onClick={() => toggleFavorite(food.id, food)} aria-label="Favori" style={{ color: isFav ? 'var(--warn)' : undefined }}>
            <Icon name="star" fill={isFav} size={22} />
          </button>
        </>
      }
      footer={
        <>
          {entry && (
            <button
              className="btn danger"
              onClick={async () => {
                if (await confirmDialog({ title: 'Retirer cet aliment ?', confirm: 'Retirer', danger: true })) {
                  deleteEntry(entry.id)
                  ui.pop()
                }
              }}
              aria-label="Supprimer"
            >
              <Icon name="trash" size={20} />
            </button>
          )}
          <button className="btn grow" disabled={!valid} onClick={save}>
            {entry ? 'Enregistrer' : onPick ? 'Ajouter à la recette' : `Ajouter · ${fmt(n.kcal)} kcal`}
          </button>
        </>
      }
    >
      <div className="stack">
        <div className="row">
          {food.image && <img className="food-thumb" src={food.image} alt="" style={{ width: 56, height: 56 }} />}
          <div className="grow">
            <div className="bold" style={{ fontSize: 18 }}>
              {food.name}
            </div>
            <div className="faint small">
              {[food.brand, food.source === 'off' ? 'Open Food Facts' : food.source === 'recette' ? 'Ma recette' : food.source === 'perso' ? 'Mon aliment' : 'Aliment générique'].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: 'space-around', textAlign: 'center' }}>
            <div>
              <div className="big-number">{fmt(n.kcal)}</div>
              <div className="tiny faint bold">KCAL</div>
            </div>
            <div>
              <div className="big-number" style={{ fontSize: 22, color: 'var(--protein)' }}>
                {fmt(n.protein, 1)}
              </div>
              <div className="tiny faint bold">PROT.</div>
            </div>
            <div>
              <div className="big-number" style={{ fontSize: 22, color: 'var(--carbs)' }}>
                {fmt(n.carbs, 1)}
              </div>
              <div className="tiny faint bold">GLUC.</div>
            </div>
            <div>
              <div className="big-number" style={{ fontSize: 22, color: 'var(--fat)' }}>
                {fmt(n.fat, 1)}
              </div>
              <div className="tiny faint bold">LIP.</div>
            </div>
          </div>
        </div>

        <div className="section-label" style={{ marginTop: 6 }}>
          Quantité
        </div>
        <div className="chips">
          {portions.map((p) => (
            <button
              key={p.label}
              className={`chip ${portion?.label === p.label ? 'active' : ''}`}
              onClick={() => {
                setPortion(p)
                setCount(1)
              }}
            >
              {p.label}
              {p.label.startsWith('100 ') ? '' : ` · ${fmt(p.grams)} ${food.unit}`}
            </button>
          ))}
          <button className={`chip ${!portion ? 'active' : ''}`} onClick={() => { setPortion(null); setGrams(qty || 100) }}>
            En {food.unit}
          </button>
        </div>
        {portion ? (
          <div className="row-between card tight">
            <div>
              <div className="bold">{portion.label}</div>
              <div className="faint small num">
                = {fmt(qty)} {food.unit}
              </div>
            </div>
            <Stepper value={count} min={0.5} max={20} step={0.5} onChange={setCount} format={(v) => String(v).replace('.', ',')} />
          </div>
        ) : (
          <NumInput value={grams} onChange={setGrams} suffix={food.unit} style={{ fontSize: 20, fontWeight: 700, height: 54 }} autoFocus={!entry} />
        )}

        {!onPick && (
          <>
            <div className="section-label" style={{ marginTop: 6 }}>
              Repas
            </div>
            <div className="chips">
              {MEALS.map((m) => (
                <button key={m.id} className={`chip ${meal === m.id ? 'active' : ''}`} onClick={() => setMeal(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="callout small">
          Pour 100 {food.unit} : <b>{fmt(food.per100.kcal)} kcal</b> · P {fmt(food.per100.protein, 1)} g · G {fmt(food.per100.carbs, 1)} g · L {fmt(food.per100.fat, 1)} g
          {food.per100.fiber ? ` · fibres ${fmt(food.per100.fiber, 1)} g` : ''}
        </div>
      </div>
    </Sheet>
  )
}
