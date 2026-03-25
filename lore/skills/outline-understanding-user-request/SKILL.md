---
name: outline-understanding-user-request
description: This skill should be used when the user makes an ambiguous request that would drain context to understand, or when initial understanding of a request proves insufficient after reviewing code (<5 files). Use when needing to analyze actual code (not documentation) to understand data flow, identify affected systems, and ask clarifying questions about scope, integration points, and requirements before implementation.
---

# Outline Understanding User Request

This skill guides the process of analyzing code to understand ambiguous or complex user requests, then formulating targeted clarifying questions before implementation begins.

## Purpose

User requests often seem clear initially but reveal complexity or ambiguity once code analysis begins. This skill provides a structured approach to:

1. **Efficiently analyze actual code** (not documentation) to understand the request's context
2. **Map data/code flow** relevant to the user's request
3. **Identify affected systems** and integration points
4. **Formulate targeted clarifying questions** about scope, integration, and requirements

The goal is context efficiency: understand enough to ask the right questions, not to exhaustively analyze the codebase.

## When to Use This Skill

### Trigger Scenarios

**Scenario A: Ambiguous Initial Request**

The user's request would drain significant context just to understand what they want:
- Vague language: "improve", "enhance", "fix", "add" without specifics
- Missing context: "Add authentication" (where? what kind?)
- Unbounded scope: "Update all domains", "Optimize the engine"
- Multiple concerns: "Add auth and caching and metrics"

**Scenario B: Understanding Proves Insufficient**

Initial understanding seems clear, but after reading actual code (<5 files), gaps emerge:
- Code reveals multiple valid implementation approaches
- Existing patterns conflict with initial interpretation
- Scope is larger or more complex than initially apparent
- Integration points are unclear or problematic

### When NOT to Use

Don't use this skill when:
- Request is already specific and well-scoped
- You're ready to proceed with implementation
- User has provided detailed specifications
- Request is trivial (single-line change)

## Core Workflow

### Step 1: Recognize the Trigger

Identify that the request falls into Scenario A (ambiguous) or B (insufficient understanding).

**Red flags:**
- Can't identify entry point without guessing
- Multiple valid interpretations exist
- Scope boundaries are unclear
- Would need to read 10+ files to understand

### Step 2: Efficient Code Analysis (<5 Files)

**Critical rule:** Read fewer than 5 files to get oriented. Expand only if absolutely necessary.

**Analysis phases:**

**Phase 1: Entry Point Identification (1-2 files)**
- Find where user's request intersects the codebase
- Identify primary component/module
- Locate the file(s) to modify first

**Phase 2: Data Flow Tracing (2-3 files)**
- Understand how data currently flows
- Identify functions/methods involved
- Note data structures and types
- Recognize patterns (pipeline, state machine, events)

**Phase 3: Impact Analysis (1-2 files)**
- Identify files requiring modification
- Find dependent components
- Check for multi-layer impacts
- Assess cross-cutting concerns

**Phase 4: Pattern Check (within same files)**
- Understand existing conventions
- Check error handling patterns
- Note async/sync conventions
- Identify resource management approaches

**Stop criteria:**
- Questions become clear
- Red flags appear (ambiguity, complexity, multiple approaches)
- Already read 5 files

**Detailed guidance:** See `references/analysis_template.md`

### Step 3: Map Data/Code Flow

Based on code analysis, document:

1. **Current flow:** How data moves through the system
2. **Entry point:** Specific file:line where change would start
3. **Data structures:** Types and objects involved
4. **Patterns:** Architectural patterns in play (pipelines, state machines, events)

**Example output:**
```
Entry point: src/api/router.ts:45

Current flow:
1. Request arrives → Router.handleRequest()
2. Middleware pipeline executes
3. Route to handler
4. Response returned

Data structures:
- Request: { method, url, headers, body }
- Context: { request, response, metadata }

Pattern: Middleware pipeline (async, can short-circuit)
```

### Step 4: Identify Affected Systems

Document what would change:

- **Primary changes:** Main files/functions to modify
- **Secondary changes:** Supporting code updates
- **Cross-layer impacts:** Whether change affects multiple architecture layers
- **Test impacts:** Which test suites need updates
- **Pattern conflicts:** Inconsistencies with existing conventions

**Architecture-specific considerations:**
- Does the change affect multiple layers or modules in the project?
- Are any domain-specific subsystems affected?
- Does the plugin or extension system need updates?
- Is any lifecycle management involved?

### Step 5: Formulate Clarifying Questions

Ask questions across three dimensions:

**1. Scope Boundaries**
- What's in scope vs out of scope?
- Where exactly should this apply?
- How broad or narrow is the change?

**2. Integration Points**
- How should this connect to existing code?
- Which patterns should it follow?
- How does it coordinate with related systems?

**3. Requirements Clarity**
- What's the expected behavior?
- How should edge cases be handled?
- Are there performance/security constraints?

**Question quality guidelines:**
- Ground each question in specific code findings
- Offer informed options based on analysis
- Cite file:line references
- Reveal real ambiguity, not guesses

**Detailed frameworks:** See `references/questioning_framework.md`

### Step 6: Present Analysis + Questions

Present findings in this structure:

```markdown
## Code Analysis Summary

**User Request:** [original request]

**Entry Point:** [file:line]

**Current Data Flow:**
[Brief flow description]

**Required Changes:**
- Primary: [main changes]
- Secondary: [supporting changes]
- Tests: [test updates]

**Affected Systems:**
[Which layers/components]

**Pattern Conflicts:**
[Any inconsistencies found]

**Clarifying Questions:**

### Scope Boundaries
1. [Specific question grounded in code]
2. [Another scope question]

### Integration Points
1. [Integration question with context]
2. [Another integration question]

### Requirements Clarity
1. [Behavior/requirement question]
2. [Another requirements question]
```

