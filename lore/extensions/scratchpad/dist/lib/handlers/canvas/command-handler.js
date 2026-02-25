import { createShape } from '../../solvers/draw/draw-solver.js';
import { createText } from '../../solvers/type/type-solver.js';
import { createAsciiArt } from '../../solvers/ascii/ascii-solver.js';
import { createImage, createMarkdown } from '../../solvers/media/media-solver.js';
export class CommandHandler {
    state;
    constructor(state) {
        this.state = state;
    }
    handle(type, payload) {
        switch (type) {
            case 'user_draw':
                return this.state.addObject(createShape(payload));
            case 'user_text':
                return this.state.addObject(createText(payload));
            case 'user_ascii':
                return this.state.addObject(createAsciiArt(payload));
            case 'user_image':
                return this.state.addObject(createImage(payload));
            case 'user_markdown':
                return this.state.addObject(createMarkdown(payload));
            case 'user_move': {
                const { id, ...updates } = payload;
                return this.state.moveObject(id, updates);
            }
            case 'user_delete': {
                const { id } = payload;
                this.state.removeObject(id);
                return { deleted: id };
            }
            case 'user_clear': {
                const { layerId } = payload;
                this.state.clearLayer(layerId);
                return this.state.getSnapshot();
            }
            case 'user_create_layer': {
                const { name } = payload;
                const layer = this.state.createLayer(undefined, name);
                return { ...this.state.getSnapshot(), newLayer: layer };
            }
            case 'user_update_content': {
                const { id, content } = payload;
                const obj = this.state.getObject(id);
                if (obj && 'content' in obj) {
                    const updated = { ...obj, content, updatedAt: Date.now() };
                    this.state.removeObject(id);
                    return this.state.addObject(updated);
                }
                return null;
            }
            case 'user_undo':
                this.state.undo();
                return this.state.getSnapshot();
            case 'user_redo':
                this.state.redo();
                return this.state.getSnapshot();
            default:
                return null;
        }
    }
}
//# sourceMappingURL=command-handler.js.map