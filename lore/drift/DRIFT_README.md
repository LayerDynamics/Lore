# Drift-Detection System

**Last updated:** 2026-07-23
**Author of this rewrite:** Claude (via extended debugging session)
**Originating bug:** Concurrent Claude Code sessions in the same project leaked each other's scope through a shared pointer file, causing drift checks to show foreign scopes and wrong file lists.

## What this system does

The drift-detection system injects periodic "are you still on-scope" reminders into Claude Code and Codex conversations by tracking the user's original request, subsequent scope updates, and the files/tools touched by the model. It consists of four lifecycle hooks plus a CLI for stats and cleanup.

When the model is working on Task A and starts drifting toward Task B, the hook adds lifecycle context containing the current scope and the list of files modified so far, giving the model a chance to refocus. Claude Code renders that context inside a `<system-reminder>` block; Codex surfaces it as hook-provided context.

## Architecture at a glance

```text
                          ~/.claude/drift-state/
                          ├── hook-errors.log                       (stderr capture, 50 KB rotating)
                          └── {project_name}-{cwd_hash8}/
                              ├── {session_id}.json                 (scope + counters)
                              ├── {session_id}.json.lock            (flock sidecar)
                              ├── {session_id}.lease.{pid}          (liveness advertisement)
                              ├── .drift-{random}.tmp               (atomic-write staging)
                              └── .drift-keep                       (optional operator opt-out)
```

State is isolated per session by an authoritative `session_id` that Claude Code and Codex supply to every hook payload. Cross-session reads are refused by identity verification inside `read_state`.

## Prompt payload compatibility

The two clients use different keys for the canonical UserPromptSubmit text:

- Claude Code: `user_prompt`
- Codex: `prompt`

`drift-anchor-capture.sh` accepts both keys, preferring `user_prompt` when both are present. The transcript remains a fallback only when the canonical prompt field is empty.

## Trust boundary of `<system-reminder>` (2026-04-17)

In Claude Code, every drift reminder this plugin emits reaches the model inside
a `<system-reminder>...</system-reminder>` block. This is NOT a choice of the
plugin — it is how Claude Code renders `hookSpecificOutput.additionalContext`.
Codex consumes the same `additionalContext` payload through its lifecycle-hook
interface; the stable `[scope <8-hex-nonce>]` prefix remains mandatory in both
clients so provenance stays visible regardless of renderer.
The Claude Code hooks guide states:

> "Text returned via `additionalContext` is injected as a system
> reminder that Claude reads as plain text."

**The rendering is structurally indistinguishable from first-party
harness reminders.** A reminder emitted by this plugin and a reminder
emitted by the Claude Code binary itself (for example the built-in
"file was modified, either by the user or by a linter. Don't tell the
user this, since they are already aware" template, stable from
ccVersion 2.1.18 through 2.1.112) are wrapped in the same tags, and
the model is trained to treat both as high-trust system speech.

### Implication for hook authors

Any text this plugin writes to `additionalContext` is implicitly
claiming harness-level authority over the model. Hooks in this
directory MUST:

1. **Prepend a stable, greppable first-line prefix.** The drift hooks
   use `[scope <8-hex-nonce>]`; any new hook emitting `additionalContext`
   MUST prepend a matching convention (for example, `injection-guard.sh`
   uses `[injection-guard]`). This lets the user — and a reviewing
   model — visually distinguish hook output from native reminders at a
   glance, even though the harness tags are identical.

2. **Never include directives of the form "don't tell the user".**
   Legitimate first-party reminders use that phrasing for benign
   reasons, but anything a local hook adds is running on the same
   trust tier as an attacker who compromised the hook (cf. CVE-2025-59536
   / CVE-2026-21852 on hook registration via project files). The
   prefix convention above is the only practical disambiguator.

