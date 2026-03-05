# ExpectedOutcome.md — Custom DefTrello MCP Server

> **Goal:** Build a custom MCP server that gives Claude (Desktop, Code, or Cowork) full read/write control over the DefTrello productivity system — replacing the generic third-party `@delorenj/mcp-server-trello` with a purpose-built server that understands DefTrello's board structure, energy system, ADHD workflows, n8n orchestration, and codebase management.

---

## Why a Custom MCP Server

The current setup uses `@delorenj/mcp-server-trello`, which is a generic Trello MCP. It can read/write cards and lists, but it has no concept of:

- DefTrello's 5-list pipeline (Reference → This Week → Today → Doing → Done)
- Energy labels and how they map to task routing
- WIP limits (Doing: 2, Today: 5) and enforcement
- Custom fields (Time Estimate, Task Type, Priority, Quick Win)
- The crash recovery tier system
- Butler rule status or n8n workflow health
- The codebase itself — scripts, workflow JSONs, configs

A custom MCP server turns Claude from "a chatbot that can poke Trello" into "a full project manager that understands DefTrello end-to-end and can operate it."

---

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────────┐
│  Claude (Desktop / Code / Cowork)                                 │
│  ↕ MCP Protocol (stdio transport)                                 │
├───────────────────────────────────────────────────────────────────┤
│  deftrello-mcp-server (TypeScript, Node.js)                       │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │ Trello       │  │ n8n          │  │ Codebase                 │ │
│  │ Module       │  │ Module       │  │ Module                   │ │
│  │              │  │              │  │                          │ │
│  │ • Board CRUD │  │ • Workflow   │  │ • Read/write project     │ │
│  │ • Card mgmt  │  │   status    │  │   files                  │ │
│  │ • Labels     │  │ • Trigger   │  │ • Script execution       │ │
│  │ • Custom     │  │   workflows │  │ • Config management      │ │
│  │   fields     │  │ • Execution │  │ • Git operations         │ │
│  │ • Checklists │  │   logs      │  │ • Refactoring support    │ │
│  │ • Members    │  │ • Cred      │  │                          │ │
│  │ • Comments   │  │   health    │  │                          │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬───────────────┘ │
│         │                │                     │                  │
├─────────┼────────────────┼─────────────────────┼──────────────────┤
│         ▼                ▼                     ▼                  │
│   Trello REST API   n8n REST API        Local filesystem         │
│   (api.trello.com)  (your-n8n:5678)     (project directory)      │
└───────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Language | **TypeScript** | Type safety, first-class MCP SDK support, matches Node.js ecosystem |
| MCP SDK | `@modelcontextprotocol/sdk` | Official Anthropic SDK for building MCP servers |
| Transport | **stdio** (primary), **SSE** (optional remote) | stdio for local Claude Desktop/Code; SSE for remote access |
| Trello Client | Direct REST via `fetch` | Avoids stale wrapper libs; full API control |
| n8n Client | n8n REST API via `fetch` | n8n exposes full workflow/execution management |
| Package Manager | **npm** | Standard, matches existing project |
| Build | **tsup** or **tsc** | Fast TypeScript compilation |
| Testing | **vitest** | Fast, TypeScript-native |

---

## Module 1: Trello Board Management

### 1.1 — Board-Aware Tools (DefTrello-Specific)

