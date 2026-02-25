#!/usr/bin/env bash
# install.sh — Install cc-telemetry daemon as a launchd agent.
# Idempotent: safe to re-run.

set -euo pipefail

PLIST_SRC="$(cd "$(dirname "$0")" && pwd)/launchd/com.layerdynamics.cc-telemetry.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/com.layerdynamics.cc-telemetry.plist"
TELEMETRY_DIR="$HOME/.claude/telemetry"
BIN_SRC="$(cd "$(dirname "$0")" && pwd)/bin/cc-telemetry"
BIN_DEST="$HOME/.local/bin/cc-telemetry"

echo "=== cc-telemetry install ==="

# Create telemetry dir
mkdir -p "$TELEMETRY_DIR"
echo "[OK] Telemetry dir: $TELEMETRY_DIR"

# Install CLI symlink
mkdir -p "$HOME/.local/bin"
if [ -L "$BIN_DEST" ] || [ ! -e "$BIN_DEST" ]; then
    ln -sf "$BIN_SRC" "$BIN_DEST"
    chmod +x "$BIN_SRC"
    echo "[OK] CLI symlink: $BIN_DEST -> $BIN_SRC"
else
    echo "[SKIP] $BIN_DEST already exists (not a symlink) — skipping"
fi

# Install launchd plist
if [ ! -f "$PLIST_SRC" ]; then
    echo "[ERROR] Plist not found: $PLIST_SRC"
    exit 1
fi

# Unload existing agent if loaded
if launchctl list "com.layerdynamics.cc-telemetry" &>/dev/null; then
    echo "[INFO] Unloading existing agent…"
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
fi

DAEMON_DIR="$(cd "$(dirname "$0")" && pwd)/daemon"
sed -e "s|__HOME__|$HOME|g" -e "s|__CC_TELEMETRY_DAEMON_DIR__|$DAEMON_DIR|g" "$PLIST_SRC" > "$PLIST_DEST"
echo "[OK] Installed plist: $PLIST_DEST"

# Load agent
launchctl load "$PLIST_DEST"
echo "[OK] Loaded launchd agent: com.layerdynamics.cc-telemetry"

# Give daemon a moment to start
sleep 1

# Check status
if launchctl list "com.layerdynamics.cc-telemetry" &>/dev/null; then
    PID=$(launchctl list "com.layerdynamics.cc-telemetry" | awk 'NR==2{print $1}')
    echo "[OK] Daemon running (PID: ${PID:-?})"
else
    echo "[WARN] Daemon may not have started — check log: $TELEMETRY_DIR/daemon.log"
fi

echo ""
echo "=== Done ==="
echo "CLI:  cc-telemetry sessions | tools | stats | errors | live"
echo "Log:  $TELEMETRY_DIR/daemon.log"
echo "DB:   $TELEMETRY_DIR/telemetry.db"
echo ""
echo "Tip: add ~/.local/bin to your PATH if not already there."
