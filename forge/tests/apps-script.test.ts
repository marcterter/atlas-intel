// Teste le script Apps Script (apps-script/Code.gs) contre une simulation de Google Sheets,
// dont une réplique du sheet du coach (onglets « Suivi journalier » et « Entraînement »).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

process.env.TZ = 'Europe/Paris'
type Cell = unknown

/** Horloge figée au dimanche 22 novembre 2026, midi (semaine 8 du programme). */
const FIXED = new Date(2026, 10, 22, 12).getTime()
class FixedDate extends Date {
  constructor(...a: unknown[]) {
    if (a.length === 0) super(FIXED)
    else super(...(a as [number]))
  }
  static now() {
    return FIXED
  }
}
const D = (y: number, m: number, d: number) => new FixedDate(y, m, d)

class MockRange {
  sheet: MockSheet
  r: number
  c: number
  nr: number
  nc: number
  constructor(sheet: MockSheet, r: number, c: number, nr = 1, nc = 1) {
    this.sheet = sheet
    this.r = r
    this.c = c
    this.nr = nr
    this.nc = nc
  }
  getValues(): Cell[][] {
    return Array.from({ length: this.nr }, (_, i) => Array.from({ length: this.nc }, (_, j) => this.sheet.get(this.r + i, this.c + j)))
  }
  getDisplayValues(): string[][] {
    return this.getValues().map((row) => row.map((v) => (v instanceof Date ? v.toDateString() : String(v ?? ''))))
  }
  getDataValidations(): (object | null)[][] {
    return Array.from({ length: this.nr }, (_, i) => Array.from({ length: this.nc }, (_, j) => (this.sheet.rules.has(`${this.r + i},${this.c + j}`) ? {} : null)))
  }
  setValues(v: Cell[][]) {
    v.forEach((row, i) => row.forEach((x, j) => this.sheet.set(this.r + i, this.c + j, x)))
    return this
  }
  setValue(v: Cell) {
    this.sheet.set(this.r, this.c, v)
    this.sheet.writes.push(`${this.r},${this.c}`)
    return this
  }
  setFontWeight() {
    return this
  }
  setNumberFormat() {
    return this
  }
}

class MockSheet {
  name: string
  rows: Cell[][] = []
  rules = new Set<string>()
  writes: string[] = []
  constructor(name: string) {
    this.name = name
  }
  get(r: number, c: number): Cell {
    return this.rows[r - 1]?.[c - 1] ?? ''
  }
  set(r: number, c: number, v: Cell) {
    while (this.rows.length < r) this.rows.push([])
    const row = this.rows[r - 1]
    while (row.length < c) row.push('')
    row[c - 1] = v
  }
  getName() {
    return this.name
  }
  getLastRow() {
    for (let i = this.rows.length; i > 0; i--) if (this.rows[i - 1].some((v) => v !== '' && v != null)) return i
    return 0
  }
  getLastColumn() {
    return Math.max(0, ...this.rows.map((r) => r.length))
  }
  getRange(a: number | string, c?: number, nr?: number, nc?: number) {
    if (typeof a === 'string') return new MockRange(this, 1, 1)
    return new MockRange(this, a, c as number, nr, nc)
  }
  getDataRange() {
    return new MockRange(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn()))
  }
  appendRow(v: Cell[]) {
    const r = this.getLastRow() + 1
    v.forEach((x, j) => this.set(r, j + 1, x))
  }
  deleteRows(start: number, count: number) {
    this.rows.splice(start - 1, count)
  }
  setFrozenRows() {}
  data() {
    return this.rows.slice(1, this.getLastRow())
  }
  col(header: string) {
    return (this.rows[0] as string[]).indexOf(header)
  }
}

class MockSpreadsheet {
  name: string
  sheets: MockSheet[]
  constructor(name: string, sheets: MockSheet[] = []) {
    this.name = name
    this.sheets = sheets
  }
  getName() {
    return this.name
  }
  getSheetByName(n: string) {
    return this.sheets.find((s) => s.name === n) ?? null
  }
  getSheets() {
    return this.sheets
  }
  insertSheet(n: string) {
    const s = new MockSheet(n)
    this.sheets.push(s)
    return s
  }
}

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const TOKEN = 'secret-token-123'

