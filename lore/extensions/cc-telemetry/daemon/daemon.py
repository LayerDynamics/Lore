#!/usr/bin/env python3
"""
cc-telemetry daemon.

Watches ~/.claude/projects/**/*.jsonl in real-time, parses Claude Code
transcript events, and writes structured telemetry to SQLite.

Usage:
  python3 daemon.py              # run until interrupted
  python3 daemon.py --once       # poll once and exit (for testing)
  python3 daemon.py --status     # print DB stats and exit
"""

import sys
import os
import logging
import signal
import argparse
from pathlib import Path

# Add daemon dir to path so sibling imports work
sys.path.insert(0, os.path.dirname(__file__))

import db
from watcher import TranscriptWatcher
from parser import TranscriptParser

# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------

LOG_FILE = Path(os.path.expanduser("~/.claude/telemetry/daemon.log"))
LOG_LEVEL = os.environ.get("CC_TELEMETRY_LOG_LEVEL", "INFO").upper()


def setup_logging(verbose: bool = False) -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    level = logging.DEBUG if verbose else getattr(logging, LOG_LEVEL, logging.INFO)
    handlers = [
        logging.FileHandler(str(LOG_FILE)),
        logging.StreamHandler(sys.stdout),
    ]
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(name)s] %(levelname)s %(message)s",
        handlers=handlers,
        force=True,
    )


# ---------------------------------------------------------------------------
# Per-file parser cache
# ---------------------------------------------------------------------------

class DaemonState:
    """Holds one TranscriptParser per transcript file (to maintain pending state)."""

    def __init__(self, conn):
        self.conn = conn
        self._parsers: dict[str, TranscriptParser] = {}

    def get_parser(self, transcript_path: str) -> TranscriptParser:
        if transcript_path not in self._parsers:
            self._parsers[transcript_path] = TranscriptParser(self.conn, transcript_path)
        return self._parsers[transcript_path]

    def process_line(self, transcript_path: str, line: str) -> None:
        parser = self.get_parser(transcript_path)
        parser.process_line(line)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser(description="cc-telemetry daemon")
    ap.add_argument("--once", action="store_true",
                    help="Poll once and exit (for testing)")
    ap.add_argument("--status", action="store_true",
                    help="Print DB stats and exit")
    ap.add_argument("--verbose", "-v", action="store_true",
                    help="Debug logging")
    args = ap.parse_args()

    setup_logging(args.verbose)
    log = logging.getLogger("cc_telemetry.daemon")

    conn = db.open_db()
    log.info("cc-telemetry daemon started. DB: %s", db.get_db_path())

    if args.status:
        stats = db.query_stats(conn)
        sessions = db.query_sessions(conn, limit=5)
        print(f"DB: {db.get_db_path()}")
        print(f"Total tool calls: {stats['total_tool_calls']}")
        print(f"Errors:           {stats['error_count']}")
        print(f"Avg duration:     {stats['avg_duration_ms']} ms")
        print(f"\nRecent sessions ({len(sessions)}):")
        for s in sessions:
            print(f"  {s['slug'] or s['session_id'][:8]}  "
                  f"calls={s['tool_call_count']}  errors={s['error_count'] or 0}  "
                  f"last={s['last_seen_at']}")
        return

    state = DaemonState(conn)

    def on_line(path: str, line: str) -> None:
        state.process_line(path, line)

    watcher = TranscriptWatcher(line_callback=on_line)

    def _shutdown(signum, frame):
        log.info("Shutting down (signal %s)…", signum)
        watcher.stop()

    signal.signal(signal.SIGTERM, _shutdown)
    signal.signal(signal.SIGINT, _shutdown)

    if args.once:
        watcher.scan_existing()
        watcher._poll_once()
        log.info("--once complete.")
        return

    try:
        watcher.run_forever()
    except KeyboardInterrupt:
        pass

    log.info("cc-telemetry daemon stopped.")


if __name__ == "__main__":
    main()
