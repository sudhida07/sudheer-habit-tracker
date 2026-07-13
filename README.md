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

Three households (Bhat, Rao, Shanbhag). Parents sign in with a password; kids tap to enter and land in the Kids Zone. Auth is a prototype simulating Firebase sessions.

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
