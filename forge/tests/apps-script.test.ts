// Teste le script Apps Script (apps-script/Code.gs) contre une simulation de Google Sheets.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

process.env.TZ = 'Europe/Paris'
type Cell = unknown

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
    return this.getValues().map((row) => row.map((v) => String(v ?? '')))
  }
  setValues(v: Cell[][]) {
    v.forEach((row, i) => row.forEach((x, j) => this.sheet.set(this.r + i, this.c + j, x)))
    return this
  }
  setValue(v: Cell) {
    this.sheet.set(this.r, this.c, v)
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
  constructor(name: string, rows: Cell[][] = []) {
    this.name = name
    this.rows = rows
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

function load(opts: { coachUrl?: string; mapping?: string; coach?: MockSpreadsheet } = {}) {
  const own = new MockSpreadsheet('Forge – Suivi')
  let src = readFileSync(new URL('../apps-script/Code.gs', import.meta.url), 'utf8')
  src = src.replace("const TOKEN = 'COLLE_TON_JETON_ICI';", "const TOKEN = 'secret-token-123';")
  if (opts.coachUrl) src = src.replace("const COACH_SHEET_URL = '';", `const COACH_SHEET_URL = '${opts.coachUrl}';`)
  if (opts.mapping) src = src.replace('const COACH_MAPPING = null;', `const COACH_MAPPING = ${opts.mapping};`)
  const ctx = vm.createContext({
    Session: { getScriptTimeZone: () => 'Europe/Paris' },
    Utilities: { formatDate: (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` },
    SpreadsheetApp: { getActiveSpreadsheet: () => own, openByUrl: () => opts.coach },
    ContentService: { createTextOutput: (s: string) => ({ s, setMimeType() { return this } }), MimeType: { JSON: 'json' } },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Logger: { log() {} },
    Date,
    JSON,
    Math,
    Number,
    String,
    Object,
    isFinite,
    isNaN,
    parseFloat,
  })
  // Les `const` de haut niveau d'un script ne deviennent pas des propriétés du contexte : on expose les fonctions utiles.
  vm.runInContext(`${src}\n;globalThis.__api = { doGet, doPost };`, ctx)
  const api = (ctx as unknown as { __api: { doGet: (e: unknown) => { s: string }; doPost: (e: unknown) => { s: string } } }).__api
  const get = (params: Record<string, string>) => JSON.parse(api.doGet({ parameter: params }).s)
  const post = (body: unknown) => JSON.parse(api.doPost({ parameter: {}, postData: { contents: JSON.stringify(body) } }).s)
  const tab = (n: string) => own.getSheetByName(n) as MockSheet
  return { own, get, post, tab }
}

const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const day = (date: string, extra: Record<string, unknown> = {}) => ({
  date,
  poids: 77.2,
  poidsMoyenSemaine: 77.4,
  kcal: 2310,
  proteines: 175,
  glucides: 240,
  lipides: 70,
  fibres: 28,
  objectifKcal: 2400,
  objectifProteines: 180,
  objectifGlucides: 250,
  objectifLipides: 75,
  pas: 8000,
  pasMaj: 1000,
  objectifPas: 10000,
  seance: 'Push',
  tonnage: 12800,
  dureeSeanceMin: 64,
  typeJour: 'entrainement',
  repas: [
    { repas: 'Déjeuner', aliment: 'Riz basmati cuit', marque: '', quantite: 250, portion: '', kcal: 315, proteines: 7.3, glucides: 68.8, lipides: 1 },
    { repas: 'Dîner', aliment: 'Saumon cru', marque: '', quantite: 140, portion: '1 pavé', kcal: 280, proteines: 28, glucides: 0, lipides: 18.8 },
  ],
  ...extra,
})

test('Apps Script : jeton obligatoire et ping', () => {
  const { get } = load()
  assert.equal(get({ action: 'ping', token: 'mauvais' }).ok, false)
  const r = get({ action: 'ping', token: 'secret-token-123' })
  assert.equal(r.ok, true)
  assert.equal(r.sheet, 'Forge – Suivi')
})

test('Apps Script : pas reçus du Raccourci iOS (format français) puis relus par l’app', () => {
  const { get, tab } = load()
  const r = get({ action: 'pas', token: 'secret-token-123', steps: '8 532,0', date: '2026-11-22' })
  assert.equal(r.ok, true)
  assert.equal(r.steps, 8532)
  assert.equal(tab('Pas').data().length, 1)
  assert.equal(tab('Jours').data()[0][12], 8532)
  get({ action: 'pas', token: 'secret-token-123', steps: '9100', date: '2026-11-22' })
  assert.equal(tab('Pas').data().length, 1, 'mise à jour, pas de doublon')
  const list = get({ action: 'steps', token: 'secret-token-123', since: '2026-11-01' })
  assert.equal(list.steps.length, 1)
  assert.equal(list.steps[0].steps, 9100)
  assert.equal(list.steps[0].date, '2026-11-22')
  assert.equal(get({ action: 'pas', token: 'secret-token-123', steps: 'abc' }).ok, false)
  // sans date : aujourd'hui
  const today = get({ action: 'pas', token: 'secret-token-123', steps: '1200' })
  assert.equal(today.date, iso(new Date()))
})

test('Apps Script : envoi de journées, séances et bilans, sans doublons', () => {
  const { post, tab } = load()
  const session = {
    id: 'w1',
    date: '2026-11-22',
    nom: 'Push',
    dureeMin: 64,
    tonnage: 12800,
    series: 4,
    note: 'Bonne forme',
    exercices: [
      { nom: 'Développé couché barre', groupe: 'Pectoraux', resume: '85 × 7, 85 × 7', note: '', series: [{ n: 1, type: 'normal', charge: 85, reps: 7 }, { n: 2, type: 'normal', charge: 85, reps: 7 }] },
      { nom: 'Élévations latérales haltères', groupe: 'Épaules', resume: '10 × 15, 10 × 14', note: 'Lent', series: [{ n: 1, type: 'normal', charge: 10, reps: 15 }, { n: 2, type: 'normal', charge: 10, reps: 14 }] },
    ],
  }
  const r = post({ action: 'push', token: 'secret-token-123', days: [day('2026-11-21'), day('2026-11-22')], sessions: [session], bilans: [{ id: 'c1', date: '2026-11-22', mensurations: { taille: 83.5 }, ressenti: { energie: 4 }, note: 'RAS', photos: 3 }] })
  assert.equal(r.ok, true, JSON.stringify(r))
  assert.equal(tab('Jours').data().length, 2)
  assert.equal(tab('Repas').data().length, 4)
  assert.equal(tab('Séances').data().length, 2)
  assert.equal(tab('Détail séries').data().length, 4)
  assert.equal(tab('Bilans').data().length, 1)

  // Renvoi du même jour avec un repas en moins : remplacé, pas dupliqué
  const d2 = day('2026-11-22', { kcal: 1999, repas: [{ repas: 'Déjeuner', aliment: 'Pâtes cuites', quantite: 200, kcal: 300, proteines: 10, glucides: 59, lipides: 1.8 }] })
  post({ action: 'push', token: 'secret-token-123', days: [d2], sessions: [session], bilans: [] })
  assert.equal(tab('Jours').data().length, 2)
  assert.equal(tab('Jours').data().find((x) => (x[0] as Date).getDate() === 22)?.[3], 1999)
  assert.equal(tab('Repas').data().length, 3)
  assert.equal(tab('Séances').data().length, 2)
  assert.equal(tab('Détail séries').data().length, 4)

  // Suppression de la séance
  post({ action: 'push', token: 'secret-token-123', days: [], sessions: [{ id: 'w1', deleted: true }], bilans: [{ id: 'c1', deleted: true }] })
  assert.equal(tab('Séances').data().length, 0)
  assert.equal(tab('Détail séries').data().length, 0)
  assert.equal(tab('Bilans').data().length, 0)
})

test('Apps Script : les pas du Raccourci (plus récents) ne sont pas écrasés par l’app', () => {
  const { get, post, tab } = load()
  get({ action: 'pas', token: 'secret-token-123', steps: '12000', date: '2026-11-22' })
  post({ action: 'push', token: 'secret-token-123', days: [day('2026-11-22', { pas: 5000, pasMaj: 1 })] })
  assert.equal(tab('Jours').data()[0][12], 12000)
  post({ action: 'push', token: 'secret-token-123', days: [day('2026-11-22', { pas: 13000, pasMaj: Date.now() + 60000 })] })
  assert.equal(tab('Jours').data()[0][12], 13000, 'saisie manuelle plus récente')
})

test('Apps Script : sheet du coach, une ligne par jour', () => {
  const coachTab = new MockSheet('Suivi', [
    ['Date', 'Poids', 'Pas', 'Kcal', 'P', 'G', 'L', 'Séance', 'Moyenne (formule)'],
    [new Date(2026, 10, 21), '', '', '', '', '', '', '', '=AVERAGE(B2:B8)'],
    [new Date(2026, 10, 22), '', '', '', '', '', '', '', ''],
  ])
  const coach = new MockSpreadsheet('Coach', [coachTab])
  const mapping = `{ jours: { onglet: 'Suivi', disposition: 'lignes', colonneDate: 'A', premiereLigne: 2, colonnes: { poids: 'B', pas: 'C', kcal: 'D', proteines: 'E', glucides: 'F', lipides: 'G', seance: 'H' }, creerSiAbsent: true } }`
  const { post, get } = load({ coachUrl: 'https://docs.google.com/spreadsheets/d/x/edit', mapping, coach })
  const r = post({ action: 'push', token: 'secret-token-123', days: [day('2026-11-22'), day('2026-11-23', { poids: 76.9 })] })
  assert.equal(r.coach.ok, true, JSON.stringify(r.coach))
  assert.equal(coachTab.get(3, 2), 77.2)
  assert.equal(coachTab.get(3, 3), 8000)
  assert.equal(coachTab.get(3, 8), 'Push')
  assert.equal(coachTab.get(2, 9), '=AVERAGE(B2:B8)', 'les autres cellules ne sont pas touchées')
  assert.equal(coachTab.get(4, 2), 76.9, 'date ajoutée en bas si absente')
  get({ action: 'pas', token: 'secret-token-123', steps: '15000', date: '2026-11-21' })
  assert.equal(coachTab.get(2, 3), 15000, 'le Raccourci remplit aussi le sheet du coach')
})

test('Apps Script : sheet du coach, un onglet par semaine et une colonne par jour', () => {
  const s1 = new MockSheet('Semaine 46', [['', ''], ['', ''], ['Jour', 'lun. 09/11', 'mar. 10/11'], ['', ''], ['Poids', '', '']])
  const s2 = new MockSheet('Semaine 47', [
    ['', ''],
    ['', ''],
    ['Jour', '16/11', '17/11', '18/11', '19/11', '20/11', '21/11', '22/11'],
    ['', ''],
    ['Poids'],
    ['Pas'],
    ['Kcal'],
  ])
  const coach = new MockSpreadsheet('Coach', [s1, s2])
  const mapping = `{ jours: { onglet: '*', disposition: 'colonnes', ligneDate: 3, lignes: { poids: 5, pas: 6, kcal: 7 } } }`
  const { post } = load({ coachUrl: 'https://docs.google.com/spreadsheets/d/x/edit', mapping, coach })
  const r = post({ action: 'push', token: 'secret-token-123', days: [day('2026-11-22'), day('2026-11-10', { poids: 79.1 }), day('2027-01-05')] })
  assert.equal(s2.get(5, 8), 77.2)
  assert.equal(s2.get(6, 8), 8000)
  assert.equal(s2.get(7, 8), 2310)
  assert.equal(s1.get(5, 3), 79.1)
  assert.equal(r.coach.ok, false, 'une date absente est signalée')
  assert.match(r.coach.message, /2027-01-05/)
})
