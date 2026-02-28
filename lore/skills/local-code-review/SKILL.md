---
name: local-code-review
description: Run a comprehensive, git-free code review. Pass file/directory paths to review specific targets, or run with no arguments for a full project review.
argument-hint: "[paths...] [--file]"
---

# Local Code Review

You are performing a comprehensive, git-free code review with completely fresh eyes — no assumptions, no history, just objective analysis.

## Determine Scope

- **If arguments contain file or directory paths**: Review only those targets (targeted review).
- **If no path arguments (or only `--file`)**: Review the entire project in the current working directory (full review).

## Instructions

1. **Discover the project**: Use Glob and Read to understand the project structure, language(s), framework(s), and entry points. Start with common indicators: package.json, Cargo.toml, go.mod, pyproject.toml, Makefile, README, etc.

2. **Dispatch parallel review agents**: Use the Task tool with the `local-code-review:code-reviewer` agent to run parallel reviews. For targeted reviews, scope agents to the specified paths. For full reviews, cover the entire project.

   Review dimensions:
   - **Quality**: Code smells, anti-patterns, complexity, naming, duplication, dead code
   - **Security**: OWASP top 10, injection risks, auth issues, secrets in code, dependency concerns
   - **Architecture**: Coupling, modularity, separation of concerns, dependency direction, patterns consistency
   - **Performance**: N+1 queries, unnecessary allocations, blocking calls, missing caching opportunities
   - **Testing gaps**: Untested critical paths, missing edge cases, test quality
   - **Documentation gaps**: Missing public API docs, unclear interfaces, outdated comments

3. **Synthesize findings**: Collect all agent results and produce a unified review.

4. **Output format**: Present findings using this structure:

```
## Code Review: [Project Name]

### Summary
[2-3 sentence overall assessment]

### Findings

#### Critical
- **[Title]** (`file:line`) — [Description and why it matters]

#### High
- **[Title]** (`file:line`) — [Description]

#### Medium
- **[Title]** (`file:line`) — [Description]

#### Low
- **[Title]** (`file:line`) — [Description]

### Strengths
- **[Title]** — [What's done well and why it's good]

### Recommendations
[Prioritized list of suggested improvements]
```

5. **If `--file` argument is present**: Write the review to `REVIEW.md` in the project root using the Write tool, in addition to displaying it inline.

6. Omit any severity section that has no findings. Always include the Strengths section.
