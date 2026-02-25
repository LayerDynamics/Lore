import { Server } from "@modelcontextprotocol/sdk/server/index";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types";

import { scanTool, traceTool, getConfigTool } from "./tools.ts";
import { findingsResource, configResource, patternsResource } from "./resources.ts";
import { listPrompts, getPrompt } from "./prompts.ts";

/**
 * FindLazy MCP Server
 */
class FindLazyMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "findlazy",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      },
    );

    this.setupHandlers();
  }

  /**
   * Setup MCP request handlers
   */
  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, () => {
      return {
        tools: [
          {
            name: "scan_codebase",
            description: "Scan codebase for lazy/incomplete code patterns",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "Path to codebase to scan (default: current directory)",
                },
                format: {
                  type: "string",
                  enum: ["table", "json", "text", "compact"],
                  description: "Output format",
                  default: "json",
                },
              },
            },
          },
          {
            name: "trace_pattern",
            description: "Trace specific pattern in codebase",
            inputSchema: {
              type: "object",
              properties: {
                pattern: {
                  type: "string",
                  description: "Pattern to search for",
                },
                path: {
                  type: "string",
                  description: "Path to search in (default: current directory)",
                },
                regex: {
                  type: "boolean",
                  description: "Treat pattern as regex",
                  default: false,
                },
                ignoreCase: {
                  type: "boolean",
                  description: "Case insensitive search",
                  default: false,
                },
              },
              required: ["pattern"],
            },
          },
          {
            name: "get_config",
            description: "Get current FindLazy configuration",
            inputSchema: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "Path to project (default: current directory)",
                },
              },
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case "scan_codebase":
          return await scanTool(args || {});
        case "trace_pattern":
          return await traceTool(args || {});
        case "get_config":
          return await getConfigTool(args || {});
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });

    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, () => {
      return {
        resources: [
          {
            uri: "findlazy://findings/latest",
            name: "Latest Scan Findings",
            description: "Results from the most recent scan",
            mimeType: "application/json",
          },
          {
            uri: "findlazy://config/current",
            name: "Current Configuration",
            description: "Current FindLazy configuration",
            mimeType: "application/json",
          },
          {
            uri: "findlazy://patterns/all",
            name: "All Patterns",
            description: "All detection patterns (common, TypeScript, Python)",
            mimeType: "application/json",
          },
        ],
      };
    });

    // Handle resource reads
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      switch (uri) {
        case "findlazy://findings/latest":
          return await findingsResource();
        case "findlazy://config/current":
          return await configResource();
        case "findlazy://patterns/all":
          return await patternsResource();
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });

    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, () => {
      const prompts = listPrompts();
      return {
        prompts: prompts.map((p) => ({
          name: p.name,
          description: p.description,
          arguments: p.arguments,
        })),
      };
    });

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, (request) => {
      const { name, arguments: args } = request.params;
      return getPrompt(name, args || {});
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    const message = "FindLazy MCP Server running on stdio\n";
    await Deno.stderr.write(new TextEncoder().encode(message));
  }
}

// Start server if run directly
if (import.meta.main) {
  const server = new FindLazyMCPServer();
  await server.start();
}

export { FindLazyMCPServer };
