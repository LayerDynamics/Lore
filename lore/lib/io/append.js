import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export function appendToFile(filePath, content) {
  mkdirSync(dirname(filePath), { recursive: true });
  appendFileSync(filePath, content, 'utf-8');
}

export function appendLine(filePath, line) {
  appendToFile(filePath, line + '\n');
}