function load(opts: { coach?: MockSpreadsheet } = {}) {
  const own = new MockSpreadsheet('Forge – Suivi')
  let src = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8')
  src = src.replace("const TOKEN = 'COLLE_TON_JETON_ICI';", `const TOKEN = '${TOKEN}';`)
  if (opts.coach) src = src.replace("const COACH_SHEET_URL = '';", "const COACH_SHEET_URL = 'https://docs.google.com/spreadsheets/d/coach/edit';")
  const ctx = vm.createContext({
    Session: { getScriptTimeZone: () => 'Europe/Paris' },
    Utilities: { formatDate: (d: Date) => iso(d) },
    SpreadsheetApp: { getActiveSpreadsheet: () => own, openByUrl: () => opts.coach },
    ContentService: { createTextOutput: (s: string) => ({ s, setMimeType() { return this } }), MimeType: { JSON: 'json' } },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Logger: { log() {} },
    Date: FixedDate,
    JSON,
    Math,
    Number,
    String,
    Object,
    isFinite,
    isNaN,
    parseFloat,
  })
  vm.runInContext(`${src}\n;globalThis.__api = { doGet, doPost };`, ctx)
  const api = (ctx as unknown as { __api: { doGet: (e: unknown) => { s: string }; doPost: (e: unknown) => { s: string } } }).__api
  const get = (params: Record<string, string>) => JSON.parse(api.doGet({ parameter: { token: TOKEN, ...params } }).s)
  const post = (body: Record<string, unknown>) => JSON.parse(api.doPost({ parameter: {}, postData: { contents: JSON.stringify({ token: TOKEN, ...body }) } }).s)
  const tab = (n: string) => own.getSheetByName(n) as MockSheet
  return { own, get, post, tab }
}

// ---------------------------------------------------------------- réplique du sheet du coach

const COL = { B: 2, C: 3, G: 7, H: 8, I: 9, K: 11, L: 12, M: 13, O: 15, P: 16, Q: 17, R: 18, T: 20, U: 21, V: 22, W: 23, X: 24, Y: 25, AC: 29 }

/** « Suivi journalier » : en-têtes lignes 8-9, puis blocs de 7 jours (vendredi → jeudi) + ligne « Moyenne ». */
function suiviJournalier(weeks = 9) {
  const sh = new MockSheet('Suivi journalier')
  sh.set(2, 11, 'Qualité Somm.')
  sh.set(9, COL.B, 'Semaine')
  sh.set(9, COL.C, 'Jour')
  sh.set(9, COL.G, 'Poids')
  sh.set(9, COL.H, 'Sommeil')
  sh.set(9, COL.I, 'Qualité Somm.')
  sh.set(9, COL.K, 'Nombre de pas')
  sh.set(9, COL.T, 'Calories')
  sh.set(9, COL.AC, 'Notes')
  for (let n = 1; n <= weeks; n++) {
    const r0 = 11 + 8 * (n - 1)
    sh.set(r0, COL.B, `Semaine ${n}`) // cellule fusionnée : valeur en haut du bloc seulement
    for (let d = 0; d < 7; d++) sh.set(r0 + d, COL.C, D(2026, 9, 2 + 7 * (n - 1) + d))
    sh.set(r0 + 7, COL.B, 'Moyenne')
    sh.set(r0 + 7, COL.G, `=AVERAGE(G${r0}:G${r0 + 6})`)
    sh.set(r0 + 7, COL.T, `=AVERAGE(T${r0}:T${r0 + 6})`)
  }
  sh.set(15, COL.G, 73.8) // une valeur déjà saisie à la main (6 octobre)
  sh.set(8, 5, 'Nutrition Phase')
  sh.set(9, 5, '*Coach qui remplira*')
  sh.set(11, 5, 'Sèche') // phase notée par le coach en semaine 1 et 2
  sh.set(19, 5, 'Sèche')
  return sh
}

