---
name: deftrello-audit-docs
description: Compare documentation to code and create tasks for gaps
allowed-tools:
  - Glob
  - Grep
  - Read
  - mcp__plugin_deftrello_deftrello__trello_create_card
  - AskUserQuestion
---

# Documentation Audit and Gap Analysis

Compare documentation to actual code implementation and create tasks for gaps.

## Step 1: Select Project

Use AskUserQuestion:
- Question: "Which project should I audit?"
- Options:
  - Current project directory
  - DefTrello project directory
  - Current directory
  - Custom path

## Step 2: Inventory Documentation

Use Glob to find all documentation:
- `README.md` files
- `docs/` directory contents
- `*.md` files in project root
- API documentation
- Code comments and docstrings
- JSDoc/PyDoc/GoDoc comments

Show inventory:
```
📚 Documentation Inventory

Found documentation:
- README.md (main project docs)
- docs/setup.md (installation)
- docs/api.md (API reference)
- docs/architecture.md (system design)
- 45 files with docstrings
- 23 API endpoints documented

Total: 73 documentation artifacts
```

## Step 3: Inventory Code Implementation

Use Glob to find all code:
- Source files by language
- API endpoints/routes
- Public functions/classes
- Exported modules
- Database models
- Configuration files

Show inventory:
```
💻 Code Implementation

Found code artifacts:
- 143 source files
- 67 public functions
- 23 classes
- 34 API endpoints
- 12 database models
- 15 configuration options

Total: 294 code artifacts
```

## Step 4: Cross-Reference Analysis

Compare documentation to code:

### Missing Function Documentation
```bash
# Find functions without docstrings
grep -rn "^def \|^func \|^function \|^export function" [src] | \
  check against documented functions
```

### Undocumented API Endpoints
```bash
# Find API routes not in docs
grep -rn "@app.route\|app.get\|app.post\|router.get" [src] | \
  check against docs/api.md
```

### Documented but Not Implemented
Read docs and check if mentioned features exist in code.

### Outdated Documentation
Find docs that reference:
- Deprecated functions
- Removed endpoints
- Changed behavior
- Old configurations

## Step 5: Gap Report

Present comprehensive gap analysis:

```
🔍 Documentation Gap Analysis

━━━ CRITICAL GAPS (Impact: High) ━━━

1. Missing API Documentation
   - POST /api/users/create (users.py:145)
   - DELETE /api/users/{id} (users.py:234)
   - GET /api/analytics (analytics.py:89)

   Impact: Developers can't use these endpoints
   Action: Document in docs/api.md
   Priority: High
   Time: 2-3 hours

2. Undocumented Configuration
   - DATABASE_POOL_SIZE (config.py:23)
   - REDIS_TIMEOUT (config.py:45)
   - MAX_UPLOAD_SIZE (config.py:67)

   Impact: Deployment issues, unclear defaults
   Action: Add to docs/configuration.md
   Priority: High
   Time: 1-2 hours

━━━ IMPORTANT GAPS (Impact: Medium) ━━━

3. Functions Without Docstrings
   - calculate_analytics() (analytics.py:145) - complex logic
   - process_payment() (payments.py:234) - critical path
   - validate_user_input() (validators.py:89) - public API

   Impact: Code maintainability
   Action: Add docstrings with examples
   Priority: Medium
   Time: 3-4 hours

4. Missing Architecture Documentation
   - Authentication flow (mentioned but not documented)
   - Data pipeline (implemented but not explained)
   - Caching strategy (no documentation)

   Impact: Onboarding difficulty, system understanding
   Action: Create docs/architecture.md sections
   Priority: Medium
   Time: 4-6 hours

━━━ OUTDATED DOCUMENTATION (Impact: Medium) ━━━

5. Deprecated References
   - README.md mentions old_api.py (file deleted)
   - docs/setup.md references Python 3.7 (now requires 3.11)
   - docs/api.md documents /legacy endpoint (removed)

   Impact: Confusion, wasted time
   Action: Update and remove references
   Priority: Medium
   Time: 1-2 hours

━━━ MINOR GAPS (Impact: Low) ━━━

6. Missing Examples
   - API docs have endpoints but no examples
   - Configuration docs lack example values
   - No quickstart guide

   Impact: Slower adoption
   Action: Add practical examples
   Priority: Low
   Time: 2-3 hours

7. Incomplete Troubleshooting
   - Common errors not documented
   - No debugging guide
   - Missing FAQ section

   Impact: Support overhead
   Action: Create docs/troubleshooting.md
   Priority: Low
   Time: 2-3 hours
```

## Step 6: Prioritize Gaps

Categorize by impact:

**High Impact (Do This Week):**
- API endpoints used by external teams
- Configuration affecting production
- Critical path functions
- Security-related features

**Medium Impact (This Month):**
- Internal functions used by team
- Architecture understanding
- Onboarding materials
- Outdated documentation

