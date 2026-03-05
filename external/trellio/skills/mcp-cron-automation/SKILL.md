---
name: mcp-cron-automation
description: This skill should be used when the user asks to "schedule tasks with MCP-CRON", "automate board operations", "recurring automation", "scheduled workflows", or needs guidance on MCP-CRON integration for task automation
version: 1.0.0
---

# MCP-CRON Automation for Trellio

Comprehensive guide for using MCP-CRON to schedule and automate Trellio board operations, enabling recurring tasks, scheduled cleanup, and time-based workflows.

## When to Use This Skill

Use this skill when:
- Scheduling recurring Trellio operations
- Automating daily/weekly board maintenance
- Setting up time-based task creation
- Implementing scheduled reminders
- Creating automated board reviews
- Integrating Trellio with cron-based workflows

## MCP-CRON Overview

MCP-CRON provides AI task scheduling through cron expressions. It enables Claude to:
- Schedule tasks with natural language
- Create recurring automation
- Execute MCP tool calls on schedule
- Monitor scheduled task execution
- Manage automation lifecycle

### Core MCP-CRON Tools

Available via ToolSearch after loading MCP-CRON server:
- `mcp__mcp-cron__add_ai_task` - Schedule AI-powered tasks
- `mcp__mcp-cron__add_task` - Schedule specific tool calls
- `mcp__mcp-cron__list_tasks` - View scheduled tasks
- `mcp__mcp-cron__get_task` - Get task details
- `mcp__mcp-cron__run_task` - Execute task immediately
- `mcp__mcp-cron__enable_task` / `disable_task` - Control execution
- `mcp__mcp-cron__remove_task` - Delete scheduled task

## Common Automation Patterns

### Pattern 1: Daily Board Cleanup

Schedule automatic board maintenance:

```
Schedule: Daily at 11:00 PM
Task: Clean up board
- Archive cards in Done > 7 days
- Remove stale cards > 30 days no activity
- Check WIP limit violations
- Generate cleanup report
```

Implementation:
```javascript
{
  "schedule": "0 23 * * *",  // Daily at 11 PM
  "task_description": "Clean up Trellio board: archive old completed cards, identify stale tasks, check WIP limits",
  "tools_allowed": ["trello_*", "trellio_*"]
}
```

### Pattern 2: Weekly Board Review

Automated weekly analytics:

```
Schedule: Friday at 5:00 PM
Task: Weekly review
- Get completion stats
- Analyze productivity trends
- Generate summary report
- Send to user via notification
```

### Pattern 3: Morning Planning Prep

Pre-populate daily planning context:

```
Schedule: Weekdays at 7:00 AM
Task: Morning prep
- Get current board snapshot
- Identify overdue cards
- Calculate day capacity
- Prepare task recommendations
```

### Pattern 4: Recurring Task Creation

Auto-create periodic tasks:

```
Schedule: Every Monday at 9:00 AM
Task: Create weekly standup card
- Create card in Today list
- Set due date to Friday
- Add checklist: Accomplishments, Plans, Blockers
- Assign to team lead
```

## Cron Expression Guide

### Basic Patterns

```
* * * * *  - Every minute
0 * * * *  - Every hour
0 9 * * *  - Daily at 9:00 AM
0 9 * * 1  - Every Monday at 9:00 AM
0 9 * * 1-5 - Weekdays at 9:00 AM
0 */2 * * * - Every 2 hours
0 0 1 * *  - First day of month at midnight
```

### Trellio-Specific Schedules

```
0 7 * * 1-5    - Weekday mornings (planning prep)
0 12 * * *     - Daily lunch (midday check-in)
0 17 * * 5     - Friday afternoon (weekly review)
0 23 * * *     - Nightly (board cleanup)
0 9 * * 1      - Monday morning (week planning)
```

## AI Task Scheduling

### Using add_ai_task

Schedule with natural language task description:

```
mcp__mcp-cron__add_ai_task:
  schedule: "0 9 * * 1-5"
  task_description: "Review Trellio Today list, identify overdue cards, move low-priority cards back to This Week if over WIP limit"
  tools_allowed: ["trello_list_cards", "trello_update_card", "coach_wip_limit_check"]
```

