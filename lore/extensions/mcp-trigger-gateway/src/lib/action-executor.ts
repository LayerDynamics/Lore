/**
 * Executes trigger actions (MCP calls, HTTP requests, shell commands, chains)
 */
import type {
  TriggerAction,
  TriggerEvent,
  ActionResult,
  McpCallAction,
  HttpAction,
  ShellAction,
  ChainAction,
} from '../protocol/types.js';
import { spawn } from 'node:child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface ExecutionResult {
  success: boolean;
  results: ActionResult[];
  error?: string | undefined;
}

export class ActionExecutor {
  private mcpClients: Map<string, Client> = new Map();
  private mcpServerConfigs: Map<string, McpServerConfig> = new Map();

  async executeActions(actions: TriggerAction[], event: TriggerEvent): Promise<ExecutionResult> {
    const results: ActionResult[] = [];
    let allSuccess = true;

    for (const action of actions) {
      const startTime = Date.now();
      try {
        const result = await this.executeAction(action, event);
        const duration = Date.now() - startTime;

        results.push({
          action,
          success: result.success,
          output: result.output,
          error: result.error,
          duration,
        });

        if (!result.success) {
          allSuccess = false;
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        results.push({
          action,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          duration,
        });
        allSuccess = false;
      }
    }

    return {
      success: allSuccess,
      results,
    };
  }

  private async executeAction(
    action: TriggerAction,
    event: TriggerEvent
  ): Promise<{ success: boolean; output?: unknown; error?: string | undefined }> {
    switch (action.type) {
      case 'mcp_call':
        return this.executeMcpCall(action, event);
      case 'http':
        return this.executeHttp(action, event);
      case 'shell':
        return this.executeShell(action, event);
      case 'chain':
        return this.executeChain(action, event);
      default:
        return {
          success: false,
          error: `Unknown action type: ${(action as { type: string }).type}`,
        };
    }
  }

  private async getOrCreateClient(serverName: string): Promise<Client> {
    const existing = this.mcpClients.get(serverName);
    if (existing) {
      return existing;
    }

    const config = this.mcpServerConfigs.get(serverName);
    if (!config) {
      throw new Error(
        `No MCP server configuration found for "${serverName}". ` +
        `Register it with registerMcpServerConfig() first.`
      );
    }

    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args ?? [],
      env: { ...process.env, ...config.env } as Record<string, string>,
    });

    const client = new Client(
      { name: 'mcp-trigger-gateway', version: '0.1.0' },
      { capabilities: {} }
    );

    await client.connect(transport);
    this.mcpClients.set(serverName, client);
    return client;
  }

  private async executeMcpCall(
    action: McpCallAction,
    _event: TriggerEvent
  ): Promise<{ success: boolean; output?: unknown; error?: string | undefined }> {
    try {
      const client = await this.getOrCreateClient(action.server);

      const result = await client.callTool({
        name: action.tool,
        arguments: action.arguments,
      });

      const hasError = result.isError === true;

      return {
        success: !hasError,
        output: result.content,
        error: hasError
          ? `Tool ${action.tool} returned an error`
          : undefined,
      };
    } catch (error) {
      // Remove failed client so it reconnects next time
      this.mcpClients.delete(action.server);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeHttp(
    action: HttpAction,
    _event: TriggerEvent
  ): Promise<{ success: boolean; output?: unknown; error?: string | undefined }> {
    try {
      const fetchOptions: RequestInit = {
        method: action.method,
      };

      if (action.headers) {
        fetchOptions.headers = action.headers;
      }

      if (action.body) {
        fetchOptions.body = JSON.stringify(action.body);
      }

      const response = await fetch(action.url, fetchOptions);

      const contentType = response.headers.get('content-type');
      let output: unknown;

      if (contentType?.includes('application/json')) {
        output = await response.json();
      } else {
        output = await response.text();
      }

      return {
        success: response.ok,
        output,
        error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async executeShell(
    action: ShellAction,
    _event: TriggerEvent
  ): Promise<{ success: boolean; output?: unknown; error?: string | undefined }> {
    return new Promise((resolve) => {
      const proc = spawn(action.command, action.args || [], {
        env: { ...process.env, ...action.env },
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: stdout,
          });
        } else {
          resolve({
            success: false,
            output: stdout,
            error: stderr || `Process exited with code ${code}`,
          });
        }
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
        });
      });
    });
  }

  private async executeChain(
    action: ChainAction,
    _event: TriggerEvent
  ): Promise<{ success: boolean; output?: unknown; error?: string | undefined }> {
    // Chain triggers are handled by the trigger manager
    return {
      success: true,
      output: { chainedTriggers: action.triggers },
    };
  }

  registerMcpClient(serverName: string, client: Client): void {
    this.mcpClients.set(serverName, client);
  }

  registerMcpServerConfig(serverName: string, config: McpServerConfig): void {
    this.mcpServerConfigs.set(serverName, config);
  }
}
