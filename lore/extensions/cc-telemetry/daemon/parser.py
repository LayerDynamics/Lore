#!/usr/bin/env python3
"""
Parse Claude Code transcript JSONL entries into telemetry events.

Transcript format (one JSON object per line):
  - type="assistant": message.content[] has tool_use blocks (id, name, input)
  - type="user":      message.content[] has tool_result blocks (tool_use_id, content)
                      and text blocks (user messages)
  - type="progress":  data.type="hook_progress", data.hookEvent, data.hookName, data.command
  - type="file-history-snapshot": ignore
"""

import json
import logging
from datetime import datetime, timezone
from typing import Optional

import db

logger = logging.getLogger("cc_telemetry.parser")


def _ts_diff_ms(start_ts: str, end_ts: str) -> Optional[int]:
    """Compute millisecond difference between two ISO timestamps."""
    try:
        t1 = datetime.fromisoformat(start_ts.replace("Z", "+00:00"))
        t2 = datetime.fromisoformat(end_ts.replace("Z", "+00:00"))
        return int((t2 - t1).total_seconds() * 1000)
    except Exception:
        return None


def _truncate(text: str, max_len: int = 500) -> Optional[str]:
    if not text:
        return None
    if len(text) > max_len:
        return text[:max_len] + f"…[+{len(text)-max_len}]"
    return text


