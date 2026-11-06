import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ema, rma, rsi, trueRange, sma, percentileLinear, rollingPercentile, normCdf, normInv,
  expectedMaxSharpe, deflatedSharpe, positionSize, kellyFraction, cappedFraction, consistencyZ,
  monteCarloFloor, maxDrawdown, equityStats, backtest, prepare, centeredGrid, walkForward, runLab,
  correlationClusters, portfolioVol, covarianceMatrix, pearson, alignedReturns, DEFAULT_PARAMS, portfolioHeat,
} from "../src/desk/quant.js";
import { deskSignalPine } from "../src/desk/pine.js";

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

test("EMA (9) is seeded with the SMA like Pine's ta.ema", () => {
  const e = ema([1, 2, 3, 4, 5], 3);
  assert.ok(Number.isNaN(e[0]) && Number.isNaN(e[1]));
  close(e[2], 2); close(e[3], 3); close(e[4], 4); // α = 0.5
  close(rma([2, 2, 2, 2], 2)[3], 2);
  close(sma([1, 2, 3, 4], 2)[3], 3.5);
});

test("RSI (10) uses Wilder averages", () => {
  const r = rsi([1, 2, 1, 2], 2);
  close(r[2], 50); close(r[3], 75);
  assert.equal(rsi([1, 2, 3, 4, 5, 6], 3)[5], 100);
  assert.equal(rsi([6, 5, 4, 3, 2, 1], 3)[5], 0);
});

