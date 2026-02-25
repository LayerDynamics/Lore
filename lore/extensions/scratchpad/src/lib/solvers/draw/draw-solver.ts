import { randomUUID } from 'node:crypto';
import type { ShapeObject, ShapeType, Point } from '../../canvas/types.js';

export interface DrawParams {
  shapeType: ShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  points?: Point[];
  pathData?: string;
  anchors?: Array<{ x: number; y: number; handleIn: Point | null; handleOut: Point | null }>;
  closed?: boolean;
  layerId?: string;
}

export function createShape(params: DrawParams): ShapeObject {
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
