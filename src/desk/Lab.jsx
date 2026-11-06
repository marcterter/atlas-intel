import { useState } from "react";
import { runLab, sanitizeParams, DEFAULT_PARAMS, MIN_HISTORY_BARS } from "./quant.js";
import { fetchHistory, parseCSV, todayISO, businessDaysBetween } from "./data.js";
import { deskSignalPine } from "./pine.js";
import { backtestSummary, ideaKey } from "./desk.js";
import { C, serif, Card, KpiRow, Btn, Field, Num, Grid, Table, Ok, Pill, LineChart, Note, fmtPct, fmtNum, fmtInt, tone, uid, inputStyle, usePersistent, copyText } from "./ui.jsx";

const fmtGate = (g, lab) => {
  switch (g.id) {
    case "count": return `${g.value} trades`;
    case "oos": return `${fmtPct(g.value, 1)} sur ${lab.wf.oosStats.n} trades`;
    case "dsr": return Number.isFinite(g.value) ? g.value.toFixed(3) : "—";
    case "wf": return `${fmtPct(g.value, 0, false)} (${Math.round(g.value * lab.wf.activeWindows)}/${lab.wf.activeWindows} fenêtres actives)`;
    case "year": return `${fmtPct(g.value, 1)} · ${lab.latestTrades} trade(s)`;
    case "plateau": return `pire voisin SR ${fmtNum(g.value)} vs ${fmtNum(lab.plateau.baseSharpe)}`;
    case "noise": return `${fmtPct(g.value, 1)} · SR ${fmtNum(lab.noise.sharpe)}`;
    default: return String(g.value);
  }
};

