# Board Management with DefTrello

DefTrello now supports managing multiple Trello boards, not just a single hardcoded board!

## New Capabilities

### 1. List All Your Boards

See all boards you have access to:

```
"List my Trello boards"
"Show me all my boards"
"What boards do I have?"
```

Uses: `trello_list_boards`

Returns:
```json
[
  {
    "id": "6990b65be83d956ca32f0d1d",
    "name": "Productivity Board",
    "desc": "ADHD task management",
    "url": "https://trello.com/b/xyz/productivity-board",
    "closed": false
  },
  {
    "id": "abc123def456",
    "name": "Defcad 3.0 Development",
    "desc": "Development stages",
    "url": "https://trello.com/b/abc/defcad-dev",
    "closed": false
  }
]
```

### 2. Create New Boards

Create a new board programmatically:

```
"Create a new Trello board called 'Project Alpha'"
"Make a new board for 'Q1 2026 Planning'"
```

Uses: `trello_create_board`

Options:
- **name** (required): Board name
- **desc** (optional): Board description
- **default_lists** (optional): Create To Do, Doing, Done lists (default: true)
- **default_labels** (optional): Create default color labels (default: true)
- **permission_level** (optional): 'private', 'org', or 'public' (default: private)

Example:
```json
{
  "name": "Defcad 3.0 Development Stages",
  "desc": "Product development pipeline for Defcad 3.0",
  "default_lists": false,
  "default_labels": true,
  "permission_level": "private"
}
```

Returns the new board with its ID and URL.

### 3. Get Board Details

Get full details about any board:

```
"Get details for board abc123def456"
"Show me information about the Defcad board"
```

Uses: `trello_get_board`

Optional parameter:
- **board_id**: Specific board ID (if omitted, uses configured board)

Returns complete board info including lists and labels.

### 4. Update Boards

Rename, update description, or archive boards:

```
"Rename board abc123 to 'New Name'"
"Archive board abc123"
"Update the description of board abc123"
```

Uses: `trello_update_board`

Parameters:
- **board_id** (required): Board to update
- **name** (optional): New board name
- **desc** (optional): New description
- **closed** (optional): true to archive, false to unarchive

### 5. Work with Multiple Boards

Most DefTrello commands now accept an optional `board_id` parameter:

```
"List cards in Today on board abc123"
"Create a card on board abc123"
"Get board snapshot for board abc123"
```

If you don't specify a board_id, it uses your configured default board.

## Configuration

### Default Board

Your default board is set in environment variables:

```bash
export TRELLO_BOARD_ID="6990b65be83d956ca32f0d1d"
```

This is used when no board_id is specified.

### Multiple Board Workflow

To work with multiple boards:

1. **List your boards** to find IDs:
   ```
   "List my Trello boards"
   ```

2. **Copy the board ID** you want to work with

3. **Use it in commands**:
   ```
   "Create a card on board abc123 called 'New Feature'"
   "List cards in Doing on board abc123"
   ```

## Common Use Cases

### Scenario 1: Backfill a New Project

```bash
# Create board for new project
"Create a board called 'Defcad 3.0 Development Stages'"

# Board created with ID: abc123def456

# Analyze code and backfill to that board
"Run /deftrello-backfill on defcad and create cards on board abc123def456"
```

### Scenario 2: Separate Personal and Work Boards

```bash
# List all boards
"List my Trello boards"

# Work with personal board
"Get board snapshot"  # Uses default board

# Work with work board
"List cards in Today on board <work-board-id>"
```

### Scenario 3: Multiple Project Boards

```bash
# Create boards for different projects
"Create a board called 'Project Alpha'"
"Create a board called 'Project Beta'"
"Create a board called 'Project Gamma'"

# List to get IDs
"List my Trello boards"

# Backfill each project
"Run /deftrello-extract-todos on /path/to/alpha and create on board <alpha-id>"
"Run /deftrello-extract-todos on /path/to/beta and create on board <beta-id>"
```

### Scenario 4: Clone Board Structure

```bash
# Get details of existing board
"Get board details for board 6990b65be83d956ca32f0d1d"

# Create new board with same structure
"Create a board called 'New Project' with no default lists"

# Copy lists, labels, and cards as needed
# (use card creation and list management tools)
```

## Advanced: Switching Default Board

To change which board is your "default":

### Option 1: Update Environment Variable

```bash
# Edit ~/.zshrc or ~/.bashrc
export TRELLO_BOARD_ID="new-board-id-here"

# Reload
source ~/.zshrc

# Restart Claude Code
```

### Option 2: Use board_id Parameter

Always specify the board you want:

```bash
# Instead of relying on default
"List cards on board abc123"

# Be explicit
"Get board snapshot for board abc123"
```

## Tool Reference

### Board Management Tools

| Tool | Purpose | Required Params |
|------|---------|-----------------|
| `trello_list_boards` | List all accessible boards | None |
| `trello_get_board` | Get board details | `board_id` (optional) |
| `trello_create_board` | Create a new board | `name` |
| `trello_update_board` | Update board properties | `board_id` |

### Card/List Tools (Now Support board_id)

Most existing tools now accept optional `board_id`:
- `trello_list_cards` - Add `board_id` parameter
- `trello_create_card` - Add `board_id` parameter
- `deftrello_get_board_snapshot` - Add `board_id` parameter
- And more...

(Note: Implementation of board_id parameter for all tools coming in next update)

## Example Commands

### Basic Board Management

```bash
# List all boards
→ "List my Trello boards"

# Create a new board
→ "Create a board called 'Q1 Planning'"

# Get board details
→ "Show details for board abc123"

# Archive a board
→ "Archive board abc123"
```

### Working Across Boards

```bash
# Work with default board
→ "Get board snapshot"
→ "List cards in Today"

# Work with specific board
→ "Get board snapshot for board abc123"
→ "List cards in Today on board abc123"

# Create cards on different boards
→ "Create a card 'Feature X' on board abc123"
→ "Create a card 'Bug Y' on board def456"
```

### Bulk Operations

```bash
# Backfill different projects to different boards
→ "/deftrello-backfill on ~/project-alpha for board abc123"
→ "/deftrello-backfill on ~/project-beta for board def456"

# Extract TODOs to specific boards
→ "/deftrello-extract-todos from ~/defcad for board abc123"
→ "/deftrello-extract-todos from ~/deftrello for board def456"
```

## Migration Guide

### Before (Single Board)

```bash
# Only worked with configured board
"Get board snapshot"
"List cards in Today"
"Create a card"
```

### After (Multiple Boards)

```bash
# Still works with default board
"Get board snapshot"

# Now also works with any board
"Get board snapshot for board abc123"
"List cards in Today on board def456"
"Create a card on board xyz789"
```

**Your existing commands still work!** The board_id parameter is optional.

## Troubleshooting

### Board Not Found

```
Error: Board not found
```

**Fix:** Check board ID is correct using `trello_list_boards`

### Permission Denied

```
Error: Permission denied
```

**Fix:** Ensure your Trello token has access to the board

### Invalid Board ID

```
Error: Invalid board ID format
```

**Fix:** Board IDs are 24-character hex strings (e.g., `6990b65be83d956ca32f0d1d`)

## Next Steps

1. **List your boards** to see what's available
2. **Create test boards** for different projects
3. **Update commands** to specify board_id when needed
4. **Organize workflows** across multiple boards

Your DefTrello setup now scales to manage any number of boards! 🎉
