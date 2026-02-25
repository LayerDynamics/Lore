import { spawnSync, spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { statSync } from 'node:fs';

/**
 * Run a shell command synchronously and return {stdout, stderr, exitCode}.
 */
export function runTool(command, args = [], options = {}) {
  const { cwd, env, timeout } = options;
  const result = spawnSync(command, args, {
    cwd,
    env: env ? { ...process.env, ...env } : process.env,
    timeout,
    encoding: 'utf-8',
  });
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status ?? 1,
  };
}

/**
 * Run a shell command asynchronously and return Promise<{stdout, stderr, exitCode}>.
 */
export function runToolAsync(command, args = [], options = {}) {
  const { cwd, env, timeout } = options;
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
      resolvePromise({ stdout, stderr, exitCode: code ?? 1 });
    });
    proc.on('error', (err) => {
      if (timer) clearTimeout(timer);
      resolvePromise({ stdout, stderr: err.message, exitCode: 1 });
    });
  });
}

/**
 * Run a JS or shell script file.
 */
export function runScript(scriptPath, args = []) {
  const resolved = resolve(scriptPath);
  const stat = statSync(resolved);
  if (!stat.isFile()) {
    throw new Error(`Not a file: ${resolved}`);
  }
  if (resolved.endsWith('.js') || resolved.endsWith('.mjs')) {
    return runTool(process.execPath, [resolved, ...args]);
  }
  return runTool(resolved, args);
}
