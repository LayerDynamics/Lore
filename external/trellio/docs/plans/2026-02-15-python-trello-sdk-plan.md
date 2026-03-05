# Python Trello SDK Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Python CLI and library for Trello dev tracking, card assignment, and workload analysis.

**Architecture:** A `deftrello` Python package wrapping `py-trello` with modules for board queries, assignment management, and dev tracking metrics. CLI built with Click. All credentials loaded from the existing `.env` file via `python-dotenv`.

**Tech Stack:** Python 3.12, py-trello, python-dotenv, click, pandas, pytest. Conda environment `deftrello`.

**Run all commands with:** `conda run -n deftrello <command>`

**Design doc:** `docs/plans/2026-02-15-python-trello-sdk-design.md`

---

### Task 1: Package scaffold and client module

**Files:**
- Create: `deftrello/__init__.py`
- Create: `deftrello/client.py`
- Create: `tests/__init__.py`
- Create: `tests/conftest.py`
- Create: `tests/test_client.py`

**Step 1: Create package directory**

```bash
mkdir -p deftrello tests
```

**Step 2: Write the failing test**

Create `tests/test_client.py`:

```python
import os
from unittest.mock import patch, MagicMock


def test_client_loads_env(tmp_path):
    """Client should load credentials from .env and initialize TrelloClient."""
    env_file = tmp_path / ".env"
    env_file.write_text(
        "TRELLO_API_KEY=test_key\n"
        "TRELLO_TOKEN=test_token\n"
        "TRELLO_BOARD_ID=test_board_id\n"
    )

    with patch("deftrello.client.TrelloClient") as mock_tc:
        mock_board = MagicMock()
        mock_tc.return_value.get_board.return_value = mock_board

        from deftrello.client import DefTrelloClient

        client = DefTrelloClient(env_path=str(env_file))
        assert client.board == mock_board
        mock_tc.assert_called_once_with(api_key="test_key", token="test_token")


def test_client_exposes_lists(tmp_path):
    """Client should expose board lists as a dict keyed by name."""
    env_file = tmp_path / ".env"
    env_file.write_text(
        "TRELLO_API_KEY=test_key\n"
        "TRELLO_TOKEN=test_token\n"
        "TRELLO_BOARD_ID=test_board_id\n"
    )

    with patch("deftrello.client.TrelloClient") as mock_tc:
        mock_list = MagicMock()
        mock_list.name = "This Week"
        mock_board = MagicMock()
        mock_board.list_lists.return_value = [mock_list]
        mock_tc.return_value.get_board.return_value = mock_board

        from deftrello.client import DefTrelloClient

        client = DefTrelloClient(env_path=str(env_file))
        lists = client.get_lists()
        assert "This Week" in lists
        assert lists["This Week"] == mock_list
```

Create `tests/__init__.py` (empty) and `tests/conftest.py`:

```python
"""Shared test fixtures for deftrello tests."""
```

**Step 3: Run test to verify it fails**

Run: `conda run -n deftrello pytest tests/test_client.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'deftrello'`

**Step 4: Write the implementation**

Create `deftrello/__init__.py`:

```python
"""DefTrello — Python SDK for ADHD Trello board management."""

from deftrello.client import DefTrelloClient

__all__ = ["DefTrelloClient"]
```

Create `deftrello/client.py`:

```python
"""Trello API client wrapping py-trello with .env credential loading."""

import os
from dotenv import load_dotenv
from trello import TrelloClient


class DefTrelloClient:
    """Main client for interacting with the ADHD Trello board.

    Loads credentials from .env and provides access to the board,
    its lists, labels, members, and custom fields.
    """

    def __init__(self, env_path=None):
        if env_path:
            load_dotenv(env_path)
        else:
            load_dotenv()

        api_key = os.environ["TRELLO_API_KEY"]
        token = os.environ["TRELLO_TOKEN"]
        board_id = os.environ["TRELLO_BOARD_ID"]

        self._client = TrelloClient(api_key=api_key, token=token)
        self.board = self._client.get_board(board_id)

    def get_lists(self):
        """Return board lists as a dict keyed by list name."""
        return {lst.name: lst for lst in self.board.list_lists()}

    def get_labels(self):
        """Return board labels as a dict keyed by label name."""
        return {lbl.name: lbl for lbl in self.board.get_labels()}

    def get_members(self):
        """Return board members as a dict keyed by username."""
        return {m.username: m for m in self.board.get_members()}

    def get_card(self, card_id):
        """Get a single card by ID."""
        return self._client.get_card(card_id)
```

