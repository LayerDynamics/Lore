---
name: board-select
description: Switch between multiple Trello boards or select a specific board as current context
argument-hint: "[board-name]"
allowed-tools: [Read, Write, ToolSearch, AskUserQuestion]
---

# Board Selection Command

Switch between multiple Trello boards. Supports interactive selection or direct board specification.

## Usage

```bash
# Interactive mode - shows list of boards to choose from
/trellio:board-select

# Direct selection by name
/trellio:board-select "Team Project"

# Direct selection by ID
/trellio:board-select abc123def456
```

## Workflow

### Interactive Mode (No Arguments)

When invoked without arguments:

1. **Read current settings**
   ```
   Use Read tool on .claude/trellio.local.md
   Parse YAML frontmatter for board registry
   Note current_board_id
   ```

2. **Fetch available boards**
   ```
   Use ToolSearch to load: trello_list_boards
   Call trello_list_boards tool
   Get all accessible boards from Trello API
   ```

3. **Present choices**
   ```
   Use AskUserQuestion to present board options:
   - Show board names from settings registry
   - Highlight current board
   - Include board from API not in registry
   - Allow "Other" for custom board ID input
   ```

4. **Update settings**
   ```
   Parse user selection
   Update current_board_id in settings file
   Use Write tool to save changes
   ```

5. **Confirm switch**
   ```
   Use ToolSearch to load: trellio_get_board_snapshot
   Call snapshot tool with new board_id
   Display brief board overview (list counts, overdue count)
   Confirm: "Switched to [Board Name]"
   ```

### Direct Selection Mode (With Argument)

When board name/ID provided:

1. **Read settings** - Load board registry

2. **Match board**
   ```
   Try exact name match first
   Fall back to fuzzy matching
   If no match, interpret as board ID
   ```

3. **Validate board**
   ```
   Use ToolSearch: trello_get_board_info
   Verify board exists and accessible
   ```

4. **Update settings** - Set new current_board_id

5. **Show confirmation** - Display board snapshot

## Error Handling

**Board not found:**
```
Message: "Board '[name]' not found in registry or Trello API"
Suggestion: "Run /trellio:board-list to see available boards"
```

**Settings file missing:**
```
Message: "Settings file not found at .claude/trellio.local.md"
Action: Create from .example template
Prompt: Set up first board
```

**No boards available:**
```
Message: "No boards accessible with current Trello credentials"
Action: Verify TRELLO_API_KEY and TRELLO_TOKEN
Suggestion: Check board permissions
```

## Integration

After board selection, all subsequent DefTrello operations use the new current board unless explicitly overridden with board_id parameter.

Related commands:
- `/trellio:board-list` - View all boards
- `/trellio:board-snapshot` - Current board overview

## Settings Update Format

When updating `.claude/trellio.local.md`:

```yaml
---
current_board_id: "new_board_id_here"  # Update this line
default_board_id: "unchanged"
boards:
  - name: "Board Name"
    id: "new_board_id_here"
    # ... rest unchanged
---
```

Preserve all other content in file.

## Tips

- Use interactive mode when unsure of board names
- Use direct selection for quick switching in workflows
- Board selection persists across Claude Code sessions
- Check current board with `/trellio:board-snapshot`
