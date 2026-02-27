#!/usr/bin/env bash
set -euo pipefail

# Lore Framework Installer
# Copies plugin into ~/.claude/plugins/cache/local/lore/<version>/
# and registers it in ~/.claude/settings.json under enabledPlugins.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# --from-remote: called by the top-level install.sh after cloning
# Accepts an explicit source path as $2
if [ "${1:-}" = "--from-remote" ]; then
  if [ -n "${2:-}" ]; then
    PLUGIN_DIR="$2"
  fi
fi

# Read version from plugin.json
VERSION=$(python3 -c "import json; print(json.load(open('$PLUGIN_DIR/.claude-plugin/plugin.json'))['version'])" 2>/dev/null || echo "unknown")

CACHE_DIR="$HOME/.claude/plugins/cache/local/lore/$VERSION"
SETTINGS_FILE="$HOME/.claude/settings.json"

echo "Lore Framework Installer"
echo "========================"
echo ""
echo "Plugin source: $PLUGIN_DIR"
echo "Plugin version: $VERSION"
echo "Cache target: $CACHE_DIR"
echo ""

# ── Remove legacy symlink if present ──────────────────────────────
LEGACY_SYMLINK="$HOME/.claude/plugins/lore"
if [ -L "$LEGACY_SYMLINK" ]; then
  echo "Removing legacy symlink: $LEGACY_SYMLINK"
  rm "$LEGACY_SYMLINK"
fi

# ── Copy plugin into cache ────────────────────────────────────────
mkdir -p "$CACHE_DIR"

# Clean previous install at this version
if [ -d "$CACHE_DIR" ]; then
  rm -rf "$CACHE_DIR"
  mkdir -p "$CACHE_DIR"
fi

# Copy plugin files (exclude dev-only dirs)
rsync -a \
  --exclude='.git' \
  --exclude='tests' \
  --exclude='node_modules' \
  "$PLUGIN_DIR/" "$CACHE_DIR/"

echo "Copied plugin to cache."

# ── Register in enabledPlugins ────────────────────────────────────
if [ -f "$SETTINGS_FILE" ]; then
  # Check if already registered
  if python3 -c "
import json, sys
with open('$SETTINGS_FILE') as f:
    settings = json.load(f)
plugins = settings.get('enabledPlugins', {})
if plugins.get('lore@local') is True:
    sys.exit(0)
else:
    sys.exit(1)
" 2>/dev/null; then
    echo "Already registered in enabledPlugins."
  else
    # Add lore@local: true
    python3 -c "
import json
with open('$SETTINGS_FILE') as f:
    settings = json.load(f)
if 'enabledPlugins' not in settings:
    settings['enabledPlugins'] = {}
settings['enabledPlugins']['lore@local'] = True
with open('$SETTINGS_FILE', 'w') as f:
    json.dump(settings, f, indent=4)
print('Registered lore@local in enabledPlugins.')
"
  fi
else
  # Create settings file with enabledPlugins
  mkdir -p "$(dirname "$SETTINGS_FILE")"
  python3 -c "
import json
settings = {'enabledPlugins': {'lore@local': True}}
with open('$SETTINGS_FILE', 'w') as f:
    json.dump(settings, f, indent=4)
print('Created settings.json with lore@local enabled.')
"
fi

echo ""
echo "Installed successfully!"
echo "Start a new Claude Code session and use /lore:list to see available skills."