These tools encode DefTrello's board structure so Claude doesn't have to guess list names or label colors.

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_board_snapshot` | Returns full board state: all lists with card counts, WIP limit status, overdue count, stale count, energy distribution. Single call gives Claude complete situational awareness. | `include_cards?: boolean` (default true) |
| `get_daily_planning_context` | Fetches Today + This Week cards with energy labels, custom fields, due dates, and checklist progress. Optimized for morning planning. | `energy_filter?: "high" \| "medium" \| "low" \| "brain_dead"` |
| `get_weekly_review_context` | Fetches Done cards from the past 7 days (including archived), stale cards (7+ days without activity), team member card status, completion stats. | `days?: number` (default 7) |
| `move_card_through_pipeline` | Moves a card to a specific pipeline stage (This Week, Today, Doing, Done) with validation — enforces WIP limits, warns on energy mismatch. | `card_id: string, target_list: "this_week" \| "today" \| "doing" \| "done"` |
| `quick_add_task` | Creates a card with all DefTrello metadata in one call — list, energy label, priority, time estimate, task type, due date, Quick Win flag. | `title: string, list?: string, energy?: string, priority?: string, time_estimate?: string, task_type?: string, due_date?: string, quick_win?: boolean, assignee?: string` |
| `delegate_task` | Creates a card assigned to a team member with the Delegation Handoff checklist auto-attached, appropriate priority, and a follow-up reminder date. | `title: string, assignee: string, description: string, priority: string, due_date: string` |
| `clean_up_board` | Programmatic equivalent of the 🧹 Clean Up Board Butler button: archives Done, moves Doing → This Week, moves Today → This Week. | none |
| `get_energy_matched_tasks` | Returns tasks from This Week/Today filtered and sorted by energy level, so Claude can suggest "here are your low-energy options right now." | `energy_level: 1-5` (maps to labels) |
| `batch_update_cards` | Updates multiple cards at once — move a set of cards, bulk-label, bulk-set-due-dates. For weekly review reorganization. | `updates: Array<{card_id, changes}>` |

### 1.2 — Standard Trello CRUD (Full API Coverage)

These wrap the Trello REST API for operations that don't need DefTrello-specific logic.

| Tool Name | Description |
|-----------|-------------|
| `list_cards` | Get cards from a specific list (by name or ID) with full metadata |
| `get_card` | Get a single card with all fields, checklists, comments, members |
| `create_card` | Raw card creation (for when `quick_add_task` is too opinionated) |
| `update_card` | Update any card field — name, desc, due, labels, custom fields, position |
| `delete_card` | Delete a card (with confirmation prompt in description) |
| `archive_card` | Archive (soft-delete) a card |
| `add_comment` | Add a comment to a card |
| `manage_checklist` | Create/delete checklists, add/remove/check items |
| `manage_labels` | Add/remove labels from a card |
| `set_custom_field` | Set a custom field value on a card |
| `get_board_members` | List all board members |
| `assign_member` | Add/remove a member from a card |
| `search_cards` | Full-text search across all cards on the board |
| `get_card_activity` | Get the activity/action log for a card |
| `get_board_activity` | Get recent activity across the entire board (for crash recovery detection) |

### 1.3 — MCP Resources (Read-Only Context)

MCP Resources let Claude pull structured context without explicit tool calls.

| Resource URI | Description |
|-------------|-------------|
| `trello://board/snapshot` | Current board state (lists, card counts, WIP status) |
| `trello://board/overdue` | All overdue cards with days-overdue count |
| `trello://board/stale` | Cards with no activity in 48+ hours |
| `trello://board/team-status` | Cards grouped by assignee with status |
| `trello://board/energy-distribution` | Card count by energy label per list |
| `trello://board/config` | Board configuration (list IDs, label IDs, custom field IDs) |

### 1.4 — MCP Prompts (Reusable Workflows)

MCP Prompts let Claude invoke pre-built interaction patterns.

| Prompt Name | Description |
|------------|-------------|
| `morning_planning` | Gathers board + calendar context, asks energy level, generates daily plan |
| `weekly_review` | Walks through the full weekly review checklist with board data |
| `task_triage` | Helps decide: keep, reschedule, delegate, or kill a stale card |
| `delegation_helper` | Guides writing a clear card description + handoff checklist |
| `crash_recovery` | Assesses board state after inactivity, suggests gentle re-entry plan |

---

## Module 2: n8n Workflow Orchestration

