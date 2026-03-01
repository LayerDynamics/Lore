import { rm, access } from 'node:fs/promises';
import { join } from 'node:path';
import { validateSkillName } from './validate-skill-name.js';
import { copyDirAsync } from '../mkdir/rn-dir.js';

export async function uninstallSkill(skillName, loreRoot, hooks = {}) {
  validateSkillName(skillName);
  const skillDir = join(loreRoot, 'skills', skillName);
  try {
    await access(skillDir);
  } catch {
    throw new Error(`Skill "${skillName}" does not exist`);
  }

  // Pre-uninstall hook
  if (hooks.preUninstall) {
    await hooks.preUninstall({ name: skillName, path: skillDir });
  }

  await rm(skillDir, { recursive: true, force: true });

  const result = { name: skillName, removed: true };

  // Post-uninstall hook
  if (hooks.postUninstall) {
    await hooks.postUninstall(result);
  }

  return result;
}

export async function backupSkill(skillName, loreRoot, backupDir) {
  validateSkillName(skillName);
  const skillDir = join(loreRoot, 'skills', skillName);
  try {
    await access(skillDir);
  } catch {
    throw new Error(`Skill "${skillName}" does not exist`);
  }
  const dest = join(backupDir, skillName);
  await copyDirAsync(skillDir, dest);
  return { name: skillName, backupPath: dest };
}
