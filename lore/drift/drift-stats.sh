#!/usr/bin/env bash
# drift-stats.sh — CLI tool to view drift detection effectiveness stats
# Usage:
#   drift-stats.sh [--all | --session <id> | --project <name>]
#   drift-stats.sh --clean [days]      run retention + orphan sweep
#   drift-stats.sh --orphans           run orphan sweep ONLY (no retention)
set -euo pipefail
export PYTHONDONTWRITEBYTECODE=1

HOOK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="$HOOK_DIR${PYTHONPATH:+:$PYTHONPATH}"

DRIFT_DIR="$HOME/.claude/drift-state"

if [ ! -d "$DRIFT_DIR" ]; then
    echo "No drift state directory found at $DRIFT_DIR"
    echo "The drift detection hooks haven't run yet."
    exit 0
fi

ACTION="${1:-}"

# --clean [days]: prune stale drift state via retention + orphan sweeps.
# Also runs automatically from start-session.sh at the start of every
# Claude Code session. Defaults to 14 days; pass an integer arg or set
# LORE_DRIFT_RETENTION_DAYS to override.
if [ "$ACTION" = "--clean" ]; then
    RETENTION_ARG="${2:-${LORE_DRIFT_RETENTION_DAYS:-14}}"
    python3 - "$DRIFT_DIR" "$RETENTION_ARG" <<'PYEOF'
import sys
from _drift_common import sweep_all, format_sweep_counts
drift_dir = sys.argv[1]
try:
    retention_days = max(1, int(sys.argv[2]))
except ValueError:
    retention_days = 14
counts = sweep_all(drift_dir, retention_days=retention_days)
summary = format_sweep_counts(counts)
if summary == "nothing to clean":
    print(f"No stale drift state to clean (retention: {retention_days} days).")
else:
    print(f"Cleaned: {summary} (retention: {retention_days} days).")
PYEOF
    exit 0
fi

# --orphans: sweep ONLY orphan files. Does not touch valid in-retention state.
# Use when you want to prune corrupted/unclaimable files without affecting
# idle-but-valid sessions.
if [ "$ACTION" = "--orphans" ]; then
    python3 - "$DRIFT_DIR" <<'PYEOF'
import sys
from _drift_common import orphan_sweep, format_sweep_counts
drift_dir = sys.argv[1]
counts = orphan_sweep(drift_dir)
summary = format_sweep_counts(counts)
if summary == "nothing to clean":
    print("No orphan drift state files found.")
else:
    print(f"Cleaned orphans: {summary}.")
PYEOF
    exit 0
fi

python3 - "$DRIFT_DIR" "$ACTION" "${2:-}" <<'PYEOF'
import json, os, sys, glob

drift_dir = sys.argv[1]
action = sys.argv[2] if len(sys.argv) > 2 else ''
arg2 = sys.argv[3] if len(sys.argv) > 3 else ''

# Collect state files from both old flat layout and new project-scoped layout
files = []

# Old flat files (legacy, pre-project-scoping)
for f in glob.glob(os.path.join(drift_dir, '*.json')):
    if os.path.basename(f) == '.current':
        continue
    files.append(f)

# New project-scoped files
for d in glob.glob(os.path.join(drift_dir, '*/')):
    for f in glob.glob(os.path.join(d, '*.json')):
        files.append(f)

files.sort(key=os.path.getmtime, reverse=True)

if not files:
    print('No drift state files found. Start a Claude Code session to begin tracking.')
    sys.exit(0)

# Load all sessions
sessions = []
for f in files:
    try:
        with open(f, 'r') as fh:
            data = json.load(fh)
            data['_file'] = f
            data['_mtime'] = os.path.getmtime(f)
            # Derive project from path or state
            parent_dir = os.path.basename(os.path.dirname(f))
            if parent_dir != 'drift-state':
                data['_project_dir'] = parent_dir
            else:
                data['_project_dir'] = data.get('project_name', 'unknown')
            sessions.append(data)
    except (json.JSONDecodeError, IOError):
        continue

