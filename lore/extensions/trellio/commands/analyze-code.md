---
name: trellio-analyze-code
description: Analyze a codebase to generate and backfill tasks into Trello
allowed-tools:
  - Glob
  - Grep
  - Read
  - mcp__plugin_trellio_trellio__trello_create_card
  - mcp__plugin_trellio_trellio__trellio_batch_update_cards
  - AskUserQuestion
---

# Analyze Code and Backfill Tasks

Analyze a codebase to identify work items and automatically create Trello cards.

## Step 1: Get Target Directory

Use AskUserQuestion to ask:
- Question: "Which codebase should I analyze?"
- Options:
  - Current project directory
  - Trellio project directory
  - Custom path (let me specify)

## Step 2: Analyze Code Structure

Use Glob to discover:
- All source files (*.py, *.ts, *.js, *.go, etc.)
- Documentation files (*.md, docs/)
- Test files (test_*, *_test.*, tests/)
- Configuration files

Show summary:
```
📊 Codebase Overview

📁 Project: [name]
📂 Total Files: [X]
  - Source: [Y] files
  - Tests: [Z] files
  - Docs: [A] files

Languages: [Python, TypeScript, etc.]
```

## Step 3: Extract TODOs and FIXMEs

Use Grep to search for:
- `TODO:` comments
- `FIXME:` comments
- `HACK:` comments
- `XXX:` comments
- `BUG:` comments
- `OPTIMIZE:` comments

For each finding, show:
```
🔍 Found [X] action items in code

TODO Items ([Y]):
1. [file:line] - [description]
2. [file:line] - [description]

FIXME Items ([Z]):
1. [file:line] - [description]
2. [file:line] - [description]

OPTIMIZE Items ([A]):
1. [file:line] - [description]
```

## Step 4: Identify Missing Tests

Use Glob to compare:
- Source files vs test files
- Coverage gaps

Report:
```
🧪 Test Coverage Analysis

Files without tests ([X]):
1. [source_file.py] → needs test_source_file.py
2. [module.ts] → needs module.test.ts

Suggested test tasks:
- Add unit tests for [file1]
- Add integration tests for [file2]
- Add edge case tests for [file3]
```

## Step 5: Documentation Gaps

Use Glob to find:
- Functions without docstrings
- Classes without documentation
- API endpoints without docs
- README sections that need expansion

Report:
```
📚 Documentation Gaps

Missing docstrings ([X] functions):
1. [file:function] - [signature]
2. [file:function] - [signature]

Undocumented APIs ([Y] endpoints):
1. [endpoint] - [method]
2. [endpoint] - [method]

README improvements:
- Add installation instructions
- Document API usage
- Add troubleshooting section
```

## Step 6: Technical Debt Analysis

Analyze for:
- Large files (>500 lines)
- Complex functions (>50 lines)
- Duplicate code patterns
- Deprecated dependencies
- Security vulnerabilities (hardcoded secrets, etc.)

Report:
```
⚠️ Technical Debt

Large files ([X]):
1. [file] - [Y] lines (consider splitting)
2. [file] - [Z] lines (refactor candidate)

Complex functions ([A]):
1. [file:function] - [B] lines (break down)
2. [file:function] - [C] lines (simplify)

Code duplication ([D] instances):
1. Pattern in [file1, file2, file3]
2. Similar logic in [file4, file5]
```

## Step 7: Categorize and Prioritize

Organize findings by:

**High Priority (Do This Week):**
- FIXME and BUG items
- Security issues
- Blocking technical debt

**Medium Priority (This Month):**
- TODO items
- Missing tests for critical paths
- Major documentation gaps

**Low Priority (Backlog):**
- OPTIMIZE items
- Nice-to-have tests
- Code cleanup and refactoring

Show summary:
```
🎯 Task Breakdown

HIGH PRIORITY ([X] tasks):
- [count] critical bugs
- [count] security issues
- [count] blocking issues

MEDIUM PRIORITY ([Y] tasks):
- [count] TODOs
- [count] missing tests
- [count] doc gaps

LOW PRIORITY ([Z] tasks):
- [count] optimizations
- [count] refactorings
- [count] cleanup items

TOTAL: [X+Y+Z] tasks identified
```

## Step 8: Confirm Backfill

Use AskUserQuestion:
- Question: "Ready to create Trello cards for these tasks?"
- Options:
  - Create all tasks ([total] cards)
  - Create high priority only ([X] cards)
  - Create high + medium priority ([X+Y] cards)
  - Let me review and select specific tasks
  - Cancel - don't create any cards

## Step 9: Create Trello Cards

For each selected task, use `trello_create_card` with:

**Card structure:**
- **Name**: `[CODE] [Brief description]`
- **Description**:
  ```
  Source: [file:line]
  Type: [TODO/FIXME/Test/Doc/Refactor]

  Context:
  [relevant code snippet or context]

  Action needed:
  [what needs to be done]

  Priority: [High/Medium/Low]
  Estimated time: [auto-estimated based on type]
  ```
- **List**: Reference (for review and prioritization)
- **Labels**:
  - Priority label (based on complexity)
  - Due Soon (if high priority)
- **Due date**: Set for high priority items

Show progress:
```
📝 Creating Trello Cards...

✅ Created: [1/X] - Fix authentication bug (file:line)
✅ Created: [2/X] - Add tests for user module
✅ Created: [3/X] - Document API endpoints
...
✅ Created: [X/X] - Optimize database queries

🎉 Backfill complete!
- [X] cards created
- [Y] in Reference list
- [Z] marked high priority
```

## Step 10: Post-Backfill Actions

Offer next steps:
```
🎯 Next Steps

1. Review cards in Reference list
2. Move high priority items to This Week
3. Estimate time for each task
4. Assign priority labels if needed
5. Start with smallest task

Quick actions:
- View all created cards
- Move high priority to This Week
- Get priority-matched tasks
- Run weekly planning
```

## Advanced Options

### Filter by File Type
Focus analysis on specific languages:
- Python files only
- TypeScript/JavaScript only
- Go files only
- Documentation only

### Filter by Priority
Only create cards for:
- Critical issues (FIXME, BUG)
- Missing tests
- Documentation gaps
- Specific TODO patterns

### Custom Patterns
Search for custom comment patterns:
- `@deprecated` → Refactor tasks
- `@future` → Feature ideas
- `@performance` → Optimization tasks
- Project-specific markers

## Example Output

```
📊 Codebase Analysis Complete

Project: [project name]
Path: [project path]

🔍 Analysis Results:
- 143 source files scanned
- 28 TODO items found
- 12 FIXME items found
- 15 files missing tests
- 8 documentation gaps
- 5 large files (>500 lines)
- 3 security concerns

🎯 Task Breakdown:
HIGH: 15 tasks (FIXME, security, blocking)
MEDIUM: 23 tasks (TODO, missing tests)
LOW: 15 tasks (optimization, cleanup)
TOTAL: 53 tasks

✅ Created 53 Trello cards in Reference list
- 15 marked high priority with due dates
- All cards tagged with priority levels
- Ready for review and prioritization

Next: Move high priority items to This Week?
```
