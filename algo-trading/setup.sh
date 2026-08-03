#!/usr/bin/env bash
# One-time setup. Run:  bash setup.sh
set -e
cd "$(dirname "$0")"

echo "==> Looking for Python 3"
if command -v python3 >/dev/null 2>&1; then
  PY=python3
else
  echo "Python 3 is not installed."
  echo "Install it from https://www.python.org/downloads/ (or run: brew install python3)"
  echo "then run this script again."
  exit 1
fi
echo "    found $($PY --version)"

echo "==> Creating virtual environment (.venv)"
$PY -m venv .venv

echo "==> Installing dependencies (this takes a minute)"
./.venv/bin/pip install --quiet --upgrade pip
./.venv/bin/pip install --quiet -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> Created .env — add your keys before live/paper trading"
fi

cat <<'EOF'

  Setup complete.

  See the dashboard right now (no API keys needed):

      bash start.sh demo

  When you have your Fyers keys, put them in .env, then:

      bash start.sh auth     # once each morning
      bash start.sh all      # engine + dashboard

EOF
