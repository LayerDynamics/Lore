import { readFileSync, existsSync } from 'node:fs';

export function readFile(filePath) {
  return readFileSync(filePath, 'utf-8');
}

export function readJSON(filePath) {
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

export function readFrontmatter(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx !== -1) {
      const key = line.slice(0, idx).trim();
      let value = line.slice(idx + 1).trim();
      if (value === 'true') value = true;
      else if (value === 'false') value = false;
      else if (value !== '' && !isNaN(value)) value = Number(value);
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body: match[2] };
}

export function exists(filePath) {
  return existsSync(filePath);
}
