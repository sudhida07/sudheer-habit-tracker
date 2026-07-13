/* global React */
// Family Dashboard — real Firebase Authentication layer.
// Loads the Firebase compat SDK on demand, keeps the project config in
// localStorage (one-time setup per device), and exposes a hook + UI cards.
// When no config is saved the app runs in Demo mode (prototype tap/password auth).
const { useState: useStateFB, useEffect: useEffectFB, createContext: createContextFB, useContext: useContextFB } = React;

const FB_CFG_KEY = "family-dashboard-v2:fbconfig";

function fbGetConfig() {
  try { const raw = localStorage.getItem(FB_CFG_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}

// Tolerant parse: accepts raw JSON, a JS object literal, or a full
// `const firebaseConfig = { ... };` snippet pasted from the Firebase console.
function fbParseConfig(text) {
  const m = (text || "").match(/\{[\s\S]*\}/);
  if (!m) return null;
  const t = m[0]
    .replace(/\/\/[^\n]*/g, "")
    .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
    .replace(/'/g, '"')
    .replace(/,\s*\}/g, "}");
  try {
    const cfg = JSON.parse(t);
    if (cfg.apiKey && cfg.authDomain && cfg.projectId) return cfg;
  } catch (e) {}
  return null;
}

let _fbSdk = null;
function fbLoadSdk() {
  if (_fbSdk) return _fbSdk;
  const load = (src) => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = () => rej(new Error("Could not reach Firebase servers. Check your internet connection."));
    document.head.appendChild(s);
  });
  _fbSdk = load("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js")
    .then(() => load("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"));
  return _fbSdk;
}

function fbErrText(e) {
  const code = (e && e.code) || "";
  const map = {
    "auth/invalid-credential": "Wrong email or password.",
    "auth/wrong-password": "Wrong password. Try again or reset it.",
    "auth/user-not-found": "No account with this email. Create one below.",
    "auth/email-already-in-use": "An account with this email already exists — sign in instead.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/invalid-email": "That doesn't look like a valid email address.",
    "auth/too-many-requests": "Too many attempts. Wait a minute and try again.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/popup-blocked": "Your browser blocked the sign-in popup — allow popups and retry.",
    "auth/network-request-failed": "Network error — check your connection and try again.",
    "auth/operation-not-allowed": "This sign-in method is disabled. Enable it in Firebase Console → Authentication → Sign-in method.",
    "auth/unauthorized-domain": "This website's domain isn't authorised. Add it in Firebase Console → Authentication → Settings → Authorized domains.",
    "auth/invalid-api-key": "The Firebase config looks invalid. Re-paste it from your Firebase Console.",
  };
  return map[code] || (e && e.message) || "Something went wrong. Please try again.";
}

// ---------- Hook ----------
// status: "off" (demo mode, no config) | "loading" | "error" | "ready"
function useFirebaseAuth() {
  const [cfg, setCfg] = useStateFB(fbGetConfig);
  const [status, setStatus] = useStateFB(cfg ? "loading" : "off");
  const [error, setError] = useStateFB(null);
  const [fbUser, setFbUser] = useStateFB(null);

  useEffectFB(() => {
    if (!cfg) { setStatus("off"); setFbUser(null); return; }
    let unsub = null, dead = false;
    setStatus("loading"); setError(null);
    fbLoadSdk()
      .then(() => {
        if (dead) return;
        if (!firebase.apps.length) firebase.initializeApp(cfg);
        unsub = firebase.auth().onAuthStateChanged(
          (u) => { if (!dead) { setFbUser(u); setStatus("ready"); } },
          (e) => { if (!dead) { setError(fbErrText(e)); setStatus("error"); } }
        );
      })
      .catch((e) => { if (!dead) { setError(fbErrText(e)); setStatus("error"); } });
    return () => { dead = true; if (unsub) unsub(); };
  }, [cfg]);

  return {
    cfg, status, error, fbUser,
    saveConfig: (c) => {
      try { localStorage.setItem(FB_CFG_KEY, JSON.stringify(c)); } catch (e) {}
      // firebase compat can't re-init with a different config without a reload
      if (window.firebase && firebase.apps.length) { location.reload(); return; }
      setCfg(c);
    },
    clearConfig: () => {
      try { localStorage.removeItem(FB_CFG_KEY); } catch (e) {}
      if (window.firebase && firebase.apps.length) {
        firebase.auth().signOut().finally(() => location.reload());
        return;
      }
      setCfg(null); setFbUser(null);
    },
    signInEmail: (email, pw) => firebase.auth().signInWithEmailAndPassword(email, pw),
    signUpEmail: (email, pw) => firebase.auth().createUserWithEmailAndPassword(email, pw),
    signInGoogle: () => firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .catch((e) => {
        if (e && e.code === "auth/popup-blocked") return firebase.auth().signInWithRedirect(new firebase.auth.GoogleAuthProvider());
        throw e;
      }),
    resetPassword: (email) => firebase.auth().sendPasswordResetEmail(email),
    fbSignOut: () => firebase.auth().signOut(),
  };
}

