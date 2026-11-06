import { useMemo, useState } from "react";
import { todayISO } from "./data.js";
import { defaultRules, killSwitch, openTrades, tradeMetrics } from "./desk.js";
import { sum } from "./quant.js";
import { C, serif, KpiRow, SubTabs, fmtPct, usePersistent } from "./ui.jsx";
import Lab from "./Lab.jsx";
import Sizing from "./Sizing.jsx";
import Journal from "./Journal.jsx";
import Ladder from "./Ladder.jsx";
import Risk from "./Risk.jsx";
import Rules from "./Rules.jsx";

/**
 * DESK — the computable half of "How to Build a One-Person Hedge Fund…":
 * strategy gates (III), sizing & kill switch (V), promotion ladder & journal (VI).
 * The six agents become six views; the operator stays the only one who places orders.
 */
export default function DeskTab({ portfolio, stocks }) {
  const [sub, setSub] = useState("labo");
  const [rules, setRulesRaw] = usePersistent("atlas_desk_rules", () => defaultRules(portfolio?.vnl));
  const [journal, setJournal] = usePersistent("atlas_desk_journal", []);
  const [strategies, setStrategies] = usePersistent("atlas_desk_strategies", []);
  const [dataset, setDataset] = usePersistent("atlas_desk_dataset", null);
  const [runs, setRuns] = usePersistent("atlas_desk_runs", []);
  const [corr, setCorr] = usePersistent("atlas_desk_corr", null);
  const [lab, setLab] = useState(null);
  const rulesFull = useMemo(() => ({ ...defaultRules(portfolio?.vnl), ...rules }), [rules, portfolio?.vnl]);
  const setRules = (fn) => setRulesRaw((r) => (typeof fn === "function" ? fn({ ...defaultRules(portfolio?.vnl), ...r }) : fn));
  const today = todayISO();

  const kill = useMemo(() => killSwitch({ journal, rules: rulesFull, today, dataset, strategies }), [journal, rulesFull, today, dataset, strategies]);
  const fired = kill.filter((k) => k.fired);
  const open = openTrades(journal);
  const heat = rulesFull.equity > 0 ? sum(open.map((t) => tradeMetrics(t, rulesFull).openRisk)) / rulesFull.equity : 0;
  const active = strategies.filter((s) => s.status === "active");
  const buried = strategies.length - active.length;

  const exportState = () => ({ app: "atlas-intel-desk", version: 1, exportedAt: today, rules: rulesFull, journal, strategies, runs });
  const importState = (j) => {
    if (j.rules) setRulesRaw(j.rules);
    if (Array.isArray(j.journal)) setJournal(j.journal);
    if (Array.isArray(j.strategies)) setStrategies(j.strategies);
    if (Array.isArray(j.runs)) setRuns(j.runs);
  };

  const common = { rules: rulesFull, journal, strategies, stocks, corr, goTo: setSub };
  return (
    <div style={{ padding: "18px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: serif, fontSize: 22, color: C.amber }}>Desk</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4, maxWidth: 720, lineHeight: 1.6 }}>
            Hypothèse → 7 gates statistiques → taille au risque → Risk Officer → journal → échelle paper-to-live.
            Une stratégie n'est « rentable » que si elle reste positive après coûts hors échantillon, survit au Sharpe déflaté et tient en walk-forward.
          </div>
        </div>
      </div>

      {fired.length > 0 && (
        <div onClick={() => setSub("journal")} style={{ cursor: "pointer", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.45)", borderRadius: 8, padding: "10px 16px", marginBottom: 12, fontSize: 11, color: C.red }}>
          🛑 KILL SWITCH : {fired.map((k) => `${k.trigger} → ${k.action}`).join(" · ")}
        </div>
      )}

      <KpiRow min={120} items={[
        { l: "KILL SWITCH", v: fired.length ? `${fired.length} actif(s)` : "Armé", c: fired.length ? C.red : C.green },
        { l: "HEAT (18)", v: fmtPct(heat, 2, false), s: `max ${fmtPct(rulesFull.heatMax, 1, false)}`, c: heat > rulesFull.heatMax ? C.red : C.amber },
        { l: "POSITIONS DESK", v: `${open.length} / ${rulesFull.maxOpen}` },
        { l: "SUR L'ÉCHELLE", v: active.length, s: active.length ? active.map((s) => `R${s.rung}`).join(" ") : "aucune" },
        { l: "CIMETIÈRE", v: buried, s: `${runs.length} idée(s) testée(s)` },
        { l: "DERNIER LABO", v: lab ? `${lab.gates.filter((g) => g.pass).length}/7` : "—", s: lab ? lab.symbol : "", c: lab ? (lab.pass ? C.green : C.red) : C.muted },
      ]} />

      <SubTabs value={sub} onChange={setSub} tabs={[
        ["labo", "Labo"], ["sizing", "Sizing"], ["journal", "Journal", fired.length > 0], ["echelle", "Échelle"], ["risque", "Risque"], ["regles", "Règles"],
      ]} />

      {sub === "labo" && <Lab {...common} dataset={dataset} setDataset={setDataset} lab={lab} setLab={setLab} setStrategies={setStrategies} runs={runs} setRuns={setRuns} portfolio={portfolio} />}
      {sub === "sizing" && <Sizing {...common} lab={lab} setJournal={setJournal} />}
      {sub === "journal" && <Journal {...common} setJournal={setJournal} kill={kill} />}
      {sub === "echelle" && <Ladder {...common} setStrategies={setStrategies} />}
      {sub === "risque" && <Risk {...common} portfolio={portfolio} setCorr={setCorr} />}
      {sub === "regles" && <Rules rules={rulesFull} setRules={setRules} portfolio={portfolio} exportState={exportState} importState={importState} />}
    </div>
  );
}
