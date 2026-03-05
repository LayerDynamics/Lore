# DefTrello MCP Server

A Model Context Protocol (MCP) server providing Claude AI with direct access to your DefTrello productivity system. Integrates Trello boards, n8n workflows, codebase management, and ADHD-focused coaching intelligence.

## Architecture

```
DefTrello MCP Server
├── Trello Module (32 tools + 6 resources + 5 prompts)
│   ├── CRUD operations (14 tools)
│   ├── DefTrello-specific (8 tools)
│   └── Board awareness (WIP limits, energy levels, pipeline)
├── n8n Module (10 tools + 3 resources)
│   ├── Workflow management
│   ├── Execution monitoring
│   └── Credential validation
├── Codebase Module (12 tools)
│   ├── File operations (read, write, list, search)
│   ├── Script execution (sandboxed)
│   ├── Git operations (status, diff, log, commit, branch)
│   └── Refactoring (analysis, env vars, workflow validation, diff reports)
└── Coach Module (6 tools)
    ├── Crash state assessment
    ├── Energy-matched task selection
    ├── Day capacity calculation
    ├── Accountability messaging
    ├── WIP limit enforcement
    └── Weekly completion analytics
```

## Features

### Trello Integration

- **Full CRUD**: Create, read, update, delete cards and checklists
- **DefTrello Pipeline**: Reference → This Week → Today → Doing → Done
- **WIP Limits**: Doing (2), Today (5), This Week (20)
- **Energy Labeling**: 5-level energy system (Brain Dead → Peak Energy)
- **Board Snapshot**: Real-time WIP status, overdue counts, energy distribution
- **Smart Task Selection**: Energy-matched task recommendations
- **Batch Operations**: Bulk card updates and cleanup

### n8n Orchestration

- **Workflow Management**: List, activate, deactivate, trigger workflows
- **Execution Monitoring**: View execution logs and status
- **Health Checks**: System status and credential validation
- **JSON Import/Export**: Full workflow configuration management

### Codebase Management

- **Secure File Operations**: Path traversal protection, secret redaction
- **Script Execution**: Sandboxed with timeout enforcement
- **Git Integration**: Status, diff, log, commit, branch management
- **Code Analysis**: File counts, env var usage, TODO tracking
- **Workflow Validation**: n8n JSON structure validation

### ADHD Coach Intelligence

- **Crash Recovery**: 5-tier system (Active → Deep Crash) with escalating nudges
- **Smallest Next Action**: Energy-matched task selection with scoring
- **Day Capacity**: Energy-based task load recommendations
- **Accountability Messages**: Context-aware coaching (full + SMS formats)
- **WIP Monitoring**: Real-time limit violation detection
- **Weekly Analytics**: Completion rates, energy patterns, delegation ratios

## Installation

### Prerequisites

- Node.js 18+ and npm
- Active Trello account with API access
- n8n instance (self-hosted or cloud)
- Claude Desktop app

### Setup

1. **Install dependencies:**

```bash
cd mcp-server
npm install
```

