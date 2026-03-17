#!/usr/bin/env python3
"""
cc-telemetry Web Dashboard — self-contained HTTP server with embedded UI.

Usage:
    python3 dashboard.py [--port 7900] [--no-open]

Serves a dark-themed dashboard for browsing telemetry data (sessions,
tool calls, errors, token usage, hook events) stored in the SQLite DB.
"""

import sys
import os
import json
import webbrowser
import argparse
import sqlite3
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse, parse_qs

# Add daemon dir to path so we can reuse db.py
DAEMON_DIR = Path(__file__).resolve().parent.parent / "daemon"
sys.path.insert(0, str(DAEMON_DIR))

import db


# ---------------------------------------------------------------------------
# Threaded HTTP server
# ---------------------------------------------------------------------------

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


# ---------------------------------------------------------------------------
# Request handler
# ---------------------------------------------------------------------------

class DashboardHandler(BaseHTTPRequestHandler):
    conn: sqlite3.Connection = None  # set at startup

    def log_message(self, format, *args):
        pass  # silence request logs

    def _json(self, data, status=200):
        body = json.dumps(data, default=str).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def _html(self, html):
        body = html.encode()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def _param(self, qs, key, default=None):
        return qs.get(key, [default])[0]

    def _int_param(self, qs, key, default):
        try:
            return int(qs.get(key, [default])[0])
        except (TypeError, ValueError):
            return default

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path.rstrip("/") or "/"
        qs = parse_qs(parsed.query)

        routes = {
            "/": self._serve_index,
            "/api/overview": self._api_overview,
            "/api/sessions": self._api_sessions,
            "/api/tools": self._api_tools,
            "/api/errors": self._api_errors,
            "/api/token-usage": self._api_token_usage,
            "/api/tool-breakdown": self._api_tool_breakdown,
            "/api/hook-events": self._api_hook_events,
        }

        # Check for /api/session/<id> pattern
        if path.startswith("/api/session/"):
            session_id = path[len("/api/session/"):]
            return self._api_session_detail(session_id)

        handler = routes.get(path)
        if handler:
            try:
                if handler == self._serve_index:
                    handler()
                else:
                    handler(qs)
            except Exception as e:
                self._json({"error": str(e)}, 500)
        else:
            self.send_error(404)

    # --- API endpoints ---

    def _api_overview(self, qs):
        conn = self.conn
        session_count = conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
        tool_count = conn.execute("SELECT COUNT(*) FROM tool_calls").fetchone()[0]
        error_count = conn.execute("SELECT COUNT(*) FROM tool_calls WHERE result_is_error=1").fetchone()[0]
        avg_dur = conn.execute("SELECT AVG(duration_ms) FROM tool_calls WHERE duration_ms IS NOT NULL").fetchone()[0]
        error_rate = (error_count / tool_count * 100) if tool_count > 0 else 0
        self._json({
            "sessions": session_count,
            "tool_calls": tool_count,
            "error_count": error_count,
            "error_rate": round(error_rate, 1),
            "avg_duration_ms": round(avg_dur, 1) if avg_dur else 0,
        })

    def _api_sessions(self, qs):
        limit = self._int_param(qs, "limit", 50)
        rows = db.query_sessions(self.conn, limit=limit)
        self._json(rows)

    def _api_session_detail(self, session_id):
        conn = self.conn
        row = conn.execute(
            "SELECT * FROM sessions WHERE session_id=?", (session_id,)
        ).fetchone()
        if not row:
            return self._json({"error": "session not found"}, 404)
        session = dict(row)
        tokens = conn.execute("""
            SELECT COALESCE(SUM(input_tokens),0) as input_tokens,
                   COALESCE(SUM(output_tokens),0) as output_tokens,
                   COALESCE(SUM(cache_read_tokens),0) as cache_read_tokens,
                   COALESCE(SUM(cache_write_tokens),0) as cache_write_tokens
            FROM api_metadata WHERE session_id=?
        """, (session_id,)).fetchone()
        session["tokens"] = dict(tokens)
        tool_count = conn.execute(
            "SELECT COUNT(*) FROM tool_calls WHERE session_id=?", (session_id,)
        ).fetchone()[0]
        error_count = conn.execute(
            "SELECT COUNT(*) FROM tool_calls WHERE session_id=? AND result_is_error=1", (session_id,)
        ).fetchone()[0]
        session["tool_call_count"] = tool_count
        session["error_count"] = error_count
        self._json(session)

    def _api_tools(self, qs):
        session_id = self._param(qs, "session_id")
        limit = self._int_param(qs, "limit", 100)
        rows = db.query_tool_calls(self.conn, session_id=session_id, limit=limit)
        self._json(rows)

    def _api_errors(self, qs):
        session_id = self._param(qs, "session_id")
        limit = self._int_param(qs, "limit", 50)
        rows = db.query_errors(self.conn, session_id=session_id, limit=limit)
        self._json(rows)

    def _api_token_usage(self, qs):
        session_id = self._param(qs, "session_id")
        rows = db.query_api_metadata(self.conn, session_id=session_id, limit=500)
        totals = {"input_tokens": 0, "output_tokens": 0, "cache_read_tokens": 0, "cache_write_tokens": 0}
        for r in rows:
            for k in totals:
                totals[k] += r.get(k) or 0
        self._json({"totals": totals, "records": rows})

    def _api_tool_breakdown(self, qs):
        session_id = self._param(qs, "session_id")
        clauses, params = [], []
        if session_id:
            clauses.append("session_id = ?")
            params.append(session_id)
        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        rows = self.conn.execute(f"""
            SELECT tool_name,
                   COUNT(*) as count,
                   COALESCE(AVG(duration_ms), 0) as avg_ms,
                   SUM(result_is_error) as errors
            FROM tool_calls {where}
            GROUP BY tool_name
            ORDER BY count DESC
            LIMIT 30
        """, params).fetchall()
        self._json([dict(r) for r in rows])

    def _api_hook_events(self, qs):
        session_id = self._param(qs, "session_id")
        limit = self._int_param(qs, "limit", 100)
        clauses, params = [], []
        if session_id:
            clauses.append("session_id = ?")
            params.append(session_id)
        where = ("WHERE " + " AND ".join(clauses)) if clauses else ""
        params.append(limit)
        rows = self.conn.execute(f"""
            SELECT * FROM hook_events {where}
            ORDER BY ts DESC LIMIT ?
        """, params).fetchall()
        self._json([dict(r) for r in rows])

    # --- Embedded HTML ---

    def _serve_index(self):
        self._html(INDEX_HTML)


