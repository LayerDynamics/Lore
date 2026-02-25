import type { Server as HttpServer } from 'node:http';
import type { CanvasState } from '../canvas/state.js';
import type { WsMessage, CanvasObject } from '../canvas/types.js';
export declare class WsBridge {
    private state;
    private wss;
    private clients;
    private commandHandler;
    constructor(httpServer: HttpServer, state: CanvasState);
    private handleConnection;
    private handleBrowserMessage;
    broadcast(msg: WsMessage): void;
    broadcastObject(action: string, obj: CanvasObject): void;
    broadcastState(): void;
    close(): void;
}