**Step 5: Run test to verify it passes**

Run: `conda run -n deftrello pytest tests/test_client.py -v`
Expected: 2 passed

**Step 6: Commit**

```bash
git add deftrello/ tests/
git commit -m "feat: add deftrello package scaffold and client module"
```

---

### Task 2: Board query module

**Files:**
- Create: `deftrello/board.py`
- Create: `tests/test_board.py`

**Step 1: Write the failing tests**

Create `tests/test_board.py`:

```python
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock
from deftrello.board import BoardQueries


def _make_card(name, due=None, labels=None, members=None, date_last_activity=None):
    card = MagicMock()
    card.name = name
    card.id = f"id_{name.replace(' ', '_').lower()}"
    card.due_date = due
    card.labels = labels or []
    card.member_ids = members or []
    card.date_last_activity = date_last_activity or datetime.now(timezone.utc)
    return card


def _make_list(name, cards=None):
    lst = MagicMock()
    lst.name = name
    lst.list_cards.return_value = cards or []
    return lst


def _make_client(lists=None):
    client = MagicMock()
    client.get_lists.return_value = {lst.name: lst for lst in (lists or [])}
    client.board = MagicMock()
    client.board.get_members.return_value = []
    return client


def test_get_cards_by_list():
    cards = [_make_card("Task 1"), _make_card("Task 2")]
    lists = [_make_list("This Week", cards), _make_list("Today")]
    client = _make_client(lists)

    bq = BoardQueries(client)
    result = bq.get_cards_by_list("This Week")
    assert len(result) == 2
    assert result[0].name == "Task 1"


def test_get_cards_by_list_not_found():
    client = _make_client([_make_list("This Week")])
    bq = BoardQueries(client)
    result = bq.get_cards_by_list("Nonexistent")
    assert result == []


def test_get_overdue_cards():
    past = datetime.now(timezone.utc) - timedelta(days=1)
    future = datetime.now(timezone.utc) + timedelta(days=1)
    cards = [_make_card("Overdue", due=past), _make_card("Not Due", due=future)]
    lists = [_make_list("This Week", cards)]
    client = _make_client(lists)

    bq = BoardQueries(client)
    overdue = bq.get_overdue_cards()
    assert len(overdue) == 1
    assert overdue[0].name == "Overdue"


def test_get_stale_cards():
    old = datetime.now(timezone.utc) - timedelta(hours=72)
    recent = datetime.now(timezone.utc) - timedelta(hours=1)
    cards = [
        _make_card("Stale", date_last_activity=old),
        _make_card("Fresh", date_last_activity=recent),
    ]
    lists = [_make_list("This Week", cards)]
    client = _make_client(lists)

    bq = BoardQueries(client)
    stale = bq.get_stale_cards(hours=48)
    assert len(stale) == 1
    assert stale[0].name == "Stale"


def test_get_cards_by_member():
    card1 = _make_card("Mine", members=["member_1"])
    card2 = _make_card("Theirs", members=["member_2"])
    lists = [_make_list("This Week", [card1, card2])]
    client = _make_client(lists)

    bq = BoardQueries(client)
    result = bq.get_cards_by_member("member_1")
    assert len(result) == 1
    assert result[0].name == "Mine"


def test_get_cards_by_label():
    label_high = MagicMock()
    label_high.name = "High Energy"
    label_low = MagicMock()
    label_low.name = "Low Energy"
    card1 = _make_card("Deep Work", labels=[label_high])
    card2 = _make_card("Easy Task", labels=[label_low])
    lists = [_make_list("This Week", [card1, card2])]
    client = _make_client(lists)

    bq = BoardQueries(client)
    result = bq.get_cards_by_label("High Energy")
    assert len(result) == 1
    assert result[0].name == "Deep Work"
```

**Step 2: Run test to verify it fails**

Run: `conda run -n deftrello pytest tests/test_board.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'deftrello.board'`

**Step 3: Write the implementation**

Create `deftrello/board.py`:

