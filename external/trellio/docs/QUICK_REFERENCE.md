# DefTrello Quick Reference Card

## 🚀 Quick Start

```bash
# Test plugin
~/test-deftrello.sh

# Load in Claude Code
cc --plugin-dir ~/deftrello

# Or install globally
ln -s ~/deftrello ~/.claude/plugins/deftrello
```

## 📋 Essential Commands

| Command | Purpose |
|---------|---------|
| `/deftrello:board-list` | Show all boards |
| `/deftrello:board-select` | Switch boards |
| `/deftrello:board-snapshot` | Quick status |
| `/deftrello:morning-plan` | Daily planning |
| `/deftrello:cleanup` | Board maintenance |
| `/deftrello:bulk-import file.csv` | Import tasks |
| `/deftrello:velocity-recovery` | Restart momentum |
| `/deftrello:board-create` | Setup new board |

## 🤖 Agents (Auto-Trigger)

| Agent | Trigger Phrase |
|-------|----------------|
| board-validator | "check my board" |
| task-analyzer | "analyze this task" |
| workflow-monitor | "check n8n status" |
| board-setup-assistant | "create new board" |

## 📚 Skills (Auto-Load)

| Skill | Trigger |
|-------|---------|
| board-management | "switch boards" |
| bulk-operations | "bulk import" |
| mcp-cron-automation | "schedule tasks" |
| team-productivity | "team velocity" |

## ⚙️ Configuration

### Required Environment Variables

```bash
export TRELLO_API_KEY="your_key"
export TRELLO_TOKEN="your_token"
export TRELLO_BOARD_ID="your_board_id"
export N8N_BASE_URL="https://n8n.example.com"
export N8N_API_KEY="your_n8n_key"
```

### Settings File

Create `~/.claude/deftrello.local.md`:

```yaml
---
current_board_id: "board_id"
default_board_id: "board_id"
boards:
  - name: "Team Board"
    id: "board_id"
    lists:
      reference: "list_id"
      this_week: "list_id"
      today: "list_id"
      doing: "list_id"
      done: "list_id"
wip_limits:
  doing: 2
  today: 5
  this_week: 20
---
```

## 🔧 Common Workflows

### Morning Routine
```
1. /deftrello:board-snapshot
2. /deftrello:morning-plan
3. Move top priority to Doing
```

### Sprint Planning
```
1. /deftrello:cleanup
2. /deftrello:bulk-import sprint.csv
3. Assign and estimate
```

### Velocity Recovery
```
1. /deftrello:velocity-recovery
2. Focus on single deliverable
3. Ship and repeat
```

## 📊 WIP Limits

- **Doing:** 1-2 per person
- **Today:** 3-5 per person
- **This Week:** 15-20 per person

## 🆘 Troubleshooting

```bash
# Test plugin structure
~/deftrello/test-plugin.sh

# Debug loading
cc --plugin-dir ~/deftrello --debug

# Check MCP server
cd ~/deftrello/mcp-server && npm run build

# Verify environment
env | grep TRELLO
env | grep N8N
```

## 📖 Documentation

- `PLUGIN_SUMMARY.md` - Complete overview
- `TESTING.md` - Testing guide
- Command docs in `commands/*.md`
- Skill docs in `skills/*/SKILL.md`

## 🔗 Integration

### MCP Tools Available
- 60+ Trello tools (CRUD, board ops, coach features)
- 10+ n8n tools (workflows, health, execution)
- 12+ codebase tools (files, git, scripts)
- 6+ coach tools (velocity, capacity, WIP)

### Automation
- n8n workflows (6 workflows)
- MCP-CRON scheduling
- Automatic cleanup
- Smart reminders

## ⚡ Pro Tips

1. Use board snapshot before planning
2. Respect WIP limits - they work
3. Bulk import for sprint planning
4. Schedule weekly cleanup
5. Track velocity over time
6. Celebrate completions
7. Test with small batches first

---

**Version:** 2.0.0
**Status:** Production Ready
**Health:** 98/100
