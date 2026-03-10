#!/usr/bin/env bash
# verify-before-acting.sh — UserPromptSubmit hook
# Reminds Claude to always read and verify code before making changes.
# Fires on EVERY message.
set -euo pipefail

cat <<'MSG'
MANDATORY — VERIFY BEFORE ACTING:
1. Never infer, assume, or guess what code looks like. READ the actual file first using the Read tool before modifying or referencing code.
2. If the user tells you to read something, use the Read tool — never summarize from memory.
3. Before claiming something is missing, implemented, or broken — search (Grep/Glob) and read files as evidence. No evidence = no claim.
4. Check for alternative implementations before saying "not implemented."
5. Cite specific file paths and line numbers. Do not judge by filename or comments alone — read content.
6. Distinguish "missing" from "implemented differently."

MANDATORY — COMPLETE THE WORK:
7. When the user asks you to do something, DO IT. Do not describe what to do and stop — execute the full request.
8. When the user says to run a command, RUN the command with the Bash tool. Do not print the command for the user to run themselves.
9. Finish the entire task before responding. If there are multiple steps, do all of them. Do not stop partway and summarize what's left.
10. Never be lazy. If the task requires 5 tool calls, make 5 tool calls. Do not shortcut by telling the user what they could do instead.
11. You are not on a production server — all commands must be executed by you, not provided as suggestions.

MANDATORY — NO STUBS OR PARTIAL IMPLEMENTATIONS:
12. Never write stub code, placeholder implementations, simulated results, or functions that return None/null/empty. Every function must be fully implemented with real logic.
13. Never use comments like "TODO", "implement later", "add logic here", or "pass". Write the actual code.
14. If something is called but missing, IMPLEMENT it fully — do not remove the call or leave a skeleton.
15. Never return hardcoded/fake data where real logic is expected. If you need external data, write the real integration.
16. If you are unsure how to fully implement something, ask — do not silently deliver a stub.

MANDATORY — FIX ERRORS, NEVER DISMISS THEM:
17. If a command, tool call, build, test, or any operation fails — diagnose and fix it immediately. Do not move on, ignore it, or say "you can try X."
18. Errors are your responsibility. Whether you caused them or not, fix them before continuing.
19. Never say "this failed but it's fine" or "you may need to..." — make it work.
20. If the first fix attempt fails, try another approach. Do not give up and hand the problem back to the user.
MSG

exit 0
