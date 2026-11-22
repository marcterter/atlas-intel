// Client Open Food Facts (base collaborative, gratuite) : recherche texte et code-barres.
import type { Food, Nutrients, Portion } from './types.ts'

const FIELDS = 'code,product_name,product_name_fr,generic_name_fr,brands,nutriments,serving_quantity,serving_size,quantity,image_front_small_url'

type OffNutriments = Record<string, number | string | undefined>
export interface OffProduct {
  code?: string
  product_name?: string
  product_name_fr?: string
  generic_name_fr?: string
  brands?: string
  nutriments?: OffNutriments
  serving_quantity?: number | string
  serving_size?: string
  quantity?: string
  image_front_small_url?: string
}

const num = (v: unknown): number | undefined => {
  if (v == null || v === '') return undefined
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : undefined
}

/** Convertit un produit OFF en aliment Forge (null si pas de valeurs nutritionnelles exploitables). */
export function offToFood(p: OffProduct): Food | null {
  const n = p.nutriments ?? {}
  let kcal = num(n['energy-kcal_100g'])
  if (kcal == null) {
    const kj = num(n['energy-kj_100g']) ?? num(n['energy_100g'])
    if (kj != null) kcal = kj / 4.184
  }
  const protein = num(n['proteins_100g'])
  const carbs = num(n['carbohydrates_100g'])
  const fat = num(n['fat_100g'])
  if (kcal == null || (protein == null && carbs == null && fat == null)) return null
  const name = (p.product_name_fr || p.product_name || p.generic_name_fr || '').trim()
  if (!name || !p.code) return null
  const per100: Nutrients = {
    kcal: Math.round(kcal * 10) / 10,
    protein: protein ?? 0,
    carbs: carbs ?? 0,
    fat: fat ?? 0,
    fiber: num(n['fiber_100g']) ?? 0,
    sugar: num(n['sugars_100g']),
    salt: num(n['salt_100g']),
  }
  const portions: Portion[] = []
  const sq = num(p.serving_quantity)
  if (sq && sq > 0 && sq < 2000) portions.push({ label: p.serving_size ? `1 portion (${p.serving_size})` : '1 portion', grams: sq })
  const qty = parseQuantity(p.quantity)
  if (qty && qty > 0 && qty <= 1500 && qty !== sq) portions.push({ label: `Le paquet (${p.quantity})`, grams: qty })
  const unit = /\b(ml|cl|l)\b/i.test(`${p.quantity ?? ''} ${p.serving_size ?? ''}`) ? 'ml' : 'g'
  return {
    id: `off:${p.code}`,
    name,
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    source: 'off',
    per100,
    unit,
    portions,
    barcode: p.code,
    image: p.image_front_small_url,
  }
}

/** "500 g" -> 500, "1,5 kg" -> 1500, "33 cl" -> 330 */
export function parseQuantity(q?: string): number | undefined {
  if (!q) return undefined
  const m = q.replace(',', '.').match(/([\d.]+)\s*(kg|g|mg|l|cl|ml)\b/i)
  if (!m) return undefined
  const v = Number(m[1])
  const u = m[2].toLowerCase()
  const factor: Record<string, number> = { kg: 1000, g: 1, mg: 0.001, l: 1000, cl: 10, ml: 1 }
  return Number.isFinite(v) ? Math.round(v * factor[u]) : undefined
}

async function getJSON(url: string, timeoutMs = 9000): Promise<unknown> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(t)
  }
}

type OffProductResponse = { status?: number; product?: OffProduct }

export type BarcodeResult =
  | { status: 'found'; food: Food }
  /** Produit connu d'Open Food Facts mais sans valeurs nutritionnelles exploitables. */
  | { status: 'incomplete'; code: string; name?: string; brand?: string }
  | { status: 'notfound'; code: string }

/** Cherche un code-barres dans Open Food Facts. Lève une erreur seulement en cas de problème réseau / serveur. */
export async function lookupBarcode(code: string): Promise<BarcodeResult> {
  const clean = code.replace(/\D/g, '')
  if (!clean) return { status: 'notfound', code }
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 9000)
  let res: Response
  try {
    res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=${FIELDS}`, { signal: ctrl.signal })
  } finally {
    clearTimeout(t)
  }
  let data: OffProductResponse | null
  try {
    data = (await res.json()) as OffProductResponse
  } catch {
    data = null
  }
  // L'API répond 404 (status 0) quand le produit n'existe pas : ce n'est pas une panne.
  if (res.status === 404 || data?.status === 0) return { status: 'notfound', code: clean }
  if (!res.ok || !data) throw new Error(`HTTP ${res.status}`)
  if (!data.product) return { status: 'notfound', code: clean }
  const food = offToFood({ ...data.product, code: data.product.code ?? clean })
  if (food) return { status: 'found', food }
  const name = (data.product.product_name_fr || data.product.product_name || data.product.generic_name_fr || '').trim()
  return { status: 'incomplete', code: clean, name: name || undefined, brand: data.product.brands?.split(',')[0]?.trim() || undefined }
}

export async function searchOff(query: string): Promise<Food[]> {
  const q = query.trim()
  if (q.length < 2) return []
  // 1) moteur de recherche récent (rapide)
  try {
    const data = (await getJSON(
      `https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&langs=fr&page_size=30&fields=${FIELDS}`,
      7000,
    )) as { hits?: OffProduct[] }
    const foods = (data.hits ?? []).map(offToFood).filter((f): f is Food => !!f)
    if (foods.length) return dedupe(foods)
  } catch {
    /* on tente l'ancienne API */
  }
  // 2) API historique, limitée aux produits vendus en France
  const data = (await getJSON(
    `https://fr.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=30&fields=${FIELDS}`,
    12000,
  )) as { products?: OffProduct[] }
  return dedupe((data.products ?? []).map(offToFood).filter((f): f is Food => !!f))
}

function dedupe(list: Food[]): Food[] {
  const seen = new Set<string>()
  return list.filter((f) => (seen.has(f.id) ? false : (seen.add(f.id), true)))
}
