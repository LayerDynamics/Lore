#!/usr/bin/env bash
# findlazy Extension Postinstall
# Verifies Deno is available and caches dependencies.

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

log()     { echo -e "${CYAN}[findlazy]${NC} $1"; }
success() { echo -e "${GREEN}[findlazy]${NC} $1"; }
error()   { echo -e "${RED}[findlazy]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
log "findlazy Postinstall"
echo ""

# Check Deno
if ! command -v deno &>/dev/null; then
  error "Deno is not installed. findlazy requires Deno runtime."
  echo -e "${DIM}Install Deno: curl -fsSL https://deno.land/install.sh | sh${NC}"
  exit 1
fi
log "Deno found: $(deno --version | head -1)"

# Verify entry point
DENO_JSON="$SCRIPT_DIR/Deno.json"
if [ ! -f "$DENO_JSON" ] && [ ! -f "$SCRIPT_DIR/deno.json" ]; then
  error "No Deno.json or deno.json found"
  exit 1
fi
log "Deno config verified"

# Cache dependencies
log "Caching Deno dependencies..."
cd "$SCRIPT_DIR"
deno cache --reload deno.json 2>/dev/null || deno cache --reload Deno.json 2>/dev/null || log "Deno cache skipped (non-critical)"

echo ""
success "Postinstall complete."
echo -e "${DIM}MCP server: deno task mcp${NC}"
echo ""
