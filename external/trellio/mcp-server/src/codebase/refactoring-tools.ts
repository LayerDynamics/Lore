/**
 * Code Analysis and Refactoring Tool Handlers
 *
 * Codebase analysis, env var tracking, workflow validation, diff reports.
 */

import { readFile, readdir } from 'fs/promises';
import { join, extname } from 'path';
import { simpleGit, SimpleGit } from 'simple-git';
import { z } from 'zod';
import { resolveProjectPath } from './tools.js';

// ========================================================================
// TOOL SCHEMAS
// ========================================================================

export const analyzeCodebaseSchema = z.object({});

export const findEnvVarUsageSchema = z.object({
  var_name: z.string().describe('Environment variable name to search for'),
});

export const validateWorkflowJsonSchema = z.object({
  path: z.string().describe('Path to workflow JSON file'),
});

export const generateDiffReportSchema = z.object({
  since_commit: z.string().optional().describe('Commit to diff against (default: HEAD)'),
});

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

async function walkDirectory(dir: string, callback: (filePath: string) => Promise<void>) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (['node_modules', '.git', 'dist', 'build', '.worktrees'].includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      await walkDirectory(fullPath, callback);
    } else {
      await callback(fullPath);
    }
  }
}

// ========================================================================
// TOOL HANDLERS
// ========================================================================

export async function handleAnalyzeCodebase(projectDir: string, args: z.infer<typeof analyzeCodebaseSchema>) {
  const fileCounts: Record<string, number> = {};
  const envVarUsage: Record<string, string[]> = {};
  const todos: string[] = [];

  await walkDirectory(projectDir, async (filePath) => {
    const ext = extname(filePath);
    fileCounts[ext] = (fileCounts[ext] || 0) + 1;

    const content = await readFile(filePath, 'utf-8').catch(() => null);
    if (!content) return;

    // Find env var usage
    const envMatches = content.matchAll(/process\.env\.(\w+)|env\.(\w+)|\$\{?env\.(\w+)\}?/g);
    for (const match of envMatches) {
      const varName = match[1] || match[2] || match[3];
      if (!envVarUsage[varName]) {
        envVarUsage[varName] = [];
      }
      if (!envVarUsage[varName].includes(filePath)) {
        envVarUsage[varName].push(filePath);
      }
    }

    // Find TODOs/FIXMEs
    const todoMatches = content.matchAll(/(TODO|FIXME|XXX|HACK):\s*(.+)/gi);
    for (const match of todoMatches) {
      todos.push(`${filePath}: ${match[0]}`);
    }
  });

  const totalFiles = Object.values(fileCounts).reduce((sum, count) => sum + count, 0);

  const report = `# Codebase Analysis

## File Counts (${totalFiles} total)
${Object.entries(fileCounts)
  .sort(([, a], [, b]) => b - a)
  .map(([ext, count]) => `  ${ext || '(no extension)'}: ${count}`)
  .join('\n')}

## Environment Variables (${Object.keys(envVarUsage).length} unique)
${Object.entries(envVarUsage)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([varName, files]) => `  ${varName}: used in ${files.length} file(s)`)
  .join('\n')}

## TODOs/FIXMEs (${todos.length})
${todos.slice(0, 20).join('\n')}${todos.length > 20 ? `\n... and ${todos.length - 20} more` : ''}`;

  return {
    content: [
      {
        type: 'text' as const,
        text: report,
      },
    ],
  };
}

