#!/usr/bin/env python3
"""
SQLite database layer for cc-telemetry.
Schema: sessions, tool_calls, hook_events, messages.
"""

import sqlite3
import os
import json
from pathlib import Path
from datetime import datetime, timezone
from contextlib import contextmanager
from typing import Optional


DB_PATH = Path(os.environ.get(
    "CC_TELEMETRY_DB",
    os.path.expanduser("~/.claude/telemetry/telemetry.db")
))


def get_db_path() -> Path:
    return DB_PATH


def open_db(path: Path = None) -> sqlite3.Connection:
    p = path or DB_PATH
    p.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(p), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    _init_schema(conn)
    return conn


def _init_schema(conn: sqlite3.Connection) -> None:
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id   TEXT PRIMARY KEY,
            slug         TEXT,
            project_hash TEXT,
            transcript_path TEXT,
            cwd          TEXT,
            started_at   TEXT,
            last_seen_at TEXT,
            version      TEXT
        );

        CREATE TABLE IF NOT EXISTS tool_calls (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id      TEXT NOT NULL,
            tool_use_id     TEXT UNIQUE NOT NULL,
            tool_name       TEXT NOT NULL,
            input_json      TEXT,
            result_preview  TEXT,
            result_is_error INTEGER DEFAULT 0,
            started_at      TEXT,
            completed_at    TEXT,
            duration_ms     INTEGER,
            FOREIGN KEY(session_id) REFERENCES sessions(session_id)
        );

        CREATE TABLE IF NOT EXISTS hook_events (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id  TEXT,
            tool_use_id TEXT,
            hook_event  TEXT,
            hook_name   TEXT,
            command     TEXT,
            ts          TEXT
        );

        CREATE TABLE IF NOT EXISTS messages (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id   TEXT,
            uuid         TEXT UNIQUE,
            role         TEXT,
            content_type TEXT,
            text_preview TEXT,
            ts           TEXT
        );

        CREATE TABLE IF NOT EXISTS errors (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id          TEXT NOT NULL,
            tool_use_id         TEXT,
            error_message       TEXT,
            stack_trace         TEXT,
            tool_input_full     TEXT,
            context_tool_calls  TEXT,
            thinking_before     TEXT,
            recovery_attempted  INTEGER DEFAULT 0,
            ts                  TEXT,
            FOREIGN KEY(session_id) REFERENCES sessions(session_id),
            FOREIGN KEY(tool_use_id) REFERENCES tool_calls(tool_use_id)
        );

        CREATE TABLE IF NOT EXISTS thinking_blocks (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id      TEXT NOT NULL,
            message_uuid    TEXT,
            thinking_content TEXT,
            tokens          INTEGER,
            led_to_error    INTEGER DEFAULT 0,
            ts              TEXT,
            FOREIGN KEY(session_id) REFERENCES sessions(session_id)
        );

        CREATE TABLE IF NOT EXISTS system_messages (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id   TEXT NOT NULL,
            message_uuid TEXT,
            message_type TEXT,
            content      TEXT,
            ts           TEXT,
            FOREIGN KEY(session_id) REFERENCES sessions(session_id)
        );

        CREATE TABLE IF NOT EXISTS api_metadata (
            id                   INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id           TEXT NOT NULL,
            message_uuid         TEXT,
            request_id           TEXT,
            model                TEXT,
            input_tokens         INTEGER,
            output_tokens        INTEGER,
            cache_read_tokens    INTEGER,
            cache_write_tokens   INTEGER,
            ts                   TEXT,
            FOREIGN KEY(session_id) REFERENCES sessions(session_id)
        );

        CREATE INDEX IF NOT EXISTS idx_tc_session  ON tool_calls(session_id);
        CREATE INDEX IF NOT EXISTS idx_tc_name     ON tool_calls(tool_name);
        CREATE INDEX IF NOT EXISTS idx_tc_started  ON tool_calls(started_at);
        CREATE INDEX IF NOT EXISTS idx_he_session  ON hook_events(session_id);
        CREATE INDEX IF NOT EXISTS idx_msg_session ON messages(session_id);
        CREATE INDEX IF NOT EXISTS idx_err_session ON errors(session_id);
        CREATE INDEX IF NOT EXISTS idx_err_tool    ON errors(tool_use_id);
        CREATE INDEX IF NOT EXISTS idx_think_session ON thinking_blocks(session_id);
        CREATE INDEX IF NOT EXISTS idx_sysmsg_session ON system_messages(session_id);
        CREATE INDEX IF NOT EXISTS idx_api_session ON api_metadata(session_id);
        CREATE INDEX IF NOT EXISTS idx_api_request ON api_metadata(request_id);
    """)
    conn.commit()


# ---------------------------------------------------------------------------
# Write operations
# ---------------------------------------------------------------------------

def upsert_session(conn: sqlite3.Connection, entry: dict) -> None:
    session_id = entry.get("sessionId")
    if not session_id:
        return
    ts = entry.get("timestamp")
    conn.execute("""
        INSERT INTO sessions(session_id, slug, project_hash, transcript_path, cwd, started_at, last_seen_at, version)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id) DO UPDATE SET last_seen_at=excluded.last_seen_at
    """, (
        session_id,
        entry.get("slug"),
        entry.get("project_hash"),
        entry.get("_transcript_path"),  # injected by watcher
        entry.get("cwd"),
        ts,
        ts,
        entry.get("version"),
    ))
    conn.commit()


def insert_tool_call(
    conn: sqlite3.Connection,
    session_id: str,
    tool_use_id: str,
    tool_name: str,
    input_json: str,
    started_at: str,
) -> None:
    conn.execute("""
        INSERT OR IGNORE INTO tool_calls(session_id, tool_use_id, tool_name, input_json, started_at)
        VALUES(?, ?, ?, ?, ?)
    """, (session_id, tool_use_id, tool_name, input_json, started_at))
    conn.commit()


def complete_tool_call(
    conn: sqlite3.Connection,
    tool_use_id: str,
    result_preview: str,
    is_error: bool,
    completed_at: str,
    duration_ms: Optional[int],
) -> None:
    conn.execute("""
        UPDATE tool_calls
        SET result_preview=?, result_is_error=?, completed_at=?, duration_ms=?
        WHERE tool_use_id=?
    """, (result_preview, 1 if is_error else 0, completed_at, duration_ms, tool_use_id))
    conn.commit()


def insert_hook_event(
    conn: sqlite3.Connection,
    session_id: str,
    tool_use_id: Optional[str],
    hook_event: str,
    hook_name: Optional[str],
    command: Optional[str],
    ts: str,
) -> None:
    conn.execute("""
        INSERT INTO hook_events(session_id, tool_use_id, hook_event, hook_name, command, ts)
        VALUES(?, ?, ?, ?, ?, ?)
    """, (session_id, tool_use_id, hook_event, hook_name, command, ts))
    conn.commit()


def insert_message(
    conn: sqlite3.Connection,
    session_id: str,
    uuid: str,
    role: str,
    content_type: str,
    text_preview: Optional[str],
    ts: str,
) -> None:
    conn.execute("""
        INSERT OR IGNORE INTO messages(session_id, uuid, role, content_type, text_preview, ts)
        VALUES(?, ?, ?, ?, ?, ?)
    """, (session_id, uuid, role, content_type, text_preview, ts))
    conn.commit()


def insert_error(
    conn: sqlite3.Connection,
    session_id: str,
    tool_use_id: Optional[str],
    error_message: str,
    stack_trace: Optional[str],
    tool_input_full: Optional[str],
    context_tool_calls: Optional[str],
    thinking_before: Optional[str],
    recovery_attempted: bool,
    ts: str,
) -> None:
    conn.execute("""
        INSERT INTO errors(
            session_id, tool_use_id, error_message, stack_trace,
            tool_input_full, context_tool_calls, thinking_before,
            recovery_attempted, ts
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        session_id, tool_use_id, error_message, stack_trace,
        tool_input_full, context_tool_calls, thinking_before,
        1 if recovery_attempted else 0, ts
    ))
    conn.commit()


