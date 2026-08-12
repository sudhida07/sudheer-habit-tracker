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
from urllib.parse import parse_qs, urlparse

from fyers_apiv3 import fyersModel

from .config import DATA_DIR, Settings

TOKEN_FILE = DATA_DIR / "fyers_token.json"


def extract_auth_code(pasted: str) -> str:
    """Accept either the bare auth_code or the whole redirect URL.

    The redirect lands on a dead port, so the browser shows an error page and the
    only copyable thing is the address bar. Picking the code out of that by hand
    means selecting a ~600-character JWT between two query parameters, so take the
    URL as-is and pull the code out here instead.
    """
    pasted = pasted.strip().strip('"').strip("'")
    if "auth_code=" in pasted:
        query = urlparse(pasted).query or pasted.split("?", 1)[-1]
        codes = parse_qs(query).get("auth_code")
        if not codes or not codes[0]:
            raise SystemExit("\nFound 'auth_code=' in that, but no value after it. "
                             "Copy the whole URL again.\n")
        pasted = codes[0]

    # An auth_code is a JWT: three dot-separated segments. Checking here turns a
    # mis-paste into one clear line instead of an opaque token-exchange failure.
    parts = pasted.split(".")
    if len(parts) != 3 or not all(parts) or len(pasted) < 100:
        preview = pasted[:60] + ("…" if len(pasted) > 60 else "")
        raise SystemExit(
            f"\nThat is not an auth_code. It should be a long token with two dots "
            f"in it.\n\nYou pasted ({len(pasted)} chars):\n  {preview or '(nothing)'}\n\n"
            "Copy the URL from your browser's address bar after logging in to Fyers —\n"
            "click the address bar, Cmd+A, Cmd+C — and paste that here.\n"
            "Do not paste Terminal commands at this prompt.\n"
        )
    return pasted


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
        "\n2. Fyers then redirects to your redirect URI. That page will fail to load —\n"
        "   that is expected, nothing is running there. Click the address bar,\n"
        "   select the whole URL (Cmd+A), copy it (Cmd+C), and paste it below.\n"
        "   Pasting just the auth_code works too.\n"
    )
    auth_code = extract_auth_code(input("Paste the URL (or auth_code) here: "))
    print(f"\nUsing auth_code {auth_code[:12]}…{auth_code[-8:]} ({len(auth_code)} chars)")

    session.set_token(auth_code)
    resp = session.generate_token()
    if resp.get("s") != "ok" or "access_token" not in resp:
        raise SystemExit(
            f"\nFyers rejected the code: {resp.get('message') or resp}\n\n"
            "Usual causes:\n"
            "  · the code was already used — each one works once, so log in again\n"
            "  · more than a few minutes passed between login and pasting\n"
            f"  · FYERS_REDIRECT_URI in .env ({settings.fyers_redirect_uri}) differs\n"
            "    from the redirect URI registered at myapi.fyers.in\n"
        )

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
