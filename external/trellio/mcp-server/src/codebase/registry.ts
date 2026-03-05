/**
 * Codebase Tools Registry
 */

import { ToolDefinition } from '../registry.js';
import * as Tools from './tools.js';
import * as RefactoringTools from './refactoring-tools.js';
import * as GitTools from './git-tools.js';

export function createCodebaseTools(projectDir: string): ToolDefinition[] {
  return [
    // File Management Tools
    {
      name: 'codebase_read_file',
      description: 'Read a file from the project directory',
      inputSchema: Tools.readProjectFileSchema,
      handler: async (args) => {
        const result = await Tools.handleReadProjectFile(projectDir, args);
        return result;
      },
    },
    {
      name: 'codebase_write_file',
      description: 'Write content to a file in the project directory',
      inputSchema: Tools.writeProjectFileSchema,
      handler: async (args) => {
        const result = await Tools.handleWriteProjectFile(projectDir, args);
        return result;
      },
    },
    {
      name: 'codebase_list_files',
      description: 'List files in the project directory',
      inputSchema: Tools.listProjectFilesSchema,
      handler: async (args) => {
        const result = await Tools.handleListProjectFiles(projectDir, args);
        return result;
      },
    },
    {
      name: 'codebase_search',
      description: 'Search for text/patterns across project files',
      inputSchema: Tools.searchProjectSchema,
      handler: async (args) => {
        const result = await Tools.handleSearchProject(projectDir, args);
        return result;
      },
    },
    {
      name: 'codebase_run_script',
      description: 'Execute a script from the project directory',
      inputSchema: Tools.runScriptSchema,
      handler: async (args) => {
        const result = await Tools.handleRunScript(projectDir, args);
        return result;
      },
    },

    // Environment Management Tools
    {
      name: 'codebase_get_env_config',
      description: 'Get current environment configuration',
      inputSchema: Tools.getEnvConfigSchema,
      handler: async (args) => {
        const result = await Tools.handleGetEnvConfig(projectDir, args);
        return result;
      },
    },
    {
      name: 'codebase_set_env_value',
      description: 'Set an environment variable value',
      inputSchema: Tools.setEnvValueSchema,
      handler: async (args) => {
        const result = await Tools.handleSetEnvValue(projectDir, args);
        return result;
      },
    },
    {
      name: 'codebase_validate_env',
      description: 'Validate environment configuration completeness',
      inputSchema: Tools.validateEnvSchema,
      handler: async (args) => {
        const result = await Tools.handleValidateEnv(projectDir, args);
        return result;
      },
    },

    // Code Analysis & Refactoring Tools
    {
      name: 'codebase_analyze',
      description: 'Analyze codebase structure and patterns',
      inputSchema: RefactoringTools.analyzeCodebaseSchema,
      handler: async (args) => {
        const result = await RefactoringTools.handleAnalyzeCodebase(projectDir, args);
        return result;
      },
    },
    {
      name: 'codebase_find_env_usage',
      description: 'Find all usages of an environment variable',
      inputSchema: RefactoringTools.findEnvVarUsageSchema,
      handler: async (args) => {
        const result = await RefactoringTools.handleFindEnvVarUsage(projectDir, args);
        return result;
      },
    },
    {
      name: 'codebase_validate_workflow_json',
      description: 'Validate workflow JSON structure',
      inputSchema: RefactoringTools.validateWorkflowJsonSchema,
      handler: async (args) => {
        const result = await RefactoringTools.handleValidateWorkflowJson(projectDir, args);
        return result;
      },
    },
    {
      name: 'codebase_generate_diff_report',
      description: 'Generate a formatted diff report',
      inputSchema: RefactoringTools.generateDiffReportSchema,
      handler: async (args) => {
        const result = await RefactoringTools.handleGenerateDiffReport(projectDir, args);
        return result;
      },
    },

    // Git Tools
    {
      name: 'git_status',
      description: 'Get git status of the project',
      inputSchema: GitTools.gitStatusSchema,
      handler: async (args) => {
        const result = await GitTools.handleGitStatus(projectDir, args);
        return result;
      },
    },
    {
      name: 'git_diff',
      description: 'Get git diff for staged or unstaged changes',
      inputSchema: GitTools.gitDiffSchema,
      handler: async (args) => {
        const result = await GitTools.handleGitDiff(projectDir, args);
        return result;
      },
    },
    {
      name: 'git_log',
      description: 'Get git commit history',
      inputSchema: GitTools.gitLogSchema,
      handler: async (args) => {
        const result = await GitTools.handleGitLog(projectDir, args);
        return result;
      },
    },
    {
      name: 'git_commit',
      description: 'Create a git commit',
      inputSchema: GitTools.gitCommitSchema,
      handler: async (args) => {
        const result = await GitTools.handleGitCommit(projectDir, args);
        return result;
      },
    },
    {
      name: 'git_branch',
      description: 'Manage git branches (list, create, switch, delete)',
      inputSchema: GitTools.gitBranchSchema,
      handler: async (args) => {
        const result = await GitTools.handleGitBranch(projectDir, args);
        return result;
      },
    },
  ];
}
