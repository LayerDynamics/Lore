#!/bin/bash
# Setup DefTrello and mcp-cron globally for all projects

set -euo pipefail

echo "🌍 Setting up global MCP servers for all projects..."
echo ""

# Add DefTrello with user scope
echo "1️⃣  Adding DefTrello (user scope)..."
claude mcp add --scope user --transport stdio \
  -e TRELLO_API_KEY=0dc5c20c01cbb71d719023008d47bc35 \
  -e TRELLO_TOKEN=ATTAe7aae5ae18674378301bed921abe19bb6c50db693bc3c5f4facf1db6d125a3f2ED297C5A \
  -e TRELLO_BOARD_ID=6990b65be83d956ca32f0d1d \
  -e TRELLO_LIST_REFERENCE_ID=6990b65c343dfb593fc62c0d \
  -e TRELLO_LIST_THIS_WEEK_ID=6990b65c7cb1d4ede48af1e9 \
  -e TRELLO_LIST_TODAY_ID=6990b65cadae998adf6d4e49 \
  -e TRELLO_LIST_DOING_ID=6990b65d7119180cee37575a \
  -e TRELLO_LIST_DONE_ID=6990b65d4352af25bc18b0fd \
  -e TRELLO_LABEL_HIGH_ENERGY_ID=6990b66021a3e23a12d74e63 \
  -e TRELLO_LABEL_MEDIUM_ENERGY_ID=6990b660d0e6dddef3d23a9b \
  -e TRELLO_LABEL_LOW_ENERGY_ID=6990b6615effaf4d4535148b \
  -e TRELLO_LABEL_BRAIN_DEAD_ID=6990b6611c9a6c0cf812c0a4 \
  -e TRELLO_LABEL_DUE_SOON_ID=6990b661423213395d051dd8 \
  -e N8N_BASE_URL=https://n8n.ddtool.tech \
  -e N8N_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0ZDM1YjM1OC1hMmE2LTRmZGYtOWY5OC1lYTRhNTViMDliOWYiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwianRpIjoiMDE2ZGMxZjMtNTA0Ni00YzE1LTgwYzEtMGVlZjFiYWE2N2FmIiwiaWF0IjoxNzcxMTc2MjUyfQ.WMdjMG9Ompck3QuG6Sq-ceusQI7vyqmSVw8N11XHDYQ \
  -e PROJECT_DIR=/Users/ryanoboyle/deftrello \
  deftrello -- /Users/ryanoboyle/.asdf/shims/node /Users/ryanoboyle/deftrello/mcp-server/dist/index.js

echo "✅ DefTrello added"
echo ""

# Add mcp-cron with user scope
echo "2️⃣  Adding mcp-cron (user scope)..."
claude mcp add --scope user --transport stdio \
  mcp-cron -- npx -y mcp-cron -transport stdio -db-path /Users/ryanoboyle/.claude/mcp-cron/tasks.db

echo "✅ mcp-cron added"
echo ""

echo "🎉 Setup complete!"
echo ""
echo "These servers are now available in ALL directories:"
echo "  ✅ deftrello"
echo "  ✅ mcp-cron"
echo ""
echo "Test it:"
echo "  1. cd ~/defcad_dash"
echo "  2. claude"
echo "  3. Ask: 'List my Trello board snapshot'"
echo ""
