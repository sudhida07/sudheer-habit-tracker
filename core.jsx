/* global React */
const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;

// ---------- Lucide-style icons (inline SVG, stroke 1.5) ----------
const Icon = ({ d, size = 16, fill = "none", stroke = "currentColor", strokeWidth = 1.5, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    {d ? <path d={d} /> : children}
  </svg>
);

const Icons = {
  TrendUp: (p) => <Icon size={p.size}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></Icon>,
  Target: (p) => <Icon size={p.size}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Icon>,
  Wallet: (p) => <Icon size={p.size}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></Icon>,
  Inbox: (p) => <Icon size={p.size}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/></Icon>,
  User: (p) => <Icon size={p.size}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></Icon>,
  Image: (p) => <Icon size={p.size}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></Icon>,
  Search: (p) => <Icon size={p.size}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></Icon>,
  Plus: (p) => <Icon size={p.size}><path d="M5 12h14M12 5v14"/></Icon>,
  Settings: (p) => <Icon size={p.size}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></Icon>,
  Sun: (p) => <Icon size={p.size}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></Icon>,
  Command: (p) => <Icon size={p.size}><path d="M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></Icon>,
  ChevronLeft: (p) => <Icon size={p.size}><path d="m15 18-6-6 6-6"/></Icon>,
  ChevronRight: (p) => <Icon size={p.size}><path d="m9 18 6-6-6-6"/></Icon>,
  ChevronDown: (p) => <Icon size={p.size}><path d="m6 9 6 6 6-6"/></Icon>,
  Check: (p) => <Icon size={p.size}><path d="M20 6 9 17l-5-5"/></Icon>,
  X: (p) => <Icon size={p.size}><path d="M18 6 6 18M6 6l12 12"/></Icon>,
  Flame: (p) => <Icon size={p.size}><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></Icon>,
  Calendar: (p) => <Icon size={p.size}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></Icon>,
  Clock: (p) => <Icon size={p.size}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></Icon>,
  Download: (p) => <Icon size={p.size}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></Icon>,
  Mail: (p) => <Icon size={p.size}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></Icon>,
  MapPin: (p) => <Icon size={p.size}><path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></Icon>,
  Github: (p) => <Icon size={p.size}><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.4 5.4 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></Icon>,
  Linkedin: (p) => <Icon size={p.size}><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></Icon>,
  Lightning: (p) => <Icon size={p.size}><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></Icon>,
  ArrowUp: (p) => <Icon size={p.size}><path d="M12 19V5M5 12l7-7 7 7"/></Icon>,
  ArrowDown: (p) => <Icon size={p.size}><path d="M12 5v14M19 12l-7 7-7-7"/></Icon>,
  Dot: (p) => <Icon size={p.size}><circle cx="12" cy="12" r="3" fill="currentColor"/></Icon>,
  More: (p) => <Icon size={p.size}><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/></Icon>,
  Sparkle: (p) => <Icon size={p.size}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></Icon>,
  Filter: (p) => <Icon size={p.size}><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></Icon>,
};

window.Icons = Icons;

// ---------- Format helpers ----------
const fmtINR = (n, opts = {}) => {
  const { compact = false, sign = false, decimals = 0 } = opts;
  if (compact && Math.abs(n) >= 100000) {
    if (Math.abs(n) >= 10000000) return (sign && n > 0 ? "+" : "") + "₹" + (n / 10000000).toFixed(2) + " Cr";
    return (sign && n > 0 ? "+" : "") + "₹" + (n / 100000).toFixed(2) + " L";
  }
  const s = Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (n < 0 ? "−" : (sign && n > 0 ? "+" : "")) + "₹" + s;
};

const fmtUSD = (n, opts = {}) => {
  const { sign = false, decimals = 2 } = opts;
  const s = Math.abs(n).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return (n < 0 ? "−" : (sign && n > 0 ? "+" : "")) + "$" + s;
};

const fmtPct = (n, decimals = 2) => (n >= 0 ? "+" : "−") + Math.abs(n).toFixed(decimals) + "%";

window.fmtINR = fmtINR; window.fmtUSD = fmtUSD; window.fmtPct = fmtPct;

// ---------- CountUp (only on first mount) ----------
function CountUp({ value, format = (v) => v.toFixed(0), duration = 900, className }) {
  const [n, setN] = useState(0);
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) {
      setN(value);
      return;
    }
    startedRef.current = true;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setN(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <span className={className}>{format(n)}</span>;
}
window.CountUp = CountUp;

// ---------- Sparkline ----------
function Sparkline({ data, color = "#7DF9FF", width = 80, height = 24 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <polyline fill="none" stroke={color} strokeWidth="1.25" points={points} />
    </svg>
  );
}
window.Sparkline = Sparkline;

// ---------- Live IST clock ----------
function ISTClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  // Convert to IST regardless of system locale
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const dateFmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    weekday: "short", day: "2-digit", month: "short",
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--text-secondary)" }}>
      <span>{dateFmt.format(now)}</span>
      <span style={{ color: "var(--border)" }}>│</span>
      <span className="mono" style={{ color: "var(--text-primary)" }}>{fmt.format(now)} IST</span>
    </div>
  );
}
window.ISTClock = ISTClock;
