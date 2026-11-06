import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCSV, splitCSVLine, parseYahooChart, parseFrenchDate, businessDaysBetween, addBusinessDays, daysBetween } from "../src/desk/data.js";
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
  assert.deepEqual(parseFrenchDate("⚡ 18 mars 2026"), { date: "2026-03-18", end: "2026-03-18", precise: true });
  assert.deepEqual(parseFrenchDate("11-13 mai 2026"), { date: "2026-05-11", end: "2026-05-13", precise: true });
  assert.deepEqual(parseFrenchDate("1er décembre 2026"), { date: "2026-12-01", end: "2026-12-01", precise: true });
  assert.deepEqual(parseFrenchDate("Avril 2026"), { date: "2026-04-01", end: "2026-04-30", precise: false });
  assert.deepEqual(parseFrenchDate("Février 2028"), { date: "2028-02-01", end: "2028-02-29", precise: false });
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
  assert.ok(!heat.approved && /Risque ouvert après/.test(heat.vetoes.join()));
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

// ─── Regressions from the independent audit ─────────────────────────────────
test("CSV: quoted fields, Investing.com FR export, K/M volumes, decimal detection", () => {
  assert.deepEqual(splitCSVLine('"2026-11-02","1,234.50",x', ","), ["2026-11-02", "1,234.50", "x"]);
  const us = parseCSV('Date,Open,High,Low,Close,Volume\n"11/02/2026","1,234.50","1,240.00","1,225.00","1,230.00","1,000,000"\n"10/31/2026","1,200.00","1,236.00","1,199.00","1,234.00","900,000"\n');
  assert.deepEqual(us.bars.map((b) => b.t), ["2026-10-31", "2026-11-02"]); // quoted MM/DD detected
  assert.deepEqual([us.bars[1].o, us.bars[1].c, us.bars[1].v, us.bars[0].v], [1234.5, 1230, 1e6, 9e5]);
  const inv = parseCSV('"Date","Dernier","Ouv."," Plus Haut","Plus Bas","Vol.","Variation %"\n"06/11/2026","222,72","221,80","224,10","220,05","1,23M","0,42%"\n"05/11/2026","221,80","219,00","222,00","218,50","850,00K","-0,10%"\n');
  assert.equal(inv.decimal, ",");
  assert.deepEqual([inv.bars[1].t, inv.bars[1].c, inv.bars[1].o, inv.bars[1].v, inv.bars[0].v], ["2026-11-06", 222.72, 221.8, 1230000, 850000]);
  const tsv = parseCSV("Date\tOpen\tHigh\tLow\tClose\tVolume\n2026-11-02\t1,234.50\t1,240.00\t1,225.00\t1,230.25\t1,000,000\n2026-11-03\t1,230.00\t1,236.00\t1,220.00\t1,233.00\t900,000\n");
  assert.deepEqual([tsv.bars[0].o, tsv.bars[0].c, tsv.bars[0].v], [1234.5, 1230.25, 1e6]);
  const fr = parseCSV("Date;Open;High;Low;Close;Volume\n02/11/2026;10,5;11;10;10,8;850.000\n03/11/2026;10,8;11,2;10,6;11;1.250.000\n");
  assert.deepEqual(fr.bars.map((b) => b.v), [850000, 1250000]);
  const bad = parseCSV("Date,Open,High,Low,Close\n2026-13-02,1,2,1,1.5\n2026-11-02,1,2,1,1.5\n2026-11-03,1,2,1,1.5\n");
  assert.equal(bad.bars.length, 2); assert.ok(bad.warnings.some((w) => /1 ligne/.test(w)));
});

test("Risk Officer: correlation respects direction and whole clusters", () => {
  const r = { ...rules, maxOpen: 10 };
  const corr = { tickers: ["AAA", "BBB", "CCC"], matrix: [[1, 0.9, 0.9], [0.9, 1, 0.9], [0.9, 0.9, 1]] };
  const pos = (id, ticker, side, qty) => ({ id, ticker, side, planEntry: 50, stop: side === "short" ? 52 : 48, qty, status: "open", approved: true, mode: "paper", date: today });
  const order = (ticker, side, qty) => ({ ticker, side, entry: 50, stop: side === "short" ? 52 : 48, target: side === "short" ? 46 : 54, qty });
  const hedge = riskOfficer({ order: order("BBB", "short", 30), rules: r, journal: [pos("1", "AAA", "long", 50)], corr, today });
  assert.ok(!hedge.vetoes.some((v) => /pari/.test(v)), "long A + short B with ρ > 0 is a hedge");
  assert.ok(hedge.warnings.some((w) => /couvre/.test(w)));
  const neg = { tickers: ["AAA", "BBB"], matrix: [[1, -0.9], [-0.9, 1]] };
  const doubled = riskOfficer({ order: order("BBB", "short", 30), rules: r, journal: [pos("1", "AAA", "long", 50)], corr: neg, today });
  assert.ok(doubled.vetoes.some((v) => /un seul pari/.test(v)), "long A + short B with ρ < 0 doubles the bet");
  // Capital 10 000, stop distance 2: AAA 25 → 0.5 %, BBB 25 → 0.5 %, CCC 20 → 0.4 %; each pair ≤ 1 %, the bet is 1.4 %.
  const cluster = riskOfficer({ order: order("CCC", "long", 20), rules: r, journal: [pos("1", "AAA", "long", 25), pos("2", "BBB", "long", 25)], corr, today });
  assert.ok(cluster.vetoes.some((v) => /AAA, BBB/.test(v)), cluster.vetoes.join(" | "));
});

test("Risk Officer: an earnings range overlapping the hold is vetoed", () => {
  const st = [{ ticker: "DDD", sector: "X", nextEarnings: "1-3 décembre 2026" }];
  const ro = riskOfficer({ order: { ticker: "DDD", side: "long", entry: 50, stop: 48, target: 54, qty: 10, date: "2026-12-02" }, rules, journal: [], stocks: st, today: "2026-12-02" });
  assert.ok(ro.vetoes.some((v) => /entre le 2026-12-01 et le 2026-12-03/.test(v)), ro.vetoes.join() + ro.warnings.join());
  const later = riskOfficer({ order: { ticker: "DDD", side: "long", entry: 50, stop: 48, target: 54, qty: 10, date: "2026-12-04" }, rules, journal: [], stocks: st, today: "2026-12-04" });
  assert.ok(later.approved && later.warnings.some((w) => /dépassée/.test(w)));
});
