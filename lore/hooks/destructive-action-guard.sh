#!/usr/bin/env bash
# destructive-action-guard.sh — PreToolUse hook for Bash tool
# Blocks destructive commands like rm -rf, git push --force, git reset --hard
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

# Normalize: collapse whitespace, strip leading whitespace for matching
NORM_CMD=$(echo "$COMMAND" | tr '\n' ' ' | sed 's/  */ /g')

# Check for destructive patterns
BLOCKED=""

# rm with recursive+force flags — block ALL targets, not just specific paths
# Catches: rm -rf, rm -fr, rm --recursive --force, rm -r -f, etc.
if echo "$NORM_CMD" | grep -qE '\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r|--recursive\s+--force|--force\s+--recursive|-r\s+-f|-f\s+-r)\b'; then
  BLOCKED="rm -rf (recursive force delete)"
fi

# rm on critical paths even without -rf (e.g. rm -r /)
if echo "$NORM_CMD" | grep -qE '\brm\s+.*\s+(\/|\/\*|~\/|~|\.\.|\.\/\.\.)(\s|$|;|\|)'; then
  BLOCKED="rm on critical path"
fi

# git push --force (including --force-with-lease which is safer but still destructive)
if echo "$NORM_CMD" | grep -qE '\bgit\s+push\s+.*(-f\b|--force\b|--force-with-lease\b)'; then
  BLOCKED="git push --force"
fi

# git reset --hard
if echo "$NORM_CMD" | grep -qE '\bgit\s+reset\s+.*--hard'; then
  BLOCKED="git reset --hard"
fi

# git checkout . or git restore . (discards all unstaged changes)
if echo "$NORM_CMD" | grep -qE '\bgit\s+(checkout|restore)\s+\.\s*($|;|\|)'; then
  BLOCKED="git checkout/restore . (discard all changes)"
fi

# git clean -f (removes untracked files)
if echo "$NORM_CMD" | grep -qE '\bgit\s+clean\s+.*(-[a-zA-Z]*f|--force)'; then
  BLOCKED="git clean -f"
fi

# git branch -D (force delete branch)
if echo "$NORM_CMD" | grep -qE '\bgit\s+branch\s+.*-D'; then
  BLOCKED="git branch -D"
fi

# drop database/table/schema
if echo "$NORM_CMD" | grep -qiE '\bDROP\s+(DATABASE|TABLE|SCHEMA)\b'; then
  BLOCKED="DROP DATABASE/TABLE"
fi

# chmod/chown on root or broad paths
if echo "$NORM_CMD" | grep -qE '\b(chmod|chown)\s+(-R\s+)?.*\s+\/(\s|$|;)'; then
  BLOCKED="chmod/chown on root"
fi

# dd writing to block devices or disk
if echo "$NORM_CMD" | grep -qE '\bdd\s+.*of=\/dev\/'; then
  BLOCKED="dd write to device"
fi

# mkfs on any device
if echo "$NORM_CMD" | grep -qE '\bmkfs'; then
  BLOCKED="mkfs (format filesystem)"
fi

# truncate or overwrite critical files via redirection
if echo "$NORM_CMD" | grep -qE '>\s*\/etc\/|>\s*\/dev\/'; then
  BLOCKED="redirect overwrite to system path"
fi

if [ -n "$BLOCKED" ]; then
  echo "BLOCKED: Destructive action detected — ${BLOCKED}. Command: ${COMMAND}" >&2
  exit 2
fi

exit 0
