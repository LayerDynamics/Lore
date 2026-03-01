import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { parseFrontmatter as _parseFrontmatter } from './parse-frontmatter.js';

function parseFrontmatter(content) {
  const { fm, body } = _parseFrontmatter(content);
  return { fm: fm || {}, body };
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
