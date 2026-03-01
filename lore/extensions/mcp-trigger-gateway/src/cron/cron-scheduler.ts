/**
 * Cron-based scheduler for time-triggered events
 * Supports standard 5-field cron expressions: minute hour day-of-month month day-of-week
 */
import type { TriggerConfig, TriggerEvent } from '../protocol/types.js';
import type { EventHandler } from '../listeners/base-listener.js';

interface CronField {
  values: Set<number>;
  any: boolean;
}

interface ParsedCron {
  minute: CronField;
  hour: CronField;
  dayOfMonth: CronField;
  month: CronField;
  dayOfWeek: CronField;
}

interface ScheduledJob {
  triggerId: string;
  schedule: string;
  parsed: ParsedCron | null;
  timerId?: NodeJS.Timeout;
}

const FIELD_RANGES: readonly (readonly [number, number])[] = [
  [0, 59],  // minute
  [0, 23],  // hour
  [1, 31],  // day of month
  [1, 12],  // month
  [0, 6],   // day of week (0=Sun)
] as const;

// Parse a single cron field: step (star-slash-5), list (1,15), range (0-23), single (3), wildcard (*)
function parseCronField(field: string, min: number, max: number): CronField | null {
  if (field === '*') {
    return { values: new Set(), any: true };
  }

  const values = new Set<number>();

  for (const part of field.split(',')) {
    // Step: */N or M-N/S
    const stepMatch = part.match(/^(\*|(\d+)-(\d+))\/(\d+)$/);
    if (stepMatch) {
      const stepStr = stepMatch[4];
      if (!stepStr) return null;
      const step = parseInt(stepStr, 10);
      if (step <= 0) return null;
      let rangeMin: number;
      let rangeMax: number;
      if (stepMatch[1] === '*') {
        rangeMin = min;
        rangeMax = max;
      } else {
        const sStr = stepMatch[2];
        const eStr = stepMatch[3];
        if (!sStr || !eStr) return null;
        rangeMin = parseInt(sStr, 10);
        rangeMax = parseInt(eStr, 10);
      }
      if (rangeMin < min || rangeMax > max || rangeMin > rangeMax) return null;
      for (let i = rangeMin; i <= rangeMax; i += step) {
        values.add(i);
      }
      continue;
    }

    // Range: M-N
    const rangeMatch = part.match(/^(\d+)-(\d+)$/);
    if (rangeMatch) {
      const sStr = rangeMatch[1];
      const eStr = rangeMatch[2];
      if (!sStr || !eStr) return null;
      const start = parseInt(sStr, 10);
      const end = parseInt(eStr, 10);
      if (start < min || end > max || start > end) return null;
      for (let i = start; i <= end; i++) {
        values.add(i);
      }
      continue;
    }

    // Single value
    const val = parseInt(part, 10);
    if (isNaN(val) || val < min || val > max) return null;
    values.add(val);
  }

  if (values.size === 0) return null;
  return { values, any: false };
}

/**
 * Parse a full 5-field cron expression.
 * Returns null if invalid.
 */
export function parseCronExpression(schedule: string): ParsedCron | null {
  const parts = schedule.trim().split(/\s+/);
  if (parts.length !== 5) return null;

  const fieldNames = ['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'] as const;
  const fields: Record<string, CronField> = {};

  for (let i = 0; i < 5; i++) {
    const range = FIELD_RANGES[i];
    const part = parts[i];
    if (!range || !part) return null;
    const parsed = parseCronField(part, range[0], range[1]);
    if (!parsed) return null;
    const name = fieldNames[i];
    if (!name) return null;
    fields[name] = parsed;
  }

  const m = fields['minute'];
  const h = fields['hour'];
  const dom = fields['dayOfMonth'];
  const mo = fields['month'];
  const dow = fields['dayOfWeek'];
  if (!m || !h || !dom || !mo || !dow) return null;

  return { minute: m, hour: h, dayOfMonth: dom, month: mo, dayOfWeek: dow };
}

