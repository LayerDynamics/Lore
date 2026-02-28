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

# ── Banner (art only — version printed after source is resolved) ──
cat <<'BANNER'

  ██╗      ██████╗ ██████╗ ███████╗
  ██║     ██╔═══██╗██╔══██╗██╔════╝
  ██║     ██║   ██║██████╔╝█████╗
  ██║     ██║   ██║██╔══██╗██╔══╝
  ███████╗╚██████╔╝██║  ██║███████╗
  ╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝

BANNER

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
else
  # Local mode — try to get git sha from repo root
  REPO_ROOT="$(cd "$PLUGIN_DIR/.." && pwd)"
  GIT_SHA=$(git -C "$REPO_ROOT" rev-parse HEAD 2>/dev/null || echo "unknown")
  VERSION=$(python3 -c "import json; print(json.load(open('$PLUGIN_DIR/.claude-plugin/plugin.json'))['version'])" 2>/dev/null || echo "0.1.0")
  info "Installing from local source: $PLUGIN_DIR"
fi

# ── Banner version line (now that VERSION is resolved) ──
echo "  v${VERSION} — A Claude Code plugin framework"
echo "  Skills · Commands · Agents · Hooks"
echo ""

# ── Compute cache version ────────────────────
# Use semver from plugin.json (auto-bumped by GitHub Actions on push)
CACHE_VERSION="$VERSION"

# ── Remove legacy installs ───────────────────
# Remove old symlink
LEGACY_SYMLINK="$HOME/.claude/plugins/lore"
if [ -L "$LEGACY_SYMLINK" ]; then
  rm "$LEGACY_SYMLINK"
  info "Removed old symlink"
fi

# Remove old lore-marketplace cache
OLD_CACHE="$HOME/.claude/plugins/cache/lore-marketplace"
if [ -d "$OLD_CACHE" ]; then
  rm -rf "$OLD_CACHE"
  info "Removed old lore-marketplace cache"
fi

# ── Copy plugin to local marketplace source ──
# This mirrors how working @local plugins are structured:
# local-marketplace/lore/ contains the plugin source
LOCAL_MKT="$HOME/.claude/plugins/local-marketplace"
PLUGIN_SRC_IN_MKT="$LOCAL_MKT/lore"

# Remove old source and copy fresh
if [ -d "$PLUGIN_SRC_IN_MKT" ]; then
  rm -rf "$PLUGIN_SRC_IN_MKT"
fi
mkdir -p "$PLUGIN_SRC_IN_MKT"

rsync -a \
  --exclude='.git' \
  --exclude='tests' \
  --exclude='node_modules' \
  "$PLUGIN_DIR/" "$PLUGIN_SRC_IN_MKT/" 2>/dev/null || cp -RL "$PLUGIN_DIR/." "$PLUGIN_SRC_IN_MKT/"

ok "Plugin source copied to local marketplace"

# ── Copy plugin to cache ─────────────────────
CACHE_BASE="$HOME/.claude/plugins/cache/local/lore"
CACHE_DIR="$CACHE_BASE/${CACHE_VERSION}"

# Keep old cached versions alive (active sessions reference them via hook paths)
# Only overwrite the current version's cache dir
mkdir -p "$CACHE_DIR"

rsync -a \
  --exclude='.git' \
  --exclude='tests' \
  --exclude='node_modules' \
  "$PLUGIN_DIR/" "$CACHE_DIR/" 2>/dev/null || cp -RL "$PLUGIN_DIR/." "$CACHE_DIR/"

ok "Plugin cached at $CACHE_DIR (version: $CACHE_VERSION)"

# ── Register in local marketplace manifest ────
python3 -c "
import json, os

mkt_file = '$LOCAL_MKT/.claude-plugin/marketplace.json'
os.makedirs(os.path.dirname(mkt_file), exist_ok=True)

if os.path.exists(mkt_file):
    with open(mkt_file) as f:
        mkt = json.load(f)
else:
    mkt = {
        'name': 'local',
        'owner': {'name': 'Local'},
        'plugins': []
    }

# Check if lore already in plugins list
names = [p.get('name') for p in mkt.get('plugins', [])]
if 'lore' not in names:
    mkt.setdefault('plugins', []).append({
        'name': 'lore',
        'source': './lore',
        'description': 'Opinionated meta skills & plugin framework for deterministic results'
    })
    with open(mkt_file, 'w') as f:
        json.dump(mkt, f, indent=2)
        f.write('\n')
    print('  [ok]    Added lore to local marketplace manifest')
else:
    print('  [ok]    Lore already in local marketplace manifest')
"

# ── Register in installed_plugins.json ────────
INSTALLED_FILE="$HOME/.claude/plugins/installed_plugins.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

python3 -c "
import json, os

installed_file = '$INSTALLED_FILE'
cache_dir = '$CACHE_DIR'
timestamp = '$TIMESTAMP'
git_sha = '$GIT_SHA'

if os.path.exists(installed_file):
    with open(installed_file, 'r') as f:
        data = json.load(f)
else:
    data = {'version': 2, 'plugins': {}}

if 'plugins' not in data:
    data['plugins'] = {}

# Remove old lore-marketplace entry if present
data['plugins'].pop('lore@lore-marketplace', None)

# Register as lore@local (matches working plugins)
data['plugins']['lore@local'] = [{
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
ep['lore@local'] = True
# Remove old lore-marketplace key
ep.pop('lore@lore-marketplace', None)

with open(settings_file, 'w') as f:
    json.dump(s, f, indent=2)
    f.write('\n')
"

ok "Enabled in settings"

# ── Ensure local marketplace is in known_marketplaces ──
KNOWN_MARKETPLACES="$HOME/.claude/plugins/known_marketplaces.json"

python3 -c "
import json, os

km_file = '$KNOWN_MARKETPLACES'

if os.path.exists(km_file):
    with open(km_file) as f:
        km = json.load(f)
else:
    km = {}

if 'local' not in km:
    km['local'] = {
        'source': {
            'source': 'directory',
            'path': '$LOCAL_MKT'
        },
        'installLocation': '$LOCAL_MKT',
        'lastUpdated': '$TIMESTAMP'
    }
    with open(km_file, 'w') as f:
        json.dump(km, f, indent=2)
        f.write('\n')
    print('  [ok]    Registered local marketplace in known_marketplaces.json')
else:
    print('  [ok]    Local marketplace already registered')
"

# ── Clean up old lore-marketplace artifacts ───
OLD_MKT="$HOME/.claude/plugins/lore-marketplace"
if [ -d "$OLD_MKT" ]; then
  rm -rf "$OLD_MKT"
  info "Removed old lore-marketplace directory"
fi

python3 -c "
import json, os
km_file = '$KNOWN_MARKETPLACES'
if os.path.exists(km_file):
    with open(km_file) as f:
        km = json.load(f)
    if 'lore-marketplace' in km:
        del km['lore-marketplace']
        with open(km_file, 'w') as f:
            json.dump(km, f, indent=2)
            f.write('\n')
        print('  [info]  Removed lore-marketplace from known_marketplaces.json')
"

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
