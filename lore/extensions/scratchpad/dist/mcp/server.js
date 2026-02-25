import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { tools } from './tools.js';
import { createShape } from '../lib/solvers/draw/draw-solver.js';
import { createText } from '../lib/solvers/type/type-solver.js';
import { createAsciiArt } from '../lib/solvers/ascii/ascii-solver.js';
import { createImage, createMarkdown } from '../lib/solvers/media/media-solver.js';
import { saveCanvas, loadCanvas } from '../lib/system/persistence.js';
import { launchBrowser } from '../app/window/launcher.js';
export async function startMcpServer(state, wsBridge, browserUrl) {
    const server = new Server({ name: 'scratchpad', version: '0.1.0' }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        const p = (args ?? {});
        try {
            switch (name) {
                case 'scratchpad_open': {
                    await launchBrowser(browserUrl);
                    return result('Canvas window opened');
                }
                case 'scratchpad_draw_shape': {
                    const obj = createShape(p);
                    state.addObject(obj);
                    wsBridge.broadcastObject('draw_shape', obj);
                    return result(obj);
                }
                case 'scratchpad_add_text': {
                    const obj = createText(p);
                    state.addObject(obj);
                    wsBridge.broadcastObject('add_text', obj);
                    return result(obj);
                }
                case 'scratchpad_add_image': {
                    const obj = createImage(p);
                    state.addObject(obj);
                    wsBridge.broadcastObject('add_image', obj);
                    return result(obj);
                }
                case 'scratchpad_ascii_art': {
                    const obj = createAsciiArt(p);
                    state.addObject(obj);
                    wsBridge.broadcastObject('ascii_art', obj);
                    return result(obj);
                }
                case 'scratchpad_render_markdown': {
                    const obj = createMarkdown(p);
                    state.addObject(obj);
                    wsBridge.broadcastObject('render_markdown', obj);
                    return result(obj);
                }
                case 'scratchpad_clear': {
                    state.clearLayer(p.layerId);
                    wsBridge.broadcastState();
                    return result('Canvas cleared');
                }
                case 'scratchpad_undo': {
                    const ok = state.undo();
                    wsBridge.broadcastState();
                    return result(ok ? 'Undone' : 'Nothing to undo');
                }
                case 'scratchpad_redo': {
                    const ok = state.redo();
                    wsBridge.broadcastState();
                    return result(ok ? 'Redone' : 'Nothing to redo');
                }
                case 'scratchpad_set_background': {
                    state.setBackground(p.color);
                    wsBridge.broadcast({ type: 'set_background', payload: { color: p.color } });
                    return result('Background set');
                }
                case 'scratchpad_get_state': {
                    return result(state.getSnapshot());
                }
                case 'scratchpad_save': {
                    await saveCanvas(p.filePath, state.getSnapshot());
                    return result(`Saved to ${p.filePath}`);
                }
                case 'scratchpad_load': {
                    const snap = await loadCanvas(p.filePath);
                    state.loadSnapshot(snap);
                    wsBridge.broadcastState();
                    return result(`Loaded from ${p.filePath}`);
                }
                case 'scratchpad_create_layer': {
                    const layer = state.createLayer(undefined, p.name);
                    return result(layer);
                }
                case 'scratchpad_delete_object': {
                    const ok = state.removeObject(p.id);
                    wsBridge.broadcastState();
                    return result(ok ? `Deleted ${p.id}` : 'Object not found');
                }
                case 'scratchpad_move_object': {
                    const { id, ...updates } = p;
                    const obj = state.moveObject(id, updates);
                    if (obj)
                        wsBridge.broadcastState();
                    return result(obj ?? 'Object not found');
                }
                default:
                    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
            }
        }
        catch (err) {
            return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
        }
    });
    const transport = new StdioServerTransport();
    await server.connect(transport);
    return server;
}
function result(data) {
    return { content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] };
}
//# sourceMappingURL=server.js.map