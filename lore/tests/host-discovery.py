#!/usr/bin/env python3
"""Validate built packages using installed hosts, with isolated configuration.

No model calls, credentials, user configuration writes, or extension setup.
"""
import json
import os
from pathlib import Path
import select
import subprocess
import tempfile
import time
import sys

REPO = Path(__file__).resolve().parents[2]
DIST = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else REPO / 'dist'
version = json.loads((REPO / 'lore/lore.json').read_text())['version']
results = []


def run(args, env):
    proc = subprocess.run(args, env=env, capture_output=True, text=True, timeout=45)
    results.append({'command': args, 'exit': proc.returncode, 'stdout': proc.stdout, 'stderr': proc.stderr})
    if proc.returncode:
        raise RuntimeError(f'{args}: {proc.stderr or proc.stdout}')
    return proc.stdout


with tempfile.TemporaryDirectory(prefix='lore-host-check-') as temporary:
    env = dict(os.environ)
    codex_dir = Path(temporary) / 'codex'
    claude_dir = Path(temporary) / 'claude'
    codex_dir.mkdir()
    claude_dir.mkdir()
    env['CODEX_HOME'] = str(codex_dir)
    env['CLAUDE_CONFIG_DIR'] = str(claude_dir)
    codex_package = DIST / f'codex-{version}'
    claude_package = DIST / f'claude-{version}'
    run(['codex', 'plugin', 'marketplace', 'add', str(codex_package), '--json'], env)
    installed = json.loads(run(['codex', 'plugin', 'add', 'lore@lore-core', '--json'], env))
    assert installed['version'] == version
    health = json.loads(run(['node', str(Path(installed['installedPath']) / 'bin/lore.mjs'), 'doctor'], env))
    assert health['workflows'] == 10 and health['integrity']['verified'] is True
    process = subprocess.Popen(['codex', 'app-server', '--stdio'], env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1)

    def call(number, method, params):
        process.stdin.write(json.dumps({'id': number, 'method': method, 'params': params}) + '\n')
        process.stdin.flush()
        until = time.monotonic() + 45
        while time.monotonic() < until:
            if select.select([process.stdout], [], [], 1)[0]:
                line = process.stdout.readline()
                if not line:
                    raise RuntimeError('Codex app-server closed stdout')
                response = json.loads(line)
                if response.get('id') == number:
                    if 'error' in response:
                        raise RuntimeError(response['error'])
                    return response['result']
        raise TimeoutError(method)

    try:
        call(1, 'initialize', {'clientInfo': {'name': 'lore-host-validation', 'version': version}, 'capabilities': {'experimentalApi': True}})
        listing = call(2, 'skills/list', {'cwds': [str(REPO)], 'forceReload': True})
        skills = [s for s in listing['data'][0]['skills'] if s['name'].startswith('lore:')]
        assert len(skills) == 10 and all(s['enabled'] for s in skills), [(s['name'], s['enabled']) for s in skills]
        assert all(s['path'].startswith(installed['installedPath']) for s in skills)
        assert all('allow_implicit_invocation: false' in (Path(s['path']).parent / 'agents/openai.yaml').read_text() for s in skills)
        hooks = call(3, 'hooks/list', {'cwds': [str(REPO)]})
        lore_hooks = [h for h in hooks['data'][0]['hooks'] if h['key'].startswith('lore@lore-core:')]
        assert len(lore_hooks) == 2, lore_hooks
        assert not hooks['data'][0]['errors'], hooks['data'][0]['errors']
        results.append({'codex_skills': [s['name'] for s in skills], 'codex_hooks': [h['key'] for h in lore_hooks], 'unrelated_skill_errors': listing['data'][0]['errors']})
    finally:
        process.terminate()
        process.wait(timeout=10)

    run(['claude', 'plugin', 'validate', str(claude_package / '.claude-plugin/plugin.json')], env)
    run(['claude', 'plugin', 'validate', str(claude_package / '.claude-plugin/marketplace.json')], env)
    run(['claude', 'plugin', 'marketplace', 'add', str(claude_package)], env)
    run(['claude', 'plugin', 'install', 'lore@lore-core'], env)
    listing = run(['claude', 'plugin', 'list', '--json'], env)
    plugins = json.loads(listing)
    assert any(p.get('id') == 'lore@lore-core' and p.get('enabled') for p in plugins), plugins

(DIST / 'host-validation.json').write_text(json.dumps(results, indent=2) + '\n')
print('Codex: 10 enabled Lore skills and 2 hooks discovered; explicit-activation metadata preserved.')
print('Claude: plugin and marketplace validated; package installed and enabled in isolated configuration.')
print('No model response, interactive session, or live global installation was tested.')
print(DIST / 'host-validation.json')
