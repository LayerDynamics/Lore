/**
 * Trellio MCP Server
 *
 * Main server class that registers all tools, resources, and prompts
 * using a data-driven registry pattern.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';
import { getConfig } from './config.js';
import { TrelloClient } from './trello/client.js';
import { ToolRegistry, ResourceRegistry } from './registry.js';
import { createTrelloTools, createTrelloResources } from './trello/tool-registry.js';
import { createCoachTools } from './coach/tool-registry.js';
import { createCodebaseTools } from './codebase/registry.js';
import * as TrelloPrompts from './trello/prompts.js';

/**
 * Simple logger for request/error tracking
 */
function log(level: 'INFO' | 'ERROR', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;

  if (level === 'ERROR') {
    console.error(logMessage, data || '');
  } else {
    console.log(logMessage, data || '');
  }
}

/**
 * Create and configure the Trellio MCP server
 */
export function createTrellioServer(): Server {
  const server = new Server(
    {
      name: 'trellio-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // Load configuration
  const config = getConfig();

  // Initialize clients
  const trelloClient = new TrelloClient(config.trello);

  // Initialize registries
  const toolRegistry = new ToolRegistry();
  const resourceRegistry = new ResourceRegistry();

  // Register tools from all modules
  toolRegistry.registerMultiple(createTrelloTools(trelloClient, config.trello));
  toolRegistry.registerMultiple(createCoachTools(trelloClient, config.trello));
  toolRegistry.registerMultiple(createCodebaseTools(config.project.dir));

  // Register resources from all modules
  resourceRegistry.registerMultiple(createTrelloResources(trelloClient, config.trello));

  // ========================================================================
  // TOOL HANDLERS
  // ========================================================================

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: toolRegistry.getAll().map((tool) => {
        // Convert Zod schemas to JSON Schema
        const inputSchema = tool.inputSchema && typeof tool.inputSchema === 'object' && '_def' in tool.inputSchema
          ? zodToJsonSchema(tool.inputSchema as z.ZodSchema, { target: 'openApi3', $refStrategy: 'none' })
          : tool.inputSchema;

        return {
          name: tool.name,
          description: tool.description,
          inputSchema,
        };
      }),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    log('INFO', `Tool called: ${name}`, args);

    try {
      const tool = toolRegistry.get(name);
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      return await tool.handler(args || {});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      log('ERROR', `Tool ${name} failed: ${errorMessage}`, { args, stack: errorStack });

      // Return user-friendly error message
      let userMessage = `Error executing tool ${name}: ${errorMessage}`;

      // Add helpful context for common errors
      if (errorMessage.includes('ENOTFOUND')) {
        userMessage += '\n\nℹ️ Network error: Check that your Trello server is reachable.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        userMessage += '\n\nℹ️ Authentication error: Check your API keys and tokens.';
      } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        userMessage += '\n\nℹ️ Resource not found: Verify IDs (board, list, card) are correct.';
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        userMessage += '\n\nℹ️ Rate limit exceeded: Wait a moment and try again.';
      } else if (errorMessage.includes('Path outside project directory')) {
        userMessage += '\n\nℹ️ Security violation: File operations must stay within PROJECT_DIR.';
      } else if (errorMessage.includes('timeout')) {
        userMessage += '\n\nℹ️ Operation timed out: Try again or increase timeout limit.';
      }

      return {
        content: [
          {
            type: 'text',
            text: userMessage,
          },
        ],
        isError: true,
      };
    }
  });

  // ========================================================================
  // RESOURCE HANDLERS
  // ========================================================================

  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: resourceRegistry.getAll().map((resource) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType,
      })),
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    try {
      const resource = resourceRegistry.get(uri);
      if (!resource) {
        throw new Error(`Unknown resource: ${uri}`);
      }

      const text = await resource.handler();

      return {
        contents: [
          {
            uri,
            mimeType: resource.mimeType,
            text,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        contents: [
          {
            uri,
            mimeType: 'text/plain',
            text: `Error reading resource: ${errorMessage}`,
          },
        ],
      };
    }
  });

  // ========================================================================
  // PROMPT HANDLERS
  // ========================================================================

  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        TrelloPrompts.morningPlanningPrompt,
        TrelloPrompts.weeklyReviewPrompt,
        TrelloPrompts.taskTriagePrompt,
        TrelloPrompts.delegationHelperPrompt,
        TrelloPrompts.crashRecoveryPrompt,
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const prompts = {
      morning_planning: TrelloPrompts.morningPlanningPrompt,
      weekly_review: TrelloPrompts.weeklyReviewPrompt,
      task_triage: TrelloPrompts.taskTriagePrompt,
      delegation_helper: TrelloPrompts.delegationHelperPrompt,
      crash_recovery: TrelloPrompts.crashRecoveryPrompt,
    };

    const prompt = prompts[name as keyof typeof prompts];
    if (!prompt) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    // Replace {{placeholders}} in prompt messages with argument values
    const messages = prompt.messages.map((msg) => {
      let text = msg.content.text;
      if (args) {
        Object.entries(args).forEach(([key, value]) => {
          text = text.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
        });
      }
      return {
        role: msg.role,
        content: {
          type: msg.content.type,
          text,
        },
      };
    });

    return {
      description: prompt.description,
      messages,
    };
  });

  return server;
}
