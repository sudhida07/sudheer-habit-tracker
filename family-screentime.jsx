/* global React */
// Family Dashboard — Parental Controls (screen time) + kid-side lock helpers
const { useState: useStateFS } = React;

function FamilyScreenTime() {
  const fd = window.useFD();
  const kids = fd.users.filter(u => u.role === "child");

  if (kids.length === 0) {
    return (
      <div className="fd-in">
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Screen Time</h1>
        <div className="fd-card" style={{ padding: 32, marginTop: 20, textAlign: "center", color: "var(--fd-ink-3)" }}>
          No child profiles in this family.
        </div>
      </div>
    );
  }

  return (
    <div className="fd-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>Screen Time</h1>
        <div style={{ fontSize: 13, color: "var(--fd-ink-2)" }}>Parental controls · limits apply to Kids Zone sessions</div>
      </div>

      <div className="fd-grid-2">
        {kids.map(kid => {
          const st = fd.screenTimeFor(kid.uid) || { dailyLimitMins: 60, usedMins: 0, kidsZoneEnabled: true, bedtimeLock: "21:00" };
          const pct = Math.min(1, st.usedMins / st.dailyLimitMins);
          const over = st.usedMins >= st.dailyLimitMins;
          return (
            <div key={kid.uid} className="fd-card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <window.FDAvatar user={kid} size={44} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{kid.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 600 }}>{kid.relation}</div>
                </div>
                <span className="fd-chip" style={{
                  background: over ? "var(--fd-red-soft)" : "var(--fd-green-soft)",
                  color: over ? "var(--fd-red)" : "var(--fd-green)",
                }}>{over ? "Limit reached" : "Within limit"}</span>
              </div>

              {/* Usage today */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span className="fd-label">Used today</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: over ? "var(--fd-red)" : "var(--fd-ink)" }}>
                    {st.usedMins} / {st.dailyLimitMins} min
                  </span>
                </div>
                <div style={{ height: 8, background: "var(--fd-line)", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ width: `${pct * 100}%`, height: "100%", borderRadius: 999, background: over ? "var(--fd-red)" : pct > 0.8 ? "var(--fd-gold)" : "var(--fd-teal)", transition: "width 300ms var(--fd-ease)" }} />
                </div>
              </div>

              {/* Daily limit slider */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span className="fd-label">Daily limit</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{st.dailyLimitMins} min</span>
                </div>
                <input type="range" min="15" max="240" step="15" value={st.dailyLimitMins}
                  onChange={e => fd.updateScreenTime(kid.uid, { dailyLimitMins: +e.target.value })}
                  style={{ width: "100%", accentColor: "#22D3EE" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--fd-ink-3)", fontWeight: 600 }}>
                  <span>15m</span><span>4h</span>
                </div>
              </div>

              {/* Toggles */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Kids Zone access</span>
                  <input type="checkbox" checked={st.kidsZoneEnabled}
                    onChange={e => fd.updateScreenTime(kid.uid, { kidsZoneEnabled: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: "#22D3EE", cursor: "pointer" }} />
                </label>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Bedtime lock</span>
                  <input type="time" className="fd-input" style={{ width: 110, height: 32 }} value={st.bedtimeLock}
                    onChange={e => fd.updateScreenTime(kid.uid, { bedtimeLock: e.target.value })} />
                </div>
              </div>

              <button className="fd-btn" style={{ alignSelf: "flex-start" }} onClick={() => fd.updateScreenTime(kid.uid, { usedMins: 0 })}>
                Reset today's usage
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Kid-side gate: returns lock reason or null
function fdKidsZoneLock(fd) {
  if (!fd.user || fd.user.role !== "child") return null;
  const st = fd.screenTimeFor(fd.user.uid);
  if (!st) return null;
  if (!st.kidsZoneEnabled) return { reason: "disabled", msg: "Kids Zone is switched off by your parent." };
  if (st.usedMins >= st.dailyLimitMins) return { reason: "limit", msg: "Screen time is up for today! Come back tomorrow." };
  const now = new Date();
  const [bh, bm] = (st.bedtimeLock || "21:00").split(":").map(Number);
  if (now.getHours() > bh || (now.getHours() === bh && now.getMinutes() >= bm)) return { reason: "bedtime", msg: `It's past bedtime (${st.bedtimeLock}). Sleep well! 🌙` };
  return null;
}

Object.assign(window, { FamilyScreenTime, fdKidsZoneLock });
