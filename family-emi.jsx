/* global React */
// EMI Command Center — Dashboard / EMI Tracker / Budget / Summary
// Recreated from the user's EMI Command Center screenshots. Per-family, CRUD, persisted.
const { useState: useStateEM, useMemo: useMemoEM } = React;

const EM_CATS = [
  { id: "creditcard", name: "Credit Card", emoji: "💳", color: "#6366F1" },
  { id: "personal", name: "Personal Loan", emoji: "🏦", color: "#14B8A6" },
  { id: "housing", name: "Housing", emoji: "🏠", color: "#22C55E" },
  { id: "scapia", name: "Scapia", emoji: "🛍️", color: "#EC4899" },
];
const EM_GOLD = "#FBBF24";

const EM_SEED = {
  income: [
    { id: "i1", name: "Sample: Salary", type: "Salary", amount: 150000 },
    { id: "i2", name: "Sample: Side income", type: "Other", amount: 10000 },
  ],
  emis: [
    { id: "e1", name: "Sample: Phone EMI", cat: "creditcard", monthly: 3500, paid: 6, total: 12, note: "Card **** 1234" },
    { id: "e2", name: "Sample: Laptop EMI", cat: "creditcard", monthly: 8200, paid: 4, total: 9, note: "Card **** 1234" },
    { id: "e3", name: "Sample: Home loan", cat: "housing", monthly: 42000, paid: 24, total: 240, note: "Bank home loan" },
    { id: "e4", name: "Sample: Personal loan", cat: "personal", monthly: 11500, paid: 18, total: 36, note: "Bank" },
    { id: "e5", name: "Sample: Travel EMI", cat: "scapia", monthly: 4200, paid: 2, total: 6, note: "Scapia card" },
  ].map(e => ({ ...e, closed: false })),
  expenses: [
    { id: "x1", name: "Sample: Groceries", amount: 12000 },
    { id: "x2", name: "Sample: Utilities", amount: 4500 },
    { id: "x3", name: "Sample: Transport", amount: 3800 },
  ],
  sips: [
    { id: "s1", name: "Sample: Index fund SIP", tag: "index · since 2024", amount: 5000 },
    { id: "s2", name: "Sample: Flexi cap SIP", tag: "hybrid · since 2025", amount: 4000 },
  ],
};

function emStore(familyId) {
  const KEY = "family-dashboard-v2:emi:" + familyId;
  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!data || !data.emis) {
    data = JSON.parse(JSON.stringify(EM_SEED));
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }
  const save = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} };
  return { data, save };
}

const emINR = (n) => "₹" + Math.abs(Math.round(n)).toLocaleString("en-IN");
const emUid = () => "em-" + Math.random().toString(36).slice(2, 9);

function emEndLabel(e) {
  const remaining = e.total - e.paid;
  const d = new Date();
  d.setMonth(d.getMonth() + remaining);
  return d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
}

