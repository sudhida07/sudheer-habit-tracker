/* global React */
// Habit Pro — full habit tracker (Dashboard / Daily Log / Weekly / Monthly Goals)
// Recreated from sudheer-habit-tracker.web.app screenshots. Per-user, fully CRUD.
const { useState: useStateHP, useMemo: useMemoHP } = React;

const HP_BLOCKS = [
  { id: "morning", name: "Morning Routine", emoji: "🌅", time: "6:00 – 9:00 AM", color: "#FBBF24" },
  { id: "work", name: "Productivity Hours", emoji: "💻", time: "9:00 AM – 1:00 PM", color: "#22D3EE" },
  { id: "health", name: "Health & Wellness", emoji: "🍏", time: "Any time", color: "#4ADE80" },
  { id: "focus", name: "Afternoon Focus", emoji: "⚡", time: "1:00 – 6:00 PM", color: "#A78BFA" },
  { id: "evening", name: "Evening Routine", emoji: "🌇", time: "6:00 – 9:00 PM", color: "#FB7185" },
  { id: "night", name: "Night Wind-down", emoji: "🌙", time: "9:00 – 11:00 PM", color: "#818CF8" },
];

const HP_GOAL_CATS = [
  { id: "bills", name: "Bills", emoji: "💳", color: "#FB7185" },
  { id: "maintenance", name: "Maintenance", emoji: "🔧", color: "#FBBF24" },
  { id: "health", name: "Health", emoji: "🏥", color: "#4ADE80" },
  { id: "admin", name: "Admin", emoji: "📋", color: "#22D3EE" },
  { id: "finance", name: "Finance", emoji: "📈", color: "#A78BFA" },
  { id: "review", name: "Review", emoji: "🎯", color: "#F472B6" },
];

const HP_SEED = {
  habits: [
    { id: "d1", block: "morning", emoji: "☀️", name: "Sample: Stretch for 5 minutes" },
    { id: "d2", block: "work", emoji: "🎯", name: "Sample: Plan top 3 tasks" },
    { id: "d3", block: "health", emoji: "💧", name: "Sample: Drink a glass of water" },
    { id: "d4", block: "evening", emoji: "🚶", name: "Sample: Short evening walk" },
    { id: "d5", block: "night", emoji: "📖", name: "Sample: Read a few pages" },
  ].map(h => ({ ...h, done: {} })),
  weekly: [
    { id: "w1", emoji: "🧺", name: "Sample: Tidy one room", day: "Saturday" },
    { id: "w2", emoji: "📞", name: "Sample: Call a friend or family", day: "Sunday" },
    { id: "w3", emoji: "🌿", name: "Sample: Time outdoors", day: "Any" },
  ].map(h => ({ ...h, done: {} })),
  monthly: [
    { id: "m1", cat: "bills", emoji: "🧾", name: "Sample: Pay a recurring bill", visionId: "v1" },
    { id: "m2", cat: "health", emoji: "🩺", name: "Sample: Book a check-up", visionId: "v2" },
    { id: "m3", cat: "review", emoji: "🎯", name: "Sample: Month-end review" },
  ].map(h => ({ ...h, done: {} })),
  vision: [
    { id: "v1", emoji: "🏦", name: "Sample: Financial freedom fund", horizon: "1–3 years" },
    { id: "v2", emoji: "🏃", name: "Sample: Run a half marathon", horizon: "This year" },
  ],
};

