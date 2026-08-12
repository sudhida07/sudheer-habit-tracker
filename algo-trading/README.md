# Fyers Algo Trading App

Automated intraday trading on NSE through the [Fyers API v3](https://myapi.fyers.in/docsv3),
with a Claude AI analyst that reviews every trade before execution, automatic
stop-loss / target exits, a daily profit target, a hard daily loss limit, and a
live web dashboard.

## ⚠️ Read this first

- **15% profit per day is a *cap*, not a promise.** No strategy earns 15% daily
  consistently — that would compound ₹5,000 into crores within months. Real
  intraday strategies fluctuate between winning and losing days. This app treats
  15% as a "stop trading, lock in the win" ceiling and 4% as a "stop trading,
  cut the damage" floor.
- **The app starts in PAPER mode** — it uses real market data but simulates
  orders. Run it in paper mode for at least a few weeks and only switch to
  `mode: live` if the results genuinely convince you.
- Intraday trading with small capital usually loses money after brokerage,
  STT and slippage. Never trade money you cannot afford to lose.

## What it does

```
every 60s during market hours:
  1. manage open positions → auto-exit on stop-loss / target / 15:12 square-off
  2. if daily target (+15%) or loss limit (-4%) hit → stop for the day
  3. scan watchlist (5-min candles) → EMA9/21 cross + RSI + VWAP signals
  4. send signal + market context to Claude → approve / reject / adjust SL & target
  5. size the position (max 1.5% of capital at risk) → place the order
  6. record everything to SQLite → live dashboard
```

## Setup

Open Terminal and run these three lines. On macOS use `python3` — plain `python`
does not exist there, which is the most common reason the app "doesn't start".

```bash
git clone -b claude/fyers-algo-trading-app-y8c56x https://github.com/sudhida07/sudheer-habit-tracker.git
cd sudheer-habit-tracker/algo-trading
bash setup.sh
```

The `-b` flag matters: this app lives on its own branch, so a plain
`git clone` checks out `main`, where there is no `algo-trading` folder and the
`cd` above fails. Drop the flag once the branch is merged into `main`.

Already cloned without it? You do not need to clone again:

```bash
cd ~/sudheer-habit-tracker
git checkout claude/fyers-algo-trading-app-y8c56x
cd algo-trading && bash setup.sh
```

`setup.sh` creates the virtual environment, installs everything, and writes a
starter `.env`. It only needs to be run once.

### See it working straight away

No API keys required — this fills the dashboard with a sample trading day so you
can check the setup before signing up for anything:

```bash
bash start.sh demo
```

Then open **http://127.0.0.1:5050**. Leave the Terminal window open while you
browse; closing it stops the server.

### Then add your keys

**Fyers app:** create an *Individual App* at [myapi.fyers.in](https://myapi.fyers.in)
(App permissions: order placement + data). Put its Client ID, Secret and Redirect
URI in `.env`.

**Claude:** put your `ANTHROPIC_API_KEY` in `.env` (get one at
[platform.claude.com](https://platform.claude.com)). Optional — without it the
engine trades on raw strategy signals only.

Edit the file with `nano .env` (save with `Ctrl+O`, `Enter`, then `Ctrl+X`).

## Daily routine

```bash
bash start.sh auth        # once each morning — Fyers tokens expire daily
bash start.sh all         # engine + dashboard at http://127.0.0.1:5050
```

Or run pieces separately: `bash start.sh trade` / `bash start.sh dashboard`.

`start.sh` just runs `.venv/bin/python run.py <command>`, so you never have to
remember to activate the virtual environment. If you prefer doing it by hand:

```bash
source .venv/bin/activate
python run.py all
```

## Testing with real market data (paper mode)

Paper mode simulates the *orders*, not the *prices* — it reads live quotes and
candles from Fyers, so a Fyers login is required even though no money moves.
The Claude key stays optional; without it the engine trades on raw strategy signals.

```bash
bash start.sh auth        # Fyers login for today
bash start.sh all         # engine + dashboard, real prices, simulated fills
```

The engine only enters when EMA9/21 crosses with RSI and VWAP agreeing, so a
quiet session can pass with no trades at all. To confirm the machinery works
without waiting for a signal:

```bash
bash start.sh testtrade                 # first watchlist symbol
bash start.sh testtrade NSE:ONGC-EQ     # or pick one
```

That opens one simulated position at the current live price with a deliberately
tight stop (0.1%) and target (0.15%) so it resolves in minutes rather than hours,
then hands over to the normal engine loop, which manages it every 60 seconds and
closes it on stop, target, or the 15:12 square-off. Watch the trade appear, move,
and close on the dashboard — that exercises the entire path end to end.

`testtrade` refuses to run when `mode: live`, and position sizing and the daily
risk limits still apply; it skips the strategy, not the risk manager.

## Watching from an iPad or phone

The engine is a long-running Python process, so it has to run on a computer — an
iPad can display the dashboard but cannot run the trading logic. Two ways to view it:

**Same Wi-Fi (nothing to set up):** the dashboard listens on your whole local
network. When it starts it prints the exact address to use, e.g.

```
  Dashboard ready:
    on this computer   http://127.0.0.1:5050
    on your iPad/phone http://192.168.1.100:5050   (same Wi-Fi network)
```

Type that second address into Safari on the iPad. Both devices must be on the
same network, and the computer must stay awake with the Terminal window open.

**From anywhere:** deploy the dashboard to Firebase — see the section below.

## Troubleshooting

Before reading the table, ask the app what is wrong:

```bash
bash start.sh doctor
```

It checks the Python version, the dependencies, every key in `.env`, whether
today's Fyers token is still valid, the market clock, and whether port 5050 is
already taken — then lists what to fix, in order. It never needs the app to
start successfully, and it masks secrets, so the output is safe to paste when
asking for help.

| What you see | Fix |
|---|---|
| `zsh: command not found: python` | macOS only ships `python3`. Use `bash start.sh <command>`, which picks the right one. |
| `cd: no such file or directory: sudheer-habit-tracker/algo-trading` right after cloning | You are on `main`, which has no `algo-trading` folder. Run `cd ~/sudheer-habit-tracker && git checkout claude/fyers-algo-trading-app-y8c56x`. |
| `cd: no such file or directory` | You are not in the project folder. Run `cd ~/sudheer-habit-tracker/algo-trading` first, or `ls ~` to find where you cloned it. |
| `bash: start.sh: No such file or directory` | Same cause — you are not inside `algo-trading`, or you are on the wrong branch. |
| `No .env file found` | Run `bash setup.sh`, or `cp .env.example .env` and fill it in. |
| `Still missing in .env: ...` | The named keys are still placeholders — paste the real values from myapi.fyers.in. |
| Safari or Chrome: "Can't connect" / `ERR_CONNECTION_REFUSED` on 127.0.0.1:5050 | Nothing is listening on that port — the server is not running, or it exited before starting. The browser cannot tell you why; run `bash start.sh doctor` and read Terminal. |
| iPad cannot load the page | Use the `192.168.x.x` address the app prints, not `127.0.0.1` — that one only means "this device". |
| `Address already in use` | An older copy is still running. Close it, or start on another port. |

## Configuration (`config.yaml`)

| Key | Default | Meaning |
|---|---|---|
| `mode` | `paper` | `paper` = simulated, `live` = real orders |
| `capital` | 5000 | trading capital (₹) |
| `targets.daily_profit_target_pct` | 15 | stop for the day at +15% |
| `targets.per_trade_stoploss_pct` | 0.5 | stop-loss per trade (% of price) |
| `targets.per_trade_target_pct` | 1.0 | take-profit per trade (% of price) |
| `risk.max_daily_loss_pct` | 4 | halt trading at −4% for the day |
| `risk.risk_per_trade_pct` | 1.5 | capital risked per trade (position sizing) |
| `risk.max_open_positions` | 2 | concurrent positions |
| `risk.max_trades_per_day` | 12 | overtrading guard |
| `watchlist` | 8 liquid PSU/large caps | affordable (< ₹500) liquid NSE stocks |
| `claude.enabled` | true | Claude vets every signal |
| `claude.min_confidence` | 0.6 | reject trades Claude scores below this |

## Host the dashboard on Firebase (view from anywhere)

Firebase can't run the trading engine (it's a long-running Python process that
needs your daily Fyers login) — the engine stays on your computer. What Firebase
*can* do is host the dashboard: the engine pushes its state to Firestore after
every cycle, and a Firebase-hosted page shows it live on any device.

```
your computer                          Google Firebase
┌──────────────────────┐   writes    ┌───────────────┐   live reads   ┌──────────────┐
│ engine (run.py all)  │ ──────────▶ │   Firestore    │ ─────────────▶ │ dashboard on │
│ + local dashboard    │  each cycle │ algo/dashboard │   onSnapshot   │ any device   │
└──────────────────────┘             └───────────────┘                └──────────────┘
```

One-time setup:

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
   and enable **Cloud Firestore** (production mode is fine — rules are deployed below).
2. Project settings → Service accounts → **Generate new private key** — save the
   file as `algo-trading/serviceAccount.json` (it's git-ignored).
3. In `config.yaml` set `firebase.enabled: true`.
4. Install the Firebase CLI and deploy the dashboard + security rules:
   ```bash
   npm install -g firebase-tools
   cd algo-trading/firebase
   firebase login
   firebase use --add        # pick your project
   firebase deploy
   ```

Your dashboard is now at `https://<your-project>.web.app` and updates in real
time whenever the engine is running.

**Privacy note:** the deployed rules make the single state document readable by
anyone who has your URL (writes are blocked; the engine writes via the Admin
SDK). If you want it private, enable Firebase Auth and tighten the rule in
`firebase/firestore.rules` — the file has a comment showing exactly what to change.

### Adding it to an existing Firebase app instead

`firebase/public/fyers.html` is a self-contained page for dropping into a Firebase
project you already have — it needs no build step and no config, because Firebase
Hosting serves the SDK and your project's settings from the reserved `/__/firebase/`
paths. Copy it into that project's public directory and deploy.

Three things to adjust:

1. **Nav links.** The `<nav>` block near the top has placeholder `href`s. Point them
   at your app's real routes and keep `class="active"` on the Fyers link.
2. **Firestore document.** The `DOC` constant in the script must match
   `firebase.document` in `config.yaml`.
3. **Security rule.** The page requires a signed-in user, so the rule can require one
   too — stricter than the standalone page's public read:

   ```
   match /algo/dashboard {
     allow read: if request.auth != null;
     allow write: if false;
   }
   ```

The engine writes with the Admin SDK, which bypasses rules, so tightening the read
side costs it nothing.

## Going live (only after successful paper trading)

1. Set `mode: live` in `config.yaml`.
2. `bash start.sh all` — it asks you to type `LIVE` to confirm.
3. Orders are placed as `INTRADAY` product type; the broker auto-squares-off
   leftovers, but the engine exits everything itself at 15:12 IST.

## Project layout

```
setup.sh                   one-time install (venv + dependencies + .env)
start.sh                   run a command without activating the venv yourself
run.py                     CLI: doctor / demo / auth / testtrade / trade / dashboard / all
config.yaml                capital, targets, risk, watchlist, session times
fyers_algo/
  auth.py                  Fyers OAuth login + token storage
  demo.py                  sample trading day for `start.sh demo`
  doctor.py                setup self-check for `start.sh doctor`
  data.py                  quotes and candles
  strategy.py              EMA/RSI/VWAP signal generation
  claude_analyst.py        Claude reviews each trade (structured JSON verdict)
  risk.py                  position sizing, daily target/loss limits
  broker.py                PaperBroker (simulated) / FyersBroker (live)
  engine.py                main trading loop
  store.py                 SQLite trade log + equity snapshots
  dashboard.py + templates dashboard at http://127.0.0.1:5050
data/                      token, database, logs (git-ignored)
```
