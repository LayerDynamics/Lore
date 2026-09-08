---
name: review
description: "Review scoped code changes for correctness, security, compatibility, and evidence-backed defects."
---

# Review

1. Determine the requested files or diff and its intended behavior. Inspect dirty state and applicable project instructions. Review only the authorized scope.
2. Trace entry points, data flow, callers, error paths, and tests. Check that components are actually wired together. Use parallel reviewers only when supported and authorized; otherwise cover the same dimensions sequentially.
3. Prioritize reproducible correctness failures, security boundaries, incompatible changes, and missing behavioral coverage. Support each finding with a file location, triggering case, and practical consequence.
4. Separate observed defects from uncertain concerns. Do not pad the review with stylistic preferences or invent a confidence score. Run relevant read-only checks where feasible.
5. Lead with actionable findings. If none are found, state that and name the testing limits. Fix findings only if repair was authorized.
