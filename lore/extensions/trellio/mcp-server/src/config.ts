/**
 * Configuration loader for Trellio MCP Server
 *
 * Required: TRELLO_API_KEY, TRELLO_TOKEN
 * Optional: TRELLO_BOARD_ID (default board, discoverable via trello_list_boards)
 */

import { z } from 'zod';
import type { TrelloConfig } from './types.js';

const configSchema = z.object({
  apiKey: z.string().min(1, 'TRELLO_API_KEY is required'),
  token: z.string().min(1, 'TRELLO_TOKEN is required'),
  defaultBoardId: z.string().optional(),
});

export function loadConfig(): TrelloConfig {
  const rawConfig = {
    apiKey: process.env.TRELLO_API_KEY || '',
    token: process.env.TRELLO_TOKEN || '',
    defaultBoardId: process.env.TRELLO_BOARD_ID || undefined,
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.message).join('\n');
      throw new Error(`Configuration validation failed:\n${missingVars}`);
    }
    throw error;
  }
}

let configInstance: TrelloConfig | null = null;

export function getConfig(): TrelloConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}