def insert_thinking_block(
    conn: sqlite3.Connection,
    session_id: str,
    message_uuid: str,
    thinking_content: str,
    tokens: Optional[int],
    led_to_error: bool,
    ts: str,
) -> None:
    conn.execute("""
        INSERT INTO thinking_blocks(
            session_id, message_uuid, thinking_content, tokens, led_to_error, ts
        ) VALUES(?, ?, ?, ?, ?, ?)
    """, (session_id, message_uuid, thinking_content, tokens, 1 if led_to_error else 0, ts))
    conn.commit()


def insert_system_message(
    conn: sqlite3.Connection,
    session_id: str,
    message_uuid: str,
    message_type: str,
    content: str,
    ts: str,
) -> None:
    conn.execute("""
        INSERT INTO system_messages(session_id, message_uuid, message_type, content, ts)
        VALUES(?, ?, ?, ?, ?)
    """, (session_id, message_uuid, message_type, content, ts))
    conn.commit()


def insert_api_metadata(
    conn: sqlite3.Connection,
    session_id: str,
    message_uuid: str,
    request_id: Optional[str],
    model: Optional[str],
    input_tokens: Optional[int],
    output_tokens: Optional[int],
    cache_read_tokens: Optional[int],
    cache_write_tokens: Optional[int],
    ts: str,
) -> None:
    conn.execute("""
        INSERT INTO api_metadata(
            session_id, message_uuid, request_id, model,
            input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, ts
        ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        session_id, message_uuid, request_id, model,
        input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, ts
    ))
    conn.commit()


# ---------------------------------------------------------------------------
# Query operations
# ---------------------------------------------------------------------------

def query_sessions(conn: sqlite3.Connection, limit: int = 20):
    rows = conn.execute("""
        SELECT s.session_id, s.slug, s.cwd, s.started_at, s.last_seen_at,
               COUNT(tc.id) as tool_call_count,
               SUM(tc.result_is_error) as error_count
        FROM sessions s
        LEFT JOIN tool_calls tc ON tc.session_id = s.session_id
        GROUP BY s.session_id
        ORDER BY s.last_seen_at DESC
        LIMIT ?
    """, (limit,)).fetchall()
    return [dict(r) for r in rows]


def query_tool_calls(
    conn: sqlite3.Connection,
    session_id: Optional[str] = None,
    tool_name: Optional[str] = None,
    errors_only: bool = False,
    limit: int = 50,
):
    clauses = []
    params = []
    if session_id:
        clauses.append("tc.session_id = ?")
        params.append(session_id)
    if tool_name:
        clauses.append("tc.tool_name = ?")
        params.append(tool_name)
    if errors_only:
        clauses.append("tc.result_is_error = 1")

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    params.append(limit)

    rows = conn.execute(f"""
        SELECT tc.*, s.slug, s.cwd
        FROM tool_calls tc
        LEFT JOIN sessions s ON s.session_id = tc.session_id
        {where}
        ORDER BY tc.started_at DESC
        LIMIT ?
    """, params).fetchall()
    return [dict(r) for r in rows]


def query_stats(conn: sqlite3.Connection, session_id: Optional[str] = None):
    params = []
    where = ""
    if session_id:
        where = "WHERE session_id = ?"
        params.append(session_id)

    total = conn.execute(
        f"SELECT COUNT(*) FROM tool_calls {where}", params
    ).fetchone()[0]

    errors = conn.execute(
        f"SELECT COUNT(*) FROM tool_calls {where} {'AND' if where else 'WHERE'} result_is_error=1",
        params + ([] if not where else [])
    ).fetchone()[0] if not where else conn.execute(
        "SELECT COUNT(*) FROM tool_calls WHERE session_id=? AND result_is_error=1", params
    ).fetchone()[0]

    avg_dur = conn.execute(
        f"SELECT AVG(duration_ms) FROM tool_calls {where} {'AND' if where else 'WHERE'} duration_ms IS NOT NULL",
        params + ([] if not where else [])
    ).fetchone()[0] if not where else conn.execute(
        "SELECT AVG(duration_ms) FROM tool_calls WHERE session_id=? AND duration_ms IS NOT NULL", params
    ).fetchone()[0]

    by_tool = conn.execute(f"""
        SELECT tool_name, COUNT(*) as cnt, AVG(duration_ms) as avg_ms, SUM(result_is_error) as errors
        FROM tool_calls {where}
        GROUP BY tool_name ORDER BY cnt DESC LIMIT 20
    """, params).fetchall()

    return {
        "total_tool_calls": total,
        "error_count": errors,
        "avg_duration_ms": round(avg_dur, 1) if avg_dur else None,
        "by_tool": [dict(r) for r in by_tool],
    }


def query_errors(
    conn: sqlite3.Connection,
    session_id: Optional[str] = None,
    tool_use_id: Optional[str] = None,
    limit: int = 50,
):
    """Query errors with full context."""
    clauses = []
    params = []
    if session_id:
        clauses.append("e.session_id = ?")
        params.append(session_id)
    if tool_use_id:
        clauses.append("e.tool_use_id = ?")
        params.append(tool_use_id)

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    params.append(limit)

    rows = conn.execute(f"""
        SELECT e.*, s.slug, tc.tool_name
        FROM errors e
        LEFT JOIN sessions s ON s.session_id = e.session_id
        LEFT JOIN tool_calls tc ON tc.tool_use_id = e.tool_use_id
        {where}
        ORDER BY e.ts DESC
        LIMIT ?
    """, params).fetchall()
    return [dict(r) for r in rows]


def query_thinking_blocks(
    conn: sqlite3.Connection,
    session_id: Optional[str] = None,
    led_to_error: Optional[bool] = None,
    limit: int = 50,
):
    """Query thinking blocks."""
    clauses = []
    params = []
    if session_id:
        clauses.append("session_id = ?")
        params.append(session_id)
    if led_to_error is not None:
        clauses.append("led_to_error = ?")
        params.append(1 if led_to_error else 0)

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    params.append(limit)

    rows = conn.execute(f"""
        SELECT * FROM thinking_blocks {where}
        ORDER BY ts DESC LIMIT ?
    """, params).fetchall()
    return [dict(r) for r in rows]


def query_system_messages(
    conn: sqlite3.Connection,
    session_id: Optional[str] = None,
    message_type: Optional[str] = None,
    limit: int = 100,
):
    """Query system messages."""
    clauses = []
    params = []
    if session_id:
        clauses.append("session_id = ?")
        params.append(session_id)
    if message_type:
        clauses.append("message_type = ?")
        params.append(message_type)

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    params.append(limit)

    rows = conn.execute(f"""
        SELECT * FROM system_messages {where}
        ORDER BY ts DESC LIMIT ?
    """, params).fetchall()
    return [dict(r) for r in rows]


def query_api_metadata(
    conn: sqlite3.Connection,
    session_id: Optional[str] = None,
    request_id: Optional[str] = None,
    limit: int = 100,
):
    """Query API metadata."""
    clauses = []
    params = []
    if session_id:
        clauses.append("session_id = ?")
        params.append(session_id)
    if request_id:
        clauses.append("request_id = ?")
        params.append(request_id)

    where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
    params.append(limit)

    rows = conn.execute(f"""
        SELECT * FROM api_metadata {where}
        ORDER BY ts DESC LIMIT ?
    """, params).fetchall()
    return [dict(r) for r in rows]


def query_request_by_id(conn: sqlite3.Connection, request_id: str):
    """Look up session by Anthropic request ID."""
    row = conn.execute("""
        SELECT a.*, s.slug, s.cwd
        FROM api_metadata a
        LEFT JOIN sessions s ON s.session_id = a.session_id
        WHERE a.request_id = ?
        LIMIT 1
    """, (request_id,)).fetchone()
    return dict(row) if row else None
