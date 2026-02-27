---
description: Audit project dependencies and configurations for known vulnerabilities, committed secrets, unsafe file permissions, and outdated TLS/SSL settings. Reports findings with remediation guidance.
argument-hint: Optional path to audit (defaults to current project root)
allowed-tools: ["Grep", "Read", "Bash", "Glob"]
---

# Security Check: Dependency and Configuration Audit

Perform a comprehensive audit of project dependencies and configurations. Check for vulnerable packages, accidentally committed secrets, unsafe file permissions, and outdated cryptographic settings. Report every finding with remediation steps.

## Audit Target

If `$ARGUMENTS` is provided, audit that path. Otherwise audit the current working directory.

---

## Audit Steps

### Step 1: Run npm audit (Node.js projects)

Detect `package.json` files first, then run audit:

```bash
find ${ARGUMENTS:-.} -name "package.json" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null
```

For each `package.json` found (that is not inside `node_modules`), run:

```bash
npm audit --json 2>/dev/null
```

Parse the output for vulnerabilities. Focus on `critical` and `high` severity entries. If `npm audit` is unavailable or the directory is not an npm project, note it and skip.

Also check for `package-lock.json` presence — if `package.json` exists but `package-lock.json` does not, flag it as a finding (lockfile missing means reproducible installs are not guaranteed and auditing is less reliable).

### Step 2: Check for Python dependency vulnerabilities

Look for Python dependency files:

```bash
find ${ARGUMENTS:-.} -name "requirements*.txt" -o -name "Pipfile" -o -name "Pipfile.lock" -o -name "pyproject.toml" 2>/dev/null | grep -v "node_modules\|\.git\|dist\|build\|__pycache__"
```

If `pip-audit` is available:
```bash
pip-audit 2>/dev/null
```

If not available, note that `pip-audit` or `safety` should be installed for Python dependency auditing.

### Step 3: Check for .env files committed to version control

```bash
find ${ARGUMENTS:-.} -name ".env" -o -name ".env.local" -o -name ".env.production" -o -name ".env.staging" -o -name ".env.development" 2>/dev/null | grep -v "node_modules\|\.git\|dist\|build"
```

For each `.env` file found, check if it is tracked by git:

```bash
git -C ${ARGUMENTS:-.} ls-files --error-unmatch <file> 2>/dev/null && echo "TRACKED" || echo "untracked"
```

A `.env` file that is git-tracked is a Critical finding. Also check `.gitignore` to confirm `.env` entries are present:

```bash
grep -n "\.env" ${ARGUMENTS:-.}/.gitignore 2>/dev/null
```

### Step 4: Check for other sensitive files committed to git

```bash
git -C ${ARGUMENTS:-.} ls-files 2>/dev/null | grep -iE "\.(pem|key|p12|pfx|cer|crt|jks|keystore|ppk|id_rsa|id_dsa|id_ecdsa|id_ed25519)$"
```

```bash
git -C ${ARGUMENTS:-.} ls-files 2>/dev/null | grep -iE "(secret|credential|password|passwd|private_key|auth_token)" | grep -vE "test|spec|example|sample|template"
```

### Step 5: Check file permissions on sensitive files

```bash
find ${ARGUMENTS:-.} \( -name "*.pem" -o -name "*.key" -o -name "*.p12" -o -name "*.pfx" -o -name "id_rsa" -o -name "id_dsa" -o -name "id_ecdsa" -o -name "id_ed25519" -o -name ".env" \) -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/dist/*" -not -path "*/build/*" -not -path "*/__pycache__/*" -exec ls -la {} \; 2>/dev/null
```

Flag any private key or `.env` file that is world-readable (permissions `---r--r--` or broader than `600`/`rw-------`).

Also check for config files with overly permissive permissions:

```bash
find ${ARGUMENTS:-.} -name "*.conf" -o -name "*.config" -o -name "*.ini" 2>/dev/null | grep -v "node_modules\|\.git" | xargs ls -la 2>/dev/null | grep -E "^-..(r|w)..(r|w).."
```

### Step 6: Check for outdated TLS/SSL configurations

Scan source code and config files for deprecated TLS versions and weak cipher references:

```bash
grep -rn \
  -e "TLSv1\b" \
  -e "TLSv1\.0" \
  -e "TLSv1\.1" \
  -e "SSLv2" \
  -e "SSLv3" \
  -e "ssl\.PROTOCOL_SSLv2" \
  -e "ssl\.PROTOCOL_SSLv3" \
  -e "ssl\.PROTOCOL_TLSv1\b" \
  -e "ssl\.PROTOCOL_TLSv1_1" \
  -e "minVersion.*TLSv1\b" \
  -e "minVersion.*TLSv1\.0" \
  -e "minVersion.*TLSv1\.1" \
  -e "secureProtocol.*SSLv" \
  -e "secureProtocol.*TLSv1\b" \
  -e "RC4\b" \
  -e "DES\b" \
  -e "3DES\b" \
  -e "EXPORT" \
  -e "NULL\sCIPHER\|eNULL\|aNULL" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rb" \
  --include="*.go" --include="*.java" \
  --include="*.cs" --include="*.php" \
  --include="*.yaml" --include="*.yml" \
  --include="*.toml" --include="*.ini" \
  --include="*.conf" --include="*.config" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -vE "node_modules|\.git|dist|build|__pycache__|test|spec"
```

