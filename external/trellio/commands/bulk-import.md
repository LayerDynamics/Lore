---
name: bulk-import
description: Import tasks from CSV or JSON files with validation and preview
argument-hint: "<file.csv|file.json>"
allowed-tools: [Read, ToolSearch, Bash, AskUserQuestion]
---

# Bulk Import Command

Import multiple tasks from CSV or JSON files into Trello with validation, preview, and error handling. Ideal for sprint planning, project kickoffs, and migrating from other systems.

## Usage

```bash
# Import from CSV
/trellio:bulk-import tasks.csv

# Import from JSON
/trellio:bulk-import project-tasks.json

# With custom board
/trellio:bulk-import tasks.csv --board "Team Project"
```

## Workflow

### Step 1: Validate Import File

```
Read file with Read tool

Check:
- File exists and readable
- Valid CSV/JSON format
- Required fields present
- Field types correct
- No malformed entries

If errors found:
  Display validation errors
  Suggest fixes
  Exit before import

Use: scripts/validate-import.py
```

### Step 2: Preview Import

```
Parse file and display preview:

## Import Preview

**File:** tasks.csv
**Format:** CSV
**Records:** 45 tasks

**Distribution:**
- This Week: 30 cards
- Today: 10 cards
- Reference: 5 cards

**Assignees:**
- Alice: 15 cards
- Bob: 20 cards
- Unassigned: 10 cards

**Labels:**
- High Priority: 8
- Due Soon: 5
- Bug Fix: 12

**First 5 tasks:**
1. "Implement user authentication" → This Week, @alice, High Priority
2. "Design landing page" → This Week, @bob
3. "Write API documentation" → Reference
4. "Fix login bug" → Today, @alice, Bug Fix, Due Soon
5. "Set up CI/CD pipeline" → This Week, @bob

**Estimated import time:** ~45 seconds (rate limited)
```

### Step 3: Confirm Import

```
Use AskUserQuestion:

"Ready to import 45 tasks?"

Options:
- "Yes, import all tasks" (Recommended)
- "Yes, but show me each batch"
- "No, let me review the file"
- "Import first 10 as test"

Handle user choice
```

### Step 4: Execute Import

```
Load bulk-operations skill for guidance

Import process:
- Batch size: 10 cards at a time
- Rate limit: 100ms delay between API calls
- Progress indicator every 10 cards
- Error handling: Continue on failure, log errors
- Rollback: Not supported (Trello API limitation)

Use ToolSearch: trello_create_card for each task

Progress display:
"Importing tasks... [20/45] (44% complete)"
```

### Step 5: Report Results

```
## Import Complete

**Success:** 42/45 tasks imported
**Failed:** 3 tasks (see error log)

**Created Cards:**
- This Week: 28 cards ✅
- Today: 9 cards ✅
- Reference: 5 cards ✅

**Failures:**
1. Row 23: Invalid list name "Todo" (use "Today")
2. Row 31: Assignee "@charlie" not found on board
3. Row 38: Invalid date format "2/30/2026"

**Error log:** /tmp/trellio-import-errors.csv

**Actions:**
- Fix errors in source file
- Re-run import with corrected file
- Or manually create 3 failed cards
```

## CSV Import Format

### Template

Use provided template:
```csv
title,description,list,labels,priority,time_estimate,task_type,due_date,assignee,checklist_items
"User Authentication","Implement JWT auth","This Week","Backend,High Priority",High,4h,"Feature",2026-03-01,@alice,"Setup JWT library;Create auth middleware;Add tests"
"Landing Page","Design new homepage","This Week","Frontend,Design",Medium,6h,"Design",2026-03-05,@bob,""
```

### Required Fields

- **title** - Card title (required)
- **list** - Target list: Reference, This Week, Today, Doing, Done (required)

### Optional Fields

- **description** - Card description (Markdown supported)
- **labels** - Comma-separated label names
- **priority** - High, Medium, Low
- **time_estimate** - Duration (e.g., "2h", "30m", "1d")
- **task_type** - Feature, Bug Fix, Design, Documentation, etc.
- **due_date** - ISO format: YYYY-MM-DD
- **assignee** - @username format
- **checklist_items** - Semicolon-separated checklist items

### CSV Validation Rules

```
Title:
- Required
- Max 500 characters
- No special formatting

List:
- Must match board list names exactly
- Case-sensitive
- Valid: Reference, This Week, Today, Doing, Done

Labels:
- Must exist on board or will be created
- Comma-separated
- Example: "Backend,High Priority,Sprint 5"

Due Date:
- Format: YYYY-MM-DD
- Must be future date (warning if past)

Assignee:
- Format: @username
- Must be board member
- Can be comma-separated for multiple
```