function fieldMatches(field: CronField, value: number): boolean {
  return field.any || field.values.has(value);
}

/**
 * Compute the next Date that matches the parsed cron expression, starting
 * strictly after `after`. Searches up to 2 years ahead; returns null if
 * no match is found (e.g. impossible expression like Feb 31).
 */
export function getNextCronTime(parsed: ParsedCron, after: Date): Date | null {
  const candidate = new Date(after.getTime());
  // Advance to next minute boundary
  candidate.setSeconds(0, 0);
  candidate.setTime(candidate.getTime() + 60_000);

  const limit = after.getTime() + 2 * 365 * 24 * 60 * 60_000;

  while (candidate.getTime() < limit) {
    if (
      fieldMatches(parsed.month, candidate.getMonth() + 1) &&
      fieldMatches(parsed.dayOfMonth, candidate.getDate()) &&
      fieldMatches(parsed.dayOfWeek, candidate.getDay()) &&
      fieldMatches(parsed.hour, candidate.getHours()) &&
      fieldMatches(parsed.minute, candidate.getMinutes())
    ) {
      return candidate;
    }

    // Advance: skip larger units first for efficiency
    if (!fieldMatches(parsed.month, candidate.getMonth() + 1)) {
      candidate.setMonth(candidate.getMonth() + 1, 1);
      candidate.setHours(0, 0, 0, 0);
      continue;
    }
    if (
      !fieldMatches(parsed.dayOfMonth, candidate.getDate()) ||
      !fieldMatches(parsed.dayOfWeek, candidate.getDay())
    ) {
      candidate.setDate(candidate.getDate() + 1);
      candidate.setHours(0, 0, 0, 0);
      continue;
    }
    if (!fieldMatches(parsed.hour, candidate.getHours())) {
      candidate.setHours(candidate.getHours() + 1, 0, 0, 0);
      continue;
    }
    // Advance by 1 minute
    candidate.setTime(candidate.getTime() + 60_000);
  }

  return null;
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

    this.unregisterTrigger(trigger.id);

    const parsed = parseCronExpression(trigger.config.schedule);
    if (!parsed) {
      console.error(
        `[CronScheduler] Invalid cron expression "${trigger.config.schedule}" for trigger "${trigger.id}". Trigger will not be scheduled.`
      );
      return;
    }

    const job: ScheduledJob = {
      triggerId: trigger.id,
      schedule: trigger.config.schedule,
      parsed,
    };

    this.jobs.set(trigger.id, job);
    this.scheduleNext(job);
  }

  unregisterTrigger(triggerId: string): void {
    const job = this.jobs.get(triggerId);
    if (job?.timerId) {
      clearTimeout(job.timerId);
    }
    this.jobs.delete(triggerId);
  }

  stop(): void {
    for (const job of this.jobs.values()) {
      if (job.timerId) {
        clearTimeout(job.timerId);
      }
    }
    this.jobs.clear();
  }

  private scheduleNext(job: ScheduledJob): void {
    if (!job.parsed) return;

    const now = new Date();
    const next = getNextCronTime(job.parsed, now);

    if (!next) {
      console.error(
        `[CronScheduler] No upcoming match for "${job.schedule}" (trigger "${job.triggerId}"). Will not schedule.`
      );
      return;
    }

    const delayMs = next.getTime() - now.getTime();
    job.timerId = setTimeout(() => {
      const event: TriggerEvent = {
        triggerId: job.triggerId,
        timestamp: new Date().toISOString(),
        source: 'cron',
      };
      void this.emit(event);

      // Re-check that the job is still registered before scheduling next
      if (this.jobs.has(job.triggerId)) {
        this.scheduleNext(job);
      }
    }, delayMs);
  }

  private async emit(event: TriggerEvent): Promise<void> {
    for (const handler of this.handlers) {
      await handler(event);
    }
  }
}
