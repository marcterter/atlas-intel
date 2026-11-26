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

const VERSION = 12;
const TZ = Session.getScriptTimeZone() || 'Europe/Paris';

const TABS = {
  jours: ['Date', 'Poids (kg)', 'Poids moy. semaine', 'Sommeil (h)', 'Qualité sommeil', 'Énergie', 'Motivation', 'Satiété', 'Digestion', 'Eau (L)', 'Kcal', 'Protéines (g)', 'Glucides (g)', 'Lipides (g)', 'Fibres (g)', 'Objectif kcal', 'Objectif P', 'Objectif G', 'Objectif L', 'Pas', 'Objectif pas', 'Séance', 'Cardio (min)', 'Tonnage (kg)', 'Durée séance (min)', 'Type de jour', 'Notes', 'Mis à jour'],
  seances: ['ID', 'Date', 'Séance', 'Durée (min)', 'Tonnage (kg)', 'Séries', 'Exercice', 'Groupe', 'Séries réalisées', 'Progressé ?', 'Note exercice', 'Note séance'],
  series: ['ID', 'Date', 'Séance', 'Exercice', 'N°', 'Type', 'Charge (kg)', 'Reps', 'Durée (s)', 'Km'],
  repas: ['Date', 'Repas', 'Aliment', 'Marque', 'Quantité (g/ml)', 'Portion', 'Kcal', 'Protéines (g)', 'Glucides (g)', 'Lipides (g)'],
  pas: ['Date', 'Pas', 'Source', 'Reçu le', 'Horodatage'],
  bilans: ['ID', 'Date', 'Taille', 'Hanches', 'Poitrine', 'Bras', 'Cuisse', 'Mollet', 'Cou', 'Photos', 'Commentaire'],
  conseils: ['Semaine du', 'Généré le', 'Conseils', 'Exercices (JSON)', 'Programme (JSON)', 'Macros (JSON)'],
  contexte: ['Clé', 'Mis à jour', 'Contexte (JSON)'],
  photos: ['Clé', 'Bilan', 'Date', 'Pose', 'Fichier', 'Envoyé le'],
};
const TAB_NAMES = { jours: 'Jours', seances: 'Séances', series: 'Détail séries', repas: 'Repas', pas: 'Pas', bilans: 'Bilans', conseils: 'Conseils IA', contexte: 'Contexte', photos: 'Photos' };

/** Dossier privé de ton Google Drive où vont les photos de bilan envoyées à l'agent du lundi. */
const PHOTO_FOLDER = 'Forge – Photos des bilans';
const PHOTO_POSES = ['face', 'profil', 'dos', 'myair'];

/** Actions permises avec le jeton de l'agent IA : lire la semaine, déposer ses conseils. */
const IA_ACTIONS = ['ping', 'semaine', 'conseils_set', 'photos'];

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
    if (action === 'photos') return json_(Object.assign({ ok: true }, photosForAgent_(p)));
    if (action === 'photo_put') return json_(withLock_(function () { return photoPut_(p); }));
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
      return [s.id, toDate_(s.date), s.nom || '', num_(s.dureeMin), num_(s.tonnage), num_(s.series), ex.nom || '', ex.groupe || '', ex.resume || '', ex.progres || '', [ex.pour && ex.pour.jourCoach ? 'Rattrapage ' + (ex.pour.seance || ex.pour.jourCoach) : '', ex.note || ''].filter(Boolean).join(' · '), i === 0 ? s.note || '' : ''];
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
      trashBilanPhotos_(b.id);
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
    // Récap des écarts au programme de la semaine, pour le check-up du vendredi (app à jour seulement).
    if (body.ecarts) run(function () { return writeCoachRecaps_(body.ecarts); });
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
  const exercices = cleanExerciseAdvice_(p.exercices);
  const programme = cleanProgramChanges_(p.programme);
  const macros = cleanMacros_(p.macros);
  const sh = tab_('conseils');
  // Onglet créé par une version d'avant : il manque les en-têtes des colonnes ajoutées depuis.
  [4, 5, 6].forEach(function (c) {
    if (String(sh.getRange(1, c, 1, 1).getValues()[0][0] || '') === '') sh.getRange(1, c).setValue(TABS.conseils[c - 1]);
  });
  upsert_(sh, 1, semaine, [toDate_(semaine), new Date(), texte.slice(0, 45000), JSON.stringify(exercices), JSON.stringify(programme), macros ? JSON.stringify(macros) : '']);
  return { ok: true, semaine: semaine, exercices: exercices.length, programme: programme.length, macros: !!macros };
}

