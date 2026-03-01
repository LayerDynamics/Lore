#!/usr/bin/env bash
# prompt-skill-detector.sh — UserPromptSubmit hook
# Detects skill invocations in user prompts and validates they exist
set -euo pipefail

INPUT=$(cat)

PROMPT=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('user_prompt',''))" 2>/dev/null || echo "")

if [ -z "$PROMPT" ]; then
  exit 0
fi

# Detect /namespace:skill patterns
SKILLS=$(echo "$PROMPT" | python3 -c "
import sys, re
prompt = sys.stdin.read()
matches = re.findall(r'/([a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+)', prompt)
if matches:
    print('\n'.join(matches))
" 2>/dev/null || echo "")

if [ -z "$SKILLS" ]; then
  exit 0
fi

PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(dirname "$(realpath "$0")")")}"
SKILLS_DIR="${PLUGIN_ROOT}/skills"
COMMANDS_DIR="${PLUGIN_ROOT}/commands"

WARNINGS=""

while IFS= read -r skill; do
  [ -z "$skill" ] && continue
  NAMESPACE=$(echo "$skill" | cut -d: -f1)
  NAME=$(echo "$skill" | cut -d: -f2)

  # Check skills directory
  if [ -d "${SKILLS_DIR}/${NAME}" ] && [ -f "${SKILLS_DIR}/${NAME}/SKILL.md" ]; then
    continue
  fi

  # Check commands directory
  if [ -f "${COMMANDS_DIR}/${NAME}.md" ] || [ -f "${COMMANDS_DIR}/${NAMESPACE}/${NAME}.md" ]; then
    continue
  fi

  WARNINGS="${WARNINGS}Skill '${skill}' not found in skills/ or commands/. "
done <<< "$SKILLS"

if [ -n "$WARNINGS" ]; then
  echo "Warning: ${WARNINGS}" >&2
fi

exit 0
