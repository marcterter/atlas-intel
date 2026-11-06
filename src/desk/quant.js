// ─── DESK · QUANT ENGINE ─────────────────────────────────────────────────────
// Pure maths, no React / DOM. Equation numbers (n) refer to the paper
// "How to Build a One-Person Hedge Fund With Grok Bot…" (sections III → VI).

export const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const round2 = (x) => Math.round(x * 100) / 100;

export const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN);
export const sum = (a) => a.reduce((s, x) => s + x, 0);
export function stdev(a) {
  if (a.length < 2) return NaN;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
}
/** Skewness γ3 and (non-excess) kurtosis γ4 — a normal distribution gives γ4 = 3. */
export function moments(a) {
  const n = a.length;
  if (n < 3) return { skew: 0, kurt: 3 };
  const m = mean(a);
  let m2 = 0, m3 = 0, m4 = 0;
  for (const x of a) { const d = x - m; m2 += d * d; m3 += d ** 3; m4 += d ** 4; }
  m2 /= n; m3 /= n; m4 /= n;
  if (!(m2 > 0)) return { skew: 0, kurt: 3 };
  return { skew: m3 / m2 ** 1.5, kurt: m4 / (m2 * m2) };
}

// ─── Normal distribution ─────────────────────────────────────────────────────
function erfc(x) { // Numerical Recipes erfcc, fractional error < 1.2e-7
  const z = Math.abs(x), t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 +
    t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
/** Φ — standard normal CDF. */
export const normCdf = (x) => 0.5 * erfc(-x / Math.SQRT2);
/** Φ⁻¹ — inverse standard normal CDF (Acklam, relative error < 1.2e-9). */
export function normInv(p) {
  if (!(p > 0)) return -Infinity;
  if (!(p < 1)) return Infinity;
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const tail = (q) => (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  if (p < 0.02425) return tail(Math.sqrt(-2 * Math.log(p)));
  if (p > 1 - 0.02425) return -tail(Math.sqrt(-2 * Math.log(1 - p)));
  const q = p - 0.5, r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

// ─── Indicators (Pine Script v6 semantics, so values match TradingView) ──────
export function sma(src, n) {
  const out = new Array(src.length).fill(NaN);
  let acc = 0, bad = 0;
  for (let i = 0; i < src.length; i++) {
    if (isNum(src[i])) acc += src[i]; else bad++;
    if (i >= n) { if (isNum(src[i - n])) acc -= src[i - n]; else bad--; }
    if (i >= n - 1 && bad === 0) out[i] = acc / n;
  }
  return out;
}
// Pine's ta.ema / ta.rma: seeded with the SMA of the first n values, then recursive.
function pineSmooth(src, n, alpha) {
  const out = new Array(src.length).fill(NaN);
  let prev = NaN, run = 0, acc = 0;
  for (let i = 0; i < src.length; i++) {
    const x = src[i];
    if (!isNum(x)) { if (!isNum(prev)) { run = 0; acc = 0; } continue; }
    if (isNum(prev)) { prev = alpha * x + (1 - alpha) * prev; out[i] = prev; continue; }
    run++; acc += x;
    if (run === n) { prev = acc / n; out[i] = prev; }
  }
  return out;
}
/** (9) EMA_t = α·P_t + (1−α)·EMA_{t−1}, α = 2/(n+1) */
export const ema = (src, n) => pineSmooth(src, n, 2 / (n + 1));
/** Wilder's moving average (used by RSI and ATR). */
export const rma = (src, n) => pineSmooth(src, n, 1 / n);
/** TR_t = max(H−L, |H−C_{t−1}|, |L−C_{t−1}|) */
export function trueRange(h, l, c) {
  return h.map((hi, i) => (i === 0 ? hi - l[i]
    : Math.max(hi - l[i], Math.abs(hi - c[i - 1]), Math.abs(l[i] - c[i - 1]))));
}
export const atr = (h, l, c, n = 14) => rma(trueRange(h, l, c), n);
/** (10) RSI_t = 100 − 100/(1+RS_t), RS = Ḡ14/L̄14 (Wilder averages) */
export function rsi(c, n = 14) {
  const up = c.map((x, i) => (i === 0 ? NaN : Math.max(x - c[i - 1], 0)));
  const dn = c.map((x, i) => (i === 0 ? NaN : Math.max(c[i - 1] - x, 0)));
  const au = rma(up, n), ad = rma(dn, n);
  return au.map((u, i) => {
    const d = ad[i];
    if (!isNum(u) || !isNum(d)) return NaN;
    if (d === 0) return 100;
    if (u === 0) return 0;
    return 100 - 100 / (1 + u / d);
  });
}
function rollingExtreme(src, n, pick) {
  const out = new Array(src.length).fill(NaN);
  for (let i = n - 1; i < src.length; i++) {
    let v = src[i - n + 1];
    for (let j = i - n + 2; j <= i; j++) v = pick(v, src[j]);
    out[i] = v;
  }
  return out;
}
export const rollingMax = (src, n) => rollingExtreme(src, n, Math.max);
export const rollingMin = (src, n) => rollingExtreme(src, n, Math.min);
/** Percentile with linear interpolation between the closest ranks (p in 0–100). */
export function percentileLinear(values, p) {
  const a = values.filter(isNum).sort((x, y) => x - y);
  if (!a.length) return NaN;
  const r = (p / 100) * (a.length - 1), lo = Math.floor(r), hi = Math.ceil(r);
  return a[lo] + (a[hi] - a[lo]) * (r - lo);
}
export function rollingPercentile(src, n, p) {
  const out = new Array(src.length).fill(NaN);
  for (let i = n - 1; i < src.length; i++) {
    const w = src.slice(i - n + 1, i + 1);
    if (w.every(isNum)) out[i] = percentileLinear(w, p);
  }
  return out;
}

// ─── Desk Signal (Section IV.C, Listing 1) ───────────────────────────────────
export const DEFAULT_PARAMS = {
  breakout: 20,      // (11) close above the prior N-bar high
  volMult: 1.5,      // (11) V_t ≥ 1.5·V̄20
  stopK: 2,          // V.B  stop = k·ATR14
  targetR: 2,        // target = targetR × stop distance
  maxHold: 20,       // Desk Rules: maximum holding period (bars)
  direction: "long", // "long" | "both"
};

/** Clamps user-typed parameters to valid values (falls back to the paper's defaults). */
export function sanitizeParams(p) {
  const num = (x, d) => (isNum(Number(x)) && Number(x) > 0 ? Number(x) : d);
  return {
    breakout: Math.max(2, Math.round(num(p.breakout, DEFAULT_PARAMS.breakout))),
    volMult: isNum(Number(p.volMult)) && Number(p.volMult) >= 0 ? Number(p.volMult) : DEFAULT_PARAMS.volMult,
    stopK: num(p.stopK, DEFAULT_PARAMS.stopK),
    targetR: num(p.targetR, DEFAULT_PARAMS.targetR),
    maxHold: Math.max(1, Math.round(num(p.maxHold, DEFAULT_PARAMS.maxHold))),
    direction: p.direction === "both" ? "both" : "long",
  };
}

/** Pre-computes everything that does not depend on the tunable parameters. */
export function prepare(bars) {
  const o = bars.map((b) => b.o), h = bars.map((b) => b.h), l = bars.map((b) => b.l), c = bars.map((b) => b.c);
  const v = bars.map((b) => b.v);
  const hasVolume = v.some((x) => isNum(x) && x > 0);
  const e8 = ema(c, 8), e21 = ema(c, 21), e50 = ema(c, 50), e200 = ema(c, 200);
  const a = atr(h, l, c, 14);
  const atrQ = rollingPercentile(a, 100, 90);
  const ctx = {
    n: bars.length, dates: bars.map((b) => b.t), o, h, l, c, v, hasVolume,
    e8, e21, e50, e200, rsi: rsi(c, 14), atr: a, atrQ, volSma: hasVolume ? sma(v, 20) : null,
    // Ribbon fully stacked (bullish) or reversed (bearish). NaN comparisons are false.
    up: c.map((_, i) => e8[i] > e21[i] && e21[i] > e50[i] && e50[i] > e200[i]),
    dn: c.map((_, i) => e8[i] < e21[i] && e21[i] < e50[i] && e50[i] < e200[i]),
    // (12) signals blocked when ATR14 > Q0.90(ATR14 over the last 100 bars)
    calm: a.map((x, i) => isNum(x) && isNum(atrQ[i]) && x <= atrQ[i]),
    _cache: new Map(),
  };
  return ctx;
}

/** (11) BUY_t = 1[C_t > max H_{t−N:t−1} ∧ V_t ≥ m·V̄20 ∧ RSI_t > 50] (+ calm filter), SELL mirrored. */
export function signals(ctx, p) {
  const key = `${p.breakout}|${p.volMult}`;
  if (ctx._cache.has(key)) return ctx._cache.get(key);
  const hh = rollingMax(ctx.h, p.breakout), ll = rollingMin(ctx.l, p.breakout);
  const buy = new Array(ctx.n).fill(false), sell = new Array(ctx.n).fill(false);
  for (let i = 1; i < ctx.n; i++) {
    const volOK = !ctx.hasVolume || (isNum(ctx.volSma[i]) && ctx.v[i] >= p.volMult * ctx.volSma[i]);
    if (!volOK || !ctx.calm[i]) continue;
    buy[i] = ctx.up[i] && ctx.c[i] > hh[i - 1] && ctx.rsi[i] > 50;
    sell[i] = ctx.dn[i] && ctx.c[i] < ll[i - 1] && ctx.rsi[i] < 50;
  }
  const out = { buy, sell };
  ctx._cache.set(key, out);
  return out;
}

/** First bar where every indicator is defined. */
export function warmupIndex(ctx, maxBreakout = 20) {
  for (let i = maxBreakout; i < ctx.n; i++) {
    if (isNum(ctx.e200[i]) && isNum(ctx.rsi[i]) && isNum(ctx.atrQ[i]) && (!ctx.hasVolume || isNum(ctx.volSma[i]))) return i;
  }
  return ctx.n;
}

/**
 * Event-driven backtest on bars [start, end).
 * Signal at the close of t → entry at the open of t+1(+delay). Stop = k·ATR, target = R × stop distance,
 * time exit after maxHold bars. Gaps fill at the open; inside a bar the stop is checked before the target.
 * Sizing follows (14): notional fraction w = f·P_e/(k·ATR), capped at 100 % (no leverage).
 * (4) every round trip is charged c_rt = 2·(commission + slippage).
 */
export function backtest(ctx, sig, p, { start, end, costs = {}, riskFraction = 0.01, delay = 0, slipMult = 1 } = {}) {
  const { o, h, l, c } = ctx;
  const cRT = 2 * ((costs.commission ?? 0.0005) + (costs.slippage ?? 0.0005) * slipMult);
  const trades = [], equity = new Array(Math.max(0, end - start)).fill(NaN);
  let cash = 1, shares = 0, pos = null, pending = null, inMarket = 0;

  for (let t = start; t < end; t++) {
    if (!pos && pending && pending.at === t) {
      const entry = o[t], D = p.stopK * pending.atr;
      if (D > 0 && entry > 0) {
        const w = Math.min(1, (riskFraction * entry) / D);
        const q = (w * cash) / entry;
        shares = pending.dir * q;
        cash -= shares * entry + (q * entry * cRT) / 2;
        pos = { dir: pending.dir, signalIdx: pending.signalIdx, entryIdx: t, entry, D, q, w,
          stop: entry - pending.dir * D, target: entry + pending.dir * p.targetR * D };
      }
      pending = null;
    }
    if (pos) {
      inMarket++;
      const { dir, stop, target } = pos, later = t > pos.entryIdx;
      let exit = null, reason = null;
      // The open is the first print: a gap through either level fills there. Inside the bar the
      // order of high and low is unknown, so the stop is assumed to come first.
      if (dir > 0) {
        if (later && o[t] <= stop) { exit = o[t]; reason = "stop (gap)"; }
        else if (later && o[t] >= target) { exit = o[t]; reason = "objectif (gap)"; }
        else if (l[t] <= stop) { exit = stop; reason = "stop"; }
        else if (h[t] >= target) { exit = target; reason = "objectif"; }
      } else {
        if (later && o[t] >= stop) { exit = o[t]; reason = "stop (gap)"; }
        else if (later && o[t] <= target) { exit = o[t]; reason = "objectif (gap)"; }
        else if (h[t] >= stop) { exit = stop; reason = "stop"; }
        else if (l[t] <= target) { exit = target; reason = "objectif"; }
      }
      if (exit === null && t - pos.entryIdx + 1 >= p.maxHold) { exit = c[t]; reason = "temps"; }
      if (exit === null && t === end - 1) { exit = c[t]; reason = "fin de fenêtre"; }
      if (exit !== null) {
        cash += shares * exit - (pos.q * pos.entry * cRT) / 2;
        const gross = (dir * (exit - pos.entry)) / pos.entry;
        trades.push({ dir, signalIdx: pos.signalIdx, entryIdx: pos.entryIdx, exitIdx: t, entry: pos.entry, exit,
          stop: pos.stop, target: pos.target, w: pos.w, reason, gross, net: gross - cRT, R: (dir * (exit - pos.entry)) / pos.D });
        shares = 0; pos = null;
      }
    }
    equity[t - start] = cash + shares * c[t];
    if (!pos && !pending && t + 1 + delay < end) {
      const dir = sig.buy[t] ? 1 : p.direction === "both" && sig.sell[t] ? -1 : 0;
      if (dir && ctx.atr[t] > 0) pending = { dir, at: t + 1 + delay, atr: ctx.atr[t], signalIdx: t };
    }
  }
  return { trades, equity, start, end, cRT, exposure: end > start ? inMarket / (end - start) : 0 };
}

/** Per-trade statistics — R_net = R_gross − n·c_rt (4). */
export function tradeStats(trades, cRT = 0) {
  const r = trades.map((t) => t.net), wins = r.filter((x) => x > 0), losses = r.filter((x) => x < 0);
  const avgWin = mean(wins), avgLoss = mean(losses);
  return {
    n: trades.length,
    winRate: trades.length ? wins.length / trades.length : NaN,
    payoff: wins.length && losses.length ? avgWin / Math.abs(avgLoss) : NaN,
    mean: mean(r), std: stdev(r),
    Rgross: sum(trades.map((t) => t.gross)), Rnet: sum(r), costs: trades.length * cRT,
    avgR: mean(trades.map((t) => t.R)),
  };
}

/** (6) MDD = max_t (P_t − V_t)/P_t with P_t = max_{s≤t} V_s */
export function maxDrawdown(V) {
  let peak = -Infinity, mdd = 0;
  for (const v of V) {
    if (!isNum(v)) continue;
    if (v > peak) peak = v;
    if (peak > 0) mdd = Math.max(mdd, (peak - v) / peak);
  }
  return mdd;
}
/** (5) SR = r̄/σ_r · √252 on daily net returns of the equity curve. */
export function equityStats(equity) {
  const V = equity.filter(isNum), rets = [];
  for (let i = 1; i < V.length; i++) rets.push(V[i] / V[i - 1] - 1);
  const m = mean(rets), s = stdev(rets);
  const srDaily = s > 1e-12 ? m / s : 0;
  const total = V.length ? V[V.length - 1] / V[0] - 1 : 0;
  return {
    T: rets.length, srDaily, sharpe: srDaily * Math.sqrt(252), mdd: maxDrawdown(V), total,
    cagr: rets.length ? (1 + total) ** (252 / rets.length) - 1 : 0, ...moments(rets),
  };
}

// ─── Multiple testing (III.E) ────────────────────────────────────────────────
const EULER_GAMMA = 0.5772156649015329;
/**
 * (7) Expected maximum Sharpe among N trials with no edge. Exact Bailey–López de Prado form:
 * σ_SR·[(1−γ)Φ⁻¹(1−1/N) + γΦ⁻¹(1−1/(N·e))]; the paper's σ_SR·√(2 ln N) is its large-N limit
 * and overstates the bar for small N (N=2: 1.18σ vs 0.52σ).
 */
export function expectedMaxSharpe(N, sigmaSR) {
  if (!(N > 1) || !(sigmaSR > 0)) return 0;
  return sigmaSR * ((1 - EULER_GAMMA) * normInv(1 - 1 / N) + EULER_GAMMA * normInv(1 - 1 / (N * Math.E)));
}
/** (8) DSR = Φ( (SR − SR0)·√(T−1) / √(1 − γ3·SR + (γ4−1)/4·SR²) ), SR per period (not annualised). */
export function deflatedSharpe({ sr, T, skew = 0, kurt = 3, N = 1, sigmaSR }) {
  const sr0 = expectedMaxSharpe(N, sigmaSR);
  const v = 1 - skew * sr + ((kurt - 1) / 4) * sr * sr;
  if (!(T > 1) || !(v > 0)) return { dsr: NaN, sr0, z: NaN };
  const z = ((sr - sr0) * Math.sqrt(T - 1)) / Math.sqrt(v);
  return { dsr: normCdf(z), sr0, z };
}

// ─── Walk-forward, plateau, noise (III.D, Table III) ─────────────────────────
/**
 * Variants centred on the base parameters: the family the walk-forward fits on, and N for the DSR.
 * 81 with volume data; 27 without, since the volume multiplier then has no effect.
 */
export function centeredGrid(p, withVolume = true) {
  const uniq = (a) => [...new Set(a)];
  const ks = uniq([0.75, 1, 1.25].map((f) => round2(p.stopK * f)).filter((x) => x > 0));
  const rs = uniq([0.75, 1, 1.5].map((f) => round2(p.targetR * f)).filter((x) => x > 0));
  const bs = uniq([0.5, 1, 1.5].map((f) => Math.max(2, Math.round(p.breakout * f))));
  const vs = withVolume ? uniq([-0.25, 0, 0.25].map((d) => round2(p.volMult + d)).filter((x) => x >= 0)) : [p.volMult];
  const grid = [];
  for (const stopK of ks) for (const targetR of rs) for (const breakout of bs) for (const volMult of vs)
    grid.push({ ...p, stopK, targetR, breakout, volMult });
  return grid;
}

function runOnce(ctx, p, start, end, opts, extra = {}) {
  const bt = backtest(ctx, signals(ctx, p), p, { start, end, costs: opts.costs, riskFraction: opts.riskFraction, ...extra });
  return { bt, ts: tradeStats(bt.trades, bt.cRT), es: equityStats(bt.equity) };
}

export function walkForward(ctx, base, grid, { start0, trainBars = 504, testBars = 126, minTestBars = 63, costs, riskFraction } = {}) {
  const windows = [], opts = { costs, riskFraction };
  for (let s = start0; s + trainBars + minTestBars <= ctx.n; s += testBars) {
    const tr1 = s + trainBars;
    let te1 = Math.min(ctx.n, tr1 + testBars);
    if (ctx.n - te1 < minTestBars) te1 = ctx.n;
    let best = null;
    for (const g of grid) {
      const r = runOnce(ctx, g, s, tr1, opts);
      if (r.ts.n < 3) continue; // too few trades to rank on Sharpe
      if (!best || r.es.sharpe > best.sharpe) best = { params: g, sharpe: r.es.sharpe };
    }
    const params = best ? best.params : base;
    const r = runOnce(ctx, params, tr1, te1, opts);
    windows.push({ trainStart: s, testStart: tr1, testEnd: te1, params, fitted: !!best, trainSharpe: best ? best.sharpe : NaN,
      trades: r.bt.trades, n: r.ts.n, Rnet: r.ts.Rnet, ret: r.es.total, positive: r.ts.n > 0 && r.ts.Rnet > 0 });
    if (te1 >= ctx.n) break;
  }
  const oosTrades = windows.flatMap((w) => w.trades);
  const active = windows.filter((w) => w.n > 0);
  return {
    windows, oosTrades, oosStats: tradeStats(oosTrades, 0),
    activeWindows: active.length,
    positiveShare: active.length ? active.filter((w) => w.positive).length / active.length : 0,
  };
}

/** Neighbours = each parameter moved ±20 %; none may lose more than 20 % of the base Sharpe. */
export function plateauTest(ctx, base, start, end, opts) {
  const baseSharpe = runOnce(ctx, base, start, end, opts).es.sharpe;
  const neighbours = [];
  for (const key of ctx.hasVolume === false ? ["stopK", "targetR", "breakout"] : ["stopK", "targetR", "breakout", "volMult"]) {
    for (const f of [0.8, 1.2]) {
      const value = key === "breakout" ? Math.max(2, Math.round(base[key] * f)) : round2(base[key] * f);
      if (value === base[key]) continue;
      const sharpe = runOnce(ctx, { ...base, [key]: value }, start, end, opts).es.sharpe;
      neighbours.push({ key, value, sharpe, ok: baseSharpe > 0 && sharpe >= 0.8 * baseSharpe });
    }
  }
  return { baseSharpe, neighbours, pass: baseSharpe > 0 && neighbours.every((x) => x.ok) };
}

export const MIN_HISTORY_BARS = 756; // "at least three years of history" (III.C)

/**
 * Runs the full Section III pipeline on one instrument and returns the 7 gates of Table III.
 * opts: { costs, riskFraction, trainBars, testBars, trials }
 */
export function runLab(bars, base, opts = {}) {
  const ctx = prepare(bars);
  const grid = centeredGrid(base, ctx.hasVolume);
  const maxBreakout = Math.max(...grid.map((g) => g.breakout));
  const start = warmupIndex(ctx, maxBreakout + 1), end = ctx.n;
  const span = end - start;
  if (span < 60) throw new Error(`Historique trop court : ${span} barres exploitables après la période de chauffe (EMA 200).`);
  const o = { costs: opts.costs, riskFraction: opts.riskFraction ?? 0.01 };

  const full = runOnce(ctx, base, start, end, o);
  // σ_SR across the explored family → SR0 for the deflated Sharpe ratio.
  const gridSR = grid.map((g) => runOnce(ctx, g, start, end, o).es.srDaily).filter(isNum);
  const sdGrid = stdev(gridSR);
  const sigmaSR = sdGrid > 1e-9 ? sdGrid : 1 / Math.sqrt(Math.max(2, full.es.T - 1));
  const N = Math.max(1, Math.round(opts.trials || grid.length));
  const dsr = deflatedSharpe({ sr: full.es.srDaily, T: full.es.T, skew: full.es.skew, kurt: full.es.kurt, N, sigmaSR });

  const wf = walkForward(ctx, base, grid, { start0: start, trainBars: opts.trainBars ?? 504, testBars: opts.testBars ?? 126, ...o });
  const plateau = plateauTest(ctx, base, start, end, o);
  const noise = runOnce(ctx, base, start, end, o, { delay: 1, slipMult: 2 });

  const V = full.bt.equity, k = Math.min(252, V.length - 1);
  const latestYear = k > 0 ? V[V.length - 1] / V[V.length - 1 - k] - 1 : 0;
  const latestTrades = full.bt.trades.filter((t) => t.exitIdx >= end - k).length;

  const gates = [
    { id: "count", label: "Nombre d'opérations", threshold: "n ≥ 30", value: full.ts.n, pass: full.ts.n >= 30, purpose: "Sens statistique" },
    { id: "oos", label: "Hors échantillon", threshold: "R_net > 0", value: wf.oosStats.Rnet, pass: wf.oosStats.n > 0 && wf.oosStats.Rnet > 0, purpose: "Profit après coûts" },
    { id: "dsr", label: "Sharpe déflaté", threshold: "DSR ≥ 0.95", value: dsr.dsr, pass: dsr.dsr >= 0.95, purpose: "Correction de la chance" },
    { id: "wf", label: "Walk-forward", threshold: "≥ 70 % fenêtres +", value: wf.positiveShare, pass: wf.activeWindows >= 3 && wf.positiveShare >= 0.7, purpose: "Stabilité" },
    { id: "year", label: "Dernière année", threshold: "Positive", value: latestYear, pass: latestYear > 0, purpose: "Régime actuel" },
    { id: "plateau", label: "Plateau de paramètres", threshold: "Voisins à 20 %", value: plateau.neighbours.length ? Math.min(...plateau.neighbours.map((x) => x.sharpe)) : NaN, pass: plateau.pass, purpose: "Pas de réglage chanceux" },
    { id: "noise", label: "Test de bruit", threshold: "+1 barre, glissement ×2", value: noise.ts.Rnet, pass: noise.ts.n > 0 && noise.ts.Rnet > 0, purpose: "Friction réelle" },
  ];
  const historyOK = span >= MIN_HISTORY_BARS;
  const c0 = ctx.c[start];
  return {
    start, end, span, historyOK, hasVolume: ctx.hasVolume, dates: ctx.dates,
    lastClose: ctx.c[end - 1], lastAtr: ctx.atr[end - 1], lastDate: ctx.dates[end - 1],
    full: { trades: full.bt.trades, equity: full.bt.equity, exposure: full.bt.exposure, cRT: full.bt.cRT, ...full.ts, ...full.es },
    buyHold: ctx.c.slice(start, end).map((x) => x / c0),
    grid: { size: grid.length, sigmaSR, srs: gridSR }, N, dsr, wf, plateau,
    noise: { ...noise.ts, sharpe: noise.es.sharpe }, latestYear, latestTrades, gates,
    pass: historyOK && gates.every((g) => g.pass),
  };
}

// ─── Position sizing (Section V) ─────────────────────────────────────────────
/** (13) q = f·E / |P_e − P_s| */
export function positionSize({ equity, f, entry, stop }) {
  const dist = Math.abs(entry - stop);
  if (!(dist > 0) || !(equity > 0) || !(f >= 0)) return null;
  const q = (f * equity) / dist;
  return { q, qInt: Math.floor(q), dist, risk: q * dist, notional: q * entry };
}
/** (15) f* = p − (1−p)/b */
export const kellyFraction = (p, b) => (b > 0 ? p - (1 - p) / b : NaN);
/** (16) f = min(f* ÷ 4, f_max), never negative. */
export const cappedFraction = (fStar, fMax) => (isNum(fStar) ? Math.max(0, Math.min(fStar / 4, fMax)) : fMax);
/** (18) H = Σ f_i over open positions. */
export const portfolioHeat = (risks, equity) => (equity > 0 ? sum(risks) / equity : NaN);
/** (19) z = (r̄_p − r̄_b) / (σ_b/√n) */
export function consistencyZ(paperReturns, backMean, backStd) {
  const n = paperReturns.length;
  if (!n || !(backStd > 0)) return { n, rp: n ? mean(paperReturns) : NaN, z: NaN };
  const rp = mean(paperReturns);
  return { n, rp, z: (rp - backMean) / (backStd / Math.sqrt(n)) };
}
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Table V "strategy drift": 5th percentile of the cumulative return of n trades bootstrapped from the backtest. */
export function monteCarloFloor(backReturns, n, { paths = 2000, pct = 5, seed = 7 } = {}) {
  if (!backReturns.length || !(n > 0)) return NaN;
  const rnd = mulberry32(seed), sums = new Array(paths);
  for (let k = 0; k < paths; k++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += backReturns[Math.floor(rnd() * backReturns.length)];
    sums[k] = s;
  }
  return percentileLinear(sums, pct);
}

// ─── Correlation & portfolio volatility (V.D) ────────────────────────────────
export function pearson(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 3) return NaN;
  const mx = mean(x.slice(0, n)), my = mean(y.slice(0, n));
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { const a = x[i] - mx, b = y[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : NaN;
}
/** Aligns daily closes on common dates and returns simple daily returns per series. */
export function alignedReturns(seriesList) {
  const maps = seriesList.map((s) => new Map(s.map((b) => [b.t, b.c])));
  const dates = [...maps[0].keys()].filter((d) => maps.every((m) => isNum(m.get(d)))).sort();
  const returns = maps.map((m) => {
    const r = [];
    for (let i = 1; i < dates.length; i++) r.push(m.get(dates[i]) / m.get(dates[i - 1]) - 1);
    return r;
  });
  return { dates, returns };
}
export function covarianceMatrix(returns, annualise = 252) {
  const ms = returns.map(mean), n = returns[0]?.length || 0;
  return returns.map((x, i) => returns.map((y, j) => {
    let s = 0;
    for (let k = 0; k < n; k++) s += (x[k] - ms[i]) * (y[k] - ms[j]);
    return n > 1 ? (s / (n - 1)) * annualise : NaN;
  }));
}
/** (17) σ_p = √(wᵀ Σ w) */
export function portfolioVol(w, cov) {
  let s = 0;
  for (let i = 0; i < w.length; i++) for (let j = 0; j < w.length; j++) s += w[i] * w[j] * cov[i][j];
  return Math.sqrt(Math.max(0, s));
}
/** Positions linked by ρ > threshold (single linkage) are one bet. */
export function correlationClusters(corr, threshold = 0.7) {
  const parent = corr.map((_, i) => i);
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (let i = 0; i < corr.length; i++)
    for (let j = i + 1; j < corr.length; j++) if (corr[i][j] > threshold) parent[find(i)] = find(j);
  const groups = new Map();
  corr.forEach((_, i) => { const r = find(i); groups.set(r, [...(groups.get(r) || []), i]); });
  return [...groups.values()];
}
