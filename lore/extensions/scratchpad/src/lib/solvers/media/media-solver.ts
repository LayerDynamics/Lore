import { randomUUID } from 'node:crypto';
import type { ImageObject, MarkdownObject } from '../../canvas/types.js';

export interface ImageParams {
  src: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  alt?: string;
  objectFit?: 'contain' | 'cover' | 'fill';
  layerId?: string;
}

export function createImage(params: ImageParams): ImageObject {
  const now = Date.now();
  return {
    id: randomUUID(),
    type: 'image',
    layerId: params.layerId ?? 'default',
    src: params.src,
    alt: params.alt ?? '',
    objectFit: params.objectFit ?? 'contain',
    x: params.x,
    y: params.y,
    width: params.width ?? 300,
    height: params.height ?? 200,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    createdAt: now,
    updatedAt: now,
  };
}

export interface MarkdownParams {
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  layerId?: string;
}

export function createMarkdown(params: MarkdownParams): MarkdownObject {
  const now = Date.now();
  return {
    id: randomUUID(),
    type: 'markdown',
    layerId: params.layerId ?? 'default',
    content: params.content,
    x: params.x,
    y: params.y,
    width: params.width ?? 400,
    height: params.height ?? 300,
    fontSize: params.fontSize ?? 14,
    color: params.color ?? '#1e293b',
    backgroundColor: params.backgroundColor ?? '#f8fafc',
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    createdAt: now,
    updatedAt: now,
  };
}