type Exo = [nom: string, series: string, reps: string, rir: string, perf: string, progres: string, notes?: string]
const LUNDI: Exo[] = [
  ['Tirage vertical unilatéral', '2', '10,8', '0', '35kg x 6, 30KGX8', 'OUI'],
  ['Développé couché à la smith', '3', '10,8,6', '1', '52,5kg x 11 ; 47,4kg x 11 ; 47,5kgx8', 'OUI'],
  ['Tirage horizontal machine', '2', '10,8', '0', '47,5kg x 9 ; 45kg x 9', 'OUI'],
  ['Écarté à la poulie sur banc', '3', '12,10,8', '0', '12 x 7,5kg ; 10 x 7,5kg ; 8 x 7,5kg', 'Maintenu'],
  ['Élévation latérale unilatéral cuff de poignet', '3', '12,10,8', '0', '7,5kg x 12 ; 7,5kg x 8 ; 6,25kg x 8', 'OUI'],
  ['Curl pupitre unilatéral avec haltères', '3', '12,10,8', '0', '12kg x 10 ; 12kg x 7', 'Regressé', 'regressé a cause du doigt'],
  ['Overhead triceps extension cable', '3', '12,10,8', '0', '22,5kg x 7 ; 17,5kg x 9 ; 15kg x 9', 'OUI'],
  ['Rotation latérale abdos', '2', '10,8', '2', '', ''],
]
const MARDI: Exo[] = [
  ['Adductor machine', '2', '10,8', '0', '60kg x 6 ; 50kg x 8', 'Maintenu'],
  ['Seated leg curl', '2', '10,8', '0', '60kg x 8 ; 50kg x 9', 'Maintenu'],
  ['Pendulum', '2', '8,6', '1', '25kg x8 ; 25kg x 6', 'Maintenu'],
  ['Leg press', '1', '5-8', '1', '180kg x 8', 'OUI'],
  ['Leg extension ', '2', '10,8', '0', '70kg x 8 ; 60kg x 6', 'OUI'],
  ['Extension mollet', '2', '10,8', '0', '', ''],
  ['Crunch poulie abdos', '2', '10,8', '0', '40kg x 8 ; 35kg x 8', 'Maintenu'],
]
const JEUDI: Exo[] = [
  ['Tirage vertical unilatéral', '2', '10,8', '0', '35kg x 6, 30KGX8', 'Maintenu'],
  ['Développé incliné à la smith', '3', '10,8,6', '1', '55kgx9 ; 47,5kg x 10 . 45kg x 8', 'OUI'],
  ['Tirage horizontal machine', '2', '10,8', '0', '47,5kg x 9 ; 45kg x 9', 'Maintenu'],
  ['Écarté à la poulie sur banc', '3', '12,10,8', '0', '12 x 7,5kg ; 10 x 7,5kg ; 8 x 7,5kg', 'Maintenu'],
  ['Élévation latérale unilatéral cuff de poignet', '3', '12,10,8', '0', '8,75kg x 6 ; 7,5kgx8 ; 6,25kg x 8', 'OUI'],
  ['Curl pupitre unilatéral avec haltères', '3', '12,10,8', '0', '14kgx7 ; 12kgx8 ; 12kgx6', 'OUI'],
  ['Overhead triceps extension cable', '3', '12,10,8', '0', '22,5kg x 7 ; 17,5kg x 10', 'OUI'],
  ['Rotation latérale abdos', '2', '10,8', '2', '', ''],
]
const VENDREDI: Exo[] = [
  ['Adductor machine', '2', '10,8', '0', '60kg x 7 ; 50kg x 9', 'OUI'],
  ['Seated leg curl', '2', '10,8', '0', '65kg x 6 ; 55kg x 7 ; 50kg x 7', 'OUI'],
  ['Stiff leg deadlift', '2', '8,6', '1', 'skip a cause du doigt', ''],
  ['Leg press', '2', '5-8', '1', '70kg x 9 ; 62,5kg x 8', 'OUI'],
  ['Leg extension ', '2', '10,8', '0', '75kg x 7 ; 65kg x 7', 'OUI'],
  ['Extension mollet', '2', '10,8', '0', '', ''],
  ['Crunch poulie abdos', '2', '10,8', '0', 'demain sur seance cardio', ''],
]
const DAYS: [number, string, Exo[], boolean][] = [
  [7, 'LUNDI', LUNDI, true],
  [19, 'MARDI', MARDI, false],
  [32, 'JEUDI', JEUDI, true],
  [45, 'VENDREDI', VENDREDI, true],
]
const HEADERS = ['Série', 'Reps', 'Intensité (RIR)', 'POIDS X REPS', 'RIR', 'Progressé en POIDS/ CHARGE ?', 'Douleurs/ Notes']
/** Colonne de début du bloc « Semaine n » : D, L, T, AB… (8 colonnes par semaine). */
const blockCol = (n: number) => 4 + 8 * (n - 1)

/** « Entraînement » : noms en colonne B (communs), puis 12 blocs « Semaine N » côte à côte ; `filled` semaines remplies. */
function entrainement(weeks = 12, filled = 3) {
  const sh = new MockSheet('Entraînement')
  for (const [band, , exos, exHeader] of DAYS) {
    if (exHeader) sh.set(band + 1, 2, 'Exercise')
    exos.forEach((e, i) => sh.set(band + 2 + i, 2, e[0]))
  }
  for (let n = 1; n <= weeks; n++) {
    const c0 = blockCol(n)
    sh.set(3, c0, `Semaine ${n}`)
    for (const [band, label, exos] of DAYS) {
      sh.set(band, c0, label)
      HEADERS.forEach((h, k) => sh.set(band + 1, c0 + k, h))
      exos.forEach((e, i) => {
        const r = band + 2 + i
        sh.set(r, c0, e[1])
        sh.set(r, c0 + 1, e[2])
        sh.set(r, c0 + 2, e[3])
        if (n <= filled) {
          sh.set(r, c0 + 3, n === 1 ? e[4] : e[4].replace(/kg/g, '').replace(/ ; /g, ' '))
          sh.set(r, c0 + 5, e[5])
          if (e[6]) sh.set(r, c0 + 6, e[6])
        }
      })
    }
  }
  return sh
}

