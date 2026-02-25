import { randomUUID } from 'node:crypto';
import type { TextObject } from '../../canvas/types.js';

export interface TypeParams {
  content: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  bold?: boolean;
  italic?: boolean;
  width?: number;
  height?: number;
  layerId?: string;
}

export function createText(params: TypeParams): TextObject {
  const now = Date.now();
  return {
    id: randomUUID(),
    type: 'text',
    layerId: params.layerId ?? 'default',
    content: params.content,
    x: params.x,
    y: params.y,
    width: params.width ?? 200,
    height: params.height ?? 40,
    fontSize: params.fontSize ?? 16,
    fontFamily: params.fontFamily ?? 'sans-serif',
    color: params.color ?? '#000000',
    align: params.align ?? 'left',
    bold: params.bold ?? false,
    italic: params.italic ?? false,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    createdAt: now,
    updatedAt: now,
  };
}
