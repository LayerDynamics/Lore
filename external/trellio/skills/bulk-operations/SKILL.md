---
name: bulk-operations
description: This skill should be used when the user asks to "bulk import", "batch update", "import from CSV", "mass card operations", "bulk archive", or needs to perform operations on multiple cards simultaneously
version: 1.0.0
---

# Bulk Operations for Trellio

Comprehensive guide for performing batch operations on Trello cards including CSV/JSON imports, mass updates, bulk archiving, and batch card creation.

## When to Use This Skill

Use this skill when:
- Importing tasks from CSV or JSON files
- Updating multiple cards with same criteria
- Archiving or deleting many cards at once
- Moving batches of cards between lists
- Applying labels or custom fields to card groups
- Migrating tasks from other systems

## CSV Import Format

### Standard Import Template

CSV structure for task imports:

```csv
title,description,list,labels,priority,time_estimate,task_type,due_date,assignee
"Fix login bug","Update authentication flow","Today","Due Soon",High,2h,"Bug Fix",2026-02-20,@john
"Design homepage","Create mockups for new landing","This Week","",Medium,4h,"Design",,
"Write docs","API documentation updates","Reference","",Low,1h,"Documentation",,
```

### Required Fields

- `title` - Card title (required)
- `list` - Target list name: Reference, This Week, Today, Doing, Done

### Optional Fields

- `description` - Card description (supports Markdown)
- `labels` - Comma-separated label names
- `priority` - High, Medium, Low
- `time_estimate` - Hours (2h, 30m, etc.)
- `task_type` - Custom task type
- `due_date` - ISO format: YYYY-MM-DD
- `assignee` - @username format

### CSV Validation

Before import, validate:
1. File is valid CSV format
2. Required fields present
3. List names match board structure
4. Label names exist on board
5. Date formats correct
6. Assignees are board members

## JSON Import Format

### Batch Operations JSON

For complex batch updates:

```json
{
  "operations": [
    {
      "action": "create",
      "list": "Today",
      "cards": [
        {
          "title": "Task 1",
          "description": "Details",
          "labels": ["Due Soon"],
          "priority": "High"
        }
      ]
    },
    {
      "action": "update",
      "filter": {
        "list": "This Week",
        "labels": ["Overdue"]
      },
      "updates": {
        "list": "Today",
        "add_labels": ["Due Soon"]
      }
    }
  ]
}
```

### Supported Actions

- `create` - Create new cards
- `update` - Update existing cards
- `move` - Move cards between lists
- `archive` - Archive cards
- `delete` - Delete cards
- `label` - Add/remove labels

## Import Workflow

### Step 1: File Validation

```bash
# Use validation script
scripts/validate-import.py tasks.csv

# Checks:
# - File format correctness
# - Required fields present
# - Valid list/label names
# - Date format validation
# - Duplicate detection
```

### Step 2: Preview Import

Before executing import:
1. Parse import file
2. Display summary:
   - Total cards to create/update
   - Cards per list
   - Label distribution
   - Estimated import time
3. Show first 5 rows as sample
4. Confirm with user via AskUserQuestion

### Step 3: Execute Import

Execute with rate limiting:
```python
# Rate limit: 100ms delay between API calls
# Batch size: 10 cards at a time
# Error handling: Continue on failure, log errors
# Progress tracking: Display every 10 cards
```

### Step 4: Report Results

After import completion:
- Total cards created/updated
- Success count
- Failure count with reasons
- Card IDs for successful imports
- Error log location

## Batch Update Operations

### Filter-Based Updates

Update cards matching criteria:

```
Filter: list="This Week" AND labels contains "Overdue"
Update: move to list="Today", add label="Due Soon"
```

### Update Operations

Support these batch updates:
- Move to different list
- Add/remove labels
- Set custom field values
- Update due dates
- Assign/unassign members
- Archive/unarchive
- Change position/priority

### Workload Awareness

