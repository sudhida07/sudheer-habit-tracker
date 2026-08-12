"""Claude market analyst.

Before every trade, the current scenario (signal, indicators, recent candles,
today's P&L, risk state) is sent to Claude, which returns a structured
verdict: approve / reject, confidence, and suggested stop-loss/target tweaks.
If the API key is missing or the call fails, the engine falls back to the
raw strategy signal (fail-open is configurable via `claude.enabled`).
"""

import json
import logging

import anthropic
import pandas as pd

log = logging.getLogger("claude_analyst")

VERDICT_SCHEMA = {
    "type": "object",
    "properties": {
        "approve": {"type": "boolean"},
        "confidence": {"type": "number"},
        "reasoning": {"type": "string"},
        "suggested_stoploss_pct": {"type": "number"},
        "suggested_target_pct": {"type": "number"},
    },
    "required": ["approve", "confidence", "reasoning"],
    "additionalProperties": False,
}

SYSTEM_PROMPT = """You are a disciplined intraday trading risk analyst for the Indian \
stock market (NSE). You review algorithmic trade signals before execution.

Your job is to REJECT weak trades, not to find reasons to trade. Approve only when \
the setup is clean: clear trend alignment, healthy volume, no obvious chop, and the \
reward/risk of the proposed stop-loss and target makes sense. Capital is small and \
capital preservation beats missing a trade. Be especially skeptical when the day's \
P&L is already negative or several trades have been taken already.

Respond with your verdict as JSON matching the required schema. `confidence` is 0-1. \
Only include suggested_stoploss_pct / suggested_target_pct if you would change them."""


class ClaudeAnalyst:
    def __init__(self, api_key: str, model: str = "claude-opus-5", min_confidence: float = 0.6):
        self.client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()
        self.model = model
        self.min_confidence = min_confidence

    def review(self, signal, candles: pd.DataFrame, context: dict) -> dict:
        """Return {"approve": bool, "confidence": float, "reasoning": str, ...}."""
        recent = candles.tail(20)[["ts", "open", "high", "low", "close", "volume"]].copy()
        recent["ts"] = recent["ts"].dt.strftime("%H:%M")
        prompt = f"""Proposed intraday trade on {signal.symbol}:

Signal: {signal.side} at ~{signal.price}
Strategy reason: {signal.reason}
Indicators: {json.dumps(signal.indicators)}

Planned stop-loss: {context['stoploss_pct']}% | target: {context['target_pct']}%
Position size: {context['qty']} shares (~INR {context['exposure']:.0f} exposure)

Account state:
- Capital: INR {context['capital']:.0f}
- Today's realized P&L: INR {context['day_pnl']:.0f}
- Trades taken today: {context['trades_today']}
- Open positions: {context['open_positions']}

Last 20 five-minute candles:
{recent.to_string(index=False)}

Should this trade be executed?"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=SYSTEM_PROMPT,
                output_config={
                    "format": {"type": "json_schema", "schema": VERDICT_SCHEMA},
                    # Thinking is on by default from Opus 5 onward and is billed as
                    # output. Vetting one signal against a handful of indicators does
                    # not need deep reasoning, so keep the depth (and the cost) low.
                    "effort": "low",
                },
                messages=[{"role": "user", "content": prompt}],
            )
            # Find the text block rather than indexing content[0]: models that think
            # put a thinking block first, so the verdict is not always at position 0.
            verdict_json = next(
                (b.text for b in response.content if getattr(b, "type", None) == "text"), None
            )
            if verdict_json is None:
                raise ValueError(
                    "no text block in response (blocks: "
                    + ", ".join(getattr(b, "type", "?") for b in response.content) + ")"
                )
            verdict = json.loads(verdict_json)
        except (anthropic.APIError, json.JSONDecodeError, ValueError,
                AttributeError, KeyError, IndexError) as e:
            log.warning("Claude review failed (%s: %s) — falling back to raw signal",
                        type(e).__name__, e)
            return {"approve": True, "confidence": 0.5,
                    "reasoning": f"Claude unavailable ({type(e).__name__}); raw signal used"}

        verdict["approve"] = bool(verdict["approve"]) and verdict["confidence"] >= self.min_confidence
        return verdict
