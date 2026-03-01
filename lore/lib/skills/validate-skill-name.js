/**
 * Validates a skill name to prevent path traversal attacks.
 * Rejects names containing path separators or ".." segments.
 */
export function validateSkillName(skillName) {
  if (!skillName || typeof skillName !== 'string') {
    throw new Error('Skill name must be a non-empty string');
  }
  if (/[/\\]/.test(skillName) || skillName === '..' || skillName === '.' || skillName.includes('..')) {
    throw new Error(`Invalid skill name "${skillName}": must not contain path separators or ".." segments`);
  }
}
