/**
 * Tool and Resource Registry System
 *
 * Central registration system for MCP tools and resources.
 * Each module exports toolDefs and resourceDefs that are automatically registered.
 */

import { z } from 'zod';

/**
 * Tool handler function signature
 */
export type ToolHandler<T = any> = (...args: any[]) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

/**
 * Tool definition with schema and handler
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema | object; // Can be zod schema or JSON schema object
  handler: ToolHandler;
}

/**
 * Resource handler function signature
 */
export type ResourceHandler = () => Promise<string>;

/**
 * Resource definition with URI and handler
 */
export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handler: ResourceHandler;
}

/**
 * Registry for all tools
 */
export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();

  register(tool: ToolDefinition) {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} is already registered`);
    }
    this.tools.set(tool.name, tool);
  }

  registerMultiple(tools: ToolDefinition[]) {
    tools.forEach((tool) => this.register(tool));
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }
}

/**
 * Registry for all resources
 */
export class ResourceRegistry {
  private resources = new Map<string, ResourceDefinition>();

  register(resource: ResourceDefinition) {
    if (this.resources.has(resource.uri)) {
      throw new Error(`Resource ${resource.uri} is already registered`);
    }
    this.resources.set(resource.uri, resource);
  }

  registerMultiple(resources: ResourceDefinition[]) {
    resources.forEach((resource) => this.register(resource));
  }

  get(uri: string): ResourceDefinition | undefined {
    return this.resources.get(uri);
  }

  getAll(): ResourceDefinition[] {
    return Array.from(this.resources.values());
  }

  has(uri: string): boolean {
    return this.resources.has(uri);
  }
}
