---
name: security
description: Scan the project for security vulnerabilities (hardcoded secrets, OWASP patterns, insecure configurations) and remediate findings by severity.
argument-hint: Optional path to scan, or --fix to enter fix mode, or --severity critical|high|all to filter
---

# Security — Scan and Fix

Comprehensive security scanning and remediation. Phase 1 scans for vulnerabilities; Phase 2 fixes them.

**Arguments:** $ARGUMENTS

- If `$ARGUMENTS` contains `--fix`, skip to Phase 2 (Fix).
- If `$ARGUMENTS` contains `--severity`, use it as a filter in both phases.
- Otherwise, run Phase 1 (Scan). A path argument scopes the scan target.

---

## Phase 1: Scan

Perform a comprehensive security scan of the project for hardcoded secrets, OWASP vulnerability patterns, and insecure configurations. Report every finding with file path, line number, and severity.

### Scan Target

If `$ARGUMENTS` provides a path (not a flag), scan that path. Otherwise scan the current working directory.

### Exclusions

All scans exclude: `node_modules`, `.git`, `dist`, `build`, `__pycache__`, `.next`, `coverage`, `vendor`

Define the exclusion filter once:
```
EXCLUDE="node_modules|\.git|dist/|build/|__pycache__|\.next|coverage|vendor"
```

---

### Step 1: Hardcoded Secrets — API Keys and Tokens

```bash
grep -rn \
  -e "api[_-]key\s*=\s*['\"][^'\"]\{8,\}['\"]" \
  -e "apikey\s*=\s*['\"][^'\"]\{8,\}['\"]" \
  -e "api_secret\s*=\s*['\"][^'\"]\{8,\}['\"]" \
  -e "access_token\s*=\s*['\"][^'\"]\{8,\}['\"]" \
  -e "auth_token\s*=\s*['\"][^'\"]\{8,\}['\"]" \
  -e "bearer\s*=\s*['\"][^'\"]\{8,\}['\"]" \
  -e "secret[_-]key\s*=\s*['\"][^'\"]\{8,\}['\"]" \
  -e "client_secret\s*=\s*['\"][^'\"]\{8,\}['\"]" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rb" \
  --include="*.go" --include="*.java" \
  --include="*.cs" --include="*.php" \
  --include="*.env*" --include="*.json" \
  --include="*.yaml" --include="*.yml" \
  --include="*.toml" --include="*.ini" \
  --include="*.conf" --include="*.config" \
  -i ${ARGUMENTS:-.} 2>/dev/null | grep -vE "$EXCLUDE"
```

### Step 2: Hardcoded Secrets — Passwords

```bash
grep -rn \
  -e "password\s*=\s*['\"][^'\"]\{4,\}['\"]" \
  -e "passwd\s*=\s*['\"][^'\"]\{4,\}['\"]" \
  -e "pwd\s*=\s*['\"][^'\"]\{4,\}['\"]" \
  -e "db_pass\s*=\s*['\"][^'\"]\{4,\}['\"]" \
  -e "database_password\s*=\s*['\"][^'\"]\{4,\}['\"]" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rb" \
  --include="*.go" --include="*.java" \
  --include="*.cs" --include="*.php" \
  --include="*.yaml" --include="*.yml" \
  --include="*.toml" --include="*.ini" \
  -i ${ARGUMENTS:-.} 2>/dev/null | grep -vE "$EXCLUDE|test|spec|example|sample|placeholder|changeme|your_password"
```

### Step 3: Hardcoded Private Keys and Certificates

```bash
grep -rn \
  -e "BEGIN RSA PRIVATE KEY" \
  -e "BEGIN EC PRIVATE KEY" \
  -e "BEGIN OPENSSH PRIVATE KEY" \
  -e "BEGIN PGP PRIVATE KEY" \
  -e "-----BEGIN CERTIFICATE-----" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -vE "$EXCLUDE"
```

### Step 4: OWASP — SQL Injection Patterns

```bash
grep -rn \
  -e 'query\s*=\s*["\'']\s*SELECT.*+\s*' \
  -e 'query\s*=\s*f["\'']\s*SELECT' \
  -e 'execute\s*(\s*["\'']\s*SELECT.*%\s*' \
  -e 'execute\s*(\s*["\'']\s*INSERT.*%\s*' \
  -e 'execute\s*(\s*["\'']\s*UPDATE.*%\s*' \
  -e 'execute\s*(\s*["\'']\s*DELETE.*%\s*' \
  -e 'raw\s*(\s*["\'']\s*SELECT' \
  -e 'raw\s*(\s*["\'']\s*INSERT' \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rb" \
  --include="*.go" --include="*.java" \
  --include="*.cs" --include="*.php" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -vE "$EXCLUDE|test|spec"
```

### Step 5: OWASP — Cross-Site Scripting (XSS) Patterns

```bash
grep -rn \
  -e "innerHTML\s*=" \
  -e "outerHTML\s*=" \
  -e "document\.write\s*(" \
  -e "dangerouslySetInnerHTML" \
  -e "eval\s*(" \
  -e "setTimeout\s*(\s*['\"]" \
  -e "setInterval\s*(\s*['\"]" \
  -e "new\s*Function\s*(" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -vE "$EXCLUDE|test|spec|\.min\.js"
```

### Step 6: OWASP — Command Injection Patterns

