#!/usr/bin/env bash
# session-context-loader.sh — SessionStart hook
# Loads project-specific context like recent plans and active work
set -euo pipefail

INPUT=$(cat)

CWD=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('cwd',''))" 2>/dev/null || pwd)

# Check for recent plans
PLANS_DIR="${CWD}/docs/plans"
if [ -d "$PLANS_DIR" ]; then
  RECENT=$(ls -t "$PLANS_DIR"/*.md 2>/dev/null | head -3)
  if [ -n "$RECENT" ]; then
    echo "Recent plans found:"
    for plan in $RECENT; do
      echo "  - $(basename "$plan")"
    done
  fi
fi

# Check for active memory
MEMORY_DIR="$HOME/.claude/projects"
PROJECT_HASH=$(echo "$CWD" | sed 's/\//-/g')
MEMORY_FILE="${MEMORY_DIR}/${PROJECT_HASH}/memory/MEMORY.md"
if [ -f "$MEMORY_FILE" ]; then
  echo "Project memory loaded from ${MEMORY_FILE}"
fi

exit 0
