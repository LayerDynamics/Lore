#!/usr/bin/env bash
# Lore Stop Hook: Verification before completion
# Checks that the assistant has run verification steps before claiming done.

# Read the last assistant message from stdin (Stop hooks receive conversation context)
INPUT=$(cat)

# Check if the message claims completion
if echo "$INPUT" | grep -qiE '(complete|done|finished|all (tests|checks) pass)'; then
  # Check if verification evidence is present
  if echo "$INPUT" | grep -qiE '(test.*pass|verified|confirmed|output shows)'; then
    exit 0  # Verification found, allow stop
  else
    echo "WARN: Completion claimed without visible verification evidence. Consider running tests first."
    exit 0  # Warn but don't block
  fi
fi

exit 0
