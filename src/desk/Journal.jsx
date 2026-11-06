import { useState } from "react";
import { todayISO } from "./data.js";
import { tradeMetrics, riskOfficer, openTrades } from "./desk.js";
import { mean, sum, isNum } from "./quant.js";
import { C, Card, KpiRow, Btn, Field, Num, Grid, Table, Note, Pill, Ok, fmtPct, fmtNum, tone, inputStyle, uid, modeLabel } from "./ui.jsx";

const blank = () => ({ date: todayISO(), ticker: "", side: "long", mode: "paper", strategyId: "", planEntry: "", stop: "", target: "", qty: "", rationale: "" });

export default function Journal({ rules, journal, setJournal, strategies, stocks, corr, kill }) {
  const [closing, setClosing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(blank);
  const [msg, setMsg] = useState(null);
  const E = Number(rules.equity);
  const stratName = (id) => strategies.find((s) => s.id === id)?.name || "Discrétionnaire";
  const update = (id, patch) => setJournal((j) => j.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const remove = (id) => window.confirm("Supprimer cette ligne du journal ? Le journal est la piste d'audit.") && setJournal((j) => j.filter((t) => t.id !== id));

  const open = openTrades(journal);
  const closed = journal.filter((t) => t.status === "closed").sort((a, b) => (a.exitDate < b.exitDate ? 1 : -1));
  const cm = closed.map((t) => tradeMetrics(t, rules));
  const heat = E > 0 ? sum(open.map((t) => tradeMetrics(t, rules).openRisk)) / E : 0;
  const fired = kill.filter((k) => k.fired);

  const addManual = () => {
    const st = strategies.find((s) => s.id === draft.strategyId);
    const order = { ticker: draft.ticker.toUpperCase(), side: draft.side, entry: Number(draft.planEntry), stop: Number(draft.stop), target: Number(draft.target), qty: Number(draft.qty), date: draft.date };
    const ro = riskOfficer({ order, rules, journal, stocks, corr, today: todayISO() });
    if (!ro.approved) { setMsg({ c: C.red, t: `VETO : ${ro.vetoes.join(" ")}` }); return; }
    const mode = st ? (st.rung >= 3 ? "live" : "paper") : draft.mode;
    setJournal((j) => [...j, { id: uid(), ...draft, ticker: order.ticker, mode, strategyId: st?.id || null, rung: st?.rung ?? null,
      planEntry: order.entry, stop: order.stop, target: draft.target === "" ? "" : order.target, qty: order.qty,
      approved: true, operatorApproved: mode === "live", fill: "", exitDate: "", exitPrice: "", lesson: "", status: "open" }]);
    setMsg({ c: C.green, t: `APPROUVÉ${ro.warnings.length ? ` · ${ro.warnings.join(" ")}` : ""}` });
    setDraft(blank()); setAdding(false);
  };

  const closeTrade = () => {
    const c = closing;
    if (!(Number(c.exitPrice) > 0)) return;
    update(c.id, { fill: Number(c.fill) > 0 ? Number(c.fill) : c.planEntry, exitPrice: Number(c.exitPrice), exitDate: c.exitDate || todayISO(), lesson: c.lesson, status: "closed" });
    setClosing(null);
  };

  const wins = cm.filter((m) => m.pnl > 0).length;
  return (
    <div>
      <Card title="COUPE-CIRCUIT — TABLE V" accent={fired.length ? "rgba(239,68,68,0.45)" : C.border}
        right={<Pill color={fired.length ? C.red : C.green}>{fired.length ? `${fired.length} DÉCLENCHÉ(S)` : "ARMÉ · RAS"}</Pill>}>
        <Table small head={["", "DÉCLENCHEUR", "SEUIL", "ÉTAT", "ACTION"]} rows={kill.map((k) => [
          <Ok ok={!k.fired} na={k.na} />, <span style={{ color: k.fired ? C.red : C.text }}>{k.trigger}</span>, k.threshold,
          <span style={{ color: k.fired ? C.red : C.sub }}>{k.value}</span>, <span style={{ color: k.fired ? C.red : C.muted }}>{k.action}</span>,
        ])} />
        <Note>Calculé sur ce journal et sur les données du labo. L'app ne peut ni annuler ni clôturer d'ordre : quand une ligne passe au rouge, c'est toi qui exécutes l'action chez ton courtier.</Note>
      </Card>

      <KpiRow min={115} items={[
        { l: "POSITIONS OUVERTES", v: `${open.length} / ${rules.maxOpen}`, c: open.length > rules.maxOpen ? C.red : C.text },
        { l: "RISQUE OUVERT H (18)", v: fmtPct(heat, 2, false), s: `max ${fmtPct(rules.heatMax, 1, false)}`, c: heat > rules.heatMax ? C.red : C.amber },
        { l: "OPÉRATIONS CLÔTURÉES", v: closed.length, s: closed.length ? `${fmtPct(wins / closed.length, 0, false)} gagnantes` : "" },
        { l: "R MOYEN", v: fmtNum(mean(cm.map((m) => m.R).filter(isNum)), 2), c: tone(mean(cm.map((m) => m.R).filter(isNum))) },
        { l: "RÉSULTAT RÉALISÉ", v: fmtNum(sum(cm.map((m) => m.pnl).filter(isNum)), 0), c: tone(sum(cm.map((m) => m.pnl).filter(isNum))) },
      ]} />

      <Card title={`OUVERTES (${open.length})`} right={<Btn small t="green" onClick={() => { setAdding((a) => !a); setMsg(null); }}>{adding ? "ANNULER" : "+ OPÉRATION MANUELLE"}</Btn>}>
        {adding && (
          <div style={{ marginBottom: 12 }}>
            <Grid min={115}>
              <Field label="DATE"><input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} style={inputStyle} /></Field>
              <Field label="TITRE"><input value={draft.ticker} onChange={(e) => setDraft({ ...draft, ticker: e.target.value.toUpperCase() })} style={inputStyle} /></Field>
              <Field label="SENS">
                <select value={draft.side} onChange={(e) => setDraft({ ...draft, side: e.target.value })} style={{ ...inputStyle, background: "#0d0f16" }}>
                  <option value="long">Achat</option><option value="short">Vente</option>
                </select>
              </Field>
              <Field label="STRATÉGIE">
                <select value={draft.strategyId} onChange={(e) => setDraft({ ...draft, strategyId: e.target.value })} style={{ ...inputStyle, background: "#0d0f16" }}>
                  <option value="">Discrétionnaire</option>
                  {strategies.filter((s) => s.status === "active").map((s) => <option key={s.id} value={s.id}>{s.name} · échelon {s.rung}</option>)}
                </select>
              </Field>
              {!draft.strategyId && (
                <Field label="MODE">
                  <select value={draft.mode} onChange={(e) => setDraft({ ...draft, mode: e.target.value })} style={{ ...inputStyle, background: "#0d0f16" }}>
                    <option value="paper">Simulé</option><option value="live">Réel</option>
                  </select>
                </Field>
              )}
              <Field label="ENTRÉE PRÉVUE"><Num value={draft.planEntry} onChange={(v) => setDraft({ ...draft, planEntry: v })} /></Field>
              <Field label="STOP"><Num value={draft.stop} onChange={(v) => setDraft({ ...draft, stop: v })} /></Field>
              <Field label="OBJECTIF"><Num value={draft.target} onChange={(v) => setDraft({ ...draft, target: v })} /></Field>
              <Field label="QUANTITÉ"><Num value={draft.qty} onChange={(v) => setDraft({ ...draft, qty: v })} /></Field>
            </Grid>
            <Field label="JUSTIFICATION" style={{ marginTop: 8 }}><input value={draft.rationale} onChange={(e) => setDraft({ ...draft, rationale: e.target.value })} style={inputStyle} /></Field>
            <Btn small onClick={addManual} style={{ marginTop: 8 }}>SOUMETTRE AU CONTRÔLE DES RISQUES</Btn>
          </div>
        )}
        {msg && <Note color={msg.c}>{msg.t}</Note>}
        {open.length ? (
          <Table small head={["DATE", "TITRE", "MODE", "STRATÉGIE", "PLAN / EXÉC.", "STOP", "OBJ.", "QTÉ", "RISQUE", ""]} rows={open.map((t) => {
            const m = tradeMetrics(t, rules);
            return [
              t.date, <span style={{ color: C.amber }}>{t.ticker} {t.side === "short" ? "↓" : "↑"}</span>, <Pill color={t.mode === "live" ? C.red : C.blue}>{modeLabel(t.mode)}</Pill>,
              stratName(t.strategyId), `${fmtNum(t.planEntry)} / ${t.fill ? fmtNum(Number(t.fill)) : "—"}`, fmtNum(Number(t.stop)), t.target ? fmtNum(Number(t.target)) : "—", t.qty,
              <span style={{ color: m.risk / E > rules.fMax * 1.000001 ? C.red : C.sub }}>{fmtPct(m.risk / E, 2, false)}</span>,
              <span style={{ display: "flex", gap: 4 }}>
                <Btn small onClick={() => setClosing({ id: t.id, ticker: t.ticker, planEntry: t.planEntry, fill: t.fill || t.planEntry, exitPrice: "", exitDate: todayISO(), lesson: "" })}>CLÔTURER</Btn>
                <Btn small t="ghost" onClick={() => remove(t.id)}>✕</Btn>
              </span>,
            ];
          })} />
        ) : <Note>Aucune position. Les fiches approuvées dans TAILLE arrivent ici.</Note>}
        {closing && (
          <div style={{ marginTop: 12, padding: 12, border: `1px solid ${C.amberBorder}`, borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: C.amber, marginBottom: 8 }}>CLÔTURE {closing.ticker}</div>
            <Grid min={120}>
              <Field label="PRIX D'EXÉCUTION ENTRÉE" hint="Sert au contrôle du glissement (> 0,5 % = alerte)"><Num value={closing.fill} onChange={(v) => setClosing({ ...closing, fill: v })} /></Field>
              <Field label="PRIX DE SORTIE"><Num value={closing.exitPrice} onChange={(v) => setClosing({ ...closing, exitPrice: v })} /></Field>
              <Field label="DATE DE SORTIE"><input type="date" value={closing.exitDate} onChange={(e) => setClosing({ ...closing, exitDate: e.target.value })} style={inputStyle} /></Field>
            </Grid>
            <Field label="LEÇON (obligatoire pour le dimanche)" style={{ marginTop: 8 }}>
              <input value={closing.lesson} onChange={(e) => setClosing({ ...closing, lesson: e.target.value })} style={inputStyle} placeholder="Ce que cette opération apprend, même si elle est gagnante" />
            </Field>
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <Btn small t="green" onClick={closeTrade} disabled={!(Number(closing.exitPrice) > 0) || !closing.lesson.trim()}>VALIDER</Btn>
              <Btn small t="ghost" onClick={() => setClosing(null)}>ANNULER</Btn>
            </div>
          </div>
        )}
      </Card>

      <Card title={`CLÔTURÉES (${closed.length})`}>
        {closed.length ? (
          <Table small head={["SORTIE", "TITRE", "MODE", "STRATÉGIE", "ENTRÉE → SORTIE", "R", "RENDEMENT", "RÉSULTAT", "GLISSEMENT", "LEÇON", ""]} rows={closed.map((t, i) => {
            const m = cm[i];
            return [
              t.exitDate, <span style={{ color: C.amber }}>{t.ticker} {t.side === "short" ? "↓" : "↑"}</span>, modeLabel(t.mode), stratName(t.strategyId),
              `${fmtNum(m.entry)} → ${fmtNum(Number(t.exitPrice))}`, <span style={{ color: tone(m.R) }}>{fmtNum(m.R, 2)}</span>,
              <span style={{ color: tone(m.ret) }}>{fmtPct(m.ret, 2)}</span>, <span style={{ color: tone(m.pnl) }}>{fmtNum(m.pnl, 0)}</span>,
              <span style={{ color: (m.slippage ?? 0) > rules.maxSlippage ? C.red : C.sub }}>{m.slippage == null ? "—" : fmtPct(m.slippage, 2, false)}</span>,
              <span style={{ fontSize: 9 }}>{t.lesson}</span>, <Btn small t="ghost" onClick={() => remove(t.id)}>✕</Btn>,
            ];
          })} />
        ) : <Note>Le journal est la piste d'audit, la source de calibration et la mémoire qui empêche de retester une idée rejetée (II.F).</Note>}
      </Card>
    </div>
  );
}
