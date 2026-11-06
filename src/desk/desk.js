// ─── DESK · RULES, RISK OFFICER, KILL SWITCH, LADDER ─────────────────────────
// Deterministic versions of the paper's Risk Officer and Chief of Staff duties (Sections II, V, VI).
// These are rules, not walls: hard limits belong in the broker account itself (V.G).
import { consistencyZ, monteCarloFloor, mean, stdev, sum, isNum } from "./quant.js";
import { parseFrenchDate, addBusinessDays, businessDaysBetween, daysBetween } from "./data.js";

/** Table VI — the paper-to-live promotion ladder. */
export const RUNGS = [
  { n: 1, name: "Paper", condition: "2 semaines, tous les trades journalisés", capital: "Simulé", sizeFactor: 1, mode: "paper" },
  { n: 2, name: "Match", condition: "Paper cohérent avec le backtest : n ≥ 20 et z > −2 (19)", capital: "Simulé", sizeFactor: 1, mode: "paper" },
  { n: 3, name: "Live tiny", condition: "≥ 5 exécutions propres, aucune violation", capital: "10 % du plan", sizeFactor: 0.1, mode: "live" },
  { n: 4, name: "Approval gate", condition: "≥ 10 ordres, chacun approuvé par l'opérateur", capital: "Taille prévue", sizeFactor: 1, mode: "live" },
  { n: 5, name: "Full rules", condition: "Des semaines de journal propre", capital: "Taille prévue", sizeFactor: 1, mode: "live" },
];

/** Section II.C — the Desk Rules every decision is checked against. */
export function defaultRules(equity) {
  return {
    equity: Math.round(equity || 10000),
    riskPerTrade: 0.01,   // f   (13)
    fMax: 0.01,           // f_max (16)
    heatMax: 0.05,        // H_max (18)
    maxDailyLoss: 0.02,   // Table V
    maxOpen: 5,
    maxHold: 20,          // bars
    atrK: 2,              // (14)
    corrThreshold: 0.7,   // V.D
    commission: 0.0005,   // per side
    slippage: 0.0005,     // per side
    maxSlippage: 0.005,   // Table V: fill > 0.5 % from plan
    streak: 3,            // Table V: losing streak
    staleBars: 2,         // Table V: no update in 2 bars
    markets: "Actions cash US & Europe (IBKR). Pas de levier, pas d'options, pas de CFD.",
    forbidden: "",
  };
}

export const forbiddenList = (rules) =>
  String(rules.forbidden || "").split(/[\s,;]+/).map((x) => x.trim().toUpperCase()).filter(Boolean);

/** Planned risk, slippage and (when closed) P&L of a journal entry. */
export function tradeMetrics(t, rules) {
  const dir = t.side === "short" ? -1 : 1;
  const plan = Number(t.planEntry), stop = Number(t.stop), qty = Number(t.qty) || 0;
  const entry = Number(t.fill) > 0 ? Number(t.fill) : plan;
  const perShare = Math.abs(plan - stop);
  const out = {
    dir, entry, perShare, risk: qty * perShare,
    openRisk: qty * Math.max(0, dir * (entry - stop)),
    slippage: Number(t.fill) > 0 && plan > 0 ? Math.abs(Number(t.fill) - plan) / plan : null,
    pnl: NaN, ret: NaN, R: NaN,
  };
  if (t.status === "closed" && Number(t.exitPrice) > 0 && entry > 0) {
    const x = Number(t.exitPrice), comm = rules?.commission ?? 0;
    out.pnl = dir * (x - entry) * qty - 2 * comm * entry * qty;
    out.ret = dir * (x / entry - 1) - 2 * comm;
    out.R = perShare > 0 ? (dir * (x - entry)) / perShare : NaN;
  }
  return out;
}

export const openTrades = (journal) => journal.filter((t) => t.status !== "closed");

/**
 * Risk Officer: veto or APPROVED stamp for an order card (II.E, V.D, V.E).
 * corr: optional { tickers, matrix } computed in the RISQUE view.
 */