# ---------------------------------------------------------------------------
# Embedded frontend
# ---------------------------------------------------------------------------

INDEX_HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>cc-telemetry Dashboard</title>
<style>
:root {
  --bg: #0d0d0f;
  --surface: #18181b;
  --border: #27272a;
  --text: #e4e4e7;
  --muted: #71717a;
  --accent: #7c6af7;
  --accent-dim: #5b4dc7;
  --red: #ef4444;
  --green: #22c55e;
  --yellow: #eab308;
  --blue: #3b82f6;
  --orange: #f97316;
}
* { margin:0; padding:0; box-sizing:border-box; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.5;
}
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

/* Layout */
.header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 16px;
}
.header h1 { font-size: 16px; font-weight: 600; }
.header .pill {
  background: var(--accent-dim);
  color: #fff;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
}

/* Session filter pill */
.session-filter {
  display: none;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  background: var(--surface);
  border: 1px solid var(--accent);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 12px;
}
.session-filter.active { display: flex; }
.session-filter .close {
  cursor: pointer;
  color: var(--muted);
  font-size: 14px;
}
.session-filter .close:hover { color: var(--red); }

/* Tabs */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
  overflow-x: auto;
}
.tab {
  padding: 10px 18px;
  cursor: pointer;
  color: var(--muted);
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
}
.tab:hover { color: var(--text); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }

/* Content area */
.content { padding: 24px; }
.section { display: none; }
.section.active { display: block; }

/* Stat cards */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px;
}
.card .label { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
.card .value { font-size: 28px; font-weight: 700; margin-top: 4px; }
.card .value.error { color: var(--red); }

/* Tables */
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
th {
  text-align: left;
  padding: 8px 12px;
  color: var(--muted);
  font-weight: 500;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
}
td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
tr:hover td { background: rgba(124, 106, 247, 0.05); }
tr.error-row td { color: var(--red); }
tr.clickable { cursor: pointer; }

/* Error expandable */
.error-detail {
  display: none;
  padding: 12px;
  background: #1a1a1f;
  border: 1px solid var(--border);
  border-radius: 6px;
  margin: 4px 0 8px;
  white-space: pre-wrap;
  font-size: 11px;
  color: var(--muted);
  max-height: 300px;
  overflow-y: auto;
}
.error-detail.open { display: block; }

/* Bar chart */
.bar-chart { margin-top: 16px; }
.bar-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}
.bar-label { width: 200px; text-align: right; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bar-track { flex: 1; height: 22px; background: var(--surface); border-radius: 4px; overflow: hidden; position: relative; }
.bar-fill { height: 100%; background: var(--accent); border-radius: 4px; transition: width 0.3s; min-width: 2px; }
.bar-fill.error { background: var(--red); }
.bar-value { width: 80px; font-size: 11px; color: var(--muted); }

/* Token chart */
.token-bar {
  display: flex;
  height: 32px;
  border-radius: 6px;
  overflow: hidden;
  margin: 12px 0;
}
.token-bar > div { height: 100%; transition: width 0.3s; }
.token-legend {
  display: flex;
  gap: 20px;
  font-size: 12px;
  margin-top: 8px;
}
.token-legend .dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  margin-right: 6px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--muted);
}

