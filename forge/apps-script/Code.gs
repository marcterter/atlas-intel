/**
 * FORGE — pont entre l'app et Google Sheets
 * ------------------------------------------------------------
 * Ce script reçoit les données de l'app Forge (séances, diète, pesées, ressenti, bilans)
 * et les pas envoyés par le Raccourci iOS, les range dans CE Google Sheet,
 * puis remplit le sheet de ton coach :
 *   - onglet « Suivi journalier » : une ligne par jour (poids, sommeil, pas, cardio,
 *     séance, ressenti, calories, macros, eau, notes) ;
 *   - onglet « Entraînement » : dans le bloc « Semaine N » de la semaine en cours et le
 *     bandeau du jour (LUNDI, MARDI…), sur la ligne de l'exercice : « POIDS X REPS »,
 *     « Progressé en POIDS/ CHARGE ? » (OUI / Maintenu / Regressé / Nouvel exo) et
 *     « Douleurs/ Notes ».
 * Il lit aussi, pour l'import dans l'app : le programme (séries, reps, RIR), les semaines
 * déjà remplies et les objectifs de l'onglet Nutrition (Jour ON / Jour off, pas).
 * Les lignes « Moyenne », les formules, la colonne Exercise et les cases du coach ne sont
 * jamais touchées.
 *
 * Installation (une seule fois) :
 *  1. Dans ton Google Sheet : Extensions > Apps Script, colle tout ce fichier
 *     (le bouton « Copier le script » de l'app le pré-remplit avec ton jeton et le lien du coach).
 *  2. Enregistrer, puis Déployer > Nouveau déploiement > Application Web :
 *       Exécuter en tant que : Moi — Qui a accès : Tout le monde.
 *  3. Copie l'URL qui finit par /exec dans l'app et touche « Tester et relier ».
 *
 * Après une modification du script : Déployer > Gérer les déploiements > ✏️ >
 * Version : « Nouvelle version » (l'URL ne change pas).
 */

// ===================== CONFIGURATION =====================

/** Jeton secret : le même que dans l'app. */
const TOKEN = 'COLLE_TON_JETON_ICI';

/** Lien du Google Sheet de ton coach (il doit te l'avoir partagé en modification). Vide = désactivé. */
const COACH_SHEET_URL = '';

/**
 * Où écrire chaque chiffre dans le sheet du coach.
 *
 * jours : une ligne par jour, dates dans `colonneDate` à partir de `premiereLigne`.
 *   Indicateurs disponibles : poids, sommeil, qualiteSommeil, pas, cardio (minutes),
 *   entrainement (nom de la séance), energie, motivation, satiete, digestion,
 *   kcal, proteines, glucides, lipides, fibres, eau, notes, poidsMoyenSemaine.
 *   `colonneSemaine` : colonne où sont écrits « Semaine 1 », « Semaine 2 »… (sert à
 *   retrouver le bon bloc de l'onglet Entraînement).
 *
 * entrainement : onglet des performances. Le script y repère seul les blocs
 *   « Semaine N », les bandeaux de jour (LUNDI…) et les colonnes par leurs titres
 *   (« Exercise », « POIDS X REPS », « RIR », « Progressé en POIDS/ CHARGE ? »).
 */
const COACH_MAPPING = {
  jours: {
    onglet: 'Suivi journalier',
    colonneDate: 'C',
    colonneSemaine: 'B',
    // « Nutrition Phase » remplie par le coach (Sèche…) : reprise comme objectif dans l'app.
    colonnePhase: 'E',
    premiereLigne: 11,
    colonnes: {
      poids: 'G',
      sommeil: 'H',
      qualiteSommeil: 'I',
      pas: 'K',
      cardio: 'L',
      entrainement: 'M',
      energie: 'O',
      motivation: 'P',
      satiete: 'Q',
      digestion: 'R',
      kcal: 'T',
      proteines: 'U',
      glucides: 'V',
      lipides: 'W',
      fibres: 'X',
      eau: 'Y',
      notes: 'AC',
    },
  },
  entrainement: {
    onglet: 'Entraînement',
  },
  nutrition: {
    onglet: 'Nutrition',
  },
};

// =========================================================

const VERSION = 7;
const TZ = Session.getScriptTimeZone() || 'Europe/Paris';

const TABS = {
  jours: ['Date', 'Poids (kg)', 'Poids moy. semaine', 'Sommeil (h)', 'Qualité sommeil', 'Énergie', 'Motivation', 'Satiété', 'Digestion', 'Eau (L)', 'Kcal', 'Protéines (g)', 'Glucides (g)', 'Lipides (g)', 'Fibres (g)', 'Objectif kcal', 'Objectif P', 'Objectif G', 'Objectif L', 'Pas', 'Objectif pas', 'Séance', 'Cardio (min)', 'Tonnage (kg)', 'Durée séance (min)', 'Type de jour', 'Notes', 'Mis à jour'],
  seances: ['ID', 'Date', 'Séance', 'Durée (min)', 'Tonnage (kg)', 'Séries', 'Exercice', 'Groupe', 'Séries réalisées', 'Progressé ?', 'Note exercice', 'Note séance'],
  series: ['ID', 'Date', 'Séance', 'Exercice', 'N°', 'Type', 'Charge (kg)', 'Reps', 'Durée (s)', 'Km'],
  repas: ['Date', 'Repas', 'Aliment', 'Marque', 'Quantité (g/ml)', 'Portion', 'Kcal', 'Protéines (g)', 'Glucides (g)', 'Lipides (g)'],
  pas: ['Date', 'Pas', 'Source', 'Reçu le', 'Horodatage'],
  bilans: ['ID', 'Date', 'Taille', 'Hanches', 'Poitrine', 'Bras', 'Cuisse', 'Mollet', 'Cou', 'Photos', 'Commentaire'],
  conseils: ['Semaine du', 'Généré le', 'Conseils'],
  contexte: ['Clé', 'Mis à jour', 'Contexte (JSON)'],
};
const TAB_NAMES = { jours: 'Jours', seances: 'Séances', series: 'Détail séries', repas: 'Repas', pas: 'Pas', bilans: 'Bilans', conseils: 'Conseils IA', contexte: 'Contexte' };

