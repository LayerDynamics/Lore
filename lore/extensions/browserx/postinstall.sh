#!/usr/bin/env bash
# BrowserX Extension Postinstall
# Clones the BrowserX repo locally so its code is available for the plugin.

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

log()     { echo -e "${CYAN}[browserx]${NC} $1"; }
success() { echo -e "${GREEN}[browserx]${NC} $1"; }
error()   { echo -e "${RED}[browserx]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$SCRIPT_DIR/repo"
REPO_URL="https://github.com/LayerDynamics/BrowserX.git"

echo ""
log "BrowserX Postinstall"
echo ""

# Skip if already cloned
if [ -d "$REPO_DIR" ] && [ -f "$REPO_DIR/deno.json" ]; then
  log "Repo already cloned at $REPO_DIR"

  # Pull latest
  log "Pulling latest changes..."
  cd "$REPO_DIR"
  git pull --ff-only 2>/dev/null || log "Could not fast-forward (may have local changes)"
  cd "$SCRIPT_DIR"

  success "BrowserX repo up to date."
  exit 0
fi

# Check for git
if ! command -v git &>/dev/null; then
  error "git is not installed. Cannot clone BrowserX repo."
  exit 1
fi

# Clone
log "Cloning BrowserX from $REPO_URL..."
git clone --depth 1 "$REPO_URL" "$REPO_DIR"

# Verify
if [ -f "$REPO_DIR/deno.json" ] && [ -d "$REPO_DIR/mcp-server" ]; then
  success "BrowserX repo cloned successfully."
else
  error "Clone succeeded but expected files not found."
  exit 1
fi

# Install deps if deno is available
if command -v deno &>/dev/null; then
  log "Caching Deno dependencies..."
  cd "$REPO_DIR"
  deno cache --reload deno.json 2>/dev/null || log "Deno cache skipped (non-critical)"
  cd "$SCRIPT_DIR"
fi

# Update .mcp.json to point at local repo
MCP_CONFIG="$SCRIPT_DIR/.mcp.json"
cat > "$MCP_CONFIG" << EOF
{
  "mcpServers": {
    "browserx": {
      "command": "deno",
      "args": ["task", "mcp:start"],
      "cwd": "$REPO_DIR"
    }
  }
}
EOF
log "Updated .mcp.json to point at local repo"

echo ""
success "Postinstall complete."
echo -e "${DIM}BrowserX code is now available at: $REPO_DIR${NC}"
echo ""
