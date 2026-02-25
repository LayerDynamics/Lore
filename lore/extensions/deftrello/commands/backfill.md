---
name: deftrello-backfill
description: Comprehensive backfill workflow - analyze codebase and populate Trello with all work items
allowed-tools:
  - Glob
  - Grep
  - Read
  - mcp__plugin_deftrello_deftrello__trello_create_card
  - mcp__plugin_deftrello_deftrello__deftrello_batch_update_cards
  - mcp__plugin_deftrello_deftrello__deftrello_get_board_snapshot
  - AskUserQuestion
---

# Comprehensive Backfill Workflow

Complete codebase analysis and task backfill - extract all work items from code, docs, and project state.

## Overview

This command orchestrates a full backfill:
1. Code analysis (TODOs, FIXMEs, bugs)
2. Test coverage gaps
3. Documentation gaps
4. Technical debt identification
5. Architecture improvements
6. Batch card creation

Perfect for:
- New project setup
- Sprint planning
- Quarterly planning
- Onboarding new team members
- Technical debt initiatives

## Step 1: Select Project

Use AskUserQuestion:
- Question: "Which project should I backfill?"
- Options:
  - Current project directory
  - DefTrello project directory
  - Both projects (comprehensive)
  - Custom path (specify directory)

## Step 2: Configure Analysis Scope

Use AskUserQuestion:
- Question: "What depth of analysis?"
- Options:
  - Quick scan (TODOs + critical issues only) - ~5 min
  - Standard analysis (TODOs + tests + docs) - ~15 min
  - Deep analysis (everything including refactoring) - ~30 min
  - Custom (let me choose categories)

## Step 3: Run Comprehensive Scan

Show progress for each phase:

```
Phase 1: Scanning for action items...
  TODO comments: 28 found
  FIXME comments: 12 found
  BUG markers: 5 found
  OPTIMIZE markers: 8 found
  HACK markers: 3 found

Phase 2: Analyzing test coverage...
  Source files: 143 scanned
  Test files: 67 found
  Missing tests: 42 files
  Incomplete tests: 15 files

Phase 3: Auditing documentation...
  Code artifacts: 294 found
  Doc artifacts: 73 found
  Undocumented APIs: 7 endpoints
  Missing docstrings: 45 functions
  Outdated docs: 3 sections

Phase 4: Technical debt analysis...
  Large files: 8 files (>500 lines)
  Complex functions: 12 functions (>50 lines)
  Code duplication: 5 patterns
  Deprecated code: 4 instances
  Security issues: 2 concerns

Phase 5: Architecture review...
  Missing error handling: 8 locations
  Inconsistent patterns: 6 issues
  Performance bottlenecks: 4 areas
  Scalability concerns: 3 items
```

## Step 4: Aggregate and Categorize

Combine all findings into categories:

```
Backfill Analysis Complete

PROJECT: [project name] ([project path])
SCAN DEPTH: Deep analysis
DURATION: 28 minutes

TOTAL WORK ITEMS IDENTIFIED: 187 tasks

CRITICAL (Must fix ASAP)
  - 5 bugs
  - 2 security issues
  - 3 production blockers
  Total: 10 tasks | Est: 25-30 hours

HIGH PRIORITY (This week)
  - 12 FIXME items
  - 7 missing critical tests
  - 7 undocumented APIs
  Total: 26 tasks | Est: 40-50 hours

MEDIUM PRIORITY (This month)
  - 28 TODO items
  - 35 missing tests
  - 20 documentation gaps
  Total: 83 tasks | Est: 120-150 hours

LOW PRIORITY (Backlog)
  - 8 OPTIMIZE items
  - 12 refactoring tasks
  - 15 code cleanup items
  - 8 architecture improvements
  - 25 nice-to-have docs
  Total: 68 tasks | Est: 100-120 hours

BREAKDOWN BY TYPE:
  Bugs & Fixes: 22 tasks (12%)
  Testing: 57 tasks (30%)
  Documentation: 52 tasks (28%)
  Refactoring: 35 tasks (19%)
  Architecture: 21 tasks (11%)

BREAKDOWN BY PRIORITY:
  High Priority: 43 tasks (23%)
  Medium Priority: 87 tasks (47%)
  Low Priority: 52 tasks (28%)
  Simple Tasks: 5 tasks (3%)

ESTIMATED TOTAL EFFORT:
  Optimistic: 285 hours (~7 weeks for 1 person)
  Realistic: 350 hours (~9 weeks for 1 person)
  Pessimistic: 420 hours (~11 weeks for 1 person)
```

