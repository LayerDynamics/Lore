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

if ! command -v python3 &>/dev/null; then
  error "python3 is required for plugin registration"
  exit 1
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

PLUGIN_SRC="$SRC_DIR/lore"

# ── Copy plugin to cache (like /plugin install does) ──
CACHE_DIR="$HOME/.claude/plugins/cache/lore-marketplace/lore/${VERSION}"

mkdir -p "$CACHE_DIR"

# Copy plugin contents (following symlinks) to cache
rsync -a --delete "$PLUGIN_SRC/" "$CACHE_DIR/" 2>/dev/null || cp -RL "$PLUGIN_SRC/." "$CACHE_DIR/"

ok "Plugin cached at $CACHE_DIR"

# ── Register in installed_plugins.json ──────
INSTALLED_FILE="$HOME/.claude/plugins/installed_plugins.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")
GIT_SHA=$(git -C "$SRC_DIR" rev-parse HEAD 2>/dev/null || echo "unknown")

python3 -c "
import json, os, sys

installed_file = '$INSTALLED_FILE'
cache_dir = '$CACHE_DIR'
timestamp = '$TIMESTAMP'
git_sha = '$GIT_SHA'
version = '$VERSION'

# Load or create
if os.path.exists(installed_file):
    with open(installed_file, 'r') as f:
        data = json.load(f)
else:
    data = {'version': 2, 'plugins': {}}

# Ensure structure
if 'plugins' not in data:
    data['plugins'] = {}

# Register lore
data['plugins']['lore@lore-marketplace'] = [{
    'scope': 'user',
    'installPath': cache_dir,
    'version': version,
    'installedAt': timestamp,
    'lastUpdated': timestamp,
    'gitCommitSha': git_sha
}]

with open(installed_file, 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
"

ok "Registered in installed_plugins.json"

# ── Register in enabledPlugins ──────────────
SETTINGS_FILE="$HOME/.claude/settings.json"

python3 -c "
import json, os

settings_file = '$SETTINGS_FILE'

if os.path.exists(settings_file):
    with open(settings_file, 'r') as f:
        s = json.load(f)
else:
    s = {}

ep = s.setdefault('enabledPlugins', {})
ep['lore@lore-marketplace'] = True

with open(settings_file, 'w') as f:
    json.dump(s, f, indent=2)
    f.write('\n')
"

ok "Enabled in settings"

# ── Set up lore marketplace ─────────────────
MARKETPLACE_DIR="$HOME/.claude/plugins/lore-marketplace"
mkdir -p "$MARKETPLACE_DIR/.claude-plugin"

python3 -c "
import json

marketplace = {
    'name': 'lore-marketplace',
    'owner': {'name': 'LayerDynamics'},
    'metadata': {
        'description': 'Lore plugin framework marketplace',
        'version': '1.0.0'
    },
    'plugins': [{
        'name': 'lore',
        'source': {'source': 'url', 'url': 'https://github.com/LayerDynamics/lore.git'},
        'description': 'Opinionated meta skills & plugin framework for deterministic results',
        'version': '$VERSION',
        'strict': True
    }]
}

with open('$MARKETPLACE_DIR/.claude-plugin/marketplace.json', 'w') as f:
    json.dump(marketplace, f, indent=2)
    f.write('\n')
"

ok "Marketplace registered for future updates"
echo ""

# ── Remove stale symlink if exists ──────────
SYMLINK_DIR="$HOME/.claude/plugins/lore"
if [ -L "$SYMLINK_DIR" ]; then
  rm "$SYMLINK_DIR"
  info "Removed old symlink (replaced by cache install)"
fi

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
