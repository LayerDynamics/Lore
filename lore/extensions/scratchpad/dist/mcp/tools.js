export const tools = [
    {
        name: 'scratchpad_open',
        description: 'Open or ensure the scratchpad canvas window is running in the browser.',
        inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
        name: 'scratchpad_draw_shape',
        description: 'Draw a shape on the canvas (rect, circle, line, polygon, or freehand path).',
        inputSchema: {
            type: 'object',
            properties: {
                shapeType: { type: 'string', enum: ['rect', 'circle', 'line', 'polygon', 'path'] },
                x: { type: 'number' },
                y: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
                radius: { type: 'number' },
                fill: { type: 'string' },
                stroke: { type: 'string' },
                strokeWidth: { type: 'number' },
                points: { type: 'array', items: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } } } },
                layerId: { type: 'string' },
            },
            required: ['shapeType', 'x', 'y'],
        },
    },
    {
        name: 'scratchpad_add_text',
        description: 'Place text on the canvas with customizable font, color, and alignment.',
        inputSchema: {
            type: 'object',
            properties: {
                content: { type: 'string' },
                x: { type: 'number' },
                y: { type: 'number' },
                fontSize: { type: 'number' },
                fontFamily: { type: 'string' },
                color: { type: 'string' },
                align: { type: 'string', enum: ['left', 'center', 'right'] },
                bold: { type: 'boolean' },
                italic: { type: 'boolean' },
                width: { type: 'number' },
                height: { type: 'number' },
                layerId: { type: 'string' },
            },
            required: ['content', 'x', 'y'],
        },
    },
    {
        name: 'scratchpad_add_image',
        description: 'Place an image on the canvas from a URL or base64 data URI.',
        inputSchema: {
            type: 'object',
            properties: {
                src: { type: 'string' },
                x: { type: 'number' },
                y: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
                alt: { type: 'string' },
                objectFit: { type: 'string', enum: ['contain', 'cover', 'fill'] },
                layerId: { type: 'string' },
            },
            required: ['src', 'x', 'y'],
        },
    },
    {
        name: 'scratchpad_ascii_art',
        description: 'Render an ASCII art block on the canvas with monospace styling.',
        inputSchema: {
            type: 'object',
            properties: {
                content: { type: 'string' },
                x: { type: 'number' },
                y: { type: 'number' },
                fontSize: { type: 'number' },
                color: { type: 'string' },
                backgroundColor: { type: 'string' },
                width: { type: 'number' },
                height: { type: 'number' },
                layerId: { type: 'string' },
            },
            required: ['content', 'x', 'y'],
        },
    },
    {
        name: 'scratchpad_render_markdown',
        description: 'Render a markdown block on the canvas.',
        inputSchema: {
            type: 'object',
            properties: {
                content: { type: 'string' },
                x: { type: 'number' },
                y: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
                fontSize: { type: 'number' },
                color: { type: 'string' },
                backgroundColor: { type: 'string' },
                layerId: { type: 'string' },
            },
            required: ['content', 'x', 'y'],
        },
    },
    {
        name: 'scratchpad_clear',
        description: 'Clear the canvas or a specific layer.',
        inputSchema: {
            type: 'object',
            properties: {
                layerId: { type: 'string' },
            },
            required: [],
        },
    },
    {
        name: 'scratchpad_undo',
        description: 'Undo the last canvas action.',
        inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
        name: 'scratchpad_redo',
        description: 'Redo the last undone canvas action.',
        inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
        name: 'scratchpad_set_background',
        description: 'Set the canvas background color.',
        inputSchema: {
            type: 'object',
            properties: {
                color: { type: 'string' },
            },
            required: ['color'],
        },
    },
    {
        name: 'scratchpad_get_state',
        description: 'Return the current canvas state including all objects and layers.',
        inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
        name: 'scratchpad_save',
        description: 'Save the current canvas state to a JSON file.',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: { type: 'string' },
            },
            required: ['filePath'],
        },
    },
    {
        name: 'scratchpad_load',
        description: 'Load canvas state from a JSON file.',
        inputSchema: {
            type: 'object',
            properties: {
                filePath: { type: 'string' },
            },
            required: ['filePath'],
        },
    },
    {
        name: 'scratchpad_create_layer',
        description: 'Create a new named layer on the canvas.',
        inputSchema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
            },
            required: ['name'],
        },
    },
    {
        name: 'scratchpad_delete_object',
        description: 'Delete a canvas object by its ID.',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
            },
            required: ['id'],
        },
    },
    {
        name: 'scratchpad_move_object',
        description: 'Move or resize a canvas object by its ID.',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                x: { type: 'number' },
                y: { type: 'number' },
                width: { type: 'number' },
                height: { type: 'number' },
                rotation: { type: 'number' },
            },
            required: ['id'],
        },
    },
];
//# sourceMappingURL=tools.js.map