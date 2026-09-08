"""
Unit tests for the drift-anchor-capture pipeline in `_drift_common`.

Covers:
  - sanitize_user_prompt: harness markup stripping, synthetic-marker
    short-circuit, whitespace handling
  - is_acknowledgment_only: short-form approvals do not change scope
  - detect_pivot_intent: explicit new-task signals
  - classify_user_prompt: skip / pivot / update routing
  - render_scope_for_reminder: original + recent updates with truncation
  - build_anchor_capture_mutator: full mutator behaviour including
    schema migration, self-heal of poisoned anchors, pivot archiving,
    dedup of consecutive identical updates, and combined_scope rebuild
  - drift-anchor-capture.sh: Claude Code `user_prompt` and Codex `prompt`
    payload compatibility

Run with:
  cd ~/.codex/plugins/lore/hooks
  python3 -m unittest tests.test_drift_capture

Or:
  bash ~/.codex/plugins/lore/hooks/tests/run-tests.sh
"""

from __future__ import annotations

import os
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(_HERE))

from _drift_common import (  # noqa: E402
    SCHEMA_VERSION,
    agent_append_update,
    agent_clear_focus,
    agent_set_focus,
    build_anchor_capture_mutator,
    classify_user_prompt,
    detect_pivot_intent,
    ensure_schema,
    find_state_file_for_cwd,
    is_acknowledgment_only,
    read_state_for_cli,
    render_scope_for_reminder,
    sanitize_user_prompt,
)


class TestSanitizeUserPrompt(unittest.TestCase):
    def test_empty_returns_empty(self):
        self.assertEqual(sanitize_user_prompt(""), "")
        self.assertEqual(sanitize_user_prompt("   \n  "), "")

    def test_non_string_returns_empty(self):
        self.assertEqual(sanitize_user_prompt(None), "")
        self.assertEqual(sanitize_user_prompt(123), "")
        self.assertEqual(sanitize_user_prompt(["hi"]), "")

    def test_command_block_alone_strips_to_empty(self):
        text = (
            "<command-name>/effort</command-name>\n"
            "            <command-message>effort</command-message>\n"
            "            <command-args>max</command-args>"
        )
        self.assertEqual(sanitize_user_prompt(text), "")

    def test_command_block_with_trailing_question_keeps_question(self):
        text = (
            "<command-name>/foo</command-name>\n"
            "<command-args>bar</command-args>\n\n"
            "fix the bug in routers/auth.py"
        )
        self.assertEqual(
            sanitize_user_prompt(text),
            "fix the bug in routers/auth.py",
        )

    def test_local_command_stdout_stripped(self):
        text = (
            "<local-command-stdout>set effort to max</local-command-stdout>\n"
            "now help me debug the test failure"
        )
        self.assertEqual(
            sanitize_user_prompt(text),
            "now help me debug the test failure",
        )

    def test_local_command_caveat_stripped(self):
        text = (
            "<local-command-caveat>Caveat: don't respond</local-command-caveat>\n"
            "actually do respond please"
        )
        self.assertEqual(
            sanitize_user_prompt(text), "actually do respond please"
        )

    def test_synthetic_interrupt_marker_returns_empty(self):
        self.assertEqual(
            sanitize_user_prompt("[Request interrupted by user]"), ""
        )
        self.assertEqual(
            sanitize_user_prompt("[Request interrupted by user for tool use]"),
            "",
        )

    def test_synthetic_marker_with_whitespace_still_returns_empty(self):
        self.assertEqual(
            sanitize_user_prompt("\n  [Request interrupted by user]  \n"), ""
        )

    def test_multiple_blocks_all_stripped(self):
        text = (
            "<local-command-caveat>x</local-command-caveat>\n"
            "<command-name>/foo</command-name>\n"
            "<command-args>y</command-args>\n"
            "<local-command-stdout>z</local-command-stdout>\n"
            "real prompt content here"
        )
        self.assertEqual(sanitize_user_prompt(text), "real prompt content here")

    def test_multiline_content_inside_blocks_stripped(self):
        text = (
            "<command-args>line1\nline2\nline3</command-args>\n"
            "the actual prompt"
        )
        self.assertEqual(sanitize_user_prompt(text), "the actual prompt")

    def test_passthrough_normal_prompt(self):
        text = "help me fix the drift check"
        self.assertEqual(sanitize_user_prompt(text), "help me fix the drift check")


class TestIsAcknowledgmentOnly(unittest.TestCase):
    def test_short_acks_match(self):
        for s in [
            "ok",
            "OK",
            "okay.",
            "yes",
            "yep",
            "yeah!",
            "go ahead",
            "proceed",
            "continue",
            "looks good",
            "sounds good",
            "approved",
            "do it",
            "ship it",
            "lgtm",
            "sgtm",
        ]:
            self.assertTrue(
                is_acknowledgment_only(s),
                f"expected ack: {s!r}",
            )

    def test_substantive_text_starting_with_ack_does_not_match(self):
        # "yes go ahead" alone is an ack; "yes, also do X" is substantive.
        self.assertFalse(is_acknowledgment_only("yes, also handle the auth router"))
        self.assertFalse(is_acknowledgment_only("ok but actually fix the bug first"))
        self.assertFalse(is_acknowledgment_only("looks good - one more change"))

    def test_non_string_does_not_crash(self):
        self.assertFalse(is_acknowledgment_only(None))
        self.assertFalse(is_acknowledgment_only(0))


