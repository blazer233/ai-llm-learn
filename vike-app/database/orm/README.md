# 自定义 ORM 使用指南

这是一个基于 `mysql2` 实现的轻量级 ORM 系统，提供了类型安全的数据库操作接口。

## 📁 目录结构

```
database/orm/
├── connection.ts       # 数据库连接池管理
├── base-model.ts       # ORM 基础模型类
├── models/
│   └── todo.ts        # Todo 模型
├── index.ts           # 导出入口
└── README.md          # 本文档
```

## 🚀 核心特性

- ✅ **类型安全**：完整的 TypeScript 类型支持
- ✅ **连接池管理**：自动管理数据库连接
- ✅ **链式查询**：支持灵活的查询条件构建
- ✅ **事务支持**：内置事务处理机制
- ✅ **批量操作**：支持批量插入、更新、删除
- ✅ **原生 SQL**：支持执行原生 SQL 查询
- ✅ **轻量级**：零依赖（除 mysql2），代码简洁

## 📖 基本使用

### 1. 数据库连接

连接配置通过环境变量 `DATABASE_URL` 设置：

```env
DATABASE_URL="mysql://username:password@host:port/database"
```

### 2. 定义模型

继承 `BaseModel` 创建自定义模型：

```typescript
import { BaseModel } from '../base-model';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: Date;
}

export class UserModel extends BaseModel<User> {
  protected tableName = 'users';
  protected primaryKey = 'id';

  // 自定义方法
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne([{ field: 'email', operator: '=', value: email }]);
  }
}

export const userModel = new UserModel();
```

### 3. CRUD 操作

#### 查询所有记录

```typescript
const todos = await todoModel.findAll();

// 带条件查询
const completedTodos = await todoModel.findAll({
  where: [{ field: 'completed', operator: '=', value: true }],
  orderBy: [{ field: 'created_at', direction: 'DESC' }],
  limit: 10,
  offset: 0,
});
```

#### 查询单条记录

```typescript
// 根据主键查询
const todo = await todoModel.findById(1);

// 根据条件查询
const todo = await todoModel.findOne([
  { field: 'text', operator: 'LIKE', value: '%重要%' },
]);
```

#### 插入记录

```typescript
// 插入单条
const result = await todoModel.insert({
  text: '完成项目文档',
  completed: false,
});
console.log(result.insertId); // 自增 ID

// 批量插入
const result = await todoModel.insertMany([
  { text: '任务 1', completed: false },
  { text: '任务 2', completed: false },
]);
```

#### 更新记录

```typescript
// 根据主键更新
await todoModel.updateById(1, { completed: true });

// 根据条件更新
await todoModel.update(
  [{ field: 'completed', operator: '=', value: false }],
  { completed: true }
);
```

#### 删除记录

```typescript
// 根据主键删除
await todoModel.deleteById(1);

// 根据条件删除
await todoModel.delete([
  { field: 'completed', operator: '=', value: true },
]);
```

### 4. 高级查询

#### 多条件查询

```typescript
const todos = await todoModel.findAll({
  where: [
    { field: 'completed', operator: '=', value: false },
    { field: 'created_at', operator: '>', value: '2024-01-01' },
  ],
  orderBy: [
    { field: 'created_at', direction: 'DESC' },
    { field: 'id', direction: 'ASC' },
  ],
});
```

#### IN 查询

```typescript
const todos = await todoModel.findAll({
  where: [
    { field: 'id', operator: 'IN', value: [1, 2, 3] },
  ],
});
```

#### 统计和存在性检查

```typescript
// 统计记录数
const count = await todoModel.count();
const completedCount = await todoModel.count([
  { field: 'completed', operator: '=', value: true },
]);

// 检查是否存在
const exists = await todoModel.exists([
  { field: 'text', operator: '=', value: '特定任务' },
]);
```

### 5. 事务操作

```typescript
await todoModel.transaction(async (connection) => {
  // 在事务中执行多个操作
  await connection.execute('UPDATE todos SET completed = ? WHERE id = ?', [true, 1]);
  await connection.execute('INSERT INTO logs (action) VALUES (?)', ['completed_todo']);
  
  // 如果抛出异常，事务会自动回滚
  if (someCondition) {
    throw new Error('Transaction failed');
  }
  
  // 成功则自动提交
});
```

### 6. 原生 SQL

```typescript
// 执行复杂查询
const results = await todoModel.raw<{ total: number }>(
  'SELECT COUNT(*) as total FROM todos WHERE completed = ?',
  [true]
);

console.log(results[0].total);
```

## 🔧 查询条件操作符

| 操作符 | 说明 | 示例 |
|--------|------|------|
| `=` | 等于 | `{ field: 'id', operator: '=', value: 1 }` |
| `!=` | 不等于 | `{ field: 'completed', operator: '!=', value: true }` |
| `>` | 大于 | `{ field: 'id', operator: '>', value: 10 }` |
| `<` | 小于 | `{ field: 'id', operator: '<', value: 100 }` |
| `>=` | 大于等于 | `{ field: 'created_at', operator: '>=', value: date }` |
| `<=` | 小于等于 | `{ field: 'created_at', operator: '<=', value: date }` |
| `LIKE` | 模糊匹配 | `{ field: 'text', operator: 'LIKE', value: '%关键词%' }` |
| `IN` | 在集合中 | `{ field: 'id', operator: 'IN', value: [1,2,3] }` |
| `NOT IN` | 不在集合中 | `{ field: 'status', operator: 'NOT IN', value: ['deleted'] }` |

