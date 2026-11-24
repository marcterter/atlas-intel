import { useEffect, useMemo, useRef, useState } from 'react'
import { Sheet, Spinner } from '../../components/ui.tsx'
import { Icon } from '../../components/Icon.tsx'
import { FoodDetail } from './FoodDetail.tsx'
import { Scanner } from './Scanner.tsx'
import { CustomFoodForm, QuickAdd } from './CustomFood.tsx'
import { RecipeEditor } from './Recipes.tsx'
import { MacroDots } from './components.tsx'
import { BASE_FOODS, FOOD_CATEGORIES, searchFoods } from '../../data/foods.ts'
import { useStore } from '../../store/store.ts'
import { getFood, usePersoFoods } from '../../store/selectors.ts'
import { ui } from '../../store/ui.ts'
import { MEALS, MEAL_LABEL, scaleNutrients } from '../../lib/nutrition.ts'
import { searchOff } from '../../lib/off.ts'
import { fmt } from '../../lib/format.ts'
import { haptic } from '../../lib/device.ts'
import type { Food, ISODate, MealId } from '../../lib/types.ts'

type Tab = 'recents' | 'favoris' | 'perso' | 'parcourir'

/** Quantité ajoutée par le « + » : la dernière notée pour cet aliment, sinon sa première portion. */
interface Qty {
  grams: number
  label: string
  portionLabel?: string
}

interface Quick {
  qty: (f: Food) => Qty
  add: (f: Food) => void
}

