"""Order execution: PaperBroker (simulated, default) and FyersBroker (live).

Both expose the same interface so the engine doesn't care which one runs.
Fyers order API reference: https://myapi.fyers.in/docsv3#tag/Order-Placement
"""

import itertools
import logging

log = logging.getLogger("broker")


class PaperBroker:
    """Simulates fills at the current market price. No money moves."""

    mode = "paper"

    def __init__(self):
        self._ids = itertools.count(1)

    def place_market_order(self, symbol: str, side: str, qty: int, price: float) -> dict:
        oid = f"PAPER-{next(self._ids)}"
        log.info("[PAPER] %s %s x%d @ %.2f (order %s)", side, symbol, qty, price, oid)
        return {"ok": True, "order_id": oid, "fill_price": price}


class FyersBroker:
    """Places real INTRADAY market orders through the Fyers v3 API."""

    mode = "live"

    def __init__(self, fyers):
        self.fyers = fyers

    def place_market_order(self, symbol: str, side: str, qty: int, price: float) -> dict:
        order = {
            "symbol": symbol,
            "qty": qty,
            "type": 2,                       # market order
            "side": 1 if side == "BUY" else -1,
            "productType": "INTRADAY",
            "limitPrice": 0,
            "stopPrice": 0,
            "validity": "DAY",
            "disclosedQty": 0,
            "offlineOrder": False,
        }
        resp = self.fyers.place_order(order)
        ok = resp.get("s") == "ok"
        if not ok:
            log.error("[LIVE] order rejected: %s", resp)
        else:
            log.info("[LIVE] %s %s x%d placed (id %s)", side, symbol, qty, resp.get("id"))
        # Fyers doesn't return the fill price synchronously for market orders;
        # we use the last traded price as the working estimate.
        return {"ok": ok, "order_id": resp.get("id", ""), "fill_price": price,
                "raw": resp}