/* Refresh indicator */
.refresh-indicator {
  position: fixed;
  bottom: 16px;
  right: 16px;
  font-size: 11px;
  color: var(--muted);
  background: var(--surface);
  padding: 4px 10px;
  border-radius: 12px;
  border: 1px solid var(--border);
}
</style>
</head>
<body>

<div class="header">
  <h1>cc-telemetry</h1>
  <span class="pill">dashboard</span>
  <div class="session-filter" id="sessionFilter">
    <span>Session: <strong id="sessionFilterLabel"></strong></span>
    <span class="close" onclick="clearSessionFilter()">&times;</span>
  </div>
</div>

<div class="tabs" id="tabs">
  <div class="tab active" data-tab="overview">Overview</div>
  <div class="tab" data-tab="sessions">Sessions</div>
  <div class="tab" data-tab="tools">Tools</div>
  <div class="tab" data-tab="errors">Errors</div>
  <div class="tab" data-tab="tokens">Tokens</div>
  <div class="tab" data-tab="breakdown">Tool Breakdown</div>
  <div class="tab" data-tab="hooks">Hooks</div>
</div>

<div class="content">

  <!-- Overview -->
  <div class="section active" id="sec-overview">
    <div class="cards" id="overviewCards"></div>
  </div>

  <!-- Sessions -->
  <div class="section" id="sec-sessions">
    <table>
      <thead><tr><th>Slug</th><th>Started</th><th>Last Seen</th><th>Tool Calls</th><th>Errors</th><th>CWD</th></tr></thead>
      <tbody id="sessionsBody"></tbody>
    </table>
  </div>

  <!-- Tools -->
  <div class="section" id="sec-tools">
    <table>
      <thead><tr><th>Time</th><th>Tool</th><th>Duration</th><th>Status</th><th>Result</th></tr></thead>
      <tbody id="toolsBody"></tbody>
    </table>
  </div>

  <!-- Errors -->
  <div class="section" id="sec-errors">
    <table>
      <thead><tr><th>Time</th><th>Tool</th><th>Error</th><th>Session</th></tr></thead>
      <tbody id="errorsBody"></tbody>
    </table>
    <div id="errorDetails"></div>
  </div>

  <!-- Tokens -->
  <div class="section" id="sec-tokens">
    <div class="cards" id="tokenCards"></div>
    <div class="token-bar" id="tokenBar"></div>
    <div class="token-legend" id="tokenLegend"></div>
  </div>

  <!-- Tool Breakdown -->
  <div class="section" id="sec-breakdown">
    <div class="bar-chart" id="breakdownChart"></div>
  </div>

  <!-- Hooks -->
  <div class="section" id="sec-hooks">
    <table>
      <thead><tr><th>Time</th><th>Event</th><th>Hook Name</th><th>Command</th><th>Tool Use ID</th></tr></thead>
      <tbody id="hooksBody"></tbody>
    </table>
  </div>

</div>

<div class="refresh-indicator" id="refreshIndicator">Auto-refresh: 5s</div>

<script>
// State
let activeTab = 'overview';
let activeSession = null;
let refreshTimer = null;

// --- Tab switching ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    activeTab = tab.dataset.tab;
    document.getElementById('sec-' + activeTab).classList.add('active');
    loadTab(activeTab);
  });
});

// --- Session filter ---
function setSessionFilter(id, label) {
  activeSession = id;
  document.getElementById('sessionFilterLabel').textContent = label;
  document.getElementById('sessionFilter').classList.add('active');
  loadTab(activeTab);
}

function clearSessionFilter() {
  activeSession = null;
  document.getElementById('sessionFilter').classList.remove('active');
  loadTab(activeTab);
}

