/**
 * FORGE — pont entre l'app et Google Sheets
 * ------------------------------------------------------------
 * Ce script reçoit les données de l'app Forge (séances, diète, pesées, bilans)
 * et les pas envoyés par le Raccourci iOS, les range dans CE Google Sheet,
 * puis recopie les chiffres utiles dans le sheet de ton coach.
 *
 * Installation (une seule fois) :
 *  1. Dans ton Google Sheet : Extensions > Apps Script, colle tout ce fichier.
 *  2. Remplace COLLE_TON_JETON_ICI par le jeton affiché dans l'app (Profil > Google Sheets).
 *  3. Enregistrer, puis Déployer > Nouveau déploiement > Application Web :
 *       Exécuter en tant que : Moi — Qui a accès : Tout le monde.
 *  4. Copie l'URL qui finit par /exec dans l'app et touche « Tester et relier ».
 *
 * Après une modification du script : Déployer > Gérer les déploiements > ✏️ >
 * Version : « Nouvelle version » (l'URL ne change pas).
 */

// ===================== CONFIGURATION =====================

/** Jeton secret : le même que dans l'app. */
const TOKEN = 'COLLE_TON_JETON_ICI';

/** URL du Google Sheet de ton coach (il doit te l'avoir partagé en modification). Laisse vide pour l'instant. */
const COACH_SHEET_URL = '';

/**
 * Correspondance avec le sheet du coach. null = désactivé.
 * Indicateurs disponibles pour une journée :
 *   poids, poidsMoyenSemaine, kcal, proteines, glucides, lipides, fibres, pas,
 *   seance, tonnage, dureeSeanceMin, typeJour, objectifKcal, objectifProteines,
 *   objectifGlucides, objectifLipides, objectifPas
 * Pour un bilan : taille, hanches, poitrine, bras, cuisse, mollet, cou,
 *   energie, sommeil, faim, stress, digestion, note
 *
 * Exemple A — une ligne par jour, la date en colonne A :
 *   const COACH_MAPPING = {
 *     jours: {
 *       onglet: 'Suivi', disposition: 'lignes', colonneDate: 'A', premiereLigne: 2,
 *       colonnes: { poids: 'B', pas: 'C', kcal: 'D', proteines: 'E', glucides: 'F', lipides: 'G', seance: 'H' },
 *       creerSiAbsent: true,
 *     },
 *   };
 *
 * Exemple B — un onglet par semaine, une colonne par jour, une ligne par mesure :
 *   const COACH_MAPPING = {
 *     jours: {
 *       onglet: '*', disposition: 'colonnes', ligneDate: 3,
 *       lignes: { poids: 5, pas: 6, kcal: 7, proteines: 8, glucides: 9, lipides: 10, seance: 12 },
 *     },
 *     bilans: {
 *       onglet: 'Bilans', disposition: 'lignes', colonneDate: 'A', premiereLigne: 2, correspondance: 'semaine',
 *       colonnes: { poidsMoyenSemaine: 'B', taille: 'C', hanches: 'D', bras: 'E', cuisse: 'F', note: 'K' },
 *     },
 *   };
 */
const COACH_MAPPING = null;

// =========================================================

const VERSION = 1;
const TZ = Session.getScriptTimeZone() || 'Europe/Paris';

const TABS = {
  jours: ['Date', 'Poids (kg)', 'Poids moy. semaine', 'Kcal', 'Protéines (g)', 'Glucides (g)', 'Lipides (g)', 'Fibres (g)', 'Objectif kcal', 'Objectif P', 'Objectif G', 'Objectif L', 'Pas', 'Objectif pas', 'Séance', 'Tonnage (kg)', 'Durée séance (min)', 'Type de jour', 'Mis à jour'],
  seances: ['ID', 'Date', 'Séance', 'Durée (min)', 'Tonnage (kg)', 'Séries', 'Exercice', 'Groupe', 'Séries réalisées', 'Note exercice', 'Note séance'],
  series: ['ID', 'Date', 'Séance', 'Exercice', 'N°', 'Type', 'Charge (kg)', 'Reps', 'Durée (s)', 'Km'],
  repas: ['Date', 'Repas', 'Aliment', 'Marque', 'Quantité (g/ml)', 'Portion', 'Kcal', 'Protéines (g)', 'Glucides (g)', 'Lipides (g)'],
  pas: ['Date', 'Pas', 'Source', 'Reçu le', 'Horodatage'],
  bilans: ['ID', 'Date', 'Taille', 'Hanches', 'Poitrine', 'Bras', 'Cuisse', 'Mollet', 'Cou', 'Énergie', 'Sommeil', 'Faim', 'Stress', 'Digestion', 'Photos', 'Commentaire'],
};
const TAB_NAMES = { jours: 'Jours', seances: 'Séances', series: 'Détail séries', repas: 'Repas', pas: 'Pas', bilans: 'Bilans' };

