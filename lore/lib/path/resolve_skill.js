import { resolve, join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

/**
 * Resolve a skill name to its SKILL.md path.
 * Checks `skills/<skillName>/SKILL.md` relative to loreRoot.
 */
export function resolveSkill(skillName, loreRoot) {
  const skillMd = resolve(loreRoot, 'skills', skillName, 'SKILL.md');
  if (!existsSync(skillMd)) {
    throw new Error(`Skill not found: ${skillName} (expected ${skillMd})`);
  }
  return skillMd;
}

/**
 * Resolve a skill name to its directory path.
 */
export function resolveSkillDir(skillName, loreRoot) {
  return resolve(loreRoot, 'skills', skillName);
}

/**
 * Return array of all skill directory paths.
 */
export function listSkillPaths(loreRoot) {
  const skillsDir = resolve(loreRoot, 'skills');
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => join(skillsDir, d.name));
}
