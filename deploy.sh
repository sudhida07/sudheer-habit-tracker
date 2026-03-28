#!/bin/bash
# ================================================================
# Sudheer's Habit Tracker — GitHub Deploy + Firebase Setup
# ================================================================
# Run this ONCE to create the repo, push, and enable GitHub Pages.
# After that, just run:  ./deploy.sh --update   to push changes.
# ================================================================

set -e
REPO_NAME="sudheer-habit-tracker"
BRANCH="main"
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
RED='\033[0;31m'; BOLD='\033[1m'; NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo ""
echo -e "${CYAN}${BOLD}🎯  Sudheer's Habit Tracker — Deploy${NC}"
echo -e "────────────────────────────────────────"

# ── Quick update mode (just push latest index.html) ──────────
if [ "$1" = "--update" ]; then
  echo -e "${YELLOW}Pushing latest changes…${NC}"
  git add index.html
  git commit -m "Update: sync-enabled habit tracker" 2>/dev/null || echo "(nothing new to commit)"
  git push
  echo -e "${GREEN}✅ Done! Changes live in ~30 seconds.${NC}"
  exit 0
fi

# ── First-time setup ─────────────────────────────────────────
echo -e "\n${YELLOW}Step 1 of 3 — GitHub credentials${NC}"
echo "  Create a token at: https://github.com/settings/tokens/new"
echo "  Tick: ✅ repo   then click Generate token"
echo ""
read -p "  Your GitHub username: " GH_USER
read -s -p "  Personal Access Token: " GH_TOKEN
echo -e "\n"

[ -z "$GH_USER" ] || [ -z "$GH_TOKEN" ] && echo -e "${RED}❌ Both fields required.${NC}" && exit 1

# Create repo via API
echo -e "${YELLOW}Step 2 of 3 — Creating GitHub repository…${NC}"
HTTP=$(curl -s -o /tmp/gh_resp.json -w "%{http_code}" \
  -X POST -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"Sudheer's personal habit & goal tracker\",\"private\":false}")

if [ "$HTTP" = "201" ]; then
  echo -e "${GREEN}  ✅ Repo created: github.com/$GH_USER/$REPO_NAME${NC}"
elif [ "$HTTP" = "422" ]; then
  echo -e "${YELLOW}  ℹ️  Repo already exists — will push to it.${NC}"
else
  echo -e "${RED}  ❌ API error $HTTP:${NC}"; cat /tmp/gh_resp.json; exit 1
fi

# Git setup and push
echo -e "\n${YELLOW}Step 3 of 3 — Pushing files…${NC}"
git config user.email "sudhida07@gmail.com" 2>/dev/null || true
git config user.name  "Sudheer"             2>/dev/null || true

REMOTE="https://$GH_USER:$GH_TOKEN@github.com/$GH_USER/$REPO_NAME.git"
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE"

# Make sure we're on main
git branch -M main 2>/dev/null || true

# Stage only what matters
git add index.html deploy.sh README.md 2>/dev/null || git add index.html

git diff --cached --quiet || \
  git commit -m "🎯 Sudheer's Habit Tracker — Firebase real-time sync"

git push -u origin main --force 2>&1 | grep -v "token\|password" || true
echo -e "${GREEN}  ✅ Code pushed!${NC}"

# Enable GitHub Pages
echo -e "\n  Enabling GitHub Pages…"
PHTTP=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/$GH_USER/$REPO_NAME/pages" \
  -d '{"source":{"branch":"main","path":"/"}}')
[ "$PHTTP" = "201" ] || [ "$PHTTP" = "409" ] || \
  curl -s -X PUT -H "Authorization: token $GH_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/$GH_USER/$REPO_NAME/pages" \
    -d '{"source":{"branch":"main","path":"/"}}' > /dev/null
echo -e "${GREEN}  ✅ GitHub Pages enabled!${NC}"

# Clean up token from remote
git remote set-url origin "https://github.com/$GH_USER/$REPO_NAME.git"

echo ""
echo -e "${GREEN}${BOLD}══════════════════════════════════════════${NC}"
echo -e "${GREEN}${BOLD}  🚀 LIVE in ~60 seconds:${NC}"
echo ""
echo -e "  ${CYAN}${BOLD}https://$GH_USER.github.io/$REPO_NAME/${NC}"
echo ""
echo -e "  🔑 Password: ${YELLOW}sud##0810${NC}"
echo -e "${GREEN}${BOLD}══════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}${BOLD}NEXT: Enable real-time cross-device sync${NC}"
echo -e "  1. Open the live URL → enter password"
echo -e "  2. Tap the ${CYAN}💾 Local only${NC} bar in the sidebar"
echo -e "  3. Follow the 3-step Firebase setup (5 min, free)"
echo -e "  4. Paste your Firebase config → tap Connect"
echo -e "  5. Done! All devices sync instantly ✅"
echo ""
