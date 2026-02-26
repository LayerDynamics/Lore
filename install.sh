#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Lore — One-Liner Installer
# curl -fsSL https://raw.githubusercontent.com/LayerDynamics/lore/main/install.sh | bash
# ─────────────────────────────────────────────

VERSION="0.1.0"

# ── Banner ──────────────────────────────────
cat <<'BANNER'

  ██╗      ██████╗ ██████╗ ███████╗
  ██║     ██╔═══██╗██╔══██╗██╔════╝
  ██║     ██║   ██║██████╔╝█████╗
  ██║     ██║   ██║██╔══██╗██╔══╝
  ███████╗╚██████╔╝██║  ██║███████╗
  ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝

BANNER
echo "  v${VERSION} — A Claude Code plugin framework"
echo "  Skills · Commands · Agents · Hooks"
echo ""

# ── Helpers ─────────────────────────────────
info()  { echo "  [info]  $*"; }
warn()  { echo "  [warn]  $*"; }
error() { echo "  [error] $*" >&2; }
ok()    { echo "  [ok]    $*"; }

# ── Prerequisites ───────────────────────────
MISSING=0

if ! command -v git &>/dev/null; then
  warn "git is not installed — you'll need it to receive updates"
  MISSING=1
fi

if ! command -v claude &>/dev/null; then
  warn "claude CLI not found — install from https://claude.ai/code"
  MISSING=1
fi

if [ "$MISSING" -eq 1 ]; then
  echo ""
  warn "Some prerequisites are missing (see above). Continuing anyway..."
  echo ""
fi

# ── Clone or update ─────────────────────────
REPO_URL="https://github.com/LayerDynamics/lore.git"
SRC_DIR="$HOME/.claude/plugins/_src/lore"

mkdir -p "$HOME/.claude/plugins/_src"

if [ -d "$SRC_DIR/.git" ]; then
  info "Existing clone found at $SRC_DIR — pulling latest..."
  git -C "$SRC_DIR" pull --ff-only 2>/dev/null || warn "Could not pull latest (offline or diverged). Using existing copy."
else
  if [ -d "$SRC_DIR" ]; then
    warn "$SRC_DIR exists but is not a git repo — removing and re-cloning"
    rm -rf "$SRC_DIR"
  fi
  info "Cloning Lore into $SRC_DIR..."
  git clone "$REPO_URL" "$SRC_DIR"
fi

ok "Source ready at $SRC_DIR"
echo ""

# ── Symlink ─────────────────────────────────
PLUGIN_SRC="$SRC_DIR/lore"
TARGET_DIR="$HOME/.claude/plugins/lore"

mkdir -p "$HOME/.claude/plugins"

if [ -L "$TARGET_DIR" ]; then
  EXISTING=$(readlink "$TARGET_DIR")
  if [ "$EXISTING" = "$PLUGIN_SRC" ]; then
    ok "Symlink already correct"
  else
    info "Updating symlink from $EXISTING → $PLUGIN_SRC"
    rm "$TARGET_DIR"
    ln -s "$PLUGIN_SRC" "$TARGET_DIR"
    ok "Symlink updated"
  fi
elif [ -d "$TARGET_DIR" ]; then
  error "$TARGET_DIR exists as a directory. Please remove it first:"
  error "  rm -rf $TARGET_DIR"
  exit 1
else
  ln -s "$PLUGIN_SRC" "$TARGET_DIR"
  ok "Symlink created: $TARGET_DIR → $PLUGIN_SRC"
fi

# ── Register plugin in settings ───────────
SETTINGS_FILE="$HOME/.claude/settings.json"

if [ -f "$SETTINGS_FILE" ]; then
  if command -v python3 &>/dev/null; then
    if python3 -c "
import json, sys
with open('$SETTINGS_FILE', 'r') as f:
    s = json.load(f)
ep = s.setdefault('enabledPlugins', {})
if ep.get('lore@local') is True:
    sys.exit(1)
ep['lore@local'] = True
with open('$SETTINGS_FILE', 'w') as f:
    json.dump(s, f, indent=2)
    f.write('\n')
" 2>/dev/null; then
      ok "Registered lore in enabledPlugins"
    else
      ok "Plugin already registered"
    fi
  else
    warn "python3 not found — add \"lore@local\": true to enabledPlugins in $SETTINGS_FILE manually"
  fi
else
  mkdir -p "$HOME/.claude"
  echo '{"enabledPlugins":{"lore@local":true}}' | python3 -m json.tool > "$SETTINGS_FILE" 2>/dev/null || \
    echo '{"enabledPlugins":{"lore@local":true}}' > "$SETTINGS_FILE"
  ok "Created settings and registered lore"
fi

echo ""

# ── Extensions ──────────────────────────────
EXT_DIR="$PLUGIN_SRC/extensions"

if [ -d "$EXT_DIR" ]; then
  echo "  Available extensions:"
  echo ""
  echo "    browserx             — Browser automation engine"
  echo "    cc-telemetry         — Deep telemetry and observability for Claude Code"
  echo "    trellio              — Trello task management integration"
  echo "    findlazy             — Detect placeholder/stub code left by AI agents"
  echo "    mcp-trigger-gateway  — Cron, webhook, and file-watcher triggers via MCP"
  echo "    scratchpad           — Ephemeral scratchpad workspace"
  echo ""

  SETUP_EXTENSIONS="n"
  # Only prompt if stdin is a terminal (not piped)
  if [ -t 0 ]; then
    read -r -p "  Set up extensions now? [y/N] " SETUP_EXTENSIONS
  fi

  if [[ "$SETUP_EXTENSIONS" =~ ^[Yy]$ ]]; then
    echo ""
    for ext_dir in "$EXT_DIR"/*/; do
      ext_name=$(basename "$ext_dir")
      postinstall="$ext_dir/postinstall.sh"
      if [ -f "$postinstall" ]; then
        info "Setting up $ext_name..."
        if bash "$postinstall"; then
          ok "$ext_name ready"
        else
          warn "$ext_name setup had issues (non-fatal)"
        fi
      fi
    done
    echo ""
  else
    info "Skipping extensions. Run postinstall.sh in any extension later."
    echo ""
  fi
fi

# ── Launch Claude Code ──────────────────────
ok "Lore installed successfully!"
echo ""

if command -v claude &>/dev/null; then
  if [ -t 0 ]; then
    read -r -p "  Launch Claude Code with a quick tour? [Y/n] " LAUNCH
    LAUNCH="${LAUNCH:-y}"
    if [[ "$LAUNCH" =~ ^[Yy]$ ]]; then
      echo ""
      info "Starting Claude Code..."
      exec claude --prompt "You just installed the Lore plugin framework. Welcome the user, show them what's available with /lore:list, and give a quick tour of the key skills and commands."
    fi
  fi
fi

echo "  Start a new Claude Code session and run /lore:list to get started."
echo ""
