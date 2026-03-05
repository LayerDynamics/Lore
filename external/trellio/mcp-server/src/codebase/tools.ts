/**
 * Codebase Management Tool Handlers
 *
 * File operations, script execution, configuration management.
 */

import { readFile, writeFile, readdir, stat } from 'fs/promises';
import { join, relative, isAbsolute } from 'path';
import { spawn } from 'child_process';
import { z } from 'zod';

// ========================================================================
// TOOL SCHEMAS
// ========================================================================

export const readProjectFileSchema = z.object({
  path: z.string().describe('File path relative to project directory'),
});

export const writeProjectFileSchema = z.object({
  path: z.string().describe('File path relative to project directory'),
  content: z.string().describe('File content to write'),
});

export const listProjectFilesSchema = z.object({
  path: z.string().optional().describe('Directory path (optional, defaults to project root)'),
  recursive: z.boolean().optional().describe('List files recursively'),
});

export const searchProjectSchema = z.object({
  pattern: z.string().describe('Search pattern (regex)'),
  file_glob: z.string().optional().describe('File glob pattern to limit search (e.g., "*.ts")'),
});

export const runScriptSchema = z.object({
  script: z.string().describe('Script path relative to project directory'),
  args: z.array(z.string()).optional().describe('Script arguments'),
  timeout: z.number().optional().describe('Timeout in milliseconds (default 300000)'),
});

export const getEnvConfigSchema = z.object({});

export const setEnvValueSchema = z.object({
  key: z.string().describe('Environment variable key'),
  value: z.string().describe('Environment variable value'),
});

export const validateEnvSchema = z.object({});

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

/**
 * Resolve path within project directory
 */
export function resolveProjectPath(projectDir: string, filePath: string): string {
  const resolved = isAbsolute(filePath) ? filePath : join(projectDir, filePath);

  // Security: ensure path is within project directory
  const rel = relative(projectDir, resolved);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error('Path outside project directory not allowed');
  }

  return resolved;
}

/**
 * Redact sensitive values from env config
 */
function redactSecrets(content: string): string {
  const lines = content.split('\n');
  const redacted = lines.map((line) => {
    if (line.trim().startsWith('#') || !line.includes('=')) {
      return line;
    }

    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=');

    // Redact keys containing sensitive words
    const sensitivePatterns = ['KEY', 'TOKEN', 'SECRET', 'PASSWORD', 'CREDENTIAL', 'API'];
    if (sensitivePatterns.some(pattern => key.toUpperCase().includes(pattern))) {
      return `${key}=${value.trim() ? '***REDACTED***' : ''}`;
    }

    return line;
  });

  return redacted.join('\n');
}

/**
 * Run a script with timeout
 */
async function runScriptWithTimeout(
  scriptPath: string,
  args: string[],
  cwd: string,
  timeout: number
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(scriptPath, args, {
      cwd,
      shell: false, // Security: avoid shell injection
      timeout,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    // Enforce timeout
    const timeoutId = setTimeout(() => {
      if (!child.killed) {
        child.kill();
        reject(new Error(`Script execution timed out after ${timeout}ms`));
      }
    }, timeout);

    child.on('error', (error) => {
      clearTimeout(timeoutId); // Security: prevent timeout leak
      reject(new Error(`Script execution failed: ${error.message}`));
    });

    child.on('close', (code) => {
      clearTimeout(timeoutId); // Security: prevent timeout leak
      resolve({
        stdout,
        stderr,
        exitCode: code || 0,
      });
    });
  });
}

/**
 * Recursively list files
 */
async function listFilesRecursive(dir: string, baseDir: string = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    // Skip node_modules, .git, dist, build
    if (['node_modules', '.git', 'dist', 'build', '.worktrees'].includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      const subFiles = await listFilesRecursive(fullPath, baseDir);
      files.push(...subFiles);
    } else {
      files.push(relative(baseDir, fullPath));
    }
  }

  return files;
}

// ========================================================================
// TOOL HANDLERS
// ========================================================================

export async function handleReadProjectFile(projectDir: string, args: z.infer<typeof readProjectFileSchema>) {
  const filePath = resolveProjectPath(projectDir, args.path);
  const content = await readFile(filePath, 'utf-8');

  return {
    content: [
      {
        type: 'text' as const,
        text: content,
      },
    ],
  };
}

export async function handleWriteProjectFile(projectDir: string, args: z.infer<typeof writeProjectFileSchema>) {
  const filePath = resolveProjectPath(projectDir, args.path);
  await writeFile(filePath, args.content, 'utf-8');

  return {
    content: [
      {
        type: 'text' as const,
        text: `File written: ${args.path}`,
      },
    ],
  };
}

