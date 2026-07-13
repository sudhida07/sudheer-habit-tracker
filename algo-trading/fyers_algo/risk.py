"""Risk manager: position sizing, daily profit target, max daily loss, trade limits."""

from dataclasses import dataclass

from . import store


@dataclass
class RiskDecision:
    allowed: bool
    reason: str = ""
    qty: int = 0


class RiskManager:
    def __init__(self, settings):
        self.capital = settings.capital
        t, r = settings.targets, settings.risk
        self.daily_target = self.capital * float(t.get("daily_profit_target_pct", 15)) / 100
        self.max_daily_loss = self.capital * float(r.get("max_daily_loss_pct", 4)) / 100
        self.risk_per_trade = self.capital * float(r.get("risk_per_trade_pct", 1.5)) / 100
        self.stoploss_pct = float(t.get("per_trade_stoploss_pct", 0.5))
        self.target_pct = float(t.get("per_trade_target_pct", 1.0))
        self.max_open = int(r.get("max_open_positions", 2))
        self.max_trades = int(r.get("max_trades_per_day", 12))

    def day_state(self) -> dict:
        realized = store.day_realized_pnl()
        return {
            "realized": realized,
            "target_hit": realized >= self.daily_target,
            "loss_limit_hit": realized <= -self.max_daily_loss,
        }

    def check_new_trade(self, price: float) -> RiskDecision:
        state = self.day_state()
        if state["target_hit"]:
            return RiskDecision(False, "Daily profit target reached — done for the day")
        if state["loss_limit_hit"]:
            return RiskDecision(False, "Max daily loss reached — trading halted")
        if len(store.open_trades()) >= self.max_open:
            return RiskDecision(False, "Max open positions reached")
        if len(store.trades_today()) >= self.max_trades:
            return RiskDecision(False, "Max trades per day reached")

        # Size so that hitting the stop-loss costs at most `risk_per_trade`,
        # and exposure never exceeds available capital (cash segment, no leverage).
        sl_dist = price * self.stoploss_pct / 100
        if sl_dist <= 0:
            return RiskDecision(False, "Invalid stop-loss distance")
        qty = int(self.risk_per_trade / sl_dist)
        qty = min(qty, int(self.capital / price))
        if qty < 1:
            return RiskDecision(False, f"Price {price:.2f} too high for capital — qty would be 0")
        return RiskDecision(True, "", qty)

    def levels(self, side: str, entry: float, sl_pct=None, tgt_pct=None) -> tuple[float, float]:
        """(stoploss_price, target_price) for a position."""
        sl = sl_pct if sl_pct else self.stoploss_pct
        tg = tgt_pct if tgt_pct else self.target_pct
        if side == "BUY":
            return entry * (1 - sl / 100), entry * (1 + tg / 100)
        return entry * (1 + sl / 100), entry * (1 - tg / 100)
