// ─── DESK · MARKET DATA ──────────────────────────────────────────────────────
// Daily bars are { t: "YYYY-MM-DD", o, h, l, c, v }. Prices are dividend/split adjusted when an
// "Adj Close" column (or Yahoo adjclose) is available.

const COLS = {
  t: ["date", "time", "datetime", "timestamp", "day", "data", "jour"],
  o: ["open", "ouverture", "otwarcie", "o"],
  h: ["high", "haut", "plus haut", "najwyzszy", "h"],
  l: ["low", "bas", "plus bas", "najnizszy", "l"],
  c: ["close", "clôture", "cloture", "dernier", "last", "price", "zamkniecie", "c"],
  adj: ["adj close", "adj_close", "adjclose", "adjusted close", "adj. close", "clôture ajustée"],
  v: ["volume", "vol", "vol.", "wolumen", "v"],
};

const pad = (n) => String(n).padStart(2, "0");
export const isoDate = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

function parseNumber(raw, decimalComma) {
  if (raw == null) return NaN;
  let s = String(raw).trim().replace(/^"|"$/g, "").replace(/[\s  ]/g, "");
  if (!s || s === "null" || s === "-") return NaN;
  if (decimalComma && s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); // 1.234,56 (FR)
  else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, "");             // 1.234.567
  else s = s.replace(/,/g, "");
  return Number(s);
}

function makeDateParser(samples) {
  // DD/MM/YYYY vs MM/DD/YYYY: decided from the data, French order when ambiguous.
  let dayFirst = true;
  for (const s of samples) {
    const m = String(s).match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
    if (!m) continue;
    if (+m[1] > 12) { dayFirst = true; break; }
    if (+m[2] > 12) { dayFirst = false; break; }
  }
  return (raw) => {
    const s = String(raw).trim().replace(/^"|"$/g, "");
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    if (/^\d{9,13}$/.test(s)) { // unix seconds (TradingView export) or milliseconds
      const n = Number(s);
      return isoDate(new Date(s.length > 11 ? n : n * 1000));
    }
    m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
    if (m) {
      const [d, mo] = dayFirst ? [m[1], m[2]] : [m[2], m[1]];
      return `${m[3]}-${pad(mo)}-${pad(d)}`;
    }
    m = s.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    return null;
  };
}

/** Parses Yahoo / TradingView / Stooq / Excel-FR CSV exports into daily bars (oldest first). */
export function parseCSV(text) {
  const lines = String(text).replace(/^﻿/, "").split(/\r?\n/).filter((x) => x.trim());
  if (lines.length < 2) throw new Error("CSV vide ou sans données.");
  const head = lines[0];
  const delim = [";", "\t", ","].sort((a, b) => head.split(b).length - head.split(a).length)[0];
  const decimalComma = delim !== ",";
  const names = head.split(delim).map((x) => x.trim().replace(/^"|"$/g, "").toLowerCase());
  const idx = {};
  for (const [key, aliases] of Object.entries(COLS)) {
    idx[key] = names.findIndex((n) => aliases.includes(n));
  }
  if (idx.t < 0 || idx.c < 0) throw new Error(`Colonnes date/close introuvables (en-tête : ${names.join(", ")}).`);
  const warnings = [];
  if (idx.h < 0 || idx.l < 0) warnings.push("Colonnes high/low absentes : ATR approximé avec les clôtures.");
  if (idx.v < 0) warnings.push("Volume absent : le filtre volume de l'équation (11) est désactivé.");
  const rows = lines.slice(1).map((ln) => ln.split(delim));
  const parseDate = makeDateParser(rows.slice(0, 300).map((r) => r[idx.t]));
  const byDate = new Map();
  let skipped = 0;
  for (const r of rows) {
    const t = parseDate(r[idx.t] ?? "");
    const num = (k) => (idx[k] >= 0 ? parseNumber(r[idx[k]], decimalComma) : NaN);
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
  return { bars, warnings, adjusted: idx.adj >= 0 };
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
 * Parses the free-text earnings dates of the watchlist ("⚡ 18 mars 2026", "11-13 mai 2026",
 * "Avril 2026", "Inconnu"). Returns { date, precise } or null. A range keeps its first day.
 */
export function parseFrenchDate(str) {
  if (!str) return null;
  const s = String(str).toLowerCase();
  const months = Object.keys(MONTHS).join("|");
  let m = s.match(new RegExp(`(\\d{1,2})(?:\\s*-\\s*\\d{1,2})?\\s+(${months})\\s+(\\d{4})`));
  if (m) return { date: `${m[3]}-${pad(MONTHS[m[2]])}-${pad(m[1])}`, precise: true };
  m = s.match(new RegExp(`(${months})\\s+(\\d{4})`));
  if (m) return { date: `${m[2]}-${pad(MONTHS[m[1]])}-01`, precise: false };
  m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return { date: m[0], precise: true };
  return null;
}
