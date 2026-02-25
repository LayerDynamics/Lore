import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

export function findConfigs(startDir, patterns = ['.claude/settings.json', 'plugin.json', '.mcp.json']) {
  const results = [];
  let current = startDir;

  while (true) {
    for (const pattern of patterns) {
      const fullPath = join(current, pattern);
      if (existsSync(fullPath)) {
        const type = pattern.split('/').pop().replace(/\./g, '_').replace(/_json$/, '');
        results.push({ path: fullPath, type });
      }
    }
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return results;
}
