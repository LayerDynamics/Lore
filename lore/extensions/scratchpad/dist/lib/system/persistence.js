import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
export async function saveCanvas(filePath, snapshot) {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
}
export async function loadCanvas(filePath) {
    const data = await readFile(filePath, 'utf-8');
    return JSON.parse(data);
}
//# sourceMappingURL=persistence.js.map