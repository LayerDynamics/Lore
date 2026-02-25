import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export function tree(dir, options = {}) {
  const { maxDepth = Infinity, filter, includeDirectories = false } = options;
  const results = [];

// sourcery skip: avoid-function-declarations-in-blocks
  function walk(current, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
              if (includeDirectories) {
                if (!filter || filter(full)) results.push(full);
              }
              walk(full, depth + 1);
            }
      else if (!filter || filter(full)) results.push(full);
    }
  }

  walk(dir, 1);
  return results;
}

export function printTree(dir, options = {}) {
  const { maxDepth = Infinity } = options;
  const lines = [dir];

  function walk(current, prefix, depth) {
    if (depth > maxDepth) return;
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    entries.sort((a, b) => a.name.localeCompare(b.name));
    entries.forEach((entry, i) => {
      const isLast = i === entries.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      lines.push(`${prefix}${connector}${entry.name}`);
      if (entry.isDirectory()) {
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        walk(join(current, entry.name), newPrefix, depth + 1);
      }
    });
  }

  walk(dir, '', 1);
  return lines.join('\n');
}