### Step 7: Check for disabled certificate verification

```bash
grep -rn \
  -e "verify\s*=\s*False" \
  -e "rejectUnauthorized\s*:\s*false" \
  -e "InsecureRequestWarning" \
  -e "urllib3.*disable_warnings" \
  -e "ssl_verify\s*=\s*false" \
  -e "checkServerIdentity\s*:\s*function.*\{\s*\}" \
  -e "NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*['\"]0['\"]" \
  -e "PYTHONHTTPSVERIFY\s*=\s*0" \
  --include="*.ts" --include="*.tsx" \
  --include="*.js" --include="*.jsx" \
  --include="*.py" --include="*.rb" \
  --include="*.go" --include="*.java" \
  --include="*.yaml" --include="*.yml" \
  --include="*.env*" \
  -i ${ARGUMENTS:-.} 2>/dev/null | grep -vE "node_modules|\.git|dist|build|__pycache__|test|spec"
```

### Step 8: Check Docker and container configurations

```bash
find ${ARGUMENTS:-.} -name "Dockerfile*" -o -name "docker-compose*.yml" -o -name "docker-compose*.yaml" 2>/dev/null | grep -v "node_modules\|\.git"
```

For each Dockerfile found, read it and check for:
- Running as root (`USER root` or no `USER` directive)
- Secrets passed as `ARG` or `ENV` (hardcoded)
- Use of `latest` tag on base images (non-deterministic builds)
- `--no-check-certificate` or `curl -k` in RUN commands

```bash
grep -rn \
  -e "ARG.*PASSWORD\|ARG.*SECRET\|ARG.*TOKEN\|ARG.*KEY" \
  -e "ENV.*PASSWORD\|ENV.*SECRET\|ENV.*TOKEN" \
  -e "curl\s.*-k\b\|curl\s.*--insecure" \
  -e "wget\s.*--no-check-certificate" \
  -e ":latest" \
  Dockerfile* docker-compose*.yml docker-compose*.yaml 2>/dev/null | grep -v "node_modules\|\.git\|dist\|build\|__pycache__"
```

### Step 9: Check for security headers in web server configs

```bash
grep -rn \
  -e "X-Frame-Options" \
  -e "X-Content-Type-Options" \
  -e "Content-Security-Policy" \
  -e "Strict-Transport-Security" \
  -e "X-XSS-Protection" \
  --include="*.conf" --include="*.nginx" \
  --include="*.yaml" --include="*.yml" \
  --include="*.ts" --include="*.js" \
  ${ARGUMENTS:-.} 2>/dev/null | grep -vE "node_modules|\.git|dist|build|__pycache__|test|spec" | head -20
```

If none of these headers appear in any server configuration, flag it as a Medium finding (security headers not configured).

---

## Output Format

After running all audit steps, produce a structured report:

```
## Dependency and Configuration Audit Report

**Project**: [path audited]
**Audit date**: [date]
**Total findings**: [count]

---

### Critical — Secrets or Keys Committed to Version Control
[file] — description
Remediation: [specific steps]

### Critical — npm/pip Vulnerabilities (Critical Severity)
[package@version] — CVE or advisory
Remediation: npm audit fix --force OR upgrade to [version]

### High — npm/pip Vulnerabilities (High Severity)
[package@version] — CVE or advisory
Remediation: [specific steps]

### High — Disabled Certificate Verification
[file:line] — description
Remediation: [specific steps]

### High — Deprecated TLS/SSL Version or Weak Cipher
[file:line] — description
Remediation: Enforce TLS 1.2 minimum; prefer TLS 1.3. Remove RC4, DES, 3DES, NULL ciphers.

### Medium — Insecure File Permissions
[file] permissions: [current] — should be 600 or stricter
Remediation: chmod 600 [file]

### Medium — Docker Security Issues
[file:line] — description
Remediation: [specific steps]

### Medium — Missing Security Headers
[config file or "not found"] — headers not configured
Remediation: Add X-Frame-Options, Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options

### Low — Missing Lockfile
[package.json path] — no package-lock.json present
Remediation: Run npm install to generate lockfile; commit it to version control

### Low — Missing .gitignore Entries
.gitignore does not exclude: [list of missing entries]
Remediation: Add .env, *.pem, *.key, *.p12 to .gitignore

---
**Verdict**: [CLEAN / X FINDINGS — REMEDIATION REQUIRED]
```

## After the Report

If findings exist, ask the user:
> "I found [N] audit issue(s). Would you like me to walk through remediation, starting with the most critical?"

When remediating:
1. For committed secrets — help rotate the secret, add to `.gitignore`, and optionally rewrite git history with `git filter-branch` or `git filter-repo`
2. For vulnerable packages — provide the exact upgrade command
3. For file permissions — provide the exact `chmod` command
4. For TLS issues — show the corrected configuration snippet
5. Do NOT mark an issue resolved until the actual fix is applied and verified
