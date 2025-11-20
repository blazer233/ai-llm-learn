# ORM 使用示例

本文档提供了自定义 ORM 的实际使用示例。

## 📚 目录

- [基础 CRUD 操作](#基础-crud-操作)
- [高级查询](#高级查询)
- [批量操作](#批量操作)
- [事务处理](#事务处理)
- [自定义模型](#自定义模型)
- [实战案例](#实战案例)

## 基础 CRUD 操作

### 创建记录

```typescript
import { todoModel } from './database/orm';

// 方式 1: 使用自定义方法
const newTodo = await todoModel.createTodo('学习 TypeScript');

// 方式 2: 使用基础方法
const result = await todoModel.insert({
  text: '学习 TypeScript',
  completed: false,
});

console.log('新建 Todo ID:', result.insertId);
```

### 查询记录

```typescript
// 查询所有
const allTodos = await todoModel.findAll();

// 根据 ID 查询
const todo = await todoModel.findById(1);

// 查询单条记录
const firstPending = await todoModel.findOne([
  { field: 'completed', operator: '=', value: false },
]);

// 使用自定义方法
const pendingTodos = await todoModel.getPendingTodos();
const completedTodos = await todoModel.getCompletedTodos();
```

### 更新记录

```typescript
// 根据 ID 更新
await todoModel.updateById(1, {
  text: '学习 TypeScript（已更新）',
  completed: true,
});

// 使用自定义方法
await todoModel.toggleTodo(1, true);
await todoModel.updateTodoText(1, '新的文本');

// 批量更新
await todoModel.update(
  [{ field: 'completed', operator: '=', value: false }],
  { completed: true }
);
```

### 删除记录

```typescript
// 根据 ID 删除
await todoModel.deleteById(1);

// 使用自定义方法
await todoModel.deleteTodo(1);

// 条件删除
await todoModel.delete([
  { field: 'completed', operator: '=', value: true },
  { field: 'created_at', operator: '<', value: '2024-01-01' },
]);
```

## 高级查询

### 条件查询

```typescript
// 单条件
const results = await todoModel.findAll({
  where: [{ field: 'completed', operator: '=', value: true }],
});

// 多条件（AND）
const results = await todoModel.findAll({
  where: [
    { field: 'completed', operator: '=', value: false },
    { field: 'text', operator: 'LIKE', value: '%重要%' },
  ],
});

// 日期范围查询
const results = await todoModel.findAll({
  where: [
    { field: 'created_at', operator: '>=', value: '2024-01-01' },
    { field: 'created_at', operator: '<=', value: '2024-12-31' },
  ],
});
```

### IN 查询

```typescript
// IN 操作符
const results = await todoModel.findAll({
  where: [{ field: 'id', operator: 'IN', value: [1, 2, 3, 4, 5] }],
});

// NOT IN 操作符
const results = await todoModel.findAll({
  where: [{ field: 'id', operator: 'NOT IN', value: [1, 2, 3] }],
});
```

### 排序和分页

```typescript
// 单字段排序
const results = await todoModel.findAll({
  orderBy: [{ field: 'created_at', direction: 'DESC' }],
});

// 多字段排序
const results = await todoModel.findAll({
  orderBy: [
    { field: 'completed', direction: 'ASC' },
    { field: 'created_at', direction: 'DESC' },
  ],
});

// 分页
const page = 1;
const pageSize = 10;
const results = await todoModel.findAll({
  limit: pageSize,
  offset: (page - 1) * pageSize,
  orderBy: [{ field: 'id', direction: 'DESC' }],
});
```

### 模糊搜索

```typescript
// LIKE 查询
const results = await todoModel.findAll({
  where: [{ field: 'text', operator: 'LIKE', value: '%关键词%' }],
});

// 前缀匹配
const results = await todoModel.findAll({
  where: [{ field: 'text', operator: 'LIKE', value: '前缀%' }],
});

// 后缀匹配
const results = await todoModel.findAll({
  where: [{ field: 'text', operator: 'LIKE', value: '%后缀' }],
});
```

## 批量操作

### 批量插入

```typescript
const todos = [
  { text: '任务 1', completed: false },
  { text: '任务 2', completed: false },
  { text: '任务 3', completed: false },
];

const result = await todoModel.insertMany(todos);
console.log('插入了', result.affectedRows, '条记录');
console.log('首条 ID:', result.insertId);
```

### 批量更新

```typescript
// 将所有未完成的标记为已完成
const result = await todoModel.update(
  [{ field: 'completed', operator: '=', value: false }],
  { completed: true }
);

console.log('更新了', result.affectedRows, '条记录');
```

### 批量删除

```typescript
// 删除所有已完成的
const result = await todoModel.delete([
  { field: 'completed', operator: '=', value: true },
]);

console.log('删除了', result.affectedRows, '条记录');
```

## 事务处理

### 基础事务

```typescript
try {
  await todoModel.transaction(async (connection) => {
    // 在事务中执行多个操作
    await connection.execute(
      'INSERT INTO todos (text, completed) VALUES (?, ?)',
      ['事务任务 1', false]
    );

    await connection.execute(
      'INSERT INTO todos (text, completed) VALUES (?, ?)',
      ['事务任务 2', false]
    );

    // 所有操作成功则提交
  });

  console.log('事务提交成功');
} catch (error) {
  console.error('事务回滚:', error);
}
```

### 复杂事务

```typescript
await todoModel.transaction(async (connection) => {
  // 1. 创建新 todo
  const [result] = await connection.execute(
    'INSERT INTO todos (text, completed) VALUES (?, ?)',
    ['重要任务', false]
  );

  const todoId = (result as any).insertId;

  // 2. 记录日志
  await connection.execute(
    'INSERT INTO logs (action, todo_id, created_at) VALUES (?, ?, NOW())',
    ['create_todo', todoId]
  );

  // 3. 更新统计
  await connection.execute(
    'UPDATE statistics SET total_todos = total_todos + 1'
  );

  // 如果任何操作失败，自动回滚
});
```

## 自定义模型

### 创建新模型

```typescript
import { BaseModel } from './base-model';

// 定义数据类型
export interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  created_at: Date;
  updated_at: Date;
}

// 创建模型类
export class UserModel extends BaseModel<User> {
  protected tableName = 'users';
  protected primaryKey = 'id';

  // 自定义方法：根据邮箱查找用户
  async findByEmail(email: string): Promise<User | null> {
    return this.findOne([{ field: 'email', operator: '=', value: email }]);
  }

  // 自定义方法：查找成年用户
  async findAdults(): Promise<User[]> {
    return this.findAll({
      where: [{ field: 'age', operator: '>=', value: 18 }],
      orderBy: [{ field: 'created_at', direction: 'DESC' }],
    });
  }

  // 自定义方法：检查邮箱是否已存在
  async emailExists(email: string): Promise<boolean> {
    return this.exists([{ field: 'email', operator: '=', value: email }]);
  }

  // 自定义方法：获取用户统计
  async getStatistics() {
    const [stats] = await this.raw<{ total: number; avgAge: number }>(
      'SELECT COUNT(*) as total, AVG(age) as avgAge FROM users'
    );
    return stats;
  }
}

// 导出单例
export const userModel = new UserModel();
```

### 使用自定义模型

```typescript
import { userModel } from './database/orm/models/user';

// 查找用户
const user = await userModel.findByEmail('test@example.com');

// 检查邮箱
const exists = await userModel.emailExists('test@example.com');

// 查找成年用户
const adults = await userModel.findAdults();

// 获取统计
const stats = await userModel.getStatistics();
console.log('总用户数:', stats.total);
console.log('平均年龄:', stats.avgAge);
```

## 实战案例

### 案例 1: 待办事项应用

```typescript
import { todoModel } from './database/orm';

class TodoService {
  // 获取今日任务
  async getTodayTodos() {
    const today = new Date().toISOString().split('T')[0];
    return todoModel.findAll({
      where: [
        { field: 'created_at', operator: '>=', value: `${today} 00:00:00` },
        { field: 'created_at', operator: '<=', value: `${today} 23:59:59` },
      ],
      orderBy: [{ field: 'created_at', direction: 'DESC' }],
    });
  }

  // 获取任务统计
  async getStatistics() {
    const total = await todoModel.count();
    const completed = await todoModel.countCompleted();
    const pending = await todoModel.countPending();

    return {
      total,
      completed,
      pending,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  // 批量完成任务
  async completeAll(ids: number[]) {
    return todoModel.update(
      [{ field: 'id', operator: 'IN', value: ids }],
      { completed: true }
    );
  }

  // 清理已完成的旧任务
  async cleanupOldCompleted(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return todoModel.delete([
      { field: 'completed', operator: '=', value: true },
      { field: 'created_at', operator: '<', value: cutoffDate.toISOString() },
    ]);
  }
}

// 使用
const service = new TodoService();
const todayTodos = await service.getTodayTodos();
const stats = await service.getStatistics();
await service.completeAll([1, 2, 3]);
await service.cleanupOldCompleted(30);
```

### 案例 2: 用户管理

```typescript
import { userModel } from './database/orm/models/user';

class UserService {
  // 注册新用户
  async register(data: { name: string; email: string; age: number }) {
    // 检查邮箱是否已存在
    const exists = await userModel.emailExists(data.email);
    if (exists) {
      throw new Error('邮箱已被注册');
    }

    // 创建用户
    const result = await userModel.insert(data);
    return userModel.findById(result.insertId);
  }

  // 更新用户信息
  async updateProfile(userId: number, data: Partial<User>) {
    // 如果更新邮箱，检查是否已被使用
    if (data.email) {
      const user = await userModel.findOne([
        { field: 'email', operator: '=', value: data.email },
        { field: 'id', operator: '!=', value: userId },
      ]);

      if (user) {
        throw new Error('邮箱已被其他用户使用');
      }
    }

    await userModel.updateById(userId, data);
    return userModel.findById(userId);
  }

  // 获取用户列表（分页）
  async getUserList(page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;
    const users = await userModel.findAll({
      limit: pageSize,
      offset,
      orderBy: [{ field: 'created_at', direction: 'DESC' }],
    });

    const total = await userModel.count();

    return {
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // 搜索用户
  async searchUsers(keyword: string) {
    return userModel.findAll({
      where: [
        { field: 'name', operator: 'LIKE', value: `%${keyword}%` },
      ],
      orderBy: [{ field: 'name', direction: 'ASC' }],
    });
  }
}

// 使用
const service = new UserService();
const newUser = await service.register({
  name: 'John',
  email: 'john@example.com',
  age: 25,
});

const userList = await service.getUserList(1, 20);
const searchResults = await service.searchUsers('John');
```

### 案例 3: 数据迁移

```typescript
import { todoModel } from './database/orm';

class MigrationService {
  // 从旧格式迁移到新格式
  async migrateOldTodos() {
    return todoModel.transaction(async (connection) => {
      // 1. 查询旧数据
      const [oldTodos] = await connection.execute(
        'SELECT * FROM old_todos'
      );

      // 2. 转换并插入新表
      for (const oldTodo of oldTodos as any[]) {
        await connection.execute(
          'INSERT INTO todos (text, completed, created_at) VALUES (?, ?, ?)',
          [oldTodo.title, oldTodo.done, oldTodo.date]
        );
      }

      // 3. 备份旧表
      await connection.execute(
        'RENAME TABLE old_todos TO old_todos_backup'
      );

      console.log(`迁移了 ${(oldTodos as any[]).length} 条记录`);
    });
  }

  // 数据清理
  async cleanup() {
    // 删除重复数据
    await todoModel.raw(
      `DELETE t1 FROM todos t1
       INNER JOIN todos t2 
       WHERE t1.id > t2.id 
       AND t1.text = t2.text`
    );

    // 删除空记录
    await todoModel.delete([
      { field: 'text', operator: '=', value: '' },
    ]);
  }
}
```

## 🔧 性能优化技巧

### 1. 使用索引字段查询

```typescript
// ✅ 好 - 使用主键
const todo = await todoModel.findById(1);

// ❌ 差 - 不使用索引
const todo = await todoModel.findOne([
  { field: 'text', operator: 'LIKE', value: '%查找%' },
]);
```

### 2. 批量操作

```typescript
// ✅ 好 - 批量插入
await todoModel.insertMany(todos);

// ❌ 差 - 循环插入
for (const todo of todos) {
  await todoModel.insert(todo);
}
```

### 3. 使用限制

```typescript
// ✅ 好 - 限制结果数量
const recentTodos = await todoModel.findAll({
  limit: 10,
  orderBy: [{ field: 'created_at', direction: 'DESC' }],
});

// ❌ 差 - 查询全部再截取
const allTodos = await todoModel.findAll();
const recentTodos = allTodos.slice(0, 10);
```

### 4. 避免 N+1 查询

```typescript
// ✅ 好 - 使用 IN 查询
const userIds = todos.map(t => t.user_id);
const users = await userModel.findAll({
  where: [{ field: 'id', operator: 'IN', value: userIds }],
});

// ❌ 差 - 循环查询
for (const todo of todos) {
  const user = await userModel.findById(todo.user_id);
}
```

---

更多示例请参考 [README.md](README.md)
