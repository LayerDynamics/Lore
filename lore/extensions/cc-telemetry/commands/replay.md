---
name: replay
description: Full session replay showing thinking blocks, tools, and results in sequence
allowed-tools: [Bash, Read]
---

Replay a complete Claude Code session showing the full timeline: thinking blocks, tool calls, results, errors, and system messages in chronological order.

Usage: `/cc-telemetry:replay <session-id>`

Query all events for the session:

!`python3 <<'PYEOF'
import sys
import os
sys.path.insert(0, os.path.expanduser("~/claude-code-dev/tooling/cc-telemetry/daemon"))
import db

session = "$1" if len(sys.argv) > 1 else None
if not session:
    print("Usage: replay <session-id>")
    sys.exit(1)

conn = db.open_db()

# Get all events for session, ordered by timestamp
events = []

# Thinking blocks
for row in conn.execute("SELECT ts, thinking_content FROM thinking_blocks WHERE session_id=? ORDER BY ts", (session,)):
    events.append((row[0], "THINKING", row[1][:200] + "..."))

# Tool calls
for row in conn.execute("SELECT started_at, tool_name, tool_use_id FROM tool_calls WHERE session_id=? ORDER BY started_at", (session,)):
    events.append((row[0], "TOOL", f"{row[1]} ({row[2][:8]})"))
    
# Errors
for row in conn.execute("SELECT ts, error_message FROM errors WHERE session_id=? ORDER BY ts", (session,)):
    events.append((row[0], "ERROR", row[1][:100]))

events.sort(key=lambda x: x[0])

print(f"Session Replay: {session}\n")
for ts, etype, content in events:
    print(f"[{ts}] {etype:10} {content}")
PYEOF
`

Shows complete session timeline for debugging and understanding what happened.
