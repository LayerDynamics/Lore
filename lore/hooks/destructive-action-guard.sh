#!/usr/bin/env bash
# destructive-action-guard.sh — PreToolUse hook for Bash tool
# Tiered protection:
#   HARD BLOCK (exit 2): catastrophic local actions (rm -rf /, dd to device)
#   APPROVAL REQUIRED (exit 2 with message): destructive but intentional actions
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

# Extract the first real command (before any && or | or ;)
FIRST_CMD=$(echo "$NORM_CMD" | sed 's/[;&|].*//' | xargs)
# Get just the binary name
FIRST_BIN=$(echo "$FIRST_CMD" | awk '{print $1}' | sed 's|.*/||')

# ── SAFE COMMANDS — skip all checks ──────────────────────────────
case "$FIRST_BIN" in
  ls|cat|head|tail|find|grep|rg|wc|file|stat|du|df|which|where|type|\
  echo|printf|env|printenv|set|export|\
  npm|npx|node|deno|bun|yarn|pnpm|\
  python|python3|pip|pip3|\
  gh|\
  brew|cargo|rustup|go|\
  ssh|scp|rsync|\
  curl|wget|jq|sed|awk|sort|uniq|tr|cut|tee|\
  mkdir|touch|cp|mv|ln|basename|dirname|realpath|readlink|\
  cd|pushd|popd|pwd|date|cal|uname|whoami|id|hostname|\
  tmutil|defaults|open|pbcopy|pbpaste|say|\
  tar|zip|unzip|gzip|gunzip|\
  less|more|diff|comm|xargs|yes|true|false|test)
    exit 0
    ;;
esac

# ── SAFE SUBCOMMANDS — allow non-destructive git/docker/kubectl ───
if [ "$FIRST_BIN" = "git" ]; then
  GIT_SUB=$(echo "$FIRST_CMD" | awk '{print $2}')
  case "$GIT_SUB" in
    status|log|diff|show|branch|tag|remote|fetch|pull|add|commit|\
    merge|rebase|cherry-pick|bisect|blame|shortlog|describe|\
    ls-files|ls-tree|rev-parse|config|init|clone|worktree|\
    stash) # bare "git stash" (save) is safe; drop/clear caught in tier 2
      # But check for destructive stash subcommands
      if [ "$GIT_SUB" = "stash" ] && echo "$NORM_CMD" | grep -qE '\bgit\s+stash\s+(drop|clear)\b'; then
        : # fall through to tier 2
      else
        exit 0
      fi
      ;;
    push)
      # Only safe if no --force/-f flag
      if ! echo "$NORM_CMD" | grep -qE '(-f\b|--force\b|--force-with-lease\b)'; then
        exit 0
      fi
      ;;
  esac
fi

if [ "$FIRST_BIN" = "docker" ]; then
  DOCKER_SUB=$(echo "$FIRST_CMD" | awk '{print $2}')
  case "$DOCKER_SUB" in
    ps|images|logs|inspect|exec|run|build|pull|push|tag|login|logout|\
    compose|network|volume)
      # volume is safe except "volume rm"
      if [ "$DOCKER_SUB" = "volume" ] && echo "$NORM_CMD" | grep -qE '\bvolume\s+rm\b'; then
        : # fall through
      else
        exit 0
      fi
      ;;
  esac
fi

if [ "$FIRST_BIN" = "kubectl" ]; then
  KUBE_SUB=$(echo "$FIRST_CMD" | awk '{print $2}')
  case "$KUBE_SUB" in
    get|describe|logs|exec|port-forward|apply|create|scale|rollout|\
    config|top|explain|api-resources|version)
      exit 0
      ;;
  esac
fi

# ── TIER 1: HARD BLOCK — catastrophic, never intentional ─────────
HARD_BLOCK=""

# rm -rf on root or home
if echo "$NORM_CMD" | grep -qE '\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r)\s+(\/|\/\*|~|~\/)\s*($|;|\||&)'; then
  HARD_BLOCK="rm -rf on root/home directory"
