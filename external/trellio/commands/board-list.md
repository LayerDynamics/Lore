---
name: board-list
description: Display all accessible Trello boards with metadata
allowed-tools: [Read, ToolSearch]
---

# Board List Command

Display all Trello boards accessible to the current user with key metadata and highlight current board context.

## Usage

```bash
/trellio:board-list
```

## Workflow

1. **Load settings**
   ```
   Read .claude/trellio.local.md
   Extract current_board_id
   ```

2. **Fetch boards from Trello**
   ```
   Use ToolSearch to load: trello_list_boards
   Call trello_list_boards
   Get all boards user has access to
   ```

3. **Enrich with metadata**
   ```
   For each board:
   - Get list count (from board object)
   - Get card count (from board object)
   - Get last activity timestamp
   - Check if in settings registry
   ```

4. **Format output**
   ```markdown
   ## Available Trello Boards

   | Board Name | ID | Lists | Cards | Last Activity | In Registry |
   |------------|-----|-------|-------|---------------|-------------|
   | **Personal Tasks** ⭐ | abc123 | 5 | 42 | 2 hours ago | ✅ |
   | Team Project | def456 | 5 | 28 | 1 day ago | ✅ |
   | Archive Board | ghi789 | 3 | 156 | 30 days ago | ❌ |

   ⭐ = Current board
   ✅ = Configured in settings
   ❌ = Not in registry (use /trellio:board-select to add)
   ```

5. **Provide context**
   ```
   Current board: [Name]
   Total accessible boards: [Count]
   Boards in registry: [Count]

   Tip: Use /trellio:board-select to switch boards
   ```

## Output Details

**Columns:**
- **Board Name**: Display name, bold if current
- **ID**: Board ID (for direct selection)
- **Lists**: Count of lists on board
- **Cards**: Total card count
- **Last Activity**: Relative time of last board activity
- **In Registry**: Whether board is configured in settings

**Highlighting:**
- Current board marked with ⭐
- Boards in settings registry: ✅
- Boards not in registry: ❌

## Use Cases

- Discover available boards before switching
- Verify board access
- Find board IDs for configuration
- Check board activity status
- Identify boards to add to registry

## Integration

Use with:
- `/trellio:board-select` - Switch to listed board
- `/trellio:board-create` - Create new board
- Board management workflows

## Tips

- Copy board ID from output for direct selection
- Check "Last Activity" to find active boards
- Add frequently-used boards to registry
- Archive inactive boards to reduce clutter
