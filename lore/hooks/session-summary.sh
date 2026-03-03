#!/usr/bin/env bash
# session-summary.sh — Stop hook
# Generates session summary with agent telemetry stats
set -euo pipefail

INPUT=$(cat)

echo "$INPUT" | python3 -c "
import sys, json, os, fcntl
from datetime import datetime, timezone

try:
    raw = sys.stdin.read().strip()
    data = json.loads(raw) if raw else {}
except:
    data = {}

stop_reason = data.get('stop_reason', data.get('reason', 'unknown'))
session_id = os.environ.get('CLAUDE_SESSION_ID', 'unknown')
now = datetime.now(timezone.utc)
timestamp = now.strftime('%Y-%m-%dT%H:%M:%SZ')

summary_dir = os.path.expanduser('~/.claude/session-summaries')
os.makedirs(summary_dir, exist_ok=True)

summary = {
    'session_id': session_id,
    'ended_at': timestamp,
    'stop_reason': stop_reason,
}

summary_file = os.path.join(summary_dir, f'{now.strftime(\"%Y-%m-%d\")}.jsonl')
with open(summary_file, 'a') as f:
    f.write(json.dumps(summary) + '\n')

# Aggregate agent telemetry for this session
agent_log_dir = os.path.expanduser('~/.claude/agent-logs')
agent_log = os.path.join(agent_log_dir, f'{now.strftime(\"%Y-%m-%d\")}.jsonl')

agent_stats = {}
total_agents = 0
total_agent_ms = 0
agent_errors = 0

if os.path.exists(agent_log):
    with open(agent_log) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
                if ev.get('session_id') != session_id:
                    continue
                total_agents += 1
                name = ev.get('agent', 'unknown')
                dur = ev.get('duration_ms') or 0
                total_agent_ms += dur
                st = ev.get('status', 'ok')
                if st == 'error':
                    agent_errors += 1
                if name not in agent_stats:
                    agent_stats[name] = {'count': 0, 'errors': 0, 'total_ms': 0}
                agent_stats[name]['count'] += 1
                agent_stats[name]['total_ms'] += dur
                if st == 'error':
                    agent_stats[name]['errors'] += 1
            except json.JSONDecodeError:
                pass

if total_agents > 0:
    print(f'\\n--- Agent Telemetry ---')
    print(f'Agents dispatched: {total_agents}')
    print(f'Total agent time: {total_agent_ms / 1000:.1f}s')
    print(f'Success: {total_agents - agent_errors} | Errors: {agent_errors}')
    for name, stats in sorted(agent_stats.items(), key=lambda x: -x[1]['count']):
        err_str = f' ({stats[\"errors\"]} errors)' if stats['errors'] else ''
        print(f'  {name}: {stats[\"count\"]}x, {stats[\"total_ms\"] / 1000:.1f}s{err_str}')

    # Emit AgentSessionSummary to telemetry
    telem_dir = os.path.expanduser('~/.claude/telemetry')
    os.makedirs(telem_dir, exist_ok=True)
    agent_summary_event = {
        'ts': timestamp,
        'session_id': session_id,
        'event': 'AgentSessionSummary',
        'meta': {
            'total_dispatched': total_agents,
            'total_ms': total_agent_ms,
            'error_count': agent_errors,
            'agents': agent_stats,
        }
    }
    telem_file = os.path.join(telem_dir, f'{now.strftime(\"%Y-%m-%d\")}.jsonl')
    with open(telem_file, 'a') as f:
        fcntl.flock(f, fcntl.LOCK_EX)
        f.write(json.dumps(agent_summary_event) + '\n')
        fcntl.flock(f, fcntl.LOCK_UN)

# Clean up orphaned span files older than 1 hour
span_dir = '/tmp/lore-agent-spans'
if os.path.isdir(span_dir):
    import time
    cutoff = time.time() - 3600
    for fname in os.listdir(span_dir):
        fpath = os.path.join(span_dir, fname)
        try:
            if os.path.getmtime(fpath) < cutoff:
                os.remove(fpath)
        except OSError:
            pass

agent_note = f' ({total_agents} agents)' if total_agents > 0 else ''
print(f'Session summary saved{agent_note}')
" 2>/dev/null || true

exit 0
