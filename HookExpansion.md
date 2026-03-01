# Hook Expansion Plan

Comprehensive inventory of hook opportunities across the Lore plugin framework.

---

## Current State

### Existing Hooks (Root Plugin)

| Event | Script | Behavior |
|---|---|---|
| `SessionStart` | `hooks/start-session.sh` | Checks extensions, emits status banner |
| `Stop` | `hooks/verify-completion.sh` | Advisory warning if completion claimed without evidence |

### Existing Extension Hooks

| Extension | Event | Script | Behavior |
|---|---|---|---|
| browserx | `SessionStart` | `session-start.sh` | Extension status check |
| browserx | `PreToolUse` | `intercept-web.sh` | **Blocks** `WebFetch`/`WebSearch` (exit 2) — only blocking hook in framework |
| cc-telemetry | All 5 events | Python scripts | Full telemetry logging to `~/.claude/telemetry/` |

### Unused Events at Root Level

- `PreToolUse` — not wired
- `PostToolUse` — not wired
- `UserPromptSubmit` — not wired

---

## Hook Opportunities by Area

### 1. Root Plugin Hooks (`lore/hooks/`)

| Hook Name | Event Type | Trigger | Purpose |
|---|---|---|---|
| `pre-tool-guard` | `PreToolUse` | Any tool call | Enforce tool usage policies (e.g., prevent `Bash` for file reads) |
| `post-tool-audit` | `PostToolUse` | Any tool call | Log tool results, detect errors, track tool chains |
| `prompt-skill-detector` | `UserPromptSubmit` | User prompt | Detect skill invocations, validate skill exists before execution |
| `prompt-command-router` | `UserPromptSubmit` | `/lore:*` commands | Pre-validate command args, log command usage |
| `session-context-loader` | `SessionStart` | Session begin | Load project-specific context (`.claude/` files, recent plans) |
| `session-summary` | `Stop` | Session end | Generate session summary, update memory files |
| `destructive-action-guard` | `PreToolUse` | `Bash`, `Write`, `Edit` | Block destructive commands (`rm -rf`, `git push --force`) |

### 2. Skill Lifecycle Hooks

Skills are markdown — hooks fire at the Claude Code level by detecting skill patterns.

| Hook Name | Event Type | Trigger | Purpose |
|---|---|---|---|
| `pre-skill-execute` | `UserPromptSubmit` | Skill invocation detected | Validate prerequisites, load skill dependencies |
| `post-skill-complete` | `PostToolUse` | Skill tool returns | Verify skill output meets quality gates |
| `on-tdd-red-phase` | `PostToolUse` | Test run fails (expected) | Log TDD cycle, enforce red-before-green |
| `on-tdd-green-phase` | `PostToolUse` | Test run passes | Gate refactor phase, prevent premature completion |
| `on-plan-created` | `PostToolUse` | `Write` to `docs/plans/` | Validate plan structure, register in plan index |
| `on-plan-task-complete` | `PostToolUse` | `TaskUpdate` status=completed | Track plan progress, trigger next wave |
| `on-brainstorm-complete` | `PostToolUse` | Brainstorming skill returns | Ensure ideas captured before implementation begins |
| `pre-verification` | `UserPromptSubmit` | Completion language detected | Enforce verification-before-completion skill |

### 3. Command Hooks (`lore/commands/`)

| Hook Name | Event Type | Trigger | Purpose |
|---|---|---|---|
| `pre-command-validate` | `UserPromptSubmit` | Any `/lore:*` command | Validate args, check prerequisites |
| `post-command-log` | `PostToolUse` | Command completes | Log command execution for standup generation |
| `on-init-complete` | `PostToolUse` | `/lore:init` finishes | Verify `.claude/settings.json` updated correctly |
| `on-review-request` | `UserPromptSubmit` | `/lore:review` invoked | Load review methodology, set review context |
| `on-investigate-start` | `UserPromptSubmit` | `/lore:investigate` | Set investigation scope, prevent scope creep |

### 4. Agent Hooks (`lore/agents/`)

| Hook Name | Event Type | Trigger | Purpose |
|---|---|---|---|
| `pre-agent-dispatch` | `PreToolUse` | `Task` tool called | Validate agent exists, log dispatch, enforce WIP limits |
| `post-agent-complete` | `PostToolUse` | `Task` tool returns | Validate agent output, detect failures, track duration |
| `on-agent-failure` | `PostToolUse` | `Task` returns error | Retry logic, escalation, log failure patterns |
| `agent-concurrency-guard` | `PreToolUse` | `Task` tool called | Enforce max parallel agents (WIP limit from coach) |
| `post-agent-quality-gate` | `PostToolUse` | `code-reviewer` agent returns | Ensure review findings are addressed before merge |
| `on-stub-scan-complete` | `PostToolUse` | `stub-scanner` returns | Auto-trigger `stub-implementer` if stubs found |

