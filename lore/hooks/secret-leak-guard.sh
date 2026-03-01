#!/usr/bin/env bash
# secret-leak-guard.sh — PreToolUse hook for Write/Edit tools
# Scans content for secrets, API keys, passwords, tokens before writing
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

if [ "$TOOL_NAME" != "Write" ] && [ "$TOOL_NAME" != "Edit" ]; then
  exit 0
fi

# Extract content to check
CONTENT=$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
ti = data.get('tool_input', {})
# Write uses 'content', Edit uses 'new_string'
text = ti.get('content', '') or ti.get('new_string', '')
print(text)
" 2>/dev/null || echo "")

FILE_PATH=$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null || echo "")

if [ -z "$CONTENT" ]; then
  exit 0
fi

# Skip hook config files, this guard itself, and test files
case "$FILE_PATH" in
  *hooks.json|*hooks.json.*|*secret-leak-guard.sh|*.test.*|*.spec.*|*__test__*|*__mock__*)
    exit 0
    ;;
esac

# Check for secret patterns
FINDINGS=$(echo "$CONTENT" | python3 -c "
import sys, re

content = sys.stdin.read()
findings = []

patterns = [
    (r'(?i)(api[_-]?key|apikey)\s*[=:]\s*[\"'\'']\S{10,}', 'API key'),
    (r'(?i)(secret[_-]?key|api[_-]?secret)\s*[=:]\s*[\"'\'']\S{10,}', 'Secret key'),
    (r'(?i)(password|passwd|pwd)\s*[=:]\s*[\"'\'']\S{4,}', 'Password'),
    (r'(?i)(access[_-]?token|auth[_-]?token|bearer)\s*[=:]\s*[\"'\'']\S{10,}', 'Access token'),
    (r'(?i)AWS[_-]?ACCESS[_-]?KEY[_-]?ID\s*[=:]\s*[\"'\''A-Z0-9]{16,}', 'AWS Access Key'),
    (r'(?i)AWS[_-]?SECRET[_-]?ACCESS[_-]?KEY\s*[=:]\s*[\"'\''][A-Za-z0-9/+=]{30,}', 'AWS Secret Key'),
    (r'ghp_[A-Za-z0-9]{36,}', 'GitHub Personal Access Token'),
    (r'sk-[A-Za-z0-9]{32,}', 'OpenAI/Stripe Secret Key'),
    (r'-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----', 'Private key'),
    (r'(?i)(slack[_-]?token|xox[bpsa]-)\S{10,}', 'Slack token'),
    (r'(?i)(database[_-]?url|db[_-]?url|connection[_-]?string)\s*[=:]\s*[\"'\'']\S{10,}', 'Database URL'),
]

for pattern, name in patterns:
    if re.search(pattern, content):
        findings.append(name)

if findings:
    print(', '.join(findings))
" 2>/dev/null || echo "")

if [ -n "$FINDINGS" ]; then
  echo "BLOCKED: Potential secrets detected in content — ${FINDINGS}. File: ${FILE_PATH}" >&2
  exit 2
fi

exit 0