export function riskOfficer({ order, rules, journal, stocks = [], corr = null, today }) {
  const vetoes = [], warnings = [];
  const dir = order.side === "short" ? -1 : 1;
  const entry = Number(order.entry), stop = Number(order.stop), qty = Number(order.qty), target = Number(order.target);
  const E = Number(rules.equity);
  const tk = String(order.ticker || "").toUpperCase();
  if (!tk) vetoes.push("Ticker manquant.");
  if (!(entry > 0) || !(qty > 0)) vetoes.push("Prix d'entrée et quantité requis.");
  if (!(stop > 0) || dir * (entry - stop) <= 0) vetoes.push("Stop absent ou du mauvais côté de l'entrée.");
  const risk = qty * Math.abs(entry - stop);
  const riskFrac = E > 0 ? risk / E : NaN;
  if (riskFrac > rules.fMax * (1 + 1e-6)) vetoes.push(`Risque ${(riskFrac * 100).toFixed(2)} % > f_max ${(rules.fMax * 100).toFixed(2)} % (16).`);
  if (order.side === "short" && /pas de vente à découvert/i.test(rules.markets || "")) vetoes.push("Vente à découvert exclue par les Desk Rules.");
  if (forbiddenList(rules).includes(tk)) vetoes.push(`${tk} figure dans la liste des instruments interdits.`);

  const open = openTrades(journal).filter((t) => t.id !== order.id);
  if (open.length + 1 > rules.maxOpen) vetoes.push(`${open.length} positions ouvertes : maximum ${rules.maxOpen}.`);
  const openRisk = sum(open.map((t) => tradeMetrics(t, rules).openRisk));
  const heatAfter = E > 0 ? (openRisk + risk) / E : NaN;
  if (heatAfter > rules.heatMax * (1 + 1e-6)) vetoes.push(`Heat après l'ordre ${(heatAfter * 100).toFixed(2)} % > H_max ${(rules.heatMax * 100).toFixed(1)} % (18).`);

  if (target > 0) {
    if (dir * (target - entry) <= 0) warnings.push("Objectif du mauvais côté de l'entrée.");
    else if (Math.abs(target - entry) < Math.abs(entry - stop)) warnings.push("Gain potentiel inférieur au risque (R < 1).");
  } else warnings.push("Pas d'objectif sur la fiche.");

  // V.E — no new position into a scheduled event.
  const date = order.date || today;
  const holdEnd = addBusinessDays(date, rules.maxHold);
  const stock = stocks.find((s) => s.ticker === tk);
  const ev = parseFrenchDate(stock?.nextEarnings);
  if (!ev) warnings.push(`Date de résultats inconnue pour ${tk || "ce titre"} : vérifier le calendrier avant d'entrer.`);
  else if (ev.precise && ev.date >= date && ev.date <= holdEnd) vetoes.push(`Résultats le ${ev.date}, pendant la détention prévue (jusqu'au ${holdEnd}).`);
  else if (!ev.precise && ev.date.slice(0, 7) >= date.slice(0, 7) && ev.date.slice(0, 7) <= holdEnd.slice(0, 7))
    warnings.push(`Résultats attendus en ${ev.date.slice(0, 7)} (jour inconnu) : risque d'événement pendant la détention.`);
  else if (ev.date < date) warnings.push(`Date de résultats enregistrée (${stock.nextEarnings}) dépassée : actualiser la fiche.`);

  // V.D — two positions in correlated instruments are one bet.
  const sector = stock?.sector;
  for (const t of open) {
    const other = String(t.ticker).toUpperCase();
    if (other === tk) { vetoes.push(`Position déjà ouverte sur ${tk}.`); continue; }
    const i = corr?.tickers?.indexOf(tk), j = corr?.tickers?.indexOf(other);
    if (i >= 0 && j >= 0 && isNum(corr.matrix[i][j])) {
      const rho = corr.matrix[i][j];
      if (rho > rules.corrThreshold) {
        const joint = (risk + tradeMetrics(t, rules).openRisk) / E;
        const msg = `${tk} et ${other} corrélés (ρ = ${rho.toFixed(2)}) : un seul pari, risque cumulé ${(joint * 100).toFixed(2)} %.`;
        if (joint > rules.fMax * (1 + 1e-6)) vetoes.push(msg); else warnings.push(msg);
      }
    } else if (sector && stocks.find((s) => s.ticker === other)?.sector === sector) {
      warnings.push(`Même secteur que ${other} (${sector}) : corrélation non mesurée, à vérifier dans RISQUE.`);
    }
  }
  return { approved: vetoes.length === 0, vetoes, warnings, risk, riskFrac, heatAfter, holdEnd };
}

