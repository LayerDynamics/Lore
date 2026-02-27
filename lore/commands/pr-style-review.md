---
name: pr-style-review
description: Use when synthesizing codebase investigation findings into structured code review output, reviewing code without an open pull request, or presenting technical findings with severity scoring. Trigger phrases include: "review this", "code review without a PR", "what issues are there", "is this implementation correct", "review [topic]", "produce a review from these findings"
---

# PR-Style Code Review

## When to Use This Skill

Load this skill when you have completed a codebase investigation and need to format findings into a structured review. This skill defines how to evaluate, score, and present technical findings the way a principal engineer would in a PR review.

This is the synthesis phase — it comes after `deep-investigation`, not before. Never write a review about code you haven't read.

Chain with the `superpowers:receiving-code-review` skill (from the superpowers plugin) when the user will be implementing fixes from the review you produce.

## Principle: Evidence Before Assessment

Every issue must have a specific file:line reference. If you cannot point to the exact code, you do not have enough evidence to include the issue.

Vague findings are worse than no findings — they create noise and erode trust in the review.

## Phase 1: Collect and Organize Findings

Before scoring anything, collect all investigation findings in one place:
- Execution path from code-explorer
- Integration map from integration-mapper
- Any additional findings from targeted greps

Group findings by theme: error handling, data integrity, pattern conformance, test coverage, performance.

## Phase 2: Score Each Issue

For every potential issue, assign a confidence score (0-100) before doing anything else.

**Confidence means:** "How certain am I that this is actually a problem, given what I can see in the code?"

| Score | Meaning |
|-------|---------|
| 90-100 | The problem is directly visible in the code. No ambiguity. |
| 80-89 | Strong evidence. An edge case might explain it away, but unlikely. |
| 75-79 | Reasonable evidence. Needs confirmation but worth surfacing. |
| Below 75 | Drop it. Not enough evidence to include. |

Reasons to lower confidence:
- The issue might be intentional (framework behavior, known workaround)
- You only found one call site and it might not represent the full pattern
- The code you read might be on a non-production path
- A test exists that covers this exact scenario

Reasons to raise confidence:
- You can construct the exact failure scenario
- Multiple independent signals point to the same issue
- There is no test for the scenario
- The pattern appears in multiple places

## Phase 3: Apply Severity Rubric

After scoring, apply severity based on both confidence and impact:

**Critical (confidence ≥90%):**
Issues that can cause data loss, service outage, security vulnerability, or silent production errors. The code is broken in a way that will manifest under normal operation.

Examples:
- No try/catch on a database write that can throw
- A fetch to another service with no timeout (hangs entire worker)
- `auto_decision` written without checking for existing value (overwrites human decision)
- Unauthenticated endpoint accepting writes to a sensitive table

**Important (confidence ≥80%):**
Issues that don't break things today but create significant risk: pattern violations that confuse future changes, missing observability that hides failures, schema mismatches that will cause bugs under expected conditions.

Examples:
- Pattern deviation from established agent/API/editorial conventions
- Error caught and logged but execution continues with stale/invalid state
- DB column read in one format, written in another
- Missing structured log fields that operators need for debugging

**Minor (confidence ≥75%):**
Code quality issues that reduce clarity or consistency but don't create bugs under normal conditions.

Examples:
- `console.log` instead of structured logger
- Inconsistent variable naming vs. rest of the codebase
- Query that selects more columns than needed
- Comment that is outdated or misleading

**Strengths:**
Genuine examples of well-implemented code. Only include when you can cite specific evidence and explain why it's notable — not just "code is clean." Strengths should be useful: they reinforce patterns worth repeating.

Examples:
- Graceful fallback to safe default when external service is unreachable
- Instance-level caching correctly implemented (vs. module-level anti-pattern)
- Exactly the right amount of error context logged at each boundary

## Phase 4: Write the Review

Use the template from `references/review-output-template.md`.

**Writing guidelines:**
- Issue title: concise, specific (not "error handling issue" — "no timeout on editorial service fetch")
- Evidence: paste the relevant code snippet or describe exactly what you found
- Impact: describe the scenario where this causes a problem
- Do not write "consider" or "you might want to" — state what the issue is

**Do not include:**
- Issues below 75% confidence
- Stylistic preferences without codebase-specific justification
- Generic "add more tests" without naming specific missing scenarios
- Filler Strengths

## Phase 5: Verification Checklist

Every review must end with a Verification Checklist. These are concrete actions to confirm the findings are real and to validate any fixes.

Each item should be:
- **Runnable or checkable** ("Run quality scorer against article X and check quality_signals column")
- **Specific** ("Verify auto_decision is not overwritten if already set")
- **Tied to a specific finding** (don't add generic items)

## References

- `references/review-output-template.md` — complete output format with annotated example