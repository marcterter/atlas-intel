import { useEffect, useState } from "react";

// Same palette as App.jsx so the Desk tab blends in.
export const C = {
  bg: "#080a0f", card: "rgba(255,255,255,0.025)", border: "rgba(255,255,255,0.06)",
  amber: "#f59e0b", amberBg: "rgba(245,158,11,0.1)", amberBorder: "rgba(245,158,11,0.25)",
  text: "#e2e8f0", muted: "#64748b", sub: "#94a3b8", dim: "#475569",
  green: "#10b981", red: "#ef4444", blue: "#3b82f6", purple: "#8b5cf6", cyan: "#06b6d4", orange: "#f97316",
};
export const serif = "'Playfair Display',serif";

/** useState persisted in localStorage (falls back silently when storage is unavailable). */
export function usePersistent(key, init) {
  const [v, setV] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      if (s != null) return JSON.parse(s);
    } catch { /* private mode, quota… */ }
    return typeof init === "function" ? init() : init;
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
  }, [key, v]);
  return [v, setV];
}

const fin = (x) => typeof x === "number" && Number.isFinite(x);
// Decimal point like the rest of the app (and the paper), non-breaking space between thousands.
const group = (x, d) => x.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }).replace(/,/g, "\u00a0");
export const fmtPct = (x, d = 1, sign = true) => (fin(x) ? `${sign && x > 0 ? "+" : ""}${group(x * 100, d)} %` : "—");
export const fmtNum = (x, d = 2) => (fin(x) ? group(x, d) : "—");
export const fmtInt = (x) => (fin(x) ? group(Math.round(x), 0) : "—");
export const tone = (x) => (fin(x) ? (x > 0 ? C.green : x < 0 ? C.red : C.sub) : C.muted);
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

export function Card({ title, right, accent = C.border, children, style }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${accent}`, borderRadius: 10, padding: 14, marginBottom: 12, ...style }}>
      {(title || right) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          {title && <div style={{ fontSize: 10, color: C.amber, letterSpacing: 2 }}>{title}</div>}
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function KpiRow({ items, min = 120 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${min}px,1fr))`, gap: 8, marginBottom: 12 }}>
      {items.filter(Boolean).map((k) => (
        <div key={k.l} title={k.hint} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px" }}>
          <div style={{ fontSize: 8, color: C.muted, letterSpacing: 1.5, marginBottom: 4 }}>{k.l}</div>
          <div style={{ fontSize: 17, fontFamily: serif, color: k.c || C.text, wordBreak: "break-word" }}>{k.v}</div>
          {k.s && <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{k.s}</div>}
        </div>
      ))}
    </div>
  );
}

const TONES = {
  amber: [C.amber, C.amberBg, C.amberBorder],
  green: [C.green, "rgba(16,185,129,0.1)", "rgba(16,185,129,0.3)"],
  red: [C.red, "rgba(239,68,68,0.1)", "rgba(239,68,68,0.3)"],
  blue: [C.blue, "rgba(59,130,246,0.1)", "rgba(59,130,246,0.3)"],
  ghost: [C.muted, "transparent", C.border],
};
export function Btn({ children, onClick, t = "amber", disabled, small, style, title }) {
  const [fg, bg, bd] = TONES[t];
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      style={{ background: bg, border: `1px solid ${bd}`, color: fg, padding: small ? "4px 10px" : "8px 14px", borderRadius: 6,
        cursor: disabled ? "default" : "pointer", fontSize: small ? 9 : 10, fontFamily: "inherit", letterSpacing: 0.8,
        opacity: disabled ? 0.45 : 1, whiteSpace: "nowrap", ...style }}>
      {children}
    </button>
  );
}

export const inputStyle = {
  background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.text, padding: "7px 9px",
  borderRadius: 6, fontSize: 12, fontFamily: "inherit", outline: "none", width: "100%", boxSizing: "border-box",
};

export function Field({ label, hint, children, style }) {
  return (
    <label style={{ display: "block", ...style }}>
      <div style={{ fontSize: 8, color: C.muted, letterSpacing: 1.2, marginBottom: 4, minHeight: 20, display: "flex", alignItems: "flex-end" }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 9, color: C.dim, marginTop: 3, lineHeight: 1.4 }}>{hint}</div>}
    </label>
  );
}

