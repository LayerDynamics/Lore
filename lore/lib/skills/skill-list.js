import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const fm = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx !== -1) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      fm[key] = val;
    }
  }
  return fm;
}

export async function listSkills(loreRoot) {
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
    const mdPath = join(skillsDir, entry.name, 'SKILL.md');
    try {
      const content = await readFile(mdPath, 'utf-8');
      const fm = parseFrontmatter(content);
      results.push({
        name: fm.name || entry.name,
        description: fm.description || '',
        path: join(skillsDir, entry.name),
      });
    } catch {
      // skip directories without SKILL.md
    }
  }
  return results;
}

export async function listSkillNames(loreRoot) {
  const skills = await listSkills(loreRoot);
  return skills.map((s) => s.name);
}

export function formatSkillTable(skills) {
  const lines = ['| Name | Description |', '| --- | --- |'];
  for (const s of skills) {
    lines.push(`| ${s.name} | ${s.description} |`);
  }
  return lines.join('\n');
}