// ---------- EMI form ----------
function EMForm({ initial, onSave, onCancel, onDelete }) {
  const [f, setF] = useStateEM(initial || { name: "", cat: "creditcard", monthly: "", paid: 0, total: "", note: "" });
  const ok = f.name.trim() && +f.monthly > 0 && +f.total > 0 && +f.paid >= 0 && +f.paid <= +f.total;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  return (
    <div className="fd-overlay" onClick={onCancel}>
      <div className="fd-modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>{initial ? "Edit EMI" : "Add EMI"}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><div className="fd-label" style={{ marginBottom: 6 }}>Name</div>
            <input className="fd-input" autoFocus value={f.name} onChange={set("name")} placeholder="e.g. Fridge EMI" /></div>
          <div><div className="fd-label" style={{ marginBottom: 6 }}>Category</div>
            <select className="fd-input" value={f.cat} onChange={set("cat")}>
              {EM_CATS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select></div>
          <div className="fd-grid-3" style={{ gap: 10 }}>
            <div><div className="fd-label" style={{ marginBottom: 6 }}>₹ / month</div>
              <input className="fd-input" type="number" value={f.monthly} onChange={set("monthly")} placeholder="3500" /></div>
            <div><div className="fd-label" style={{ marginBottom: 6 }}>Paid</div>
              <input className="fd-input" type="number" value={f.paid} onChange={set("paid")} placeholder="3" /></div>
            <div><div className="fd-label" style={{ marginBottom: 6 }}>Total</div>
              <input className="fd-input" type="number" value={f.total} onChange={set("total")} placeholder="12" /></div>
          </div>
          <div><div className="fd-label" style={{ marginBottom: 6 }}>Note (card / bank)</div>
            <input className="fd-input" value={f.note} onChange={set("note")} placeholder="Card **** 2924" /></div>
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginTop: 6 }}>
            {onDelete ? <button className="fd-btn fd-btn-danger" onClick={onDelete}>Delete</button> : <span />}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="fd-btn fd-btn-ghost" onClick={onCancel}>Cancel</button>
              <button className="fd-btn" disabled={!ok} style={{ opacity: ok ? 1 : 0.5, background: EM_GOLD, borderColor: EM_GOLD, color: "#06070D" }}
                onClick={() => ok && onSave({ ...f, monthly: +f.monthly, paid: +f.paid, total: +f.total })}>Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- simple name+amount form ----------
function EMQuickForm({ title, extraLabel, onSave, onCancel }) {
  const [name, setName] = useStateEM("");
  const [amount, setAmount] = useStateEM("");
  const [extra, setExtra] = useStateEM("");
  const ok = name.trim() && +amount > 0;
  return (
    <div className="fd-overlay" onClick={onCancel}>
      <div className="fd-modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>{title}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><div className="fd-label" style={{ marginBottom: 6 }}>Name</div>
            <input className="fd-input" autoFocus value={name} onChange={e => setName(e.target.value)} /></div>
          <div><div className="fd-label" style={{ marginBottom: 6 }}>Amount ₹ / month</div>
            <input className="fd-input" type="number" value={amount} onChange={e => setAmount(e.target.value)} /></div>
          {extraLabel && <div><div className="fd-label" style={{ marginBottom: 6 }}>{extraLabel}</div>
            <input className="fd-input" value={extra} onChange={e => setExtra(e.target.value)} placeholder="optional" /></div>}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
            <button className="fd-btn fd-btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="fd-btn" disabled={!ok} style={{ opacity: ok ? 1 : 0.5, background: EM_GOLD, borderColor: EM_GOLD, color: "#06070D" }}
              onClick={() => ok && onSave({ name: name.trim(), amount: +amount, extra: extra.trim() })}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- stacked 12-month burden chart ----------
function EMBurdenChart({ emis }) {
  const months = useMemoEM(() => {
    const out = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const stacks = EM_CATS.map(c => ({
        color: c.color,
        v: emis.filter(e => !e.closed && e.cat === c.id && (e.total - e.paid) > i).reduce((s, e) => s + e.monthly, 0),
      }));
      out.push({ label: d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" }).replace(" ", " "), stacks });
    }
    return out;
  }, [emis]);
  const max = Math.max(1, ...months.map(m => m.stacks.reduce((s, x) => s + x.v, 0)));
  const H = 180, W = 640, bw = W / 12 - 14;
  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H + 30}`} style={{ width: "100%", minWidth: 480, display: "block" }}>
        {[0.25, 0.5, 0.75, 1].map(t => (
          <line key={t} x1="0" x2={W} y1={H - t * H} y2={H - t * H} stroke="rgba(255,255,255,0.05)" strokeDasharray="2 5" />
        ))}
        {months.map((m, i) => {
          let y = H;
          const x = i * (W / 12) + 7;
          return (
            <g key={i}>
              {m.stacks.map((s, j) => {
                const h = (s.v / max) * (H - 10);
                y -= h;
                return h > 0 ? <rect key={j} x={x} y={y} width={bw} height={h} fill={s.color} rx="2" opacity="0.9" /> : null;
              })}
              <text x={x + bw / 2} y={H + 16} textAnchor="middle" fontSize="9" fill="var(--fd-ink-3)" fontFamily="var(--font-mono)">{m.label}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 6 }}>
        {EM_CATS.map(c => (
          <span key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "var(--fd-ink-2)" }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: c.color }} /> {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}

// Inline expense quick-add row
function EMInlineExpenseAdd({ onAdd }) {
  const [name, setName] = useStateEM("");
  const [amount, setAmount] = useStateEM("");
  const ok = name.trim() && +amount > 0;
  const add = () => { if (!ok) return; onAdd(name.trim(), +amount); setName(""); setAmount(""); };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 100px auto", gap: 8, marginTop: 10 }}>
      <input className="fd-input" placeholder="Expense name (e.g. Groceries)" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
      <input className="fd-input" type="number" placeholder="₹ / mo" value={amount} onChange={e => setAmount(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
      <button className="fd-btn" disabled={!ok} style={{ opacity: ok ? 1 : 0.5, background: EM_GOLD, borderColor: EM_GOLD, color: "#06070D" }} onClick={add}>+ Add</button>
    </div>
  );
}

// ---------- Main ----------
function EMICommand() {
  const fd = window.useFD();
  const [rev, setRev] = useStateEM(0);
  const { data, save } = emStore(fd.family.familyId);
  const [tab, setTab] = useStateEM("dashboard");
  const [filter, setFilter] = useStateEM("all");
  const [showClosed, setShowClosed] = useStateEM(false);
  const [modal, setModal] = useStateEM(null); // {kind, item?}
  const mutate = (fn) => { fn(data); save(data); setRev(r => r + 1); };

  const active = data.emis.filter(e => !e.closed);
  const emiTotal = active.reduce((s, e) => s + e.monthly, 0);
  const expTotal = data.expenses.reduce((s, e) => s + e.amount, 0);
  const sipTotal = data.sips.reduce((s, e) => s + e.amount, 0);
  const outflow = emiTotal + expTotal + sipTotal;
  const income = data.income.reduce((s, i) => s + i.amount, 0);
  const commitPct = income ? Math.round((outflow / income) * 100) : 0;
  const deficit = income - outflow;

  const catTotal = (cid) => active.filter(e => e.cat === cid).reduce((s, e) => s + e.monthly, 0);

  const tabs = [["dashboard", "📊 Dashboard"], ["tracker", "📋 EMI Tracker"], ["budget", "💼 Budget"], ["summary", "🗓️ Summary"]];

  return (
    <div className="fd-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 26 }}>💰</div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800 }}>EMI Command Center</h1>
            <div style={{ fontSize: 12, color: "var(--fd-ink-2)", fontWeight: 600 }}>{fd.user.name.split(" ")[0]} · {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} <span style={{ color: "var(--fd-green)" }}>●</span></div>
          </div>
        </div>
        <button className="fd-btn" style={{ background: EM_GOLD, borderColor: EM_GOLD, color: "#06070D" }} onClick={() => setModal({ kind: "emi" })}>🧮 Future EMI</button>
      </div>
      {/* tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--fd-line)" }}>
        {tabs.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "9px 16px", fontSize: 13, fontWeight: 700,
            color: tab === id ? EM_GOLD : "var(--fd-ink-3)",
            borderBottom: `2px solid ${tab === id ? EM_GOLD : "transparent"}`,
            marginBottom: -1,
          }}>{label}</button>
        ))}
      </div>

      {/* ===== DASHBOARD ===== */}
      {tab === "dashboard" && (
        <>
          <div className="fd-card" style={{ padding: 24, display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div className="fd-label">Total monthly outflow</div>
              <div className="mono" style={{ fontSize: 44, fontWeight: 800, color: EM_GOLD, lineHeight: 1.1, margin: "8px 0", textShadow: "0 0 30px rgba(251,191,36,0.4)" }}>{emINR(outflow)}</div>
              <div style={{ display: "flex", gap: 16, fontSize: 12.5, fontWeight: 600, color: "var(--fd-ink-2)", flexWrap: "wrap" }}>
                <span>EMIs <b className="mono" style={{ color: "var(--fd-ink)" }}>{emINR(emiTotal)}</b></span>
                <span>Expenses <b className="mono" style={{ color: "var(--fd-ink)" }}>{emINR(expTotal)}</b></span>
                <span>SIP/Invest <b className="mono" style={{ color: "var(--fd-ink)" }}>{emINR(sipTotal)}</b></span>
              </div>
            </div>
            <div style={{ minWidth: 220, alignSelf: "center" }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, textAlign: "right" }}>Income: <b className="mono" style={{ color: EM_GOLD }}>{emINR(income)}</b></div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 999, margin: "8px 0 6px", overflow: "hidden" }}>
                <div style={{ width: Math.min(100, commitPct) + "%", height: "100%", background: `linear-gradient(90deg, ${EM_GOLD}, ${commitPct > 100 ? "#F87171" : EM_GOLD})`, borderRadius: 999 }} />
              </div>
              <div style={{ fontSize: 11.5, color: commitPct > 100 ? "var(--fd-red)" : "var(--fd-ink-3)", fontWeight: 700, textAlign: "right" }}>{commitPct}% of income committed</div>
            </div>
          </div>

          {/* category cards */}
          <div className="fd-grid-3">
            {EM_CATS.map(c => {
              const items = active.filter(e => e.cat === c.id);
              return (
                <div key={c.id} className="fd-card" style={{ padding: 16, borderTop: `3px solid ${c.color}` }}>
                  <div style={{ fontSize: 20 }}>{c.emoji}</div>
                  <div style={{ fontSize: 12, color: "var(--fd-ink-2)", fontWeight: 600, margin: "6px 0 2px" }}>{c.name}{c.id === "personal" ? "s" : ""}</div>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 800 }}>{emINR(catTotal(c.id))}</div>
                  <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600, marginTop: 2 }}>{items.length} EMI{items.length === 1 ? "" : "s"}</div>
                </div>
              );
            })}
            <button className="fd-card" onClick={() => setTab("budget")} style={{ padding: 16, borderTop: "3px solid #F97316", textAlign: "left", cursor: "pointer" }} title="Manage expenses">
              <div style={{ fontSize: 20 }}>🧾</div>
              <div style={{ fontSize: 12, color: "var(--fd-ink-2)", fontWeight: 600, margin: "6px 0 2px" }}>Expenses</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 800 }}>{emINR(expTotal)}</div>
              <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600, marginTop: 2 }}>{data.expenses.length} items · tap to manage</div>
            </button>
            <div className="fd-card" style={{ padding: 16, borderTop: "3px solid #A78BFA" }}>
              <div style={{ fontSize: 20 }}>📈</div>
              <div style={{ fontSize: 12, color: "var(--fd-ink-2)", fontWeight: 600, margin: "6px 0 2px" }}>SIP / Invest</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: "#A78BFA" }}>{emINR(sipTotal)}</div>
              <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600, marginTop: 2 }}>{data.sips.length} SIPs</div>
            </div>
          </div>

          <div className="fd-grid-2" style={{ alignItems: "start" }}>
            {/* donut breakdown */}
            <div className="fd-card" style={{ padding: 18 }}>
              <div className="fd-label" style={{ marginBottom: 14 }}>Monthly outflow breakdown</div>
              <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
                <window.FDDonut size={150} stroke={22}
                  segments={[
                    ...EM_CATS.map(c => ({ value: catTotal(c.id), color: c.color })),
                    { value: expTotal, color: "#F97316" },
                    { value: sipTotal, color: "#A78BFA" },
                  ].filter(s => s.value > 0)}
                  centerLabel={emINR(outflow).replace("₹", "₹")} />
                <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 7 }}>
                  {[...EM_CATS.map(c => [c.name, catTotal(c.id), c.color]), ["Expenses", expTotal, "#F97316"], ["SIP / Invest", sipTotal, "#A78BFA"]].map(([n, v, col]) => (
                    <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontWeight: 600 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 999, background: col }} />
                      <span style={{ flex: 1, color: "var(--fd-ink-2)" }}>{n}</span>
                      <span className="mono">{emINR(v)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--fd-line)", paddingTop: 7, fontWeight: 800, fontSize: 13 }}>
                    <span>Total Outflow</span><span className="mono" style={{ color: EM_GOLD }}>{emINR(outflow)}</span>
                  </div>
                </div>
              </div>
            </div>
            {/* burden chart */}
            <div className="fd-card" style={{ padding: 18 }}>
              <div className="fd-label" style={{ marginBottom: 14 }}>EMI burden — next 12 months</div>
              <EMBurdenChart emis={data.emis} />
            </div>
          </div>
        </>
      )}

      {/* ===== EMI TRACKER ===== */}
      {tab === "tracker" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>EMI Tracker</div>
              <div style={{ fontSize: 12, color: "var(--fd-ink-3)", fontWeight: 600 }}>{active.length} active · {data.emis.length - active.length} closed</div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12, fontWeight: 600, color: "var(--fd-ink-2)", cursor: "pointer" }}>
                <input type="checkbox" checked={showClosed} onChange={e => setShowClosed(e.target.checked)} style={{ accentColor: EM_GOLD }} /> Show closed
              </label>
              <button className="fd-btn" style={{ background: EM_GOLD, borderColor: EM_GOLD, color: "#06070D" }} onClick={() => setModal({ kind: "emi" })}>+ Add EMI</button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[{ id: "all", name: "All", emoji: "" }, ...EM_CATS].map(c => (
              <button key={c.id} onClick={() => setFilter(c.id)} className="fd-chip" style={{
                background: filter === c.id ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.04)",
                color: filter === c.id ? EM_GOLD : "var(--fd-ink-2)",
                border: `1px solid ${filter === c.id ? "rgba(251,191,36,0.4)" : "var(--fd-line)"}`,
                cursor: "pointer", padding: "6px 14px", fontSize: 12,
              }}>{c.emoji} {c.name}</button>
            ))}
          </div>
          {EM_CATS.filter(c => filter === "all" || filter === c.id).map(c => {
            const items = data.emis.filter(e => e.cat === c.id && (showClosed || !e.closed));
            if (!items.length) return null;
            const catSum = items.filter(e => !e.closed).reduce((s, e) => s + e.monthly, 0);
            return (
              <div key={c.id} className="fd-card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--fd-line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{c.emoji} {c.name} EMI</div>
                  <div className="mono" style={{ fontWeight: 800, color: EM_GOLD }}>{emINR(catSum)}<span style={{ fontSize: 11, color: "var(--fd-ink-3)" }}>/month</span></div>
                </div>
                {items.map(e => {
                  const pct = Math.round((e.paid / e.total) * 100);
                  const remaining = e.total - e.paid;
                  const closing = !e.closed && remaining <= 3;
                  return (
                    <div key={e.id} style={{ padding: "14px 18px", borderBottom: "1px solid var(--fd-line)", opacity: e.closed ? 0.5 : 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 800, fontSize: 14 }}>{e.name}</span>
                          <span className="fd-chip" style={{ background: c.color + "22", color: c.color, fontSize: 9.5 }}>{c.name.toUpperCase()}</span>
                          {closing && <span className="fd-chip" style={{ background: "rgba(236,72,153,0.15)", color: "#EC4899", fontSize: 9.5 }}>⚡ CLOSING!</span>}
                          {e.closed && <span className="fd-chip" style={{ background: "rgba(255,255,255,0.06)", color: "var(--fd-ink-3)", fontSize: 9.5 }}>CLOSED</span>}
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div className="mono" style={{ fontWeight: 800, fontSize: 16 }}>{emINR(e.monthly)}</div>
                          <div style={{ fontSize: 10, color: "var(--fd-ink-3)", fontWeight: 600 }}>/month</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 600, margin: "4px 0 8px" }}>
                        {e.paid}/{e.total} installments · {remaining} remaining · Ends {emEndLabel(e)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.07)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ width: pct + "%", height: "100%", background: "#6366F1", borderRadius: 999 }} />
                        </div>
                        <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: "var(--fd-ink-2)" }}>{pct}%</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <span style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600 }}>{e.note}</span>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button className="fd-btn" style={{ height: 27, fontSize: 12 }} onClick={() => setModal({ kind: "emi", item: e })}>✏️ Edit</button>
                          <button className="fd-btn" style={{ height: 27, fontSize: 12, color: e.closed ? "var(--fd-ink-3)" : "var(--fd-green)" }} title={e.closed ? "Reopen" : "Mark paid this month"}
                            onClick={() => mutate(d => { const x = d.emis.find(y => y.id === e.id); if (x.closed) { x.closed = false; } else { x.paid = Math.min(x.total, x.paid + 1); if (x.paid >= x.total) x.closed = true; } })}>✓</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </>
      )}

      {/* ===== BUDGET ===== */}
      {tab === "budget" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Budget Planner</div>
            <span style={{ fontSize: 12, color: "var(--fd-ink-3)", fontWeight: 600 }}>{new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
          </div>
          <div className="fd-grid-2" style={{ alignItems: "start" }}>
            {/* income */}
            <div className="fd-card" style={{ padding: 18 }}>
              <div className="fd-label" style={{ marginBottom: 12 }}>💰 Monthly income</div>
              {data.income.map(i => (
                <div key={i.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--fd-line)", borderRadius: 10, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{i.name}</div>
                    <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600 }}>{i.type}</div>
                  </div>
                  <span className="mono" style={{ fontWeight: 800, color: EM_GOLD }}>{emINR(i.amount)}</span>
                  <button className="fd-btn fd-btn-ghost fd-btn-danger" style={{ height: 24, padding: "0 6px" }} onClick={() => mutate(d => { d.income = d.income.filter(x => x.id !== i.id); })}><window.Icons.X size={12} /></button>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, padding: "10px 2px", fontSize: 14 }}>
                <span>Total Income</span><span className="mono" style={{ color: EM_GOLD }}>{emINR(income)}</span>
              </div>
              <button className="fd-btn" style={{ width: "100%", justifyContent: "center" }} onClick={() => setModal({ kind: "income" })}>+ Add Income Source</button>
            </div>
            {/* cash flow */}
            <div className="fd-card" style={{ padding: 18 }}>
              <div className="fd-label" style={{ marginBottom: 12 }}>📊 Monthly cash flow</div>
              {[["💰 Income", income, EM_GOLD], ["💳 EMIs (fixed)", -emiTotal, "#EC4899"], ["🧾 Other Expenses", -expTotal, "#FBBF24"], ["📈 SIP / Investments", -sipTotal, "#A78BFA"]].map(([l, v, c]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "9px 2px", borderBottom: "1px solid var(--fd-line)", fontSize: 13.5, fontWeight: 600 }}>
                  <span>{l}</span><span className="mono" style={{ color: c, fontWeight: 700 }}>{v < 0 ? "−" : ""}{emINR(v)}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 2px", fontSize: 15, fontWeight: 800 }}>
                <span>{deficit < 0 ? "⚠️ Deficit" : "✅ Surplus"}</span>
                <span className="mono" style={{ color: deficit < 0 ? "var(--fd-red)" : "var(--fd-green)" }}>{deficit < 0 ? "−" : "+"}{emINR(deficit)}</span>
              </div>
              {deficit < 0 && (
                <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: 10, padding: "10px 12px", fontSize: 12, fontWeight: 600, color: "var(--fd-red)" }}>
                  ⚠️ Outflows exceed income by {emINR(-deficit)}. Review discretionary spending.
                </div>
              )}
              <div className="fd-label" style={{ margin: "16px 0 8px" }}>🧾 Other expenses</div>
              {data.expenses.map(x => (
                <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 2px", borderBottom: "1px solid var(--fd-line)", fontSize: 12.5, fontWeight: 600 }}>
                  <span style={{ flex: 1 }}>{x.name}</span>
                  <span className="mono">{emINR(x.amount)}</span>
                  <button className="fd-btn fd-btn-ghost fd-btn-danger" style={{ height: 22, padding: "0 5px" }} title="Remove expense" onClick={() => mutate(d => { d.expenses = d.expenses.filter(y => y.id !== x.id); })}><window.Icons.X size={11} /></button>
                </div>
              ))}
              {data.expenses.length === 0 && <div style={{ fontSize: 12, color: "var(--fd-ink-3)", fontWeight: 600, padding: "6px 2px" }}>No expenses — add one below.</div>}
              <EMInlineExpenseAdd onAdd={(name, amount) => mutate(d => { d.expenses.push({ id: emUid(), name, amount }); })} />
            </div>
          </div>
          {/* SIPs */}
          <div className="fd-card" style={{ padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div>
                <div className="fd-label" style={{ color: "#A78BFA" }}>📈 SIP & Investments</div>
                <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 600, marginTop: 4 }}>Shown in outflow — not counted as an expense</div>
              </div>
              <button className="fd-btn" style={{ background: EM_GOLD, borderColor: EM_GOLD, color: "#06070D" }} onClick={() => setModal({ kind: "sip" })}>+ Add SIP</button>
            </div>
            {data.sips.map(s => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--fd-line)", borderRadius: 10, marginTop: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{s.name}</div>
                  {s.tag && <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600 }}>· {s.tag}</div>}
                </div>
                <span className="mono" style={{ fontWeight: 800, color: "#A78BFA" }}>{emINR(s.amount)}/mo</span>
                <button className="fd-btn fd-btn-ghost fd-btn-danger" style={{ height: 24, padding: "0 6px" }} onClick={() => mutate(d => { d.sips = d.sips.filter(x => x.id !== s.id); })}><window.Icons.X size={12} /></button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===== SUMMARY ===== */}
      {tab === "summary" && (
        <>
          <div className="fd-grid-3">
            {[
              ["Total monthly outflow", emINR(outflow), EM_GOLD],
              ["Income committed", commitPct + "%", commitPct > 100 ? "#F87171" : "#4ADE80"],
              [deficit < 0 ? "Monthly deficit" : "Monthly surplus", emINR(Math.abs(deficit)), deficit < 0 ? "#F87171" : "#4ADE80"],
              ["Active EMIs", active.length, "#6366F1"],
              ["Total EMI debt left", emINR(active.reduce((s, e) => s + e.monthly * (e.total - e.paid), 0)), "#EC4899"],
              ["Next EMI to close", (() => { const soon = [...active].sort((a, b) => (a.total - a.paid) - (b.total - b.paid))[0]; return soon ? soon.name.replace("Sample: ", "") : "—"; })(), "#14B8A6"],
            ].map(([l, v, c]) => (
              <div key={l} className="fd-card" style={{ padding: 18, borderTop: `3px solid ${c}` }}>
                <div className="fd-label">{l}</div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 800, marginTop: 8, color: c }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="fd-card" style={{ padding: 18 }}>
            <div className="fd-label" style={{ marginBottom: 14 }}>Payoff timeline</div>
            {active.sort((a, b) => (a.total - a.paid) - (b.total - b.paid)).map(e => {
              const c = EM_CATS.find(x => x.id === e.cat);
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--fd-line)", fontSize: 13, fontWeight: 600 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: c.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{e.name}</span>
                  <span className="mono" style={{ color: "var(--fd-ink-3)", fontSize: 12 }}>{e.total - e.paid} months left</span>
                  <span className="mono" style={{ fontWeight: 700 }}>Ends {emEndLabel(e)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* modals */}
      {modal && modal.kind === "emi" && (
        <EMForm initial={modal.item || null}
          onCancel={() => setModal(null)}
          onDelete={modal.item ? () => { mutate(d => { d.emis = d.emis.filter(x => x.id !== modal.item.id); }); setModal(null); } : null}
          onSave={(f) => { mutate(d => { if (modal.item) { Object.assign(d.emis.find(x => x.id === modal.item.id), f); } else { d.emis.push({ ...f, id: emUid(), closed: false }); } }); setModal(null); }} />
      )}
      {modal && modal.kind === "income" && (
        <EMQuickForm title="Add income source" extraLabel="Type (Salary / Other)"
          onCancel={() => setModal(null)}
          onSave={(f) => { mutate(d => { d.income.push({ id: emUid(), name: f.name, type: f.extra || "Salary", amount: f.amount }); }); setModal(null); }} />
      )}
      {modal && modal.kind === "expense" && (
        <EMQuickForm title="Add expense"
          onCancel={() => setModal(null)}
          onSave={(f) => { mutate(d => { d.expenses.push({ id: emUid(), name: f.name, amount: f.amount }); }); setModal(null); }} />
      )}
      {modal && modal.kind === "sip" && (
        <EMQuickForm title="Add SIP" extraLabel="Tag (e.g. index · since 2024)"
          onCancel={() => setModal(null)}
          onSave={(f) => { mutate(d => { d.sips.push({ id: emUid(), name: f.name, tag: f.extra, amount: f.amount }); }); setModal(null); }} />
      )}
    </div>
  );
}

window.EMICommand = EMICommand;