```python
"""Board state queries — cards by list, member, label, overdue, and stale."""

from datetime import datetime, timezone, timedelta


class BoardQueries:
    """Query cards on the board by various filters."""

    # Lists that are part of the active workflow (not Reference or Done)
    ACTIVE_LISTS = {"This Week", "Today", "Doing"}

    def __init__(self, client):
        self.client = client

    def _all_cards(self, list_names=None):
        """Collect cards across specified lists (or all lists)."""
        lists = self.client.get_lists()
        cards = []
        for name, lst in lists.items():
            if list_names and not any(ln in name for ln in list_names):
                continue
            cards.extend(lst.list_cards())
        return cards

    def get_cards_by_list(self, list_name):
        """Get all cards in a specific list. Returns [] if list not found."""
        lists = self.client.get_lists()
        for name, lst in lists.items():
            if list_name in name:
                return lst.list_cards()
        return []

    def get_cards_by_member(self, member_id):
        """Get all active cards assigned to a specific member ID."""
        return [c for c in self._all_cards() if member_id in (c.member_ids or [])]

    def get_cards_by_label(self, label_name):
        """Get all active cards with a specific label name."""
        return [
            c for c in self._all_cards()
            if any(label_name in lbl.name for lbl in (c.labels or []))
        ]

    def get_overdue_cards(self):
        """Get all cards with a due date in the past."""
        now = datetime.now(timezone.utc)
        return [
            c for c in self._all_cards()
            if c.due_date and c.due_date < now
        ]

    def get_stale_cards(self, hours=48):
        """Get cards not modified in the last N hours."""
        cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
        return [
            c for c in self._all_cards()
            if c.date_last_activity and c.date_last_activity < cutoff
        ]
```

**Step 4: Run tests to verify they pass**

Run: `conda run -n deftrello pytest tests/test_board.py -v`
Expected: 6 passed

**Step 5: Commit**

```bash
git add deftrello/board.py tests/test_board.py
git commit -m "feat: add board query module with list/member/label/overdue/stale filters"
```

---

### Task 3: Assignment module

**Files:**
- Create: `deftrello/assign.py`
- Create: `tests/test_assign.py`

**Step 1: Write the failing tests**

Create `tests/test_assign.py`:

