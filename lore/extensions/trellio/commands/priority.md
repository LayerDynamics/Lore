---
name: trellio-priority
description: Get tasks matched to your current priorities
allowed-tools:
  - mcp__plugin_trellio_trellio__trellio_get_board_snapshot
  - AskUserQuestion
---

# Priority-Matched Tasks

Find tasks that match your current priorities.

## Step 1: Ask Current State

Use AskUserQuestion to ask:
- Question: "What's your current priority focus?"
- Options:
  - High Priority - Ready for complex, focused work
  - Medium Priority - Can handle moderate tasks
  - Low Priority - Light tasks and quick tasks only
  - Simple Tasks - Simple, straightforward tasks only

## Step 2: Get Board Snapshot

Call `trellio_get_board_snapshot` to see all available tasks.

## Step 3: Present Results

Show tasks organized by priority:

```
Tasks Matched to Your Current Priority

HIGH PRIORITY
1. [Task title] - [list] - [due date]
2. [Task title] - [list] - [due date]

MEDIUM PRIORITY
1. [Task title] - [list]
2. [Task title] - [list]

LOW PRIORITY
1. [Task title] - [list]
2. [Task title] - [list]

QUICK TASKS
1. [Easy task] - 15 min
2. [Easy task] - 10 min
```

## Step 4: Recommendations

Based on priority focus:

**High Priority:**
- "Tackle complex problems now while you have full focus"
- "Good time for deep work and strategic planning"
- "Consider batching similar focused tasks"

**Medium Priority:**
- "Good time for steady progress on medium tasks"
- "Mix of focused work and lighter activities"
- "Aim for 2-3 medium tasks today"

**Low Priority:**
- "Focus on quick tasks and steady progress"
- "Light tasks that still move things forward"

**Simple Tasks:**
- "Simple tasks only - keep it manageable"
- "Administrative work, inbox cleanup, organizing"
- "Taking a lighter load is fine"

## Step 5: Offer Actions

Ask if they want to:
- Move a task to Doing
- Get more details on a specific task
- Add a quick task to the list
- Reassess priorities later
- Plan the full day
