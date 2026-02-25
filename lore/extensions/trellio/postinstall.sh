#!/usr/bin/env bash
# Trellio Extension Postinstall
# Clones the trellio repo locally so its code is available for the plugin.

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

log()     { echo -e "${CYAN}[trellio]${NC} $1"; }
success() { echo -e "${GREEN}[trellio]${NC} $1"; }
error()   { echo -e "${RED}[trellio]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$SCRIPT_DIR/repo"
REPO_URL="https://github.com/LayerDynamics/trellio.git"

echo ""
log "Trellio Postinstall"
echo ""

# Skip if already cloned
if [ -d "$REPO_DIR" ] && [ -f "$REPO_DIR/package.json" ]; then
  log "Repo already cloned at $REPO_DIR"

  # Pull latest
  log "Pulling latest changes..."
  cd "$REPO_DIR"
  git pull --ff-only 2>/dev/null || log "Could not fast-forward (may have local changes)"
  cd "$SCRIPT_DIR"

  success "Trellio repo up to date."
  exit 0
fi

# Check for git
if ! command -v git &>/dev/null; then
  error "git is not installed. Cannot clone trellio repo."
  exit 1
fi

# Clone
log "Cloning trellio from $REPO_URL..."
git clone --depth 1 "$REPO_URL" "$REPO_DIR"

# Verify
if [ -f "$REPO_DIR/package.json" ]; then
  success "Trellio repo cloned successfully."
else
  error "Clone succeeded but package.json not found."
  exit 1
fi

# Install npm deps if node is available
if command -v npm &>/dev/null; then
  log "Installing npm dependencies..."
  cd "$REPO_DIR"
  npm install --production 2>/dev/null || log "npm install skipped (non-critical)"
  cd "$SCRIPT_DIR"
fi

echo ""
success "Postinstall complete."
echo -e "${DIM}Trellio code is now available at: $REPO_DIR${NC}"
echo ""
