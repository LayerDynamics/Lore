#!/usr/bin/env bash
# no-easy-way.sh — UserPromptSubmit hook
# Reminds Claude that the simplest solution is often not the best one.
set -euo pipefail

cat <<'MSG'
REMINDER: The easy way is almost never the right way. Looking for the simplest solution can often lead to unimpressive and problematic solutions later on. Prioritize robust, well-architected solutions over quick shortcuts.
MSG
