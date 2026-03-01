/**
 * File/resource watch listener using fs.watch
 */
import { BaseListener } from './base-listener.js';
import type { TriggerConfig, TriggerEvent, WatchConfig } from '../protocol/types.js';
import { watch, type FSWatcher } from 'node:fs';


interface WatchEntry {
  trigger: TriggerConfig;
  watcher: FSWatcher;
}

export class WatchListener extends BaseListener {
  private watches: Map<string, WatchEntry> = new Map();

  async start(): Promise<void> {
    // Watch listener is always ready
  }

  async stop(): Promise<void> {
    for (const entry of this.watches.values()) {
      entry.watcher.close();
    }
    this.watches.clear();
  }

  registerTrigger(trigger: TriggerConfig): void {
    if (trigger.config.type !== 'watch') {
      return;
    }

    // Remove existing watcher for this trigger if any
    this.unregisterTrigger(trigger.id);

    const watchConfig = trigger.config as WatchConfig;
    const watchPath = watchConfig.path;
    const allowedEvents = watchConfig.events ?? ['create', 'modify', 'delete'];
    const pattern = watchConfig.pattern ? new RegExp(watchConfig.pattern) : null;

    try {
      const watcher = watch(watchPath, { recursive: true }, (eventType, filename) => {
        // Filter by pattern if configured
        if (pattern && filename && !pattern.test(filename)) {
          return;
        }

        // Map fs.watch event types to our event types
        const mappedEvent = eventType === 'rename' ? 'create' : 'modify';
        if (!allowedEvents.includes(mappedEvent)) {
          return;
        }

        const event: TriggerEvent = {
          triggerId: trigger.id,
          timestamp: new Date().toISOString(),
          payload: {
            eventType,
            filename,
            path: watchPath,
          },
          source: 'watch',
        };

        void this.emit(event);
      });

      watcher.on('error', (error) => {
        console.error(
          `[WatchListener] Error watching "${watchPath}" for trigger "${trigger.id}": ${error.message}`
        );
      });

      this.watches.set(trigger.id, { trigger, watcher });
    } catch (error) {
      console.error(
        `[WatchListener] Failed to watch "${watchPath}" for trigger "${trigger.id}": ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  unregisterTrigger(triggerId: string): void {
    const entry = this.watches.get(triggerId);
    if (entry) {
      entry.watcher.close();
      this.watches.delete(triggerId);
    }
  }
}
