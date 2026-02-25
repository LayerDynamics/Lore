/**
 * Event-based listener for custom events
 */
import { BaseListener } from './base-listener.js';
import type { TriggerConfig, TriggerEvent } from '../protocol/types.js';
import { EventEmitter } from 'node:events';

export class EventListener extends BaseListener {
  private emitter = new EventEmitter();
  private triggers: Map<string, TriggerConfig> = new Map();

  async start(): Promise<void> {
    // Event listener is always ready
  }

  async stop(): Promise<void> {
    this.emitter.removeAllListeners();
    this.triggers.clear();
  }

  registerTrigger(trigger: TriggerConfig): void {
    if (trigger.config.type !== 'event') {
      return;
    }

    this.triggers.set(trigger.id, trigger);

    const eventConfig = trigger.config;
    const eventName = eventConfig.eventName;
    const handler = (payload: unknown) => {
      const event: TriggerEvent = {
        triggerId: trigger.id,
        timestamp: new Date().toISOString(),
        payload,
        source: eventConfig.source,
      };

      // Apply filter if configured
      if (eventConfig.filter && payload) {
        const matches = this.matchesFilter(payload, eventConfig.filter);
        if (!matches) {
          return;
        }
      }

      void this.emit(event);
    };

    this.emitter.on(eventName, handler);
  }

  unregisterTrigger(triggerId: string): void {
    this.triggers.delete(triggerId);
  }

  emit(event: TriggerEvent): Promise<void> {
    return super.emit(event);
  }

  emitEvent(eventName: string, payload: unknown): void {
    this.emitter.emit(eventName, payload);
  }

  private matchesFilter(payload: unknown, filter: Record<string, unknown>): boolean {
    if (typeof payload !== 'object' || payload === null) {
      return false;
    }

    const payloadObj = payload as Record<string, unknown>;

    for (const [key, value] of Object.entries(filter)) {
      if (payloadObj[key] !== value) {
        return false;
      }
    }

    return true;
  }
}