const FBCtx = createContextFB(null);
function useFB() { return useContextFB(FBCtx); }

// ---------- Google "G" mark ----------
function FBGoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

// ---------- Config setup card ----------
function FBConfigSetup({ fb, onClose }) {
  const [text, setText] = useStateFB("");
  const [err, setErr] = useStateFB(false);
  const parsed = fbParseConfig(text);

  const steps = [
    ["1", "Create a Firebase project", <>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: "var(--fd-cyan)" }}>console.firebase.google.com</a> → Add project (free). Skip Analytics.</>],
    ["2", "Enable sign-in methods", <>Build → <strong>Authentication</strong> → Get started → Sign-in method → enable <strong>Email/Password</strong> and <strong>Google</strong>.</>],
    ["3", "Add a web app & copy the config", <>Project settings (⚙️) → Your apps → <strong>Add app → Web</strong> → Register. Copy the <code>firebaseConfig</code> object and paste it below.</>],
  ];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <button className="fd-btn fd-btn-ghost" style={{ padding: "0 8px" }} onClick={onClose}><window.Icons.ChevronLeft size={15} /></button>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Set up Firebase login</div>
          <div style={{ fontSize: 11.5, color: "var(--fd-ink-3)", fontWeight: 600 }}>One-time setup · ~5 minutes · free</div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {steps.map(([n, title, body]) => (
          <div key={n} style={{ display: "flex", gap: 12 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 999, flexShrink: 0, fontSize: 12, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "1px solid var(--fd-cyan)", color: "var(--fd-cyan)",
            }}>{n}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{title}</div>
              <div style={{ fontSize: 12, color: "var(--fd-ink-2)", marginTop: 2 }}>{body}</div>
            </div>
          </div>
        ))}
      </div>
      <textarea
        className="fd-input"
        style={{ minHeight: 130, fontFamily: "var(--font-mono)", fontSize: 11.5, resize: "vertical", ...(err ? { borderColor: "var(--fd-red)" } : {}) }}
        placeholder={'{\n  "apiKey": "AIza…",\n  "authDomain": "your-app.firebaseapp.com",\n  "projectId": "your-app",\n  …\n}'}
        value={text}
        onChange={(e) => { setText(e.target.value); setErr(false); }}
      />
      {err && <div style={{ fontSize: 11.5, color: "var(--fd-red)", fontWeight: 600, marginTop: 6 }}>Couldn't read that config — paste the full firebaseConfig object, including apiKey, authDomain and projectId.</div>}
      <button
        className="fd-btn fd-btn-primary"
        style={{ width: "100%", justifyContent: "center", height: 40, marginTop: 12 }}
        onClick={() => { if (parsed) fb.saveConfig(parsed); else setErr(true); }}
      >
        Connect Firebase
      </button>
    </>
  );
}

