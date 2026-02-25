import type { Server as HttpServer } from 'node:http';
import type { WsBridge } from '../lib/window/ws-server.js';

export function setupLifecycle(httpServer: HttpServer, wsBridge: WsBridge): void {
  const shutdown = () => {
    wsBridge.close();
    httpServer.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
