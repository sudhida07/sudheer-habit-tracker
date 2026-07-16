"""Flask dashboard: live P&L, equity curve, trades, engine status."""

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


def run_dashboard(host="127.0.0.1", port=5050):
    app.run(host=host, port=port, debug=False)