## Step 5: Show Top Priority Items

Preview the most critical tasks:

```
TOP 10 CRITICAL ITEMS

1. [BUG] Race condition in payment processing
   File: payments.py:234
   Impact: Production transactions failing
   Time: 6-8 hours | Priority: High
   Priority: CRITICAL

2. [SECURITY] SQL injection in search endpoint
   File: api.py:145
   Impact: Data breach risk
   Time: 4-6 hours | Priority: High
   Priority: CRITICAL

3. [FIXME] Authentication token not validated
   File: auth.py:89
   Impact: Security vulnerability
   Time: 2-3 hours | Priority: Medium
   Priority: HIGH

4. [TEST] Missing tests for user registration
   File: users.py:123
   Impact: Critical path untested
   Time: 3-4 hours | Priority: Medium
   Priority: HIGH

5. [DOCS] API endpoint /api/users undocumented
   File: docs/api.md
   Impact: External developers blocked
   Time: 2 hours | Priority: Low
   Priority: HIGH

[... 5 more ...]
```

## Step 6: Confirm Backfill Strategy

Use AskUserQuestion:
- Question: "How should we backfill these tasks?"
- Options:
  - Create all tasks (187 cards) - Complete backlog
  - Create critical + high only (36 cards) - Focus on urgent
  - Create this month's work (119 cards) - Sprint planning
  - Let me customize the selection
  - Show me more details first

## Step 7: Optimize for Team Focus

If creating many cards, ask about team:

Use AskUserQuestion:
- Question: "How should we organize for your team?"
- Options:
  - Solo developer (prioritize ruthlessly)
  - Small team 2-3 people (balanced load)
  - Full team 4+ people (distribute by expertise)
  - Mixed team (different skill levels)

Based on selection, adjust:
- Task distribution
- Priority level assignments
- Time estimates
- Priority ordering

## Step 8: Batch Create Trello Cards

Create all cards efficiently:

```
Creating Trello Cards (Batch Mode)...

Progress: ████████████████████░░ 85% (160/187)

CRITICAL (10 cards)
  Created: bugs, security issues -> Done list for immediate work

HIGH PRIORITY (26 cards)
  Created: FIXME, critical tests, API docs -> This Week list

MEDIUM PRIORITY (83 cards)
  Created: TODOs, tests, docs -> Reference list (staged)

LOW PRIORITY (68 cards)
  Created: refactoring, optimizations -> Reference list (backlog)

Backfill Complete!
  - 187 cards created
  - 10 in Done (review immediately)
  - 26 in This Week (tackle first)
  - 151 in Reference (staged for later)
```

## Step 9: Organize Board

After creating cards, auto-organize:

```
Organizing Trello Board...

List organization:
  - Moved 10 critical items to Today
  - Kept 26 high priority in This Week
  - Staged 151 items in Reference

Card labeling:
  - Added priority labels (all cards)
  - Added "Due Soon" to critical items
  - Added task type labels (bug/test/doc/refactor)

Time estimates:
  - Set time estimates for all cards
  - Marked quick tasks (< 1 hour)
  - Flagged epic tasks (> 8 hours)

Due dates:
  - Critical items: Due this week
  - High priority: Due next week
  - Medium priority: Due this month

Custom fields:
  - Task Type: Set for all cards
  - Priority: High/Medium/Low assigned
  - Complexity: Calculated from analysis
```

## Step 10: Generate Reports

Create comprehensive documentation:

