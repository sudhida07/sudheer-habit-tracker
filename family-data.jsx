/* global React */
// Family Dashboard — data layer simulating the Firestore schema
// families / users / habits / portfolio / expenses collections, persisted to localStorage
const { useState: useStateFD, useEffect: useEffectFD, useContext: useContextFD, createContext: createContextFD } = React;

const FD_KEY = "family-dashboard-v2";

const FD_SEED = {
  families: [
    { familyId: "f-bhat", name: "Bhat Family Hub", emoji: "🏠", color: "#22D3EE" },
    { familyId: "f-rao", name: "Rao Family Hub", emoji: "🌿", color: "#A78BFA" },
    { familyId: "f-shanbhag", name: "Shanbhag Family", emoji: "🌞", color: "#FB7185" },
  ],
  users: [
    // Bhat family
    { uid: "u-sudheer", familyId: "f-bhat", name: "Sudheer Bhat", age: 34, relation: "Son", email: "sudheer@bhat.dev", role: "parent", avatarUrl: "", color: "#22D3EE", emoji: "👨🏻‍💻" },
    { uid: "u-sudha", familyId: "f-bhat", name: "Sudha Bhat", age: 68, relation: "Mother", email: "sudha@bhat.dev", role: "parent", avatarUrl: "", color: "#FBBF24", emoji: "👵🏻" },
    // Rao family
    { uid: "u-supriya", familyId: "f-rao", name: "Supriya Rao", age: 36, relation: "Mother", email: "supriya@rao.family", role: "parent", avatarUrl: "", color: "#A78BFA", emoji: "👩🏻" },
    { uid: "u-laxmeesha", familyId: "f-rao", name: "Laxmeesha P Rao", age: 46, relation: "Father", email: "laxmeesha@rao.family", role: "parent", avatarUrl: "", color: "#22D3EE", emoji: "👨🏻" },
    { uid: "u-vipul", familyId: "f-rao", name: "Vipul Krishna", relation: "Son · 9th Standard", email: "", role: "child", avatarUrl: "", color: "#FB7185", emoji: "🚀" },
    { uid: "u-jnanavi", familyId: "f-rao", name: "Jnanavi Rao", relation: "Daughter · 11th Science", email: "", role: "child", avatarUrl: "", color: "#FBBF24", emoji: "🔬" },
    // Shanbhag family
    { uid: "u-shiva", familyId: "f-shanbhag", name: "Shiva Prasad Shanbhag", relation: "Father", email: "shiva@shanbhag.family", role: "parent", avatarUrl: "", color: "#FB7185", emoji: "👨🏽" },
    { uid: "u-akshatha", familyId: "f-shanbhag", name: "Akshatha Shanbhag", relation: "Wife", email: "akshatha@shanbhag.family", role: "parent", avatarUrl: "", color: "#A78BFA", emoji: "👩🏽" },
    { uid: "u-vardhan", familyId: "f-shanbhag", name: "Vardhan Shanbhag", relation: "Son", email: "", role: "child", avatarUrl: "", color: "#22D3EE", emoji: "🦖" },
  ],
  habits: [
    { habitId: "h1", userId: "u-sudheer", habitName: "Morning meditation", category: "Wellness", completedDates: [] },
    { habitId: "h2", userId: "u-sudheer", habitName: "Run 5km", category: "Fitness", completedDates: [] },
    { habitId: "h3", userId: "u-sudheer", habitName: "Read 20 minutes", category: "Learning", completedDates: [] },
    { habitId: "h4", userId: "u-sudha", habitName: "Morning walk", category: "Fitness", completedDates: [] },
    { habitId: "h5", userId: "u-sudha", habitName: "BP medication", category: "Wellness", completedDates: [] },
    { habitId: "h6", userId: "u-supriya", habitName: "Yoga", category: "Wellness", completedDates: [] },
    { habitId: "h7", userId: "u-laxmeesha", habitName: "Evening cycling", category: "Fitness", completedDates: [] },
    { habitId: "h8", userId: "u-vipul", habitName: "Maths practice — 30 min", category: "Learning", completedDates: [] },
    { habitId: "h9", userId: "u-jnanavi", habitName: "Physics revision", category: "Learning", completedDates: [] },
    { habitId: "h10", userId: "u-akshatha", habitName: "Journaling", category: "Wellness", completedDates: [] },
    { habitId: "h11", userId: "u-vardhan", habitName: "Tidy room", category: "Chores", completedDates: [] },
  ],
  portfolio: [
    // Bhat
    { assetId: "a1", userId: "u-sudheer", assetName: "TCS", type: "Stock", quantity: 24, buyPrice: 3120, currentPrice: 3842 },
    { assetId: "a2", userId: "u-sudheer", assetName: "Nifty 50 Index Fund", type: "Mutual Fund", quantity: 1840, buyPrice: 142, currentPrice: 168 },
    { assetId: "a3", userId: "u-sudha", assetName: "Senior Citizen FD (as gold proxy)", type: "Gold", quantity: 1, buyPrice: 500000, currentPrice: 538000 },
    // Rao
    { assetId: "a4", userId: "u-laxmeesha", assetName: "HDFC Bank", type: "Stock", quantity: 60, buyPrice: 1490, currentPrice: 1684 },
    { assetId: "a5", userId: "u-supriya", assetName: "Sovereign Gold Bond", type: "Gold", quantity: 15, buyPrice: 5900, currentPrice: 7410 },
    { assetId: "a6", userId: "u-laxmeesha", assetName: "Parag Parikh Flexi Cap", type: "Mutual Fund", quantity: 920, buyPrice: 58, currentPrice: 81 },
    // Shanbhag
    { assetId: "a7", userId: "u-shiva", assetName: "Reliance Industries", type: "Stock", quantity: 30, buyPrice: 2380, currentPrice: 2914 },
    { assetId: "a8", userId: "u-akshatha", assetName: "Bitcoin", type: "Crypto", quantity: 0.04, buyPrice: 3400000, currentPrice: 5860000 },
  ],
  expenses: [
    // Bhat
    { expenseId: "e1", userId: "u-sudheer", title: "Home loan EMI", amount: 58420, type: "emi", category: "Housing", dueDate: "2026-08-05", isPaid: false, principal: 6800000, rate: 8.65, tenureMonths: 240 },
    { expenseId: "e2", userId: "u-sudha", title: "Pharmacy — monthly", amount: 3200, type: "expense", category: "Health", dueDate: "2026-07-10", isPaid: true },
    { expenseId: "e3", userId: "u-sudheer", title: "Electricity bill", amount: 2840, type: "expense", category: "Utilities", dueDate: "2026-07-15", isPaid: false },
    // Rao
    { expenseId: "e4", userId: "u-laxmeesha", title: "Car loan EMI", amount: 24180, type: "emi", category: "Transport", dueDate: "2026-07-12", isPaid: true, principal: 1200000, rate: 9.4, tenureMonths: 60 },
    { expenseId: "e5", userId: "u-supriya", title: "Vipul — school fees Q2", amount: 32000, type: "expense", category: "Education", dueDate: "2026-07-20", isPaid: false },
    { expenseId: "e6", userId: "u-supriya", title: "Jnanavi — PU coaching", amount: 18500, type: "expense", category: "Education", dueDate: "2026-07-18", isPaid: false },
    { expenseId: "e7", userId: "u-laxmeesha", title: "Groceries — monthly", amount: 9400, type: "expense", category: "Food", dueDate: "2026-07-06", isPaid: true },
    // Shanbhag
    { expenseId: "e8", userId: "u-shiva", title: "Home loan EMI", amount: 41200, type: "emi", category: "Housing", dueDate: "2026-08-02", isPaid: false, principal: 4200000, rate: 8.9, tenureMonths: 180 },
    { expenseId: "e9", userId: "u-akshatha", title: "Vardhan — activity classes", amount: 4500, type: "expense", category: "Education", dueDate: "2026-07-14", isPaid: true },
  ],
  screenTime: [
    { userId: "u-vipul", dailyLimitMins: 90, usedMins: 62, kidsZoneEnabled: true, bedtimeLock: "21:00" },
    { userId: "u-jnanavi", dailyLimitMins: 120, usedMins: 45, kidsZoneEnabled: true, bedtimeLock: "22:00" },
    { userId: "u-vardhan", dailyLimitMins: 60, usedMins: 58, kidsZoneEnabled: true, bedtimeLock: "20:30" },
  ],
};