if not sessions:
    print('No valid drift state files found.')
    sys.exit(0)

# Filter by project if requested
if action == '--project' and arg2:
    sessions = [s for s in sessions if arg2.lower() in s.get('_project_dir', '').lower()
                or arg2.lower() in s.get('project', '').lower()]
    if not sessions:
        print(f'No sessions matching project "{arg2}"')
        # Show available projects
        all_projects = set()
        for f2 in files:
            try:
                with open(f2, 'r') as fh2:
                    d2 = json.load(fh2)
                    pn = d2.get('project_name', os.path.basename(os.path.dirname(f2)))
                    all_projects.add(pn)
            except Exception: pass
        if all_projects:
            proj_list = ', '.join(sorted(all_projects))
            print(f'Available projects: {proj_list}')
        sys.exit(1)

# Single session detail view
if action == '--session' and arg2:
    matches = [s for s in sessions if arg2 in s.get('session_id', '') or arg2 in s.get('_file', '')]
    if not matches:
        print(f'No session matching "{arg2}"')
        sys.exit(1)
    s = matches[0]
    print(f'SESSION: {s.get("session_id", "unknown")}')
    print(f'Project: {s.get("project", s.get("_project_dir", "unknown"))}')
    print(f'Created: {s.get("created_at", "?")}')
    print(f'Anchor set: {s.get("anchor_set_at", "never")}')
    print()
    print(f'Tool calls: {s.get("tool_call_count", 0)}')
    print(f'User messages: {s.get("user_message_count", 0)}')
    print(f'Drift checks fired: {s.get("drift_checks_performed", 0)}')
    print(f'Scope updates: {len(s.get("scope_updates", []))}')
    print()
    files_touched = s.get('files_touched', [])
    print(f'Files modified: {len(files_touched)}')
    for ft in files_touched:
        print(f'  - {ft}')
    print()
    orig = s.get('original_request', '')
    if orig:
        print('ORIGINAL REQUEST:')
        print(f'  {orig[:300]}')
        if len(orig) > 300:
            print('  ...')
    print()
    scope_updates = s.get('scope_updates', [])
    if scope_updates:
        print('SCOPE UPDATES:')
        for upd in scope_updates:
            print(f'  [#{upd.get("msg_num","?")}] {upd.get("text","")[:200]}')
    combined = s.get('combined_scope', '')
    if combined and combined != orig:
        print()
        print(f'COMBINED SCOPE ({len(combined)} chars):')
        print(f'  {combined[:400]}')
        if len(combined) > 400:
            print('  ...')
    stops = s.get('stop_events', [])
    if stops:
        print()
        print(f'STOP EVENTS ({len(stops)}):')
        for st in stops:
            print(f'  {st.get("at","?")} | {st.get("tool_call_count",0)} tc | {st.get("files_touched_count",0)} files | {st.get("drift_checks_at_stop",0)} checks')
    sys.exit(0)

# Aggregate stats view (default or --all)
print('=' * 60)
print('DRIFT DETECTION EFFECTIVENESS REPORT')
print('=' * 60)
print()

# Group by project
projects = {}
for s in sessions:
    proj = s.get('_project_dir', 'unknown')
    projects.setdefault(proj, []).append(s)

total_sessions = len(sessions)
sessions_with_anchor = sum(1 for s in sessions if s.get('original_request'))
total_tool_calls = sum(s.get('tool_call_count', 0) for s in sessions)
total_drift_checks = sum(s.get('drift_checks_performed', 0) for s in sessions)
total_user_msgs = sum(s.get('user_message_count', 0) for s in sessions)
total_scope_updates = sum(len(s.get('scope_updates', [])) for s in sessions)
total_files_touched = sum(len(s.get('files_touched', [])) for s in sessions)
total_stop_events = sum(len(s.get('stop_events', [])) for s in sessions)

active_sessions = [s for s in sessions if s.get('tool_call_count', 0) >= 5]
checked_sessions = [s for s in sessions if s.get('drift_checks_performed', 0) > 0]

