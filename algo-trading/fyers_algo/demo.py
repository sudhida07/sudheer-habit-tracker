"""Seed a realistic sample trading day so the dashboard works without any API keys.

`python3 run.py demo` writes this into a throwaway database (data/demo.db) and
serves the normal dashboard from it. Nothing here touches your real trading data.
"""

from datetime import datetime, timedelta

from . import store
from .config import DATA_DIR

DEMO_DB = DATA_DIR / "demo.db"

# (minutes after 09:15, symbol, side, qty, entry, exit, sl, target, reason, claude note)
# Each exit price sits just past the level named in `reason`, the way a real fill
# does — a TARGET row that closed short of its target would not be reproducible.
_TRADES = [
    (50, "NSE:SBIN-EQ", "BUY", 6, 812.40, 820.55, 808.34, 820.52, "TARGET",
     "Clean EMA9/21 cross with rising volume, price holding above VWAP. Good R:R."),
    (110, "NSE:TATASTEEL-EQ", "BUY", 28, 178.90, 177.98, 178.01, 180.69, "STOPLOSS",
     "Trend alignment ok but volume fading; approved with a tight stop."),
    (175, "NSE:COALINDIA-EQ", "SELL", 12, 415.30, 411.12, 417.38, 411.15, "TARGET",
     "Breakdown below VWAP with sector weakness confirming. Approved."),
    (255, "NSE:NTPC-EQ", "BUY", 14, 362.10, 365.75, 360.29, 365.72, "TARGET",
     "Strong momentum candle after consolidation, RSI 58. Approved."),
    (315, "NSE:ONGC-EQ", "BUY", 20, 244.80, None, 243.58, 247.25, None,
     "Fresh cross above VWAP with strong delivery volume. Approved, standard levels."),
]

# Intraday P&L path, one point every 12 minutes from 09:30. It ends at realized
# (124.40) plus the open ONGC position marked at 246.85 — inside its 243.58/247.25
# band, so the curve agrees with a position that is still running.
_CURVE = [0, 5, 12, 28, 24, 10, -2, -0.5, 5, 20, 34, 48.9, 56, 68, 78,
          90, 99.1, 108, 118, 128, 138, 148, 155, 160, 163, 165.4]


def seed():
    """Wipe and repopulate the demo database with one plausible paper-trading day."""
    store.use_db(DEMO_DB)
    store.init_db()
    store.reset()

    open_time = datetime.now().replace(hour=9, minute=15, second=0, microsecond=0)

    for mins, symbol, side, qty, entry, exit_price, sl, tgt, reason, note in _TRADES:
        ts = (open_time + timedelta(minutes=mins)).isoformat(timespec="seconds")
        trade_id = store.record_entry(symbol, side, qty, entry, sl, tgt, "paper",
                                      claude_reasoning=note, ts=ts)
        if exit_price is not None:
            direction = 1 if side == "BUY" else -1
            pnl = round((exit_price - entry) * qty * direction, 2)
            store.record_exit(trade_id, exit_price, pnl, reason)

    realized = store.day_realized_pnl()
    for i, pnl in enumerate(_CURVE):
        ts = open_time + timedelta(minutes=15 + 12 * i)
        # Split each point into the realized part booked so far and the rest as open P&L.
        booked = min(realized, max(0.0, pnl))
        store.snapshot_equity(round(booked, 2), round(pnl - booked, 2), ts=ts)

    store.set_status(
        engine="demo data (no broker connected)",
        updated=datetime.now().isoformat(timespec="seconds"),
    )
