import { useState } from "react";
import { positionSize, kellyFraction, cappedFraction } from "./quant.js";
import { todayISO } from "./data.js";
import { riskOfficer, RUNGS } from "./desk.js";
import { C, Card, KpiRow, Btn, Field, Num, Grid, Note, Pill, fmtPct, fmtNum, inputStyle, usePersistent, uid, copyText, modeLabel } from "./ui.jsx";

const INIT = { ticker: "", side: "long", entry: "", mode: "atr", stop: "", atr: "", k: 2, targetR: 2, useKelly: true, p: "", b: "",
  strategyId: "", fractional: false, liveMode: "paper", rationale: "" };

export default function Sizing({ rules, lab, journal, setJournal, strategies, stocks, corr, goTo }) {
  const [s, setS] = usePersistent("atlas_desk_sizing", INIT);
  const [copied, setCopied] = useState(false);
  const set = (k) => (v) => setS((x) => ({ ...x, [k]: v }));
  const today = todayISO();

  const fromLab = () => lab && setS((x) => ({
    ...x, ticker: lab.symbol, entry: +lab.lastClose.toFixed(2), atr: +lab.lastAtr.toFixed(4), mode: "atr",
    k: lab.params.stopK, targetR: lab.params.targetR, side: "long",
    p: Number.isFinite(lab.wf.oosStats.winRate) ? +lab.wf.oosStats.winRate.toFixed(3) : "",
    b: Number.isFinite(lab.wf.oosStats.payoff) ? +lab.wf.oosStats.payoff.toFixed(2) : "",
    strategyId: strategies.find((st) => st.status === "active" && st.key === lab.key)?.id || "",
  }));

  const dir = s.side === "short" ? -1 : 1;
  const entry = Number(s.entry);
  const D = s.mode === "atr" ? Number(s.k) * Number(s.atr) : Math.abs(entry - Number(s.stop));
  const stop = s.mode === "atr" ? entry - dir * D : Number(s.stop);
  const target = D > 0 && Number(s.targetR) > 0 ? entry + dir * Number(s.targetR) * D : NaN;

  const strat = strategies.find((x) => x.id === s.strategyId && x.status === "active");
  const rung = strat ? RUNGS[strat.rung - 1] : null;
  const mode = rung ? rung.mode : s.liveMode;
  const factor = rung ? rung.sizeFactor : 1;

  const fRules = Math.min(rules.riskPerTrade, rules.fMax);
  const p = Number(s.p), b = Number(s.b);
  const kellyOK = s.useKelly && p > 0 && p < 1 && b > 0;
  const fStar = kellyOK ? kellyFraction(p, b) : NaN;
  const f = kellyOK ? cappedFraction(fStar, fRules) : fRules;
  const size = positionSize({ equity: Number(rules.equity), f: f * factor, entry, stop });
  const qty = size ? (s.fractional ? Math.floor(size.q * 1000) / 1000 : size.qInt) : 0;
  const risk = qty * D, notional = qty * entry;

  const order = { ticker: s.ticker.toUpperCase(), side: s.side, entry, stop, target, qty, date: today };
  const ro = size && qty > 0 ? riskOfficer({ order, rules, journal, stocks, corr, today }) : null;

  const emptyCard = !(entry > 0) || !(D > 0) || !s.ticker ? "Renseigne ticker, entrée et stop."
    : f === 0 ? "Taille nulle : f = 0, pas d'avantage hors échantillon. Rien à prendre."
      : "Taille inférieure à une action.";
  const card = [
    `TITRE          ${order.ticker}`,
    `SENS           ${s.side === "short" ? "VENTE" : "ACHAT"} (${modeLabel(mode)})`,
    `ENTRÉE         ${fmtNum(entry)}`,
    `STOP           ${fmtNum(stop)}${s.mode === "atr" ? `  (${s.k} × ATR14 ${fmtNum(Number(s.atr))})` : ""}`,
    `OBJECTIF       ${fmtNum(target)}  (${s.targetR} R)`,
    `TAILLE         ${qty} (${fmtNum(notional, 0)} = ${fmtPct(notional / rules.equity, 1, false)} du capital)${factor < 1 ? "  · échelon 3 : 10 % du plan" : ""}`,
    `RISQUE         ${fmtNum(risk, 0)} = ${fmtPct(risk / rules.equity, 2, false)} du capital`,
    `JUSTIFICATION  ${s.rationale || "—"}`,
    ro ? (ro.approved ? "CONTRÔLE       APPROUVÉ" : `CONTRÔLE       VETO : ${ro.vetoes.join(" ")}`) : "",
  ].join("\n");

  const log = () => {
    if (!ro?.approved) return;
    const live = mode === "live";
    if (live && !window.confirm(`Ordre RÉEL ${order.ticker} : c'est toi qui le passes chez ton courtier. Tu l'approuves ?`)) return;
    setJournal((j) => [...j, {
      id: uid(), date: today, ticker: order.ticker, side: s.side, mode, strategyId: strat?.id || null, rung: strat?.rung ?? null,
      planEntry: entry, stop: +stop.toFixed(4), target: Number.isFinite(target) ? +target.toFixed(4) : "", qty,
      rationale: s.rationale, approved: true, operatorApproved: live, fill: "", exitDate: "", exitPrice: "", lesson: "", status: "open",
    }]);
    goTo("journal");
  };

  return (
    <div>
      <Card title="ORDRE À DIMENSIONNER" right={<Btn small onClick={fromLab} disabled={!lab} title={lab ? "" : "Lance d'abord un backtest dans LABO"}>⤓ DEPUIS LE LABO{lab ? ` (${lab.symbol})` : ""}</Btn>}>
        <Grid min={125}>
          <Field label="TITRE"><input value={s.ticker} onChange={(e) => set("ticker")(e.target.value.toUpperCase())} style={inputStyle} placeholder="NVDA" /></Field>
          <Field label="SENS">
            <select value={s.side} onChange={(e) => set("side")(e.target.value)} style={{ ...inputStyle, background: "#0d0f16" }}>
              <option value="long">Achat</option><option value="short">Vente</option>
            </select>
          </Field>
          <Field label="ENTRÉE P_e"><Num value={s.entry} onChange={set("entry")} /></Field>
          <Field label="STOP">
            <select value={s.mode} onChange={(e) => set("mode")(e.target.value)} style={{ ...inputStyle, background: "#0d0f16" }}>
              <option value="atr">k × ATR14 (14)</option><option value="price">Prix fixe (13)</option>
            </select>
          </Field>
          {s.mode === "atr" ? (
            <>
              <Field label="ATR14"><Num value={s.atr} onChange={set("atr")} /></Field>
              <Field label="k"><Num value={s.k} onChange={set("k")} /></Field>
            </>
          ) : <Field label="STOP P_s"><Num value={s.stop} onChange={set("stop")} /></Field>}
          <Field label="OBJECTIF (× RISQUE)"><Num value={s.targetR} onChange={set("targetR")} /></Field>
          <Field label="STRATÉGIE">
            <select value={s.strategyId} onChange={(e) => set("strategyId")(e.target.value)} style={{ ...inputStyle, background: "#0d0f16" }}>
              <option value="">Discrétionnaire</option>
              {strategies.filter((x) => x.status === "active").map((x) => <option key={x.id} value={x.id}>{x.name} · échelon {x.rung}</option>)}
            </select>
          </Field>
          {!strat && (
            <Field label="MODE">
              <select value={s.liveMode} onChange={(e) => set("liveMode")(e.target.value)} style={{ ...inputStyle, background: "#0d0f16" }}>
                <option value="paper">Simulé</option><option value="live">Réel</option>
              </select>
            </Field>
          )}
        </Grid>
        <Field label="JUSTIFICATION (une phrase : l'avantage, pourquoi maintenant)" style={{ marginTop: 8 }}>
          <input value={s.rationale} onChange={(e) => set("rationale")(e.target.value)} style={inputStyle} placeholder="Cassure 20 j sur volume 1,8×, ruban EMA aligné, RSI 61" />
        </Field>
      </Card>

      <Card title="KELLY FRACTIONNAIRE — PLAFOND, JAMAIS CIBLE (15)–(16)">
        <Grid min={125}>
          <Field label="TAUX DE GAIN p (HORS ÉCH.)"><Num value={s.p} onChange={set("p")} placeholder="0.55" /></Field>
          <Field label="GAIN/PERTE b (HORS ÉCH.)"><Num value={s.b} onChange={set("b")} placeholder="1.5" /></Field>
          <Field label="APPLIQUER">
            <select value={s.useKelly ? "1" : "0"} onChange={(e) => set("useKelly")(e.target.value === "1")} style={{ ...inputStyle, background: "#0d0f16" }}>
              <option value="1">Oui</option><option value="0">Non</option>
            </select>
          </Field>
          <Field label="FRACTIONS D'ACTIONS">
            <select value={s.fractional ? "1" : "0"} onChange={(e) => set("fractional")(e.target.value === "1")} style={{ ...inputStyle, background: "#0d0f16" }}>
              <option value="0">Non (entier)</option><option value="1">Oui</option>
            </select>
          </Field>
        </Grid>
        <Note>
          f* = p − (1 − p)/b = <b style={{ color: C.text }}>{kellyOK ? fmtPct(fStar, 2) : "—"}</b> · f*/4 = {kellyOK ? fmtPct(fStar / 4, 2) : "—"} ·
          f = min(f*/4, f_max = {fmtPct(fRules, 2, false)}) = <b style={{ color: C.amber }}>{fmtPct(f, 2, false)}</b>
          {kellyOK && fStar <= 0 && <span style={{ color: C.red }}> → pas d'avantage hors échantillon : ne pas prendre position.</span>}
          {!kellyOK && " (sans p et b issus d'opérations hors échantillon, f = f_max des règles du desk)"}
        </Note>
      </Card>

      <KpiRow min={115} items={[
        { l: "DISTANCE AU STOP", v: D > 0 ? fmtNum(D) : "—", s: entry > 0 && D > 0 ? fmtPct(D / entry, 2, false) : "" },
        { l: "QUANTITÉ q (13)", v: size ? (s.fractional ? fmtNum(qty, 3) : qty) : "—", c: C.amber, s: size ? `exacte ${fmtNum(size.q, 3)}${factor < 1 ? " · ×10 % échelon 3" : ""}` : "" },
        { l: "NOTIONNEL", v: size ? fmtNum(notional, 0) : "—", s: size ? `${fmtPct(notional / rules.equity, 1, false)} du capital` : "" },
        { l: "PERTE MAX AU STOP", v: size ? fmtNum(risk, 0) : "—", c: C.red, s: size ? fmtPct(risk / rules.equity, 2, false) : "" },
        { l: "OBJECTIF", v: fmtNum(target), c: C.green },
      ]} />
      {size && qty === 0 && f > 0 && <Note color={C.orange}>Taille inférieure à une action : active les fractions ou laisse passer cette opération.</Note>}
      {size && notional > rules.equity && <Note color={C.orange}>Le notionnel dépasse le capital : stop trop serré pour un compte sans levier.</Note>}

      {ro && (
        <Card title="CONTRÔLE DES RISQUES" accent={ro.approved ? "rgba(16,185,129,0.35)" : "rgba(239,68,68,0.35)"}
          right={<Pill color={ro.approved ? C.green : C.red}>{ro.approved ? "APPROUVÉ" : "VETO"}</Pill>}>
          {ro.vetoes.map((v) => <Note key={v} color={C.red}>✗ {v}</Note>)}
          {ro.warnings.map((v) => <Note key={v} color={C.orange}>⚠ {v}</Note>)}
          {ro.approved && !ro.warnings.length && <Note color={C.green}>Conforme aux règles du desk.</Note>}
          <Note>Risque ouvert après l'ordre : {fmtPct(ro.heatAfter, 2, false)} / {fmtPct(rules.heatMax, 1, false)} · détention prévue jusqu'au {ro.holdEnd}.</Note>
        </Card>
      )}

      <Card title="FICHE D'ORDRE (VI.C)" right={
        <div style={{ display: "flex", gap: 6 }}>
          <Btn small t="ghost" onClick={async () => { setCopied(await copyText(card)); setTimeout(() => setCopied(false), 2000); }} disabled={!ro}>{copied ? "COPIÉ ✓" : "COPIER"}</Btn>
          <Btn small t="green" onClick={log} disabled={!ro?.approved}>→ JOURNAL</Btn>
        </div>}>
        <pre style={{ fontSize: 11, color: ro?.approved ? C.text : C.sub, background: "rgba(0,0,0,0.35)", padding: 12, borderRadius: 6, overflowX: "auto", margin: 0, fontFamily: "inherit", lineHeight: 1.6 }}>{ro ? card : emptyCard}</pre>
        <Note>Sans tampon APPROUVÉ, la fiche ne peut pas entrer au journal (II.E). Le silence vaut refus : rien n'est envoyé au courtier depuis l'app.</Note>
      </Card>
      {rung && <Note>Stratégie à l'échelon {rung.n} « {rung.name} » : capital {rung.capital.toLowerCase()}, mode {modeLabel(rung.mode)}.</Note>}
    </div>
  );
}