/** Actions permises avec le jeton de l'agent IA : lire la semaine, déposer ses conseils. */
const IA_ACTIONS = ['ping', 'semaine', 'conseils_set'];

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = { janv: 1, janvier: 1, fevr: 2, fevrier: 2, mars: 3, avr: 4, avril: 4, mai: 5, juin: 6, juil: 7, juillet: 7, aout: 8, sept: 9, septembre: 9, oct: 10, octobre: 10, nov: 11, novembre: 11, dec: 12, decembre: 12 };

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
  resetCaches_();
  const p = Object.assign({}, (e && e.parameter) || {}, body || {});
  if (!TOKEN || TOKEN === 'COLLE_TON_JETON_ICI') return json_({ ok: false, error: 'Colle ton jeton dans la constante TOKEN du script, puis redéploie.' });
  const token = String(p.token || '');
  const ia = token !== TOKEN && token !== '' && token === tokenIa_();
  if (token !== TOKEN && !ia) return json_({ ok: false, error: 'Jeton invalide : vérifie qu’il est identique dans l’app et dans le script.' });
  const action = String(p.action || 'ping');
  if (ia && IA_ACTIONS.indexOf(action) < 0) return json_({ ok: false, error: 'Action non autorisée pour l’agent IA : ' + action });
  try {
    if (action === 'ping') return json_({ ok: true, version: VERSION, sheet: ss_().getName(), coach: coachSummary_() });
    if (action === 'semaine') return json_(Object.assign({ ok: true }, exportWeek_(p)));
    if (action === 'conseils') return json_(Object.assign({ ok: true }, readConseils_()));
    if (action === 'conseils_set') return json_(withLock_(function () { return saveConseils_(p); }));
    if (action === 'steps') return json_({ ok: true, steps: readSteps_(p.since) });
    if (action === 'pas' || action === 'steps_in') return json_(withLock_(function () { return receiveSteps_(p); }));
    if (action === 'push') return json_(withLock_(function () { return push_(body || {}); }));
    if (action === 'programme') return json_(Object.assign({ ok: true }, readCoachProgram_()));
    return json_({ ok: false, error: 'Action inconnue : ' + action });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

/**
 * Jeton de l'agent IA du lundi, dérivé du jeton principal (l'app le calcule de la même façon) : il ne
 * permet que de lire la semaine et de déposer des conseils, jamais d'écrire dans tes onglets.
 */
function tokenIa_() {
  if (!TOKEN || TOKEN === 'COLLE_TON_JETON_ICI') return '';
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'forge-ia:' + TOKEN, Utilities.Charset.UTF_8);
  return Utilities.base64EncodeWebSafe(bytes).slice(0, 24);
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
      toDate_(d.date), num_(d.poids), num_(d.poidsMoyenSemaine), num_(d.sommeil), num_(d.qualiteSommeil), num_(d.energie), num_(d.motivation),
      num_(d.satiete), num_(d.digestion), num_(d.eau), num_(d.kcal), num_(d.proteines), num_(d.glucides), num_(d.lipides), num_(d.fibres),
      num_(d.objectifKcal), num_(d.objectifProteines), num_(d.objectifGlucides), num_(d.objectifLipides),
      num_(pas), num_(d.objectifPas), d.entrainement || d.seance || '', num_(d.cardio), num_(d.tonnage), num_(d.dureeSeanceMin), d.typeJour || '', d.notes || '', new Date(),
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
      return [s.id, toDate_(s.date), s.nom || '', num_(s.dureeMin), num_(s.tonnage), num_(s.series), ex.nom || '', ex.groupe || '', ex.resume || '', ex.progres || '', ex.note || '', i === 0 ? s.note || '' : ''];
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

  // Contexte pour l'agent IA (objectif, cibles ON / OFF, programme) : une seule ligne, remplacée à chaque envoi.
  if (body.contexte && typeof body.contexte === 'object') {
    upsert_(tab_('contexte'), 1, 'forge', ['forge', new Date(), JSON.stringify(body.contexte)]);
  }

  bilans.forEach(function (b) {
    if (!b || !b.id) return;
    if (b.deleted) {
      replaceRows_(tab_('bilans'), 1, b.id, []);
      return;
    }
    const m = b.mensurations || {};
    upsert_(tab_('bilans'), 1, b.id, [b.id, toDate_(b.date), num_(m.taille), num_(m.hanches), num_(m.poitrine), num_(m.bras), num_(m.cuisse), num_(m.mollet), num_(m.cou), num_(b.photos), b.note || '']);
  });

  let coach = null;
  if (COACH_SHEET_URL && COACH_MAPPING) {
    const parts = [];
    const infos = [];
    let ok = true;
    let cells = 0;
    const run = function (fn) {
      try {
        const r = fn();
        ok = ok && r.ok;
        cells += r.cells || 0;
        if (r.message) parts.push(r.message);
        if (r.info) infos.push(r.info);
        return r;
      } catch (err) {
        ok = false;
        parts.push(String((err && err.message) || err));
        return null;
      }
    };
    // L'entraînement d'abord : ses exercices hors programme vont dans les notes du jour.
    const training = run(function () { return writeCoachTraining_(sessions.filter(function (s) { return s && !s.deleted; })); });
    run(function () { return writeCoachDays_(days, (training && training.extras) || {}); });
    coach = { ok: ok, message: parts.join(' · '), info: infos.join(' · '), cells: cells };
  }
  return { ok: true, version: VERSION, written: { days: days.length, sessions: sessions.length, bilans: bilans.length }, coach: coach };
}