```python
from unittest.mock import MagicMock, patch, call
from deftrello.assign import AssignmentManager


def _make_member(username, member_id=None):
    m = MagicMock()
    m.username = username
    m.id = member_id or f"id_{username}"
    return m


def _make_card(name, card_id=None, members=None):
    card = MagicMock()
    card.name = name
    card.id = card_id or f"id_{name.replace(' ', '_').lower()}"
    card.member_ids = [m.id for m in (members or [])]
    return card


def _make_list(name, cards=None):
    lst = MagicMock()
    lst.name = name
    lst.list_cards.return_value = cards or []
    return lst


def _make_client(lists=None, members=None):
    client = MagicMock()
    all_lists = {lst.name: lst for lst in (lists or [])}
    client.get_lists.return_value = all_lists
    client.get_members.return_value = {m.username: m for m in (members or [])}
    client.get_card.return_value = MagicMock()
    return client


def test_assign_card():
    alice = _make_member("alice")
    card = _make_card("Task 1")
    client = _make_client(members=[alice])
    client.get_card.return_value = card

    am = AssignmentManager(client)
    am.assign_card("id_task_1", "alice")
    card.assign.assert_called_once_with(alice.id)


def test_unassign_card_specific_member():
    alice = _make_member("alice")
    card = _make_card("Task 1", members=[alice])
    client = _make_client(members=[alice])
    client.get_card.return_value = card

    am = AssignmentManager(client)
    am.unassign_card("id_task_1", "alice")
    card.unassign.assert_called_once_with(alice.id)


def test_unassign_card_all_members():
    alice = _make_member("alice")
    bob = _make_member("bob")
    card = _make_card("Task 1", members=[alice, bob])
    client = _make_client(members=[alice, bob])
    client.get_card.return_value = card

    am = AssignmentManager(client)
    am.unassign_card("id_task_1")
    assert card.unassign.call_count == 2


def test_reassign_card():
    alice = _make_member("alice")
    bob = _make_member("bob")
    card = _make_card("Task 1", members=[alice])
    client = _make_client(members=[alice, bob])
    client.get_card.return_value = card

    am = AssignmentManager(client)
    am.reassign_card("id_task_1", "alice", "bob")
    card.unassign.assert_called_once_with(alice.id)
    card.assign.assert_called_once_with(bob.id)


def test_assign_bulk():
    alice = _make_member("alice")
    card1 = _make_card("Task 1", card_id="c1")
    card2 = _make_card("Task 2", card_id="c2")
    client = _make_client(members=[alice])
    client.get_card.side_effect = [card1, card2]

    am = AssignmentManager(client)
    am.assign_bulk(["c1", "c2"], "alice")
    card1.assign.assert_called_once_with(alice.id)
    card2.assign.assert_called_once_with(alice.id)


def test_list_members_with_card_counts():
    alice = _make_member("alice")
    bob = _make_member("bob")
    card1 = _make_card("T1", members=[alice])
    card2 = _make_card("T2", members=[alice])
    card3 = _make_card("T3", members=[bob])
    lists = [_make_list("This Week", [card1, card2, card3])]
    client = _make_client(lists=lists, members=[alice, bob])

    am = AssignmentManager(client)
    result = am.list_members()
    assert result["alice"] == 2
    assert result["bob"] == 1


def test_get_workload():
    alice = _make_member("alice")
    card1 = _make_card("T1", members=[alice])
    card2 = _make_card("T2", members=[alice])
    card3 = _make_card("T3", members=[alice])
    lists = [
        _make_list("This Week", [card1]),
        _make_list("Today", [card2]),
        _make_list("Doing", [card3]),
    ]
    client = _make_client(lists=lists, members=[alice])

    am = AssignmentManager(client)
    workload = am.get_workload("alice")
    assert workload["This Week"] == 1
    assert workload["Today"] == 1
    assert workload["Doing"] == 1


def test_suggest_assignee():
    alice = _make_member("alice")
    bob = _make_member("bob")
    card_a1 = _make_card("A1", members=[alice])
    card_a2 = _make_card("A2", members=[alice])
    card_b1 = _make_card("B1", members=[bob])
    lists = [_make_list("This Week", [card_a1, card_a2, card_b1])]
    client = _make_client(lists=lists, members=[alice, bob])

    am = AssignmentManager(client)
    suggested = am.suggest_assignee()
    assert suggested == "bob"
```

**Step 2: Run test to verify it fails**

Run: `conda run -n deftrello pytest tests/test_assign.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'deftrello.assign'`

**Step 3: Write the implementation**

Create `deftrello/assign.py`:

```python
"""Assignment management — assign, unassign, reassign, bulk, workload analysis."""


class AssignmentManager:
    """Manage card assignments and analyze team workload."""

    def __init__(self, client):
        self.client = client

    def _resolve_member_id(self, username):
        """Resolve a username to a member ID."""
        members = self.client.get_members()
        if username not in members:
            raise ValueError(f"Member '{username}' not found on board")
        return members[username].id

    def assign_card(self, card_id, username):
        """Assign a card to a member by username."""
        member_id = self._resolve_member_id(username)
        card = self.client.get_card(card_id)
        card.assign(member_id)

    def unassign_card(self, card_id, username=None):
        """Remove a member from a card. If no username, remove all members."""
        card = self.client.get_card(card_id)
        if username:
            member_id = self._resolve_member_id(username)
            card.unassign(member_id)
        else:
            for mid in list(card.member_ids):
                card.unassign(mid)

    def reassign_card(self, card_id, from_username, to_username):
        """Move a card from one member to another."""
        self.unassign_card(card_id, from_username)
        self.assign_card(card_id, to_username)

    def assign_bulk(self, card_ids, username):
        """Assign multiple cards to one member."""
        member_id = self._resolve_member_id(username)
        for cid in card_ids:
            card = self.client.get_card(cid)
            card.assign(member_id)

    def _all_cards(self):
        """Collect cards across all lists."""
        cards = []
        for name, lst in self.client.get_lists().items():
            cards.extend(lst.list_cards())
        return cards

    def _all_cards_by_list(self):
        """Collect cards grouped by list name."""
        result = {}
        for name, lst in self.client.get_lists().items():
            result[name] = lst.list_cards()
        return result

    def list_members(self):
        """Return dict of {username: card_count} for all board members."""
        members = self.client.get_members()
        counts = {username: 0 for username in members}
        for card in self._all_cards():
            for mid in (card.member_ids or []):
                for username, member in members.items():
                    if member.id == mid:
                        counts[username] += 1
        return counts

    def get_member_cards(self, username):
        """Get all cards assigned to a member, grouped by list name."""
        member_id = self._resolve_member_id(username)
        result = {}
        for list_name, cards in self._all_cards_by_list().items():
            member_cards = [c for c in cards if member_id in (c.member_ids or [])]
            if member_cards:
                result[list_name] = member_cards
        return result

    def get_workload(self, username):
        """Get card count per list for a specific member."""
        member_cards = self.get_member_cards(username)
        return {list_name: len(cards) for list_name, cards in member_cards.items()}

    def suggest_assignee(self):
        """Suggest the board member with the lightest workload."""
        member_counts = self.list_members()
        if not member_counts:
            return None
        return min(member_counts, key=member_counts.get)

    def rebalance_report(self):
        """Return a report of workload across all members.

        Returns dict: {username: {"total": N, "by_list": {list: count}}}
        """
        members = self.client.get_members()
        report = {}
        for username in members:
            workload = self.get_workload(username)
            report[username] = {
                "total": sum(workload.values()),
                "by_list": workload,
            }
        return report
```

