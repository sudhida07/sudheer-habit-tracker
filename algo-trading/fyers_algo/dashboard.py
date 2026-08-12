"""Flask dashboard: live P&L, equity curve, trades, engine status."""

import socket

from flask import Flask, jsonify, render_template

from . import store
from .config import load_settings
from .state import build_state

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("dashboard.html")


@app.route("/api/state")
def state():
    settings = load_settings()
    store.init_db()
    return jsonify(build_state(settings))


def lan_ip():
    """This machine's address on the local network, so phones/tablets can connect."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))   # no packets sent — just picks the outbound interface
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


def run_dashboard(host="0.0.0.0", port=5050):
    # Bind all interfaces by default so other devices on the same Wi-Fi can view it.
    print("\n  Dashboard ready:")
    print(f"    on this computer   http://127.0.0.1:{port}")
    ip = lan_ip()
    if ip:
        print(f"    on your iPad/phone http://{ip}:{port}   (same Wi-Fi network)")
    print("\n  Leave this window open. Press Ctrl+C to stop.\n")
    app.run(host=host, port=port, debug=False)
