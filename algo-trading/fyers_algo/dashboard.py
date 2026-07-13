"""Flask dashboard: live P&L, equity curve, trades, engine status."""

from flask import Flask, jsonify, render_template

from . import store
from .config import load_settings

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("dashboard.html")


@app.route("/api/state")
def state():
    settings = load_settings()
    store.init_db()
    status = store.get_status()
    trades = store.trades_today()
    equity = store.equity_today()
    realized = store.day_realized_pnl()
    unrealized = equity[-1]["unrealized_pnl"] if equity else 0.0
    capital = settings.capital
    target = capital * float(settings.targets.get("daily_profit_target_pct", 15)) / 100
    wins = sum(1 for t in trades if t["status"] == "CLOSED" and t["pnl"] > 0)
    closed = sum(1 for t in trades if t["status"] == "CLOSED")
    return jsonify({
        "status": status,
        "mode": settings.mode,
        "capital": capital,
        "daily_target": target,
        "realized_pnl": round(realized, 2),
        "unrealized_pnl": round(unrealized, 2),
        "total_pnl": round(realized + unrealized, 2),
        "target_progress_pct": round(100 * (realized + unrealized) / target, 1) if target else 0,
        "trades": trades,
        "equity": [
            {"ts": e["ts"][11:16], "pnl": round(e["realized_pnl"] + e["unrealized_pnl"], 2)}
            for e in equity
        ],
        "win_rate": round(100 * wins / closed, 1) if closed else None,
        "closed_trades": closed,
        "open_trades": len([t for t in trades if t["status"] == "OPEN"]),
    })


def run_dashboard(host="127.0.0.1", port=5050):
    app.run(host=host, port=port, debug=False)
