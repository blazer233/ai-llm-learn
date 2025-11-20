/**
 * 轻量级 ORM 入口文件
 */

export { default as DatabaseConnection } from './connection';
export { BaseModel } from './base-model';
export type { WhereCondition, OrderBy } from './base-model';
export { todoModel, TodoModel } from './models/todo';
export type { TodoItem, TodoInsert } from './models/todo';
