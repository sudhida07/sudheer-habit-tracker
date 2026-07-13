/* global React */
// Portfolio Tracker integration — US Live / Equity P&L / After-Tax tabs
// Data mirrored from portfolio-tracker-4296f.web.app exports
const { useState: useStatePT } = React;

const PT_KEY = "family-dashboard-v2:tracker";
const PT_FX = 95.37;

const PT_HOLDINGS = [
  { t: "AGX", qty: 4.4939, avg: 650.92, cur: 630.32, day: -8.32, val: 2833, cost: 2925 },
  { t: "SPCX", qty: 18.75, avg: 207.09, cur: 145.30, day: -4.51, val: 2724, cost: 3883 },
  { t: "MSFT", qty: 12.87, avg: 388.49, cur: 385.10, day: 0.19, val: 4956, cost: 5000 },
  { t: "CRM", qty: 9.0979, avg: 151.46, cur: 163.32, day: 0.50, val: 1486, cost: 1378 },
  { t: "CRWD", qty: 7.2655, avg: 639.05, cur: 187.18, day: -5.66, val: 1360, cost: 4643 },
  { t: "SOXL", qty: 10.16, avg: 294.33, cur: 192.26, day: -0.10, val: 1954, cost: 2991 },
  { t: "GOOGL", qty: 6.4009, avg: 391.11, cur: 357.18, day: -0.48, val: 2286, cost: 2503 },
  { t: "PANW", qty: 5.8734, avg: 282.51, cur: 325.91, day: -3.67, val: 1914, cost: 1659 },
  { t: "AMD", qty: 3.7502, avg: 533.30, cur: 557.89, day: 2.04, val: 2092, cost: 2000 },
  { t: "INTC", qty: 7.1241, avg: 139.96, cur: 109.84, day: -2.40, val: 783, cost: 997 },
  { t: "AMZN", qty: 8.2077, avg: 243.67, cur: 245.34, day: -0.69, val: 2014, cost: 2000 },
  { t: "SMCI", qty: 64.12, avg: 31.15, cur: 28.31, day: 0.25, val: 1815, cost: 1997 },
  { t: "NVDA", qty: 18.55, avg: 220.09, cur: 210.96, day: 4.03, val: 3914, cost: 4083 },
  { t: "DRAM", qty: 6.7679, avg: 80.44, cur: 63.04, day: -2.05, val: 427, cost: 544 },
];

const ptUSD = (n, dec = 0) => (n < 0 ? "−$" : "$") + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: dec });

function ptLoad() {
  try { return JSON.parse(localStorage.getItem(PT_KEY)) || {}; } catch (e) { return {}; }
}
function ptSave(patch) {
  try { localStorage.setItem(PT_KEY, JSON.stringify({ ...ptLoad(), ...patch })); } catch (e) {}
}

// ---------- Upload cards ----------
function PTUploadCard({ title, hint, multiple, onFiles }) {
  const [names, setNames] = useStatePT([]);
  return (
    <div className="fd-card" style={{ padding: 18 }}>
      <div className="fd-label" style={{ marginBottom: 8 }}>📤 {title}</div>
      <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>{hint}</div>
      <label className="fd-btn" style={{ cursor: "pointer" }}>
        Choose {multiple ? "Files" : "File"}
        <input type="file" multiple={multiple} accept=".xlsx,.xls,.csv" style={{ display: "none" }}
          onChange={e => {
            const list = [...(e.target.files || [])].map(f => f.name);
            setNames(list);
            if (onFiles) onFiles(list);
          }} />
      </label>
      {names.length > 0 ? (
        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: "var(--fd-green)" }}>
          ✓ {names.join(", ")}
          <div style={{ fontSize: 10.5, color: "var(--fd-ink-3)", marginTop: 2 }}>Parsed · report will regenerate (simulated in prototype)</div>
        </div>
      ) : (
        <span style={{ marginLeft: 10, fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600 }}>no file selected</span>
      )}
    </div>
  );
}