// ---------------------------------------------------------------- agent IA du lundi

/**
 * Les dernières semaines pour l'agent IA : journées (diète, pas, poids, sommeil, ressenti, cardio, notes),
 * séances (exercices, séries, progression), repas des 14 derniers jours, pesées de bilan, contexte envoyé
 * par l'app, programme de la semaine du coach et conseils précédents.
 */
function exportWeek_(p) {
  const days = Math.min(56, Math.max(7, Number(p.jours) || 28));
  const since = isoDaysAgo_(days);
  const conseils = readConseils_();
  return {
    version: VERSION,
    aujourdhui: todayIso_(),
    depuis: since,
    contexte: readContexte_(),
    jours: tabRows_('jours', 0, since),
    seances: tabRows_('seances', 1, since),
    repas: tabRows_('repas', 0, isoDaysAgo_(14)),
    bilans: tabRows_('bilans', 1, isoDaysAgo_(120)),
    programme: safeProgramme_(),
    conseilsPrecedents: conseils.precedents.concat(conseils.conseils ? [conseils.conseils] : []).slice(-3),
  };
}

function isoDaysAgo_(n) {
  return Utilities.formatDate(new Date(Date.now() - n * 86400000), TZ, 'yyyy-MM-dd');
}

/** Lignes d'un onglet depuis une date, en objets { en-tête: valeur } (dates en AAAA-MM-JJ). */
function tabRows_(key, dateCol, since) {
  const sh = ss_().getSheetByName(TAB_NAMES[key]);
  if (!sh) return [];
  const last = sh.getLastRow();
  if (last < 2) return [];
  const head = TABS[key];
  return sh
    .getRange(2, 1, last - 1, head.length)
    .getValues()
    .filter(function (r) {
      const d = iso_(r[dateCol]);
      return d && d >= since;
    })
    .map(function (r) {
      const o = {};
      head.forEach(function (h, i) {
        const v = r[i];
        if (v === '' || v == null) return;
        o[h] = v instanceof Date ? Utilities.formatDate(v, TZ, i === dateCol ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'HH:mm") : v;
      });
      return o;
    });
}

function readContexte_() {
  const sh = ss_().getSheetByName(TAB_NAMES.contexte);
  if (!sh || sh.getLastRow() < 2) return null;
  try {
    return JSON.parse(String(sh.getRange(2, 3, 1, 1).getValues()[0][0] || 'null'));
  } catch (err) {
    return null;
  }
}

function safeProgramme_() {
  if (!COACH_SHEET_URL) return null;
  try {
    const p = readCoachProgram_();
    return { semaine: p.semaine, seances: p.seances };
  } catch (err) {
    return null;
  }
}

/** Conseils de l'agent IA, rangés par semaine (lundi). */
function saveConseils_(p) {
  const texte = String(p.texte || '').trim();
  if (!texte) return { ok: false, error: 'Conseils vides' };
  const semaine = isoOk_(p.semaine) ? String(p.semaine) : todayIso_();
  upsert_(tab_('conseils'), 1, semaine, [toDate_(semaine), new Date(), texte.slice(0, 45000)]);
  return { ok: true, semaine: semaine };
}

function readConseils_() {
  const sh = ss_().getSheetByName(TAB_NAMES.conseils);
  if (!sh || sh.getLastRow() < 2) return { conseils: null, precedents: [] };
  const rows = sh
    .getRange(2, 1, sh.getLastRow() - 1, 3)
    .getValues()
    .map(function (r) {
      return { semaine: iso_(r[0]), date: r[1] instanceof Date ? r[1].toISOString() : String(r[1] || ''), texte: String(r[2] || '') };
    })
    .filter(function (x) { return x.semaine && x.texte; })
    .sort(function (a, b) { return a.semaine < b.semaine ? 1 : -1; });
  return { conseils: rows[0] || null, precedents: rows.slice(1, 3).reverse() };
}

// ---------------------------------------------------------------- sheet du coach : journées

let coachSsCache_ = null;

function resetCaches_() {
  coachSsCache_ = null;
  trainingCache_ = null;
  Object.keys(dayRowCache_).forEach(function (k) {
    delete dayRowCache_[k];
  });
  Object.keys(weekStartCache_).forEach(function (k) {
    delete weekStartCache_[k];
  });
}

function coachSs_() {
  if (!coachSsCache_) coachSsCache_ = SpreadsheetApp.openByUrl(COACH_SHEET_URL);
  return coachSsCache_;
}

/** Onglet par son nom, sans tenir compte des accents ni des majuscules. */
function sheetByName_(ss, name) {
  const exact = ss.getSheetByName(name);
  if (exact) return exact;
  const target = norm_(name);
  const all = ss.getSheets();
  for (let i = 0; i < all.length; i++) if (norm_(all[i].getName()) === target) return all[i];
  return null;
}

function writeCoachDays_(days, extras) {
  const cfg = COACH_MAPPING && COACH_MAPPING.jours;
  if (!COACH_SHEET_URL || !cfg || !days.length) return { ok: true, message: '', cells: 0 };
  const sh = sheetByName_(coachSs_(), cfg.onglet);
  if (!sh) throw new Error('Onglet « ' + cfg.onglet + ' » introuvable dans le sheet du coach');
  let cells = 0;
  const missing = [];
  days.forEach(function (d) {
    if (!isoOk_(d.date)) return;
    const row = coachDayRow_(sh, cfg, d.date);
    if (row < 0) {
      missing.push(d.date);
      return;
    }
    // Exercices hors programme du jour : ajoutés à la note du jour (pas de ligne créée chez le coach).
    const more = extras && extras[d.date];
    const values = more && more.length ? Object.assign({}, d, { notes: [d.notes, 'Hors programme : ' + more.join(', ')].filter(Boolean).join(' · ') }) : d;
    Object.keys(cfg.colonnes || {}).forEach(function (k) {
      const v = formatCoachValue_(k, values[k]);
      if (v == null || v === '') return;
      sh.getRange(row, colIndex_(cfg.colonnes[k])).setValue(v);
      cells++;
    });
  });
  return { ok: missing.length === 0, message: missing.length ? 'date(s) absente(s) du suivi journalier : ' + missing.join(', ') : '', cells: cells };
}

const dayRowCache_ = {};

/** Ligne de la date dans l'onglet du coach (-1 si absente). Ignore les lignes « Moyenne ». */
function coachDayRow_(sh, cfg, date) {
  const key = sh.getName();
  if (!dayRowCache_[key]) {
    const first = Number(cfg.premiereLigne || 2);
    const last = sh.getLastRow();
    const map = {};
    if (last >= first) {
      const col = colIndex_(cfg.colonneDate || 'A');
      const vals = sh.getRange(first, col, last - first + 1, 1).getValues();
      const shown = sh.getRange(first, col, last - first + 1, 1).getDisplayValues();
      // Les dates sans année (« octobre 6 ») prennent l'année de la date reçue la plus proche.
      for (let i = 0; i < vals.length; i++) {
        const d = parseCellDate_(vals[i][0], Number(date.slice(0, 4))) || parseCellDate_(shown[i][0], Number(date.slice(0, 4)));
        if (d && !map[d]) map[d] = first + i;
      }
    }
    dayRowCache_[key] = map;
  }
  const row = dayRowCache_[key][date];
  return row ? row : -1;
}

/** Valeurs mises au format des listes déroulantes du coach. */
function formatCoachValue_(key, v) {
  if (v == null || v === '') return '';
  if (key === 'sommeil' || key === 'qualiteSommeil') {
    // Liste du coach : 10, 9,5, 9, 8,5, 8, 7,5, 7, 6,5, 6, 5, 4 et « 1 à 3 ».
    const n = Number(v);
    if (!isFinite(n)) return '';
    if (n < 3.5) return '1 à 3';
    if (n < 6) return Math.round(n);
    return Math.min(10, Math.round(n * 2) / 2);
  }
  if (key === 'kcal' || key === 'proteines' || key === 'glucides' || key === 'lipides' || key === 'fibres' || key === 'pas' || key === 'cardio') {
    const n = Number(v);
    return isFinite(n) ? Math.round(n) : '';
  }
  if (key === 'energie' || key === 'motivation' || key === 'satiete' || key === 'digestion') {
    const n = Number(v);
    return isFinite(n) ? Math.round(n) : '';
  }
  if (key === 'eau' || key === 'poids' || key === 'poidsMoyenSemaine') {
    const n = Number(v);
    return isFinite(n) ? Math.round(n * 100) / 100 : '';
  }
  return v;
}

/** Numéro de semaine (« Semaine N » de la colonne B) et date de début de cette semaine. */
function weekOfDate_(date) {
  const cfg = COACH_MAPPING && COACH_MAPPING.jours;
  if (!cfg || !cfg.colonneSemaine) return null;
  const sh = sheetByName_(coachSs_(), cfg.onglet);
  if (!sh) return null;
  const row = coachDayRow_(sh, cfg, date);
  if (row < 0) return null;
  const first = Number(cfg.premiereLigne || 2);
  const labels = sh.getRange(first, colIndex_(cfg.colonneSemaine), row - first + 1, 1).getDisplayValues();
  for (let i = labels.length - 1; i >= 0; i--) {
    const t = String(labels[i][0] || '');
    const m = t.match(/semaine\s*(\d+)/i);
    if (m) {
      const startRow = first + i;
      const startVal = sh.getRange(startRow, colIndex_(cfg.colonneDate)).getValues()[0][0];
      const startShown = sh.getRange(startRow, colIndex_(cfg.colonneDate)).getDisplayValues()[0][0];
      return { semaine: Number(m[1]), debut: parseCellDate_(startVal, Number(date.slice(0, 4))) || parseCellDate_(startShown, Number(date.slice(0, 4))) };
    }
    if (/moyenne/i.test(t)) return null;
  }
  return null;
}

/** Date de début de la semaine N (via la colonne « Semaine »), pour dater l'historique importé. */
function weekStart_(n) {
  if (n in weekStartCache_) return weekStartCache_[n];
  weekStartCache_[n] = weekStartUncached_(n);
  return weekStartCache_[n];
}

const weekStartCache_ = {};

function weekStartUncached_(n) {
  const cfg = COACH_MAPPING && COACH_MAPPING.jours;
  if (!cfg || !cfg.colonneSemaine) return null;
  const sh = sheetByName_(coachSs_(), cfg.onglet);
  if (!sh) return null;
  const first = Number(cfg.premiereLigne || 2);
  const last = sh.getLastRow();
  if (last < first) return null;
  const labels = sh.getRange(first, colIndex_(cfg.colonneSemaine), last - first + 1, 1).getDisplayValues();
  const year = Number(todayIso_().slice(0, 4));
  for (let i = 0; i < labels.length; i++) {
    const m = String(labels[i][0] || '').match(/semaine\s*(\d+)/i);
    if (m && Number(m[1]) === n) {
      const r = first + i;
      const c = colIndex_(cfg.colonneDate);
      return parseCellDate_(sh.getRange(r, c).getValues()[0][0], year) || parseCellDate_(sh.getRange(r, c).getDisplayValues()[0][0], year);
    }
  }
  return null;
}

// ---------------------------------------------------------------- sheet du coach : entraînement

let trainingCache_ = null;

/**
 * Lit l'onglet Entraînement : les noms d'exercices sont dans la colonne « Exercise » (B),
 * communs à toutes les semaines ; chaque bloc « Semaine N » (côte à côte) a ses colonnes
 * Série / Reps / Intensité (RIR) / POIDS X REPS / RIR / Progressé / Douleurs-Notes.
 */
function trainingStructure_() {
  if (trainingCache_) return trainingCache_;
  const cfg = COACH_MAPPING && COACH_MAPPING.entrainement;
  if (!cfg) return null;
  const sh = sheetByName_(coachSs_(), cfg.onglet);
  if (!sh) throw new Error('Onglet « ' + cfg.onglet + ' » introuvable dans le sheet du coach');
  trainingCache_ = { sheet: sh, blocks: parseTraining_(sh.getDataRange().getDisplayValues()) };
  return trainingCache_;
}

/** Découpe la grille (valeurs affichées, index 0-based) en semaines > jours > exercices. */
function parseTraining_(values) {
  const rows = values.length;
  const cols = rows ? values[0].length : 0;
  const titles = [];
  let exCol = -1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = String(values[r][c] || '').trim();
      const m = v.match(/^semaine\s*(\d+)$/i);
      if (m) titles.push({ n: Number(m[1]), r: r, c: c });
      else if (/^exerci[cs]es?$/i.test(v) && (exCol < 0 || c < exCol)) exCol = c;
    }
  }
  return titles.map(function (t) {
    let colEnd = cols - 1;
    let rowEnd = rows - 1;
    titles.forEach(function (o) {
      if (o.r === t.r && o.c > t.c) colEnd = Math.min(colEnd, o.c - 1);
      if (o.c === t.c && o.r > t.r) rowEnd = Math.min(rowEnd, o.r - 1);
    });
    return parseBlock_(values, t, rowEnd, colEnd, exCol);
  });
}

