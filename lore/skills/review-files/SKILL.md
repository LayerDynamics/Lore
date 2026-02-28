---
name: review-files
description: Run a targeted code review on specific files or directories. No git required.
argument-hint: "<path> [path2...] [--file]"
---

# Targeted Code Review

You are performing a focused, git-free code review on specific files or directories provided as arguments. You are looking at this code with completely fresh eyes — objective analysis only.

## Instructions

1. **Parse arguments**: The user provides one or more file or directory paths. Anything that isn't `--file` is a review target. If no targets are provided, ask the user what to review.

2. **Read the targets**: Use Read to examine each file. For directories, use Glob to discover files within them, then read the key files.

3. **Understand context**: Briefly check surrounding code (imports, callers, types) to understand how the target code fits into the larger project. Don't review the entire project — just enough context to evaluate the targets.

4. **Dispatch the code-reviewer agent**: Use the Task tool with the `local-code-review:code-reviewer` agent, providing it the specific file paths to review. For small reviews (1-3 files), a single agent is fine. For larger targeted reviews, dispatch parallel agents by focus area.

5. **Review comprehensively across all dimensions**:
   - **Quality**: Code smells, anti-patterns, complexity, naming, duplication, dead code
   - **Security**: Injection, auth, secrets, input validation
   - **Architecture**: Coupling, interface design, responsibility boundaries
   - **Performance**: Inefficiencies, blocking, unnecessary work
   - **Testing gaps**: What's untested that should be
   - **Documentation gaps**: Missing or misleading docs

6. **Output format**: Same as full review:

```
## Code Review: [target files/dirs]

### Summary
[2-3 sentence assessment of the reviewed code]

### Findings

#### Critical
- **[Title]** (`file:line`) — [Description]

#### High
- **[Title]** (`file:line`) — [Description]

#### Medium
- **[Title]** (`file:line`) — [Description]

#### Low
- **[Title]** (`file:line`) — [Description]

### Strengths
- **[Title]** — [What's done well]

### Recommendations
[Prioritized improvements for the reviewed code]
```

7. **If `--file` argument is present**: Write the review to `REVIEW.md` using the Write tool.

8. Omit empty severity sections. Always include Strengths.