### 2.1 — Workflow Management Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `list_workflows` | Returns all n8n workflows with active/inactive status, last execution time, and error count | none |
| `get_workflow_status` | Detailed status for a specific workflow — last 10 executions, success/failure rate, next scheduled run | `workflow_id: string` |
| `activate_workflow` | Enable a workflow's schedule trigger | `workflow_id: string` |
| `deactivate_workflow` | Disable a workflow (stop scheduled runs) | `workflow_id: string` |
| `trigger_workflow` | Manually fire a workflow immediately (for testing or on-demand runs) | `workflow_id: string, data?: object` |
| `get_execution_log` | Get execution history with input/output for each node — essential for debugging | `workflow_id: string, limit?: number, status?: "success" \| "error"` |
| `get_n8n_health` | System-level health: is n8n reachable, DB connection ok, webhook URL valid, how many workflows active | none |
| `update_workflow_json` | Import/update a workflow from JSON (for deploying refactored workflows) | `workflow_id: string, json: object` |
| `export_workflow` | Export a workflow as JSON (for backup or version control) | `workflow_id: string` |

### 2.2 — n8n Credential Health

| Tool Name | Description |
|-----------|-------------|
| `check_credentials` | Tests whether each configured credential (Trello, Gmail, Calendar, Twilio, Anthropic) is still valid and returns expiry info |
| `list_n8n_variables` | Returns all n8n environment variables (for verifying config matches .env) |

### 2.3 — n8n Resources

| Resource URI | Description |
|-------------|-------------|
| `n8n://workflows/status` | All workflows with active status and last run |
| `n8n://workflows/errors` | Recent failed executions with error messages |
| `n8n://health` | n8n system health summary |

---

## Module 3: Codebase & Project Management

### 3.1 — File Operations

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `read_project_file` | Read any file in the DefTrello project directory | `path: string` |
| `write_project_file` | Write/overwrite a file | `path: string, content: string` |
| `list_project_files` | List files in a directory (or the whole project tree) | `path?: string, recursive?: boolean` |
| `search_project` | Grep/search across the project for a pattern | `pattern: string, file_glob?: string` |
| `get_project_structure` | Returns the project directory tree with file descriptions | none |

### 3.2 — Script Execution

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `run_setup_script` | Execute `scripts/setup.sh` or any project script with live output | `script: string, args?: string[]` |
| `run_verify` | Execute `scripts/verify-setup.sh` and return pass/fail results | none |
| `run_board_creation` | Execute `trello/create-board.sh` | none |
| `run_reference_cards` | Execute `trello/create-reference-cards.sh` | none |
| `run_import_workflows` | Execute `scripts/import-n8n-workflows.sh` | none |

### 3.3 — Configuration Management

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `get_env_config` | Read the current `.env` file (redacts secrets, shows which are set vs missing) | none |
| `set_env_value` | Set a single environment variable in `.env` | `key: string, value: string` |
| `validate_env` | Check that all required env vars are set and non-empty | none |
| `get_claude_desktop_config` | Read the current `claude-desktop-config.json` | none |
| `update_claude_desktop_config` | Update the Claude Desktop MCP config (for adding/modifying server entries) | `config: object` |
| `get_board_config` | Read `board-config.json` | none |
| `update_board_config` | Modify board configuration | `changes: object` |

### 3.4 — Git & Version Control

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `git_status` | Current git status — branch, staged changes, untracked files | none |
| `git_diff` | Show current diff (staged, unstaged, or between refs) | `ref?: string, staged?: boolean` |
| `git_log` | Recent commit history | `limit?: number` |
| `git_commit` | Stage and commit specified files with a message | `files: string[], message: string` |
| `git_branch` | Create, switch, or list branches | `action: "create" \| "switch" \| "list", name?: string` |

### 3.5 — Refactoring Support

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `analyze_codebase` | Returns a structural analysis: file count by type, script dependency graph, env var usage map, TODO/FIXME inventory | none |
| `find_env_var_usage` | Finds everywhere a specific env var is referenced across all files | `var_name: string` |
| `validate_workflow_json` | Validates an n8n workflow JSON for structural correctness, checks node references, credential references | `path: string` |
| `generate_diff_report` | After making changes, generates a human-readable summary of what changed across which files | `since_commit?: string` |

---

## Module 4: ADHD Coach Intelligence Layer

