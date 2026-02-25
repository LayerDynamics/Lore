import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function parseFrontmatterRaw(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { raw: null, fm: null, body: content, full: content };
  const fm = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx !== -1) {
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      fm[key] = val;
    }
  }
  const body = content.slice(match[0].length);
  return { raw: match[1], fm, body, full: content };
}

function buildFrontmatter(fm) {
  const lines = Object.entries(fm).map(([k, v]) => `${k}: ${v}`);
  return `---\n${lines.join('\n')}\n---`;
}

export async function repairSkill(skillName, loreRoot) {
  const mdPath = join(loreRoot, 'skills', skillName, 'SKILL.md');
  const repairs = [];

  let content;
  try {
    content = await readFile(mdPath, 'utf-8');
  } catch {
    throw new Error(`Skill "${skillName}" SKILL.md not found`);
  }

  // If completely empty, populate from template
  if (content.trim() === '') {
    const templatePath = join(loreRoot, 'templates', 'skill', 'SKILL.md');
    try {
      let template = await readFile(templatePath, 'utf-8');
      template = template.replace(/^(name:\s*).*$/m, `$1${skillName}`);
      await writeFile(mdPath, template, 'utf-8');
      repairs.push({ field: 'file', action: 'populated from template', before: '', after: template });
      return { name: skillName, repairs };
    } catch {
      // template not available, create minimal content
      const minimal = `---\nname: ${skillName}\ndescription: Use when [describe trigger]\n---\n`;
      await writeFile(mdPath, minimal, 'utf-8');
      repairs.push({ field: 'file', action: 'created minimal frontmatter', before: '', after: minimal });
      return { name: skillName, repairs };
    }
  }

  const { fm, body } = parseFrontmatterRaw(content);

  if (!fm) {
    // No frontmatter at all — prepend it
    const newFm = { name: skillName, description: 'Use when [describe trigger]' };
    const newContent = buildFrontmatter(newFm) + '\n' + content;
    await writeFile(mdPath, newContent, 'utf-8');
    repairs.push({ field: 'frontmatter', action: 'added', before: '', after: buildFrontmatter(newFm) });
    return { name: skillName, repairs };
  }

  let changed = false;

  if (!fm.name) {
    repairs.push({ field: 'name', action: 'added', before: '', after: skillName });
    fm.name = skillName;
    changed = true;
  }

  if (!fm.description) {
    const placeholder = 'Use when [describe trigger]';
    repairs.push({ field: 'description', action: 'added', before: '', after: placeholder });
    fm.description = placeholder;
    changed = true;
  }

  if (changed) {
    const newContent = buildFrontmatter(fm) + '\n' + body;
    await writeFile(mdPath, newContent, 'utf-8');
  }

  return { name: skillName, repairs };
}

export async function repairAll(loreRoot) {
  const { diagnoseAll } = await import('./skill-doctor.js');
  const diagnostics = await diagnoseAll(loreRoot);
  const results = [];
  for (const diag of diagnostics) {
    if (diag.issues.length > 0) {
      results.push(await repairSkill(diag.name, loreRoot));
    }
  }
  return results;
}
