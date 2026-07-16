"""Trading engine: scan → signal → Claude review → risk check → execute → manage exits.

Runs during market hours (NSE, Mon-Fri 09:15-15:30 IST). Every open position is
monitored on each cycle and auto-exited on stop-loss, target, or square-off time.
"""

import logging
import time
from datetime import datetime, time as dtime
from zoneinfo import ZoneInfo

from . import store
from .broker import FyersBroker, PaperBroker
from .claude_analyst import ClaudeAnalyst
from .data import get_candles, get_quote
from .firebase_sync import make_sync
from .risk import RiskManager
from .state import build_state
from .strategy import generate_signal

IST = ZoneInfo("Asia/Kolkata")
log = logging.getLogger("engine")


def _parse_t(s: str) -> dtime:
    h, m = s.split(":")
    return dtime(int(h), int(m))


class Engine:
    def __init__(self, settings, fyers):
        self.settings = settings
        self.fyers = fyers
        self.risk = RiskManager(settings)
        self.broker = (
            FyersBroker(fyers) if settings.mode == "live" else PaperBroker()
        )
        c = settings.claude
        self.analyst = None
        if c.get("enabled", True) and settings.anthropic_api_key:
            self.analyst = ClaudeAnalyst(
                settings.anthropic_api_key,
                model=c.get("model", "claude-opus-4-8"),
                min_confidence=float(c.get("min_confidence", 0.6)),
            )
        s = settings.session
        self.t_start = _parse_t(s.get("start", "09:20"))
        self.t_end = _parse_t(s.get("end", "15:00"))
        self.t_squareoff = _parse_t(s.get("square_off", "15:12"))
        self.interval = int(s.get("scan_interval_sec", 60))
        self.resolution = s.get("candle_resolution", "5")
        self.firebase = make_sync(settings)

    # ---------- session helpers ----------

    def now(self) -> datetime:
        return datetime.now(IST)

    def market_open(self) -> bool:
        n = self.now()
        return n.weekday() < 5 and dtime(9, 15) <= n.time() <= dtime(15, 30)

    def can_enter(self) -> bool:
        t = self.now().time()
        return self.t_start <= t <= self.t_end

    def must_square_off(self) -> bool:
        return self.now().time() >= self.t_squareoff

    # ---------- exits ----------

    def manage_open_positions(self):
        unrealized = 0.0
        for tr in store.open_trades():
            price = get_quote(self.fyers, tr["symbol"])
            if price is None:
                continue
            side, qty = tr["side"], tr["qty"]
            pnl = (price - tr["entry_price"]) * qty if side == "BUY" \
                else (tr["entry_price"] - price) * qty

            reason = None
            if side == "BUY" and price <= tr["stoploss"]:
                reason = "STOPLOSS"
            elif side == "BUY" and price >= tr["target"]:
                reason = "TARGET"
            elif side == "SELL" and price >= tr["stoploss"]:
                reason = "STOPLOSS"
            elif side == "SELL" and price <= tr["target"]:
                reason = "TARGET"
            elif self.must_square_off():
                reason = "SQUARE_OFF"
            elif self.risk.day_state()["target_hit"]:
                reason = "DAILY_TARGET"

            if reason:
                exit_side = "SELL" if side == "BUY" else "BUY"
                res = self.broker.place_market_order(tr["symbol"], exit_side, qty, price)
                if res["ok"]:
                    fill = res["fill_price"]
                    pnl = (fill - tr["entry_price"]) * qty if side == "BUY" \
                        else (tr["entry_price"] - fill) * qty
                    store.record_exit(tr["id"], fill, round(pnl, 2), reason)
                    log.info("EXIT %s %s x%d @ %.2f (%s) pnl=%.2f",
                             side, tr["symbol"], qty, fill, reason, pnl)
            else:
                unrealized += pnl
        return unrealized

    # ---------- entries ----------

    def try_enter(self, symbol: str):
        if not self.can_enter() or self.must_square_off():
            return
        if any(t["symbol"] == symbol for t in store.open_trades()):
            return

        candles = get_candles(self.fyers, symbol, self.resolution)
        if candles.empty:
            return
        signal = generate_signal(symbol, candles)
        if not signal:
            return

        decision = self.risk.check_new_trade(signal.price)
        if not decision.allowed:
            log.info("Signal %s %s blocked: %s", signal.side, symbol, decision.reason)
            return

        sl_pct = tgt_pct = None
        reasoning = "Claude analyst disabled"
        if self.analyst:
            verdict = self.analyst.review(signal, candles, {
                "stoploss_pct": self.risk.stoploss_pct,
                "target_pct": self.risk.target_pct,
                "qty": decision.qty,
                "exposure": decision.qty * signal.price,
                "capital": self.risk.capital,
                "day_pnl": store.day_realized_pnl(),
                "trades_today": len(store.trades_today()),
                "open_positions": len(store.open_trades()),
            })
            reasoning = verdict.get("reasoning", "")
            if not verdict["approve"]:
                log.info("Claude rejected %s %s (conf %.2f): %s",
                         signal.side, symbol, verdict.get("confidence", 0), reasoning)
                return
            sl_pct = verdict.get("suggested_stoploss_pct")
            tgt_pct = verdict.get("suggested_target_pct")

        res = self.broker.place_market_order(symbol, signal.side, decision.qty, signal.price)
        if not res["ok"]:
            return
        entry = res["fill_price"]
        sl, tgt = self.risk.levels(signal.side, entry, sl_pct, tgt_pct)
        store.record_entry(symbol, signal.side, decision.qty, entry,
                           round(sl, 2), round(tgt, 2), self.broker.mode, reasoning)
        log.info("ENTER %s %s x%d @ %.2f sl=%.2f tgt=%.2f",
                 signal.side, symbol, decision.qty, entry, sl, tgt)

    # ---------- main loop ----------

    def run(self):
        store.init_db()
        log.info("Engine started — mode=%s capital=%.0f daily_target=%.0f max_loss=%.0f",
                 self.settings.mode, self.risk.capital,
                 self.risk.daily_target, self.risk.max_daily_loss)
        while True:
            try:
                if not self.market_open():
                    store.set_status(engine="waiting (market closed)",
                                     mode=self.settings.mode,
                                     updated=self.now().isoformat(timespec="seconds"))
                    if self.firebase:
                        self.firebase.publish(build_state(self.settings))
                    time.sleep(60)
                    continue

                unrealized = self.manage_open_positions()
                state = self.risk.day_state()
                store.snapshot_equity(state["realized"], round(unrealized, 2))

                if state["target_hit"]:
                    status = "DONE — daily profit target hit"
                elif state["loss_limit_hit"]:
                    status = "HALTED — max daily loss hit"
                else:
                    status = "scanning"
                    for symbol in self.settings.watchlist:
                        self.try_enter(symbol)

                store.set_status(
                    engine=status, mode=self.settings.mode,
                    capital=self.risk.capital,
                    daily_target=self.risk.daily_target,
                    max_daily_loss=self.risk.max_daily_loss,
                    updated=self.now().isoformat(timespec="seconds"),
                )
                if self.firebase:
                    self.firebase.publish(build_state(self.settings))
            except Exception:
                log.exception("Engine cycle failed; retrying next cycle")
            time.sleep(self.interval)