1. **Configure environment:**

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Trello API (get from https://trello.com/power-ups/admin)
TRELLO_API_KEY=your_api_key
TRELLO_TOKEN=your_token
TRELLO_BOARD_ID=your_board_id

# Trello List IDs (auto-populated by create-board.sh)
TRELLO_LIST_REFERENCE_ID=list_id
TRELLO_LIST_THIS_WEEK_ID=list_id
TRELLO_LIST_TODAY_ID=list_id
TRELLO_LIST_DOING_ID=list_id
TRELLO_LIST_DONE_ID=list_id

# Trello Label IDs (auto-populated by create-board.sh)
TRELLO_LABEL_HIGH_ENERGY_ID=label_id
TRELLO_LABEL_MEDIUM_ENERGY_ID=label_id
TRELLO_LABEL_LOW_ENERGY_ID=label_id
TRELLO_LABEL_BRAIN_DEAD_ID=label_id
TRELLO_LABEL_DUE_SOON_ID=label_id

# n8n Configuration
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your_n8n_api_key

# Project Directory (for codebase tools)
PROJECT_DIR=/path/to/your/deftrello/project
```

1. **Build the server:**

```bash
npm run build
```

1. **Configure Claude Desktop or Claude Code:**

**Option A: Claude Desktop (Global)**

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "deftrello": {
      "command": "node",
      "args": [
        "/absolute/path/to/deftrello/mcp-server/dist/index.js"
      ]
    }
  }
}
```

**Option B: Claude Code CLI (Project-Specific)**

Create `.claude/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "deftrello": {
      "command": "node",
      "args": [
        "/absolute/path/to/deftrello/mcp-server/dist/index.js"
      ],
      "description": "DefTrello MCP Server - Trello automation, n8n workflows, codebase management, and ADHD coaching"
    }
  }
}
```

**Note:** The server loads environment variables from `mcp-server/.env` automatically via dotenv. You don't need to pass env vars in the config unless you want to override them.

1. **Restart Claude Desktop** or **start a new Claude Code session** to load the MCP server.

## Usage

### Morning Planning Flow

```
You: "Use the daily_planning prompt with high energy"
Claude: [Uses deftrello_daily_planning prompt]
        [Calls coach_calculate_day_capacity with energy_level=4]
        [Calls deftrello_get_board_snapshot]
        [Calls deftrello_get_energy_matched_tasks with energy_level=4]
        [Presents prioritized task list for today]
```

### Weekly Review Flow

```
You: "Run my weekly review"
Claude: [Uses weekly_review prompt]
        [Calls coach_weekly_completion_stats]
        [Calls deftrello_get_board_snapshot]
        [Calls trello_list_cards on Done list]
        [Generates completion report + insights]
```

### Crash Recovery Flow

```
You: "How bad is my crash state?"
Claude: [Calls coach_assess_crash_state]
        [Returns tier 2: "Momentum Loss - 4 days since last activity"]
        [Calls coach_get_smallest_next_action]
        [Recommends easiest card to break the stall]
```

### Codebase Refactoring Flow

```
You: "Analyze the codebase and find all env var usage"
Claude: [Calls codebase_analyze_codebase]
        [Returns file counts, env vars, TODOs]
        [Calls codebase_find_env_var_usage for specific vars]
        [Generates refactoring recommendations]
```

## Available Tools

### Trello CRUD (14)

- `trello_list_cards` - List cards on a specific list
- `trello_get_card` - Get card details
- `trello_create_card` - Create new card
- `trello_update_card` - Update existing card
- `trello_delete_card` - Delete card
- `trello_archive_card` - Archive card
- `trello_add_comment` - Add comment to card
- `trello_manage_checklist` - Create/update checklists
- `trello_manage_labels` - Add/remove labels
- `trello_set_custom_field` - Set custom field values
- `trello_assign_member` - Assign members to card
- `trello_search_cards` - Search cards by text
- `trello_get_board_activity` - Get recent board activity
- `trello_get_board_members` - List board members

### DefTrello-Specific (8)

- `deftrello_get_board_snapshot` - Full board status with WIP limits
- `deftrello_get_daily_planning_context` - Today + This Week cards
- `deftrello_move_through_pipeline` - Move card with WIP validation
- `deftrello_quick_add_task` - Add task to appropriate list
- `deftrello_delegate_task` - Assign + move to This Week
- `deftrello_cleanup_board` - Archive old completed cards
- `deftrello_get_energy_matched_tasks` - Filter by energy level
- `deftrello_batch_update_cards` - Bulk card operations

### n8n Workflow (9)

- `n8n_list_workflows` - List all workflows
- `n8n_activate_workflow` - Activate workflow
- `n8n_deactivate_workflow` - Deactivate workflow
- `n8n_trigger_workflow` - Manually trigger execution
- `n8n_get_execution_log` - View execution history
- `n8n_get_health` - System health check
- `n8n_update_workflow_json` - Update from JSON
- `n8n_export_workflow` - Export to JSON
- `n8n_check_credentials` - Validate credentials

### Codebase Management (12)

- `codebase_read_project_file` - Read file contents
- `codebase_write_project_file` - Write file contents
- `codebase_list_project_files` - List files (recursive option)
- `codebase_search_project` - Search with regex + glob
- `codebase_run_script` - Execute script with timeout
- `codebase_get_env_config` - View .env (secrets redacted)
- `codebase_set_env_value` - Set environment variable
- `codebase_validate_env` - Compare .env vs .env.example
- `git_status` - Git status with staged/modified/untracked
- `git_diff` - Show diff (staged or ref)
- `git_log` - Show commit history
- `git_commit` - Stage files + commit
- `git_branch` - List/create/switch branches
- `refactoring_analyze_codebase` - File counts, env vars, TODOs
- `refactoring_find_env_var_usage` - Search for specific env var
- `refactoring_validate_workflow_json` - Validate n8n JSON structure
- `refactoring_generate_diff_report` - Summarize git changes

### Coach Intelligence (6)

- `coach_assess_crash_state` - Crash tier + days inactive
- `coach_get_smallest_next_action` - Energy-matched easiest task
- `coach_calculate_day_capacity` - Recommended task count
- `coach_generate_accountability_message` - Coaching nudge (full/SMS)
- `coach_wip_limit_check` - WIP violation detection
- `coach_weekly_completion_stats` - Analytics + insights

## Resources (Read-Only Context)

### Trello Resources (6)

- `trello://board/snapshot` - Current board state
- `trello://board/status` - WIP + overdue summary
- `trello://list/doing` - Cards in Doing
- `trello://list/today` - Cards in Today
- `trello://list/this-week` - Cards in This Week
- `trello://list/done/recent` - Recent completions

### n8n Resources (3)

- `n8n://workflows/status` - All workflows status
- `n8n://workflows/errors` - Recent failures
- `n8n://health` - System health

## Prompts (Reusable Workflows)

### Trello Prompts (5)

- `deftrello_daily_planning` - Morning task prioritization
- `deftrello_weekly_review` - Weekly completion analysis
- `deftrello_quick_capture` - Fast task creation
- `deftrello_energy_check` - Energy-based recommendations
- `deftrello_delegation_review` - Team task analysis

## Development

### File Structure

```
mcp-server/
├── src/
│   ├── index.ts              # Server entry point
│   ├── server.ts             # Main server class (tool registration)
│   ├── config.ts             # Environment config loader
│   ├── types.ts              # Shared TypeScript types
│   ├── trello/
│   │   ├── client.ts         # Trello REST API client
│   │   ├── tools.ts          # CRUD tool handlers
│   │   ├── deftrello-helpers.ts  # DefTrello logic
│   │   ├── resources.ts      # Read-only resources
│   │   └── prompts.ts        # Workflow prompts
│   ├── n8n/
│   │   ├── client.ts         # n8n REST API client
│   │   ├── tools.ts          # Workflow tool handlers
│   │   └── resources.ts      # n8n resources
│   ├── codebase/
│   │   ├── tools.ts          # File operation handlers
│   │   ├── git-tools.ts      # Git operation handlers
│   │   └── refactoring-tools.ts  # Analysis handlers
│   └── coach/
│       ├── tools.ts          # ADHD intelligence handlers
│       └── messages.ts       # Accountability templates
├── dist/                     # Built output
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

### Build Commands

```bash
npm run build        # Production build (ESM + types)
npm run dev          # Watch mode (auto-rebuild)
npm run clean        # Clean dist folder
```

### Testing

```bash
# Manual integration tests
npm run build && node dist/index.js  # Start server (stdio mode)

# In Claude Desktop, test each workflow:
# 1. Morning planning: "Use daily_planning prompt"
# 2. Weekly review: "Show my weekly stats"
# 3. Crash recovery: "Assess my crash state"
# 4. Codebase refactoring: "Analyze the codebase"
```

## Error Handling

All tool calls are wrapped with graceful error handling:

- Network errors return user-friendly messages
- Invalid arguments show schema validation errors
- Rate limits include retry guidance
- Security violations (path traversal) blocked with clear errors
- Script timeouts terminate safely
- All errors are logged but never crash the server

## Security

- **Path Traversal Protection**: File operations restricted to PROJECT_DIR
- **Secret Redaction**: Environment variables containing KEY/TOKEN/SECRET/PASSWORD/API are redacted in responses
- **Script Sandboxing**: Executed scripts run with timeout enforcement and working directory constraints
- **Rate Limiting**: 100ms delay between Trello API calls
- **No Credential Storage**: All secrets passed via environment variables

## Troubleshooting

### Server won't start

- Check Claude Desktop logs: `tail -f ~/Library/Logs/Claude/mcp-server-deftrello.log`
- Verify all environment variables are set
- Ensure absolute paths in config (no `~` or `./`)

### Tool calls failing

- Test Trello API: `curl https://api.trello.com/1/boards/${BOARD_ID}?key=${API_KEY}&token=${TOKEN}`
- Test n8n API: `curl -H "X-N8N-API-KEY: ${API_KEY}" ${N8N_BASE_URL}/api/v1/workflows`
- Check MCP server logs for error details

### WIP limits not enforced

- Verify list IDs in config match your board
- Check label IDs match energy labels
- Ensure board structure follows DefTrello 5-list pipeline

## Contributing

This MCP server is part of the DefTrello productivity system. See main project README for contribution guidelines.

## License

MIT
