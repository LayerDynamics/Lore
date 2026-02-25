import { randomUUID } from 'node:crypto';
export class CanvasState {
    objects = new Map();
    layers = new Map();
    undoStack = [];
    redoStack = [];
    _background = '#ffffff';
    _width = 1200;
    _height = 800;
    constructor() {
        this.createLayer('default', 'Default');
    }
    // --- Snapshot for undo/redo ---
    takeSnapshot() {
        this.undoStack.push(this.getSnapshot());
        this.redoStack.length = 0;
        if (this.undoStack.length > 50)
            this.undoStack.shift();
    }
    restoreSnapshot(snap) {
        this.objects.clear();
        for (const obj of snap.objects)
            this.objects.set(obj.id, obj);
        this.layers.clear();
        for (const layer of snap.layers)
            this.layers.set(layer.id, layer);
        this._background = snap.background;
        this._width = snap.width;
        this._height = snap.height;
    }
    // --- Public API ---
    getSnapshot() {
        return {
            objects: Array.from(this.objects.values()),
            layers: Array.from(this.layers.values()),
            background: this._background,
            width: this._width,
            height: this._height,
        };
    }
    loadSnapshot(snap) {
        this.takeSnapshot();
        this.restoreSnapshot(snap);
    }
    addObject(obj) {
        this.takeSnapshot();
        this.objects.set(obj.id, obj);
        return obj;
    }
    removeObject(id) {
        if (!this.objects.has(id))
            return false;
        this.takeSnapshot();
        this.objects.delete(id);
        return true;
    }
    moveObject(id, updates) {
        const obj = this.objects.get(id);
        if (!obj)
            return null;
        this.takeSnapshot();
        const updated = { ...obj, ...updates, updatedAt: Date.now() };
        this.objects.set(id, updated);
        return updated;
    }
    getObject(id) {
        return this.objects.get(id);
    }
    createLayer(id, name) {
        const layerId = id ?? randomUUID();
        const layer = {
            id: layerId,
            name: name ?? `Layer ${this.layers.size + 1}`,
            visible: true,
            locked: false,
            order: this.layers.size,
        };
        this.layers.set(layerId, layer);
        return layer;
    }
    clearLayer(layerId) {
        this.takeSnapshot();
        if (layerId) {
            for (const [id, obj] of this.objects) {
                if (obj.layerId === layerId)
                    this.objects.delete(id);
            }
        }
        else {
            this.objects.clear();
        }
    }
    setBackground(color) {
        this.takeSnapshot();
        this._background = color;
    }
    get background() {
        return this._background;
    }
    undo() {
        const snap = this.undoStack.pop();
        if (!snap)
            return false;
        this.redoStack.push(this.getSnapshot());
        this.restoreSnapshot(snap);
        return true;
    }
    redo() {
        const snap = this.redoStack.pop();
        if (!snap)
            return false;
        this.undoStack.push(this.getSnapshot());
        this.restoreSnapshot(snap);
        return true;
    }
}
//# sourceMappingURL=state.js.map