# Sudheer's Habit Tracker v1.0

A beautiful, fully offline personal habit tracker — no dependencies, no build step required.

## Features

- **Dashboard** — Monthly % overview, daily progress bar chart, color-coded calendar heatmap, top consistent habits
- **Daily Log** — 22 habits organized into 6 time blocks (Morning Routine, Productivity Hours, Lunch Break, Afternoon Productivity, Evening Activities, Relaxation Time)
- **Weekly Habits** — 10 recurring weekly habits with weekly navigation
- **Monthly Goals** — 12 monthly goals grouped by category (Bills, Maintenance, Health, Admin, Finance, Review)
- **Persistence** — All data saved in localStorage
- **Responsive** — Works on mobile and desktop

## Run Locally

```bash
python3 -m http.server 7777
# Open http://localhost:7777
```

## Deploy to Firebase Hosting

This is a static site, hosted on Firebase project **`sudheer-habit-tracker`**
(live at https://sudheer-habit-tracker.web.app).

### Option A — Deploy from your machine

```bash
npm install -g firebase-tools   # one time
firebase login                  # one time
./firebase-deploy.sh            # deploys --only hosting
```

(Or directly: `firebase deploy --only hosting --project sudheer-habit-tracker`.)

### Option B — Auto-deploy via GitHub Actions

A workflow at `.github/workflows/firebase-hosting.yml` deploys on every push to
`main`. To enable it, add a repo secret `FIREBASE_SERVICE_ACCOUNT`:

1. Firebase Console → Project Settings → Service accounts → **Generate new private key**
2. GitHub → Settings → Secrets and variables → Actions → **New repository secret**
   named `FIREBASE_SERVICE_ACCOUNT`, paste the JSON.

Config lives in `firebase.json` (serves repo root) and `.firebaserc`
(default project `sudheer-habit-tracker`).

## Tech Stack

- Vanilla JS (ES Modules)
- Custom CSS (no frameworks)
- SVG charts (no charting library)
- localStorage for data persistence