**Step 4: Run tests to verify they pass**

Run: `conda run -n deftrello pytest tests/test_assign.py -v`
Expected: 8 passed

**Step 5: Commit**

```bash
git add deftrello/assign.py tests/test_assign.py
git commit -m "feat: add assignment module with assign/unassign/reassign/bulk/workload"
```

---

### Task 4: Dev tracking module

**Files:**
- Create: `deftrello/track.py`
- Create: `tests/test_track.py`

**Step 1: Write the failing tests**

Create `tests/test_track.py`:

```python
from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock
from deftrello.track import DevTracker


def _make_member(username, member_id=None):
    m = MagicMock()
    m.username = username
    m.id = member_id or f"id_{username}"
    return m


def _make_card(name, members=None, due=None, date_last_activity=None, actions=None):
    card = MagicMock()
    card.name = name
    card.id = f"id_{name.replace(' ', '_').lower()}"
    card.member_ids = [m.id for m in (members or [])]
    card.due_date = due
    card.date_last_activity = date_last_activity or datetime.now(timezone.utc)
    card.fetch_actions.return_value = actions or []
    return card


def _make_list(name, cards=None):
    lst = MagicMock()
    lst.name = name
    lst.list_cards.return_value = cards or []
    return lst


def _make_client(lists=None, members=None):
    client = MagicMock()
    all_lists = {}
    for lst in (lists or []):
        all_lists[lst.name] = lst
    client.get_lists.return_value = all_lists
    client.get_members.return_value = {m.username: m for m in (members or [])}
    return client


def test_velocity():
    alice = _make_member("alice")
    recent = datetime.now(timezone.utc) - timedelta(days=2)
    old = datetime.now(timezone.utc) - timedelta(days=10)
    card1 = _make_card("Done 1", members=[alice], date_last_activity=recent)
    card2 = _make_card("Done 2", members=[alice], date_last_activity=old)
    lists = [_make_list("Done", [card1, card2])]
    client = _make_client(lists=lists, members=[alice])

    tracker = DevTracker(client)
    result = tracker.velocity(days=7)
    assert result["alice"] == 1


def test_velocity_no_done_cards():
    alice = _make_member("alice")
    lists = [_make_list("Done", [])]
    client = _make_client(lists=lists, members=[alice])

    tracker = DevTracker(client)
    result = tracker.velocity(days=7)
    assert result["alice"] == 0


def test_stale_report():
    old = datetime.now(timezone.utc) - timedelta(hours=72)
    recent = datetime.now(timezone.utc) - timedelta(hours=1)
    past_due = datetime.now(timezone.utc) - timedelta(days=1)
    card1 = _make_card("Stale Card", date_last_activity=old)
    card2 = _make_card("Fresh Card", date_last_activity=recent)
    card3 = _make_card("Overdue Card", date_last_activity=recent, due=past_due)
    lists = [_make_list("This Week", [card1, card2, card3])]
    client = _make_client(lists=lists)

    tracker = DevTracker(client)
    report = tracker.stale_report()
    stale_names = [c["name"] for c in report["stale"]]
    overdue_names = [c["name"] for c in report["overdue"]]
    assert "Stale Card" in stale_names
    assert "Fresh Card" not in stale_names
    assert "Overdue Card" in overdue_names


def test_completion_summary():
    alice = _make_member("alice")
    bob = _make_member("bob")
    recent = datetime.now(timezone.utc) - timedelta(days=2)
    card1 = _make_card("D1", members=[alice], date_last_activity=recent)
    card2 = _make_card("D2", members=[alice], date_last_activity=recent)
    card3 = _make_card("D3", members=[bob], date_last_activity=recent)
    lists = [
        _make_list("Done", [card1, card2, card3]),
        _make_list("This Week", [_make_card("Active")]),
    ]
    client = _make_client(lists=lists, members=[alice, bob])

    tracker = DevTracker(client)
    summary = tracker.completion_summary(days=7)
    assert summary["total_completed"] == 3
    assert summary["by_member"]["alice"] == 2
    assert summary["by_member"]["bob"] == 1
```

