#!/usr/bin/env bash
# Run the app without worrying about activating the virtual environment.
#   bash start.sh demo    bash start.sh auth    bash start.sh all
set -e
cd "$(dirname "$0")"

if [ ! -x .venv/bin/python ]; then
  echo "No virtual environment yet — run this first:"
  echo "    bash setup.sh"
  exit 1
fi

exec ./.venv/bin/python run.py "${1:-demo}"