These tools encode the ADHD coaching logic so Claude has structured helpers, not just raw data.

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `assess_crash_state` | Checks board activity and returns the current crash recovery tier (0-4) with days since last activity | none |
| `get_smallest_next_action` | Finds the single lowest-friction task on the board — Quick Win flagged, Brain Dead energy, shortest time estimate | none |
| `calculate_day_capacity` | Given energy level (1-5) and today's calendar, estimates realistic task capacity in hours and suggests how many cards to pull into Today | `energy: 1-5` |
| `generate_accountability_message` | Produces a context-aware, ADHD-friendly nudge message based on current board state and inactivity duration | `tier: 1-4` |
| `wip_limit_check` | Returns current WIP status: how many cards in Doing and Today, whether limits are exceeded, and what needs to move before adding more | none |
| `weekly_completion_stats` | Calculates completion rate, average time in Doing, energy pattern analysis, delegation ratio | `weeks?: number` |

---

## Implementation Plan

### Phase 1: Project Scaffolding (Day 1)

```
deftrello/
├── mcp-server/                          # NEW — the custom MCP server
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts                     # Entry point, server setup, transport
│   │   ├── server.ts                    # MCP server class, tool/resource/prompt registration
│   │   ├── config.ts                    # Load env vars, validate config
│   │   ├── types.ts                     # Shared TypeScript types
│   │   ├── trello/
│   │   │   ├── client.ts               # Trello REST API client (fetch-based)
│   │   │   ├── tools.ts                # All Trello tool handlers
│   │   │   ├── resources.ts            # Trello MCP resources
│   │   │   ├── prompts.ts              # Trello MCP prompts
│   │   │   └── deftrello-helpers.ts    # Board-specific logic (WIP checks, energy mapping, pipeline validation)
│   │   ├── n8n/
│   │   │   ├── client.ts               # n8n REST API client
│   │   │   ├── tools.ts                # n8n tool handlers
│   │   │   └── resources.ts            # n8n MCP resources
│   │   ├── codebase/
│   │   │   ├── tools.ts                # File ops, script execution, config management
│   │   │   ├── git-tools.ts            # Git operations
│   │   │   └── refactoring-tools.ts    # Code analysis, env var tracking, validation
│   │   └── coach/
│   │       ├── tools.ts                # ADHD coach intelligence tools
│   │       └── messages.ts             # Accountability message templates
│   ├── tests/
│   │   ├── trello/
│   │   │   ├── client.test.ts
│   │   │   ├── tools.test.ts
│   │   │   └── deftrello-helpers.test.ts
│   │   ├── n8n/
│   │   │   └── tools.test.ts
│   │   ├── codebase/
│   │   │   └── tools.test.ts
│   │   └── coach/
│   │       └── tools.test.ts
│   └── README.md                        # Setup instructions for the MCP server
├── trello/                              # EXISTING — unchanged
├── n8n/                                 # EXISTING — unchanged
├── claude/
│   ├── claude-desktop-config.json       # UPDATED — point to custom MCP server
│   └── adhd-coach-system-prompt.md      # UPDATED — reference new tools
├── scripts/                             # EXISTING — unchanged
└── ...
```

### Phase 2: Trello Module (Days 2-4)

**Day 2 — Trello API Client + Core CRUD**

1. Build `trello/client.ts` — typed REST client wrapping `fetch` with rate limiting (100ms between calls), error handling, and automatic auth parameter injection
2. Implement core CRUD tools: `list_cards`, `get_card`, `create_card`, `update_card`, `delete_card`, `archive_card`
3. Implement support tools: `add_comment`, `manage_checklist`, `manage_labels`, `set_custom_field`
4. Write tests against mock Trello API responses

**Day 3 — DefTrello-Specific Tools**

1. Build `deftrello-helpers.ts` — board structure constants (list names, label colors, WIP limits), energy level mapping (1-5 → label names), pipeline validation logic
2. Implement `get_board_snapshot` — single call that returns the full board state with WIP status, overdue counts, energy distribution
3. Implement `move_card_through_pipeline` with WIP limit enforcement
4. Implement `quick_add_task` with all metadata in one call
5. Implement `delegate_task` with auto-checklist attachment
6. Implement `clean_up_board`, `get_energy_matched_tasks`, `batch_update_cards`
7. Implement `search_cards`, `get_card_activity`, `get_board_activity`