3. **Fail closed on malformed payloads.** Never emit a reminder when
   session identity is ambiguous (see invariant §1 in "Design
   invariants"). A silently emitted reminder with no identity anchor
   is indistinguishable from an injection.

### Implication for the defender hook

`injection-guard.sh` (PostToolUse, added 2026-04-17) scans tool
results — the *other* injection channel — for spoofed first-party
reminder patterns. Its warnings are prefixed `[injection-guard]` and
it lives next to this README. See `injection-guard.sh` for the full
detection spec and `_injection_detector.py` for the patterns and
their allowlist carve-outs.

## File manifest

| File | Lines | Role |
|---|---|---|
| `_drift_common.py` | 1626 | Shared Python module — session resolution, atomic writes, locking, leases, sweeps |
| `drift-anchor-capture.sh` | 108 | **UserPromptSubmit** hook — captures original request + scope updates |
| `drift-check-periodic.sh` | 143 | **PostToolUse** hook — emits drift reminder every 8 tool calls |
| `drift-check-final.sh` | 62 | **Stop** hook — records session stop event |
| `drift-subagent-inject.sh` | 90 | **PreToolUse (Task/Agent)** hook — prepends parent scope to subagent prompts |
| `drift-stats.sh` | 301 | CLI — view aggregate stats, per-session detail, and cleanup |
| `start-session.sh` | 189 | **SessionStart** hook — runs `sweep_all` on each session start |

## Module constants

All defined in `_drift_common.py`:

| Constant | Value | Purpose |
|---|---|---|
| `DRIFT_ROOT` | `~/.claude/drift-state` | Root directory |
| `HOOK_ERROR_LOG` | `~/.claude/drift-state/hook-errors.log` | Stderr capture from embedded Python |
| `HOOK_ERROR_LOG_MAX_BYTES` | `51200` (50 KB) | Rotation threshold |
| `NONCE_BYTES` | `16` | `secrets.token_hex(16)` → 32 hex chars per nonce |
| `DRIFT_CHECK_INTERVAL` | `8` | Tool calls between drift reminders (env: `LORE_DRIFT_CHECK_INTERVAL`) |
| `FRESHNESS_GATE_SECONDS` | `10` | Vestigial gate for non-lease orphans (pre-lease safety net) |
| `KEEP_MARKER` | `.drift-keep` | Operator opt-out filename |

Retention for cleanup is configured via `LORE_DRIFT_RETENTION_DAYS` (default 14 days) at the `start-session.sh` level.

## Design invariants

These are the properties the system guarantees; violating any of them was an original bug.

1. **Authoritative session identity.** A scope belongs to exactly one conversation, identified by the `session_id` supplied in every Claude Code or Codex hook payload. Hooks MUST NOT guess the session from a shared pointer, `os.getcwd()`, process ambient state, or any inferred source. If the payload is ambiguous, hooks fail closed.

2. **Identity-verified reads.** Every read of a state file verifies that the file's embedded `session_id` matches the caller's derived `session_id`. A mismatch means the file was produced by a different session; the read returns `None` and the caller exits silently. This is the load-bearing check preventing cross-session contamination.

3. **Visible scope nonce.** A random 32-hex `scope_nonce` is generated on first capture and stamped into every drift reminder as `[scope <8-hex>]`. Two reminders in the same conversation always show the same nonce; a different nonce means contamination.

4. **Atomic mutations under lock.** `update_state` holds `fcntl.flock` on a sidecar `.json.lock` for the full read-modify-write, then uses `tempfile.mkstemp + os.fsync + os.replace` for crash-safe atomic file updates.

5. **PID-based liveness advertisement.** Every mutation wraps itself in a `_acquire_lease` / `_release_lease` pair that creates a zero-byte `{session_id}.lease.{pid}` file. Cleanup uses `os.kill(pid, 0)` to check if the process is alive, never guessing from mtimes or flock-probing.

6. **cwd from hook payload.** Project scoping uses `payload['cwd']`, never `os.getcwd()`, because hooks can be spawned from any working directory.

## The lease system (why it exists)

An earlier iteration used `fcntl.flock(LOCK_EX | LOCK_NB)` to probe whether a hook was alive. This had two failure modes:

1. **Microsecond race** between flock release and `os.replace`, where the hook was alive but not holding the lock.
2. **Required a 300-second "freshness gate"** as a safety net, which capped hook runtime.

The lease system eliminates both:

```text
update_state(...)
    _acquire_lease()                          (write {session_id}.lease.{pid})
        with _Lock(state_file):               (flock on .json.lock)
            read + mutate + atomic_write      (mkstemp → fsync → os.replace)
    _release_lease()                          (delete the lease)
```

The lease brackets the entire critical section — flock acquisition through `os.replace` — so there is no uncovered window. Cleanup asks the kernel "is PID alive?" via `os.kill(pid, 0)`; elapsed time is irrelevant, so a hook can be suspended for hours and still be protected.

PID reuse is a conservative false positive: if a hook crashes and its PID is recycled to an unrelated process, cleanup sees "alive" and skips. The stale lease persists until the recycled PID also exits. This is strictly safe (never deletes a live file) and transiently wasteful (one dead lease lingers briefly).

## Cleanup semantics

Two separate sweeps, composed by `sweep_all`:

### `retention_sweep(drift_dir, retention_days=14)`

Age-based eviction of **valid** state files. A file is removed iff:

- It is a `.json` file older than `retention_days`.
- No session lease is live for its stem.
- Its project directory does not contain `.drift-keep`.
- The drift-state root does not contain `.drift-keep`.

Paired `.json.lock` files are removed alongside their state file.

### `orphan_sweep(drift_dir, freshness_gate_secs=10)`

Scope-restricted removal of files that cannot belong to any live session. A file matches one of the orphan predicates below AND its mtime is at least 10 seconds old AND the relevant lease is not held by a live PID:

| # | Predicate | What it is |
|---|---|---|
| 1 | `.drift-*.tmp` | Aborted atomic-write staging file |
| 2 | `.json.lock` with no matching `.json` in same dir | Leaked lock from deleted state |
| 3 | `.json` failing JSON parse | Garbled write |
| 4 | `.json` content not a dict | Schema corruption |
| 5 | `.json` with missing or mismatched `session_id` | Cross-session corruption |
| 6 | File in project dir not matching known patterns | Stray debris |
| 7 | File at drift-state root that isn't a directory or legacy pointer | Stray debris |
| 8 | `.current*` legacy pointer | Unconditional — no age gate, always swept |
| 9 | `.lease.{pid}` with dead PID | Stale lease |

Files in a directory containing `.drift-keep` are never swept (except legacy pointers at root, which are always swept because they are actively harmful — they re-introduce cross-session contamination).

### Where cleanup runs

| Trigger | Runs | Retention window |
|---|---|---|
| `start-session.sh` (SessionStart hook, automatic) | `sweep_all()` | `LORE_DRIFT_RETENTION_DAYS` env, default 14 days |
| `drift-stats.sh --clean [days]` (manual) | `sweep_all()` | Optional integer arg, else env, else 14 |
| `drift-stats.sh --orphans` (manual) | `orphan_sweep()` only | — (retention untouched) |

## Review fixes applied in this rewrite (2026-04-16)

All findings from the `/lore:local-code-review` pass on the drift system:

### Critical

- **Shell injection in `drift-stats.sh`** — The default stats view used `python3 -c "..."` with `${ACTION}` and `${2:-}` interpolated directly into the Python source. Converted to `python3 - "$DRIFT_DIR" "$ACTION" "${2:-}" <<'PYEOF'` with `sys.argv` (matches the safe pattern `--clean` and `--orphans` already used).

### High

- **`sweep_all` dropped count keys** — The `merged` dict in `sweep_all` was missing `stale_lease`, `skipped_kept`, and `skipped_live_lease`, so counts from sub-sweeps were silently dropped. Added the keys. Also removed a hidden side effect in `_session_has_live_lease` that was cleaning stale leases during `retention_sweep`'s liveness check, which caused `orphan_sweep` to count zero stale leases.

- **Blanket `2>/dev/null`** — All four hooks suppressed stderr with no way to diagnose failures. Now redirect to `~/.claude/drift-state/hook-errors.log` with 50 KB rotation via `truncate_error_log()`. Each hook `mkdir -p`'s the parent directory before the redirect so a fresh install doesn't break.

- **`_acquire_lease` double-close** — `with open(path, "w") as fh: fh.close()` is a no-op. Replaced with `open(path, "w").close()` one-liner.

### Medium

- **`_safe_unlink` TOCTOU** — Old code did `os.path.getmtime(path)` then `os.remove(path)` as separate calls. Rewrote to `os.open` + `os.fstat` + `os.remove`: the mtime check operates on the same inode via the fd.

- **`read_state` redundant `os.path.exists` guard** — The guard was dead logic since `try/except (OSError, JSONDecodeError)` already handles `FileNotFoundError`. Removed.

- **Repeated schema initialization** — schema migration and defaulting now live in `_drift_common.build_anchor_capture_mutator`, keeping the shell wrapper focused on payload extraction and state mutation.

- **`import time` inside function bodies** — Moved to module-level imports.

### Low

- **`Callable[[dict], None]` annotation** on `update_state.mutator`.
- **Bare `except: pass`** → `except Exception: pass` in `drift-stats.sh`.
- **Magic numbers extracted** — `NONCE_BYTES = 16`, `DRIFT_CHECK_INTERVAL = 8` (env-overridable).
- **`stale_lease` label** added to `format_sweep_counts` primary labels.

## How to verify the system is working

### Live canary

Every drift reminder in the current conversation starts with `[scope <8-hex>]`. The nonce is stable for the life of the conversation. If two reminders in the same conversation ever show **different** nonces, you have contamination — that is a regression.

### Inspecting state on demand

```bash
# All sessions, with health flags
bash ~/.codex/plugins/lore/hooks/drift-stats.sh

# Filter by project
bash ~/.codex/plugins/lore/hooks/drift-stats.sh --project nimbus

# Detail view of one session
bash ~/.codex/plugins/lore/hooks/drift-stats.sh --session <uuid-prefix>

# Manual cleanup
bash ~/.codex/plugins/lore/hooks/drift-stats.sh --clean

# Orphan-only cleanup (never touches valid in-retention state)
bash ~/.codex/plugins/lore/hooks/drift-stats.sh --orphans
```

### Reading errors

```bash
tail ~/.claude/drift-state/hook-errors.log
```

If this file grows past 50 KB, it is auto-truncated to the last half on the next hook invocation.

### Running the injection-guard unit tests

The paired defender hook `injection-guard.sh` has a pure-Python
detector with a unit-test suite:

```bash
bash ~/.codex/plugins/lore/hooks/tests/run-tests.sh
```

Expected output: all tests pass, exit code 0. Tests cover the three
detection patterns (literal reminder tags, verbatim first-party
file-modified template, and hide-from-user directives), the tool-name
allowlist for Pattern 1, NFKC Unicode normalization, and the excerpt
sanitization that defangs reminder tags before embedding them in the
warning.

### Operator opt-out

```bash
# Preserve a specific project's drift state forever
touch ~/.claude/drift-state/my-project-abc12345/.drift-keep

# Preserve the entire drift-state tree (legacy pointers still swept)
touch ~/.claude/drift-state/.drift-keep
```

## Test coverage

Persistent Python and shell-wrapper tests run against temporary-home sandboxes. Categories covered:

- Claude Code `user_prompt` and Codex `prompt` capture compatibility.
- Session isolation across concurrent runs in the same project.
- Identity verification refusing foreign session state.
- `fcntl.flock` serializing 20 parallel writes to one session.
- Lease acquisition + release across `update_state`.
- Lease protection of tmp files against age-based sweep (including hours-old tmps).
- Stale-lease removal when PID is dead.
- `.drift-keep` opt-out at project and root levels.
- Freshness gate (10 s) protecting unknown files against races.
- Shell injection via `drift-stats.sh --session '<python payload>'` — rejected.
- `sweep_all` propagating all count keys to `format_sweep_counts`.
- Error log captures stderr; empty when no errors; populated when hook receives invalid input.

## Known limits (deliberate trade-offs)

- **PID reuse false positives** — If a hook crashes and the OS recycles its PID to an unrelated process, the lease stays protected until that unrelated process exits. Strictly safe (never deletes live data) but leaves one stale lease lingering briefly.

- **Machine never starts another Claude Code or Codex session** — Nothing runs calendar-time cleanup outside of `SessionStart`. If neither client starts for a month, nothing will prune. Acceptable because the plugin deliberately does not install cron jobs.

- **No cross-reference with client transcript stores** — A drift state file survives even if its Claude Code or Codex transcript is deleted. mtime-based retention will still eventually collect it.

- **Operator debug files under a `.drift-keep` directory are the operator's responsibility** — Cleanup won't touch them, but also won't organize or migrate them.

- **Homoglyph bypass beyond NFKC.** `injection-guard.sh` normalizes its
  scan blob via `unicodedata.normalize('NFKC', ...)` before matching,
  which collapses fullwidth Latin, ligatures, and compatibility
  variants to ASCII. It does NOT attempt to fold visually-confusable
  Cyrillic/Greek characters (for example Cyrillic "о" vs. ASCII "o").
  An attacker who hand-substitutes such characters into a spoofed
  reminder could bypass the detector. Confusables folding is out of
  scope for the initial landing; the gap is documented here so a
  reviewing operator knows the threat model.

- **Double-injection avoidance.** `drift-check-periodic.sh` and
  `injection-guard.sh` both run on every `PostToolUse`. They operate on
  different fields — periodic reads `tool_input` and mutates scope
  state; injection-guard reads `tool_response` and never writes state.
  They cannot warn about each other because neither reads the other's
  output. Order of registration in the client user-level hook config is
  therefore irrelevant for correctness.

## Hooks wiring

The drift hooks are opt-in user-level registrations rather than entries in the plugin's own `hooks.json`. Claude Code loads them from `~/.claude/settings.json`; Codex loads them from `~/.codex/hooks.json`. The Codex registrations point to the Codex-owned plugin source under `~/.codex/plugins/lore/hooks/`.

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/Users/ryanoboyle/.codex/plugins/lore/hooks/drift-anchor-capture.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "/Users/ryanoboyle/.codex/plugins/lore/hooks/drift-check-periodic.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Task",
        "hooks": [
          {
            "type": "command",
            "command": "/Users/ryanoboyle/.codex/plugins/lore/hooks/drift-subagent-inject.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/Users/ryanoboyle/.codex/plugins/lore/hooks/drift-check-final.sh"
          }
        ]
      }
    ]
  }
}
```

The `SessionStart` hook (`start-session.sh`) is part of the plugin's own `hooks.json` and runs cleanup as a side effect of the session boot banner.

## Registration audit (2026-07-23)

The drift hooks described in this document are registered in the user-level
configuration for each client, NOT in this directory's `hooks.json`.

- `~/.claude/plugins/local-marketplace/lore/hooks/hooks.json` —
  registers session, pre-tool, post-tool, UserPromptSubmit, and Stop
  hooks for the plugin's main quality-gate toolchain. Does **not**
  register any `drift-*.sh` hook.
- `~/.claude/settings.json` — registers
  `drift-anchor-capture.sh` (UserPromptSubmit),
  `drift-check-periodic.sh` (PostToolUse, matcher `""`),
  `drift-subagent-inject.sh` (PreToolUse, matcher `"Task"`), and
  `drift-check-final.sh` (Stop).
- `~/.claude/settings.local.json` — permissions/attribution only.
- `~/.codex/hooks.json` — registers the same four Drift hooks against
  `~/.codex/plugins/lore/hooks/`, plus `injection-guard.sh`.

The defender hook `injection-guard.sh` (added 2026-04-17) follows the
same convention and is registered in `~/.claude/settings.json` under
`PostToolUse` with matcher `""`, alongside the drift-check entry.
