"""Signal generation: EMA crossover + RSI + VWAP filter on intraday candles.

A signal here is only a *candidate* — it still has to pass the risk manager
and (if enabled) the Claude analyst before an order is placed.
"""

from dataclasses import dataclass

import pandas as pd


@dataclass
class Signal:
    symbol: str
    side: str          # "BUY" or "SELL"
    price: float       # last close
    reason: str
    indicators: dict


def _rsi(close: pd.Series, period: int = 14) -> pd.Series:
    delta = close.diff()
    gain = delta.clip(lower=0).ewm(alpha=1 / period, adjust=False).mean()
    loss = (-delta.clip(upper=0)).ewm(alpha=1 / period, adjust=False).mean()
    rs = gain / loss.replace(0, 1e-9)
    return 100 - (100 / (1 + rs))


def compute_indicators(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["ema9"] = df["close"].ewm(span=9, adjust=False).mean()
    df["ema21"] = df["close"].ewm(span=21, adjust=False).mean()
    df["rsi"] = _rsi(df["close"])
    # session VWAP (reset per day)
    day = df["ts"].dt.date
    tp = (df["high"] + df["low"] + df["close"]) / 3
    pv = tp * df["volume"]
    df["vwap"] = pv.groupby(day).cumsum() / df["volume"].groupby(day).cumsum().replace(0, 1e-9)
    return df


def generate_signal(symbol: str, df: pd.DataFrame) -> Signal | None:
    """Return a BUY/SELL candidate on a fresh EMA9/EMA21 cross confirmed by RSI + VWAP."""
    if len(df) < 30:
        return None
    df = compute_indicators(df)
    last, prev = df.iloc[-1], df.iloc[-2]

    crossed_up = prev["ema9"] <= prev["ema21"] and last["ema9"] > last["ema21"]
    crossed_down = prev["ema9"] >= prev["ema21"] and last["ema9"] < last["ema21"]

    ind = {
        "close": round(float(last["close"]), 2),
        "ema9": round(float(last["ema9"]), 2),
        "ema21": round(float(last["ema21"]), 2),
        "rsi": round(float(last["rsi"]), 1),
        "vwap": round(float(last["vwap"]), 2),
        "volume": int(last["volume"]),
    }

    if crossed_up and 50 < last["rsi"] < 75 and last["close"] > last["vwap"]:
        return Signal(symbol, "BUY", float(last["close"]),
                      "EMA9 crossed above EMA21, RSI bullish, price above VWAP", ind)
    if crossed_down and 25 < last["rsi"] < 50 and last["close"] < last["vwap"]:
        return Signal(symbol, "SELL", float(last["close"]),
                      "EMA9 crossed below EMA21, RSI bearish, price below VWAP", ind)
    return None
