/**
 * Core trigger management system
 */
import type { TriggerConfig, TriggerEvent, TriggerResult, TriggerStatus } from '../protocol/types.js';
import type { TriggerStorage } from './storage.js';
import type { ActionExecutor } from './action-executor.js';
import { randomUUID } from 'node:crypto';

export class TriggerManager {
  private storage: TriggerStorage;
  private executor: ActionExecutor;

  constructor(storage: TriggerStorage, executor: ActionExecutor) {
    this.storage = storage;
    this.executor = executor;

    // Wire chain execution back through the trigger manager
    this.executor.setChainExecutor(async (_triggerId, event) => {
      const result = await this.executeTrigger(event);
      return {
        success: result.success,
        results: result.results,
        error: result.error,
      };
    });
  }

  async createTrigger(input: Omit<TriggerConfig, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<TriggerConfig> {
    const now = new Date().toISOString();
    const trigger: TriggerConfig = {
      ...input,
      id: randomUUID(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };

    await this.storage.save(trigger);
    return trigger;
  }

  async getTrigger(id: string): Promise<TriggerConfig | undefined> {
    return this.storage.get(id);
  }

  async listTriggers(filter?: { type?: string; status?: TriggerStatus }): Promise<TriggerConfig[]> {
    let triggers = await this.storage.getAll();

    if (filter?.type) {
      triggers = triggers.filter(t => t.type === filter.type);
    }

    if (filter?.status) {
      triggers = triggers.filter(t => t.status === filter.status);
    }

    return triggers;
  }

  async updateTrigger(
    id: string,
    updates: Partial<Omit<TriggerConfig, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<TriggerConfig | undefined> {
    return this.storage.update(id, updates);
  }

  async deleteTrigger(id: string): Promise<boolean> {
    return this.storage.delete(id);
  }

  async setTriggerStatus(id: string, status: TriggerStatus): Promise<TriggerConfig | undefined> {
    return this.storage.update(id, { status });
  }

  async executeTrigger(event: TriggerEvent): Promise<TriggerResult> {
    const trigger = await this.storage.get(event.triggerId);

    if (!trigger) {
      return {
        success: false,
        triggerId: event.triggerId,
        timestamp: new Date().toISOString(),
        results: [],
        error: 'Trigger not found',
      };
    }

    if (trigger.status !== 'active') {
      return {
        success: false,
        triggerId: event.triggerId,
        timestamp: new Date().toISOString(),
        results: [],
        error: `Trigger is ${trigger.status}`,
      };
    }

    // Update last triggered time
    await this.storage.update(trigger.id, {
      lastTriggered: event.timestamp,
    });

    // Execute all actions
    const result = await this.executor.executeActions(trigger.actions, event);

    return {
      success: result.success,
      triggerId: trigger.id,
      timestamp: new Date().toISOString(),
      results: result.results,
      error: result.error,
    };
  }
}
