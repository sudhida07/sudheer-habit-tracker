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

```bash
cd algo-trading
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # fill in your keys
```

**Fyers app:** create an *Individual App* at [myapi.fyers.in](https://myapi.fyers.in)
(App permissions: order placement + data). Put its Client ID, Secret and Redirect
URI in `.env`.

**Claude:** put your `ANTHROPIC_API_KEY` in `.env` (get one at
[platform.claude.com](https://platform.claude.com)). Optional — without it the
engine trades on raw strategy signals only.

## Daily routine

```bash
python run.py auth        # once each morning — Fyers tokens expire daily
python run.py all         # engine + dashboard at http://127.0.0.1:5050
```

Or run pieces separately: `python run.py trade` / `python run.py dashboard`.

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

## Going live (only after successful paper trading)

1. Set `mode: live` in `config.yaml`.
2. `python run.py all` — it asks you to type `LIVE` to confirm.
3. Orders are placed as `INTRADAY` product type; the broker auto-squares-off
   leftovers, but the engine exits everything itself at 15:12 IST.

## Project layout

```
run.py                     CLI: auth / trade / dashboard / all
config.yaml                capital, targets, risk, watchlist, session times
fyers_algo/
  auth.py                  Fyers OAuth login + token storage
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
