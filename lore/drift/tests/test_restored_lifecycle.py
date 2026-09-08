import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

HOOKS = Path(__file__).resolve().parents[1]

class RestoredLifecycle(unittest.TestCase):
    def test_real_hook_lifecycle_and_session_isolation(self):
        with tempfile.TemporaryDirectory() as home:
            env = dict(os.environ, HOME=home)
            payload = {'session_id': 'restoration-test', 'cwd': home, 'prompt': 'Restore required drift protection and verify scope tracking.'}
            def run(name, data):
                result = subprocess.run(['bash', str(HOOKS / name)], input=json.dumps(data), text=True, capture_output=True, env=env, check=True)
                self.assertEqual(result.stderr, '')
                return json.loads(result.stdout) if result.stdout.strip() else None
            run('drift-anchor-capture.sh', payload)
            for _ in range(16):
                reminder = run('drift-check-periodic.sh', {**payload, 'tool_name': 'Write', 'tool_input': {'file_path': '/project/example.py'}})
            self.assertIn('Restore required drift protection', reminder['hookSpecificOutput']['additionalContext'])
            self.assertIn('example.py', reminder['hookSpecificOutput']['additionalContext'])
            result = run('drift-subagent-inject.sh', {**payload, 'tool_input': {'message': 'Inspect the tests'}})
            self.assertIn('PARENT SESSION SCOPE', result['hookSpecificOutput']['updatedInput']['message'])
            self.assertIsNone(run('drift-subagent-inject.sh', {**payload, 'session_id': 'different-session', 'tool_input': {'prompt': 'Inspect tests'}}))
            run('drift-check-final.sh', payload)
            state_files = list((Path(home) / '.claude/drift-state').glob('*/*.json'))
            self.assertEqual(len(state_files), 1)
            state = json.loads(state_files[0].read_text())
            self.assertEqual(state['tool_call_count'], 16)
            self.assertEqual(len(state['stop_events']), 1)
            error_log = Path(home) / '.claude/drift-state/hook-errors.log'
            self.assertFalse(error_log.exists() and error_log.read_text())
