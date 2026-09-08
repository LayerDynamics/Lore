import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

export async function inventory(root) {
  const files = {};
  async function walk(directory, prefix = '') {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = prefix + entry.name;
      if (name === 'BUILD.json') continue;
      if (entry.isSymbolicLink()) throw new Error(`Symlink in package: ${name}`);
      if (entry.isDirectory()) await walk(resolve(directory, entry.name), name + '/');
      else if (entry.isFile()) files[name] = createHash('sha256').update(await readFile(resolve(directory, entry.name))).digest('hex');
      else throw new Error(`Unsupported package entry: ${name}`);
    }
  }
  await walk(root);
  return files;
}

export async function verifyPackage(root) {
  let text;
  try { text = await readFile(resolve(root, 'BUILD.json'), 'utf8'); } catch (error) {
    if (error.code === 'ENOENT') return { kind: 'source', verified: false, reason: 'Source checkout has no build inventory.' };
    throw error;
  }
  const build = JSON.parse(text);
  if (build.schemaVersion !== 1 || !build.files || typeof build.files !== 'object' || Array.isArray(build.files) || !Object.keys(build.files).length) throw new Error('Invalid package inventory');
  const current = await inventory(root);
  const changed = [...new Set([...Object.keys(current), ...Object.keys(build.files)])].filter(name => current[name] !== build.files[name]);
  if (changed.length) throw new Error(`Package integrity mismatch: ${changed.join(', ')}`);
  return { kind: 'package', verified: true, files: Object.keys(current).length };
}
