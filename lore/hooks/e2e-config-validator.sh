#!/usr/bin/env bash
# e2e-config-validator.sh — PostToolUse hook for Write
# Validates E2E framework config files for common misconfigurations
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_name',''))" 2>/dev/null || echo "")

if [ "$TOOL_NAME" != "Write" ]; then
  exit 0
fi

python3 -c "
import sys, json, re

data = json.loads(sys.stdin.read())
ti = data.get('tool_input', {})
content = ti.get('content', '') or ''
file_path = ti.get('file_path', '')

# Only check E2E config files
config_patterns = [
    'playwright.config', 'cypress.config', 'wdio.conf',
    'cypress.json', '.puppeteerrc'
]
is_config = any(p in file_path for p in config_patterns)
if not is_config:
    sys.exit(0)

warnings = []

# Check base URL is set
if 'baseURL' not in content and 'baseUrl' not in content and 'base_url' not in content:
    warnings.append('No baseURL configured — tests will need full URLs everywhere')

# Check for unreasonable timeouts
timeout_matches = re.findall(r'timeout\s*[:=]\s*(\d+)', content)
for t in timeout_matches:
    t_val = int(t)
    if t_val < 5000:
        warnings.append(f'Timeout {t_val}ms may be too low — E2E tests need time for full flows')
    elif t_val > 120000:
        warnings.append(f'Timeout {t_val}ms is very high — consider if tests are too slow')

# Check for global mocks/intercepts in config
if re.search(r'(route|intercept)\s*\(', content):
    warnings.append('Global route/intercept in config — avoid mocking at config level in E2E')

# Check test directory exists in config
test_dir_match = re.search(r'testDir\s*[:=]\s*[\"'\''](.*?)[\"'\'']', content)
if test_dir_match:
    test_dir = test_dir_match.group(1)
    if test_dir == '.':
        warnings.append('testDir is \".\" — consider a dedicated e2e/ or tests/ directory')

# Playwright-specific checks
if 'playwright' in file_path:
    if 'webServer' not in content and 'baseURL' in content:
        warnings.append('No webServer config — ensure the app is running before tests execute')

# Cypress-specific checks
if 'cypress' in file_path:
    if 'chromeWebSecurity' in content and 'false' in content:
        warnings.append('chromeWebSecurity disabled — only do this if testing cross-origin flows')

if warnings:
    print(f'E2E config warnings in {file_path}:')
    for w in warnings:
        print(f'  - {w}')
" <<< "$INPUT" 2>/dev/null || true

exit 0
