import type { Server as HttpServer } from 'node:http';
import type { WsBridge } from '../lib/window/ws-server.js';
export declare function setupLifecycle(httpServer: HttpServer, wsBridge: WsBridge): void;
