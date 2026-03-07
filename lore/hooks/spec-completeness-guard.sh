#!/usr/bin/env bash
# spec-completeness-guard.sh — PostToolUse hook for Write tool
# Validates spec documents have required sections when writing to docs/specs/
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json, re

data = json.loads(sys.stdin.read())
file_path = data.get('tool_input', {}).get('file_path', '')
content = data.get('tool_input', {}).get('content', '')

# Only fire for spec files (case-insensitive match)
if not re.search(r'(docs/specs/|specs/).*spec.*\.md$', file_path, re.IGNORECASE):
    sys.exit(0)

required_sections = [
    'Background',
    'Requirements',
    'Functional requirements',
    'Non-functional requirements',
    'Security and compliance requirements',
    'Data requirements',
    'Integration requirements',
    'Operational requirements',
    'Delivery constraints',
    'Method',
    'System architecture overview',
    'Component responsibilities',
    'Data design and schema model',
    'API and interface design',
    'Security architecture',
    'Reliability and resilience design',
    'Observability design',
    'Infrastructure and deployment topology',
    'Tradeoffs and rejected alternatives',
    'Implementation',
    'Build phases',
    'Testing strategy',
    'Rollout strategy',
    'Milestones',
    'Gathering Results',
    'Success metrics',
]

missing = []
warnings = []

for section in required_sections:
    pattern = re.compile(r'^#{1,4}\s+.*' + re.escape(section), re.MULTILINE | re.IGNORECASE)
    if not pattern.search(content):
        missing.append(section)

# Count TBD markers (word boundary to avoid matching STDLIB etc)
tbd_count = len(re.findall(r'\bTBD\b', content, re.IGNORECASE))

# Count empty sections (heading followed immediately by another heading or end)
empty_sections = re.findall(r'^(#{1,4}\s+.+)\n+(?=#{1,4}\s|\Z)', content, re.MULTILINE)

if missing:
    top5 = ', '.join(missing[:5])
    print(f'SPEC VALIDATION: {file_path}')
    print(f'  Missing sections ({len(missing)}): {top5}')
    if len(missing) > 5:
        rest = len(missing) - 5
        print(f'  ... and {rest} more')

if tbd_count > 0:
    warnings.append(f'{tbd_count} TBD markers remain')

if empty_sections:
    n = len(empty_sections)
    warnings.append(f'{n} empty sections detected')

if warnings:
    msg = '; '.join(warnings)
    print(f'  Warnings: {msg}')

if not missing and not warnings:
    print(f'Spec validated: {file_path} -- all required sections present')
elif not missing and warnings:
    print(f'Spec structure complete but has open items: {file_path}')
" <<< "$INPUT" 2>/dev/null || true

exit 0
