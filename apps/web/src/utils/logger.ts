import { env } from "@/env";

/**
 * Development logger utility.
 * Only logs messages in development environment.
 */
class Logger {
  private readonly isDev: boolean;

  constructor() {
    this.isDev = !env.NEXT_PUBLIC_IS_PRODUCTION;
  }

  log(...args: unknown[]): void {
    if (this.isDev) {
      console.log(...args);
    }
  }

  info(...args: unknown[]): void {
    if (this.isDev) {
      console.info(...args);
    }
  }

  warn(...args: unknown[]): void {
    if (this.isDev) {
      console.warn(...args);
    }
  }

  error(...args: unknown[]): void {
    if (this.isDev) {
      console.error(...args);
    }
  }

  debug(...args: unknown[]): void {
    if (this.isDev) {
      console.debug(...args);
    }
  }

  table(data: unknown): void {
    if (this.isDev) {
      console.table(data);
    }
  }
}

export const logger = new Logger();