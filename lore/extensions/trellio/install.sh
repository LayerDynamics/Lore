#!/bin/bash
# Trellio Plugin Installer
# Installs Trellio commands as a Claude Code plugin

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

log()     { echo -e "${CYAN}[trellio]${NC} $1"; }
success() { echo -e "${GREEN}[trellio]${NC} $1"; }
error()   { echo -e "${RED}[trellio]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_SRC="$SCRIPT_DIR"
PLUGIN_DEST="$HOME/.claude/plugins/trellio"

echo ""
echo -e "${CYAN}Trellio - Plugin Installer${NC}"
echo -e "${DIM}Priority-based task management${NC}"
echo ""

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

# Ensure .claude-plugin directory exists
mkdir -p "$PLUGIN_DEST/.claude-plugin"

log ".claude-plugin marker verified"

# Summary
echo ""
success "Plugin installed successfully!"
echo ""
echo -e "${CYAN}Available commands (after restart):${NC}"
echo "  /trellio-board       — View board snapshot"
echo "  /trellio-add         — Add a new task"
echo "  /trellio-planning    — Daily planning workflow"
echo "  /trellio-cleanup     — Organize board"
echo "  /trellio-status      — Check task status"
echo "  /trellio-priority    — Get priority-matched tasks"
echo "  /trellio-recovery    — Task recovery workflow"
echo "  /trellio-weekly      — Weekly review and stats"
echo "  /trellio-backfill    — Codebase analysis and task backfill"
echo ""
echo -e "${CYAN}MCP Tools:${NC}"
echo "  All Trellio MCP tools remain available"
echo "  See MCP_TOOLS_REFERENCE.md for full list"
echo ""
echo -e "${CYAN}Configuration:${NC}"
echo "  - Set TRELLO_API_KEY and TRELLO_TOKEN in ~/.zshrc"
echo "  - Set TRELLO_BOARD_ID and list/label IDs"
echo "  - Priority-based task management"
echo ""
echo -e "${DIM}Restart Claude Code for commands to take effect.${NC}"
echo -e "${DIM}MCP tools work immediately without restart.${NC}"
echo ""
