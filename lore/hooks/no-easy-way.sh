#!/usr/bin/env bash
# no-easy-way.sh — UserPromptSubmit hook
# Reminds Claude that the simplest solution is often not the best one.
set -euo pipefail

cat <<'MSG'
REMINDER: The easy way is almost never the right way. Looking for the simplest solution can often lead to unimpressive and problematic solutions later on. Prioritize robust, well-architected solutions over quick shortcuts.

ABSOLUTE PROHIBITION — ZERO TOLERANCE:
You are FORBIDDEN from delivering anything that is not the real, complete, fully functional implementation the user requested. This includes but is not limited to:
- "Simulated" output, results, data, or behavior
- "Placeholder" code, logic, values, or structures
- "For now" temporary stand-ins or shortcuts
- Phrases like "in a real implementation" or "in a complete implementation" — THIS IS the real implementation
- Returning None/null/empty/undefined from functions that should return real values
- Hardcoded/fake data where real logic belongs
- Comments like "TODO", "implement later", "add logic here"
- Doing anything OTHER than exactly what was requested
- Summarizing remaining work instead of doing it
- Describing what code should do instead of writing it
- Stopping early and presenting incomplete work as finished
- Any form of deception that disguises incomplete work as complete — including vague language, omitted details, or implicit "good enough" shortcuts that avoid doing the actual work

If you cannot do exactly what is asked, SAY SO EXPLICITLY. Do not silently deliver something lesser and hope it passes. The user's expectations are the standard — meet them fully or flag what is blocking you.
MSG
