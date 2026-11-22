import { useState } from 'react'
import { Sheet, Field, NumInput, Segmented, confirmDialog } from '../../components/ui.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { uid } from '../../lib/id.ts'
import { fmt } from '../../lib/format.ts'
import { MEALS, MEAL_LABEL } from '../../lib/nutrition.ts'
import type { Food, ISODate, MealId } from '../../lib/types.ts'

/** Création / modification d'un aliment perso (ex : produit introuvable au scan). */
export function CustomFoodForm({ food, barcode, onSaved }: { food?: Food; barcode?: string; onSaved?: (f: Food) => void }) {
  const saveFood = useStore((s) => s.saveFood)
  const deleteFood = useStore((s) => s.deleteFood)
  const [name, setName] = useState(food?.name ?? '')
  const [brand, setBrand] = useState(food?.brand ?? '')
  const [unit, setUnit] = useState<'g' | 'ml'>(food?.unit ?? 'g')
  const [kcal, setKcal] = useState<number | null>(food?.per100.kcal ?? null)
  const [protein, setProtein] = useState<number | null>(food?.per100.protein ?? null)
  const [carbs, setCarbs] = useState<number | null>(food?.per100.carbs ?? null)
  const [fat, setFat] = useState<number | null>(food?.per100.fat ?? null)
  const [fiber, setFiber] = useState<number | null>(food?.per100.fiber ?? null)
  const [portionLabel, setPortionLabel] = useState(food?.portions?.[0]?.label ?? '')
  const [portionGrams, setPortionGrams] = useState<number | null>(food?.portions?.[0]?.grams ?? null)

  const computedKcal = kcal ?? Math.round((protein ?? 0) * 4 + (carbs ?? 0) * 4 + (fat ?? 0) * 9)
  const valid = name.trim() !== '' && computedKcal >= 0 && (kcal != null || protein != null || carbs != null || fat != null)

  const save = () => {
    const f: Food = {
      id: food?.id ?? `p:${uid()}`,
      name: name.trim(),
      brand: brand.trim() || undefined,
      source: 'perso',
      unit,
      per100: { kcal: computedKcal, protein: protein ?? 0, carbs: carbs ?? 0, fat: fat ?? 0, fiber: fiber ?? 0 },
      portions: portionGrams && portionGrams > 0 ? [{ label: portionLabel.trim() || '1 portion', grams: portionGrams }] : [],
      barcode: food?.barcode ?? barcode,
      category: 'Mes aliments',
    }
    saveFood(f)
    ui.pop()
    ui.toast('Aliment enregistré', 'ok')
    onSaved?.(f)
  }

  return (
    <Sheet
      title={food ? "Modifier l'aliment" : 'Nouvel aliment'}
      closeIcon="x"
      footer={
        <>
          {food && (
            <button
              className="btn danger"
              onClick={async () => {
                if (await confirmDialog({ title: 'Supprimer cet aliment ?', message: 'Ton journal garde les valeurs déjà saisies.', confirm: 'Supprimer', danger: true })) {
                  deleteFood(food.id)
                  ui.pop()
                  ui.pop()
                }
              }}
            >
              Supprimer
            </button>
          )}
          <button className="btn grow" disabled={!valid} onClick={save}>
            Enregistrer
          </button>
        </>
      }
    >
      <div className="stack">
        {barcode && <div className="callout">Code-barres {barcode} introuvable dans Open Food Facts. Recopie l'étiquette : il sera reconnu au prochain scan.</div>}
        <Field label="Nom">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex : Galette protéinée maison" autoFocus={!food} />
        </Field>
        <Field label="Marque (facultatif)">
          <input className="input" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </Field>
        <Field label="Valeurs pour 100">
          <Segmented value={unit} onChange={setUnit} options={[{ value: 'g', label: '100 g' }, { value: 'ml', label: '100 ml' }]} />
        </Field>
        <div className="grid-2">
          <Field label="Énergie (kcal)">
            <NumInput value={kcal} onChange={setKcal} placeholder={String(computedKcal || '')} />
          </Field>
          <Field label="Protéines (g)">
            <NumInput value={protein} onChange={setProtein} />
          </Field>
          <Field label="Glucides (g)">
            <NumInput value={carbs} onChange={setCarbs} />
          </Field>
          <Field label="Lipides (g)">
            <NumInput value={fat} onChange={setFat} />
          </Field>
          <Field label="Fibres (g)">
            <NumInput value={fiber} onChange={setFiber} />
          </Field>
        </div>
        <div className="section-label">Portion habituelle (facultatif)</div>
        <div className="grid-2">
          <Field label="Nom">
            <input className="input" value={portionLabel} onChange={(e) => setPortionLabel(e.target.value)} placeholder="1 barre" />
          </Field>
          <Field label={`Poids (${unit})`}>
            <NumInput value={portionGrams} onChange={setPortionGrams} />
          </Field>
        </div>
      </div>
    </Sheet>
  )
}

/** Ajout rapide : juste des kcal / macros (restaurant, repas estimé). */
export function QuickAdd({ date, meal: initialMeal }: { date: ISODate; meal: MealId }) {
  const addEntry = useStore((s) => s.addEntry)
  const [name, setName] = useState('')
  const [meal, setMeal] = useState<MealId>(initialMeal)
  const [kcal, setKcal] = useState<number | null>(null)
  const [protein, setProtein] = useState<number | null>(null)
  const [carbs, setCarbs] = useState<number | null>(null)
  const [fat, setFat] = useState<number | null>(null)
  const computed = kcal ?? Math.round((protein ?? 0) * 4 + (carbs ?? 0) * 4 + (fat ?? 0) * 9)
  const valid = computed > 0
  return (
    <Sheet
      title="Ajout rapide"
      closeIcon="x"
      footer={
        <button
          className="btn block"
          disabled={!valid}
          onClick={() => {
            addEntry({
              date,
              meal,
              foodId: null,
              name: name.trim() || 'Ajout rapide',
              grams: 0,
              n: { kcal: computed, protein: protein ?? 0, carbs: carbs ?? 0, fat: fat ?? 0, fiber: 0 },
            })
            ui.pop()
            ui.toast(`Ajouté · ${MEAL_LABEL[meal]}`, 'ok')
          }}
        >
          Ajouter · {fmt(computed)} kcal
        </button>
      }
    >
      <div className="stack">
        <Field label="Libellé">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex : Burger + frites au resto" autoFocus />
        </Field>
        <div className="grid-2">
          <Field label="Kcal">
            <NumInput value={kcal} onChange={setKcal} placeholder={computed ? String(computed) : ''} />
          </Field>
          <Field label="Protéines (g)">
            <NumInput value={protein} onChange={setProtein} />
          </Field>
          <Field label="Glucides (g)">
            <NumInput value={carbs} onChange={setCarbs} />
          </Field>
          <Field label="Lipides (g)">
            <NumInput value={fat} onChange={setFat} />
          </Field>
        </div>
        <div className="chips">
          {MEALS.map((m) => (
            <button key={m.id} className={`chip ${meal === m.id ? 'active' : ''}`} onClick={() => setMeal(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="faint small">Sans kcal, elles sont calculées depuis les macros (4/4/9).</div>
      </div>
    </Sheet>
  )
}
