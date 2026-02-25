---
name: deftrello-cleanup
description: Clean up and organize board automatically
allowed-tools:
  - mcp__plugin_deftrello_deftrello__deftrello_clean_up_board
  - mcp__plugin_deftrello_deftrello__deftrello_get_board_snapshot
---

# Board Cleanup

Automatically organize and tidy your Trello board.

## Step 1: Show Current State

Call `deftrello_get_board_snapshot` to show before state:

```
Current Board State (Before Cleanup)

REFERENCE: [X cards]
THIS WEEK: [X cards]
TODAY: [X cards]
DOING: [X cards]
DONE: [X cards]

Issues detected:
- [Issue 1: e.g., Done list has 20+ cards]
- [Issue 2: e.g., Overdue cards in This Week]
- [Issue 3: e.g., Cards without priority labels]
```

## Step 2: Run Cleanup

Call `deftrello_clean_up_board` which automatically:
- Archives completed cards in Done (older than 7 days)
- Moves overdue cards from This Week to Today
- Reorders cards by priority level
- Removes inactive tasks (no activity in 30+ days)
- Organizes by due date
- Updates priority labels if missing

## Step 3: Show Cleanup Results

Present what was cleaned:

```
Cleanup Complete!

Actions Taken:
- Archived [X] completed cards
- Moved [X] overdue cards to Today
- Reordered [X] cards by priority
- Removed [X] inactive tasks
- Updated [X] missing priority labels

After Cleanup:

REFERENCE: [X cards]
THIS WEEK: [X cards]
TODAY: [X cards]
DOING: [X cards]
DONE: [X cards]

Board is now organized!
```

## Step 4: Recommendations

Provide cleanup insights:

```
Board Health Tips

Good:
- Priority labels consistent
- No major overdue backlog

Watch:
- Several high-priority tasks queued
- Some cards have no due dates

Suggested Actions:
1. Review This Week list and prioritize
2. Move non-urgent tasks to Reference
3. Set due dates for time-sensitive tasks
4. Break down large tasks into smaller ones
```

## Step 5: Schedule Next Cleanup

Suggest:
```
Cleanup Schedule

Weekly cleanup recommended:
- Every Friday afternoon
- Before weekly planning
- After major project completion

Set a reminder?
- Use mcp-cron to schedule automatic cleanup
- Add "Weekly Cleanup" to your Friday routine
- Let me know if you want to set this up
```

## Step 6: Offer Actions

Ask if they want to:
- View the cleaned board
- Move tasks around manually
- Get priority-matched tasks from the clean board
- Plan tomorrow with clean slate
- Set up automatic weekly cleanup
