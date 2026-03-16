/**
 * Tool and Resource Registry System
 */

import { z } from 'zod';

export type ToolHandler<T = any> = (...args: any[]) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>;

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema | object;
  handler: ToolHandler;
}

export type ResourceHandler = () => Promise<string>;

export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
  handler: ResourceHandler;
}

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
