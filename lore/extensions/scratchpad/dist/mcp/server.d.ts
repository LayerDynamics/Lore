import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { CanvasState } from '../lib/canvas/state.js';
import type { WsBridge } from '../lib/window/ws-server.js';
export declare function startMcpServer(state: CanvasState, wsBridge: WsBridge, browserUrl: string): Promise<Server>;