```bash
grep -rn \
  -e "exec\s*(" \
  -e "execSync\s*(" \
  -e "spawn\s*(" \
  -e "spawnSync\s*(" \
  -e "shell_exec\s*(" \
  -e "system\s*(" \
  -e "popen\s*(" \
  -e "subprocess\.call\s*(" \
  -e "subprocess\.Popen\s*(" \
  -e "os\.system\s*(" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rb" \
  --include="*.go" --include="*.php" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -vE "$EXCLUDE|test|spec"
```

### Step 7: Insecure Configuration — HTTP instead of HTTPS

```bash
grep -rn \
  -e "http://[^'\"\s]\{5,\}" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.go" \
  --include="*.yaml" --include="*.yml" \
  --include="*.json" --include="*.toml" \
  --include="*.env*" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -vE "$EXCLUDE|localhost|127\.0\.0\.1|0\.0\.0\.0|example\.com|schemas\.xmlsoap|schemas\.openxmlformats|www\.w3\.org|xmlns"
```

### Step 8: Insecure Configuration — Debug Mode and Permissive Settings

```bash
grep -rn \
  -e "DEBUG\s*=\s*[Tt]rue" \
  -e "DEBUG\s*=\s*1" \
  -e "debug\s*:\s*true" \
  -e "FLASK_DEBUG\s*=\s*1" \
  -e "APP_DEBUG\s*=\s*true" \
  -e "NODE_ENV\s*=\s*['\"]development['\"]" \
  -e "cors.*origin.*['\"\*]['\"]" \
  -e "allow_origins.*\*" \
  -e "Access-Control-Allow-Origin.*\*" \
  -e "verify\s*=\s*False" \
  -e "rejectUnauthorized\s*:\s*false" \
  -e "ssl\s*:\s*false" \
  -e "checkServerIdentity.*false" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rb" \
  --include="*.go" --include="*.java" \
  --include="*.yaml" --include="*.yml" \
  --include="*.toml" --include="*.ini" \
  --include="*.env*" \
  -i ${ARGUMENTS:-.} 2>/dev/null | grep -vE "$EXCLUDE|test|spec|\.example|sample"
```

### Step 9: Path Traversal and File Inclusion Risks

```bash
grep -rn \
  -e "\.\./\.\." \
  -e "open\s*(\s*request\." \
  -e "open\s*(\s*params\[" \
  -e "readFile\s*(\s*req\." \
  -e "readFileSync\s*(\s*req\." \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rb" \
  --include="*.php" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -vE "$EXCLUDE|test|spec"
```

### Step 10: Insecure Randomness and Weak Cryptography

```bash
grep -rn \
  -e "Math\.random()" \
  -e "random\.random()" \
  -e "md5\s*(" \
  -e "sha1\s*(" \
  -e "createHash\s*(\s*['\"]md5['\"]" \
  -e "createHash\s*(\s*['\"]sha1['\"]" \
  -e "DES\b" \
  -e "RC4\b" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rb" \
  --include="*.go" --include="*.java" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -vE "$EXCLUDE|test|spec|checksum|integrity|etag"
```

---

### Scan Report

After running all scans, produce a structured report:

```
## Security Scan Report

**Project**: [path scanned]
**Scan date**: [date]
**Total findings**: [count]

---

### Critical — Exposed Private Keys / Credentials in Code
[file:line] [pattern matched] — description

### High — Hardcoded Secrets (API keys, tokens, passwords)
[file:line] [pattern matched] — description

### High — Injection Vulnerabilities (SQLi, XSS, Command Injection)
[file:line] [pattern matched] — description

### Medium — Insecure Configuration (HTTP, debug mode, permissive CORS, SSL disabled)
[file:line] [pattern matched] — description

### Medium — Path Traversal / Unsafe File Access
[file:line] [pattern matched] — description

### Low — Weak Cryptography / Insecure Randomness
[file:line] [pattern matched] — description

---
**Verdict**: [CLEAN / X FINDINGS — REMEDIATION REQUIRED]
```

After the report, if findings exist, ask the user:
> "I found [N] security issue(s). Would you like me to remediate them now, starting with the most critical?"

If the user says yes, proceed to Phase 2.

---

## Phase 2: Fix

Systematically remediate security findings from Phase 1 or a previous scan.

### Step 1: Locate Scan Results

Check conversation history for a recent security scan report (Phase 1 output).

If no scan results are found:
> No scan results found in this session. Run this skill without `--fix` first, or describe the security issue you want to fix.

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
- **Secrets in code** — Move to environment variables, add to `.gitignore`, rotate the exposed secret
- **SQL injection** — Use parameterized queries or ORM methods
- **Command injection** — Use safe APIs (e.g., `execFile` instead of `exec`, array args instead of string)
- **XSS** — Apply output encoding, use framework auto-escaping, add CSP headers
- **Weak hashing** — Upgrade to bcrypt/argon2/scrypt with proper salt
- **Missing auth** — Add authentication middleware to unprotected routes
- **Permissive CORS** — Restrict to specific allowed origins
- **Debug mode** — Ensure production configs disable debug
- **Dependency vulns** — Update affected packages to patched versions

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

Ask the user and proceed with their answer.

### Step 6: Verification Pass

After all findings are addressed:

1. Re-run the scan patterns from Phase 1 Steps 1-10
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
