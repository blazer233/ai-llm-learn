import DatabaseConnection from './connection';
import type mysql from 'mysql2/promise';

/**
 * 查询条件接口
 */
export interface WhereCondition {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'NOT IN';
  value: any;
}

/**
 * 排序接口
 */
export interface OrderBy {
  field: string;
  direction: 'ASC' | 'DESC';
}

/**
 * ORM 基础模型类
 */
export abstract class BaseModel<T> {
  protected abstract tableName: string;
  protected abstract primaryKey: string;

  /**
   * 构建 WHERE 子句
   */
  protected buildWhere(conditions: WhereCondition[]): { sql: string; values: any[] } {
    if (conditions.length === 0) {
      return { sql: '', values: [] };
    }

    const whereClauses: string[] = [];
    const values: any[] = [];

    conditions.forEach((condition) => {
      if (condition.operator === 'IN' || condition.operator === 'NOT IN') {
        const placeholders = condition.value.map(() => '?').join(', ');
        whereClauses.push(`${condition.field} ${condition.operator} (${placeholders})`);
        values.push(...condition.value);
      } else {
        whereClauses.push(`${condition.field} ${condition.operator} ?`);
        values.push(condition.value);
      }
    });

    return {
      sql: ` WHERE ${whereClauses.join(' AND ')}`,
      values,
    };
  }

  /**
   * 构建 ORDER BY 子句
   */
  protected buildOrderBy(orderBy: OrderBy[]): string {
    if (orderBy.length === 0) {
      return '';
    }

    const orderClauses = orderBy.map((order) => `${order.field} ${order.direction}`);
    return ` ORDER BY ${orderClauses.join(', ')}`;
  }

  /**
   * 查询所有记录
   */
  async findAll(options?: {
    where?: WhereCondition[];
    orderBy?: OrderBy[];
    limit?: number;
    offset?: number;
  }): Promise<T[]> {
    let sql = `SELECT * FROM ${this.tableName}`;
    let values: any[] = [];

    if (options?.where && options.where.length > 0) {
      const where = this.buildWhere(options.where);
      sql += where.sql;
      values = where.values;
    }

    if (options?.orderBy && options.orderBy.length > 0) {
      sql += this.buildOrderBy(options.orderBy);
    }

    if (options?.limit) {
      sql += ` LIMIT ?`;
      values.push(options.limit);
    }

    if (options?.offset) {
      sql += ` OFFSET ?`;
      values.push(options.offset);
    }

    return DatabaseConnection.query<T>(sql, values);
  }

  /**
   * 根据主键查询单条记录
   */
  async findById(id: number | string): Promise<T | null> {
    const sql = `SELECT * FROM ${this.tableName} WHERE ${this.primaryKey} = ?`;
    return DatabaseConnection.queryOne<T>(sql, [id]);
  }

  /**
   * 查询单条记录
   */
  async findOne(where: WhereCondition[]): Promise<T | null> {
    const whereClause = this.buildWhere(where);
    const sql = `SELECT * FROM ${this.tableName}${whereClause.sql} LIMIT 1`;
    return DatabaseConnection.queryOne<T>(sql, whereClause.values);
  }

  /**
   * 插入记录
   */
  async insert(data: Partial<T>): Promise<{ insertId: number; affectedRows: number }> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');

    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
    const result = await DatabaseConnection.execute(sql, values);

    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows,
    };
  }

  /**
   * 批量插入记录
   */
  async insertMany(dataArray: Partial<T>[]): Promise<{ insertId: number; affectedRows: number }> {
    if (dataArray.length === 0) {
      return { insertId: 0, affectedRows: 0 };
    }

    const fields = Object.keys(dataArray[0]);
    const placeholders = fields.map(() => '?').join(', ');
    const valueSets = dataArray.map(() => `(${placeholders})`).join(', ');

    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES ${valueSets}`;
    const values = dataArray.flatMap((data) => Object.values(data));

    const result = await DatabaseConnection.execute(sql, values);

    return {
      insertId: result.insertId,
      affectedRows: result.affectedRows,
    };
  }

  /**
   * 更新记录
   */
  async update(
    where: WhereCondition[],
    data: Partial<T>,
  ): Promise<{ affectedRows: number }> {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClauses = fields.map((field) => `${field} = ?`).join(', ');

    const whereClause = this.buildWhere(where);
    const sql = `UPDATE ${this.tableName} SET ${setClauses}${whereClause.sql}`;

    const result = await DatabaseConnection.execute(sql, [...values, ...whereClause.values]);

    return {
      affectedRows: result.affectedRows,
    };
  }

  /**
   * 根据主键更新记录
   */
  async updateById(id: number | string, data: Partial<T>): Promise<{ affectedRows: number }> {
    return this.update([{ field: this.primaryKey, operator: '=', value: id }], data);
  }

  /**
   * 删除记录
   */
  async delete(where: WhereCondition[]): Promise<{ affectedRows: number }> {
    const whereClause = this.buildWhere(where);
    const sql = `DELETE FROM ${this.tableName}${whereClause.sql}`;

    const result = await DatabaseConnection.execute(sql, whereClause.values);

    return {
      affectedRows: result.affectedRows,
    };
  }

  /**
   * 根据主键删除记录
   */
  async deleteById(id: number | string): Promise<{ affectedRows: number }> {
    return this.delete([{ field: this.primaryKey, operator: '=', value: id }]);
  }

  /**
   * 统计记录数
   */
  async count(where?: WhereCondition[]): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    let values: any[] = [];

    if (where && where.length > 0) {
      const whereClause = this.buildWhere(where);
      sql += whereClause.sql;
      values = whereClause.values;
    }

    const result = await DatabaseConnection.queryOne<{ count: number }>(sql, values);
    return result?.count || 0;
  }

  /**
   * 检查记录是否存在
   */
  async exists(where: WhereCondition[]): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * 执行原生 SQL 查询
   */
  async raw<R = any>(sql: string, values?: any[]): Promise<R[]> {
    return DatabaseConnection.query<R>(sql, values);
  }

  /**
   * 执行事务
   */
  async transaction<R>(
    callback: (connection: mysql.PoolConnection) => Promise<R>,
  ): Promise<R> {
    const connection = await DatabaseConnection.getConnection();

    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
