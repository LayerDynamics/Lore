/**
 * MCP Progress Notifications
 *
 * Provides progress tracking for long-running operations like codebase scans.
 * Sends periodic updates to MCP clients to show scan progress.
 */

import type { Server } from "@modelcontextprotocol/sdk/server/index";

export interface ProgressUpdate {
  current: number;
  total: number;
  message?: string;
}

export class ProgressTracker {
  private server: Server;
  private token: string;
  private lastUpdate: number = 0;
  private lastProgress: number = 0;
  private updateInterval: number = 2000; // Update every 2 seconds
  private progressThreshold: number = 10; // Or every 10 items

  constructor(server: Server, token: string) {
    this.server = server;
    this.token = token;
  }

  /**
   * Update progress if enough time or items have passed
   */
  async updateProgress(current: number, total: number, message?: string): Promise<void> {
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastUpdate;
    const progressSinceLastUpdate = current - this.lastProgress;

    // Send update if:
    // 1. Enough time has passed (2 seconds)
    // 2. Enough progress has been made (10 items)
    // 3. This is the first update (current === 0)
    // 4. This is the final update (current === total)
    const shouldUpdate =
      current === 0 ||
      current === total ||
      timeSinceLastUpdate >= this.updateInterval ||
      progressSinceLastUpdate >= this.progressThreshold;

    if (shouldUpdate) {
      await this.sendUpdate(current, total, message);
      this.lastUpdate = now;
      this.lastProgress = current;
    }
  }

  /**
   * Send progress notification to MCP server
   */
  private async sendUpdate(current: number, total: number, message?: string): Promise<void> {
    try {
      await this.server.notification({
        method: "notifications/progress",
        params: {
          progressToken: this.token,
          progress: current,
          total,
          message,
        },
      });
    } catch (_error) {
      // Silently fail if client doesn't support progress notifications
      // This is expected for some MCP clients
    }
  }

  /**
   * Mark progress as complete
   */
  async complete(message?: string): Promise<void> {
    // Send a final update with current === total to indicate completion
    await this.sendUpdate(100, 100, message || "Complete");
  }

  /**
   * Set the minimum interval between updates (in milliseconds)
   */
  setUpdateInterval(intervalMs: number): void {
    this.updateInterval = intervalMs;
  }

  /**
   * Set the minimum progress threshold between updates
   */
  setProgressThreshold(threshold: number): void {
    this.progressThreshold = threshold;
  }
}

/**
 * Create a progress tracker if a progress token is provided
 */
export function createProgressTracker(
  server: Server,
  token: string | undefined,
): ProgressTracker | null {
  if (!token) {
    return null;
  }
  return new ProgressTracker(server, token);
}

/**
 * Helper to safely update progress (noop if tracker is null)
 */
export async function updateProgress(
  tracker: ProgressTracker | null,
  current: number,
  total: number,
  message?: string,
): Promise<void> {
  if (tracker) {
    await tracker.updateProgress(current, total, message);
  }
}
