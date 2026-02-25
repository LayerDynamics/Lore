import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { CanvasSnapshot } from '../canvas/types.js';

export async function saveCanvas(filePath: string, snapshot: CanvasSnapshot): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
}

export async function loadCanvas(filePath: string): Promise<CanvasSnapshot> {
  const data = await readFile(filePath, 'utf-8');
  return JSON.parse(data) as CanvasSnapshot;
}
