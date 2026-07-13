/* global React */
// Family Dashboard — animated background scene layer
// Time-aware sky (sun/moon) + spinning globe + stylized "daily life" vignettes
const { useState: useStateSC, useEffect: useEffectSC } = React;

// ---------- Time-aware sky ----------
// Sun path: 6:00 rises left, 12:00 zenith, 18:00 sets right. Night: moon on same path.
function fdSkyState(now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes();
  const DAY_START = 6 * 60, DAY_END = 18 * 60;
  const isDay = mins >= DAY_START && mins < DAY_END;
  let frac; // 0 = rise, 1 = set
  if (isDay) frac = (mins - DAY_START) / (DAY_END - DAY_START);
  else frac = ((mins - DAY_END + 1440) % 1440) / 720; // moon 18:00 → 6:00
  const elev = Math.sin(Math.PI * Math.min(1, Math.max(0, frac))); // 0..1
  let phase;
  if (!isDay) phase = "night";
  else if (frac < 0.15) phase = "dawn";
  else if (frac > 0.85) phase = "dusk";
  else phase = "day";
  return { isDay, frac, elev, phase };
}

function FDSky() {
  const [sky, setSky] = useStateSC(() => fdSkyState());
  useEffectSC(() => {
    const id = setInterval(() => setSky(fdSkyState()), 60000);
    return () => clearInterval(id);
  }, []);

  const { isDay, frac, elev, phase } = sky;
  const leftPct = 12 + frac * 76;                 // travel across the sky
  const bottomVh = 14 + elev * 50;                // arc height — capped so it stays clear of the header zone
  // sun goes warm at horizon, bright at zenith
  const warm = 1 - Math.min(1, elev * 2);         // 1 near horizon
  const sunCore = isDay ? `radial-gradient(circle at 50% 40%, #FDF6D8 0%, ${warm > 0.5 ? "#FBBF24" : "#FDE68A"} 45%, rgba(251, ${Math.round(146 + (1 - warm) * 60)}, 60, 0.9) 75%, rgba(251, 113, 133, ${0.2 + warm * 0.3}) 100%)`
    : "radial-gradient(circle at 42% 38%, #F8FAFF 0%, #DCE4F5 50%, #AAB6D4 100%)";
  const glow = isDay
    ? `0 0 40px rgba(251, 191, 36, ${0.4 + elev * 0.4}), 0 0 110px rgba(251, 146, 60, ${0.25 + elev * 0.25}), 0 0 220px rgba(251, 191, 36, 0.2)`
    : "0 0 30px rgba(200, 215, 255, 0.5), 0 0 90px rgba(160, 185, 255, 0.3)";
  const horizonTint = phase === "night" ? "99, 102, 241" : phase === "day" ? "34, 211, 238" : "251, 191, 36";

  return (
    <div className={`fd-sky fd-sky-${phase}`} aria-hidden="true">
      {/* stars — bright at night, faded by day */}
      <div className="fd-stars" style={{ opacity: isDay ? 0.15 : 1, transition: "opacity 2s" }}></div>
      {/* celestial body */}
      <div className="fd-sun-js" style={{
        left: `${leftPct}%`, bottom: `${bottomVh}vh`,
        width: isDay ? 110 : 84, height: isDay ? 110 : 84,
        background: sunCore, boxShadow: glow,
      }}>
        {isDay && <div className="fd-sun-stripes"></div>}
        {!isDay && <>
          <div className="fd-moon-crater" style={{ top: "26%", left: "22%", width: 13, height: 13 }}></div>
          <div className="fd-moon-crater" style={{ top: "56%", left: "52%", width: 9, height: 9 }}></div>
          <div className="fd-moon-crater" style={{ top: "38%", left: "64%", width: 6, height: 6 }}></div>
        </>}
      </div>
      {/* rays follow the sun */}
      {isDay && <div className="fd-sun-rays" style={{ left: `${leftPct}%`, bottom: `${bottomVh - 9}vh` }}></div>}
      {/* drifting clouds by day */}
      {isDay && <>
        <div className="fd-cloud fd-cloud-1"></div>
        <div className="fd-cloud fd-cloud-2"></div>
      </>}
      {/* horizon arc, tinted by phase */}
      <div className="fd-horizon" style={{
        borderTopColor: `rgba(${horizonTint}, 0.35)`,
        boxShadow: `0 -2px 40px rgba(${horizonTint}, 0.22), 0 -20px 120px rgba(${horizonTint}, 0.15)`,
        background: `radial-gradient(ellipse at 50% 0%, rgba(${horizonTint}, 0.10), transparent 65%)`,
      }}></div>
    </div>
  );
}

