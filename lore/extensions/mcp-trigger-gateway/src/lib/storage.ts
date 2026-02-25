/**
 * Storage layer for trigger configurations
 * Uses in-memory storage with optional file persistence
 */
import type { TriggerConfig } from '../protocol/types.js';
import { promises as fs } from 'node:fs';

export class TriggerStorage {
  private triggers: Map<string, TriggerConfig> = new Map();
  private storagePath: string | undefined;

  constructor(storagePath?: string) {
    this.storagePath = storagePath;
  }

  async initialize(): Promise<void> {
    if (this.storagePath) {
      try {
        const data = await fs.readFile(this.storagePath, 'utf-8');
        const triggers: TriggerConfig[] = JSON.parse(data);
        triggers.forEach(trigger => {
          this.triggers.set(trigger.id, trigger);
        });
      } catch (error) {
        // File doesn't exist yet, that's ok
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          throw error;
        }
      }
    }
  }

  async save(trigger: TriggerConfig): Promise<void> {
    this.triggers.set(trigger.id, trigger);
    await this.persist();
  }

  async get(id: string): Promise<TriggerConfig | undefined> {
    return this.triggers.get(id);
  }

  async getAll(): Promise<TriggerConfig[]> {
    return Array.from(this.triggers.values());
  }

  async getByType(type: TriggerConfig['type']): Promise<TriggerConfig[]> {
    return Array.from(this.triggers.values()).filter(t => t.type === type);
  }

  async getActive(): Promise<TriggerConfig[]> {
    return Array.from(this.triggers.values()).filter(t => t.status === 'active');
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.triggers.delete(id);
    if (deleted) {
      await this.persist();
    }
    return deleted;
  }

  async update(id: string, updates: Partial<TriggerConfig>): Promise<TriggerConfig | undefined> {
    const trigger = this.triggers.get(id);
    if (!trigger) {
      return undefined;
    }

    const updated = {
      ...trigger,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    this.triggers.set(id, updated);
    await this.persist();
    return updated;
  }

  private async persist(): Promise<void> {
    if (this.storagePath) {
      const triggers = Array.from(this.triggers.values());
      await fs.writeFile(this.storagePath, JSON.stringify(triggers, null, 2), 'utf-8');
    }
  }

  async clear(): Promise<void> {
    this.triggers.clear();
    await this.persist();
  }
}
