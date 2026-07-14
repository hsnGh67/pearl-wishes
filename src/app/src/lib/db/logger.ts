/**
 * Database Operation Logger
 * Logs all database operations for debugging and auditing
 */

export enum LogLevel {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  DEBUG = "debug",
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  operation: string;
  table?: string;
  data?: any;
  error?: any;
}

class DatabaseLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private isEnabled = true;
  private supabaseConfigured = true;

  log(
    level: LogLevel,
    operation: string,
    meta?: { table?: string; data?: any; error?: any },
  ) {
    if (!this.isEnabled) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      operation,
      ...meta,
    };

    this.logs.push(entry);

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Check if this is a connection error (Supabase not configured)
    const isConnectionError = meta?.error?.message?.includes(
      "Failed to fetch",
    );

    // If Supabase is not configured, only log connection errors once
    if (isConnectionError) {
      if (this.supabaseConfigured) {
        this.supabaseConfigured = false;
        console.warn(
          "[DB] Supabase is not connected. Database operations will fail silently. Please configure Supabase in /src/config/supabase.ts",
        );
      }
      return; // Don't log subsequent connection errors
    }

    // Console output for non-connection errors
    const logMethod =
      level === LogLevel.ERROR
        ? "error"
        : level === LogLevel.WARN
          ? "warn"
          : "log";
    console[logMethod](
      `[DB ${level.toUpperCase()}] ${operation}`,
      meta,
    );
  }

  info(
    operation: string,
    meta?: { table?: string; data?: any },
  ) {
    this.log(LogLevel.INFO, operation, meta);
  }

  warn(
    operation: string,
    meta?: { table?: string; data?: any },
  ) {
    this.log(LogLevel.WARN, operation, meta);
  }

  error(
    operation: string,
    meta?: { table?: string; error?: any },
  ) {
    this.log(LogLevel.ERROR, operation, meta);
  }

  debug(
    operation: string,
    meta?: { table?: string; data?: any },
  ) {
    this.log(LogLevel.DEBUG, operation, meta);
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level);
    }
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }

  resetConnectionStatus() {
    this.supabaseConfigured = true;
  }
}

export const dbLogger = new DatabaseLogger();