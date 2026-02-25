import { randomUUID } from 'node:crypto';
import type { CanvasObject, CanvasSnapshot, Layer } from './types.js';

export class CanvasState {
  private objects: Map<string, CanvasObject> = new Map();
  private layers: Map<string, Layer> = new Map();
  private undoStack: CanvasSnapshot[] = [];
  private redoStack: CanvasSnapshot[] = [];
  private _background = '#ffffff';
  private _width = 1200;
  private _height = 800;

  constructor() {
    this.createLayer('default', 'Default');
  }

  // --- Snapshot for undo/redo ---

  private takeSnapshot(): void {
    this.undoStack.push(this.getSnapshot());
    this.redoStack.length = 0;
    if (this.undoStack.length > 50) this.undoStack.shift();
  }

  private restoreSnapshot(snap: CanvasSnapshot): void {
    this.objects.clear();
    for (const obj of snap.objects) this.objects.set(obj.id, obj);
    this.layers.clear();
    for (const layer of snap.layers) this.layers.set(layer.id, layer);
    this._background = snap.background;
    this._width = snap.width;
    this._height = snap.height;
  }

  // --- Public API ---

  getSnapshot(): CanvasSnapshot {
    return {
      objects: Array.from(this.objects.values()),
      layers: Array.from(this.layers.values()),
      background: this._background,
      width: this._width,
      height: this._height,
    };
  }

  loadSnapshot(snap: CanvasSnapshot): void {
    this.takeSnapshot();
    this.restoreSnapshot(snap);
  }

  addObject(obj: CanvasObject): CanvasObject {
    this.takeSnapshot();
    this.objects.set(obj.id, obj);
    return obj;
  }

  removeObject(id: string): boolean {
    if (!this.objects.has(id)) return false;
    this.takeSnapshot();
    this.objects.delete(id);
    return true;
  }

  moveObject(id: string, updates: Partial<Pick<CanvasObject, 'x' | 'y' | 'width' | 'height' | 'rotation'>>): CanvasObject | null {
    const obj = this.objects.get(id);
    if (!obj) return null;
    this.takeSnapshot();
    const updated = { ...obj, ...updates, updatedAt: Date.now() } as CanvasObject;
    this.objects.set(id, updated);
    return updated;
  }

  getObject(id: string): CanvasObject | undefined {
    return this.objects.get(id);
  }

  createLayer(id?: string, name?: string): Layer {
    const layerId = id ?? randomUUID();
    const layer: Layer = {
      id: layerId,
      name: name ?? `Layer ${this.layers.size + 1}`,
      visible: true,
      locked: false,
      order: this.layers.size,
    };
    this.layers.set(layerId, layer);
    return layer;
  }

  clearLayer(layerId?: string): void {
    this.takeSnapshot();
    if (layerId) {
      for (const [id, obj] of this.objects) {
        if (obj.layerId === layerId) this.objects.delete(id);
      }
    } else {
      this.objects.clear();
    }
  }

  setBackground(color: string): void {
    this.takeSnapshot();
    this._background = color;
  }

  get background(): string {
    return this._background;
  }

  undo(): boolean {
    const snap = this.undoStack.pop();
    if (!snap) return false;
    this.redoStack.push(this.getSnapshot());
    this.restoreSnapshot(snap);
    return true;
  }

  redo(): boolean {
    const snap = this.redoStack.pop();
    if (!snap) return false;
    this.undoStack.push(this.getSnapshot());
    this.restoreSnapshot(snap);
    return true;
  }
}
