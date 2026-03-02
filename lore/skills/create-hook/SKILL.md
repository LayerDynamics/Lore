---
name: create-hook
description: Use when creating, managing, or authoring Claude Code hooks. Guides through hook type selection, matcher configuration, script creation, and registration in hooks.json.
argument-hint: <hook-name> [--event <event>] [--matcher <tool>]
---

# Lore: Create Hook

Create a new Claude Code hook with guided configuration, script implementation, and registration.

## Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- **Hook name** (required): kebab-case name (e.g., `lint-on-save`, `block-force-push`)
- **Event** (optional): `--event <event>` — the hook event type
- **Matcher** (optional): `--matcher <tool>` — tool name matcher for Pre/PostToolUse

If hook name is missing, ask the user:
> What should the hook be named? (use kebab-case, e.g., `lint-on-save`)

Validate:
- Must be kebab-case
- Must not conflict with an existing hook in `lore/hooks/`

## Step 2: Select Hook Event

If no `--event` was provided, ask the user which event this hook should fire on:

| Event | When It Fires | Stdin Data |
|-------|--------------|------------|
| **PreToolUse** | Before a tool executes — can BLOCK (exit 2) | `tool_name`, `tool_input` |
| **PostToolUse** | After a tool executes — can provide feedback | `tool_name`, `tool_input`, `tool_response` |
| **UserPromptSubmit** | When user submits a prompt — can modify/intercept | `prompt_content` |
| **SessionStart** | When a Claude Code session begins | (none — environment only) |
| **Stop** | When a session ends | (none — environment only) |

> Which event should this hook fire on?
> 1. PreToolUse — guard/validate before tool runs (can block)
> 2. PostToolUse — check/audit after tool runs (feedback only)
> 3. UserPromptSubmit — intercept/route user prompts
> 4. SessionStart — initialize on session start
> 5. Stop — cleanup on session end

## Step 3: Configure Matcher (Pre/PostToolUse only)

If event is `PreToolUse` or `PostToolUse`, ask:

> Which tool(s) should trigger this hook?
> - Specific tool: `Bash`, `Write`, `Edit`, `Read`, `Glob`, `Grep`, `Task`, `Skill`
> - Multiple tools: `Write|Edit`, `Bash|Task`
> - All tools: (leave matcher empty)

Common patterns:
- `Bash` — guard shell commands
- `Write|Edit` — validate file changes
- `Task` — monitor subagent dispatch
- `Skill` — track skill usage

## Step 4: Define Hook Behavior

Ask the user:

1. **What should this hook do?** (brief description of the logic)
2. **Should it block or just report?**
   - **Block** (PreToolUse only): exit code 2 + stderr message prevents the tool from running
   - **Report**: stdout feedback shown to Claude, does not block
3. **What should it check/detect?** (patterns, conditions, file types, etc.)

## Step 5: Read Existing Hooks for Reference

Read the hooks directory to understand patterns:
```
lore/hooks/hooks.json
```

Pick a similar existing hook as reference:
- Guard hooks: `secret-leak-guard.sh`, `destructive-action-guard.sh`, `branch-protection.sh`
- Quality hooks: `code-quality-gate.sh`, `placeholder-detector.sh`
- Tracking hooks: `tdd-phase-tracker.sh`, `command-lifecycle.sh`
- Routing hooks: `prompt-skill-detector.sh`, `prompt-command-router.sh`

## Step 6: Create the Hook Script

Create `lore/hooks/<hook-name>.sh`:

```bash
#!/usr/bin/env bash
# <hook-name>.sh — <Event> hook for <Matcher or "all tools">
# <Brief description>
set -euo pipefail

INPUT=$(cat)

# Parse input JSON
TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")
```

### For PreToolUse (blocking) hooks:

```bash
# Extract tool input
TOOL_INPUT=$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
ti = data.get('tool_input', {})
# Access specific fields: ti.get('command', ''), ti.get('file_path', ''), etc.
print(json.dumps(ti))
" 2>/dev/null || echo "{}")

# Check condition
# ... detection logic here ...

if [ -n "$VIOLATION" ]; then
  echo "BLOCKED: <reason> — <details>" >&2
  exit 2
fi

exit 0
```

### For PostToolUse (feedback) hooks:

```bash
# Extract tool response
RESPONSE=$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(json.dumps(data.get('tool_response', {})))
" 2>/dev/null || echo "{}")

# Analyze and report
# ... analysis logic here ...

if [ -n "$FINDING" ]; then
  echo "<finding summary>"
fi

exit 0
```

### For UserPromptSubmit hooks:

```bash
PROMPT=$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('prompt_content', ''))
" 2>/dev/null || echo "")

# Route or transform
# ... logic here ...

exit 0
```

### For SessionStart/Stop hooks:

```bash
# No stdin parsing needed — use environment variables
# ... initialization or cleanup logic ...

exit 0
```

Make the script executable:
```bash
chmod +x lore/hooks/<hook-name>.sh
```

## Step 7: Register in hooks.json

Read `lore/hooks/hooks.json` and add the new hook entry under the appropriate event.

**With matcher** (PreToolUse/PostToolUse):
```json
{
  "matcher": "<Tool|Tool>",
  "hooks": [
    {
      "type": "command",
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/<hook-name>.sh",
      "timeout": 5
    }
  ]
}
```

**Without matcher** (SessionStart/Stop/UserPromptSubmit or match-all):
```json
{
  "hooks": [
    {
      "type": "command",
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/<hook-name>.sh",
      "timeout": 5
    }
  ]
}
```

Append the entry to the correct event array in hooks.json. Do not remove existing hooks.

## Step 8: Confirm

Output:

```
Hook created: <hook-name>

Event:   <event>
Matcher: <matcher or "all">
Action:  <blocks | reports feedback>

Created:
  lore/hooks/<hook-name>.sh

Updated:
  lore/hooks/hooks.json (added to <event>)

Behavior:
  <1-2 sentence description of what the hook does>

Next steps:
  1. Test by triggering the relevant tool/event in a Claude Code session
  2. Check hook output in the session feedback
  3. Run /lore:list to verify hooks are loaded
```

## Rules

- All hook scripts MUST use `set -euo pipefail`
- All hook scripts MUST read stdin with `INPUT=$(cat)` (even if unused)
- PreToolUse blocking hooks MUST exit 2 and write to stderr to block
- PostToolUse hooks MUST NOT exit non-zero (feedback only)
- All hooks MUST have a timeout (default 5, max 15 for Stop hooks)
- All hooks MUST gracefully handle missing/malformed input (use `|| echo ""` fallbacks)
- Use `${CLAUDE_PLUGIN_ROOT}` as the path prefix in hooks.json — never hardcode paths
- Keep hooks fast — they run on every matching tool call