### 5. Extension Hooks

#### browserx (`extensions/browserx/`)

| Hook Name | Event Type | Trigger | Purpose |
|---|---|---|---|
| `on-browser-session-start` | `SessionStart` | BrowserX MCP confirmed | Initialize browser pool, set default viewport |
| `post-web-intercept-log` | `PreToolUse` | After web intercept fires | Log intercepted URLs for debugging |
| `on-page-navigation` | `PostToolUse` | Browser navigate tool | Track navigation history, detect infinite loops |

#### cc-telemetry (`extensions/cc-telemetry/`)

Already implements all 5 events. Expansion opportunities:

| Hook Name | Event Type | Trigger | Purpose |
|---|---|---|---|
| `telemetry-alert` | `PostToolUse` | Error rate threshold | Alert when error count exceeds threshold in session |
| `session-cost-tracker` | `PostToolUse` | Every tool call | Estimate token/cost usage, warn at thresholds |
| `skill-usage-analytics` | `Stop` | Session end | Aggregate skill effectiveness metrics |

#### scratchpad (`extensions/scratchpad/`)

Currently has zero Claude Code hook integration. Only has process signal handlers.

| Hook Name | Event Type | Trigger | Purpose |
|---|---|---|---|
| `scratchpad-session-sync` | `SessionStart` | Session begin | Auto-open scratchpad, load last session state |
| `scratchpad-auto-save` | `Stop` | Session end | Persist canvas state before shutdown |
| `on-canvas-modified` | `PostToolUse` | MCP tool updates canvas | Sync canvas changes back to files |

#### mcp-trigger-gateway (`extensions/mcp-trigger-gateway/`)

Described as event trigger gateway but has **no hooks.json at all**. Largest gap in framework.

| Hook Name | Event Type | Trigger | Purpose |
|---|---|---|---|
| `gateway-event-relay` | `PostToolUse` | Any tool completes | Relay events to registered MCP servers/HTTP endpoints |
| `gateway-webhook-fire` | `PostToolUse` | Configurable matchers | Fire webhooks on specific tool completions |
| `gateway-session-events` | `SessionStart`/`Stop` | Session lifecycle | Notify external systems of session start/end |
| `gateway-error-escalation` | `PostToolUse` | Error detected | Route errors to monitoring systems |

#### trellio (`extensions/trellio/`)

No hooks.json. Wraps Trello MCP.

| Hook Name | Event Type | Trigger | Purpose |
|---|---|---|---|
| `trello-task-sync` | `PostToolUse` | `TaskUpdate` completed | Auto-update Trello card when plan task completes |
| `trello-session-log` | `Stop` | Session end | Post session summary as Trello comment |
| `trello-card-context` | `SessionStart` | Session begin | Load active Trello card context into session |

#### findlazy (`extensions/findlazy/`)

No hooks.json.

| Hook Name | Event Type | Trigger | Purpose |
|---|---|---|---|
| `lazy-import-check` | `PostToolUse` | `Write`/`Edit` completes | Detect unused imports in modified files |
| `lazy-dead-code-scan` | `Stop` | Session end | Report dead code introduced during session |

### 6. Library Hooks (`lore/lib/`)

The lib has primitives (`runTool`, `runToolAsync`, `runScript`, registry) but no hook dispatch layer.

| Hook Name | Location | Trigger | Purpose |
|---|---|---|---|
| `pre-skill-install` | `lib/skills/skill-installer.js` | Before `installSkill` | Validate skill structure, check conflicts |
| `post-skill-install` | `lib/skills/skill-installer.js` | After `installSkill` | Update skill index, run skill doctor |
| `pre-skill-uninstall` | `lib/skills/skill-uninstaller.js` | Before `uninstallSkill` | Check dependents, confirm removal |
| `post-skill-repair` | `lib/skills/skill-repair.js` | After `repairSkill` | Verify repair succeeded, log changes |
| `on-registry-change` | `lib/regestry.js` | `register`/`unregister` | Notify subscribers of registry mutations |
| `on-mcp-server-start` | `lib/run/run_mcp.js` | `runMcpServer` called | Log MCP server lifecycle, update status |
| `on-mcp-server-stop` | `lib/run/run_mcp.js` | `stopMcpServer` called | Cleanup resources, notify dependents |
| `pre-tool-run` | `lib/run/run_tool.js` | `runTool` called | Validate command, enforce allowlist |
| `post-tool-run` | `lib/run/run_tool.js` | `runTool` returns | Log execution result, detect errors |

### 7. Gateway MCP Hooks (`lore/mcp/lore/gateway.js`)

