/**
 * Core protocol types for the MCP Trigger Gateway
 */

export type TriggerType =
  | 'cron'      // Time-based cron triggers
  | 'webhook'   // HTTP webhook triggers
  | 'event'     // Event-based triggers
  | 'watch'     // File/resource watch triggers
  | 'manual';   // Manual invocation triggers

export type TriggerStatus = 'active' | 'paused' | 'disabled' | 'error';

export interface TriggerConfig {
  id: string;
  name: string;
  description?: string | undefined;
  type: TriggerType;
  status: TriggerStatus;
  config: TriggerTypeConfig;
  actions: TriggerAction[];
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string | undefined;
}

export type TriggerTypeConfig =
  | CronConfig
  | WebhookConfig
  | EventConfig
  | WatchConfig
  | ManualConfig;

export interface CronConfig {
  type: 'cron';
  schedule: string; // Cron expression
  timezone?: string | undefined;
}

export interface WebhookConfig {
  type: 'webhook';
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | undefined;
  auth?: {
    type: 'bearer' | 'basic' | 'apikey';
    token?: string | undefined;
  } | undefined;
}

export interface EventConfig {
  type: 'event';
  eventName: string;
  source?: string | undefined;
  filter?: Record<string, unknown> | undefined;
}

export interface WatchConfig {
  type: 'watch';
  path: string;
  events?: ('create' | 'modify' | 'delete')[] | undefined;
  pattern?: string | undefined;
}

export interface ManualConfig {
  type: 'manual';
}

export interface McpCallAction {
  type: 'mcp_call';
  server: string;        // MCP server name
  tool: string;          // Tool name to call
  arguments: Record<string, unknown>;
}

export interface HttpAction {
  type: 'http';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string> | undefined;
  body?: unknown;
}

export interface ShellAction {
  type: 'shell';
  command: string;
  args?: string[] | undefined;
  env?: Record<string, string> | undefined;
}

export interface ChainAction {
  type: 'chain';
  triggers: string[];    // IDs of other triggers to fire
}

export type TriggerAction =
  | McpCallAction
  | HttpAction
  | ShellAction
  | ChainAction;

export interface TriggerEvent {
  triggerId: string;
  timestamp: string;
  payload?: unknown;
  source?: string | undefined;
}

export interface TriggerResult {
  success: boolean;
  triggerId: string;
  timestamp: string;
  results: ActionResult[];
  error?: string | undefined;
}

export interface ActionResult {
  action: TriggerAction;
  success: boolean;
  output?: unknown;
  error?: string | undefined;
  duration: number;
}
