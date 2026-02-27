---
description: Scan the entire project for placeholder, stub, mock, dummy, or incomplete code patterns. Reports every instance with file path and line number.
argument-hint: Optional path to scan (defaults to current project root)
allowed-tools: ["Grep", "Read", "Bash", "Skill"]
---

# No-Placeholders: Project Scan

**FIRST: Load the no-placeholders skill** using the Skill tool.

Perform a comprehensive scan of the project for ALL placeholder, stub, mock, dummy, and incomplete code patterns. Report every instance found.

## Scan Target

If `$ARGUMENTS` is provided, scan that path. Otherwise scan the current working directory.

## Scan Steps

### Step 1: Find TODO/FIXME/HACK comments
```bash
grep -rn "TODO\|FIXME\|HACK" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rs" \
  --include="*.go" --include="*.java" \
  --include="*.cs" --include="*.swift" \
  --include="*.rb" --include="*.php" \
  --include="*.c" --include="*.cpp" --include="*.h" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -v "node_modules\|.git\|target\|dist\|build\|__pycache__"
```

### Step 2: Find stub/placeholder/mock patterns
```bash
grep -rni "placeholder\|dummy\|mock\|stub\|fake\|simulated" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rs" \
  --include="*.go" --include="*.java" \
  --include="*.cs" --include="*.swift" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -v "node_modules\|.git\|target\|dist\|build\|__pycache__\|test\|spec\|_test\|_spec"
```

### Step 3: Find deceptive phrases
```bash
grep -rni "for now\|in a real\|in a complete\|in a production\|hardcoded\|hard-coded\|returns mock\|returns dummy\|would normally\|would typically\|you would need to" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rs" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -v "node_modules\|.git\|target\|dist\|build\|__pycache__"
```

### Step 4: Find language-native stubs
```bash
grep -rn "unimplemented!()\|todo!()\|NotImplementedError\|NotImplementedException\|fatalError.*not implemented\|throw.*Not implemented\|raise NotImplementedError\|pass  #\|pass\t#" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -v "node_modules\|.git\|target\|dist\|build\|__pycache__"
```

### Step 5: Find suspiciously empty function bodies
Run a Read on any files with high counts from above to check for patterns like:
- Functions that only contain `return null`, `return None`, `return []`, `return {}`
- Functions with a single `pass` statement
- Functions that only throw `NotImplementedError`

## Output Format

After running all scans, produce a structured report:

```
## Placeholder Scan Report

**Project**: [path scanned]
**Total issues found**: [count]

### Critical — Language-native stubs (must implement immediately)
[file:line] description

### High — Deceptive placeholder patterns
[file:line] description

### Medium — TODO/FIXME comments with missing implementation
[file:line] description

### Low — Naming issues (variables/functions named mock/dummy/stub)
[file:line] description

---
**Verdict**: [CLEAN / X ISSUES FOUND — IMPLEMENTATION REQUIRED]
```

## After the Report

If issues are found, ask the user:
> "I found [N] placeholder(s). Would you like me to fix them now, starting with the most critical?"

If the user says yes, work through each one systematically — DO NOT mark any as "fixed" until the real implementation is written and working.
