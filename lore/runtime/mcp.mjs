#!/usr/bin/env node
import { pathToFileURL } from 'node:url';
import { realpathSync } from 'node:fs';
import { ROOT, metadata, catalog, workflow } from './catalog.mjs';

const VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const tools = [
  { name: 'lore_list_workflows', description: 'List the installed Lore workflows without loading their bodies.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false } },
  { name: 'lore_get_workflow', description: 'Load one installed Lore workflow and its provider-neutral runtime contract.', inputSchema: { type: 'object', properties: { name: { type: 'string' } }, required: ['name'], additionalProperties: false }, annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false } },
];

export async function createServer({ root = ROOT } = {}) {
  const meta = await metadata(root);
  const entries = await catalog(root);
  let initialized = false;
  return async request => {
    const id = request?.id ?? null;
    const error = (code, message) => ({ jsonrpc: '2.0', id, error: { code, message } });
    const result = value => ({ jsonrpc: '2.0', id, result: value });
    if (!request || typeof request !== 'object' || Array.isArray(request) || request.jsonrpc !== '2.0' || typeof request.method !== 'string') return error(-32600, 'Invalid Request');
    if (Object.hasOwn(request, 'id') && typeof request.id !== 'string' && typeof request.id !== 'number') return error(-32600, 'Invalid request id');
    // Notifications have no response, including unknown notification methods.
    if (!Object.hasOwn(request, 'id')) return undefined;
    if (request.method === 'initialize') {
      if (!request.params || typeof request.params.protocolVersion !== 'string') return error(-32602, 'protocolVersion is required');
      initialized = true;
      return result({ protocolVersion: VERSIONS.includes(request.params.protocolVersion) ? request.params.protocolVersion : VERSIONS[0], capabilities: { tools: {} }, serverInfo: { name: 'lore-catalog', version: meta.version } });
    }
    if (request.method === 'ping') return result({});
    if (!initialized) return error(-32002, 'Initialize the server first');
    if (request.method === 'tools/list') return result({ tools });
    if (request.method !== 'tools/call') return error(-32601, 'Method not found');
    const { name, arguments: args = {} } = request.params ?? {};
    if (!args || typeof args !== 'object' || Array.isArray(args)) return error(-32602, 'Arguments must be an object');
    if (!tools.some(t => t.name === name)) return error(-32602, 'Unknown tool');
    const allowed = name === 'lore_get_workflow' ? ['name'] : [];
    if (Object.keys(args).some(k => !allowed.includes(k))) return error(-32602, 'Unexpected argument');
    if (name === 'lore_get_workflow' && typeof args.name !== 'string') return error(-32602, 'name is required');
    try {
      if (name === 'lore_list_workflows') return result({ content: [{ type: 'text', text: JSON.stringify(entries.map(({ name, description }) => ({ name, description }))) }] });
      if (!entries.some(e => e.name === args.name)) throw new Error(`Unknown workflow: ${args.name}`);
      const entry = await workflow(args.name, { root });
      return result({ content: [{ type: 'text', text: entry.body }] });
    } catch (e) {
      return result({ content: [{ type: 'text', text: e.message }], isError: true });
    }
  };
}

export async function serve(options = {}) {
  const handle = await createServer(options);
  let pending = Buffer.alloc(0);
  const output = value => { if (value !== undefined) process.stdout.write(JSON.stringify(value) + '\n'); };
  for await (const chunk of process.stdin) {
    pending = Buffer.concat([pending, Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)]);
    let end;
    while ((end = pending.indexOf(10)) !== -1) {
      const line = pending.subarray(0, end); pending = pending.subarray(end + 1);
      if (line.length > 1024 * 1024) throw new Error('MCP message exceeds 1 MiB');
      if (!line.toString('utf8').trim()) continue;
      let request;
      try { request = JSON.parse(line.toString('utf8')); } catch {
        output({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); continue;
      }
      output(await handle(request));
    }
    if (pending.length > 1024 * 1024) throw new Error('MCP message exceeds 1 MiB');
  }
  if (pending.toString('utf8').trim()) output({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Unterminated JSON-RPC message' } });
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  serve().catch(error => { process.stderr.write(`Lore MCP: ${error.message}\n`); process.exitCode = 1; });
}
