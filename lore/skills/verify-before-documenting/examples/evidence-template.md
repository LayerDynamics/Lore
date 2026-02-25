# Evidence-Based Documentation Template

Use this template when documenting verification findings to ensure all claims are backed by evidence.

---

## Feature Name: [Feature/Implementation Being Verified]

### Documented Approach
**Source:** [Documentation file/section]

```
[Quote or summarize what documentation specifies]
```

### Implementation Status: [Choose One]
- ✅ **FULLY IMPLEMENTED** - Matches or exceeds specification
- ⚠️ **ALTERNATIVE IMPLEMENTATION** - Different approach, same outcome
- 🔄 **PARTIALLY IMPLEMENTED** - Some components present, others missing
- ❌ **NOT IMPLEMENTED** - No evidence of implementation found

---

### Search Process

**Keywords searched:**
```bash
grep -r "keyword1" services/
grep -r "keyword2" services/
find services/ -name "*pattern*"
```

**Results:**
- [List files found or "No results"]

---

### Files Verified

**Read the following files completely:**

1. **`path/to/file1.ts`** (lines 1-150)
   - Purpose: [What this file does]
   - Key finding: [What was found]

2. **`path/to/file2.ts`** (lines 1-200)
   - Purpose: [What this file does]
   - Key finding: [What was found]

3. **Additional files:** [List any other files checked]

---

### Evidence

#### Code Evidence

**File:** `path/to/implementation.ts:45-67`

```typescript
// Paste relevant code excerpt
// Show the actual implementation
const implementation = new FeatureX({
  config: options,
});
```

#### Configuration Evidence

**File:** `.env.example:23`
```bash
FEATURE_X_ENABLED=true
FEATURE_X_API_KEY=
```

**File:** `docker-compose.yml:145`
```yaml
services:
  feature-x:
    image: feature-x:latest
    ports:
      - "8080:8080"
```

#### Package Evidence

**File:** `services/api/package.json`
```json
{
  "dependencies": {
    "feature-x-library": "^2.0.0"
  }
}
```

---

### Comparison: Documented vs Actual

| Aspect | Documented | Actual Implementation | Match? |
|--------|------------|----------------------|--------|
| Technology | [Doc tech] | [Actual tech] | ✅/⚠️/❌ |
| Location | [Doc location] | [Actual location] | ✅/⚠️/❌ |
| Configuration | [Doc config] | [Actual config] | ✅/⚠️/❌ |
| Features | [Doc features] | [Actual features] | ✅/⚠️/❌ |

---

### Assessment

#### Summary
[Concise 2-3 sentence summary of findings]

#### Details

**What matches documentation:**
- [Point 1]
- [Point 2]

**What differs from documentation:**
- [Point 1 - explain difference]
- [Point 2 - explain difference]

**What exceeds documentation:**
- [Bonus feature 1]
- [Bonus feature 2]

#### Trade-offs (if using alternative implementation)

**Advantages of actual implementation:**
- [Pro 1]
- [Pro 2]

**Disadvantages compared to documented approach:**
- [Con 1]
- [Con 2]

---

### Recommendation

Choose one:

#### ✅ Keep Current Implementation
```
Current implementation [matches/exceeds] specification.
No changes needed.
```

#### ⚠️ Monitor for Migration
```
Current implementation functional but should migrate when:
- [Trigger condition 1]
- [Trigger condition 2]

Estimated effort: [X hours/days]
```

#### 🔴 Implement Missing Feature
```
Feature is not present and is needed.

Implementation plan:
1. [Step 1]
2. [Step 2]

Estimated effort: [X hours/days]
```

---

### Related Findings

If this verification revealed related issues or findings:
- [Related finding 1]
- [Related finding 2]

---

### Verification Metadata

**Date:** [YYYY-MM-DD]
**Verified by:** [Name/ID]
**Codebase commit:** [Git commit hash if applicable]
**Time spent:** [X minutes verifying]

**Files read:** [Total count]
**Search commands:** [Count]
**Evidence quality:** [Level 1-4]

---

## Example Usage

### Good Example