const DAY_RE = /^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)$/i;
const SESSION_RE = /^(s[ée]ance|jour|day|workout)\s*\d+$/i;

function parseBlock_(values, t, rowEnd, colEnd, exCol) {
  const block = { semaine: t.n, row: t.r, col: t.c, bands: [] };
  let band = null;
  for (let r = t.r + 1; r <= rowEnd; r++) {
    const row = values[r] || [];
    let label = '';
    for (let c = t.c; c <= colEnd && !label; c++) {
      const v = String(row[c] || '').trim();
      if (DAY_RE.test(v) || SESSION_RE.test(v)) label = v;
    }
    if (label) {
      band = { label: label.toUpperCase(), cols: null, exercises: [] };
      block.bands.push(band);
      continue;
    }
    let perfCol = -1;
    for (let c = t.c; c <= colEnd; c++) if (/poids\s*x\s*reps/i.test(String(row[c] || ''))) perfCol = c;
    if (perfCol >= 0) {
      const h = { perf: perfCol, ex: exCol >= 0 ? exCol : t.c, serie: -1, reps: -1, cible: -1, rir: -1, progres: -1, notes: -1 };
      for (let c = t.c; c <= colEnd; c++) {
        const v = String(row[c] || '').trim();
        if (/^s[ée]ries?$/i.test(v)) h.serie = c;
        else if (/^reps?$/i.test(v)) h.reps = c;
        else if (/\(rir\)|intensit/i.test(v)) h.cible = c;
        else if (/^rir$/i.test(v)) h.rir = c;
        else if (/progress/i.test(v)) h.progres = c;
        else if (/douleur|note/i.test(v)) h.notes = c;
        else if (/^exerci/i.test(v)) h.ex = c;
      }
      if (!band) {
        band = { label: '', cols: null, exercises: [] };
        block.bands.push(band);
      }
      band.cols = h;
      continue;
    }
    if (!band || !band.cols) continue;
    const name = String(row[band.cols.ex] || '').trim();
    if (!name || /^exerci/i.test(name)) continue;
    const cols = band.cols;
    const get = function (k) {
      return cols[k] >= 0 ? String(row[cols[k]] || '').trim() : '';
    };
    band.exercises.push({ row: r, nom: name, series: get('serie'), reps: get('reps'), rir: get('cible'), perf: get('perf'), progres: get('progres'), notes: get('notes') });
  }
  return block;
}

