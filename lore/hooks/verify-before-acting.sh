#!/usr/bin/env bash
# verify-before-acting.sh — UserPromptSubmit hook
# Reminds Claude to always read and verify code before making changes.
# Fires on EVERY message.
set -euo pipefail

cat <<'MSG'
MANDATORY — VERIFY BEFORE ACTING:
1. Never infer, assume, or guess what code looks like. When you need to understand, modify, or reference code — READ the actual file first using the Read tool.
2. If the user tells you to read something, you MUST use the Read tool — never summarize from memory.
3. Before claiming something is missing, implemented, or broken — search for it (Grep/Glob) and read the actual files as evidence.
4. Check for alternative implementations before saying "not implemented" — search broader patterns, not just the exact term.
5. When documenting findings, cite specific file paths and line numbers. No evidence = no claim.
6. Do not judge by filename, comments, or file extension alone — read the actual content.
7. Distinguish "missing" from "implemented differently." If docs say X but code uses Y achieving the same goal, that's an alternative, not a gap.
MSG

exit 0
