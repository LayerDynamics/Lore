import express from 'express';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = dirname(fileURLToPath(import.meta.url));
export function createHttpServer(port) {
    const app = express();
    // Serve the single-page canvas UI
    app.get('/', (_req, res) => {
        const htmlPath = join(__dirname, '..', '..', '..', 'app', 'components', 'index.html');
        try {
            const html = readFileSync(htmlPath, 'utf-8');
            res.type('html').send(html);
        }
        catch {
            res.status(500).send('Canvas UI not found');
        }
    });
    const server = createServer(app);
    return { app, server, url: `http://localhost:${port}` };
}
//# sourceMappingURL=http-server.js.map