function nutrition() {
  const sh = new MockSheet('Nutrition')
  ;[['B', 'Jour ON'], ['C', 'Calories'], ['D', 'Protein'], ['E', 'Glucides'], ['F', 'Lipides'], ['G', 'Fibres'], ['J', 'Consommation eau'], ['L', 'Cardio']].forEach(([c, v]) => sh.set(2, c.charCodeAt(0) - 64, v))
  ;[['B', 'Macro Cible'], ['C', 2640], ['D', 215], ['E', 310], ['F', 60], ['G', 30], ['J', '3-4 L'], ['L', '60 min zone 2 ']].forEach(([c, v]) => sh.set(3, (c as string).charCodeAt(0) - 64, v))
  sh.set(6, 12, 'Pas')
  ;[['B', 'Jour off'], ['C', 'Calories'], ['D', 'Protein'], ['E', 'Glucides'], ['F', 'Lipides'], ['G', 'Fibres'], ['L', '15k']].forEach(([c, v]) => sh.set(7, c.charCodeAt(0) - 64, v))
  ;[['B', 'Macro Cible'], ['C', 2140], ['D', 200], ['E', 200], ['F', 60], ['G', 30]].forEach(([c, v]) => sh.set(8, (c as string).charCodeAt(0) - 64, v))
  sh.set(13, 2, 'JOUR ON')
  sh.set(13, 15, 'JOUR OFF')
  return sh
}

function coachSheet(opts: { weeks?: number; filled?: number } = {}) {
  const suivi = suiviJournalier()
  const entr = entrainement(opts.weeks ?? 12, opts.filled ?? 3)
  const ss = new MockSpreadsheet('Coaching Marc', [new MockSheet('Page daccueil'), suivi, entr, nutrition(), new MockSheet('Checkins')])
  return { ss, suivi, entr }
}

const day = (date: string, extra: Record<string, unknown> = {}) => ({
  date,
  poids: 72.6,
  poidsMoyenSemaine: 72.8,
  sommeil: 7.5,
  qualiteSommeil: 8,
  energie: 8,
  motivation: 9,
  satiete: 7,
  digestion: 4,
  eau: 2.25,
  notes: 'Resto japonais',
  entrainement: 'Upper A',
  cardio: 30,
  kcal: 2310,
  proteines: 175.4,
  glucides: 240.6,
  lipides: 70.2,
  fibres: 28.4,
  objectifKcal: 2400,
  pas: 12774,
  pasMaj: 1000,
  objectifPas: 10000,
  repas: [{ repas: 'Déjeuner', aliment: 'Riz basmati cuit', quantite: 250, kcal: 315, proteines: 7.3, glucides: 68.8, lipides: 1 }],
  ...extra,
})

// ---------------------------------------------------------------- tests de base

test('Apps Script : jeton obligatoire et ping', () => {
  const { get } = load()
  assert.equal(get({ action: 'ping', token: 'mauvais' }).ok, false)
  const r = get({ action: 'ping' })
  assert.equal(r.ok, true)
  assert.equal(r.sheet, 'Forge – Suivi')
  assert.equal(r.coach, null)
})

test('Apps Script : pas reçus du Raccourci iOS (format français) puis relus par l’app', () => {
  const { get, tab } = load()
  const r = get({ action: 'pas', steps: '8 532,0', date: '2026-11-22' })
  assert.equal(r.ok, true)
  assert.equal(r.steps, 8532)
  assert.equal(tab('Pas').data().length, 1)
  assert.equal(tab('Jours').data()[0][tab('Jours').col('Pas')], 8532)
  get({ action: 'pas', steps: '9100', date: '2026-11-22' })
  assert.equal(tab('Pas').data().length, 1, 'mise à jour, pas de doublon')
  const list = get({ action: 'steps', since: '2026-11-01' })
  assert.equal(list.steps.length, 1)
  assert.equal(list.steps[0].steps, 9100)
  assert.equal(get({ action: 'pas', steps: 'abc' }).ok, false)
  assert.equal(get({ action: 'pas', steps: '1200' }).date, '2026-11-22')
})

