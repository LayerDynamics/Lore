#!/usr/bin/env bash
# Lore Framework Postinstall
# Runs postinstall for all extensions that have repos to clone or deps to install.

set -euo pipefail

CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
DIM='\033[2m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXT_DIR="$SCRIPT_DIR/extensions"

echo ""
echo -e "${CYAN}Lore Framework Postinstall${NC}"
echo -e "${DIM}Setting up extensions...${NC}"
echo ""

FAILED=0
SUCCEEDED=0

for ext_dir in "$EXT_DIR"/*/; do
  ext_name="$(basename "$ext_dir")"
  postinstall="$ext_dir/postinstall.sh"

  if [ ! -f "$postinstall" ]; then
    continue
  fi

  echo -e "${CYAN}━━━ $ext_name ━━━${NC}"
  if bash "$postinstall"; then
    SUCCEEDED=$((SUCCEEDED + 1))
  else
    echo -e "${RED}[FAIL] $ext_name postinstall failed${NC}"
    FAILED=$((FAILED + 1))
  fi
  echo ""
done

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Succeeded: $SUCCEEDED${NC}"
if [ "$FAILED" -gt 0 ]; then
  echo -e "${RED}Failed: $FAILED${NC}"
fi
echo ""
echo -e "${DIM}Lore framework setup complete. Restart Claude Code to load changes.${NC}"