export default function Lab({ rules, dataset, setDataset, lab, setLab, strategies, setStrategies, runs, setRuns, portfolio, goTo }) {
  const [symbol, setSymbol] = useState(dataset?.symbol || "NVDA");
  const [range, setRange] = useState("10y");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [csvText, setCsvText] = useState("");
  const [showCsv, setShowCsv] = useState(false);
  const [params, setParams] = usePersistent("atlas_desk_params", DEFAULT_PARAMS);
  const [wf, setWf] = usePersistent("atlas_desk_wf", { trainBars: 504, testBars: 126, trials: "" });
  const [open, setOpen] = useState({});
  const [copied, setCopied] = useState(false);
  const set = (k) => (v) => setParams((p) => ({ ...p, [k]: v === "" ? p[k] : v }));
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const load = async () => {
    setErr(""); setBusy("Chargement…");
    try {
      const j = await fetchHistory(symbol.trim().toUpperCase(), range);
      setDataset({ symbol: j.symbol || symbol.toUpperCase(), source: "Yahoo Finance", currency: j.currency, bars: j.bars, loadedAt: todayISO(), warnings: [] });
      setLab(null);
    } catch (e) { setErr(e.message); setShowCsv(true); }
    setBusy("");
  };
  const importCsv = (text, name) => {
    setErr("");
    try {
      const r = parseCSV(text);
      const sym = (symbol || name || "CSV").trim().toUpperCase();
      setDataset({ symbol: sym, source: name ? `CSV (${name})` : "CSV collé", bars: r.bars, loadedAt: todayISO(), warnings: r.warnings, adjusted: r.adjusted });
      setLab(null); setShowCsv(false); setCsvText("");
    } catch (e) { setErr(e.message); }
  };
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => importCsv(String(rd.result), f.name);
    rd.readAsText(f);
    e.target.value = "";
  };

  const run = () => {
    if (!dataset?.bars?.length) return;
    setErr(""); setBusy("Calcul des 7 gates…");
    setTimeout(() => {
      try {
        const p = sanitizeParams(params);
        const res = runLab(dataset.bars, p, {
          costs: { commission: rules.commission, slippage: rules.slippage }, riskFraction: rules.riskPerTrade,
          trainBars: wf.trainBars, testBars: wf.testBars, trials: Number(wf.trials) || undefined,
        });
        const key = ideaKey(dataset.symbol, p);
        setParams(p);
        setLab({ ...res, symbol: dataset.symbol, params: p, key, ranAt: todayISO() });
        setRuns((r) => (r.some((x) => x.key === key) ? r : [...r, { key, date: todayISO(), pass: res.pass }]));
      } catch (e) { setErr(e.message); }
      setBusy("");
    }, 30);
  };

  const buried = lab && strategies.find((s) => s.status === "graveyard" && s.key === lab.key);
  const onLadder = lab && strategies.find((s) => s.status === "active" && s.key === lab.key);
  const archive = () => {
    const failed = lab.gates.filter((g) => !g.pass).map((g) => g.label);
    if (!lab.historyOK) failed.unshift("Historique < 3 ans");
    setStrategies((s) => [...s, { id: uid(), key: lab.key, name: `Desk Signal · ${lab.symbol}`, symbol: lab.symbol, params: lab.params,
      status: "graveyard", buriedAt: todayISO(), reason: `Gates échoués : ${failed.join(", ")}`, gatesPassed: lab.gates.filter((g) => g.pass).length,
      backtest: backtestSummary(lab), history: [{ date: todayISO(), note: "Labo → cimetière" }] }]);
  };
  const promote = () => {
    setStrategies((s) => [...s, { id: uid(), key: lab.key, name: `Desk Signal · ${lab.symbol}`, symbol: lab.symbol, params: lab.params,
      status: "active", rung: 1, rungSince: todayISO(), createdAt: todayISO(), backtest: backtestSummary(lab),
      history: [{ date: todayISO(), note: "Labo → Rung 1 Paper (7/7 gates)" }] }]);
    goTo("echelle");
  };

  const bars = dataset?.bars || [];
  const last = bars[bars.length - 1];
  const staleBy = last ? businessDaysBetween(last.t, todayISO()) : 0;
  const tickers = [...new Set((portfolio?.positions || []).map((p) => p.ticker))].slice(0, 12);
  const passed = lab ? lab.gates.filter((g) => g.pass).length : 0;

  return (
    <div>
      <Card title="1 · DONNÉES — au moins 3 ans d'historique (III.C)">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
          <Field label="SYMBOLE YAHOO" style={{ flex: "1 1 140px" }}>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && load()}
              placeholder="NVDA, ENR.DE, MC.PA…" style={inputStyle} />
          </Field>
          <Field label="PROFONDEUR" style={{ flex: "0 0 110px" }}>
            <select value={range} onChange={(e) => setRange(e.target.value)} style={{ ...inputStyle, background: "#0d0f16" }}>
              <option value="5y">5 ans</option><option value="10y">10 ans</option><option value="max">Max</option>
            </select>
          </Field>
          <Btn onClick={load} disabled={!!busy || !symbol.trim()}>{busy === "Chargement…" ? "⟳ …" : "⤓ CHARGER"}</Btn>
          <Btn t="ghost" onClick={() => setShowCsv((x) => !x)}>CSV</Btn>
        </div>
        {tickers.length > 0 && (
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
            {tickers.map((t) => (
              <span key={t} onClick={() => setSymbol(t === "ENR" ? "ENR.DE" : t)} style={{ cursor: "pointer" }}><Pill color={C.dim}>{t}</Pill></span>
            ))}
          </div>
        )}
        {showCsv && (
          <div style={{ marginTop: 10 }}>
            <Note>Export journalier Yahoo Finance, TradingView (Export chart data), Stooq ou Excel FR. Colonnes requises : date et close (open/high/low/volume recommandés). Le symbole saisi ci-dessus sert de nom.</Note>
            <input type="file" accept=".csv,text/csv,text/plain" onChange={onFile} style={{ fontSize: 11, color: C.sub, margin: "8px 0" }} />
            <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} placeholder="…ou colle le CSV ici" rows={4}
              style={{ ...inputStyle, fontSize: 10, resize: "vertical" }} />
            <Btn small onClick={() => importCsv(csvText)} disabled={!csvText.trim()} style={{ marginTop: 6 }}>IMPORTER</Btn>
          </div>
        )}
        {err && <Note color={C.red}>⚠ {err}</Note>}
        {last && (
          <div style={{ marginTop: 10, fontSize: 11, color: C.sub, lineHeight: 1.7 }}>
            <span style={{ fontFamily: serif, color: C.amber, fontSize: 15 }}>{dataset.symbol}</span>
            {" · "}{fmtInt(bars.length)} barres · {bars[0].t} → {last.t} · {dataset.source}{dataset.adjusted ? " · ajusté dividendes" : ""}
            {" · "}clôture {fmtNum(last.c)} {dataset.currency || ""}
            {staleBy > rules.staleBars && <span style={{ color: C.orange }}> · données vieilles de {staleBy} séances</span>}
            {bars.length < MIN_HISTORY_BARS + 200 && <span style={{ color: C.orange }}> · moins de 3 ans exploitables après la chauffe EMA 200</span>}
            {(dataset.warnings || []).map((w) => <div key={w} style={{ color: C.orange, fontSize: 10 }}>⚠ {w}</div>)}
          </div>
        )}
      </Card>

      <Card title="2 · RÈGLES DE LA STRATÉGIE — Desk Signal (9)–(12)">
        <Grid min={120}>
          <Field label="CASSURE N BARRES (11)"><Num value={params.breakout} onChange={(v) => set("breakout")(v === "" ? "" : Math.round(v))} /></Field>
          <Field label="VOLUME ≥ × MOY. 20 (11)"><Num value={params.volMult} onChange={set("volMult")} /></Field>
          <Field label="STOP k × ATR14 (14)"><Num value={params.stopK} onChange={set("stopK")} /></Field>
          <Field label="OBJECTIF (× RISQUE)"><Num value={params.targetR} onChange={set("targetR")} /></Field>
          <Field label="DÉTENTION MAX (BARRES)"><Num value={params.maxHold} onChange={(v) => set("maxHold")(v === "" ? "" : Math.round(v))} /></Field>
          <Field label="SENS">
            <select value={params.direction} onChange={(e) => set("direction")(e.target.value)} style={{ ...inputStyle, background: "#0d0f16" }}>
              <option value="long">Achat seul</option><option value="both">Achat + vente</option>
            </select>
          </Field>
          <Field label="WALK-FWD : APPRENTISSAGE">
            <select value={wf.trainBars} onChange={(e) => setWf({ ...wf, trainBars: +e.target.value })} style={{ ...inputStyle, background: "#0d0f16" }}>
              <option value={252}>1 an</option><option value={504}>2 ans</option><option value={756}>3 ans</option>
            </select>
          </Field>
          <Field label="WALK-FWD : TEST">
            <select value={wf.testBars} onChange={(e) => setWf({ ...wf, testBars: +e.target.value })} style={{ ...inputStyle, background: "#0d0f16" }}>
              <option value={63}>3 mois</option><option value={126}>6 mois</option><option value={252}>1 an</option>
            </select>
          </Field>
          <Field label="ESSAIS N (7)" hint="Vide = variantes du walk-forward (81, ou 27 sans volume). Ajoute toutes les idées déjà testées.">
            <Num value={wf.trials} onChange={(v) => setWf({ ...wf, trials: v === "" ? "" : Math.max(1, Math.round(v)) })} placeholder={dataset?.bars?.some((b) => b.v > 0) === false ? "27" : "81"} />
          </Field>
        </Grid>
        <Note>
          Entrée à l'ouverture suivant le signal · stop vérifié avant l'objectif dans une même barre · coûts c_rt = 2 × ({fmtPct(rules.commission, 2, false)} + {fmtPct(rules.slippage, 2, false)}) par aller-retour (4) · taille (14) avec f = {fmtPct(rules.riskPerTrade, 2, false)}, sans levier. Modifiable dans RÈGLES.
        </Note>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
          <Btn onClick={run} disabled={!bars.length || !!busy}>{busy && busy !== "Chargement…" ? `⟳ ${busy}` : "▶ LANCER LES 7 GATES"}</Btn>
          <Btn t="ghost" small onClick={() => setParams(DEFAULT_PARAMS)}>PARAMÈTRES DU PAPIER</Btn>
          <span style={{ fontSize: 9, color: C.muted }}>{runs.length} idée(s) distincte(s) testée(s) sur ce desk — chaque essai relève la barre (III.E).</span>
        </div>
      </Card>

      {lab && (
        <>
          {buried && (
            <Card accent="rgba(239,68,68,0.3)"><Note color={C.red}>✝ Cette idée exacte est déjà au cimetière depuis le {buried.buriedAt} ({buried.reason}). Le papier interdit de la retester : change d'hypothèse, pas de réglage.</Note></Card>
          )}
          <div style={{ background: lab.pass ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.07)", border: `1px solid ${lab.pass ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.3)"}`,
            borderRadius: 10, padding: "12px 16px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: serif, fontSize: 18, color: lab.pass ? C.green : C.red }}>
                {lab.pass ? "Rentable au sens du papier" : "Cimetière"} · {passed}/7 gates
              </div>
              <div style={{ fontSize: 10, color: C.sub, marginTop: 3 }}>
                {lab.symbol} · {lab.dates[lab.start]} → {lab.lastDate} · {fmtInt(lab.span)} barres
                {!lab.historyOK && <span style={{ color: C.orange }}> · historique &lt; 3 ans : verdict impossible</span>}
                {!lab.hasVolume && <span style={{ color: C.orange }}> · sans volume</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {lab.pass && !onLadder && <Btn t="green" onClick={promote}>↑ PROMOUVOIR → RUNG 1 PAPER</Btn>}
              {onLadder && <Pill color={C.green}>Sur l'échelle · rung {onLadder.rung}</Pill>}
              {!lab.pass && !buried && <Btn t="red" onClick={archive}>✝ ARCHIVER AU CIMETIÈRE</Btn>}
            </div>
          </div>

          <KpiRow min={110} items={[
            { l: "TRADES", v: lab.full.n, c: lab.full.n >= 30 ? C.text : C.orange },
            { l: "TAUX DE GAIN p", v: fmtPct(lab.full.winRate, 0, false) },
            { l: "PAYOFF b", v: fmtNum(lab.full.payoff) },
            { l: "R_GROSS → R_NET (4)", v: fmtPct(lab.full.Rnet, 1), s: `brut ${fmtPct(lab.full.Rgross, 1)} − coûts ${fmtPct(lab.full.costs, 1, false)}`, c: tone(lab.full.Rnet) },
            { l: "SHARPE (5)", v: fmtNum(lab.full.sharpe), c: tone(lab.full.sharpe) },
            { l: "MAX DRAWDOWN (6)", v: fmtPct(-lab.full.mdd, 1), c: C.red },
            { l: "CAGR DU COMPTE", v: fmtPct(lab.full.cagr, 1), c: tone(lab.full.cagr), s: `exposition ${fmtPct(lab.full.exposure, 0, false)}` },
            { l: "BUY & HOLD", v: fmtPct(lab.buyHold[lab.buyHold.length - 1] - 1, 0), s: "même période", c: C.sub },
          ]} />

          <Card title="COURBE DU COMPTE — taille (14), coûts inclus">
            <LineChart series={[{ label: `Desk Signal ${lab.symbol}, capital de départ = 0 %`, values: lab.full.equity, color: C.amber, baseline: 1 }]}
              yFmt={(v) => fmtPct(v - 1, 1)} xLabels={[lab.dates[lab.start], lab.lastDate]} />
          </Card>

          <Card title="TABLE III — GATES STATISTIQUES">
            <Table head={["", "GATE", "SEUIL", "VALEUR", "RÔLE"]} rows={lab.gates.map((g) => [
              <Ok ok={g.pass} />, <span style={{ color: C.text }}>{g.label}</span>, g.threshold,
              <span style={{ color: g.pass ? C.green : C.red }}>{fmtGate(g, lab)}</span>, g.purpose,
            ])} />
            <Note>Un seul gate échoué envoie la stratégie au cimetière (III.F). Sur un seul titre, ce signal reste rare : « n ≥ 30 » échoue souvent. C'est le gate qui fait son travail ; essaie l'historique Max.</Note>
          </Card>

          <Card title={`DÉTAILS DSR (8) · N = ${lab.N} ESSAIS`} right={<Btn t="ghost" small onClick={() => toggle("dsr")}>{open.dsr ? "−" : "+"}</Btn>}>
            <KpiRow min={110} items={[
              { l: "SR ANNUALISÉ", v: fmtNum(lab.full.sharpe) },
              { l: "SR0 ANNUALISÉ (7)", v: fmtNum(lab.dsr.sr0 * Math.sqrt(252)), s: "max attendu par chance" },
              { l: "DSR", v: Number.isFinite(lab.dsr.dsr) ? lab.dsr.dsr.toFixed(3) : "—", c: lab.dsr.dsr >= 0.95 ? C.green : C.red, s: "seuil 0.95" },
            ]} />
            {open.dsr && (
              <Note>
                T = {lab.full.T} rendements journaliers · SR/jour {lab.full.srDaily.toFixed(4)} · asymétrie γ3 = {fmtNum(lab.full.skew)} · kurtosis γ4 = {fmtNum(lab.full.kurt)} ·
                σ_SR entre variantes = {lab.grid.sigmaSR.toFixed(4)} (/jour). SR0 utilise la forme exacte de Bailey &amp; López de Prado ; le √(2 ln N) du papier en est
                l'approximation pour N grand. Plus N est grand, plus la barre monte : compte toutes les variantes essayées, y compris celles abandonnées.
              </Note>
            )}
          </Card>

          <Card title={`WALK-FORWARD (III.D) · ${lab.wf.windows.length} FENÊTRES · ${fmtPct(lab.wf.positiveShare, 0, false)} POSITIVES`} right={<Btn t="ghost" small onClick={() => toggle("wf")}>{open.wf ? "−" : "+"}</Btn>}>
            <Note>À chaque fenêtre, les {lab.grid.size} variantes sont ajustées sur l'apprentissage (meilleur Sharpe, ≥ 3 trades), puis appliquées telles quelles sur le test suivant. Hors échantillon cumulé : {lab.wf.oosStats.n} trades, R_net {fmtPct(lab.wf.oosStats.Rnet, 1)}, p = {fmtPct(lab.wf.oosStats.winRate, 0, false)}, b = {fmtNum(lab.wf.oosStats.payoff)}.</Note>
            {open.wf && (
              <Table small head={["TEST", "PARAMS AJUSTÉS (N/vol/k/R)", "SR APPR.", "TRADES", "R_NET", ""]} rows={lab.wf.windows.map((w) => [
                `${lab.dates[w.testStart]} → ${lab.dates[w.testEnd - 1]}`,
                w.fitted ? `${w.params.breakout} / ${w.params.volMult} / ${w.params.stopK} / ${w.params.targetR}` : "base (trop peu de trades)",
                fmtNum(w.trainSharpe), w.n, <span style={{ color: tone(w.Rnet) }}>{w.n ? fmtPct(w.Rnet, 1) : "—"}</span>, <Ok ok={w.positive} na={!w.n} />,
              ])} />
            )}
          </Card>

          <Card title="PLATEAU & BRUIT" right={<Btn t="ghost" small onClick={() => toggle("pl")}>{open.pl ? "−" : "+"}</Btn>}>
            <Note>
              Plateau : chaque paramètre déplacé de ±20 %, aucun voisin ne doit perdre plus de 20 % du Sharpe ({fmtNum(lab.plateau.baseSharpe)}).
              Bruit : entrée une barre plus tard et slippage doublé → R_net {fmtPct(lab.noise.Rnet, 1)} sur {lab.noise.n} trades.
            </Note>
            {open.pl && (
              <Table small head={["PARAMÈTRE", "VALEUR", "SHARPE", ""]} rows={lab.plateau.neighbours.map((x) => [x.key, x.value, fmtNum(x.sharpe), <Ok ok={x.ok} />])} />
            )}
          </Card>

          <Card title={`TRADES DU BACKTEST (${lab.full.n})`} right={<Btn t="ghost" small onClick={() => toggle("tr")}>{open.tr ? "−" : "+"}</Btn>}>
            {open.tr ? (
              <Table small head={["SIGNAL", "SENS", "ENTRÉE", "SORTIE", "MOTIF", "R", "NET"]} rows={[...lab.full.trades].reverse().slice(0, 60).map((t) => [
                lab.dates[t.signalIdx], t.dir > 0 ? "achat" : "vente", fmtNum(t.entry), `${fmtNum(t.exit)} · ${lab.dates[t.exitIdx]}`, t.reason,
                <span style={{ color: tone(t.R) }}>{fmtNum(t.R, 1)}</span>, <span style={{ color: tone(t.net) }}>{fmtPct(t.net, 1)}</span>,
              ])} />
            ) : <Note>Derniers trades, motif de sortie (stop, objectif, temps) et multiple de R.</Note>}
          </Card>

          <Card title="PINE SCRIPT v6 — LISTING 1, PARAMÈTRES DU LABO" right={
            <div style={{ display: "flex", gap: 6 }}>
              <Btn t="ghost" small onClick={() => toggle("pine")}>{open.pine ? "−" : "+"}</Btn>
              <Btn small onClick={async () => { setCopied(await copyText(deskSignalPine(lab.params))); setTimeout(() => setCopied(false), 2000); }}>{copied ? "COPIÉ ✓" : "COPIER"}</Btn>
            </div>}>
            <Note>TradingView → Pine Editor → coller → « Add to chart ». Les alertes préviennent, elles ne passent jamais d'ordre : l'exécution reste manuelle chez ton broker.</Note>
            {open.pine && <pre style={{ fontSize: 10, color: C.sub, background: "rgba(0,0,0,0.35)", padding: 10, borderRadius: 6, overflowX: "auto", marginTop: 8 }}>{deskSignalPine(lab.params)}</pre>}
          </Card>
        </>
      )}
    </div>
  );
}
