# DefTrello Plugin Testing Guide

## Quick Test

Run the automated test suite:

```bash
cd /Users/ryanoboyle/deftrello
./test-plugin.sh
```

**Current Status:** 19/20 tests passing ✅

## Manual Testing

### Test 1: Plugin Structure

```bash
# Verify all files exist
ls -la /Users/ryanoboyle/deftrello/.claude-plugin/plugin.json
ls -la /Users/ryanoboyle/deftrello/commands/
ls -la /Users/ryanoboyle/deftrello/agents/
ls -la /Users/ryanoboyle/deftrello/skills/
ls -la /Users/ryanoboyle/deftrello/hooks/hooks.json
```

### Test 2: Load Plugin in Claude Code

```bash
# Test plugin loading
cc --plugin-dir /Users/ryanoboyle/deftrello

# Check if commands are available
# Type: /deftrello:
# You should see autocomplete with all 8 commands
```

### Test 3: Test Individual Commands

```bash
# In Claude Code session with plugin loaded:

# List boards
/deftrello:board-list

# Board snapshot
/deftrello:board-snapshot

# Morning planning (interactive)
/deftrello:morning-plan
```

### Test 4: Test Skills

```bash
# Ask questions that should trigger skills:

"How do I switch between multiple boards?"
# Should load: board-management skill

"Help me import tasks from CSV"
# Should load: bulk-operations skill

"How do I schedule automated tasks?"
# Should load: mcp-cron-automation skill

"What's the best way to track team velocity?"
# Should load: team-productivity skill
```

### Test 5: Test Agents

```bash
# Trigger agents with requests:

"Check my board health"
# Should invoke: board-validator agent

"Analyze this task and suggest time estimate"
# Should invoke: task-analyzer agent

"Check n8n workflow status"
# Should invoke: workflow-monitor agent

"Help me set up a new board"
# Should invoke: board-setup-assistant agent
```

### Test 6: Test Hooks

Hooks should trigger automatically:

1. **SessionStart**: Board snapshot shows on session start (if configured)
2. **PreToolUse**: Workflow JSON validation when editing .json files
3. **PostToolUse**: WIP limit warnings after moving cards
4. **UserPromptSubmit**: Command suggestions when asking about boards

## Environment Setup

Before testing, ensure environment variables are set:

```bash
export TRELLO_API_KEY="your_key_here"
export TRELLO_TOKEN="your_token_here"
export TRELLO_BOARD_ID="your_board_id"
export N8N_BASE_URL="https://n8n.your-domain.com"
export N8N_API_KEY="your_n8n_key"
```

Or create `.env` file in plugin directory.

## Expected Results

### ✅ Working
- Plugin structure valid
- All 21 components present
- No hardcoded credentials
- Commands have frontmatter
- Agents have frontmatter
- Settings template exists

### ⚠️ Needs Configuration
- Environment variables for Trello/n8n
- Settings file (`.claude/deftrello.local.md`)
- Board registry

## Troubleshooting

### Plugin doesn't load

```bash
# Check for errors
cc --plugin-dir /Users/ryanoboyle/deftrello --debug

# Verify manifest
cat /Users/ryanoboyle/deftrello/.claude-plugin/plugin.json
```

### Commands not found

```bash
# List all command files
ls -la /Users/ryanoboyle/deftrello/commands/

# Check frontmatter
head -10 /Users/ryanoboyle/deftrello/commands/board-list.md
```

### MCP tools not available

```bash
# Check MCP config
cat /Users/ryanoboyle/deftrello/.mcp.json

# Verify MCP server
cd /Users/ryanoboyle/deftrello/mcp-server
npm run build
node dist/index.js
```

## Test Results

Run `./test-plugin.sh` to see comprehensive test results.

**Last Test:** 19/20 passed
**Status:** Ready for manual testing
