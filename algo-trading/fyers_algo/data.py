"""Market data helpers on top of the Fyers v3 REST API."""

from datetime import datetime, timedelta

import pandas as pd


def get_quote(fyers, symbol: str) -> float | None:
    """Last traded price for one symbol."""
    resp = fyers.quotes({"symbols": symbol})
    if resp.get("s") != "ok":
        return None
    try:
        return float(resp["d"][0]["v"]["lp"])
    except (KeyError, IndexError, TypeError, ValueError):
        return None


def get_candles(fyers, symbol: str, resolution: str = "5", days: int = 5) -> pd.DataFrame:
    """Recent OHLCV candles as a DataFrame (oldest first)."""
    to_date = datetime.now().date()
    from_date = to_date - timedelta(days=days)
    resp = fyers.history({
        "symbol": symbol,
        "resolution": resolution,
        "date_format": "1",
        "range_from": from_date.isoformat(),
        "range_to": to_date.isoformat(),
        "cont_flag": "1",
    })
    if resp.get("s") != "ok" or not resp.get("candles"):
        return pd.DataFrame()
    df = pd.DataFrame(
        resp["candles"], columns=["ts", "open", "high", "low", "close", "volume"]
    )
    df["ts"] = pd.to_datetime(df["ts"], unit="s", utc=True).dt.tz_convert("Asia/Kolkata")
    return df