Claude AI will:
1. Execute at scheduled time
2. Interpret task description
3. Use allowed tools intelligently
4. Complete task autonomously
5. Log results

### Tool Restriction

Limit tools for security:
```
tools_allowed: [
  "trello_list_cards",      // Read operations
  "trello_update_card",     // Update operations
  "trellio_*"             // Trellio-specific tools
]

// Avoid unrestricted access:
// ❌ tools_allowed: ["*"]  // Too broad
```

## Specific Task Scheduling

### Using add_task

Schedule specific tool calls with parameters:

```
mcp__mcp-cron__add_task:
  schedule: "0 23 * * *"
  tool_name: "trellio_cleanup_board"
  parameters: {
    "archive_done_older_than_days": 7,
    "mark_stale_older_than_days": 30
  }
```

Use for:
- Deterministic operations
- Known tool + parameters
- No AI interpretation needed
- Faster execution

## Monitoring Scheduled Tasks

### List Active Tasks

View all scheduled automation:
```
mcp__mcp-cron__list_tasks

Returns:
- task_id
- schedule (cron expression)
- next_run_time
- enabled status
- task_description
```

### Check Task Status

Get detailed task info:
```
mcp__mcp-cron__get_task:
  task_id: "abc123"

Returns:
- Complete configuration
- Execution history
- Last run result
- Next execution time
```

### Task Execution History

Review past executions:
```
mcp__mcp-cron__get_task_result:
  task_id: "abc123"
  execution_id: "xyz789"

Returns:
- Execution timestamp
- Success/failure status
- Tool calls made
- Results or errors
```

## Task Management

### Enable/Disable Tasks

Temporarily pause automation:
```
# Pause task
mcp__mcp-cron__disable_task: { task_id: "abc123" }

# Resume task
mcp__mcp-cron__enable_task: { task_id: "abc123" }
```

Use cases:
- Pause during vacation
- Disable during board restructure
- Temporarily stop failing tasks
- Testing and debugging

### Remove Tasks

Delete scheduled automation:
```
mcp__mcp-cron__remove_task: { task_id: "abc123" }
```

Always confirm before deletion - task history is lost.

### Update Tasks

To modify task:
1. Remove old task
2. Create new task with updated params
3. Note: Loses execution history

## Error Handling

### Task Failure Scenarios

Handle common failures:
- **Board not accessible**: Retry with exponential backoff
- **Rate limit hit**: Pause and retry after cooldown
- **Invalid parameters**: Log error, notify user
- **Tool not available**: Disable task, alert

### Notification Strategy

On task failure:
- Log error details
- Send notification (if configured)
- Auto-disable after 3 consecutive failures
- Require manual re-enable

## Additional Resources

### Reference Files

- **`references/mcp-cron-api.md`** - Complete MCP-CRON API reference
- **`references/automation-patterns.md`** - Advanced automation patterns

### Example Files

- **`examples/daily-board-cleanup.json`** - Daily cleanup task config
- **`examples/weekly-review-schedule.json`** - Weekly review automation

## Best Practices

1. **Start with dry-runs** - Test tasks manually first
2. **Use specific tools_allowed** - Don't allow all tools
3. **Monitor task execution** - Check results regularly
4. **Handle failures gracefully** - Implement retry logic
5. **Document scheduled tasks** - Keep registry of automation
6. **Test schedule expressions** - Verify cron timing correct
7. **Set realistic expectations** - AI tasks may vary in execution
8. **Backup before automation** - Have rollback plan

## Common Use Cases

### Daily Maintenance
- Archive completed cards
- Check WIP limits
- Update stale task status
- Generate daily summary

### Weekly Operations
- Completion analytics
- Board health report
- Team performance review
- Planning preparation

### On-Demand Automation
- Bulk label updates
- Periodic card creation
- Scheduled reminders
- Data exports

## Troubleshooting

**Task not executing:**
- Verify cron expression correct
- Check task is enabled
- Confirm MCP-CRON server running
- Review execution logs

**Task failing repeatedly:**
- Check tool parameters valid
- Verify board access permissions
- Review error messages
- Test tools manually first

**Wrong execution time:**
- Verify timezone settings
- Check cron expression
- Test with `run_task` immediately
- Confirm schedule interpretation
