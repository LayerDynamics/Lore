---
name: board-create
description: Create and configure new Trello board with Trellio structure
argument-hint: "[board-name]"
allowed-tools: [ToolSearch, AskUserQuestion, Write]
---

# Board Create Command

Create new Trello board with Trellio-optimized structure including lists, labels, custom fields, and settings registration.

## Usage

```bash
# Interactive mode
/trellio:board-create

# With board name
/trellio:board-create "Q1 Product Launch"

# Specify template type
/trellio:board-create "Engineering Team" --template=team
```

## Workflow

### Step 1: Gather Requirements

```
Use AskUserQuestion:

"What's the board name?"
- If provided as argument, use that
- Otherwise, ask user

"What type of board?"
Options:
- "Personal - Individual task management"
- "Team - Team collaboration (2-10 people)"
- "Project - Specific project with milestones"
- "Department - Department-wide coordination"
```

### Step 2: Create Board

```
Use ToolSearch: trello_create_board

Parameters:
- name: [User-provided name]
- template: [Selected template type]

Returns:
- board_id
- board_url

Confirm:
"✅ Created board: [Board Name]
Board ID: abc123def456
URL: https://trello.com/b/abc123def456"
```

### Step 3: Create Trellio Lists

```
Use ToolSearch: trello API (via MCP tools)

Create lists in order:
1. Reference - Templates, documentation, long-term reference
2. This Week - Current sprint/week backlog
3. Today - Daily commitments
4. Doing - Active work
5. Done - Completed tasks

For each list:
  Create via API
  Set position
  Store list_id

Report:
"📋 Created 5 lists:
- Reference (ref_id_1)
- This Week (week_id_2)
- Today (today_id_3)
- Doing (doing_id_4)
- Done (done_id_5)"
```

### Step 4: Create Labels

```
Create standard labels:

Priority Labels:
- High (red)
- Medium (yellow)
- Low (green)

Status Labels:
- Blocked (black)
- In Review (purple)
- Due Soon (orange)

Type Labels (based on template):

Personal:
- Quick Win (blue)
- Deep Work (sky)

Team:
- Frontend (blue)
- Backend (sky)
- Design (pink)
- Bug Fix (red)

Project:
- Milestone (purple)
- Deliverable (orange)
- Research (sky)

Report:
"🏷️ Created X labels"
```

### Step 5: Create Custom Fields

```
Use Trello Power-Up API (if available):

Standard Custom Fields:
1. Time Estimate
   - Type: Number
   - Unit: Hours
   - Default: null

2. Task Type
   - Type: Dropdown
   - Options: Feature, Bug, Design, Docs, Research

3. Priority
   - Type: Dropdown
   - Options: Critical, High, Medium, Low

4. Sprint
   - Type: Text
   - For project boards

5. Assigned Team
   - Type: Dropdown
   - For department boards

Report:
"⚙️ Created 5 custom fields"
```

### Step 6: Set Board Settings

```
Configure board settings:
- Voting enabled: Yes
- Comments: Members only
- Card aging: Disabled
- Cover images: Enabled
- Labels: Show on front

Report:
"⚙️ Configured board settings"
```

### Step 7: Add to Settings Registry

```
Read: .claude/trellio.local.md

Add board entry:
boards:
  - name: "Q1 Product Launch"
    id: "abc123def456"
    lists:
      reference: "ref_id_1"
      this_week: "week_id_2"
      today: "today_id_3"
      doing: "doing_id_4"
      done: "done_id_5"
    labels:
      high_priority: "label_id_1"
      # ... other labels
    created: "2026-02-16"
    template: "project"

Write updated settings

Ask: "Set as current board?"
If yes: Update current_board_id

Report:
"📝 Registered board in settings"
```

### Step 8: Create Reference Cards (Optional)

```
Use AskUserQuestion:
"Create starter reference cards?"

Options:
- "Yes, create board guide" (Recommended)
- "Yes, and add templates"
- "No, empty board"

If yes, create cards in Reference list:

1. "📘 How to Use This Board"
   Description: Trellio workflow guide

2. "📋 Card Template"
   Description: Template for new cards

3. "🎯 Sprint Planning Template" (for team/project)
   Checklist:
   - [ ] Review backlog
   - [ ] Set sprint goals
   - [ ] Assign tasks
   - [ ] Estimate effort

4. "📊 Weekly Review Template"
   Checklist:
   - [ ] Check completion rate
   - [ ] Identify blockers
   - [ ] Plan next week

Report:
"📇 Created 4 reference cards"
```

