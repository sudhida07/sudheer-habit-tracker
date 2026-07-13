/* global React */
// Family Dashboard — Portfolio Tracker + Expense & EMI Tracker
const { useState: useStateFM, useMemo: useMemoFM } = React;

const FM_TYPES = ["Stock", "Mutual Fund", "Crypto", "Gold"];
const FM_TYPE_COLOR = { "Stock": "var(--fd-teal)", "Mutual Fund": "var(--fd-purple)", "Crypto": "var(--fd-gold)", "Gold": "var(--fd-coral)" };
const FM_TYPE_COLOR_HEX = { "Stock": "#22D3EE", "Mutual Fund": "#A78BFA", "Crypto": "#FBBF24", "Gold": "#FB7185" };
const FM_CATEGORIES = ["Food", "Utilities", "Entertainment", "Housing", "Transport", "Education", "Health", "Other"];

// ---------- Portfolio ----------
function AssetForm({ onSave, onCancel }) {
  const [f, setF] = useStateFM({ assetName: "", type: "Stock", quantity: "", buyPrice: "", currentPrice: "" });
  const ok = f.assetName.trim() && +f.quantity > 0 && +f.buyPrice > 0 && +f.currentPrice > 0;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="fd-overlay" onClick={onCancel}>
      <div className="fd-modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Add asset</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><div className="fd-label" style={{ marginBottom: 6 }}>Asset name</div>
            <input className="fd-input" autoFocus value={f.assetName} onChange={set("assetName")} placeholder="e.g. Infosys" /></div>
          <div><div className="fd-label" style={{ marginBottom: 6 }}>Type</div>
            <select className="fd-input" value={f.type} onChange={set("type")}>{FM_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
          <div className="fd-grid-3" style={{ gap: 10 }}>
            <div><div className="fd-label" style={{ marginBottom: 6 }}>Qty</div>
              <input className="fd-input" type="number" value={f.quantity} onChange={set("quantity")} placeholder="10" /></div>
            <div><div className="fd-label" style={{ marginBottom: 6 }}>Buy ₹</div>
              <input className="fd-input" type="number" value={f.buyPrice} onChange={set("buyPrice")} placeholder="1500" /></div>
            <div><div className="fd-label" style={{ marginBottom: 6 }}>Now ₹</div>
              <input className="fd-input" type="number" value={f.currentPrice} onChange={set("currentPrice")} placeholder="1680" /></div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
            <button className="fd-btn fd-btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="fd-btn fd-btn-primary" disabled={!ok} style={{ opacity: ok ? 1 : 0.5 }}
              onClick={() => ok && onSave({ assetName: f.assetName.trim(), type: f.type, quantity: +f.quantity, buyPrice: +f.buyPrice, currentPrice: +f.currentPrice })}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FamilyPortfolio() {
  const fd = window.useFD();
  const [modal, setModal] = useStateFM(false);
  const [tab, setTab] = useStateFM("live");
  const isParent = fd.user.role === "parent";
  // Parents see the whole family's assets; children only their own
  const assets = isParent ? fd.db.portfolio.filter(a => fd.familyUids.includes(a.userId)) : fd.db.portfolio.filter(a => a.userId === fd.user.uid);
  const totals = useMemoFM(() => {
    const invested = assets.reduce((s, a) => s + a.quantity * a.buyPrice, 0);
    const current = assets.reduce((s, a) => s + a.quantity * a.currentPrice, 0);
    return { invested, current, pnl: current - invested };
  }, [assets]);

  const byType = useMemoFM(() => {
    const m = {};
    assets.forEach(a => { m[a.type] = (m[a.type] || 0) + a.quantity * a.currentPrice; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [assets]);

  return (
    <div className="fd-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Portfolio Tracker</h1>
          <div style={{ fontSize: 13, color: "var(--fd-ink-2)" }}>{isParent ? "Family-wide view · all members" : "Your assets"}</div>
        </div>
        <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.3)", border: "1px solid var(--fd-line)", borderRadius: 10, padding: 3 }}>
          {[["live", "US Live"], ["pnl", "Equity P&L"], ["tax", "After-Tax"], ["family", "Family Assets"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
              background: tab === id ? "var(--fd-teal-soft)" : "transparent",
              color: tab === id ? "var(--fd-teal)" : "var(--fd-ink-3)",
              border: `1px solid ${tab === id ? "rgba(34,211,238,0.3)" : "transparent"}`,
            }}>{label}</button>
          ))}
        </div>
        {tab === "family" && <button className="fd-btn fd-btn-primary" onClick={() => setModal(true)}><window.Icons.Plus size={14} /> Add asset</button>}
      </div>

      {tab === "live" && <window.PTLive />}
      {tab === "pnl" && <window.PTPnl />}
      {tab === "tax" && <window.PTTax />}

      {tab === "family" && <>
      {/* Summary */}
      <div className="fd-grid-3">
        <div className="fd-card" style={{ padding: 18 }}>
          <div className="fd-label">Total value</div>
          <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{window.fdINR(totals.current)}</div>
        </div>
        <div className="fd-card" style={{ padding: 18 }}>
          <div className="fd-label">Invested</div>
          <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "var(--fd-ink-2)" }}>{window.fdINR(totals.invested)}</div>
        </div>
        <div className="fd-card" style={{ padding: 18 }}>
          <div className="fd-label">Profit / Loss</div>
          <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: totals.pnl >= 0 ? "var(--fd-green)" : "var(--fd-red)" }}>
            {totals.pnl >= 0 ? "+" : "−"}{window.fdINR(totals.pnl)}
            <span style={{ fontSize: 13, marginLeft: 8 }}>({totals.invested ? ((totals.pnl / totals.invested) * 100).toFixed(1) : 0}%)</span>
          </div>
        </div>
      </div>

      {/* Allocation donut + bar */}
      {byType.length > 0 && (
        <div className="fd-card" style={{ padding: 18, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <window.FDDonut
            segments={byType.map(([t, v]) => ({ value: v, color: FM_TYPE_COLOR_HEX[t] }))}
            size={130} stroke={18}
            centerLabel={byType.length}
            centerSub={byType.length === 1 ? "class" : "classes"}
          />
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="fd-label" style={{ marginBottom: 12 }}>Allocation</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {byType.map(([t, v]) => (
                <div key={t}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 4 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fd-ink-2)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: FM_TYPE_COLOR_HEX[t], boxShadow: `0 0 6px ${FM_TYPE_COLOR_HEX[t]}` }} />
                      {t}
                    </span>
                    <span className="mono">{window.fdINR(v)} · {Math.round((v / totals.current) * 100)}%</span>
                  </div>
                  <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${(v / totals.current) * 100}%`, height: "100%", background: FM_TYPE_COLOR_HEX[t], borderRadius: 999, boxShadow: `0 0 8px ${FM_TYPE_COLOR_HEX[t]}` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Asset list */}
      <div className="fd-card" style={{ overflow: "hidden" }}>
        {assets.map((a, i) => {
          const val = a.quantity * a.currentPrice;
          const pnl = (a.currentPrice - a.buyPrice) * a.quantity;
          const owner = fd.users.find(u => u.uid === a.userId);
          return (
            <div key={a.assetId} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "13px 16px",
              borderTop: i > 0 ? "1px solid var(--fd-line)" : "none", flexWrap: "wrap",
            }}>
              <span className="fd-chip" style={{ background: FM_TYPE_COLOR[a.type] + "1A", color: FM_TYPE_COLOR[a.type], minWidth: 86, justifyContent: "center" }}>{a.type}</span>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{a.assetName}</div>
                <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600 }}>
                  {a.quantity} × {window.fdINR(a.currentPrice, 2)}{isParent && owner ? ` · ${owner.name}` : ""}
                </div>
              </div>
              <window.Sparkline data={window.fdTrend(a.buyPrice, a.currentPrice, 12, a.assetId)} color={pnl >= 0 ? "#4ADE80" : "#F87171"} width={64} height={22} />
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontWeight: 700 }}>{window.fdINR(val)}</div>
                <div className="mono" style={{ fontSize: 11, fontWeight: 600, color: pnl >= 0 ? "var(--fd-green)" : "var(--fd-red)" }}>
                  {pnl >= 0 ? "▲ +" : "▼ −"}{window.fdINR(pnl)}
                </div>
              </div>
              <button className="fd-btn fd-btn-ghost fd-btn-danger" style={{ height: 28, padding: "0 8px" }} onClick={() => fd.deleteAsset(a.assetId)} title="Remove"><window.Icons.X size={13} /></button>
            </div>
          );
        })}
        {assets.length === 0 && <div style={{ padding: 32, textAlign: "center", color: "var(--fd-ink-3)", fontSize: 13 }}>No assets yet — add your first one.</div>}
      </div>
      </>}

      {modal && <AssetForm onCancel={() => setModal(false)} onSave={(a) => { fd.addAsset({ ...a, userId: fd.user.uid }); setModal(false); }} />}
    </div>
  );
}

// ---------- Expenses & EMI ----------
function fmEMI(P, annualRate, months) {
  const r = annualRate / 100 / 12;
  if (!P || !r || !months) return 0;
  return P * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
}

function ExpenseForm({ onSave, onCancel }) {
  const [tab, setTab] = useStateFM("expense");
  const [f, setF] = useStateFM({ title: "", amount: "", category: "Food", dueDate: new Date().toISOString().slice(0, 10), principal: "", rate: "", tenureMonths: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const emiCalc = fmEMI(+f.principal, +f.rate, +f.tenureMonths);
  const ok = tab === "expense" ? (f.title.trim() && +f.amount > 0) : (f.title.trim() && emiCalc > 0);
  return (
    <div className="fd-overlay" onClick={onCancel}>
      <div className="fd-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[["expense", "Expense"], ["emi", "Loan / EMI"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className="fd-btn" style={tab === id ? { background: "var(--fd-teal)", borderColor: "var(--fd-teal)", color: "#fff" } : {}}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><div className="fd-label" style={{ marginBottom: 6 }}>{tab === "emi" ? "Loan name" : "Title"}</div>
            <input className="fd-input" autoFocus value={f.title} onChange={set("title")} placeholder={tab === "emi" ? "e.g. Bike loan" : "e.g. Weekly groceries"} /></div>
          {tab === "expense" ? (
            <>
              <div className="fd-grid-2" style={{ gap: 10 }}>
                <div><div className="fd-label" style={{ marginBottom: 6 }}>Amount ₹</div>
                  <input className="fd-input" type="number" value={f.amount} onChange={set("amount")} placeholder="1200" /></div>
                <div><div className="fd-label" style={{ marginBottom: 6 }}>Category</div>
                  <select className="fd-input" value={f.category} onChange={set("category")}>{FM_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              </div>
              <div><div className="fd-label" style={{ marginBottom: 6 }}>Date</div>
                <input className="fd-input" type="date" value={f.dueDate} onChange={set("dueDate")} /></div>
            </>
          ) : (
            <>
              <div className="fd-grid-3" style={{ gap: 10 }}>
                <div><div className="fd-label" style={{ marginBottom: 6 }}>Principal ₹</div>
                  <input className="fd-input" type="number" value={f.principal} onChange={set("principal")} placeholder="500000" /></div>
                <div><div className="fd-label" style={{ marginBottom: 6 }}>Rate % p.a.</div>
                  <input className="fd-input" type="number" step="0.05" value={f.rate} onChange={set("rate")} placeholder="9.5" /></div>
                <div><div className="fd-label" style={{ marginBottom: 6 }}>Months</div>
                  <input className="fd-input" type="number" value={f.tenureMonths} onChange={set("tenureMonths")} placeholder="60" /></div>
              </div>
              <div><div className="fd-label" style={{ marginBottom: 6 }}>First due date</div>
                <input className="fd-input" type="date" value={f.dueDate} onChange={set("dueDate")} /></div>
              <div style={{ background: "var(--fd-teal-soft)", borderRadius: 12, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--fd-teal)" }}>Calculated EMI</span>
                <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: "var(--fd-teal)" }}>{emiCalc ? window.fdINR(emiCalc) : "—"}/mo</span>
              </div>
            </>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
            <button className="fd-btn fd-btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="fd-btn fd-btn-primary" disabled={!ok} style={{ opacity: ok ? 1 : 0.5 }} onClick={() => {
              if (!ok) return;
              if (tab === "expense") onSave({ title: f.title.trim(), amount: +f.amount, type: "expense", category: f.category, dueDate: f.dueDate, isPaid: false });
              else onSave({ title: f.title.trim(), amount: Math.round(emiCalc), type: "emi", category: "Housing", dueDate: f.dueDate, isPaid: false, principal: +f.principal, rate: +f.rate, tenureMonths: +f.tenureMonths });
            }}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FamilyExpenses() {
  const fd = window.useFD();
  const [modal, setModal] = useStateFM(false);
  const isParent = fd.user.role === "parent";
  const items = isParent ? fd.db.expenses.filter(e => fd.familyUids.includes(e.userId)) : fd.db.expenses.filter(e => e.userId === fd.user.uid);
  const expenses = items.filter(e => e.type === "expense");
  const emis = items.filter(e => e.type === "emi");
  const monthSpend = expenses.reduce((s, e) => s + e.amount, 0);
  const emiTotal = emis.reduce((s, e) => s + e.amount, 0);
  const unpaid = items.filter(e => !e.isPaid);

  const byCat = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const catList = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const catColors = ["var(--fd-teal)", "var(--fd-coral)", "var(--fd-purple)", "var(--fd-gold)", "var(--fd-green)", "var(--fd-ink-3)"];

  return (
    <div className="fd-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Expense & EMI Tracker</h1>
          <div style={{ fontSize: 13, color: "var(--fd-ink-2)" }}>{isParent ? "Family-wide · July 2026" : "Your spending · July 2026"}</div>
        </div>
        <button className="fd-btn fd-btn-primary" onClick={() => setModal(true)}><window.Icons.Plus size={14} /> Add entry</button>
      </div>

      <div className="fd-grid-3">
        <div className="fd-card" style={{ padding: 18 }}>
          <div className="fd-label">This month's expenses</div>
          <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{window.fdINR(monthSpend)}</div>
        </div>
        <div className="fd-card" style={{ padding: 18 }}>
          <div className="fd-label">Monthly EMI load</div>
          <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: "var(--fd-coral)" }}>{window.fdINR(emiTotal)}</div>
        </div>
        <div className="fd-card" style={{ padding: 18 }}>
          <div className="fd-label">Pending payments</div>
          <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 6, color: unpaid.length ? "var(--fd-gold)" : "var(--fd-green)" }}>{unpaid.length}</div>
        </div>
      </div>

      {catList.length > 0 && (
        <div className="fd-card" style={{ padding: 18 }}>
          <div className="fd-label" style={{ marginBottom: 12 }}>Spend by category</div>
          <div style={{ display: "flex", height: 12, borderRadius: 999, overflow: "hidden", gap: 2 }}>
            {catList.map(([c, v], i) => (
              <div key={c} title={`${c}: ${window.fdINR(v)}`} style={{ width: `${(v / monthSpend) * 100}%`, background: catColors[i % catColors.length], minWidth: 4 }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
            {catList.map(([c, v], i) => (
              <span key={c} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--fd-ink-2)", fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: catColors[i % catColors.length] }} />
                {c} · {window.fdINR(v)}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="fd-grid-2" style={{ alignItems: "start" }}>
        {/* EMIs */}
        <div className="fd-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--fd-line)", fontWeight: 800, fontSize: 13 }}>Active loans & EMIs</div>
          {emis.map(e => {
            const owner = fd.users.find(u => u.uid === e.userId);
            return (
              <div key={e.expenseId} style={{ padding: "13px 16px", borderBottom: "1px solid var(--fd-line)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600 }}>
                    Due {new Date(e.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    {e.rate ? ` · ${e.rate}% · ${e.tenureMonths}m` : ""}{isParent && owner ? ` · ${owner.name}` : ""}
                  </div>
                </div>
                <div className="mono" style={{ fontWeight: 700 }}>{window.fdINR(e.amount)}</div>
                <button onClick={() => fd.togglePaid(e.expenseId)} className="fd-chip" style={{
                  background: e.isPaid ? "var(--fd-green-soft)" : "var(--fd-gold-soft)",
                  color: e.isPaid ? "var(--fd-green)" : "var(--fd-gold)", cursor: "pointer", border: "none",
                }}>{e.isPaid ? "Paid ✓" : "Mark paid"}</button>
                <button className="fd-btn fd-btn-ghost fd-btn-danger" style={{ height: 26, padding: "0 6px" }} onClick={() => fd.deleteExpense(e.expenseId)}><window.Icons.X size={12} /></button>
              </div>
            );
          })}
          {emis.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--fd-ink-3)", fontSize: 13 }}>No active loans.</div>}
        </div>

        {/* Expenses */}
        <div className="fd-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--fd-line)", fontWeight: 800, fontSize: 13 }}>Recent expenses</div>
          {expenses.sort((a, b) => b.dueDate.localeCompare(a.dueDate)).map(e => {
            const owner = fd.users.find(u => u.uid === e.userId);
            return (
              <div key={e.expenseId} style={{ padding: "13px 16px", borderBottom: "1px solid var(--fd-line)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{e.title}</div>
                  <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600 }}>
                    {e.category} · {new Date(e.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{isParent && owner ? ` · ${owner.name}` : ""}
                  </div>
                </div>
                <div className="mono" style={{ fontWeight: 700 }}>{window.fdINR(e.amount)}</div>
                <button className="fd-btn fd-btn-ghost fd-btn-danger" style={{ height: 26, padding: "0 6px" }} onClick={() => fd.deleteExpense(e.expenseId)}><window.Icons.X size={12} /></button>
              </div>
            );
          })}
          {expenses.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--fd-ink-3)", fontSize: 13 }}>No expenses logged.</div>}
        </div>
      </div>

      {modal && <ExpenseForm onCancel={() => setModal(false)} onSave={(e) => { fd.addExpense({ ...e, userId: fd.user.uid }); setModal(false); }} />}
    </div>
  );
}

Object.assign(window, { FamilyPortfolio, FamilyExpenses });
