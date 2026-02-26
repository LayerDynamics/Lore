---
description: Scan the project for security vulnerabilities including hardcoded secrets, OWASP patterns (SQLi, XSS, command injection), and insecure configurations. Reports findings by severity.
argument-hint: Optional path to scan (defaults to current project root)
allowed-tools: ["Grep", "Read", "Bash", "Glob"]
---

# Security Check: Vulnerability Scanner

Perform a comprehensive security scan of the project for hardcoded secrets, OWASP vulnerability patterns, and insecure configurations. Report every finding with file path, line number, and severity.

## Scan Target

If `$ARGUMENTS` is provided, scan that path. Otherwise scan the current working directory.

## Exclusions

All scans exclude: `node_modules`, `.git`, `dist`, `build`, `__pycache__`, `.next`, `coverage`, `vendor`

Define the exclusion filter once:
```
EXCLUDE="node_modules|\.git|dist/|build/|__pycache__|\.next|coverage|vendor"
```

---

## Scan Steps

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

## Output Format

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

## After the Report

If findings exist, ask the user:
> "I found [N] security issue(s). Would you like me to remediate them now, starting with the most critical?"

If the user says yes, work through each finding:
1. Explain the specific risk
2. Propose the fix (e.g., move secret to env var, use parameterized query, enable HTTPS)
3. Apply the fix
4. Do NOT mark an issue resolved until the fix is actually in place
