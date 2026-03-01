import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { validateSkillName } from './validate-skill-name.js';
import { copyDirAsync } from '../mkdir/rn-dir.js';
import { parseFrontmatter as _parseFrontmatter } from './parse-frontmatter.js';

function parseFrontmatter(content) {
  const { fm } = _parseFrontmatter(content);
  return fm || {};
}

export async function installSkill(source, loreRoot, hooks = {}) {
  const mdPath = join(source, 'SKILL.md');
  const content = await readFile(mdPath, 'utf-8');
  const fm = parseFrontmatter(content);
  const name = fm.name || source.split('/').filter(Boolean).pop();
  validateSkillName(name);
  const targetDir = join(loreRoot, 'skills', name);

  // Pre-install hook
  if (hooks.preInstall) {
    await hooks.preInstall({ name, source, targetDir });
  }

  await copyDirAsync(source, targetDir);

  const result = { name, path: targetDir, installed: true };

  // Post-install hook
  if (hooks.postInstall) {
    await hooks.postInstall(result);
  }

  return result;
}

export async function installSkillFromTemplate(skillName, loreRoot, templatePath, hooks = {}) {
  validateSkillName(skillName);
  const targetDir = join(loreRoot, 'skills', skillName);

  // Pre-install hook
  if (hooks.preInstall) {
    await hooks.preInstall({ name: skillName, source: templatePath, targetDir });
  }

  await mkdir(targetDir, { recursive: true });
  const content = await readFile(templatePath, 'utf-8');
  const updated = content.replace(/^(---\r?\n[\s\S]*?)name:\s*.*$/m, `$1name: ${skillName}`);
  const { writeFile } = await import('node:fs/promises');
  await writeFile(join(targetDir, 'SKILL.md'), updated, 'utf-8');

  const result = { name: skillName, path: targetDir };

  // Post-install hook
  if (hooks.postInstall) {
    await hooks.postInstall(result);
  }

  return result;
}
