#!/bin/bash

# Test MCP Trigger Gateway Connection
# This sends a test request to the MCP server

echo "Testing MCP Trigger Gateway Connection..."
echo "=========================================="
echo ""

NODE_BIN="$(which node)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MCP_SERVER="$SCRIPT_DIR/dist/index.js"

# Test: List available tools
echo "Test 1: Listing available tools..."
echo ""

# Send ListTools request via JSON-RPC over stdio
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}' | $NODE_BIN $MCP_SERVER 2>/dev/null | jq '.'

echo ""
echo "✅ If you see a JSON response with tools array, the MCP server is working!"
echo ""