class TestDetectPivotIntent(unittest.TestCase):
    def test_explicit_pivots_match(self):
        for s in [
            "new task: refactor auth router",
            "Next task: write the migration",
            "now work on the cart router",
            "Now do the database tests",
            "now let's tackle the bug",
            "moving on to the dashboard",
            "switching to the frontend",
            "Switching gears to security",
            "let's now address the typo",
            "let's switch to the API tests",
            "let's pivot to the staging deploy",
            "forget that, focus on the linter",
            "forget all that — start fresh",
            "scope reset",
            "task reset",
            "reset scope",
            "reset the scope",
            "ignore above; do this instead",
            "ignore the above and start over",
            "pivot to the cart router",
            "new topic: cleanup",
        ]:
            self.assertTrue(detect_pivot_intent(s), f"expected pivot: {s!r}")

    def test_refinements_do_not_pivot(self):
        for s in [
            "also handle X",
            "actually, just fix the typo",
            "stop doing that — undo it",
            "don't touch the cleanup logic",
            "wait, the test is failing",
            "fix the bug first",
            "help me fix the drift check",
            "we need to address scope changes also",
        ]:
            self.assertFalse(detect_pivot_intent(s), f"unexpected pivot: {s!r}")


class TestClassifyUserPrompt(unittest.TestCase):
    def test_pure_command_skipped(self):
        kind, cleaned = classify_user_prompt(
            "<command-name>/effort</command-name>\n"
            "<command-args>max</command-args>"
        )
        self.assertEqual(kind, "skip")
        self.assertEqual(cleaned, "")

    def test_interrupt_marker_skipped(self):
        kind, cleaned = classify_user_prompt("[Request interrupted by user]")
        self.assertEqual(kind, "skip")
        self.assertEqual(cleaned, "")

    def test_acknowledgment_skipped(self):
        kind, cleaned = classify_user_prompt("ok go ahead")
        self.assertEqual(kind, "skip")
        self.assertEqual(cleaned, "")

    def test_substantive_classified_update(self):
        kind, cleaned = classify_user_prompt("help me fix the drift check")
        self.assertEqual(kind, "update")
        self.assertEqual(cleaned, "help me fix the drift check")

    def test_pivot_classified(self):
        kind, cleaned = classify_user_prompt("now work on the cart router")
        self.assertEqual(kind, "pivot")
        self.assertEqual(cleaned, "now work on the cart router")

    def test_command_plus_question_keeps_question(self):
        kind, cleaned = classify_user_prompt(
            "<command-name>/effort</command-name>\n"
            "<command-args>max</command-args>\n\n"
            "fix the drift hook"
        )
        self.assertEqual(kind, "update")
        self.assertEqual(cleaned, "fix the drift hook")


class TestRenderScopeForReminder(unittest.TestCase):
    def _state(self, **overrides):
        s = {
            "original_request": "help me fix the drift check",
            "scope_updates": [],
            "scope_history": [],
            "combined_scope": "help me fix the drift check",
        }
        s.update(overrides)
        return s

    def test_no_anchor_falls_back_to_combined(self):
        s = self._state(original_request=None, combined_scope="raw text only")
        self.assertEqual(render_scope_for_reminder(s), "raw text only")

    def test_no_anchor_no_combined_returns_empty(self):
        s = self._state(original_request=None, combined_scope=None)
        self.assertEqual(render_scope_for_reminder(s), "")

    def test_original_only_renders_quoted(self):
        out = render_scope_for_reminder(self._state())
        self.assertIn('ORIGINAL: "help me fix the drift check"', out)
        self.assertNotIn("UPDATES", out)

    def test_few_updates_render_inline(self):
        s = self._state(
            scope_updates=[
                {"msg_num": 2, "at": "2026-05-03T17:00:00Z", "text": "also handle pivots"},
                {"msg_num": 3, "at": "2026-05-03T17:05:00Z", "text": "and dedup duplicates"},
            ]
        )
        out = render_scope_for_reminder(s)
        self.assertIn("UPDATES:", out)
        # Author-aware tag: legacy entries without `author` default to user.
        self.assertIn("[user#2 @ 17:00:00] also handle pivots", out)
        self.assertIn("[user#3 @ 17:05:00] and dedup duplicates", out)

    def test_many_updates_truncate_to_last_three(self):
        updates = [
            {"msg_num": i, "at": f"2026-05-03T17:{i:02d}:00Z", "text": f"u{i}"}
            for i in range(1, 8)
        ]
        s = self._state(scope_updates=updates)
        out = render_scope_for_reminder(s, max_updates=3)
        self.assertIn("UPDATES (last 3 of 7):", out)
        self.assertIn("[user#5 @ 17:05:00] u5", out)
        self.assertIn("[user#6 @ 17:06:00] u6", out)
        self.assertIn("[user#7 @ 17:07:00] u7", out)
        self.assertNotIn("[user#1 @", out)
        self.assertNotIn("[user#4 @", out)

    def test_history_count_surfaced(self):
        s = self._state(scope_history=[{"reason": "pivot"}, {"reason": "pivot"}])
        out = render_scope_for_reminder(s)
        self.assertIn("(prior scopes archived: 2)", out)

    def test_long_render_truncated(self):
        s = self._state(original_request="x" * 2000)
        out = render_scope_for_reminder(s, max_chars=200)
        self.assertEqual(len(out), 200)
        self.assertTrue(out.endswith("..."))


class TestMutatorSchemaMigration(unittest.TestCase):
    def test_v1_state_upgraded_to_current(self):
        # v1: no schema_version field, just a few keys.
        state = {
            "session_id": "abc",
            "original_request": "old anchor",
            "tool_call_count": 5,
        }
        mutator = build_anchor_capture_mutator("any new prompt", "/cwd", "proj")
        mutator(state)
        self.assertEqual(state["schema_version"], SCHEMA_VERSION)
        self.assertIn("scope_history", state)
        self.assertIn("last_substantive_at", state)
        self.assertIn("scope_updates", state)
        self.assertIn("files_touched", state)

    def test_v2_state_upgraded(self):
        state = {
            "schema_version": 2,
            "session_id": "abc",
            "original_request": "old anchor",
            "scope_updates": [],
            "tool_call_count": 5,
        }
        mutator = build_anchor_capture_mutator("update text", "/cwd", "proj")
        mutator(state)
        self.assertEqual(state["schema_version"], SCHEMA_VERSION)
        self.assertIn("scope_history", state)