// Manual holdings entry (Indian stocks)
function PTManualEntry() {
  const [rows, setRows] = useStatePT(() => ptLoad().manualRows || []);
  const [f, setF] = useStatePT({ name: "", qty: "", avg: "" });
  const ok = f.name.trim() && +f.qty > 0 && +f.avg > 0;
  const add = () => {
    if (!ok) return;
    const next = [...rows, { name: f.name.trim(), qty: +f.qty, avg: +f.avg }];
    setRows(next); ptSave({ manualRows: next });
    setF({ name: "", qty: "", avg: "" });
  };
  const remove = (i) => { const next = rows.filter((_, j) => j !== i); setRows(next); ptSave({ manualRows: next }); };
  return (
    <div className="fd-card" style={{ padding: 18 }}>
      <div className="fd-label" style={{ marginBottom: 8 }}>✍️ Manual entry (Indian stocks)</div>
      <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 600, marginBottom: 12, lineHeight: 1.5 }}>
        For Angel One or any broker with password-protected exports. Add holdings one by one, then Save to generate an AI report.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 100px auto", gap: 8 }}>
        <input className="fd-input" placeholder="Stock name (e.g. Vedanta Ltd)" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
        <input className="fd-input" type="number" placeholder="Qty" value={f.qty} onChange={e => setF({ ...f, qty: e.target.value })} />
        <input className="fd-input" type="number" placeholder="Avg buy ₹" value={f.avg} onChange={e => setF({ ...f, avg: e.target.value })} />
        <button className="fd-btn fd-btn-primary" disabled={!ok} style={{ opacity: ok ? 1 : 0.5 }} onClick={add}>+ Add</button>
      </div>
      {rows.length > 0 && (
        <div style={{ marginTop: 12 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: "1px solid var(--fd-line)", fontSize: 12.5 }}>
              <span style={{ flex: 1, fontWeight: 700 }}>{r.name}</span>
              <span className="mono" style={{ color: "var(--fd-ink-2)" }}>{r.qty} × ₹{r.avg.toLocaleString("en-IN")}</span>
              <button className="fd-btn fd-btn-ghost fd-btn-danger" style={{ height: 24, padding: "0 6px" }} onClick={() => remove(i)}><window.Icons.X size={12} /></button>
            </div>
          ))}
          <button className="fd-btn" style={{ marginTop: 10 }}>Save · generate AI report</button>
        </div>
      )}
    </div>
  );
}

