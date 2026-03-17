---
allowed-tools: ["Bash"]
description: "Launch the cc-telemetry web dashboard for visual exploration of sessions, tool calls, errors, and token usage"
---

# /cc-telemetry:dashboard

Launch the cc-telemetry web dashboard.

## Steps

1. Run the dashboard server:
```bash
python3 "$(dirname "$(which cc-telemetry 2>/dev/null || echo "$HOME/.claude/plugins/lore/extensions/cc-telemetry/bin/cc-telemetry")")/../app/dashboard.py" "$@"
```

If the above path doesn't resolve, use:
```bash
python3 ~/.claude/plugins/lore/extensions/cc-telemetry/app/dashboard.py "$@"
```

The dashboard opens at http://127.0.0.1:7900 by default.

Options:
- `--port N` — Use a different port
- `--no-open` — Don't auto-open the browser
