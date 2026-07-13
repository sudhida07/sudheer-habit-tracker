/* global React */
// Family Dashboard — Overview, Kids Zone, Profile Settings
const { useState: useStateFO, useRef: useRefFO } = React;

// Read HabitPro store for a user (today's counts); falls back to old fd.db.habits
function fdHabitCounts(uid, fallbackHabits, today) {
  try {
    // clean up stale v1 habitpro store (app-written seed, superseded)
    localStorage.removeItem("family-dashboard-v2:habitpro:" + uid);
  } catch (e) {}
  try {
    const raw = localStorage.getItem("family-dashboard-v2:habitpro2:" + uid);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && Array.isArray(d.habits)) {
        return { total: d.habits.length, done: d.habits.filter(h => h.done && h.done[today]).length };
      }
    }
  } catch (e) {}
  const mine = fallbackHabits.filter(h => h.userId === uid);
  return { total: mine.length, done: mine.filter(h => h.completedDates && h.completedDates.includes(today)).length };
}

// ---------- Overview ----------
function FamilyOverview({ go }) {
  const fd = window.useFD();
  const isParent = fd.user.role === "parent";
  const today = fd.todayStr();

  const hc = fdHabitCounts(fd.user.uid, fd.db.habits, today);
  const myHabitsTotal = hc.total;
  const doneToday = hc.done;

  const assets = isParent ? fd.db.portfolio.filter(a => fd.familyUids.includes(a.userId)) : [];
  const pValue = assets.reduce((s, a) => s + a.quantity * a.currentPrice, 0);
  const pPnl = assets.reduce((s, a) => s + a.quantity * (a.currentPrice - a.buyPrice), 0);

  const items = isParent ? fd.db.expenses.filter(e => fd.familyUids.includes(e.userId)) : [];
  const unpaid = items.filter(e => !e.isPaid);
  const nextDue = [...unpaid].sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="fd-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>{greeting}, {fd.user.name} 👋</h1>
        <div style={{ fontSize: 13, color: "var(--fd-ink-2)" }}>
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · here's your family at a glance
        </div>
      </div>

      <div className="fd-grid-3">
        <button className="fd-card" onClick={() => go("habits")} style={{ padding: 18, textAlign: "left", cursor: "pointer", display: "flex", gap: 14, alignItems: "center" }}>
          <window.FDRing pct={myHabitsTotal ? doneToday / myHabitsTotal : 0} size={62} stroke={6} color="#22D3EE" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="fd-label">🎯 Habits today</div>
              <window.Icons.ChevronRight size={14} />
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{doneToday}<span style={{ color: "var(--fd-ink-3)", fontSize: 15 }}> / {myHabitsTotal}</span></div>
          </div>
        </button>

        {isParent ? (
          <button className="fd-card" onClick={() => go("portfolio")} style={{ padding: 18, textAlign: "left", cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="fd-label">📈 Family portfolio</div>
              <window.Icons.ChevronRight size={14} />
            </div>
            <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{window.fdINR(pValue)}</div>
            <div className="mono" style={{ fontSize: 12, fontWeight: 700, color: pPnl >= 0 ? "var(--fd-green)" : "var(--fd-red)", marginTop: 4 }}>
              {pPnl >= 0 ? "▲ +" : "▼ −"}{window.fdINR(pPnl)} all-time
            </div>
            <div style={{ marginTop: 8 }}>
              <window.Sparkline data={window.fdTrend(pValue - pPnl, pValue, 16, "pf" + fd.family.familyId)} color={pPnl >= 0 ? "#4ADE80" : "#F87171"} width={180} height={28} />
            </div>
          </button>
        ) : (
          <button className="fd-card" onClick={() => go("kids")} style={{ padding: 18, textAlign: "left", cursor: "pointer" }}>
            <div className="fd-label">🎮 Kids Zone</div>
            <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6 }}>3 games</div>
            <div style={{ fontSize: 12, color: "var(--fd-ink-2)", marginTop: 4, fontWeight: 600 }}>Ready to play!</div>
          </button>
        )}

        {isParent ? (
          <button className="fd-card" onClick={() => go("expenses")} style={{ padding: 18, textAlign: "left", cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="fd-label">💰 Next payment</div>
              <window.Icons.ChevronRight size={14} />
            </div>
            {nextDue ? (
              <>
                <div className="mono" style={{ fontSize: 26, fontWeight: 700, marginTop: 6 }}>{window.fdINR(nextDue.amount)}</div>
                <div style={{ fontSize: 12, color: "var(--fd-gold)", fontWeight: 700, marginTop: 4 }}>
                  {nextDue.title} · {new Date(nextDue.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 10, color: "var(--fd-green)" }}>All caught up ✓</div>
            )}
          </button>
        ) : (
          <div className="fd-card" style={{ padding: 18 }}>
            <div className="fd-label">⏳ Screen time left</div>
            {(() => {
              const st = fd.screenTimeFor(fd.user.uid);
              const left = st ? Math.max(0, st.dailyLimitMins - st.usedMins) : null;
              return (
                <>
                  <div style={{ fontSize: 26, fontWeight: 800, marginTop: 6, color: left !== null && left <= 15 ? "var(--fd-red)" : "var(--fd-ink)" }}>
                    {left !== null ? `${left} min` : "—"}
                  </div>
                  {st && (
                    <div style={{ height: 6, background: "var(--fd-line)", borderRadius: 999, marginTop: 10, overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(100, (st.usedMins / st.dailyLimitMins) * 100)}%`, height: "100%", background: left <= 15 ? "var(--fd-red)" : "var(--fd-gold)", borderRadius: 999 }} />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Family members */}
      <div className="fd-card" style={{ padding: 18 }}>
        <div className="fd-label" style={{ marginBottom: 14 }}>Family</div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {fd.users.map(u => {
            const uc = fdHabitCounts(u.uid, fd.db.habits, today);
            return (
              <div key={u.uid} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <window.FDAvatar user={u} size={40} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{u.name}</div>
                  <div style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600 }}>
                    {u.relation || (u.role === "parent" ? "Parent" : "Child")}{uc.total ? ` · ${uc.done}/${uc.total} habits` : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- Kids Zone ----------
const KIDS_GAMES = [
  { id: "memory", title: "Memory Match", emoji: "🃏", desc: "Flip cards, find the pairs!", color: "var(--fd-coral)", soft: "var(--fd-coral-soft)", level: "Ages 4+" },
  { id: "math", title: "Math Quiz", emoji: "🧮", desc: "Quick-fire sums & stars", color: "var(--fd-purple)", soft: "var(--fd-purple-soft)", level: "Ages 7+" },
  { id: "ttt", title: "Tic-Tac-Toe", emoji: "⭕", desc: "Beat the robot — 3 in a row", color: "var(--fd-teal)", soft: "var(--fd-teal-soft)", level: "Ages 5+" },
];
const FDK_HEX = { memory: "#FB7185", math: "#A78BFA", ttt: "#22D3EE" };

function FamilyKids() {
  const fd = window.useFD();
  const [launched, setLaunched] = useStateFO(null);
  const lock = window.fdKidsZoneLock(fd);
  const st = fd.user.role === "child" ? fd.screenTimeFor(fd.user.uid) : null;

  if (lock) {
    return (
      <div className="fd-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Kids Zone 🎮</h1>
        <div className="fd-card" style={{ padding: 48, textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>{lock.reason === "bedtime" ? "🌙" : lock.reason === "limit" ? "⏳" : "🔒"}</div>
          <div style={{ fontSize: 18, fontWeight: 800 }}>{lock.msg}</div>
          <div style={{ fontSize: 13, color: "var(--fd-ink-2)", marginTop: 8 }}>Ask a parent if you think this is a mistake.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fd-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>Kids Zone 🎮</h1>
          <div style={{ fontSize: 13, color: "var(--fd-ink-2)" }}>Pick a game and have fun!</div>
        </div>
        {st && (
          <div className="fd-card" style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>⏳</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--fd-ink-3)" }}>Time left today</div>
              <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: (st.dailyLimitMins - st.usedMins) <= 15 ? "var(--fd-red)" : "var(--fd-teal)" }}>
                {Math.max(0, st.dailyLimitMins - st.usedMins)} min
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="fd-grid-3">
        {KIDS_GAMES.map(g => (
          <div key={g.id} className="fd-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start", position: "relative", overflow: "hidden" }}>
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ position: "absolute", top: -30, right: -30, opacity: 0.35, pointerEvents: "none" }}>
              <circle cx="70" cy="70" r="56" fill="none" stroke={FDK_HEX[g.id]} strokeWidth="1.5" strokeDasharray="5 7" />
              <circle cx="70" cy="70" r="36" fill="none" stroke={FDK_HEX[g.id]} strokeWidth="1" opacity="0.6" />
              <circle cx="70" cy="14" r="4" fill={FDK_HEX[g.id]} />
            </svg>
            <div style={{
              width: 64, height: 64, borderRadius: 18, background: g.soft,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32,
              boxShadow: `0 0 24px -6px ${FDK_HEX[g.id]}`,
            }}>{g.emoji}</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{g.title}</div>
              <div style={{ fontSize: 12.5, color: "var(--fd-ink-2)", marginTop: 2 }}>{g.desc}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", marginTop: "auto" }}>
              <span className="fd-chip" style={{ background: g.soft, color: g.color }}>{g.level}</span>
              <button className="fd-btn" style={{ background: g.color, borderColor: g.color, color: "#fff" }}
                onClick={() => setLaunched(g)}>Launch Game ▸</button>
            </div>
          </div>
        ))}
      </div>

      {launched && (
        <div className="fd-overlay" onClick={() => setLaunched(null)}>
          <div className="fd-modal" onClick={e => e.stopPropagation()} style={{ textAlign: "center", padding: 36 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{launched.emoji}</div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{launched.title}</div>
            <div style={{ fontSize: 13, color: "var(--fd-ink-2)", margin: "8px 0 20px" }}>Game coming soon — this is where {launched.title} will load.</div>
            <button className="fd-btn fd-btn-primary" onClick={() => setLaunched(null)}>Back to Kids Zone</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Profile Settings ----------
function FamilyProfile() {
  const fd = window.useFD();
  const fileRef = useRefFO(null);
  const [name, setName] = useStateFO(fd.user.name);
  const [saved, setSaved] = useStateFO(false);

  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Downscale to 128px to keep storage small (simulates Firebase Storage upload)
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const s = 128;
        c.width = s; c.height = s;
        const ctx = c.getContext("2d");
        const m = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
        fd.updateUser(fd.user.uid, { avatarUrl: c.toDataURL("image/jpeg", 0.8) });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fd-in" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 560 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Profile Settings</h1>
        <div style={{ fontSize: 13, color: "var(--fd-ink-2)" }}>Manage your account & avatar</div>
      </div>

      <div className="fd-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <window.FDAvatar user={fd.user} size={72} />
          <div>
            <button className="fd-btn" onClick={() => fileRef.current && fileRef.current.click()}>
              <window.Icons.Image size={14} /> Upload photo
            </button>
            {fd.user.avatarUrl && (
              <button className="fd-btn fd-btn-ghost fd-btn-danger" style={{ marginLeft: 8 }} onClick={() => fd.updateUser(fd.user.uid, { avatarUrl: "" })}>Remove</button>
            )}
            <div style={{ fontSize: 11, color: "var(--fd-ink-3)", marginTop: 6 }}>JPG or PNG · stored to your profile</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onFile} />
          </div>
        </div>

        <div>
          <div className="fd-label" style={{ marginBottom: 6 }}>Display name</div>
          <input className="fd-input" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div>
          <div className="fd-label" style={{ marginBottom: 6 }}>Email</div>
          <input className="fd-input" value={fd.user.email || "—"} disabled style={{ opacity: 0.6 }} />
        </div>

        <div>
          <div className="fd-label" style={{ marginBottom: 6 }}>Role</div>
          <span className="fd-chip" style={{
            background: fd.user.role === "parent" ? "var(--fd-teal-soft)" : "var(--fd-gold-soft)",
            color: fd.user.role === "parent" ? "var(--fd-teal)" : "var(--fd-gold)",
          }}>{fd.user.role === "parent" ? "Parent — full access" : "Child — Kids Zone only"}</span>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button className="fd-btn fd-btn-primary" onClick={() => { fd.updateUser(fd.user.uid, { name: name.trim() || fd.user.name }); setSaved(true); setTimeout(() => setSaved(false), 1800); }}>Save changes</button>
          {saved && <span style={{ fontSize: 12, color: "var(--fd-green)", fontWeight: 700 }}>Saved ✓</span>}
        </div>
      </div>

      <button className="fd-btn" style={{ alignSelf: "flex-start" }} onClick={fd.signOut}>Sign out</button>
    </div>
  );
}

Object.assign(window, { FamilyOverview, FamilyKids, FamilyProfile });