function FDGlobe({ size = 340 }) {
  const c = size / 2, r = size / 2 - 4;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <defs>
        <radialGradient id="fd-globe-fill" cx="35%" cy="30%">
          <stop offset="0%" stopColor="rgba(34,211,238,0.10)" />
          <stop offset="100%" stopColor="rgba(99,102,241,0.03)" />
        </radialGradient>
      </defs>
      <circle cx={c} cy={c} r={r} fill="url(#fd-globe-fill)" stroke="rgba(34,211,238,0.5)" strokeWidth="1.2" />
      {/* latitude lines */}
      {[-0.62, -0.32, 0, 0.32, 0.62].map((t, i) => (
        <ellipse key={"lat" + i} cx={c} cy={c + t * r} rx={Math.sqrt(1 - t * t) * r} ry={Math.sqrt(1 - t * t) * r * 0.22}
          fill="none" stroke="rgba(34,211,238,0.28)" strokeWidth="0.8" />
      ))}
      {/* spinning meridians */}
      {[0, 1, 2, 3].map(i => (
        <ellipse key={"mer" + i} cx={c} cy={c} ry={r} rx={r}
          fill="none" stroke="rgba(167,139,250,0.35)" strokeWidth="0.8">
          <animate attributeName="rx" values={`${r};2;${r}`} dur="9s" begin={`${-i * 2.25}s`} repeatCount="indefinite" />
        </ellipse>
      ))}
      {/* orbiting satellite */}
      <g>
        <circle cx={c} cy={c - r - 12} r="3.5" fill="#22D3EE" style={{ filter: "drop-shadow(0 0 6px #22D3EE)" }} />
        <animateTransform attributeName="transform" type="rotate" from={`0 ${c} ${c}`} to={`360 ${c} ${c}`} dur="16s" repeatCount="indefinite" />
      </g>
      {/* orbit ring */}
      <ellipse cx={c} cy={c} rx={r + 26} ry={(r + 26) * 0.38} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" strokeDasharray="3 6" transform={`rotate(-18 ${c} ${c})`} />
    </svg>
  );
}

