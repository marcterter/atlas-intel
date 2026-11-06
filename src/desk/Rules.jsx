import { useState } from "react";
import { defaultRules } from "./desk.js";
import { todayISO } from "./data.js";
import { C, Card, Btn, Field, Num, Grid, Note, inputStyle, fmtInt } from "./ui.jsx";

const PCT = [
  ["riskPerTrade", "RISQUE PAR OPÉRATION f (13)"], ["fMax", "PLAFOND f_max (16)"], ["heatMax", "RISQUE OUVERT MAX H_max (18)"],
  ["maxDailyLoss", "PERTE DU JOUR → COUPE-CIRCUIT"], ["maxSlippage", "GLISSEMENT MAX vs PLAN"],
  ["commission", "COMMISSION / CÔTÉ"], ["slippage", "GLISSEMENT ESTIMÉ / CÔTÉ"],
];
const NUM = [
  ["equity", "CAPITAL E"], ["maxOpen", "POSITIONS OUVERTES MAX"], ["maxHold", "DÉTENTION MAX (BARRES)"],
  ["atrK", "k × ATR PAR DÉFAUT"], ["corrThreshold", "SEUIL DE CORRÉLATION"], ["streak", "PERTES D'AFFILÉE"], ["staleBars", "DONNÉES PÉRIMÉES (BARRES)"],
];

export default function Rules({ rules, setRules, portfolio, exportState, importState }) {
  const [msg, setMsg] = useState("");
  const set = (k) => (v) => v !== "" && setRules((r) => ({ ...r, [k]: v }));

  const download = () => {
    const blob = new Blob([JSON.stringify(exportState(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `atlas-desk-${todayISO()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const upload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const rd = new FileReader();
    rd.onload = () => {
      try {
        const j = JSON.parse(String(rd.result));
        if (!window.confirm(`Remplacer le desk actuel par la sauvegarde du ${j.exportedAt || "?"} ?`)) return;
        importState(j);
        setMsg("Sauvegarde restaurée ✓");
      } catch (err) { setMsg(`Fichier invalide : ${err.message}`); }
    };
    rd.readAsText(f);
    e.target.value = "";
  };

  return (
    <div>
      <Card title="RÈGLES DU DESK — L'ÉTAT PARTAGÉ QUE CHAQUE DÉCISION RELIT (II.C)">
        <Grid min={150}>
          {NUM.map(([k, l]) => <Field key={k} label={l}><Num value={rules[k]} onChange={set(k)} /></Field>)}
          {PCT.map(([k, l]) => <Field key={k} label={`${l} (%)`}><Num pct value={rules[k]} onChange={set(k)} /></Field>)}
        </Grid>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <Btn small t="ghost" onClick={() => setRules((r) => ({ ...r, equity: Math.round(portfolio.vnl) }))}>CAPITAL = VALEUR NETTE DU PORTEFEUILLE ({fmtInt(portfolio.vnl)})</Btn>
          <Btn small t="ghost" onClick={() => window.confirm("Revenir aux règles par défaut de l'article ?") && setRules(defaultRules(portfolio.vnl))}>RÈGLES DE L'ARTICLE</Btn>
        </div>
        <Grid min={260} style={{ marginTop: 12 }}>
          <Field label="MARCHÉS ET INSTRUMENTS AUTORISÉS" hint="« pas de vente à découvert » dans ce texte bloque les ordres de vente.">
            <textarea rows={3} value={rules.markets} onChange={(e) => setRules((r) => ({ ...r, markets: e.target.value }))} style={{ ...inputStyle, resize: "vertical" }} />
          </Field>
          <Field label="TICKERS INTERDITS" hint="Séparés par des virgules. Le contrôle des risques oppose un veto.">
            <textarea rows={3} value={rules.forbidden} onChange={(e) => setRules((r) => ({ ...r, forbidden: e.target.value.toUpperCase() }))} style={{ ...inputStyle, resize: "vertical" }} placeholder="USAR, SMR" />
          </Field>
        </Grid>
      </Card>

      <Card title="RÈGLES DE COMPORTEMENT">
        <div style={{ fontSize: 11, color: C.sub, lineHeight: 1.9 }}>
          1. Chaque affirmation porte une source et un horodatage.<br />
          2. Personne n'invente un prix, un chiffre ou un résultat.<br />
          3. Une idée sans avantage identifié, sans raison et sans contrepartie perdante identifiée est écartée avant tout calcul (III.A).<br />
          4. Seule une fiche tamponnée APPROUVÉ entre au journal ; le silence vaut refus (VI.C).
        </div>
      </Card>

      <Card title="APPLICATION EN COUCHES (V.G) — UNE RÈGLE N'EST PAS UN MUR">
        <Note>
          Ces limites vivent dans l'app : ce sont des règles. Le mur, c'est le compte chez le courtier. Chez IBKR, règle des limites de taille et de valeur par ordre dans
          les paramètres de précaution des ordres. Fais tourner les échelons 1 et 2 sur le compte de simulation (paper trading), jamais sur le compte réel. Aucun accès « ordre » n'est donné
          à une IA : l'app n'envoie rien au courtier.
        </Note>
      </Card>

      <Card title="SAUVEGARDE — LE JOURNAL EST LA PISTE D'AUDIT (II.F)">
        <Note>Tout est stocké dans ce navigateur (localStorage). Exporte régulièrement : vider le cache efface le journal, l'échelle et le cimetière.</Note>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
          <Btn small onClick={download}>⤓ EXPORTER JSON</Btn>
          <label style={{ fontSize: 10, color: C.sub, cursor: "pointer", border: `1px solid ${C.border}`, borderRadius: 6, padding: "4px 10px" }}>
            ⤒ RESTAURER<input type="file" accept="application/json,.json" onChange={upload} style={{ display: "none" }} />
          </label>
          {msg && <span style={{ fontSize: 10, color: msg.includes("✓") ? C.green : C.red }}>{msg}</span>}
        </div>
      </Card>
    </div>
  );
}
