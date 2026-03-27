#!/usr/bin/env bash
# e2e-test-quality-gate.sh — PostToolUse hook for Write|Edit
# Scans E2E test files for anti-patterns: smoke tests, mocked APIs, arbitrary sleeps
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

if [ "$TOOL_NAME" != "Write" ] && [ "$TOOL_NAME" != "Edit" ]; then
  exit 0
fi

python3 -c "
import sys, json, re

data = json.loads(sys.stdin.read())
ti = data.get('tool_input', {})
content = ti.get('content', '') or ti.get('new_string', '')
file_path = ti.get('file_path', '')

# Only check E2E test files
e2e_patterns = ['/e2e/', '.e2e.', '/cypress/e2e/', 'e2e-test', 'e2e_test']
is_e2e = any(p in file_path for p in e2e_patterns)
is_test = any(file_path.endswith(ext) for ext in ['.test.ts', '.test.js', '.spec.ts', '.spec.js', '.cy.ts', '.cy.js'])
if not (is_e2e and is_test):
    sys.exit(0)

warnings = []

# Check for arbitrary sleeps
sleep_patterns = [
    (r'waitForTimeout\s*\(\s*\d+\s*\)', 'waitForTimeout() — use waitForSelector/waitForResponse instead'),
    (r'cy\.wait\s*\(\s*\d+\s*\)', 'cy.wait(ms) — use cy.intercept() + cy.wait(@alias) instead'),
    (r'setTimeout.*\d{3,}', 'setTimeout with delay — use proper async waits'),
    (r'sleep\s*\(', 'sleep() — use framework-native waits'),
    (r'\.pause\s*\(\s*\d+', '.pause(ms) — use proper waits'),
]
for pattern, msg in sleep_patterns:
    if re.search(pattern, content):
        warnings.append(f'Arbitrary sleep: {msg}')

# Check for mocked APIs in E2E context
mock_patterns = [
    (r'cy\.intercept\s*\([^)]*\{[^}]*body\s*:', 'cy.intercept() returning mock data — E2E should use real backend'),
    (r'page\.route\s*\([^)]*fulfill', 'page.route() with fulfill — E2E should use real backend'),
    (r'nock\s*\(', 'nock() — HTTP mocking defeats E2E purpose'),
    (r'jest\.mock\s*\(', 'jest.mock() — mocking in E2E defeats the purpose'),
    (r'sinon\.(stub|mock|fake)', 'sinon stubs/mocks — E2E should use real implementations'),
]
for pattern, msg in mock_patterns:
    if re.search(pattern, content):
        warnings.append(f'Backend mock in E2E: {msg}')

# Check for page-load-only tests (goto/visit with no interactions)
lines = content.split('\n')
has_goto = bool(re.search(r'(page\.goto|cy\.visit)\s*\(', content))
has_interaction = bool(re.search(r'(\.click|\.fill|\.type|\.check|\.select|\.press|\.dblclick|\.clear)\s*\(', content))
if has_goto and not has_interaction:
    warnings.append('Page-load-only test — no user interactions found after navigation')

# Check for weak assertions
weak_assertions = [
    (r\"should\s*\(\s*['\"]exist['\"]\s*\)\", 'should(exist) — assert on visible content, not just DOM presence'),
    (r'toBeInTheDocument\s*\(\s*\)', 'toBeInTheDocument() — assert on visible text/state instead'),
]
for pattern, msg in weak_assertions:
    if re.search(pattern, content):
        warnings.append(f'Weak assertion: {msg}')

# Count assertions
assertion_count = len(re.findall(r'(expect\s*\(|should\s*\(|assert\s*[\.(])', content))
test_count = len(re.findall(r'(test\s*\(|it\s*\(|specify\s*\()', content))
if test_count > 0 and assertion_count < test_count * 2:
    warnings.append(f'Low assertion density: {assertion_count} assertions for {test_count} tests — aim for 2+ per test')

if warnings:
    print(f'E2E test quality warnings in {file_path}:')
    for w in warnings:
        print(f'  - {w}')
" <<< "$INPUT" 2>/dev/null || true

exit 0
