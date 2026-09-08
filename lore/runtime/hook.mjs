#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { normalizeEvent } from './capabilities.mjs';

export async function handleHook(input) {
  const event = normalizeEvent(input);
  if (event.event === 'session-start') {
    const contract = await readFile(new URL('./contract.md', import.meta.url), 'utf8');
    return { hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: contract } };
  }
  if (event.event === 'stop' && /\b(done|complete|finished|passed)\b/i.test(event.lastMessage)) {
    return { systemMessage: 'Lore: report only observed verification results and identify any remaining acceptance criterion. This advisory does not block stopping or grant permissions.' };
  }
  return {};
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) {
  try {
    let input = '';
    for await (const chunk of process.stdin) {
      input += chunk;
      if (Buffer.byteLength(input) > 1024 * 1024) throw new Error('Hook input exceeds 1 MiB');
    }
    const output = await handleHook(JSON.parse(input));
    process.stdout.write(JSON.stringify(output) + '\n');
  } catch (error) {
    // Optional advisory hooks must not make the host unusable on bad input.
    process.stderr.write(`Lore advisory hook: ${error.message}\n`);
    process.stdout.write('{}\n');
  }
}
