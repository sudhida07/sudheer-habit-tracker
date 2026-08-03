"""Fyers API v3 login flow (Individual App).

Fyers uses OAuth-style auth: you open a login URL in the browser, log in,
Fyers redirects to your redirect URI with an `auth_code`, and that code is
exchanged for an access token. Access tokens are valid until end of day, so
run `python3 run.py auth` once every morning before starting the engine.

Docs: https://myapi.fyers.in/docsv3#tag/App-Creation/Individual-Apps
"""

import json
import time
import webbrowser
from pathlib import Path

from fyers_apiv3 import fyersModel

from .config import DATA_DIR, Settings

TOKEN_FILE = DATA_DIR / "fyers_token.json"


def login(settings: Settings) -> str:
    """Interactive login: prints the auth URL, asks for the auth_code, saves the token."""
    session = fyersModel.SessionModel(
        client_id=settings.fyers_client_id,
        secret_key=settings.fyers_secret_key,
        redirect_uri=settings.fyers_redirect_uri,
        response_type="code",
        grant_type="authorization_code",
    )
    url = session.generate_authcode()
    print("\n1. Open this URL, log in to Fyers and approve the app:\n")
    print(url)
    try:
        webbrowser.open(url)
    except Exception:
        pass
    print(
        "\n2. After login you are redirected to your redirect URI. "
        "Copy the value of `auth_code` from that URL.\n"
    )
    auth_code = input("Paste auth_code here: ").strip()

    session.set_token(auth_code)
    resp = session.generate_token()
    if resp.get("s") != "ok" or "access_token" not in resp:
        raise RuntimeError(f"Token exchange failed: {resp}")

    token = resp["access_token"]
    TOKEN_FILE.write_text(json.dumps({"access_token": token, "created_at": time.time()}))
    print("\nAccess token saved to", TOKEN_FILE)
    return token


def load_token() -> str | None:
    """Return the saved access token, or None if missing/stale (>20h old)."""
    if not TOKEN_FILE.exists():
        return None
    data = json.loads(TOKEN_FILE.read_text())
    if time.time() - data.get("created_at", 0) > 20 * 3600:
        return None
    return data.get("access_token")


def get_fyers(settings: Settings) -> fyersModel.FyersModel:
    token = load_token()
    if not token:
        raise RuntimeError(
            "No valid Fyers access token. Run `python3 run.py auth` first "
            "(tokens expire daily)."
        )
    return fyersModel.FyersModel(
        client_id=settings.fyers_client_id,
        token=token,
        is_async=False,
        log_path=str(DATA_DIR),
    )
