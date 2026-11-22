// Lecture des réponses Open Food Facts (scan code-barres) avec des réponses simulées au format réel de l'API.
import { test, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { lookupBarcode, offToFood, parseQuantity, type OffProduct } from '../src/lib/off.ts'

const NUTELLA: OffProduct = {
  code: '3017620422003',
  brands: 'Nutella,Ferrero',
  product_name: 'Nutella',
  product_name_fr: 'Nutella',
  quantity: '400 g',
  serving_quantity: '15',
  serving_size: '15 g',
  image_front_small_url: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_fr.200.jpg',
  nutriments: {
    'energy-kcal_100g': 539,
    'energy-kj_100g': 2252,
    energy_100g: 2252,
    proteins_100g: 6.3,
    carbohydrates_100g: 57.5,
    sugars_100g: 56.3,
    fat_100g: 30.9,
    fiber_100g: 0,
    salt_100g: 0.107,
  },
}

const realFetch = globalThis.fetch
afterEach(() => {
  globalThis.fetch = realFetch
})
const mockFetch = (status: number, body: unknown) => {
  globalThis.fetch = (async () => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })) as typeof fetch
}

test('produit scanné : nom, marque, macros pour 100 g, portion et paquet', () => {
  const f = offToFood(NUTELLA)
  assert.ok(f)
  assert.equal(f.id, 'off:3017620422003')
  assert.equal(f.name, 'Nutella')
  assert.equal(f.brand, 'Nutella')
  assert.deepEqual([f.per100.kcal, f.per100.protein, f.per100.carbs, f.per100.fat], [539, 6.3, 57.5, 30.9])
  assert.deepEqual(f.portions, [
    { label: '1 portion (15 g)', grams: 15 },
    { label: 'Le paquet (400 g)', grams: 400 },
  ])
  assert.equal(f.unit, 'g')
})

test('valeurs en kJ seulement, nombres écrits avec une virgule, boisson en ml', () => {
  const f = offToFood({
    code: '5449000000996',
    product_name: 'Boisson test',
    quantity: '33 cl',
    nutriments: { energy_100g: 1500, proteins_100g: '10,5', carbohydrates_100g: '60', fat_100g: 5 },
  })
  assert.ok(f)
  assert.equal(Math.round(f.per100.kcal), 359)
  assert.equal(f.per100.protein, 10.5)
  assert.equal(f.unit, 'ml')
  assert.equal(parseQuantity('1,5 kg'), 1500)
  assert.equal(parseQuantity('33 cl'), 330)
  assert.equal(offToFood({ code: '1', product_name: 'Sans valeurs', nutriments: {} }), null)
})

test('scan : produit trouvé', async () => {
  mockFetch(200, { code: NUTELLA.code, status: 1, status_verbose: 'product found', product: NUTELLA })
  const r = await lookupBarcode('3017620422003')
  assert.equal(r.status, 'found')
  if (r.status === 'found') assert.equal(r.food.per100.kcal, 539)
})

test('scan : produit inconnu (404) → proposer de le créer, pas d’erreur réseau', async () => {
  mockFetch(404, { code: '3760000000000', status: 0, status_verbose: 'product not found' })
  const r = await lookupBarcode('3760000000000')
  assert.deepEqual(r, { status: 'notfound', code: '3760000000000' })
})

test('scan : produit connu sans valeurs nutritionnelles → formulaire pré-rempli', async () => {
  mockFetch(200, { status: 1, product: { code: '3250390000000', product_name: 'Skyr nature', brands: 'Marque Repère', nutriments: {} } })
  const r = await lookupBarcode('3250390000000')
  assert.deepEqual(r, { status: 'incomplete', code: '3250390000000', name: 'Skyr nature', brand: 'Marque Repère' })
})

test('scan : panne serveur ou réseau → erreur (message « réessaie »)', async () => {
  mockFetch(503, { error: 'unavailable' })
  await assert.rejects(lookupBarcode('3017620422003'))
  globalThis.fetch = (async () => {
    throw new TypeError('Failed to fetch')
  }) as typeof fetch
  await assert.rejects(lookupBarcode('3017620422003'))
})
