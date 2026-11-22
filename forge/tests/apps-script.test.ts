// Teste le script Apps Script (apps-script/Code.gs) contre une simulation de Google Sheets,
// dont une réplique du sheet du coach (onglets « Suivi journalier » et « Entraînement »).
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
    for (let d = 0; d < 7; d++) sh.set(r0 + d, COL.C, new Date(2026, 9, 2 + 7 * (n - 1) + d))
    sh.set(r0 + 7, COL.B, 'Moyenne')
    sh.set(r0 + 7, COL.G, `=AVERAGE(G${r0}:G${r0 + 6})`)
    sh.set(r0 + 7, COL.T, `=AVERAGE(T${r0}:T${r0 + 6})`)
  }
  sh.set(15, COL.G, 73.8) // une valeur déjà saisie à la main (6 octobre)
  return sh
}

const LUNDI = [
  ['Tirage vertical unilatéral', '0', '35kg x 6, 30KGX8', 'OUI'],
  ['Développé couché à la smith', '1', '52,5kg x 11 ; 47,4kg x 11 ; 47,5kgx8', 'OUI'],
  ['Tirage horizontal machine', '0', '47,5kg x 9 ; 45kg x 9', 'OUI'],
  ['Écarté à la poulie sur banc', '0', '12 x 7,5kg ; 10 x 7,5kg ; 8 x 7,5kg', 'Maintenu'],
  ['Élévation latérale unilatéral cuff de poignet', '0', '7,5kg x 12 ; 7,5kg x 8 ; 6,25kg x 8', 'OUI'],
  ['Curl pupitre unilatéral avec haltères', '0', '12kg x 10 ; 12kg x 7', 'Regressé'],
  ['Overhead triceps extension cable', '0', '22,5kg x 7 ; 17,5kg x 9 ; 15kg x 9', 'OUI'],
  ['Rotation latérale abdos', '2', '', ''],
]
const MARDI = [
  ['Adductor machine', '0', '60kg x 6 ; 50kg x 8', 'Maintenu'],
  ['Seated leg curl', '0', '60kg x 8 ; 50kg x 9', 'Maintenu'],
  ['Pendulum', '1', '25kg x8 ; 25kg x 6', 'Maintenu'],
  ['Leg press', '1', '180kg x 8', 'OUI'],
  ['Leg extension', '0', '70kg x 8 ; 60kg x 6', 'OUI'],
  ['Extension mollet', '0', '', ''],
  ['Crunch poulie abdos', '0', '40kg x 8 ; 35kg x 8', 'Maintenu'],
]
const JEUDI = [
  ['Tirage vertical unilatéral', '0', '35kg x 6, 30KGX8', 'Maintenu'],
  ['Développé incliné à la smith', '1', '55kgx9 ; 47,5kg x 10 . 45kg x 8', 'OUI'],
  ['Tirage horizontal machine', '0', '47,5kg x 9 ; 45kg x 9', 'Maintenu'],
  ['Écarté à la poulie sur banc', '0', '12 x 7,5kg ; 10 x 7,5kg ; 8 x 7,5kg', 'Maintenu'],
  ['Élévation latérale unilatéral cuff de poignet', '0', '8,75kg x 6 ; 7,5kgx8 ; 6,25kg x 8', 'OUI'],
  ['Curl pupitre unilatéral avec haltères', '0', '14kgx7 ; 12kgx8 ; 12kgx6', 'OUI'],
  ['Overhead triceps extension cable', '0', '22,5kg x 7 ; 17,5kg x 10', 'OUI'],
  ['Rotation latérale abdos', '2', '', ''],
]
const VENDREDI = [
  ['Adductor machine', '0', '60kg x 7 ; 50kg x 9', 'OUI'],
  ['Seated leg curl', '0', '65kg x 6 ; 55kg x 7 ; 50kg x 7', 'OUI'],
  ['Stiff leg deadlift', '1', 'skip a cause du doigt', ''],
  ['Leg press', '1', '70kg x 9 ; 62,5kg x 8', 'OUI'],
  ['Leg extension', '0', '75kg x 7 ; 65kg x 7', 'OUI'],
  ['Extension mollet', '0', '', ''],
  ['Crunch poulie abdos', '0', 'demain sur seance cardio', ''],
]

