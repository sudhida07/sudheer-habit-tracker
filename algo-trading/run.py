#!/usr/bin/env python3
"""Fyers algo trading app — entry point.

Usage:
  python run.py auth        # daily Fyers login (saves access token)
  python run.py trade       # start the trading engine
  python run.py dashboard   # start the web dashboard on http://127.0.0.1:5050
  python run.py all         # engine + dashboard together
"""

import logging
import sys
import threading

from fyers_algo import store
from fyers_algo.auth import get_fyers, login
from fyers_algo.config import load_settings
from fyers_algo.dashboard import run_dashboard
from fyers_algo.engine import Engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "all"
    settings = load_settings()
    store.init_db()

    if cmd == "auth":
        login(settings)
        return

    if cmd == "dashboard":
        run_dashboard()
        return

    fyers = get_fyers(settings)
    profile = fyers.get_profile()
    if profile.get("s") != "ok":
        raise SystemExit(f"Fyers auth check failed: {profile} — run `python run.py auth`")
    print(f"Logged in as: {profile['data'].get('name', '?')} | mode={settings.mode}")

    if settings.mode == "live":
        confirm = input(
            "\n*** LIVE MODE: real orders will be placed with real money. ***\n"
            "Type LIVE to continue: "
        )
        if confirm.strip() != "LIVE":
            raise SystemExit("Aborted. Set mode: paper in config.yaml to simulate.")

    engine = Engine(settings, fyers)

    if cmd == "trade":
        engine.run()
    elif cmd == "all":
        t = threading.Thread(target=engine.run, daemon=True)
        t.start()
        run_dashboard()
    else:
        raise SystemExit(__doc__)


if __name__ == "__main__":
    main()
