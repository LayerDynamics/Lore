---
name: session-debugging
description: Use when the user reports a problem with a specific Claude Code session, needs to diagnose why something went wrong, wants to understand errors in detail, or asks "what happened in my last session". Trigger on phrases like "debug my session", "why did that fail", "what went wrong", "replay my session", or when investigating specific errors.
---

Help diagnose issues in specific Claude Code sessions by analyzing the complete session context including tool calls, errors, thinking blocks, and system messages.

## When to Use

Activate when the user:
- Reports a specific session had problems ("my last session failed")
- Wants to understand why something went wrong
- Asks about errors in a particular session
- Needs to trace what happened step-by-step
- Says "what happened when..." or "why did X fail"
- Wants full context around an error

## Debugging Process

### 1. Identify the Session

If user doesn't specify which session:
- Run `/cc-telemetry:sessions` to show recent sessions
- Ask user to identify the problematic session by slug or time
- Alternatively, if they mention "last session", use the most recent

### 2. Get Full Session Context

Gather comprehensive data:
```
/cc-telemetry:replay <session-id>
/cc-telemetry:errors --session <session-id>
/cc-telemetry:performance --session <session-id>
```

### 3. Analyze the Timeline

Look for:
- **Error sequences**: What errors occurred and when?
- **Error context**: What tool calls preceded the error?
- **Thinking analysis**: What was Claude trying to do before the error?
- **Timing issues**: Were there unusually slow operations?
- **Tool chains**: What sequence of tools led to the problem?

### 4. Examine Error Details

For each error found:
- Review full error message and stack trace
- Check tool input that triggered the error
- Look at thinking block before the error (what Claude planned)
- Identify context tool calls (last 5 operations)
- Check if recovery was attempted

### 5. Determine Root Cause

Common root causes:
- **Bad input**: Tool called with invalid parameters
- **Environment issue**: Missing dependencies, wrong paths
- **Timing**: Race conditions, timeouts
- **Logic error**: Claude's reasoning led to wrong approach
- **External failure**: API down, network issue, file missing

### 6. Provide Diagnosis

Present findings:
```
## Session Diagnosis: <session-slug>

**Summary**: [1-2 sentence description of what went wrong]

**Timeline**:
1. [timestamp] Claude thought: [thinking summary]
2. [timestamp] Tool called: [tool name with input]
3. [timestamp] ERROR: [error message]

**Root Cause**: [explanation of why it failed]

**Context**: [what led to this situation]

**Fix**: [how to avoid this in future]
```

## Example Debugging Sessions

**User: "My last session kept failing on file writes"**

1. Get last session: `/cc-telemetry:sessions --tail 1`
2. Replay session: `/cc-telemetry:replay <id>`
3. Filter for Write errors: `/cc-telemetry:search-errors "Write"`
4. Analyze:
   - Check file paths in tool inputs
   - Look for permission errors in results
   - Check if files exist (from thinking/context)
   - Identify pattern (same file, same error?)
5. Diagnose: "All Write errors are for `/readonly/file.txt` - the file is in a read-only directory"
6. Fix: "Move the file to a writable location like `~/project/file.txt`"

**User: "Why was my session so slow?"**

1. Get session: identify from description or recent list
2. Performance analysis: `/cc-telemetry:performance --session <id>`
3. Find outliers: tools that took >2s
4. Check thinking: were these expected to be slow operations?
5. Diagnose: "The `Read` tool took 15s because you were reading a 50MB log file"
6. Fix: "Use `head` or `tail` to read only relevant portions of large files"

## Tips

- Always start with full replay to see the complete picture
- Focus on the error and the 2-3 operations before it
- Check thinking blocks to understand intent vs. what actually happened
- Look for patterns (same error multiple times = systemic issue)
- Consider timing (did it timeout? was it unexpectedly slow?)
- Check system messages for hook blocks or permission denials
- If root cause is unclear, gather more context or use telemetry-analyzer agent

## When to Escalate

Use the telemetry-analyzer agent when:
- Multiple different errors in the session
- Root cause is not obvious from timeline
- Need to compare against baseline/other sessions
- Complex interaction between multiple factors
- User wants comprehensive analysis beyond single session