**Day 4 — Trello Resources + Prompts**

1. Register all 6 MCP Resources
2. Register all 5 MCP Prompts
3. Integration test: connect to real Trello board, verify full round-trip

### Phase 3: n8n Module (Days 5-6)

**Day 5 — n8n API Client + Workflow Tools**

1. Build `n8n/client.ts` — REST client for n8n API (requires n8n API key, base URL)
2. Implement `list_workflows`, `get_workflow_status`, `activate_workflow`, `deactivate_workflow`
3. Implement `trigger_workflow`, `get_execution_log`
4. Implement `get_n8n_health`

**Day 6 — n8n Advanced Tools + Resources**

1. Implement `update_workflow_json`, `export_workflow`
2. Implement `check_credentials`, `list_n8n_variables`
3. Register n8n MCP Resources
4. Integration test: verify workflow listing, status checks, manual triggers

### Phase 4: Codebase Module (Days 7-8)

**Day 7 — File Ops + Script Execution**

1. Implement `read_project_file`, `write_project_file`, `list_project_files`, `search_project`, `get_project_structure`
2. Implement script runners with sandboxed execution (child_process.spawn with timeout, working directory enforcement)
3. Implement `get_env_config` with secret redaction
4. Implement `set_env_value`, `validate_env`
5. Implement config management tools

**Day 8 — Git + Refactoring Tools**

1. Implement git tools using `simple-git` library or direct CLI
2. Implement `analyze_codebase` — walks the project tree, counts files, maps env var usage, finds TODOs
3. Implement `find_env_var_usage`, `validate_workflow_json`, `generate_diff_report`
4. Tests for all codebase tools

### Phase 5: Coach Module (Day 9)

1. Implement `assess_crash_state` using `get_board_activity`
2. Implement `get_smallest_next_action` — queries cards, sorts by (Quick Win > Brain Dead > Low Energy > shortest time estimate)
3. Implement `calculate_day_capacity` — maps energy 1-5 to productive hours, subtracts meeting time from calendar
4. Implement `generate_accountability_message` with tier-appropriate templates
5. Implement `wip_limit_check`, `weekly_completion_stats`

### Phase 6: Integration, Config & Polish (Days 10-11)

**Day 10 — Server Assembly + Claude Desktop Config**

1. Wire all modules into `server.ts` with proper tool/resource/prompt registration
2. Build the entry point (`index.ts`) with stdio transport
3. Update `claude/claude-desktop-config.json` to point to custom server:

```json
{
  "mcpServers": {
    "deftrello": {
      "command": "node",
      "args": ["./mcp-server/dist/index.js"],
      "env": {
        "TRELLO_API_KEY": "...",
        "TRELLO_TOKEN": "...",
        "TRELLO_BOARD_ID": "...",
        "N8N_BASE_URL": "...",
        "N8N_API_KEY": "...",
        "PROJECT_DIR": "/path/to/deftrello"
      }
    },
    "google-calendar": {
      "command": "npx",
      "args": ["-y", "@nspady/google-calendar-mcp"],
      "env": {
        "GOOGLE_OAUTH_CREDENTIALS": "..."
      }
    }
  }
}
```

4. Update `adhd-coach-system-prompt.md` to reference the new tools by name
5. End-to-end test: start server via stdio, verify Claude Desktop can call all tools

**Day 11 — Documentation + Error Handling**

1. Write `mcp-server/README.md` with setup instructions
2. Add graceful error handling — tool calls should never crash the server
3. Add request logging (optional file-based log for debugging)
4. Update main project `README.md` to reference the custom MCP server
5. Final integration test: morning planning flow, weekly review flow, crash recovery flow, codebase refactoring flow

---

## Required Environment Variables

The MCP server needs these env vars (loaded from `.env` or passed via the MCP config):

