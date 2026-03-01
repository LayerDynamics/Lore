import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFrontmatter } from './parse-frontmatter.js';

export async function diagnoseSkill(skillName, loreRoot) {
  const issues = [];
  const mdPath = join(loreRoot, 'skills', skillName, 'SKILL.md');

  let content;
  try {
    content = await readFile(mdPath, 'utf-8');
  } catch {
    issues.push({ severity: 'error', message: 'Missing SKILL.md' });
    return { name: skillName, issues };
  }

  const { fm, body } = parseFrontmatter(content);

  if (fm === null) {
    issues.push({ severity: 'error', message: 'Missing or empty frontmatter' });
  } else {
    if (Object.keys(fm).length === 0) {
      issues.push({ severity: 'error', message: 'Missing or empty frontmatter' });
    }
    if (!fm.name) {
      issues.push({ severity: 'error', message: 'Missing `name` field in frontmatter' });
    }
    if (!fm.description) {
      issues.push({ severity: 'error', message: 'Missing `description` field in frontmatter' });
    } else if (!fm.description.startsWith('Use when')) {
      issues.push({ severity: 'warning', message: 'Description doesn\'t start with "Use when"' });
    }
  }

  if (!body || body.trim() === '') {
    issues.push({ severity: 'error', message: 'Empty body (no content after frontmatter)' });
  }

  return { name: skillName, issues };
}

export async function diagnoseAll(loreRoot) {
  const skillsDir = join(loreRoot, 'skills');
  let entries;
  try {
    entries = await readdir(skillsDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const results = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    results.push(await diagnoseSkill(entry.name, loreRoot));
  }
  return results;
}

export async function isHealthy(skillName, loreRoot) {
  const result = await diagnoseSkill(skillName, loreRoot);
  return result.issues.every((i) => i.severity !== 'error');
}