export async function handleListProjectFiles(projectDir: string, args: z.infer<typeof listProjectFilesSchema>) {
  const targetDir = args.path ? resolveProjectPath(projectDir, args.path) : projectDir;

  let files: string[];

  if (args.recursive) {
    files = await listFilesRecursive(targetDir);
  } else {
    const entries = await readdir(targetDir, { withFileTypes: true });
    files = entries
      .filter(e => !['node_modules', '.git', 'dist', 'build'].includes(e.name))
      .map(e => e.name + (e.isDirectory() ? '/' : ''));
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: files.join('\n'),
      },
    ],
  };
}

export async function handleSearchProject(projectDir: string, args: z.infer<typeof searchProjectSchema>) {
  const files = await listFilesRecursive(projectDir);
  const pattern = new RegExp(args.pattern, 'i');
  const matches: string[] = [];

  for (const file of files) {
    // Filter by glob if provided
    if (args.file_glob) {
      const globPattern = args.file_glob.replace(/\*/g, '.*');
      if (!new RegExp(globPattern).test(file)) {
        continue;
      }
    }

    const fullPath = join(projectDir, file);
    const content = await readFile(fullPath, 'utf-8').catch(() => null);

    if (content && pattern.test(content)) {
      const lines = content.split('\n');
      const matchingLines = lines
        .map((line, idx) => ({ line, num: idx + 1 }))
        .filter(({ line }) => pattern.test(line))
        .slice(0, 5); // Limit to 5 matches per file

      matches.push(`${file}:\n${matchingLines.map(m => `  ${m.num}: ${m.line}`).join('\n')}`);
    }
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: matches.length > 0 ? matches.join('\n\n') : 'No matches found',
      },
    ],
  };
}

export async function handleRunScript(projectDir: string, args: z.infer<typeof runScriptSchema>) {
  const scriptPath = resolveProjectPath(projectDir, args.script);
  const timeout = args.timeout || 300000; // 5 minutes default

  const result = await runScriptWithTimeout(scriptPath, args.args || [], projectDir, timeout);

  return {
    content: [
      {
        type: 'text' as const,
        text: `Exit Code: ${result.exitCode}\n\nSTDOUT:\n${result.stdout}\n\nSTDERR:\n${result.stderr}`,
      },
    ],
  };
}

export async function handleGetEnvConfig(projectDir: string, args: z.infer<typeof getEnvConfigSchema>) {
  const envPath = join(projectDir, '.env');

  try {
    const content = await readFile(envPath, 'utf-8');
    const redacted = redactSecrets(content);

    // Parse and show which vars are set vs missing
    const lines = content.split('\n');
    const vars = lines
      .filter(line => line.trim() && !line.trim().startsWith('#') && line.includes('='))
      .map(line => {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        return { key: key.trim(), set: value.length > 0 };
      });

    const summary = `Environment Variables Status:
${vars.map(v => `${v.set ? '✓' : '✗'} ${v.key}`).join('\n')}

.env Content (secrets redacted):
${redacted}`;

    return {
      content: [
        {
          type: 'text' as const,
          text: summary,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: '.env file not found',
        },
      ],
    };
  }
}

export async function handleSetEnvValue(projectDir: string, args: z.infer<typeof setEnvValueSchema>) {
  const envPath = join(projectDir, '.env');
  let content = '';

  try {
    content = await readFile(envPath, 'utf-8');
  } catch (error) {
    // File doesn't exist, will create it
  }

  const lines = content.split('\n');
  let found = false;

  const updated = lines.map(line => {
    if (line.trim().startsWith(`${args.key}=`)) {
      found = true;
      return `${args.key}=${args.value}`;
    }
    return line;
  });

  if (!found) {
    updated.push(`${args.key}=${args.value}`);
  }

  await writeFile(envPath, updated.join('\n'), 'utf-8');

  return {
    content: [
      {
        type: 'text' as const,
        text: `Environment variable ${args.key} set`,
      },
    ],
  };
}

export async function handleValidateEnv(projectDir: string, args: z.infer<typeof validateEnvSchema>) {
  const envPath = join(projectDir, '.env');
  const examplePath = join(projectDir, '.env.example');

  try {
    const envContent = await readFile(envPath, 'utf-8').catch(() => '');
    const exampleContent = await readFile(examplePath, 'utf-8').catch(() => '');

    const envVars = new Set(
      envContent
        .split('\n')
        .filter(line => line.trim() && !line.trim().startsWith('#') && line.includes('='))
        .map(line => line.split('=')[0].trim())
    );

    const requiredVars = exampleContent
      .split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('#') && line.includes('='))
      .map(line => line.split('=')[0].trim());

    const missing = requiredVars.filter(v => !envVars.has(v));

    const report = `Environment Validation:

Required Variables: ${requiredVars.length}
Set Variables: ${envVars.size}
Missing Variables: ${missing.length}

${missing.length > 0 ? `Missing:\n${missing.map(v => `  ✗ ${v}`).join('\n')}` : '✓ All required variables are set'}`;

    return {
      content: [
        {
          type: 'text' as const,
          text: report,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'Could not validate environment (missing .env or .env.example)',
        },
      ],
    };
  }
}