// ---------- US Live tab ----------
function PTLive() {
  const saved = ptLoad();
  const [wallet, setWallet] = useStatePT(saved.wallet ?? 0);
  const [aggressive, setAggressive] = useStatePT(saved.aggressive ?? true);
  const [risk, setRisk] = useStatePT(saved.risk ?? 100);

  const totalVal = PT_HOLDINGS.reduce((s, h) => s + h.val, 0);
  const totalCost = PT_HOLDINGS.reduce((s, h) => s + h.cost, 0);
  const unreal = totalVal - totalCost;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Upload + manual entry */}
      <div className="fd-grid-2">
        <PTUploadCard title="Refresh data — upload holdings export"
          hint="Supports: INDmoney family holdings (.xlsx), broker XLS (US stocks), Angel One password-protected XLSX, or CSV." />
        <PTManualEntry />
      </div>
      {/* AI growth hero */}
      <div className="fd-grid-3">
        <div className="fd-card" style={{ padding: 18, border: "1px solid rgba(74,222,128,0.3)", boxShadow: "0 0 24px -8px rgba(74,222,128,0.4)" }}>
          <div className="fd-label">🤖 AI-powered growth</div>
          <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "var(--fd-green)" }}>+$16,934</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--fd-green)", marginTop: 2 }}>+86.09% portfolio value</div>
          <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600, marginTop: 6 }}>Since 20 Apr 2026 · 60 snapshots · 64 days</div>
        </div>
        <div className="fd-card" style={{ padding: 18 }}>
          <div className="fd-label">💵 Wallet cash</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10 }}>
            <span className="mono" style={{ fontSize: 15, color: "var(--fd-ink-3)" }}>USD $</span>
            <input className="fd-input" type="number" value={wallet} style={{ width: 110 }}
              onChange={e => setWallet(+e.target.value)} />
            <button className="fd-btn" onClick={() => ptSave({ wallet })}>Save</button>
          </div>
          <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600, marginTop: 8 }}>AI suggests deployment in the daily brief</div>
        </div>
        <div className="fd-card" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className="fd-label">⚡ Investment style</div>
            <button onClick={() => { setAggressive(!aggressive); ptSave({ aggressive: !aggressive }); }} className="fd-chip" style={{
              background: aggressive ? "var(--fd-coral-soft)" : "rgba(255,255,255,0.06)",
              color: aggressive ? "var(--fd-coral)" : "var(--fd-ink-3)", cursor: "pointer", border: "none",
            }}>Aggressive {aggressive ? "ON" : "OFF"}</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, marginBottom: 4 }}>
              <span style={{ color: "var(--fd-ink-3)" }}>Risk capital</span>
              <span className="mono" style={{ color: risk > 60 ? "var(--fd-coral)" : "var(--fd-teal)" }}>{risk}%</span>
            </div>
            <input type="range" min="10" max="100" step="5" value={risk} disabled={!aggressive}
              onChange={e => { setRisk(+e.target.value); ptSave({ risk: +e.target.value }); }}
              style={{ width: "100%", accentColor: "#FB7185", opacity: aggressive ? 1 : 0.4 }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, color: "var(--fd-ink-3)", fontWeight: 600 }}>
              <span>10% cautious</span><span>100% all profit at risk</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live table */}
      <div className="fd-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--fd-line)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: 13 }}>Live prices · {PT_HOLDINGS.length} US holdings</span>
            <span style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600, marginLeft: 10 }}>converted at ₹{PT_FX}/$</span>
          </div>
          <button className="fd-btn" style={{ height: 28 }}>↻ Refresh prices</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, minWidth: 640 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--fd-line)" }}>
                {["TICKER", "QTY", "AVG BUY", "CURRENT $", "DAY %", "VALUE", "COST", "UNREALIZED"].map((h, i) => (
                  <th key={h} className="fd-label" style={{ padding: "9px 14px", textAlign: i === 0 ? "left" : "right", fontSize: 9.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PT_HOLDINGS.map(h => {
                const u = h.val - h.cost;
                return (
                  <tr key={h.t} style={{ borderBottom: "1px solid var(--fd-line)" }}>
                    <td style={{ padding: "9px 14px", fontWeight: 800 }}>{h.t}</td>
                    <td className="mono" style={{ padding: "9px 14px", textAlign: "right", color: "var(--fd-ink-2)" }}>{h.qty}</td>
                    <td className="mono" style={{ padding: "9px 14px", textAlign: "right", color: "var(--fd-ink-2)" }}>${h.avg.toFixed(2)}</td>
                    <td className="mono" style={{ padding: "9px 14px", textAlign: "right" }}>${h.cur.toFixed(2)}</td>
                    <td className="mono" style={{ padding: "9px 14px", textAlign: "right", color: h.day >= 0 ? "var(--fd-green)" : "var(--fd-red)" }}>{h.day >= 0 ? "+" : ""}{h.day.toFixed(2)}%</td>
                    <td className="mono" style={{ padding: "9px 14px", textAlign: "right" }}>{ptUSD(h.val)}</td>
                    <td className="mono" style={{ padding: "9px 14px", textAlign: "right", color: "var(--fd-ink-2)" }}>{ptUSD(h.cost)}</td>
                    <td className="mono" style={{ padding: "9px 14px", textAlign: "right", fontWeight: 700, color: u >= 0 ? "var(--fd-green)" : "var(--fd-red)" }}>{ptUSD(u)}</td>
                  </tr>
                );
              })}
              <tr>
                <td style={{ padding: "11px 14px", fontWeight: 800 }}>Total</td>
                <td colSpan="4"></td>
                <td className="mono" style={{ padding: "11px 14px", textAlign: "right", fontWeight: 800 }}>{ptUSD(totalVal)}</td>
                <td className="mono" style={{ padding: "11px 14px", textAlign: "right", fontWeight: 800, color: "var(--fd-ink-2)" }}>{ptUSD(totalCost)}</td>
                <td className="mono" style={{ padding: "11px 14px", textAlign: "right", fontWeight: 800, color: unreal >= 0 ? "var(--fd-green)" : "var(--fd-red)" }}>{ptUSD(unreal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
// ---------- Equity P&L tab ----------
function PTPnl() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <PTUploadCard title="Upload tax P&L report (realized gains)" multiple
        hint="Supports multiple files at once — select your Indian + US reports for FY 2024-25, 2025-26, 2026-27 etc. to build full history. Auto-detected per file; duplicates won't overwrite." />
      <div className="fd-grid-2">
        <div className="fd-card" style={{ padding: 18 }}>
          <div className="fd-label">Before AI · earning per day</div>
          <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>+$25</div>
          <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600, marginTop: 4 }}>7 days · 6 trades · since 06 Apr 2026</div>
          <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 12, fontWeight: 700 }}>
            <span>Total <span className="mono" style={{ color: "var(--fd-green)" }}>+$175</span></span>
            <span>Win rate <span className="mono">100%</span></span>
            <span>Avg win <span className="mono" style={{ color: "var(--fd-green)" }}>$29</span></span>
          </div>
        </div>
        <div className="fd-card" style={{ padding: 18, border: "1px solid rgba(34,211,238,0.35)", boxShadow: "0 0 24px -8px rgba(34,211,238,0.4)" }}>
          <div className="fd-label" style={{ color: "var(--fd-teal)" }}>After AI · earning per day</div>
          <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "var(--fd-teal)" }}>+$123</div>
          <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600, marginTop: 4 }}>90 days · 376 trades · since 13 Apr 2026</div>
          <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: 12, fontWeight: 700 }}>
            <span>Total <span className="mono" style={{ color: "var(--fd-green)" }}>+$11,098</span></span>
            <span>Win rate <span className="mono">72%</span></span>
            <span>Avg win <span className="mono" style={{ color: "var(--fd-green)" }}>$47</span></span>
            <span>Avg loss <span className="mono" style={{ color: "var(--fd-red)" }}>−$17</span></span>
          </div>
        </div>
      </div>

      <div className="fd-grid-3">
        <div className="fd-card" style={{ padding: 18 }}>
          <div className="fd-label">Current unrealized</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: "var(--fd-red)" }}>−$6,047</div>
          <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600, marginTop: 4 }}>Open positions · latest upload</div>
        </div>
        <div className="fd-card" style={{ padding: 18 }}>
          <div className="fd-label">Total P&L since AI</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: "var(--fd-green)" }}>+$5,051</div>
          <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600, marginTop: 4 }}>Realized $11,098 + unrealized −$6,047</div>
        </div>
        <div className="fd-card" style={{ padding: 18 }}>
          <div className="fd-label">Normalized delta vs pre-AI</div>
          <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: "var(--fd-teal)" }}>+$120</div>
          <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600, marginTop: 4 }}>AI-era vs pre-AI pace, same trade count</div>
        </div>
      </div>

      {/* Monthly calendar */}
      <div className="fd-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontWeight: 800, fontSize: 13 }}>‹ &nbsp;Jul 2026&nbsp; ›</span>
          <span className="fd-label">Realized P&L calendar · ₹ INR</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, fontSize: 11, textAlign: "center" }}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
            <div key={d} className="fd-label" style={{ padding: "4px 0", fontSize: 9 }}>{d}</div>
          ))}
          {Array.from({ length: 34 }, (_, i) => {
            const day = i - 2; // July 2026 starts Wednesday
            if (day < 1 || day > 31) return <div key={i}></div>;
            const pnl = day <= 10 ? [0, 420, -180, 890, 0, 1240, 310, -95, 640, 0, 220][day] || 0 : 0;
            const has = pnl !== 0;
            return (
              <div key={i} className="mono" style={{
                padding: "8px 2px", borderRadius: 8,
                background: has ? (pnl > 0 ? "var(--fd-green-soft)" : "var(--fd-red-soft)") : "rgba(255,255,255,0.03)",
                border: `1px solid ${has ? (pnl > 0 ? "rgba(74,222,128,0.3)" : "rgba(248,113,113,0.3)") : "transparent"}`,
                color: has ? (pnl > 0 ? "var(--fd-green)" : "var(--fd-red)") : "var(--fd-ink-3)",
              }}>
                <div style={{ fontWeight: 700 }}>{day}</div>
                {has && <div style={{ fontSize: 8.5 }}>{pnl > 0 ? "+" : "−"}₹{Math.abs(pnl)}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- After-Tax tab ----------
const PT_TRADES = [
  { d: "2026-06-18", s: "Intel Corporation", type: "Short", p: 90 },
  { d: "2026-06-18", s: "Intel Corporation", type: "Short", p: 88 },
  { d: "2026-06-18", s: "Direxion Semi Bull 3X ETF", type: "Short", p: 120 },
  { d: "2026-06-18", s: "Direxion Semi Bull 3X ETF", type: "Short", p: 70 },
  { d: "2026-06-18", s: "Roundhill Memory ETF", type: "Short", p: 74 },
  { d: "2026-06-17", s: "Roundhill Memory ETF", type: "Short", p: 109 },
  { d: "2026-06-17", s: "Argan, Inc", type: "Short", p: 193 },
  { d: "2026-06-17", s: "Argan, Inc", type: "Short", p: 68 },
  { d: "2026-06-16", s: "Apple Inc.", type: "Short", p: 22 },
  { d: "2026-06-16", s: "Advanced Micro Devices", type: "Short", p: 54 },
];

function PTTax() {
  const [filter, setFilter] = useStatePT("All");
  const cats = ["All", "Intraday", "Short", "Long"];
  const shown = PT_TRADES.filter(t => filter === "All" || t.type === filter);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, color: "var(--fd-ink-2)", fontWeight: 600 }}>Brokerage + Indian tax rules applied per trade · Tax slab 30% · FY 2026-27 · 382 trades</div>
      </div>
      <div className="fd-grid-4">
        {[
          ["Gross P&L", "$11,273", "var(--fd-ink)"],
          ["Brokerage + charges", "$3,055", "var(--fd-gold)"],
          ["Tax (30% slab)", "$3,517", "var(--fd-coral)"],
          ["In-hand P&L", "$7,756", "var(--fd-green)"],
        ].map(([l, v, c]) => (
          <div key={l} className="fd-card" style={{ padding: 18 }}>
            <div className="fd-label">{l}</div>
            <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6, color: c }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="fd-grid-3">
        {[
          ["Intraday", 0, "$0", "$0", "$0"],
          ["Short-term", 382, "$11.3k", "$3.5k", "$7.8k"],
          ["Long-term", 0, "$0", "$0", "$0"],
        ].map(([l, n, g, t, ih]) => (
          <div key={l} className="fd-card" style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontWeight: 800, fontSize: 13 }}>{l}</span>
              <span className="fd-chip" style={{ background: "rgba(255,255,255,0.06)", color: "var(--fd-ink-2)" }}>{n}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
              <span>Gross <div className="mono" style={{ fontSize: 14 }}>{g}</div></span>
              <span>Tax <div className="mono" style={{ fontSize: 14, color: "var(--fd-coral)" }}>{t}</div></span>
              <span>In-hand <div className="mono" style={{ fontSize: 14, color: "var(--fd-green)" }}>{ih}</div></span>
            </div>
          </div>
        ))}
      </div>

      <div className="fd-card" style={{ overflow: "hidden" }}>
        <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--fd-line)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: 13 }}>Trade-level breakdown</span>
          <div style={{ display: "flex", gap: 4 }}>
            {cats.map(c => (
              <button key={c} onClick={() => setFilter(c)} className="fd-chip" style={{
                background: filter === c ? "var(--fd-teal-soft)" : "rgba(255,255,255,0.04)",
                color: filter === c ? "var(--fd-teal)" : "var(--fd-ink-3)", cursor: "pointer", border: "none",
              }}>{c}</button>
            ))}
          </div>
        </div>
        {shown.map((t, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "90px 1fr auto auto", gap: 12, alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--fd-line)", fontSize: 12.5 }}>
            <span className="mono" style={{ color: "var(--fd-ink-3)", fontSize: 11 }}>{t.d}</span>
            <span style={{ fontWeight: 700 }}>{t.s}</span>
            <span className="fd-chip" style={{ background: "var(--fd-purple-soft)", color: "var(--fd-purple)" }}>{t.type}</span>
            <span className="mono" style={{ fontWeight: 700, color: "var(--fd-green)", textAlign: "right", minWidth: 54 }}>+${t.p}</span>
          </div>
        ))}
        <div style={{ padding: "10px 16px", fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600 }}>Showing recent 10 of 382 trades</div>
      </div>
    </div>
  );
}

Object.assign(window, { PTLive, PTPnl, PTTax });
