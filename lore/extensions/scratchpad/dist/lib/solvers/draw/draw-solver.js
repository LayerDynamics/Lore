import { randomUUID } from 'node:crypto';
export function createShape(params) {
    const now = Date.now();
    return {
        id: randomUUID(),
        type: 'shape',
        shapeType: params.shapeType,
        layerId: params.layerId ?? 'default',
        x: params.x,
        y: params.y,
        width: params.width ?? (params.radius ? params.radius * 2 : 100),
        height: params.height ?? (params.radius ? params.radius * 2 : 100),
        radius: params.radius,
        fill: params.fill ?? '#3b82f6',
        stroke: params.stroke ?? '#1e40af',
        strokeWidth: params.strokeWidth ?? 2,
        points: params.points,
        pathData: params.pathData,
        anchors: params.anchors,
        closed: params.closed,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        createdAt: now,
        updatedAt: now,
    };
}
//# sourceMappingURL=draw-solver.js.map