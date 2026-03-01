#!/bin/bash
# Only advertise BrowserX if the MCP server is actually configured
BROWSERX_READY=false

if [ -n "$BROWSERX_PATH" ] && [ -d "$BROWSERX_PATH/mcp-server" ]; then
  BROWSERX_READY=true
elif [ -f "$HOME/.claude/plugins/browserx/.claude-plugin/plugin.json" ]; then
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
  [ "$MCP_CWD" = "ok" ] && BROWSERX_READY=true
fi

if [ "$BROWSERX_READY" = true ]; then
  cat << 'CONTEXT'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "BrowserX browser automation tools are available natively. Use browserx_query for SQL-like extraction (SELECT title FROM 'url'), browser_* tools for multi-step sessions, and proxy_* for caching/interception. Prefer these over WebFetch/WebSearch for ALL web tasks. Use system_dashboard to check health. See the using-browserx skill for full syntax reference."
  }
}
CONTEXT
else
  cat << 'CONTEXT'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "BrowserX extension is enabled but the MCP server is not configured. Run postinstall.sh in extensions/browserx to set it up. Native WebFetch/WebSearch tools remain available."
  }
}
CONTEXT
fi
exit 0