// ---------- Email / password + Google sign-in card ----------
function FBLoginCard({ fb }) {
  const [mode, setMode] = useStateFB("signin"); // signin | signup | reset
  const [email, setEmail] = useStateFB("");
  const [pw, setPw] = useStateFB("");
  const [busy, setBusy] = useStateFB(false);
  const [msg, setMsg] = useStateFB(null); // { type: "error" | "info", text }

  const run = async (fn) => {
    setBusy(true); setMsg(null);
    try { await fn(); }
    catch (e) { setMsg({ type: "error", text: fbErrText(e) }); }
    finally { setBusy(false); }
  };

  const submit = () => {
    const em = email.trim();
    if (!em) return setMsg({ type: "error", text: "Enter your email address." });
    if (mode === "reset") {
      return run(async () => {
        await fb.resetPassword(em);
        setMsg({ type: "info", text: "Password reset email sent to " + em + "." });
        setMode("signin");
      });
    }
    if (pw.length < 6) return setMsg({ type: "error", text: "Password must be at least 6 characters." });
    run(() => (mode === "signup" ? fb.signUpEmail(em, pw) : fb.signInEmail(em, pw)));
  };

  return (
    <>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ fontSize: 34, marginBottom: 8 }}>🔐</div>
        <div style={{ fontWeight: 800, fontSize: 17 }}>
          {mode === "signup" ? "Create your account" : mode === "reset" ? "Reset password" : "Sign in to Family Hub"}
        </div>
        <div style={{ fontSize: 12, color: "var(--fd-ink-3)", fontWeight: 600, marginTop: 3 }}>Secured by Firebase Authentication</div>
      </div>

      <button className="fd-btn" style={{ width: "100%", justifyContent: "center", height: 40 }} disabled={busy}
        onClick={() => run(() => fb.signInGoogle())}>
        <FBGoogleMark /> Continue with Google
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0" }}>
        <div style={{ flex: 1, height: 1, background: "var(--fd-line)" }} />
        <span style={{ fontSize: 11, color: "var(--fd-ink-3)", fontWeight: 600 }}>or use email</span>
        <div style={{ flex: 1, height: 1, background: "var(--fd-line)" }} />
      </div>

      <div className="fd-label" style={{ marginBottom: 6 }}>Email</div>
      <input className="fd-input" type="email" value={email} placeholder="you@example.com" autoComplete="email"
        onChange={(e) => { setEmail(e.target.value); setMsg(null); }}
        onKeyDown={(e) => e.key === "Enter" && submit()} />

      {mode !== "reset" && (
        <>
          <div className="fd-label" style={{ margin: "12px 0 6px" }}>Password</div>
          <input className="fd-input" type="password" value={pw} placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            onChange={(e) => { setPw(e.target.value); setMsg(null); }}
            onKeyDown={(e) => e.key === "Enter" && submit()} />
        </>
      )}

      {msg && (
        <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 8, color: msg.type === "error" ? "var(--fd-red)" : "var(--fd-cyan)" }}>
          {msg.text}
        </div>
      )}

      <button className="fd-btn fd-btn-primary" style={{ width: "100%", justifyContent: "center", height: 40, marginTop: 14, opacity: busy ? 0.6 : 1 }}
        disabled={busy} onClick={submit}>
        {busy ? "Please wait…" : mode === "signup" ? "Create account" : mode === "reset" ? "Send reset email" : "Sign in"}
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 11.5, fontWeight: 600 }}>
        {mode === "signin" ? (
          <>
            <button style={{ color: "var(--fd-cyan)" }} onClick={() => { setMode("signup"); setMsg(null); }}>Create an account</button>
            <button style={{ color: "var(--fd-ink-3)" }} onClick={() => { setMode("reset"); setMsg(null); }}>Forgot password?</button>
          </>
        ) : (
          <button style={{ color: "var(--fd-cyan)" }} onClick={() => { setMode("signin"); setMsg(null); }}>← Back to sign in</button>
        )}
      </div>
    </>
  );
}

// ---------- Settings → Account card ----------
function FBAccountCard() {
  const fb = useFB();
  const fd = window.useFD();
  const [showSetup, setShowSetup] = useStateFB(false);
  if (!fb) return null;

  return (
    <div className="fd-card" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>🔐</span>
        <div style={{ fontWeight: 800, fontSize: 15 }}>Login & security</div>
      </div>

      {showSetup ? (
        <FBConfigSetup fb={fb} onClose={() => setShowSetup(false)} />
      ) : fb.status === "off" ? (
        <>
          <div style={{ fontSize: 12.5, color: "var(--fd-ink-2)" }}>
            Running in <strong>Demo mode</strong> — anyone with this link can open any profile.
            Connect your own Firebase project to require real Google or email sign-in.
          </div>
          <button className="fd-btn fd-btn-primary" style={{ alignSelf: "flex-start" }} onClick={() => setShowSetup(true)}>
            Set up Firebase login
          </button>
        </>
      ) : fb.status === "error" ? (
        <>
          <div style={{ fontSize: 12.5, color: "var(--fd-red)", fontWeight: 600 }}>{fb.error}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="fd-btn" onClick={() => setShowSetup(true)}>Change config</button>
            <button className="fd-btn fd-btn-ghost fd-btn-danger" onClick={fb.clearConfig}>Switch to demo mode</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: "var(--fd-ink-2)" }}>
            Firebase login is <strong style={{ color: "var(--fd-green, #4ADE80)" }}>active</strong>
            {fb.fbUser ? <> — signed in as <strong>{fb.fbUser.email}</strong></> : null}.
          </div>
          {fd && fd.user && fd.user.authEmail && (
            <div style={{ fontSize: 12, color: "var(--fd-ink-3)" }}>
              This profile is linked to <strong>{fd.user.authEmail}</strong>.{" "}
              <button style={{ color: "var(--fd-cyan)", fontWeight: 700 }}
                onClick={() => fd.updateUser(fd.user.uid, { authEmail: null })}>Unlink</button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {fb.fbUser && (
              <button className="fd-btn" onClick={() => { fb.fbSignOut(); fd && fd.signOut(); }}>Sign out of Firebase</button>
            )}
            <button className="fd-btn fd-btn-ghost" onClick={() => setShowSetup(true)}>Change config</button>
            <button className="fd-btn fd-btn-ghost fd-btn-danger" onClick={fb.clearConfig}>Disconnect</button>
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { useFirebaseAuth, FBCtx, useFB, FBLoginCard, FBConfigSetup, FBAccountCard, FBGoogleMark, fbParseConfig });
