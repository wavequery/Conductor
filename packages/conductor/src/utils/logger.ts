export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  enableTimestamp?: boolean;
  enableColors?: boolean;
  customFormatter?: (level: LogLevel, message: string, meta?: any) => string;
  transport?: (level: LogLevel, message: string, meta?: any) => void;
}

export class Logger {
  private config: Required<LoggerConfig>;
  private static instance: Logger;

  private readonly colors = {
    debug: "\x1b[34m", // blue
    info: "\x1b[32m", // green
    warn: "\x1b[33m", // yellow
    error: "\x1b[31m", // red
    reset: "\x1b[0m",
  };

  constructor(config: LoggerConfig) {
    this.config = {
      enableTimestamp: true,
      enableColors: true,
      prefix: "",
      customFormatter: undefined,
      transport: undefined,
      ...config,
    };
  }

  static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config || { level: LogLevel.INFO });
    }
    return Logger.instance;
  }

  debug(message: string, meta?: any): void {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: any): void {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, meta?: any): void {
    this.log(LogLevel.ERROR, message, meta);
  }

  private log(level: LogLevel, message: string, meta?: any): void {
    if (level < this.config.level) return;

    const formattedMessage = this.config.customFormatter
      ? this.config.customFormatter(level, message, meta)
      : this.formatMessage(level, message, meta);

    if (this.config.transport) {
      this.config.transport(level, formattedMessage, meta);
    } else {
      this.defaultTransport(level, formattedMessage);
    }
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const parts: string[] = [];

    if (this.config.enableTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    if (this.config.prefix) {
      parts.push(`[${this.config.prefix}]`);
    }

    parts.push(`[${LogLevel[level]}]`);
    parts.push(message);

    if (meta) {
      parts.push(JSON.stringify(meta, null, 2));
    }

    const finalMessage = parts.join(" ");
    return this.config.enableColors
      ? this.colorize(level, finalMessage)
      : finalMessage;
  }

  private colorize(level: LogLevel, message: string): string {
    const color = this.getColorForLevel(level);
    return `${color}${message}${this.colors.reset}`;
  }

  private getColorForLevel(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return this.colors.debug;
      case LogLevel.INFO:
        return this.colors.info;
      case LogLevel.WARN:
        return this.colors.warn;
      case LogLevel.ERROR:
        return this.colors.error;
      default:
        return this.colors.reset;
    }
  }

  private defaultTransport(level: LogLevel, message: string): void {
    switch (level) {
      case LogLevel.ERROR:
        console.error(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      default:
        console.log(message);
    }
  }
}