// ---------------------------------------------------------------- points d'entrée

function doGet(e) {
  return handle_(e, null);
}

function doPost(e) {
  let body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    return json_({ ok: false, error: 'JSON invalide' });
  }
  return handle_(e, body);
}

function handle_(e, body) {
  const p = Object.assign({}, (e && e.parameter) || {}, body || {});
  if (!TOKEN || TOKEN === 'COLLE_TON_JETON_ICI') return json_({ ok: false, error: 'Colle ton jeton dans la constante TOKEN du script, puis redéploie.' });
  if (String(p.token || '') !== TOKEN) return json_({ ok: false, error: 'Jeton invalide : vérifie qu’il est identique dans l’app et dans le script.' });
  const action = String(p.action || 'ping');
  try {
    if (action === 'ping') return json_({ ok: true, version: VERSION, sheet: ss_().getName(), coach: !!(COACH_SHEET_URL && COACH_MAPPING) });
    if (action === 'steps') return json_({ ok: true, steps: readSteps_(p.since) });
    if (action === 'pas' || action === 'steps_in') return json_(withLock_(function () { return receiveSteps_(p); }));
    if (action === 'push') return json_(withLock_(function () { return push_(body || {}); }));
    return json_({ ok: false, error: 'Action inconnue : ' + action });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

// ---------------------------------------------------------------- pas (Raccourci iOS)

function receiveSteps_(p) {
  const raw = String(p.steps == null ? '' : p.steps).replace(/[\s  ]/g, '').replace(',', '.');
  const steps = Math.round(parseFloat(raw));
  if (!isFinite(steps) || steps < 0 || steps > 200000) return { ok: false, error: 'Nombre de pas invalide : ' + p.steps };
  const date = isoOk_(p.date) ? String(p.date) : todayIso_();
  const now = Date.now();
  upsert_(tab_('pas'), 1, date, [toDate_(date), steps, 'Santé', new Date(now), now]);
  setDayCell_(date, 'Pas', steps);
  let coach = null;
  try {
    coach = writeCoachDays_([{ date: date, pas: steps }]);
  } catch (err) {
    coach = { ok: false, message: String((err && err.message) || err) };
  }
  return { ok: true, date: date, steps: steps, coach: coach };
}

function readSteps_(since) {
  const sh = tab_('pas');
  const last = sh.getLastRow();
  if (last < 2) return [];
  const rows = sh.getRange(2, 1, last - 1, 5).getValues();
  const from = isoOk_(since) ? String(since) : '0000-00-00';
  const out = [];
  rows.forEach(function (r) {
    const d = iso_(r[0]);
    if (!d || d < from) return;
    out.push({ date: d, steps: Number(r[1]) || 0, at: Number(r[4]) || (r[3] instanceof Date ? r[3].getTime() : 0), source: String(r[2] || '') });
  });
  return out;
}

function stepsMap_() {
  const m = {};
  readSteps_().forEach(function (s) {
    m[s.date] = s;
  });
  return m;
}

// ---------------------------------------------------------------- envoi de l'app

function push_(body) {
  const days = body.days || [];
  const sessions = body.sessions || [];
  const bilans = body.bilans || [];
  const stepsByDate = stepsMap_();

  days.forEach(function (d) {
    if (!isoOk_(d.date)) return;
    // Les pas : la valeur la plus récente gagne (app ou Raccourci).
    const stored = stepsByDate[d.date];
    let pas = d.pas;
    if (d.pas != null && (!stored || Number(d.pasMaj || 0) > Number(stored.at || 0))) {
      upsert_(tab_('pas'), 1, d.date, [toDate_(d.date), d.pas, 'App', new Date(Number(d.pasMaj) || Date.now()), Number(d.pasMaj) || Date.now()]);
    } else if (stored) {
      pas = stored.steps;
    }
    d.pas = pas;
    upsert_(tab_('jours'), 1, d.date, [
      toDate_(d.date), num_(d.poids), num_(d.poidsMoyenSemaine), num_(d.kcal), num_(d.proteines), num_(d.glucides), num_(d.lipides), num_(d.fibres),
      num_(d.objectifKcal), num_(d.objectifProteines), num_(d.objectifGlucides), num_(d.objectifLipides),
      num_(pas), num_(d.objectifPas), d.seance || '', num_(d.tonnage), num_(d.dureeSeanceMin), d.typeJour || '', new Date(),
    ]);
    const meals = (d.repas || []).map(function (m) {
      return [toDate_(d.date), m.repas || '', m.aliment || '', m.marque || '', num_(m.quantite), m.portion || '', num_(m.kcal), num_(m.proteines), num_(m.glucides), num_(m.lipides)];
    });
    replaceRows_(tab_('repas'), 1, d.date, meals);
  });

  sessions.forEach(function (s) {
    if (!s || !s.id) return;
    if (s.deleted) {
      replaceRows_(tab_('seances'), 1, s.id, []);
      replaceRows_(tab_('series'), 1, s.id, []);
      return;
    }
    const exRows = (s.exercices || []).map(function (ex, i) {
      return [s.id, toDate_(s.date), s.nom || '', num_(s.dureeMin), num_(s.tonnage), num_(s.series), ex.nom || '', ex.groupe || '', ex.resume || '', ex.note || '', i === 0 ? s.note || '' : ''];
    });
    replaceRows_(tab_('seances'), 1, s.id, exRows);
    const setRows = [];
    (s.exercices || []).forEach(function (ex) {
      (ex.series || []).forEach(function (st) {
        setRows.push([s.id, toDate_(s.date), s.nom || '', ex.nom || '', st.n, st.type || '', num_(st.charge), num_(st.reps), num_(st.duree), num_(st.km)]);
      });
    });
    replaceRows_(tab_('series'), 1, s.id, setRows);
  });

  bilans.forEach(function (b) {
    if (!b || !b.id) return;
    if (b.deleted) {
      replaceRows_(tab_('bilans'), 1, b.id, []);
      return;
    }
    const m = b.mensurations || {};
    const r = b.ressenti || {};
    upsert_(tab_('bilans'), 1, b.id, [b.id, toDate_(b.date), num_(m.taille), num_(m.hanches), num_(m.poitrine), num_(m.bras), num_(m.cuisse), num_(m.mollet), num_(m.cou), num_(r.energie), num_(r.sommeil), num_(r.faim), num_(r.stress), num_(r.digestion), num_(b.photos), b.note || '']);
  });

  let coach = null;
  if (COACH_SHEET_URL && COACH_MAPPING) {
    try {
      const a = writeCoachDays_(days);
      const b = writeCoachBilans_(bilans.filter(function (x) { return !x.deleted; }), days);
      coach = { ok: a.ok && b.ok, message: [a.message, b.message].filter(String).join(' · '), cells: (a.cells || 0) + (b.cells || 0) };
    } catch (err) {
      coach = { ok: false, message: String((err && err.message) || err) };
    }
  }
  return { ok: true, written: { days: days.length, sessions: sessions.length, bilans: bilans.length }, coach: coach };
}

// ---------------------------------------------------------------- sheet du coach

function coachSs_() {
  return SpreadsheetApp.openByUrl(COACH_SHEET_URL);
}

function writeCoachDays_(days) {
  const cfg = COACH_MAPPING && COACH_MAPPING.jours;
  if (!COACH_SHEET_URL || !cfg || !days.length) return { ok: true, message: '', cells: 0 };
  const ss = coachSs_();
  let cells = 0;
  const missing = [];
  days.forEach(function (d) {
    if (!isoOk_(d.date)) return;
    const n = writeCoachRecord_(ss, cfg, d.date, d);
    if (n < 0) missing.push(d.date);
    else cells += n;
  });
  return { ok: missing.length === 0, message: missing.length ? 'date(s) absente(s) du sheet du coach : ' + missing.join(', ') : '', cells: cells };
}

function writeCoachBilans_(bilans, days) {
  const cfg = COACH_MAPPING && COACH_MAPPING.bilans;
  if (!COACH_SHEET_URL || !cfg || !bilans.length) return { ok: true, message: '', cells: 0 };
  const ss = coachSs_();
  let cells = 0;
  const missing = [];
  bilans.forEach(function (b) {
    const day = (days || []).filter(function (d) { return d.date === b.date; })[0] || {};
    const values = Object.assign({ poidsMoyenSemaine: day.poidsMoyenSemaine, note: b.note }, b.mensurations || {}, b.ressenti || {});
    const n = writeCoachRecord_(ss, cfg, b.date, values);
    if (n < 0) missing.push(b.date);
    else cells += n;
  });
  return { ok: missing.length === 0, message: missing.length ? 'bilan(s) sans ligne chez le coach : ' + missing.join(', ') : '', cells: cells };
}

/** Écrit les valeurs d'un enregistrement daté. Renvoie le nombre de cellules écrites, ou -1 si la date est introuvable. */
function writeCoachRecord_(ss, cfg, date, values) {
  const weekly = cfg.correspondance === 'semaine';
  const sheets = cfg.onglet === '*' ? ss.getSheets() : [ss.getSheetByName(cfg.onglet)];
  if (!sheets[0]) throw new Error('Onglet « ' + cfg.onglet + ' » introuvable dans le sheet du coach');
  let written = 0;

  if (cfg.disposition === 'colonnes') {
    const dateRow = Number(cfg.ligneDate);
    for (let i = 0; i < sheets.length; i++) {
      const sh = sheets[i];
      const lastCol = sh.getLastColumn();
      if (lastCol < 1 || sh.getLastRow() < dateRow) continue;
      const header = sh.getRange(dateRow, 1, 1, lastCol).getValues()[0];
      const col = findDateIndex_(header, date, weekly);
      if (col < 0) continue;
      Object.keys(cfg.lignes || {}).forEach(function (k) {
        const v = values[k];
        if (v == null || v === '') return;
        sh.getRange(Number(cfg.lignes[k]), col + 1).setValue(v);
        written++;
      });
      return written;
    }
    return -1;
  }

  // disposition "lignes" (par défaut)
  const dateCol = colIndex_(cfg.colonneDate || 'A');
  const first = Number(cfg.premiereLigne || 2);
  for (let i = 0; i < sheets.length; i++) {
    const sh = sheets[i];
    const last = sh.getLastRow();
    let row = -1;
    if (last >= first) {
      const col = sh.getRange(first, dateCol, last - first + 1, 1).getValues().map(function (r) { return r[0]; });
      const idx = findDateIndex_(col, date, weekly);
      if (idx >= 0) row = first + idx;
    }
    if (row < 0) {
      if (!cfg.creerSiAbsent || i < sheets.length - 1 || weekly) continue;
      row = Math.max(last + 1, first);
      sh.getRange(row, dateCol).setValue(toDate_(date));
    }
    Object.keys(cfg.colonnes || {}).forEach(function (k) {
      const v = values[k];
      if (v == null || v === '') return;
      sh.getRange(row, colIndex_(cfg.colonnes[k])).setValue(v);
      written++;
    });
    return written;
  }
  return -1;
}

/** Cherche une date dans une liste de cellules (dates Google, "22/11/2026", "22/11", "2026-11-22"…). */
function findDateIndex_(cells, date, weekly) {
  const target = toDate_(date).getTime();
  const year = Number(date.slice(0, 4));
  for (let i = 0; i < cells.length; i++) {
    const d = parseCellDate_(cells[i], year);
    if (!d) continue;
    const t = toDate_(d).getTime();
    if (!weekly && t === target) return i;
    if (weekly && target >= t && target < t + 7 * 86400000) return i;
  }
  return -1;
}

function parseCellDate_(v, year) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  const s = String(v || '').trim();
  if (!s) return null;
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + '-' + pad_(m[2]) + '-' + pad_(m[3]);
  m = s.match(/(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?/);
  if (m) {
    let y = m[3] ? Number(m[3]) : year;
    if (y < 100) y += 2000;
    return y + '-' + pad_(m[2]) + '-' + pad_(m[1]);
  }
  return null;
}

// ---------------------------------------------------------------- utilitaires sheets

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function tab_(key) {
  const ss = ss_();
  const name = TAB_NAMES[key];
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange(1, 1, 1, TABS[key].length).setValues([TABS[key]]).setFontWeight('bold');
    sh.setFrozenRows(1);
    if (key !== 'seances' && key !== 'series' && key !== 'bilans') sh.getRange('A:A').setNumberFormat('dd/mm/yyyy');
    else sh.getRange('B:B').setNumberFormat('dd/mm/yyyy');
  }
  return sh;
}

/** Remplace la ligne dont la colonne `keyCol` vaut `key` (ou l'ajoute). */
function upsert_(sh, keyCol, key, values) {
  const last = sh.getLastRow();
  if (last >= 2) {
    const keys = sh.getRange(2, keyCol, last - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (keyOf_(keys[i][0]) === key) {
        sh.getRange(i + 2, 1, 1, values.length).setValues([values]);
        return;
      }
    }
  }
  sh.appendRow(values);
}

/** Supprime toutes les lignes de clé `key` puis ajoute `rows`. */
function replaceRows_(sh, keyCol, key, rows) {
  const last = sh.getLastRow();
  if (last >= 2) {
    const keys = sh.getRange(2, keyCol, last - 1, 1).getValues();
    for (let i = keys.length - 1; i >= 0; i--) {
      if (keyOf_(keys[i][0]) !== key) continue;
      let start = i;
      while (start > 0 && keyOf_(keys[start - 1][0]) === key) start--;
      sh.deleteRows(start + 2, i - start + 1);
      i = start;
    }
  }
  if (rows.length) sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

function setDayCell_(date, header, value) {
  const sh = tab_('jours');
  const col = TABS.jours.indexOf(header) + 1;
  const last = sh.getLastRow();
  if (last >= 2) {
    const keys = sh.getRange(2, 1, last - 1, 1).getValues();
    for (let i = 0; i < keys.length; i++) {
      if (keyOf_(keys[i][0]) === date) {
        sh.getRange(i + 2, col).setValue(value);
        return;
      }
    }
  }
  const row = TABS.jours.map(function () { return ''; });
  row[0] = toDate_(date);
  row[col - 1] = value;
  sh.appendRow(row);
}

function keyOf_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  return String(v);
}

function iso_(v) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  const s = String(v || '');
  return isoOk_(s) ? s : null;
}