/**
 * Macros proposées par l'agent (appliquées d'un geste dans l'app) :
 * { jourOn: { kcal, protein, carbs, fat }, jourOff, fibres, phase, pourquoi }. Null sans jour ON valable.
 */
function cleanMacros_(x) {
  if (typeof x === 'string') {
    if (!x.trim()) return null;
    try {
      x = JSON.parse(x);
    } catch (err) {
      return null;
    }
  }
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
  const num = function (v) {
    const f = Number(typeof v === 'string' ? v.replace(',', '.').trim() : v);
    return v === '' || v == null || !isFinite(f) ? NaN : f;
  };
  const pick = function (o, a, b) {
    return o[a] != null ? o[a] : o[b];
  };
  const day = function (d) {
    if (!d || typeof d !== 'object') return null;
    const o = { kcal: Math.round(num(d.kcal)), protein: Math.round(num(pick(d, 'protein', 'proteines'))), carbs: Math.round(num(pick(d, 'carbs', 'glucides'))), fat: Math.round(num(pick(d, 'fat', 'lipides'))) };
    if (!(o.protein >= 40 && o.protein <= 400) || !(o.carbs >= 0 && o.carbs <= 900) || !(o.fat >= 20 && o.fat <= 300)) return null;
    if (!(o.kcal >= 1000 && o.kcal <= 6000)) o.kcal = o.protein * 4 + o.carbs * 4 + o.fat * 9;
    return o.kcal >= 1000 && o.kcal <= 6000 ? o : null;
  };
  const on = day(pick(x, 'jourOn', 'on'));
  if (!on) return null;
  const out = { jourOn: on };
  const off = day(pick(x, 'jourOff', 'off'));
  if (off) out.jourOff = off;
  const fibres = Math.round(num(pick(x, 'fibres', 'fiber')));
  if (fibres >= 10 && fibres <= 80) out.fibres = fibres;
  const phase = String(x.phase || '').trim().slice(0, 30);
  if (phase) out.phase = phase;
  out.pourquoi = String(x.pourquoi || '').trim().slice(0, 300);
  return out;
}

