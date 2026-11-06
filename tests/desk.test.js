import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCSV, parseYahooChart, parseFrenchDate, businessDaysBetween, addBusinessDays, daysBetween } from "../src/desk/data.js";
import { defaultRules, riskOfficer, killSwitch, tradeMetrics, strategyHealth, advanceCheck } from "../src/desk/desk.js";

test("CSV: Yahoo export with Adj Close adjustment", () => {
  const csv = "Date,Open,High,Low,Close,Adj Close,Volume\n2024-01-03,10,11,9,10,5,100\n2024-01-02,20,22,18,20,20,200\n";
  const { bars, adjusted } = parseCSV(csv);
  assert.ok(adjusted);
  assert.deepEqual(bars.map((b) => b.t), ["2024-01-02", "2024-01-03"]); // sorted oldest first
  assert.deepEqual([bars[1].o, bars[1].h, bars[1].l, bars[1].c, bars[1].v], [5, 5.5, 4.5, 5, 100]);
});

test("CSV: French Excel (; and decimal comma, DD/MM/YYYY)", () => {
  const csv = "Date;Ouverture;Plus haut;Plus bas;Clôture;Volume\n13/01/2024;1 234,50;1 240,00;1 230,10;1 238,75;1.234.567\n12/01/2024;100,5;101;99,5;100;10\n";
  const { bars } = parseCSV(csv);
  assert.equal(bars[0].t, "2024-01-12");
  assert.equal(bars[1].t, "2024-01-13");
  assert.equal(bars[1].o, 1234.5); assert.equal(bars[1].c, 1238.75); assert.equal(bars[1].v, 1234567);
});

test("CSV: TradingView export with unix time, semicolons with dot decimals, missing volume", () => {
  const tv = parseCSV("time,open,high,low,close\n1704412800,1.5,2,1,1.75\n1704499200,1.75,2.5,1.5,2\n");
  assert.deepEqual(tv.bars.map((b) => b.t), ["2024-01-05", "2024-01-06"]);
  assert.ok(Number.isNaN(tv.bars[0].v)); assert.ok(tv.warnings.some((w) => /Volume absent/.test(w)));
  const semi = parseCSV("Date;Open;High;Low;Close;Volume\n2024-01-02;10.5;11.25;10;11;5\n2024-01-03;11;12;10.5;11.5;6\n");
  assert.equal(semi.bars[0].h, 11.25);
  assert.throws(() => parseCSV("foo,bar\n1,2\n"), /introuvables/);
});

test("Yahoo chart JSON → adjusted daily bars", () => {
  const json = { chart: { result: [{
    meta: { symbol: "NVDA", currency: "USD", exchangeName: "NMS", gmtoffset: -18000 },
    timestamp: [1704205800, 1704292200, 1704378600],
    indicators: { quote: [{ open: [10, 11, null], high: [11, 12, 13], low: [9, 10, 11], close: [10, 12, 12], volume: [100, 200, 300] }],
      adjclose: [{ adjclose: [5, 6, 6] }] },
  }] } };
  const r = parseYahooChart(json);
  assert.equal(r.symbol, "NVDA");
  assert.deepEqual(r.bars.map((b) => b.t), ["2024-01-02", "2024-01-03"]); // null open dropped
  assert.deepEqual([r.bars[1].o, r.bars[1].c], [5.5, 6]);
  assert.throws(() => parseYahooChart({ chart: { result: null, error: { description: "No data found" } } }), /No data found/);
});

test("French free-text earnings dates from the watchlist", () => {
  assert.deepEqual(parseFrenchDate("⚡ 18 mars 2026"), { date: "2026-03-18", precise: true });
  assert.deepEqual(parseFrenchDate("11-13 mai 2026"), { date: "2026-05-11", precise: true });
  assert.deepEqual(parseFrenchDate("Avril 2026"), { date: "2026-04-01", precise: false });
  assert.deepEqual(parseFrenchDate("Juillet 2026"), { date: "2026-07-01", precise: false });
  assert.equal(parseFrenchDate("Inconnu"), null);
  assert.equal(businessDaysBetween("2026-11-06", "2026-11-09"), 1); // Fri → Mon
  assert.equal(addBusinessDays("2026-11-06", 1), "2026-11-09");
  assert.equal(daysBetween("2026-10-30", "2026-11-13"), 14);
});

const rules = { ...defaultRules(10000), equity: 10000 };
const stocks = [
  { ticker: "AAA", sector: "Semi", nextEarnings: "20 novembre 2026" },
  { ticker: "BBB", sector: "Semi", nextEarnings: "15 février 2027" },
  { ticker: "CCC", sector: "Énergie", nextEarnings: "Inconnu" },
];
const today = "2026-11-06";

