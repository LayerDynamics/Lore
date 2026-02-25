---
name: trellio-planning
description: Morning planning workflow with task prioritization
allowed-tools:
  - mcp__plugin_trellio_trellio__trellio_get_daily_planning_context
  -
---

# Morning Planning Workflow

Let's plan your day with smart task prioritization.

## Step 1: Get Daily Planning Context

Call `trellio_get_daily_planning_context` to get:
- Current board state
- Tasks in each list
- Recommended tasks for today

## Step 2: Present Planning Summary

Show the user:
1. **Tasks in Doing**: [count]
2. **Tasks in Today**: [count]
3. **Recommended Tasks**: [prioritized tasks]

## Step 3: Offer Actions

Ask what they want to do:
- Add a new task
- Review specific task details
- Adjust task priorities

**Focus on:**
- Prioritized tasks
- Building progress
- Full Code Implementations
