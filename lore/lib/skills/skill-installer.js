import { readFile, mkdir, copyFile, readdir } from 'node:fs/promises';
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

async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

export async function installSkill(source, loreRoot) {
  const mdPath = join(source, 'SKILL.md');
  const content = await readFile(mdPath, 'utf-8');
  const fm = parseFrontmatter(content);
  const name = fm.name || source.split('/').filter(Boolean).pop();
  const targetDir = join(loreRoot, 'skills', name);
  await copyDir(source, targetDir);
  return { name, path: targetDir, installed: true };
}

export async function installSkillFromTemplate(skillName, loreRoot, templatePath) {
  const targetDir = join(loreRoot, 'skills', skillName);
  await mkdir(targetDir, { recursive: true });
  const content = await readFile(templatePath, 'utf-8');
  const updated = content.replace(/^(---\r?\n[\s\S]*?)name:\s*.*$/m, `$1name: ${skillName}`);
  const { writeFile } = await import('node:fs/promises');
  await writeFile(join(targetDir, 'SKILL.md'), updated, 'utf-8');
  return { name: skillName, path: targetDir };
}
