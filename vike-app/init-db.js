import 'dotenv/config';
import mysql from 'mysql2/promise';

async function initDatabase() {
  // 从 .env 中读取数据库连接信息
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL not found in .env file');
    process.exit(1);
  }

  try {
    // 解析 MySQL 连接字符串
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const user = url.username;
    const password = url.password;
    const port = url.port ? parseInt(url.port, 10) : 3306;
    const database = url.pathname.substring(1); // 移除前导 /

    // 创建无数据库的连接（用于创建数据库）
    const connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
    });

    try {
      await connection.query(`CREATE DATABASE IF NOT EXISTS ${database};`);
      console.log(`✅ Database ${database} created successfully!`);
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    process.exit(1);
  }
}

initDatabase();
