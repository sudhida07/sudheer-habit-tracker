"""SQLite persistence: trades, equity snapshots, engine status (feeds the dashboard)."""

import json
import sqlite3
import threading
from datetime import datetime

from .config import DATA_DIR

DB_PATH = DATA_DIR / "trading.db"
_lock = threading.Lock()


def use_db(path):
    """Point the store at a different database file (used by demo mode)."""
    global DB_PATH
    DB_PATH = path


def reset():
    """Drop every table and recreate the schema — demo mode only."""
    with _lock, _conn() as c:
        c.executescript(
            "DROP TABLE IF EXISTS trades;"
            "DROP TABLE IF EXISTS equity;"
            "DROP TABLE IF EXISTS status;"
        )
    init_db()

SCHEMA = """
CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ts TEXT NOT NULL,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL,
    qty INTEGER NOT NULL,
    entry_price REAL NOT NULL,
    exit_price REAL,
    stoploss REAL,
    target REAL,
    status TEXT NOT NULL DEFAULT 'OPEN',   -- OPEN / CLOSED
    exit_reason TEXT,
    pnl REAL DEFAULT 0,
    mode TEXT NOT NULL,
    claude_reasoning TEXT
);
CREATE TABLE IF NOT EXISTS equity (
    ts TEXT NOT NULL,
    day TEXT NOT NULL,
    realized_pnl REAL NOT NULL,
    unrealized_pnl REAL NOT NULL
);
CREATE TABLE IF NOT EXISTS status (
    key TEXT PRIMARY KEY,
    value TEXT
);
"""


def _conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _lock, _conn() as c:
        c.executescript(SCHEMA)


def record_entry(symbol, side, qty, price, stoploss, target, mode, claude_reasoning="",
                 ts=None) -> int:
    with _lock, _conn() as c:
        cur = c.execute(
            "INSERT INTO trades (ts, symbol, side, qty, entry_price, stoploss, target, mode, claude_reasoning)"
            " VALUES (?,?,?,?,?,?,?,?,?)",
            (ts or datetime.now().isoformat(timespec="seconds"), symbol, side, qty, price,
             stoploss, target, mode, claude_reasoning),
        )
        return cur.lastrowid


def record_exit(trade_id, exit_price, pnl, reason):
    with _lock, _conn() as c:
        c.execute(
            "UPDATE trades SET exit_price=?, pnl=?, status='CLOSED', exit_reason=? WHERE id=?",
            (exit_price, pnl, reason, trade_id),
        )


def open_trades():
    with _lock, _conn() as c:
        return [dict(r) for r in c.execute("SELECT * FROM trades WHERE status='OPEN'")]


def trades_today():
    day = datetime.now().date().isoformat()
    with _lock, _conn() as c:
        return [dict(r) for r in c.execute(
            "SELECT * FROM trades WHERE ts LIKE ? ORDER BY id DESC", (day + "%",))]


def day_realized_pnl() -> float:
    day = datetime.now().date().isoformat()
    with _lock, _conn() as c:
        row = c.execute(
            "SELECT COALESCE(SUM(pnl),0) p FROM trades WHERE status='CLOSED' AND ts LIKE ?",
            (day + "%",)).fetchone()
        return float(row["p"])


def snapshot_equity(realized, unrealized, ts=None):
    now = ts or datetime.now()
    with _lock, _conn() as c:
        c.execute("INSERT INTO equity VALUES (?,?,?,?)",
                  (now.isoformat(timespec="seconds"), now.date().isoformat(),
                   realized, unrealized))


def equity_today():
    day = datetime.now().date().isoformat()
    with _lock, _conn() as c:
        return [dict(r) for r in c.execute(
            "SELECT * FROM equity WHERE day=? ORDER BY ts", (day,))]


def set_status(**kwargs):
    with _lock, _conn() as c:
        for k, v in kwargs.items():
            c.execute("INSERT INTO status VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
                      (k, json.dumps(v)))


def get_status() -> dict:
    with _lock, _conn() as c:
        return {r["key"]: json.loads(r["value"]) for r in c.execute("SELECT * FROM status")}
