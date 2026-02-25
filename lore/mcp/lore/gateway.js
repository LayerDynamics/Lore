#!/usr/bin/env node

/**
 * Lore Gateway MCP Server
 *
 * Exposes lore lib/ utilities as MCP tools over stdio JSON-RPC 2.0.
 * Zero dependencies — pure Node.js.
 */

// Redirect console.log/warn/error to stderr so stdout stays clean for MCP protocol
const stderrWrite = (...args) => process.stderr.write(args.join(' ') + '\n');
console.log = stderrWrite;
console.warn = stderrWrite;
console.error = stderrWrite;

import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Resolve lore root ──────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const LORE_ROOT = resolve(__dirname, '..', '..');
// REPO_ROOT is one level above LORE_ROOT — used by resolve_tool.js/resolve_skill.js
// which prepend 'lore/' internally
const REPO_ROOT = resolve(LORE_ROOT, '..');

// ── Lib imports ────────────────────────────────────────────────────
import { listSkills, listSkillNames, formatSkillTable } from '../../lib/skills/skill-list.js';
import { skillInfo, skillExists } from '../../lib/skills/skill-info.js';
import { diagnoseSkill, diagnoseAll, isHealthy } from '../../lib/skills/skill-doctor.js';
import { repairSkill, repairAll } from '../../lib/skills/skill-repair.js';
import { installSkill, installSkillFromTemplate } from '../../lib/skills/skill-installer.js';
import { uninstallSkill, backupSkill } from '../../lib/skills/skill-uninstaller.js';
import { register, unregister, get, list, listAll, clear } from '../../lib/regestry.js';
import { tree, printTree } from '../../lib/fs/tree.js';
import { locate, locateFirst } from '../../lib/fs/locate.js';
import { findConfigs } from '../../lib/fs/find_configs.js';
import { readFile, readJSON, readFrontmatter, exists } from '../../lib/fs/read.js';
import { writeFile, writeJSON, appendFile } from '../../lib/fs/write.js';
import { resolvePath, loreRoot, pluginRoot } from '../../lib/path/resolve_path.js';
import { resolveSkill, resolveSkillDir, listSkillPaths } from '../../lib/path/resolve_skill.js';
import { resolveTool, resolveAgent, listToolPaths, listAgentPaths } from '../../lib/path/resolve_tool.js';
import { runTool, runToolAsync, runScript } from '../../lib/run/run_tool.js';
import { runMcpServer, stopMcpServer, testMcpServer } from '../../lib/run/run_mcp.js';
import { info, success, warn, error as echoError } from '../../lib/io/echo.js';

// ── Managed server processes ───────────────────────────────────────
const managedServers = new Map();

// ── Tool definitions ───────────────────────────────────────────────

