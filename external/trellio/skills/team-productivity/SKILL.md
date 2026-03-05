---
name: team-productivity
description: This skill should be used when working with "team productivity", "project velocity", "sprint planning", "team capacity", "workload management", "team performance", or "project health monitoring"
version: 1.0.0
---

# Team Productivity & Project Velocity

Comprehensive guide for optimizing team performance, managing project velocity, implementing sustainable workflows, and maintaining healthy team capacity.

## When to Use This Skill

Use this skill when:
- Planning team capacity for sprints
- Recovering from project slowdowns
- Balancing team workload
- Implementing WIP limits
- Tracking team velocity
- Managing project health
- Optimizing team workflows

## Core Principles

### Principle 1: Focus Prevents Overload

Focused work prevents context switching and maintains team momentum:
- **Doing: 1-2 per person** - Focused execution
- **Today: 3-5 per person** - Daily sustainable load
- **This Week: 15-20 per person** - Weekly capacity

These guidelines are based on sustainable throughput and quality standards.

### Principle 2: Visibility Enables Coordination

Transparent task boards reduce communication overhead:
- All work visible at a glance
- Blockers identified immediately
- Dependencies clear
- Progress trackable

### Principle 3: Consistent Cadence Builds Momentum

Regular rhythms improve predictability:
- Daily standups review Today list
- Weekly planning populates This Week
- Sprint reviews check velocity
- Retrospectives improve process

### Principle 4: Context Switching Costs Real Time

Each task/project switch drains productivity:
- Minimize unnecessary switching
- Batch similar work
- Use Today list as focus boundary
- Complete before starting new work

## Team Velocity Tracking

### Velocity Assessment System

Use `coach_assess_crash_state` to evaluate project momentum:

**Tier 1: Active** (< 2 days since activity)
- Status: Healthy velocity
- Action: Maintain current pace
- Intervention: None needed

**Tier 2: Momentum Loss** (2-4 days)
- Status: Slowing down
- Action: Identify blockers
- Intervention: Team check-in

**Tier 3: Stall** (5-7 days)
- Status: Project stalled
- Action: Remove blockers, simplify
- Intervention: Reset priorities, focus on one deliverable

**Tier 4: Slowdown** (8-14 days)
- Status: Significant velocity drop
- Action: Emergency simplification
- Intervention: Clear backlog, restart with single focus

**Tier 5: Project Halt** (15+ days)
- Status: Project stopped
- Action: Complete reset
- Intervention: Re-evaluate project, restart fresh

### Velocity Recovery Workflow

**Step 1: Assess Current State**
```
Use: coach_assess_crash_state
Returns: Tier level + days inactive
Action: Acknowledge without blame - focus on recovery
```

**Step 2: Clear Backlog Overload**
```
Review: Doing list and Today list
If overloaded: Move excess back to This Week
Goal: Reduce to manageable subset
```

**Step 3: Identify Critical Path**
```
Use: coach_get_smallest_next_action
Returns: Most achievable next deliverable
Criteria:
  - No blockers
  - Clear completion criteria
  - Realistic timeframe
  - Unblocks other work
```

**Step 4: Single Focus Commitment**
```
Move: One critical task to Doing
Commit: Team focuses here first
Ignore: Everything else temporarily
```

**Step 5: Execute & Deliver**
```
Complete: The single focus task
Don't: Start additional work mid-stream
Track: Time to completion
```

**Step 6: Momentum Check**
```
Move: Completed to Done
Celebrate: Delivery milestone
Generate: Progress update
Next: Repeat for next task
```

## Sprint Capacity Planning

### Using coach_calculate_day_capacity

Estimate realistic sprint capacity:

**Input Factors:**
- Team size
- Sprint duration (days)
- Known time off
- Meeting load
- Current velocity trends

**Output:**
- Recommended story points
- Task count estimate
- Capacity confidence level
- Risk factors

### Capacity Adjustment

Adjust for:
- **Team experience**: New teams → reduce by 20%
- **Technical debt**: High debt → reduce by 15%
- **Dependencies**: External deps → reduce by 10%
- **New technology**: Learning curve → reduce by 25%
- **Meeting heavy**: > 20% meetings → reduce by 10%

## Workload Management

### Purpose of Focused Work Limits

Prevents:
- **Overcommitment** - More work than capacity
- **Context switching** - Productivity loss
- **Partial completion** - Many started, few finished
- **Quality issues** - Rushing to complete

### Recommended Balance

**Individual Level (per person):**
- Doing: 1-2 tasks maximum (focused work)
- Today: 3-5 tasks (daily work)
- This Week: 15-20 tasks (weekly planning)

**Team Level:**
- Doing: 1-2 × team_size
- Today: 5 × team_size
- This Week: 20 × team_size

### Workload Assessments

Use `coach_wip_limit_check` to detect:

**When Individual Overloaded:**
- Check: Cards per person
- Action: Redistribute work
- Consider: Delegation or descoping

**When Team Overloaded:**
- Check: Total work vs capacity
- Action: Move low priority to backlog
- Consider: Sprint scope adjustment

## Task Breakdown for Teams

### The 4-Hour Rule

If task > 4 hours, break it down for better tracking:

**Example: "Implement payment system"**

Becomes:
1. Design payment flow (2h) - @alice
2. Create payment API (3h) - @bob
3. Build payment UI (3h) - @carol
4. Integration testing (2h) - @alice
5. Documentation (1h) - @bob