class TestMutatorSelfHeal(unittest.TestCase):
    def test_poisoned_anchor_is_archived_and_reset(self):
        # Existing anchor is pure slash-command markup → sanitizes to empty.
        poisoned = (
            "<command-name>/effort</command-name>\n"
            "<command-args>max</command-args>"
        )
        state = {
            "schema_version": 2,
            "session_id": "abc",
            "scope_nonce": "n" * 32,
            "original_request": poisoned,
            "scope_updates": [
                {"msg_num": 2, "at": "2026-05-03T17:00:00Z", "text": "noise"}
            ],
            "combined_scope": poisoned,
            "tool_call_count": 0,
            "user_message_count": 1,
        }
        mutator = build_anchor_capture_mutator(
            "the real first prompt", "/cwd", "proj"
        )
        mutator(state)
        # Poisoned anchor moved to history with the right reason.
        self.assertEqual(len(state["scope_history"]), 1)
        self.assertEqual(
            state["scope_history"][0]["reason"], "self_heal_poisoned_anchor"
        )
        self.assertEqual(
            state["scope_history"][0]["original_request"], poisoned
        )
        # New prompt promoted to anchor, since post-heal original_request
        # was None and the kind is 'update'.
        self.assertEqual(state["original_request"], "the real first prompt")
        self.assertEqual(state["combined_scope"], "the real first prompt")
        self.assertEqual(state["scope_updates"], [])

    def test_clean_anchor_not_touched(self):
        state = {
            "schema_version": 3,
            "session_id": "abc",
            "scope_nonce": "n" * 32,
            "original_request": "real anchor",
            "scope_updates": [],
            "scope_history": [],
            "combined_scope": "real anchor",
            "tool_call_count": 0,
            "user_message_count": 1,
        }
        mutator = build_anchor_capture_mutator("ok", "/cwd", "proj")
        mutator(state)
        self.assertEqual(state["original_request"], "real anchor")
        self.assertEqual(state["scope_history"], [])

    def test_self_heal_with_skip_kind_leaves_anchor_unset(self):
        # If we self-heal AND the new prompt is "skip" (e.g. another
        # slash command), original_request stays None waiting for a
        # real prompt next.
        poisoned = "<command-name>/foo</command-name>"
        state = {
            "schema_version": 2,
            "session_id": "abc",
            "scope_nonce": "n" * 32,
            "original_request": poisoned,
            "scope_updates": [],
            "combined_scope": poisoned,
            "tool_call_count": 0,
            "user_message_count": 1,
        }
        mutator = build_anchor_capture_mutator(
            "<command-name>/another</command-name>", "/cwd", "proj"
        )
        mutator(state)
        self.assertIsNone(state["original_request"])
        self.assertEqual(len(state["scope_history"]), 1)


class TestMutatorAnchoring(unittest.TestCase):
    def _fresh_state(self):
        # Mirror the shape produced by `_new_state()` so tests exercise
        # the same field set the production capture path sees.
        return {
            "schema_version": 3,
            "session_id": "abc",
            "scope_nonce": "n" * 32,
            "project": "/cwd",
            "project_name": "proj",
            "created_at": "2026-05-03T18:00:00Z",
            "original_request": None,
            "scope_updates": [],
            "scope_history": [],
            "combined_scope": None,
            "scope_version": 0,
            "tool_call_count": 0,
            "last_drift_check_at": 0,
            "files_touched": [],
            "user_message_count": 0,
            "drift_checks_performed": 0,
            "stop_events": [],
            "anchor_set_at": None,
            "last_substantive_at": None,
        }

    def test_first_substantive_becomes_anchor(self):
        state = self._fresh_state()
        mutator = build_anchor_capture_mutator(
            "fix the drift hook", "/cwd", "proj"
        )
        mutator(state)
        self.assertEqual(state["original_request"], "fix the drift hook")
        self.assertEqual(state["combined_scope"], "fix the drift hook")
        self.assertEqual(state["scope_version"], 1)
        self.assertIsNotNone(state["anchor_set_at"])
        self.assertIsNotNone(state["last_substantive_at"])

    def test_skip_does_not_anchor(self):
        state = self._fresh_state()
        mutator = build_anchor_capture_mutator(
            "<command-name>/effort</command-name>", "/cwd", "proj"
        )
        mutator(state)
        self.assertIsNone(state["original_request"])
        self.assertEqual(state["scope_version"], 0)

    def test_pure_ack_does_not_anchor(self):
        state = self._fresh_state()
        mutator = build_anchor_capture_mutator("ok", "/cwd", "proj")
        mutator(state)
        self.assertIsNone(state["original_request"])

    def test_command_plus_question_anchors_question_only(self):
        state = self._fresh_state()
        prompt = (
            "<command-name>/foo</command-name>\n"
            "<command-args>x</command-args>\n\n"
            "actual ask: fix the bug"
        )
        mutator = build_anchor_capture_mutator(prompt, "/cwd", "proj")
        mutator(state)
        self.assertEqual(state["original_request"], "actual ask: fix the bug")


