#!/usr/bin/env node
/**
 * MCP Trigger Gateway Server
 * A Model Context Protocol server that enables trigger-based automation
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { TriggerStorage } from './lib/storage.js';
import { ActionExecutor } from './lib/action-executor.js';
import { TriggerManager } from './lib/trigger-manager.js';
import { EventListener } from './listeners/event-listener.js';
import { WatchListener } from './listeners/watch-listener.js';
import { CronScheduler } from './cron/cron-scheduler.js';
import {
  TriggerConfigInputSchema,
  TriggerUpdateSchema,
} from './protocol/schemas.js';
import type { TriggerConfig } from './protocol/types.js';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdir } from 'node:fs/promises';

const SERVER_NAME = 'mcp-trigger-gateway';
const SERVER_VERSION = '0.1.0';

// Initialize core components
const dataDir = join(homedir(), '.mcp-trigger-gateway');
const storagePath = join(dataDir, 'triggers.json');

// Create data directory if it doesn't exist
await mkdir(dataDir, { recursive: true });

const storage = new TriggerStorage(storagePath);
const executor = new ActionExecutor();
const manager = new TriggerManager(storage, executor);
const eventListener = new EventListener();
const watchListener = new WatchListener();
const cronScheduler = new CronScheduler();

// Initialize storage
await storage.initialize();

// Wire up event handlers
eventListener.on(async (event) => {
  await manager.executeTrigger(event);
});

cronScheduler.on(async (event) => {
  await manager.executeTrigger(event);
});

watchListener.on(async (event) => {
  await manager.executeTrigger(event);
});

// Load active triggers
const activeTriggers = await storage.getActive();
for (const trigger of activeTriggers) {
  if (trigger.type === 'event') {
    eventListener.registerTrigger(trigger);
  } else if (trigger.type === 'cron') {
    cronScheduler.registerTrigger(trigger);
  } else if (trigger.type === 'watch') {
    watchListener.registerTrigger(trigger);
  }
  // 'manual' triggers need no listener — they fire via execute_trigger tool
}

// Create MCP server
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const tools: Tool[] = [
  {
    name: 'create_trigger',
    description: 'Create a new trigger that can execute actions based on events, schedules, or webhooks',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Human-readable trigger name' },
        description: { type: 'string', description: 'Optional description' },
        type: {
          type: 'string',
          enum: ['cron', 'webhook', 'event', 'watch', 'manual'],
          description: 'Type of trigger',
        },
        config: {
          type: 'object',
          description: 'Trigger-specific configuration',
        },
        actions: {
          type: 'array',
          description: 'Actions to execute when triggered',
          items: {
            type: 'object',
          },
        },
      },
      required: ['name', 'type', 'config', 'actions'],
    },
  },
  {
    name: 'list_triggers',
    description: 'List all configured triggers with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['cron', 'webhook', 'event', 'watch', 'manual'],
          description: 'Filter by trigger type',
        },
        status: {
          type: 'string',
          enum: ['active', 'paused', 'disabled', 'error'],
          description: 'Filter by trigger status',
        },
      },
    },
  },
  {
    name: 'get_trigger',
    description: 'Get details of a specific trigger by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Trigger ID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'update_trigger',
    description: 'Update an existing trigger',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Trigger ID to update' },
        name: { type: 'string', description: 'New name' },
        description: { type: 'string', description: 'New description' },
        status: {
          type: 'string',
          enum: ['active', 'paused', 'disabled'],
          description: 'New status',
        },
        config: {
          type: 'object',
          description: 'New trigger configuration',
        },
        actions: {
          type: 'array',
          description: 'New actions',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_trigger',
    description: 'Delete a trigger',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Trigger ID to delete' },
      },
      required: ['id'],
    },
  },
  {
    name: 'fire_event',
    description: 'Manually fire an event to trigger event-based triggers',
    inputSchema: {
      type: 'object',
      properties: {
        eventName: { type: 'string', description: 'Name of the event' },
        payload: {
          type: 'object',
          description: 'Event payload data',
        },
      },
      required: ['eventName'],
    },
  },
  {
    name: 'execute_trigger',
    description: 'Manually execute a specific trigger',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Trigger ID to execute' },
        payload: {
          type: 'object',
          description: 'Optional payload data',
        },
      },
      required: ['id'],
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_trigger': {
        const validated = TriggerConfigInputSchema.parse(args);
        const trigger = await manager.createTrigger(validated);

        // Register with appropriate listener
        if (trigger.type === 'event') {
          eventListener.registerTrigger(trigger);
        } else if (trigger.type === 'cron') {
          cronScheduler.registerTrigger(trigger);
        } else if (trigger.type === 'watch') {
          watchListener.registerTrigger(trigger);
        }
        // 'manual' triggers need no listener — they fire via execute_trigger tool

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  trigger,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'list_triggers': {
        const triggers = await manager.listTriggers(args as {
          type?: string;
          status?: 'active' | 'paused' | 'disabled' | 'error';
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  count: triggers.length,
                  triggers,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_trigger': {
        const { id } = args as { id: string };
        const trigger = await manager.getTrigger(id);
        if (!trigger) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'Trigger not found',
                }),
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, trigger }, null, 2),
            },
          ],
        };
      }

      case 'update_trigger': {
        const validated = TriggerUpdateSchema.parse(args);
        const { id, ...updates } = validated;
        // Type cast needed due to zod optional vs TS Partial difference
        const trigger = await manager.updateTrigger(id, updates as Partial<Omit<TriggerConfig, 'id' | 'createdAt' | 'updatedAt'>>);

        if (!trigger) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'Trigger not found',
                }),
              },
            ],
            isError: true,
          };
        }

        // Re-register with listeners if type changed
        if (trigger.type === 'event') {
          eventListener.registerTrigger(trigger);
        } else if (trigger.type === 'cron') {
          cronScheduler.registerTrigger(trigger);
        } else if (trigger.type === 'watch') {
          watchListener.registerTrigger(trigger);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: true, trigger }, null, 2),
            },
          ],
        };
      }

      case 'delete_trigger': {
        const { id } = args as { id: string };
        const deleted = await manager.deleteTrigger(id);

        // Unregister from listeners
        eventListener.unregisterTrigger(id);
        cronScheduler.unregisterTrigger(id);
        watchListener.unregisterTrigger(id);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: deleted }),
            },
          ],
        };
      }

      case 'fire_event': {
        const { eventName, payload } = args as {
          eventName: string;
          payload?: unknown;
        };
        eventListener.emitEvent(eventName, payload);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Event '${eventName}' fired`,
              }),
            },
          ],
        };
      }

      case 'execute_trigger': {
        const { id, payload } = args as { id: string; payload?: unknown };
        const result = await manager.executeTrigger({
          triggerId: id,
          timestamp: new Date().toISOString(),
          payload,
          source: 'manual',
        });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Unknown tool: ${name}`,
              }),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error),
          }),
        },
      ],
      isError: true,
    };
  }
});

// Graceful shutdown handling
const shutdown = async () => {
  console.error('Shutting down MCP Trigger Gateway...');
  await eventListener.stop();
  await watchListener.stop();
  cronScheduler.stop();
  await server.close();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Trigger Gateway server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