/** Conseils par exercice de l'agent : [{ nom, conseil }], affichés dans la séance sous l'objectif du jour. */
function cleanExerciseAdvice_(list) {
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch (err) {
      list = [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map(function (x) {
      return { nom: String((x && x.nom) || '').trim().slice(0, 120), conseil: String((x && x.conseil) || '').trim().slice(0, 300) };
    })
    .filter(function (x) { return x.nom && x.conseil; })
    .slice(0, 40);
}

/** Types de changements de programme que l'agent peut proposer (appliqués d'un geste dans l'app). */
const PROGRAM_TYPES = ['series', 'reps', 'rir', 'ajouter', 'retirer', 'remplacer'];

function cleanProgramChanges_(list) {
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch (err) {
      list = [];
    }
  }
  if (!Array.isArray(list)) return [];
  const txt = function (v, n) {
    return String(v == null ? '' : v).trim().slice(0, n);
  };
  return list
    .map(function (x) {
      x = x || {};
      const c = { type: txt(x.type, 20), seance: txt(x.seance, 80), exercice: txt(x.exercice, 120), pourquoi: txt(x.pourquoi, 240) };
      const series = Math.round(Number(x.series));
      if (series >= 1 && series <= 10) c.series = series;
      if (txt(x.reps, 20)) c.reps = txt(x.reps, 20);
      if (txt(x.rir, 10)) c.rir = txt(x.rir, 10);
      if (txt(x.par, 120)) c.par = txt(x.par, 120);
      if (txt(x.apres, 120)) c.apres = txt(x.apres, 120);
      if (txt(x.muscle, 20)) c.muscle = txt(x.muscle, 20);
      return c;
    })
    .filter(function (c) {
      if (PROGRAM_TYPES.indexOf(c.type) < 0 || !c.seance || !c.exercice) return false;
      if (c.type === 'series') return !!c.series;
      if (c.type === 'reps') return !!c.reps;
      if (c.type === 'rir') return !!c.rir;
      if (c.type === 'remplacer') return !!c.par;
      return true;
    })
    .slice(0, 8);
}

// ---------------------------------------------------------------- photos de bilan pour l'agent du lundi

function photoFolder_() {
  const it = DriveApp.getFoldersByName(PHOTO_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(PHOTO_FOLDER);
}

function trashFile_(id) {
  if (!id) return;
  try {
    DriveApp.getFileById(String(id)).setTrashed(true);
  } catch (err) {
    // Déjà supprimé à la main : rien à faire.
  }
}

/** Photo d'un bilan (face, profil, dos, capture myAir) envoyée par l'app : rangée dans le dossier privé. */
function photoPut_(p) {
  const pose = String(p.pose || '');
  if (PHOTO_POSES.indexOf(pose) < 0) return { ok: false, error: 'Pose inconnue : ' + pose };
  const bilan = String(p.bilan || '').slice(0, 64);
  if (!bilan || !isoOk_(p.date)) return { ok: false, error: 'Bilan ou date manquants' };
  const data = String(p.data || '');
  if (!data || data.length > 6000000) return { ok: false, error: 'Photo vide ou trop lourde' };
  const file = photoFolder_().createFile(Utilities.newBlob(Utilities.base64Decode(data), 'image/jpeg', String(p.date) + '_' + pose + '.jpg'));
  const sh = tab_('photos');
  const key = bilan + '|' + pose;
  const last = sh.getLastRow();
  if (last >= 2) {
    const rows = sh.getRange(2, 1, last - 1, 5).getValues();
    rows.forEach(function (r) {
      if (String(r[0]) === key) trashFile_(r[4]); // photo remplacée : l'ancienne part à la corbeille
    });
  }
  upsert_(sh, 1, key, [key, bilan, toDate_(String(p.date)), pose, file.getId(), new Date()]);
  return { ok: true, id: file.getId() };
}

/** Bilan supprimé dans l'app : ses photos partent à la corbeille du Drive. */
function trashBilanPhotos_(bilan) {
  const sh = ss_().getSheetByName(TAB_NAMES.photos);
  if (!sh || sh.getLastRow() < 2) return;
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues();
  for (let i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i][1]) !== String(bilan)) continue;
    trashFile_(rows[i][4]);
    sh.deleteRows(i + 2, 1);
  }
}

/**
 * Pour l'agent : la dernière série de photos (si elle a moins de `jours` jours, 5 par défaut) et une
 * série de référence environ 4 semaines plus tôt (au moins 2), en base64.
 */
function photosForAgent_(p) {
  const empty = { recent: null, reference: null, dernier: null };
  const sh = ss_().getSheetByName(TAB_NAMES.photos);
  if (!sh || sh.getLastRow() < 2) return empty;
  const rows = sh
    .getRange(2, 1, sh.getLastRow() - 1, 5)
    .getValues()
    .map(function (r) {
      return { date: iso_(r[2]), pose: String(r[3]), file: String(r[4] || '') };
    })
    .filter(function (r) { return r.date && r.file && PHOTO_POSES.indexOf(r.pose) >= 0; });
  if (!rows.length) return empty;
  const dates = rows.map(function (r) { return r.date; }).filter(function (d, i, a) { return a.indexOf(d) === i; }).sort().reverse();
  const days = Math.min(14, Math.max(1, Number(p.jours) || 5));
  const latest = dates[0];
  const recent = latest >= isoDaysAgo_(days) ? latest : null;
  let reference = null;
  if (recent) {
    const older = dates.filter(function (d) { return dayDiff_(recent, d) >= 14; });
    older.sort(function (a, b) { return Math.abs(dayDiff_(recent, a) - 28) - Math.abs(dayDiff_(recent, b) - 28); });
    reference = older[0] || null;
  }
  const pack = function (date) {
    if (!date) return null;
    const images = [];
    rows.forEach(function (r) {
      if (r.date !== date) return;
      try {
        images.push({ pose: r.pose, mime: 'image/jpeg', data: Utilities.base64Encode(DriveApp.getFileById(r.file).getBlob().getBytes()) });
      } catch (err) {
        // Fichier supprimé à la main dans le Drive : on l'ignore.
      }
    });
    return images.length ? { date: date, images: images } : null;
  };
  return { recent: pack(recent), reference: pack(reference), dernier: latest };
}

