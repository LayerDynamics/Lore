/**
 * Simple structured logger for daemon operation
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private level: LogLevel;
  private context: string;

  constructor(context: string, level: LogLevel = LogLevel.INFO) {
    this.context = context;
    this.level = level;
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (this.level <= LogLevel.DEBUG) {
      this.log('DEBUG', message, meta);
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    if (this.level <= LogLevel.INFO) {
      this.log('INFO', message, meta);
    }
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    if (this.level <= LogLevel.WARN) {
      this.log('WARN', message, meta);
    }
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>): void {
    if (this.level <= LogLevel.ERROR) {
      const errorMeta = error instanceof Error
        ? { error: error.message, stack: error.stack, ...meta }
        : { error: String(error), ...meta };
      this.log('ERROR', message, errorMeta);
    }
  }

  private log(level: string, message: string, meta?: Record<string, unknown>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...meta,
    };

    // Write to stderr for MCP servers (stdout is reserved for protocol)
    console.error(JSON.stringify(logEntry));
  }
}

export const createLogger = (context: string, level?: LogLevel): Logger => {
  const logLevelEnv = process.env['LOG_LEVEL'];
  const parsedLevel = logLevelEnv
    ? LogLevel[logLevelEnv as keyof typeof LogLevel]
    : level;
  return new Logger(context, parsedLevel);
};
