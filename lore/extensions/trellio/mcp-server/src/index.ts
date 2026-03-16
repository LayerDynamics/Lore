#!/usr/bin/env node

/**
 * Trellio MCP Server Entry Point
 *
 * Clean, project-agnostic Trello MCP server.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createTrellioServer } from './server.js';

async function main() {
  try {
    const server = createTrellioServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Trellio MCP Server running on stdio');
  } catch (error) {
    console.error('Fatal error starting Trellio MCP Server:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main();
