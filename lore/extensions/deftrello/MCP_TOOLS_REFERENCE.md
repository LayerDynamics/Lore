# DefTrello MCP Tools Reference

Complete reference for all available DefTrello MCP tools.

## Board Management

### `mcp__deftrello__deftrello_get_board_snapshot`
Get complete board state with task counts, overdue counts, and inactive cards.

**Parameters:**
- `include_cards` (boolean, optional): Include full card details (default: true)

**Returns:**
- Task status for Today and Working on lists
- Card counts per list
- Overdue task count
- Inactive card count
- All cards with full details

**Example:**
```
Get board snapshot to see task status and all tasks
```

---

### `mcp__deftrello__trello_get_board`
Get board details including lists and labels.

**Parameters:**
- `board_id` (string, optional): Board ID (defaults to configured board)

**Returns:**
- Board name, description
- All lists with IDs
- All labels with IDs and colors

---

### `mcp__deftrello__trello_get_board_activity`
Get recent activity across the board.

**Parameters:**
- `board_id` (string, required): Board ID
- `limit` (number, optional): Number of activities to return (default 50)

**Returns:**
- Recent board actions (card moves, updates, comments, etc.)

---

## Task Management

### `mcp__deftrello__deftrello_quick_add_task`
Create a task with all metadata in one call.

**Parameters:**
- `title` (string, required): Task title
- `list` (enum, optional): "reference" | "this_week" | "today" | "doing" | "done"
- `priority` (enum, optional): "High" | "Medium" | "Low"
- `due_date` (string, optional): Due date in ISO format
- `time_estimate` (string, optional): Estimated time
- `task_type` (string, optional): Type of task
- `quick_win` (boolean, optional): Mark as quick task
- `assignee` (string, optional): Assignee name

**Example:**
```
Create task "Fix user login bug" in today list with high priority
```

---

### `mcp__deftrello__trello_create_card`
Create a new Trello card.

**Parameters:**
- `name` (string, required): Card title
- `list_id` (string, required): List ID where card should be created
- `desc` (string, optional): Card description
- `due` (string, optional): Due date in ISO 8601 format
- `label_ids` (array, optional): Label IDs to apply
- `member_ids` (array, optional): Member IDs to assign
- `position` (string|number, optional): "top" | "bottom" | position number

---

### `mcp__deftrello__trello_update_card`
Update an existing card.

**Parameters:**
- `card_id` (string, required): Card ID to update
- `name` (string, optional): New card title
- `desc` (string, optional): New description
- `due` (string, optional): New due date in ISO 8601 format
- `due_complete` (boolean, optional): Mark due date as complete
- `list_id` (string, optional): Move to new list
- `position` (string|number, optional): New position

---

### `mcp__deftrello__deftrello_move_card_through_pipeline`
Move a card to a pipeline stage.

**Parameters:**
- `card_id` (string, required): Card ID to move
- `target_list` (enum, required): "reference" | "this_week" | "today" | "doing" | "done"

**Returns:**
- Success/failure

---

### `mcp__deftrello__deftrello_batch_update_cards`
Update multiple cards at once.

**Parameters:**
- `updates` (array, required): Array of {card_id, changes} objects

**Example:**
```
Batch update to move multiple cards to done
```

---

## Card Information

### `mcp__deftrello__trello_get_card`
Get details of a specific card.

**Parameters:**
- `card_id` (string, required): Card ID to fetch

**Returns:**
- Card title, description, due date
- Labels, members, checklists
- Position, list ID
- Dates (created, last activity)

---

### `mcp__deftrello__trello_list_cards`
Get all cards from a specific list.

**Parameters:**
- `list_id` (string, required): List ID to fetch cards from

**Returns:**
- Array of cards with full details

---

## Task Coach

### `mcp__deftrello__coach_assess_crash_state`
Analyze inactivity patterns and provide recovery guidance.

### `mcp__deftrello__coach_get_smallest_next_action`
Break down large tasks into tiny, manageable actions.

### `mcp__deftrello__coach_generate_accountability_message`
Create team progress update messages from board activity.

### `mcp__deftrello__coach_weekly_completion_stats`
Analytics on completed tasks, priority patterns, and completion trends.

---

## Board Cleanup

### `mcp__deftrello__deftrello_clean_up_board`
Automatically archives completed cards, reorders by priority, removes inactive tasks.

### `mcp__deftrello__deftrello_delegate_task`
Prepare task for delegation with full context and handoff notes.

---

## Search & Filter

### `mcp__deftrello__trello_search_cards`
Search across all cards with keyword and filter support.

### `mcp__deftrello__deftrello_get_energy_matched_tasks`
Get tasks matched to current priority level (High, Medium, Low, Simple Tasks).

---

## Labels & Custom Fields

### `mcp__deftrello__trello_manage_labels`
Add/remove labels on cards. Priority labels: High Priority, Medium Priority, Low Priority, Simple Tasks, Due Soon.

### `mcp__deftrello__trello_set_custom_field`
Set custom fields: Time Estimate, Task Type, Priority, Quick Win.

---

## Checklists

### `mcp__deftrello__trello_manage_checklist`
Create, update, and manage checklists on cards.

---

## Comments & Collaboration

### `mcp__deftrello__trello_add_comment`
Add comments to cards.

### `mcp__deftrello__trello_assign_member`
Assign/remove members on cards.

---

## Card Lifecycle

### `mcp__deftrello__trello_archive_card`
Archive a card (recommended over delete for history).

### `mcp__deftrello__trello_delete_card`
Permanently delete a card.

---

## n8n Workflow Integration

### `mcp__deftrello__n8n_list_workflows`
View all available n8n automation workflows.

### `mcp__deftrello__n8n_get_workflow_status`
Check if a workflow is active or inactive.

### `mcp__deftrello__n8n_activate_workflow` / `n8n_deactivate_workflow`
Control n8n workflow execution.

### `mcp__deftrello__n8n_trigger_workflow`
Execute a workflow on demand.

### `mcp__deftrello__n8n_get_execution_log`
View workflow execution history.

### `mcp__deftrello__n8n_get_health`
Verify n8n server connectivity.

---

## Codebase Integration

### `mcp__deftrello__codebase_read_file` / `codebase_write_file`
Read/write files in the DefTrello project directory.

### `mcp__deftrello__codebase_list_files`
Browse the DefTrello codebase.

### `mcp__deftrello__codebase_search`
Search through DefTrello source code.

### `mcp__deftrello__codebase_run_script`
Execute scripts in the DefTrello project.

### `mcp__deftrello__codebase_get_env_config`
View DefTrello environment configuration.

---

## Git Operations

### `mcp__deftrello__git_status` / `git_diff` / `git_log` / `git_commit` / `git_branch`
Standard git operations within the DefTrello project.

---

## Common List IDs

Get these from your board using `mcp__deftrello__trello_get_board`:

- Reference list
- Upcoming list
- Today list
- Working on list
- Completed list

---

## Workflow Examples

### Morning Planning
1. Get board snapshot to see task status
2. Review Upcoming tasks
3. Move prioritized tasks to Today

### Adding a Task
1. Quick add task with title, list, priority
2. Set due date if needed
3. Add to Today or Upcoming based on urgency

### Completing Work
1. Move card from Working on to Completed
2. Pull next prioritized task from Today to Working on

### Board Cleanup
1. Get board snapshot
2. Check for inactive cards
3. Archive completed tasks
4. Review overdue tasks
