import { spawn } from 'node:child_process';

/**
 * Spawn an MCP server process from config.
 * @param {Object} config - {command, args, cwd, env}
 * @returns {ChildProcess}
 */
export function runMcpServer(config) {
  const { command, args = [], cwd, env } = config;
// sourcery skip: inline-immediately-returned-variable
  const proc = spawn(command, args, {
    cwd,
    env: { ...process.env, ...env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  return proc;
}

/**
 * Gracefully stop an MCP server process (SIGTERM then SIGKILL after timeout).
 */
export function stopMcpServer(proc, timeout = 5000) {
  return new Promise((resolve) => {
    if (proc.exitCode !== null) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
    }, timeout);
    proc.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    proc.kill('SIGTERM');
  });
}

/**
 * Spawn server, send initialize request, verify response, then stop.
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function testMcpServer(config) {
  let proc;
  try {
    proc = runMcpServer(config);
    const initRequest = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'lore-test', version: '0.1.0' } },
    });
    proc.stdin.write(`Content-Length: ${Buffer.byteLength(initRequest)}\r\n\r\n${initRequest}`);

    const response = await new Promise((resolve, reject) => {
      let data = '';
      const timer = setTimeout(() => reject(new Error('Timeout waiting for MCP server response')), 10000);
      proc.stdout.on('data', (chunk) => {
        data += chunk.toString();
        // Try to parse JSON-RPC response from the accumulated data
        const bodyMatch = data.match(/\r\n\r\n(.+)/s);
        if (bodyMatch) {
          try {
            const parsed = JSON.parse(bodyMatch[1]);
            clearTimeout(timer);
            resolve(parsed);
          } catch {
            // incomplete JSON, keep reading
          }
        }
      });
      proc.on('error', (err) => { clearTimeout(timer); reject(err); });
      proc.on('exit', (code) => {
        if (!data) { clearTimeout(timer); reject(new Error(`Server exited with code ${code}`)); }
      });
    });

    await stopMcpServer(proc);
    if (response.result) {
      return { ok: true };
    }
    return { ok: false, error: response.error?.message || 'Unknown error' };
  } catch (err) {
    if (proc) await stopMcpServer(proc).catch(() => {});
    return { ok: false, error: err.message };
  }
}