```bash
# Trello
TRELLO_API_KEY=           # From trello.com/power-ups/admin
TRELLO_TOKEN=             # OAuth token for your account
TRELLO_BOARD_ID=          # Your board ID

# Trello IDs (auto-populated by create-board.sh)
TRELLO_LIST_REFERENCE_ID=
TRELLO_LIST_THIS_WEEK_ID=
TRELLO_LIST_TODAY_ID=
TRELLO_LIST_DOING_ID=
TRELLO_LIST_DONE_ID=
TRELLO_LABEL_HIGH_ENERGY_ID=
TRELLO_LABEL_MEDIUM_ENERGY_ID=
TRELLO_LABEL_LOW_ENERGY_ID=
TRELLO_LABEL_BRAIN_DEAD_ID=
TRELLO_LABEL_DUE_SOON_ID=

# n8n
N8N_BASE_URL=             # e.g., https://your-n8n.railway.app
N8N_API_KEY=              # Generated in n8n Settings > API

# Project
PROJECT_DIR=              # Absolute path to deftrello root directory
```

---

## Code Changes to Existing Files

### Files to Modify

| File | Change |
|------|--------|
| `claude/claude-desktop-config.json` | Replace `@delorenj/mcp-server-trello` with `deftrello` server pointing to `./mcp-server/dist/index.js` |
| `claude/adhd-coach-system-prompt.md` | Add section listing available MCP tools by category so Claude knows what it can do |
| `.env.example` | Add `N8N_BASE_URL`, `N8N_API_KEY`, `PROJECT_DIR` |
| `MANUAL_STEPS.md` | Add step for building the MCP server (`cd mcp-server && npm install && npm run build`) |
| `scripts/setup.sh` | Add MCP server build step |
| `scripts/verify-setup.sh` | Add MCP server health check |
| `README.md` | Update architecture section to reference custom MCP server |
| `CLAUDE.md` | Add section on MCP server development conventions |
| `package.json` (root) | Add workspace reference to `mcp-server/` or add convenience scripts |

### Files to Create

| File | Purpose |
|------|---------|
| `mcp-server/package.json` | Dependencies: `@modelcontextprotocol/sdk`, `dotenv`, `simple-git`, `zod` (for input validation) |
| `mcp-server/tsconfig.json` | TypeScript config targeting ES2022, Node16 module resolution |
| `mcp-server/src/**/*.ts` | All server source code (see Phase 2-5 above) |
| `mcp-server/tests/**/*.test.ts` | Test files |
| `mcp-server/README.md` | Setup and usage docs |

---

