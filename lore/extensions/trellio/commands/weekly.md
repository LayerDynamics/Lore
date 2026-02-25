---
name: trellio-weekly
description: Weekly review with completion stats, patterns, and planning
allowed-tools:
  - mcp__plugin_trellio_trellio__coach_weekly_completion_stats
  - mcp__plugin_trellio_trellio__trellio_get_board_snapshot
  - mcp__plugin_trellio_trellio__trellio_clean_up_board
  - mcp__plugin_trellio_trellio__coach_generate_accountability_message
---

# Weekly Review

Comprehensive weekly review with stats, insights, and next week planning.

## Step 1: Get Completion Stats

Call `coach_weekly_completion_stats` to retrieve:
- Tasks completed this week
- Completion rate by priority level
- Time estimates vs actuals
- Most productive days/times
- Priority pattern analysis

## Step 2: Present Weekly Stats

Show comprehensive review:

```
Weekly Completion Report

Week of [Date Range]

COMPLETION METRICS
- Tasks Completed: [X] tasks
- Completion Rate: [Y]% (target: 70%+)
- Average per Day: [Z] tasks/day

PRIORITY BREAKDOWN
- High Priority: [A] tasks ([%]%)
- Medium Priority: [B] tasks ([%]%)
- Low Priority: [C] tasks ([%]%)
- Simple Tasks: [D] tasks ([%]%)

TIME ANALYSIS
- Total Estimated: [X hours]
- Actual Time Spent: [Y hours]
- Accuracy: [Z]% (estimates vs actuals)

COMPLETION PATTERNS
- Most Productive Day: [Day]
- Best Time of Day: [Time Range]
- Average Focus Duration: [X minutes]
- Context Switches: [Y per day]

TASK TYPES
- Deep Work: [X] tasks
- Quick Tasks: [Y] tasks
- Administrative: [Z] tasks
- Creative: [A] tasks
```

## Step 3: Priority Pattern Insights

Analyze priority trends:

```
Priority Pattern Analysis

STRENGTHS:
- Completed [X]% of medium priority tasks
- Good balance of task types

OPPORTUNITIES:
- [Z]% of high priority tasks incomplete
  -> Schedule focused work for [best time]

- Low priority tasks piling up
  -> Dedicate Friday afternoons to admin

- Priority mismatch on [Day]
  -> Consider [specific adjustment]

WEEKLY COMPLETION RHYTHM:
Monday:    xxxxxxxxoo 80% (Strong start)
Tuesday:   xxxxxxxxxx 100% (Top performance)
Wednesday: xxxxoooooo 40% (Mid-week dip)
Thursday:  xxxxxxxooo 70% (Rebound)
Friday:    xxxxxooooo 50% (Wind down)
```

## Step 4: Completions and Challenges

Review and learn:

```
COMPLETIONS THIS WEEK

Key Accomplishments:
1. [Completed task 1] - [impact/outcome]
2. [Completed task 2] - [impact/outcome]
3. [Completed task 3] - [impact/outcome]

Process Improvements:
- Completed [Y] morning planning sessions
- Used task recovery [Z] times
- Priority-matched tasks [A] times

CHALLENGES

Incomplete Tasks:
- [Task 1] - [reason/blocker]
- [Task 2] - [reason/blocker]

Patterns to Address:
- [Pattern 1: e.g., starting too many tasks]
- [Pattern 2: e.g., avoiding high priority work]
- [Pattern 3: e.g., overcommitting on Mondays]

Recovery Sessions:
- [X] recovery sessions
- Average stall duration: [Y days]
- Primary triggers: [identified patterns]
```

## Step 5: Generate Progress Update

Call `coach_generate_accountability_message` to create:

```
Team Update (Optional)

Here's a draft update for your team:

"This week I completed [X] tasks including [major accomplishment].

Key completions:
- [Item 1]
- [Item 2]

Next week focusing on:
- [Priority 1]
- [Priority 2]

Blockers/help needed:
- [Blocker 1] - need [specific help]"

Want to send this or modify it?
```

## Step 6: Clean Up Board

Call `trellio_clean_up_board` automatically:

```
Weekly Cleanup Performed

- Archived [X] completed cards
- Organized [Y] cards by priority
- Moved [Z] overdue tasks
- Board ready for next week planning
```

## Step 7: Next Week Planning

Show current state and plan:

```
PLANNING NEXT WEEK

Current This Week List: [X cards]

PRIORITIES FOR NEXT WEEK:
1. [High priority task from This Week]
2. [High priority task from This Week]
3. [High priority task from This Week]

DAILY FOCUS:
Monday (Strong Start):
- [Deep work task]
- [Complex problem solving]

Tuesday (Top Performance):
- [Most important task]
- [Strategic work]

Wednesday (Mid-week):
- [Medium priority tasks]
- [Collaborative work]

Thursday (Rebound):
- [Moderate tasks]
- [Progress on ongoing projects]

Friday (Wind down):
- [Admin tasks]
- [Planning and cleanup]
```

## Step 8: Set Weekly Goals

Establish next week's targets:

```
NEXT WEEK GOALS

COMPLETION TARGETS:
- Complete [X] high-priority tasks
- Complete morning planning 5/5 days
- Hit [Y]% completion rate

FOCUS GOALS:
- Stay focused on prioritized tasks
- Use task recovery if needed
- Track completion patterns daily

IMPROVEMENT FOCUS:
- [Specific behavior to improve]
- [Pattern to break]
- [New habit to build]

REVIEW PLAN:
- Weekly review every Friday at [time]
- Reward for hitting [%]% completion: [reward]
- Share completions with [person/team]
```

## Step 9: Offer Actions

Ask what they want to do:
- Start planning Monday specifically
- Review and adjust This Week list
- Set up recurring weekly review reminder
- Generate team update
- Export stats for tracking
- Get guidance on specific challenge
