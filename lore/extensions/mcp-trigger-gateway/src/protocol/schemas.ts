/**
 * Zod schemas for validating MCP tool inputs
 */
import { z } from 'zod';

export const CronConfigSchema = z.object({
  type: z.literal('cron'),
  schedule: z.string().describe('Cron expression (e.g., "0 9 * * *" for daily at 9am)'),
  timezone: z.string().optional().describe('IANA timezone (e.g., "America/New_York")'),
});

export const WebhookConfigSchema = z.object({
  type: z.literal('webhook'),
  path: z.string().describe('Webhook path (e.g., "/webhook/my-trigger")'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional(),
  auth: z.object({
    type: z.enum(['bearer', 'basic', 'apikey']),
    token: z.string().optional(),
  }).optional(),
});

export const EventConfigSchema = z.object({
  type: z.literal('event'),
  eventName: z.string().describe('Name of the event to listen for'),
  source: z.string().optional().describe('Optional source filter'),
  filter: z.record(z.unknown()).optional().describe('Optional event payload filter'),
});

export const WatchConfigSchema = z.object({
  type: z.literal('watch'),
  path: z.string().describe('File or directory path to watch'),
  events: z.array(z.enum(['create', 'modify', 'delete'])).optional(),
  pattern: z.string().optional().describe('Glob pattern for file matching'),
});

export const ManualConfigSchema = z.object({
  type: z.literal('manual'),
});

export const McpCallActionSchema = z.object({
  type: z.literal('mcp_call'),
  server: z.string().describe('MCP server name to call'),
  tool: z.string().describe('Tool name on the MCP server'),
  arguments: z.record(z.unknown()).describe('Arguments to pass to the tool'),
});

export const HttpActionSchema = z.object({
  type: z.literal('http'),
  url: z.string().url().describe('HTTP endpoint URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  headers: z.record(z.string()).optional(),
  body: z.unknown().optional(),
});

export const ShellActionSchema = z.object({
  type: z.literal('shell'),
  command: z.string().describe('Shell command to execute'),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
});

export const ChainActionSchema = z.object({
  type: z.literal('chain'),
  triggers: z.array(z.string()).describe('IDs of triggers to execute in sequence'),
});

export const TriggerActionSchema = z.discriminatedUnion('type', [
  McpCallActionSchema,
  HttpActionSchema,
  ShellActionSchema,
  ChainActionSchema,
]);

export const TriggerConfigInputSchema = z.object({
  name: z.string().describe('Human-readable trigger name'),
  description: z.string().optional().describe('Optional description'),
  type: z.enum(['cron', 'webhook', 'event', 'watch', 'manual']),
  config: z.discriminatedUnion('type', [
    CronConfigSchema,
    WebhookConfigSchema,
    EventConfigSchema,
    WatchConfigSchema,
    ManualConfigSchema,
  ]),
  actions: z.array(TriggerActionSchema).describe('Actions to execute when triggered'),
});

export const TriggerUpdateSchema = z.object({
  id: z.string().describe('Trigger ID to update'),
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'paused', 'disabled']).optional(),
  config: z.discriminatedUnion('type', [
    CronConfigSchema,
    WebhookConfigSchema,
    EventConfigSchema,
    WatchConfigSchema,
    ManualConfigSchema,
  ]).optional(),
  actions: z.array(TriggerActionSchema).optional(),
});
