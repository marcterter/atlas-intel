import { useState } from 'react'
import { Sheet, Field, NumInput, Stepper, confirmDialog } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { AddFood } from './AddFood.tsx'
import { MacroDots } from './components.tsx'
import { useStore } from '../../store/store.ts'
import { ui } from '../../store/ui.ts'
import { uid } from '../../lib/id.ts'
import { recipeTotals, scaleNutrients } from '../../lib/nutrition.ts'
import { fmt } from '../../lib/format.ts'
import { todayISO } from '../../lib/date.ts'
import type { Recipe } from '../../lib/types.ts'

export function RecipeEditor({ recipeId }: { recipeId?: string }) {
  const existing = useStore((s) => s.recipes.find((r) => r.id === recipeId))
  const saveRecipe = useStore((s) => s.saveRecipe)
  const deleteRecipe = useStore((s) => s.deleteRecipe)
  const [draft, setDraft] = useState<Recipe>(
    () => existing ?? { id: uid(), name: '', portions: 1, ingredients: [], createdAt: Date.now(), updatedAt: Date.now() },
  )
  const { n, grams } = recipeTotals(draft)
  const per = draft.portions > 0 ? scaleNutrients(n, 100 / draft.portions) : n
  const valid = draft.name.trim() !== '' && draft.ingredients.length > 0

  return (
    <Sheet
      title={existing ? 'Modifier la recette' : 'Nouvelle recette'}
      closeIcon="x"
      footer={
        <>
          {existing && (
            <button
              className="btn danger"
              onClick={async () => {
                if (await confirmDialog({ title: 'Supprimer la recette ?', confirm: 'Supprimer', danger: true })) {
                  deleteRecipe(existing.id)
                  ui.pop()
                }
              }}
              aria-label="Supprimer"
            >
              <Icon name="trash" size={20} />
            </button>
          )}
          <button
            className="btn grow"
            disabled={!valid}
            onClick={() => {
              saveRecipe({ ...draft, name: draft.name.trim() })
              ui.pop()
              ui.toast('Recette enregistrée', 'ok')
            }}
          >
            Enregistrer
          </button>
        </>
      }
    >
      <div className="stack">
        <Field label="Nom">
          <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="ex : Pancakes protéinés" />
        </Field>
        <div className="row-between">
          <div>
            <div className="bold">Portions</div>
            <div className="faint small num">{draft.portions > 0 ? `${fmt(grams / draft.portions)} g par portion` : ''}</div>
          </div>
          <Stepper value={draft.portions} min={1} max={20} onChange={(v) => setDraft({ ...draft, portions: v })} />
        </div>

        <div className="card">
          <div className="tiny faint bold" style={{ letterSpacing: '.08em' }}>
            PAR PORTION
          </div>
          <div className="row-between" style={{ marginTop: 4 }}>
            <div className="big-number">
              {fmt(per.kcal)} <span className="small faint">kcal</span>
            </div>
            <MacroDots n={per} />
          </div>
          <div className="faint small" style={{ marginTop: 6 }}>
            Recette entière : {fmt(n.kcal)} kcal · {fmt(grams)} g
          </div>
        </div>

        <div className="section-label">Ingrédients</div>
        <div className="card flush list">
          {draft.ingredients.length === 0 && <div className="empty small">Ajoute les ingrédients avec leur quantité.</div>}
          {draft.ingredients.map((ing, i) => (
            <div className="list-item" key={`${ing.foodId}-${i}`}>
              <div className="grow" style={{ minWidth: 0 }}>
                <div className="title ellipsis">{ing.name}</div>
                <div className="meta">{fmt(scaleNutrients(ing.per100, ing.grams).kcal)} kcal</div>
              </div>
              <div style={{ width: 96 }}>
                <NumInput
                  value={ing.grams}
                  suffix="g"
                  style={{ height: 40 }}
                  onChange={(v) => setDraft((d) => ({ ...d, ingredients: d.ingredients.map((x, k) => (k === i ? { ...x, grams: v ?? 0 } : x)) }))}
                />
              </div>
              <button className="icon-btn" onClick={() => setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((_, k) => k !== i) }))} aria-label="Retirer">
                <Icon name="x" size={18} />
              </button>
            </div>
          ))}
        </div>
        <button
          className="btn soft block"
          onClick={() =>
            ui.push(
              <AddFood
                date={todayISO()}
                meal="dejeuner"
                title="Ajouter un ingrédient"
                onPick={(food, g) => {
                  setDraft((d) => ({ ...d, ingredients: [...d.ingredients, { foodId: food.id, name: food.name, grams: g, per100: food.per100 }] }))
                  ui.pop()
                }}
              />,
            )
          }
        >
          <Icon name="plus" size={20} /> Ajouter un ingrédient
        </button>
        <div className="grid-2">
          <Field label="Temps (min)">
            <NumInput value={draft.minutes ?? null} decimal={false} onChange={(v) => setDraft({ ...draft, minutes: v ?? undefined })} />
          </Field>
        </div>
        <Field label="Préparation (facultatif)">
          <textarea className="input" value={draft.note ?? ''} onChange={(e) => setDraft({ ...draft, note: e.target.value })} placeholder="Étapes, astuces…" />
        </Field>
      </div>
    </Sheet>
  )
}
