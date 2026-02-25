import { resolve, join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

/**
 * Resolve a skill name to its SKILL.md path.
 * Checks `lore/skills/<skillName>/SKILL.md`.
 */
export function resolveSkill(skillName, loreRoot) {
  const skillMd = resolve(loreRoot, 'lore', 'skills', skillName, 'SKILL.md');
  if (!existsSync(skillMd)) {
    throw new Error(`Skill not found: ${skillName} (expected ${skillMd})`);
  }
  return skillMd;
}

/**
 * Resolve a skill name to its directory path.
 */
export function resolveSkillDir(skillName, loreRoot) {
  return resolve(loreRoot, 'lore', 'skills', skillName);
}

/**
 * Return array of all skill directory paths.
 */
export function listSkillPaths(loreRoot) {
  const skillsDir = resolve(loreRoot, 'lore', 'skills');
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => join(skillsDir, d.name));
}
