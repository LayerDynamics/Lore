import { resolve, join } from 'node:path';
import { existsSync, readdirSync } from 'node:fs';

/**
 * Resolve a tool/command name to its .md file path.
 * Searches across all namespaces in `lore/commands/`.
 */
export function resolveTool(toolName, loreRoot) {
  const commandsDir = resolve(loreRoot, 'lore', 'commands');
  if (!existsSync(commandsDir)) {
    throw new Error(`Commands directory not found: ${commandsDir}`);
  }
  const namespaces = readdirSync(commandsDir, { withFileTypes: true })
    .filter(d => d.isDirectory());
  for (const ns of namespaces) {
    const candidate = join(commandsDir, ns.name, `${toolName}.md`);
    if (existsSync(candidate)) return candidate;
  }
  // Also check directly in commands/
  const direct = join(commandsDir, `${toolName}.md`);
  if (existsSync(direct)) return direct;
  throw new Error(`Tool not found: ${toolName}`);
}

/**
 * Resolve agent name to its .md file path in `lore/agents/`.
 */
export function resolveAgent(agentName, loreRoot) {
  const agentMd = resolve(loreRoot, 'lore', 'agents', `${agentName}.md`);
  if (!existsSync(agentMd)) {
    throw new Error(`Agent not found: ${agentName} (expected ${agentMd})`);
  }
  return agentMd;
}

/**
 * Return array of all command file paths.
 */
export function listToolPaths(loreRoot) {
  const commandsDir = resolve(loreRoot, 'lore', 'commands');
  if (!existsSync(commandsDir)) return [];
  const results = [];
  const entries = readdirSync(commandsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nsDir = join(commandsDir, entry.name);
      const files = readdirSync(nsDir, { withFileTypes: true });
      for (const f of files) {
        if (f.isFile() && f.name.endsWith('.md')) {
          results.push(join(nsDir, f.name));
        }
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(join(commandsDir, entry.name));
    }
  }
  return results;
}

/**
 * Return array of all agent file paths.
 */
export function listAgentPaths(loreRoot) {
  const agentsDir = resolve(loreRoot, 'lore', 'agents');
  if (!existsSync(agentsDir)) return [];
  return readdirSync(agentsDir, { withFileTypes: true })
    .filter(f => f.isFile() && f.name.endsWith('.md'))
    .map(f => join(agentsDir, f.name));
}
