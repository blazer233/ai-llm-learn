import mysql from 'mysql2/promise';

/**
 * 数据库连接池单例
 */
class DatabaseConnection {
  private static pool: mysql.Pool | null = null;

  /**
   * 获取数据库连接池
   */
  static getPool(): mysql.Pool {
    if (!this.pool) {
      this.pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      });
    }
    return this.pool;
  }

  /**
   * 获取单个连接
   */
  static async getConnection(): Promise<mysql.PoolConnection> {
    return this.getPool().getConnection();
  }

  /**
   * 执行查询
   */
  static async query<T = any>(sql: string, values?: any[]): Promise<T[]> {
    const pool = this.getPool();
    const [rows] = await pool.execute(sql, values);
    return rows as T[];
  }

  /**
   * 执行单条查询
   */
  static async queryOne<T = any>(sql: string, values?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, values);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * 执行插入/更新/删除操作
   */
  static async execute(sql: string, values?: any[]): Promise<mysql.ResultSetHeader> {
    const pool = this.getPool();
    const [result] = await pool.execute(sql, values);
    return result as mysql.ResultSetHeader;
  }

  /**
   * 关闭连接池
   */
  static async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

export default DatabaseConnection;
