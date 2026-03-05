---
name: morning-plan
description: AI-guided daily planning workflow with capacity calculation and task prioritization
allowed-tools: [Read, ToolSearch, AskUserQuestion]
---

# Morning Planning Command

Interactive daily planning workflow with capacity calculation and intelligent task prioritization.

## Usage

```bash
/trellio:morning-plan
```

## Workflow

### Step 1: Board Context

```
Use ToolSearch: trellio_get_daily_planning_context
Fetches:
- Cards in This Week list
- Cards in Today list
- Cards in Doing list
- Overdue cards
- Due today cards
```

### Step 2: Capacity Assessment

```
Use ToolSearch: coach_calculate_day_capacity

Ask user via AskUserQuestion:
- "How many hours do you have for focused work today?"
  Options: ["2-3 hours", "4-5 hours (half day)", "6-8 hours (full day)"]

- "What's your current energy level?"
  Options: ["High - ready for complex work", "Normal - steady work",  "Low - need easier tasks", "Very low - minimal capacity"]

Calculate realistic task count based on:
- Available hours
- Energy level
- Existing in-progress work
- Overdue pressure
```

### Step 3: Task Prioritization

```
Analyze available tasks:
1. Critical: Overdue + due today
2. High priority: Important + achievable
3. Quick wins: < 30 min, high impact
4. Standard: Regular priority tasks

Present prioritized list:
## Recommended for Today

**Must Do (Critical):**
1. [Overdue Task 1] - 2 days overdue
2. [Due Today Task] - Due by 5 PM

**Should Do (High Value):**
3. [Important Task] - 2h estimate
4. [Quick Win] - 30min, unblocks team

**Could Do (If Capacity):**
5. [Standard Task] - 1h estimate

Recommended: 4-5 tasks for your capacity
```

### Step 4: Interactive Selection

```
Use AskUserQuestion:

"Which tasks should move to Today list?"
Options (multiSelect: true):
- [Task 1 title]
- [Task 2 title]
- [Task 3 title]
- [Task 4 title]
- [Task 5 title]

Allow multiple selection
```

### Step 5: Move Cards

```
For each selected task:
  Use ToolSearch: trello_update_card
  Move from This Week to Today
  Update position (priority order)

Show confirmation:
"Moved 4 cards to Today list:
- [Task 1]
- [Task 2]
- [Task 3]
- [Task 4]"
```

### Step 6: Single Focus

```
Use AskUserQuestion:

"Which task will you start first?"
Options:
- [First task from Today]
- [Second task from Today]
- ...

Move selected to Doing list

Confirm:
"🎯 Focus task: [Task Name]
Start here. Everything else can wait."
```

### Step 7: Summary

```
Display final plan:

## Today's Plan

**Now (Doing):**
- [Focus Task]

**Today (Next):**
- [Task 2]
- [Task 3]
- [Task 4]

**This Week (Backlog):**
- X remaining cards

Estimated completion: 4/4 tasks
Capacity: Appropriate for your available time

🎯 Start with: [Focus Task]
```

## Capacity Calculation Logic

```
Base capacity by hours:
- 2-3 hours: 2-3 tasks
- 4-5 hours: 3-5 tasks
- 6-8 hours: 4-7 tasks

Adjust for energy:
- High: +1 task or +complexity
- Normal: No adjustment
- Low: -1 task
- Very low: 1-2 tasks max

Adjust for context:
- If overdue > 3: -1 task
- If Doing not empty: -1 task
- If Today already has cards: Reduce accordingly
```

## Planning Considerations

1. **No overwhelm** - Show manageable list only
2. **Clear priority** - Number tasks 1, 2, 3...
3. **Single focus** - Move ONE task to Doing
4. **Visual progress** - Show what moves where
5. **Realistic capacity** - Better to under-commit
6. **Quick wins included** - Build momentum

## Error Handling

**No tasks in This Week:**
```
Message: "This Week list is empty!"
Action: Suggest creating tasks or moving from Reference
Skip planning, offer task creation
```

**Today already full:**
```
Message: "Today list is at capacity (5 cards)"
Action: Offer to review and remove tasks
Or: Skip adding more
```

**Doing not empty:**
```
Message: "You have X cards in Doing"
Action: Suggest completing current tasks first
Or: Offer to move back to Today
```

## Integration

Works with:
- `/trellio:board-snapshot` - Check before planning
- `/trellio:cleanup` - Clear done tasks first
- `/trellio:board-management` - Multi-board planning

## Tips

- Run every morning as routine
- Be honest about capacity
- Start with focus task immediately after planning
- Resist urge to add more during day
- Review at end of day, not morning
