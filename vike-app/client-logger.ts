/**
 * 前端日志系统
 * 用于捕获客户端日志和错误，发送到服务器
 */

export enum ClientLogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface ClientLogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: unknown;
  url: string;
  userAgent: string;
}

const logLevelEnv = (typeof window !== 'undefined' && (window as any).__LOG_LEVEL) || 'INFO';
const currentLogLevel = ClientLogLevel[logLevelEnv as keyof typeof ClientLogLevel] ?? ClientLogLevel.INFO;

class ClientLogger {
  private category: string;
  private isDev: boolean;

  constructor(category: string) {
    this.category = category;
    this.isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatConsoleMessage(level: string, message: string): string {
    return `[${level}] [${this.category}] ${message}`;
  }

  private createLogEntry(level: string, message: string, data?: unknown): ClientLogEntry {
    return {
      timestamp: this.getTimestamp(),
      level,
      message,
      data,
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
  }

  private async sendToServer(entry: ClientLogEntry): Promise<void> {
    // 仅在生产环境发送错误日志到服务器
    if (!this.isDev && entry.level === 'ERROR') {
      try {
        await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        }).catch(() => {
          // 无声失败，不干扰应用
        });
      } catch {
        // 忽略发送失败
      }
    }
  }

  private log(level: ClientLogLevel, levelName: string, message: string, data?: unknown): void {
    if (level < currentLogLevel) {
      return;
    }

    const entry = this.createLogEntry(levelName, message, data);
    const consoleMessage = this.formatConsoleMessage(levelName, message);

    // 输出到浏览器控制台
    if (level === ClientLogLevel.ERROR) {
      console.error(consoleMessage, data);
    } else if (level === ClientLogLevel.WARN) {
      console.warn(consoleMessage, data);
    } else {
      console.log(consoleMessage, data);
    }

    // 发送到服务器
    this.sendToServer(entry);
  }

  debug(message: string, data?: unknown): void {
    this.log(ClientLogLevel.DEBUG, 'DEBUG', message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(ClientLogLevel.INFO, 'INFO', message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(ClientLogLevel.WARN, 'WARN', message, data);
  }

  error(message: string, error?: Error, data?: unknown): void {
    this.log(ClientLogLevel.ERROR, 'ERROR', message, {
      ...data,
      error: error?.stack || error?.message,
    });
  }
}

// 全局单例
export const clientLogger = new ClientLogger('Client');

// 捕获全局错误
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    clientLogger.error('Uncaught Error', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    clientLogger.error('Unhandled Promise Rejection', new Error(String(event.reason)), {
      reason: event.reason,
    });
  });
}

export function createClientLogger(category: string): ClientLogger {
  return new ClientLogger(category);
}
