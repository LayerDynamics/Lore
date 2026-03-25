---
description: Scan the project for security vulnerabilities — hardcoded secrets, OWASP patterns, insecure configurations — and remediate findings by severity. Covers the full security lifecycle from scan through fix.
argument-hint: "[path] [--fix] [--severity critical|high|all]"
---

# security: Security

**Load the security skill first** using the Skill tool.

## Starting Context

`$ARGUMENTS` contains an optional path to scan, `--fix` to enter remediation mode, and `--severity` to filter findings. Pass the full `$ARGUMENTS` string to the skill.

- No flags — full project scan, report findings by severity
- `--fix` — guided remediation of all findings
- `--severity critical` — scan and fix critical findings only

## Run the Full Workflow

Execute every step in the skill without skipping:

1. **Phase 1** — Scan for vulnerabilities (secrets, OWASP, config issues)
2. **Phase 2** — Remediate findings by severity (if --fix or user confirms)

No phase is optional. Findings must be fixed, not just reported.