export async function handleFindEnvVarUsage(projectDir: string, args: z.infer<typeof findEnvVarUsageSchema>) {
  const matches: Array<{ file: string; lines: string[] }> = [];

  await walkDirectory(projectDir, async (filePath) => {
    const content = await readFile(filePath, 'utf-8').catch(() => null);
    if (!content) return;

    const pattern = new RegExp(`(?:process\\.env\\.${args.var_name}|env\\.${args.var_name}|\\$\\{?env\\.${args.var_name}\\}?)`, 'g');
    if (pattern.test(content)) {
      const lines = content.split('\n');
      const matchingLines = lines
        .map((line, idx) => ({ line, num: idx + 1 }))
        .filter(({ line }) => pattern.test(line))
        .map(({ line, num }) => `  ${num}: ${line.trim()}`);

      matches.push({
        file: filePath,
        lines: matchingLines,
      });
    }
  });

  const output = matches.length > 0
    ? matches.map(m => `${m.file}:\n${m.lines.join('\n')}`).join('\n\n')
    : `No usage found for ${args.var_name}`;

  return {
    content: [
      {
        type: 'text' as const,
        text: output,
      },
    ],
  };
}

export async function handleValidateWorkflowJson(projectDir: string, args: z.infer<typeof validateWorkflowJsonSchema>) {
  const filePath = resolveProjectPath(projectDir, args.path);
  const content = await readFile(filePath, 'utf-8');

  try {
    const workflow = JSON.parse(content);

    const errors: string[] = [];

    // Check required fields
    if (!workflow.name) errors.push('Missing required field: name');
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) errors.push('Missing or invalid nodes array');
    if (!workflow.connections) errors.push('Missing connections object');

    // Check node references
    if (workflow.nodes) {
      const nodeIds = new Set(workflow.nodes.map((n: any) => n.id));

      for (const [nodeId, connections] of Object.entries(workflow.connections || {})) {
        if (!nodeIds.has(nodeId)) {
          errors.push(`Connection references non-existent node: ${nodeId}`);
        }
      }

      // Check credential references (basic check)
      for (const node of workflow.nodes) {
        if (node.credentials) {
          for (const [credType, credInfo] of Object.entries(node.credentials)) {
            if (!(credInfo as any).id) {
              errors.push(`Node ${node.name} has invalid credential reference for ${credType}`);
            }
          }
        }
      }
    }

    const report = errors.length === 0
      ? `✓ Workflow JSON is valid\n  Nodes: ${workflow.nodes?.length || 0}\n  Name: ${workflow.name}`
      : `✗ Workflow JSON has errors:\n${errors.map(e => `  - ${e}`).join('\n')}`;

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
          text: `✗ Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}

export async function handleGenerateDiffReport(projectDir: string, args: z.infer<typeof generateDiffReportSchema>) {
  const git: SimpleGit = simpleGit(projectDir);

  const ref = args.since_commit || 'HEAD';
  const diff = await git.diff([ref]);
  const status = await git.status();

  // Parse diff to extract file changes
  const diffLines = diff.split('\n');
  const fileChanges: Record<string, { additions: number; deletions: number }> = {};

  let currentFile = '';
  for (const line of diffLines) {
    if (line.startsWith('diff --git')) {
      const match = line.match(/b\/(.+)$/);
      if (match) {
        currentFile = match[1];
        fileChanges[currentFile] = { additions: 0, deletions: 0 };
      }
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      fileChanges[currentFile].additions++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      fileChanges[currentFile].deletions++;
    }
  }

  const totalAdditions = Object.values(fileChanges).reduce((sum, c) => sum + c.additions, 0);
  const totalDeletions = Object.values(fileChanges).reduce((sum, c) => sum + c.deletions, 0);

  const report = `# Diff Report${args.since_commit ? ` (since ${args.since_commit})` : ''}

## Summary
Files changed: ${Object.keys(fileChanges).length}
Total additions: +${totalAdditions}
Total deletions: -${totalDeletions}

## Modified Files
${status.modified.map(f => `  M ${f}`).join('\n') || '  (none)'}

## Staged Files
${status.staged.map(f => `  + ${f}`).join('\n') || '  (none)'}

## File Changes
${Object.entries(fileChanges)
  .map(([file, changes]) => `  ${file}: +${changes.additions} -${changes.deletions}`)
  .join('\n')}`;

  return {
    content: [
      {
        type: 'text' as const,
        text: report,
      },
    ],
  };
}
