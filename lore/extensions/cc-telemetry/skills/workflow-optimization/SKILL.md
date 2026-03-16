---
name: workflow-optimization
description: Use when the user wants to improve their Claude Code usage efficiency, reduce errors, speed up workflows, or asks "how can I be more productive", "optimize my usage", "what am I doing wrong", or wants suggestions to work more effectively.
---

Help users optimize their Claude Code workflows by analyzing usage patterns, identifying inefficiencies, and suggesting improvements.

## When to Use

Activate when the user:
- Asks how to be more efficient ("how can I work faster?")
- Wants to reduce errors ("how do I stop making mistakes?")
- Requests optimization advice ("optimize my workflow")
- Says they feel unproductive or slow
- Wants best practices ("am I using this right?")
- Asks "what should I change?"

## Optimization Process

### 1. Understand Current State

Gather usage data:
```
/cc-telemetry:stats
/cc-telemetry:sessions --tail 10
/cc-telemetry:errors --tail 20
/cc-telemetry:performance
```

### 2. Identify Optimization Opportunities

Look for:

**Performance Inefficiencies**:
- Slow tools that could be avoided
- Redundant operations (same file read 10x)
- Large operations that could be chunked
- Tools used inappropriately (Read for 50MB file)

**Error Patterns**:
- Recurring errors that indicate workflow issues
- Common mistakes that could be prevented
- Tools frequently used incorrectly

**Workflow Issues**:
- Suboptimal tool chains (Edit→Read→Edit→Read...)
- Missing tools that would help (never using Grep)
- Overusing tools (Write when Edit would work)
- Manual operations that could be automated

**Unused Potential**:
- Enabled plugins never invoked
- Skills that could help but aren't triggered
- Commands available but unused

### 3. Prioritize by Impact

Rank opportunities:
- **High Impact**: Fix frequent errors, eliminate major slowdowns
- **Medium Impact**: Improve common workflows, adopt better tools
- **Low Impact**: Nice-to-haves, minor optimizations

### 4. Generate Recommendations

Provide specific, actionable advice:

**Format**:
```
## Workflow Optimization Recommendations

### High Priority
1. **[Issue]**: [Description of problem]
   - **Impact**: [How much time/errors this causes]
   - **Fix**: [Specific action to take]
   - **Example**: [Show how to do it]

### Medium Priority
[...same format...]

### Quick Wins
[Small changes with immediate benefit]
```

## Common Optimization Patterns

### Reduce File I/O

**Problem**: Reading same file multiple times
```
Tool calls: Read file.txt → Read file.txt → Read file.txt
```

**Solution**: Read once, work from memory
```
Recommendation: After first Read, reference the content mentally instead of re-reading
```

### Use Appropriate Tools

**Problem**: Using Read for large files
```
Read 50MB-log.txt → timeout → error
```

**Solution**: Use targeted tools
```
Recommendation: Use Grep to search large files, or Bash with head/tail
```

### Optimize Edit Patterns

**Problem**: Multiple small edits
```
Edit (add line 1) → Edit (add line 2) → Edit (add line 3)
```

**Solution**: Batch edits
```
Recommendation: Make multiple changes in one Edit call
```

### Leverage Plugins

**Problem**: Enabled plugins never used
```
Plugins installed: api-docs, test-runner
Usage: 0 calls in 30 days
```

**Solution**: Learn and use installed tools
```
Recommendation: Try /api-docs:generate or /test-runner:run next time you need them
```

### Adopt Better Workflows

**Problem**: Manual trial-and-error debugging
```
Pattern: Edit → Run → Error → Edit → Run → Error (10x)
```

**Solution**: Use systematic debugging
```
Recommendation: Use /systematic-debugging skill before making changes
```

### Prevent Recurring Errors

**Problem**: Same error 15x in 2 weeks
```
Error: "PermissionError: /etc/config.txt"
```

**Solution**: Fix root cause once
```
Recommendation: Move config.txt to ~/project/ where you have write access
```

## Example Optimizations

**User: "How can I be faster?"**

Analysis:
- You spend 40% of time re-reading files you just read
- You Edit files 3-4 times when 1 Edit would work
- Your error rate is 12% (vs 3% baseline)

Recommendations:
1. **Stop re-reading files**: After Read, remember content for 5 minutes
2. **Batch your edits**: Plan all changes, then make them in one Edit
3. **Reduce errors**: Use /test-driven-development skill before writing code

Expected impact: 30% faster sessions, 9% fewer errors

**User: "I keep making the same mistakes"**

Analysis:
- Error: "File not found: /tmp/file.txt" appears 8 times
- Always occurs after you Write to /tmp/
- /tmp/ is cleared on reboot

Recommendation:
- **Use persistent locations**: Write to ~/project/ instead of /tmp/
- Impact: Eliminates 8/15 of your errors

## Optimization Report Format

```
# Workflow Optimization Report

## Current Performance
- Sessions analyzed: [N]
- Avg tools per session: [X]
- Error rate: [Y]%
- Top tools: [list]

## Identified Issues
1. [Issue with frequency and impact]
2. [Issue with frequency and impact]
...

## Recommendations

### High Priority (Do First)
✅ [Action]: [Benefit]

### Medium Priority (Do Soon)  
✅ [Action]: [Benefit]

### Low Priority (Nice to Have)
✅ [Action]: [Benefit]

## Expected Impact
Implementing these recommendations should:
- Reduce errors by ~[X]%
- Speed up sessions by ~[Y]%
- Improve tool efficiency by ~[Z]%
```

## Tips

- Be specific (not "read less", but "batch your reads")
- Quantify impact ("saves 2 minutes per session")
- Show examples ("instead of X, do Y")
- Prioritize by frequency × severity
- Focus on actionable changes
- Celebrate what's already working well