function readConseils_() {
  const sh = ss_().getSheetByName(TAB_NAMES.conseils);
  if (!sh || sh.getLastRow() < 2) return { conseils: null, precedents: [] };
  const rows = sh
    .getRange(2, 1, sh.getLastRow() - 1, 6)
    .getValues()
    .map(function (r) {
      return {
        semaine: iso_(r[0]),
        date: r[1] instanceof Date ? r[1].toISOString() : String(r[1] || ''),
        texte: String(r[2] || ''),
        exercices: cleanExerciseAdvice_(String(r[3] || '[]')),
        programme: cleanProgramChanges_(String(r[4] || '[]')),
        macros: cleanMacros_(String(r[5] || '')),
      };
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
  delete weekLabelCache_.rows;
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
  const r = weekLabelRow_(n);
  if (r < 0) return null;
  const sh = sheetByName_(coachSs_(), cfg.onglet);
  const year = Number(todayIso_().slice(0, 4));
  const c = colIndex_(cfg.colonneDate);
  return parseCellDate_(sh.getRange(r, c).getValues()[0][0], year) || parseCellDate_(sh.getRange(r, c).getDisplayValues()[0][0], year);
}

/** Ligne du libellé « Semaine N » dans le suivi journalier (-1 si absente). */
function weekLabelRow_(n) {
  const cfg = COACH_MAPPING && COACH_MAPPING.jours;
  if (!cfg || !cfg.colonneSemaine) return -1;
  if (!weekLabelCache_.rows) {
    weekLabelCache_.rows = {};
    const sh = sheetByName_(coachSs_(), cfg.onglet);
    const first = Number(cfg.premiereLigne || 2);
    const last = sh ? sh.getLastRow() : 0;
    if (sh && last >= first) {
      const labels = sh.getRange(first, colIndex_(cfg.colonneSemaine), last - first + 1, 1).getDisplayValues();
      for (let i = 0; i < labels.length; i++) {
        const m = String(labels[i][0] || '').match(/semaine\s*(\d+)/i);
        if (m && !weekLabelCache_.rows[m[1]]) weekLabelCache_.rows[m[1]] = first + i;
      }
    }
  }
  return weekLabelCache_.rows[String(n)] || -1;
}

const weekLabelCache_ = {};

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
  const madeUp = [];
  const put = function (row, col, value) {
    sh.getRange(row + 1, col + 1).setValue(value);
    out.cells++;
  };
  // Une ligne d'exercice du coach : perf, progression (pas pour un exercice remplacé), notes.
  const write = function (block, band, target, ex, replaced, before) {
    if (ex.perf) put(target.row, band.cols.perf, ex.perf);
    // Progression : comparée à la même ligne les semaines passées, donc pas pour un exercice remplacé.
    let progres = replaced ? '' : ex.progres || '';
    if (!replaced && !progres && ex.perf && isNewExercise_(st.blocks, block, target.row)) progres = 'Nouvel exo';
    if (progres && band.cols.progres >= 0) put(target.row, band.cols.progres, progres);
    const note = [before || '', replaced ? 'Remplacé par ' + ex.nom : '', ex.note || ''].filter(Boolean).join(' · ');
    if (note) {
      if (band.cols.notes >= 0) put(target.row, band.cols.notes, note);
      else if (!ex.perf) put(target.row, band.cols.perf, note);
    }
  };
  /**
   * Rattrapage (les bras de l'Upper faits avant les jambes) : écrit sur la ligne de la séance rattrapée,
   * dans la semaine du coach où elle tombe. false si cette ligne est introuvable (traité comme avant).
   */
  const makeUp = function (s, ex) {
    const p = ex.pour;
    if (!p || !p.jourCoach || !(ex.perf || ex.note)) return false;
    const place = placeSession_(st, { date: isoOk_(p.date) ? p.date : s.date, jourCoach: p.jourCoach, exercices: [] });
    const band = place && !place.error ? place.band : null;
    const target = band ? findInBand_(band, p.exercice || ex.nom) || findInBand_(band, ex.nom) : null;
    if (!target) return false;
    const d = iso_(s.date) || String(s.date);
    const day = d.slice(8, 10) + '/' + d.slice(5, 7);
    write(place.block, band, target, ex, !sameExercise_(target.nom, ex.nom), 'Rattrapé le ' + day + (s.nom ? ' (' + s.nom + ')' : ''));
    madeUp.push(ex.nom + ' → ' + (p.seance || p.jourCoach));
    return true;
  };
  const extra = function (s, ex) {
    if (!ex.perf) return;
    (out.extras[s.date] = out.extras[s.date] || []).push(ex.nom + ' (' + ex.perf + ')');
    offPlan.push(ex.nom);
  };
  todo.forEach(function (s) {
    // Les rattrapages d'abord : ils partent sur la séance rattrapée, le reste suit le jour de la séance.
    const rest = (s.exercices || []).filter(function (ex) { return !makeUp(s, ex); });
    if (!rest.some(function (ex) { return ex.perf || ex.note; })) return;
    const own = Object.assign({}, s, { exercices: rest });
    const place = placeSession_(st, own);
    if (place.error) {
      problems.push(place.error);
      return;
    }
    if (!place.band) {
      // Séance sans aucun exercice du programme : tout part dans les notes du jour.
      rest.forEach(function (ex) { extra(s, ex); });
      return;
    }
    const band = place.band;
    rest.forEach(function (ex) {
      if (!ex.perf && !ex.note) return;
      let target = findInBand_(band, ex.nom);
      const replaced = !target && ex.remplace ? findInBand_(band, ex.remplace) : null;
      if (replaced) target = replaced;
      if (!target) {
        extra(s, ex);
        return;
      }
      write(place.block, band, target, ex, !!replaced, '');
    });
  });
  out.ok = problems.length === 0;
  out.message = problems.join(' · ');
  const info = [];
  if (madeUp.length) info.push('rattrapé : ' + madeUp.join(', '));
  if (offPlan.length) info.push('hors programme, mis dans les notes du jour : ' + offPlan.join(', '));
  out.info = info.join(' · ');
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

// ---------------------------------------------------------------- sheet du coach : récap des écarts (check-up)

/** Début et fin du récap de Forge dans la note « Semaine N » : ce qui est autour reste au coach. */
const RECAP_TITLE = 'Écarts au programme (Forge)';
const RECAP_END = '(Réécrit par Forge à chaque synchro.)';

/**
 * Récap des semaines du coach (vendredi → jeudi) des 14 derniers jours, pour le check-up : séances faites
 * un autre jour, à la place d'une autre ou pas faites ; exercices remplacés, pas faits, en plus ou rattrapés ;
 * séries en plus ou en moins ; objectifs de l'app différents de l'onglet Nutrition ; cardio de la semaine.
 * Posé en note sur « Semaine N » (onglets Entraînement et Suivi journalier) : aucune case du coach ne change.
 * `recap` : { depuis, seances: [{ date, nom, jourCoach, exercices: [{ nom, remplace, pour, n }] }] } (n = séries faites).
 */
function writeCoachRecaps_(recap) {
  const out = { ok: true, message: '', cells: 0 };
  const cfg = COACH_MAPPING && COACH_MAPPING.jours;
  if (!COACH_SHEET_URL || !cfg || !recap || !Array.isArray(recap.seances)) return out;
  const today = todayIso_();
  const depuis = isoOk_(recap.depuis) ? String(recap.depuis) : isoDaysAgo_(13);
  const wk = weekOfDate_(today);
  if (!wk) return out;
  const st = trainingStructure_();
  const suivi = sheetByName_(coachSs_(), cfg.onglet);
  const names = {};
  ((readContexte_() || {}).programme || []).forEach(function (r) {
    if (r && r.jourCoach && r.seance) names[norm_(r.jourCoach)] = String(r.seance);
  });
  let targets = null;
  try {
    targets = readCoachTargets_();
  } catch (err) {
    targets = null;
  }
  const seances = recap.seances.filter(function (s) { return s && isoOk_(s.date); });
  [wk.semaine - 1, wk.semaine].forEach(function (n) {
    const debut = n === wk.semaine ? wk.debut : weekStart_(n);
    if (!debut || addDaysIso_(debut, 6) < depuis) return; // semaine d'avant le suivi dans Forge
    const text = weekRecap_(st, n, debut, today, depuis, seances, names, targets);
    const block = st.blocks.filter(function (b) { return b.semaine === n; })[0];
    if (block && setRecapNote_(st.sheet.getRange(block.row + 1, block.col + 1), text)) out.cells++;
    const row = weekLabelRow_(n);
    if (suivi && row > 0 && setRecapNote_(suivi.getRange(row, colIndex_(cfg.colonneSemaine)), text)) out.cells++;
  });
  return out;
}

/**
 * Texte du récap de la semaine n ('' : rien à signaler, pas même une séance). Avant `depuis` (premier
 * jour suivi dans Forge, ou il y a 13 jours), l'app ne sait rien : aucun jour n'y est dit « pas fait ».
 */
function weekRecap_(st, n, debut, today, depuis, seances, names, targets) {
  const fin = addDaysIso_(debut, 6);
  const block = st.blocks.filter(function (b) { return b.semaine === n; })[0] || null;
  const used = {};
  const madeUps = [];
  // Toutes les séances envoyées : une séance de la semaine voisine peut remplir un jour de celle-ci.
  const placed = seances.map(function (s) {
    const ex = (s.exercices || []).filter(function (e) { return e && e.nom && Number(e.n) > 0; });
    const own = ex.filter(function (e) { return !(e.pour && e.pour.jourCoach); });
    ex.forEach(function (e) {
      if (!(e.pour && e.pour.jourCoach)) return;
      const p = placeSession_(st, { date: isoOk_(e.pour.date) ? e.pour.date : s.date, jourCoach: e.pour.jourCoach, exercices: [] });
      if (p && !p.error && p.band) madeUps.push({ cle: p.block.semaine + '|' + norm_(p.band.label), exercice: e.pour.exercice || e.nom, date: s.date });
    });
    const place = own.length ? placeSession_(st, { date: s.date, jourCoach: s.jourCoach, exercices: own }) : null;
    if (place && !place.error && place.band) used[place.block.semaine + '|' + norm_(place.band.label)] = true;
    return { s: s, ex: ex, own: own, place: place };
  });
  const items = [];
  let done = 0;
  placed.forEach(function (x) {
    if (x.s.date < debut || x.s.date > fin) return;
    done++;
    const t = sessionRecap_(x, n, names, madeUps);
    if (t) items.push({ date: x.s.date, texte: t });
  });
  // Jours du programme passés sans séance (les rattrapages faits plus tard sont cités).
  if (block) {
    block.bands.forEach(function (band, i) {
      if (!band.cols || !band.exercises.length) return;
      const when = bandDate_(debut, band.label, i);
      if (!when || when >= today || when < depuis || when < debut || when > fin) return;
      const cle = n + '|' + norm_(band.label);
      if (used[cle]) return;
      const name = names[norm_(band.label)];
      const later = madeUps
        .filter(function (m) { return m.cle === cle; })
        .map(function (m) { return m.exercice + ' le ' + jourDate_(m.date).toLowerCase(); });
      items.push({ date: when, texte: jourDate_(when) + (name ? ' · ' + name : '') + ' : pas faite' + (later.length ? ' (rattrapé : ' + later.join(', ') + ')' : '') });
    });
  }
  items.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
  const parts = [];
  if (items.length) parts.push('Séances\n' + items.map(function (i) { return '• ' + i.texte; }).join('\n'));
  else if (done) parts.push('Séances : faites comme prévu.');
  const diet = dietRecap_(debut, fin, targets);
  if (diet.length) parts.push('Diète et activité\n' + diet.map(function (l) { return '• ' + l; }).join('\n'));
  if (!parts.length) return '';
  const when = Utilities.formatDate(new Date(), TZ, "dd/MM 'à' HH:mm");
  const since = debut < depuis ? ' (suivi dans Forge depuis le ' + jourDate_(depuis).toLowerCase() + ')' : '';
  return [RECAP_TITLE + '\nSemaine ' + n + ' · du ' + jourDate_(debut).toLowerCase() + ' au ' + jourDate_(fin).toLowerCase() + since + ' · mis à jour le ' + when].concat(parts, [RECAP_END]).join('\n\n');
}

/** Une séance et ses écarts : jour, séance remplacée, exercices remplacés, pas faits, en plus, séries. */
function sessionRecap_(x, n, names, madeUps) {
  const s = x.s;
  const head = jourDate_(s.date) + ' : ' + (s.nom || 'Séance');
  const subs = [];
  x.ex.forEach(function (e) {
    if (e.pour && e.pour.jourCoach) subs.push(e.nom + ' : rattrapage de ' + (e.pour.seance || e.pour.jourCoach.toLowerCase()) + (isoOk_(e.pour.date) ? ' (' + jourDate_(e.pour.date).toLowerCase() + ')' : ''));
  });
  const place = x.place;
  if (place && place.error) return subs.length ? head + bullets_(subs) : '';
  if (!place || !place.band) {
    if (!x.own.length) return subs.length ? head + bullets_(subs) : '';
    return head + ' (hors programme)' + bullets_(x.own.map(function (e) { return e.nom + ' (' + series_(e.n) + ')'; }).concat(subs));
  }
  const band = place.band;
  const flags = [];
  if (place.block.semaine !== n) flags.push('séance du ' + band.label.toLowerCase() + ', notée en semaine ' + place.block.semaine);
  else if (norm_(band.label) !== WEEKDAYS[toDate_(s.date).getDay()]) flags.push('prévue le ' + band.label.toLowerCase());
  const coachName = names[norm_(band.label)];
  if (coachName && !sameExercise_(coachName, s.nom || '')) flags.push('à la place de ' + coachName);
  const taken = {};
  const free = function (nom) {
    return band.exercises.filter(function (r) { return !taken[r.row] && sameExercise_(r.nom, nom); })[0] || null;
  };
  const extras = [];
  x.own.forEach(function (e) {
    const row = free(e.nom) || (e.remplace ? free(e.remplace) : null);
    if (!row) {
      extras.push(e.nom + ' (' + series_(e.n) + ')');
      return;
    }
    taken[row.row] = true;
    const planned = parseInt(String(row.series), 10);
    const series = planned > 0 && Number(e.n) !== planned ? series_(e.n) + ' au lieu de ' + planned : '';
    if (!sameExercise_(row.nom, e.nom)) subs.push(row.nom.trim() + ' remplacé par ' + e.nom + (series ? ' (' + series + ')' : ''));
    else if (series) subs.push(e.nom + ' : ' + series);
  });
  const cle = place.block.semaine + '|' + norm_(band.label);
  band.exercises.forEach(function (r) {
    if (taken[r.row]) return;
    const m = madeUps.filter(function (k) { return k.cle === cle && sameExercise_(k.exercice, r.nom); })[0];
    subs.push(r.nom.trim() + (m ? ' : rattrapé le ' + jourDate_(m.date).toLowerCase() : ' : pas fait'));
  });
  if (extras.length) subs.push('En plus : ' + extras.join(', '));
  if (!flags.length && !subs.length) return '';
  return head + (flags.length ? ' (' + flags.join(', ') + ')' : '') + bullets_(subs);
}

/** Objectifs de l'app (et leurs changements) face à l'onglet Nutrition, pas et cardio de la semaine. */
function dietRecap_(debut, fin, targets) {
  const rows = tabRows_('jours', 0, debut).filter(function (j) { return j.Date <= fin; });
  if (!rows.length) return [];
  const show = function (t) {
    return int_(t.kcal) + ' kcal (P ' + int_(t.p) + ' · G ' + int_(t.g) + ' · L ' + int_(t.l) + ')';
  };
  const app = [];
  const coach = [];
  let differs = false;
  [['entrainement', 'jour ON', 'on'], ['repos', 'jour OFF', 'off']].forEach(function (k) {
    const seq = [];
    rows.forEach(function (j) {
      if (norm_(j['Type de jour']) !== k[0]) return;
      const t = { kcal: Number(j['Objectif kcal']) || 0, p: Number(j['Objectif P']) || 0, g: Number(j['Objectif G']) || 0, l: Number(j['Objectif L']) || 0 };
      if (!(t.kcal > 0)) return;
      const last = seq.length ? seq[seq.length - 1].t : null;
      if (last && last.kcal === t.kcal && last.p === t.p && last.g === t.g && last.l === t.l) return;
      seq.push({ date: j.Date, t: t });
    });
    if (!seq.length) return;
    if (seq.length > 1) differs = true; // objectifs changés en cours de semaine
    app.push(k[1] + ' ' + seq.map(function (x, i) { return i ? 'puis ' + show(x.t) + ' dès le ' + jourDate_(x.date).toLowerCase() : show(x.t); }).join(', '));
    const c = targets && targets[k[2]];
    if (!c) return;
    coach.push(k[1] + ' ' + show({ kcal: c.kcal, p: c.protein || 0, g: c.carbs || 0, l: c.fat || 0 }));
    const t = seq[seq.length - 1].t;
    if (Math.abs(t.kcal - c.kcal) >= 30 || Math.abs(t.p - (c.protein || 0)) >= 5 || Math.abs(t.g - (c.carbs || 0)) >= 10 || Math.abs(t.l - (c.fat || 0)) >= 5) differs = true;
  });
  const lines = [];
  if (differs) {
    lines.push('Objectifs suivis dans l’app : ' + app.join(' ; '));
    if (coach.length) lines.push('Onglet Nutrition : ' + coach.join(' ; '));
  }
  let pas = 0;
  rows.forEach(function (j) {
    if (Number(j['Objectif pas']) > 0) pas = Number(j['Objectif pas']);
  });
  if (targets && targets.pas && pas && Math.abs(pas - targets.pas) >= 500) lines.push('Objectif de pas dans l’app : ' + int_(pas) + ' (Nutrition : ' + int_(targets.pas) + ')');
  if (targets && targets.cardio) {
    const min = rows.reduce(function (a, j) { return a + (Number(j['Cardio (min)']) || 0); }, 0);
    lines.push('Cardio : ' + int_(min) + ' min sur la semaine (Nutrition : « ' + targets.cardio + ' »)');
  }
  return lines;
}

/** Remplace le récap de Forge dans la note de la cellule, sans toucher au texte du coach autour. */
function setRecapNote_(range, text) {
  const prev = String(range.getNote() || '');
  const a = prev.indexOf(RECAP_TITLE);
  const b = a >= 0 ? prev.indexOf(RECAP_END, a) : -1;
  const before = (a >= 0 ? prev.slice(0, a) : prev).replace(/\s+$/, '');
  const after = b >= 0 ? prev.slice(b + RECAP_END.length).replace(/^\s+/, '') : '';
  const next = [before, text, after].filter(Boolean).join('\n\n');
  if (next === prev) return false;
  range.setNote(next);
  return true;
}

/** « Lun. 23/11 » */
function jourDate_(iso) {
  const w = WEEKDAYS[toDate_(iso).getDay()];
  return w.charAt(0).toUpperCase() + w.slice(1, 3) + '. ' + String(iso).slice(8, 10) + '/' + String(iso).slice(5, 7);
}

function bullets_(list) {
  return list.map(function (x) { return '\n   – ' + x; }).join('');
}

function series_(n) {
  const k = Number(n) || 0;
  return k + ' série' + (k > 1 ? 's' : '');
}

/** Entier avec espace insécable pour les milliers : « 2 620 ». */
function int_(n) {
  return String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
}

function addDaysIso_(iso, k) {
  const d = toDate_(iso);
  return Utilities.formatDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + k), TZ, 'yyyy-MM-dd');
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
    if (key === 'photos') sh.getRange('C:C').setNumberFormat('dd/mm/yyyy');
    else if (key !== 'seances' && key !== 'series' && key !== 'bilans') sh.getRange('A:A').setNumberFormat('dd/mm/yyyy');
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
