/**
 * Cron-based scheduler for time-triggered events
 * Simple implementation - for production use node-cron or similar
 */
import type { TriggerConfig, TriggerEvent } from '../protocol/types.js';
import type { EventHandler } from '../listeners/base-listener.js';

interface ScheduledJob {
  triggerId: string;
  schedule: string;
  intervalId?: NodeJS.Timeout;
}

export class CronScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private handlers: EventHandler[] = [];

  on(handler: EventHandler): void {
    this.handlers.push(handler);
  }

  registerTrigger(trigger: TriggerConfig): void {
    if (trigger.config.type !== 'cron') {
      return;
    }

    // Remove existing job if any
    this.unregisterTrigger(trigger.id);

    const job: ScheduledJob = {
      triggerId: trigger.id,
      schedule: trigger.config.schedule,
    };

    // For now, use simple interval-based scheduling
    // In production, parse cron expressions properly
    const intervalMs = this.parseCronToInterval(trigger.config.schedule);
    if (intervalMs) {
      job.intervalId = setInterval(() => {
        const event: TriggerEvent = {
          triggerId: trigger.id,
          timestamp: new Date().toISOString(),
          source: 'cron',
        };
        void this.emit(event);
      }, intervalMs);
    }

    this.jobs.set(trigger.id, job);
  }

  unregisterTrigger(triggerId: string): void {
    const job = this.jobs.get(triggerId);
    if (job?.intervalId) {
      clearInterval(job.intervalId);
    }
    this.jobs.delete(triggerId);
  }

  stop(): void {
    for (const job of this.jobs.values()) {
      if (job.intervalId) {
        clearInterval(job.intervalId);
      }
    }
    this.jobs.clear();
  }

  private async emit(event: TriggerEvent): Promise<void> {
    for (const handler of this.handlers) {
      await handler(event);
    }
  }

  private parseCronToInterval(schedule: string): number | null {
    // Very basic parsing - just handle some common patterns
    // For production, use a proper cron parser
    const parts = schedule.split(' ');
    if (parts.length < 5) {
      return null;
    }

    // Handle "*/X * * * *" pattern (every X minutes)
    if (parts[0]?.startsWith('*/')) {
      const minutes = parseInt(parts[0].substring(2), 10);
      if (!isNaN(minutes)) {
        return minutes * 60 * 1000;
      }
    }

    // Default to hourly if we can't parse
    return 60 * 60 * 1000;
  }
}