### Step 9: Board Setup Complete

```
Generate summary:

## Board Creation Complete

**Board:** Q1 Product Launch
**URL:** https://trello.com/b/abc123def456
**Template:** Project

**Structure:**
- ✅ 5 Trellio lists created
- ✅ 12 labels configured
- ✅ 5 custom fields added
- ✅ 4 reference cards created
- ✅ Registered in settings

**Next Steps:**
1. Invite team members to board
2. Import tasks with /trellio:bulk-import
3. Configure automation (optional)
4. Start adding cards to backlog

**Quick Start:**
- Add tasks to "This Week" for sprint planning
- Move daily priorities to "Today"
- Keep "Doing" focused on active work
- Use labels to categorize work

Board is ready to use! 🎉
```

## Template Types

### Personal Template

For individual task management:

**Lists:** Standard 5 lists
**Labels:**
- Priority levels
- Quick Win
- Deep Work
- Learning

**Focus:** Individual productivity and task management

### Team Template

For team collaboration (2-10 people):

**Lists:** Standard + optional Blocked list
**Labels:**
- Priority
- Technical area (Frontend, Backend, etc.)
- Bug/Feature/Improvement
- Sprint markers

**Custom Fields:**
- Assignee (if not using built-in)
- Story Points
- Sprint number

**Focus:** Team coordination and collaboration

### Project Template

For specific projects with milestones:

**Lists:** Standard + Milestones list
**Labels:**
- Priority
- Phase (Planning, Execution, Review)
- Milestone markers
- Deliverable types

**Custom Fields:**
- Milestone
- Phase
- Due Date
- Owner

**Focus:** Project tracking, milestone management

### Department Template

For department-wide coordination:

**Lists:**
- Backlog
- This Quarter
- This Month
- This Week
- In Progress
- Done

**Labels:**
- Priority
- Team assignment
- Initiative type
- Budget status

**Custom Fields:**
- Team
- Budget allocated
- Quarter
- Initiative

**Focus:** Cross-team coordination, resource allocation

## Manual Setup Steps

Some board features require manual Trello UI configuration:

### Butler Rules (Automation)

Create via Trello Butler:
```
1. "When a card is moved to Done, set due date to today"
2. "Every Monday at 9 AM, create card 'Weekly Planning' in Today"
3. "When due date is in 1 day, add 'Due Soon' label"
```

Guide user to: Board Menu → Automation → Butler

### Power-Ups

Recommended Power-Ups:
- Custom Fields (for metadata)
- Card Aging (visual staleness)
- Calendar (due date view)
- Voting (prioritization)

### Board Background

Suggest setting board background/theme for visual distinction

## Error Handling

**Board creation fails:**
```
Error: Trello API error
Cause: May be rate limited or permission issue
Action: Wait 1 minute and retry
```

**List creation fails:**
```
Error: Could not create list [name]
Action: Create lists manually via Trello UI
Provide: List names and order
```

**Settings update fails:**
```
Error: Could not update settings file
Action: Manually add board to .claude/trellio.local.md
Provide: Board entry YAML
```

## Integration

After board creation:
- `/trellio:bulk-import` - Import initial tasks
- `/trellio:board-select` - Switch to new board
- `/trellio:cleanup` - Set up automated maintenance

## Best Practices

1. **Choose descriptive name** - Include project/team identifier
2. **Select appropriate template** - Matches workflow
3. **Invite members early** - Before adding tasks
4. **Create reference cards** - Document workflow
5. **Set up automation** - Butler rules for consistency
6. **Import backlog** - Use bulk import for initial tasks
7. **Configure integrations** - Link to external tools as needed

## Tips

- Use project template for time-bound work
- Use team template for ongoing collaboration
- Keep personal boards for individual tasks
- Create one board per project/team for clarity
- Archive old boards rather than deleting
- Export board before major restructuring
