import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { fm: {}, body: content };
  const fm = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx !== -1) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      fm[key] = val;
    }
  }
  const body = content.slice(match[0].length).replace(/^\r?\n/, '');
  return { fm, body };
}

function extractSections(body) {
  const sections = [];
  const lines = body.split('\n');
  let current = null;
  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      if (current) sections.push(current);
      current = { heading: headingMatch[2], content: '' };
    } else if (current) {
      current.content += (current.content ? '\n' : '') + line;
    }
  }
  if (current) sections.push(current);
  for (const s of sections) {
    s.content = s.content.trim();
  }
  return sections;
}

export async function skillInfo(skillName, loreRoot) {
  const skillDir = join(loreRoot, 'skills', skillName);
  const mdPath = join(skillDir, 'SKILL.md');
  const content = await readFile(mdPath, 'utf-8');
  const { fm, body } = parseFrontmatter(content);
  return {
    name: fm.name || skillName,
    description: fm.description || '',
    path: skillDir,
    body,
    sections: extractSections(body),
  };
}

export async function skillExists(skillName, loreRoot) {
  const mdPath = join(loreRoot, 'skills', skillName, 'SKILL.md');
  try {
    await access(mdPath);
    return true;
  } catch {
    return false;
  }
}
