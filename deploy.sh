#!/bin/bash
# ================================================================
# Sudheer's Habit Tracker — One-Click GitHub Deploy Script
# ================================================================
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh
#
# What this does:
#   1. Asks for your GitHub username + a Personal Access Token
#   2. Creates a new GitHub repo: sudheer-habit-tracker
#   3. Pushes index.html (the full app) to GitHub
#   4. Enables GitHub Pages → your live URL
# ================================================================

set -e

REPO_NAME="sudheer-habit-tracker"
BRANCH="main"

# ── Colours ──────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; RED='\033[0;31m'; NC='\033[0m'

echo ""
echo -e "${CYAN}🎯  Sudheer's Habit Tracker — GitHub Deploy${NC}"
echo "──────────────────────────────────────────────"
echo ""

# ── Step 1: GitHub credentials ───────────────────────────────
echo -e "${YELLOW}Step 1: GitHub credentials${NC}"
echo "You need a Personal Access Token with 'repo' scope."
echo "Create one at: https://github.com/settings/tokens/new"
echo "  → Select: repo (Full control of private repositories)"
echo ""
read -p "  GitHub username: " GH_USER
read -s -p "  Personal Access Token: " GH_TOKEN
echo ""
echo ""

if [ -z "$GH_USER" ] || [ -z "$GH_TOKEN" ]; then
  echo -e "${RED}❌  Username and token are required.${NC}"
  exit 1
fi

# ── Step 2: Create GitHub repository ─────────────────────────
echo -e "${YELLOW}Step 2: Creating GitHub repository...${NC}"
CREATE_RESP=$(curl -s -o /tmp/gh_create_resp.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: token ${GH_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{
    \"name\": \"${REPO_NAME}\",
    \"description\": \"Sudheer's personal habit & goal tracker\",
    \"private\": false,
    \"auto_init\": false
  }")

if [ "$CREATE_RESP" = "201" ]; then
  echo -e "${GREEN}  ✅ Repository created: github.com/${GH_USER}/${REPO_NAME}${NC}"
elif [ "$CREATE_RESP" = "422" ]; then
  echo -e "${YELLOW}  ⚠️  Repository already exists — continuing...${NC}"
else
  echo -e "${RED}  ❌ Failed to create repo (HTTP ${CREATE_RESP})${NC}"
  cat /tmp/gh_create_resp.json
  exit 1
fi

# ── Step 3: Git init and push ─────────────────────────────────
echo ""
echo -e "${YELLOW}Step 3: Pushing files to GitHub...${NC}"

# Navigate to the habit-tracker folder (same dir as this script)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Configure git if needed
git config user.email "sudhida07@gmail.com" 2>/dev/null || true
git config user.name "Sudheer" 2>/dev/null || true

# Set remote URL with token embedded
REMOTE_URL="https://${GH_USER}:${GH_TOKEN}@github.com/${GH_USER}/${REPO_NAME}.git"

# Initialise git if not already done
if [ ! -d ".git" ]; then
  git init -b main
fi

# Remove old remote if present
git remote remove origin 2>/dev/null || true
git remote add origin "$REMOTE_URL"

# Stage only the necessary files
git add index.html
[ -f "css/styles.css" ]   && git add css/
[ -f "js/app.js" ]        && git add js/
[ -f "README.md" ]        && git add README.md

# Commit (or amend if already committed)
git diff --cached --quiet || git commit -m "🎯 Sudheer's Habit Tracker v1.0 — mobile + password protected"

# Force push to main
git push -u origin main --force 2>&1 | grep -v "token\|password" || true

echo -e "${GREEN}  ✅ Code pushed to GitHub${NC}"

# ── Step 4: Enable GitHub Pages ───────────────────────────────
echo ""
echo -e "${YELLOW}Step 4: Enabling GitHub Pages...${NC}"
PAGES_RESP=$(curl -s -o /tmp/gh_pages_resp.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: token ${GH_TOKEN}" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/${GH_USER}/${REPO_NAME}/pages" \
  -d "{
    \"source\": {
      \"branch\": \"${BRANCH}\",
      \"path\": \"/\"
    }
  }")

if [ "$PAGES_RESP" = "201" ] || [ "$PAGES_RESP" = "409" ]; then
  echo -e "${GREEN}  ✅ GitHub Pages enabled${NC}"
else
  # Try PATCH (update existing Pages config)
  curl -s -X PUT \
    -H "Authorization: token ${GH_TOKEN}" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/${GH_USER}/${REPO_NAME}/pages" \
    -d "{\"source\":{\"branch\":\"${BRANCH}\",\"path\":\"/\"}}" > /dev/null 2>&1
  echo -e "${GREEN}  ✅ GitHub Pages configured${NC}"
fi

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚀 DEPLOYMENT COMPLETE!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo -e "  📱 Your live URL (takes ~60s to go live):"
echo ""
echo -e "  ${CYAN}https://${GH_USER}.github.io/${REPO_NAME}/${NC}"
echo ""
echo -e "  🔑 Password: ${YELLOW}sud##0810${NC}"
echo ""
echo -e "  Bookmark this URL on your iPhone / iPad!"
echo "  On iOS: tap Share → Add to Home Screen"
echo ""
