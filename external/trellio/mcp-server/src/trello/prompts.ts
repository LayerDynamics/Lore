/**
 * Trello MCP Prompts
 *
 * Reusable workflow prompts: morning_planning, weekly_review, task_triage,
 * delegation_helper, crash_recovery.
 */

export const morningPlanningPrompt = {
  name: 'morning_planning',
  description: 'Guided morning planning workflow with energy assessment and daily task selection',
  arguments: [
    {
      name: 'energy_level',
      description: 'Current energy level (1-5): 1=Brain Dead, 2=Low, 3=Medium, 4=High, 5=Peak',
      required: true,
    },
  ],
  messages: [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `Let's plan my day. My energy level is {{energy_level}}.

Please:
1. Check my board snapshot for WIP status and current tasks
2. Review what's in Today and This Week lists
3. Filter tasks that match my energy level
4. Suggest a realistic plan for today based on:
   - Current WIP limits
   - My energy capacity
   - Task priorities and due dates
5. Help me pull the right tasks into Today

Use the get_board_snapshot and get_daily_planning_context tools.`,
      },
    },
  ],
};

export const weeklyReviewPrompt = {
  name: 'weekly_review',
  description: 'Complete weekly review workflow with accomplishments, stale task triage, and next week planning',
  arguments: [],
  messages: [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `Let's do my weekly review.

Please guide me through:
1. **Celebration**: Show cards completed this week (in Done list)
2. **Stale Tasks**: Review cards with no activity in 48+ hours - help me decide: keep, reschedule, delegate, or kill
3. **Overdue Review**: Check overdue cards and help me either complete or reschedule them
4. **Energy Analysis**: Show energy distribution to identify patterns
5. **Next Week Setup**: Help me prioritize This Week based on:
   - What didn't get done this week
   - Upcoming due dates
   - Energy requirements
6. **Board Cleanup**: Archive Done cards and reset for next week

Use get_board_snapshot, get_overdue_cards, get_stale_cards, and clean_up_board tools.`,
      },
    },
  ],
};

export const taskTriagePrompt = {
  name: 'task_triage',
  description: 'Decision helper for stale or stuck tasks - keep, reschedule, delegate, or kill',
  arguments: [
    {
      name: 'card_id',
      description: 'Card ID to triage',
      required: true,
    },
  ],
  messages: [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `Help me triage this card: {{card_id}}

Please:
1. Get the card details (title, description, last activity, due date)
2. Ask me questions to understand:
   - Is it still relevant?
   - What's blocking it?
   - Is it the right size?
   - Does someone else own it now?
3. Based on my answers, recommend one of:
   - **Keep**: It's still important, just needs a push
   - **Reschedule**: Move due date or to This Week
   - **Delegate**: Hand off to someone else
   - **Kill**: Archive it, it's not happening
4. Execute the decision

Use get_card, update_card, archive_card, or delegate_task tools.`,
      },
    },
  ],
};

export const delegationHelperPrompt = {
  name: 'delegation_helper',
  description: 'Guide creating a well-documented delegation with handoff checklist',
  arguments: [
    {
      name: 'task_summary',
      description: 'Brief summary of what needs to be delegated',
      required: true,
    },
    {
      name: 'assignee',
      description: 'Person to delegate to',
      required: true,
    },
  ],
  messages: [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `Help me delegate: "{{task_summary}}" to {{assignee}}

Please guide me through:
1. **Context**: What background does {{assignee}} need?
2. **Expected Outcome**: What does "done" look like?
3. **Resources**: What access or tools do they need?
4. **Timeline**: When is this due?
5. **Follow-up**: When should I check in?

Then create the card with:
- Clear title and description
- Assigned to {{assignee}}
- Due date
- Delegation Handoff checklist
- Appropriate priority

Use the delegate_task tool.`,
      },
    },
  ],
};

export const crashRecoveryPrompt = {
  name: 'crash_recovery',
  description: 'Gentle re-entry after period of inactivity - assess state and find smallest next action',
  arguments: [],
  messages: [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `I haven't touched my board in a while. Help me get back.

Please:
1. Check board activity to see how long it's been
2. Get current board snapshot - what's the state?
3. **Don't overwhelm me** - find THE SMALLEST possible next action:
   - Brain Dead energy task
   - Quick Win flagged
   - Shortest time estimate
   - Something I can do in < 15 minutes
4. Help me clean up if needed:
   - Archive old Done cards
   - Move stuck Doing → This Week
5. Suggest a gentle re-entry plan

Use get_board_activity, get_board_snapshot, get_energy_matched_tasks, and clean_up_board tools.`,
      },
    },
  ],
};
