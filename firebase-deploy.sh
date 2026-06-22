#!/bin/bash
# ================================================================
# Sudheer's Habit Tracker — Firebase Hosting Deploy
# ================================================================
# One-time:  npm install -g firebase-tools  &&  firebase login
# Then just: ./firebase-deploy.sh
# ================================================================
set -e

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${CYAN}🎯  Deploying Habit Tracker to Firebase Hosting…${NC}"

# Use a global 'firebase' if present, otherwise fall back to npx
# (avoids needing a global install / sudo).
if command -v firebase >/dev/null 2>&1; then
  FIREBASE="firebase"
else
  echo -e "${YELLOW}Firebase CLI not installed globally — using 'npx firebase-tools'.${NC}"
  FIREBASE="npx -y firebase-tools"
fi

# Ensure we are logged in
if ! $FIREBASE projects:list >/dev/null 2>&1; then
  echo -e "${YELLOW}Not logged in. Running login…${NC}"
  $FIREBASE login
fi

$FIREBASE deploy --only hosting --project sudheer-habit-tracker

echo -e "${GREEN}✅ Live at: https://sudheer-habit-tracker.web.app${NC}"
