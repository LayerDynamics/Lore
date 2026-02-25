---
name: verify-before-documenting
description: This skill should be used when conducting code reviews, gap analysis, documentation audits, comparing documentation to implementation, or making claims about what exists or is missing in a codebase. Use when the user asks to "review the codebase", "find what's missing", "compare docs to code", "verify implementation", "audit the code", or before documenting findings about code state.
version: 1.0.0
---

# Verify Before Documenting

## Purpose

Prevent false claims and inaccurate documentation by verifying actual implementation before making assertions. This skill enforces evidence-based analysis by requiring file reads and verification before documenting what exists or is missing in a codebase.

## When to Use This Skill

Use this skill when:
- Conducting code reviews or gap analysis
- Comparing documentation to actual implementation
- Documenting what features are missing or present
- Auditing codebase state
- Making claims about code existence or absence
- Creating implementation status reports
- Before writing "X is not implemented" or "Y is missing"

**CRITICAL:** Use this skill BEFORE making any claim about code state.

## Core Principle

**Read actual files first. Document truth, not assumptions.**

Never claim something is missing, implemented, or broken without reading the actual source files as evidence.

## Verification Workflow

### Step 1: Identify What to Verify

Before making any claim, identify:
- What feature/implementation is being assessed
- What files would contain this implementation
- What patterns or code structures to look for

**Example:**
```
Claim: "MJML templates are not implemented"
Files to check: services/*/templates/*.mjml, services/*/src/**/templates.ts
Patterns: "mjml", "mjml2html", "<mj-"
```

### Step 2: Search for Evidence

Use systematic search before making claims:

```bash
# Search for keywords
grep -r "keyword" services/ --include="*.ts" --include="*.js"

# Find files by pattern
find services/ -name "*template*" -o -name "*.mjml"

# Check for npm packages
grep -r "package-name" services/*/package.json

# Search for imports
grep -r "^import.*from.*'package'" services/
```

**Never skip this step.** Assumptions without search lead to false claims.

### Step 3: Read Actual Files

After finding candidate files, READ them completely:

```typescript
// Use Read tool on each file
Read({ file_path: "/path/to/file.ts" })
Read({ file_path: "/path/to/template.mjml" })
```

**Do not:**
- Assume file contents from filename
- Judge by comments without reading implementation
- Trust previous knowledge without verification
- Skip reading "obvious" files

### Step 4: Verify Implementation Details

When reading files, check:
- Is the code actually implemented or just commented?
- Are required dependencies imported and used?
- Does the code match documented specifications?
- Are there alternative implementations?

**Example verification checklist:**
```
✅ Package imported: import mjml2html from 'mjml'
✅ Function exists: mjml2html(mjmlSource)
✅ Files exist: breaking-alert.mjml contains <mjml> tags
✅ Evidence found at: services/alert-engine/src/delivery/templates.ts:59
```

### Step 5: Document with Evidence

When documenting findings, cite specific evidence:

**Good (Evidence-Based):**
```markdown
## MJML Templates: ✅ FULLY IMPLEMENTED

**Evidence:**
- File: `services/alert-engine/templates/breaking-alert.mjml:1-93`
- Contains real MJML syntax: `<mjml>`, `<mj-section>`, `<mj-column>`
- Compilation: `services/alert-engine/src/delivery/templates.ts:59`
  ```typescript
  const { html, errors } = mjml2html(mjmlSource);
  ```
- Six templates implemented (exceeds spec of 3)
```

**Bad (Assumption-Based):**
```markdown
## MJML Templates: ❌ NOT IMPLEMENTED

Files have .mjml extension but probably contain plain HTML.
Should migrate to MJML (1-2 days effort).
```

### Step 6: Distinguish Implementation Variants

When documentation describes method X but implementation uses method Y:

1. **Verify both are actually different** (read both approaches)
2. **Assess if Y accomplishes same goal as X**
3. **Document as "Alternative Implementation" not "Missing"**
4. **Note trade-offs between documented vs actual approach**

**Example:**
```markdown
## Job Queue

**Documented:** pgmq extension
**Implemented:** Custom queue table with status field
**Assessment:** ✅ Functional alternative
- Achieves same goal (job queuing)
- Simpler for MVP scale
- Should migrate at 100k+ articles/day
```

## Common Mistakes to Avoid

### Mistake 1: Assumption Without Verification

❌ **Wrong Process:**
```
1. Read documentation saying "should use MJML"
2. Assume it's not implemented
3. Document as missing
```

✅ **Correct Process:**
```
1. Read documentation saying "should use MJML"
2. Search for mjml files and imports
3. Read actual implementation files
4. Document what's actually there
```

### Mistake 2: Judging by File Extension or Comments

❌ **Wrong:**
```typescript
// File: templates.mjml
// Code comment says "Bloom filter"
// → Assume it's a Bloom filter implementation
```