/**
 * Programme du coach pour l'import dans l'app : séances de la semaine en cours (séries, reps, RIR),
 * toutes les semaines déjà remplies (historique) et objectifs de l'onglet Nutrition.
 */
function readCoachProgram_() {
  if (!COACH_SHEET_URL) throw new Error('Renseigne COACH_SHEET_URL dans le script.');
  const st = trainingStructure_();
  const blocks = st.blocks.filter(function (b) {
    return b.bands.some(function (x) { return x.exercises.length; });
  });
  if (!blocks.length) throw new Error('Aucun bloc « Semaine N » avec des exercices dans l’onglet Entraînement.');
  const wk = weekOfDate_(todayIso_());
  const current = (wk && blocks.filter(function (b) { return b.semaine === wk.semaine; })[0]) || blocks.reduce(function (a, b) { return b.semaine > a.semaine ? b : a; });
  const seances = current.bands
    .filter(function (b) { return b.exercises.length; })
    .map(function (b) {
      return {
        jour: b.label,
        exercices: b.exercises.map(function (e) {
          return { nom: e.nom, series: Number(e.series) || null, reps: e.reps, rir: e.rir };
        }),
      };
    });
  const historique = [];
  blocks.forEach(function (b) {
    const start = weekStart_(b.semaine);
    b.bands.forEach(function (band, i) {
      const ex = band.exercises
        .filter(function (e) { return e.perf || e.notes; })
        .map(function (e) { return { nom: e.nom, perf: e.perf, notes: e.notes }; });
      if (ex.length) historique.push({ semaine: b.semaine, jour: band.label, date: bandDate_(start, band.label, i), exercices: ex });
    });
  });
  let objectifs = null;
  try {
    objectifs = readCoachTargets_();
  } catch (err) {
    objectifs = null;
  }
  let phase = null;
  try {
    phase = readCoachPhase_();
  } catch (err) {
    phase = null;
  }
  return { semaine: current.semaine, semaineActuelle: wk ? wk.semaine : null, seances: seances, historique: historique, objectifs: objectifs, phase: phase };
}

