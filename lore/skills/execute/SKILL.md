---
name: execute
description: "Implement an approved task or plan through completion with scoped edits and direct verification."
---

# Execute

1. Reconstruct the authorized outcome and current progress from the conversation, plan, and repository. Treat user corrections as changes to that outcome. Confirm repository identity before editing; preserve unrelated work.
2. Select the next unblocked task. Track it with the host task tool or a short checklist. Use actual session capabilities; do not depend on a particular task API, model, or provider.
3. Implement the complete behavior and necessary integration. Read before editing. Delegate only if authorized, available, and useful; otherwise perform implementation and review sequentially. Do not equate self-review with independent review.
4. Run the smallest meaningful checks for the change and read their exit status and output. Fix failures attributable to the change. Record pre-existing failures separately. Verify external or physical behavior directly when required by acceptance criteria.
5. Mark work complete only when its criteria are satisfied. Continue through remaining tasks without another approval loop. If an external gate prevents progress, identify the exact evidence or action required and continue independent tasks.

Report what changed, why, commands actually run, and the remaining evidence boundary. Never fill missing results with assumed success.
