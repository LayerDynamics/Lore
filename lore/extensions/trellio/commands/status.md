---
name: trellio-status
description: Check current task status and what's in progress
allowed-tools:
  - mcp__plugin_trellio_trellio__trellio_get_board_snapshot
---

# Task Status Check

See what's currently in progress and what's coming up next.

## Step 1: Get Board Status

Call `trellio_get_board_snapshot` to retrieve current task state.

## Step 2: Present Task Status

Show a clear summary:

```
Task Status Overview

DOING (Active Focus)
- [Card title] - [priority]
- [Card title] - [priority]

TODAY (Up Next)
- [Card title] - [priority] - [due date]
- [Card title] - [priority] - [due date]

THIS WEEK (Queued)
- [Card title] - [priority]
- [Card title] - [priority]
```

## Step 3: Recommendations

Based on current state:
- If nothing in Doing: "Ready to pull a task from Today"
- If tasks in Doing: "Stay focused on current work before starting something new"
- Highlight any overdue or high-priority tasks

## Step 4: Offer Actions

Ask if they want to:
- Move a task to Doing
- Get details on a specific task
- Add a new task
- Run board cleanup
