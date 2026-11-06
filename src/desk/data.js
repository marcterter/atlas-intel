// ─── DESK · MARKET DATA ──────────────────────────────────────────────────────
// Daily bars are { t: "YYYY-MM-DD", o, h, l, c, v }. Prices are dividend/split adjusted when an
// "Adj Close" column (or Yahoo adjclose) is available.

const COLS = {
  t: ["date", "time", "datetime", "timestamp", "day", "data", "jour"],
  o: ["open", "ouverture", "ouv.", "ouv", "otwarcie", "o"],
  h: ["high", "haut", "plus haut", "najwyzszy", "h"],
  l: ["low", "bas", "plus bas", "najnizszy", "l"],
  c: ["close", "clôture", "cloture", "dernier", "last", "price", "zamkniecie", "c"],
  adj: ["adj close", "adj_close", "adjclose", "adjusted close", "adj. close", "clôture ajustée"],
  v: ["volume", "vol", "vol.", "wolumen", "v"],
};

const pad = (n) => String(n).padStart(2, "0");
export const isoDate = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

/** Splits one CSV line, honouring double quotes ("1,234.50" stays one field). */
export function splitCSVLine(line, delim) {
  const out = [];
  let cur = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else quoted = false; }
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { out.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

const clean = (raw) => String(raw ?? "").trim().replace(/^"|"$/g, "").replace(/[\s  ']/g, "");

/** Votes for the decimal separator on price fields: "222,72" → comma, "1,234.50" → dot, "1,234" → undecided. */
function detectDecimal(samples, fallback) {
  let comma = 0, dot = 0;
  for (const raw of samples) {
    const s = clean(raw);
    const lc = s.lastIndexOf(","), ld = s.lastIndexOf(".");
    if (lc >= 0 && ld >= 0) { if (lc > ld) comma++; else dot++; }
    else if (lc >= 0 && !/^\d{1,3}(,\d{3})+$/.test(s)) comma++;
    else if (ld >= 0 && !/^\d{1,3}(\.\d{3})+$/.test(s)) dot++;
  }
  return comma > dot ? "," : dot > comma ? "." : fallback;
}

/** Number with a known decimal separator; the other separator is a thousands mark. Accepts K/M/B suffixes. */
function parseNumber(raw, decimal) {
  let s = clean(raw);
  if (!s || /^(null|-|n\/a|nan)$/i.test(s)) return NaN;
  let mult = 1;
  const m = s.match(/^(.*\d)([kmb])$/i);
  if (m) { s = m[1]; mult = { k: 1e3, m: 1e6, b: 1e9 }[m[2].toLowerCase()]; }
  s = s.split(decimal === "," ? "." : ",").join("");
  if (decimal === ",") s = s.replace(",", ".");
  const x = Number(s);
  return Number.isFinite(x) ? x * mult : NaN;
}

function validISO(y, mo, d) {
  const Y = +y, M = +mo, D = +d;
  if (!(M >= 1 && M <= 12 && D >= 1 && D <= 31)) return null;
  const dt = new Date(Date.UTC(Y, M - 1, D));
  return dt.getUTCMonth() === M - 1 ? `${Y}-${pad(M)}-${pad(D)}` : null;
}

function makeDateParser(samples) {
  // DD/MM/YYYY vs MM/DD/YYYY: decided from the data, French order when ambiguous.
  let dayFirst = true;
  for (const raw of samples) {
    const m = clean(raw).match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
    if (!m) continue;
    if (+m[1] > 12) { dayFirst = true; break; }
    if (+m[2] > 12) { dayFirst = false; break; }
  }
  return (raw) => {
    const s = String(raw ?? "").trim().replace(/^"|"$/g, "").trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return validISO(m[1], m[2], m[3]);
    if (/^\d{9,13}$/.test(s)) { // unix seconds (TradingView export) or milliseconds
      const n = Number(s);
      return isoDate(new Date(s.length > 11 ? n : n * 1000));
    }
    m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
    if (m) return dayFirst ? validISO(m[3], m[2], m[1]) : validISO(m[3], m[1], m[2]);
    m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) return validISO(m[1], m[2], m[3]);
    return null;
  };
}

/** Parses Yahoo / TradingView / Stooq / Investing / Excel-FR CSV exports into daily bars (oldest first). */
export function parseCSV(text) {
  const lines = String(text).replace(/^﻿/, "").split(/\r?\n/).filter((x) => x.trim());
  if (lines.length < 2) throw new Error("CSV vide ou sans données.");
  const head = lines[0];
  const delim = [";", "\t", ","].sort((a, b) => splitCSVLine(head, b).length - splitCSVLine(head, a).length)[0];
  const names = splitCSVLine(head, delim).map((x) => x.replace(/^﻿/, "").trim().toLowerCase());
  const idx = {};
  for (const [key, aliases] of Object.entries(COLS)) {
    idx[key] = names.findIndex((n) => aliases.includes(n));
  }
  if (idx.t < 0 || idx.c < 0) throw new Error(`Colonnes date/close introuvables (en-tête : ${names.join(", ")}).`);
  const warnings = [];
  if (idx.h < 0 || idx.l < 0) warnings.push("Colonnes high/low absentes : ATR approximé avec les clôtures.");
  if (idx.v < 0) warnings.push("Volume absent : le filtre volume de l'équation (11) est désactivé.");
  const rows = lines.slice(1).map((ln) => splitCSVLine(ln, delim));
  const priceCols = ["o", "h", "l", "c", "adj"].map((k) => idx[k]).filter((i) => i >= 0);
  const decimal = detectDecimal(rows.slice(0, 300).flatMap((r) => priceCols.map((i) => r[i])), delim === ";" ? "," : ".");
  const parseDate = makeDateParser(rows.slice(0, 300).map((r) => r[idx.t]));
  const byDate = new Map();
  let skipped = 0;
  for (const r of rows) {
    const t = parseDate(r[idx.t]);
    const num = (k) => (idx[k] >= 0 ? parseNumber(r[idx[k]], decimal) : NaN);
    let c = num("c");
    let o = idx.o >= 0 ? num("o") : c, h = idx.h >= 0 ? num("h") : Math.max(o, c), l = idx.l >= 0 ? num("l") : Math.min(o, c);
    const adj = num("adj"), v = num("v");
    if (!t || ![o, h, l, c].every((x) => Number.isFinite(x) && x > 0)) { skipped++; continue; }
    if (Number.isFinite(adj) && adj > 0) { const f = adj / c; o *= f; h *= f; l *= f; c *= f; }
    byDate.set(t, { t, o, h: Math.max(h, o, c), l: Math.min(l, o, c), c, v: Number.isFinite(v) ? v : NaN });
  }
  if (skipped) warnings.push(`${skipped} ligne(s) ignorée(s) (date ou prix invalide).`);
  const bars = [...byDate.values()].sort((a, b) => (a.t < b.t ? -1 : 1));
  if (bars.length < 2) throw new Error("Aucune barre valide trouvée dans le CSV.");
  return { bars, warnings, adjusted: idx.adj >= 0, decimal };
}

/** Yahoo Finance v8 chart JSON → bars (used by the /api/history serverless function). */
export function parseYahooChart(json) {
  const res = json?.chart?.result?.[0];
  if (!res) throw new Error(json?.chart?.error?.description || "Réponse Yahoo vide.");
  const ts = res.timestamp || [], q = res.indicators?.quote?.[0] || {};
  const adj = res.indicators?.adjclose?.[0]?.adjclose;
  const offset = res.meta?.gmtoffset || 0;
  const byDate = new Map();
  ts.forEach((sec, i) => {
    let [o, h, l, c] = [q.open?.[i], q.high?.[i], q.low?.[i], q.close?.[i]];
    if (![o, h, l, c].every((x) => typeof x === "number" && x > 0)) return;
    const f = typeof adj?.[i] === "number" && adj[i] > 0 ? adj[i] / c : 1;
    o *= f; h *= f; l *= f; c *= f;
    const t = isoDate(new Date((sec + offset) * 1000));
    const v = q.volume?.[i];
    byDate.set(t, { t, o, h: Math.max(h, o, c), l: Math.min(l, o, c), c, v: typeof v === "number" ? v : NaN });
  });
  return {
    symbol: res.meta?.symbol, currency: res.meta?.currency, exchange: res.meta?.exchangeName,
    bars: [...byDate.values()].sort((a, b) => (a.t < b.t ? -1 : 1)),
  };
}

/** Client call to the Vercel function. */
export async function fetchHistory(symbol, range = "10y") {
  let r;
  try {
    r = await fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}`);
  } catch (e) {
    throw new Error(`Réseau indisponible (${e.message}).`);
  }
  if (!(r.headers.get("content-type") || "").includes("application/json"))
    throw new Error("L'API /api/history n'est disponible qu'une fois l'app déployée sur Vercel. Importe un CSV en attendant.");
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || `Erreur HTTP ${r.status}`);
  if (!j.bars?.length) throw new Error(`Aucune donnée pour ${symbol}.`);
  return j;
}

// ─── Dates ───────────────────────────────────────────────────────────────────
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const toUTC = (iso) => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
export const daysBetween = (a, b) => Math.round((toUTC(b) - toUTC(a)) / 86400000);
/** Weekdays strictly after `from` up to and including `to` (holidays ignored). */
export function businessDaysBetween(from, to) {
  let n = 0;
  const end = toUTC(to);
  for (let t = toUTC(from) + 86400000; t <= end; t += 86400000) {
    const wd = new Date(t).getUTCDay();
    if (wd !== 0 && wd !== 6) n++;
  }
  return n;
}
export function addBusinessDays(iso, n) {
  let t = toUTC(iso), added = 0;
  while (added < n) {
    t += 86400000;
    const wd = new Date(t).getUTCDay();
    if (wd !== 0 && wd !== 6) added++;
  }
  return isoDate(new Date(t));
}

const MONTHS = {
  janvier: 1, fevrier: 2, février: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7,
  aout: 8, août: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12, décembre: 12,
};
/**
 * Parses the free-text earnings dates of the watchlist ("⚡ 18 mars 2026", "1er décembre 2026",
 * "11-13 mai 2026", "Avril 2026", "Inconnu"). Returns { date, end, precise } or null:
 * a range keeps both ends, a month without a day spans the whole month (precise = false).
 */
export function parseFrenchDate(str) {
  if (!str) return null;
  const s = String(str).toLowerCase();
  const months = Object.keys(MONTHS).join("|");
  let m = s.match(new RegExp(`(\\d{1,2})(?:er)?(?:\\s*(?:-|au|à)\\s*(\\d{1,2})(?:er)?)?\\s+(${months})\\s+(\\d{4})`));
  if (m) {
    const date = validISO(m[4], MONTHS[m[3]], m[1]);
    const end = m[2] ? validISO(m[4], MONTHS[m[3]], m[2]) : date;
    if (date) return { date, end: end && end >= date ? end : date, precise: true };
  }
  m = s.match(new RegExp(`(${months})\\s+(\\d{4})`));
  if (m) {
    const mo = MONTHS[m[1]], last = new Date(Date.UTC(+m[2], mo, 0)).getUTCDate();
    return { date: `${m[2]}-${pad(mo)}-01`, end: `${m[2]}-${pad(mo)}-${pad(last)}`, precise: false };
  }
  m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) { const d = validISO(m[1], m[2], m[3]); if (d) return { date: d, end: d, precise: true }; }
  return null;
}
