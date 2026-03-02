---
description: List, enable, disable, or remove hooks from the lore framework. Shows all registered hooks with their event, matcher, and script path.
argument-hint: [list | enable <hook> | disable <hook> | remove <hook>]
---

# Manage Hooks

View and manage all hooks registered in the lore framework.

## Step 1: Parse Action

Extract from `$ARGUMENTS`:
- **list** (default): show all registered hooks
- **enable <hook-name>**: re-enable a disabled hook
- **disable <hook-name>**: comment out a hook (keeps script, removes from hooks.json)
- **remove <hook-name>**: delete hook script and remove from hooks.json

If no arguments, default to `list`.

## Step 2: List Hooks

Read `lore/hooks/hooks.json` and parse all hook registrations.

For each hook, display:

```
## Registered Hooks

| # | Event           | Matcher    | Script                    | Timeout |
|---|-----------------|------------|---------------------------|---------|
| 1 | SessionStart    | —          | start-session.sh          | 10s     |
| 2 | SessionStart    | —          | session-context-loader.sh | 5s      |
| 3 | PreToolUse      | Task       | pre-agent-dispatch.sh     | 5s      |
| 4 | PreToolUse      | Bash       | destructive-action-guard  | 5s      |
...

Total: N hooks across M events
```

Also check for orphaned scripts (`.sh` files in `lore/hooks/` not referenced in hooks.json):

```
### Orphaned Scripts (not registered)
- some-old-hook.sh
```

And check for extension hooks:

```
### Extension Hooks
- browserx: 2 hooks (hooks/hooks.json)
- cc-telemetry: 1 hook (hooks/hooks.json)
```

If action is `list`, stop here.

## Step 3: Disable Hook

If action is `disable <hook-name>`:

1. Find the hook entry in `lore/hooks/hooks.json` matching the script name
2. Remove that entry from the event array
3. Do NOT delete the `.sh` script file
4. Report: `Disabled: <hook-name> (script preserved at lore/hooks/<hook-name>.sh)`

## Step 4: Enable Hook

If action is `enable <hook-name>`:

1. Verify `lore/hooks/<hook-name>.sh` exists
2. Ask which event and matcher to register under (or auto-detect from script header comment)
3. Add the entry back to `lore/hooks/hooks.json`
4. Report: `Enabled: <hook-name> on <event> (matcher: <matcher>)`

## Step 5: Remove Hook

If action is `remove <hook-name>`:

1. Confirm with the user: "Remove <hook-name>? This deletes the script and unregisters it."
2. Remove from `lore/hooks/hooks.json`
3. Delete `lore/hooks/<hook-name>.sh`
4. Report: `Removed: <hook-name>`
