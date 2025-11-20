import { todoModel } from '../database/orm';
import { enhance, type UniversalMiddleware } from '@universal-middleware/core';

declare global {
  namespace Universal {
    interface Context {
      todoModel: typeof todoModel;
    }
  }
}

/**
 * 数据库中间件 - 注入 ORM 模型到上下文
 */
export const dbMiddleware: UniversalMiddleware = enhance(
  async (_request, context, _runtime) => {
    return {
      ...context,
      todoModel: todoModel,
    };
  },
  {
    name: 'vike-app:db-middleware',
    immutable: false,
  },
);