// Quick-add suggestion library (options — tap to prefill)
const HP_SUGGESTIONS = {
  daily: [
    ["🧘", "Meditation"], ["🏃", "Exercise"], ["🥣", "Healthy breakfast"], ["📔", "Journaling"],
    ["💻", "Deep work session"], ["📚", "Learning / upskilling"], ["📋", "Task planning"],
    ["💧", "Drink 2L water"], ["🚶", "Walk 8k steps"], ["🥗", "No junk food"],
    ["👨‍👩‍👧", "Family time"], ["📵", "Screen-free hour"], ["📖", "Read 20 minutes"], ["😴", "Sleep on time"],
  ],
  weekly: [
    ["🛒", "Grocery shopping"], ["🍱", "Meal planning"], ["🧹", "House cleaning"], ["👕", "Laundry"],
    ["🧴", "Skincare routine"], ["🏊", "Swimming"], ["📊", "Weekly review"], ["💰", "Budget review"], ["✂️", "Grooming"],
  ],
  monthly: [
    ["💳", "Credit card bill"], ["📡", "Internet bill"], ["🚗", "Vehicle service"], ["🧽", "Deep cleaning"],
    ["🏥", "Health check-up"], ["📋", "Document renewal"], ["📈", "SIP / investment review"], ["🎯", "Monthly retro"],
  ],
};

const hpDateStr = (d) => d.toISOString().slice(0, 10);
const hpWeekKey = (d) => { const x = new Date(d); x.setDate(x.getDate() - x.getDay()); return "wk-" + hpDateStr(x); };
const hpMonthKey = (d) => d.toISOString().slice(0, 7);
const hpUid = () => "h-" + Math.random().toString(36).slice(2, 9);

function hpStore(userId) {
  const KEY = "family-dashboard-v2:habitpro2:" + userId;
  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!data || !data.habits) {
    data = JSON.parse(JSON.stringify(HP_SEED));
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }
  if (!data.vision) data.vision = JSON.parse(JSON.stringify(HP_SEED.vision));
  const save = (d) => { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} return d; };
  return { data, save };
}

// generic emoji+name+group modal
function HPForm({ title, initial, groups, groupLabel, suggestions, link, onSave, onCancel, onDelete }) {
  const [linkVal, setLinkVal] = useStateHP(link ? (link.initial || "") : "");
  const [name, setName] = useStateHP(initial ? initial.name : "");
  const [emoji, setEmoji] = useStateHP(initial ? initial.emoji : "✨");
  const [group, setGroup] = useStateHP(initial ? initial.group : groups[0].id);
  return (
    <div className="fd-overlay" onClick={onCancel}>
      <div className="fd-modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>{title}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 10 }}>
            <div><div className="fd-label" style={{ marginBottom: 6 }}>Emoji</div>
              <input className="fd-input" value={emoji} maxLength={4} onChange={e => setEmoji(e.target.value)} style={{ textAlign: "center", fontSize: 17 }} /></div>
            <div><div className="fd-label" style={{ marginBottom: 6 }}>Name</div>
              <input className="fd-input" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Water the plants" /></div>
          </div>
          {suggestions && !initial && (
            <div>
              <div className="fd-label" style={{ marginBottom: 6 }}>Suggestions — tap to fill</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 110, overflow: "auto" }}>
                {suggestions.map(([em, nm]) => (
                  <button key={nm} onClick={() => { setEmoji(em); setName(nm); }} className="fd-chip" style={{
                    background: name === nm ? "var(--fd-teal-soft)" : "rgba(255,255,255,0.05)",
                    color: name === nm ? "var(--fd-teal)" : "var(--fd-ink-2)",
                    border: "1px solid var(--fd-line)", cursor: "pointer",
                  }}>{em} {nm}</button>
                ))}
              </div>
            </div>
          )}
          <div><div className="fd-label" style={{ marginBottom: 6 }}>{groupLabel}</div>
            <select className="fd-input" value={group} onChange={e => setGroup(e.target.value)}>
              {groups.map(g => <option key={g.id} value={g.id}>{g.emoji ? g.emoji + " " : ""}{g.name}</option>)}
            </select></div>
          {link && (
            <div><div className="fd-label" style={{ marginBottom: 6 }}>{link.label} <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></div>
              <select className="fd-input" value={linkVal} onChange={e => setLinkVal(e.target.value)}>
                <option value="">— None —</option>
                {link.options.map(v => <option key={v.id} value={v.id}>{v.emoji} {v.name}</option>)}
              </select></div>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "space-between", marginTop: 6 }}>
            {onDelete ? <button className="fd-btn fd-btn-danger" onClick={onDelete}>Delete</button> : <span />}
            <div style={{ display: "flex", gap: 8 }}>
              <button className="fd-btn fd-btn-ghost" onClick={onCancel}>Cancel</button>
              <button className="fd-btn fd-btn-primary" disabled={!name.trim()} style={{ opacity: name.trim() ? 1 : 0.5 }}
                onClick={() => name.trim() && onSave({ name: name.trim(), emoji: emoji || "✨", group, link: linkVal })}>Save</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HPCheck({ on, color = "#22D3EE", onClick, size = 22 }) {
  return (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: 7, flexShrink: 0,
      border: `1.5px solid ${on ? color : "rgba(255,255,255,0.2)"}`,
      background: on ? color : "transparent",
      boxShadow: on ? `0 0 10px ${color}88` : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#06070D", transition: "all 150ms var(--fd-ease)",
    }}>{on && <window.Icons.Check size={13} />}</button>
  );
}