test("True range and percentile with linear interpolation (12)", () => {
  assert.deepEqual(trueRange([10, 12, 11], [9, 10, 8], [9.5, 11, 10]), [1, 2.5, 3]);
  close(percentileLinear([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90), 9.1);
  const q = rollingPercentile([1, 2, 3, 4, 5], 3, 50);
  assert.ok(Number.isNaN(q[1])); close(q[2], 2); close(q[4], 4);
});

test("Normal CDF / inverse", () => {
  close(normCdf(0), 0.5, 1e-7); close(normCdf(1.959964), 0.975, 1e-6); close(normCdf(-3), 0.0013499, 1e-6);
  close(normInv(0.975), 1.959964, 1e-5); close(normInv(0.01), -2.326348, 1e-5);
});

test("Expected max Sharpe (7) matches simulation better than √(2 ln N)", () => {
  // E[max of 100 standard normals] ≈ 2.5076
  close(expectedMaxSharpe(100, 1), 2.5076, 0.05);
  assert.equal(expectedMaxSharpe(1, 1), 0);
  close(expectedMaxSharpe(100, 0.5), 0.5 * expectedMaxSharpe(100, 1), 1e-12);
});

test("Deflated Sharpe (8): N = 1 reduces to the probabilistic Sharpe ratio", () => {
  const sr = 0.05, T = 1000;
  const { dsr, sr0 } = deflatedSharpe({ sr, T, skew: 0, kurt: 3, N: 1, sigmaSR: 0.02 });
  assert.equal(sr0, 0);
  close(dsr, normCdf((sr * Math.sqrt(T - 1)) / Math.sqrt(1 + sr * sr / 2)), 1e-12);
  const deflated = deflatedSharpe({ sr, T, N: 1000, sigmaSR: 0.02 }).dsr;
  assert.ok(deflated < dsr, "more trials must lower the DSR");
  // Negative skew and fat tails lower it too.
  assert.ok(deflatedSharpe({ sr, T, skew: -1, kurt: 8, N: 1 }).dsr < dsr);
});

test("Fixed-fractional sizing (13): the paper's example", () => {
  const s = positionSize({ equity: 10000, f: 0.01, entry: 50, stop: 48 });
  close(s.q, 50); close(s.risk, 100); assert.equal(s.qInt, 50);
  assert.equal(positionSize({ equity: 10000, f: 0.01, entry: 50, stop: 50 }), null);
});

test("Kelly (15) and the quarter-Kelly cap (16): the paper's example", () => {
  close(kellyFraction(0.55, 1.5), 0.25);
  close(cappedFraction(0.25, 0.01), 0.01);    // the 1 % cap binds
  close(cappedFraction(0.25, 0.10), 0.0625);  // quarter Kelly = 6.25 %
  assert.equal(cappedFraction(-0.1, 0.01), 0); // no edge → no trade
});

test("Heat (18), consistency z (19) and Monte Carlo floor", () => {
  close(portfolioHeat([100, 150, 250], 10000), 0.05);
  const { z, n } = consistencyZ([0.01, 0.02, 0.03, 0.02], 0.03, 0.02);
  assert.equal(n, 4); close(z, (0.02 - 0.03) / (0.02 / 2));
  close(monteCarloFloor([0.01], 10), 0.1, 1e-12);
  const f = monteCarloFloor([-0.02, 0.03], 20);
  assert.ok(f < 20 * 0.005 && f >= 20 * -0.02);
  assert.equal(monteCarloFloor([-0.02, 0.03], 20), f, "seeded → reproducible");
});

test("Drawdown (6) and Sharpe (5)", () => {
  close(maxDrawdown([1, 1.2, 0.9, 1.3, 1.04]), 0.25);
  const es = equityStats([1, 1.5, 2.25, 3.375]);
  close(es.total, 2.375, 1e-12); assert.equal(es.sharpe, 0); // zero variance → 0, not Infinity
  const flat = equityStats([1, 1, 1, 1]);
  assert.equal(flat.sharpe, 0); assert.equal(flat.mdd, 0);
});

// ─── Backtest mechanics on hand-made bars ────────────────────────────────────
function ctxFrom(bars, atrValue = 1) {
  const n = bars.length;
  return {
    n, o: bars.map((b) => b[0]), h: bars.map((b) => b[1]), l: bars.map((b) => b[2]), c: bars.map((b) => b[3]),
    atr: new Array(n).fill(atrValue), _cache: new Map(),
  };
}
const sigAt = (n, idx, dir = "buy") => {
  const buy = new Array(n).fill(false), sell = new Array(n).fill(false);
  (dir === "buy" ? buy : sell)[idx] = true;
  return { buy, sell };
};
const P = { ...DEFAULT_PARAMS, stopK: 2, targetR: 2, maxHold: 20 };
const noCost = { commission: 0, slippage: 0 };

test("Entry at next open, exit at target, equity matches the trade", () => {
  // signal at bar 1 → entry at open of bar 2 (100), stop 98, target 104 hit on bar 3
  const ctx = ctxFrom([[100, 101, 99, 100], [100, 101, 99, 100], [100, 101, 99.5, 100.5], [101, 104.5, 100.8, 104], [104, 105, 103, 104]]);
  const bt = backtest(ctx, sigAt(5, 1), P, { start: 0, end: 5, costs: noCost, riskFraction: 0.01 });
  assert.equal(bt.trades.length, 1);
  const t = bt.trades[0];
  assert.equal(t.entryIdx, 2); assert.equal(t.exitIdx, 3); assert.equal(t.reason, "objectif");
  close(t.entry, 100); close(t.exit, 104); close(t.gross, 0.04); close(t.R, 2);
  close(t.w, 0.5); // f·P/(k·ATR) = 0.01·100/2
  close(bt.equity[4], 1 + t.w * t.net, 1e-12);
});

test("Stop is assumed hit before target inside the same bar; costs follow (4)", () => {
  const ctx = ctxFrom([[100, 100, 100, 100], [100, 100, 100, 100], [100, 105, 97, 101], [101, 101, 101, 101]]);
  const costs = { commission: 0.001, slippage: 0.0005 };
  const bt = backtest(ctx, sigAt(4, 1), P, { start: 0, end: 4, costs, riskFraction: 0.01 });
  const t = bt.trades[0];
  assert.equal(t.reason, "stop"); close(t.exit, 98); close(t.gross, -0.02);
  close(bt.cRT, 0.003); close(t.net, -0.023);
  close(bt.equity[3], 1 + t.w * t.net, 1e-12);
});

test("Gap through the stop fills at the open; time exit after maxHold", () => {
  const gap = ctxFrom([[100, 100, 100, 100], [100, 100, 100, 100], [100, 100.5, 99.5, 100], [95, 96, 94, 95]]);
  const t1 = backtest(gap, sigAt(4, 1), P, { start: 0, end: 4, costs: noCost }).trades[0];
  assert.equal(t1.reason, "stop (gap)"); close(t1.exit, 95);
  const flat = ctxFrom(Array.from({ length: 30 }, () => [100, 100.5, 99.5, 100]));
  const t2 = backtest(flat, sigAt(30, 1), { ...P, maxHold: 5 }, { start: 0, end: 30, costs: noCost }).trades[0];
  assert.equal(t2.reason, "temps"); assert.equal(t2.exitIdx - t2.entryIdx + 1, 5);
});

test("A gap through the target fills at the open even if the bar later trades through the stop", () => {
  const ctx = ctxFrom([[100, 100, 100, 100], [100, 100, 100, 100], [100, 100.5, 99.5, 100], [106, 107, 97, 98], [98, 98, 98, 98]]);
  const t = backtest(ctx, sigAt(5, 1), P, { start: 0, end: 5, costs: noCost }).trades[0];
  assert.equal(t.reason, "objectif (gap)"); close(t.exit, 106); close(t.gross, 0.06);
  const cs = ctxFrom([[100, 100, 100, 100], [100, 100, 100, 100], [100, 100.5, 99.5, 100], [94, 103, 93, 102], [102, 102, 102, 102]]);
  const s = backtest(cs, sigAt(5, 1, "sell"), { ...P, direction: "both" }, { start: 0, end: 5, costs: noCost }).trades[0];
  assert.equal(s.reason, "objectif (gap)"); close(s.exit, 94); close(s.gross, 0.06);
});

test("Short trades and the noise test's extra bar of delay", () => {
  const ctx = ctxFrom([[100, 100, 100, 100], [100, 100, 100, 100], [100, 100.5, 95.5, 96], [96, 96, 94, 95], [95, 95, 95, 95]]);
  const short = backtest(ctx, sigAt(5, 1, "sell"), { ...P, direction: "both" }, { start: 0, end: 5, costs: noCost }).trades[0];
  assert.equal(short.dir, -1); assert.equal(short.reason, "objectif"); close(short.exit, 96); close(short.gross, 0.04);
  assert.equal(backtest(ctx, sigAt(5, 1, "sell"), P, { start: 0, end: 5, costs: noCost }).trades.length, 0, "long-only ignores sells");
  const delayed = backtest(ctx, sigAt(5, 1), P, { start: 0, end: 5, costs: noCost, delay: 1 }).trades[0];
  assert.equal(delayed.entryIdx, 3);
});

// ─── Full pipeline on synthetic data (structure only — synthetic prices are never shown to the user) ──
function syntheticBars(n, seed = 1, drift = 0.0004) {
  let s = seed >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd());
  const bars = [];
  let c = 100;
  for (let i = 0; i < n; i++) {
    const o = c * (1 + 0.003 * gauss());
    c = o * (1 + drift + 0.015 * gauss());
    const h = Math.max(o, c) * (1 + Math.abs(0.006 * gauss())), l = Math.min(o, c) * (1 - Math.abs(0.006 * gauss()));
    const d = new Date(Date.UTC(2015, 0, 1) + i * 86400000).toISOString().slice(0, 10);
    bars.push({ t: d, o, h, l, c, v: 1e6 * (1 + Math.abs(gauss())) });
  }
  return bars;
}

