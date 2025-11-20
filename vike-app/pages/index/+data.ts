/**
 * 页面数据预取 - 使用自定义 ORM
 * https://vike.dev/data
 */

import type { PageContextServer } from 'vike/types';
import { createLogger } from '../../server/logger';
import type { todoModel } from '../../database/orm';

const logger = createLogger('TodoData');

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(_pageContext: PageContextServer) {
  try {
    const context = _pageContext as any;

    if (!context.todoModel) {
      logger.warn('TodoModel not available in page context');
      return { todoItemsInitial: [] };
    }

    const todoItemsInitial = await context.todoModel.getAllTodos();

    return { todoItemsInitial };
  } catch (error) {
    logger.error('Failed to fetch todos', error as Error);
    return { todoItemsInitial: [] };
  }
}