function HabitPro() {
  const fd = window.useFD();
  const [rev, setRev] = useStateHP(0);
  const { data, save } = hpStore(fd.user.uid);
  const [view, setView] = useStateHP("daily");
  const [dayOffset, setDayOffset] = useStateHP(0);
  const [modal, setModal] = useStateHP(null); // {kind, item?}

  const mutate = (fn) => { fn(data); save(data); setRev(r => r + 1); };

  const date = new Date(); date.setDate(date.getDate() + dayOffset);
  const dKey = hpDateStr(date);
  const wKey = hpWeekKey(date);
  const mKey = hpMonthKey(new Date());

  const doneToday = data.habits.filter(h => h.done[dKey]).length;
  const weekDone = data.weekly.filter(h => h.done[wKey]).length;
  const monthDone = data.monthly.filter(h => h.done[mKey]).length;

  // monthly completion: avg of daily % this month
  const monthPct = useMemoHP(() => {
    const now = new Date();
    let sum = 0, days = 0;
    for (let i = 1; i <= now.getDate(); i++) {
      const k = hpDateStr(new Date(now.getFullYear(), now.getMonth(), i, 12));
      const c = data.habits.filter(h => h.done[k]).length;
      if (c > 0 || i <= now.getDate()) { sum += c / Math.max(1, data.habits.length); days++; }
    }
    return days ? Math.round((sum / days) * 100) : 0;
  }, [rev, data.habits]);

  const tabs = [
    ["dashboard", "📊 Dashboard"],
    ["daily", "📝 Daily Log"],
    ["weekly", "🗓️ Weekly Habits"],
    ["monthly", "🎯 Monthly Goals"],
    ["vision", "🏆 Vision"],
  ];

  const header = {
    dashboard: ["Dashboard", `${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })} — your habit journey at a glance`],
    daily: ["Daily Log", `Track your ${data.habits.length} habits across ${HP_BLOCKS.length} time blocks`],
    weekly: ["Weekly Habits", `${data.weekly.length} habits to keep your week on track`],
    monthly: ["Monthly Goals", `${data.monthly.length} goals to close out ${new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })} strong`],
    vision: ["Goal Tracker", "Long-term vision goals — powered by your linked monthly goals"],
  }[view];

  return (
    <div className="fd-in" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{header[0]}</h1>
          <div style={{ fontSize: 13, color: "var(--fd-ink-2)" }}>{header[1]}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.3)", border: "1px solid var(--fd-line)", borderRadius: 10, padding: 3 }}>
            {tabs.map(([id, label]) => (
              <button key={id} onClick={() => setView(id)} style={{
                padding: "5px 11px", borderRadius: 7, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap",
                background: view === id ? "var(--fd-teal-soft)" : "transparent",
                color: view === id ? "var(--fd-teal)" : "var(--fd-ink-3)",
                border: `1px solid ${view === id ? "rgba(34,211,238,0.3)" : "transparent"}`,
              }}>{label}</button>
            ))}
          </div>
          <button className="fd-btn fd-btn-primary" onClick={() => setModal({ kind: view === "weekly" ? "weekly" : view === "monthly" ? "monthly" : view === "vision" ? "vision" : "daily" })}>
            <window.Icons.Plus size={14} /> Add {view === "monthly" ? "goal" : view === "vision" ? "vision goal" : "habit"}
          </button>
        </div>
      </div>

      {/* ============ DASHBOARD ============ */}
      {view === "dashboard" && (
        <>
          <div className="fd-grid-4">
            {[
              ["Monthly Completion", monthPct + "%", `${new Date().getDate()} days tracked`, "#A78BFA"],
              ["Today's Progress", doneToday, `of ${data.habits.length} habits done`, "#4ADE80"],
              ["Weekly Habits", `${weekDone}/${data.weekly.length}`, "this week", "#FBBF24"],
              ["Monthly Goals", `${monthDone}/${data.monthly.length}`, "completed this month", "#22D3EE"],
            ].map(([l, v, s, c]) => (
              <div key={l} className="fd-card" style={{ padding: 18, borderTop: `3px solid ${c}` }}>
                <div className="fd-label">{l}</div>
                <div className="mono" style={{ fontSize: 30, fontWeight: 800, marginTop: 6, color: c }}>{v}</div>
                <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600, marginTop: 4 }}>{s}</div>
              </div>
            ))}
          </div>

          <div className="fd-grid-2" style={{ alignItems: "start" }}>
            {/* Top consistent habits */}
            <div className="fd-card" style={{ padding: 18 }}>
              <div className="fd-label" style={{ marginBottom: 12 }}>🏆 Top consistent habits</div>
              {data.habits.slice(0, 8).map(h => {
                const last30 = Object.keys(h.done).filter(k => h.done[k] && k >= hpDateStr(new Date(Date.now() - 30 * 864e5))).length;
                const pct = Math.round((last30 / 30) * 100);
                return (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--fd-line)", fontSize: 13 }}>
                    <span style={{ fontSize: 16 }}>{h.emoji}</span>
                    <span style={{ flex: 1, fontWeight: 600 }}>{h.name}</span>
                    <span className="mono" style={{ fontWeight: 700, color: pct >= 50 ? "var(--fd-green)" : "var(--fd-ink-3)" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
            {/* Calendar heatmap */}
            <div className="fd-card" style={{ padding: 18 }}>
              <div className="fd-label" style={{ marginBottom: 12 }}>📅 Calendar heatmap — {new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, fontSize: 10, textAlign: "center" }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d} className="fd-label" style={{ fontSize: 8.5, padding: "2px 0" }}>{d}</div>)}
                {(() => {
                  const now = new Date();
                  const first = new Date(now.getFullYear(), now.getMonth(), 1);
                  const daysIn = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                  const cells = [];
                  for (let i = 0; i < first.getDay(); i++) cells.push(<div key={"e" + i}></div>);
                  for (let d = 1; d <= daysIn; d++) {
                    const k = hpDateStr(new Date(now.getFullYear(), now.getMonth(), d, 12));
                    const c = data.habits.filter(h => h.done[k]).length;
                    const pct = c / Math.max(1, data.habits.length);
                    const future = d > now.getDate();
                    cells.push(
                      <div key={d} className="mono" style={{
                        padding: "8px 0", borderRadius: 6,
                        background: future ? "rgba(255,255,255,0.02)" : pct === 0 ? "rgba(255,255,255,0.04)" : `rgba(34,211,238,${0.12 + pct * 0.5})`,
                        color: pct > 0.5 ? "#06070D" : "var(--fd-ink-3)", fontWeight: 700,
                        border: d === now.getDate() ? "1px solid var(--fd-teal)" : "1px solid transparent",
                      }}>{d}</div>
                    );
                  }
                  return cells;
                })()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============ DAILY LOG ============ */}
      {view === "daily" && (
        <>
          {/* date nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <button className="fd-btn" onClick={() => setDayOffset(o => o - 1)}><window.Icons.ChevronLeft size={14} /></button>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
              <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 700 }}>{dayOffset === 0 ? "✨ Today" : dayOffset === -1 ? "Yesterday" : dayOffset < 0 ? `${-dayOffset} days ago` : "Future"}</div>
            </div>
            <button className="fd-btn" onClick={() => setDayOffset(o => o + 1)} disabled={dayOffset >= 0} style={{ opacity: dayOffset >= 0 ? 0.4 : 1 }}><window.Icons.ChevronRight size={14} /></button>
          </div>

          {/* summary */}
          <div className="fd-card" style={{ padding: 20, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
            <window.FDRing pct={doneToday / Math.max(1, data.habits.length)} size={70} stroke={7} color="#A78BFA" />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{doneToday} / {data.habits.length} Habits</div>
              <div style={{ fontSize: 12, color: "var(--fd-ink-2)", fontWeight: 600, marginTop: 2 }}>📌 Click habits to mark them done</div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {HP_BLOCKS.map(b => {
                  const items = data.habits.filter(h => h.block === b.id);
                  const done = items.filter(h => h.done[dKey]).length;
                  return (
                    <span key={b.id} className="fd-chip" style={{ background: b.color + "1F", color: b.color, border: `1px solid ${b.color}44` }}>
                      {b.emoji} {done}/{items.length}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* blocks */}
          {HP_BLOCKS.map(b => {
            const items = data.habits.filter(h => h.block === b.id);
            if (items.length === 0) return null;
            const done = items.filter(h => h.done[dKey]).length;
            return (
              <div key={b.id} className="fd-card" style={{ overflow: "hidden" }}>
                <div style={{ padding: "13px 16px", borderBottom: "1px solid var(--fd-line)", display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="nx-pulse" style={{ width: 6, height: 6, borderRadius: 999, background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{b.emoji} {b.name}</div>
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--fd-ink-3)", fontWeight: 600 }}>{b.time}</div>
                  </div>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: done === items.length ? "var(--fd-green)" : "var(--fd-ink-3)" }}>{done}/{items.length}</span>
                </div>
                {items.map(h => (
                  <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: "1px solid var(--fd-line)" }}>
                    <HPCheck on={!!h.done[dKey]} color={b.color} onClick={() => mutate(d => { const x = d.habits.find(y => y.id === h.id); x.done[dKey] = !x.done[dKey]; })} />
                    <span style={{ fontSize: 16 }}>{h.emoji}</span>
                    <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: h.done[dKey] ? "var(--fd-ink-3)" : "var(--fd-ink)", textDecoration: h.done[dKey] ? "line-through" : "none" }}>{h.name}</span>
                    <button className="fd-btn fd-btn-ghost" style={{ height: 26, padding: "0 7px" }} title="Edit"
                      onClick={() => setModal({ kind: "daily", item: h })}><window.Icons.Settings size={12} /></button>
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}

      {/* ============ WEEKLY ============ */}
      {view === "weekly" && (
        <>
          <div className="fd-card" style={{ padding: 20, display: "flex", gap: 18, alignItems: "center" }}>
            <window.FDRing pct={weekDone / Math.max(1, data.weekly.length)} size={64} stroke={6} color="#4ADE80" />
            <div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{weekDone} of {data.weekly.length} weekly habits completed</div>
              <div style={{ fontSize: 12, color: "var(--fd-ink-2)", fontWeight: 600, marginTop: 2 }}>🗓️ Check off habits as you complete them · resets every week</div>
            </div>
          </div>
          <div className="fd-grid-2">
            {data.weekly.map(h => (
              <div key={h.id} className="fd-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{h.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: 14.5, textDecoration: h.done[wKey] ? "line-through" : "none", color: h.done[wKey] ? "var(--fd-ink-3)" : "var(--fd-ink)" }}>{h.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 600 }}>🗓️ {h.day}</div>
                </div>
                <button className="fd-btn fd-btn-ghost" style={{ height: 26, padding: "0 7px" }} onClick={() => setModal({ kind: "weekly", item: h })}><window.Icons.Settings size={12} /></button>
                <HPCheck on={!!h.done[wKey]} color="#4ADE80" onClick={() => mutate(d => { const x = d.weekly.find(y => y.id === h.id); x.done[wKey] = !x.done[wKey]; })} />
              </div>
            ))}
          </div>
        </>
      )}

      {/* ============ MONTHLY GOALS ============ */}
      {view === "monthly" && (
        <>
          <div className="fd-card" style={{ padding: 20, display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
            <window.FDRing pct={monthDone / Math.max(1, data.monthly.length)} size={64} stroke={6} color="#A78BFA" />
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>{monthDone} of {data.monthly.length} goals achieved</div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                {HP_GOAL_CATS.map(c => {
                  const items = data.monthly.filter(g => g.cat === c.id);
                  if (!items.length) return null;
                  const done = items.filter(g => g.done[mKey]).length;
                  return <span key={c.id} className="fd-chip" style={{ background: c.color + "1F", color: c.color, border: `1px solid ${c.color}44` }}>{c.emoji} {c.name} {done}/{items.length}</span>;
                })}
              </div>
            </div>
          </div>
          {HP_GOAL_CATS.map(c => {
            const items = data.monthly.filter(g => g.cat === c.id);
            if (!items.length) return null;
            return (
              <div key={c.id}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span className="fd-label" style={{ color: c.color, fontSize: 11 }}>{c.emoji} {c.name.toUpperCase()}</span>
                  <div style={{ flex: 1, height: 1, background: "var(--fd-line)" }} />
                </div>
                <div className="fd-grid-2">
                  {items.map(g => (
                    <div key={g.id} className="fd-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{g.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: 14.5, textDecoration: g.done[mKey] ? "line-through" : "none", color: g.done[mKey] ? "var(--fd-ink-3)" : "var(--fd-ink)" }}>{g.name}</div>
                        {g.visionId && (() => {
                          const v = data.vision.find(x => x.id === g.visionId);
                          return v ? <button onClick={() => setView("vision")} style={{ display: "block", fontSize: 10.5, color: "var(--fd-purple)", fontWeight: 700, marginTop: 2, cursor: "pointer", textAlign: "left" }} title="Open main goal">🏆 {v.emoji} {v.name} →</button> : null;
                        })()}
                      </div>
                      <button className="fd-btn fd-btn-ghost" style={{ height: 26, padding: "0 7px" }} onClick={() => setModal({ kind: "monthly", item: g })}><window.Icons.Settings size={12} /></button>
                      <HPCheck on={!!g.done[mKey]} color={c.color} onClick={() => mutate(d => { const x = d.monthly.find(y => y.id === g.id); x.done[mKey] = !x.done[mKey]; })} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ============ VISION / GOAL TRACKER ============ */}
      {view === "vision" && (
        <>
          {data.vision.length === 0 && (
            <div className="fd-card" style={{ padding: 40, textAlign: "center", color: "var(--fd-ink-3)" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏆</div>
              <div style={{ fontWeight: 700, color: "var(--fd-ink-2)" }}>No vision goals yet</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Add a long-term goal, then link monthly goals to it.</div>
            </div>
          )}
          {data.vision.map(v => {
            const linked = data.monthly.filter(g => g.visionId === v.id);
            const doneNow = linked.filter(g => g.done[mKey]).length;
            // months of history where all linked goals were done
            const monthsDone = (() => {
              const keys = new Set();
              linked.forEach(g => Object.keys(g.done).forEach(k => { if (g.done[k]) keys.add(k); }));
              return [...keys].filter(k => linked.length && linked.every(g => g.done[k])).length;
            })();
            return (
              <div key={v.id} className="fd-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: "var(--fd-purple-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>{v.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{v.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 600 }}>🏆 {v.horizon} · {linked.length} linked monthly goal{linked.length === 1 ? "" : "s"} · {monthsDone} full month{monthsDone === 1 ? "" : "s"} completed</div>
                  </div>
                  <window.FDRing pct={linked.length ? doneNow / linked.length : 0} size={54} stroke={5} color="#A78BFA" />
                  <button className="fd-btn fd-btn-ghost" style={{ height: 26, padding: "0 7px" }} onClick={() => setModal({ kind: "vision", item: v })}><window.Icons.Settings size={12} /></button>
                </div>
                {linked.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, paddingLeft: 4 }}>
                    {linked.map(g => (
                      <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
                        <HPCheck on={!!g.done[mKey]} color="#A78BFA" size={18}
                          onClick={() => mutate(d => { const x = d.monthly.find(y => y.id === g.id); x.done[mKey] = !x.done[mKey]; })} />
                        <span>{g.emoji}</span>
                        <span style={{ fontWeight: 600, color: g.done[mKey] ? "var(--fd-ink-3)" : "var(--fd-ink)", textDecoration: g.done[mKey] ? "line-through" : "none" }}>{g.name}</span>
                        <span className="fd-chip" style={{ background: "rgba(255,255,255,0.05)", color: "var(--fd-ink-3)", marginLeft: "auto" }}>this month</span>
                        <button className="fd-chip" onClick={() => setView("monthly")} style={{ background: "var(--fd-purple-soft)", color: "var(--fd-purple)", cursor: "pointer", border: "none" }}>open →</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--fd-ink-3)", fontWeight: 600 }}>No monthly goals linked yet — edit a monthly goal and pick this vision under "Linked vision goal".</div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* CRUD modal */}
      {modal && (() => {
        const kind = modal.kind;
        const groups = kind === "daily" ? HP_BLOCKS
          : kind === "weekly" ? [{ id: "Saturday", name: "Saturday" }, { id: "Sunday", name: "Sunday" }, { id: "Any", name: "Any day" }]
          : kind === "vision" ? [{ id: "This year", name: "This year" }, { id: "1–3 years", name: "1–3 years" }, { id: "5+ years", name: "5+ years" }]
          : HP_GOAL_CATS;
        const coll = kind === "daily" ? "habits" : kind;
        const groupField = kind === "daily" ? "block" : kind === "weekly" ? "day" : kind === "vision" ? "horizon" : "cat";
        const item = modal.item;
        return (
          <HPForm
            title={item ? "Edit " + (kind === "monthly" ? "goal" : kind === "vision" ? "vision goal" : "habit") : "Add " + (kind === "monthly" ? "goal" : kind === "vision" ? "vision goal" : "habit")}
            groupLabel={kind === "daily" ? "Time block" : kind === "weekly" ? "Day" : kind === "vision" ? "Horizon" : "Category"}
            link={kind === "monthly" ? { label: "Linked vision goal", options: data.vision, initial: item ? item.visionId : "" } : null}
            groups={groups}
            suggestions={HP_SUGGESTIONS[kind]}
            initial={item ? { name: item.name, emoji: item.emoji, group: item[groupField] } : null}
            onCancel={() => setModal(null)}
            onDelete={item ? () => { mutate(d => { d[coll] = d[coll].filter(x => x.id !== item.id); }); setModal(null); } : null}
            onSave={(f) => {
              mutate(d => {
                if (item) { const x = d[coll].find(y => y.id === item.id); x.name = f.name; x.emoji = f.emoji; x[groupField] = f.group; if (kind === "monthly") x.visionId = f.link || undefined; }
                else d[coll].push({ id: hpUid(), name: f.name, emoji: f.emoji, [groupField]: f.group, done: {}, ...(kind === "monthly" && f.link ? { visionId: f.link } : {}) });
              });
              setModal(null);
            }}
          />
        );
      })()}
    </div>
  );
}

window.HabitPro = HabitPro;
