#!/usr/bin/env node
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { build } from '../runtime/build.mjs';
import { catalog, metadata, workflow, ROOT } from '../runtime/catalog.mjs';
import { capabilities } from '../runtime/capabilities.mjs';
import { verifyPackage } from '../runtime/integrity.mjs';
import { serve } from '../runtime/mcp.mjs';

const help = `Lore — provider-neutral engineering workflows

  lore list
  lore show NAME
  lore build --runtime codex|claude|portable --out DIRECTORY [--hooks] [--mcp] [--drift]
  lore doctor [--tools JSON_FILE]
  lore mcp

Builds are offline and refuse to overwrite an existing destination. The catalog contains ten workflows. Hooks and MCP are independently
opt-in. No command changes a user's agent configuration, clones dependencies,
starts extensions, or selects a model. Use the host's native plugin installer
on a built package, or register its skills directory with an Agent Skills host.
`;

async function main(argv) {
  const command = argv.shift() ?? 'help';
  if (['help', '--help', '-h'].includes(command)) { process.stdout.write(help); return; }
  const options = {};
  const positional = [];
  while (argv.length) {
    const arg = argv.shift();
    if (['--hooks', '--mcp', '--drift'].includes(arg)) options[arg.slice(2)] = true;
    else if (['--runtime', '--out', '--tools'].includes(arg)) {
      const value = argv.shift();
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      options[{ '--out': 'destination', '--tools': 'tools' }[arg] ?? arg.slice(2)] = value;
    } else if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
    else positional.push(arg);
  }
  if (command !== 'show' && positional.length) throw new Error(`Unexpected argument: ${positional[0]}`);
  const allowed = { build: ['runtime', 'destination', 'hooks', 'mcp', 'drift'], list: [], show: [], doctor: ['tools'], mcp: [] }[command];
  if (allowed) for (const key of Object.keys(options)) {
    if (!allowed.includes(key)) throw new Error(`Option ${key} is not supported by ${command}`);
  }
  let result;
  if (command === 'build') result = await build(options);
  else if (command === 'list') result = await catalog();
  else if (command === 'show') {
    if (positional.length !== 1) throw new Error('show requires one workflow name');
    process.stdout.write((await workflow(positional[0])).body); return;
  } else if (command === 'doctor') {
    const entries = await catalog();
    const meta = await metadata();
    const detected = options.tools ? capabilities(JSON.parse(await readFile(resolve(options.tools), 'utf8'))) : {};
    result = { root: ROOT, version: meta.version, node: process.versions.node, workflows: entries.length, integrity: await verifyPackage(ROOT), capabilities: detected, capabilitySource: options.tools ? resolve(options.tools) : 'No tool inventory supplied; no capabilities assumed.' };
  } else if (command === 'mcp') { await serve(options); return; }
  else throw new Error(`Unknown command: ${command}`);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
}
main(process.argv.slice(2)).catch(error => { process.stderr.write(`Lore: ${error.message}\n`); process.exitCode = 1; });