/** Numeric input that keeps the raw text while typing (accepts a decimal comma). */
export function Num({ value, onChange, step = "any", pct = false, placeholder }) {
  const shown = value === "" || value == null || Number.isNaN(value) ? "" : pct ? +(value * 100).toFixed(4) : value;
  const [txt, setTxt] = useState(String(shown));
  useEffect(() => {
    const parsed = parseFloat(String(txt).replace(",", "."));
    if (String(shown) !== txt && parsed !== Number(shown)) setTxt(String(shown));
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <input inputMode="decimal" value={txt} placeholder={placeholder} step={step} style={inputStyle}
      onChange={(e) => {
        setTxt(e.target.value);
        const x = parseFloat(e.target.value.replace(",", "."));
        onChange(Number.isFinite(x) ? (pct ? x / 100 : x) : "");
      }} />
  );
}

export function Grid({ min = 140, gap = 8, children, style }) {
  return <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${min}px,1fr))`, gap, ...style }}>{children}</div>;
}

export function Pill({ children, color = C.sub }) {
  return <span style={{ fontSize: 9, background: `${color}1f`, color, border: `1px solid ${color}40`, padding: "2px 8px", borderRadius: 10, letterSpacing: 0.6, whiteSpace: "nowrap" }}>{children}</span>;
}

export const Ok = ({ ok, na }) => (
  <span style={{ fontSize: 10, color: na ? C.muted : ok ? C.green : C.red, fontWeight: 500 }}>{na ? "—" : ok ? "✓" : "✗"}</span>
);

export function Table({ head, rows, small }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: small ? 10 : 11 }}>
        <thead>
          <tr>{head.map((h) => <th key={h} style={{ textAlign: "left", fontSize: 8, color: C.muted, letterSpacing: 1.2, fontWeight: 400, padding: "6px 8px", borderBottom: `1px solid ${C.border}`, whiteSpace: "nowrap" }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
              {r.map((cell, j) => <td key={j} style={{ padding: "6px 8px", color: C.sub, verticalAlign: "top" }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SubTabs({ tabs, value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
      {tabs.map(([id, label, badge]) => (
        <button key={id} onClick={() => onChange(id)}
          style={{ background: value === id ? C.amberBg : "transparent", border: `1px solid ${value === id ? C.amberBorder : C.border}`,
            color: value === id ? C.amber : C.muted, padding: "5px 12px", borderRadius: 5, cursor: "pointer", fontSize: 10,
            fontFamily: "inherit", letterSpacing: 1, textTransform: "uppercase" }}>
          {label}{badge ? <span style={{ color: C.red, marginLeft: 5 }}>●</span> : null}
        </button>
      ))}
    </div>
  );
}

/** Minimal SVG line chart (series share the same y scale). */
export function LineChart({ series, height = 150, logScale = false, yFmt, xLabels }) {
  const W = 600, H = height, pad = 4;
  const tr = (v) => (logScale ? Math.log(v) : v);
  const all = series.flatMap((s) => s.values.filter((v) => fin(v) && (!logScale || v > 0)).map(tr));
  if (all.length < 2) return null;
  const lo = Math.min(...all), hi = Math.max(...all), span = hi - lo || 1;
  const pts = (vals) => {
    const n = vals.length;
    return vals.map((v, i) => (fin(v) && (!logScale || v > 0)
      ? `${((i / Math.max(1, n - 1)) * W).toFixed(1)},${(pad + (1 - (tr(v) - lo) / span) * (H - 2 * pad)).toFixed(1)}` : null))
      .filter(Boolean).join(" ");
  };
  const base = series[0]?.baseline;
  const inv = (x) => (logScale ? Math.exp(x) : x);
  const lbl = { position: "absolute", left: 4, fontSize: 9, color: C.muted, background: "rgba(8,10,15,0.7)", padding: "0 3px" };
  return (
    <div>
      <div style={{ position: "relative" }}>
      {yFmt && <div style={{ ...lbl, top: 0 }}>{yFmt(inv(hi))}</div>}
      {yFmt && <div style={{ ...lbl, bottom: 0 }}>{yFmt(inv(lo))}</div>}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height: H, display: "block" }}>
        {fin(base) && (!logScale || base > 0) && (
          <line x1="0" x2={W} y1={pad + (1 - (tr(base) - lo) / span) * (H - 2 * pad)} y2={pad + (1 - (tr(base) - lo) / span) * (H - 2 * pad)}
            stroke={C.border} strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
        )}
        {series.map((s) => (
          <polyline key={s.label} points={pts(s.values)} fill="none" stroke={s.color} strokeWidth={s.width || 1.5}
            strokeOpacity={s.opacity ?? 1} vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      </div>
      {xLabels && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.dim, marginTop: 2 }}>
          <span>{xLabels[0]}</span><span>{xLabels[1]}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 6 }}>
        {series.map((s) => (
          <span key={s.label} style={{ fontSize: 9, color: C.muted, display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 12, height: 2, background: s.color, opacity: s.opacity ?? 1, display: "inline-block" }} />{s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Note({ children, color = C.muted }) {
  return <div style={{ fontSize: 10, color, lineHeight: 1.6, marginTop: 6 }}>{children}</div>;
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
