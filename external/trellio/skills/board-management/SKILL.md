---
name: board-management
description: This skill should be used when the user asks to "switch boards", "manage multiple boards", "work with different boards", "list my boards", "board selection", or needs to handle multi-board Trello workflows
version: 1.0.0
---

# Multi-Board Management

Comprehensive guidance for working with multiple Trello boards in Trellio. Handle board switching, discovery, context management, and multi-board workflows efficiently.

## When to Use This Skill

Use this skill when:
- Switching between personal, team, and project boards
- Managing multiple Trello boards simultaneously
- Setting up board preferences and defaults
- Discovering available boards
- Troubleshooting multi-board issues

## Board Context Management

Trellio maintains board context through `.claude/trellio.local.md` settings file. This file tracks:
- Current active board (`current_board_id`)
- Default fallback board (`default_board_id`)
- Board registry with list mappings
- Integration settings

### Settings File Structure

```yaml
---
current_board_id: "abc123"
default_board_id: "abc123"
boards:
  - name: "Personal Tasks"
    id: "abc123"
    lists:
      reference: "list_id_1"
      this_week: "list_id_2"
      today: "list_id_3"
      doing: "list_id_4"
      done: "list_id_5"
  - name: "Team Project"
    id: "def456"
    lists:
      reference: "list_id_6"
      # ...
---
```

## Board Discovery

### Listing Available Boards

To discover boards:
1. Use MCP tool `trello_list_boards` to fetch all accessible boards
2. Display board names, IDs, and basic metadata
3. Highlight current board from settings
4. Show boards not yet in registry

### Adding Boards to Registry

When adding a new board to settings:
1. Get board ID from Trello URL: `trello.com/b/BOARD_ID/name`
2. Fetch board structure (lists, labels, custom fields)
3. Map standard Trellio lists (Reference, This Week, Today, Doing, Done)
4. Add entry to `boards` array in settings
5. Optionally set as current or default board

## Board Switching Workflow

### Interactive Board Selection

For user command `/trellio:board-select`:
1. Read current settings
2. List available boards from registry
3. Use AskUserQuestion to present choices
4. Update `current_board_id` in settings
5. Display board snapshot after switch

### Direct Board Selection

When user specifies board by name:
1. Match board name to registry (fuzzy matching acceptable)
2. Update `current_board_id` to matched board
3. Confirm switch with brief board overview

### Command-Based Switching

For "Switch to [board name]" queries:
1. Parse board name from user input
2. Look up board ID in settings registry
3. Update settings file
4. Load board snapshot for confirmation

## Multi-Board Operations

### Working Across Boards

When operations span multiple boards:
1. Specify `board_id` parameter in MCP tool calls
2. Override current board context temporarily
3. Return to default board after operation
4. Track board changes in output

### Comparing Boards

To compare multiple boards:
1. Fetch snapshots for each board
2. Present side-by-side comparison (WIP status, overdue counts, etc.)
3. Identify differences in structure or configuration
4. Suggest alignment opportunities

### Moving Cards Between Boards

When moving cards across boards:
1. Verify destination board exists in registry
2. Check destination board has compatible list structure
3. Use Trello API move operations (not copy)
4. Update card links and references
5. Notify about moved cards

## Board Structure Validation

### Trellio Standard Structure

Validate boards have Trellio-compliant structure:
- 5 standard lists: Reference, This Week, Today, Doing, Done
- Priority labels (High, Medium, Low)
- Due Soon label
- Custom fields: Time Estimate, Task Type, Priority, Quick Win
- Proper WIP limits configured

### Mapping Non-Standard Boards

For boards with different structures:
1. Identify closest list equivalents
2. Map to Trellio conventions
3. Update registry with custom mappings
4. Note deviations in board entry
5. Adjust WIP limits accordingly

## Settings Management

### Reading Settings

To access current board settings:
```bash
# Settings location
/Users/ryanoboyle/trellio/.claude/trellio.local.md

# Read with Read tool
# Parse YAML frontmatter for configuration
```

### Updating Settings

To modify board settings:
1. Read current settings file
2. Parse YAML frontmatter
3. Update specific fields (current_board_id, boards array)
4. Write back to file preserving format
5. Verify changes took effect

### Settings Fallback Logic

MCP tools use this fallback priority:
1. Explicit `board_id` parameter in tool call
2. `current_board_id` from settings file
3. `default_board_id` from settings file
4. `TRELLO_BOARD_ID` from environment variables
5. Error if none available

## Common Patterns

### Pattern 1: Daily Multi-Board Check-In

```
1. List all boards
2. For each board:
   - Switch to board
   - Get board snapshot
   - Check WIP limits
   - Note overdue cards
3. Return to default board
4. Present summary report
```

### Pattern 2: Board-Specific Planning

```
1. Switch to target board
2. Run morning planning workflow
3. Get task recommendations
4. Move cards to Today/Doing
5. Switch back to previous board
```

### Pattern 3: Cross-Board Delegation

```
1. Identify task on current board
2. Determine target team board
3. Copy/move task to team board
4. Assign to team member
5. Add reference link on original board
```

## Troubleshooting

### Board Not Found

When board lookup fails:
- Verify board ID is correct (check Trello URL)
- Ensure user has access to board
- Check board hasn't been deleted
- Refresh board list from Trello API

### Settings File Issues

If settings file corrupted or missing:
- Create from `.example` template
- Rebuild board registry from Trello API
- Set sensible defaults
- Validate YAML syntax

### Context Confusion

When operations affect wrong board:
- Always confirm current board before operations
- Display board name in command output
- Verify settings file updated correctly
- Check for stale board ID references

## Additional Resources

### Reference Files

For detailed patterns:
- **`references/multi-board-patterns.md`** - Advanced multi-board workflows
- **`references/settings-schema.md`** - Complete settings file specification

### Example Files

Working examples:
- **`examples/board-switching-workflow.md`** - Step-by-step board switching
- **`examples/multi-board-comparison.md`** - Board comparison patterns

### Utility Scripts

Helper scripts:
- **`scripts/discover-boards.sh`** - Discover and register boards from Trello API
- **`scripts/validate-settings.sh`** - Validate settings file format
- **`scripts/sync-board-structure.sh`** - Sync board structure to settings

## Best Practices

1. **Always confirm board context** - Display current board in outputs
2. **Use descriptive board names** - Makes registry easier to navigate
3. **Keep settings in sync** - Update settings when boards change
4. **Set sensible defaults** - Default board should be most-used
5. **Document custom structures** - Note non-standard board layouts
6. **Regular registry cleanup** - Remove deleted boards from registry
7. **Test board switching** - Verify switches work before critical operations

## Integration with Commands

This skill works with:
- `/trellio:board-select` - Interactive board switching
- `/trellio:board-list` - Display all boards
- `/trellio:board-snapshot` - Current board overview
- `/trellio:board-create` - New board setup with registration

## Next Steps

After mastering board management:
- Explore bulk operations across boards
- Set up automation workflows per board
- Configure board-specific WIP limits
- Implement cross-board reporting
