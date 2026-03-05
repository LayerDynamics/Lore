---
name: velocity-recovery
description: Guided workflow to recover project velocity and team momentum after slowdowns
allowed-tools: [ToolSearch, AskUserQuestion]
---

# Velocity Recovery Command

Systematic workflow for recovering team velocity after project slowdowns using velocity assessment and critical path identification.

## Usage

```bash
/trellio:velocity-recovery
```

## Workflow

### Step 1: Assess Project Velocity

```
Use ToolSearch: coach_assess_crash_state

Returns:
- Tier (1-5): Active, Momentum Loss, Stall, Slowdown, Halt
- Days since last activity
- Velocity assessment

Display professionally:
"Velocity Assessment: Tier 3 (Stall)
Days inactive: 6 days
Analysis: Project momentum has slowed. Recovery process will help restart."
```

### Step 2: Contextualize Situation

```
Based on tier, provide context:

Tier 2 (Momentum Loss):
"Project velocity is declining. Early intervention now prevents deeper issues."

Tier 3 (Stall):
"Project has stalled. We'll focus on restarting with a single critical deliverable."

Tier 4 (Slowdown):
"Significant velocity drop detected. We'll simplify and refocus on core deliverables."

Tier 5 (Project Halt):
"Project activity has stopped. We'll reset priorities and restart fresh."
```

### Step 3: Clear Backlog Overload

```
Explain: "First, we'll simplify the active work to create focus."

Use AskUserQuestion:
"The Doing list has X cards and Today has Y cards. This may be causing drag. Recommended action?"

Options:
- "Move most back to This Week, keep 1-2 critical items" (Recommended for Tier 3+)
- "Move some back, keep high priority" (For Tier 2)
- "Keep current" (Only for Tier 1)

Execute moves via ToolSearch: trello_update_card
```

### Step 4: Identify Critical Path

```
Use ToolSearch: coach_get_smallest_next_action

Selection criteria:
- Unblocks other work
- Clear deliverable
- Realistic timeframe (< 1 day)
- No external dependencies

Returns prioritized list

Display top 3 options:
"Critical Path Options:

1. [Task A] - 3h, unblocks backend work
2. [Task B] - 4h, customer-facing deliverable
3. [Task C] - 2h, closes blocker ticket

These aren't necessarily most important - they're most achievable now to restart momentum."
```

### Step 5: Team Commitment

```
Use AskUserQuestion:
"Which deliverable will the team focus on first?"

Options:
- [Task A]
- [Task B]
- [Task C]
- "None work - need different approach"

If "None work":
  Ask: "What's ONE deliverable the team could complete today?"
  Accept any specific, achievable target
  Create as focus task
```

### Step 6: Establish Focus

```
Selected task:
1. Move to Doing list
2. Clear other items from Doing
3. Assign to appropriate team member(s)
4. Set visual priority

Confirm:
"✅ Team Focus: [Task Name]

This is the priority. Complete this first.
Other work can wait until this ships.
Clear completion criteria: [criteria from task]"
```

### Step 7: Set Expectations

```
Provide clear next steps:

"Recovery Plan:
- Focus: Complete [Task Name] today
- Team: Coordinate on this one deliverable
- Blockers: Escalate immediately if encountered
- Done: Move to Done, then select next

Success = Shipping this one thing.
Don't add new work until this completes."
```

### Step 8: Schedule Check-In

```
Use AskUserQuestion:
"When should we check progress?"

Options:
- "End of day" (Daily check-in)
- "Tomorrow morning" (Next planning)
- "In 2 days" (For longer tasks)

Optional: Schedule a follow-up reminder
```

## Velocity Tier Actions

### Tier 2: Momentum Loss (2-4 days)
- Action: Identify and remove small blockers
- Clear Doing: Optional
- Focus: 1-2 deliverables
- Approach: Course correction

### Tier 3: Stall (5-7 days)
- Action: Simplify significantly
- Clear Doing: Yes, move excess to This Week
- Focus: 1 deliverable only
- Approach: Restart momentum

### Tier 4: Slowdown (8-14 days)
- Action: Emergency simplification
- Clear Doing: Yes, archive if needed
- Focus: 1 critical deliverable
- Approach: Reset and refocus

### Tier 5: Project Halt (15+ days)
- Action: Complete project reset
- Clear Doing: Archive non-critical work
- Focus: Re-evaluate project, single restart task
- Approach: Fresh start

## Team Velocity Principles

1. **Focus over multitasking** - One thing done > many things started
2. **Ship to learn** - Completed work provides data
3. **Remove blockers fast** - Don't let them accumulate
4. **Sustainable pace** - Recovery means finding right load
5. **Celebrate shipping** - Acknowledge completions
6. **Improve process** - Learn from slowdown causes

## Best Practices

1. **Act early** - Tier 2 easier to recover than Tier 4
2. **Be data-driven** - Use velocity metrics
3. **Communicate clearly** - Team understands priority
4. **Remove blockers** - Clear path to completion
5. **Ship incrementally** - Small deliverables build momentum
6. **Retrospect** - Learn from slowdown
7. **Adjust capacity** - Right-size commitments

References:
- `team-productivity` - Detailed velocity management philosophy
