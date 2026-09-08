import { cp, mkdir, writeFile, rename, rm, lstat, realpath, readdir, mkdtemp, rmdir } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { inventory } from './integrity.mjs';
import { ROOT, metadata, catalog, workflow, contained } from './catalog.mjs';

const json = value => JSON.stringify(value, null, 2) + '\n';
async function exists(path) {
  try { await lstat(path); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; }
}
async function put(root, path, value) {
  const dest = resolve(root, path);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, value);
}

async function checkAssets(root, dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlinked assets must be materialized before packaging: ${path}`);
    await contained(root, path);
    if (entry.isDirectory()) await checkAssets(root, path);
  }
}

export async function build({ root = ROOT, destination, runtime = 'portable', hooks = false, mcp = false, drift = false } = {}) {
  if (!destination) throw new Error('An explicit destination is required');
  if (!['portable', 'codex', 'claude'].includes(runtime)) throw new Error(`Unsupported runtime: ${runtime}`);
  if ((hooks || drift) && runtime === 'portable') throw new Error('Portable hosts have no universal hook API; select codex or claude');
  const target = resolve(destination);
  const source = await realpath(root);
  let ancestor = dirname(target);
  while (!await exists(ancestor)) ancestor = dirname(ancestor);
  const physicalTarget = resolve(await realpath(ancestor), relative(ancestor, target));
  const rel = relative(source, physicalTarget);
  const escapes = rel === '..' || rel.startsWith('../') || rel.startsWith('..\\') || isAbsolute(rel);
  if (!escapes) throw new Error('Destination must be outside the source plugin');
  if (await exists(target)) throw new Error(`Destination already exists; build a new versioned directory: ${target}`);
  const selected = await catalog(root);
  const meta = await metadata(root);
  await mkdir(dirname(target), { recursive: true });
  const stage = await mkdtemp(`${target}.staging-`);
  let reserved = false;
  try {
    for (const entry of selected) {
      const content = await workflow(entry.name, { root });
      if (entry.source.startsWith('skills/')) {
        // Copy scripts, references, and assets with the skill; never export a
        // dangling symlink that points into a developer's checkout.
        const sourceSkill = await contained(root, `skills/${entry.name}`);
        await checkAssets(root, sourceSkill);
        await cp(sourceSkill, resolve(stage, 'skills', entry.name), { recursive: true });
      }
      const header = `---\nname: ${entry.name}\ndescription: ${JSON.stringify(entry.description)}\n---\n\n`;
      await put(stage, `skills/${entry.name}/SKILL.md`, header + content.body);
      if (runtime === 'codex') await put(stage, `skills/${entry.name}/agents/openai.yaml`, 'policy:\n  allow_implicit_invocation: false\n');
    }
    await cp(resolve(root, 'runtime'), resolve(stage, 'runtime'), { recursive: true });
    await mkdir(resolve(stage, 'bin'));
    await cp(resolve(root, 'bin/lore.mjs'), resolve(stage, 'bin/lore.mjs'));
    await put(stage, 'lore.json', json(meta));
    await put(stage, 'package.json', json({ name: 'lore-framework', version: meta.version, type: 'module', engines: { node: '>=22' }, bin: { lore: './bin/lore.mjs' } }));
    const plugin = { name: 'lore', version: meta.version, description: meta.description, author: { name: 'LayerDynamics' } };
    if (runtime === 'codex') {
      await put(stage, '.codex-plugin/plugin.json', json({ ...plugin, skills: './skills/' }));
      await put(stage, '.agents/plugins/marketplace.json', json({ name: 'lore-core', interface: { displayName: 'Lore Core' }, plugins: [{ name: 'lore', source: { source: 'local', path: './' }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' } }] }));
    }
    if (runtime === 'claude') {
      await put(stage, '.claude-plugin/plugin.json', json(plugin));
      await put(stage, '.claude-plugin/marketplace.json', json({ name: 'lore-core', owner: { name: 'LayerDynamics' }, metadata: { description: meta.description }, plugins: [{ name: 'lore', source: './', description: meta.description }] }));
    }
    if (hooks) {
      const command = 'node -e "const p=process.env.CODEX_PLUGIN_ROOT||process.env.CLAUDE_PLUGIN_ROOT||process.env.PLUGIN_ROOT;if(!p)throw Error(\'Missing plugin root\');import(require(\'node:url\').pathToFileURL(require(\'node:path\').join(p,\'runtime/hook.mjs\')).href).then(async m=>{let s=\'\';for await(const c of process.stdin){s+=c;if(Buffer.byteLength(s)>1048576)throw Error(\'Hook input too large\')}process.stdout.write(JSON.stringify(await m.handleHook(JSON.parse(s)))+\'\\n\')}).catch(e=>{process.stderr.write(e.message+\'\\n\')})"';
      await put(stage, 'hooks/hooks.json', json({ hooks: { SessionStart: [{ hooks: [{ type: 'command', command, timeout: 5 }] }], Stop: [{ hooks: [{ type: 'command', command, timeout: 5 }] }] } }));
    }
    if (drift) {
      await cp(resolve(root, 'drift'), resolve(stage, 'drift'), {
        recursive: true,
        filter: source => !source.split(/[\\/]/).some(part => ['tests', '__pycache__'].includes(part)),
      });
      const config = hooks ? JSON.parse(await (await import('node:fs/promises')).readFile(resolve(stage, 'hooks/hooks.json'), 'utf8')) : { hooks: {} };
      for (const [event, script] of Object.entries({ UserPromptSubmit: 'drift-anchor-capture.sh', PostToolUse: 'drift-check-periodic.sh', PreToolUse: 'drift-subagent-inject.sh', Stop: 'drift-check-final.sh' })) {
        const code = `const p=process.env.CODEX_PLUGIN_ROOT||process.env.CLAUDE_PLUGIN_ROOT||process.env.PLUGIN_ROOT;if(!p)throw Error('Missing plugin root');const r=require('node:child_process').spawnSync('bash',[require('node:path').join(p,'drift','${script}')],{stdio:'inherit'});if(r.error)throw r.error;process.exit(r.status??1)`;
        const group = { hooks: [{ type: 'command', command: 'node -e "' + code + '"', timeout: 5 }] };
        if (event === 'PreToolUse') group.matcher = 'Task|Agent|spawn_agent|.*[.]spawn_agent';
        (config.hooks[event] ??= []).push(group);
      }
      await put(stage, 'hooks/hooks.json', json(config));
    }
    if (mcp) {
      // The process starts a real read-only catalog server, never a tool runner.
      const args = runtime === 'portable' ? [resolve(target, 'runtime/mcp.mjs')] : ['-e', "const p=process.env.CODEX_PLUGIN_ROOT||process.env.CLAUDE_PLUGIN_ROOT||process.env.PLUGIN_ROOT;if(!p)throw Error('Missing plugin root');import(require('node:url').pathToFileURL(require('node:path').join(p,'runtime/mcp.mjs')).href).then(m=>m.serve())"];
      await put(stage, '.mcp.json', json({ mcpServers: { 'lore-catalog': { command: 'node', args } } }));
      if (runtime === 'codex') await put(stage, '.codex-plugin/plugin.json', json({ ...plugin, skills: './skills/', mcpServers: './.mcp.json' }));
    }
    await catalog(stage);
    await put(stage, 'BUILD.json', json({ schemaVersion: 1, runtime, version: meta.version, hooks, mcp, drift, skills: selected.map(s => s.name), files: await inventory(stage) }));
    // Reserve without replacing a path created by a concurrent builder.
    await mkdir(target);
    reserved = true;
    // Windows cannot rename a directory over an existing empty directory.
    // Keep the exclusive reservation and move validated entries into it;
    // publish the inventory last so it never describes a partial transfer.
    if (process.platform === 'win32') {
      const names = (await readdir(stage)).filter(name => name !== 'BUILD.json');
      for (const name of [...names, 'BUILD.json']) await rename(resolve(stage, name), resolve(target, name));
      await rmdir(stage);
    } else {
      await rename(stage, target);
    }
    reserved = false;
    return { destination: target, runtime, skills: selected.length, hooks, mcp, drift };
  } catch (error) {
    if (reserved) {
      try { await rmdir(target); } catch (cleanupError) {
        if (!['ENOTEMPTY', 'EEXIST', 'ENOENT'].includes(cleanupError.code)) error.message += `; cleanup: ${cleanupError.message}`;
      }
    }
    await rm(stage, { recursive: true, force: true });
    throw error;
  }
}
