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


def evaluate(symbol: str, df: pd.DataFrame) -> dict:
    """Score one symbol and say, in words, what is stopping it from triggering.

    A cross is only true on the single candle where EMA9 crosses EMA21, so most
    scans produce nothing. Without this the dashboard can only say "scanning",
    which looks identical to a broken engine — so return the indicator state and
    a plain-language `waiting_for` alongside any signal.
    """
    if len(df) < 30:
        return {"symbol": symbol, "signal": None,
                "waiting_for": f"only {len(df)} candles, need 30"}

    df = compute_indicators(df)
    last, prev = df.iloc[-1], df.iloc[-2]

    crossed_up = prev["ema9"] <= prev["ema21"] and last["ema9"] > last["ema21"]
    crossed_down = prev["ema9"] >= prev["ema21"] and last["ema9"] < last["ema21"]

    close, ema9, ema21 = float(last["close"]), float(last["ema9"]), float(last["ema21"])
    rsi, vwap = float(last["rsi"]), float(last["vwap"])
    gap_pct = (ema9 - ema21) / ema21 * 100 if ema21 else 0.0

    ind = {
        "close": round(close, 2), "ema9": round(ema9, 2), "ema21": round(ema21, 2),
        "rsi": round(rsi, 1), "vwap": round(vwap, 2),
        "volume": int(last["volume"]),
    }
    out = {"symbol": symbol, "signal": None, "gap_pct": round(gap_pct, 3),
           "trend": "up" if ema9 > ema21 else "down", **ind}

    if crossed_up and 50 < rsi < 75 and close > vwap:
        out["signal"] = Signal(symbol, "BUY", close,
                               "EMA9 crossed above EMA21, RSI bullish, price above VWAP", ind)
        out["waiting_for"] = "BUY signal"
        return out
    if crossed_down and 25 < rsi < 50 and close < vwap:
        out["signal"] = Signal(symbol, "SELL", close,
                               "EMA9 crossed below EMA21, RSI bearish, price below VWAP", ind)
        out["waiting_for"] = "SELL signal"
        return out

    # No trade — name the first unmet condition rather than reporting a bare "no".
    if crossed_up or crossed_down:
        side = "up" if crossed_up else "down"
        band = "50–75" if crossed_up else "25–50"
        in_band = (50 < rsi < 75) if crossed_up else (25 < rsi < 50)
        vwap_ok = (close > vwap) if crossed_up else (close < vwap)
        unmet = []
        if not in_band:
            unmet.append(f"RSI {rsi:.0f} outside {band}")
        if not vwap_ok:
            unmet.append(f"price {'below' if crossed_up else 'above'} VWAP {vwap:.2f}")
        out["waiting_for"] = f"crossed {side}, but " + " and ".join(unmet)
    else:
        where = "above" if gap_pct > 0 else "below" if gap_pct < 0 else "level with"
        out["waiting_for"] = f"no cross — EMA9 {abs(gap_pct):.2f}% {where} EMA21"
    return out


def generate_signal(symbol: str, df: pd.DataFrame) -> Signal | None:
    """Return a BUY/SELL candidate on a fresh EMA9/EMA21 cross confirmed by RSI + VWAP."""
    return evaluate(symbol, df)["signal"]
