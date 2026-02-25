#!/usr/bin/env python3
"""
Shared telemetry logging utility for cc-telemetry plugin.
Writes JSON Lines to ~/.claude/telemetry/YYYY-MM-DD.jsonl
Thread-safe via file locking.
"""

import os
import sys
import json
import fcntl
import hashlib
from datetime import datetime, timezone
from pathlib import Path


def get_telemetry_dir() -> Path:
    telemetry_dir = os.environ.get(
        "CLAUDE_TELEMETRY_DIR",
        os.path.join(os.path.expanduser("~"), ".claude", "telemetry")
    )
    return Path(telemetry_dir)


def get_log_path(dt: datetime = None) -> Path:
    if dt is None:
        dt = datetime.now(timezone.utc)
    date_str = dt.strftime("%Y-%m-%d")
    telemetry_dir = get_telemetry_dir()
    telemetry_dir.mkdir(parents=True, exist_ok=True)
    return telemetry_dir / f"{date_str}.jsonl"


def truncate_value(value, max_len: int = 500) -> str:
    """Truncate large values and convert to string."""
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        s = json.dumps(value, ensure_ascii=False)
    else:
        s = str(value)
    if len(s) > max_len:
        return s[:max_len] + f"...[truncated {len(s) - max_len} chars]"
    return s


def write_event(event: dict) -> None:
    """Write a single event as a JSON line. Thread-safe via flock."""
    log_path = get_log_path()
    line = json.dumps(event, ensure_ascii=False) + "\n"
    with open(log_path, "a", encoding="utf-8") as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        try:
            f.write(line)
        finally:
            fcntl.flock(f, fcntl.LOCK_UN)


def make_event(
    event_type: str,
    tool: str = None,
    skill: str = None,
    status: str = "ok",
    duration_ms: int = None,
    meta: dict = None,
) -> dict:
    """Build a standardized telemetry event dict."""
    session_id = os.environ.get("CLAUDE_SESSION_ID", None)
    return {
        "ts": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "session_id": session_id,
        "event": event_type,
        "tool": tool,
        "skill": skill,
        "status": status,
        "duration_ms": duration_ms,
        "meta": meta or {},
    }


def read_stdin_json() -> dict:
    """Read JSON context from stdin. Returns empty dict on failure."""
    try:
        raw = sys.stdin.read()
        if raw.strip():
            return json.loads(raw)
    except Exception:
        pass
    return {}


def hash_text(text: str, length: int = 8) -> str:
    """Return a short hash of text for identifying prompts without storing content."""
    return hashlib.sha256(text.encode()).hexdigest()[:length]


# ---------------------------------------------------------------------------
# Query mode: called as "python3 logger.py --query <args>"
# ---------------------------------------------------------------------------

def cmd_query(args_str: str) -> None:
    """Simple query interface for the /cc-telemetry skill."""
    import argparse
    import re

    parts = args_str.strip().split() if args_str.strip() else []

    date_str = None
    event_filter = None
    tail_n = None
    i = 0
    while i < len(parts):
        part = parts[i]
        if re.match(r"^\d{4}-\d{2}-\d{2}$", part):
            date_str = part
        elif part == "--tail" and i + 1 < len(parts):
            try:
                tail_n = int(parts[i + 1])
                i += 1
            except ValueError:
                pass
        elif part in ("PreToolUse", "PostToolUse", "SessionStart", "Stop", "UserPromptSubmit"):
            event_filter = part
        i += 1

    # Determine which log file to read
    if date_str:
        log_path = get_telemetry_dir() / f"{date_str}.jsonl"
    else:
        log_path = get_log_path()

    if not log_path.exists():
        print(f"No telemetry log found at {log_path}")
        print(f"Telemetry directory: {get_telemetry_dir()}")
        available = sorted(get_telemetry_dir().glob("*.jsonl")) if get_telemetry_dir().exists() else []
        if available:
            print(f"Available logs: {', '.join(p.name for p in available)}")
        return

    events = []
    with open(log_path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
                if event_filter is None or ev.get("event") == event_filter:
                    events.append(ev)
            except json.JSONDecodeError:
                pass

    if tail_n is not None:
        events = events[-tail_n:]

    if not events:
        print(f"No events found in {log_path.name}" + (f" for event type '{event_filter}'" if event_filter else ""))
        return

    print(f"=== Telemetry: {log_path.name} ({len(events)} events) ===")
    print()
    for ev in events:
        ts = ev.get("ts", "?")
        event_type = ev.get("event", "?")
        tool = ev.get("tool") or ""
        skill = ev.get("skill") or ""
        status = ev.get("status") or ""
        duration = ev.get("duration_ms")
        meta = ev.get("meta", {})

        parts_out = [f"[{ts}] {event_type}"]
        if tool:
            parts_out.append(f"tool={tool}")
        if skill:
            parts_out.append(f"skill={skill}")
        if status and status != "ok":
            parts_out.append(f"status={status}")
        if duration is not None:
            parts_out.append(f"{duration}ms")
        if meta:
            for k, v in meta.items():
                if v:
                    parts_out.append(f"{k}={v}")

        print("  ".join(parts_out))


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "--query":
        query_args = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else ""
        cmd_query(query_args)
    else:
        print("Usage: logger.py --query [date] [event-type] [--tail N]")
