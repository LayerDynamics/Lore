# Python Trello SDK — Design Doc

## Purpose

Python package for Trello dev tracking, assignment management, and workload analysis. Builds on the existing bash scripts and conda environment (`deftrello`). Uses `py-trello` for API access, `python-dotenv` for credentials, `click` for CLI, and `pandas` for metrics.

## Package Structure

```
deftrello/
├── __init__.py
├── client.py          # Trello API client (wraps py-trello + dotenv)
├── board.py           # Board state queries (lists, cards, members)
├── assign.py          # Assignment logic (workload balance, energy matching)
├── track.py           # Dev tracking (velocity, stale cards, completion rates)
└── cli.py             # Click CLI entry points
tests/
├── conftest.py        # Shared fixtures, mock API responses
├── test_board.py
├── test_assign.py
└── test_track.py
```

## Modules

### client.py — Trello Client

- Loads `.env` via `python-dotenv`, initializes `py-trello` `TrelloClient`
- Exposes board, lists, labels, custom fields as properties
- Entry point: `client = DefTrelloClient()`

### board.py — Board State

- `get_cards_by_list(list_name)` — cards in a specific list with all metadata
- `get_cards_by_member(member)` — everything assigned to someone
- `get_cards_by_label(label)` — filter by energy level
- `get_overdue_cards()` — cards past due date
- `get_stale_cards(hours=48)` — cards not modified in N hours

### assign.py — Assignment

**Single card operations:**
- `assign_card(card_id, member)` — assign a card to a member
- `unassign_card(card_id, member=None)` — remove specific member or all members
- `reassign_card(card_id, from_member, to_member)` — move ownership

**Bulk operations:**
- `assign_bulk(card_ids, member)` — assign multiple cards to one person

**Team management:**
- `list_members()` — all board members with current card counts
- `get_member_cards(member)` — cards assigned to a person, grouped by list

**Smart assignment:**
- `get_workload(member=None)` — card count per member, broken down by list
- `suggest_assignee(card)` — recommends member with lightest load for a card's task type
- `rebalance_report()` — who's overloaded vs. who has capacity

### track.py — Dev Tracking

- `velocity(days=7)` — cards completed in last N days, per member
- `cycle_time(card)` — duration from This Week to Done
- `completion_summary(days=7)` — weekly summary stats
- `stale_report()` — stale + overdue cards with days since last activity

### cli.py — CLI Commands

```
deftrello status                        # board overview (cards per list, overdue count)
deftrello workload                      # per-member card counts
deftrello assign <card> <member>        # assign card to person
deftrello assign --bulk <member>        # interactively pick cards to assign
deftrello reassign <card> <to_member>   # move card to different person
deftrello unassign <card>               # remove all assignees
deftrello members                       # list all board members + workload
deftrello velocity                      # completion stats for the week
deftrello stale                         # stale + overdue card report
```

## Dependencies

All from existing `environment.yml`:
- `py-trello` — Trello API SDK
- `python-dotenv` — load `.env` credentials
- `click` — CLI framework
- `pandas` — metrics and reporting
- `anthropic` — Claude API (future: smart assignment suggestions)
- `pytest` — testing

## Testing Strategy

- Mock `py-trello` API responses in `conftest.py`
- Tests run without real API keys
- Integration tests (optional, skipped without credentials) hit real board
