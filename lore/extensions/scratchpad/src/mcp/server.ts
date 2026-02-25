import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { tools } from './tools.js';
import type { CanvasState } from '../lib/canvas/state.js';
import type { WsBridge } from '../lib/window/ws-server.js';
import { createShape } from '../lib/solvers/draw/draw-solver.js';
import { createText } from '../lib/solvers/type/type-solver.js';
import { createAsciiArt } from '../lib/solvers/ascii/ascii-solver.js';
import { createImage, createMarkdown } from '../lib/solvers/media/media-solver.js';
import { saveCanvas, loadCanvas } from '../lib/system/persistence.js';
import { launchBrowser } from '../app/window/launcher.js';

export async function startMcpServer(
  state: CanvasState,
  wsBridge: WsBridge,
  browserUrl: string,
): Promise<Server> {
  const server = new Server(
    { name: 'scratchpad', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const p = (args ?? {}) as Record<string, unknown>;

    try {
      switch (name) {
        case 'scratchpad_open': {
          await launchBrowser(browserUrl);
          return result('Canvas window opened');
        }
        case 'scratchpad_draw_shape': {
          const obj = createShape(p as unknown as Parameters<typeof createShape>[0]);
          state.addObject(obj);
          wsBridge.broadcastObject('draw_shape', obj);
          return result(obj);
        }
        case 'scratchpad_add_text': {
          const obj = createText(p as unknown as Parameters<typeof createText>[0]);
          state.addObject(obj);
          wsBridge.broadcastObject('add_text', obj);
          return result(obj);
        }
        case 'scratchpad_add_image': {
          const obj = createImage(p as unknown as Parameters<typeof createImage>[0]);
          state.addObject(obj);
          wsBridge.broadcastObject('add_image', obj);
          return result(obj);
        }
        case 'scratchpad_ascii_art': {
          const obj = createAsciiArt(p as unknown as Parameters<typeof createAsciiArt>[0]);
          state.addObject(obj);
          wsBridge.broadcastObject('ascii_art', obj);
          return result(obj);
        }
        case 'scratchpad_render_markdown': {
          const obj = createMarkdown(p as unknown as Parameters<typeof createMarkdown>[0]);
          state.addObject(obj);
          wsBridge.broadcastObject('render_markdown', obj);
          return result(obj);
        }
        case 'scratchpad_clear': {
          state.clearLayer(p.layerId as string | undefined);
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
          state.setBackground(p.color as string);
          wsBridge.broadcast({ type: 'set_background', payload: { color: p.color } as Record<string, unknown> });
          return result('Background set');
        }
        case 'scratchpad_get_state': {
          return result(state.getSnapshot());
        }
        case 'scratchpad_save': {
          await saveCanvas(p.filePath as string, state.getSnapshot());
          return result(`Saved to ${p.filePath}`);
        }
        case 'scratchpad_load': {
          const snap = await loadCanvas(p.filePath as string);
          state.loadSnapshot(snap);
          wsBridge.broadcastState();
          return result(`Loaded from ${p.filePath}`);
        }
        case 'scratchpad_create_layer': {
          const layer = state.createLayer(undefined, p.name as string);
          return result(layer);
        }
        case 'scratchpad_delete_object': {
          const ok = state.removeObject(p.id as string);
          wsBridge.broadcastState();
          return result(ok ? `Deleted ${p.id}` : 'Object not found');
        }
        case 'scratchpad_move_object': {
          const { id, ...updates } = p as { id: string; x?: number; y?: number; width?: number; height?: number; rotation?: number };
          const obj = state.moveObject(id, updates);
          if (obj) wsBridge.broadcastState();
          return result(obj ?? 'Object not found');
        }
        default:
          return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
      }
    } catch (err) {
      return { content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  return server;
}

function result(data: unknown) {
  return { content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] };
}
