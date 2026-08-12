"""Self-check: report why the app will not start, without needing it to start.

`python3 run.py doctor` never raises — every check catches its own failure — so it
still reports when credentials, the token or the dependencies are missing. Secrets
are masked; the output is safe to paste into a chat when asking for help.
"""

import socket
import sys
import time
from datetime import datetime, time as dtime, timezone, timedelta

from .config import DATA_DIR, ROOT

IST = timezone(timedelta(hours=5, minutes=30))
OK, BAD, WARN = "  ok  ", " FAIL ", " warn "


def _mask(value: str) -> str:
    if not value:
        return "(empty)"
    if len(value) <= 8:
        return value[0] + "***"
    return f"{value[:4]}…{value[-4:]}  ({len(value)} chars)"


def _line(state, label, detail=""):
    print(f"[{state}] {label:<26} {detail}")


def _port_busy(port=5050) -> bool:
    s = socket.socket()
    s.settimeout(0.4)
    try:
        return s.connect_ex(("127.0.0.1", port)) == 0
    finally:
        s.close()


def run():
    print("\n─── Fyers algo · self-check ─────────────────────────────\n")
    problems = []

    # 1. interpreter
    v = sys.version_info
    in_venv = sys.prefix != sys.base_prefix
    _line(OK if v >= (3, 10) else BAD, "Python",
          f"{v.major}.{v.minor}.{v.micro}" +
          ("  (virtual environment)" if in_venv else "  NOT in a virtual environment"))
    if v < (3, 10):
        problems.append("Python 3.10+ is required. Install from python.org, then rerun setup.sh.")
    if not in_venv:
        problems.append("Not running inside .venv — start commands with `bash start.sh ...`.")

    # 2. dependencies
    missing = []
    for mod in ("flask", "yaml", "dotenv", "pandas", "fyers_apiv3", "anthropic"):
        try:
            __import__(mod)
        except ImportError:
            missing.append(mod)
    _line(OK if not missing else BAD, "Dependencies",
          "all present" if not missing else "missing: " + ", ".join(missing))
    if missing:
        problems.append("Dependencies missing — run `bash setup.sh`.")

    # 3. config + credentials
    try:
        from .config import load_settings
        st = load_settings()
        _line(OK, "config.yaml", f"mode={st.mode}  capital=₹{st.capital:,.0f}  "
                                 f"{len(st.watchlist)} symbols")
        env_path = ROOT / ".env"
        if not env_path.exists():
            _line(BAD, ".env", "not found")
            problems.append("No .env — run `cp .env.example .env`, then paste your Fyers keys.")
        else:
            creds = {
                "FYERS_CLIENT_ID": st.fyers_client_id,
                "FYERS_SECRET_KEY": st.fyers_secret_key,
                "FYERS_REDIRECT_URI": st.fyers_redirect_uri,
            }
            bad = [k for k, val in creds.items()
                   if not val or val.startswith(("XXXX", "YYYY"))]
            _line(OK if not bad else BAD, ".env",
                  "all three Fyers keys set" if not bad else "still placeholder: " + ", ".join(bad))
            for k, val in creds.items():
                if k == "FYERS_REDIRECT_URI":
                    print(f"         {k:<20} {val or '(empty)'}   <- must match the Fyers app exactly")
                else:
                    print(f"         {k:<20} {_mask(val)}")
            if bad:
                problems.append("Fill the placeholder keys in .env from https://myapi.fyers.in.")
            # the .env.example placeholder is the literal "sk-ant-...", so the
            # prefix alone is not enough to call it set
            claude_set = (st.anthropic_api_key.startswith("sk-ant-")
                          and len(st.anthropic_api_key) > 20)
            _line(OK if claude_set else WARN, "Claude key",
                  _mask(st.anthropic_api_key) if claude_set
                  else "not set — engine runs, but without Claude vetting signals")

            # Report the model the engine will actually construct the analyst with,
            # resolved the same way engine.py does — reading config.yaml by eye
            # misses the fallback that applies when the key is absent entirely.
            cfg = st.claude
            model = cfg.get("model", "claude-opus-5")
            if not cfg.get("enabled", True):
                state, detail = WARN, f"{model} — disabled in config.yaml, will not be called"
            elif not claude_set:
                state, detail = WARN, f"{model} — set, but no key so no call is made"
            else:
                state = OK
                detail = f"{model}  (min_confidence {cfg.get('min_confidence', 0.6)})"
            _line(state, "Claude model", detail)
    except Exception as e:
        _line(BAD, "config", f"{type(e).__name__}: {e}")
        problems.append("config.yaml could not be read.")

    # 4. today's Fyers token — read the file directly, so this still reports
    #    something useful when the Fyers SDK itself is not installed
    try:
        import json
        token_file = DATA_DIR / "fyers_token.json"
        if not token_file.exists():
            _line(BAD, "Fyers token", "never created")
            problems.append("Log in for today — `bash start.sh auth`.")
        else:
            created = json.loads(token_file.read_text()).get("created_at", 0)
            age = (time.time() - created) / 3600
            if age > 20:
                _line(BAD, "Fyers token", f"expired ({age:.1f}h old — they last one day)")
                problems.append("Token expired — `bash start.sh auth` again.")
            else:
                _line(OK, "Fyers token", f"valid, {age:.1f}h old")
    except Exception as e:
        _line(BAD, "Fyers token", f"unreadable — {type(e).__name__}: {e}")
        problems.append("Token file is corrupt — `bash start.sh auth` to recreate it.")

    # 5. market clock
    now = datetime.now(IST)
    weekday = now.weekday() < 5
    t = now.time()
    if not weekday:
        market = "closed — weekend"
    elif t < dtime(9, 15):
        market = "pre-open — opens 09:15"
    elif t < dtime(9, 20):
        market = "open — engine waits until 09:20"
    elif t < dtime(15, 0):
        market = "open — engine takes new entries"
    elif t < dtime(15, 30):
        market = "open — no new entries, square-off 15:12"
    else:
        market = "closed — shut at 15:30"
    _line(OK if "open —" in market else WARN, "Market (IST)",
          f"{now:%a %d %b %H:%M}  ·  {market}")

    # 6. dashboard port
    busy = _port_busy()
    _line(WARN if busy else OK, "Port 5050",
          "already in use — another copy is running" if busy else "free")
    if busy:
        problems.append("Port 5050 is taken. The dashboard may already be up at "
                        "http://127.0.0.1:5050, or close the old Terminal window.")

    # 7. database
    try:
        from . import store
        store.init_db()
        n = len(store.trades_today())
        _line(OK, "Database", f"{store.DB_PATH.name} · {n} trade(s) recorded today")
    except Exception as e:
        _line(BAD, "Database", f"{type(e).__name__}: {e}")

    print()
    if problems:
        print("Fix these, in order:\n")
        for i, p in enumerate(problems, 1):
            print(f"  {i}. {p}")
    else:
        print("Everything checks out. Start the session with:\n\n    bash start.sh testtrade")
    print("\n─────────────────────────────────────────────────────────\n")