## JSON Import Format

### Structure

```json
{
  "metadata": {
    "board": "Team Project",
    "import_date": "2026-02-16",
    "source": "sprint-planning"
  },
  "tasks": [
    {
      "title": "Implement user authentication",
      "description": "JWT-based auth system",
      "list": "This Week",
      "labels": ["Backend", "High Priority"],
      "priority": "High",
      "time_estimate": "4h",
      "due_date": "2026-03-01",
      "assignee": "alice",
      "checklist": [
        "Setup JWT library",
        "Create auth middleware",
        "Add tests"
      ]
    },
    {
      "title": "Design landing page",
      "list": "This Week",
      "assignee": "bob"
    }
  ]
}
```

### JSON Advantages

- Structured data (easier validation)
- Supports nested checklists
- Can include metadata
- Better for complex imports

## Sprint Planning Import

### Creating Sprint Backlog

```csv
title,list,priority,assignee,time_estimate,sprint
"Task 1","This Week",High,@alice,4h,"Sprint 5"
"Task 2","This Week",Medium,@bob,2h,"Sprint 5"
"Task 3","This Week",Low,@alice,3h,"Sprint 5"
...
```

Import creates full sprint in one operation.

### Epic/Story Import

```json
{
  "tasks": [
    {
      "title": "[EPIC] User Management",
      "list": "Reference",
      "labels": ["Epic"],
      "checklist": [
        "User registration",
        "User login",
        "Password reset",
        "Profile management"
      ]
    },
    {
      "title": "User registration",
      "list": "This Week",
      "labels": ["User Management", "Sprint 5"],
      "parent_epic": "[EPIC] User Management"
    }
  ]
}
```

Creates epic card with linked story cards.

## Error Handling

### Common Import Errors

**Invalid list name:**
```
Error: List "Todo" not found
Fix: Use "Today" instead
Action: Show list names for board
```

**Assignee not found:**
```
Error: User "@charlie" not a board member
Fix: Add user to board or remove assignee
Action: List board members
```

**Invalid date:**
```
Error: Date "2/30/2026" invalid
Fix: Use YYYY-MM-DD format
Action: Skip date or fix in source
```

**Label doesn't exist:**
```
Warning: Label "New Label" will be created
Action: Create label automatically
```

### Partial Import Recovery

If import fails mid-process:
```
Imported: 20/45 tasks
Failed at: Row 21

Options:
1. Resume from row 21 (recommended)
2. Retry all (may create duplicates)
3. Review error log and fix source

Saved progress to avoid duplicates
```

## Rate Limiting

Trello API limits:
- 100 requests per 10 seconds
- 300 requests per minute

Import strategy:
- Batch of 10 cards
- 100ms delay between cards
- 1 second delay between batches
- Exponential backoff on rate limit errors

Large imports (>100 cards):
```
Estimated time: ~2 minutes for 100 cards
Progress saved every 10 cards
Can pause/resume if needed
```

## Templates

### Project Kickoff Template

```csv
title,list,priority,assignee,task_type
"Project kickoff meeting","Done",High,@lead,"Meeting"
"Define requirements","This Week",High,@lead,"Planning"
"Setup repository","This Week",High,@dev1,"Setup"
"Design system architecture","This Week",Medium,@architect,"Design"
"Create project board","Done",High,@lead,"Setup"
```

### Sprint Template

Available at: `examples/sprint-template.csv`

### Migration Template

For migrating from other systems:
```csv
title,description,list,labels,old_id,old_system
"Task from Jira","Description","This Week","Migrated","PROJ-123","Jira"
```

Preserves old IDs for reference.

## Integration

Use with:
- `/trellio:board-select` - Target specific board
- `/trellio:cleanup` - Clean before bulk import
- `bulk-operations` skill - Detailed import patterns
- `board-management` skill - Multi-board imports

Scripts:
- `scripts/csv-to-trello.py` - CLI import utility
- `scripts/validate-import.py` - Pre-import validation
- `examples/tasks-import-template.csv` - Template file

## Best Practices

1. **Validate first** - Always check file before import
2. **Test with small batch** - Import 5-10 cards first
3. **Use templates** - Start with provided templates
4. **Backup board** - Export current state before bulk import
5. **Check assignees** - Verify all users are board members
6. **Review labels** - Use existing labels when possible
7. **Set realistic estimates** - Time estimates help planning
8. **Include checklists** - Break down complex tasks

## Tips

- Use CSV for simple imports
- Use JSON for complex hierarchies
- Run validation script before importing
- Keep source file for reference
- Import in batches for large datasets
- Test on non-production board first