function isoOk_(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
}

function todayIso_() {
  return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
}

function toDate_(iso) {
  const p = String(iso).split('-').map(Number);
  return new Date(p[0], p[1] - 1, p[2]);
}

function num_(v) {
  if (v == null || v === '') return '';
  const n = Number(v);
  return isFinite(n) ? n : '';
}

function pad_(n) {
  return ('0' + n).slice(-2);
}

function colIndex_(letters) {
  if (typeof letters === 'number') return letters;
  let n = 0;
  String(letters).toUpperCase().replace(/[^A-Z]/g, '').split('').forEach(function (c) {
    n = n * 26 + (c.charCodeAt(0) - 64);
  });
  return n;
}

// ---------------------------------------------------------------- outils manuels

/** À lancer depuis l'éditeur pour créer les onglets (facultatif : ils se créent tout seuls). */
function setup() {
  Object.keys(TABS).forEach(tab_);
  Logger.log('Onglets prêts dans « %s ».', ss_().getName());
}

/** Affiche la structure du sheet du coach (onglets + premières lignes) pour régler COACH_MAPPING. */
function diagnosticCoach() {
  if (!COACH_SHEET_URL) {
    Logger.log('Renseigne COACH_SHEET_URL d’abord.');
    return;
  }
  coachSs_().getSheets().forEach(function (sh) {
    const rows = Math.min(sh.getLastRow(), 12);
    const cols = Math.min(sh.getLastColumn(), 14);
    Logger.log('=== Onglet « %s » (%s lignes × %s colonnes)', sh.getName(), sh.getLastRow(), sh.getLastColumn());
    if (rows && cols) {
      sh.getRange(1, 1, rows, cols).getDisplayValues().forEach(function (r, i) {
        Logger.log('%s | %s', i + 1, r.join(' | '));
      });
    }
  });
}
