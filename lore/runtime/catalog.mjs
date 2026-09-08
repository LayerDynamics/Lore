import { readFile, readdir, realpath } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyPackage } from './integrity.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const validName = name => typeof name === 'string' && name.length <= 64 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name);
const VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export async function metadata(root = ROOT) {
  const value = JSON.parse(await readFile(resolve(root, 'lore.json'), 'utf8'));
  if (value.schemaVersion !== 1 || value.name !== 'lore' || typeof value.version !== 'string' || !VERSION.test(value.version)
      || typeof value.description !== 'string' || !value.description.trim()
      || !Array.isArray(value.core) || !value.core.length || value.core.some(n => !validName(n))
      || new Set(value.core).size !== value.core.length) throw new Error('Invalid Lore manifest');
  return value;
}

// Lore maintains two scalar frontmatter fields. Fail explicitly on malformed
// syntax rather than silently turning invalid YAML into a discoverable skill.
export function parseWorkflow(text, expectedName) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) throw new Error(`Missing frontmatter: ${expectedName}`);
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const field = line.match(/^(name|description):\s*(.+)$/);
    if (!field || Object.hasOwn(fields, field[1])) throw new Error(`Invalid or duplicate frontmatter field: ${expectedName}`);
    let value = field[2].trim();
    if (value.startsWith('"')) {
      try { value = JSON.parse(value); } catch { throw new Error(`Invalid quoted frontmatter: ${expectedName}`); }
    } else if (value.startsWith("'")) {
      if (!/^'(?:[^']|'')*'$/.test(value)) throw new Error(`Invalid quoted frontmatter: ${expectedName}`);
      value = value.slice(1, -1).replaceAll("''", "'");
    } else if (/[:#\[\]{}>|&*!]/.test(value)) throw new Error(`Quote special characters in frontmatter: ${expectedName}`);
    if (typeof value !== 'string') throw new Error(`Frontmatter must contain strings: ${expectedName}`);
    fields[field[1]] = value;
  }
  if (fields.name !== expectedName || !validName(fields.name)) throw new Error(`Skill name does not match directory: ${expectedName}`);
  if (!fields.description?.trim() || fields.description.length > 1024) throw new Error(`Invalid description: ${expectedName}`);
  const body = match[2].trimStart();
  if (!body.trim()) throw new Error(`Empty workflow: ${expectedName}`);
  return { ...fields, body };
}

export async function contained(root, path) {
  const base = await realpath(root);
  const target = await realpath(resolve(base, path));
  const rel = relative(base, target);
  if (rel === '..' || rel.startsWith('../') || rel.startsWith('..\\') || isAbsolute(rel)) throw new Error(`Path escapes package: ${path}`);
  return target;
}

export async function catalog(root = ROOT) {
  await verifyPackage(root);
  const manifest = await metadata(root);
  const directories = await readdir(resolve(root, 'skills'), { withFileTypes: true });
  for (const entry of directories) {
    if (entry.isSymbolicLink()) throw new Error(`Symlinked skill directory: ${entry.name}`);
    if (entry.isDirectory() && !manifest.core.includes(entry.name)) throw new Error(`Unregistered workflow directory: ${entry.name}`);
  }
  const entries = [];
  for (const name of manifest.core) {
    const source = `skills/${name}/SKILL.md`;
    const text = await readFile(await contained(root, source), 'utf8');
    const parsed = parseWorkflow(text, name);
    entries.push({ name, description: parsed.description, source });
  }
  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

export async function workflow(name, { root = ROOT } = {}) {
  if (!validName(name)) throw new Error(`Invalid workflow name: ${name}`);
  const entry = (await catalog(root)).find(s => s.name === name);
  if (!entry) throw new Error(`Unknown workflow: ${name}`);
  const text = await readFile(await contained(root, entry.source), 'utf8');
  const contract = await readFile(resolve(root, 'runtime/contract.md'), 'utf8');
  const { body } = parseWorkflow(text, name);
  return { ...entry, body: body.startsWith(contract) ? body : `${contract}\n${body}` };
}
