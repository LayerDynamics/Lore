#!/usr/bin/env bash
# cc-telemetry Extension Postinstall
# Sets up the telemetry daemon dependencies.

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

log()     { echo -e "${CYAN}[cc-telemetry]${NC} $1"; }
success() { echo -e "${GREEN}[cc-telemetry]${NC} $1"; }
error()   { echo -e "${RED}[cc-telemetry]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
log "cc-telemetry Postinstall"
echo ""

# Ensure Python 3 is available (daemon is Python)
if ! command -v python3 &>/dev/null; then
  error "python3 is not installed. The cc-telemetry daemon requires Python 3."
  exit 1
fi
log "Python 3 found: $(python3 --version)"

# Create telemetry data directory
TELEMETRY_DIR="$HOME/.claude/telemetry"
mkdir -p "$TELEMETRY_DIR"
log "Telemetry directory: $TELEMETRY_DIR"

# Check for daemon files
DAEMON_DIR="$SCRIPT_DIR/daemon"
if [ ! -f "$DAEMON_DIR/daemon.py" ]; then
  error "Daemon files not found at $DAEMON_DIR"
  exit 1
fi
log "Daemon files verified"

# Make CLI executable
BIN="$SCRIPT_DIR/bin/cc-telemetry"
if [ -f "$BIN" ]; then
  chmod +x "$BIN"
  log "CLI marked executable"
fi

echo ""
success "Postinstall complete."
echo -e "${DIM}Run install.sh to set up the launchd daemon for continuous monitoring.${NC}"
echo ""
