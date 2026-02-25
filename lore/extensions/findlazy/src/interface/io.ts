/**
 * Shared I/O utilities for CLI and MCP interfaces.
 * Provides a unified abstraction for output formatting and input handling
 * that works in both CLI (stderr/stdout) and MCP (notification) contexts.
 */

export type OutputLevel = "info" | "warn" | "error" | "debug" | "success";

export interface OutputWriter {
  write(message: string, level?: OutputLevel): void;
  progress(current: number, total: number, message?: string): void;
}

/**
 * CLI output writer — writes to stderr for logs, stdout for results.
 */
export class CLIWriter implements OutputWriter {
  private encoder = new TextEncoder();
  private colors: boolean;

  constructor(options: { colors?: boolean } = {}) {
    this.colors = options.colors !== false;
  }

  write(message: string, level: OutputLevel = "info"): void {
    const prefix = this.colors ? this.colorize(level) : `[${level}]`;
    const line = `${prefix} ${message}\n`;
    Deno.stderr.writeSync(this.encoder.encode(line));
  }

  progress(current: number, total: number, message?: string): void {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    const bar = this.renderBar(pct);
    const msg = message ? ` ${message}` : "";
    const line = `\r${bar} ${pct}%${msg}`;
    Deno.stderr.writeSync(this.encoder.encode(line));
    if (current >= total) {
      Deno.stderr.writeSync(this.encoder.encode("\n"));
    }
  }

  private colorize(level: OutputLevel): string {
    const codes: Record<OutputLevel, string> = {
      info: "\x1b[36m[info]\x1b[0m",
      warn: "\x1b[33m[warn]\x1b[0m",
      error: "\x1b[31m[error]\x1b[0m",
      debug: "\x1b[90m[debug]\x1b[0m",
      success: "\x1b[32m[ok]\x1b[0m",
    };
    return codes[level];
  }

  private renderBar(pct: number): string {
    const width = 20;
    const filled = Math.round(width * (pct / 100));
    const empty = width - filled;
    return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
  }
}

/**
 * Silent writer — discards all output. Useful for testing.
 */
export class SilentWriter implements OutputWriter {
  write(_message: string, _level?: OutputLevel): void {}
  progress(_current: number, _total: number, _message?: string): void {}
}

/**
 * Buffer writer — captures output for later retrieval.
 */
export class BufferWriter implements OutputWriter {
  readonly entries: Array<{ message: string; level: OutputLevel }> = [];

  write(message: string, level: OutputLevel = "info"): void {
    this.entries.push({ message, level });
  }

  progress(_current: number, _total: number, _message?: string): void {
    // Progress not captured in buffer
  }

  flush(): string {
    return this.entries.map((e) => `[${e.level}] ${e.message}`).join("\n");
  }

  clear(): void {
    this.entries.length = 0;
  }
}

/**
 * Create the default writer based on environment.
 */
export function createWriter(options: { colors?: boolean; silent?: boolean } = {}): OutputWriter {
  if (options.silent) return new SilentWriter();
  return new CLIWriter({ colors: options.colors });
}