/** Dernière « Nutrition Phase » notée par le coach (Sèche, Maintien…) jusqu'à aujourd'hui. */
function readCoachPhase_() {
  const cfg = COACH_MAPPING && COACH_MAPPING.jours;
  if (!cfg || !cfg.colonnePhase) return null;
  const sh = sheetByName_(coachSs_(), cfg.onglet);
  if (!sh) return null;
  const first = Number(cfg.premiereLigne || 2);
  const todayRow = coachDayRow_(sh, cfg, todayIso_());
  const last = todayRow > 0 ? todayRow : sh.getLastRow();
  if (last < first) return null;
  const vals = sh.getRange(first, colIndex_(cfg.colonnePhase), last - first + 1, 1).getDisplayValues();
  for (let i = vals.length - 1; i >= 0; i--) {
    const v = String(vals[i][0] || '').trim();
    if (v && v.charAt(0) !== '*') return v;
  }
  return null;
}

/** Objectifs de l'onglet Nutrition : « Jour ON » / « Jour off » (ligne « Macro Cible ») et « Pas ». */
function readCoachTargets_() {
  const cfg = COACH_MAPPING && COACH_MAPPING.nutrition;
  if (!cfg) return null;
  const sh = sheetByName_(coachSs_(), cfg.onglet);
  if (!sh) return null;
  const v = sh.getDataRange().getDisplayValues();
  const find = function (re) {
    for (let r = 0; r < v.length; r++) for (let c = 0; c < v[r].length; c++) if (re.test(String(v[r][c] || '').trim())) return { r: r, c: c };
    return null;
  };
  const day = function (re) {
    const at = find(re);
    if (!at) return null;
    let target = -1;
    for (let r = at.r + 1; r < Math.min(v.length, at.r + 4) && target < 0; r++) if (/cible/i.test(String(v[r][at.c] || ''))) target = r;
    if (target < 0) return null;
    const out = {};
    v[at.r].forEach(function (h, c) {
      const key = /calor/i.test(h) ? 'kcal' : /prot/i.test(h) ? 'protein' : /glucid|carb/i.test(h) ? 'carbs' : /lipid|fat/i.test(h) ? 'fat' : /fibre/i.test(h) ? 'fiber' : null;
      const n = key ? parseNumber_(v[target][c]) : null;
      if (key && n != null) out[key] = n;
    });
    return out.kcal ? out : null;
  };
  const on = day(/^jour\s*on$/i);
  const off = day(/^jour\s*off$/i);
  let pas = null;
  const p = find(/^pas$/i);
  if (p && v[p.r + 1]) {
    const t = String(v[p.r + 1][p.c] || '').toLowerCase().replace(/\s/g, '').replace(',', '.');
    const m = t.match(/^(\d+(?:\.\d+)?)(k?)/);
    if (m) pas = Math.round(Number(m[1]) * (m[2] ? 1000 : 1));
  }
  // Cardio prescrit (« 60 min zone 2 »), repris tel quel pour l'afficher dans l'app.
  let cardio = null;
  const cc = find(/^cardio$/i);
  if (cc && v[cc.r + 1]) cardio = String(v[cc.r + 1][cc.c] || '').trim() || null;
  return on || off ? { on: on, off: off, pas: pas, cardio: cardio } : null;
}

