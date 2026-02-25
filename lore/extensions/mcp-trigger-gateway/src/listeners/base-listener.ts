/**
 * Base class for event listeners
 */
import type { TriggerEvent } from '../protocol/types.js';

export type EventHandler = (event: TriggerEvent) => void | Promise<void>;

export abstract class BaseListener {
  protected handlers: EventHandler[] = [];

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;

  on(handler: EventHandler): void {
    this.handlers.push(handler);
  }

  off(handler: EventHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
    }
  }

  protected async emit(event: TriggerEvent): Promise<void> {
    for (const handler of this.handlers) {
      await handler(event);
    }
  }
}