/** « Entraînement » : bloc « Semaine N » (B→I), bandeaux de jour, en-têtes, exercices, lignes vides avec liste déroulante. */
function trainingBlock(sh: MockSheet, n: number, dc: number, withPerf: boolean) {
  const c = (col: number) => col + dc
  sh.set(3, c(2), `Semaine ${n}`)
  const day = (bandRow: number, label: string, bandCol: number, exos: string[][], rows: number, exerciseHeader: boolean) => {
    sh.set(bandRow, c(bandCol), label)
    if (exerciseHeader) sh.set(bandRow + 1, c(2), 'Exercise')
    sh.set(bandRow + 1, c(6), 'Intensité (RIR)')
    sh.set(bandRow + 1, c(7), 'POIDS X REPS')
    sh.set(bandRow + 1, c(8), 'RIR')
    sh.set(bandRow + 1, c(9), 'Progressé en POIDS/ CHARGE ?')
    for (let i = 0; i < rows; i++) {
      const r = bandRow + 2 + i
      sh.rules.add(`${r},${c(9)}`)
      const e = exos[i]
      if (!e) continue
      sh.set(r, c(2), e[0])
      sh.set(r, c(6), e[1])
      if (withPerf) {
        sh.set(r, c(7), e[2])
        sh.set(r, c(9), e[3])
      }
    }
  }
  day(7, 'LUNDI', 7, LUNDI, 10, true)
  day(19, 'MARDI', 7, MARDI, 10, false)
  day(32, 'JEUDI', 7, JEUDI, 10, true)
  day(45, 'VENDREDI', 7, VENDREDI, 10, true)
}

