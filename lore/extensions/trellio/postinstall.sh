#!/usr/bin/env bash
# Trellio Extension Postinstall
# Links to the local trellio source and builds the MCP server.

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

# Find the trellio source — check common locations
TRELLIO_SOURCES=(
  "$SCRIPT_DIR/../../../external/trellio"
  "$HOME/lore/external/trellio"
  "$HOME/trellio"
)

TRELLIO_SRC=""
for src in "${TRELLIO_SOURCES[@]}"; do
  if [ -d "$src/mcp-server" ]; then
    TRELLIO_SRC="$(cd "$src" && pwd)"
    break
  fi
done

echo ""
log "Trellio Postinstall"
echo ""

if [ -z "$TRELLIO_SRC" ]; then
  # Fallback: try cloning from GitHub
  REPO_URL="https://github.com/LayerDynamics/trellio.git"
  if [ -d "$REPO_DIR" ] && [ -d "$REPO_DIR/mcp-server" ]; then
    log "Repo already at $REPO_DIR"
    success "Trellio ready."
    exit 0
  fi

  log "No local source found. Cloning from $REPO_URL..."
  git clone --depth 1 "$REPO_URL" "$REPO_DIR" 2>/dev/null || {
    error "Could not clone trellio. Place source at external/trellio in the lore repo."
    exit 1
  }
  TRELLIO_SRC="$REPO_DIR"
fi

# Build MCP server if needed
if [ -d "$TRELLIO_SRC/mcp-server" ]; then
  cd "$TRELLIO_SRC/mcp-server"

  if [ ! -d "node_modules" ]; then
    log "Installing npm dependencies..."
    npm install 2>/dev/null || log "npm install skipped (non-critical)"
  fi

  if [ ! -f "dist/index.js" ]; then
    log "Building MCP server..."
    npm run build 2>/dev/null || log "Build skipped (run manually: cd mcp-server && npm run build)"
  fi
fi

echo ""
success "Postinstall complete."
echo -e "${DIM}Trellio source: $TRELLIO_SRC${NC}"
echo ""
