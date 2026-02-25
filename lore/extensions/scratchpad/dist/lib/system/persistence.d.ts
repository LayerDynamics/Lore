import type { CanvasSnapshot } from '../canvas/types.js';
export declare function saveCanvas(filePath: string, snapshot: CanvasSnapshot): Promise<void>;
export declare function loadCanvas(filePath: string): Promise<CanvasSnapshot>;
