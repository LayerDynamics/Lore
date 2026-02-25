import { rm, access, mkdir, readdir, copyFile } from 'node:fs/promises';
import { join } from 'node:path';

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

export async function uninstallSkill(skillName, loreRoot) {
  const skillDir = join(loreRoot, 'skills', skillName);
  try {
    await access(skillDir);
  } catch {
    throw new Error(`Skill "${skillName}" does not exist`);
  }
  await rm(skillDir, { recursive: true, force: true });
  return { name: skillName, removed: true };
}

export async function backupSkill(skillName, loreRoot, backupDir) {
  const skillDir = join(loreRoot, 'skills', skillName);
  try {
    await access(skillDir);
  } catch {
    throw new Error(`Skill "${skillName}" does not exist`);
  }
  const dest = join(backupDir, skillName);
  await copyDir(skillDir, dest);
  return { name: skillName, backupPath: dest };
}