test("Risk Officer: approves a clean card, vetoes risk, earnings, heat and duplicates", () => {
  const ok = riskOfficer({ order: { ticker: "BBB", side: "long", entry: 50, stop: 48, target: 54, qty: 50 }, rules, journal: [], stocks, today });
  assert.ok(ok.approved, ok.vetoes.join()); assert.equal(ok.risk, 100);
  const tooBig = riskOfficer({ order: { ticker: "BBB", side: "long", entry: 50, stop: 48, target: 54, qty: 60 }, rules, journal: [], stocks, today });
  assert.ok(!tooBig.approved && /f_max/.test(tooBig.vetoes.join()));
  const earnings = riskOfficer({ order: { ticker: "AAA", side: "long", entry: 50, stop: 48, target: 54, qty: 50 }, rules, journal: [], stocks, today });
  assert.ok(!earnings.approved && /Résultats le 2026-11-20/.test(earnings.vetoes.join()));
  const wrongStop = riskOfficer({ order: { ticker: "BBB", side: "long", entry: 50, stop: 52, qty: 10 }, rules, journal: [], stocks, today });
  assert.ok(!wrongStop.approved);
  const open = (id, ticker) => ({ id, ticker, side: "long", planEntry: 50, stop: 48, qty: 50, status: "open", approved: true, mode: "paper", date: today });
  const journal = [open("1", "CCC"), open("2", "DDD"), open("3", "EEE"), open("4", "FFF")];
  const heat = riskOfficer({ order: { ticker: "BBB", side: "long", entry: 50, stop: 48, target: 54, qty: 50 }, rules: { ...rules, heatMax: 0.045 }, journal, stocks, today });
  assert.ok(!heat.approved && /Heat/.test(heat.vetoes.join()));
  const dup = riskOfficer({ order: { ticker: "CCC", side: "long", entry: 50, stop: 48, target: 54, qty: 10 }, rules, journal, stocks, today });
  assert.ok(/déjà ouverte/.test(dup.vetoes.join()));
  const corr = { tickers: ["BBB", "CCC"], matrix: [[1, 0.85], [0.85, 1]] };
  const joint = riskOfficer({ order: { ticker: "BBB", side: "long", entry: 50, stop: 48, target: 54, qty: 50 }, rules: { ...rules, maxOpen: 10 }, journal, stocks, corr, today });
  assert.ok(/un seul pari/.test(joint.vetoes.join()), "two correlated 1 % bets exceed f_max together");
});

test("Kill switch: losing streak, daily loss, slippage and rule breach", () => {
  const closed = (id, exitDate, exitPrice, extra = {}) => ({ id, ticker: "X" + id, side: "long", planEntry: 100, fill: 100, stop: 98, qty: 50,
    status: "closed", exitDate, exitPrice, date: exitDate, approved: true, mode: "paper", ...extra });
  const journal = [closed("1", "2026-11-03", 101), closed("2", "2026-11-04", 99), closed("3", "2026-11-05", 99), closed("4", today, 96)];
  const ks = Object.fromEntries(killSwitch({ journal, rules, today, dataset: null }).map((k) => [k.id, k]));
  assert.ok(ks.streak.fired, ks.streak.value);
  assert.ok(ks.daily.fired, ks.daily.value); // −4 × 50 = −200 = −2 %
  assert.ok(ks.stale.na && !ks.stale.fired);
  assert.ok(!ks.slip.fired && !ks.breach.fired);
  const openOne = { id: "6", ticker: "Y", side: "long", planEntry: 50, stop: 49, qty: 10, status: "open", approved: true, mode: "paper", date: today };
  const stale = { bars: [{ t: "2026-10-29" }] };
  const slip = killSwitch({ journal: [{ ...closed("5", today, 101), fill: 101 }, openOne], rules, today, dataset: stale });
  const k2 = Object.fromEntries(slip.map((k) => [k.id, k]));
  assert.ok(k2.slip.fired); assert.ok(k2.stale.fired);
  const idle = killSwitch({ journal: [], rules, today, dataset: stale }).find((k) => k.id === "stale");
  assert.ok(!idle.fired, "stale data only matters while positions are open");
  const breach = killSwitch({ journal: [{ id: "9", ticker: "Z", side: "long", planEntry: 100, stop: 90, qty: 50, status: "open", mode: "live", approved: false, date: today }], rules, today });
  assert.ok(breach.find((k) => k.id === "breach").fired);
  assert.equal(tradeMetrics(closed("x", today, 104), rules).R, 2);
});

test("Ladder: rung 2 needs 20 paper trades with z > −2", () => {
  const strat = { id: "s1", name: "S", rung: 2, rungSince: "2026-10-01", status: "active",
    backtest: { mean: 0.01, std: 0.02, returns: [0.03, -0.01, 0.02, -0.01] } };
  const mk = (i, exit) => ({ id: String(i), strategyId: "s1", rung: 2, mode: "paper", side: "long", planEntry: 100, fill: 100, stop: 98, qty: 1,
    status: "closed", exitDate: today, exitPrice: exit, date: today, approved: true });
  const good = Array.from({ length: 20 }, (_, i) => mk(i, i % 2 ? 103 : 99.5));
  const h = strategyHealth(strat, good, { ...rules, commission: 0 });
  assert.equal(h.z.n, 20);
  assert.ok(advanceCheck(strat, h, good, rules, today).ok);
  const bad = Array.from({ length: 20 }, (_, i) => mk(i, 98));
  const hb = strategyHealth(strat, bad, { ...rules, commission: 0 });
  const chk = advanceCheck(strat, hb, bad, rules, today);
  assert.ok(!chk.ok && chk.fail);
  assert.ok(hb.drift, "20 straight −2 % trades sit below the Monte Carlo 5th percentile");
  assert.ok(!advanceCheck({ ...strat, rung: 1, rungSince: "2026-11-01" }, h, [], rules, today).ok);
});
