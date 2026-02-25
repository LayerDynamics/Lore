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
export declare function createImage(params: ImageParams): ImageObject;
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
export declare function createMarkdown(params: MarkdownParams): MarkdownObject;