| Hook Name | Location | Trigger | Purpose |
|---|---|---|---|
| `pre-mcp-tool-call` | gateway.js handler | Before any MCP tool handler | Validate inputs, check permissions |
| `post-mcp-tool-call` | gateway.js handler | After any MCP tool handler | Log results, update metrics |
| `on-gateway-error` | gateway.js error handler | Tool handler throws | Structured error logging, recovery |
| `on-registry-query` | gateway.js list handlers | `lore_list_*` called | Track what's being queried for analytics |

### 8. Quality & Security Hooks

Cross-cutting hooks that could apply across multiple areas.

| Hook Name | Event Type | Trigger | Purpose |
|---|---|---|---|
| `secret-leak-guard` | `PreToolUse` | `Write`/`Edit`/`Bash` | Scan for secrets/credentials before writing |
| `code-quality-gate` | `PostToolUse` | `Write`/`Edit` completes | Run linting on modified files |
| `test-regression-check` | `PostToolUse` | `Edit` on source files | Auto-run related tests after code changes |
| `dependency-audit` | `PostToolUse` | `Bash` npm/pip install | Check new dependencies for vulnerabilities |
| `commit-message-lint` | `PreToolUse` | `Bash` git commit | Validate commit message format |
| `branch-protection` | `PreToolUse` | `Bash` git push | Prevent push to protected branches |
| `file-size-guard` | `PreToolUse` | `Write` | Warn on files exceeding size threshold |
| `placeholder-detector` | `PostToolUse` | `Write`/`Edit` completes | Detect TODO/FIXME/placeholder patterns in new code |

---

## Implementation Priority

### Tier 1 — High Impact, Low Effort
These use existing Claude Code hook events and require only new shell/Python scripts + hooks.json entries.

1. **`pre-agent-dispatch`** — PreToolUse on Task tool (enforce WIP limits, log dispatches)
2. **`destructive-action-guard`** — PreToolUse on Bash (block `rm -rf`, `git push --force`)
3. **`secret-leak-guard`** — PreToolUse on Write/Edit (scan for API keys, passwords)
4. **`prompt-skill-detector`** — UserPromptSubmit (validate skill exists before load)
5. **`session-summary`** — Stop (auto-generate session notes)

### Tier 2 — Medium Impact, Medium Effort
Require matcher logic or PostToolUse result inspection.

6. **`post-agent-complete`** — PostToolUse on Task (track agent success/failure rates)
7. **`on-plan-created`** — PostToolUse on Write to `docs/plans/` (validate plan structure)
8. **`placeholder-detector`** — PostToolUse on Write/Edit (catch stubs before they ship)
9. **`trello-task-sync`** — PostToolUse on TaskUpdate (sync plan progress to Trello)
10. **`gateway-event-relay`** — PostToolUse general (enable mcp-trigger-gateway)

### Tier 3 — High Impact, High Effort
Require new infrastructure (hook dispatch layer in lib, registry integration).

11. **`pre-skill-install` / `post-skill-install`** — Requires lib hook dispatch layer
12. **`on-registry-change`** — Requires observer pattern in registry
13. **`telemetry-alert`** — Requires threshold config and state tracking
14. **`code-quality-gate`** — Requires linter integration and file tracking
15. **`test-regression-check`** — Requires test-to-source mapping

---

## Known Issues to Fix

1. **`verify-completion.sh`** reads stdin as raw text (`cat`) but Claude Code sends structured JSON — should parse JSON
2. **`start-session.sh`** hard-codes version `v1.0.0` but `plugin.json` says `1.0.2` — should read from manifest
3. **`mcp-trigger-gateway`** has no `hooks.json` despite being described as an event trigger gateway
4. **`scratchpad`** has internal lifecycle hooks (`setupLifecycle`) not connected to Claude Code events
5. **Zero test coverage** across all hook scripts, lib utilities, and gateway
6. **Registry** (`lib/regestry.js`) is in-memory only — no persistence across sessions

---

## Architecture Notes

### Claude Code Hook Event Shapes (stdin JSON)

```
SessionStart:    { "cwd", "permission_mode" }
UserPromptSubmit: { "user_prompt", "cwd" }
PreToolUse:      { "tool_name", "tool_input", "session_id", "hook_event_name", "cwd" }
PostToolUse:     { "tool_name", "tool_input", "tool_result", "session_id", "hook_event_name" }
Stop:            { "stop_reason" | "reason" }
```

### Exit Code Semantics

- `exit 0` — allow (hook passes)
- `exit 1` — error (hook failed, tool still proceeds)
- `exit 2` — **block** (prevents tool execution, only used by browserx intercept-web.sh)

### Hook Dispatch Primitives (already in lib)

- `runTool(command, args, options)` — sync execution (`lib/run/run_tool.js`)
- `runToolAsync(command, args, options)` — async execution
- `runScript(scriptPath, args)` — script runner
- `register(type, name, metadata)` — registry (`lib/regestry.js`)

These primitives exist but are not wired into any hook dispatch layer.
