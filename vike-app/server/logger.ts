import fs from 'fs';
import path from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogEntry {
  timestamp: string;
  level: string;
  category: string;
  message: string;
  data?: unknown;
  error?: string;
}

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

const logDir = path.join(process.cwd(), 'logs');
const logLevelEnv = (process.env.LOG_LEVEL || 'INFO').toUpperCase();
const currentLogLevel = LogLevel[logLevelEnv as keyof typeof LogLevel] ?? LogLevel.INFO;

// 确保日志目录存在
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

class Logger {
  private category: string;

  constructor(category: string) {
    this.category = category;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private colorize(level: string, text: string): string {
    switch (level) {
      case 'ERROR':
        return `${colors.red}${text}${colors.reset}`;
      case 'WARN':
        return `${colors.yellow}${text}${colors.reset}`;
      case 'INFO':
        return `${colors.green}${text}${colors.reset}`;
      case 'DEBUG':
        return `${colors.blue}${text}${colors.reset}`;
      default:
        return text;
    }
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = `${colors.gray}[${entry.timestamp}]${colors.reset}`;
    const level = this.colorize(entry.level, `[${entry.level}]`);
    const category = `${colors.blue}[${entry.category}]${colors.reset}`;
    let message = `${timestamp} ${level} ${category} ${entry.message}`;

    if (entry.data) {
      message += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
    }

    if (entry.error) {
      message += `\n  Error: ${entry.error}`;
    }

    return message;
  }

  private writeToFile(entry: LogEntry): void {
    try {
      const date = new Date(entry.timestamp);
      const filename = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}.log`;
      const filepath = path.join(logDir, filename);

      const logLine = {
        ...entry,
        timestamp: entry.timestamp,
      };

      fs.appendFileSync(filepath, JSON.stringify(logLine) + '\n', 'utf-8');
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  private log(level: LogLevel, levelName: string, message: string, data?: unknown, error?: Error): void {
    if (level < currentLogLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level: levelName,
      category: this.category,
      message,
      data,
      error: error?.stack || error?.message,
    };

    // 输出到控制台
    const formattedMessage = this.formatMessage(entry);
    if (level === LogLevel.ERROR) {
      console.error(formattedMessage);
    } else {
      console.log(formattedMessage);
    }

    // 写入文件
    this.writeToFile(entry);
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, 'DEBUG', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, 'INFO', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, 'WARN', message, data);
  }

  error(message: string, error?: Error, data?: unknown): void {
    this.log(LogLevel.ERROR, 'ERROR', message, data, error);
  }
}

export function createLogger(category: string): Logger {
  return new Logger(category);
}

// 全局单例logger
export const logger = createLogger('App');