/** Consistency (19) and Monte Carlo drift (Table V) for one strategy of the ladder. */
export function strategyHealth(strategy, journal, rules) {
  const closed = journal.filter((t) => t.strategyId === strategy.id && t.status === "closed");
  const rets = closed.map((t) => tradeMetrics(t, rules).ret).filter(isNum);
  const paperRets = closed.filter((t) => t.mode === "paper").map((t) => tradeMetrics(t, rules).ret).filter(isNum);
  const bt = strategy.backtest || {};
  const z = consistencyZ(paperRets, bt.mean, bt.std);
  const floor = rets.length ? monteCarloFloor(bt.returns || [], rets.length) : NaN;
  const cum = sum(rets);
  return { closed, rets, paperRets, z, floor, cum, drift: rets.length >= 5 && isNum(floor) && cum < floor };
}

/** Can the strategy climb one rung? Computable conditions are checked; the rest need the operator. */
export function advanceCheck(strategy, health, journal, rules, today) {
  const rung = strategy.rung;
  const atRung = journal.filter((t) => t.strategyId === strategy.id && t.rung === rung);
  const days = daysBetween(strategy.rungSince, today);
  switch (rung) {
    case 1:
      return days >= 14
        ? { ok: true, confirm: "Confirmes-tu que chaque trade paper de ces 2 semaines est dans le journal ?" }
        : { ok: false, why: `${days} j / 14 j en paper.` };
    case 2: {
      const { n, z } = health.z;
      if (n < 20) return { ok: false, why: `${n} / 20 trades paper clôturés.` };
      if (!(z > -2)) return { ok: false, why: `z = ${isNum(z) ? z.toFixed(2) : "—"} ≤ −2 : le paper détruit l'edge du backtest. Retour au labo.`, fail: true };
      return { ok: true };
    }
    case 3: {
      const live = atRung.filter((t) => t.mode === "live" && t.status === "closed");
      const dirty = live.filter((t) => (tradeMetrics(t, rules).slippage ?? 0) > rules.maxSlippage || !t.approved);
      if (live.length < 5) return { ok: false, why: `${live.length} / 5 trades live clôturés à ce rung.` };
      if (dirty.length) return { ok: false, why: `${dirty.length} exécution(s) hors tolérance ou non approuvée(s).` };
      return { ok: true };
    }
    case 4: {
      const done = atRung.filter((t) => t.status === "closed");
      if (done.length < 10) return { ok: false, why: `${done.length} / 10 ordres clôturés à ce rung.` };
      if (done.some((t) => !t.operatorApproved)) return { ok: false, why: "Au moins un ordre sans approbation de l'opérateur." };
      return { ok: true };
    }
    default:
      return { ok: false, why: "Dernier échelon : maintenir un journal propre." };
  }
}

