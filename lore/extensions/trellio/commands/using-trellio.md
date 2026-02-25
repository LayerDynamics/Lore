---
name: using-trellio
description: Complete reference guide for all Trellio MCP commands and tools
---

# Trellio Command Reference

Complete guide to all available Trellio MCP tools for task management.

## Core Board Operations

### Board Overview
```
"Get board snapshot"
"Show me what's on my board"
"List my Trello board"
```
Returns complete board state with all cards organized by list.

### Daily Planning
```
"Get daily planning context"
"Plan my day"
"Show me my planning context for today"
```
Priority-based daily planning with task prioritization.

### Board Activity
```
"Get board activity"
"Show recent board changes"
"What happened on my board today?"
```
View recent activity and changes on your board.

---

## Board Management

### List All Boards
```
"List my Trello boards"
"Show me all my boards"
"What boards do I have?"
```
View all Trello boards you have access to with IDs and URLs.

### Create New Board
```
"Create a board called 'Project Alpha'"
"Make a new board for 'Q1 2026 Planning'"
"Create a private board named 'Personal Projects'"
```
Create new Trello boards programmatically.

Options:
- Name (required)
- Description (optional)
- Default lists (To Do, Doing, Done)
- Default labels
- Permission level (private, org, public)

### Get Board Details
```
"Get details for board abc123def456"
"Show info for board <board-id>"
"Get board abc123"
```
Get complete board information including lists and labels.

### Update Board
```
"Rename board abc123 to 'New Name'"
"Update description of board abc123"
"Archive board abc123"
```
Modify board properties or archive boards.

### Work with Multiple Boards
```
"Get board snapshot for board abc123"
"List cards in Today on board abc123"
"Create a card on board abc123"
```
Most commands now accept optional `board_id` parameter to work with any board!

---

## Card Management

### List Cards
```
"List cards in Today"
"Show cards in Doing"
"List all cards in This Week"
"Show cards in Reference"
"List cards in Done"
```
View all cards in a specific list.

### Get Card Details
```
"Get card [name or ID]"
"Show me details for card [name]"
"Get card activity for [card name]"
```
View complete card information including comments, checklists, and history.

### Create Cards
```
"Create card called [task name]"
"Add new card: [description]"
"Quick add task: [description]"
```
Create new cards. `quick_add_task` automatically assigns priority levels.

### Update Cards
```
"Update card [name] with [description]"
"Move card [name] to Doing"
"Set card [name] due date to tomorrow"
"Add high priority label to [card name]"
```
Modify existing cards: title, description, due date, labels, position.

### Delete Cards
```
"Delete card [name]"
"Remove card [ID]"
```
Permanently delete a card.

### Archive Cards
```
"Archive card [name]"
"Archive completed card [name]"
```
Archive instead of deleting (recommended for completed work).

---

## Priority Management

### Get Priority-Matched Tasks
```
"Get priority matched tasks"
"Show tasks for my current priority"
"What tasks match high priority?"
"Show medium priority tasks"
```
Filter tasks by priority level (High, Medium, Low, Simple Tasks).

### Move Through Pipeline
```
"Move card [name] through pipeline"
"Advance [card name] to next stage"
```
Progress cards through your workflow (Reference -> This Week -> Today -> Doing -> Done).

---

## Labels & Custom Fields

### Manage Labels
```
"Add high priority label to [card]"
"Remove due soon label from [card]"
"Set priority label to medium for [card]"
```
Priority labels: High Priority, Medium Priority, Low Priority, Simple Tasks, Due Soon.

### Set Custom Fields
```
"Set time estimate to 2 hours for [card]"
"Set task type to Deep Work for [card]"
"Set priority to High for [card]"
"Mark [card] as quick task"
```
Custom fields: Time Estimate, Task Type, Priority, Quick Task.

---

## Collaboration

### Assign Members
```
"Assign [card] to @username"
"Add member to [card]"
"Remove member from [card]"
```
Manage card assignments.

### Comments
```
"Add comment to [card]: [text]"
"Comment on [card]: [feedback]"
```
Add discussion and notes to cards.

---

## Checklists

### Manage Checklists
```
"Add checklist to [card]"
"Add item [task] to [card] checklist"
"Check off [item] in [card]"
"Remove checklist from [card]"
```
Break down tasks into smaller steps with checklists.

---

## Search & Filter

### Search Cards
```
"Search cards for [keyword]"
"Find cards with [text]"
"Search for cards labeled high priority"
"Find overdue cards"
```
Search across all cards with advanced filtering.

---

## Task Coach Features

### State Assessment
```
"Assess my current state"
"Check my task state"
"Review my activity level"
```
Analyzes inactivity patterns and provides recovery guidance.

### Smallest Next Action
```
"Get smallest next action"
"What's the easiest thing I can do?"
"Show me small tasks"
```
Break down large tasks into tiny, manageable actions.

### Generate Progress Update
```
"Generate progress update"
"Create progress update"
"Draft standup message"
```
Creates team update messages from your board activity.

