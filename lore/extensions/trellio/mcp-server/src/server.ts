/**
 * Trellio MCP Server
 *
 * Clean Trello-only MCP server. No coach, no codebase, no n8n.
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
import * as TrelloPrompts from './trello/prompts.js';

function log(level: 'INFO' | 'ERROR', message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  if (level === 'ERROR') {
    console.error(logMessage, data || '');
  } else {
    console.error(logMessage, data || '');
  }
}

export function createTrellioServer(): Server {
  const server = new Server(
    { name: 'trellio-mcp-server', version: '1.0.0' },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  );

  const config = getConfig();
  const trelloClient = new TrelloClient(config);

  const toolRegistry = new ToolRegistry();
  const resourceRegistry = new ResourceRegistry();

  toolRegistry.registerMultiple(createTrelloTools(trelloClient, config));
  resourceRegistry.registerMultiple(createTrelloResources(trelloClient, config));

  // Tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: toolRegistry.getAll().map((tool) => {
        const inputSchema = tool.inputSchema && typeof tool.inputSchema === 'object' && '_def' in tool.inputSchema
          ? zodToJsonSchema(tool.inputSchema as z.ZodSchema, { target: 'openApi3', $refStrategy: 'none' })
          : tool.inputSchema;
        return { name: tool.name, description: tool.description, inputSchema };
      }),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    log('INFO', `Tool called: ${name}`, args);

    try {
      const tool = toolRegistry.get(name);
      if (!tool) throw new Error(`Unknown tool: ${name}`);
      return await tool.handler(args || {});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log('ERROR', `Tool ${name} failed: ${errorMessage}`);

      let userMessage = `Error executing tool ${name}: ${errorMessage}`;
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        userMessage += '\n\nCheck your TRELLO_API_KEY and TRELLO_TOKEN.';
      } else if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
        userMessage += '\n\nVerify IDs (board, list, card) are correct.';
      } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        userMessage += '\n\nRate limit exceeded. Wait a moment and try again.';
      }

      return { content: [{ type: 'text', text: userMessage }], isError: true };
    }
  });

  // Resource handlers
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
      if (!resource) throw new Error(`Unknown resource: ${uri}`);
      const text = await resource.handler();
      return { contents: [{ uri, mimeType: resource.mimeType, text }] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { contents: [{ uri, mimeType: 'text/plain', text: `Error reading resource: ${errorMessage}` }] };
    }
  });

  // Prompt handlers
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        TrelloPrompts.morningPlanningPrompt,
        TrelloPrompts.weeklyReviewPrompt,
        TrelloPrompts.taskTriagePrompt,
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const prompts: Record<string, typeof TrelloPrompts.morningPlanningPrompt> = {
      morning_planning: TrelloPrompts.morningPlanningPrompt,
      weekly_review: TrelloPrompts.weeklyReviewPrompt,
      task_triage: TrelloPrompts.taskTriagePrompt,
    };

    const prompt = prompts[name];
    if (!prompt) throw new Error(`Unknown prompt: ${name}`);

    const messages = prompt.messages.map((msg) => {
      let text = msg.content.text;
      if (args) {
        Object.entries(args).forEach(([key, value]) => {
          text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
        });
      }
      return { role: msg.role, content: { type: msg.content.type, text } };
    });

    return { description: prompt.description, messages };
  });

  return server;
}
