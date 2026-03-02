#!/usr/bin/env bash
# uninstall-non-lore.sh — Remove all non-lore plugins from Claude Code
# Keeps: lore@local (and its bundled local plugins that lore subsumes)
# Removes: all official marketplace, knowledge-work, superpowers-marketplace plugins
#          and standalone local plugins that lore already provides

set -euo pipefail

CLAUDE_DIR="${HOME}/.claude"
SETTINGS_FILE="${CLAUDE_DIR}/settings.json"
INSTALLED_FILE="${CLAUDE_DIR}/plugins/installed_plugins.json"
CACHE_DIR="${CLAUDE_DIR}/plugins/cache"

# The only plugin to keep
KEEP_PLUGIN="lore@local"

# Local plugins that lore subsumes (these were standalone before lore bundled them)
LORE_SUBSUMED_LOCAL=(
  "feature-research@local"
  "no-placeholders@local"
  "productivity@local"
  "writing-plans@local"
  "code-intel@local"
  "local-code-review@local"
)

echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║  Uninstall Non-Lore Plugins              ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""

# --- Preflight checks ---
if [ ! -f "$SETTINGS_FILE" ]; then
  echo "  [error]  Settings file not found: $SETTINGS_FILE"
  exit 1
fi

if [ ! -f "$INSTALLED_FILE" ]; then
  echo "  [error]  Installed plugins file not found: $INSTALLED_FILE"
  exit 1
fi

if ! command -v jq &>/dev/null; then
  echo "  [error]  jq is required. Install with: brew install jq"
  exit 1
fi

# --- Dry run: show what will be removed ---
echo "  [info]  Keeping: $KEEP_PLUGIN"
echo ""
echo "  Plugins to REMOVE:"
echo ""

PLUGINS_TO_REMOVE=()

# Read all plugin keys from installed_plugins.json
while IFS= read -r plugin_key; do
  if [ "$plugin_key" = "$KEEP_PLUGIN" ]; then
    continue
  fi
  PLUGINS_TO_REMOVE+=("$plugin_key")
  # Get the install path for display
  install_path=$(jq -r ".plugins[\"$plugin_key\"][0].installPath // \"unknown\"" "$INSTALLED_FILE")
  echo "    - $plugin_key"
  echo "      path: $install_path"
done < <(jq -r '.plugins | keys[]' "$INSTALLED_FILE")

echo ""

if [ ${#PLUGINS_TO_REMOVE[@]} -eq 0 ]; then
  echo "  [ok]  Nothing to remove. Only lore is installed."
  exit 0
fi

echo "  Total: ${#PLUGINS_TO_REMOVE[@]} plugins will be removed"
echo ""

# --- Confirm ---
if [ "${1:-}" != "--yes" ] && [ "${1:-}" != "-y" ]; then
  read -rp "  Proceed? [y/N] " confirm
  if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "  [abort]  No changes made."
    exit 0
  fi
fi

echo ""

# --- Step 1: Remove from installed_plugins.json ---
echo "  [step]  Updating installed_plugins.json..."

# Build jq filter to delete all non-lore plugins
jq_filter='.plugins'
for plugin_key in "${PLUGINS_TO_REMOVE[@]}"; do
  jq_filter="$jq_filter | del(.\"$plugin_key\")"
done

jq ".plugins = ($jq_filter)" "$INSTALLED_FILE" > "${INSTALLED_FILE}.tmp" && \
  mv "${INSTALLED_FILE}.tmp" "$INSTALLED_FILE"

echo "  [ok]    Removed ${#PLUGINS_TO_REMOVE[@]} entries from installed_plugins.json"

# --- Step 2: Disable in settings.json (set to false or remove) ---
echo "  [step]  Updating settings.json..."

settings_filter='.enabledPlugins'
for plugin_key in "${PLUGINS_TO_REMOVE[@]}"; do
  settings_filter="$settings_filter | del(.\"$plugin_key\")"
done

jq ".enabledPlugins = ($settings_filter)" "$SETTINGS_FILE" > "${SETTINGS_FILE}.tmp" && \
  mv "${SETTINGS_FILE}.tmp" "$SETTINGS_FILE"

echo "  [ok]    Removed entries from enabledPlugins in settings.json"

# --- Step 3: Remove cached plugin directories ---
echo "  [step]  Cleaning plugin cache..."

removed_dirs=0

# Remove marketplace caches (non-local)
for marketplace_dir in "$CACHE_DIR"/claude-plugins-official "$CACHE_DIR"/knowledge-work-plugins "$CACHE_DIR"/superpowers-marketplace; do
  if [ -d "$marketplace_dir" ]; then
    rm -rf "$marketplace_dir"
    echo "  [ok]    Removed cache: $(basename "$marketplace_dir")/"
    ((removed_dirs++))
  fi
done

# Remove subsumed local plugin caches
for plugin_key in "${LORE_SUBSUMED_LOCAL[@]}"; do
  plugin_name="${plugin_key%%@*}"
  local_cache="$CACHE_DIR/local/$plugin_name"
  if [ -d "$local_cache" ]; then
    rm -rf "$local_cache"
    echo "  [ok]    Removed local cache: $plugin_name/"
    ((removed_dirs++))
  fi
done

# Remove standalone local plugin directories (symlinks or copies)
PLUGIN_BASE="${CLAUDE_DIR}/plugins"
for plugin_key in "${LORE_SUBSUMED_LOCAL[@]}"; do
  plugin_name="${plugin_key%%@*}"
  plugin_dir="$PLUGIN_BASE/$plugin_name"
  if [ -d "$plugin_dir" ] || [ -L "$plugin_dir" ]; then
    rm -rf "$plugin_dir"
    echo "  [ok]    Removed plugin dir: $plugin_name/"
    ((removed_dirs++))
  fi
done

echo "  [ok]    Cleaned $removed_dirs directories"

# --- Step 4: Clean up marketplace registrations (optional) ---
KNOWN_MARKETPLACES="${CLAUDE_DIR}/plugins/known_marketplaces.json"
if [ -f "$KNOWN_MARKETPLACES" ]; then
  echo "  [step]  Keeping marketplace registrations (for future use)"
fi

echo ""
echo "  ════════════════════════════════════════════"
echo "  [ok]    Done! Only lore@local remains."
echo "  [info]  Restart Claude Code for changes to take effect."
echo ""
