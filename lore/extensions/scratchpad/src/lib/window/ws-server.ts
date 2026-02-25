import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'node:http';
import type { CanvasState } from '../canvas/state.js';
import type { WsMessage, CanvasObject } from '../canvas/types.js';
import { CommandHandler } from '../handlers/canvas/command-handler.js';

export class WsBridge {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();
  private commandHandler: CommandHandler;

  constructor(
    httpServer: HttpServer,
    private state: CanvasState,
  ) {
    this.commandHandler = new CommandHandler(state);
    this.wss = new WebSocketServer({ server: httpServer });
    this.wss.on('connection', (ws) => this.handleConnection(ws));
  }

  private handleConnection(ws: WebSocket): void {
    this.clients.add(ws);
    // Send full state on connect
    const msg: WsMessage = { type: 'full_state', payload: this.state.getSnapshot() as unknown as Record<string, unknown> };
    ws.send(JSON.stringify(msg));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString()) as WsMessage;
        this.handleBrowserMessage(msg);
      } catch { /* ignore malformed */ }
    });

    ws.on('close', () => this.clients.delete(ws));
  }

  private handleBrowserMessage(msg: WsMessage): void {
    const result = this.commandHandler.handle(msg.type, msg.payload);
    if (result) {
      // Broadcast the resulting state change to all clients
      this.broadcast({ type: msg.type, payload: result as unknown as Record<string, unknown> });
    }
  }

  broadcast(msg: WsMessage): void {
    const data = JSON.stringify(msg);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  broadcastObject(action: string, obj: CanvasObject): void {
    this.broadcast({ type: action, payload: obj as unknown as Record<string, unknown> });
  }

  broadcastState(): void {
    this.broadcast({ type: 'full_state', payload: this.state.getSnapshot() as unknown as Record<string, unknown> });
  }

  close(): void {
    this.wss.close();
  }
}
