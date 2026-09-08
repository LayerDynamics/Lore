#!/usr/bin/env bash
set -euo pipefail
if [[ -z "${BASH_SOURCE[0]:-}" || ! -f "${BASH_SOURCE[0]}" ]]; then
  echo "Clone the Lore repository, then run ./install.sh --runtime codex|claude|portable --out DIRECTORY." >&2
  exit 1
fi
LORE_REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$LORE_REPO_DIR/lore/bin/lore.mjs" build "$@"