## Dependencies

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.x",
    "dotenv": "^16.x",
    "simple-git": "^3.x",
    "zod": "^3.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "tsup": "^8.x",
    "vitest": "^2.x",
    "@types/node": "^22.x"
  }
}
```

---

## What This Enables (User Stories)

### Daily Operations

> "What's on my board? Energy is a 2 today."
> → Claude calls `get_board_snapshot` + `get_energy_matched_tasks(energy: 2)` + `calculate_day_capacity(energy: 2)`, then suggests a realistic plan with only Low Energy and Brain Dead tasks.

> "Add a task: review Q3 financials, high energy, due Friday, 2 hours"
> → Claude calls `quick_add_task` with all metadata. Card appears in This Week with correct labels and fields.

> "Move the vendor call card to Doing"
> → Claude calls `move_card_through_pipeline(card_id, "doing")`. Server validates WIP limit, warns if Doing already has 2 cards, and asks Claude to resolve before proceeding.

> "Delegate the onboarding doc review to Alex, due next Wednesday"
> → Claude calls `delegate_task` — creates card assigned to Alex with Delegation Handoff checklist, sets due date, adds to This Week.

### Weekly Review

> "Let's do the weekly review"
> → Claude invokes the `weekly_review` prompt, which calls `get_weekly_review_context`, presents completed tasks for celebration, shows stale cards for triage, and walks through priority setting for next week.

### System Management

> "Are my n8n workflows running?"
> → Claude calls `get_n8n_health` + `list_workflows` and reports which are active, last run times, and any recent failures.

> "The morning briefing didn't arrive today, debug it"
> → Claude calls `get_execution_log(workflow_id, limit: 5, status: "error")` and reads the error output from the last failed execution.

> "Trigger the crash recovery workflow manually"
> → Claude calls `trigger_workflow(crash_recovery_id)`.

### Codebase Refactoring

> "I want to refactor the morning briefing workflow to include weather data"
> → Claude calls `read_project_file("n8n/workflows/morning-briefing.json")`, understands the current structure, proposes changes, writes the updated file with `write_project_file`, validates with `validate_workflow_json`, and deploys with `update_workflow_json`.

> "What env vars are we using and where?"
> → Claude calls `analyze_codebase` and gets a complete map of every env var reference across all project files.

> "Show me what changed since last commit"
> → Claude calls `git_diff` + `generate_diff_report`.

### Crash Recovery

> "I haven't touched the board in a week, help me get back"
> → Claude calls `assess_crash_state` (returns tier 3, 8 days inactive), then `clean_up_board` to reset, then `get_smallest_next_action` to find one tiny task, and walks the user through a gentle re-entry.

---

## Testing Strategy

### Unit Tests

- Mock Trello API responses → test all tool handlers return correct shapes
- Mock n8n API responses → test workflow management tools
- Test DefTrello helpers: WIP limit validation, energy mapping, pipeline rules
- Test config loading and env validation

### Integration Tests

- Connect to a real test Trello board → CRUD operations round-trip
- Connect to a running n8n instance → workflow listing and health checks
- File operations on a test project directory

### End-to-End Tests

- Start the MCP server via stdio → send tool call requests → verify responses
- Simulate a full morning planning flow
- Simulate a weekly review flow
- Simulate a crash recovery assessment

---

## Timeline Summary

| Phase | Days | Deliverable |
|-------|------|-------------|
| 1. Scaffolding | 1 | Project structure, package.json, tsconfig, empty modules |
| 2. Trello Module | 3 | Complete Trello CRUD + DefTrello-specific tools + resources + prompts |
| 3. n8n Module | 2 | Workflow management, health checks, execution logs |
| 4. Codebase Module | 2 | File ops, script execution, git, refactoring tools |
| 5. Coach Module | 1 | ADHD intelligence tools |
| 6. Integration | 2 | Wiring, config, docs, error handling, end-to-end tests |
| **Total** | **11 days** | **Full custom MCP server** |

---

## Future Enhancements (Post-MVP)

| Enhancement | Description |
|------------|-------------|
| **SSE Transport** | Add HTTP/SSE transport so the MCP server can run on the VPS alongside n8n, enabling remote access from any Claude client |
| **Google Calendar Module** | Absorb the Google Calendar MCP into this server so everything runs as one process |
| **Twilio Module** | Let Claude send SMS directly (for manual nudges, quick notes to self) |
| **Analytics Dashboard** | `generate_productivity_report` tool that outputs an HTML dashboard with completion trends, energy patterns, delegation stats |
| **Webhook Receiver** | Accept Trello webhooks so the server can react to real-time board changes instead of polling |
| **Multi-Board Support** | Extend to manage multiple Trello boards (personal + team boards) |
| **Plugin System** | Allow custom tool modules to be loaded dynamically, so other users can extend the server for their own workflows |
| **Claude Code Integration** | Package as an installable MCP server that works with `claude code` out of the box via `.mcp.json` project config |

---

## Success Criteria

The MCP server is complete when:

1. Claude can get a full board snapshot in a single tool call
2. Claude can create a fully-tagged task in one call (no multi-step dance)
3. Claude enforces WIP limits when moving cards to Doing or Today
4. Claude can check n8n workflow health and trigger workflows
5. Claude can read, write, and search project files for refactoring
6. Claude can run project scripts (setup, verify, board creation)
7. Claude can assess crash recovery state and find the smallest next action
8. Claude can do a complete weekly review using board data
9. All tools have error handling that doesn't crash the server
10. The server starts in under 2 seconds via stdio