// Minimal neon line-figure vignettes
function FDVignette({ kind, color = "#22D3EE" }) {
  const stroke = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (kind === "meditate") return (
    <svg width="120" height="110" viewBox="0 0 120 110">
      <g className="fd-breathe" style={{ transformOrigin: "60px 70px" }}>
        <circle cx="60" cy="30" r="10" {...stroke} />
        {/* body */}
        <path d="M60 42 L60 66" {...stroke} />
        {/* folded legs */}
        <path d="M32 84 Q60 66 88 84 Q60 96 32 84 Z" {...stroke} />
        {/* arms resting on knees */}
        <path d="M60 50 Q42 60 36 78" {...stroke} />
        <path d="M60 50 Q78 60 84 78" {...stroke} />
      </g>
      {/* aura rings */}
      <circle cx="60" cy="62" r="44" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" className="fd-aura" style={{ transformOrigin: "60px 62px" }} />
      <circle cx="60" cy="62" r="54" fill="none" stroke={color} strokeWidth="0.6" opacity="0.25" className="fd-aura fd-aura-2" style={{ transformOrigin: "60px 62px" }} />
    </svg>
  );
  if (kind === "office") return (
    <svg width="140" height="110" viewBox="0 0 140 110">
      {/* desk */}
      <path d="M20 84 L120 84 M30 84 L30 102 M110 84 L110 102" {...stroke} opacity="0.8" />
      {/* monitor */}
      <rect x="76" y="48" width="34" height="24" rx="3" {...stroke} />
      <path d="M93 72 L93 80 M85 80 L101 80" {...stroke} />
      {/* screen glow blink */}
      <rect x="80" y="52" width="26" height="16" rx="2" fill={color} opacity="0.25" className="fd-blink" />
      {/* person */}
      <g className="fd-typing" style={{ transformOrigin: "48px 70px" }}>
        <circle cx="46" cy="38" r="9" {...stroke} />
        <path d="M46 47 L46 72 M46 54 Q60 58 72 62" {...stroke} />
      </g>
      {/* chair */}
      <path d="M34 60 L34 92 M28 92 L46 92 M46 72 L46 92" {...stroke} opacity="0.8" />
    </svg>
  );
  if (kind === "trading") return (
    <svg width="170" height="120" viewBox="0 0 170 120">
      {/* desk */}
      <path d="M14 92 L156 92 M24 92 L24 110 M146 92 L146 110" {...stroke} opacity="0.8" />
      {/* dual monitors */}
      <rect x="66" y="38" width="42" height="30" rx="3" {...stroke} />
      <rect x="114" y="44" width="34" height="24" rx="3" {...stroke} />
      <path d="M87 68 L87 88 M77 88 L97 88 M131 68 L131 88 M123 88 L139 88" {...stroke} opacity="0.8" />
      {/* candlesticks on main screen */}
      <g className="fd-blink">
        <path d="M73 60 L73 48 M71 51 L75 51 L75 57 L71 57 Z" stroke="#4ADE80" strokeWidth="1.6" fill="none" />
        <path d="M81 62 L81 44 M79 48 L83 48 L83 56 L79 56 Z" stroke="#F87171" strokeWidth="1.6" fill="none" />
        <path d="M89 58 L89 42 M87 45 L91 45 L91 53 L87 53 Z" stroke="#4ADE80" strokeWidth="1.6" fill="none" />
        <path d="M97 56 L97 41 M95 43 L99 43 L99 50 L95 50 Z" stroke="#4ADE80" strokeWidth="1.6" fill="none" />
      </g>
      {/* rising trend line on second screen */}
      <path d="M118 64 L126 58 L132 61 L142 50" stroke="#4ADE80" strokeWidth="1.6" fill="none" className="fd-trendline" strokeDasharray="40" />
      {/* trader */}
      <g className="fd-typing" style={{ transformOrigin: "40px 76px" }}>
        <circle cx="38" cy="42" r="9" {...stroke} />
        <path d="M38 51 L38 80 M38 58 Q52 62 64 68" {...stroke} />
        {/* raised fist — profit! */}
        <path d="M38 58 Q28 48 30 36" {...stroke} />
        <circle cx="30" cy="33" r="3" {...stroke} />
      </g>
      {/* chair */}
      <path d="M26 64 L26 100 M20 100 L38 100 M38 80 L38 100" {...stroke} opacity="0.8" />
      {/* floating ticker chips */}
      <g className="fd-blink" style={{ animationDelay: "0.6s" }}>
        <rect x="56" y="18" width="26" height="11" rx="5.5" {...stroke} opacity="0.6" />
        <text x="69" y="26.5" textAnchor="middle" fontSize="7" fill="#4ADE80" fontFamily="monospace">+2.4%</text>
      </g>
      <g className="fd-blink" style={{ animationDelay: "1.4s" }}>
        <rect x="96" y="12" width="26" height="11" rx="5.5" {...stroke} opacity="0.6" />
        <text x="109" y="20.5" textAnchor="middle" fontSize="7" fill="#22D3EE" fontFamily="monospace">NIFTY</text>
      </g>
    </svg>
  );
  if (kind === "home") return (
    <svg width="130" height="110" viewBox="0 0 130 110">
      {/* house outline */}
      <path d="M20 56 L65 22 L110 56 M30 52 L30 96 L100 96 L100 52" {...stroke} opacity="0.7" />
      {/* person sweeping */}
      <g className="fd-sweep" style={{ transformOrigin: "62px 66px" }}>
        <circle cx="58" cy="52" r="8" {...stroke} />
        <path d="M58 60 L58 80 M58 80 L50 94 M58 80 L66 94" {...stroke} />
        <path d="M58 66 L76 76" {...stroke} />
        {/* broom */}
        <path d="M76 76 L84 90 M80 88 L90 92 M79 91 L87 96" {...stroke} />
      </g>
      {/* dust sparkles */}
      <circle cx="94" cy="92" r="1.6" fill={color} className="fd-blink" />
      <circle cx="88" cy="98" r="1.2" fill={color} className="fd-blink" style={{ animationDelay: "0.7s" }} />
    </svg>
  );
  if (kind === "prayer") return (
    <svg width="210" height="150" viewBox="0 0 210 150">
      {/* hut */}
      <g opacity="0.9">
        {/* thatched roof */}
        <path d="M18 74 L70 34 L122 74" {...stroke} />
        <path d="M26 68 L70 40 M114 68 L70 40" {...stroke} opacity="0.5" />
        <path d="M12 76 L70 30 L128 76" {...stroke} opacity="0.4" />
        {/* walls + door */}
        <path d="M26 74 L26 122 L114 122 L114 74" {...stroke} />
        <path d="M58 122 L58 92 Q70 84 82 92 L82 122" {...stroke} />
        {/* window with warm light */}
        <rect x="34" y="86" width="14" height="14" rx="2" {...stroke} />
        <rect x="36" y="88" width="10" height="10" rx="1" fill="#FBBF24" opacity="0.35" className="fd-blink" />
      </g>
      {/* tulsi vrindavan pot */}
      <g>
        <path d="M142 122 L146 98 L166 98 L170 122 Z" {...stroke} />
        <path d="M148 98 L148 92 L164 92 L164 98" {...stroke} />
        {/* tulsi plant */}
        <g className="fd-tulsi" style={{ transformOrigin: "156px 92px" }}>
          <path d="M156 92 L156 70" {...stroke} />
          <path d="M156 84 Q148 80 146 72 M156 84 Q164 80 166 72 M156 76 Q150 72 150 66 M156 76 Q162 72 162 66" {...stroke} />
          <circle cx="146" cy="70" r="2" fill={color} opacity="0.8" />
          <circle cx="166" cy="70" r="2" fill={color} opacity="0.8" />
          <circle cx="156" cy="66" r="2.4" fill={color} opacity="0.9" />
        </g>
        {/* diya flame at pot base */}
        <path d="M152 96 Q156 88 160 96" stroke="#FBBF24" strokeWidth="1.6" fill="none" className="fd-blink" />
      </g>
      {/* praying figure — namaste, gentle bow */}
      <g className="fd-pray" style={{ transformOrigin: "192px 122px" }}>
        <circle cx="192" cy="74" r="9" {...stroke} />
        {/* body kneeling */}
        <path d="M192 83 L192 106 L182 122 M192 106 L200 122" {...stroke} />
        {/* namaste hands */}
        <path d="M192 90 L178 96 M192 90 L178 100 M178 96 L174 98 L178 100" {...stroke} />
      </g>
      {/* ground */}
      <path d="M8 122 L204 122" {...stroke} opacity="0.4" strokeDasharray="5 7" />
    </svg>
  );
  // kids playing — bouncing ball
  return (
    <svg width="150" height="110" viewBox="0 0 150 110">
      {/* kid 1 */}
      <g className="fd-hop" style={{ transformOrigin: "36px 92px" }}>
        <circle cx="36" cy="46" r="8" {...stroke} />
        <path d="M36 54 L36 76 M36 60 L22 52 M36 60 L50 66 M36 76 L28 94 M36 76 L44 94" {...stroke} />
      </g>
      {/* kid 2 */}
      <g className="fd-hop fd-hop-2" style={{ transformOrigin: "112px 92px" }}>
        <circle cx="112" cy="50" r="8" {...stroke} />
        <path d="M112 58 L112 78 M112 64 L98 70 M112 64 L126 54 M112 78 L104 96 M112 78 L120 96" {...stroke} />
      </g>
      {/* bouncing ball */}
      <circle cx="74" cy="70" r="6" fill="none" stroke={color} strokeWidth="2" className="fd-bounce" style={{ transformOrigin: "74px 96px", filter: `drop-shadow(0 0 5px ${color})` }} />
      {/* ground */}
      <path d="M16 98 L134 98" {...stroke} opacity="0.4" strokeDasharray="4 6" />
    </svg>
  );
}

function FDScene() {
  return (
    <div className="fd-scene" aria-hidden="true">
      <div className="fd-scene-globe"><FDGlobe /></div>
      <div className="fd-scene-item fd-scene-meditate"><FDVignette kind="meditate" color="#A78BFA" /></div>
      <div className="fd-scene-item fd-scene-office"><FDVignette kind="office" color="#22D3EE" /></div>
      <div className="fd-scene-item fd-scene-trading"><FDVignette kind="trading" color="#22D3EE" /></div>
      <div className="fd-scene-item fd-scene-home"><FDVignette kind="home" color="#FBBF24" /></div>
      <div className="fd-scene-item fd-scene-prayer"><FDVignette kind="prayer" color="#4ADE80" /></div>
      <div className="fd-scene-item fd-scene-kids"><FDVignette kind="kids" color="#FB7185" /></div>
    </div>
  );
}

Object.assign(window, { FDScene, FDSky });
