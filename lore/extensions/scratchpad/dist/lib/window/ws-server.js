import { WebSocketServer, WebSocket } from 'ws';
import { CommandHandler } from '../handlers/canvas/command-handler.js';
export class WsBridge {
    state;
    wss;
    clients = new Set();
    commandHandler;
    constructor(httpServer, state) {
        this.state = state;
        this.commandHandler = new CommandHandler(state);
        this.wss = new WebSocketServer({ server: httpServer });
        this.wss.on('connection', (ws) => this.handleConnection(ws));
    }
    handleConnection(ws) {
        this.clients.add(ws);
        // Send full state on connect
        const msg = { type: 'full_state', payload: this.state.getSnapshot() };
        ws.send(JSON.stringify(msg));
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                this.handleBrowserMessage(msg);
            }
            catch { /* ignore malformed */ }
        });
        ws.on('close', () => this.clients.delete(ws));
    }
    handleBrowserMessage(msg) {
        const result = this.commandHandler.handle(msg.type, msg.payload);
        if (result) {
            // Broadcast the resulting state change to all clients
            this.broadcast({ type: msg.type, payload: result });
        }
    }
    broadcast(msg) {
        const data = JSON.stringify(msg);
        for (const client of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        }
    }
    broadcastObject(action, obj) {
        this.broadcast({ type: action, payload: obj });
    }
    broadcastState() {
        this.broadcast({ type: 'full_state', payload: this.state.getSnapshot() });
    }
    close() {
        this.wss.close();
    }
}
//# sourceMappingURL=ws-server.js.map