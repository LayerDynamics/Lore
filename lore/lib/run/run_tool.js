import { spawnSync, spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { statSync, realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const PLUGIN_ROOT = resolve(dirname(__filename), '..', '..');

const ALLOWED_ROOTS = [
  PLUGIN_ROOT,
  process.cwd(),
];

const toolRunListeners = new Set();

export function onToolRun(callback) {
  toolRunListeners.add(callback);
  return () => toolRunListeners.delete(callback);
}

function notifyToolRun(event, command, args, result) {
  for (const listener of toolRunListeners) {
    try {
      listener({ event, command, args, result });
    } catch {
      // Swallow listener errors
    }
  }
}

/**
 * Run a shell command synchronously and return {stdout, stderr, exitCode}.
 */
export function runTool(command, args = [], options = {}) {
  const { cwd, env, timeout } = options;

  notifyToolRun('pre-run', command, args, null);

  const result = spawnSync(command, args, {
    cwd,
    env: env ? { ...process.env, ...env } : process.env,
    timeout,
    encoding: 'utf-8',
  });
  const output = {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status ?? 1,
  };

  notifyToolRun('post-run', command, args, output);

  return output;
}

/**
 * Run a shell command asynchronously and return Promise<{stdout, stderr, exitCode}>.
 */
export function runToolAsync(command, args = [], options = {}) {
  const { cwd, env, timeout } = options;

  notifyToolRun('pre-run', command, args, null);

  return new Promise((resolvePromise) => {
    const proc = spawn(command, args, {
      cwd,
      env: env ? { ...process.env, ...env } : process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timer;
    if (timeout) {
      timer = setTimeout(() => {
        proc.kill('SIGKILL');
      }, timeout);
    }
    proc.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    proc.on('close', (code) => {
      if (timer) clearTimeout(timer);
      const output = { stdout, stderr, exitCode: code ?? 1 };
      notifyToolRun('post-run', command, args, output);
      resolvePromise(output);
    });
    proc.on('error', (err) => {
      if (timer) clearTimeout(timer);
      const output = { stdout, stderr: err.message, exitCode: 1 };
      notifyToolRun('post-run', command, args, output);
      resolvePromise(output);
    });
  });
}

/**
 * Run a JS or shell script file.
 */
export function runScript(scriptPath, args = []) {
  const resolved = realpathSync(resolve(scriptPath));
  const stat = statSync(resolved);
  if (!stat.isFile()) {
    throw new Error(`Not a file: ${resolved}`);
  }
  const inBounds = ALLOWED_ROOTS.some((root) => resolved.startsWith(root + '/'));
  if (!inBounds) {
    throw new Error(
      `Path traversal blocked: ${resolved} is outside allowed roots (${ALLOWED_ROOTS.join(', ')})`
    );
  }
  if (resolved.endsWith('.js') || resolved.endsWith('.mjs')) {
    return runTool(process.execPath, [resolved, ...args]);
  }
  return runTool(resolved, args);
}