✅ **Correct:**
```typescript
// File: templates.mjml
// Read actual content to verify MJML syntax
const content = Read("templates.mjml");
// Check for <mjml>, <mj-section> tags
```

### Mistake 3: Not Checking for Alternatives

❌ **Wrong:**
```
Documentation: "Use SendGrid for email"
Search: grep "sendgrid" → No results
Conclusion: Email not implemented
```

✅ **Correct:**
```
Documentation: "Use SendGrid for email"
Search: grep "sendgrid" → No results
Alternative search: grep -r "email" services/
Find: Resend implementation instead
Conclusion: Email implemented with Resend (alternative provider)
```

### Mistake 4: Incomplete Evidence

❌ **Wrong:**
```markdown
MJML templates are missing.
```

✅ **Correct:**
```markdown
## MJML Templates Status

**Evidence gathered:**
- Searched: `find services/ -name "*.mjml"` → 6 files found
- Read: `services/alert-engine/templates/breaking-alert.mjml`
- Contains: Real MJML syntax with `<mj-section>` tags
- Compilation: `mjml2html()` function at templates.ts:59

**Conclusion:** ✅ Fully implemented with 6 templates
```

## Verification Commands Reference

### Search Operations

```bash
# Find files by pattern
find . -name "*.mjml" -o -name "*template*"

# Search for keywords
grep -r "keyword" services/ --include="*.ts"

# Case-insensitive search
grep -ri "mjml" services/

# Search for imports
grep -r "^import.*'package-name'" services/

# Count occurrences
grep -r "keyword" services/ | wc -l

# Show context around matches
grep -r -B 3 -A 3 "keyword" services/
```

### File Reading

```bash
# Read specific file
cat services/api/src/routes/health.ts

# Check if file exists
ls services/alert-engine/templates/*.mjml

# Show file structure
tree services/nlp/app/processors/

# Count lines in files
find services/ -name "*.ts" | xargs wc -l
```

### Package Verification

```bash
# Check package.json dependencies
cat services/api/package.json | grep "mjml"

# Find all package.json files
find services/ -name "package.json"

# Check for imports in code
grep -r "import.*mjml" services/
```

## Documentation Template

When documenting verification findings, use this structure:

```markdown
## Feature Name

### Documented Approach
[What the documentation specifies]

### Implementation Status: [✅ Implemented | ⚠️ Alternative | ❌ Missing]

**Evidence:**
- **Files searched:** [search commands used]
- **Files found:** [list of relevant files]
- **Key implementation:** [file:line numbers]
- **Code excerpt:**
  ```[language]
  [relevant code snippet]
  ```

### Assessment
[Comparison of documented vs actual]
[Trade-offs if using alternative approach]
[Recommendation: keep, migrate, or implement]
```

## Integration with Other Skills

### Before Code Review
Use this skill BEFORE claiming bugs or missing features.

### Before Gap Analysis
Use this skill to verify each item in "missing" list actually is missing.

### Before Documentation Updates
Use this skill to ensure documentation matches actual implementation.

## Quick Verification Checklist

Before making any claim about code:

- [ ] Searched for relevant keywords
- [ ] Found candidate files
- [ ] Read actual file contents
- [ ] Verified implementation details
- [ ] Checked for alternative implementations
- [ ] Documented evidence with file paths and line numbers
- [ ] Distinguished between "missing" vs "implemented differently"

## Real-World Example

**Original claim:** "MJML templates not implemented, using plain HTML instead"

**Verification process:**
```bash
# Step 1: Search for MJML files
$ find services/ -name "*.mjml"
services/alert-engine/templates/breaking-alert.mjml
services/alert-engine/templates/daily-digest.mjml
services/alert-engine/templates/weekly-digest.mjml

# Step 2: Read actual file
$ Read("services/alert-engine/templates/breaking-alert.mjml")
# Found: Real MJML syntax with <mjml>, <mj-section> tags

# Step 3: Check compilation
$ grep -r "mjml2html" services/alert-engine/
services/alert-engine/src/delivery/templates.ts:import mjml2html from 'mjml';
services/alert-engine/src/delivery/templates.ts:  const { html, errors } = mjml2html(mjmlSource);

# Step 4: Read implementation
$ Read("services/alert-engine/src/delivery/templates.ts")
# Found: Complete MJML compilation pipeline with Handlebars
```

**Corrected conclusion:** MJML fully implemented with 6 templates, exceeds specification.

## Remember

**The cost of verification (2-5 minutes) is far less than the cost of false documentation (hours of confusion, wrong decisions, wasted work).**

Read files. Document truth. Cite evidence.

## Additional Resources

For examples of proper verification and evidence-based documentation:
- **`references/verification-examples.md`** - Real-world verification workflows
- **`examples/evidence-template.md`** - Template for documenting findings