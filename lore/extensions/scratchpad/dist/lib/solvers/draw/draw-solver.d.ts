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
    anchors?: Array<{
        x: number;
        y: number;
        handleIn: Point | null;
        handleOut: Point | null;
    }>;
    closed?: boolean;
    layerId?: string;
}
export declare function createShape(params: DrawParams): ShapeObject;