```markdown
## Feature: MJML Email Templates

### Documented Approach
**Source:** SystemSpec.md Part 2.6

"Transactional emails rendered using MJML framework that
compiles to cross-client-compatible HTML."

### Implementation Status: ✅ FULLY IMPLEMENTED (Exceeds Spec)

### Search Process

**Keywords searched:**
```bash
find services/ -name "*.mjml"
grep -r "mjml2html" services/
grep -r "import.*mjml" services/
```

**Results:**
- Found 6 .mjml template files
- Found mjml2html usage in templates.ts
- Found import statement in templates.ts

### Files Verified

1. **`services/alert-engine/templates/breaking-alert.mjml`** (93 lines)
   - Purpose: Breaking news alert email template
   - Key finding: Real MJML syntax with mj-section, mj-column, mj-text

2. **`services/alert-engine/src/delivery/templates.ts`** (164 lines)
   - Purpose: Template compilation and rendering
   - Key finding: Full MJML compilation pipeline with caching

### Evidence

#### Code Evidence

**File:** `services/alert-engine/src/delivery/templates.ts:59-67`

```typescript
const { html, errors } = mjml2html(mjmlSource, {
  validationLevel: 'soft',
});

if (errors.length > 0) {
  logger.warn({ templateName, errors }, 'MJML compilation warnings');
}

const template = Handlebars.compile(html);
```

#### Configuration Evidence

**File:** `services/alert-engine/package.json`
```json
{
  "dependencies": {
    "mjml": "^4.15.3",
    "handlebars": "^4.7.8"
  }
}
```

### Comparison: Documented vs Actual

| Aspect | Documented | Actual | Match? |
|--------|-----------|--------|--------|
| Framework | MJML | MJML | ✅ Yes |
| Compilation | Build-time | Runtime (cached) | ⚠️ Better |
| Template count | 3 mentioned | 6 implemented | ✅ Exceeds |
| Templating | Not specified | Handlebars | ✅ Bonus |

### Assessment

#### Summary
MJML email system is fully implemented with runtime compilation,
Handlebars integration, and 6 templates (exceeds spec of 3).

#### Details

**What matches documentation:**
- MJML framework for responsive emails
- Cross-client compatible output
- Template-based approach

**What differs from documentation:**
- Runtime compilation vs build-time (better for development)
- Template caching for performance (not documented)

**What exceeds documentation:**
- 6 templates vs 3 documented
- Handlebars helpers (formatDate, truncate, etc.)
- Health check endpoint
- Graceful error handling

### Recommendation

✅ Keep Current Implementation

Current implementation exceeds specification.
No changes needed.
```

---

## Bad Example (Don't Do This)

```markdown
## MJML Templates

Not implemented. Files have .mjml extension but probably
contain plain HTML. Should migrate to MJML (1-2 days).
```

**Problems:**
- ❌ No search performed
- ❌ No files read
- ❌ No evidence
- ❌ Made assumptions
- ❌ False claim

---

## Checklist for Complete Documentation

Use this checklist for every verification:

- [ ] Documented what was supposed to be implemented
- [ ] Listed search commands used
- [ ] Recorded search results (files found or not found)
- [ ] Read ALL relevant files completely
- [ ] Extracted code excerpts as evidence
- [ ] Checked for alternative implementations
- [ ] Compared documented vs actual approach
- [ ] Assessed trade-offs if different
- [ ] Provided file paths and line numbers
- [ ] Made clear recommendation
- [ ] Cited evidence for every claim
- [ ] Used objective language (no assumptions)

---

## Template for Quick Notes

For rapid verification during conversations, use this condensed format:

```markdown
**[Feature Name]:** [✅/⚠️/❌]

**Search:** `[command]` → [result]
**File:** `[path:lines]`
**Evidence:** [1-2 line code excerpt]
**Status:** [1 sentence summary]
```

**Example:**
```markdown
**MJML Templates:** ✅

**Search:** `find services/ -name "*.mjml"` → 6 files
**File:** `services/alert-engine/src/delivery/templates.ts:59`
**Evidence:** `const { html } = mjml2html(mjmlSource);`
**Status:** Fully implemented with 6 templates and Handlebars.
```