## 📋 API 参考

### BaseModel 方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `findAll` | `options?` | `Promise<T[]>` | 查询所有记录 |
| `findById` | `id` | `Promise<T \| null>` | 根据主键查询 |
| `findOne` | `where` | `Promise<T \| null>` | 查询单条记录 |
| `insert` | `data` | `Promise<{insertId, affectedRows}>` | 插入单条记录 |
| `insertMany` | `dataArray` | `Promise<{insertId, affectedRows}>` | 批量插入 |
| `update` | `where, data` | `Promise<{affectedRows}>` | 更新记录 |
| `updateById` | `id, data` | `Promise<{affectedRows}>` | 根据主键更新 |
| `delete` | `where` | `Promise<{affectedRows}>` | 删除记录 |
| `deleteById` | `id` | `Promise<{affectedRows}>` | 根据主键删除 |
| `count` | `where?` | `Promise<number>` | 统计记录数 |
| `exists` | `where` | `Promise<boolean>` | 检查是否存在 |
| `raw` | `sql, values?` | `Promise<R[]>` | 执行原生 SQL |
| `transaction` | `callback` | `Promise<R>` | 执行事务 |

## 🔄 迁移指南

### 从 Drizzle ORM 迁移

**之前 (Drizzle):**
```typescript
import { eq } from 'drizzle-orm';
import { db } from './db';
import { todoTable } from './schema';

const todos = await db.select().from(todoTable);
const todo = await db.select().from(todoTable).where(eq(todoTable.id, 1));
await db.insert(todoTable).values({ text: 'New todo' });
await db.update(todoTable).set({ completed: true }).where(eq(todoTable.id, 1));
await db.delete(todoTable).where(eq(todoTable.id, 1));
```

**之后 (自定义 ORM):**
```typescript
import { todoModel } from './database/orm';

const todos = await todoModel.findAll();
const todo = await todoModel.findById(1);
await todoModel.insert({ text: 'New todo' });
await todoModel.updateById(1, { completed: true });
await todoModel.deleteById(1);
```

## 🎯 最佳实践

1. **使用单例模式**：导出模型实例而不是类
   ```typescript
   export const todoModel = new TodoModel();
   ```

2. **自定义业务方法**：在模型中封装常用查询
   ```typescript
   class TodoModel extends BaseModel<TodoItem> {
     async getActiveTodos() {
       return this.findAll({
         where: [{ field: 'completed', operator: '=', value: false }],
       });
     }
   }
   ```

3. **错误处理**：始终使用 try-catch
   ```typescript
   try {
     await todoModel.createTodo('New task');
   } catch (error) {
     logger.error('Failed to create todo', error);
   }
   ```

4. **事务使用**：涉及多表操作时使用事务
   ```typescript
   await todoModel.transaction(async (conn) => {
     await conn.execute('UPDATE table1 SET ...');
     await conn.execute('UPDATE table2 SET ...');
   });
   ```

## 🔍 性能优化建议

- ✅ 使用 `findOne` 而不是 `findAll` + 过滤
- ✅ 合理使用 `limit` 和 `offset` 进行分页
- ✅ 批量操作使用 `insertMany` 而不是循环 `insert`
- ✅ 避免在循环中执行数据库查询
- ✅ 使用索引字段作为查询条件

## 📝 示例：完整的 CRUD 应用

```typescript
import { todoModel } from './database/orm';

// 创建
const newTodo = await todoModel.createTodo('完成文档');

// 读取
const allTodos = await todoModel.getAllTodos();
const pendingTodos = await todoModel.getPendingTodos();

// 更新
await todoModel.toggleTodo(newTodo.id, true);
await todoModel.updateTodoText(newTodo.id, '完成文档（已更新）');

// 删除
await todoModel.deleteTodo(newTodo.id);

// 统计
const total = await todoModel.count();
const completed = await todoModel.countCompleted();
```

## 🆚 与 Drizzle 对比

| 特性 | 自定义 ORM | Drizzle ORM |
|------|-----------|-------------|
| 学习曲线 | ⭐⭐ 简单 | ⭐⭐⭐⭐ 较复杂 |
| 代码量 | ⭐⭐⭐⭐⭐ 极少 | ⭐⭐⭐ 中等 |
| 类型安全 | ⭐⭐⭐⭐ 良好 | ⭐⭐⭐⭐⭐ 优秀 |
| 灵活性 | ⭐⭐⭐⭐⭐ 极高 | ⭐⭐⭐ 中等 |
| 性能 | ⭐⭐⭐⭐ 优秀 | ⭐⭐⭐⭐ 优秀 |
| 包大小 | ⭐⭐⭐⭐⭐ 极小 | ⭐⭐⭐ 中等 |

## 🚀 下一步

1. 替换现有的 Drizzle ORM 代码
2. 测试所有 API 接口
3. 根据需要添加更多模型
4. 考虑添加数据验证层

---

**注意**：这是一个轻量级 ORM 实现，适合中小型项目。对于大型企业级项目，可能需要更完善的功能（如关联查询、数据验证等）。