### Weekly Completion Stats
```
"Show weekly completion stats"
"How did I do this week?"
"Get weekly progress report"
```
Analytics on completed tasks, priority patterns, and completion trends.

---

## Batch Operations

### Batch Update Cards
```
"Batch update cards matching [criteria]"
"Update all high priority cards in Today"
"Move all overdue cards to This Week"
```
Update multiple cards at once with filters.

### Clean Up Board
```
"Clean up my board"
"Organize and tidy board"
"Auto-organize cards"
```
Automatically archives completed cards, reorders by priority, removes inactive tasks.

### Delegate Task
```
"Delegate [task] to [person]"
"Delegate [card] with context"
```
Prepares task for delegation with full context and handoff notes.

---

## n8n Workflow Integration

### List Workflows
```
"List n8n workflows"
"Show automation workflows"
```
View all available n8n automation workflows.

### Get Workflow Status
```
"Get status of [workflow]"
"Is [workflow] active?"
```
Check if workflow is active or inactive.

### Activate/Deactivate Workflow
```
"Activate workflow [name]"
"Deactivate workflow [name]"
"Turn on [workflow]"
"Turn off [workflow]"
```
Control n8n workflow execution.

### Trigger Workflow
```
"Trigger workflow [name]"
"Run [workflow] manually"
```
Execute workflow on demand.

### Get Execution Log
```
"Get execution log for [workflow]"
"Show recent runs of [workflow]"
```
View workflow execution history and results.

### Check n8n Health
```
"Check n8n health"
"Is n8n running?"
```
Verify n8n server connectivity and status.

---

## Codebase Integration

### Read Project File
```
"Read file [path] from trellio project"
```
Access files in the Trellio project directory.

### Write Project File
```
"Write to [path] in trellio project"
```
Modify files in the Trellio project directory.

### List Project Files
```
"List files in trellio project"
"Show project structure"
```
Browse the Trellio codebase.

### Search Codebase
```
"Search trellio code for [pattern]"
"Find [keyword] in project"
```
Grep through Trellio source code.

### Run Project Script
```
"Run script [name] in trellio"
"Execute [script.sh]"
```
Execute scripts in the Trellio project.

### Environment Config
```
"Get env config"
"Show environment variables"
"Get value of [ENV_VAR]"
```
View Trellio environment configuration.

---

## Git Operations

### Git Status
```
"Git status for trellio"
"Show git state"
```
View git working tree status.

### Git Diff
```
"Git diff for trellio"
"Show uncommitted changes"
```
View changes since last commit.

### Git Log
```
"Git log for trellio"
"Show recent commits"
```
View commit history.

### Git Commit
```
"Git commit trellio changes"
"Commit with message [text]"
```
Create a git commit.

---

## Quick Reference: Common Workflows

### Morning Routine
```
1. "Get daily planning context"
2. "Show priority matched tasks for [current priority]"
3. "Move [top priority] to Doing"
```

### Task Recovery
```
1. "Assess my current state"
2. "Get smallest next action"
3. "Quick add task: [small task]"
4. "Move smallest task to Doing"
```

### Weekly Review
```
1. "Show weekly completion stats"
2. "Clean up my board"
3. "Get board snapshot"
4. "Plan next week's tasks"
```

### Task Backlog
```
1. "Get smallest next action"
2. "Delegate [task] to [person]"
3. "Archive completed work"
```

---

## Configuration

Your Trellio is configured with:

**Board Lists:**
- Reference
- This Week
- Today
- Doing
- Done

List IDs are configured via environment variables (`TRELLO_LIST_*_ID`).

**Priority Labels:**
- High Priority (green)
- Medium Priority (yellow)
- Low Priority (orange)
- Simple Tasks (red)
- Due Soon (purple)

Label IDs are configured via environment variables (`TRELLO_LABEL_*_ID`).

**n8n Integration (optional):**
- Configured via `N8N_BASE_URL` and `N8N_API_KEY` environment variables
- Workflows: Morning Briefing, Task Recovery, Email Capture, Smart Reminders, Overdue Alerts, Calendar Sync

---

## Tips

1. **Always specify list names** - "Today", "Doing", "This Week", etc.
2. **Use priority labels** - Route tasks by current priority
3. **Archive, don't delete** - Keep task history for analytics
5. **Use quick add** - Fastest way to capture tasks with auto-priority routing
6. **Check current state** - If stuck for 2+ days, get recovery guidance
7. **Clean up regularly** - Use "clean up board" to maintain organization

---

## Troubleshooting

**Trellio not available?**
- Ensure MCP server is in `~/.claude.json` (user scope)
- Restart Claude Code
- Check `firecrawl --status` for connection

**Commands not working?**
- Verify Trello credentials in env vars
- Check board ID is correct
- Try "Get board snapshot" to test connectivity

**n8n workflows not responding?**
- Run "Check n8n health"
- Verify n8n server is running at your configured N8N_BASE_URL
- Check N8N_API_KEY is valid

---

**Trellio Version:** 1.0
**Global Access:** Available from all directories
