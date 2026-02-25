#!/usr/bin/env bash
# Lore SessionStart Hook
# Bootstraps the lore framework environment for each Claude Code session.

set -euo pipefail

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"

# ── Extension availability check ────────────────────────────────────
check_extension() {
  local name="$1"
  local dir="$PLUGIN_ROOT/extensions/$name"
  if [ -d "$dir/.claude-plugin" ]; then
    echo "  [OK] $name"
  else
    echo "  [--] $name (not installed)"
  fi
}

# ── Dependency check ────────────────────────────────────────────────
check_dependency() {
  local cmd="$1"
  local label="${2:-$cmd}"
  if command -v "$cmd" &>/dev/null; then
    return 0
  else
    echo "  [WARN] $label not found on PATH"
    return 1
  fi
}

# ── Gateway MCP server check ────────────────────────────────────────
GATEWAY="$PLUGIN_ROOT/mcp/lore/gateway.js"
if [ -f "$GATEWAY" ]; then
  GATEWAY_STATUS="available"
else
  GATEWAY_STATUS="missing"
fi

# ── BrowserX repo check ────────────────────────────────────────────
BROWSERX_DIR="$PLUGIN_ROOT/extensions/browserx"
BROWSERX_REPO=""
if [ -d "$BROWSERX_DIR/repo" ] && [ -f "$BROWSERX_DIR/repo/deno.json" ]; then
  BROWSERX_REPO="local"
elif [ -n "${BROWSERX_PATH:-}" ] && [ -d "$BROWSERX_PATH" ]; then
  BROWSERX_REPO="env"
fi

# ── Deftrello repo check ───────────────────────────────────────────
DEFTRELLO_DIR="$PLUGIN_ROOT/extensions/deftrello"
DEFTRELLO_REPO=""
if [ -d "$DEFTRELLO_DIR/repo" ] && [ -f "$DEFTRELLO_DIR/repo/package.json" ]; then
  DEFTRELLO_REPO="local"
fi

# ── Output session info ────────────────────────────────────────────
echo "Lore Framework v1.0.0"
echo ""
echo "Extensions:"
check_extension "browserx"
check_extension "cc-telemetry"
check_extension "deftrello"
check_extension "findlazy"
check_extension "mcp-trigger-gateway"
echo ""

echo "Gateway MCP: $GATEWAY_STATUS"

if [ "$BROWSERX_REPO" = "local" ]; then
  echo "BrowserX repo: cloned locally"
elif [ "$BROWSERX_REPO" = "env" ]; then
  echo "BrowserX repo: \$BROWSERX_PATH ($BROWSERX_PATH)"
else
  echo "BrowserX repo: not available (run postinstall.sh in extensions/browserx)"
fi

if [ "$DEFTRELLO_REPO" = "local" ]; then
  echo "Deftrello repo: cloned locally"
else
  echo "Deftrello repo: not available (run postinstall.sh in extensions/deftrello)"
fi

echo ""
echo "Use /lore:list to see available skills, commands, and agents."
