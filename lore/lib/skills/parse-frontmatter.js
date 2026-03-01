/**
 * Canonical frontmatter parser for SKILL.md files.
 *
 * @param {string} content - Full file content
 * @returns {{ raw: string|null, fm: Record<string,string>|null, body: string }}
 *   - raw:  the raw YAML text between the --- fences (null if no frontmatter)
 *   - fm:   parsed key-value object (null if no frontmatter block found)
 *   - body: everything after the closing --- fence
 */
export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { raw: null, fm: null, body: content };
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
  return { raw: match[1], fm, body };
}
