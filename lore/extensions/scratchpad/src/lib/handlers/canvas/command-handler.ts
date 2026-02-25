import type { CanvasState } from '../../canvas/state.js';
import type { CanvasObject } from '../../canvas/types.js';
import { createShape, type DrawParams } from '../../solvers/draw/draw-solver.js';
import { createText, type TypeParams } from '../../solvers/type/type-solver.js';
import { createAsciiArt, type AsciiParams } from '../../solvers/ascii/ascii-solver.js';
import { createImage, createMarkdown, type ImageParams, type MarkdownParams } from '../../solvers/media/media-solver.js';

export class CommandHandler {
  constructor(private state: CanvasState) {}

  handle(type: string, payload: Record<string, unknown>): CanvasObject | Record<string, unknown> | null {
    switch (type) {
      case 'user_draw':
        return this.state.addObject(createShape(payload as unknown as DrawParams));
      case 'user_text':
        return this.state.addObject(createText(payload as unknown as TypeParams));
      case 'user_ascii':
        return this.state.addObject(createAsciiArt(payload as unknown as AsciiParams));
      case 'user_image':
        return this.state.addObject(createImage(payload as unknown as ImageParams));
      case 'user_markdown':
        return this.state.addObject(createMarkdown(payload as unknown as MarkdownParams));
      case 'user_move': {
        const { id, ...updates } = payload as { id: string; x?: number; y?: number; width?: number; height?: number };
        return this.state.moveObject(id, updates);
      }
      case 'user_delete': {
        const { id } = payload as { id: string };
        this.state.removeObject(id);
        return { deleted: id };
      }
      case 'user_clear': {
        const { layerId } = payload as { layerId?: string };
        this.state.clearLayer(layerId);
        return this.state.getSnapshot() as unknown as Record<string, unknown>;
      }
      case 'user_create_layer': {
        const { name } = payload as { name: string };
        const layer = this.state.createLayer(undefined, name);
        return { ...this.state.getSnapshot(), newLayer: layer } as unknown as Record<string, unknown>;
      }
      case 'user_update_content': {
        const { id, content } = payload as { id: string; content: string };
        const obj = this.state.getObject(id);
        if (obj && 'content' in obj) {
          const updated = { ...obj, content, updatedAt: Date.now() } as CanvasObject;
          this.state.removeObject(id);
          return this.state.addObject(updated);
        }
        return null;
      }
      case 'user_undo':
        this.state.undo();
        return this.state.getSnapshot() as unknown as Record<string, unknown>;
      case 'user_redo':
        this.state.redo();
        return this.state.getSnapshot() as unknown as Record<string, unknown>;
      default:
        return null;
    }
  }
}
