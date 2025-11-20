/**
 * Express 服务器入口 - 使用自定义 ORM
 */

import 'dotenv/config';
import { dbMiddleware } from './db-middleware';
import { responseLoggerMiddleware } from './response-logger-middleware';
import { clientLogsHandler } from './client-logs-handler';
import {
  createTodoHandler,
  deleteTodoHandler,
  toggleTodoHandler,
  updateTodoHandler,
} from './create-todo-handler';
import { apply, serve } from '@photonjs/express';
import express from 'express';
import { logger } from './logger';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export default startServer();

function startServer() {
  const app = express();

  logger.info(`Starting server on port ${port}`);

  // Express 原生中间件 - 响应日志
  app.use(responseLoggerMiddleware);

  apply(app, [
    // 注入 TodoModel 到 Context
    dbMiddleware,

    // 前端日志接收
    clientLogsHandler,

    // Todo API handlers
    createTodoHandler,
    deleteTodoHandler,
    toggleTodoHandler,
    updateTodoHandler,
  ]);

  return serve(app, {
    port,
  });
}