**Step 2: Run test to verify it fails**

Run: `conda run -n deftrello pytest tests/test_track.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'deftrello.track'`

**Step 3: Write the implementation**

Create `deftrello/track.py`:

```python
"""Dev tracking — velocity, cycle time, completion stats, stale/overdue reports."""

from datetime import datetime, timezone, timedelta


class DevTracker:
    """Track development metrics across the Trello board."""

    def __init__(self, client):
        self.client = client

    def _get_done_cards(self):
        """Get cards from Done list(s)."""
        lists = self.client.get_lists()
        for name, lst in lists.items():
            if "Done" in name:
                return lst.list_cards()
        return []

    def _all_active_cards(self):
        """Get cards from active lists (not Done, not Reference)."""
        skip = {"Done", "Reference"}
        cards = []
        for name, lst in self.client.get_lists().items():
            if not any(s in name for s in skip):
                cards.extend(lst.list_cards())
        return cards

    def velocity(self, days=7):
        """Cards completed per member in the last N days.

        Returns: dict of {username: count}
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        done_cards = self._get_done_cards()
        recent = [c for c in done_cards if c.date_last_activity and c.date_last_activity > cutoff]

        members = self.client.get_members()
        counts = {username: 0 for username in members}

        for card in recent:
            for mid in (card.member_ids or []):
                for username, member in members.items():
                    if member.id == mid:
                        counts[username] += 1

        return counts

    def completion_summary(self, days=7):
        """Weekly summary: total completed, breakdown by member.

        Returns: {"total_completed": N, "by_member": {username: count}}
        """
        vel = self.velocity(days=days)
        return {
            "total_completed": sum(vel.values()),
            "by_member": vel,
        }

    def stale_report(self, hours=48):
        """Report stale and overdue cards.

        Returns: {"stale": [...], "overdue": [...]}
        """
        now = datetime.now(timezone.utc)
        cutoff = now - timedelta(hours=hours)
        cards = self._all_active_cards()

        stale = []
        overdue = []

        for card in cards:
            if card.date_last_activity and card.date_last_activity < cutoff:
                hours_stale = (now - card.date_last_activity).total_seconds() / 3600
                stale.append({
                    "name": card.name,
                    "id": card.id,
                    "hours_inactive": round(hours_stale),
                })

            if card.due_date and card.due_date < now:
                hours_overdue = (now - card.due_date).total_seconds() / 3600
                overdue.append({
                    "name": card.name,
                    "id": card.id,
                    "hours_overdue": round(hours_overdue),
                })

        return {"stale": stale, "overdue": overdue}

    def cycle_time(self, card):
        """Calculate how long a card took from creation to Done.

        Uses card actions to find the earliest createCard and
        latest updateCard:listAfter=Done action.
        Returns timedelta or None if not enough data.
        """
        actions = card.fetch_actions(action_filter="createCard,updateCard")
        created = None
        completed = None

        for action in actions:
            if action["type"] == "createCard":
                created = datetime.fromisoformat(action["date"].replace("Z", "+00:00"))
            if action["type"] == "updateCard":
                list_after = action.get("data", {}).get("listAfter", {}).get("name", "")
                if "Done" in list_after:
                    completed = datetime.fromisoformat(action["date"].replace("Z", "+00:00"))

        if created and completed:
            return completed - created
        return None
```

