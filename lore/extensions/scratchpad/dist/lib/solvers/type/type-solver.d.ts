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
export declare function createText(params: TypeParams): TextObject;
