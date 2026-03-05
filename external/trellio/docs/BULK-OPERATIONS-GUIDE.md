# DefTrello Bulk Operations Guide

## Overview

Multiple ways to bulk create, update, and manage Trello cards.

---

## Method 1: Direct Bulk Update (Built-in Tool)

Use the `batch_update_cards` tool to update multiple cards at once.

### Example

```
"Update these cards in bulk:
- Card abc123: change priority to High, set energy level 3
- Card def456: move to Today list, set due date 2026-02-20
- Card ghi789: add time estimate 2 hours, mark as quick win"
```

I'll automatically use the batch update tool.

---

## Method 2: Import from JSON File

### Step 1: Create JSON file

Edit `tasks-import-template.json` with your tasks:

```json
{
  "tasks": [
    {
      "title": "Your task title",
      "list": "this_week",
      "energy": 3,
      "priority": "High",
      "time_estimate": "2h",
      "task_type": "Feature",
      "due_date": "2026-02-20",
      "quick_win": false
    }
  ]
}
```

### Step 2: Import via Claude

```
"Read tasks-import-template.json and create all tasks in my Trello board"
```

I'll read the file and create each task using `quick_add_task`.

---

## Method 3: Import from CSV

### Step 1: Create CSV file

Edit `tasks-import-template.csv`:

```csv
title,list,energy,priority,time_estimate,task_type,due_date,quick_win
"Fix bug #123",this_week,3,High,2h,Bug Fix,2026-02-20,true
"Add feature X",this_week,4,High,4h,Feature,,false
```

### Step 2: Run import script

```bash
./scripts/bulk-import-tasks.sh tasks-import-template.csv
```

Or via Claude:
```
"Import tasks from tasks-import-template.csv"
```

---

## Method 4: Natural Language Bulk Creation

Just describe multiple tasks:

```
"Add these tasks to This Week:
1. Review quarterly goals (High priority, 1h, Planning, medium energy)
2. Fix authentication bug (High priority, 3h, Bug Fix, high energy, due Feb 20)
3. Update documentation (Medium priority, 2h, Docs, low energy, quick win)
4. Refactor user service (Medium priority, 4h, Refactoring, high energy)
5. Deploy to staging (High priority, 30m, Deployment, medium energy, quick win, due Feb 17)"
```

I'll create all tasks in parallel.

---

## Method 5: Paste from Spreadsheet

Copy from Excel/Google Sheets and paste:

```
"Import these tasks:

Task Title              | List       | Energy | Priority | Time | Type
Review quarterly goals  | This Week  | 3      | High     | 1h   | Planning
Fix auth bug           | Today      | 4      | High     | 3h   | Bug Fix
Update docs            | This Week  | 2      | Medium   | 2h   | Docs"
```

I'll parse the table and create tasks.

---

## Bulk Update Operations

### Update All Cards in a List

```
"For all cards in This Week:
- Set energy level to 3
- Add priority label Medium"
```

### Update by Search Query

```
"Find all cards with 'bug' in the title and:
- Set priority to High
- Add task type 'Bug Fix'
- Set energy to 4"
```

### Move Multiple Cards

```
"Move all cards with priority High from This Week to Today"
```

---

## Field Options

### List Names
- `reference` - Reference cards
- `this_week` - This Week
- `today` - Today
- `doing` - Doing (WIP)
- `done` - Done

### Energy Levels
- `1` - Brain Dead
- `2` - Low
- `3` - Medium
- `4` - High
- `5` - Peak

### Priority
- `High`
- `Medium`
- `Low`

### Time Estimate
- Examples: `30m`, `1h`, `2h`, `4h`, `1d`

### Quick Win
- `true` - Yes
- `false` - No

---

## Examples

### Example 1: Weekly Planning Import

```json
{
  "tasks": [
    {
      "title": "Weekly team sync",
      "list": "this_week",
      "energy": 3,
      "priority": "High",
      "time_estimate": "1h",
      "task_type": "Meeting",
      "due_date": "2026-02-17"
    },
    {
      "title": "Code review backlog",
      "list": "this_week",
      "energy": 4,
      "priority": "Medium",
      "time_estimate": "3h",
      "task_type": "Code Review"
    },
    {
      "title": "Update JIRA tickets",
      "list": "this_week",
      "energy": 2,
      "priority": "Low",
      "time_estimate": "30m",
      "task_type": "Admin",
      "quick_win": true
    }
  ]
}
```

### Example 2: Sprint Planning from CSV

```csv
title,list,energy,priority,time_estimate,task_type,due_date,quick_win
"User authentication API",this_week,4,High,8h,Feature,2026-02-24,false
"Write API tests",this_week,3,High,4h,Testing,2026-02-25,false
"Update API documentation",this_week,2,Medium,2h,Documentation,2026-02-25,true
"Deploy to staging",this_week,3,High,1h,Deployment,2026-02-26,true
"QA testing",this_week,3,High,4h,Testing,2026-02-27,false
```

### Example 3: Bug Triage Import

```
"Import these bugs to This Week:
1. Login fails on mobile Safari (Critical, 4h, high energy)
2. Cart total calculation wrong (High, 2h, medium energy)
3. Slow loading on dashboard (Medium, 3h, high energy)
4. Typo in error message (Low, 10m, low energy, quick win)
5. Missing validation on form (High, 1h, medium energy)"
```

---

## Batch Operations

### Archive Completed Tasks

```
"Clean up board - archive all Done cards"
```

Uses `clean_up_board` tool.

### Bulk Priority Update

```
"Set all overdue tasks to High priority"
```

### Bulk Energy Assignment

```
"For all tasks in This Week without energy labels:
- Code tasks → High energy (4)
- Meetings → Medium energy (3)
- Documentation → Low energy (2)
- Admin → Brain Dead energy (1)"
```

---

## Tips

**Use JSON for complex imports** - Better for many fields and formatting

**Use CSV for spreadsheet exports** - Easy copy-paste from Excel/Sheets

**Use natural language for quick adds** - 5-10 tasks at a time

**Batch updates save time** - Update multiple cards with one command

**Energy labels are crucial** - Always assign for better planning

---

## Template Files

- `tasks-import-template.json` - JSON template
- `tasks-import-template.csv` - CSV template
- `scripts/bulk-import-tasks.sh` - Automated CSV import

---

## Common Workflows

### Monday Planning
1. Export sprint tasks from JIRA to CSV
2. Import to This Week via bulk import
3. Assign energy levels in batch
4. Pull high-priority items to Today

### End of Week Cleanup
1. Archive all Done cards
2. Move incomplete Today cards back to This Week
3. Review and update priorities for next week

### Bug Triage
1. Import bugs from issue tracker
2. Batch assign priorities
3. Batch assign energy levels
4. Pull critical bugs to Today

---

Ready to bulk import? Just say:

- "Import tasks from [filename]"
- "Create these tasks in bulk: [list]"
- "Update all cards in [list] with [changes]"
