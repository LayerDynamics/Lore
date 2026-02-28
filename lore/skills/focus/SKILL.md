---
description: Reset scope by invoking the staying-on-request skill. Call this when Claude has drifted from the original request.
argument-hint: optional description of the drift (e.g. "you refactored auth when I asked about logging")
---

# writing-plans: Focus

Invoke the staying-on-request skill immediately. Run the full skill — do not summarize or abbreviate it.

## Step 1: Load the Skill

Use the Skill tool to load `writing-plans:staying-on-request`.

## Step 2: Acknowledge the Drift (if $ARGUMENTS provided)

If `$ARGUMENTS` is provided, acknowledge the specific drift before applying the skill:

> "Noted: [drift description from $ARGUMENTS]. Applying scope reset."

Do not be defensive. Do not explain why the drift happened. Acknowledge and move on.

## Step 3: Apply the Full Skill

Run the staying-on-request skill in full:
- Identify what the original request was (from conversation context or active plan)
- Surface any adjacent changes as TODOs (do not fix them)
- Re-anchor to the original request
- State clearly what the next action is, scoped to the original request only

## Step 4: Confirm Re-anchor

Output one sentence confirming what you are going to do next, scoped strictly to the original request:

> "Resuming: [original task], scoped to [file/component]. No other changes."

Do not proceed until this confirmation is output.