test('Apps Script : journées, séances et bilans dans ton sheet, sans doublons', () => {
  const { post, tab } = load()
  const session = {
    id: 'w1',
    date: '2026-11-22',
    nom: 'Upper A',
    dureeMin: 64,
    tonnage: 6000,
    series: 4,
    exercices: [
      { nom: 'Développé couché à la smith', groupe: 'Pectoraux', resume: '55 × 10, 50 × 11', perf: '55kg x 10 ; 50kg x 11', progres: 'OUI', series: [{ n: 1, type: 'normal', charge: 55, reps: 10 }, { n: 2, type: 'normal', charge: 50, reps: 11 }] },
    ],
  }
  const r = post({ action: 'push', days: [day('2026-11-21'), day('2026-11-22')], sessions: [session], bilans: [{ id: 'c1', date: '2026-11-22', mensurations: { taille: 83.5 }, note: 'RAS', photos: 3 }] })
  assert.equal(r.ok, true, JSON.stringify(r))
  const J = tab('Jours')
  assert.equal(J.data().length, 2)
  assert.equal(J.data()[1][J.col('Sommeil (h)')], 7.5)
  assert.equal(J.data()[1][J.col('Énergie')], 8)
  assert.equal(J.data()[1][J.col('Notes')], 'Resto japonais')
  assert.equal(tab('Repas').data().length, 2)
  assert.equal(tab('Séances').data().length, 1)
  assert.equal(tab('Séances').data()[0][tab('Séances').col('Progressé ?')], 'OUI')
  assert.equal(tab('Détail séries').data().length, 2)
  assert.equal(tab('Bilans').data().length, 1)
  post({ action: 'push', days: [day('2026-11-22', { kcal: 1999, repas: [] })], sessions: [session] })
  assert.equal(J.data().length, 2)
  assert.equal(J.data()[1][J.col('Kcal')], 1999)
  assert.equal(tab('Repas').data().length, 1)
  assert.equal(tab('Séances').data().length, 1)
  post({ action: 'push', sessions: [{ id: 'w1', deleted: true }], bilans: [{ id: 'c1', deleted: true }] })
  assert.equal(tab('Séances').data().length, 0)
  assert.equal(tab('Détail séries').data().length, 0)
  assert.equal(tab('Bilans').data().length, 0)
})

test('Apps Script : les pas du Raccourci (plus récents) ne sont pas écrasés par l’app', () => {
  const { get, post, tab } = load()
  get({ action: 'pas', steps: '12000', date: '2026-11-22' })
  post({ action: 'push', days: [day('2026-11-22', { pas: 5000, pasMaj: 1 })] })
  assert.equal(tab('Jours').data()[0][tab('Jours').col('Pas')], 12000)
  post({ action: 'push', days: [day('2026-11-22', { pas: 13000, pasMaj: Date.now() + 60000 })] })
  assert.equal(tab('Jours').data()[0][tab('Jours').col('Pas')], 13000, 'saisie manuelle plus récente')
})

// ---------------------------------------------------------------- sheet du coach

test('Coach : « Suivi journalier » rempli sur la ligne du jour, colonnes G → AC', () => {
  const { ss, suivi } = coachSheet()
  const { post, get } = load({ coach: ss })
  const ping = get({ action: 'ping' })
  assert.deepEqual([ping.coach.ok, ping.coach.nom, ping.coach.suivi, ping.coach.semaines.length], [true, 'Coaching Marc', true, 12])

  const r = post({ action: 'push', days: [day('2026-11-22')] })
  assert.equal(r.coach.ok, true, JSON.stringify(r.coach))
  const row = 11 + 8 * 7 + 2 // semaine 8 (20 → 26 nov.), 22 nov. = 3e jour
  assert.equal(String(suivi.get(row, COL.C)), D(2026, 10, 22).toString())
  const got = Object.fromEntries(Object.entries(COL).filter(([k]) => !['B', 'C'].includes(k)).map(([k, c]) => [k, suivi.get(row, c)]))
  assert.deepEqual(got, {
    G: 72.6, H: 7.5, I: 8, K: 12774, L: 30, M: 'Upper A', O: 8, P: 9, Q: 7, R: 4,
    T: 2310, U: 175, V: 241, W: 70, X: 28, Y: 2.25, AC: 'Resto japonais',
  })
  const moyenne = 11 + 8 * 7 + 7
  assert.equal(suivi.get(moyenne, COL.B), 'Moyenne')
  assert.equal(suivi.get(moyenne, COL.G), `=AVERAGE(G${moyenne - 7}:G${moyenne - 1})`, 'la ligne Moyenne n’est pas touchée')
  assert.ok(suivi.writes.every((w) => Number(w.split(',')[0]) === row), 'aucune autre ligne modifiée')
})

test('Coach : valeurs au format des listes déroulantes (1 à 3, demi-points) et cases vides ignorées', () => {
  const { ss, suivi } = coachSheet()
  const { post } = load({ coach: ss })
  post({ action: 'push', days: [{ date: '2026-10-07', sommeil: 2.5, qualiteSommeil: 2, energie: 5.4, pas: null, kcal: null, notes: '' }] })
  const row = 16 // 7 octobre
  assert.equal(suivi.get(row, COL.H), '1 à 3')
  assert.equal(suivi.get(row, COL.I), '1 à 3')
  assert.equal(suivi.get(row, COL.O), 5)
  assert.equal(suivi.get(row, COL.K), '', 'pas non envoyés → case laissée vide')
  assert.equal(suivi.get(15, COL.G), 73.8, 'saisie manuelle d’un autre jour conservée')
  post({ action: 'push', days: [{ date: '2026-10-08', sommeil: 6.74 }] })
  assert.equal(suivi.get(17, COL.H), 6.5)
})

