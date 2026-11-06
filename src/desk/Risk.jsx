import { useState } from "react";
import { fetchHistory, todayISO } from "./data.js";
import { alignedReturns, pearson, covarianceMatrix, portfolioVol, correlationClusters, sum, isNum } from "./quant.js";
import { tradeMetrics, openTrades } from "./desk.js";
import { C, serif, Card, KpiRow, Btn, Field, Table, Note, fmtPct, fmtNum, inputStyle, usePersistent } from "./ui.jsx";

const parseOverrides = (txt) => Object.fromEntries(String(txt).split(/[,;\n]+/).map((x) => x.split("=").map((y) => y.trim().toUpperCase())).filter((x) => x.length === 2 && x[0] && x[1]));

export default function Risk({ rules, journal, portfolio, corr, setCorr }) {
  const [overrides, setOverrides] = usePersistent("atlas_desk_symbols", "ENR=ENR.DE");
  const [busy, setBusy] = useState("");
  const [errors, setErrors] = useState([]);
  const E = Number(rules.equity);
  const open = openTrades(journal);
  const risks = open.map((t) => ({ t, r: tradeMetrics(t, rules).openRisk / E }));
  const heat = sum(risks.map((x) => x.r));

  const analyse = async () => {
    const map = parseOverrides(overrides);
    const tickers = [...new Set(portfolio.positions.map((p) => p.ticker))];
    const got = [], errs = [];
    for (let i = 0; i < tickers.length; i += 4) {
      setBusy(`${i}/${tickers.length}…`);
      const chunk = await Promise.all(tickers.slice(i, i + 4).map(async (tk) => {
        try { return { tk, bars: (await fetchHistory(map[tk] || tk, "1y")).bars }; }
        catch (e) { errs.push(`${tk} (${map[tk] || tk}) : ${e.message}`); return null; }
      }));
      got.push(...chunk.filter(Boolean));
      if (errs.length && !got.length && i === 0) break; // API absent: no point hammering it
    }
    setBusy("");
    setErrors(errs);
    if (got.length < 2) return;
    const { dates, returns } = alignedReturns(got.map((g) => g.bars));
    const tk = got.map((g) => g.tk);
    const matrix = tk.map((_, i) => tk.map((_, j) => (i === j ? 1 : pearson(returns[i], returns[j]))));
    const cov = covarianceMatrix(returns);
    const vals = tk.map((t) => portfolio.positions.filter((p) => p.ticker === t).reduce((s, p) => s + (p.valeur || 0), 0));
    const total = sum(vals);
    const weights = vals.map((v) => (total > 0 ? v / total : 0));
    setCorr({ tickers: tk, matrix, weights, vols: tk.map((_, i) => Math.sqrt(cov[i][i])), vol: portfolioVol(weights, cov),
      days: returns[0]?.length || 0, from: dates[0], to: dates[dates.length - 1], date: todayISO() });
  };

  let view = null;
  if (corr?.tickers?.length >= 2 && corr.weights) {
    const groups = correlationClusters(corr.matrix, rules.corrThreshold)
      .map((g) => ({ idx: g, w: sum(g.map((i) => corr.weights[i])) })).sort((a, b) => b.w - a.w);
    const effBets = 1 / sum(groups.map((g) => g.w * g.w));
    const naiveVol = sum(corr.weights.map((w, i) => w * corr.vols[i]));
    const order = groups.flatMap((g) => g.idx);
    const pairs = [];
    for (let i = 0; i < corr.tickers.length; i++) for (let j = i + 1; j < corr.tickers.length; j++)
      if (isNum(corr.matrix[i][j])) pairs.push([corr.tickers[i], corr.tickers[j], corr.matrix[i][j]]);
    pairs.sort((a, b) => b[2] - a[2]);
    view = (
      <>
        <KpiRow min={125} items={[
          { l: "VOLATILITÉ σ_p (17)", v: fmtPct(corr.vol, 1, false), s: "annualisée", c: C.amber },
          { l: "SANS DIVERSIFICATION", v: fmtPct(naiveVol, 1, false), s: `ratio ${fmtNum(naiveVol / corr.vol)}` },
          { l: `PARIS À ρ > ${rules.corrThreshold}`, v: groups.length, s: `pour ${corr.tickers.length} lignes` },
          { l: "PARIS EFFECTIFS", v: fmtNum(effBets, 1), s: "1 / Σ poids²", c: effBets < 4 ? C.red : C.text },
          { l: "PLUS GROS PARI", v: fmtPct(groups[0].w, 0, false), s: groups[0].idx.map((i) => corr.tickers[i]).slice(0, 4).join(", ") + (groups[0].idx.length > 4 ? "…" : ""), c: groups[0].w > 0.4 ? C.red : C.text },
        ]} />
        <Card title={`PARIS (V.D) — DEUX POSITIONS CORRÉLÉES À PLUS DE ${rules.corrThreshold} SONT UN SEUL PARI`}>
          {groups.map((g, k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ width: 52, fontSize: 12, color: g.idx.length > 1 ? C.amber : C.sub, fontFamily: serif }}>{fmtPct(g.w, 0, false)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, marginBottom: 4 }}>
                  <div style={{ height: 4, width: `${(g.w * 100).toFixed(1)}%`, background: g.idx.length > 1 ? C.amber : C.dim, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, color: C.sub }}>{g.idx.map((i) => corr.tickers[i]).join(" · ")}</div>
              </div>
            </div>
          ))}
          <Note>Regroupement par lien simple : A–B et B–C au-dessus du seuil mettent A, B et C dans le même pari. Rendements journaliers {corr.from} → {corr.to} ({corr.days} séances), en devise locale (change ignoré). Calculé le {corr.date}.</Note>
        </Card>
        <Card title="MATRICE DE CORRÉLATION">
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 8 }}>
              <thead><tr><th />{order.map((i) => <th key={i} style={{ color: C.muted, fontWeight: 400, padding: "2px 1px", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>{corr.tickers[i]}</th>)}</tr></thead>
              <tbody>
                {order.map((i) => (
                  <tr key={i}>
                    <td style={{ color: C.muted, paddingRight: 4, whiteSpace: "nowrap" }}>{corr.tickers[i]}</td>
                    {order.map((j) => {
                      const r = corr.matrix[i][j];
                      const bg = !isNum(r) ? "transparent" : r >= 0 ? `rgba(245,158,11,${Math.min(1, r * r * 0.95).toFixed(2)})` : `rgba(59,130,246,${Math.min(1, r * r * 0.95).toFixed(2)})`;
                      return <td key={j} title={`${corr.tickers[i]} / ${corr.tickers[j]} : ${isNum(r) ? r.toFixed(2) : "—"}`}
                        style={{ width: 20, height: 18, background: bg, color: r > rules.corrThreshold && i !== j ? "#000" : C.dim, textAlign: "center", border: "1px solid rgba(0,0,0,0.3)" }}>
                        {i === j ? "" : isNum(r) ? Math.round(r * 10) : ""}
                      </td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>Valeurs × 10 (7 = ρ 0,7). Ambre : corrélation positive, bleu : négative.</Note>
          <Table small head={["PAIRE", "ρ"]} rows={pairs.slice(0, 10).map(([a, b, r]) => [`${a} / ${b}`, <span style={{ color: r > rules.corrThreshold ? C.amber : C.sub }}>{r.toFixed(2)}</span>])} />
        </Card>
      </>
    );
  }

  return (
    <div>
      <Card title="HEAT DU DESK (18) — RISQUE OUVERT DES TRADES DU JOURNAL">
        <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
          <div style={{ height: 8, width: `${Math.min(100, (heat / rules.heatMax) * 100)}%`, background: heat > rules.heatMax ? C.red : C.amber }} />
        </div>
        <div style={{ fontSize: 11, color: heat > rules.heatMax ? C.red : C.sub }}>H = Σ f_i = {fmtPct(heat, 2, false)} sur un maximum H_max = {fmtPct(rules.heatMax, 1, false)} · {open.length} position(s)</div>
        {risks.length > 0 && <Table small head={["TICKER", "MODE", "RISQUE OUVERT f_i"]} rows={risks.map(({ t, r }) => [t.ticker, t.mode, fmtPct(r, 2, false)])} />}
        <Note>Un stop remonté au prix d'entrée ramène le risque ouvert de la ligne à zéro. Ton portefeuille long terme n'a pas de stops : au sens de (18), tout son montant est « à risque ». Pour lui, la mesure utile est la volatilité et le nombre de paris réels ci-dessous.</Note>
      </Card>

      <Card title="CORRÉLATION DU PORTEFEUILLE — 1 AN DE COURS">
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <Field label="SYMBOLES YAHOO SPÉCIFIQUES (ticker=symbole)" style={{ flex: "1 1 220px" }}>
            <input value={overrides} onChange={(e) => setOverrides(e.target.value)} style={inputStyle} placeholder="ENR=ENR.DE, MC=MC.PA" />
          </Field>
          <Btn onClick={analyse} disabled={!!busy}>{busy ? `⟳ ${busy}` : `ANALYSER ${portfolio.positions.length} LIGNES`}</Btn>
        </div>
        {errors.length > 0 && (
          <Note color={C.orange}>{errors.length} titre(s) non chargé(s) : {errors.slice(0, 4).join(" · ")}{errors.length > 4 ? " …" : ""}</Note>
        )}
        {!view && <Note>Pondérations = valeur des lignes du portefeuille. Le résultat sert aussi au Risk Officer, qui refuse un ordre corrélé à une position ouverte si leur risque cumulé dépasse f_max.</Note>}
      </Card>
      {view}
    </div>
  );
}