def _extract_text(content) -> str:
    """Extract plain text from a content value (str or list of blocks)."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict):
                if block.get("type") == "text":
                    parts.append(block.get("text", ""))
                elif "text" in block:
                    parts.append(block["text"])
        return " ".join(parts)
    return str(content) if content else ""


class TranscriptParser:
    """
    Stateful parser for a single transcript file.
    Maintains pending_tool_calls so we can match tool_use → tool_result.
    """

    def __init__(self, conn, transcript_path: str):
        self.conn = conn
        self.transcript_path = transcript_path
        # Maps tool_use_id -> started_at timestamp
        self.pending: dict[str, str] = {}
        # Track recent tool calls for error context (last 5)
        self.recent_tool_calls: list[str] = []
        # Track last thinking block to correlate with errors
        self.last_thinking: Optional[str] = None

    def process_line(self, raw_line: str) -> None:
        raw_line = raw_line.strip()
        if not raw_line:
            return
        try:
            entry = json.loads(raw_line)
        except json.JSONDecodeError:
            logger.debug("Bad JSON line: %s", raw_line[:80])
            return

        entry_type = entry.get("type")
        session_id = entry.get("sessionId")
        ts = entry.get("timestamp", "")

        if not session_id:
            return

        # Inject transcript path for session upsert
        entry["_transcript_path"] = self.transcript_path

        # Always upsert session (idempotent)
        db.upsert_session(self.conn, entry)

        if entry_type == "assistant":
            self._handle_assistant(entry, session_id, ts)
        elif entry_type == "user":
            self._handle_user(entry, session_id, ts)
        elif entry_type == "progress":
            self._handle_progress(entry, session_id, ts)
        # "file-history-snapshot" and others: ignore

    def _handle_assistant(self, entry: dict, session_id: str, ts: str) -> None:
        msg = entry.get("message", {})
        content = msg.get("content", [])
        uuid = entry.get("uuid", "")

        # Extract API metadata if present
        usage = msg.get("usage")
        request_id = entry.get("requestId")
        model = msg.get("model")

        if usage or request_id or model:
            db.insert_api_metadata(
                self.conn, session_id, uuid, request_id, model,
                usage.get("input_tokens") if usage else None,
                usage.get("output_tokens") if usage else None,
                usage.get("cache_read_input_tokens") if usage else None,
                usage.get("cache_creation_input_tokens") if usage else None,
                ts
            )

        for block in content:
            if not isinstance(block, dict):
                continue

            btype = block.get("type")

            if btype == "thinking":
                # Extract thinking block
                thinking_text = block.get("thinking", "")
                if thinking_text:
                    self.last_thinking = thinking_text
                    # Estimate tokens (rough: 4 chars per token)
                    tokens = len(thinking_text) // 4
                    db.insert_thinking_block(
                        self.conn, session_id, uuid, thinking_text,
                        tokens, False, ts  # led_to_error updated later if error follows
                    )

            elif btype == "tool_use":
                tool_use_id = block.get("id")
                tool_name = block.get("name", "unknown")
                input_data = block.get("input", {})
                input_json = _truncate(json.dumps(input_data, ensure_ascii=False), max_len=2000)

                if tool_use_id:
                    self.pending[tool_use_id] = ts
                    self.recent_tool_calls.append(tool_use_id)
                    if len(self.recent_tool_calls) > 5:
                        self.recent_tool_calls.pop(0)

                    db.insert_tool_call(
                        self.conn, session_id, tool_use_id, tool_name, input_json, ts
                    )
                    logger.debug("tool_use: %s %s", tool_name, tool_use_id)

            elif btype == "text":
                text = block.get("text", "")
                if text.strip():
                    db.insert_message(
                        self.conn, session_id, uuid,
                        "assistant", "text", _truncate(text, 300), ts
                    )

    def _handle_user(self, entry: dict, session_id: str, ts: str) -> None:
        msg = entry.get("message", {})
        content = msg.get("content", [])
        uuid = entry.get("uuid", "")
        tool_use_result_meta = entry.get("toolUseResult", {})
        is_meta = entry.get("isMeta", False)

        # Handle system messages (isMeta=true)
        if is_meta:
            source_tool = entry.get("sourceToolUseID")
            if isinstance(content, list):
                for block in content:
                    if isinstance(block, dict) and block.get("type") == "text":
                        text = block.get("text", "")
                        if text:
                            # Classify system message type
                            msg_type = "unknown"
                            if "skill" in text.lower():
                                msg_type = "skill_load"
                            elif "hook" in text.lower():
                                msg_type = "hook_feedback"
                            elif "permission" in text.lower():
                                msg_type = "permission"
                            elif "launching" in text.lower() or "base directory" in text.lower():
                                msg_type = "skill_load"

                            db.insert_system_message(
                                self.conn, session_id, uuid, msg_type, text, ts
                            )
            return

        # content can be a list of blocks or a plain string
        if isinstance(content, str):
            if content.strip():
                db.insert_message(self.conn, session_id, uuid, "user", "text",
                                  _truncate(content, 300), ts)
            return

        for block in content:
            if not isinstance(block, dict):
                continue

            btype = block.get("type")

            if btype == "tool_result":
                tool_use_id = block.get("tool_use_id")
                raw_content = block.get("content", "")
                result_text = _extract_text(raw_content)
                result_preview = _truncate(result_text, 500)

                # Determine error: CC sets is_error on the block, or toolUseResult.success=False
                is_error = (
                    block.get("is_error", False)
                    or tool_use_result_meta.get("success") is False
                )

                start_ts = self.pending.pop(tool_use_id, None) if tool_use_id else None
                duration_ms = _ts_diff_ms(start_ts, ts) if start_ts else None

                if tool_use_id:
                    db.complete_tool_call(
                        self.conn, tool_use_id, result_preview,
                        is_error, ts, duration_ms
                    )
                    logger.debug(
                        "tool_result: %s error=%s duration=%s ms",
                        tool_use_id, is_error, duration_ms
                    )

                    # If error, capture full context
                    if is_error and result_text:
                        # Extract stack trace if present
                        stack_trace = None
                        if "Traceback" in result_text or "Error:" in result_text:
                            lines = result_text.split("\n")
                            stack_lines = []
                            for line in lines:
                                if "Traceback" in line or "File " in line or "Error:" in line:
                                    stack_lines.append(line)
                            if stack_lines:
                                stack_trace = "\n".join(stack_lines[:20])  # Limit stack trace size

                        # Get tool input from database
                        tool_input_full = None
                        try:
                            row = self.conn.execute(
                                "SELECT input_json FROM tool_calls WHERE tool_use_id=?",
                                (tool_use_id,)
                            ).fetchone()
                            if row:
                                tool_input_full = row[0]
                        except Exception:
                            pass

                        # Get context: last 5 tool calls
                        context_json = json.dumps(self.recent_tool_calls[-5:]) if self.recent_tool_calls else None

                        db.insert_error(
                            self.conn, session_id, tool_use_id,
                            result_text[:5000],  # Full error message (limited)
                            stack_trace,
                            tool_input_full,
                            context_json,
                            self.last_thinking[:2000] if self.last_thinking else None,
                            False,  # recovery_attempted - could detect this later
                            ts
                        )

                        # Clear last thinking after error
                        self.last_thinking = None

            elif btype == "text":
                text = block.get("text", "")
                if text.strip():
                    db.insert_message(self.conn, session_id, uuid, "user", "text",
                                      _truncate(text, 300), ts)

    def _handle_progress(self, entry: dict, session_id: str, ts: str) -> None:
        data = entry.get("data", {})
        if data.get("type") != "hook_progress":
            return

        db.insert_hook_event(
            conn=self.conn,
            session_id=session_id,
            tool_use_id=entry.get("toolUseID"),
            hook_event=data.get("hookEvent"),
            hook_name=data.get("hookName"),
            command=data.get("command"),
            ts=ts,
        )
