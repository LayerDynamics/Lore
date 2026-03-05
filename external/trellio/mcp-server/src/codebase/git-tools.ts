/**
 * Git Operations Tool Handlers
 *
 * Git status, diff, log, commit, branch management.
 */

import { simpleGit, SimpleGit } from 'simple-git';
import { z } from 'zod';

// ========================================================================
// TOOL SCHEMAS
// ========================================================================

export const gitStatusSchema = z.object({});

export const gitDiffSchema = z.object({
  ref: z.string().optional().describe('Git ref to diff against (optional)'),
  staged: z.boolean().optional().describe('Show only staged changes'),
});

export const gitLogSchema = z.object({
  limit: z.number().optional().describe('Number of commits to show (default 10)'),
});

export const gitCommitSchema = z.object({
  files: z.array(z.string()).describe('Files to commit'),
  message: z.string().describe('Commit message'),
});

export const gitBranchSchema = z.object({
  action: z.enum(['create', 'switch', 'list']).describe('Branch action'),
  name: z.string().optional().describe('Branch name (for create/switch)'),
});

// ========================================================================
// TOOL HANDLERS
// ========================================================================

export async function handleGitStatus(projectDir: string, args: z.infer<typeof gitStatusSchema>) {
  const git: SimpleGit = simpleGit(projectDir);
  const status = await git.status();

  const output = `Branch: ${status.current || '(detached)'}
Ahead: ${status.ahead}, Behind: ${status.behind}

Staged (${status.staged.length}):
${status.staged.map(f => `  + ${f}`).join('\n') || '  (none)'}

Modified (${status.modified.length}):
${status.modified.map(f => `  M ${f}`).join('\n') || '  (none)'}

Untracked (${status.not_added.length}):
${status.not_added.map(f => `  ? ${f}`).join('\n') || '  (none)'}

Deleted (${status.deleted.length}):
${status.deleted.map(f => `  D ${f}`).join('\n') || '  (none)'}`;

  return {
    content: [
      {
        type: 'text' as const,
        text: output,
      },
    ],
  };
}

export async function handleGitDiff(projectDir: string, args: z.infer<typeof gitDiffSchema>) {
  const git: SimpleGit = simpleGit(projectDir);

  let diff: string;

  if (args.staged) {
    diff = await git.diff(['--cached']);
  } else if (args.ref) {
    diff = await git.diff([args.ref]);
  } else {
    diff = await git.diff();
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: diff || '(no changes)',
      },
    ],
  };
}

export async function handleGitLog(projectDir: string, args: z.infer<typeof gitLogSchema>) {
  const git: SimpleGit = simpleGit(projectDir);
  const log = await git.log({ maxCount: args.limit || 10 });

  const output = log.all.map(commit => {
    return `commit ${commit.hash}
Author: ${commit.author_name} <${commit.author_email}>
Date: ${commit.date}

    ${commit.message}
`;
  }).join('\n');

  return {
    content: [
      {
        type: 'text' as const,
        text: output,
      },
    ],
  };
}

export async function handleGitCommit(projectDir: string, args: z.infer<typeof gitCommitSchema>) {
  const git: SimpleGit = simpleGit(projectDir);

  // Stage files
  await git.add(args.files);

  // Commit
  await git.commit(args.message);

  return {
    content: [
      {
        type: 'text' as const,
        text: `Committed ${args.files.length} file(s):\n${args.files.map(f => `  ${f}`).join('\n')}`,
      },
    ],
  };
}

export async function handleGitBranch(projectDir: string, args: z.infer<typeof gitBranchSchema>) {
  const git: SimpleGit = simpleGit(projectDir);

  if (args.action === 'list') {
    const branches = await git.branch();
    const output = `Current: ${branches.current}\n\nBranches:\n${branches.all.map(b => `  ${b === branches.current ? '*' : ' '} ${b}`).join('\n')}`;

    return {
      content: [
        {
          type: 'text' as const,
          text: output,
        },
      ],
    };
  }

  if (args.action === 'create') {
    if (!args.name) {
      throw new Error('Branch name required for create action');
    }
    await git.checkoutLocalBranch(args.name);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Created and switched to branch: ${args.name}`,
        },
      ],
    };
  }

  if (args.action === 'switch') {
    if (!args.name) {
      throw new Error('Branch name required for switch action');
    }
    await git.checkout(args.name);
    return {
      content: [
        {
          type: 'text' as const,
          text: `Switched to branch: ${args.name}`,
        },
      ],
    };
  }

  throw new Error(`Unknown action: ${args.action}`);
}