class TestMutatorPivot(unittest.TestCase):
    def _anchored_state(self):
        return {
            "schema_version": 3,
            "session_id": "abc",
            "scope_nonce": "n" * 32,
            "original_request": "first task",
            "scope_updates": [
                {"msg_num": 2, "at": "2026-05-03T17:00:00Z", "text": "refine"}
            ],
            "scope_history": [],
            "combined_scope": "first task\n[Update #2]: refine",
            "scope_version": 2,
            "tool_call_count": 5,
            "user_message_count": 2,
        }

    def test_pivot_archives_and_reanchors(self):
        state = self._anchored_state()
        mutator = build_anchor_capture_mutator(
            "now work on the cart router", "/cwd", "proj"
        )
        mutator(state)
        self.assertEqual(state["original_request"], "now work on the cart router")
        self.assertEqual(state["scope_updates"], [])
        self.assertEqual(state["combined_scope"], "now work on the cart router")
        self.assertEqual(len(state["scope_history"]), 1)
        archived = state["scope_history"][0]
        self.assertEqual(archived["reason"], "pivot")
        self.assertEqual(archived["original_request"], "first task")
        self.assertEqual(len(archived["scope_updates"]), 1)
        self.assertEqual(archived["scope_updates"][0]["text"], "refine")

    def test_pivot_when_no_anchor_just_anchors(self):
        state = {
            "schema_version": 3,
            "session_id": "abc",
            "scope_nonce": "n" * 32,
            "original_request": None,
            "scope_updates": [],
            "scope_history": [],
            "combined_scope": None,
            "tool_call_count": 0,
            "user_message_count": 0,
        }
        mutator = build_anchor_capture_mutator(
            "new task: write the migration", "/cwd", "proj"
        )
        mutator(state)
        # Treated as pivot, but archive list stays empty since there
        # was nothing prior to archive.
        self.assertEqual(
            state["original_request"], "new task: write the migration"
        )
        self.assertEqual(state["scope_history"], [])


class TestMutatorUpdates(unittest.TestCase):
    def _state(self):
        return {
            "schema_version": 3,
            "session_id": "abc",
            "scope_nonce": "n" * 32,
            "original_request": "fix the drift hook",
            "scope_updates": [],
            "scope_history": [],
            "combined_scope": "fix the drift hook",
            "scope_version": 1,
            "tool_call_count": 0,
            "user_message_count": 1,
            "anchor_set_at": "2026-05-03T18:00:00Z",
        }

    def test_substantive_appends_update(self):
        state = self._state()
        mutator = build_anchor_capture_mutator(
            "also handle scope changes", "/cwd", "proj"
        )
        mutator(state)
        self.assertEqual(len(state["scope_updates"]), 1)
        self.assertEqual(
            state["scope_updates"][0]["text"], "also handle scope changes"
        )
        self.assertIn("[Update #2]: also handle scope changes", state["combined_scope"])
        self.assertEqual(state["scope_version"], 2)

    def test_dedup_consecutive_identical_update(self):
        state = self._state()
        m1 = build_anchor_capture_mutator("don't touch the tests", "/cwd", "proj")
        m1(state)
        version_after_first = state["scope_version"]
        msg_count_after_first = state["user_message_count"]
        # Second identical prompt → skipped (no append, no version bump).
        m2 = build_anchor_capture_mutator("don't touch the tests", "/cwd", "proj")
        m2(state)
        self.assertEqual(len(state["scope_updates"]), 1)
        self.assertEqual(state["scope_version"], version_after_first)
        # user_message_count is incremented even when dedup'd, because
        # the user did send a message — what's deduped is the scope
        # update, not the count of submissions.
        self.assertEqual(state["user_message_count"], msg_count_after_first + 1)

    def test_distinct_consecutive_updates_both_kept(self):
        state = self._state()
        for prompt in ["update one", "update two", "update three"]:
            build_anchor_capture_mutator(prompt, "/cwd", "proj")(state)
        self.assertEqual(len(state["scope_updates"]), 3)
        self.assertEqual(
            [u["text"] for u in state["scope_updates"]],
            ["update one", "update two", "update three"],
        )

    def test_combined_scope_includes_all_updates(self):
        state = self._state()
        for prompt in ["a", "b", "c"]:
            # Note: short prompts. classify still routes to "update" since
            # they're not skip/pivot/ack.
            build_anchor_capture_mutator("substantive " + prompt, "/cwd", "proj")(state)
        self.assertIn("substantive a", state["combined_scope"])
        self.assertIn("substantive b", state["combined_scope"])
        self.assertIn("substantive c", state["combined_scope"])

    def test_updates_capped_at_keep_window(self):
        from _drift_common import SCOPE_UPDATES_KEEP

        state = self._state()
        for i in range(SCOPE_UPDATES_KEEP + 5):
            build_anchor_capture_mutator(f"update {i:03d}", "/cwd", "proj")(state)
        self.assertEqual(len(state["scope_updates"]), SCOPE_UPDATES_KEEP)
        # Oldest entries dropped, newest kept.
        self.assertEqual(
            state["scope_updates"][-1]["text"],
            f"update {SCOPE_UPDATES_KEEP + 4:03d}",
        )


