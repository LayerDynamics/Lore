import { runCLI } from "./src/interface/cli/index.ts";
import { FindLazyMCPServer } from "./src/interface/mcp/server.ts";

/**
 * Main entry point for FindLazy
 * Supports both CLI and MCP modes
 */
async function main(): Promise<void> {
  const args = Deno.args;

  // Check if MCP mode is requested
  const mcpMode =
    args.includes("--mcp") ||
    args.includes("mcp") ||
    Deno.env.get("FINDLAZY_MCP_MODE") === "true" ||
    Deno.env.get("MCP_MODE") === "true";

  if (mcpMode) {
    // Run as MCP server
    const server = new FindLazyMCPServer();
    await server.start();
  } else {
    // Run as CLI
    // Filter out --mcp flag if present
    const cliArgs = args.filter((arg) => arg !== "--mcp");
    await runCLI(cliArgs);
  }
}

// Run main if this is the entry point
if (import.meta.main) {
  await main();
}