function coachSheet(opts: { weeksInTraining: number } = { weeksInTraining: 2 }) {
  const suivi = suiviJournalier()
  const entr = new MockSheet('Entraînement')
  for (let n = 1; n <= opts.weeksInTraining; n++) trainingBlock(entr, n, 9 * (n - 1), n === 1)
  return { ss: new MockSpreadsheet('Coaching Marc', [new MockSheet('Page d’accueil'), suivi, entr, new MockSheet('Checkins')]), suivi, entr }
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
  assert.equal(get({ action: 'pas', steps: '1200' }).date, iso(new Date()))
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
  assert.deepEqual([ping.coach.ok, ping.coach.nom, ping.coach.suivi, ping.coach.semaines], [true, 'Coaching Marc', true, [1, 2]])

  const r = post({ action: 'push', days: [day('2026-11-22')] })
  assert.equal(r.coach.ok, true, JSON.stringify(r.coach))
  const row = 11 + 8 * 7 + 2 // semaine 8 (20 → 26 nov.), 22 nov. = 3e jour
  assert.equal(String(suivi.get(row, COL.C)), new Date(2026, 10, 22).toString())
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

test('Coach : lecture du programme (onglet Entraînement) pour l’import dans l’app', () => {
  const { ss } = coachSheet()
  const { get } = load({ coach: ss })
  const p = get({ action: 'programme' })
  assert.equal(p.ok, true, JSON.stringify(p))
  assert.equal(p.semaine, 1, 'dernière semaine remplie')
  assert.equal(p.debut, '2026-10-02')
  assert.deepEqual(p.seances.map((s: { jour: string }) => s.jour), ['LUNDI', 'MARDI', 'JEUDI', 'VENDREDI'])
  assert.deepEqual(p.seances.map((s: { date: string }) => s.date), ['2026-10-05', '2026-10-06', '2026-10-08', '2026-10-02'])
  assert.equal(p.seances[0].exercices.length, 8)
  assert.deepEqual(p.seances[0].exercices[1], { nom: 'Développé couché à la smith', rir: '1', perf: '52,5kg x 11 ; 47,4kg x 11 ; 47,5kgx8' })
  assert.equal(p.seances[1].exercices.length, 7)
  assert.equal(p.seances[3].exercices[2].perf, 'skip a cause du doigt')
})

const upperA = (date: string, extra: Record<string, unknown> = {}) => ({
  id: 'w-upper',
  date,
  nom: 'Upper A',
  jourCoach: 'LUNDI',
  exercices: [
    { nom: 'Développé couché à la smith', perf: '55kg x 10 ; 50kg x 11 ; 50kg x 9', progres: 'OUI', note: '' },
    { nom: 'Curl pupitre unilatéral avec haltères', perf: '12kg x 11 ; 12kg x 9', progres: 'Maintenu', note: '' },
    { nom: 'Rotation latérale abdos', perf: '', progres: '', note: 'pas le temps' },
    { nom: 'Pull-over poulie', perf: '30kg x 12', progres: '', note: '' },
  ],
  ...extra,
})

test('Coach : séance écrite dans le bloc de la bonne semaine et le bon jour', () => {
  const { ss, entr } = coachSheet({ weeksInTraining: 2 })
  const { post } = load({ coach: ss })
  const r = post({ action: 'push', sessions: [upperA('2026-10-12')] }) // 12 oct. = semaine 2
  assert.equal(r.coach.ok, true, JSON.stringify(r.coach))
  const K = 9 // décalage du bloc « Semaine 2 » (colonnes K → R)
  assert.equal(entr.get(10, 7 + K), '55kg x 10 ; 50kg x 11 ; 50kg x 9')
  assert.equal(entr.get(10, 9 + K), 'OUI')
  assert.equal(entr.get(14, 7 + K), '12kg x 11 ; 12kg x 9')
  assert.equal(entr.get(14, 9 + K), 'Maintenu')
  assert.equal(entr.get(16, 7 + K), 'pas le temps', 'exercice sauté : la note est écrite')
  assert.equal(entr.get(17, 2 + K), 'Pull-over poulie', 'exercice ajouté sur la première ligne libre du jour')
  assert.equal(entr.get(17, 7 + K), '30kg x 12')
  assert.equal(entr.get(10, 7), '52,5kg x 11 ; 47,4kg x 11 ; 47,5kgx8', 'la semaine 1 reste intacte')
})

test('Coach : sans jour lié, le bon bandeau est retrouvé par les exercices', () => {
  const { ss, entr } = coachSheet({ weeksInTraining: 2 })
  const { post } = load({ coach: ss })
  post({ action: 'push', sessions: [{ id: 'w2', date: '2026-10-13', nom: 'Séance libre', exercices: [{ nom: 'Leg press', perf: '190kg x 8', progres: 'OUI' }, { nom: 'Seated leg curl', perf: '65kg x 8', progres: 'OUI' }] }] })
  assert.equal(entr.get(24, 7 + 9), '190kg x 8', 'MARDI (1er bandeau avec ces exercices)')
  assert.equal(entr.get(22, 7 + 9), '65kg x 8')
})

test('Coach : un seul tableau « Semaine 1 » → réécrit chaque semaine ; semaine manquante signalée sinon', () => {
  const single = coachSheet({ weeksInTraining: 1 })
  const a = load({ coach: single.ss })
  const r1 = a.post({ action: 'push', sessions: [upperA('2026-11-23')] })
  assert.equal(r1.coach.ok, true, JSON.stringify(r1.coach))
  assert.equal(single.entr.get(10, 7), '55kg x 10 ; 50kg x 11 ; 50kg x 9')

  const multi = coachSheet({ weeksInTraining: 2 })
  const b = load({ coach: multi.ss })
  const r2 = b.post({ action: 'push', sessions: [upperA('2026-11-23')] })
  assert.equal(r2.coach.ok, false)
  assert.match(r2.coach.message, /Semaine 8 absente/)
  assert.equal(multi.entr.writes.length, 0)
})