class TestEndToEndScenarios(unittest.TestCase):
    """Walk through scenarios that mirror the real bug reports."""

    def test_session_starting_with_slash_command_then_real_prompt(self):
        # Mirrors the live session: first user message is /effort max,
        # second is the real ask.
        state = {
            "schema_version": 3,
            "session_id": "abc",
            "scope_nonce": "n" * 32,
            "project": "/cwd",
            "project_name": "proj",
            "created_at": "2026-05-03T18:00:00Z",
            "original_request": None,
            "scope_updates": [],
            "scope_history": [],
            "combined_scope": None,
            "scope_version": 0,
            "tool_call_count": 0,
            "last_drift_check_at": 0,
            "files_touched": [],
            "user_message_count": 0,
            "drift_checks_performed": 0,
            "stop_events": [],
            "anchor_set_at": None,
            "last_substantive_at": None,
        }
        # Prompt 1: pure slash command → skipped, no anchor.
        build_anchor_capture_mutator(
            "<command-name>/effort</command-name>\n"
            "<command-args>max</command-args>",
            "/cwd",
            "proj",
        )(state)
        self.assertIsNone(state["original_request"])
        # Prompt 2: real first request → anchored.
        build_anchor_capture_mutator(
            "help me fix the drift check", "/cwd", "proj"
        )(state)
        self.assertEqual(state["original_request"], "help me fix the drift check")
        # Prompt 3: scope refinement → appended.
        build_anchor_capture_mutator(
            "we need to address scope changes via later interactions also",
            "/cwd",
            "proj",
        )(state)
        self.assertEqual(len(state["scope_updates"]), 1)
        # Prompt 4: pivot → archives previous scope.
        build_anchor_capture_mutator(
            "now work on the auth router instead", "/cwd", "proj"
        )(state)
        self.assertEqual(state["original_request"], "now work on the auth router instead")
        self.assertEqual(state["scope_updates"], [])
        self.assertEqual(len(state["scope_history"]), 1)
        self.assertEqual(state["scope_history"][0]["reason"], "pivot")

    def test_pre_fix_session_recovers_via_self_heal(self):
        # Simulates a state file written by the buggy hook: original
        # is slash-command markup, scope_updates contain interrupt
        # markers (which the OLD hook accepted but the new sanitizer
        # rejects on entry).
        state = {
            "schema_version": 2,
            "session_id": "abc",
            "scope_nonce": "n" * 32,
            "original_request": (
                "<command-name>/effort</command-name>\n"
                "<command-args>max</command-args>"
            ),
            "scope_updates": [
                {
                    "msg_num": 2,
                    "at": "2026-05-03T17:00:00Z",
                    "text": "[Request interrupted by user]",
                },
            ],
            "scope_history": [],
            "combined_scope": "<command-name>/effort</command-name>...",
            "scope_version": 2,
            "tool_call_count": 100,
            "user_message_count": 2,
        }
        # Next user message arrives — self-heal triggers.
        build_anchor_capture_mutator(
            "help me fix the drift check", "/cwd", "proj"
        )(state)
        self.assertEqual(
            state["original_request"], "help me fix the drift check"
        )
        self.assertEqual(state["scope_updates"], [])
        self.assertEqual(len(state["scope_history"]), 1)
        self.assertEqual(
            state["scope_history"][0]["reason"], "self_heal_poisoned_anchor"
        )


class TestEnsureSchema(unittest.TestCase):
    """The migration helper must be idempotent and complete."""

    def test_v1_state_gets_full_v4_schema(self):
        state = {"session_id": "s", "original_request": "old"}
        ensure_schema(state)
        # Every field _new_state produces should now exist.
        for key in (
            "schema_version",
            "scope_updates",
            "scope_history",
            "files_touched",
            "stop_events",
            "drift_checks_performed",
            "user_message_count",
            "tool_call_count",
            "last_drift_check_at",
            "scope_version",
            "combined_scope",
            "last_substantive_at",
            "agent_focus",
            "agent_update_count",
            "scope_nonce",
        ):
            self.assertIn(key, state, f"missing key after migration: {key}")
        self.assertEqual(state["schema_version"], SCHEMA_VERSION)

    def test_v2_state_upgraded_keeps_existing_values(self):
        state = {
            "schema_version": 2,
            "session_id": "s",
            "scope_nonce": "n" * 32,
            "original_request": "anchor",
            "scope_updates": [{"msg_num": 2, "text": "x"}],
            "user_message_count": 5,
            "tool_call_count": 99,
        }
        ensure_schema(state)
        self.assertEqual(state["schema_version"], SCHEMA_VERSION)
        # New fields added with defaults.
        self.assertIsNone(state["agent_focus"])
        self.assertEqual(state["agent_update_count"], 0)
        # Existing values preserved.
        self.assertEqual(state["original_request"], "anchor")
        self.assertEqual(state["user_message_count"], 5)
        self.assertEqual(state["tool_call_count"], 99)
        self.assertEqual(len(state["scope_updates"]), 1)

    def test_idempotent_at_current_version(self):
        state = {"session_id": "s", "schema_version": SCHEMA_VERSION}
        before = dict(state)
        ensure_schema(state)
        # Already at current → no-op.
        self.assertEqual(state, before)