## Important Principles

### Context Efficiency

**DO:**
- ✅ Read <5 files to get oriented
- ✅ Stop when questions become clear
- ✅ Focus on actual code (methods, types, data flow)
- ✅ Cite specific line numbers

**DON'T:**
- ❌ Read documentation instead of code
- ❌ Exhaustively analyze the entire codebase
- ❌ Continue reading when already have sufficient questions
- ❌ Guess at implementation without reading code

### Question Quality

**Good questions:**
- Concrete and specific
- Grounded in code analysis
- Reveal true ambiguity
- Offer informed options

**Poor questions:**
- Vague ("How should this work?")
- Not grounded in code ("What do you want?")
- False dichotomies without context
- Assumptive without analysis

**Example comparison:**

❌ **Poor:** "Should I add caching?"
- Not grounded in code, doesn't reveal analysis

✅ **Good:** "I see the middleware pipeline at `src/gateway/Gateway.ts:67`. Should caching be a middleware (can short-circuit the pipeline) or integrated within each handler type? The middleware approach is simpler but affects all handlers, while per-handler gives type-specific behavior."
- Cites specific code
- Explains trade-offs
- Offers informed options

### Architecture Awareness

When analyzing code and forming questions, recognize common architectural patterns in the project:

**Patterns to identify:**
- **Pipeline pattern:** Sequential stages with ordering (request pipelines, build pipelines, query executors)
- **State machine pattern:** Strict state transitions (connection states, lifecycle phases)
- **Event-driven pattern:** Event bus or pub/sub for cross-component communication
- **Resource pool pattern:** Lifecycle management (connection pools, worker pools)
- **Domain/module pattern:** Subsystems extending shared base classes or interfaces

**Multi-layer considerations:**
- Changes might propagate across multiple layers or modules — identify which ones
- Check if a change in one layer requires updates in dependent layers
- Identify integration points and contracts between components

## Additional Resources

### Reference Files

For detailed templates and frameworks:

- **`references/questioning_framework.md`** - Comprehensive framework for asking effective questions across scope, integration, and requirements dimensions. Includes question templates for various architectural patterns.

- **`references/analysis_template.md`** - Step-by-step template for code analysis including entry point identification, data flow tracing, impact analysis, and pattern checking.

### Example Files

Working examples demonstrating the workflow:

- **`examples/good_analysis_example.md`** - Complete example of analyzing "Add caching to proxy" request, showing the 5-file analysis process leading to targeted clarifying questions. Includes counter-examples of what NOT to do.

- **`examples/scope_examples.md`** - Examples of well-scoped vs poorly-scoped changes. Demonstrates how to convert vague requests into specific, bounded scopes.

## Usage Example

**User says:** "Add authentication to the browser engine"

**Trigger:** Ambiguous - which layer? what auth? where stored?

**Process:**

1. **Recognize trigger:** Scope unclear (Scenario A)

2. **Analyze code (<5 files):**
   - Read HttpClient.ts (entry point)
   - Read HttpRequest.ts (data structures)
   - Read types/http.ts (type definitions)
   - Read NetworkManager.ts (might coordinate)
   - Stop at 4 files - questions emerging

3. **Map flow:**
   ```
   Entry: HttpClient.makeRequest() at line 234
   Flow: HttpClient → HttpRequest → TlsSocket
   Pattern: Request pipeline (async)
   ```

4. **Identify impacts:**
   - Browser Engine (HttpClient, types)
   - MCP Server (browser_navigate tool might need auth option)
   - Runtime (BrowserConfig might include default auth)
   - No credential storage pattern found ⚠️

5. **Form questions:**

   **Scope:**
   - Should auth apply to HTTP only or also WebSocket/SSE?
   - Per-request auth or session-based?

   **Integration:**
   - Where should credentials be stored (NetworkManager, BrowserConfig, passed per-request)?
   - Follow existing options pattern (like HttpClient options)?

   **Requirements:**
   - What auth schemes (Basic, Bearer, OAuth)?
   - Should credentials persist across navigation?

6. **Present analysis with questions**

**Outcome:** User provides clarification, enabling focused implementation.

## Red Flags to Stop and Ask

During analysis, stop immediately and formulate questions if encountering:

### 🚩 Ambiguity Red Flags
- Multiple valid interpretations
- Can't determine scope without guessing
- Request conflicts with existing patterns
- Edge cases are unclear

### 🚩 Complexity Red Flags
- Change affects >3 major components
- Requires modifying core interfaces
- Introduces breaking changes
- No clear pattern to follow

### 🚩 Understanding Red Flags
- Initial reading reveals more questions than answers
- Code behavior doesn't match expectations
- Can't trace data flow within 5 files
- Found unexpected dependencies

**When red flags appear:** Stop expanding context and formulate clarifying questions immediately.

## Summary

Use this skill to avoid context drain and premature implementation when user requests are ambiguous or prove more complex than initially apparent. The workflow is:

1. **Recognize trigger** (ambiguous request or insufficient understanding)
2. **Analyze code efficiently** (<5 files, actual code not docs)
3. **Map data flow and impacts** (entry point, patterns, affected systems)
4. **Formulate targeted questions** (scope, integration, requirements)
5. **Present analysis + questions** (grounded in code findings)

The goal is not exhaustive understanding, but efficient context usage leading to the right clarifying questions before implementation begins.

**Key principle:** Read code to understand, ask questions to clarify, then implement with confidence.