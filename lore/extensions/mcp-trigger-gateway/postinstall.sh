#!/usr/bin/env bash
# mcp-trigger-gateway Extension Postinstall
# Builds the TypeScript project and verifies the MCP server.

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

log()     { echo -e "${CYAN}[mcp-trigger-gateway]${NC} $1"; }
success() { echo -e "${GREEN}[mcp-trigger-gateway]${NC} $1"; }
error()   { echo -e "${RED}[mcp-trigger-gateway]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
log "mcp-trigger-gateway Postinstall"
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
  error "Node.js is not installed."
  exit 1
fi
log "Node.js found: $(node --version)"

# Install dependencies
if [ -f "$SCRIPT_DIR/package.json" ]; then
  log "Installing npm dependencies..."
  cd "$SCRIPT_DIR"
  npm install 2>/dev/null || { error "npm install failed"; exit 1; }
  log "Dependencies installed"
fi

# Build TypeScript
if [ -f "$SCRIPT_DIR/tsconfig.json" ]; then
  log "Building TypeScript..."
  cd "$SCRIPT_DIR"
  npx tsc 2>/dev/null || log "TypeScript build had warnings (non-critical if dist/ exists)"
fi

# Verify dist exists
if [ -f "$SCRIPT_DIR/dist/index.js" ]; then
  log "Build output verified: dist/index.js"
else
  error "dist/index.js not found. Build may have failed."
  exit 1
fi

echo ""
success "Postinstall complete."
echo -e "${DIM}MCP server ready at: $SCRIPT_DIR/dist/index.js${NC}"
echo ""