print(f'Projects tracked:         {len(projects)}')
print(f'Sessions tracked:         {total_sessions}')
print(f'Sessions with anchor:     {sessions_with_anchor}')
print(f'Active sessions (5+ tc):  {len(active_sessions)}')
print(f'Sessions with checks:     {len(checked_sessions)}')
print()
print(f'Total tool calls:         {total_tool_calls}')
print(f'Total user messages:      {total_user_msgs}')
print(f'Total drift checks:       {total_drift_checks}')
print(f'Total scope updates:      {total_scope_updates}')
print(f'Total files modified:     {total_files_touched}')
print(f'Total stop events:        {total_stop_events}')
print()

if total_tool_calls > 0:
    checks_per_100 = (total_drift_checks / total_tool_calls) * 100
    print(f'Check rate:               {checks_per_100:.1f} per 100 tool calls')

if active_sessions:
    avg_tc = total_tool_calls / len(active_sessions)
    avg_files = total_files_touched / len(active_sessions)
    avg_checks = total_drift_checks / len(active_sessions)
    print(f'Avg tool calls/session:   {avg_tc:.0f}')
    print(f'Avg files/session:        {avg_files:.1f}')
    print(f'Avg drift checks/session: {avg_checks:.1f}')

# Coverage analysis
unchecked_active = [s for s in active_sessions if s.get('drift_checks_performed', 0) == 0]
if unchecked_active:
    print()
    print(f'WARNING: {len(unchecked_active)} active session(s) had NO drift checks.')
    for s in unchecked_active[:5]:
        sid = s.get('session_id', 'unknown')[:20]
        tc = s.get('tool_call_count', 0)
        proj = s.get('_project_dir', '?')
        print(f'  - [{proj}] {sid}... ({tc} tool calls, 0 checks)')

# Scope evolution tracking
sessions_with_updates = [s for s in sessions if len(s.get('scope_updates', [])) > 0]
if sessions_with_updates:
    print()
    print('Scope evolution:')
    print(f'  Sessions with scope updates: {len(sessions_with_updates)}')
    avg_updates = total_scope_updates / len(sessions_with_updates)
    print(f'  Avg updates per evolved session: {avg_updates:.1f}')

# Per-project breakdown
if len(projects) > 1:
    print()
    print('=' * 60)
    print('PER-PROJECT BREAKDOWN')
    print('=' * 60)
    for proj_name, proj_sessions in sorted(projects.items()):
        ptc = sum(s.get('tool_call_count', 0) for s in proj_sessions)
        pdc = sum(s.get('drift_checks_performed', 0) for s in proj_sessions)
        pft = sum(len(s.get('files_touched', [])) for s in proj_sessions)
        print(f'  {proj_name:30} | {len(proj_sessions):2} sessions | {ptc:4} tc | {pdc:2} checks | {pft:3} files')

print()
print('=' * 60)
print('RECENT SESSIONS')
print('=' * 60)
print()

for s in sessions[:10]:
    sid = s.get('session_id', 'unknown')
    proj = s.get('_project_dir', '?')
    tc = s.get('tool_call_count', 0)
    dc = s.get('drift_checks_performed', 0)
    ft = len(s.get('files_touched', []))
    um = s.get('user_message_count', 0)
    su = len(s.get('scope_updates', []))
    orig = s.get('original_request', '')
    preview = orig[:60].replace(chr(10), ' ') if orig else '(no anchor)'

    if tc >= 15 and dc == 0:
        health = 'UNCHECKED'
    elif tc < 5:
        health = 'light'
    elif dc > 0:
        health = 'monitored'
    else:
        health = 'ok'

    print(f'[{health:>10}] [{proj}] {sid[:20]:20} | {tc:3} tc | {dc} checks | {ft:2} files | {um} msgs')
    print(f'             {preview}')
    print()

print('Options:')
print('  --session <id>         Detail view for a specific session')
print('  --project <name>       Filter by project name')
print('  --clean [days]         Retention + orphan sweep (default 14 days; auto-runs at SessionStart)')
print('  --orphans              Orphan-only sweep — never touches valid in-retention state')
PYEOF

exit 0