**Step 4: Run tests to verify they pass**

Run: `conda run -n deftrello pytest tests/test_track.py -v`
Expected: 4 passed

**Step 5: Commit**

```bash
git add deftrello/track.py tests/test_track.py
git commit -m "feat: add dev tracking module with velocity, completion, stale reports"
```

---

### Task 5: CLI module

**Files:**
- Create: `deftrello/cli.py`
- Create: `tests/test_cli.py`

**Step 1: Write the failing tests**

Create `tests/test_cli.py`:

```python
from unittest.mock import patch, MagicMock
from click.testing import CliRunner
from deftrello.cli import cli


def _mock_client():
    client = MagicMock()
    mock_list = MagicMock()
    mock_list.name = "This Week"
    mock_list.list_cards.return_value = []
    client.get_lists.return_value = {"This Week": mock_list}
    client.get_members.return_value = {}
    client.board = MagicMock()
    return client


@patch("deftrello.cli.DefTrelloClient")
def test_status_command(mock_client_cls):
    mock_client_cls.return_value = _mock_client()
    runner = CliRunner()
    result = runner.invoke(cli, ["status"])
    assert result.exit_code == 0
    assert "This Week" in result.output


@patch("deftrello.cli.DefTrelloClient")
def test_members_command(mock_client_cls):
    client = _mock_client()
    alice = MagicMock()
    alice.username = "alice"
    alice.id = "id_alice"
    client.get_members.return_value = {"alice": alice}
    mock_client_cls.return_value = client

    runner = CliRunner()
    result = runner.invoke(cli, ["members"])
    assert result.exit_code == 0
    assert "alice" in result.output


@patch("deftrello.cli.DefTrelloClient")
def test_assign_command(mock_client_cls):
    client = _mock_client()
    card = MagicMock()
    card.name = "Test Card"
    client.get_card.return_value = card
    alice = MagicMock()
    alice.username = "alice"
    alice.id = "id_alice"
    client.get_members.return_value = {"alice": alice}
    mock_client_cls.return_value = client

    runner = CliRunner()
    result = runner.invoke(cli, ["assign", "card123", "alice"])
    assert result.exit_code == 0
    card.assign.assert_called_once_with("id_alice")
```

**Step 2: Run test to verify it fails**

Run: `conda run -n deftrello pytest tests/test_cli.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'deftrello.cli'`

**Step 3: Write the implementation**

Create `deftrello/cli.py`:

