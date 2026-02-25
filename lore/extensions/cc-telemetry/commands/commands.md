---
name: commands
description: Show slash command usage, success rates, and completion times
allowed-tools: [Bash, Read]
---

Analyze usage of slash commands (both built-in and plugin commands) including invocation frequency, success rates, and completion times.

Usage: `/cc-telemetry:commands [--session <id>]`

Parse user messages for command invocations (lines starting with `/`):

!`python3 <<'PYEOF'
import sys
import os
sys.path.insert(0, os.path.expanduser("~/claude-code-dev/tooling/cc-telemetry/daemon"))
import db
from collections import Counter

conn = db.open_db()
rows = conn.execute("""
    SELECT content FROM system_messages 
    WHERE message_type='skill_load'
    ORDER BY ts DESC LIMIT 100
""").fetchall()

# Extract command names from skill load messages
commands = Counter()
for row in rows:
    content = row[0]
    if "Launching" in content and ":" in content:
        parts = content.split(":")
        if len(parts) >= 2:
            cmd = parts[1].split()[0].strip()
            commands[cmd] += 1

print("Most Used Commands:")
for cmd, count in commands.most_common(10):
    print(f"  {cmd}: {count} invocations")
PYEOF
`

Shows command usage patterns and frequency.
