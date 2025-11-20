import { createLogger } from './logger';
import express from 'express';

const logger = createLogger('HTTP');

// 跳过日志记录的路径前缀
const skipPatterns = ['/@vite', '/@react-refresh', '/__', '/node_modules', '.js.map', '.css.map', '/assets'];

function shouldSkipLogging(pathname: string): boolean {
  return skipPatterns.some((pattern) => pathname.includes(pattern));
}

/**
 * Express 响应日志中间件
 * 仅记录 API 请求和页面请求
 */
export function responseLoggerMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  const startTime = Date.now();
  const { method, url } = req;
  const pathname = new URL(url, `http://${req.hostname}`).pathname;

  // 跳过不需要记录的请求
  if (shouldSkipLogging(pathname)) {
    next();
    return;
  }

  // 拦截原始 res.end 方法
  const originalEnd = res.end.bind(res);
  res.end = function (chunk?: any, encoding?: any, cb?: any) {
    const duration = Date.now() - startTime;

    // 仅记录较慢的请求或错误
    if (duration > 100 || res.statusCode >= 400) {
      logger.info(`${method} ${pathname}`, {
        status: res.statusCode,
        duration: `${duration}ms`,
      });
    }

    return originalEnd(chunk, encoding, cb);
  } as typeof res.end;

  next();
}