When batch moving cards:
1. Check target list capacity
2. Calculate if batch is manageable
3. Warn user if exceeding capacity
4. Offer to split batch across lists

## Bulk Archive

### Archive Completed Work

Archive cards in Done list:
```
Criteria:
- List: Done
- Completed: > 7 days ago
- No recent activity

Action: Archive cards
Result: X cards archived
```

### Archive Stale Tasks

Remove stale cards:
```
Criteria:
- Any list except Done
- No activity: > 30 days
- No due date set

Action: Mark as stale, optionally archive
Confirm: User reviews before archiving
```

## CSV Export

### Export Current Board State

Export all cards to CSV:
```csv
id,title,list,labels,assignees,due_date,created,last_activity
abc123,"Fix bug","Today","Due Soon,High","@john",2026-02-20,2026-02-15,2026-02-16
```

Use cases:
- Backup board state
- Analyze in spreadsheet
- Migrate to other systems
- Generate reports

## Rate Limiting & Performance

### Trello API Limits

Respect rate limits:
- 100 requests per 10 seconds
- 300 requests per minute
- Use 100ms delay between calls
- Implement exponential backoff on errors

### Batch Processing Strategy

For large imports (>100 cards):
1. Process in batches of 10
2. Show progress indicator
3. Allow pause/resume
4. Save partial progress
5. Generate completion report

## Error Handling

### Common Import Errors

Handle gracefully:
- Invalid list name → suggest closest match
- Missing required field → skip row, log error
- Duplicate card → offer to update instead
- Invalid date format → parse flexibly or skip
- Board member not found → skip assignment

### Error Recovery

On import failure:
1. Log failed rows to error file
2. Continue with remaining rows
3. Report failures at end
4. Offer to retry failed rows
5. Export failed rows to CSV for review

## Script Integration

### CSV to Trello Script

Use provided utility:
```bash
scripts/csv-to-trello.py \
  --file tasks.csv \
  --board-id abc123 \
  --dry-run  # Preview without importing

# Validates, previews, then imports with confirmation
```

### Validation Script

Pre-validate imports:
```bash
scripts/validate-import.py tasks.csv

# Outputs:
# ✓ Format valid
# ✓ Required fields present
# ⚠ 3 unknown labels (will be created)
# ✗ 2 invalid dates (will be skipped)
```

## Additional Resources

### Reference Files

- **`references/bulk-api-patterns.md`** - Advanced batch operation patterns
- **`references/csv-specification.md`** - Complete CSV format spec

### Example Files

- **`examples/tasks-import-template.csv`** - CSV import template
- **`examples/batch-update-example.json`** - JSON batch operations

### Utility Scripts

- **`scripts/csv-to-trello.py`** - CSV import utility
- **`scripts/validate-import.py`** - Import file validator
- **`scripts/export-board-csv.py`** - Export board to CSV

## Best Practices

1. **Always validate first** - Run validation before import
2. **Use dry-run mode** - Preview changes before applying
3. **Start small** - Test with 5-10 cards first
4. **Respect rate limits** - Don't overwhelm API
5. **Handle errors gracefully** - Log and continue
6. **Backup before bulk delete** - Export before destructive operations
7. **Monitor WIP limits** - Check limits during batch moves
8. **Document custom fields** - Keep field mappings clear

## Integration with Commands

This skill works with:
- `/trellio:bulk-import` - Import from CSV/JSON
- `/trellio:cleanup` - Bulk archive operations
- Commands can reference this skill for batch processing logic

## Troubleshooting

**Import fails with "Invalid format":**
- Check CSV encoding (UTF-8)
- Verify no extra commas in fields
- Escape special characters
- Use quotes around text fields

**Some cards skip during import:**
- Check error log for reasons
- Validate required fields present
- Verify list/label names correct
- Check date formats

**Import takes too long:**
- Reduce batch size
- Check network connectivity
- Split into multiple imports
- Use async import option
