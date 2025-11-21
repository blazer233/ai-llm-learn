# 项目部署指南

## 本地开发环境配置

### 前置要求
- Node.js 18+ 
- MySQL 8.0+
- npm 或 yarn

### 第一步：安装 MySQL

#### macOS (使用 Homebrew)
\`\`\`bash
brew install mysql
brew services start mysql
\`\`\`

#### Ubuntu/Debian
\`\`\`bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
\`\`\`

#### Windows
下载并安装 [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)

### 第二步：创建数据库

登录 MySQL：
\`\`\`bash
mysql -u root -p
\`\`\`

创建数据库：
\`\`\`sql
CREATE DATABASE prompt_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'prompt_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON prompt_manager.* TO 'prompt_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
\`\`\`

### 第三步：配置项目

1. **克隆/进入项目目录**
\`\`\`bash
cd /Users/songyanchao/Desktop/thing/zhishi/prompt-manger
\`\`\`

2. **安装依赖**
\`\`\`bash
npm install
\`\`\`

3. **配置环境变量**
\`\`\`bash
cp .env.example .env
\`\`\`

编辑 \`.env\` 文件：
\`\`\`env
# 修改为你的数据库配置
DATABASE_URL="mysql://prompt_user:your_password@localhost:3306/prompt_manager"

# 生成随机密钥（重要！）
JWT_SECRET="请使用随机字符串，例如：abc123xyz456"
NEXTAUTH_SECRET="请使用随机字符串，例如：def789uvw012"
\`\`\`

💡 **生成随机密钥的方法：**
\`\`\`bash
# 方法1：使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 方法2：使用 openssl
openssl rand -hex 32
\`\`\`

4. **初始化数据库**
\`\`\`bash
# 生成 Prisma Client
npx prisma generate

# 创建数据库表
npx prisma db push
\`\`\`

5. **启动开发服务器**
\`\`\`bash
npm run dev
\`\`\`

6. **访问应用**
打开浏览器访问：[http://localhost:3000](http://localhost:3000)

## 常见问题

### 1. 数据库连接失败
**错误信息：** \`Can't reach database server\`

**解决方案：**
- 检查 MySQL 服务是否启动：\`brew services list\` 或 \`sudo systemctl status mysql\`
- 检查 \`.env\` 中的数据库配置是否正确
- 确认数据库用户名和密码是否正确

### 2. Prisma 错误
**错误信息：** \`@prisma/client did not initialize yet\`

**解决方案：**
\`\`\`bash
npx prisma generate
npm run dev
\`\`\`

### 3. 端口占用
**错误信息：** \`Port 3000 is already in use\`

**解决方案：**
\`\`\`bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>

# 或使用其他端口
PORT=3001 npm run dev
\`\`\`

### 4. TDesign 样式问题
如果 TDesign 样式没有正确加载，确保 \`app/globals.css\` 中包含：
\`\`\`css
@import 'tdesign-react/style/index.css';
\`\`\`

## 数据库管理

### 查看数据库
\`\`\`bash
# 使用 Prisma Studio（推荐）
npx prisma studio
\`\`\`

这会在 [http://localhost:5555](http://localhost:5555) 打开数据库管理界面。

### 重置数据库
\`\`\`bash
# 警告：这会删除所有数据！
npx prisma db push --force-reset
\`\`\`

### 数据库迁移
\`\`\`bash
# 创建迁移
npx prisma migrate dev --name <migration_name>

# 应用迁移（生产环境）
npx prisma migrate deploy
\`\`\`

## 生产环境部署

### 环境变量配置
确保生产环境设置了以下环境变量：
- \`DATABASE_URL\` - 生产数据库连接字符串
- \`JWT_SECRET\` - 强随机字符串
- \`NEXTAUTH_SECRET\` - 强随机字符串
- \`NEXTAUTH_URL\` - 生产环境 URL
- \`NODE_ENV=production\`

### 构建和启动
\`\`\`bash
# 构建项目
npm run build

# 启动生产服务器
npm run start
\`\`\`

## AI 模型集成（可选）

### OpenAI
1. 获取 API Key：[https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. 在 \`.env\` 中添加：
   \`\`\`env
   OPENAI_API_KEY="sk-..."
   \`\`\`

### Claude (Anthropic)
1. 获取 API Key：[https://console.anthropic.com/](https://console.anthropic.com/)
2. 在 \`.env\` 中添加：
   \`\`\`env
   CLAUDE_API_KEY="sk-ant-..."
   \`\`\`

### 实现 AI 测试接口
创建 \`app/api/prompts/test/route.ts\` 文件来实现真实的 AI 调用。

参考 README.md 中的示例代码。

## 下一步

1. ✅ 注册一个账号
2. ✅ 创建第一个场景
3. ✅ 添加提示词
4. ✅ 测试提示词
5. 🎉 开始管理你的 AI 提示词库！
