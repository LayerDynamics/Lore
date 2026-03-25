# Code Analysis Template

A structured template for analyzing any codebase when understanding a user request. Applicable to any language, framework, or architecture.

---

## The <5 File Rule

**Start small:** Read fewer than 5 files initially to get oriented. Only expand if the questions that emerge require it.

**Why:** Context efficiency — early analysis often reveals whether the request is clear or needs clarification. Stop reading when questions become clear, not when the entire codebase is understood.

---

## Phase 1: Entry Point Identification (1–2 files)

**Goal:** Find where the user's request intersects with the codebase.

**Questions to answer:**
- What component, module, or file is this request about?
- Where is the entry point for this functionality?
- What file would be modified first?

**How to find it:**
```bash
# Search for the relevant class, function, or module
grep -rn "class TargetName\|function targetName\|def target_name" src/

# Or use glob patterns to narrow the area
# e.g., Glob("src/feature/**/*.*")
```

**Output:**
```
Entry point: [file_path:line_number]
Primary component: [name and purpose]
```

---

## Phase 2: Data Flow Tracing (2–3 files)

**Goal:** Understand how data moves through the system in the context of the request.

**Questions to answer:**
- What is the current data flow path relevant to this change?
- What functions/methods are involved, and in what order?
- What data structures are passed between components?
- Are there state transitions, events, or lifecycle hooks involved?

**Output template:**
```markdown
## Data Flow for "[request]"

Entry: [file:line]

Current flow:
1. [Step 1] — [file:line]
2. [Step 2] — [file:line]
3. [Step 3] — [file:line]

Data structures:
- [Type A]: { field1, field2, ... }
- [Type B]: { field1, field2, ... }

Patterns observed:
- [pipeline / state machine / event-driven / direct call / etc.]
```

---

## Phase 3: Impact Analysis (1–2 files)

**Goal:** Identify what would be affected by implementing the request.

**Questions to answer:**
- What files would need modification?
- What other components depend on this?
- Are there tests that would need updates?
- Does this change affect multiple layers or modules?

**How to find dependents:**
```bash
# Find files that import or reference the target
grep -rn "import.*TargetModule\|from.*target-file\|require.*target" src/

# Find usages of a specific function or symbol
grep -rn "targetFunction(" src/
```

**Output template:**
```markdown
## Impact Analysis for "[request]"

Files requiring modification:
1. [file:line] — reason
2. [file:line] — reason

Affected components:
- [Component A] — how it's affected
- [Component B] — how it's affected

Cross-module impacts:
- [Module X]: [description]
- [Module Y]: [description]

Test files needing updates:
- [test file] — what needs updating

Pattern conflicts:
- [any inconsistency with existing conventions]
```

---

## Phase 4: Pattern & Convention Check (within already-read files)

**Goal:** Understand existing patterns to ensure consistency.

**Questions to answer:**
- What patterns does the codebase use for similar things?
- How are comparable features implemented?
- What conventions should be followed?

**Things to check (within already-read files — no new files):**

**Error handling:**
```
Current pattern: [try/catch / Result type / error callbacks / exceptions]
Example from code: [file:line]
```

**Async operations:**
```
Current pattern: [Promises / async-await / callbacks / coroutines / synchronous]
Example from code: [file:line]
```

**Configuration:**
```
Current pattern: [config objects / builder pattern / env vars / defaults in code]
Example from code: [file:line]
```

**Resource management:**
```
Current pattern: [explicit cleanup / RAII / GC-managed / pool pattern]
Example from code: [file:line]
```

---

## Synthesis: Analysis Summary Template

After analyzing ≤5 files, produce this summary:

```markdown
## Code Analysis Summary

**User Request:** [original request]

**Entry Point:**
- File: [path:line]
- Component: [name and role]

**Current Data Flow:**
1. [Step 1]
2. [Step 2]
3. [Step 3]
Data: [key types involved]
Patterns: [pipeline / state machine / events / direct / etc.]

**Required Changes:**
- Primary: [main file:line — what changes]
- Secondary: [supporting files — what changes]
- Tests: [test files — what needs updating]

**Affected Components:**
- [Component A] — [impact]
- [Component B] — [impact]

**Pattern Alignment:**
- Error handling: [follows existing pattern? Yes/No/Conflict]
- Async: [matches convention? Yes/No/Conflict]
- Config: [consistent? Yes/No/Conflict]
- Resources: [proper lifecycle? Yes/No/Conflict]

**Complexity Assessment:**
- Scope: [small / medium / large]
- Risk: [low / medium / high]
- Unknowns: [what's still unclear]

**Questions Needed:**
[List clarifying questions from the questioning_framework.md]
```

---

## Red Flags: Stop and Ask

Stop reading and ask questions when you encounter:

**Ambiguity red flags:**
- Multiple valid interpretations of the request
- Can't determine scope without guessing
- Request conflicts with existing patterns
- Edge cases are completely unclear

**Complexity red flags:**
- Change would affect >3 major components
- Requires modifying shared interfaces or contracts
- Introduces potentially breaking changes
- No clear existing pattern to follow

**Understanding red flags:**
- Initial reading reveals more questions than answers
- Code behavior doesn't match what the request describes
- Can't trace the data flow within 5 files
- Discovered unexpected dependencies that change the scope

**When red flags appear:** Stop reading and formulate clarifying questions instead of reading more files.

---

## Usage Notes

**When to expand beyond 5 files:**
- Only when analysis reveals a specific, critical gap
- After identifying the precise file that resolves the gap
- When one more file is clearly needed to understand a pattern

**When NOT to expand:**
- When questions are already clear
- When you're browsing without a specific target in mind
- When context is accumulating but not clarifying
- When red flags have already appeared

**Key principle:** Efficient analysis that surfaces real ambiguity is more valuable than exhaustive reading that drains context.