test('Coach : pas du Raccourci iOS recopiés dans « Nombre de pas »', () => {
  const { ss, suivi } = coachSheet()
  const { get } = load({ coach: ss })
  const r = get({ action: 'pas', steps: '13490', date: '2026-10-22' })
  assert.equal(r.coach.ok, true)
  assert.equal(suivi.get(11 + 8 * 2 + 6, COL.K), 13490)
})

test('Coach : date hors du suivi journalier signalée sans rien écrire', () => {
  const { ss, suivi } = coachSheet()
  const { post } = load({ coach: ss })
  const r = post({ action: 'push', days: [day('2027-03-01')] })
  assert.equal(r.ok, true)
  assert.equal(r.coach.ok, false)
  assert.match(r.coach.message, /2027-03-01/)
  assert.equal(suivi.writes.length, 0)
})

test('Coach : lecture du programme, de l’historique et des objectifs', () => {
  const { ss } = coachSheet()
  const { get } = load({ coach: ss })
  const ping = get({ action: 'ping' })
  assert.deepEqual(ping.coach.semaines, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
  const p = get({ action: 'programme' })
  assert.equal(p.ok, true, JSON.stringify(p))
  assert.equal(p.semaineActuelle, 8)
  assert.equal(p.semaine, 8, 'programme de la semaine en cours')
  assert.deepEqual(p.seances.map((s: { jour: string }) => s.jour), ['LUNDI', 'MARDI', 'JEUDI', 'VENDREDI'])
  assert.deepEqual(p.seances[0].exercices[1], { nom: 'Développé couché à la smith', series: 3, reps: '10,8,6', rir: '1' })
  assert.equal(p.seances[1].exercices[4].nom, 'Leg extension')
  assert.equal(p.seances[1].exercices.length, 7)
  // Historique : semaines 1 à 3, datées au bon jour (la semaine 1 commence le vendredi 2 octobre)
  assert.equal(p.historique.length, 12)
  const s1 = p.historique.filter((h: { semaine: number }) => h.semaine === 1)
  assert.deepEqual(s1.map((h: { jour: string; date: string }) => [h.jour, h.date]), [['LUNDI', '2026-10-05'], ['MARDI', '2026-10-06'], ['JEUDI', '2026-10-08'], ['VENDREDI', '2026-10-02']])
  assert.deepEqual(s1[0].exercices[5], { nom: 'Curl pupitre unilatéral avec haltères', perf: '12kg x 10 ; 12kg x 7', notes: 'regressé a cause du doigt' })
  assert.equal(p.historique.find((h: { semaine: number; jour: string }) => h.semaine === 2 && h.jour === 'LUNDI').date, '2026-10-12')
  assert.deepEqual(p.objectifs, { on: { kcal: 2640, protein: 215, carbs: 310, fat: 60, fiber: 30 }, off: { kcal: 2140, protein: 200, carbs: 200, fat: 60, fiber: 30 }, pas: 15000, cardio: '60 min zone 2' })
  assert.equal(p.phase, 'Sèche', 'phase nutrition notée par le coach')
})

const upperA = (date: string, extra: Record<string, unknown> = {}) => ({
  id: 'w-upper',
  date,
  nom: 'Upper A',
  jourCoach: 'LUNDI',
  exercices: [
    { nom: 'Développé couché à la smith', perf: '55kg x 10 ; 50kg x 11 ; 50kg x 9', progres: 'OUI', note: '' },
    { nom: 'Curl pupitre unilatéral avec haltères', perf: '12kg x 11 ; 12kg x 9', progres: 'Maintenu', note: 'doigt ok' },
    { nom: 'Rotation latérale abdos', perf: '', progres: '', note: 'pas le temps' },
    { nom: 'Pull-over poulie', perf: '30kg x 12', progres: '', note: '' },
  ],
  ...extra,
})

test('Coach : séance écrite dans le bloc de la semaine en cours, sur la ligne de l’exercice', () => {
  const { ss, entr } = coachSheet()
  const { post } = load({ coach: ss })
  const r = post({ action: 'push', sessions: [upperA('2026-11-23')] }) // lundi 23 nov. = semaine 8
  const c = blockCol(8) // BH
  assert.equal(entr.get(10, c + 3), '55kg x 10 ; 50kg x 11 ; 50kg x 9', 'POIDS X REPS')
  assert.equal(entr.get(10, c + 5), 'OUI', 'Progressé ?')
  assert.equal(entr.get(14, c + 3), '12kg x 11 ; 12kg x 9')
  assert.equal(entr.get(14, c + 5), 'Maintenu')
  assert.equal(entr.get(14, c + 6), 'doigt ok', 'Douleurs/ Notes')
  assert.equal(entr.get(16, c + 6), 'pas le temps', 'exercice sauté : seule la note est écrite')
  assert.equal(entr.get(16, c + 3), '')
  assert.equal(entr.get(10, c), '3', 'séries prévues par le coach intactes')
  assert.equal(r.coach.ok, true, 'un exercice en plus n’est pas une erreur')
  assert.match(r.coach.info, /hors programme.*Pull-over poulie/)
  assert.ok(entr.writes.every((w) => Number(w.split(',')[1]) >= c && Number(w.split(',')[1]) <= c + 6), 'rien d’écrit hors du bloc semaine 8 (ni dans la colonne B du coach)')
  assert.equal(entr.get(10, blockCol(1) + 3), '52,5kg x 11 ; 47,4kg x 11 ; 47,5kgx8', 'semaine 1 intacte')
})

test('Coach : « Nouvel exo » quand l’exercice n’a jamais été fait', () => {
  const { ss, entr } = coachSheet()
  const { post } = load({ coach: ss })
  post({ action: 'push', sessions: [{ id: 'w2', date: '2026-11-24', nom: 'Lower A', jourCoach: 'MARDI', exercices: [{ nom: 'Extension mollet', perf: '80kg x 12 ; 80kg x 10', progres: '' }, { nom: 'Leg extension', perf: '80kg x 8', progres: '' }] }] })
  const c = blockCol(8)
  assert.equal(entr.get(26, c + 3), '80kg x 12 ; 80kg x 10')
  assert.equal(entr.get(26, c + 5), 'Nouvel exo')
  assert.equal(entr.get(25, c + 3), '80kg x 8', 'nom du coach avec espace final : retrouvé')
  assert.equal(entr.get(25, c + 5), '', 'déjà fait les semaines passées : pas « Nouvel exo »')
})

test('Coach : sans jour lié, le bon bandeau est retrouvé par les exercices', () => {
  const { ss, entr } = coachSheet()
  const { post } = load({ coach: ss })
  post({ action: 'push', sessions: [{ id: 'w3', date: '2026-11-21', nom: 'Séance libre', exercices: [{ nom: 'Développé incliné à la smith', perf: '57,5kg x 9', progres: 'OUI' }] }] })
  assert.equal(entr.get(35, blockCol(8) + 3), '57,5kg x 9', 'samedi 21 nov. = semaine 8 (20 → 26 nov.), bandeau JEUDI')
})

test('Coach : semaine absente de l’onglet Entraînement signalée', () => {
  const { ss, entr } = coachSheet({ weeks: 6 })
  const { post } = load({ coach: ss })
  const r = post({ action: 'push', sessions: [upperA('2026-11-23')] })
  assert.equal(r.coach.ok, false)
  assert.match(r.coach.message, /Semaine 8 absente/)
  assert.equal(entr.writes.length, 0)
})

// ---------------------------------------------------------------- écarts au programme

test('Coach : exercice remplacé → perf sur la ligne prévue, « Remplacé par … » en note, sans « Progressé »', () => {
  const { ss, entr } = coachSheet()
  const { post } = load({ coach: ss })
  const r = post({
    action: 'push',
    sessions: [
      upperA('2026-11-23', {
        exercices: [
          { nom: 'Développé couché haltères', remplace: 'Développé couché à la smith', perf: '24kg x 10 ; 22kg x 10', progres: 'OUI', note: 'smith prise' },
          { nom: 'Tirage horizontal poulie', remplace: 'Tirage horizontal machine', perf: '50kg x 10', progres: '', note: '' },
        ],
      }),
    ],
  })
  assert.equal(r.coach.ok, true, JSON.stringify(r.coach))
  const c = blockCol(8)
  assert.equal(entr.get(10, c + 3), '24kg x 10 ; 22kg x 10')
  assert.equal(entr.get(10, c + 5), '', 'progression non comparable à la ligne du coach')
  assert.equal(entr.get(10, c + 6), 'Remplacé par Développé couché haltères · smith prise')
  assert.equal(entr.get(11, c + 3), '50kg x 10')
  assert.equal(entr.get(11, c + 5), '', 'pas de « Nouvel exo » non plus')
  assert.equal(entr.get(11, c + 6), 'Remplacé par Tirage horizontal poulie')
})

test('Coach : exercices hors programme ajoutés à la note du jour (Suivi journalier), sans doublon au renvoi', () => {
  const { ss, suivi, entr } = coachSheet()
  const { post } = load({ coach: ss })
  const session = upperA('2026-11-23', {
    exercices: [
      { nom: 'Développé couché à la smith', perf: '55kg x 10', progres: 'OUI' },
      { nom: 'Pull-over poulie', perf: '30kg x 12 ; 25kg x 12', progres: '' },
      { nom: 'Curl marteau', perf: '14kg x 12', progres: '' },
    ],
  })
  const row = 11 + 8 * 7 + 3 // lundi 23 nov.
  const r = post({ action: 'push', days: [day('2026-11-23', { notes: 'Bonne séance' })], sessions: [session] })
  assert.equal(r.coach.ok, true, JSON.stringify(r.coach))
  assert.equal(suivi.get(row, COL.AC), 'Bonne séance · Hors programme : Pull-over poulie (30kg x 12 ; 25kg x 12), Curl marteau (14kg x 12)')
  assert.match(r.coach.info, /Pull-over poulie, Curl marteau/)
  post({ action: 'push', days: [day('2026-11-23', { notes: '' })], sessions: [session] })
  assert.equal(suivi.get(row, COL.AC), 'Hors programme : Pull-over poulie (30kg x 12 ; 25kg x 12), Curl marteau (14kg x 12)', 'réécrit, pas ajouté une 2e fois')
  assert.equal(entr.get(10, blockCol(8) + 3), '55kg x 10', 'l’exercice prévu est bien écrit')
  assert.ok(!entr.rows.some((line) => line.some((v) => String(v).includes('Pull-over'))), 'aucune ligne ajoutée chez le coach')
})

test('Coach : séance décalée → reste sur son jour, dans la semaine la plus proche', () => {
  const { ss, entr } = coachSheet()
  const { post } = load({ coach: ss })
  // Séance du JEUDI faite le vendredi 27 nov. (1er jour de la semaine 9 chez le coach) → semaine 8.
  post({ action: 'push', sessions: [{ id: 'w-jeudi', date: '2026-11-27', nom: 'Upper B', jourCoach: 'JEUDI', exercices: [{ nom: 'Développé incliné à la smith', perf: '57,5kg x 9', progres: 'OUI' }] }] })
  assert.equal(entr.get(35, blockCol(8) + 3), '57,5kg x 9')
  assert.equal(entr.get(35, blockCol(9) + 3), '')
  // Séance du VENDREDI faite la veille (jeudi 26, encore semaine 8) → semaine 9.
  post({ action: 'push', sessions: [{ id: 'w-vendredi', date: '2026-11-26', nom: 'Lower B', jourCoach: 'VENDREDI', exercices: [{ nom: 'Adductor machine', perf: '65kg x 8', progres: 'OUI' }] }] })
  assert.equal(entr.get(47, blockCol(9) + 3), '65kg x 8')
  assert.equal(entr.get(47, blockCol(8) + 3), '')
  // Séance du LUNDI faite le mercredi → même semaine, bandeau LUNDI.
  post({ action: 'push', sessions: [upperA('2026-11-25')] })
  assert.equal(entr.get(10, blockCol(8) + 3), '55kg x 10 ; 50kg x 11 ; 50kg x 9')
})

test('Coach : même séance deux fois dans la semaine → la plus récente gagne', () => {
  const { ss, entr } = coachSheet()
  const { post } = load({ coach: ss })
  const a = upperA('2026-11-23', { id: 'w-a', exercices: [{ nom: 'Développé couché à la smith', perf: '55kg x 10', progres: 'OUI' }] })
  const b = upperA('2026-11-25', { id: 'w-b', exercices: [{ nom: 'Développé couché à la smith', perf: '57,5kg x 8', progres: 'OUI' }] })
  post({ action: 'push', sessions: [b, a] })
  assert.equal(entr.get(10, blockCol(8) + 3), '57,5kg x 8')
})

test('Coach : séance libre sans exercice du programme → tout dans la note du jour', () => {
  const { ss, suivi, entr } = coachSheet()
  const { post } = load({ coach: ss })
  const r = post({
    action: 'push',
    days: [day('2026-11-22', { notes: '' })],
    sessions: [{ id: 'w-libre', date: '2026-11-22', nom: 'Séance libre', exercices: [{ nom: 'Tractions', perf: 'PDC x 10 ; PDC x 8', progres: '' }] }],
  })
  assert.equal(r.coach.ok, true, JSON.stringify(r.coach))
  assert.equal(suivi.get(11 + 8 * 7 + 2, COL.AC), 'Hors programme : Tractions (PDC x 10 ; PDC x 8)')
  assert.equal(entr.writes.length, 0)
})

test('Coach : semaine pas encore créée par le coach → signalée, la semaine d’avant n’est pas écrasée', () => {
  const { ss, entr } = coachSheet({ weeks: 8 })
  const { post } = load({ coach: ss })
  const r = post({ action: 'push', sessions: [upperA('2026-11-30')] }) // lundi 30 nov. = semaine 9
  assert.equal(r.coach.ok, false)
  assert.match(r.coach.message, /Semaine 9 absente/)
  assert.equal(entr.writes.length, 0)
})
