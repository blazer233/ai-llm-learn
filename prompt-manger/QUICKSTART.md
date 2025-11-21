# 🚀 快速启动指南

这是一个 5 分钟快速启动指南，让你快速体验提示词管理平台。

## 📋 前置要求

- ✅ Node.js 18 或更高版本
- ✅ MySQL 8.0 或更高版本
- ✅ npm 或 yarn

## ⚡️ 快速启动（3 步）

### 1️⃣ 配置数据库

创建 MySQL 数据库：

\`\`\`bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE prompt_manager;
EXIT;
\`\`\`

### 2️⃣ 配置项目

\`\`\`bash
# 进入项目目录
cd /Users/songyanchao/Desktop/thing/zhishi/prompt-manger

# 复制环境变量配置
cp .env.example .env

# 编辑 .env 文件，修改数据库连接信息
# DATABASE_URL="mysql://root:你的密码@localhost:3306/prompt_manager"
\`\`\`

### 3️⃣ 一键启动

\`\`\`bash
# 安装依赖 + 生成 Prisma Client + 创建数据库表 + 初始化默认用户
npm run setup

# 启动开发服务器
npm run dev
\`\`\`

## 🎉 完成！

打开浏览器访问：[http://localhost:3000](http://localhost:3000)

### 首次使用流程

1. **进入仪表板**
   - 点击首页的"开始使用"按钮
   - 直接进入提示词管理界面

2. **创建场景**
   - 进入"场景管理"
   - 点击"新建场景"
   - 输入场景名称（如：文案创作、代码辅助、客服对话）
   - 选择一个颜色标签

3. **添加提示词**
   - 进入"提示词库"
   - 点击"新建提示词"
   - 填写标题、内容、选择场景
   - 保存

4. **测试提示词**
   - 点击提示词列表中的"详情"
   - 切换到"测试"标签
   - 输入测试内容
   - 点击"开始测试"查看结果

## 📊 功能概览

| 功能 | 状态 | 说明 |
|------|------|------|
| 场景管理 | ✅ | 创建、编辑、删除 |
| 提示词管理 | ✅ | CRUD、标签、分类 |
| 版本控制 | ✅ | 自动记录历史版本 |
| 测试功能 | 🔶 | UI 完成，需配置 AI API |
| 数据统计 | ✅ | 基础统计功能 |

## 🔧 常用命令

\`\`\`bash
# 开发
npm run dev              # 启动开发服务器

# 数据库
npm run db:studio        # 打开数据库管理界面
npm run db:push          # 同步数据库表结构
npm run db:init          # 初始化默认用户
npm run db:reset         # 重置数据库（⚠️ 会删除所有数据）

# 构建
npm run build            # 构建生产版本
npm run start            # 启动生产服务器
\`\`\`

## 🐛 遇到问题？

### 数据库连接失败
检查 \`.env\` 中的 \`DATABASE_URL\` 是否正确，确保：
- MySQL 服务已启动
- 数据库已创建
- 用户名和密码正确

### 端口被占用
\`\`\`bash
PORT=3001 npm run dev  # 使用其他端口
\`\`\`

### Prisma 错误
\`\`\`bash
npx prisma generate    # 重新生成 Prisma Client
\`\`\`

### 默认用户初始化失败
确保数据库连接正常后，手动运行：
\`\`\`bash
npm run db:init
\`\`\`

## 📚 更多文档

- [完整部署指南](./SETUP.md) - 详细的安装和配置说明
- [README](./README.md) - 项目介绍和功能说明
- [API 文档](./README.md#api-文档) - 后端 API 接口文档

## 🎯 下一步

1. **配置 AI API**（可选）
   - 获取 OpenAI 或 Claude API Key
   - 在 \`.env\` 中配置
   - 实现真实的 AI 调用

2. **自定义功能**
   - 添加更多场景分类
   - 创建提示词模板
   - 导入现有提示词

3. **生产部署**
   - 部署到 Vercel
   - 配置生产数据库
   - 设置域名

## 💡 重要提示

当前版本已移除用户认证系统，所有数据存储在默认用户下。适合个人使用或团队内网部署。

---

**🎊 祝使用愉快！如有问题请查看 [完整文档](./SETUP.md) 或提交 Issue。**
