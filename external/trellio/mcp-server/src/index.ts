#!/usr/bin/env node

/**
 * Trellio MCP Server Entry Point
 *
 * Custom MCP server providing full read/write control over the Trellio
 * productivity system with Trello, codebase management, and ADHD coaching.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createTrellioServer } from './server.js';

/**
 * Main entry point
 */
async function main() {
  try {
    // Create the MCP server instance
    const server = createTrellioServer();

    // Set up stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    // Log server startup (to stderr so it doesn't interfere with stdio protocol)
    console.error('Trellio MCP Server running on stdio');
  } catch (error) {
    console.error('Fatal error starting Trellio MCP Server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
main();
