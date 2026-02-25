export interface Point {
    x: number;
    y: number;
}
export type ShapeType = 'rect' | 'circle' | 'line' | 'polygon' | 'path';
export interface BaseObject {
    id: string;
    layerId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    opacity: number;
    visible: boolean;
    locked: boolean;
    createdAt: number;
    updatedAt: number;
}
export interface ShapeObject extends BaseObject {
    type: 'shape';
    shapeType: ShapeType;
    fill: string;
    stroke: string;
    strokeWidth: number;
    points?: Point[];
    pathData?: string;
    anchors?: Array<{
        x: number;
        y: number;
        handleIn: Point | null;
        handleOut: Point | null;
    }>;
    closed?: boolean;
    radius?: number;
}
export interface TextObject extends BaseObject {
    type: 'text';
    content: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    align: 'left' | 'center' | 'right';
    bold: boolean;
    italic: boolean;
}
export interface ImageObject extends BaseObject {
    type: 'image';
    src: string;
    alt: string;
    objectFit: 'contain' | 'cover' | 'fill';
}
export interface AsciiObject extends BaseObject {
    type: 'ascii';
    content: string;
    fontSize: number;
    fontFamily: string;
    color: string;
    backgroundColor: string;
}
export interface MarkdownObject extends BaseObject {
    type: 'markdown';
    content: string;
    fontSize: number;
    color: string;
    backgroundColor: string;
}
export type CanvasObject = ShapeObject | TextObject | ImageObject | AsciiObject | MarkdownObject;
export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    order: number;
}
export interface CanvasSnapshot {
    objects: CanvasObject[];
    layers: Layer[];
    background: string;
    width: number;
    height: number;
}
export interface WsMessage {
    type: string;
    payload: Record<string, unknown>;
}