// --- Helpers ---
function fmtTs(ts) {
  if (!ts) return '—';
  try {
    const d = new Date(ts);
    return d.toLocaleString('en-US', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  } catch(e) { return ts; }
}

function fmtDur(ms) {
  if (ms == null) return '—';
  return ms < 1000 ? ms + 'ms' : (ms/1000).toFixed(1) + 's';
}

function truncate(s, n) {
  if (!s) return '';
  s = s.replace(/\n/g, ' ');
  return s.length > n ? s.slice(0, n) + '...' : s;
}

function fmtNum(n) {
  if (n == null) return '0';
  return n.toLocaleString();
}

function esc(s) {
  if (!s) return '';
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

async function api(path) {
  const sep = path.includes('?') ? '&' : '?';
  const url = activeSession ? path + sep + 'session_id=' + encodeURIComponent(activeSession) : path;
  const res = await fetch(url);
  return res.json();
}

// --- Loaders ---
async function loadOverview() {
  const data = await api('/api/overview');
  document.getElementById('overviewCards').innerHTML = `
    <div class="card"><div class="label">Sessions</div><div class="value">${fmtNum(data.sessions)}</div></div>
    <div class="card"><div class="label">Tool Calls</div><div class="value">${fmtNum(data.tool_calls)}</div></div>
    <div class="card"><div class="label">Error Rate</div><div class="value${data.error_rate > 5 ? ' error' : ''}">${data.error_rate}%</div></div>
    <div class="card"><div class="label">Avg Duration</div><div class="value">${fmtDur(data.avg_duration_ms)}</div></div>
  `;
}

async function loadSessions() {
  const rows = await fetch('/api/sessions?limit=100').then(r => r.json());
  const body = document.getElementById('sessionsBody');
  if (!rows.length) { body.innerHTML = '<tr><td colspan="6" class="empty-state">No sessions</td></tr>'; return; }
  body.innerHTML = rows.map(r => `
    <tr class="clickable" onclick="setSessionFilter('${esc(r.session_id)}', '${esc(r.slug || r.session_id.slice(0,8))}')">
      <td>${esc(r.slug || r.session_id.slice(0,8))}</td>
      <td>${fmtTs(r.started_at)}</td>
      <td>${fmtTs(r.last_seen_at)}</td>
      <td>${r.tool_call_count || 0}</td>
      <td${(r.error_count||0) > 0 ? ' style="color:var(--red)"' : ''}>${r.error_count || 0}</td>
      <td>${esc(truncate(r.cwd, 40))}</td>
    </tr>
  `).join('');
}

async function loadTools() {
  const rows = await api('/api/tools?limit=100');
  const body = document.getElementById('toolsBody');
  if (!rows.length) { body.innerHTML = '<tr><td colspan="5" class="empty-state">No tool calls</td></tr>'; return; }
  body.innerHTML = rows.map(r => `
    <tr class="${r.result_is_error ? 'error-row' : ''}">
      <td>${fmtTs(r.started_at)}</td>
      <td>${esc(r.tool_name)}</td>
      <td>${fmtDur(r.duration_ms)}</td>
      <td>${r.result_is_error ? 'ERROR' : 'ok'}</td>
      <td title="${esc(r.result_preview || '')}">${esc(truncate(r.result_preview, 60))}</td>
    </tr>
  `).join('');
}

async function loadErrors() {
  const rows = await api('/api/errors?limit=50');
  const body = document.getElementById('errorsBody');
  const details = document.getElementById('errorDetails');
  if (!rows.length) { body.innerHTML = '<tr><td colspan="4" class="empty-state">No errors</td></tr>'; details.innerHTML = ''; return; }
  body.innerHTML = rows.map((r, i) => `
    <tr class="error-row clickable" onclick="toggleError(${i})">
      <td>${fmtTs(r.ts)}</td>
      <td>${esc(r.tool_name || '—')}</td>
      <td title="${esc(r.error_message || '')}">${esc(truncate(r.error_message, 60))}</td>
      <td>${esc(r.slug || '')}</td>
    </tr>
  `).join('');
  // store for expand
  window._errors = rows;
  details.innerHTML = rows.map((r, i) => `
    <div class="error-detail" id="errDetail${i}">
<strong>Error:</strong> ${esc(r.error_message || '')}

<strong>Stack Trace:</strong>
${esc(r.stack_trace || 'N/A')}

<strong>Thinking Before:</strong>
${esc(truncate(r.thinking_before, 500) || 'N/A')}
    </div>
  `).join('');
}

function toggleError(idx) {
  const el = document.getElementById('errDetail' + idx);
  if (el) el.classList.toggle('open');
}

async function loadTokens() {
  const data = await api('/api/token-usage');
  const t = data.totals;
  const total = t.input_tokens + t.output_tokens + t.cache_read_tokens + t.cache_write_tokens;

  document.getElementById('tokenCards').innerHTML = `
    <div class="card"><div class="label">Input Tokens</div><div class="value">${fmtNum(t.input_tokens)}</div></div>
    <div class="card"><div class="label">Output Tokens</div><div class="value">${fmtNum(t.output_tokens)}</div></div>
    <div class="card"><div class="label">Cache Read</div><div class="value">${fmtNum(t.cache_read_tokens)}</div></div>
    <div class="card"><div class="label">Cache Write</div><div class="value">${fmtNum(t.cache_write_tokens)}</div></div>
  `;

  const bar = document.getElementById('tokenBar');
  if (total === 0) {
    bar.innerHTML = '<div style="width:100%;background:var(--surface)"></div>';
  } else {
    const pct = k => ((t[k] / total) * 100).toFixed(1);
    bar.innerHTML = `
      <div style="width:${pct('input_tokens')}%;background:var(--blue)" title="Input: ${fmtNum(t.input_tokens)}"></div>
      <div style="width:${pct('output_tokens')}%;background:var(--green)" title="Output: ${fmtNum(t.output_tokens)}"></div>
      <div style="width:${pct('cache_read_tokens')}%;background:var(--yellow)" title="Cache Read: ${fmtNum(t.cache_read_tokens)}"></div>
      <div style="width:${pct('cache_write_tokens')}%;background:var(--orange)" title="Cache Write: ${fmtNum(t.cache_write_tokens)}"></div>
    `;
  }

  document.getElementById('tokenLegend').innerHTML = `
    <span><span class="dot" style="background:var(--blue)"></span>Input (${fmtNum(t.input_tokens)})</span>
    <span><span class="dot" style="background:var(--green)"></span>Output (${fmtNum(t.output_tokens)})</span>
    <span><span class="dot" style="background:var(--yellow)"></span>Cache Read (${fmtNum(t.cache_read_tokens)})</span>
    <span><span class="dot" style="background:var(--orange)"></span>Cache Write (${fmtNum(t.cache_write_tokens)})</span>
  `;
}

async function loadBreakdown() {
  const rows = await api('/api/tool-breakdown');
  const chart = document.getElementById('breakdownChart');
  if (!rows.length) { chart.innerHTML = '<div class="empty-state">No data</div>'; return; }
  const maxCount = Math.max(...rows.map(r => r.count));
  chart.innerHTML = rows.map(r => {
    const pct = (r.count / maxCount * 100).toFixed(1);
    const hasErrors = (r.errors || 0) > 0;
    return `
      <div class="bar-row">
        <div class="bar-label" title="${esc(r.tool_name)}">${esc(r.tool_name)}</div>
        <div class="bar-track">
          <div class="bar-fill${hasErrors ? ' error' : ''}" style="width:${pct}%"></div>
        </div>
        <div class="bar-value">${r.count} calls &middot; ${fmtDur(r.avg_ms)}</div>
      </div>
    `;
  }).join('');
}

async function loadHooks() {
  const rows = await api('/api/hook-events?limit=100');
  const body = document.getElementById('hooksBody');
  if (!rows.length) { body.innerHTML = '<tr><td colspan="5" class="empty-state">No hook events</td></tr>'; return; }
  body.innerHTML = rows.map(r => `
    <tr>
      <td>${fmtTs(r.ts)}</td>
      <td>${esc(r.hook_event || '')}</td>
      <td>${esc(r.hook_name || '')}</td>
      <td>${esc(truncate(r.command, 50) || '')}</td>
      <td>${esc(truncate(r.tool_use_id, 20) || '')}</td>
    </tr>
  `).join('');
}

// --- Tab dispatcher ---
function loadTab(tab) {
  const loaders = {
    overview: loadOverview,
    sessions: loadSessions,
    tools: loadTools,
    errors: loadErrors,
    tokens: loadTokens,
    breakdown: loadBreakdown,
    hooks: loadHooks,
  };
  if (loaders[tab]) loaders[tab]();
}

// --- Auto-refresh ---
function startRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => loadTab(activeTab), 5000);
}

// --- Init ---
loadTab('overview');
startRefresh();
</script>
</body>
</html>
"""


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="cc-telemetry web dashboard")
    parser.add_argument("--port", type=int, default=7900, help="Port (default: 7900)")
    parser.add_argument("--no-open", action="store_true", help="Don't auto-open browser")
    args = parser.parse_args()

    conn = db.open_db()
    DashboardHandler.conn = conn

    server = ThreadedHTTPServer(("127.0.0.1", args.port), DashboardHandler)
    url = f"http://127.0.0.1:{args.port}"
    print(f"cc-telemetry dashboard running at {url}")

    if not args.no_open:
        webbrowser.open(url)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.shutdown()
        conn.close()


if __name__ == "__main__":
    main()