class TestAgentUpdateRendering(unittest.TestCase):
    """Renderer must distinguish user vs agent updates and surface focus."""

    def _state_with_mixed_updates(self):
        return {
            "schema_version": SCHEMA_VERSION,
            "session_id": "s",
            "scope_nonce": "n" * 32,
            "original_request": "fix the drift hook",
            "scope_updates": [
                {
                    "msg_num": 2,
                    "at": "2026-05-03T17:00:00Z",
                    "text": "also handle pivots",
                    "author": "user",
                },
                {
                    "msg_num": 2,
                    "agent_msg_num": 1,
                    "at": "2026-05-03T17:01:00Z",
                    "text": "narrowing to capture-time fixes only",
                    "author": "agent",
                },
                {
                    "msg_num": 3,
                    "at": "2026-05-03T17:05:00Z",
                    "text": "include dedup",
                    "author": "user",
                },
            ],
            "scope_history": [],
            "combined_scope": "ignored",
            "agent_focus": None,
        }

    def test_user_and_agent_updates_render_distinctly(self):
        out = render_scope_for_reminder(self._state_with_mixed_updates())
        self.assertIn("[user#2 @ 17:00:00] also handle pivots", out)
        self.assertIn("[agent#1 @ 17:01:00] narrowing to capture-time fixes only", out)
        self.assertIn("[user#3 @ 17:05:00] include dedup", out)

    def test_legacy_entries_without_author_default_to_user(self):
        state = {
            "schema_version": SCHEMA_VERSION,
            "session_id": "s",
            "scope_nonce": "n" * 32,
            "original_request": "anchor",
            "scope_updates": [
                {"msg_num": 2, "at": "2026-05-03T17:00:00Z", "text": "no author field"}
            ],
            "scope_history": [],
            "agent_focus": None,
        }
        out = render_scope_for_reminder(state)
        self.assertIn("[user#2 @ 17:00:00] no author field", out)

    def test_agent_focus_surfaced_with_section(self):
        state = self._state_with_mixed_updates()
        state["agent_focus"] = {
            "at": "2026-05-03T17:30:00Z",
            "focus": "implementing the contest CLI",
            "justification": "drift reminder shows old anchor but user pivoted",
        }
        out = render_scope_for_reminder(state)
        self.assertIn("AGENT FOCUS (contest @ 17:30:00):", out)
        self.assertIn('current: "implementing the contest CLI"', out)
        self.assertIn("why: drift reminder shows old anchor but user pivoted", out)

    def test_agent_focus_with_empty_focus_field_not_rendered(self):
        state = self._state_with_mixed_updates()
        state["agent_focus"] = {"at": "2026-05-03T17:30:00Z", "focus": "", "justification": ""}
        out = render_scope_for_reminder(state)
        self.assertNotIn("AGENT FOCUS", out)


class TestAgentAppendUpdate(unittest.TestCase):
    """End-to-end: agent_append_update against a real state file."""

    def _setup_state_file(self, tmpdir):
        import hashlib

        sid = "agent-test-aaaa"
        cwd = str(tmpdir / "fake-proj")
        os.makedirs(cwd, exist_ok=True)
        project_hash = hashlib.sha256(cwd.encode()).hexdigest()[:8]
        state_dir = tmpdir / ".claude" / "drift-state" / f"fake-proj-{project_hash}"
        os.makedirs(str(state_dir), exist_ok=True)
        state_path = str(state_dir / f"{sid}.json")
        # Pre-populated state: user has already anchored.
        import secrets

        state = {
            "schema_version": 3,
            "session_id": sid,
            "scope_nonce": secrets.token_hex(16),
            "project": cwd,
            "project_name": "fake-proj",
            "created_at": "2026-05-03T18:00:00Z",
            "original_request": "fix the drift hook",
            "scope_updates": [],
            "scope_history": [],
            "combined_scope": "fix the drift hook",
            "scope_version": 1,
            "tool_call_count": 5,
            "last_drift_check_at": 0,
            "files_touched": [],
            "user_message_count": 1,
            "drift_checks_performed": 0,
            "stop_events": [],
            "anchor_set_at": "2026-05-03T18:00:00Z",
            "last_substantive_at": "2026-05-03T18:00:00Z",
        }
        import json

        with open(state_path, "w") as f:
            json.dump(state, f)
        return state_path, sid, cwd

    def test_append_agent_update_sets_author_and_counter(self):
        from pathlib import Path
        import json
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmpdir = Path(tmp)
            os.environ["HOME"] = str(tmpdir)  # for any HOME-relative paths
            # Override DRIFT_ROOT for this test by writing state to the
            # same location find_state_file_for_cwd will look.
            state_path, sid, cwd = self._setup_state_file(tmpdir)
            # Move the state into the home-rooted drift dir so update_state
            # writes to the same file.
            import _drift_common

            saved_root = _drift_common.DRIFT_ROOT
            _drift_common.DRIFT_ROOT = str(tmpdir / ".claude" / "drift-state")
            try:
                ok = agent_append_update(
                    state_path, sid, "narrowed scope to capture only", cwd
                )
                self.assertTrue(ok)
                with open(state_path) as f:
                    state = json.load(f)
                self.assertEqual(len(state["scope_updates"]), 1)
                upd = state["scope_updates"][0]
                self.assertEqual(upd["author"], "agent")
                self.assertEqual(upd["agent_msg_num"], 1)
                self.assertEqual(upd["text"], "narrowed scope to capture only")
                self.assertEqual(state["agent_update_count"], 1)
                # combined_scope must include the agent tag.
                self.assertIn("[Agent #1]:", state["combined_scope"])
                self.assertIn("narrowed scope to capture only", state["combined_scope"])
                # User counters NOT bumped by agent update.
                self.assertEqual(state["user_message_count"], 1)
                self.assertEqual(state["scope_version"], 1)
            finally:
                _drift_common.DRIFT_ROOT = saved_root

    def test_append_dedups_consecutive_identical_agent_text(self):
        from pathlib import Path
        import json
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmpdir = Path(tmp)
            os.environ["HOME"] = str(tmpdir)
            state_path, sid, cwd = self._setup_state_file(tmpdir)
            import _drift_common

            saved_root = _drift_common.DRIFT_ROOT
            _drift_common.DRIFT_ROOT = str(tmpdir / ".claude" / "drift-state")
            try:
                self.assertTrue(agent_append_update(state_path, sid, "same note", cwd))
                # Second identical → dedup, but call still returns True
                # because update_state succeeded (mutator just no-op'd).
                self.assertTrue(agent_append_update(state_path, sid, "same note", cwd))
                with open(state_path) as f:
                    state = json.load(f)
                self.assertEqual(len(state["scope_updates"]), 1)
                self.assertEqual(state["agent_update_count"], 1)
            finally:
                _drift_common.DRIFT_ROOT = saved_root

    def test_append_rejects_pure_command_markup(self):
        from pathlib import Path
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmpdir = Path(tmp)
            os.environ["HOME"] = str(tmpdir)
            state_path, sid, cwd = self._setup_state_file(tmpdir)
            ok = agent_append_update(
                state_path,
                sid,
                "<command-name>/foo</command-name>",
                cwd,
            )
            self.assertFalse(ok)


