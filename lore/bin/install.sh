#!/usr/bin/env bash
set -euo pipefail

# Lore Framework Installer
# Symlinks the lore plugin into ~/.claude/plugins/lore

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_DIR="$HOME/.claude/plugins/lore"

# --from-remote: called by the top-level install.sh after cloning
# Accepts an explicit source path as $2
if [ "${1:-}" = "--from-remote" ]; then
  if [ -n "${2:-}" ]; then
    PLUGIN_DIR="$2"
  fi
fi

echo "Lore Framework Installer"
echo "========================"
echo ""
echo "Plugin source: $PLUGIN_DIR"
echo "Install target: $TARGET_DIR"
echo ""

# Create plugins directory if it doesn't exist
mkdir -p "$HOME/.claude/plugins"

# Check if already installed
if [ -L "$TARGET_DIR" ]; then
  EXISTING=$(readlink "$TARGET_DIR")
  if [ "$EXISTING" = "$PLUGIN_DIR" ]; then
    echo "Lore is already installed and pointing to the correct location."
    exit 0
  else
    echo "Lore is installed but pointing to: $EXISTING"
    echo "Updating symlink to: $PLUGIN_DIR"
    rm "$TARGET_DIR"
  fi
elif [ -d "$TARGET_DIR" ]; then
  echo "ERROR: $TARGET_DIR exists as a directory (not a symlink)."
  echo "Please remove it first: rm -rf $TARGET_DIR"
  exit 1
fi

# Create symlink
ln -s "$PLUGIN_DIR" "$TARGET_DIR"

echo "Installed successfully!"
echo ""
echo "Lore is now available as a Claude Code plugin."
echo "Start a new Claude Code session and use /lore:list to see available skills."