function fdLoad() {
  const COLOR_REMAP = { "#22D3EE": "#22D3EE", "#A78BFA": "#A78BFA", "#FB7185": "#FB7185", "#FBBF24": "#FBBF24" };
  try {
    const raw = localStorage.getItem(FD_KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (d && d.users && d.habits && d.families) {
        if (!d.screenTime) d.screenTime = JSON.parse(JSON.stringify(FD_SEED.screenTime));
        // migrate old warm palette → neon palette
        d.users = d.users.map(u => COLOR_REMAP[u.color] ? { ...u, color: COLOR_REMAP[u.color] } : u);
        d.families = d.families.map(f => COLOR_REMAP[f.color] ? { ...f, color: COLOR_REMAP[f.color] } : f);
        return d;
      }
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(FD_SEED));
}

const FDContext = createContextFD(null);

function FDProvider({ children }) {
  const [db, setDb] = useStateFD(fdLoad);
  const [sessionUid, setSessionUid] = useStateFD(() => {
    try { return localStorage.getItem(FD_KEY + ":session") || null; } catch (e) { return null; }
  });

  useEffectFD(() => {
    try { localStorage.setItem(FD_KEY, JSON.stringify(db)); } catch (e) {}
  }, [db]);
  useEffectFD(() => {
    try {
      if (sessionUid) localStorage.setItem(FD_KEY + ":session", sessionUid);
      else localStorage.removeItem(FD_KEY + ":session");
    } catch (e) {}
  }, [sessionUid]);

  const uid = () => "id-" + Math.random().toString(36).slice(2, 9);
  const todayStr = () => new Date().toISOString().slice(0, 10);

  const user = db.users.find(u => u.uid === sessionUid) || null;
  const family = user ? db.families.find(f => f.familyId === user.familyId) : null;
  const familyUsers = user ? db.users.filter(u => u.familyId === user.familyId) : [];
  const familyUids = familyUsers.map(u => u.uid);

  const api = {
    db,
    user,
    family,
    users: familyUsers,          // members of the signed-in family
    familyUids,
    allUsers: db.users,          // everyone (auth screen)
    families: db.families,
    signIn: (u) => setSessionUid(u),
    signOut: () => setSessionUid(null),
    updateUser: (uidV, patch) => setDb(d => ({ ...d, users: d.users.map(u => u.uid === uidV ? { ...u, ...patch } : u) })),

    // habits
    addHabit: (userId, habitName, category) => setDb(d => ({ ...d, habits: [...d.habits, { habitId: uid(), userId, habitName, category, completedDates: [] }] })),
    editHabit: (habitId, patch) => setDb(d => ({ ...d, habits: d.habits.map(h => h.habitId === habitId ? { ...h, ...patch } : h) })),
    deleteHabit: (habitId) => setDb(d => ({ ...d, habits: d.habits.filter(h => h.habitId !== habitId) })),
    toggleHabitDate: (habitId, dateStr) => setDb(d => ({
      ...d,
      habits: d.habits.map(h => {
        if (h.habitId !== habitId) return h;
        const has = h.completedDates.includes(dateStr);
        return { ...h, completedDates: has ? h.completedDates.filter(x => x !== dateStr) : [...h.completedDates, dateStr] };
      })
    })),

    // portfolio
    addAsset: (a) => setDb(d => ({ ...d, portfolio: [...d.portfolio, { ...a, assetId: uid() }] })),
    deleteAsset: (assetId) => setDb(d => ({ ...d, portfolio: d.portfolio.filter(a => a.assetId !== assetId) })),

    // expenses
    addExpense: (e) => setDb(d => ({ ...d, expenses: [...d.expenses, { ...e, expenseId: uid() }] })),
    deleteExpense: (expenseId) => setDb(d => ({ ...d, expenses: d.expenses.filter(e => e.expenseId !== expenseId) })),
    togglePaid: (expenseId) => setDb(d => ({ ...d, expenses: d.expenses.map(e => e.expenseId === expenseId ? { ...e, isPaid: !e.isPaid } : e) })),

    // screen time (parental controls)
    screenTimeFor: (userId) => db.screenTime.find(s => s.userId === userId) || null,
    updateScreenTime: (userId, patch) => setDb(d => ({
      ...d,
      screenTime: d.screenTime.some(s => s.userId === userId)
        ? d.screenTime.map(s => s.userId === userId ? { ...s, ...patch } : s)
        : [...d.screenTime, { userId, dailyLimitMins: 60, usedMins: 0, kidsZoneEnabled: true, bedtimeLock: "21:00", ...patch }],
    })),

    todayStr,
  };

  return <FDContext.Provider value={api}>{children}</FDContext.Provider>;
}

function useFD() { return useContextFD(FDContext); }

const fdINR = (n, dec = 0) => "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: dec, minimumFractionDigits: 0 });

// Avatar: uploaded image or emoji fallback
function FDAvatar({ user, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, flexShrink: 0,
      background: user.avatarUrl ? `center/cover url(${user.avatarUrl})` : (user.color + "1F"),
      border: `2px solid ${user.color}`,
      boxShadow: `0 0 14px -4px ${user.color}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.48, overflow: "hidden",
    }}>
      {!user.avatarUrl && <span>{user.emoji}</span>}
    </div>
  );
}

Object.assign(window, { FDProvider, useFD, fdINR, FDAvatar, FDRing, FDDonut, fdTrend });

// ---------- Shared graphics ----------
// Progress ring
function FDRing({ pct, size = 64, stroke = 6, color = "#22D3EE", label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, pct))} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 400ms var(--fd-ease)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.22, fontWeight: 800, fontFamily: "var(--font-mono)" }}>{label != null ? label : Math.round(pct * 100) + "%"}</div>
    </div>
  );
}

// Donut chart: segments = [{ value, color }]
function FDDonut({ segments, size = 120, stroke = 16, centerLabel, centerSub }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        {segments.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * c;
          const offset = -acc * c;
          acc += frac;
          return (
            <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={s.color} strokeWidth={stroke}
              strokeDasharray={`${Math.max(0, dash - 2)} ${c - dash + 2}`} strokeDashoffset={offset}
              transform={`rotate(-90 ${size/2} ${size/2})`} strokeLinecap="butt"
              style={{ filter: `drop-shadow(0 0 4px ${s.color}66)` }} />
          );
        })}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {centerLabel && <div style={{ fontSize: size * 0.14, fontWeight: 800, fontFamily: "var(--font-mono)" }}>{centerLabel}</div>}
        {centerSub && <div style={{ fontSize: size * 0.085, color: "var(--fd-ink-3)", fontWeight: 700 }}>{centerSub}</div>}
      </div>
    </div>
  );
}

// Deterministic fake trend between two values (for sparklines)
function fdTrend(from, to, n = 12, seedStr = "") {
  let seed = 0;
  for (const ch of seedStr) seed = (seed * 31 + ch.charCodeAt(0)) % 9973;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const base = from + (to - from) * t;
    out.push(base * (1 + (rand() - 0.5) * 0.06 * (1 - t * 0.5)));
  }
  out[n - 1] = to;
  return out;
}
