import { spawn } from 'node:child_process';

const mcpLifecycleListeners = new Set();

export function onMcpLifecycle(callback) {
  mcpLifecycleListeners.add(callback);
  return () => mcpLifecycleListeners.delete(callback);
}

function notifyMcpLifecycle(event, config, proc) {
  for (const listener of mcpLifecycleListeners) {
    try {
      listener({ event, config, pid: proc?.pid });
    } catch {
      // Swallow listener errors
    }
  }
}

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

  notifyMcpLifecycle('start', config, proc);

  proc.once('exit', () => {
    notifyMcpLifecycle('exit', config, proc);
  });

  return proc;
}

/**
 * Gracefully stop an MCP server process (SIGTERM then SIGKILL after timeout).
 */
export function stopMcpServer(proc, timeout = 5000) {
  return new Promise((resolve) => {
    if (proc.exitCode !== null) {
      notifyMcpLifecycle('stop', null, proc);
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
      let buffer = Buffer.alloc(0);
      const timer = setTimeout(() => reject(new Error('Timeout waiting for MCP server response')), 10000);
      proc.stdout.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        // Parse Content-Length header from the buffer
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) return;
        const header = buffer.subarray(0, headerEnd).toString();
        const match = header.match(/Content-Length:\s*(\d+)/i);
        if (!match) return;
        const contentLength = parseInt(match[1], 10);
        const bodyStart = headerEnd + 4;
        if (buffer.length < bodyStart + contentLength) return; // body incomplete
        const body = buffer.subarray(bodyStart, bodyStart + contentLength).toString();
        try {
          const parsed = JSON.parse(body);
          clearTimeout(timer);
          resolve(parsed);
        } catch (e) {
          clearTimeout(timer);
          reject(new Error(`Invalid JSON in MCP response: ${e.message}`));
        }
      });
      proc.on('error', (err) => { clearTimeout(timer); reject(err); });
      proc.on('exit', (code) => {
        if (!buffer.length) { clearTimeout(timer); reject(new Error(`Server exited with code ${code}`)); }
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