function parseNumber_(x) {
  const t = String(x == null ? '' : x).replace(/[\s  ]/g, '').replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return isFinite(n) ? n : null;
}

/** Date du bandeau dans la semaine : le jour de la semaine correspondant au libellé (LUNDI…). */
function bandDate_(start, label, index) {
  if (!start) return null;
  const d0 = toDate_(start);
  const wd = WEEKDAYS.indexOf(norm_(label));
  for (let k = 0; k < 7; k++) {
    const d = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() + k);
    if (wd >= 0 ? d.getDay() === wd : k === index) return Utilities.formatDate(d, TZ, 'yyyy-MM-dd');
  }
  return null;
}

/**
 * Écrit les séances de l'app dans l'onglet Entraînement (bloc de la semaine, bandeau du jour).
 * Écarts au programme :
 *  - exercice remplacé dans l'app → perf sur la ligne de l'exercice prévu + « Remplacé par … » en note ;
 *  - exercice en plus (absent du jour) → aucune ligne ajoutée chez le coach : il part dans les notes
 *    du jour (Suivi journalier), renvoyées dans `extras` ;
 *  - exercice sauté → ligne laissée vide (ou la note saisie dans l'app) ;
 *  - séance décalée → elle reste sur le jour prévu (LUNDI…) de la semaine la plus proche.
 */
function writeCoachTraining_(sessions) {
  const cfg = COACH_MAPPING && COACH_MAPPING.entrainement;
  const out = { ok: true, message: '', cells: 0, extras: {}, info: '' };
  if (!COACH_SHEET_URL || !cfg) return out;
  // Ordre chronologique : si une séance est faite deux fois dans la semaine, la dernière gagne.
  const todo = sessions
    .filter(function (s) {
      return (s.exercices || []).some(function (e) { return e.perf || e.note; });
    })
    .sort(function (a, b) {
      return String(a.date + (a.debut || '')) < String(b.date + (b.debut || '')) ? -1 : 1;
    });
  if (!todo.length) return out;
  const st = trainingStructure_();
  const sh = st.sheet;
  const problems = [];
  const offPlan = [];
  const put = function (row, col, value) {
    sh.getRange(row + 1, col + 1).setValue(value);
    out.cells++;
  };
  const extra = function (s, ex) {
    if (!ex.perf) return;
    (out.extras[s.date] = out.extras[s.date] || []).push(ex.nom + ' (' + ex.perf + ')');
    offPlan.push(ex.nom);
  };
  todo.forEach(function (s) {
    const place = placeSession_(st, s);
    if (place.error) {
      problems.push(place.error);
      return;
    }
    if (!place.band) {
      // Séance sans aucun exercice du programme : tout part dans les notes du jour.
      (s.exercices || []).forEach(function (ex) { extra(s, ex); });
      return;
    }
    const band = place.band;
    (s.exercices || []).forEach(function (ex) {
      if (!ex.perf && !ex.note) return;
      let target = findInBand_(band, ex.nom);
      const replaced = !target && ex.remplace ? findInBand_(band, ex.remplace) : null;
      if (replaced) target = replaced;
      if (!target) {
        extra(s, ex);
        return;
      }
      if (ex.perf) put(target.row, band.cols.perf, ex.perf);
      // Progression : comparée à la même ligne les semaines passées, donc pas pour un exercice remplacé.
      let progres = replaced ? '' : ex.progres || '';
      if (!replaced && !progres && ex.perf && isNewExercise_(st.blocks, place.block, target.row)) progres = 'Nouvel exo';
      if (progres && band.cols.progres >= 0) put(target.row, band.cols.progres, progres);
      const note = [replaced ? 'Remplacé par ' + ex.nom : '', ex.note || ''].filter(Boolean).join(' · ');
      if (note) {
        if (band.cols.notes >= 0) put(target.row, band.cols.notes, note);
        else if (!ex.perf) put(target.row, band.cols.perf, note);
      }
    });
  });
  out.ok = problems.length === 0;
  out.message = problems.join(' · ');
  if (offPlan.length) out.info = 'hors programme, mis dans les notes du jour : ' + offPlan.join(', ');
  return out;
}

/**
 * Bloc (semaine) et bandeau (jour) où écrire une séance. Une séance liée à un jour du coach va dans
 * la semaine où ce jour tombe le plus près de la date réelle : la séance du JEUDI faite le vendredi
 * (premier jour de la semaine suivante chez le coach) reste dans sa semaine. Une séance libre va
 * dans la semaine de sa date. `band` est null si aucun exercice ne correspond au programme.
 */
function placeSession_(st, s) {
  const wk = weekOfDate_(s.date);
  const blockOf = function (n) {
    return st.blocks.filter(function (b) { return b.semaine === n; })[0] || null;
  };
  if (!wk) {
    if (st.blocks.length === 1) return { block: st.blocks[0], band: pickBand_(st.blocks[0], s) }; // un seul tableau, réécrit chaque semaine
    return { error: s.date + ' : semaine introuvable dans le suivi journalier' };
  }
  let block = blockOf(wk.semaine);
  if (!block && st.blocks.length === 1) block = st.blocks[0];
  if (s.jourCoach) {
    let best = null;
    [wk.semaine, wk.semaine - 1, wk.semaine + 1].forEach(function (n) {
      const b = blockOf(n);
      const band = b ? exactBand_(b, s.jourCoach) : null;
      if (!band) return;
      const when = bandDate_(weekStart_(n), band.label, b.bands.indexOf(band));
      const gap = when ? Math.abs(dayDiff_(when, s.date)) : n === wk.semaine ? 0 : 99;
      if (n !== wk.semaine && gap > 3) return; // semaine voisine : seulement pour un décalage de 3 jours max
      if (!best || gap < best.gap) best = { block: b, band: band, gap: gap };
    });
    if (best) return { block: best.block, band: best.band };
  }
  if (!block) return { error: 'Semaine ' + wk.semaine + ' absente de l’onglet Entraînement' };
  return { block: block, band: pickBand_(block, s) };
}