class TestAgentFocus(unittest.TestCase):
    """agent_set_focus + agent_clear_focus against a real state file."""

    def _setup_state_file(self, tmpdir):
        import hashlib
        import json
        import secrets

        sid = "focus-test-bbbb"
        cwd = str(tmpdir / "focus-proj")
        os.makedirs(cwd, exist_ok=True)
        project_hash = hashlib.sha256(cwd.encode()).hexdigest()[:8]
        state_dir = tmpdir / ".claude" / "drift-state" / f"focus-proj-{project_hash}"
        os.makedirs(str(state_dir), exist_ok=True)
        state_path = str(state_dir / f"{sid}.json")
        state = {
            "schema_version": 3,
            "session_id": sid,
            "scope_nonce": secrets.token_hex(16),
            "project": cwd,
            "project_name": "focus-proj",
            "created_at": "2026-05-03T18:00:00Z",
            "original_request": "task A",
            "scope_updates": [],
            "scope_history": [],
            "combined_scope": "task A",
            "scope_version": 1,
            "tool_call_count": 0,
            "last_drift_check_at": 0,
            "files_touched": [],
            "user_message_count": 1,
            "drift_checks_performed": 0,
            "stop_events": [],
            "anchor_set_at": "2026-05-03T18:00:00Z",
            "last_substantive_at": "2026-05-03T18:00:00Z",
        }
        with open(state_path, "w") as f:
            json.dump(state, f)
        return state_path, sid, cwd

    def test_set_focus_writes_dict(self):
        from pathlib import Path
        import json
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmpdir = Path(tmp)
            os.environ["HOME"] = str(tmpdir)
            state_path, sid, cwd = self._setup_state_file(tmpdir)
            import _drift_common

            saved_root = _drift_common.DRIFT_ROOT
            _drift_common.DRIFT_ROOT = str(tmpdir / ".claude" / "drift-state")
            try:
                ok = agent_set_focus(
                    state_path,
                    sid,
                    "doing the right thing",
                    "drift reminder is stale",
                    cwd,
                )
                self.assertTrue(ok)
                with open(state_path) as f:
                    state = json.load(f)
                focus = state["agent_focus"]
                self.assertIsNotNone(focus)
                self.assertEqual(focus["focus"], "doing the right thing")
                self.assertEqual(focus["justification"], "drift reminder is stale")
                self.assertIn("at", focus)
            finally:
                _drift_common.DRIFT_ROOT = saved_root

    def test_set_focus_rejects_empty_focus(self):
        from pathlib import Path
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmpdir = Path(tmp)
            os.environ["HOME"] = str(tmpdir)
            state_path, sid, cwd = self._setup_state_file(tmpdir)
            ok = agent_set_focus(state_path, sid, "", "anything", cwd)
            self.assertFalse(ok)

    def test_clear_focus_resets_to_none(self):
        from pathlib import Path
        import json
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmpdir = Path(tmp)
            os.environ["HOME"] = str(tmpdir)
            state_path, sid, cwd = self._setup_state_file(tmpdir)
            import _drift_common

            saved_root = _drift_common.DRIFT_ROOT
            _drift_common.DRIFT_ROOT = str(tmpdir / ".claude" / "drift-state")
            try:
                agent_set_focus(state_path, sid, "f", "j", cwd)
                self.assertTrue(agent_clear_focus(state_path, sid, cwd))
                with open(state_path) as f:
                    state = json.load(f)
                self.assertIsNone(state["agent_focus"])
            finally:
                _drift_common.DRIFT_ROOT = saved_root


