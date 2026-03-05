---
name: using-trellio
description: This skill should be used when the user asks about "Trellio commands", "Trello MCP tools", "board operations", "task management", or needs reference for available Trellio functionality
version: 2.0.0
---

# Trellio Command Reference

Complete guide to all available Trellio MCP tools for task management with multi-board support.

## 🎯 Core Board Operations

### Board Overview
```
"Get board snapshot"
"Show me what's on my board"
"List my Trello board"
```
Returns complete board state with all cards organized by list.

### Board Selection
```
"Switch to [board name]"
"Use [board name] board"
"List all my boards"
```
Multi-board support: switch between different Trello boards dynamically.

### Daily Planning
```
"Get daily planning context"
"Plan my day"
"Show me my planning context for today"
```
ADHD-optimized daily planning with WIP limit awareness.

### Board Activity
```
"Get board activity"
"Show recent board changes"
"What happened on my board today?"
```
View recent activity and changes on your board.

---

## 📋 Card Management

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
Create new cards with automatic list placement.

### Update Cards
```
"Update card [name] with [description]"
"Move card [name] to Doing"
"Set card [name] due date to tomorrow"
"Add priority label to [card name]"
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

## 📍 Pipeline Management

### Move Through Pipeline
```
"Move card [name] through pipeline"
"Advance [card name] to next stage"
```
Progress cards through your workflow (Reference → This Week → Today → Doing → Done).

---

## 🎨 Labels & Custom Fields

### Manage Labels
```
"Add due soon label to [card]"
"Remove label from [card]"
"Set priority label for [card]"
```
Label management for task organization.

### Set Custom Fields
```
"Set time estimate to 2 hours for [card]"
"Set task type to Deep Work for [card]"
"Set priority to High for [card]"
"Mark [card] as quick win"
```
Custom fields: Time Estimate, Task Type, Priority, Quick Win.

---

## 👥 Collaboration

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

## ✅ Checklists

### Manage Checklists
```
"Add checklist to [card]"
"Add item [task] to [card] checklist"
"Check off [item] in [card]"
"Remove checklist from [card]"
```
Break down tasks into smaller steps with checklists.

---

## 🔍 Search & Filter

### Search Cards
```
"Search cards for [keyword]"
"Find cards with [text]"
"Find overdue cards"
"Search for priority cards"
```
Search across all cards with advanced filtering.

---

## 🤖 ADHD Coach Features

### Crash State Assessment
```
"Assess my crash state"
"Am I in crash mode?"
"Check my productivity state"
```
Analyzes inactivity patterns and provides recovery guidance.

### Smallest Next Action
```
"Get smallest next action"
"What's the easiest thing I can do?"
"Show me micro-tasks"
```
Break overwhelming tasks into tiny, manageable actions.

### Calculate Day Capacity
```
"Calculate my day capacity"
"How much can I handle today?"
"Show my task capacity"
```
Estimates how many tasks can realistically be completed today.

### Generate Accountability Message
```
"Generate accountability message"
"Create progress update"
"Draft standup message"
```
Creates team update messages from your board activity.

### WIP Limit Check
```
"Check WIP limits"
"Am I over WIP limits?"
"Validate my work in progress"
```
Ensures you're not overcommitting (Doing: 1-2, Today: 5, This Week: 15-20).

### Weekly Completion Stats
```
"Show weekly completion stats"
"How did I do this week?"
"Get weekly progress report"
```
Analytics on completed tasks and productivity trends.

---

## 🧹 Batch Operations

### Batch Update Cards
```
"Batch update cards matching [criteria]"
"Update all priority cards in Today"
"Move all overdue cards to This Week"
```
Update multiple cards at once with filters.

### Clean Up Board
```
"Clean up my board"
"Organize and tidy board"
"Auto-organize cards"
```
Automatically archives completed cards, reorders by priority, removes stale tasks.

### Delegate Task
```
"Delegate [task] to [person]"
"Delegate [card] with context"
```
Prepares task for delegation with full context and handoff notes.

---

---

## 💾 Codebase Integration

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

## 📊 Git Operations

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

## 🎯 Quick Reference: Common Workflows

### Morning Routine
```
1. "Get daily planning context"
2. "Calculate my day capacity"
3. "Show priority tasks for today"
4. "Move [top priority] to Doing"
```

### Crash Recovery
```
1. "Assess my crash state"
2. "Get smallest next action"
3. "Quick add task: [micro-task]"
4. "Move smallest task to Doing"
```

### Weekly Review
```
1. "Show weekly completion stats"
2. "Clean up my board"
3. "Get board snapshot"
4. "Plan next week's tasks"
```

### Task Overwhelm
```
1. "Check WIP limits"
2. "Get smallest next action"
3. "Delegate [task] to [person]"
4. "Archive completed work"
```

### Multi-Board Workflow
```
1. "List all my boards"
2. "Switch to [board name]"
3. "Get board snapshot"
4. "Work with cards on current board"
```

---

## 🔧 Configuration

Trellio supports multiple boards. Configure boards in `.claude/trellio.local.md`:

**Standard Lists:**
- Reference - Long-term reference and templates
- This Week - Tasks planned for the week
- Today - Tasks for today
- Doing - Active work
- Done - Completed tasks

**Standard Labels:**
- Priority (High/Medium/Low)
- Due Soon
- Task Type markers
- Custom labels per board

---

## 💡 Tips

1. **Always specify list names** - "Today", "Doing", "This Week", etc.
2. **Switch boards easily** - Use board selection commands for multi-board workflows
3. **Focus work** - Keep Doing focused on active work
4. **Archive, don't delete** - Keep task history for analytics
5. **Use quick add** - Fastest way to capture tasks
6. **Check board state** - If stuck, assess what's blocking progress
7. **Clean up regularly** - Use "clean up board" to maintain organization

---

## 🆘 Troubleshooting

**Trellio not available?**
- Ensure MCP server is configured in `.claude/mcp.json`
- Restart Claude Code session
- Check MCP server logs for errors

**Commands not working?**
- Verify Trello credentials in env vars
- Check current board is set in `.claude/trellio.local.md`
- Try "Get board snapshot" to test connectivity

**Multi-board issues?**
- Run "List all my boards" to verify board access
- Check `.claude/trellio.local.md` for current_board_id
- Ensure board IDs are correct in settings

---

## 📚 Additional Resources

For detailed guidance on specific workflows:
- **/trellio:board-management** - Multi-board operations
- **/trellio:bulk-operations** - Batch imports and updates
- **/trellio:velocity-recovery** - Project recovery workflows
- **/trellio:morning-plan** - Daily planning automation

**Trellio Version:** 2.0.0
**Multi-Board Support:** ✅ Enabled
**Status:** Ready to use
