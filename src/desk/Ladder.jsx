import { todayISO, daysBetween } from "./data.js";
import { RUNGS, strategyHealth, advanceCheck } from "./desk.js";
import { C, serif, Card, Btn, Table, Note, Pill, fmtPct, fmtNum, tone } from "./ui.jsx";

export default function Ladder({ rules, journal, strategies, setStrategies, goTo }) {
  const today = todayISO();
  const active = strategies.filter((s) => s.status === "active");
  const graveyard = strategies.filter((s) => s.status === "graveyard").sort((a, b) => (a.buriedAt < b.buriedAt ? 1 : -1));

  const move = (s, rung, note) => setStrategies((all) => all.map((x) => (x.id === s.id
    ? { ...x, rung, rungSince: today, history: [...(x.history || []), { date: today, note }] } : x)));
  const bury = (s, reason) => setStrategies((all) => all.map((x) => (x.id === s.id
    ? { ...x, status: "graveyard", buriedAt: today, reason, history: [...(x.history || []), { date: today, note: `→ cimetière : ${reason}` }] } : x)));

  const reviews = active.map((s) => {
    const health = strategyHealth(s, journal, rules);
    return { s, health, adv: advanceCheck(s, health, journal, rules, today) };
  });

  return (
    <div>
      <Card title="TABLE VI — ÉCHELLE DE LA SIMULATION AU RÉEL">
        <Table small head={["ÉCHELON", "CONDITION POUR MONTER", "CAPITAL"]} rows={RUNGS.map((r) => [
          <span style={{ color: C.text }}>{r.n}. {r.name}</span>, r.condition, r.capital])} />
        <Note>Aucun saut : chaque stratégie gravit les cinq échelons, et un échec à n'importe quel échelon la renvoie à l'échelon inférieur.</Note>
      </Card>

      <Card title="REVUE DU DIMANCHE (VI.C)">
        {reviews.length === 0 && <Note>Aucune stratégie sur l'échelle. Seules les stratégies qui passent les 7 tests du LABO peuvent y entrer.</Note>}
        {reviews.map(({ s, health, adv }) => {
          const demote = health.drift || adv.fail;
          return (
            <div key={s.id} style={{ fontSize: 11, color: C.sub, padding: "4px 0" }}>
              <span style={{ color: C.amber }}>{s.name}</span> ·{" "}
              {demote ? <span style={{ color: C.red }}>rétrograder ({health.drift ? "sous le 5e centile Monte Carlo" : "z ≤ −2"})</span>
                : adv.ok ? <span style={{ color: C.green }}>prête à monter à l'échelon {s.rung + 1}</span>
                  : <span>{adv.why}</span>}
            </div>
          );
        })}
      </Card>

      {reviews.map(({ s, health, adv }) => {
        const r = RUNGS[s.rung - 1];
        const z = health.z;
        return (
          <Card key={s.id} title={s.name.toUpperCase()} accent={health.drift ? "rgba(239,68,68,0.4)" : C.amberBorder}
            right={<Pill color={s.rung >= 3 ? C.red : C.blue}>{r.mode === "live" ? "RÉEL" : "SIMULÉ"} · {r.capital}</Pill>}>
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              {RUNGS.map((x) => (
                <div key={x.n} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ height: 4, borderRadius: 2, background: x.n <= s.rung ? C.amber : "rgba(255,255,255,0.08)" }} />
                  <div style={{ fontSize: 8, color: x.n === s.rung ? C.amber : C.dim, marginTop: 4 }}>{x.n}. {x.name}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.8 }}>
              Échelon {s.rung} depuis le {s.rungSince} ({daysBetween(s.rungSince, today)} j) · paramètres N={s.params.breakout}, vol×{s.params.volMult}, k={s.params.stopK}, {s.params.targetR} R, {s.params.maxHold} barres
              <br />Backtest : {s.backtest.n} opérations, r̄_b {fmtPct(s.backtest.mean, 2)}, σ_b {fmtPct(s.backtest.std, 2, false)}, Sharpe {fmtNum(s.backtest.sharpe)}, DSR {fmtNum(s.backtest.dsr, 3)}
              <br />Cohérence (19) : {z.n} opération(s) simulée(s){z.n ? `, r̄_p ${fmtPct(z.rp, 2)}` : ""}, z = <span style={{ color: Number.isFinite(z.z) ? (z.z > -2 ? C.green : C.red) : C.muted }}>{Number.isFinite(z.z) ? z.z.toFixed(2) : "—"}</span> (seuil n ≥ 20 et z &gt; −2)
              <br />Monte Carlo : {health.rets.length} opération(s) clôturée(s), cumul <span style={{ color: tone(health.cum) }}>{fmtPct(health.cum, 2)}</span>
              {Number.isFinite(health.floor) && <> vs 5e centile {fmtPct(health.floor, 2)}</>}
              {health.drift && <span style={{ color: C.red }}> → dérive : rétrograder</span>}
            </div>
            <Note color={adv.ok ? C.green : adv.fail ? C.red : C.muted}>Condition « {r.condition} » : {adv.ok ? "remplie" : adv.why}</Note>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <Btn small t="green" disabled={!adv.ok} onClick={() => { if (adv.confirm && !window.confirm(adv.confirm)) return; move(s, s.rung + 1, `Échelon ${s.rung} → ${s.rung + 1}`); }}>↑ MONTER</Btn>
              <Btn small t="amber" disabled={s.rung <= 1} onClick={() => move(s, s.rung - 1, `Échelon ${s.rung} → ${s.rung - 1} (rétrogradée)`)}>↓ DESCENDRE</Btn>
              <Btn small t="red" onClick={() => { const why = window.prompt("Raison de l'archivage ?", adv.fail ? "z ≤ −2 : avantage détruit en simulation" : health.drift ? "Dérive sous le 5e centile Monte Carlo" : ""); if (why) bury(s, why); }}>✝ CIMETIÈRE</Btn>
              <Btn small t="ghost" onClick={() => goTo("sizing")}>DIMENSIONNER UN ORDRE</Btn>
            </div>
            {(s.history || []).length > 0 && <Note>Historique : {s.history.map((h) => `${h.date} ${h.note}`).join(" · ")}</Note>}
          </Card>
        );
      })}

      <Card title={`CIMETIÈRE (${graveyard.length}) — JAMAIS RETESTÉ`}>
        {graveyard.length ? (
          <Table small head={["DATE", "IDÉE", "TESTS", "RAISON", ""]} rows={graveyard.map((g) => [
            g.buriedAt, <span style={{ color: C.text, fontFamily: serif }}>{g.name}</span>,
            g.gatesPassed != null ? `${g.gatesPassed}/7` : "—", <span style={{ fontSize: 9 }}>{g.reason}</span>,
            <Btn small t="ghost" onClick={() => window.confirm("Effacer définitivement ? Le labo ne pourra plus signaler un retest de cette idée.") && setStrategies((all) => all.filter((x) => x.id !== g.id))}>✕</Btn>,
          ])} />
        ) : <Note>Les idées qui échouent à un test sont archivées ici avec leur raison, pour ne jamais être retestées par accident.</Note>}
      </Card>
    </div>
  );
}
