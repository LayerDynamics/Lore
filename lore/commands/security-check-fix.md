---
name: fix
description: Guided session to remediate security findings from a scan. Works through each finding by severity, applying fixes and verifying them.
user_invocable: true
argument-hint: [--severity critical|high|all] [--finding <number>]
allowed-tools: ["Read", "Edit", "Write", "Grep", "Glob", "Bash", "AskUserQuestion", "Task"]
---

# Security Fix Session

Systematically remediate security findings from a previous scan.

**Arguments:** $ARGUMENTS

## Workflow

### Step 1: Locate Scan Results

Check conversation history for a recent `/security-check:scan` report.

If no scan results are found:
> No scan results found in this session. Run `/security-check:scan` first, or describe the security issue you want to fix.

### Step 2: Parse Arguments

Extract from `$ARGUMENTS`:
- Severity filter: `--severity critical` (critical only), `--severity high` (critical + high), `--severity all` (default — all findings)
- Specific finding: `--finding <number>` to fix a single finding from the report

### Step 3: Prioritize Findings

Order findings for remediation:
1. **Critical** — secrets exposure, active injection vectors, missing auth
2. **High** — weak crypto, missing rate limiting, overly permissive CORS
3. **Medium** — missing headers, verbose errors, informational leaks
4. **Low** — best practice improvements

### Step 4: Fix Each Finding

For each finding in priority order:

#### 4a. Read the Affected Code
Read the file and surrounding context to understand the vulnerability in its full context.

#### 4b. Determine the Fix
- **Secrets in code** → Move to environment variables, add to `.gitignore`, rotate the exposed secret
- **SQL injection** → Use parameterized queries or ORM methods
- **Command injection** → Use safe APIs (e.g., `execFile` instead of `exec`, array args instead of string)
- **XSS** → Apply output encoding, use framework auto-escaping, add CSP headers
- **Weak hashing** → Upgrade to bcrypt/argon2/scrypt with proper salt
- **Missing auth** → Add authentication middleware to unprotected routes
- **Permissive CORS** → Restrict to specific allowed origins
- **Debug mode** → Ensure production configs disable debug
- **Dependency vulns** → Update affected packages to patched versions

#### 4c. Apply the Fix
Use Edit to apply the minimal, targeted fix. Do not refactor surrounding code.

#### 4d. Verify the Fix
After applying:
- Re-run the specific Grep pattern that detected the original finding
- Confirm the vulnerable pattern no longer matches
- Check that the fix does not break existing functionality (run tests if available)

#### 4e. Document What Changed
Keep a running log:
```
Fixed: [file:line] — [what was wrong] → [what was done]
```

### Step 5: Handle Findings Requiring User Input

Some fixes need user decisions:

```
Finding: Hardcoded API key in config/api.js:14
To fix this properly, I need to know:
1. Where should the key be stored? (environment variable, secrets manager, etc.)
2. Has this key been exposed in version control? (if so, it should be rotated)
3. What is the environment variable name convention for this project?
```

Ask using AskUserQuestion and proceed with their answer.

### Step 6: Verification Pass

After all findings are addressed:

1. Re-run the scan patterns from Step 2-5 of `/security-check:scan`
2. Report how many findings were fixed vs. remaining
3. For any remaining findings, explain why they weren't fixed (needs user input, requires infrastructure change, etc.)

### Step 7: Summary

```markdown
## Security Fix Summary

**Fixed**: [N] findings
**Remaining**: [M] findings (requiring user input or infrastructure changes)

### Changes Made
| File | Line | Finding | Fix Applied |
|------|------|---------|-------------|
| ... | ... | ... | ... |

### Still Needs Attention
- [finding and what's needed to fix it]
```
