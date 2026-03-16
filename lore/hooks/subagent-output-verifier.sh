#!/usr/bin/env bash
# subagent-output-verifier.sh — PostToolUse hook for Task tool
# After any subagent completes, reminds the main model to systematically
# verify all variable names, method names, imports, and implementation details
# in the subagent's output before accepting or applying it.
set -euo pipefail

INPUT=$(cat)

python3 -c "
import sys, json

data = json.loads(sys.stdin.read())
tool_name = data.get('tool_name', '')

if tool_name != 'Task':
    sys.exit(0)

ti = data.get('tool_input', {})
result = str(data.get('tool_result', ''))
agent_type = ti.get('subagent_type', ti.get('description', 'unknown'))

# Only trigger for agents that produce code or make code changes
# Skip pure research/exploration agents that don't write code
skip_types = {'claude-code-guide', 'statusline-setup'}
if agent_type in skip_types:
    sys.exit(0)

# Detect if result contains code artifacts (file paths, code blocks, edits)
code_indicators = [
    '.ts', '.js', '.py', '.sh', '.json', '.md',
    'function ', 'const ', 'let ', 'var ', 'class ',
    'def ', 'import ', 'from ', 'require(',
    'export ', 'module.', 'async ', 'await ',
    'Edit:', 'Write:', 'Created:', 'Modified:',
]
result_lower = result.lower()
has_code = any(ind.lower() in result_lower for ind in code_indicators)

if not has_code and len(result) < 200:
    # Short non-code result, skip verification
    sys.exit(0)

print('''SUBAGENT OUTPUT VERIFICATION REQUIRED — Before accepting or applying this subagent's output, you MUST systematically verify each of the following:

1. VARIABLE NAMES: Check every variable name in the output against the actual codebase. Read the relevant files to confirm variable names match exactly (spelling, casing, camelCase vs snake_case).

2. METHOD/FUNCTION NAMES: Verify every method and function name referenced or created by the subagent. Confirm they exist in the codebase with the exact same signature, or if new, that they follow the project's naming conventions.

3. IMPORT PATHS: Check all import/require paths are correct and the referenced modules actually exist at those paths.

4. FILE PATHS: Verify every file path mentioned in the output exists and is the correct target.

5. API CONTRACTS: If the subagent called or referenced APIs, classes, or interfaces, confirm parameter names, types, and return types match the actual definitions.

6. LOGIC CORRECTNESS: Read through any code the subagent produced and verify the logic achieves the stated goal — no off-by-one errors, no missing edge cases, no inverted conditions.

7. COMPLETENESS: Confirm the subagent fully completed its task — no TODOs, stubs, placeholders, or \"implement later\" comments.

Do NOT skip this verification. Read the actual files. Do NOT assume the subagent got names right from memory.''')
" <<< "$INPUT" 2>/dev/null || true

exit 0