**Low Impact (Backlog):**
- Nice-to-have examples
- Edge case documentation
- Troubleshooting guides
- FAQ expansions

Show summary:
```
🎯 Gap Priority Summary

HIGH PRIORITY: 8 gaps
- 3 missing API docs
- 5 undocumented configurations

MEDIUM PRIORITY: 15 gaps
- 12 missing docstrings
- 3 architecture sections

LOW PRIORITY: 10 gaps
- 5 missing examples
- 5 troubleshooting items

TOTAL: 33 documentation gaps
```

## Step 7: Confirm Task Creation

Use AskUserQuestion:
- Question: "Create Trello cards for documentation gaps?"
- Options:
  - Create all gaps ([33] cards)
  - Create high priority only ([8] cards)
  - Create high + medium priority ([23] cards)
  - Let me select specific gaps
  - Cancel

## Step 8: Create Documentation Cards

For each gap, use `trello_create_card`:

**Card format:**
```
Title: [DOCS] Document POST /api/users/create endpoint

Description:
📁 Code: users.py:145
📄 Doc location: docs/api.md

Gap type: Missing API documentation
Priority: High
Impact: External developers can't use this endpoint

What needs documenting:
- Endpoint URL and method
- Request body schema
- Response format
- Authentication requirements
- Error codes
- Rate limiting
- Example request/response

Current code:
```python
@app.route('/api/users/create', methods=['POST'])
def create_user():
    # Implementation exists but not documented
    ...
```

Acceptance criteria:
- [ ] Add to docs/api.md
- [ ] Include example request
- [ ] Include example response
- [ ] Document all parameters
- [ ] Add error cases
- [ ] Link from README

Estimated time: 2-3 hours
Priority: High
Type: Documentation
```

**Card metadata:**
- List: Reference (for review)
- Labels:
  - Low Priority (documentation work)
  - Due Soon (if high priority)
- Due date: Set for high priority
- Custom fields:
  - Time Estimate: [calculated]
  - Task Type: Documentation
  - Priority: High/Medium/Low

Show progress:
```
📝 Creating Documentation Task Cards...

✅ [1/23] Document POST /api/users/create
✅ [2/23] Document DATABASE_POOL_SIZE config
✅ [3/23] Add docstring to calculate_analytics()
...
✅ [23/23] Create troubleshooting guide

🎉 Complete! Created 23 documentation cards
```

## Step 9: Generate Documentation Templates

For each card, also create a starter template:

**API Documentation Template:**
```markdown
## POST /api/users/create

Create a new user account.

### Authentication
Requires: Bearer token with `users:write` scope

### Request

```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user"
}
```

### Response

**Success (201 Created):**
```json
{
  "id": "usr_123",
  "email": "user@example.com",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**Error (400 Bad Request):**
```json
{
  "error": "invalid_email",
  "message": "Email format is invalid"
}
```

### Rate Limiting
- 10 requests per minute per IP
- 100 requests per hour per user

### Example

```bash
curl -X POST https://api.example.com/users/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"John Doe"}'
```
```

Save template to: `/tmp/deftrello-doc-templates/api-users-create.md`

## Step 10: Summary and Next Steps

Show final report:

```
📊 Documentation Audit Complete

Project: [project name]
Documentation artifacts: 73
Code artifacts: 294

🔍 Gaps Identified: 33

HIGH PRIORITY: 8 gaps
- 3 missing API docs
- 5 undocumented configs

MEDIUM PRIORITY: 15 gaps
- 12 missing docstrings
- 3 architecture sections

LOW PRIORITY: 10 gaps
- 5 missing examples
- 5 troubleshooting items

✅ Created: 23 Trello cards
- All in Reference list
- 8 marked high priority
- Templates generated in /tmp

📝 Documentation Templates:
Generated starter templates for:
- 3 API endpoint docs
- 5 configuration docs
- 12 docstring examples
- 3 architecture sections

Templates saved to: /tmp/deftrello-doc-templates/

Next steps:
1. Review cards in Reference
2. Move high priority to This Week
3. Use templates to write docs
4. Assign to team members
```

## Step 11: Offer Actions

Ask what they want to do:
- View all documentation cards
- Move high priority to This Week
- Open template directory
- Run code analysis for more tasks
- Generate documentation automatically
- Schedule documentation review

## Advanced Features

### Auto-Generate Documentation

Offer to auto-generate:
- API documentation from code
- Docstrings from function signatures
- Configuration docs from defaults
- README sections from code structure

### Track Documentation Coverage

Show metrics:
```
📊 Documentation Coverage

APIs: 80% (28/35 endpoints documented)
Functions: 45% (30/67 have docstrings)
Config: 60% (9/15 options documented)

Trend: +15% since last audit
Goal: 90% coverage
```

### Link to Style Guide

Reference project documentation standards:
- Google style guide
- JSDoc conventions
- Markdown formatting
- API documentation format
