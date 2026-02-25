---
name: trellio-extract-todos
description: Extract TODO/FIXME comments from code and create Trello cards
allowed-tools:
  - Grep
  - Read
  - mcp__plugin_trellio_trellio__trello_create_card
  - mcp__plugin_trellio_trellio__trello_search_cards
  - AskUserQuestion
---

# Extract TODOs and Create Cards

Scan codebase for TODO/FIXME comments and automatically create Trello cards.

## Step 1: Select Target

Use AskUserQuestion:
- Question: "Which codebase should I scan for TODOs?"
- Options:
  - Current project directory
  - Trellio project directory
  - Current directory
  - Custom path

## Step 2: Search for Action Comments

Use Grep to find all instances of:

**Critical markers:**
- `FIXME:` - Things that are broken
- `BUG:` - Known bugs
- `SECURITY:` - Security issues
- `HACK:` - Temporary workarounds

**Important markers:**
- `TODO:` - Work to be done
- `XXX:` - Important notes
- `NOTE:` - Significant comments

**Future work:**
- `OPTIMIZE:` - Performance improvements
- `REFACTOR:` - Code cleanup needed
- `CLEANUP:` - Technical debt

**Pattern:**
```bash
grep -rn "TODO:\|FIXME:\|BUG:\|HACK:\|XXX:\|OPTIMIZE:\|REFACTOR:\|SECURITY:" \
  --include="*.py" --include="*.ts" --include="*.js" --include="*.go" \
  --include="*.java" --include="*.rs" [directory]
```

## Step 3: Parse and Categorize

For each comment found, extract:
- **File path**: Where the comment is
- **Line number**: Exact location
- **Marker type**: TODO/FIXME/BUG/etc.
- **Description**: The comment text
- **Context**: Surrounding code (3 lines before/after)
- **Author** (if available via git blame)

Categorize by:
```
🚨 CRITICAL ([X] items)
FIXME, BUG, SECURITY, HACK

⚠️ IMPORTANT ([Y] items)
TODO, XXX, NOTE

📋 FUTURE WORK ([Z] items)
OPTIMIZE, REFACTOR, CLEANUP
```

## Step 4: Check for Duplicates

Use `trello_search_cards` to check if cards already exist for:
- Same file and line number
- Same description
- Recent imports (prevent re-creating)

Show:
```
🔍 Duplicate Check

Found: [X] action items
Existing cards: [Y] matches
New items: [X-Y] tasks to create

Skipping duplicates:
- [file:line] - already tracked in card "[name]"
```

## Step 5: Show Preview

Display all TODO items with context:

```
📝 TODO Items Found

🚨 CRITICAL (High Priority)

1. FIXME: Authentication token not validated
   File: auth.py:145
   Context:
   ```python
   142: def verify_token(token):
   143:     # FIXME: Authentication token not validated properly
   144:     # This allows any token through - security issue!
   145:     return True
   ```
   Priority: HIGH
   Complexity: Medium (security fix)
   Time: 2-3 hours

2. BUG: Race condition in async handler
   File: handlers.go:89
   Context:
   ```go
   86: func processRequest(req *Request) {
   87:     // BUG: Race condition when multiple requests arrive
   88:     // Need mutex or channel synchronization
   89:     counter++
   ```
   Priority: HIGH
   Complexity: High (complex concurrency)
   Time: 4-6 hours

⚠️ IMPORTANT (Medium Priority)

3. TODO: Add input validation
   File: api.ts:234
   Context:
   ```typescript
   231: export async function createUser(data: any) {
   232:     // TODO: Add input validation before creating user
   233:     // Should check email format, password strength
   234:     return db.users.create(data);
   ```
   Priority: MEDIUM
   Complexity: Low (straightforward validation)
   Time: 1-2 hours

[... more items ...]
```

## Step 6: Estimate and Assign

For each item, automatically:

**Estimate time** based on:
- FIXME/BUG: 2-6 hours (depends on complexity)
- TODO: 1-3 hours (straightforward work)
- OPTIMIZE: 3-8 hours (requires analysis)
- REFACTOR: 4-12 hours (can be extensive)

**Assign priority level** based on:
- Security/concurrency issues → High priority
- API/validation work → Medium priority
- Documentation/cleanup → Low priority
- Simple fixes → Simple tasks

**Set priority**:
- FIXME/BUG/SECURITY → High (due this week)
- TODO → Medium (due this month)
- OPTIMIZE/REFACTOR → Low (backlog)

## Step 7: Confirm Creation

Use AskUserQuestion:
- Question: "Create Trello cards for these items?"
- Options:
  - Create all ([X] cards)
  - Create critical only ([Y] cards)
  - Create critical + important ([Z] cards)
  - Let me select specific items
  - Cancel

## Step 8: Create Cards

For each selected TODO, use `trello_create_card`:

**Card format:**
```
Title: [FIXME] Authentication token not validated

Description:
📁 File: auth.py:145
🔗 https://github.com/[repo]/blob/[branch]/auth.py#L145

Context:
```python
def verify_token(token):
    # FIXME: Authentication token not validated properly
    # This allows any token through - security issue!
    return True
```

Action needed:
- Add proper token validation
- Check token expiration
- Verify token signature
- Add tests for invalid tokens

Impact: Security vulnerability
Complexity: Medium
Estimated time: 2-3 hours

Type: Bug Fix
Priority: High
Complexity: Medium
Due: This week
```

**Card metadata:**
- List: Reference (for triage)
- Labels:
  - Priority level (based on analysis)
  - Due Soon (if high priority)
- Due date: Set for critical items
- Custom fields:
  - Time Estimate: [calculated]
  - Task Type: Bug Fix / Feature / Refactor / Documentation
  - Priority: High / Medium / Low

Show progress:
```
📝 Creating Trello Cards...

✅ [1/15] FIXME: auth.py:145 - Authentication bug
✅ [2/15] BUG: handlers.go:89 - Race condition
✅ [3/15] TODO: api.ts:234 - Input validation
...
✅ [15/15] OPTIMIZE: queries.py:567 - Database performance

🎉 Complete! Created 15 cards in Reference list
```

## Step 9: Summary Report

Show final summary:

```
📊 TODO Extraction Complete

Scanned: [project path]
Files analyzed: 143 files
Action items found: 28 items

✅ Created Cards: 28
- 8 critical (FIXME, BUG, SECURITY)
- 12 important (TODO)
- 8 future work (OPTIMIZE, REFACTOR)

📋 Trello Updates:
- All cards in Reference list
- 8 marked high priority
- Due dates set for critical items
- Priority labels assigned
- Time estimates added

🔗 Git Integration:
- Each card links to source file
- Line numbers tracked
- Context preserved

Next steps:
1. Review cards in Reference list
2. Move high priority to This Week
3. Assign to team members
4. Create git branches for fixes
```

## Step 10: Offer Actions

Ask what they want to do next:
- View all created cards
- Move critical items to This Week
- Get details on specific TODO
- Run another scan on different directory
- Update existing TODO cards
- Mark TODOs as resolved (after fixing)

## Advanced Features

### Track TODO Resolution

After creating cards, offer to:
- Monitor for TODO removal from code
- Auto-archive card when TODO is deleted
- Update card when TODO is modified
- Link to git commits that resolve TODOs

### Git Integration

For each TODO:
- Run `git blame` to find author
- Add author as card member
- Link to GitHub/GitLab line
- Track in which branch TODO exists

### Pattern Customization

Allow custom TODO patterns:
- `@deprecated` → Refactoring needed
- `@future` → Feature requests
- `@team` → Team discussion needed
- Project-specific markers

### Batch Operations

After import:
- Bulk assign priority labels
- Bulk set due dates
- Bulk move to lists
- Bulk add to sprints

## Example Session

```
$ Run /trellio-extract-todos

? Which codebase should I scan?
  → Current project directory

🔍 Scanning for TODO comments...

Found 28 action items:
- 5 FIXME
- 3 BUG
- 15 TODO
- 3 OPTIMIZE
- 2 REFACTOR

🚨 Critical Issues:
1. FIXME: auth.py:145 - Authentication not validated
2. BUG: handlers.go:89 - Race condition
3. FIXME: api.ts:123 - SQL injection vulnerability
[... more ...]

? Create Trello cards for these items?
  → Create critical + important (20 cards)

📝 Creating cards...
✅ Created 20 cards in Reference list

🎉 Done! Next steps:
- Review Reference list
- Move 5 critical items to This Week?
```