fi

# dd writing to block devices
if echo "$NORM_CMD" | grep -qE '^\s*dd\s+.*of=\/dev\/'; then
  HARD_BLOCK="dd write to block device"
fi

# mkfs as actual command (not in a string)
if echo "$FIRST_BIN" | grep -qE '^mkfs'; then
  HARD_BLOCK="mkfs (format filesystem)"
fi

# chmod/chown -R on root
if echo "$NORM_CMD" | grep -qE '^\s*(chmod|chown)\s+-R\s+.*\s+\/\s*($|;)'; then
  HARD_BLOCK="recursive chmod/chown on root"
fi

if [ -n "$HARD_BLOCK" ]; then
  echo "HARD BLOCK: ${HARD_BLOCK}. Command: ${COMMAND}" >&2
  exit 2
fi

# ── TIER 2: APPROVAL REQUIRED — destructive but sometimes intentional ──
WARN=""

# rm — ANY use of rm requires approval (all deletion is destructive)
if [ "$FIRST_BIN" = "rm" ]; then
  WARN="rm (file/directory deletion)"
fi

# unlink (another way to delete files)
if [ -z "$WARN" ] && [ "$FIRST_BIN" = "unlink" ]; then
  WARN="unlink (file deletion)"
fi

# shred / srm (secure delete)
if [ -z "$WARN" ] && echo "$FIRST_BIN" | grep -qE '^(shred|srm)$'; then
  WARN="${FIRST_BIN} (secure file deletion)"
fi

# rmdir
if [ -z "$WARN" ] && [ "$FIRST_BIN" = "rmdir" ]; then
  WARN="rmdir (directory deletion)"
fi

# trash / trash-put (trash-cli)
if [ -z "$WARN" ] && echo "$FIRST_BIN" | grep -qE '^(trash|trash-put)$'; then
  WARN="${FIRST_BIN} (move to trash)"
fi

# rm anywhere in a pipeline (e.g. xargs rm, find -exec rm, find -delete)
if [ -z "$WARN" ] && echo "$NORM_CMD" | grep -qE '(\|\s*xargs\s+rm\b|exec\s+rm\b|-delete\b)'; then
  WARN="piped/exec deletion (rm via pipeline or find -delete)"
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

# git stash drop / git stash clear (destroys stashed work)
if [ -z "$WARN" ] && echo "$NORM_CMD" | grep -qE '\bgit\s+stash\s+(drop|clear)\b'; then
  WARN="git stash drop/clear (destroys stashed work)"
fi

# DROP DATABASE/TABLE/SCHEMA
if [ -z "$WARN" ] && echo "$NORM_CMD" | grep -qiE '\bDROP\s+(DATABASE|TABLE|SCHEMA)\b'; then
  WARN="DROP DATABASE/TABLE/SCHEMA"
fi

# DELETE FROM / TRUNCATE (database row deletion)
if [ -z "$WARN" ] && echo "$NORM_CMD" | grep -qiE '\b(DELETE\s+FROM|TRUNCATE\s+(TABLE)?)\b'; then
  WARN="DELETE FROM / TRUNCATE (database row deletion)"
fi

# docker rm / docker rmi / docker volume rm / docker system prune
if [ -z "$WARN" ] && echo "$NORM_CMD" | grep -qE '\bdocker\s+(rm|rmi|volume\s+rm|system\s+prune|container\s+rm|image\s+rm)\b'; then
  WARN="docker resource deletion"
fi

# kubectl delete
if [ -z "$WARN" ] && echo "$NORM_CMD" | grep -qE '\bkubectl\s+delete\b'; then
  WARN="kubectl delete (cluster resource deletion)"
fi

if [ -n "$WARN" ]; then
  echo "APPROVAL REQUIRED: ${WARN}" >&2
  echo "Command: ${COMMAND}" >&2
  exit 2
fi

exit 0
