---
description: Review all files associated with or related to a request and its downstream effects before making changes. Use at the start of any code modification task to prevent blind edits.
---

# request-context-gatherer: Request Context Gatherer

**Load the request-context-gatherer skill first** using the Skill tool.

## Starting Context

`$ARGUMENTS` describes the change or task about to be performed. Pass the full `$ARGUMENTS` string to the skill so it knows what files and downstream effects to review.

If `$ARGUMENTS` is empty, ask: "What change are you about to make? Describe the task so I can gather all relevant context first."

## Run the Full Workflow

Execute every step in the skill without skipping. No file review is optional. The skill must complete all context gathering before any modification begins.
