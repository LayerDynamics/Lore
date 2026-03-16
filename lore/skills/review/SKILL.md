---
description: Deep investigation of a question or topic followed by a PR-style code review with Critical/Important/Minor findings and Strengths. Dispatches parallel agents to investigate, then synthesizes into a structured review.
argument-hint: The question or topic to review (e.g., "quality scorer integration", "how editorial rules engine works")
---

# Code Review: $ARGUMENTS

You are performing a deep PR-style code review of the given topic, without requiring an open pull request. Follow this pipeline precisely.

## Step 1: Parse Subject

The review subject is: `$ARGUMENTS`

If `$ARGUMENTS` is empty, ask the user:
> What would you like me to review? (e.g., "quality scorer integration", "how auto-publisher routes articles", "categorization cache invalidation")

## Step 2: Decompose Into Investigation Angles

Before dispatching agents, decompose the subject into 2-3 independent investigation angles. For example:
- Subject: "quality scorer integration with auto-publisher"
  - Angle 1: Quality scorer implementation and execution path
  - Angle 2: Auto-publisher's consumption of quality scores and routing logic
  - Angle 3: Integration point between quality-scorer and editorial rules engine

## Step 3: Dispatch Parallel Agents

In a SINGLE message, launch the following agents simultaneously (multiple Task tool calls):

**Agent 1: code-explorer** — focused on the primary execution path
- Provide: the review subject + specific angle to investigate
- Ask it to: trace the execution path from entry point to terminal side effect

**Agent 2: integration-mapper** — focused on service boundaries
- Provide: the review subject + which services appear involved
- Ask it to: map all HTTP calls, database accesses, Redis operations, and events between services

If there is a third angle, dispatch a second **code-explorer** agent for it.

Wait for ALL agents to complete before proceeding to Step 4.

## Step 4: Synthesize Into Review

Launch **review-synthesizer** with a prompt that includes:
1. The review subject
2. ALL findings from Step 3 (paste complete agent outputs)
3. Instruction: "Produce a PR-style code review with Critical/Important/Minor/Strength sections. Only include issues with ≥75% confidence."

## Step 5: Present Results

Present the synthesized review directly to the user. Do not add commentary before or after — the review is self-contained.

If the review-synthesizer returns no Critical or Important issues, note this explicitly:
> No Critical or Important issues found at ≥75% confidence. See Minor issues and Strengths below.
