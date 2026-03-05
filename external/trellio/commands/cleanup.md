---
name: cleanup
description: Automated board maintenance and housekeeping
argument-hint: "[--dry-run]"
allowed-tools: [ToolSearch, AskUserQuestion]
---

# Board Cleanup Command

Automated board maintenance including archiving completed work, identifying stale tasks, checking team workload, and optimizing board organization.

## Usage

```bash
# Execute cleanup
/trellio:cleanup

# Preview changes without executing
/trellio:cleanup --dry-run
```

## Workflow

### Step 1: Analyze Board State

```
Use ToolSearch: trellio_get_board_snapshot

Analyze:
- Completed cards in Done (age)
- Stale cards (no activity > 30 days)
- WIP limit violations
- Overdue cards
- Orphaned or blocked cards
```

### Step 2: Archive Completed Work

```
Identify cards for archiving:
- In Done list
- Completed > 7 days ago
- No recent comments/updates

Use ToolSearch: trello_archive_card for each

Report:
"📦 Archived 23 completed cards (>7 days old)"
```

### Step 3: Identify Stale Tasks

```
Find stale cards:
- Any list (except Done)
- No activity > 30 days
- No due date OR past due date

Present stale cards:
"⚠️ Found 5 stale tasks (30+ days no activity):
1. [Card Name] - Last activity: 45 days ago
2. [Card Name] - Last activity: 38 days ago
...

Options:
- Archive (recommend for truly stale)
- Move to Reference (keep for later)
- Keep active (still relevant)
"

Use AskUserQuestion for bulk action or individual review
```

### Step 4: Check Team Workload

```
Check team workload distribution:

Analyze:
- Doing list: Should be focused work (1-2 items)
- Today list: Daily commitments (3-5 items)
- This Week: Sprint/weekly backlog (manageable scope)

Report workload:
"⚠️ Workload Analysis:
- John Doe: 4 cards in Doing (recommend moving 2-3)
- Team Today: 12 cards (evaluate priority)

Suggestion: Move lower priority items back to This Week"
```

### Step 5: Optimize Card Positions

```
Reorder cards by:
- Priority (High → Low)
- Due date (soonest first)
- Dependencies (unblocked first)

Within each list:
1. Overdue/urgent cards at top
2. Due soon next
3. Priority-sorted remainder
4. Nice-to-haves at bottom

Report:
"✅ Reordered 18 cards by priority and due date"
```

### Step 6: Generate Cleanup Report

```
Summary report:

## Board Cleanup Summary

**Actions Taken:**
- ✅ Archived 23 completed cards
- ✅ Moved 5 stale tasks to Reference
- ✅ Reordered 18 cards by priority
- ✅ Updated 3 card labels

**Current Board Health:**
- Doing: 2 cards (optimal)
- Today: 5 cards (optimal)
- This Week: 17 cards (good)
- Overdue: 2 cards (needs attention)

**Recommendations:**
- Address 2 overdue cards
- Review 3 cards stuck in Doing >5 days
- Consider delegating [Card X]

Last cleanup: 5 days ago
Next recommended cleanup: in 7 days
```

### Step 7: Optional Actions

```
If --dry-run flag:
  Show what WOULD be done
  Don't execute any changes
  Preview report only

Ask user:
"Schedule automatic weekly cleanup?"
Options:
- "Yes, every Sunday at 11 PM" → Create scheduled task
- "Yes, custom schedule" → Ask for timing
- "No, manual only"
```

## Cleanup Rules

### Archive Rules
```
Archive if:
- List = Done
- Completed date > 7 days ago
- No comments in last 7 days

Keep if:
- Has attachments marked "keep"
- Referenced by active cards
- Labeled "milestone" or "reference"
```

### Stale Detection
```
Mark stale if:
- Not in Done list
- No activity > 30 days
- No due date OR overdue >30 days
- Not labeled "on-hold"

Exceptions:
- Reference list (expected to be inactive)
- Cards labeled "backlog" or "icebox"
```

### Workload Optimization
```
Recommended balance:
- Individual Doing: Focus on 1-2 tasks
- Individual Today: 3-5 daily tasks
- Team This Week: Based on team capacity

Rebalancing:
- Move excess from Doing → Today
- Move excess from Today → This Week
- Suggest delegation for overload
```

## Dry-Run Mode

Preview all actions without making changes:

```bash
/trellio:cleanup --dry-run
```

Output:
```
🔍 DRY RUN - No changes will be made

WOULD archive 23 cards:
- [Card 1] - Completed 8 days ago
- [Card 2] - Completed 15 days ago
...

WOULD move to Reference:
- [Stale Card 1] - 45 days inactive
- [Stale Card 2] - 38 days inactive

WOULD reorder:
- 18 cards by priority in This Week

To execute these changes, run: /trellio:cleanup
```

## Team Considerations

### Multi-Member Workload

For team boards:
```
Calculate per-person workload:
- List assigned cards per member
- Check individual capacity
- Identify overloaded members
- Suggest rebalancing

Example:
"Team Workload Analysis:
- Alice: 8 cards (optimal)
- Bob: 15 cards (overloaded ⚠️)
- Carol: 3 cards (has capacity)

Suggestion: Move 5 cards from Bob to Carol"
```

### Delegation Recommendations

When cleanup reveals overload:
```
Use ToolSearch: trellio_delegate_task

Identify cards suitable for delegation:
- Not in Doing (not started)
- Clear requirements
- Can be handed off
- Team member has capacity

Suggest: "Consider delegating [Card X] to Carol"
```

## Integration

Works with:
- `/trellio:board-snapshot` - Check before cleanup
- `/trellio:board-select` - Cleanup specific board
- MCP-CRON automation - Schedule regular cleanup

References:
- `bulk-operations` - Batch archiving patterns
- `board-management` - Multi-board cleanup

## Best Practices

1. **Run weekly** - Prevent buildup
2. **Use dry-run first** - Preview changes
3. **Schedule automation** - Set and forget
4. **Review stale cards** - Don't auto-archive everything
5. **Monitor workload** - Balance team capacity
6. **Keep milestones** - Mark important cards
7. **Document exceptions** - Use labels for special cases

## Error Handling

**Nothing to clean:**
```
Message: "Board is clean! No actions needed."
Show: Last cleanup date, next recommendation
```

**Cleanup fails mid-process:**
```
Message: "Cleanup partially completed"
Show: What succeeded, what failed
Offer: Retry failed operations
Log: Error details for review
```

## Scheduling Automation

Set up automatic cleanup:

```
After first cleanup, offer:
"Want to schedule automatic cleanup?"

If yes:
- Create MCP-CRON task
- Weekly Sunday 11 PM default
- Uses --dry-run for safety
- Generates report only
- Requires manual approval for actions
```

## Tips

- Run cleanup before sprint planning
- Use after major project milestones
- Schedule weekly for active boards
- Review stale cards before archiving
- Monitor team workload trends
