#!/usr/bin/env python3
"""
File system watcher for Claude Code transcript JSONL files.

Watches ~/.claude/projects/**/*.jsonl and tails new lines as CC writes them.
Uses polling (no external dependencies required). Handles:
  - New session files appearing
  - Existing files growing (new lines appended)
  - Symlinks and nested project dirs
"""

import os
import time
import logging
from pathlib import Path
from typing import Callable

logger = logging.getLogger("cc_telemetry.watcher")

# Root dir where CC writes project transcripts
CC_PROJECTS_DIR = Path(os.path.expanduser("~/.claude/projects"))

# Poll interval (seconds)
POLL_INTERVAL = float(os.environ.get("CC_TELEMETRY_POLL_INTERVAL", "1.0"))


class FileState:
    """Track read state for a single transcript file."""

    def __init__(self, path: Path):
        self.path = path
        self.inode: int = 0
        self.offset: int = 0  # byte offset of last read

    def update_inode(self, inode: int) -> bool:
        """Returns True if file was rotated (new inode)."""
        if inode != self.inode:
            self.inode = inode
            self.offset = 0
            return True
        return False


class TranscriptWatcher:
    """
    Polls ~/.claude/projects/ for JSONL transcript files.
    Calls `line_callback(path, line)` for each new line encountered.
    """

    def __init__(self, line_callback: Callable[[str, str], None]):
        self.line_callback = line_callback
        self._files: dict[str, FileState] = {}  # path_str -> FileState
        self._running = False

    def scan_existing(self) -> None:
        """On startup, find all existing transcript files but only tail from EOF
        (skip historical content to avoid re-importing old sessions)."""
        if not CC_PROJECTS_DIR.exists():
            logger.warning("CC projects dir not found: %s", CC_PROJECTS_DIR)
            return

        for jsonl_path in CC_PROJECTS_DIR.rglob("*.jsonl"):
            path_str = str(jsonl_path)
            if path_str not in self._files:
                state = FileState(jsonl_path)
                try:
                    stat = jsonl_path.stat()
                    state.inode = stat.st_ino
                    state.offset = stat.st_size  # start from end
                except OSError:
                    pass
                self._files[path_str] = state
                logger.info("Tracking (existing) %s", jsonl_path.name)

    def _poll_once(self) -> None:
        """Check all known files for new lines, and discover new files."""
        if not CC_PROJECTS_DIR.exists():
            return

        # Discover new JSONL files
        try:
            for jsonl_path in CC_PROJECTS_DIR.rglob("*.jsonl"):
                path_str = str(jsonl_path)
                if path_str not in self._files:
                    state = FileState(jsonl_path)
                    try:
                        stat = jsonl_path.stat()
                        state.inode = stat.st_ino
                        # New file: read from beginning to catch session start
                        state.offset = 0
                    except OSError:
                        continue
                    self._files[path_str] = state
                    logger.info("New transcript: %s", jsonl_path.name)
        except OSError as e:
            logger.debug("Scan error: %s", e)

        # Read new lines from all tracked files
        for path_str, state in list(self._files.items()):
            try:
                self._read_new_lines(state)
            except Exception as e:
                logger.debug("Error reading %s: %s", path_str, e)

    def _read_new_lines(self, state: FileState) -> None:
        path = state.path
        try:
            stat = path.stat()
        except OSError:
            return  # File deleted; keep state in case it reappears

        current_inode = stat.st_ino
        state.update_inode(current_inode)  # resets offset if rotated

        if stat.st_size <= state.offset:
            return  # No new data

        with open(path, "rb") as f:
            f.seek(state.offset)
            chunk = f.read(stat.st_size - state.offset)
            state.offset = f.tell()

        # Decode and split on newlines
        text = chunk.decode("utf-8", errors="replace")
        lines = text.splitlines()

        for line in lines:
            line = line.strip()
            if line:
                try:
                    self.line_callback(str(path), line)
                except Exception as e:
                    logger.error("line_callback error: %s", e)

    def run_forever(self) -> None:
        """Block and poll indefinitely."""
        self._running = True
        self.scan_existing()
        logger.info("Watching %s (poll interval: %ss)", CC_PROJECTS_DIR, POLL_INTERVAL)
        while self._running:
            try:
                self._poll_once()
            except Exception as e:
                logger.error("Poll error: %s", e)
            time.sleep(POLL_INTERVAL)

    def stop(self) -> None:
        self._running = False
