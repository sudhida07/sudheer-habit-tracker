/* global React */
// Family Dashboard — auth screen + app shell
const { useState: useStateFA } = React;

// ---------- Auth ----------
function FamilyAuth() {
  const fd = window.useFD();
  const [famId, setFamId] = useStateFA(null);
  const [pending, setPending] = useStateFA(null); // adult awaiting password
  const [pw, setPw] = useStateFA("");
  const [err, setErr] = useStateFA(false);
  const fam = fd.families.find(f => f.familyId === famId);
  const members = famId ? fd.allUsers.filter(u => u.familyId === famId) : [];

  const pick = (u) => {
    if (u.role === "child") { fd.signIn(u.uid); return; } // kids: tap to enter
    setPending(u); setPw(""); setErr(false);
  };
  const submitPw = () => {
    if (pw.trim().length >= 4) fd.signIn(pending.uid);
    else setErr(true);
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", zIndex: 1 }}>
      <div className="fd-card fd-in" style={{ width: 440, maxWidth: "100%", padding: 32 }}>
        {!famId ? (
          <>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🏠</div>
              <h1 style={{ fontSize: 22, fontWeight: 800 }}>Family Hub</h1>
              <div style={{ fontSize: 13, color: "var(--fd-ink-2)", marginTop: 4 }}>One dashboard, three households</div>
            </div>
            <div className="fd-label" style={{ marginBottom: 10 }}>Choose your family</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {fd.families.map(f => {
                const count = fd.allUsers.filter(u => u.familyId === f.familyId).length;
                return (
                  <button key={f.familyId} onClick={() => setFamId(f.familyId)} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 14px", borderRadius: 12,
                    border: "1px solid var(--fd-line)", background: "var(--fd-surface)",
                    transition: "all 130ms var(--fd-ease)", width: "100%", textAlign: "left",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = f.color; e.currentTarget.style.background = f.color + "0D"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--fd-line)"; e.currentTarget.style.background = "var(--fd-surface)"; }}>
                    <span style={{ fontSize: 26 }}>{f.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 14.5 }}>{f.name}</div>
                      <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 600 }}>{count} members</div>
                    </div>
                    <window.Icons.ChevronRight size={15} />
                  </button>
                );
              })}
            </div>
          </>
        ) : pending ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <button className="fd-btn fd-btn-ghost" style={{ padding: "0 8px" }} onClick={() => setPending(null)}><window.Icons.ChevronLeft size={15} /></button>
              <window.FDAvatar user={pending} size={40} />
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{pending.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 600 }}>{pending.email}</div>
              </div>
            </div>
            <div className="fd-label" style={{ marginBottom: 6 }}>Password</div>
            <input className="fd-input" type="password" autoFocus value={pw}
              placeholder="Enter your password"
              onChange={e => { setPw(e.target.value); setErr(false); }}
              onKeyDown={e => e.key === "Enter" && submitPw()}
              style={err ? { borderColor: "var(--fd-red)" } : {}} />
            {err && <div style={{ fontSize: 11.5, color: "var(--fd-red)", fontWeight: 600, marginTop: 6 }}>Password must be at least 4 characters.</div>}
            <button className="fd-btn fd-btn-primary" style={{ width: "100%", justifyContent: "center", height: 40, marginTop: 14 }} onClick={submitPw}>Sign in</button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--fd-line)" }} />
              <span style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600 }}>or</span>
              <div style={{ flex: 1, height: 1, background: "var(--fd-line)" }} />
            </div>
            <button className="fd-btn" style={{ width: "100%", justifyContent: "center", height: 40 }} onClick={() => fd.signIn(pending.uid)}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google as {pending.name.split(" ")[0]}
            </button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
              <button className="fd-btn fd-btn-ghost" style={{ padding: "0 8px" }} onClick={() => setFamId(null)}><window.Icons.ChevronLeft size={15} /></button>
              <span style={{ fontSize: 24 }}>{fam.emoji}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>{fam.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 600 }}>Who's signing in?</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {members.map(u => (
                <button key={u.uid} onClick={() => pick(u)} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 12,
                  border: "1px solid var(--fd-line)", background: "var(--fd-surface)",
                  transition: "all 130ms var(--fd-ease)", width: "100%", textAlign: "left",
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = u.color; e.currentTarget.style.background = u.color + "0D"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--fd-line)"; e.currentTarget.style.background = "var(--fd-surface)"; }}>
                  <window.FDAvatar user={u} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}{u.age ? <span style={{ color: "var(--fd-ink-3)", fontWeight: 600 }}> · {u.age}</span> : null}</div>
                    <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 600 }}>{u.relation} · {u.role === "parent" ? "password login" : "tap to enter"}</div>
                  </div>
                  <window.Icons.ChevronRight size={15} />
                </button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "var(--fd-line)" }} />
              <span style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600 }}>parents sign in with their own password · kids just tap</span>
              <div style={{ flex: 1, height: 1, background: "var(--fd-line)" }} />
            </div>
          </>
        )}
        <div style={{ fontSize: 11, color: "var(--fd-ink-3)", textAlign: "center", marginTop: 14 }}>
          Prototype — profiles simulate Firebase Auth sessions
        </div>
      </div>
    </div>
  );
}