**1. Backfill Summary Report**
```markdown
# Backfill Summary

Date: 2024-01-15
Duration: 28 minutes
Scope: Deep analysis

## Overview
Total work items: 187 tasks
Total effort: 285-420 hours (7-11 weeks)

## Critical Path (This Week)
1. Fix payment processing race condition (6-8h)
2. Patch SQL injection vulnerability (4-6h)
3. Add auth token validation (2-3h)
[... more ...]

## Sprint Planning Suggestions
Week 1: Focus on 10 critical items (30 hours)
Week 2-3: High priority FIXME + tests (50 hours)
Week 4-6: Medium priority TODOs (150 hours)

## Team Assignments (if applicable)
Senior Dev: Security issues, complex bugs
Mid-level: Testing, API development
Junior: Documentation, simple TODOs

## Metrics
Bugs: 22 (12%)
Tests: 57 (30%)
Docs: 52 (28%)
Refactoring: 35 (19%)
Architecture: 21 (11%)
```

Save to: `/tmp/deftrello-backfill-report-[date].md`

**2. Tech Debt Register**
```csv
ID,Type,File,Line,Description,Priority,Effort,Complexity
1,BUG,payments.py,234,Race condition,CRITICAL,8h,High
2,SECURITY,api.py,145,SQL injection,CRITICAL,6h,High
3,FIXME,auth.py,89,Token validation,HIGH,3h,Medium
[... more ...]
```

Save to: `/tmp/deftrello-tech-debt-[date].csv`

**3. Sprint Plan**
```markdown
# Sprint 1 Plan (Week 1)

## Goals
- Fix all critical bugs and security issues
- Establish baseline for testing
- Document critical API endpoints

## Tasks (10 items, 30 hours)
### Critical
- [ ] Fix payment race condition (8h)
- [ ] Patch SQL injection (6h)
- [ ] Add auth validation (3h)

### High Priority
- [ ] Add user registration tests (4h)
- [ ] Document /api/users endpoint (2h)
[... more ...]

## Team Availability
- Dev 1: 40 hours available
- Dev 2: 32 hours available
Total: 72 hours (30 planned = 42% utilization)

## Success Criteria
- All CRITICAL items resolved
- Test coverage for auth flow
- External API documented
```

Save to: `/tmp/deftrello-sprint-plan-[date].md`

## Step 11: Final Summary

Show completion summary:

```
BACKFILL COMPLETE

CREATED: 187 Trello cards

BOARD ORGANIZATION:
  Today: 10 critical items
  This Week: 26 high priority
  Reference: 151 staged items

METADATA:
  - Priority labels: 100% complete
  - Time estimates: 100% complete
  - Due dates: Critical + High set
  - Task types: All categorized

REPORTS GENERATED:
  1. Backfill summary -> /tmp/deftrello-backfill-report.md
  2. Tech debt register -> /tmp/deftrello-tech-debt.csv
  3. Sprint plan -> /tmp/deftrello-sprint-plan.md

ESTIMATED EFFORT:
  Critical (this week): 30 hours
  High priority (next week): 50 hours
  Medium priority (this month): 150 hours
  Total: 285-420 hours (7-11 weeks)

RECOMMENDED NEXT STEPS:

1. Review Today list (10 critical items)
   -> Start with highest impact items

2. Sprint planning meeting
   -> Assign tasks to team members
   -> Confirm estimates and priorities

3. Set up recurring reviews
   -> Weekly backlog refinement
   -> Monthly technical debt review

4. Track progress
   -> Use /deftrello-weekly for stats
   -> Monitor completion rates
   -> Adjust priorities as needed
```

## Step 12: Offer Follow-up Actions

Ask what they want to do next:
- View Today list (critical items)
- Start planning first sprint
- Assign tasks to team members
- Export all cards to CSV
- Schedule backlog refinement
- Set up progress tracking
- Generate more detailed reports
- Run backfill on another project

## Advanced Features

### Incremental Backfill
- Track previous backfill runs
- Only create cards for new items
- Update existing cards if changed
- Archive resolved items

### Integration with Git
- Link cards to commits
- Track which items are in flight
- Auto-close cards on merge
- Generate release notes

### Team Analytics
- Estimate based on team velocity
- Suggest task assignments
- Balance workload
- Track individual progress

### Continuous Backfill
- Schedule weekly scans
- Auto-create cards for new TODOs
- Alert on critical issues
- Monthly tech debt reports

**Note:** All priority level assignments and label references in this workflow use priority-based terminology (High/Medium/Low Priority, Simple Tasks).
