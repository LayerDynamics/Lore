---
name: board-snapshot
description: Quick overview of current or specified board status
argument-hint: "[board-name]"
allowed-tools: [Read, ToolSearch]
---

# Board Snapshot Command

Display comprehensive board status including WIP metrics, list distributions, overdue counts, and quick health indicators.

## Usage

```bash
# Current board from settings
/trellio:board-snapshot

# Specific board by name
/trellio:board-snapshot "Team Project"

# Specific board by ID
/trellio:board-snapshot abc123def456
```

## Workflow

1. **Determine target board**
   ```
   If argument provided:
     Use specified board name/ID
   Else:
     Read .claude/trellio.local.md
     Use current_board_id
   ```

2. **Fetch board snapshot**
   ```
   Use ToolSearch to load: trellio_get_board_snapshot
   Call with board_id parameter
   Returns complete board state
   ```

3. **Format comprehensive view**
   ```markdown
   # 📊 Board: Personal Tasks

   ## List Distribution
   - Reference: 12 cards
   - This Week: 18 cards
   - Today: 4 cards
   - Doing: 2 cards
   - Done: 156 cards (23 this week)

   ## Attention Needed
   - ⚠️ Overdue cards: 3
   - 🕐 Due within 24h: 2
   - ⏸️ Stale cards (30+ days): 5

   ## Health Indicators
   - ✅ Workload: Doing focused
   - ✅ Weekly completions: 23 cards
   - ⚠️ Overdue items need attention
   - ✅ No stuck cards in Doing

   Last activity: 2 hours ago
   Board ID: abc123def456
   ```

4. **Provide actionable insights**
   ```
   Based on board state, suggest:
   - Move cards if WIP over limit
   - Address overdue cards
   - Archive old Done cards
   - Clear stale tasks
   ```

## Output Sections

### List Distribution
Card count per list with notable subsets:
- Done: Include recent completions (this week)
- All lists: Total card count

### Attention Needed
Priority items requiring action:
- Overdue cards
- Due soon (< 24h)
- Stale cards (no activity 30+ days)
- Blocked cards

### Health Indicators
Quick board health check:
- Weekly completion rate
- Overdue card count
- Stuck card detection
- Overall progress

## Use Cases

- Morning routine: Check board state
- Before planning: Assess capacity
- After bulk operations: Verify changes
- Debugging: Understand current state
- Context switching: Get up to speed

## Error Handling

**Board not found:**
```
Message: "Board not accessible or doesn't exist"
Action: Run /trellio:board-list to verify
```

**No current board set:**
```
Message: "No current board configured"
Action: Run /trellio:board-select to set board
```

## Integration

Use with:
- `/trellio:morning-plan` - Planning workflow
- `/trellio:cleanup` - Board maintenance
- `/trellio:crash-recovery` - State assessment

## Tips

- Run after switching boards to confirm context
- Use before planning to check capacity
- Include in daily morning routine
- Check after bulk operations for verification