function exactBand_(block, label) {
  return block.bands.filter(function (b) { return b.cols && norm_(b.label) === norm_(label); })[0] || null;
}

function findInBand_(band, nom) {
  return band.exercises.filter(function (e) { return sameExercise_(e.nom, nom); })[0] || null;
}

function dayDiff_(a, b) {
  return Math.round((toDate_(a).getTime() - toDate_(b).getTime()) / 86400000);
}

/** Aucune performance sur cette ligne dans les semaines précédentes → « Nouvel exo ». */
function isNewExercise_(blocks, block, row) {
  return !blocks.some(function (b) {
    return b.semaine < block.semaine && b.bands.some(function (x) {
      return x.exercises.some(function (e) { return e.row === row && e.perf; });
    });
  });
}

/** Bandeau du jour : celui lié à la séance (LUNDI…), sinon celui qui partage le plus d'exercices. */
function pickBand_(block, s) {
  const bands = block.bands.filter(function (b) { return b.cols; });
  if (s.jourCoach) {
    const exact = exactBand_(block, s.jourCoach);
    if (exact) return exact;
  }
  let best = null;
  let bestScore = 0;
  bands.forEach(function (b) {
    const score = (s.exercices || []).filter(function (ex) {
      return b.exercises.some(function (e) { return sameExercise_(e.nom, ex.nom); });
    }).length;
    if (score > bestScore) {
      best = b;
      bestScore = score;
    }
  });
  return best;
}

function sameExercise_(a, b) {
  return norm_(a) === norm_(b);
}

function coachSummary_() {
  if (!COACH_SHEET_URL || !COACH_MAPPING) return null;
  try {
    const ss = coachSs_();
    const out = { ok: true, nom: ss.getName(), suivi: false, semaines: [] };
    if (COACH_MAPPING.jours) out.suivi = !!sheetByName_(ss, COACH_MAPPING.jours.onglet);
    if (COACH_MAPPING.entrainement) {
      try {
        out.semaines = trainingStructure_().blocks.map(function (b) { return b.semaine; });
      } catch (err) {
        out.entrainementErreur = String((err && err.message) || err);
      }
    }
    return out;
  } catch (err) {
    return { ok: false, message: 'Sheet du coach inaccessible : ' + String((err && err.message) || err) };
  }
}

function parseCellDate_(v, year) {
  if (v instanceof Date && !isNaN(v)) return Utilities.formatDate(v, TZ, 'yyyy-MM-dd');
  const s = norm_(v);
  if (!s) return null;
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return m[1] + '-' + pad_(m[2]) + '-' + pad_(m[3]);
  m = s.match(/(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?/);
  if (m) {
    let y = m[3] ? Number(m[3]) : year;
    if (y < 100) y += 2000;
    return y + '-' + pad_(m[2]) + '-' + pad_(m[1]);
  }
  // « octobre 6 », « 6 octobre », « lun. 6 oct. 2026 »
  m = s.match(/([a-z]+)\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?/);
  if (m && MONTHS[m[1]]) return (m[3] || year) + '-' + pad_(MONTHS[m[1]]) + '-' + pad_(m[2]);
  m = s.match(/(\d{1,2})\s+([a-z]+)\.?(?:\s+(\d{4}))?/);
  if (m && MONTHS[m[2]]) return (m[3] || year) + '-' + pad_(MONTHS[m[2]]) + '-' + pad_(m[1]);
  return null;
}

function norm_(v) {
  return String(v == null ? '' : v)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[  ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

// ---------------------------------------------------------------- outils manuels (depuis l'éditeur)

/** Crée les onglets de ton sheet (facultatif : ils se créent tout seuls). */
function setup() {
  Object.keys(TABS).forEach(tab_);
  Logger.log('Onglets prêts dans « %s ».', ss_().getName());
}

/** Vérifie la lecture du sheet du coach : semaines trouvées, jours, exercices. */
function diagnosticCoach() {
  if (!COACH_SHEET_URL) {
    Logger.log('Renseigne COACH_SHEET_URL d’abord.');
    return;
  }
  Logger.log(JSON.stringify(coachSummary_()));
  const cfg = COACH_MAPPING.jours;
  const sh = sheetByName_(coachSs_(), cfg.onglet);
  if (sh) {
    const today = todayIso_();
    Logger.log('Suivi journalier : aujourd’hui (%s) → ligne %s, %s', today, coachDayRow_(sh, cfg, today), JSON.stringify(weekOfDate_(today)));
  }
  trainingStructure_().blocks.forEach(function (b) {
    Logger.log('Semaine %s : %s', b.semaine, b.bands.map(function (x) { return x.label + ' (' + x.exercises.length + ' exercices)'; }).join(', '));
  });
}