test("Walk-forward windows tile the history without overlap", () => {
  const ctx = prepare(syntheticBars(1500, 3));
  const wf = walkForward(ctx, DEFAULT_PARAMS, centeredGrid(DEFAULT_PARAMS).slice(0, 4), { start0: 200, trainBars: 504, testBars: 126 });
  assert.ok(wf.windows.length >= 5);
  wf.windows.forEach((w, i) => {
    assert.equal(w.testStart - w.trainStart, 504);
    if (i) assert.equal(w.testStart, wf.windows[i - 1].testEnd);
    for (const t of w.trades) assert.ok(t.entryIdx >= w.testStart && t.exitIdx < w.testEnd);
  });
  assert.equal(wf.windows.at(-1).testEnd, 1500);
});

test("runLab returns the 7 gates of Table III", () => {
  const lab = runLab(syntheticBars(2200, 11), DEFAULT_PARAMS, { costs: { commission: 0.0005, slippage: 0.0005 } });
  assert.equal(lab.gates.length, 7);
  assert.deepEqual(lab.gates.map((g) => g.id), ["count", "oos", "dsr", "wf", "year", "plateau", "noise"]);
  assert.equal(lab.N, 81); assert.equal(lab.grid.size, 81);
  assert.ok(lab.historyOK); assert.ok(lab.dsr.dsr >= 0 && lab.dsr.dsr <= 1);
  assert.equal(lab.pass, lab.gates.every((g) => g.pass));
  assert.equal(lab.buyHold.length, lab.full.equity.length);
  assert.ok(lab.full.n > 0, "the signal fires on a drifting random walk");
  for (const t of lab.full.trades) assert.ok(t.exitIdx >= t.entryIdx && t.entryIdx > t.signalIdx);
  assert.throws(() => runLab(syntheticBars(220, 2), DEFAULT_PARAMS), /trop court/);
});