/** Table V — evaluates every kill switch trigger from the journal and the lab data. */
export function killSwitch({ journal, rules, today, dataset, strategies = [] }) {
  const E = Number(rules.equity);
  const closed = journal.filter((t) => t.status === "closed" && t.exitDate)
    .sort((a, b) => (a.exitDate === b.exitDate ? String(a.id).localeCompare(String(b.id)) : a.exitDate < b.exitDate ? -1 : 1));
  const m = (t) => tradeMetrics(t, rules);
  const open = openTrades(journal);

  const todayPnl = sum(closed.filter((t) => t.exitDate === today).map((t) => m(t).pnl).filter(isNum));
  const dayLoss = E > 0 ? -todayPnl / E : 0;

  let streak = 0;
  for (let i = closed.length - 1; i >= 0 && m(closed[i]).pnl < 0; i--) streak++;

  const lastBar = dataset?.bars?.[dataset.bars.length - 1]?.t;
  const staleBy = lastBar ? businessDaysBetween(lastBar, today) : null;

  const recent = journal.filter((t) => Number(t.fill) > 0 && (t.status !== "closed" || daysBetween(t.date, today) <= 7));
  const slipped = recent.filter((t) => (m(t).slippage ?? 0) > rules.maxSlippage);

  const heat = E > 0 ? sum(open.map((t) => m(t).openRisk)) / E : 0;
  const forb = forbiddenList(rules);
  const breaches = [
    open.length > rules.maxOpen && `${open.length} positions ouvertes > ${rules.maxOpen}`,
    heat > rules.heatMax * (1 + 1e-6) && `heat ${(heat * 100).toFixed(2)} % > ${(rules.heatMax * 100).toFixed(1)} %`,
    ...open.filter((t) => m(t).risk / E > rules.fMax * (1 + 1e-6)).map((t) => `${t.ticker} risque ${((m(t).risk / E) * 100).toFixed(2)} %`),
    ...open.filter((t) => t.mode === "live" && !t.approved).map((t) => `${t.ticker} live sans tampon APPROVED`),
    ...open.filter((t) => forb.includes(String(t.ticker).toUpperCase())).map((t) => `${t.ticker} interdit`),
  ].filter(Boolean);

  const drifting = strategies.filter((s) => s.status === "active" && strategyHealth(s, journal, rules).drift);

  return [
    { id: "daily", trigger: "Perte du jour", threshold: `≥ ${(rules.maxDailyLoss * 100).toFixed(1)} % du capital`, action: "Tout clôturer, pause du desk",
      value: `${(dayLoss * 100).toFixed(2)} %`, fired: dayLoss >= rules.maxDailyLoss },
    { id: "streak", trigger: "Série de pertes", threshold: `${rules.streak} d'affilée`, action: "Pause du Trader",
      value: `${streak} perte(s) consécutive(s)`, fired: streak >= rules.streak },
    { id: "stale", trigger: "Données périmées", threshold: `Pas de MAJ depuis ${rules.staleBars} barres`, action: "Annuler tous les ordres",
      value: staleBy == null ? "aucune donnée chargée" : `dernière barre ${lastBar} (${staleBy} séance(s))${staleBy > rules.staleBars && !open.length ? " · sans position ouverte" : ""}`,
      fired: staleBy != null && staleBy > rules.staleBars && open.length > 0, na: staleBy == null },
    { id: "slip", trigger: "Slippage", threshold: `Exécution > ${(rules.maxSlippage * 100).toFixed(1)} % du plan`, action: "Pause, revue",
      value: slipped.length ? slipped.map((t) => `${t.ticker} ${((m(t).slippage) * 100).toFixed(2)} %`).join(", ") : "OK", fired: slipped.length > 0 },
    { id: "breach", trigger: "Violation de règle", threshold: "Tout écart aux Desk Rules", action: "Geler le desk",
      value: breaches.length ? breaches.join(" · ") : "aucune", fired: breaches.length > 0 },
    { id: "drift", trigger: "Dérive de stratégie", threshold: "Sous le 5e pct Monte Carlo", action: "Rétrograder la stratégie",
      value: drifting.length ? drifting.map((s) => s.name).join(", ") : "aucune", fired: drifting.length > 0 },
  ];
}

/** Summary of the backtest kept with a promoted strategy (reference for (19) and Monte Carlo). */
export function backtestSummary(lab) {
  const r = lab.full.trades.map((t) => t.net);
  return {
    n: r.length, mean: mean(r), std: stdev(r), returns: r.slice(-1000),
    sharpe: lab.full.sharpe, mdd: lab.full.mdd, winRate: lab.full.winRate, payoff: lab.full.payoff,
    dsr: lab.dsr.dsr, oos: { n: lab.wf.oosStats.n, winRate: lab.wf.oosStats.winRate, payoff: lab.wf.oosStats.payoff, mean: lab.wf.oosStats.mean },
  };
}

export const ideaKey = (symbol, p) =>
  [String(symbol).toUpperCase(), p.breakout, p.volMult, p.stopK, p.targetR, p.maxHold, p.direction].join("|");
