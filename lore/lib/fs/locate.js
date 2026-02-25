import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

function globToRegex(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/\{\{GLOBSTAR\}\}/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function walkDir(dir, base) {
  const results = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    const rel = relative(base, full);
    if (entry.isDirectory()) {
      results.push(...walkDir(full, base));
    } else {
      results.push(rel);
    }
  }
  return results;
}

export function locate(baseDir, pattern) {
  const regex = globToRegex(pattern);
  const files = walkDir(baseDir, baseDir);
  return files.filter(f => regex.test(f)).map(f => join(baseDir, f));
}

export function locateFirst(baseDir, patterns) {
  for (const pattern of patterns) {
    const matches = locate(baseDir, pattern);
    if (matches.length > 0) return matches[0];
  }
  return null;
}
