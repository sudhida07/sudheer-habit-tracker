/* global React */
// Family Dashboard — auth screen + app shell
const { useState: useStateFA, useEffect: useEffectFA } = React;

// ---------- Auth ----------
// With Firebase configured: real Google / email+password sign-in first, then
// profile selection (parents link their profile to their Firebase account;
// kids tap to enter once the device is authenticated).
// Without Firebase config: Demo mode — the original prototype flow.
function FamilyAuth({ fb }) {
  const fd = window.useFD();
  const [famId, setFamId] = useStateFA(null);
  const [pending, setPending] = useStateFA(null); // demo mode: adult awaiting password
  const [pw, setPw] = useStateFA("");
  const [err, setErr] = useStateFA(false);
  const [showSetup, setShowSetup] = useStateFA(false);
  const fam = fd.families.find(f => f.familyId === famId);
  const members = famId ? fd.allUsers.filter(u => u.familyId === famId) : [];

  const fbOn = !!fb.cfg;
  const fbEmail = fb.fbUser && fb.fbUser.email ? fb.fbUser.email.toLowerCase() : null;
  const matched = fbEmail ? fd.allUsers.find(u => (u.authEmail || "").toLowerCase() === fbEmail) : null;

  const pickDemo = (u) => {
    if (u.role === "child") { fd.signIn(u.uid); return; } // kids: tap to enter
    setPending(u); setPw(""); setErr(false);
  };
  const submitDemoPw = () => {
    if (pw.trim().length >= 4) fd.signIn(pending.uid);
    else setErr(true);
  };

  const pickFirebase = (u) => {
    if (u.role === "child") { fd.signIn(u.uid); return; } // device already authenticated
    const linked = (u.authEmail || "").toLowerCase();
    if (!linked) { fd.updateUser(u.uid, { authEmail: fb.fbUser.email }); fd.signIn(u.uid); return; }
    if (linked === fbEmail) { fd.signIn(u.uid); return; }
    // linked to a different account — locked (handled in render)
  };

  const familyList = (onPick, label) => (
    <>
      <div className="fd-label" style={{ marginBottom: 10 }}>{label}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {fd.families.map(f => {
          const count = fd.allUsers.filter(u => u.familyId === f.familyId).length;
          return (
            <button key={f.familyId} onClick={() => onPick(f.familyId)} style={{
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
  );

  const card = () => {
    if (showSetup) return <window.FBConfigSetup fb={fb} onClose={() => setShowSetup(false)} />;

    if (fbOn && fb.status === "loading") {
      return (
        <div style={{ textAlign: "center", padding: "28px 0" }}>
          <div style={{ fontSize: 34, marginBottom: 10 }}>🔐</div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Connecting to Firebase…</div>
          <div style={{ fontSize: 12, color: "var(--fd-ink-3)", fontWeight: 600, marginTop: 4 }}>Checking your sign-in session</div>
        </div>
      );
    }

    if (fbOn && fb.status === "error") {
      return (
        <>
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 34, marginBottom: 8 }}>⚠️</div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Firebase couldn't start</div>
            <div style={{ fontSize: 12.5, color: "var(--fd-red)", fontWeight: 600, marginTop: 8 }}>{fb.error}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button className="fd-btn fd-btn-primary" style={{ justifyContent: "center", height: 40 }} onClick={() => setShowSetup(true)}>Change Firebase config</button>
            <button className="fd-btn" style={{ justifyContent: "center", height: 40 }} onClick={() => location.reload()}>Retry</button>
            <button className="fd-btn fd-btn-ghost" style={{ justifyContent: "center" }} onClick={fb.clearConfig}>Continue in demo mode</button>
          </div>
        </>
      );
    }

    if (fbOn && !fb.fbUser) {
      return (
        <>
          <window.FBLoginCard fb={fb} />
          <div style={{ fontSize: 11, color: "var(--fd-ink-3)", textAlign: "center", marginTop: 16 }}>
            Kids: ask a parent to sign in on this device first.
          </div>
        </>
      );
    }

    if (fbOn && fb.fbUser) {
      // Signed in with Firebase → pick / link a profile
      return (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
            {famId ? (
              <button className="fd-btn fd-btn-ghost" style={{ padding: "0 8px" }} onClick={() => setFamId(null)}><window.Icons.ChevronLeft size={15} /></button>
            ) : (
              <div style={{ fontSize: 24 }}>🏠</div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{famId ? fam.name : "Welcome back"}</div>
              <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 600 }}>{fb.fbUser.email}</div>
            </div>
            <button className="fd-btn fd-btn-ghost" style={{ fontSize: 11.5 }} onClick={fb.fbSignOut}>Switch account</button>
          </div>

          {!famId && matched && (
            <button className="fd-btn fd-btn-primary" style={{ width: "100%", justifyContent: "center", height: 44, marginBottom: 14 }}
              onClick={() => fd.signIn(matched.uid)}>
              Continue as {matched.name}
            </button>
          )}

          {!famId ? (
            familyList(setFamId, matched ? "Or open another profile" : "Choose your family")
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {members.map(u => {
                const linked = (u.authEmail || "").toLowerCase();
                const lockedByOther = u.role === "parent" && !!linked && linked !== fbEmail;
                const sub = u.role === "child" ? "tap to enter"
                  : linked === fbEmail ? "your profile"
                  : lockedByOther ? "linked to " + u.authEmail
                  : "tap to link with " + fb.fbUser.email;
                return (
                  <button key={u.uid} disabled={lockedByOther} onClick={() => pickFirebase(u)} style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", borderRadius: 12,
                    border: "1px solid var(--fd-line)", background: "var(--fd-surface)",
                    transition: "all 130ms var(--fd-ease)", width: "100%", textAlign: "left",
                    opacity: lockedByOther ? 0.45 : 1, cursor: lockedByOther ? "not-allowed" : "pointer",
                  }}
                    onMouseEnter={e => { if (!lockedByOther) { e.currentTarget.style.borderColor = u.color; e.currentTarget.style.background = u.color + "0D"; } }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--fd-line)"; e.currentTarget.style.background = "var(--fd-surface)"; }}>
                    <window.FDAvatar user={u} size={40} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}{u.age ? <span style={{ color: "var(--fd-ink-3)", fontWeight: 600 }}> · {u.age}</span> : null}</div>
                      <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 600 }}>{u.relation} · {sub}</div>
                    </div>
                    {lockedByOther ? <span style={{ fontSize: 13 }}>🔒</span> : <window.Icons.ChevronRight size={15} />}
                  </button>
                );
              })}
            </div>
          )}
        </>
      );
    }

    // ---------- Demo mode (no Firebase config) ----------
    if (!famId) {
      return (
        <>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🏠</div>
            <h1 style={{ fontSize: 22, fontWeight: 800 }}>Family Hub</h1>
            <div style={{ fontSize: 13, color: "var(--fd-ink-2)", marginTop: 4 }}>One dashboard, three households</div>
          </div>
          {familyList(setFamId, "Choose your family")}
        </>
      );
    }
    if (pending) {
      return (
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
            onKeyDown={e => e.key === "Enter" && submitDemoPw()}
            style={err ? { borderColor: "var(--fd-red)" } : {}} />
          {err && <div style={{ fontSize: 11.5, color: "var(--fd-red)", fontWeight: 600, marginTop: 6 }}>Password must be at least 4 characters.</div>}
          <button className="fd-btn fd-btn-primary" style={{ width: "100%", justifyContent: "center", height: 40, marginTop: 14 }} onClick={submitDemoPw}>Sign in</button>
        </>
      );
    }
    return (
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
            <button key={u.uid} onClick={() => pickDemo(u)} style={{
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
      </>
    );
  };

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative", zIndex: 1 }}>
      <div className="fd-card fd-in" style={{ width: 440, maxWidth: "100%", padding: 32 }}>
        {card()}
        {!showSetup && (
          <div style={{ fontSize: 11, color: "var(--fd-ink-3)", textAlign: "center", marginTop: 14 }}>
            {fbOn
              ? "Secured by Firebase Authentication"
              : <>Demo mode — no real login. <button style={{ color: "var(--fd-cyan)", fontWeight: 700 }} onClick={() => setShowSetup(true)}>Set up Firebase login</button></>}
          </div>
        )}
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
  const fb = window.useFirebaseAuth();

  // With Firebase active, a profile session is only valid while a Firebase
  // user is signed in — signing out of Firebase closes the profile too.
  useEffectFA(() => {
    if (fb.cfg && fb.status === "ready" && !fb.fbUser && fd.user) fd.signOut();
  }, [fb.cfg, fb.status, fb.fbUser, fd.user]);

  const authed = fd.user && !(fb.cfg && (fb.status !== "ready" || !fb.fbUser));

  return (
    <window.FBCtx.Provider value={fb}>
      <div className="fd-grid-bg"></div>
      <window.FDSky />
      <window.FDScene />
      <div className="fd-orbs">
        <div className="fd-orb fd-orb-1"></div>
        <div className="fd-orb fd-orb-2"></div>
        <div className="fd-orb fd-orb-3"></div>
        <div className="fd-orb fd-orb-4"></div>
      </div>
      {authed ? <FamilyShell /> : <FamilyAuth fb={fb} />}
    </window.FBCtx.Provider>
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
