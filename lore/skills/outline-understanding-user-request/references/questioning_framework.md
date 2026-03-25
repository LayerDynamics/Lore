# Questioning Framework

A structured framework for formulating high-quality clarifying questions after analyzing code — applicable to any project or codebase.

---

## Three Question Dimensions

Every clarifying question belongs to one of three dimensions. Good analysis produces at least one question per dimension before proceeding.

### 1. Scope Boundaries

Questions that establish what is included and excluded from the request.

**Templates:**
- "Should this apply to `[A]` only, or also to `[B]` and `[C]`?"
- "Is `[edge case]` in scope for this change, or should we skip it for now?"
- "Where exactly should this stop — at `[boundary X]` or further into `[component Y]`?"
- "I found `[N instances]` where similar logic exists. Should all be updated or only `[specific subset]`?"

**Grounding rule:** Each question must cite the specific file:line where the scope ambiguity exists.

**Example:**
> "I see validation logic at `src/auth/validator.ts:34` handles email format. Should the new validation also cover phone number format (which appears at `src/user/profile.ts:88`), or only the email path?"

---

### 2. Integration Points

Questions that clarify how the change connects to existing code.

**Templates:**
- "Should this use the existing `[interface/pattern]` at `[file:line]`, or introduce a new one?"
- "How should this interact with `[system X]`? Should it call it directly, or go through `[abstraction Y]`?"
- "Should `[component A]` be notified of this change, or can it operate independently?"
- "I noticed `[X]` uses `[pattern]`. Should this follow the same pattern?"

**Grounding rule:** Reference the actual integration point found during code analysis.

**Example:**
> "The error handler at `src/middleware/errors.ts:12` uses a centralized error bus. Should the new feature emit errors through that bus, or handle them locally and return error codes directly?"

---

### 3. Requirements Clarity

Questions that resolve ambiguity about expected behavior, performance, or constraints.

**Templates:**
- "What should happen when `[edge case]` occurs — `[option A]` or `[option B]`?"
- "Is there a performance constraint? The current implementation at `[file:line]` is `O(n)`; is that acceptable or should this be faster?"
- "Should this be synchronous or asynchronous? I see both patterns in the codebase at `[file A]` and `[file B]`."
- "Should this maintain backward compatibility with `[existing behavior at file:line]`?"

**Grounding rule:** The options offered must be grounded in patterns already present in the code.

---

## Question Quality Checklist

Before asking a question, verify:

- [ ] **Grounded** — cites a specific file:line from the code analysis
- [ ] **Binary or multi-choice** — offers concrete options, not open-ended "what do you want?"
- [ ] **Reveals real ambiguity** — not a question you can answer by reading more code
- [ ] **Actionable** — the answer will directly determine implementation decisions
- [ ] **Non-assumptive** — does not imply a preferred answer

---

## Poor vs. Good Questions

| Poor | Why It Fails | Good |
|------|-------------|------|
| "How should this work?" | Open-ended, not grounded | "At `src/queue.ts:45` the retry logic runs synchronously. Should this new handler also retry synchronously, or use the async retry wrapper at `src/utils/retry.ts:12`?" |
| "Should I add caching?" | Not grounded in analysis | "The data fetch at `src/data/loader.ts:67` runs on every request. Should results be cached per-request (in memory), per-session, or not at all?" |
| "What about errors?" | Vague, no options | "When the upstream call at `src/api/client.ts:89` fails, should we return a default value, propagate the error to the caller, or silently log and continue?" |
| "Is this the right approach?" | Meta question, not useful | Ask a specific scope/integration/requirements question instead |

---

## Architecture Pattern Questions

When a change may propagate across multiple modules or layers, ask questions that reflect the project's actual structure:

- "This change touches `[Module A]`. Should it also update `[Module B]` which consumes it at `[file:line]`?"
- "The interface at `[file:line]` is shared between `[X]` and `[Y]`. Should the change update the shared interface (affecting both) or introduce a new one (affecting only the target)?"
- "I see `[pattern]` used in `[N places]`. Should this change update all of them for consistency, or only the targeted location?"

Common patterns to check in the project's code before asking:
- **Pipeline/chain patterns:** Where in the sequence does this fit?
- **State machine patterns:** Does this respect existing state transitions?
- **Event-driven patterns:** Should this emit or subscribe to events?
- **Resource pool patterns:** Does this participate in lifecycle management?
- **Plugin/extension patterns:** Should this be a new extension point or use existing ones?

---

## When to Stop Asking

Stop formulating questions when:
1. You have at least one question per dimension (scope, integration, requirements)
2. All remaining ambiguities can be resolved by reading more code (not asking the user)
3. You have read 5 or fewer files — additional reading is more efficient than asking

Do not keep asking questions to appear thorough. Each question must reflect genuine uncertainty about something only the user can answer.