```python
"""CLI entry points for deftrello commands."""

import click
from deftrello.client import DefTrelloClient
from deftrello.board import BoardQueries
from deftrello.assign import AssignmentManager
from deftrello.track import DevTracker


@click.group()
def cli():
    """DefTrello — ADHD Trello board management CLI."""
    pass


@cli.command()
def status():
    """Board overview: cards per list, overdue count."""
    client = DefTrelloClient()
    bq = BoardQueries(client)

    click.echo("Board Status")
    click.echo("=" * 40)
    for name, lst in client.get_lists().items():
        cards = lst.list_cards()
        click.echo(f"  {name}: {len(cards)} cards")

    overdue = bq.get_overdue_cards()
    if overdue:
        click.echo(f"\nOverdue: {len(overdue)} cards")
        for c in overdue:
            click.echo(f"  - {c.name}")


@cli.command()
def members():
    """List all board members with card counts."""
    client = DefTrelloClient()
    am = AssignmentManager(client)

    counts = am.list_members()
    click.echo("Team Workload")
    click.echo("=" * 40)
    for username, count in sorted(counts.items(), key=lambda x: -x[1]):
        click.echo(f"  {username}: {count} cards")


@cli.command()
@click.argument("card_id")
@click.argument("username")
def assign(card_id, username):
    """Assign a card to a team member."""
    client = DefTrelloClient()
    am = AssignmentManager(client)
    am.assign_card(card_id, username)
    card = client.get_card(card_id)
    click.echo(f"Assigned '{card.name}' to {username}")


@cli.command()
@click.argument("card_id")
@click.argument("to_username")
def reassign(card_id, to_username):
    """Reassign a card to a different member (removes all current, adds new)."""
    client = DefTrelloClient()
    am = AssignmentManager(client)
    am.unassign_card(card_id)
    am.assign_card(card_id, to_username)
    card = client.get_card(card_id)
    click.echo(f"Reassigned '{card.name}' to {to_username}")


@cli.command()
@click.argument("card_id")
def unassign(card_id):
    """Remove all members from a card."""
    client = DefTrelloClient()
    am = AssignmentManager(client)
    am.unassign_card(card_id)
    card = client.get_card(card_id)
    click.echo(f"Unassigned all members from '{card.name}'")


@cli.command()
def workload():
    """Show per-member workload breakdown by list."""
    client = DefTrelloClient()
    am = AssignmentManager(client)

    report = am.rebalance_report()
    click.echo("Workload Report")
    click.echo("=" * 40)
    for username, data in sorted(report.items(), key=lambda x: -x[1]["total"]):
        click.echo(f"\n  {username}: {data['total']} total")
        for list_name, count in data["by_list"].items():
            click.echo(f"    {list_name}: {count}")

    suggested = am.suggest_assignee()
    if suggested:
        click.echo(f"\nLightest load: {suggested}")


@cli.command()
@click.option("--days", default=7, help="Number of days to look back.")
def velocity(days):
    """Show completion velocity per member."""
    client = DefTrelloClient()
    tracker = DevTracker(client)

    summary = tracker.completion_summary(days=days)
    click.echo(f"Velocity (last {days} days)")
    click.echo("=" * 40)
    click.echo(f"  Total completed: {summary['total_completed']}")
    for username, count in sorted(summary["by_member"].items(), key=lambda x: -x[1]):
        click.echo(f"  {username}: {count}")


@cli.command()
def stale():
    """Show stale and overdue cards."""
    client = DefTrelloClient()
    tracker = DevTracker(client)

    report = tracker.stale_report()
    click.echo("Stale & Overdue Report")
    click.echo("=" * 40)

    if report["overdue"]:
        click.echo(f"\nOverdue ({len(report['overdue'])}):")
        for c in report["overdue"]:
            click.echo(f"  - {c['name']} ({c['hours_overdue']}h overdue)")
    else:
        click.echo("\nNo overdue cards.")

    if report["stale"]:
        click.echo(f"\nStale ({len(report['stale'])}):")
        for c in report["stale"]:
            click.echo(f"  - {c['name']} ({c['hours_inactive']}h inactive)")
    else:
        click.echo("\nNo stale cards.")


if __name__ == "__main__":
    cli()
```

**Step 4: Run tests to verify they pass**

Run: `conda run -n deftrello pytest tests/test_cli.py -v`
Expected: 3 passed

**Step 5: Commit**

```bash
git add deftrello/cli.py tests/test_cli.py
git commit -m "feat: add CLI with status, members, assign, reassign, unassign, workload, velocity, stale"
```

---

### Task 6: Run full test suite and wire up CLI entry point

**Files:**
- Modify: `deftrello/__init__.py`

**Step 1: Run all tests**

Run: `conda run -n deftrello pytest tests/ -v`
Expected: All tests pass (2 + 6 + 8 + 4 + 3 = 23 tests)

**Step 2: Verify CLI runs**

Run: `conda run -n deftrello python -m deftrello.cli --help`
Expected: Shows help text with all commands listed

**Step 3: Update __init__.py exports**

Update `deftrello/__init__.py`:

```python
"""DefTrello — Python SDK for ADHD Trello board management."""

from deftrello.client import DefTrelloClient
from deftrello.board import BoardQueries
from deftrello.assign import AssignmentManager
from deftrello.track import DevTracker

__all__ = ["DefTrelloClient", "BoardQueries", "AssignmentManager", "DevTracker"]
```

**Step 4: Run full test suite one final time**

Run: `conda run -n deftrello pytest tests/ -v --tb=short`
Expected: 23 passed

**Step 5: Commit**

```bash
git add deftrello/__init__.py
git commit -m "feat: wire up all module exports and verify full test suite"
```

---
