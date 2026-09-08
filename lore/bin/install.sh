#!/usr/bin/env bash
set -euo pipefail
LORE_BIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$LORE_BIN_DIR/lore.mjs" build "$@"
