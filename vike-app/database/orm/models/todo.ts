import { BaseModel } from '../base-model';

/**
 * Todo 数据类型
 */
export interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Todo 插入数据类型
 */
export interface TodoInsert {
  text: string;
  completed?: boolean;
}

/**
 * Todo 模型类
 */
export class TodoModel extends BaseModel<TodoItem> {
  protected tableName = 'todos';
  protected primaryKey = 'id';

  /**
   * 获取所有 todos，按创建时间排序
   */
  async getAllTodos(): Promise<TodoItem[]> {
    return this.findAll({
      orderBy: [{ field: 'created_at', direction: 'ASC' }],
    });
  }

  /**
   * 创建新的 todo
   */
  async createTodo(text: string): Promise<TodoItem> {
    const result = await this.insert({
      text,
      completed: false,
    });

    // 获取刚插入的记录
    const todo = await this.findById(result.insertId);
    if (!todo) {
      throw new Error('Failed to create todo');
    }

    return todo;
  }

  /**
   * 删除 todo
   */
  async deleteTodo(id: number): Promise<void> {
    await this.deleteById(id);
  }

  /**
   * 切换 todo 完成状态
   */
  async toggleTodo(id: number, completed: boolean): Promise<TodoItem> {
    await this.updateById(id, { completed });

    const todo = await this.findById(id);
    if (!todo) {
      throw new Error('Todo not found');
    }

    return todo;
  }

  /**
   * 更新 todo 文本
   */
  async updateTodoText(id: number, text: string): Promise<TodoItem> {
    await this.updateById(id, { text });

    const todo = await this.findById(id);
    if (!todo) {
      throw new Error('Todo not found');
    }

    return todo;
  }

  /**
   * 获取已完成的 todos
   */
  async getCompletedTodos(): Promise<TodoItem[]> {
    return this.findAll({
      where: [{ field: 'completed', operator: '=', value: true }],
      orderBy: [{ field: 'created_at', direction: 'ASC' }],
    });
  }

  /**
   * 获取未完成的 todos
   */
  async getPendingTodos(): Promise<TodoItem[]> {
    return this.findAll({
      where: [{ field: 'completed', operator: '=', value: false }],
      orderBy: [{ field: 'created_at', direction: 'ASC' }],
    });
  }

  /**
   * 统计已完成的 todos
   */
  async countCompleted(): Promise<number> {
    return this.count([{ field: 'completed', operator: '=', value: true }]);
  }

  /**
   * 统计未完成的 todos
   */
  async countPending(): Promise<number> {
    return this.count([{ field: 'completed', operator: '=', value: false }]);
  }
}

// 导出单例实例
export const todoModel = new TodoModel();
