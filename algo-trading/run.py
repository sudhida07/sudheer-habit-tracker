#!/usr/bin/env python3
"""Fyers algo trading app — entry point.

Usage:
  python3 run.py demo       # sample dashboard, no API keys needed — start here
  python3 run.py auth       # daily Fyers login (saves access token)
  python3 run.py testtrade  # force one paper trade now, then run normally
  python3 run.py trade      # start the trading engine
  python3 run.py dashboard  # start the web dashboard only
  python3 run.py all        # engine + dashboard together

`testtrade` takes an optional symbol: python3 run.py testtrade NSE:ONGC-EQ
"""

import logging
import sys
import threading

from fyers_algo import store
from fyers_algo.config import ROOT, load_settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)

COMMANDS = ("demo", "auth", "testtrade", "trade", "dashboard", "all")


def check_env(settings):
    """Fail with instructions rather than a traceback when credentials are missing."""
    if not (ROOT / ".env").exists():
        raise SystemExit(
            "\nNo .env file found.\n"
            "  1. cp .env.example .env\n"
            "  2. open .env and paste in your Fyers keys from https://myapi.fyers.in\n\n"
            "To explore the dashboard without any keys, run:  bash start.sh demo\n"
        )
    missing = [name for name, value in (
        ("FYERS_CLIENT_ID", settings.fyers_client_id),
        ("FYERS_SECRET_KEY", settings.fyers_secret_key),
        ("FYERS_REDIRECT_URI", settings.fyers_redirect_uri),
    ) if not value or value.startswith(("XXXX", "YYYY"))]
    if missing:
        raise SystemExit(
            f"\nStill missing in .env: {', '.join(missing)}\n"
            "Get these by creating an Individual App at https://myapi.fyers.in\n\n"
            "To explore the dashboard without any keys, run:  bash start.sh demo\n"
        )


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "all"
    if cmd not in COMMANDS:
        raise SystemExit(__doc__)

    from fyers_algo.dashboard import run_dashboard

    if cmd == "demo":
        from fyers_algo import demo
        demo.seed()
        print("\n  Demo mode — sample trades, no broker connected.")
        run_dashboard()
        return

    settings = load_settings()
    store.init_db()

    if cmd == "dashboard":
        run_dashboard()
        return

    check_env(settings)
    from fyers_algo.auth import get_fyers, login

    if cmd == "auth":
        login(settings)
        return

    fyers = get_fyers(settings)
    profile = fyers.get_profile()
    if profile.get("s") != "ok":
        raise SystemExit(f"Fyers auth check failed: {profile} — run `python3 run.py auth`")
    print(f"Logged in as: {profile['data'].get('name', '?')} | mode={settings.mode}")

    if settings.mode == "live":
        confirm = input(
            "\n*** LIVE MODE: real orders will be placed with real money. ***\n"
            "Type LIVE to continue: "
        )
        if confirm.strip() != "LIVE":
            raise SystemExit("Aborted. Set mode: paper in config.yaml to simulate.")

    from fyers_algo.engine import Engine
    engine = Engine(settings, fyers)

    if cmd == "testtrade":
        symbol = sys.argv[2] if len(sys.argv) > 2 else settings.watchlist[0]
        t = engine.force_entry(symbol)
        print(
            f"\n  Test paper trade opened (no real money):\n"
            f"    {t['side']} {t['symbol']} x{t['qty']} @ {t['entry']:.2f}\n"
            f"    stop {t['stoploss']:.2f}   target {t['target']:.2f}\n\n"
            "  The engine now manages it every 60s and will close it on stop,\n"
            "  target, or the 15:12 square-off. Watch it on the dashboard.\n"
        )

    if cmd == "trade":
        engine.run()
    else:  # all, testtrade
        threading.Thread(target=engine.run, daemon=True).start()
        run_dashboard()


if __name__ == "__main__":
    main()
