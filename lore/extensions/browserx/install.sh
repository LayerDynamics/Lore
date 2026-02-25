#!/bin/bash
# BrowserX Claude Code Plugin Installer
# Usage: deno task mcp:install-plugin
#   or:  ./browserx-claude-plugin/install.sh

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

log()     { echo -e "${CYAN}[browserx]${NC} $1"; }
success() { echo -e "${GREEN}[browserx]${NC} $1"; }
error()   { echo -e "${RED}[browserx]${NC} $1"; }

# Resolve paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_SRC="$SCRIPT_DIR"
PLUGIN_DEST="$HOME/.claude/plugins/browserx"

# Parse --path flag
BROWSERX_ROOT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --path)
      BROWSERX_ROOT="$2"
      shift 2
      ;;
    *)
      shift
      ;;
  esac
done

# Detection cascade
detect_browserx() {
  # 1. --path flag (already handled above)
  if [ -n "$BROWSERX_ROOT" ]; then
    return
  fi

  # 2. BROWSERX_PATH env var
  if [ -n "$BROWSERX_PATH" ]; then
    BROWSERX_ROOT="$BROWSERX_PATH"
    return
  fi

  # 3. which browserx
  if command -v browserx &>/dev/null; then
    local bin_path
    bin_path="$(command -v browserx)"
    local candidate
    candidate="$(cd "$(dirname "$bin_path")/.." && pwd)"
    if [ -f "$candidate/deno.json" ] && [ -d "$candidate/mcp-server" ]; then
      BROWSERX_ROOT="$candidate"
      return
    fi
  fi

  # 4. npm root -g
  if command -v npm &>/dev/null; then
    local npm_root
    npm_root="$(npm root -g 2>/dev/null)"
    local candidate="$npm_root/browserx"
    if [ -f "$candidate/deno.json" ] && [ -d "$candidate/mcp-server" ]; then
      BROWSERX_ROOT="$candidate"
      return
    fi
  fi

  # 5. Hardcoded fallback paths
  local candidates=(
    "$(cd "$SCRIPT_DIR/.." 2>/dev/null && pwd)"
    "$HOME/BrowserX"
    "$HOME/Projects/BrowserX"
    "$HOME/src/BrowserX"
    "$HOME/code/BrowserX"
  )
  for candidate in "${candidates[@]}"; do
    if [ -f "$candidate/deno.json" ] && [ -d "$candidate/mcp-server" ]; then
      BROWSERX_ROOT="$candidate"
      return
    fi
  done
}

detect_browserx

echo ""
echo -e "${CYAN} ____                                     __  __"
echo -e "| __ ) _ __ _____      _____  ___ _ __  \\ \\/ /"
echo -e "|  _ \\| '__/ _ \\ \\ /\\ / / __|/ _ \\ '__|  \\  /"
echo -e "| |_) | | | (_) \\ V  V /\\__ \\  __/ |     /  \\"
echo -e "|____/|_|  \\___/ \\_/\\_/ |___/\\___|_|    /_/\\_\\${NC}"
echo -e "  ${DIM}Claude Code Plugin Installer${NC}"
echo ""

# Validate BrowserX repo
if [ -z "$BROWSERX_ROOT" ] || [ ! -f "$BROWSERX_ROOT/deno.json" ] || [ ! -d "$BROWSERX_ROOT/mcp-server" ]; then
  error "Could not find BrowserX repository."
  echo ""
  echo -e "${CYAN}To fix this, do one of the following:${NC}"
  echo ""
  echo "  1. Pass the path explicitly:"
  echo "     ./install.sh --path /path/to/BrowserX"
  echo ""
  echo "  2. Set the BROWSERX_PATH environment variable:"
  echo "     export BROWSERX_PATH=/path/to/BrowserX"
  echo ""
  echo "  3. Ensure 'browserx' is on your PATH"
  echo ""
  echo -e "${DIM}The BrowserX directory must contain deno.json and an mcp-server/ folder.${NC}"
  exit 1
fi

log "BrowserX repo: $BROWSERX_ROOT"

# Create plugin directory
mkdir -p "$HOME/.claude/plugins"

# Remove existing installation
if [ -d "$PLUGIN_DEST" ]; then
  log "Removing existing plugin installation..."
  rm -rf "$PLUGIN_DEST"
fi

# Copy plugin files
log "Installing plugin to $PLUGIN_DEST..."
cp -r "$PLUGIN_SRC" "$PLUGIN_DEST"

# Generate .mcp.json with stdio transport pointing at this repo
cat > "$PLUGIN_DEST/.mcp.json" << EOF
{
  "browserx": {
    "type": "stdio",
    "command": "deno",
    "args": ["task", "mcp:start"],
    "cwd": "$BROWSERX_ROOT"
  }
}
EOF

log "MCP config generated (stdio → $BROWSERX_ROOT)"

# Clean up old standalone skill if it exists
OLD_SKILL="$HOME/.claude/skills/using-browserx"
if [ -d "$OLD_SKILL" ]; then
  rm -rf "$OLD_SKILL"
  log "Removed old standalone skill at ~/.claude/skills/using-browserx/"
fi

# Summary
echo ""
success "Plugin installed successfully!"
echo ""
echo -e "${CYAN}Available commands:${NC}"
echo "  /browse <url>      — Navigate and extract content"
echo "  /screenshot <url>  — Take a screenshot"
echo "  /query <sql>       — Run a BrowserX SQL-like query"
echo ""
echo -e "${CYAN}What's configured:${NC}"
echo "  - BrowserX MCP tools auto-load (no ToolSearch needed)"
echo "  - WebFetch/WebSearch redirected to BrowserX"
echo "  - Session start injects BrowserX context"
echo "  - Full syntax guide via 'using-browserx' skill"
echo ""
echo -e "${DIM}Restart Claude Code for changes to take effect.${NC}"
