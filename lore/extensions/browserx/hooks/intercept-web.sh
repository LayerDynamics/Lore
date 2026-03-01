#!/bin/bash
# Read tool input from stdin
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

if [ "$TOOL_NAME" = "WebFetch" ] || [ "$TOOL_NAME" = "WebSearch" ]; then
  # Only block if BrowserX MCP server is actually configured and available
  BROWSERX_AVAILABLE=false

  # Check if BrowserX MCP entry point exists via BROWSERX_PATH or common locations
  if [ -n "$BROWSERX_PATH" ] && [ -d "$BROWSERX_PATH/mcp-server" ]; then
    BROWSERX_AVAILABLE=true
  elif [ -f "$HOME/.claude/plugins/browserx/.claude-plugin/plugin.json" ]; then
    # Plugin installed — verify the MCP server source is reachable
    MCP_CWD=$(python3 -c "
import json, os
try:
    p = os.path.expanduser('~/.claude/plugins/browserx/.claude-plugin/plugin.json')
    cfg = json.load(open(p))
    cwd = cfg.get('mcpServers', {}).get('browserx', {}).get('cwd', '')
    if cwd and os.path.isdir(cwd) and os.path.isdir(os.path.join(cwd, 'mcp-server')):
        print('ok')
except: pass
" 2>/dev/null)
    [ "$MCP_CWD" = "ok" ] && BROWSERX_AVAILABLE=true
  fi

  if [ "$BROWSERX_AVAILABLE" = true ]; then
    echo "BrowserX is available — use browserx_query or browser_navigate instead of ${TOOL_NAME}. Example: browserx_query(\"SELECT title FROM 'https://example.com'\") for extraction, or browser_navigate for interactive sessions." >&2
    exit 2
  fi

  # BrowserX not configured — allow native web tools to pass through
  exit 0
fi

exit 0