Benefits:
- Parallel work possible
- Progress visible daily
- Blockers clear early
- Ownership distributed

### The Definition of Done

Each task needs clear completion criteria:

**Good DoD:**
- Code merged to main
- Tests passing (>80% coverage)
- Documentation updated
- Reviewed by 1+ team member
- Deployed to staging

**Bad DoD:**
- "Code complete" (ambiguous)
- "Works on my machine"
- "Mostly done"

## Team Performance Metrics

### Daily Standup Metrics

Use `trellio_get_daily_planning_context`:

Track:
- Cards completed yesterday
- Cards in progress today
- Blockers
- WIP limit status

### Weekly Retrospective

Use `coach_weekly_completion_stats`:

Review:
- Completion rate (%)
- Velocity trend (tasks/week)
- WIP limit compliance
- Blocker frequency
- Team workload distribution

### Sprint Review

Analyze:
- Planned vs completed
- Velocity compared to estimates
- Quality metrics (bugs, rework)
- Team satisfaction
- Process improvements

## Team Coordination Patterns

### Daily Check-In Pattern

```
Morning (15 min):
1. Review board snapshot
2. Each person: Yesterday/Today/Blockers
3. Identify dependencies
4. Adjust Today list as needed
```

### Weekly Planning Pattern

```
Friday PM or Monday AM (1 hour):
1. Review last week (completion stats)
2. Clear Done list (archive old cards)
3. Calculate next week capacity
4. Pull from backlog to This Week
5. Assign and estimate
```

### Sprint Planning Pattern

```
Start of Sprint (2 hours):
1. Review previous sprint metrics
2. Calculate sprint capacity
3. Prioritize backlog
4. Pull stories into sprint
5. Break down into tasks
6. Assign to team members
7. Set sprint goal
```

## Workload Balancing

### Team Capacity Check

Use `coach_wip_limit_check` for team view:

```
Team Workload:
- Alice: 7 cards (optimal)
- Bob: 15 cards (overloaded ⚠️)
- Carol: 4 cards (capacity available)

Recommendation: Move 5 cards from Bob to Carol
```

### Delegation Strategy

Use `trellio_delegate_task`:

When to delegate:
- Team member overloaded
- Task matches another's expertise
- Learning opportunity
- Work distribution needed

How to delegate:
1. Choose task (not started is easier)
2. Prepare context and requirements
3. Assign to team member
4. Brief on expectations
5. Set check-in point

## Accountability & Communication

### Daily Updates

Use `coach_generate_accountability_message`:

Formats:
- **Team standup**: Detailed for team meeting
- **Async update**: Brief status for channel
- **Manager report**: Progress summary

Content:
- Completed work
- Current focus
- Blockers/help needed
- Tomorrow's plan

### Sprint Reports

Weekly or sprint-end reporting:
- Stories completed
- Velocity achieved
- Quality metrics
- Blockers resolved
- Next sprint outlook

## Common Anti-Patterns

### Anti-Pattern 1: Planning Theater

**Problem**: Hours planning, no execution
**Fix**: 30-minute planning max, then execute
**Rule**: Planning:Doing ratio should be 1:10

### Anti-Pattern 2: "Just One More" Syndrome

**Problem**: Adding tasks mid-sprint constantly
**Fix**: Strict sprint scope protection
**Rule**: New urgent work replaces existing, doesn't add

### Anti-Pattern 3: Hero Culture

**Problem**: One person doing most work
**Fix**: Enforce WIP limits per person
**Rule**: Distribute work evenly, develop team skills

### Anti-Pattern 4: Zombie Tasks

**Problem**: Tasks in Doing for weeks
**Fix**: 5-day rule - stuck cards escalated
**Rule**: Break down or descope after 5 days

### Anti-Pattern 5: Capacity Wishful Thinking

**Problem**: Overcommitting every sprint
**Fix**: Use historical velocity
**Rule**: Commit 80% of capacity, 20% buffer

## Project Health Assessment

### Healthy Project Indicators

- Doing: At or under WIP limits
- Today: Active daily movement
- Velocity: Consistent week-over-week
- Completion rate: >70% of commitments
- Blockers: Resolved within 2 days

### Unhealthy Project Indicators

- Doing: Overloaded, tasks stuck >5 days
- Today: Stale, minimal movement
- Velocity: Declining trend
- Completion rate: <50% of commitments
- Blockers: Accumulating, unresolved

## Best Practices

1. **WIP limits are non-negotiable** - Enforce consistently
2. **Make work visible** - Everything on the board
3. **Regular cadence** - Daily/weekly rhythm
4. **Measure velocity** - Track and trend
5. **Retrospect regularly** - Continuous improvement
6. **Celebrate wins** - Acknowledge completions
7. **Address blockers fast** - Don't let them linger
8. **Balance workload** - Check distribution weekly

## Integration with Commands

This skill works with:
- `/trellio:morning-plan` - Daily team planning
- `/trellio:cleanup` - Board maintenance
- `/trellio:board-snapshot` - Team status overview

## Crisis Intervention

When team velocity crashes:

1. **Acknowledge** - "Velocity drop is data, not failure"
2. **Simplify** - Focus on one deliverable
3. **Identify blocker** - What's actually stopping progress
4. **Remove obstacles** - Clear the critical path
5. **Quick win** - Complete something today

Remember: Sustainable pace > heroic sprints. Consistency > speed.
