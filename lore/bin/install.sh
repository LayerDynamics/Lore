#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Lore — Unified Installer
# Works as both:
#   curl -fsSL https://raw.githubusercontent.com/LayerDynamics/lore/main/install.sh | bash
#   bash lore/bin/install.sh
#   bash lore/bin/install.sh --from-remote /path/to/source
# ─────────────────────────────────────────────

# ── Helpers ─────────────────────────────────
info()  { echo "  [info]  $*"; }
warn()  { echo "  [warn]  $*"; }
error() { echo "  [error] $*" >&2; }
ok()    { echo "  [ok]    $*"; }

# ── Resolve plugin source ────────────────────
if [ -n "${BASH_SOURCE[0]:-}" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
else
  # Piped via curl — no BASH_SOURCE available
  PLUGIN_DIR=""
fi
REMOTE_MODE=false

if [ "${1:-}" = "--from-remote" ]; then
  REMOTE_MODE=true
  if [ -n "${2:-}" ]; then
    PLUGIN_DIR="$2"
  fi
fi

# If PLUGIN_DIR is empty or doesn't contain plugin.json, we need to clone
if [ -z "$PLUGIN_DIR" ] || [ ! -f "$PLUGIN_DIR/.claude-plugin/plugin.json" ]; then
  REMOTE_MODE=true
fi

# ── Read version from plugin.json ────────────
if [ -f "$PLUGIN_DIR/.claude-plugin/plugin.json" ]; then
  VERSION=$(python3 -c "import json; print(json.load(open('$PLUGIN_DIR/.claude-plugin/plugin.json'))['version'])" 2>/dev/null || echo "0.1.0")
else
  VERSION="0.1.0"
fi

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

# ── Clone or update (remote mode) ────────────
REPO_URL="https://github.com/LayerDynamics/lore.git"
SRC_DIR="$HOME/.claude/plugins/_src/lore"
GIT_SHA="unknown"

if [ "$REMOTE_MODE" = true ]; then
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

  PLUGIN_DIR="$SRC_DIR/lore"
  # Re-read version after clone/pull
  VERSION=$(python3 -c "import json; print(json.load(open('$PLUGIN_DIR/.claude-plugin/plugin.json'))['version'])" 2>/dev/null || echo "0.1.0")
  GIT_SHA=$(git -C "$SRC_DIR" rev-parse HEAD 2>/dev/null || echo "unknown")
  ok "Source ready at $SRC_DIR"
  echo ""
else
  # Local mode — try to get git sha from repo root
  REPO_ROOT="$(cd "$PLUGIN_DIR/.." && pwd)"
  GIT_SHA=$(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || echo "unknown")
  info "Installing from local source: $PLUGIN_DIR"
  echo ""
fi

# ── Remove legacy symlink if present ─────────
LEGACY_SYMLINK="$HOME/.claude/plugins/lore"
if [ -L "$LEGACY_SYMLINK" ]; then
  rm "$LEGACY_SYMLINK"
  info "Removed old symlink (replaced by cache install)"
fi

# ── Copy plugin to cache ─────────────────────
# Use short git sha as cache version so every commit gets a fresh entry
CACHE_VERSION="${GIT_SHA:0:12}"
if [ "$CACHE_VERSION" = "unknown" ]; then
  CACHE_VERSION="$VERSION"
fi

CACHE_BASE="$HOME/.claude/plugins/cache/lore-marketplace/lore"
CACHE_DIR="$CACHE_BASE/${CACHE_VERSION}"

# Remove ALL old cached versions to prevent stale data
if [ -d "$CACHE_BASE" ]; then
  rm -rf "$CACHE_BASE"
  info "Cleaned old cache entries"
fi
mkdir -p "$CACHE_DIR"

rsync -a \
  --exclude='.git' \
  --exclude='tests' \
  --exclude='node_modules' \
  --delete \
  "$PLUGIN_DIR/" "$CACHE_DIR/" 2>/dev/null || cp -RL "$PLUGIN_DIR/." "$CACHE_DIR/"

# Stamp version in cached plugin.json with git sha so Claude Code detects updates
python3 -c "
import json, os
pj = os.path.join('$CACHE_DIR', '.claude-plugin', 'plugin.json')
if os.path.exists(pj):
    with open(pj) as f:
        p = json.load(f)
    p['version'] = '$CACHE_VERSION'
    with open(pj, 'w') as f:
        json.dump(p, f, indent=2)
        f.write('\n')
"

ok "Plugin cached at $CACHE_DIR (version: $CACHE_VERSION)"

# ── Register in installed_plugins.json ────────
INSTALLED_FILE="$HOME/.claude/plugins/installed_plugins.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

python3 -c "
import json, os

installed_file = '$INSTALLED_FILE'
cache_dir = '$CACHE_DIR'
timestamp = '$TIMESTAMP'
git_sha = '$GIT_SHA'
version = '$VERSION'

if os.path.exists(installed_file):
    with open(installed_file, 'r') as f:
        data = json.load(f)
else:
    data = {'version': 2, 'plugins': {}}

if 'plugins' not in data:
    data['plugins'] = {}

data['plugins']['lore@lore-marketplace'] = [{
    'scope': 'user',
    'installPath': cache_dir,
    'version': '$CACHE_VERSION',
    'installedAt': timestamp,
    'lastUpdated': timestamp,
    'gitCommitSha': git_sha
}]

with open(installed_file, 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
"

ok "Registered in installed_plugins.json"

# ── Register in enabledPlugins ────────────────
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
# Remove legacy local key if present
ep.pop('lore@local', None)

with open(settings_file, 'w') as f:
    json.dump(s, f, indent=2)
    f.write('\n')
"

ok "Enabled in settings"

# ── Set up lore marketplace ───────────────────
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

ok "Marketplace directory created"

# ── Register in known_marketplaces.json ───────
KNOWN_MARKETPLACES="$HOME/.claude/plugins/known_marketplaces.json"

python3 -c "
import json, os

km_file = '$KNOWN_MARKETPLACES'
marketplace_dir = '$MARKETPLACE_DIR'

if os.path.exists(km_file):
    with open(km_file, 'r') as f:
        km = json.load(f)
else:
    km = {}

km['lore-marketplace'] = {
    'source': {
        'source': 'directory',
        'path': marketplace_dir
    },
    'installLocation': marketplace_dir,
    'lastUpdated': '$TIMESTAMP'
}

with open(km_file, 'w') as f:
    json.dump(km, f, indent=2)
    f.write('\n')
"

ok "Marketplace registered in known_marketplaces.json"
echo ""

# ── Extensions ────────────────────────────────
EXT_DIR="$PLUGIN_DIR/extensions"

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

# ── Done ──────────────────────────────────────
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
