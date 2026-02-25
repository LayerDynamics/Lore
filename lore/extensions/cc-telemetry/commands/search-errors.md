---
name: search-errors
description: Search for errors matching a pattern across all sessions
allowed-tools: [Bash]
---

Search error log for errors matching a specific pattern (error message, tool name, or keyword).

Usage: `/cc-telemetry:search-errors "<pattern>"`

Query errors matching the pattern:

!`python3 <<'PYEOF'
import sys
import os
sys.path.insert(0, os.path.expanduser("~/claude-code-dev/tooling/cc-telemetry/daemon"))
import db

pattern = "$1" if len(sys.argv) > 1 else ""
if not pattern:
    print("Usage: search-errors '<pattern>'")
    sys.exit(1)

conn = db.open_db()
rows = db.query_errors(conn, limit=100)

matches = []
for r in rows:
    if pattern.lower() in r['error_message'].lower() or pattern.lower() in (r['tool_name'] or "").lower():
        matches.append(r)

print(f"Found {len(matches)} errors matching '{pattern}':\n")
for r in matches[:20]:
    print(f"[{r['ts']}] {r['tool_name']}: {r['error_message'][:100]}")
    if r['thinking_before']:
        print(f"  Thinking: {r['thinking_before'][:80]}")
    print()
PYEOF
`

Useful for finding recurring errors or specific error types across all sessions.
