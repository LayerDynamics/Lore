---
name: deftrello-recovery
description: Task recovery workflow with smallest next actions and progress building
allowed-tools:
  - mcp__plugin_deftrello_deftrello__coach_assess_crash_state
  - mcp__plugin_deftrello_deftrello__coach_get_smallest_next_action
  - mcp__plugin_deftrello_deftrello__deftrello_quick_add_task
  - AskUserQuestion
---

# Task Recovery Workflow

Structured recovery from extended inactivity using small steps.

## Step 1: Assess Current State

Call `coach_assess_crash_state` to determine:
- How many days of inactivity
- Severity level (2/4/7/14+ days)
- Patterns contributing to the stall
- Board state analysis

## Step 2: Show Assessment

Present the assessment clearly:

```
Task Recovery Assessment

Status: [Active/Minor Stall/Moderate Stall/Extended Stall]
Days Inactive: [X days]
Tasks Stuck: [count]
Doing List: [X cards] (indicates context switching)

Analysis:
[Patterns identified: large tasks, unclear next steps, stalled progress]
```

## Step 3: Get Smallest Next Action

Call `coach_get_smallest_next_action` to identify a starting point:
- Takes the most urgent/important task
- Breaks it into small steps (2-5 minute steps)
- Provides a progress-building sequence

Show:
```
Your Smallest Next Action

Main Task: [task needing attention]

Small Steps (pick ONE):
1. 2 min - [tiny first step]
2. 3 min - [alternative tiny step]
3. 5 min - [slightly larger step]

Can't decide? Start with #1.
```

## Step 4: Ask What They Can Do

Use AskUserQuestion:
- Question: "Which step feels doable right now?"
- Options:
  - Option 1 (2 min) - [first step]
  - Option 2 (3 min) - [second step]
  - Option 3 (5 min) - [third step]
  - Still stuck - show even smaller steps

## Step 5: Create Task

If they choose an action, use `deftrello_quick_add_task` to create:
- A card for just that step
- In Today list
- Clear, actionable title

## Step 6: Progress Building

After completing the step:

```
Progress Started!

That's done. That's all you needed to do.

Next options (only if you're ready):
1. Do the next small step
2. Take a break
3. Switch to a different easy task
4. Stop here for now

One completed step is a success.
```

## Step 7: Offer Support

Provide:
- Acknowledgment that periods of inactivity happen to everyone
- Reminder that small progress is still progress
- Option to reach out for help or coordination
- Suggestion to update team if needed

## Recovery Tips

Show:
```
Recovery Tips

DO:
- Start with the smallest possible action
- Acknowledge completed steps
- Lower scope temporarily
- Ask for help
- Take breaks

DON'T:
- Try to do "just one more thing"
- Set unrealistic expectations
- Force deep work immediately
- Ignore the backlog
- Add new tasks right now

Pattern to Address:
[Identified pattern from assessment]
```

## Step 8: Follow-up Actions

Ask if they want to:
- Do the small step now and report back
- See more small steps
- Talk through what's causing the stall
- Get a progress update message for their team
- Plan prevention strategies for next time
