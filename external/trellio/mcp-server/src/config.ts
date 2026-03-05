/**
 * Configuration loader and validator for Trellio MCP Server
 */

import { config as loadEnv } from 'dotenv';
import { z } from 'zod';
import type { ServerConfig } from './types.js';

// Load environment variables
loadEnv();

// Validation schema
const configSchema = z.object({
  trello: z.object({
    apiKey: z.string().min(1, 'TRELLO_API_KEY is required'),
    token: z.string().min(1, 'TRELLO_TOKEN is required'),
    boardId: z.string().optional().default(''),
    lists: z.object({
      reference: z.string().optional().default(''),
      thisWeek: z.string().optional().default(''),
      today: z.string().optional().default(''),
      doing: z.string().optional().default(''),
      done: z.string().optional().default(''),
    }),
    labels: z.object({
      highEnergy: z.string().optional().default(''),
      mediumEnergy: z.string().optional().default(''),
      lowEnergy: z.string().optional().default(''),
      brainDead: z.string().optional().default(''),
      dueSoon: z.string().optional().default(''),
    }),
  }),
  project: z.object({
    dir: z.string().min(1, 'PROJECT_DIR is required'),
  }),
});

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): ServerConfig {
  const rawConfig = {
    trello: {
      apiKey: process.env.TRELLO_API_KEY || '',
      token: process.env.TRELLO_TOKEN || '',
      boardId: process.env.TRELLO_BOARD_ID || '',
      lists: {
        reference: process.env.TRELLO_LIST_REFERENCE_ID || '',
        thisWeek: process.env.TRELLO_LIST_THIS_WEEK_ID || '',
        today: process.env.TRELLO_LIST_TODAY_ID || '',
        doing: process.env.TRELLO_LIST_DOING_ID || '',
        done: process.env.TRELLO_LIST_DONE_ID || '',
      },
      labels: {
        highEnergy: process.env.TRELLO_LABEL_HIGH_ENERGY_ID || '',
        mediumEnergy: process.env.TRELLO_LABEL_MEDIUM_ENERGY_ID || '',
        lowEnergy: process.env.TRELLO_LABEL_LOW_ENERGY_ID || '',
        brainDead: process.env.TRELLO_LABEL_BRAIN_DEAD_ID || '',
        dueSoon: process.env.TRELLO_LABEL_DUE_SOON_ID || '',
      },
    },
    project: {
      dir: process.env.PROJECT_DIR || '',
    },
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

/**
 * Get configuration singleton
 */
let configInstance: ServerConfig | null = null;

export function getConfig(): ServerConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}
