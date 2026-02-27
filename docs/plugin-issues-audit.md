# Lore Plugin System Audit

**Date:** 2026-02-27
**Scope:** Compare lore plugin structure against current Claude Code plugin documentation

---

## Critical Issues

### 1. hooks.json format is incorrect

**File:** `lore/hooks/hooks.json`

**Current (wrong):**
```json
{
  "hooks": [
    {
      "type": "SessionStart",
      "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/start-session.sh",
      "description": "Display Lore welcome message on session start"
    },
    {
      "type": "Stop",
      "command": "bash ${CLAUDE_PLUGIN_ROOT}/hooks/verify-completion.sh",
      "description": "Verify tests pass and work is complete before claiming done"
    }
  ]
}
```

**Expected (correct):**
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/start-session.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/verify-completion.sh"
          }
        ]
      }
    ]
  }
}
```

**What's wrong:**
- `hooks` must be an **object keyed by event name**, not an array
- Each event maps to an array of **matcher groups** (objects with optional `matcher` and a `hooks` array)
- Each hook entry needs `"type": "command"` — the `type` field specifies hook kind (command, prompt, agent), not the event name
- `"description"` is not a valid field in the hook schema
- `bash` prefix in the command is unnecessary — the script shebang handles it

---

## Medium Issues

### 2. install.sh does not follow plugin installation conventions

**File:** `lore/bin/install.sh`

**Current behavior:** Symlinks `lore/` into `~/.claude/plugins/lore`.

**Problem:** Claude Code does not discover plugins by scanning `~/.claude/plugins/` as a flat directory. That directory contains marketplace data, cache, config files, and installed plugin directories — but direct symlinks placed there are not automatically loaded.

Installed plugins are:
- Tracked via `enabledPlugins` in `~/.claude/settings.json`
- Cached in `~/.claude/plugins/cache/`
- Resolved through marketplace registration

**The symlink alone does nothing.** The plugin currently works because `lore@local: true` was manually added to `enabledPlugins` in settings.json — the install script didn't do that.

**Correct approaches:**
| Method | Command | Use Case |
|--------|---------|----------|
| Development | `claude --plugin-dir ./lore` | Local dev, no caching |
| Local marketplace | `/plugin marketplace add ./path` then `/plugin install` | Persistent local install |
| Direct settings | Add `enabledPlugins` entry + ensure path resolution | Manual override |

**Fix:** Either update install.sh to modify `~/.claude/settings.json` programmatically, or replace with documentation for `--plugin-dir` usage and marketplace-based installation.

### 3. Command namespace structure may cause discovery issues

**Directory:** `lore/commands/`

**Current structure:**
```
commands/
├── lore/
│   ├── init.md
│   ├── list.md
│   └── ...
├── code-intel/
│   ├── review.md
│   └── ...
├── research/
│   ├── deep-dive.md
│   └── ...
└── ...
```

**Problem:** Per Claude Code docs, all commands in a plugin are namespaced under the **plugin name**. Subdirectory names within `commands/` create organizational folders but the slash-command name uses the plugin prefix:
- `commands/code-intel/review.md` in plugin `lore` → `/lore:review` (not `/code-intel:review`)

If the intent is for these to register as `/code-intel:review`, `/research:deep-dive`, etc., they need to be separate plugins or the naming convention needs to change.

**Needs verification:** Test what slash-command names actually register and whether they match user expectations.

### 4. Dual plugin registration creates ambiguity

**File:** `~/.claude/settings.json`

```json
{
  "enabledPlugins": {
    "lore@local": true,
    "lore@lore-marketplace": true
  }
}
```

Two entries for the same plugin from different sources. This could cause:
- Duplicate component loading (skills, commands, agents registered twice)
- Confusion about which source is authoritative
- Update conflicts between the two sources

**Fix:** Use a single registration source. Remove one entry.

---

## Low Issues

### 5. plugin.json missing explicit component paths

**File:** `lore/.claude-plugin/plugin.json`

**Current:**
```json
{
  "name": "lore",
  "version": "1.0.0",
  "description": "Opinionated meta skills & plugin framework for deterministic results",
  "author": {
    "name": "LayerDynamics"
  }
}
```

**Recommended additions:**
```json
{
  "name": "lore",
  "version": "1.0.0",
  "description": "Opinionated meta skills & plugin framework for deterministic results",
  "author": {
    "name": "LayerDynamics"
  },
  "commands": "./commands/",
  "agents": "./agents/",
  "skills": "./skills/",
  "hooks": "./hooks/hooks.json"
}
```

Auto-discovery from default directory names should work, but explicit paths are more reliable and serve as documentation of plugin structure.

### 6. Extra directories at plugin root may cause noise

**Current plugin root contents:**
```
lore/
├── .claude-plugin/
├── agents/
├── assets/
├── bin/
├── commands/
├── docs/
├── extensions/
├── hooks/
├── lib/
├── mcp/
├── skills/
├── templates/
├── tests/
├── workflows/
├── package.json
├── postinstall.sh
└── README.md
```

Directories like `assets/`, `bin/`, `docs/`, `extensions/`, `lib/`, `templates/`, `tests/`, `workflows/` are not part of the plugin spec. Claude Code ignores them, but they add weight when the plugin is cached/copied during marketplace installation. Consider whether all of these need to ship with the plugin vs. living in the dev workspace only.

---

## Fix Priority

| # | Issue | Severity | Effort |
|---|-------|----------|--------|
| 1 | hooks.json format wrong | Critical | Small — rewrite one file |
| 2 | install.sh doesn't work | Medium | Medium — decide on installation strategy |
| 3 | Command namespacing | Medium | Medium — verify behavior, possibly restructure |
| 4 | Dual registration | Medium | Small — remove one entry from settings |
| 5 | plugin.json missing paths | Low | Small — add 4 fields |
| 6 | Extra root directories | Low | Small — evaluate what ships vs. dev-only |

---

## References

- Claude Code plugin documentation (official, Feb 2026)
- Current plugin structure at `/Users/ryanoboyle/lore/lore/`
- User settings at `~/.claude/settings.json`
