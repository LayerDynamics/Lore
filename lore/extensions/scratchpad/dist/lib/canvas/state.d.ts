import type { CanvasObject, CanvasSnapshot, Layer } from './types.js';
export declare class CanvasState {
    private objects;
    private layers;
    private undoStack;
    private redoStack;
    private _background;
    private _width;
    private _height;
    constructor();
    private takeSnapshot;
    private restoreSnapshot;
    getSnapshot(): CanvasSnapshot;
    loadSnapshot(snap: CanvasSnapshot): void;
    addObject(obj: CanvasObject): CanvasObject;
    removeObject(id: string): boolean;
    moveObject(id: string, updates: Partial<Pick<CanvasObject, 'x' | 'y' | 'width' | 'height' | 'rotation'>>): CanvasObject | null;
    getObject(id: string): CanvasObject | undefined;
    createLayer(id?: string, name?: string): Layer;
    clearLayer(layerId?: string): void;
    setBackground(color: string): void;
    get background(): string;
    undo(): boolean;
    redo(): boolean;
}
