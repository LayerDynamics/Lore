import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm, readdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, catalog, workflow, contained, metadata, parseWorkflow } from '../runtime/catalog.mjs';
import { build } from '../runtime/build.mjs';
import { capabilities, normalizeEvent } from '../runtime/capabilities.mjs';
import { handleHook } from '../runtime/hook.mjs';
import { createServer } from '../runtime/mcp.mjs';
import { verifyPackage } from '../runtime/integrity.mjs';

async function temporary(t) {
  const dir = await mkdtemp(join(tmpdir(), 'lore test '));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

test('one canonical workflow per name, with a small portable default', async () => {
  const all = await catalog();
  assert.equal(new Set(all.map(e => e.name)).size, all.length);
  assert.equal(all.length, 10);
  assert.equal(all.find(e => e.name === 'execute').source, 'skills/execute/SKILL.md');
  assert.ok(all.every(e => !e.name.startsWith('source-command-')));
});

test('core workflows use capabilities without hardcoded models or mandatory APIs', async () => {
  for (const e of await catalog()) {
    const { body } = await workflow(e.name);
    assert.match(body, /Runtime contract/);
    assert.doesNotMatch(body, /TaskCreate|TaskUpdate|CLAUDE_PLUGIN_ROOT|~\/\.claude|model:\s*(opus|sonnet|haiku)|gpt-\d/i);
  }
});

test('unknown names and traversal fail explicitly', async () => {
  await assert.rejects(workflow('../README'), /Invalid workflow name/);
  await assert.rejects(workflow('missing'), /Unknown workflow/);
  await assert.rejects(contained(ROOT, '../README.md'), /escapes/);
});

test('tool capabilities derive from actual inventory, with no provider assumption', () => {
  assert.deepEqual(capabilities(['exec_command', 'apply_patch', 'unknown']), { execute: ['exec_command'], edit: ['apply_patch'] });
  assert.deepEqual(capabilities(['Bash', 'Read', 'Task']), { execute: ['Bash'], read: ['Read'], delegate: ['Task'] });
  assert.deepEqual(capabilities([]), {});
  assert.deepEqual(capabilities(['toString', '__proto__', 'constructor']), {});
  assert.throws(() => capabilities('Bash'), /array/);
});

test('Claude, Codex, and generic hook payloads normalize consistently', () => {
  const a = normalizeEvent({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git status' }, session_id: 'a' });
  const b = normalizeEvent({ eventName: 'preToolUse', toolName: 'exec_command', toolInput: { cmd: 'git status' }, sessionId: 'b' });
  assert.equal(a.event, b.event); assert.equal(a.command, b.command); assert.equal(a.capability, b.capability);
  assert.equal(normalizeEvent({ event: 'future-event' }).event, 'unknown');
  assert.equal(normalizeEvent({ event: 'constructor', toolName: 'toString' }).capability, 'unknown');
  assert.equal(normalizeEvent({ event: 'constructor' }).event, 'unknown');
  assert.throws(() => normalizeEvent([]), /object/);
});

test('optional hooks do not pretend to enforce or prove completion', async () => {
  const start = await handleHook({ hook_event_name: 'SessionStart' });
  assert.match(start.hookSpecificOutput.additionalContext, /host's instruction hierarchy/);
  const stop = await handleHook({ eventName: 'stop', lastAssistantMessage: 'Finished.' });
  assert.match(stop.systemMessage, /advisory does not block/);
  assert.deepEqual(await handleHook({ event: 'unknown' }), {});
});

for (const runtime of ['codex', 'claude', 'portable']) {
  test(`${runtime} build is self-contained and defaults to no hooks, MCP, or extensions`, async t => {
    const dir = await temporary(t); const destination = join(dir, runtime);
    const result = await build({ runtime, destination });
    assert.equal(result.skills, 10);
    const names = await readdir(destination);
    assert.ok(!names.includes('extensions') && !names.includes('hooks') && !names.includes('.mcp.json'));
    assert.equal((await catalog(destination)).length, 10);
    assert.equal(((await workflow('plan', { root: destination })).body.match(/# Runtime contract/g) ?? []).length, 1);
    const proc = spawnSync(process.execPath, [join(destination, 'bin/lore.mjs'), 'doctor'], { encoding: 'utf8' });
    assert.equal(proc.status, 0, proc.stderr);
    assert.equal(JSON.parse(proc.stdout).workflows, 10);
    if (runtime !== 'portable') {
      const manifest = JSON.parse(await readFile(join(destination, `.${runtime === 'codex' ? 'codex' : 'claude'}-plugin/plugin.json`), 'utf8'));
      assert.equal(manifest.version, (await metadata()).version);
    }
    if (runtime === 'codex') assert.match(await readFile(join(destination, 'skills/plan/agents/openai.yaml'), 'utf8'), /allow_implicit_invocation: false/);
  });
}

test('build refuses collisions and source overwrite without touching user files', async t => {
  const dir = await temporary(t); await writeFile(join(dir, 'user.txt'), 'preserve');
  await assert.rejects(build({ destination: dir }), /already exists/);
  assert.equal(await readFile(join(dir, 'user.txt'), 'utf8'), 'preserve');
  await assert.rejects(build({ destination: ROOT }), /outside/);
  await assert.rejects(build({ destination: join(ROOT, 'dist') }), /outside/);
  await assert.rejects(build({ destination: join(ROOT, '..output') }), /outside/);
  await assert.rejects(build({ destination: join(dir, 'new'), runtime: 'unsupported' }), /Unsupported/);
  await assert.rejects(build({ destination: join(dir, 'new'), hooks: true }), /no universal hook API/);
});

test('packaging rejects escaped skill assets and cleans failed staging', async t => {
  const dir = await temporary(t); const source = join(dir, 'source');
  await mkdir(join(source, 'skills/plan'), { recursive: true });
  await mkdir(join(source, 'commands'));
  await writeFile(join(source, 'lore.json'), JSON.stringify({ schemaVersion: 1, name: 'lore', version: '2.0.0', description: 'Test fixture', core: ['plan'] }));
  await writeFile(join(source, 'skills/plan/SKILL.md'), '---\nname: plan\ndescription: Plan work.\n---\nPlan the authorized task.\n');
  await mkdir(join(source, 'runtime'));
  await writeFile(join(source, 'runtime/contract.md'), '# Runtime contract\n');
  await writeFile(join(dir, 'outside.txt'), 'Do not package this file');
  await symlink(join(dir, 'outside.txt'), join(source, 'skills/plan/secret-link'));
  await assert.rejects(build({ root: source, destination: join(dir, 'package') }), /Symlinked assets/);
  assert.ok(!(await readdir(dir)).some(n => n.startsWith('package')));
  await symlink(source, join(dir, 'alias'), 'dir');
  await assert.rejects(build({ root: source, destination: join(dir, 'alias/output') }), /outside/);
});

test('optional hooks execute from a relocated package with spaces in its path', async t => {
  const dir = await temporary(t); const dest = join(dir, 'codex plugin');
  await build({ runtime: 'codex', destination: dest, hooks: true });
  const config = JSON.parse(await readFile(join(dest, 'hooks/hooks.json'), 'utf8'));
  const command = config.hooks.SessionStart[0].hooks[0].command;
  const proc = spawnSync(command, { shell: true, env: { ...process.env, CODEX_PLUGIN_ROOT: dest }, input: JSON.stringify({ hook_event_name: 'SessionStart' }), encoding: 'utf8' });
  assert.equal(proc.status, 0, proc.stderr);
  assert.match(JSON.parse(proc.stdout).hookSpecificOutput.additionalContext, /Runtime contract/);
});

test('read-only MCP negotiates, lists, loads, and rejects invalid calls', async () => {
  const handle = await createServer();
  const call = (method, params = {}, id = 0) => handle({ jsonrpc: '2.0', id, method, params });
  assert.equal((await call('tools/list')).error.code, -32002);
  assert.equal((await call('initialize', { protocolVersion: '2025-11-25' })).result.protocolVersion, '2025-11-25');
  const listed = (await call('tools/list')).result.tools;
  assert.equal(listed.length, 2); assert.ok(listed.every(t => t.annotations.readOnlyHint));
  assert.match((await call('tools/call', { name: 'lore_get_workflow', arguments: { name: 'execute' } })).result.content[0].text, /# Execute/);
  assert.equal((await call('tools/call', { name: 'lore_get_workflow', arguments: { name: '../config' } })).result.isError, true);
  assert.equal((await call('tools/call', { name: 'lore_get_workflow', arguments: {} })).error.code, -32602);
  assert.equal((await call('tools/call', { name: 'lore_list_workflows', arguments: { surprise: true } })).error.code, -32602);
  assert.equal((await call('run-shell')).error.code, -32601);
  assert.equal(await handle({ jsonrpc: '2.0', method: 'notifications/initialized' }), undefined);
});

test('MCP stdio round trip uses real subprocess, Unicode, parse errors, and id zero', async t => {
  const dir = await temporary(t); const dest = join(dir, 'portable');
  await build({ destination: dest, mcp: true });
  const requests = [
    '{bad json}',
    JSON.stringify({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2025-11-25', clientInfo: { name: '測試', version: '1' } } }),
    JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
    JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' }),
    JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'lore_get_workflow', arguments: { name: 'plan' } } }),
  ];
  const registration = JSON.parse(await readFile(join(dest, '.mcp.json'), 'utf8')).mcpServers['lore-catalog'];
  const proc = spawnSync(registration.command, registration.args, { input: requests.join('\n') + '\n', encoding: 'utf8', timeout: 10000 });
  assert.equal(proc.status, 0, proc.stderr);
  const replies = proc.stdout.trim().split('\n').map(JSON.parse);
  assert.equal(replies.length, 4); assert.equal(replies[0].error.code, -32700); assert.equal(replies[1].id, 0);
  assert.equal(replies[2].result.tools.length, 2); assert.match(replies[3].result.content[0].text, /# Plan/);
});

test('CLI rejects unknown flags without mutating a destination', async t => {
  const dir = await temporary(t);
  const proc = spawnSync(process.execPath, [join(ROOT, 'bin/lore.mjs'), 'build', '--out', join(dir, 'bad'), '--unknown'], { encoding: 'utf8' });
  assert.equal(proc.status, 1); assert.match(proc.stderr, /Unknown option/); assert.deepEqual(await readdir(dir), []);
});


test('removed workflow names and legacy CLI switches cannot reactivate old content', async () => {
  await assert.rejects(workflow('electrician'), /Unknown workflow/);
  for (const args of [['list', '--profile', 'full'], ['build', '--skill', 'electrician']]) {
    const proc = spawnSync(process.execPath, [join(ROOT, 'bin/lore.mjs'), ...args], { encoding: 'utf8' });
    assert.equal(proc.status, 1); assert.match(proc.stderr, /Unknown option/);
  }
  const names = await readdir(ROOT);
  for (const removed of ['commands', 'agents', 'extensions', 'legacy', 'mcp', 'lib', 'templates']) assert.ok(!names.includes(removed), removed);
});

test('malformed frontmatter cannot become a discoverable workflow', () => {
  const valid = '---\nname: plan\ndescription: "Plan: implement and verify."\n---\n# Plan\n';
  assert.equal(parseWorkflow(valid, 'plan').description, 'Plan: implement and verify.');
  for (const text of [valid.replace('name: plan', 'name: other'), valid.replace('name: plan', 'name: plan\nname: plan'), valid.replace('"Plan: implement and verify."', '"unterminated'), valid.replace('# Plan\n', ''), valid.replace('---\n#', '---garbage\n#')]) {
    assert.throws(() => parseWorkflow(text, 'plan'));
  }
});

test('manifest validates version and uniqueness before discovering files', async t => {
  const dir = await temporary(t); const manifest = await metadata();
  for (const overrides of [{ version: 'next' }, { core: ['plan', 'plan'] }, { core: [] }, { name: '../lore' }]) {
    await writeFile(join(dir, 'lore.json'), JSON.stringify({ ...manifest, ...overrides }));
    await assert.rejects(metadata(dir), /Invalid Lore manifest/);
  }
});

test('unregistered directories fail instead of silently loading extra skills', async t => {
  const dir = await temporary(t);
  await writeFile(join(dir, 'lore.json'), JSON.stringify(await metadata()));
  await mkdir(join(dir, 'skills/unexpected'), { recursive: true });
  await assert.rejects(catalog(dir), /Unregistered workflow/);
});

test('package integrity detects edits, missing files, and unexpected additions', async t => {
  const dir = await temporary(t); const destination = join(dir, 'package');
  await build({ destination });
  const verified = await verifyPackage(destination);
  assert.equal(verified.verified, true); assert.ok(verified.files > 10);
  const file = join(destination, 'skills/plan/SKILL.md'); const original = await readFile(file, 'utf8');
  await writeFile(file, original + '\nAltered content\n');
  await assert.rejects(verifyPackage(destination), /integrity mismatch/);
  await assert.rejects(catalog(destination), /integrity mismatch/);
  await writeFile(file, original);
  await writeFile(join(destination, 'unexpected.txt'), 'Not part of the build');
  await assert.rejects(verifyPackage(destination), /unexpected.txt/);
  await rm(join(destination, 'unexpected.txt'));
  await rm(file);
  await assert.rejects(verifyPackage(destination), /skills\/plan\/SKILL.md/);
});

test('concurrent builds cannot overwrite each other', async t => {
  const dir = await temporary(t); const destination = join(dir, 'shared');
  const outcomes = await Promise.allSettled([build({ destination }), build({ destination })]);
  assert.equal(outcomes.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal((await verifyPackage(destination)).verified, true);
  assert.deepEqual(await readdir(dir), ['shared']);
});

test('drift packaging includes four functional registrations without bytecode artifacts', async t => {
  const dir = await temporary(t); const destination = join(dir, 'drift package');
  await build({ destination, runtime: 'codex', hooks: true, drift: true });
  const config = JSON.parse(await readFile(join(destination, 'hooks/hooks.json'), 'utf8'));
  assert.equal(Object.values(config.hooks).flatMap(g => g.flatMap(x => x.hooks)).length, 6);
  assert.match(config.hooks.PreToolUse[0].matcher, /spawn_agent/);
  assert.ok(!(await readdir(join(destination, 'drift'))).includes('__pycache__'));
  if (process.platform !== 'win32') {
    const proc = spawnSync(config.hooks.UserPromptSubmit[0].hooks[0].command, { shell: true, env: { ...process.env, CODEX_PLUGIN_ROOT: destination, HOME: dir }, input: JSON.stringify({ session_id: 'packaged-drift', cwd: dir, prompt: 'Verify packaged drift hook execution and integrity.' }), encoding: 'utf8' });
    assert.equal(proc.status, 0, proc.stderr);
    assert.equal(proc.stderr, '');
    const projectDirs = await readdir(join(dir, '.claude/drift-state'));
    assert.ok(projectDirs.some(name => name.startsWith('lore test ')));
  }
  assert.equal((await verifyPackage(destination)).verified, true);
});