test("Without volume data the 27 distinct variants count as N, not 81 duplicates", () => {
  const noVol = syntheticBars(1600, 5).map((b) => ({ ...b, v: NaN }));
  const lab = runLab(noVol, DEFAULT_PARAMS, {});
  assert.equal(lab.hasVolume, false);
  assert.equal(lab.grid.size, 27); assert.equal(lab.N, 27);
  assert.ok(lab.plateau.neighbours.every((x) => x.key !== "volMult"));
  assert.equal(centeredGrid(DEFAULT_PARAMS, false).length, 27);
});

test("Correlation, clusters and portfolio volatility (17)", () => {
  const a = [0.01, -0.02, 0.015, 0.005, -0.01], b = a.map((x) => 2 * x), c = [0.01, 0.01, -0.02, 0.0, 0.003];
  close(pearson(a, b), 1, 1e-12);
  const corr = [[1, 0.9, 0.1], [0.9, 1, 0.2], [0.1, 0.2, 1]];
  assert.deepEqual(correlationClusters(corr, 0.7).map((g) => g.sort()), [[0, 1], [2]]);
  const cov = covarianceMatrix([a, b], 1);
  close(portfolioVol([0.5, 0.5], cov), Math.sqrt(0.25 * cov[0][0] + 0.25 * cov[1][1] + 0.5 * cov[0][1]), 1e-12);
  const al = alignedReturns([[{ t: "d1", c: 1 }, { t: "d2", c: 2 }, { t: "d3", c: 3 }], [{ t: "d1", c: 1 }, { t: "d3", c: 2 }]]);
  assert.deepEqual(al.dates, ["d1", "d3"]); assert.deepEqual(al.returns, [[2], [1]]);
  assert.ok(Number.isFinite(pearson(a, c)));
});

test("Pine Script carries the lab parameters", () => {
  const s = deskSignalPine({ ...DEFAULT_PARAMS, breakout: 30, volMult: 1.75 });
  assert.match(s, /^\/\/@version=6/);
  assert.match(s, /input\.int\(30,/); assert.match(s, /input\.float\(1\.75,/);
  assert.match(s, /ta\.percentile_linear_interpolation\(atr, 100, 90\)/);
});
