import { randomUUID } from 'node:crypto';
export function createAsciiArt(params) {
    const now = Date.now();
    const lines = params.content.split('\n');
    const maxLineLen = Math.max(...lines.map((l) => l.length));
    const charWidth = (params.fontSize ?? 14) * 0.6;
    const lineHeight = (params.fontSize ?? 14) * 1.4;
    return {
        id: randomUUID(),
        type: 'ascii',
        layerId: params.layerId ?? 'default',
        content: params.content,
        x: params.x,
        y: params.y,
        width: params.width ?? Math.ceil(maxLineLen * charWidth) + 24,
        height: params.height ?? Math.ceil(lines.length * lineHeight) + 24,
        fontSize: params.fontSize ?? 14,
        fontFamily: params.fontFamily ?? 'monospace',
        color: params.color ?? '#e2e8f0',
        backgroundColor: params.backgroundColor ?? '#1e293b',
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        createdAt: now,
        updatedAt: now,
    };
}
//# sourceMappingURL=ascii-solver.js.map