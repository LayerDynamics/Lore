import type { CanvasState } from '../../canvas/state.js';
import type { CanvasObject } from '../../canvas/types.js';
export declare class CommandHandler {
    private state;
    constructor(state: CanvasState);
    handle(type: string, payload: Record<string, unknown>): CanvasObject | Record<string, unknown> | null;
}
