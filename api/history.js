// Vercel serverless function: daily OHLCV history, fetched server-side (the browser cannot call
// Yahoo directly because of CORS). Unofficial Yahoo Finance endpoint: it can rate-limit or change;
// the Desk falls back to CSV import when this fails.
//   GET /api/history?symbol=NVDA&range=10y   (range: 1y | 2y | 5y | 10y | max)
import { parseYahooChart } from "../src/desk/data.js";

const RANGES = new Set(["1y", "2y", "5y", "10y", "max"]);

export default async function handler(req, res) {
  const symbol = String(req.query?.symbol || "").trim().toUpperCase();
  const range = RANGES.has(req.query?.range) ? req.query.range : "10y";
  if (!/^[A-Z0-9^][A-Z0-9.\-=^]{0,19}$/.test(symbol)) {
    res.status(400).json({ error: "Symbole invalide." });
    return;
  }
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=1d&includeAdjustedClose=true&events=div%2Csplit`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; AtlasIntel/1.0)", Accept: "application/json" } });
    const text = await r.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* HTML error page */ }
    if (!json) {
      res.status(502).json({ error: `Yahoo Finance a répondu ${r.status} sans données.` });
      return;
    }
    const data = parseYahooChart(json);
    if (!data.bars.length) {
      res.status(404).json({ error: `Aucune donnée pour ${symbol}.` });
      return;
    }
    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({ ...data, range, source: "Yahoo Finance (non officiel)" });
  } catch (e) {
    const notFound = /no data|not found|delisted/i.test(e.message);
    res.status(notFound ? 404 : 502).json({ error: `${symbol} : ${e.message}` });
  }
}
