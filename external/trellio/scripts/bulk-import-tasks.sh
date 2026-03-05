#!/bin/bash
# Bulk import tasks to DefTrello from CSV

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CSV_FILE="${1:-$SCRIPT_DIR/../tasks-import.csv}"

if [ ! -f "$CSV_FILE" ]; then
    echo "❌ CSV file not found: $CSV_FILE"
    echo ""
    echo "Usage: $0 [csv-file]"
    echo ""
    echo "CSV format:"
    echo "title,list,energy,priority,time_estimate,task_type,due_date,quick_win"
    echo "\"Fix bug #123\",this_week,3,High,2h,Bug Fix,2026-02-20,true"
    exit 1
fi

echo "📋 Importing tasks from: $CSV_FILE"
echo ""

# Read CSV and create tasks (skipping header)
tail -n +2 "$CSV_FILE" | while IFS=, read -r title list energy priority time_estimate task_type due_date quick_win; do
    # Remove quotes
    title=$(echo "$title" | tr -d '"')
    list=$(echo "$list" | tr -d '"')
    priority=$(echo "$priority" | tr -d '"')
    time_estimate=$(echo "$time_estimate" | tr -d '"')
    task_type=$(echo "$task_type" | tr -d '"')
    due_date=$(echo "$due_date" | tr -d '"')
    quick_win=$(echo "$quick_win" | tr -d '"')

    echo "➕ Adding: $title"

    # Build prompt for Claude Code
    prompt="Add a task with these details:
- Title: $title
- List: $list
- Energy: $energy
- Priority: $priority
- Time estimate: $time_estimate
- Task type: $task_type"

    if [ -n "$due_date" ] && [ "$due_date" != "null" ]; then
        prompt="$prompt
- Due date: $due_date"
    fi

    if [ "$quick_win" = "true" ]; then
        prompt="$prompt
- Mark as quick win"
    fi

    # Call Claude Code to add the task
    echo "$prompt" | claude -p "Use deftrello_quick_add_task to create this task" 2>/dev/null || echo "  ⚠️  Failed to add: $title"

    sleep 0.5  # Rate limiting
done

echo ""
echo "✅ Import complete!"
