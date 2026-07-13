# Family Hub — Unified Family Dashboard

One single application that replaces the separate AI trading, habit tracker, expense/EMI, and kids-zone apps. Built from the Family Dashboard design (claude.ai/design), it runs fully in the browser with no build step.

## Modules

- **Dashboard** — family-at-a-glance: habits today, family portfolio value, next payment due, member list
- **Portfolio (AI Trading)** — US live holdings, Equity P&L, After-Tax view, Family Assets; holdings upload, manual Indian-stock entry, AI-powered growth card, wallet cash & risk-capital settings
- **Habits (HabitPro)** — Dashboard, Daily Log (time blocks), Weekly, Monthly Goals, and Vision tabs with streaks and a calendar heatmap — per family member
- **Expenses & EMI (EMI Command Center)** — Dashboard, EMI Tracker, Budget, and Summary tabs; EMI calculator, 12-month burden chart, income/expense/SIP tracking
- **Kids Zone** — games hub for child profiles, gated by screen-time limits
- **Screen Time** — parental controls: daily limits, Kids Zone toggle, bedtime lock, per-kid usage
- **Settings** — profile name/avatar management, sign out

## Families & sign-in

Three households (Bhat, Rao, Shanbhag) with real **Firebase Authentication**:

- **Google sign-in** and **email/password** (create account, sign in, password reset) via the Firebase Auth SDK
- One-time setup: Settings → Login & security → *Set up Firebase login* → paste your `firebaseConfig` from the Firebase Console (Authentication → enable Email/Password and Google providers). The config is stored per device.
- After signing in, parents link their Firebase account to their family profile (a profile linked to another account is locked). Kids don't sign in — they tap to enter once a parent has authenticated the device, and land in the Kids Zone.
- Signing out of Firebase closes the profile session too.
- **Demo mode**: with no Firebase config saved, the app falls back to the original prototype auth (tap to enter / any 4+ char password) — handy for trying it out.

## Run locally

```bash
python3 -m http.server 7777
# Open http://localhost:7777
```

## Tech stack

- React 18 (UMD) + Babel Standalone, vendored in `vendor/` — no CDN dependency, no build step
- Custom CSS (`family-styles.css`), inline SVG charts
- All data persisted in localStorage (`family-dashboard-v2*` keys)

## Legacy

The previous standalone habit tracker is kept at `habit-tracker-legacy.html` (with Firebase sync) and `habit-tracker.html`.
