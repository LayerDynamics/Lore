---
name: trellio-board
description: View current board snapshot with all cards organized by list
allowed-tools:
  - mcp__plugin_trellio_trellio__trellio_get_board_snapshot
---

# Board Snapshot

Get a complete overview of your Trello board.

## Action

Call `trellio_get_board_snapshot` to retrieve:
- All lists (Reference, This Week, Today, Doing, Done)
- Cards in each list
- Card details (title, labels, due dates, members)
- Board statistics

## Display Format

Present the board in a clear, organized format:

```
Trellio Board Snapshot

REFERENCE (X cards)
- [Card 1 title] - [priority label]
- [Card 2 title] - [priority label]

THIS WEEK (X cards)
- [Card title] - [priority] - [due date]
- ...

TODAY (X cards)
- [Card title] - [priority] - [due date]
- ...

DOING (X cards)
- [Card title] - [priority]
- ...

DONE (X cards)
- [Card title] - [completed date]
- ...
```

## Insights

After showing the board, provide:
- Priority distribution (how many high/medium/low priority tasks)
- Overdue cards (any due soon or past due?)
- Recommendations (what to focus on next)

## Actions Available

Offer to:
- Move a card to a different list
- Get details on a specific card
- Add a new task
- Clean up the board
- Get priority-matched tasks