class TestFindStateFileForCwd(unittest.TestCase):
    def test_returns_none_when_no_project_dir(self):
        from pathlib import Path
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            cwd = str(Path(tmp) / "no-such-project")
            result = find_state_file_for_cwd(
                cwd, drift_dir=str(Path(tmp) / "drift-state")
            )
            self.assertIsNone(result)

    def test_finds_by_nonce_prefix(self):
        from pathlib import Path
        import hashlib
        import json
        import secrets
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmpdir = Path(tmp)
            cwd = str(tmpdir / "proj")
            project_hash = hashlib.sha256(cwd.encode()).hexdigest()[:8]
            drift_dir = str(tmpdir / "drift-state")
            project_dir = Path(drift_dir) / f"proj-{project_hash}"
            project_dir.mkdir(parents=True)
            # Two sessions, different nonces.
            for sid, nonce in [
                ("aaaaaaaa-1111-2222-3333-444444444444", "abcd1234" + "0" * 24),
                ("bbbbbbbb-1111-2222-3333-444444444444", "ef567890" + "0" * 24),
            ]:
                with open(project_dir / f"{sid}.json", "w") as f:
                    json.dump(
                        {"session_id": sid, "scope_nonce": nonce}, f
                    )
            # Find by exact nonce prefix.
            result = find_state_file_for_cwd(cwd, "abcd1234", drift_dir=drift_dir)
            self.assertIsNotNone(result)
            _, sid = result
            self.assertTrue(sid.startswith("aaaa"))
            result2 = find_state_file_for_cwd(cwd, "ef567890", drift_dir=drift_dir)
            self.assertIsNotNone(result2)
            _, sid2 = result2
            self.assertTrue(sid2.startswith("bbbb"))

    def test_require_nonce_without_nonce_returns_none(self):
        from pathlib import Path
        import hashlib
        import json
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmpdir = Path(tmp)
            cwd = str(tmpdir / "proj")
            project_hash = hashlib.sha256(cwd.encode()).hexdigest()[:8]
            drift_dir = str(tmpdir / "drift-state")
            project_dir = Path(drift_dir) / f"proj-{project_hash}"
            project_dir.mkdir(parents=True)
            sid = "ssssssss-1111-2222-3333-444444444444"
            with open(project_dir / f"{sid}.json", "w") as f:
                json.dump({"session_id": sid, "scope_nonce": "x" * 32}, f)
            result = find_state_file_for_cwd(
                cwd, None, require_nonce=True, drift_dir=drift_dir
            )
            self.assertIsNone(result)

    def test_no_nonce_returns_most_recent(self):
        from pathlib import Path
        import hashlib
        import json
        import os as _os
        import tempfile
        import time

        with tempfile.TemporaryDirectory() as tmp:
            tmpdir = Path(tmp)
            cwd = str(tmpdir / "proj")
            project_hash = hashlib.sha256(cwd.encode()).hexdigest()[:8]
            drift_dir = str(tmpdir / "drift-state")
            project_dir = Path(drift_dir) / f"proj-{project_hash}"
            project_dir.mkdir(parents=True)
            older_sid = "oldold00-1111-2222-3333-444444444444"
            newer_sid = "newnew00-1111-2222-3333-444444444444"
            with open(project_dir / f"{older_sid}.json", "w") as f:
                json.dump({"session_id": older_sid, "scope_nonce": "1" * 32}, f)
            time.sleep(0.05)
            with open(project_dir / f"{newer_sid}.json", "w") as f:
                json.dump({"session_id": newer_sid, "scope_nonce": "2" * 32}, f)
            # Force older mtime to be older.
            old_path = str(project_dir / f"{older_sid}.json")
            old_mtime = _os.path.getmtime(old_path) - 100
            _os.utime(old_path, (old_mtime, old_mtime))
            result = find_state_file_for_cwd(cwd, drift_dir=drift_dir)
            self.assertIsNotNone(result)
            _, sid = result
            self.assertEqual(sid, newer_sid)

    def test_rejects_files_with_mismatched_session_id(self):
        from pathlib import Path
        import hashlib
        import json
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            tmpdir = Path(tmp)
            cwd = str(tmpdir / "proj")
            project_hash = hashlib.sha256(cwd.encode()).hexdigest()[:8]
            drift_dir = str(tmpdir / "drift-state")
            project_dir = Path(drift_dir) / f"proj-{project_hash}"
            project_dir.mkdir(parents=True)
            # File whose name says session A but content says B → orphan.
            with open(project_dir / "ssssssss-1111-2222-3333-444444444444.json", "w") as f:
                json.dump({"session_id": "WRONG-ID", "scope_nonce": "x" * 32}, f)
            result = find_state_file_for_cwd(cwd, drift_dir=drift_dir)
            self.assertIsNone(result)


class TestReadStateForCli(unittest.TestCase):
    def test_returns_state_when_session_id_matches(self):
        from pathlib import Path
        import json
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            path = str(Path(tmp) / "s.json")
            sid = "ssssssss-1111-2222-3333-444444444444"
            with open(path, "w") as f:
                json.dump({"session_id": sid, "schema_version": 4}, f)
            state = read_state_for_cli(path, sid)
            self.assertIsNotNone(state)
            self.assertEqual(state["schema_version"], 4)

    def test_returns_none_on_session_mismatch(self):
        from pathlib import Path
        import json
        import tempfile

        with tempfile.TemporaryDirectory() as tmp:
            path = str(Path(tmp) / "s.json")
            with open(path, "w") as f:
                json.dump({"session_id": "X", "schema_version": 4}, f)
            self.assertIsNone(read_state_for_cli(path, "Y"))

    def test_returns_none_on_missing_file(self):
        self.assertIsNone(read_state_for_cli("/nonexistent/path.json", "anything"))


class TestAnchorCaptureHookCompatibility(unittest.TestCase):
    def test_codex_prompt_field_establishes_scope(self):
        hook_path = Path(_HERE).parent / "drift-anchor-capture.sh"
        session_id = "codex-session-123"
        submitted_prompt = "fix drift scope compatibility"

        with tempfile.TemporaryDirectory() as tmp:
            home = Path(tmp) / "home"
            cwd = Path(tmp) / "project"
            home.mkdir()
            cwd.mkdir()
            payload = {
                "session_id": session_id,
                "transcript_path": None,
                "cwd": str(cwd),
                "hook_event_name": "UserPromptSubmit",
                "model": "gpt-5.6-sol",
                "permission_mode": "default",
                "prompt": submitted_prompt,
                "turn_id": "turn-123",
            }
            env = os.environ.copy()
            env["HOME"] = str(home)

            result = subprocess.run(
                [str(hook_path)],
                input=json.dumps(payload),
                text=True,
                capture_output=True,
                env=env,
                check=False,
            )

            self.assertEqual(result.returncode, 0, result.stderr)
            project_hash = hashlib.sha256(str(cwd).encode("utf-8")).hexdigest()[:8]
            state_path = (
                home
                / ".claude"
                / "drift-state"
                / f"{cwd.name}-{project_hash}"
                / f"{session_id}.json"
            )
            self.assertTrue(state_path.exists())
            state = json.loads(state_path.read_text())
            self.assertEqual(state["original_request"], submitted_prompt)
            self.assertEqual(state["combined_scope"], submitted_prompt)
            self.assertEqual(state["scope_version"], 1)


if __name__ == "__main__":
    unittest.main()
