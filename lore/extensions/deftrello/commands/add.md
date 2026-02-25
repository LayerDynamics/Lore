---
name: deftrello-add
description: Quick add task with automatic priority assignment
allowed-tools:
  - mcp__plugin_deftrello_deftrello__deftrello_quick_add_task
  - AskUserQuestion
---

# Quick Add Task

Quickly add a new task to your board with automatic priority routing.

## Step 1: Get Task Description

Ask the user:
- "What task do you want to add?"

Get a clear, concise description of the task.

## Step 2: Call Quick Add

Use `deftrello_quick_add_task` with the task description.

This tool automatically:
- Creates the card
- Places it in the right list (This Week or Today)
- Sets defaults for task management

## Step 3: Confirm Creation

Show the user:
```
Task added successfully!

Task: [task description]
List: [This Week/Today]
Labels: [assigned labels]
```

## Step 4: Offer Follow-up

Ask if they want to:
- Add another task
- Move this task to Doing (if ready to start)
- Set a due date
- Add checklist items
- View the board

## Notes

The `quick_add_task` tool is smart:
- Detects complexity from description
- Assigns appropriate labels automatically
- No manual configuration needed
- Optimized for speed and task management workflow
