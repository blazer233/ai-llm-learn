/**
 * API 服务层 - 统一管理所有后端接口调用
 */

import type { TodoItem, TodoInsert } from '../database/orm';

/**
 * API 响应类型
 */
interface ApiResponse<T = any> {
  status: string;
  data?: T;
  error?: string;
}

/**
 * HTTP 请求基础配置
 */
const API_CONFIG = {
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * 通用请求方法
 */
async function request<T>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...API_CONFIG.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error [${url}]:`, error);
    throw error;
  }
}

/**
 * POST 请求封装
 */
async function post<T>(url: string, body?: any): Promise<ApiResponse<T>> {
  return request<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * GET 请求封装
 */
async function get<T>(url: string): Promise<ApiResponse<T>> {
  return request<T>(url, {
    method: 'GET',
  });
}

// ==================== Todo API ====================

/**
 * Todo API 接口集合
 */
export const todoApi = {
  /**
   * 创建新的待办事项
   * @param text 待办事项文本
   * @returns 创建的待办事项
   */
  create: async (text: string): Promise<TodoItem> => {
    const response = await post<TodoItem>('/api/todo/create', { text });
    if (!response.data) {
      throw new Error('创建失败');
    }
    return response.data;
  },

  /**
   * 删除待办事项
   * @param id 待办事项 ID
   */
  delete: async (id: number): Promise<void> => {
    await post('/api/todo/delete', { id });
  },

  /**
   * 切换待办事项完成状态
   * @param id 待办事项 ID
   * @param completed 完成状态
   * @returns 更新后的待办事项
   */
  toggle: async (id: number, completed: boolean): Promise<TodoItem> => {
    const response = await post<TodoItem>('/api/todo/toggle', { id, completed });
    if (!response.data) {
      throw new Error('更新失败');
    }
    return response.data;
  },

  /**
   * 更新待办事项文本
   * @param id 待办事项 ID
   * @param text 新的文本内容
   * @returns 更新后的待办事项
   */
  update: async (id: number, text: string): Promise<TodoItem> => {
    const response = await post<TodoItem>('/api/todo/update', { id, text });
    if (!response.data) {
      throw new Error('更新失败');
    }
    return response.data;
  },

  /**
   * 批量删除待办事项
   * @param ids 待办事项 ID 数组
   */
  batchDelete: async (ids: number[]): Promise<void> => {
    await Promise.all(ids.map((id) => todoApi.delete(id)));
  },

  /**
   * 获取所有待办事项（如果后续需要客户端获取）
   */
  getAll: async (): Promise<TodoItem[]> => {
    const response = await get<TodoItem[]>('/api/todos');
    return response.data || [];
  },
};

// ==================== 用户 API（示例，可扩展）====================

/**
 * 用户 API 接口集合
 */
export const userApi = {
  /**
   * 获取当前用户信息
   */
  getCurrentUser: async () => {
    return get('/api/user/current');
  },

  /**
   * 更新用户信息
   */
  updateProfile: async (data: any) => {
    return post('/api/user/profile', data);
  },
};

// ==================== 导出所有 API ====================

/**
 * 统一的 API 对象
 */
export const api = {
  todo: todoApi,
  user: userApi,
};

export default api;