export function AddFood({ date, meal: initialMeal, onPick, title }: { date: ISODate; meal: MealId; onPick?: (food: Food, grams: number) => void; title?: string }) {
  const [meal, setMeal] = useState<MealId>(initialMeal)
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<Tab>('recents')
  const [category, setCategory] = useState<string | null>(null)
  const [remote, setRemote] = useState<Food[]>([])
  const [remoteState, setRemoteState] = useState<'idle' | 'loading' | 'error' | 'done'>('idle')
  const foods = useStore((s) => s.foods)
  const recipes = useStore((s) => s.recipes)
  const recents = useStore((s) => s.recents)
  const favorites = useStore((s) => s.favorites)
  const perso = usePersoFoods()
  const entries = useStore((s) => s.entries)
  const addEntry = useStore((s) => s.addEntry)
  const deleteEntry = useStore((s) => s.deleteEntry)
  const hapticsOn = useStore((s) => s.settings.haptics)
  const reqId = useRef(0)

  // Dernière quantité notée pour chaque aliment.
  const lastQty = useMemo(() => {
    const m = new Map<string, { grams: number; label?: string; at: number }>()
    for (const e of entries) {
      if (!e.foodId || !(e.grams > 0)) continue
      const o = m.get(e.foodId)
      if (!o || e.createdAt > o.at) m.set(e.foodId, { grams: e.grams, label: e.portionLabel, at: e.createdAt })
    }
    return m
  }, [entries])

  const quick: Quick | undefined = onPick
    ? undefined
    : {
        qty: (f) => {
          const last = lastQty.get(f.id)
          if (last) return { grams: last.grams, label: last.label ?? `${fmt(last.grams)} ${f.unit}`, portionLabel: last.label }
          const p = f.portions?.[0]
          return p ? { grams: p.grams, label: p.label, portionLabel: p.label } : { grams: 100, label: `100 ${f.unit}` }
        },
        // Ajout en un geste, sans ouvrir la fiche : la fenêtre reste ouverte pour enchaîner.
        add: (f) => {
          const q = (quick as Quick).qty(f)
          const id = addEntry({ date, meal, foodId: f.id, name: f.name, brand: f.brand, grams: q.grams, portionLabel: q.portionLabel, n: scaleNutrients(f.per100, q.grams) }, f)
          if (hapticsOn) haptic(false)
          ui.undo(`${f.name} · ${q.label} → ${MEAL_LABEL[meal]}`, () => deleteEntry(id))
        },
      }

  const all = useMemo(() => [...perso, ...Object.values(foods).filter((f) => f.source === 'off'), ...BASE_FOODS], [perso, foods])
  const local = useMemo(() => (q.trim() ? searchFoods(q, all, 30) : []), [q, all])

  useEffect(() => {
    const query = q.trim()
    if (query.length < 3) {
      setRemote([])
      setRemoteState('idle')
      return
    }
    const id = ++reqId.current
    setRemoteState('loading')
    const t = setTimeout(async () => {
      try {
        const r = await searchOff(query)
        if (id !== reqId.current) return
        setRemote(r)
        setRemoteState('done')
      } catch {
        if (id !== reqId.current) return
        setRemoteState('error')
      }
    }, 550)
    return () => clearTimeout(t)
  }, [q])

  const store = { foods, recipes }
  const list = (ids: string[]) => ids.map((id) => getFood(store, id)).filter((f): f is Food => !!f)

  const open = (food: Food) => ui.push(<FoodDetail food={food} date={date} meal={meal} onPick={onPick} />)

  return (
    <Sheet title={title ?? `Ajouter · ${MEAL_LABEL[meal]}`} closeIcon="x">
      <div className="stack">
        {!onPick && (
          <div className="chips">
            {MEALS.map((m) => (
              <button key={m.id} className={`chip ${meal === m.id ? 'active' : ''}`} onClick={() => setMeal(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
        )}
        <div className="row">
          <div className="search grow">
            <Icon name="search" size={18} />
            <input className="input" placeholder="Rechercher un aliment, une marque…" value={q} onChange={(e) => setQ(e.target.value)} enterKeyHint="search" />
          </div>
          <button className="icon-btn accent" style={{ width: 48, height: 48 }} onClick={() => ui.push(<Scanner date={date} meal={meal} onPick={onPick} />)} aria-label="Scanner un code-barres">
            <Icon name="barcode" />
          </button>
        </div>

        {!onPick && !q && (
          <>
            <div className="grid-2">
              <button className="btn soft small" onClick={() => ui.push(<QuickAdd date={date} meal={meal} />)}>
                <Icon name="bolt" size={18} /> Ajout rapide
              </button>
              <button className="btn soft small" onClick={() => ui.push(<CustomFoodForm onSaved={open} />)}>
                <Icon name="plus" size={18} /> Créer un aliment
              </button>
            </div>
            <button className="btn soft small block" onClick={() => ui.push(<RecipeEditor />)}>
              <Icon name="book" size={18} /> Créer une recette à partir d’aliments
            </button>
          </>
        )}

        {q.trim() ? (
          <>
            {local.length > 0 && <FoodList foods={local} onOpen={open} />}
            <div className="section-label" style={{ marginTop: 8 }}>
              <span>Produits du commerce</span>
              {remoteState === 'loading' && <Spinner />}
            </div>
            {remoteState === 'error' && <div className="callout small">Recherche en ligne indisponible (hors connexion ?). Les aliments ci-dessus restent disponibles.</div>}
            {remoteState === 'done' && remote.length === 0 && <div className="faint small">Aucun produit trouvé. Essaie le scan du code-barres.</div>}
            {remoteState === 'idle' && q.trim().length < 3 && <div className="faint small">Tape au moins 3 lettres pour chercher dans Open Food Facts.</div>}
            {remote.length > 0 && <FoodList foods={remote} onOpen={open} />}
            {local.length === 0 && remoteState !== 'loading' && (
              <button className="btn soft block" onClick={() => ui.push(<CustomFoodForm onSaved={open} />)}>
                Créer « {q.trim()} »
              </button>
            )}
          </>
        ) : (
          <>
            <div className="chips">
              {(
                [
                  ['recents', 'Récents'],
                  ['favoris', 'Favoris'],
                  ['perso', 'Mes recettes & aliments'],
                  ['parcourir', 'Parcourir'],
                ] as [Tab, string][]
              ).map(([k, label]) => (
                <button key={k} className={`chip ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
                  {label}
                </button>
              ))}
            </div>
            {tab === 'recents' &&
              (recents.length ? (
                <>
                  <FoodList foods={list(recents).slice(0, 40)} onOpen={open} quick={quick} />
                  {quick && <div className="faint tiny">« + » ajoute la même quantité que la dernière fois, sans ouvrir la fiche.</div>}
                </>
              ) : (
                <div className="faint small">Tes aliments récents apparaîtront ici.</div>
              ))}
            {tab === 'favoris' &&
              (favorites.length ? <FoodList foods={list(favorites)} onOpen={open} quick={quick} /> : <div className="faint small">Touche l'étoile d'un aliment pour l'ajouter à tes favoris.</div>)}
            {tab === 'perso' && (
              <>
                <div className="grid-2">
                  <button className="btn soft small" onClick={() => ui.push(<RecipeEditor />)}>
                    <Icon name="book" size={18} /> Nouvelle recette
                  </button>
                  <button className="btn soft small" onClick={() => ui.push(<CustomFoodForm onSaved={open} />)}>
                    <Icon name="plus" size={18} /> Nouvel aliment
                  </button>
                </div>
                {perso.length ? <FoodList foods={perso} onOpen={open} quick={quick} /> : <div className="faint small">Tes recettes et aliments créés apparaîtront ici.</div>}
              </>
            )}
            {tab === 'parcourir' && (
              <>
                <div className="chips">
                  {FOOD_CATEGORIES.map((c) => (
                    <button key={c} className={`chip ${category === c ? 'active' : ''}`} onClick={() => setCategory(category === c ? null : c)}>
                      {c}
                    </button>
                  ))}
                </div>
                <FoodList foods={BASE_FOODS.filter((f) => !category || f.category === category)} onOpen={open} />
              </>
            )}
          </>
        )}
      </div>
    </Sheet>
  )
}

function FoodList({ foods, onOpen, quick }: { foods: Food[]; onOpen: (f: Food) => void; quick?: Quick }) {
  return (
    <div className="card flush list">
      {foods.map((f) => {
        const portion = f.portions?.[0]
        const q = quick?.qty(f)
        const grams = q ? q.grams : portion?.grams
        const n = grams != null ? scaleNutrients(f.per100, grams) : f.per100
        const amount = q ? q.label : portion ? portion.label : `100 ${f.unit}`
        const body = (
          <>
            {f.image ? <img className="food-thumb" src={f.image} alt="" loading="lazy" /> : null}
            <div className="grow" style={{ minWidth: 0 }}>
              <div className="title ellipsis">{f.name}</div>
              <div className="meta ellipsis">{[f.brand, f.source === 'recette' ? 'Recette' : f.source === 'perso' ? 'Perso' : null, amount].filter(Boolean).join(' · ')}</div>
              <MacroDots n={n} />
            </div>
            <div className="bold num" style={{ whiteSpace: 'nowrap' }}>
              {fmt(n.kcal)} <span className="faint tiny">kcal</span>
            </div>
          </>
        )
        if (!quick)
          return (
            <button key={f.id} className="list-item" onClick={() => onOpen(f)}>
              {body}
            </button>
          )
        return (
          <div key={f.id} className="list-item quick-row">
            <button className="quick-main" onClick={() => onOpen(f)}>
              {body}
            </button>
            <button className="quick-add" onClick={() => quick.add(f)} aria-label={`Ajouter ${f.name} · ${amount}`}>
              <span>
                <Icon name="plus" size={18} stroke={2.6} />
              </span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
