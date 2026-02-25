#!/usr/bin/env node
/**
 * Scratchpad MCP Server
 * A collaborative visual canvas accessible by both Claude and the user.
 */
import { CanvasState } from './lib/canvas/state.js';
import { createHttpServer } from './lib/handlers/window/http-server.js';
import { WsBridge } from './lib/window/ws-server.js';
import { startMcpServer } from './mcp/server.js';
import { setupLifecycle } from './hooks/lifecycle.js';
import { launchBrowser } from './app/window/launcher.js';
const PORT = parseInt(process.env['SCRATCHPAD_PORT'] ?? '9400', 10);
const STANDALONE = process.argv.includes('--standalone');
const state = new CanvasState();
const { server: httpServer, url } = createHttpServer(PORT);
const wsBridge = new WsBridge(httpServer, state);
httpServer.listen(PORT, () => {
    process.stderr.write(`Scratchpad HTTP/WS server listening on ${url}\n`);
    if (STANDALONE) {
        launchBrowser(url).catch(() => {
            process.stderr.write(`Open ${url} in your browser\n`);
        });
    }
});
setupLifecycle(httpServer, wsBridge);
if (!STANDALONE) {
    await startMcpServer(state, wsBridge, url);
}
else {
    // Keep process alive in standalone mode
    process.stdin.resume();
}
//# sourceMappingURL=index.js.map