// ---------- Shell ----------
const FA_NAV = [
  { id: "overview", label: "Dashboard", emoji: "📊", roles: ["parent", "child"] },
  { id: "portfolio", label: "Portfolio", emoji: "📈", roles: ["parent"] },
  { id: "habits", label: "Habits", emoji: "🎯", roles: ["parent", "child"] },
  { id: "expenses", label: "Expenses & EMI", emoji: "💰", roles: ["parent"] },
  { id: "kids", label: "Kids Zone", emoji: "🎮", roles: ["parent", "child"] },
  { id: "screentime", label: "Screen Time", emoji: "⏳", roles: ["parent"] },
  { id: "profile", label: "Settings", emoji: "⚙️", roles: ["parent", "child"] },
];

function FamilyShell() {
  const fd = window.useFD();
  const isChild = fd.user.role === "child";
  const [page, setPage] = useStateFA(isChild ? "kids" : "overview");

  const nav = FA_NAV.filter(n => n.roles.includes(fd.user.role));
  // guard: if current page not allowed for this role
  const allowed = nav.some(n => n.id === page) ? page : (isChild ? "kids" : "overview");

  const Page = {
    overview: () => <window.FamilyOverview go={setPage} />,
    portfolio: () => <window.FamilyPortfolio />,
    habits: () => <window.HabitPro />,
    expenses: () => <window.EMICommand />,
    kids: () => <window.FamilyKids />,
    screentime: () => <window.FamilyScreenTime />,
    profile: () => <window.FamilyProfile />,
  }[allowed];

  return (
    <div className="fd-shell">
      <aside className="fd-side">
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 10px 18px" }}>
          <div style={{ fontSize: 22 }}>{fd.family.emoji}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{fd.family.name}</div>
            <div style={{ fontSize: 10, color: "var(--fd-ink-3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{fd.users.length} members</div>
          </div>
        </div>
        {nav.map(n => (
          <button key={n.id} className={`fd-nav-item ${allowed === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
            <span style={{ fontSize: 15 }}>{n.emoji}</span> {n.label}
          </button>
        ))}
        <div style={{ marginTop: "auto", padding: "12px 6px 4px", borderTop: "1px solid var(--fd-line)", display: "flex", alignItems: "center", gap: 10 }}>
          <window.FDAvatar user={fd.user} size={34} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fd.user.name}</div>
            <div style={{ fontSize: 10.5, color: "var(--fd-ink-3)", fontWeight: 600 }}>{fd.user.relation}</div>
          </div>
          <button className="fd-btn fd-btn-ghost" style={{ height: 28, padding: "0 8px" }} onClick={fd.signOut} title="Sign out">
            <window.Icons.X size={13} />
          </button>
        </div>
      </aside>

      <main className="fd-main" data-screen-label={`Family ${allowed}`}>
        <Page />
      </main>

      {/* Mobile tab bar */}
      <nav className="fd-tabbar">
        {nav.slice(0, 5).map(n => (
          <button key={n.id} className={allowed === n.id ? "active" : ""} onClick={() => setPage(n.id)}>
            <span style={{ fontSize: 18 }}>{n.emoji}</span>
            {n.label.split(" ")[0]}
          </button>
        ))}
      </nav>
    </div>
  );
}

function FamilyApp() {
  const fd = window.useFD();
  return (
    <>
      <div className="fd-grid-bg"></div>
      <window.FDSky />
      <window.FDScene />
      <div className="fd-orbs">
        <div className="fd-orb fd-orb-1"></div>
        <div className="fd-orb fd-orb-2"></div>
        <div className="fd-orb fd-orb-3"></div>
        <div className="fd-orb fd-orb-4"></div>
      </div>
      {fd.user ? <FamilyShell /> : <FamilyAuth />}
    </>
  );
}

function FamilyRoot() {
  return (
    <window.FDProvider>
      <FamilyApp />
    </window.FDProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<FamilyRoot />);
