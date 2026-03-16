/**
 * Trellio MCP Prompts
 *
 * Reusable workflow prompts: morning_planning, weekly_review, task_triage
 */

export const morningPlanningPrompt = {
  name: 'morning_planning',
  description: 'Guided morning planning workflow with daily task selection',
  arguments: [
    {
      name: 'focus_area',
      description: 'Optional focus area for today (e.g., "frontend", "bugs", "docs")',
      required: false,
    },
  ],
  messages: [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `Let's plan my day.${`{{focus_area}}` ? ' Focus area: {{focus_area}}' : ''}

Please:
1. Check my board snapshot for current tasks
2. Review what's in my active lists
3. Identify overdue and stale cards that need attention
4. Suggest a realistic plan for today based on:
   - Task priorities and due dates
   - Current workload
5. Help me decide which tasks to focus on

Use the trello_get_board and trello_list_cards tools.`,
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
1. **Celebration**: Show cards completed this week
2. **Stale Tasks**: Review cards with no activity in 48+ hours - help me decide: keep, reschedule, delegate, or kill
3. **Overdue Review**: Check overdue cards and help me either complete or reschedule them
4. **Next Week Setup**: Help me prioritize based on:
   - What didn't get done this week
   - Upcoming due dates

Use trello_get_board, trello_list_cards, and trello_get_board_activity tools.`,
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
   - **Reschedule**: Move due date or to a different list
   - **Delegate**: Hand off to someone else
   - **Kill**: Archive it, it's not happening
4. Execute the decision

Use trello_get_card, trello_update_card, and trello_archive_card tools.`,
      },
    },
  ],
};
