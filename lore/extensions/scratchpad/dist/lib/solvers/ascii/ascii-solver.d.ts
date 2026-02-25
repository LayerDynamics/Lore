import type { AsciiObject } from '../../canvas/types.js';
export interface AsciiParams {
    content: string;
    x: number;
    y: number;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    width?: number;
    height?: number;
    layerId?: string;
}
export declare function createAsciiArt(params: AsciiParams): AsciiObject;
