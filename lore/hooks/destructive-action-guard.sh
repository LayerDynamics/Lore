#!/usr/bin/env bash
# destructive-action-guard.sh — PreToolUse hook for Bash tool
# Tiered protection:
#   HARD BLOCK (exit 2): catastrophic local actions (rm -rf /, dd to device, mkfs)
#   APPROVAL REQUIRED (exit 2 with clear message): destructive but intentional actions
#   User sees the warning and can approve/deny in Claude Code
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

if [ "$TOOL_NAME" != "Bash" ]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('tool_input', {}).get('command', ''))
" 2>/dev/null || echo "")

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Normalize: collapse whitespace for matching
NORM_CMD=$(echo "$COMMAND" | tr '\n' ' ' | sed 's/  */ /g')

# ── TIER 1: HARD BLOCK — catastrophic, never intentional ──────────
HARD_BLOCK=""

# rm -rf on root or home
if echo "$NORM_CMD" | grep -qE '\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\s+(\/|\/\*|~\s|~\/\s)\s*($|;|\|)'; then
  HARD_BLOCK="rm -rf on root/home directory"
fi

# dd writing to block devices
if echo "$NORM_CMD" | grep -qE '\bdd\s+.*of=\/dev\/'; then
  HARD_BLOCK="dd write to block device"
fi

# mkfs (format filesystem)
if echo "$NORM_CMD" | grep -qE '\bmkfs\b'; then
  HARD_BLOCK="mkfs (format filesystem)"
fi

# chmod/chown -R on root
if echo "$NORM_CMD" | grep -qE '\b(chmod|chown)\s+-R\s+.*\s+\/\s*($|;)'; then
  HARD_BLOCK="recursive chmod/chown on root"
fi

if [ -n "$HARD_BLOCK" ]; then
  echo "HARD BLOCK: ${HARD_BLOCK}. This action is never safe. Command: ${COMMAND}" >&2
  exit 2
fi

# ── TIER 2: APPROVAL REQUIRED — destructive but sometimes intentional ──
WARN=""

# rm -rf (any target)
if echo "$NORM_CMD" | grep -qE '\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r|--recursive\s+--force|--force\s+--recursive|-r\s+-f|-f\s+-r)\b'; then
  WARN="rm -rf (recursive force delete)"
fi

# git push --force
if [ -z "$WARN" ] && echo "$NORM_CMD" | grep -qE '\bgit\s+push\s+.*(-f\b|--force\b|--force-with-lease\b)'; then
  WARN="git push --force"
fi

# git reset --hard
if [ -z "$WARN" ] && echo "$NORM_CMD" | grep -qE '\bgit\s+reset\s+.*--hard'; then
  WARN="git reset --hard"
fi

# git checkout . or git restore . (discards all unstaged changes)
if [ -z "$WARN" ] && echo "$NORM_CMD" | grep -qE '\bgit\s+(checkout|restore)\s+\.\s*($|;|\|)'; then
  WARN="git checkout/restore . (discard all changes)"
fi

# git clean -f (removes untracked files)
if [ -z "$WARN" ] && echo "$NORM_CMD" | grep -qE '\bgit\s+clean\s+.*(-[a-zA-Z]*f|--force)'; then
  WARN="git clean -f (remove untracked files)"
fi

# git branch -D (force delete branch)
if [ -z "$WARN" ] && echo "$NORM_CMD" | grep -qE '\bgit\s+branch\s+.*-D'; then
  WARN="git branch -D (force delete branch)"
fi

# DROP DATABASE/TABLE/SCHEMA
if [ -z "$WARN" ] && echo "$NORM_CMD" | grep -qiE '\bDROP\s+(DATABASE|TABLE|SCHEMA)\b'; then
  WARN="DROP DATABASE/TABLE/SCHEMA"
fi

# Redirect overwrite to system paths (only top-level, not inside quotes)
if [ -z "$WARN" ] && echo "$NORM_CMD" | grep -qE '^[^"'\'']*>\s*\/etc\/|^[^"'\'']*>\s*\/dev\/'; then
  WARN="redirect overwrite to system path"
fi

if [ -n "$WARN" ]; then
  echo "APPROVAL REQUIRED: ${WARN}" >&2
  echo "Command: ${COMMAND}" >&2
  exit 2
fi

exit 0
