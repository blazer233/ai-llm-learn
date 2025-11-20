import type { todoModel } from '../database/orm';
import { enhance, type UniversalHandler } from '@universal-middleware/core';
import { createLogger } from './logger';

const logger = createLogger('TodoAPI');

/**
 * 创建 todo
 */
export const createTodoHandler: UniversalHandler<
  Universal.Context & { todoModel: typeof todoModel }
> = enhance(
  async (request, _context, _runtime) => {
    try {
      const newTodo = (await request.json()) as { text: string };

      if (!newTodo.text || newTodo.text.trim() === '') {
        return new Response(JSON.stringify({ error: 'Todo 文本不能为空' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }

      const result = await _context.todoModel.createTodo(newTodo.text);

      return new Response(JSON.stringify({ status: 'OK', data: result }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      });
    } catch (error) {
      logger.error('Create todo error', error as Error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  },
  { name: 'vike-app:create-todo', path: '/api/todo/create', method: ['POST'], immutable: false },
);

/**
 * 删除 todo
 */
export const deleteTodoHandler: UniversalHandler<
  Universal.Context & { todoModel: typeof todoModel }
> = enhance(
  async (request, _context, _runtime) => {
    try {
      const { id } = (await request.json()) as { id: number };

      if (!id) {
        return new Response(JSON.stringify({ error: 'ID 不能为空' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }

      await _context.todoModel.deleteTodo(id);

      return new Response(JSON.stringify({ status: 'OK' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    } catch (error) {
      logger.error('Delete todo error', error as Error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  },
  { name: 'vike-app:delete-todo', path: '/api/todo/delete', method: ['POST'], immutable: false },
);

/**
 * 切换 todo 完成状态
 */
export const toggleTodoHandler: UniversalHandler<
  Universal.Context & { todoModel: typeof todoModel }
> = enhance(
  async (request, _context, _runtime) => {
    try {
      const { id, completed } = (await request.json()) as { id: number; completed: boolean };

      if (!id) {
        return new Response(JSON.stringify({ error: 'ID 不能为空' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }

      const result = await _context.todoModel.toggleTodo(id, completed);

      return new Response(JSON.stringify({ status: 'OK', data: result }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    } catch (error) {
      logger.error('Toggle todo error', error as Error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  },
  { name: 'vike-app:toggle-todo', path: '/api/todo/toggle', method: ['POST'], immutable: false },
);

/**
 * 更新 todo
 */
export const updateTodoHandler: UniversalHandler<
  Universal.Context & { todoModel: typeof todoModel }
> = enhance(
  async (request, _context, _runtime) => {
    try {
      const { id, text } = (await request.json()) as { id: number; text: string };

      if (!id || !text || text.trim() === '') {
        return new Response(JSON.stringify({ error: 'ID 和文本不能为空' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        });
      }

      const result = await _context.todoModel.updateTodoText(id, text);

      return new Response(JSON.stringify({ status: 'OK', data: result }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    } catch (error) {
      logger.error('Update todo error', error as Error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
  },
  { name: 'vike-app:update-todo', path: '/api/todo/update', method: ['POST'], immutable: false },
);