const TOOLS = {
  // ── Skills ─────────────────────────────────────────────────────
  lore_list_skills: {
    description: 'List all skills with name, description, and path',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      const skills = await listSkills(LORE_ROOT);
      return formatSkillTable(skills);
    },
  },
  lore_skill_info: {
    description: 'Get detailed info about a specific skill',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Skill name' } },
      required: ['name'],
    },
    handler: async ({ name }) => {
      const info = await skillInfo(name, LORE_ROOT);
      return JSON.stringify(info, null, 2);
    },
  },
  lore_skill_exists: {
    description: 'Check if a skill exists',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Skill name' } },
      required: ['name'],
    },
    handler: async ({ name }) => {
      const result = await skillExists(name, LORE_ROOT);
      return JSON.stringify({ name, exists: result });
    },
  },
  lore_diagnose_skill: {
    description: 'Diagnose issues in a specific skill',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Skill name' } },
      required: ['name'],
    },
    handler: async ({ name }) => {
      const result = await diagnoseSkill(name, LORE_ROOT);
      return JSON.stringify(result, null, 2);
    },
  },
  lore_diagnose_all: {
    description: 'Diagnose all skills for issues',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      const results = await diagnoseAll(LORE_ROOT);
      return JSON.stringify(results, null, 2);
    },
  },
  lore_repair_skill: {
    description: 'Auto-repair a skill with missing frontmatter or fields',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Skill name' } },
      required: ['name'],
    },
    handler: async ({ name }) => {
      const result = await repairSkill(name, LORE_ROOT);
      return JSON.stringify(result, null, 2);
    },
  },
  lore_repair_all: {
    description: 'Auto-repair all skills with issues',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      const results = await repairAll(LORE_ROOT);
      return JSON.stringify(results, null, 2);
    },
  },
  lore_install_skill: {
    description: 'Install a skill from a source directory into the lore skills folder',
    inputSchema: {
      type: 'object',
      properties: { source: { type: 'string', description: 'Path to skill source directory' } },
      required: ['source'],
    },
    handler: async ({ source }) => {
      const result = await installSkill(source, LORE_ROOT);
      return JSON.stringify(result, null, 2);
    },
  },
  lore_uninstall_skill: {
    description: 'Remove a skill from the lore skills folder',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Skill name' } },
      required: ['name'],
    },
    handler: async ({ name }) => {
      const result = await uninstallSkill(name, LORE_ROOT);
      return JSON.stringify(result, null, 2);
    },
  },
  lore_backup_skill: {
    description: 'Backup a skill to a directory before modifying or removing it',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Skill name' },
        backupDir: { type: 'string', description: 'Directory to store the backup' },
      },
      required: ['name', 'backupDir'],
    },
    handler: async ({ name, backupDir }) => {
      const result = await backupSkill(name, LORE_ROOT, backupDir);
      return JSON.stringify(result, null, 2);
    },
  },
  lore_install_skill_from_template: {
    description: 'Create a new skill from the lore skill template',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'New skill name' },
        templatePath: { type: 'string', description: 'Path to SKILL.md template' },
      },
      required: ['name'],
    },
    handler: async ({ name, templatePath }) => {
      const tmpl = templatePath || resolve(LORE_ROOT, 'templates', 'skill', 'SKILL.md');
      const result = await installSkillFromTemplate(name, LORE_ROOT, tmpl);
      return JSON.stringify(result, null, 2);
    },
  },
  lore_skill_names: {
    description: 'List just the names of all installed skills',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      const names = await listSkillNames(LORE_ROOT);
      return JSON.stringify(names, null, 2);
    },
  },
  lore_skill_healthy: {
    description: 'Check if a skill has no errors (is healthy)',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Skill name' } },
      required: ['name'],
    },
    handler: async ({ name }) => {
      const healthy = await isHealthy(name, LORE_ROOT);
      return JSON.stringify({ name, healthy });
    },
  },

  // ── Commands & Agents ──────────────────────────────────────────
  lore_list_commands: {
    description: 'List all command file paths across namespaces',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      const paths = listToolPaths(REPO_ROOT);
      const commands = paths.map((p) => {
        const { frontmatter } = readFrontmatter(p);
        return { path: p, name: frontmatter.name || '', description: frontmatter.description || '' };
      });
      return JSON.stringify(commands, null, 2);
    },
  },
  lore_list_agents: {
    description: 'List all agent file paths',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      const paths = listAgentPaths(REPO_ROOT);
      const agents = paths.map((p) => {
        const { frontmatter } = readFrontmatter(p);
        return { path: p, name: frontmatter.name || '', description: frontmatter.description || '' };
      });
      return JSON.stringify(agents, null, 2);
    },
  },

  // ── Registry ───────────────────────────────────────────────────
  lore_registry_register: {
    description: 'Register an item in the in-memory registry',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Registry type (e.g., skill, command, agent)' },
        name: { type: 'string', description: 'Item name' },
        metadata: { type: 'object', description: 'Optional metadata', default: {} },
      },
      required: ['type', 'name'],
    },
    handler: async ({ type, name, metadata }) => {
      register(type, name, metadata || {});
      return JSON.stringify({ registered: true, type, name });
    },
  },
  lore_registry_get: {
    description: 'Get an item from the registry',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Registry type' },
        name: { type: 'string', description: 'Item name' },
      },
      required: ['type', 'name'],
    },
    handler: async ({ type, name }) => {
      const item = get(type, name);
      return JSON.stringify(item);
    },
  },
  lore_registry_list: {
    description: 'List all items of a type in the registry, or all items if no type given',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Registry type (omit for all)' },
      },
      required: [],
    },
    handler: async ({ type }) => {
      const result = type ? list(type) : listAll();
      return JSON.stringify(result, null, 2);
    },
  },
  lore_registry_unregister: {
    description: 'Remove an item from the in-memory registry',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Registry type' },
        name: { type: 'string', description: 'Item name' },
      },
      required: ['type', 'name'],
    },
    handler: async ({ type, name }) => {
      unregister(type, name);
      return JSON.stringify({ unregistered: true, type, name });
    },
  },
  lore_registry_clear: {
    description: 'Clear all entries from the in-memory registry',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => {
      clear();
      return JSON.stringify({ cleared: true });
    },
  },

  // ── Filesystem ─────────────────────────────────────────────────
  lore_tree: {
    description: 'Print a visual directory tree with box-drawing connectors',
    inputSchema: {
      type: 'object',
      properties: {
        dir: { type: 'string', description: 'Directory to print tree for (defaults to lore root)' },
        maxDepth: { type: 'number', description: 'Max depth to traverse', default: 3 },
      },
      required: [],
    },
    handler: async ({ dir, maxDepth }) => {
      return printTree(dir || LORE_ROOT, { maxDepth: maxDepth || 3 });
    },
  },
  lore_tree_files: {
    description: 'Get a flat list of all file paths in a directory tree',
    inputSchema: {
      type: 'object',
      properties: {
        dir: { type: 'string', description: 'Directory to walk (defaults to lore root)' },
        maxDepth: { type: 'number', description: 'Max depth', default: 10 },
      },
      required: [],
    },
    handler: async ({ dir, maxDepth }) => {
      const files = tree(dir || LORE_ROOT, { maxDepth: maxDepth || 10 });
      return JSON.stringify(files, null, 2);
    },
  },
  lore_locate: {
    description: 'Find files matching a glob pattern within a base directory',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Glob pattern (e.g., **/*.md)' },
        dir: { type: 'string', description: 'Base directory (defaults to lore root)' },
      },
      required: ['pattern'],
    },
    handler: async ({ pattern, dir }) => {
      const matches = locate(dir || LORE_ROOT, pattern);
      return JSON.stringify(matches, null, 2);
    },
  },
  lore_locate_first: {
    description: 'Find the first file matching any of the given glob patterns',
    inputSchema: {
      type: 'object',
      properties: {
        patterns: { type: 'array', items: { type: 'string' }, description: 'Glob patterns to try in order' },
        dir: { type: 'string', description: 'Base directory (defaults to lore root)' },
      },
      required: ['patterns'],
    },
    handler: async ({ patterns, dir }) => {
      const match = locateFirst(dir || LORE_ROOT, patterns);
      return JSON.stringify({ match });
    },
  },
  lore_find_configs: {
    description: 'Find config files by walking up from a directory',
    inputSchema: {
      type: 'object',
      properties: {
        startDir: { type: 'string', description: 'Directory to start searching from' },
      },
      required: ['startDir'],
    },
    handler: async ({ startDir }) => {
      const configs = findConfigs(startDir);
      return JSON.stringify(configs, null, 2);
    },
  },
  lore_read_file: {
    description: 'Read a file as UTF-8 text',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'File path' } },
      required: ['path'],
    },
    handler: async ({ path }) => readFile(path),
  },
  lore_read_json: {
    description: 'Read and parse a JSON file',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'Path to JSON file' } },
      required: ['path'],
    },
    handler: async ({ path }) => JSON.stringify(readJSON(path), null, 2),
  },
  lore_file_exists: {
    description: 'Check if a file or directory exists',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'File path' } },
      required: ['path'],
    },
    handler: async ({ path }) => JSON.stringify({ path, exists: exists(path) }),
  },
  lore_write_file: {
    description: 'Write content to a file (creates directories as needed)',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
        content: { type: 'string', description: 'Content to write' },
      },
      required: ['path', 'content'],
    },
    handler: async ({ path, content }) => {
      writeFile(path, content);
      return JSON.stringify({ written: true, path });
    },
  },
  lore_write_json: {
    description: 'Write an object as formatted JSON to a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
        data: { type: 'object', description: 'JSON data to write' },
      },
      required: ['path', 'data'],
    },
    handler: async ({ path, data }) => {
      writeJSON(path, data);
      return JSON.stringify({ written: true, path });
    },
  },
  lore_append_file: {
    description: 'Append content to a file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path' },
        content: { type: 'string', description: 'Content to append' },
      },
      required: ['path', 'content'],
    },
    handler: async ({ path, content }) => {
      appendFile(path, content);
      return JSON.stringify({ appended: true, path });
    },
  },
  lore_read_frontmatter: {
    description: 'Read and parse YAML frontmatter from a markdown file',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to markdown file' },
      },
      required: ['path'],
    },
    handler: async ({ path }) => {
      const result = readFrontmatter(path);
      return JSON.stringify(result, null, 2);
    },
  },

  // ── Paths (extended) ────────────────────────────────────────────
  lore_root: {
    description: 'Get the resolved lore plugin root directory',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => JSON.stringify({ loreRoot: loreRoot() }),
  },
  lore_plugin_root: {
    description: 'Find the nearest plugin root from a given directory',
    inputSchema: {
      type: 'object',
      properties: { startDir: { type: 'string', description: 'Directory to search from' } },
      required: ['startDir'],
    },
    handler: async ({ startDir }) => JSON.stringify({ pluginRoot: pluginRoot(startDir) }),
  },
  lore_resolve_skill_dir: {
    description: 'Resolve a skill name to its directory path',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Skill name' } },
      required: ['name'],
    },
    handler: async ({ name }) => resolveSkillDir(name, REPO_ROOT),
  },
  lore_list_skill_paths: {
    description: 'List all skill directory paths',
    inputSchema: { type: 'object', properties: {}, required: [] },
    handler: async () => JSON.stringify(listSkillPaths(REPO_ROOT), null, 2),
  },

  // ── Run ────────────────────────────────────────────────────────
  lore_run_tool: {
    description: 'Run a shell command and return stdout/stderr/exitCode',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to run' },
        args: { type: 'array', items: { type: 'string' }, description: 'Arguments', default: [] },
        cwd: { type: 'string', description: 'Working directory' },
        timeout: { type: 'number', description: 'Timeout in ms' },
      },
      required: ['command'],
    },
    handler: async ({ command, args, cwd, timeout }) => {
      const result = runTool(command, args || [], { cwd, timeout });
      return JSON.stringify(result, null, 2);
    },
  },
  lore_run_tool_async: {
    description: 'Run a shell command asynchronously and return stdout/stderr/exitCode',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Command to run' },
        args: { type: 'array', items: { type: 'string' }, description: 'Arguments', default: [] },
        cwd: { type: 'string', description: 'Working directory' },
        timeout: { type: 'number', description: 'Timeout in ms' },
      },
      required: ['command'],
    },
    handler: async ({ command, args, cwd, timeout }) => {
      const result = await runToolAsync(command, args || [], { cwd, timeout });
      return JSON.stringify(result, null, 2);
    },
  },
  lore_run_script: {
    description: 'Run a JS or shell script file',
    inputSchema: {
      type: 'object',
      properties: {
        scriptPath: { type: 'string', description: 'Path to script file' },
        args: { type: 'array', items: { type: 'string' }, description: 'Script arguments', default: [] },
      },
      required: ['scriptPath'],
    },
    handler: async ({ scriptPath, args }) => {
      const result = runScript(scriptPath, args || []);
      return JSON.stringify(result, null, 2);
    },
  },
  lore_start_mcp_server: {
    description: 'Start an MCP server process and return its PID',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Server command' },
        args: { type: 'array', items: { type: 'string' }, description: 'Server args', default: [] },
        cwd: { type: 'string', description: 'Working directory' },
      },
      required: ['command'],
    },
    handler: async ({ command, args, cwd }) => {
      const proc = runMcpServer({ command, args: args || [], cwd });
      const pid = proc.pid;
      managedServers.set(pid, proc);
      return JSON.stringify({ started: true, pid });
    },
  },
  lore_stop_mcp_server: {
    description: 'Stop a managed MCP server process by PID',
    inputSchema: {
      type: 'object',
      properties: {
        pid: { type: 'number', description: 'Process ID of the MCP server' },
      },
      required: ['pid'],
    },
    handler: async ({ pid }) => {
      const proc = managedServers.get(pid);
      if (!proc) return JSON.stringify({ error: `No managed server with PID ${pid}` });
      await stopMcpServer(proc);
      managedServers.delete(pid);
      return JSON.stringify({ stopped: true, pid });
    },
  },
  lore_test_mcp_server: {
    description: 'Test if an MCP server starts and responds to initialize',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Server command' },
        args: { type: 'array', items: { type: 'string' }, description: 'Server args', default: [] },
        cwd: { type: 'string', description: 'Working directory' },
      },
      required: ['command'],
    },
    handler: async ({ command, args, cwd }) => {
      const result = await testMcpServer({ command, args: args || [], cwd });
      return JSON.stringify(result, null, 2);
    },
  },

  // ── Logging ─────────────────────────────────────────────────────
  lore_log: {
    description: 'Log a message to stderr at a given severity level (info, success, warn, error)',
    inputSchema: {
      type: 'object',
      properties: {
        level: { type: 'string', enum: ['info', 'success', 'warn', 'error'], description: 'Log level' },
        message: { type: 'string', description: 'Message to log' },
      },
      required: ['level', 'message'],
    },
    handler: async ({ level, message }) => {
      // console.log is redirected to stderr, so echo functions are MCP-safe
      const loggers = { info, success, warn, error: echoError };
      const fn = loggers[level] || info;
      fn(message);
      return JSON.stringify({ logged: true, level, message });
    },
  },

  // ── Paths ──────────────────────────────────────────────────────
  lore_resolve_path: {
    description: 'Resolve a lore-relative path (skill, command, agent, or arbitrary)',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['skill', 'command', 'agent', 'path'], description: 'What to resolve' },
        name: { type: 'string', description: 'Name or path segments' },
      },
      required: ['type', 'name'],
    },
    handler: async ({ type, name }) => {
      switch (type) {
        case 'skill':
          return resolveSkill(name, REPO_ROOT);
        case 'command':
          return resolveTool(name, REPO_ROOT);
        case 'agent':
          return resolveAgent(name, REPO_ROOT);
        default:
          return resolvePath(LORE_ROOT, name);
      }
    },
  },
};

// ── MCP Protocol Implementation ────────────────────────────────────

const SERVER_INFO = {
  name: 'lore-gateway',
  version: '1.0.0',
};

const CAPABILITIES = {
  tools: {},
};

function makeToolsList() {
  return Object.entries(TOOLS).map(([name, def]) => ({
    name,
    description: def.description,
    inputSchema: def.inputSchema,
  }));
}

async function handleRequest(req) {
  const { method, params, id } = req;

  switch (method) {
    case 'initialize':
      return {
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: CAPABILITIES,
          serverInfo: SERVER_INFO,
        },
      };

    case 'notifications/initialized':
      return null; // no response for notifications

    case 'tools/list':
      return {
        jsonrpc: '2.0',
        id,
        result: { tools: makeToolsList() },
      };

    case 'tools/call': {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      const tool = TOOLS[toolName];
      if (!tool) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
            isError: true,
          },
        };
      }
      try {
        const output = await tool.handler(toolArgs);
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: String(output) }],
          },
        };
      } catch (err) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `Error: ${err.message}` }],
            isError: true,
          },
        };
      }
    }

    default:
      if (!id) return null; // notification, no response
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

// ── Stdio Transport ────────────────────────────────────────────────

let buffer = '';

function processBuffer() {
  while (true) {
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) break;

    const header = buffer.slice(0, headerEnd);
    const lengthMatch = header.match(/Content-Length:\s*(\d+)/i);
    if (!lengthMatch) {
      buffer = buffer.slice(headerEnd + 4);
      continue;
    }

    const contentLength = parseInt(lengthMatch[1], 10);
    const bodyStart = headerEnd + 4;
    if (buffer.length < bodyStart + contentLength) break;

    const body = buffer.slice(bodyStart, bodyStart + contentLength);
    buffer = buffer.slice(bodyStart + contentLength);

    let req;
    try {
      req = JSON.parse(body);
    } catch {
      sendResponse({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error' },
      });
      continue;
    }

    handleRequest(req).then((response) => {
      if (response) sendResponse(response);
    }).catch((err) => {
      sendResponse({
        jsonrpc: '2.0',
        id: req.id ?? null,
        error: { code: -32603, message: err.message },
      });
    });
  }
}

function sendResponse(obj) {
  const body = JSON.stringify(obj);
  const msg = `Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`;
  process.stdout.write(msg);
}

process.stdin.setEncoding('utf-8');
process.stdin.on('data', (chunk) => {
  buffer += chunk;
  processBuffer();
});

process.stdin.on('end', () => {
  process.exit(0);
});

// Log to stderr (stdout is reserved for MCP protocol)
process.stderr.write(`[lore-gateway] MCP server started (pid ${process.pid})\n`);
